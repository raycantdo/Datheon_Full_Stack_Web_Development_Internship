
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
    const taskDueDate = document.getElementById("taskDueDate");
    const taskFile = document.getElementById("taskFile");
    const selectedFiles = document.getElementById("selectedFiles");

    const mainTaskList = document.getElementById("taskList");
    const filteredTaskList = document.getElementById("filteredTaskList");
    
    const todayTaskCount = document.getElementById("todayTaskCount");
    const upNextTasks = document.getElementById("upNextTasks");
     const taskSearch = document.getElementById("taskSearch");
    const filterButtons = [...document.querySelectorAll(".filter-button")];
    const moodSelect = document.getElementById("moodSelect");
    const upcomingView = document.getElementById("upcomingView");
const deadlineList = document.getElementById("deadlineList");
const dashboardColumns = document.querySelector(".dashboard-columns");
const welcomeSection = document.querySelector(".welcome-section");
const sidebarLinks = document.querySelectorAll(
    "#sidebar [data-view], #sidebar [data-category]"
);
    if (!taskForm || !taskInput || !mainTaskList) return;

    const storageKey = "taskflowTasks";
    let tasks = [];

    try {
        const savedTasks = localStorage.getItem(storageKey);
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        tasks = Array.isArray(parsedTasks)
            ? parsedTasks.filter(task => task && typeof task === "object")
            : [];
    } catch (error) {
        console.error("Could not load saved tasks:", error);
    }

    // Keep older saved tasks compatible with this layout.
    tasks = tasks.map(task => ({
        id: task.id || `${Date.now()}-${Math.random()}`,
        title: String(task.title || task.name || ""),
        category: task.category || "Other",
        priority: ["High", "Medium", "Low"].includes(task.priority)
            ? task.priority
            : "Medium",
        dueDate: task.dueDate || "",
        completed: Boolean(task.completed),
        archived: Boolean(task.archived),
        started: Boolean(task.started)
    }));

    function saveTasks() {
        try {
            localStorage.setItem(storageKey, JSON.stringify(tasks));
        } catch (error) {
            console.error("Could not save tasks:", error);
            alert("Your tasks could not be saved in this browser.");
        }
    }

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
                const priorityOrder = { High: 0, Medium: 1, Low: 2 };

                const priorityDifference =
                    priorityOrder[a.priority] - priorityOrder[b.priority];

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                // Tasks with due dates come before tasks without dates.
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

    function renderTasks() {
        mainTaskList.replaceChildren();

        if (tasks.length === 0) {
            mainTaskList.append(
                createElement("p", "empty-state", "Your first task starts here.")
            );
            return;
        }

        tasks.forEach(task => {
            const item = createElement(
                "article",
                `task-item${task.completed ? " completed" : ""}`
            );

            const checkbox = createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;
            checkbox.setAttribute(
                "aria-label",
                `Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`
            );

            checkbox.addEventListener("change", () => {
                task.completed = checkbox.checked;
                saveTasks();
                renderAll();
            });

            const details = createElement("div", "task-details");
            const title = createElement("p", "task-name", task.title);

            const meta = createElement(
                "small",
                "",
                `${task.category} · ${task.priority} priority · ${formatDate(task.dueDate)}`
            );

            details.append(title, meta);

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
    if (dashboardColumns) dashboardColumns.hidden = true;
    if (welcomeSection) welcomeSection.hidden = true;
    if (upcomingView) upcomingView.hidden = false;

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

    function renderAll() {
         renderTasks();
    renderTodaySummary();
    renderDeadlines();
    updateMyDayGrid();
       
    }

    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const title = taskInput.value.trim();

        if (!title) {
            taskInput.focus();
            return;
        }

        tasks.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            title,
            category: taskCategory?.value || "Other",
            priority: taskPriority?.value || "Medium",
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
sidebarLinks.forEach(link => {
    link.addEventListener("click", event => {
        if (link.dataset.view === "upcoming") {
            event.preventDefault();
            showUpcomingDeadlines();
            closeSidebar();
        }
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
        (task.status === "active" || task.started === true)
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
