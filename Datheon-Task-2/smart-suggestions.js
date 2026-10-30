
/* ========================================
   TaskFlow - Smart Suggestions
======================================== */

function getSmartSuggestion(tasks, mood = "Regular") {
    const availableTasks = tasks.filter(task =>
        !task.completed && !task.archived
    );

    if (availableTasks.length === 0) {
        return null;
    }

    // Estimate task energy using its title and category
    function estimateEnergy(task) {
        const text =
            `${task.title} ${task.category || ""}`.toLowerCase();

        const highEnergy = [
            "coding", "code", "programming", "development",
            "project", "difficult", "problem solving",
            "math", "assignment", "exam preparation"
        ];

        const lowEnergy = [
            "read", "reading", "storybook", "novel",
            "watch", "tutorial", "review", "organize",
            "planning", "plan", "journal", "skincare",
            "stretch", "easy", "relax"
        ];

        if (highEnergy.some(word => text.includes(word))) {
            return 3;
        }

        if (lowEnergy.some(word => text.includes(word))) {
            return 1;
        }

        return 2;
    }

    // Match task energy to the selected mood
    const moodEnergy = {
        Energetic: 3,
        Regular: 2,
        Idle: 1,
        Sleepy: 1
    };

    const targetEnergy = moodEnergy[mood] ?? 2;

    // Prefer tasks that match the current mood
    const sortedTasks = [...availableTasks].sort((a, b) => {
        const energyDifference =
            Math.abs(estimateEnergy(a) - targetEnergy) -
            Math.abs(estimateEnergy(b) - targetEnergy);

        if (energyDifference !== 0) {
            return energyDifference;
        }

        // Use priority only to break a tie
        const priorityRank = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        const priorityDifference =
            (priorityRank[a.priority] || 4) -
            (priorityRank[b.priority] || 4);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        // Prefer earlier deadlines when available
        if (a.dueDate && b.dueDate) {
            return a.dueDate.localeCompare(b.dueDate);
        }

        if (a.dueDate) return -1;
        if (b.dueDate) return 1;

        return 0;
    });

    return sortedTasks[0];
}


// Display the suggestion in your existing HTML
function suggestTask(tasks, mood = "Regular") {
    const suggestionArea =
        document.getElementById("suggestedTask");

    if (!suggestionArea) {
        console.error("Smart Suggestions: #suggestedTask not found.");
        return;
    }

    const task = getSmartSuggestion(tasks, mood);

    if (!task) {
        suggestionArea.textContent =
            "No available tasks yet. Add a task first!";
        return;
    }

    suggestionArea.replaceChildren();

    const title = document.createElement("h3");
    title.textContent = task.title;

    const details = document.createElement("p");
    details.textContent =
        `${task.category || "Uncategorized"} · ${task.priority || "Normal"} priority`;

    suggestionArea.append(title, details);
}
