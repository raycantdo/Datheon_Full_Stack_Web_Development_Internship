
/* ===== SIDEBAR ===== */

const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    sidebar?.classList.add("open");
    sidebarOverlay?.classList.add("visible");
    menuToggle?.setAttribute("aria-expanded", "true");
}

function closeSidebar() {
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("visible");
    menuToggle?.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
    if (sidebar?.classList.contains("open")) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

sidebarOverlay?.addEventListener("click", closeSidebar);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeSidebar();
});


/* ===== TASKFLOW GREETING AND DATE ===== */

const timeGreeting = document.getElementById("timeGreeting")
    || document.getElementById("welcomeGreeting");

const todayDate = document.getElementById("todayDate");

function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function updateGreetingAndDate() {
    const now = new Date();
    const hour = now.getHours();

    if (timeGreeting) {
        if (hour >= 5 && hour < 12) {
            timeGreeting.textContent = "Good morning";
        } else if (hour >= 12 && hour < 17) {
            timeGreeting.textContent = "Good afternoon";
        } else {
            timeGreeting.textContent = "Good evening";
        }
    }

    if (todayDate) {
        todayDate.textContent = new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(now);

        if (todayDate.tagName === "TIME") {
            todayDate.dateTime = getLocalDateString(now);
        }
    }
}

updateGreetingAndDate();

// Refresh the greeting and date every minute.
setInterval(updateGreetingAndDate, 60000);


/* ===== TASK MANAGEMENT ===== */

function initTaskFlow() {
    const taskForm = document.getElementById("newTaskForm")
        || document.getElementById("taskForm");

    const taskInput = document.getElementById("taskInput")
        || document.getElementById("taskTitle");

    const taskCategory = document.getElementById("taskCategory");
    const taskPriority = document.getElementById("taskPriority");
     const taskPriorityInput = document.getElementById("taskPriority");
    const taskDueDate = document.getElementById("taskDueDate");
    const taskFile = document.getElementById("taskFile");
    const selectedFiles = document.getElementById("selectedFiles");

    const mainTaskList = document.getElementById("taskList");
    const taskListHeading = document.getElementById("taskListHeading");
    const filteredTaskList = document.getElementById("filteredTaskList");
    
    const todayTaskCount = document.getElementById("todayTaskCount");
    const upNextTasks = document.getElementById("upNextTasks");
     const taskSearch = document.getElementById("taskSearch");
    const filterButtons = [...document.querySelectorAll(".filter-button")];
    
    const dateFilterButtons = [...document.querySelectorAll(".date-filter")];
dateFilterButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.filter === "");
});
    const customDateInput = document.getElementById("customTaskDate");

let activeDateFilter = "";
let activeCategoryFilter = "All";
    const moodSelect = document.getElementById("moodSelect");
    const upcomingView = document.getElementById("upcomingView");
const deadlineList = document.getElementById("deadlineList");
const dashboardColumns = document.querySelector(".dashboard-columns");
const welcomeSection = document.querySelector(".welcome-section");
const sidebarLinks = document.querySelectorAll(
     ".sidebar-nav .nav-item"
);
    if (!taskForm || !taskInput || !mainTaskList) return;

    const storageKey = "taskflowTasks";
    let tasks = [];
    function saveToLocalStorage() {
    try {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
    }
}
    function loadFromLocalStorage() {
    try {
        const savedTasks = localStorage.getItem(storageKey);
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        tasks = Array.isArray(parsedTasks)
            ? parsedTasks.filter(task => task && typeof task === "object")
            : [];
    } catch (error) {
        console.error("Could not load saved tasks:", error);
    }
}
loadFromLocalStorage();
const suggestionButton =
    document.getElementById("getSuggestionBtn");

if (suggestionButton) {
    suggestionButton.addEventListener("click", () => {
        const mood =
            document.getElementById("moodSelect")?.value || "Regular";

        suggestTask(tasks, mood);
    });
}
    // Keep older saved tasks compatible with this layout.
    tasks = tasks.map(task => ({
        id: task.id || `${Date.now()}-${Math.random()}`,
        title: String(task.title || task.name || ""),
        category: task.category || "Other",
        priority: Math.max(
    1,
    Math.floor(Number(task.priority) || 1)
),
        dueDate: task.dueDate || "",
        completed: Boolean(task.completed),
        archived: Boolean(task.archived),
        started: Boolean(task.started),
        focusSeconds: Math.max(0, Number(task.focusSeconds) || 0),
          subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
    notes: task.notes || "",
    links: Array.isArray(task.links) ? task.links : [],
    images: Array.isArray(task.images) ? task.images : []
    }));

    function saveTasks() {
        try {
            saveToLocalStorage();
        } catch (error) {
            console.error("Could not save tasks:", error);
            alert("Your tasks could not be saved in this browser.");
        }
    }
    function updateTaskPriorities() {
    // Get all priorities that still have unfinished tasks
    const activePriorities = [
        ...new Set(
            tasks
                .filter(task => !task.completed && !task.archived)
                .map(task => Number(task.priority))
        )
    ].sort((a, b) => a - b);

    // Reassign priorities without changing task order
    const priorityMap = new Map();

    activePriorities.forEach((priority, index) => {
        priorityMap.set(priority, index + 1);
    });

    tasks.forEach(task => {
        if (!task.completed && !task.archived) {
            task.priority = priorityMap.get(Number(task.priority));
        }
    });
}
    const priorityToast = document.getElementById("priorityToast");
let priorityToastTimeout;

function showPriorityToast(message = "1 is the highest priority.") {
    if (!priorityToast) return;

    priorityToast.textContent = message;
    priorityToast.classList.add("show");

    clearTimeout(priorityToastTimeout);

    priorityToastTimeout = setTimeout(() => {
        priorityToast.classList.remove("show");
    }, 4000);
}
function updatePriorityLimit() {
    if (!taskPriorityInput) return;

    const usedPriorities = tasks
        .filter(task => !task.archived)
        .map(task => Number(task.priority))
        .filter(priority => Number.isInteger(priority) && priority >= 1);

    const maxPriority = usedPriorities.length
        ? Math.max(...usedPriorities)
        : 0;

    // Allow existing priorities and the next available number
    taskPriorityInput.max = maxPriority + 1;

    const selectedPriority = Number(taskPriorityInput.value);

    if (
        taskPriorityInput.value !== "" &&
        (!Number.isInteger(selectedPriority) ||
         selectedPriority < 1 ||
         selectedPriority > maxPriority + 1)
    ) {
        taskPriorityInput.value = String(maxPriority + 1);
    }
}
   

taskPriorityInput?.addEventListener("focus", () => {
    showPriorityToast("Priority 1 is the highest. Lower numbers mean higher priority.");
});

    /* ===== FOCUS TIMER ===== */

    const focusTaskSelect = document.getElementById("focusTask");
    const focusTimeDisplay = document.getElementById("focusTime");
    const focusStartButton = document.getElementById("focusStart");
    const focusResetButton = document.getElementById("focusReset");
    const focusMinusButton = document.getElementById("focusMinus");
    const focusPlusButton = document.getElementById("focusPlus");
    const focusMessage = document.getElementById("focusMessage");

    let focusDuration = 30 * 60; // Default: 30 minutes
    let focusRemaining = focusDuration;
    let focusInterval = null;
    let focusRunning = false;
    let focusSessionTaskId = null;

    function renderFocusTaskOptions() {
        if (!focusTaskSelect) return;

        const previousValue = focusTaskSelect.value;

        focusTaskSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Choose a task";
        focusTaskSelect.append(placeholder);

        tasks
            .filter(task => !task.completed && !task.archived)
            .forEach(task => {
                const option = document.createElement("option");
                option.value = String(task.id);
                option.textContent = task.title;
                focusTaskSelect.append(option);
            });

        // Keep the selected task if it is still available.
        if ([...focusTaskSelect.options].some(
            option => option.value === previousValue
        )) {
            focusTaskSelect.value = previousValue;
        }
    }

    function renderFocusTime() {
        if (!focusTimeDisplay) return;

        const minutes = Math.floor(focusRemaining / 60);
        const seconds = focusRemaining % 60;

        focusTimeDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function setFocusMessage(message) {
        if (focusMessage) {
            focusMessage.textContent = message;
        }
    }

    function stopFocusInterval() {
        clearInterval(focusInterval);
        focusInterval = null;
        focusRunning = false;

        if (focusStartButton) {
            focusStartButton.textContent = "▶ Start";
        }

        if (focusMinusButton) focusMinusButton.disabled = false;
        if (focusPlusButton) focusPlusButton.disabled = false;
        if (focusTaskSelect) focusTaskSelect.disabled = false;
    }

    function startFocusTimer() {
        // Clicking while running pauses the timer.
        if (focusRunning) {
            stopFocusInterval();
            saveTasks();
            setFocusMessage("Focus paused. Take a little breath.");
            return;
        }

        const selectedId = focusTaskSelect?.value;

        if (!selectedId) {
            setFocusMessage("Choose a task before starting.");
            return;
        }

        const task = tasks.find(item =>
            String(item.id) === selectedId
        );

        if (!task || task.completed || task.archived) {
            setFocusMessage("Please choose an available task.");
            return;
        }

        focusSessionTaskId = task.id;
        focusRunning = true;

        if (focusStartButton) {
            focusStartButton.textContent = "Ⅱ Pause";
        }

        if (focusMinusButton) focusMinusButton.disabled = true;
        if (focusPlusButton) focusPlusButton.disabled = true;
        if (focusTaskSelect) focusTaskSelect.disabled = true;

        setFocusMessage(`Focusing on: ${task.title}`);

        focusInterval = setInterval(() => {
            const activeTask = tasks.find(item =>
                item.id === focusSessionTaskId
            );

            if (!activeTask || activeTask.completed || activeTask.archived) {
                stopFocusInterval();
                saveTasks();
                setFocusMessage("This task is no longer available.");
                return;
            }

            focusRemaining--;

            // Record actual focused time against the selected task.
            activeTask.focusSeconds =
                (Number(activeTask.focusSeconds) || 0) + 1;
renderTasks();
renderFilteredTasks();
            renderFocusTime();

            // Persist the tracked time as it accumulates.
            saveTasks();

            if (focusRemaining <= 0) {
                stopFocusInterval();
                focusRemaining = 0;
                renderFocusTime();
                setFocusMessage("Focus session complete! Lovely work. ♡");

                // Prepare the next session with the same duration.
                focusRemaining = focusDuration;
                renderFocusTime();
            }
        }, 1000);
    }

    function resetFocusTimer() {
        stopFocusInterval();

        // Reset the countdown, not the time already recorded.
        focusRemaining = focusDuration;
        renderFocusTime();
        saveTasks();

        setFocusMessage("Timer reset. Ready when you are.");
    }

    function changeFocusDuration(change) {
        if (focusRunning) return;

        const newDuration = focusDuration + change * 60;

        // Allow durations between 5 and 60 minutes.
        if (newDuration < 5 * 60 || newDuration > 60 * 60) {
            setFocusMessage("Choose between 5 and 60 minutes.");
            return;
        }

        focusDuration = newDuration;
        focusRemaining = focusDuration;

        renderFocusTime();
        setFocusMessage(`${focusDuration / 60}-minute focus session`);
    }

    focusStartButton?.addEventListener("click", startFocusTimer);
    focusResetButton?.addEventListener("click", resetFocusTimer);

    focusMinusButton?.addEventListener("click", () => {
        changeFocusDuration(-5);
    });

    focusPlusButton?.addEventListener("click", () => {
        changeFocusDuration(5);
    });

    focusTaskSelect?.addEventListener("change", () => {
        const task = tasks.find(item =>
            String(item.id) === focusTaskSelect.value
        );

        setFocusMessage(
            task ? `Ready to focus on: ${task.title}` : "Choose a task to begin."
        );
    });

    renderFocusTaskOptions();
    renderFocusTime();
    setFocusMessage("Choose a task and start focusing.");


    function formatDate(dateString) {
        if (!dateString) return "No due date";

        // Noon avoids date shifts caused by timezone conversion.
        const date = new Date(`${dateString}T12:00:00`);

        if (Number.isNaN(date.getTime())) return "No due date";

        return new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(date);
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;

        return element;
    }
        function updateAllTasksCount() {
    const countElement = document.getElementById("allCount");

    if (!countElement) return;

    const count = tasks.filter(task => !task.archived).length;

    countElement.textContent = count;
}
    function renderTodaySummary() {
        const today = getLocalDateString();

        const todaysTasks = tasks.filter(task =>
            !task.completed && task.dueDate === today
        );

        if (todayTaskCount) {
            todayTaskCount.textContent = todaysTasks.length;
        }

        if (!upNextTasks) return;

        upNextTasks.replaceChildren();

        const pendingTasks = tasks
            .filter(task => !task.completed)
           .sort((a, b) => {
    const priorityDifference =
        Number(a.priority) - Number(b.priority);

    if (priorityDifference !== 0) {
        return priorityDifference;
    }

    // Earlier deadlines come first when priorities match.
    if (!a.dueDate && b.dueDate) return 1;
    if (a.dueDate && !b.dueDate) return -1;

    return (a.dueDate || "").localeCompare(b.dueDate || "");
});

        if (pendingTasks.length === 0) {
            upNextTasks.append(
                createElement("p", "", "No pending tasks. Enjoy your free time!")
            );
            return;
        }

        // Show tasks tied at the highest priority and earliest due date.
        const firstTask = pendingTasks[0];

        const nextTasks = pendingTasks.filter(task =>
            task.priority === firstTask.priority &&
            task.dueDate === firstTask.dueDate
        );

        nextTasks.forEach(task => {
            const item = createElement("p", "", task.title);

            if (task.dueDate) {
                item.append(
                    createElement(
                        "small",
                        "",
                        ` · ${formatDate(task.dueDate)}`
                    )
                );
            }

            upNextTasks.append(item);
        });
    }
    
let activeTaskListView = "default";


function getMainListTasks() {
    const visibleTasks = tasks.filter(task => !task.archived);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dateString = date => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    const today = dateString(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = dateString(tomorrowDate);

    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(
        weekStart.getDate() - (day === 0 ? 6 : day - 1)
    );

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let result;

    switch (activeTaskListView) {
        case "all":
            result = visibleTasks;
            break;

        case "active":
            result = visibleTasks.filter(task =>
                !task.completed &&
                (task.started === true ||
                 Number(task.focusSeconds || 0) > 0)
            );
            break;

        case "completed":
            result = visibleTasks.filter(task => task.completed);
            break;

        case "archived":
        case "archive":
            result = tasks.filter(task => task.archived);
            break;

        case "work":
        case "study":
        case "personal":
            result = visibleTasks.filter(task =>
                String(task.category).toLowerCase() === activeTaskListView
            );
            break;
case "someday":
    result = visibleTasks.filter(task =>
        task.category?.toLowerCase() === "someday"
    );
    break;
        case "today":
            result = visibleTasks.filter(task => task.dueDate === today);
            break;

        case "tomorrow":
            result = visibleTasks.filter(task => task.dueDate === tomorrow);
            break;

        case "thisWeek":
            result = visibleTasks.filter(task => {
                if (!task.dueDate) return false;
                const date = new Date(task.dueDate + "T00:00:00");
                return date >= weekStart && date <= weekEnd;
            });
            break;

        case "thisMonth":
            result = visibleTasks.filter(task => {
                if (!task.dueDate) return false;
                const date = new Date(task.dueDate + "T00:00:00");
                return date >= monthStart && date <= monthEnd;
            });
            break;

        case "default": {
            const todayTasks = visibleTasks.filter(
                task => task.dueDate === today
            );

            const tomorrowTasks = visibleTasks.filter(
                task => task.dueDate === tomorrow
            );

            if (todayTasks.length) {
                result = todayTasks;
            } else if (tomorrowTasks.length) {
                result = tomorrowTasks;
            } else {
                result = visibleTasks.filter(task => {
                    if (!task.dueDate) return false;
                    const date = new Date(task.dueDate + "T00:00:00");
                    return date > tomorrowDate && date <= weekEnd;
                });
            }
            break;
        }

        default:
            result = visibleTasks;
    }

    return result.sort((a, b) => {
    if (
        Number.isFinite(a.sortOrder) &&
        Number.isFinite(b.sortOrder)
    ) {
        return a.sortOrder - b.sortOrder;
    }

    return Number(a.priority || 1) - Number(b.priority || 1);
});
}

function openTaskDetails(task) { 
    currentTaskId = task.id;
    const dialog = document.getElementById("taskDetailsDialog");

    if (!dialog) {
        console.error("Task details dialog not found.");
        return;

    }

    document.getElementById("taskDialogHeading").textContent = "Task details";
    document.getElementById("detailTitle").value = task.title || "";
   
    document.getElementById("detailDeadline").value = task.dueDate || "";
     document.getElementById("detailNotes").value = task.notes || "";
   document.getElementById("detailPriority").value = task.priority || 1;
   
     // Give each task its own independent subtask data
if (!Array.isArray(task.subtasks)) {
    task.subtasks = [];
}

currentSubtasks = task.subtasks;
 currentImages = Array.isArray(task.images) ? [...task.images] : [];
    currentLinks = Array.isArray(task.links) ? [...task.links] : [];

    document.getElementById("detailLinks").value =
        currentLinks.join("\n");
    renderLinkPreview();
renderSubtasks();
renderTaskImages();
  if (archiveTaskButton) {
    archiveTaskButton.textContent = task.archived
        ? "Unarchive task"
        : "Archive task";
}
    dialog.showModal();
}
const taskDialog = document.getElementById("taskDetailsDialog");

const archiveTaskButton = document.getElementById("archiveTaskButton");

archiveTaskButton?.addEventListener("click", () => {
    const task = tasks.find(item => item.id === currentTaskId);
    if (!task) return;

    task.archived = !task.archived;

    saveTasks();
    renderAll();

    taskDialog.close();
});

document.getElementById("closeTaskDialog")?.addEventListener("click", () => {
    taskDialog.close();
});

document.getElementById("cancelTaskDialog")?.addEventListener("click", () => {
    taskDialog.close();
});

const detailSubtasks = document.getElementById("detailSubtasks");
const subtaskList = document.getElementById("subtaskList");

let currentSubtasks = [];
let currentTaskId = null;
let currentImages = [];
let currentLinks = [];
const detailLinksInput = document.getElementById("detailLinks");

const linkPreview = document.createElement("div");
linkPreview.className = "task-link-preview";

detailLinksInput?.insertAdjacentElement("afterend", linkPreview);

function renderLinkPreview() {
    if (!detailLinksInput || !linkPreview) return;

    linkPreview.replaceChildren();

    const links = detailLinksInput.value
        .split("\n")
        .map(link => link.trim())
        .filter(Boolean);

    links.forEach(link => {
        let validUrl = null;

        try {
            const parsedUrl = new URL(link);

            if (
                parsedUrl.protocol === "http:" ||
                parsedUrl.protocol === "https:"
            ) {
                validUrl = parsedUrl;
            }
        } catch (error) {
            // Invalid URL: display as plain text.
        }

        if (validUrl) {
            const anchor = document.createElement("a");
            anchor.href = validUrl.href;
            anchor.textContent = `↗ ${link}`;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";

            linkPreview.append(anchor);
        } else {
            const plainText = document.createElement("span");
            plainText.textContent = link;
            linkPreview.append(plainText);
        }
    });
}

detailLinksInput?.addEventListener("input", renderLinkPreview);
function renderSubtasks() {
    if (!subtaskList) return;

    subtaskList.replaceChildren();

    currentSubtasks.forEach((subtask, index) => {
        const item = document.createElement("div");
        item.className = `subtask-item${subtask.completed ? " is-complete" : ""}`;

        const text = document.createElement("span");
        text.className = "subtask-text";
        text.textContent = subtask.text;
         // Optional settings on the right
        const settings = document.createElement("div");
        settings.className = "subtask-quick-settings";

        const priority = document.createElement("select");
        priority.className = "subtask-priority";
        priority.setAttribute("aria-label", "Subtask priority");

        [
            ["", "Priority"],
            ["Low", "Low"],
            ["Medium", "Medium"],
            ["High", "High"]
        ].forEach(([value, label]) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            priority.append(option);
        });

        priority.value = subtask.priority || "";
        priority.addEventListener("change", () => {
            subtask.priority = priority.value;
        });
        settings.append(priority);
        const complete = document.createElement("button");
        complete.type = "button";
        complete.className = "subtask-complete";
        complete.textContent = subtask.completed ? "Completed ✓" : "Complete";

        complete.addEventListener("click", () => {
            currentSubtasks[index].completed =
                !currentSubtasks[index].completed;
            renderSubtasks();
        });

        const close = document.createElement("button");
        close.type = "button";
        close.className = "subtask-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Remove subtask");

        close.addEventListener("click", () => {
            currentSubtasks.splice(index, 1);
            renderSubtasks();
        });

         const actions = document.createElement("div");
        actions.className = "subtask-actions";
        actions.append(complete, close);

        item.append(text, settings, actions);
        subtaskList.append(item);
    });
}
const detailImages = document.getElementById("detailImages");
const taskDetailImages = document.getElementById("taskDetailImages");

function renderTaskImages() {
    if (!taskDetailImages) return;

    taskDetailImages.replaceChildren();

    currentImages.forEach((image, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "task-image-item";

        const img = document.createElement("img");
        img.src = image.data;
        img.alt = image.name || "Task reference image";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", "Remove picture");

        removeButton.addEventListener("click", () => {
            currentImages.splice(index, 1);
            renderTaskImages();
        });

        wrapper.append(img, removeButton);
        taskDetailImages.append(wrapper);
    });
}

detailImages?.addEventListener("change", async () => {
    const files = Array.from(detailImages.files || []);

    for (const file of files) {
        if (!file.type.startsWith("image/")) continue;

        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);

            reader.readAsDataURL(file);
        }).catch(error => {
            console.error("Could not load image:", error);
            return null;
        });

        if (data) {
            currentImages.push({
                name: file.name,
                data
            });
        }
    }

    renderTaskImages();

    // Allows selecting the same file again later.
    detailImages.value = "";
});
document.getElementById("taskDetailsForm")?.addEventListener("submit", event => {
    
    event.preventDefault();

    const title = document.getElementById("detailTitle").value.trim();
    if (!title) return;

    const task = tasks.find(item =>
        item.id === currentTaskId
    );

    if (!task) return;

    task.title = title;
    task.dueDate = document.getElementById("detailDeadline").value;
    const priorityInput = document.getElementById("detailPriority");

if (priorityInput) {
   const priority = Number(priorityInput.value);

const usedPriorities = tasks
    .filter(item => !item.archived && item.id !== task.id)
    .map(item => Number(item.priority))
    .filter(value => Number.isInteger(value) && value >= 1);

const maxPriority = usedPriorities.length
    ? Math.max(...usedPriorities)
    : 0;

if (
    priorityInput.value.trim() === "" ||
    !Number.isInteger(priority) ||
    priority < 1 ||
    priority > maxPriority + 1
) {
    showPriorityToast(
        `Choose a whole-number priority between 1 and ${maxPriority + 1}.`
    );
    priorityInput.focus();
    return;
}

task.priority = priority;
}
    task.subtasks = currentSubtasks;
task.notes = document.getElementById("detailNotes").value;
task.images = [...currentImages];
    const linksText = document.getElementById("detailLinks").value;

    task.links = linksText
        .split("\n")
        .map(link => link.trim())
        .filter(Boolean);
          saveTasks();
    renderAll();
    taskDialog.close();
});
detailSubtasks?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const lines = detailSubtasks.value
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    if (!lines.length) return;

    lines.forEach(text => {
        currentSubtasks.push({ text, completed: false });
    });

    detailSubtasks.value = "";
    renderSubtasks();
});

    function renderTasks() {
        mainTaskList.replaceChildren();

       
        const tasksToRender = getMainListTasks();
  if (taskListHeading) {
        taskListHeading.hidden = tasksToRender.length === 0;
    }

    if (tasksToRender.length === 0) {
        const emptyMessages = {
            all: "No tasks yet.",
            today: "No tasks for today.",
            tomorrow: "No tasks for tomorrow.",
            thisWeek: "No tasks for this week.",
            thisMonth: "No tasks for this month.",
            active: "No active tasks.",
            completed: "No completed tasks.",
            work: "No work tasks yet.",
study: "No study tasks yet.",
personal: "No personal tasks yet.",
archived: "No archived tasks.",
            default: "No tasks for today."
        };
        
         mainTaskList.append(
            createElement(
                "p",
                "empty-state",
                tasks.length === 0
                    ? "Your first task starts here."
                    : emptyMessages[activeTaskListView] || "No tasks here."
            )
        );
        return;
    }
        tasksToRender.forEach(task => {
            const item = createElement(
                "article",
                `task-item${task.completed ? " completed" : ""}`
            );
            item.draggable = true;
item.dataset.taskId = task.id;

const dragHandle = createElement("span", "task-drag-handle", "⠿");
dragHandle.title = "Drag to reorder";
dragHandle.setAttribute("aria-label", "Drag to reorder task");
dragHandle.setAttribute("role", "button");
dragHandle.tabIndex = 0;

item.append(dragHandle);
item.addEventListener("dragstart", event => {
    item.classList.add("dragging");

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(task.id));
});

item.addEventListener("dragover", event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const draggingItem = mainTaskList.querySelector(".dragging");

    if (!draggingItem || draggingItem === item) return;

    const rect = item.getBoundingClientRect();
    const insertAfter = event.clientY > rect.top + rect.height / 2;

    mainTaskList.insertBefore(
        draggingItem,
        insertAfter ? item.nextSibling : item
    );
});

item.addEventListener("drop", event => {
    event.preventDefault();

    const orderedIds = [
        ...mainTaskList.querySelectorAll(".task-item[data-task-id]")
    ].map(element => element.dataset.taskId);

    const visibleTasks = getMainListTasks();
    const visibleIds = new Set(visibleTasks.map(task => String(task.id)));

    const reorderedTasks = [];
    orderedIds.forEach(id => {
        const found = tasks.find(task => String(task.id) === id);
        if (found && visibleIds.has(String(found.id))) {
            reorderedTasks.push(found);
        }
    });

    const reorderedIds = new Set(
        reorderedTasks.map(task => String(task.id))
    );

    // Preserve tasks that are not in the current view.
    const remainingTasks = tasks.filter(
        task => !reorderedIds.has(String(task.id))
    );

    tasks = [...remainingTasks, ...reorderedTasks];

    tasks.forEach((task, index) => {
        task.sortOrder = index;
    });

    saveTasks();
    renderAll();
});

item.addEventListener("dragend", () => {
    item.classList.remove("dragging");

    mainTaskList.querySelectorAll(".task-item").forEach(element => {
        element.classList.remove("dragging-over");
    });
});
            const checkbox = createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.setAttribute(
                "aria-label",
                `Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`
            );

           checkbox.addEventListener("change", () => {
    const completing = checkbox.checked;

    task.completed = completing;
     updateTaskPriorities();
    saveTasks();
    renderAll();

    if (completing) {
        const animatedTask = mainTaskList.querySelector(
            `[data-task-id="${CSS.escape(String(task.id))}"]`
        );

        if (animatedTask) {
            animatedTask.classList.add("completion-animation");

            animatedTask.addEventListener("animationend", () => {
                animatedTask.classList.remove("completion-animation");
            }, { once: true });
        }

        showCompletionToast(task);
    }
});

            const details = createElement("div", "task-details");
            const title = createElement("p", "task-name", task.title);
            title.style.cursor = "pointer";
title.title = "Open task details";

title.addEventListener("click", () => {
    openTaskDetails(task);
});
            const meta = createElement(
                "small",
                "",
                `${task.category} · Priority  ${task.priority}  · ${formatDate(task.dueDate)}`
            );
            const trackedTime = createElement(
    "small",
    "tracked-time",
    `◷ ${formatTrackedTime(task.focusSeconds)} tracked`
);

            details.append(title, meta, trackedTime);

            const deleteButton = createElement("button", "delete-task", "×");
            deleteButton.type = "button";
            deleteButton.title = "Delete task";
            deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

            deleteButton.addEventListener("click", () => {
                if (!confirm(`Delete "${task.title}"?`)) return;

                tasks = tasks.filter(item => item.id !== task.id);
                saveTasks();
                renderAll();
            });

            item.append(checkbox, details, deleteButton);
            mainTaskList.append(item);
        });

    }
    let lastCompletedTask = null;

function showCompletionToast(task) {
    const toast = document.getElementById("completionToast");

    if (!toast) return;

    lastCompletedTask = task;
    toast.hidden = false;
}

document.getElementById("closeCompletionToast")?.addEventListener("click", () => {
    document.getElementById("completionToast").hidden = true;
});

document.getElementById("viewCompletedTask")?.addEventListener("click", () => {
    if (!lastCompletedTask) return;

    document.getElementById("completionToast").hidden = true;
    openTaskDetails(lastCompletedTask);
});
    
function renderFilteredTasks() {
    if (!filteredTaskList) return;

    const query = (taskSearch?.value || "").toLowerCase().trim();
    if (!query) {
    filteredTaskList.replaceChildren();
    return;
}
    const selectedDate = customDateInput?.value;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayString = formatDate(today);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = formatDate(tomorrow);

    const weekStart = new Date(today);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const filteredTasks = tasks.filter(task => {
        if (activeDateFilter === "today" && task.dueDate !== todayString) {
            return false;
        }

        if (activeDateFilter === "tomorrow" && task.dueDate !== tomorrowString) {
            return false;
        }

        if (activeDateFilter === "week") {
            if (!task.dueDate) return false;

            const dueDate = new Date(task.dueDate + "T00:00:00");
            if (dueDate < weekStart || dueDate > weekEnd) return false;
        }

        if (activeDateFilter === "custom" && selectedDate && task.dueDate !== selectedDate) {
            return false;
        }

        if (
            activeCategoryFilter !== "All" &&
            task.category !== activeCategoryFilter
        ) {
            return false;
        }

        const searchableText =
            `${task.title} ${task.category} ${task.priority} ${task.dueDate || ""}`
                .toLowerCase();

        return searchableText.includes(query);
    });

    filteredTaskList.replaceChildren();

    if (filteredTasks.length === 0) {
        filteredTaskList.textContent = "No matching tasks found.";
        return;
    }

    filteredTasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-item search-task-item";

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("h4");
        title.className = "task-name";
        title.textContent = task.title;

        const meta = document.createElement("div");
        meta.className = "search-task-meta";

        const category = document.createElement("span");
        category.textContent = task.category;

        const deadline = document.createElement("span");
        deadline.textContent = task.dueDate
            ? `Deadline: ${task.dueDate}`
            : "No deadline";

        const priority = document.createElement("span");
        priority.textContent = `Priority: ${task.priority}`;

        meta.append(category, deadline, priority);
        details.append(title, meta);
        card.append(details);
        filteredTaskList.append(card);
    });
}

dateFilterButtons.forEach(button => {
    button.addEventListener("click", event => {
        const selectedFilter = button.dataset.filter;

        // Double-clicking the active filter clears it.
        if (
            button.classList.contains("active") &&
            button.dataset.wasClicked === "true"
        ) {
            activeDateFilter = "";
            customDateInput.value = "";

            dateFilterButtons.forEach(item => {
                item.classList.remove("active");
                item.dataset.wasClicked = "false";
            });

            renderFilteredTasks();
            return;
        }

        activeDateFilter = selectedFilter;

        dateFilterButtons.forEach(item => {
            item.classList.toggle("active", item === button);
            item.dataset.wasClicked = "false";
        });

        button.dataset.wasClicked = "true";

        if (
            activeDateFilter === "custom" &&
            event.target !== customDateInput
        ) {
            customDateInput?.showPicker?.();
        }

        renderFilteredTasks();
    });
});

customDateInput?.addEventListener("change", () => {
    activeDateFilter = "custom";

    dateFilterButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === "custom"
        );
    });

    renderFilteredTasks();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeCategoryFilter = button.dataset.filter;

        filterButtons.forEach(item => {
            const selected = item === button;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        renderFilteredTasks();
    });
});

taskSearch?.addEventListener("input", renderFilteredTasks);

function renderDeadlines() {
    if (!deadlineList) return;

    deadlineList.replaceChildren();

    const upcomingTasks = [...tasks]
        .filter(task => !task.completed && !task.archived && task.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (upcomingTasks.length === 0) {
        deadlineList.append(
            createElement("p", "empty-state", "No upcoming deadlines.")
        );
        return;
    }

    upcomingTasks.forEach(task => {
        const item = createElement("div", "deadline-item");
        const title = createElement("p", "deadline-task-title", task.title);
        const date = createElement(
            "small",
            "deadline-task-date",
            formatDate(task.dueDate)
        );

        item.append(title, date);
        deadlineList.append(item);
    });
}

function showUpcomingDeadlines() {
    if (dashboardColumns) dashboardColumns.hidden = false;
    if (welcomeSection) welcomeSection.hidden = false;
    if (upcomingView) upcomingView.hidden = false;
     if (mainTaskList) mainTaskList.hidden = true;

    sidebarLinks.forEach(link => {
        const selected = link.dataset.view === "upcoming";
        link.classList.toggle("active", selected);

        if (selected) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    renderDeadlines();
}
function formatTrackedTime(seconds) {
    seconds = Number(seconds) || 0;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

    function renderAll() {
         updatePriorityLimit();
         renderFocusTaskOptions();
         renderTasks();
          renderFilteredTasks();
    renderTodaySummary();
    renderDeadlines();
    updateMyDayGrid();
    updateAllTasksCount();
       
    }

    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const title = taskInput.value.trim();

        if (!title) {
            taskInput.focus();
            return;
        }
        const priority = Number(taskPriorityInput.value);
const maxPriority = Number(taskPriorityInput.max);

if (
    taskPriorityInput.value.trim() === "" ||
    !Number.isInteger(priority) ||
    priority < 1 ||
    priority > maxPriority
) {
    showPriorityToast(
        `Choose a whole number between 1 and ${maxPriority}.`
    );
    taskPriorityInput.focus();
    return;
}
const selectedPriority = priority;

const matchingPriority = tasks.some(task =>
    !task.archived &&
    Number(task.priority) === selectedPriority
);

if (matchingPriority) {
    const shouldShift = confirm(
        `Priority ${selectedPriority} already exists.\n\n` +
        `Yes: Move existing tasks at priority ${selectedPriority} ` +
        `and below down by 1.\n\n` +
        `No: Keep the existing priorities unchanged.`
    );

    if (shouldShift) {
        tasks.forEach(task => {
            if (
                !task.archived &&
                Number(task.priority) >= selectedPriority
            ) {
                task.priority = Number(task.priority) + 1;
            }
        });
    }
}
        tasks.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            title,
            category: taskCategory?.value || "Other",
            priority: selectedPriority,
            dueDate: taskDueDate?.value || "",
            completed: false
        });

        saveTasks();
        taskForm.reset();

        if (selectedFiles) selectedFiles.textContent = "";

        renderAll();
        taskInput.focus();
    });

    // Display selected filenames. Files themselves are not stored.
    taskFile?.addEventListener("change", () => {
        if (!selectedFiles) return;

        selectedFiles.textContent = Array.from(taskFile.files || [])
            .map(file => file.name)
            .join(", ");
    });

sidebarLinks.forEach(button => {
    button.addEventListener("click", () => {
        const view = button.dataset.view;
        const category = button.dataset.category;

        if (view === "upcoming") {
            showUpcomingDeadlines();
            return;
        }

        if (category) {
            activeTaskListView = category.toLowerCase();
        } else if (view === "archive" || view === "archived") {
            activeTaskListView = "archived";
        } else if ([
            "all", "today", "tomorrow", "thisWeek",
            "thisMonth", "active", "completed","someday"
        ].includes(view)) {
            activeTaskListView = view;
        } else {
            return;
        }

        if (mainTaskList) mainTaskList.hidden = false;
        if (upcomingView) upcomingView.hidden = true;

        if (taskListHeading) {
            const headings = {
                all: "All Tasks",
                today: "Today's Tasks",
                tomorrow: "Tomorrow's Tasks",
                thisWeek: "This Week's Tasks",
                thisMonth: "This Month's Tasks",
                active: "Active Tasks",
                completed: "Completed Tasks",
                archived: "Archived Tasks",
                work: "Work Tasks",
                study: "Study Tasks",
                personal: "Personal Tasks",
                someday: "Someday Tasks"
            };

            taskListHeading.textContent =
                headings[activeTaskListView] || "Your Tasks";
        }

        sidebarLinks.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        renderTasks();
    });
});


if (upcomingView) upcomingView.hidden = true;
    renderAll();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTaskFlow, { once: true });
} else {
    initTaskFlow();
}

/* ===== My Day Grid ===== */

function updateMyDayGrid() {
    const savedTasks = JSON.parse(
        localStorage.getItem("taskflowTasks") || "[]"
    );

    const total = savedTasks.length;

    const done = savedTasks.filter(task =>
        task.completed === true
    ).length;

    const active = savedTasks.filter(task =>
    !task.completed &&
    !task.archived &&
    (
        task.started === true ||
        Number(task.focusSeconds || 0) > 0
    )
).length;

    const notStarted = total - done - active;

    const percentage = total > 0
        ? Math.round((done / total) * 100)
        : 0;

    // Update circular progress
    const circle = document.querySelector(".progress-circle");
    const percentageText = document.getElementById("myDayPercentage");

    if (circle) {
        circle.style.setProperty("--progress", `${percentage}%`);
    }

    if (percentageText) {
        percentageText.textContent = `${percentage}%`;
    }

    // Update remaining tasks
    const remainingText = document.querySelector(".my-day-progress > p");

    if (remainingText) {
        const remaining = total - done;
        remainingText.textContent = remaining === 0
            ? "All tasks completed!"
            : `${remaining} more to complete`;
    }

    // Update status counts
    const doneCount = document.querySelector(".status-box.done strong");
    const activeCount = document.querySelector(".status-box.active strong");
    const notStartedCount = document.querySelector(
        ".status-box.not-started strong"
    );

    if (doneCount) doneCount.textContent = done;
    if (activeCount) activeCount.textContent = active;
    if (notStartedCount) notStartedCount.textContent = notStarted;
}

// Restore and save the selected mood
const moodSelect = document.getElementById("moodSelect");

if (moodSelect) {
    moodSelect.value = localStorage.getItem("taskflowMood") || "";

    moodSelect.addEventListener("change", () => {
        localStorage.setItem("taskflowMood", moodSelect.value);
    });
}
// Initial update
updateMyDayGrid();

const customDateInput = document.getElementById("customTaskDate");

