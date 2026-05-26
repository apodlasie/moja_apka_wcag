const TASKS_KEY = "accessiblePlannerTasks";
const SETTINGS_KEY = "accessiblePlannerSettings";

let tasks = [];
let currentFilter = "all";

const taskForm = document.getElementById("taskForm");
const tasksList = document.getElementById("tasksList");
const formMessage = document.getElementById("formMessage");
const saveTaskButton = document.getElementById("saveTaskButton");

const contrastToggle = document.getElementById("contrastToggle");
const fontToggle = document.getElementById("fontToggle");
const spacingToggle = document.getElementById("spacingToggle");
const simpleToggle = document.getElementById("simpleToggle");

const filterButtons = document.querySelectorAll("[data-filter]");

const tabButtons = document.querySelectorAll("[data-tab]");
const tabPanels = document.querySelectorAll(".tab-panel");

const planDate = document.getElementById("planDate");
const todayPlanButton = document.getElementById("todayPlanButton");

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadSettings();
  setDefaultPlanDate();
  setDefaultDate();
  addEventListeners();
  updateFilterButtons();
  renderTasks();
});

function addEventListeners() {
  taskForm.addEventListener("submit", handleTaskFormSubmit);

  contrastToggle.addEventListener("click", () => {
    document.body.classList.toggle("high-contrast");
    saveSettings();
    updateAccessibilityButtons();
  });

  fontToggle.addEventListener("click", () => {
    document.body.classList.toggle("large-text");
    saveSettings();
    updateAccessibilityButtons();
  });

  spacingToggle.addEventListener("click", () => {
    document.body.classList.toggle("increased-spacing");
    saveSettings();
    updateAccessibilityButtons();
  });

  simpleToggle.addEventListener("click", () => {
    document.body.classList.toggle("simple-view");
    saveSettings();
    updateAccessibilityButtons();
    });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      updateFilterButtons();
      renderTasks();
    });
    });

    tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showTab(button.dataset.tab);
    });
    });

planDate.addEventListener("change", () => {
    renderTasks();
    });

todayPlanButton.addEventListener("click", () => {
    setDefaultPlanDate();
    renderTasks();
    });
}

function handleTaskFormSubmit(event) {
  event.preventDefault();

  const taskId = document.getElementById("taskId").value;
  const title = document.getElementById("taskTitle").value.trim();
  const date = document.getElementById("taskDate").value;
  const time = document.getElementById("taskTime").value;
  const category = document.getElementById("taskCategory").value;
  const priority = document.getElementById("taskPriority").value;
  const note = document.getElementById("taskNote").value.trim();

  if (!title || !date || !time) {
    showMessage("Uzupełnij nazwę zadania, datę i godzinę.");
    return;
  }

  if (taskId) {
    updateTask({
      id: Number(taskId),
      title,
      date,
      time,
      category,
      priority,
      note
    });

    showMessage("Zadanie zostało zaktualizowane.");
  } else {
    const newTask = {
      id: Date.now(),
      title,
      date,
      time,
      category,
      priority,
      note,
      completed: false
    };

    tasks.push(newTask);
    showMessage("Zadanie zostało dodane.");
  }

saveTasks();

if (planDate) {
  planDate.value = date;
}

renderTasks();
resetForm();
showTab("day-plan-view");
}

function loadTasks() {
  const savedTasks = localStorage.getItem(TASKS_KEY);

  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  } else {
    tasks = [];
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function updateTask(updatedTask) {
  tasks = tasks.map((task) => {
    if (task.id === updatedTask.id) {
      return {
        ...task,
        title: updatedTask.title,
        date: updatedTask.date,
        time: updatedTask.time,
        category: updatedTask.category,
        priority: updatedTask.priority,
        note: updatedTask.note
      };
    }

    return task;
  });
}

function deleteTask(id) {
  const confirmed = confirm("Czy na pewno chcesz usunąć to zadanie?");

  if (!confirmed) {
    return;
  }

  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
  showMessage("Zadanie zostało usunięte.");
}

function toggleTaskStatus(id) {
  tasks = tasks.map((task) => {
    if (task.id === id) {
      return {
        ...task,
        completed: !task.completed
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

function prepareEditTask(id) {
  const task = tasks.find((task) => task.id === id);

  if (!task) {
    return;
  }

  document.getElementById("taskId").value = task.id;
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDate").value = task.date;
  document.getElementById("taskTime").value = task.time;
  document.getElementById("taskCategory").value = task.category;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskNote").value = task.note;

  saveTaskButton.textContent = "Zapisz zmiany";

  document.getElementById("taskTitle").focus();
  document.querySelector(".task-form-section").scrollIntoView({
    behavior: "smooth"
  });
}

function renderTasks() {
  tasksList.innerHTML = "";

  let visibleTasks = [...tasks];

  const selectedPlanDate = planDate.value;

  if (selectedPlanDate) {
  visibleTasks = visibleTasks.filter((task) => task.date === selectedPlanDate);
    }

  if (currentFilter === "active") {
    visibleTasks = visibleTasks.filter((task) => !task.completed);
  }

  if (currentFilter === "completed") {
    visibleTasks = visibleTasks.filter((task) => task.completed);
  }

  visibleTasks.sort((a, b) => {
    const firstDate = `${a.date} ${a.time}`;
    const secondDate = `${b.date} ${b.time}`;
    return firstDate.localeCompare(secondDate);
  });

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Brak zadań do wyświetlenia.";
    tasksList.appendChild(emptyMessage);
    return;
  }

  const dayParts = [
    {
      key: "morning",
      title: "Rano",
      description: "od 06:00 do 11:59"
    },
    {
      key: "noon",
      title: "Południe",
      description: "od 12:00 do 14:59"
    },
    {
      key: "afternoon",
      title: "Popołudnie",
      description: "od 15:00 do 18:59"
    },
    {
      key: "evening",
      title: "Wieczór",
      description: "od 19:00 do 23:59"
    },
    {
      key: "night",
      title: "Noc",
      description: "od 00:00 do 05:59"
    }
  ];

  dayParts.forEach((part) => {
    const tasksInPart = visibleTasks.filter((task) => {
      return getDayPartKey(task.time) === part.key;
    });

    if (tasksInPart.length === 0) {
      return;
    }

    const dayPartElement = document.createElement("article");
    dayPartElement.classList.add("day-part");

    const dayPartTitle = document.createElement("h3");
    dayPartTitle.classList.add("day-part-title");
    dayPartTitle.textContent = part.title;

    const dayPartDescription = document.createElement("p");
    dayPartDescription.classList.add("day-part-description");
    dayPartDescription.textContent = part.description;

    dayPartElement.appendChild(dayPartTitle);
    dayPartElement.appendChild(dayPartDescription);

    tasksInPart.forEach((task) => {
      const taskCard = createTaskCard(task);
      dayPartElement.appendChild(taskCard);
    });

    tasksList.appendChild(dayPartElement);
  });
}

function getDayPartKey(time) {
  const hour = Number(time.split(":")[0]);

  if (hour >= 6 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 15) {
    return "noon";
  }

  if (hour >= 15 && hour < 19) {
    return "afternoon";
  }

  if (hour >= 19 && hour <= 23) {
    return "evening";
  }

  return "night";
}

function createTaskCard(task) {
  const taskCard = document.createElement("article");
  taskCard.classList.add("task-card");

  if (task.completed) {
    taskCard.classList.add("completed");
  }

  const title = document.createElement("h4");
  title.textContent = `${task.time} - ${task.title}`;

  const date = createTaskDetail("Data", task.date, true);
  const category = createTaskDetail("Kategoria", getCategoryName(task.category), true);
  const priority = createTaskDetail("Priorytet", getPriorityName(task.priority), true);

  const status = createTaskDetail(
    "Status",
    task.completed ? "Wykonane" : "Niewykonane",
    false
  );

  const note = createTaskDetail("Notatka", task.note || "Brak notatki", true);

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const statusButton = document.createElement("button");
  statusButton.type = "button";
  statusButton.textContent = task.completed
    ? "Oznacz jako niewykonane"
    : "Oznacz jako wykonane";
  statusButton.addEventListener("click", () => toggleTaskStatus(task.id));

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edytuj";
  editButton.addEventListener("click", () => prepareEditTask(task.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Usuń";
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  actions.appendChild(statusButton);
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  taskCard.appendChild(title);
  taskCard.appendChild(date);
  taskCard.appendChild(category);
  taskCard.appendChild(priority);
  taskCard.appendChild(status);
  taskCard.appendChild(note);
  taskCard.appendChild(actions);

  return taskCard;
}

function createTaskDetail(label, value, optional = false) {
  const paragraph = document.createElement("p");

  if (optional) {
    paragraph.classList.add("optional-detail");
  }

  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;

  paragraph.appendChild(strong);
  paragraph.appendChild(document.createTextNode(value));

  return paragraph;
}

function getCategoryName(category) {
  const categories = {
    dom: "Dom",
    zdrowie: "Zdrowie",
    praca: "Praca",
    nauka: "Nauka",
    inne: "Inne"
  };

  return categories[category] || category;
}

function getPriorityName(priority) {
  const priorities = {
    niski: "Niski",
    sredni: "Średni",
    wysoki: "Wysoki"
  };

  return priorities[priority] || priority;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    if (button.dataset.filter === currentFilter) {
      button.classList.add("active-filter");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.classList.remove("active-filter");
      button.setAttribute("aria-pressed", "false");
    }
  });
}

function saveSettings() {
  const settings = {
    highContrast: document.body.classList.contains("high-contrast"),
    largeText: document.body.classList.contains("large-text"),
    increasedSpacing: document.body.classList.contains("increased-spacing"),
    simpleView: document.body.classList.contains("simple-view")
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);

  if (!savedSettings) {
    updateAccessibilityButtons();
    return;
  }

  const settings = JSON.parse(savedSettings);

  if (settings.highContrast) {
    document.body.classList.add("high-contrast");
  }

  if (settings.largeText) {
    document.body.classList.add("large-text");
  }

  if (settings.increasedSpacing) {
    document.body.classList.add("increased-spacing");
  }

  if (settings.simpleView) {
    document.body.classList.add("simple-view");
    }

  updateAccessibilityButtons();
}

function updateAccessibilityButtons() {
  const highContrastEnabled = document.body.classList.contains("high-contrast");
  const largeTextEnabled = document.body.classList.contains("large-text");
  const spacingEnabled = document.body.classList.contains("increased-spacing");
  const simpleViewEnabled = document.body.classList.contains("simple-view");

  contrastToggle.setAttribute("aria-pressed", highContrastEnabled.toString());
  fontToggle.setAttribute("aria-pressed", largeTextEnabled.toString());
  spacingToggle.setAttribute("aria-pressed", spacingEnabled.toString());
  simpleToggle.setAttribute("aria-pressed", simpleViewEnabled.toString());

  contrastToggle.textContent = highContrastEnabled
    ? "Wyłącz wysoki kontrast"
    : "Włącz wysoki kontrast";

  fontToggle.textContent = largeTextEnabled
    ? "Wyłącz dużą czcionkę"
    : "Włącz dużą czcionkę";

  spacingToggle.textContent = spacingEnabled
    ? "Wyłącz większe odstępy"
    : "Włącz większe odstępy";

  simpleToggle.textContent = simpleViewEnabled
    ? "Wyłącz tryb uproszczony"
    : "Włącz tryb uproszczony";
}

function showMessage(message) {
  formMessage.textContent = message;
}

function resetForm() {
  taskForm.reset();
  document.getElementById("taskId").value = "";
  saveTaskButton.textContent = "Dodaj zadanie";
  setDefaultDate();
}

function setDefaultDate() {
  const taskDate = document.getElementById("taskDate");

  if (!taskDate.value) {
    const today = new Date().toISOString().split("T")[0];
    taskDate.value = today;
  }
}

function showTab(tabId) {
  tabPanels.forEach((panel) => {
    if (panel.id === tabId) {
      panel.hidden = false;
      panel.classList.add("active-panel");
    } else {
      panel.hidden = true;
      panel.classList.remove("active-panel");
    }
  });

  tabButtons.forEach((button) => {
    if (button.dataset.tab === tabId) {
      button.classList.add("active-tab");
      button.setAttribute("aria-selected", "true");
    } else {
      button.classList.remove("active-tab");
      button.setAttribute("aria-selected", "false");
    }
  });
}

function setDefaultPlanDate() {
  if (!planDate) {
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  planDate.value = today;
}