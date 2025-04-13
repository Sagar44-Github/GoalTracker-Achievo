import { Goal, Task, db } from "./db";

/**
 * Add more pre-built data to the application.
 * This will add additional goals and tasks beyond the default ones.
 */
export const addPrebuiltData = async (): Promise<void> => {
  // Check if the additional goals already exist to avoid duplicates
  const existingGoals = await db.getGoals();
  const additionalGoalIds = ["learning-goal", "home-projects", "family-time"];

  // If any of these goals already exist, we'll assume data was already added
  if (existingGoals.some((goal) => additionalGoalIds.includes(goal.id))) {
    console.log("Additional pre-built data already exists. Skipping.");
    return;
  }

  // Create some additional goals
  const additionalGoals: Goal[] = [
    {
      id: "learning-goal",
      title: "Learning Journey",
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
      taskIds: [],
      order: 3,
      streakCounter: 4,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#FF9800", // Orange
      level: 1,
      xp: 120,
    },
    {
      id: "home-projects",
      title: "Home Projects",
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
      taskIds: [],
      order: 4,
      streakCounter: 1,
      lastCompletedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      color: "#795548", // Brown
      level: 1,
      xp: 85,
    },
    {
      id: "family-time",
      title: "Family Time",
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25 days ago
      taskIds: [],
      order: 5,
      streakCounter: 6,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#E91E63", // Pink
      level: 2,
      xp: 220,
      badges: ["consistent-effort", "family-first"],
    },
  ];

  // Add goals
  for (const goal of additionalGoals) {
    await db.addGoal(goal);
  }

  // Create additional tasks
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const additionalTasks: Task[] = [
    // Learning Journey Tasks
    {
      id: "task-learn-1",
      title: "Complete online course module",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "learning-goal",
      tags: ["course", "education"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: null,
      xp: 60,
    },
    {
      id: "task-learn-2",
      title: "Practice new language for 20 minutes",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      goalId: "learning-goal",
      tags: ["language", "practice"],
      completed: true,
      priority: "medium",
      isArchived: false,
      repeatPattern: { type: "daily", interval: 1 },
      completionTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      xp: 40,
      timeSpent: 20 * 60 * 1000,
    },
    {
      id: "task-learn-3",
      title: "Research new topic of interest",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      goalId: "learning-goal",
      tags: ["research", "curiosity"],
      completed: false,
      priority: "low",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 50,
    },

    // Home Projects Tasks
    {
      id: "task-home-1",
      title: "Organize garage",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      goalId: "home-projects",
      tags: ["cleaning", "organization"],
      completed: false,
      priority: "medium",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 80,
    },
    {
      id: "task-home-2",
      title: "Fix leaky faucet",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      goalId: "home-projects",
      tags: ["repair", "plumbing"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 40,
    },
    {
      id: "task-home-3",
      title: "Weekly home maintenance check",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      goalId: "home-projects",
      tags: ["maintenance", "routine"],
      completed: true,
      priority: "medium",
      isArchived: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      xp: 35,
    },

    // Family Time Tasks
    {
      id: "task-family-1",
      title: "Family game night",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      goalId: "family-time",
      tags: ["games", "fun"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: null,
      xp: 60,
    },
    {
      id: "task-family-2",
      title: "Visit grandparents",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "family-time",
      tags: ["visit", "relatives"],
      completed: false,
      priority: "medium",
      isArchived: false,
      repeatPattern: { type: "monthly", interval: 1 },
      completionTimestamp: null,
      xp: 70,
    },
    {
      id: "task-family-3",
      title: "Daily family dinner",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      goalId: "family-time",
      tags: ["dinner", "daily-ritual"],
      completed: true,
      priority: "high",
      isArchived: false,
      repeatPattern: { type: "daily", interval: 1 },
      completionTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      xp: 30,
      timeSpent: 60 * 60 * 1000,
    },

    // Some additional unassigned tasks
    {
      id: "task-unassigned-1",
      title: "Buy groceries",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      goalId: null,
      tags: ["shopping", "food"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: null,
      xp: 25,
    },
    {
      id: "task-unassigned-2",
      title: "Schedule dentist appointment",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      goalId: null,
      tags: ["health", "appointment"],
      completed: false,
      priority: "medium",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 30,
    },
  ];

  // Add tasks
  for (const task of additionalTasks) {
    await db.addTask(task);
  }

  // Create history for daily family dinner (task-family-3)
  const now = Date.now();
  for (let i = 1; i <= 25; i++) {
    // Skip occasionally to show some missed days
    if (i % 11 === 0 || i % 17 === 0) {
      continue;
    }

    const timestamp = now - i * 24 * 60 * 60 * 1000;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "task-family-3",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Daily family dinner" },
    });
  }

  // Create history for language practice (task-learn-2)
  for (let i = 1; i <= 20; i++) {
    // Skip more frequently to show a more realistic language learning journey
    if (i % 3 === 0 || i % 5 === 0) {
      continue;
    }

    const timestamp = now - i * 24 * 60 * 60 * 1000;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "task-learn-2",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Practice new language for 20 minutes" },
    });
  }

  // Create history for weekly home maintenance (task-home-3)
  for (let i = 1; i <= 15; i += 7) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "task-home-3",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Weekly home maintenance check" },
    });
  }
};
