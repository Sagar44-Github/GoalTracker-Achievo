import { Goal, Task, DailyTheme, db } from "./db";

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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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
      isQuiet: false,
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

  // Add theme-based tasks
  await addThemeBasedTasks();
};

/**
 * Add demo data specifically for testing goal inactivity feature.
 * This function adds new goals with various activity levels without duplicate checking.
 */
export const addInactivityDemoData = async (): Promise<void> => {
  const timestamp = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Create goals with various activity levels
  const inactivityGoals: Goal[] = [
    {
      id: `active-goal-${timestamp}`,
      title: "Active Goal (Recent activity)",
      createdAt: timestamp - 30 * dayInMs,
      taskIds: [],
      order: 100, // High order to place at end
      streakCounter: 3,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#2dd4bf", // Teal
      level: 2,
      xp: 150,
      lastActiveDate: timestamp - 1 * dayInMs, // Active 1 day ago
    },
    {
      id: `inactive-5-day-${timestamp}`,
      title: "5-Day Inactive Goal",
      createdAt: timestamp - 15 * dayInMs,
      taskIds: [],
      order: 101,
      streakCounter: 0,
      lastCompletedDate: new Date(timestamp - 7 * dayInMs)
        .toISOString()
        .split("T")[0],
      color: "#fdba74", // Orange
      level: 1,
      xp: 70,
      lastActiveDate: timestamp - 6 * dayInMs, // Inactive for 6 days
    },
    {
      id: `inactive-12-day-${timestamp}`,
      title: "12-Day Inactive Goal",
      createdAt: timestamp - 25 * dayInMs,
      taskIds: [],
      order: 102,
      streakCounter: 0,
      lastCompletedDate: new Date(timestamp - 14 * dayInMs)
        .toISOString()
        .split("T")[0],
      color: "#a78bfa", // Purple
      level: 1,
      xp: 95,
      lastActiveDate: timestamp - 12 * dayInMs, // Inactive for 12 days
    },
    {
      id: `inactive-30-day-${timestamp}`,
      title: "30-Day Abandoned Goal",
      createdAt: timestamp - 45 * dayInMs,
      taskIds: [],
      order: 103,
      streakCounter: 0,
      lastCompletedDate: new Date(timestamp - 32 * dayInMs)
        .toISOString()
        .split("T")[0],
      color: "#f87171", // Red
      level: 1,
      xp: 30,
      lastActiveDate: timestamp - 30 * dayInMs, // Inactive for 30 days
    },
  ];

  // Add goals
  for (const goal of inactivityGoals) {
    await db.addGoal(goal);
  }

  // Create tasks for these goals
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(timestamp + 1 * dayInMs)
    .toISOString()
    .split("T")[0];

  const inactivityTasks: Task[] = [
    // Active goal tasks
    {
      id: `active-task-1-${timestamp}`,
      title: "Recently completed task",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: timestamp - 2 * dayInMs,
      goalId: `active-goal-${timestamp}`,
      tags: ["demo", "active"],
      completed: true,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: timestamp - 1 * dayInMs,
      xp: 30,
    },
    {
      id: `active-task-2-${timestamp}`,
      title: "Upcoming task",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: timestamp - 1 * dayInMs,
      goalId: `active-goal-${timestamp}`,
      tags: ["demo", "upcoming"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 45,
    },

    // 5-day inactive goal tasks
    {
      id: `inactive-5-task-${timestamp}`,
      title: "Overdue task (5 days)",
      dueDate: new Date(timestamp - 3 * dayInMs).toISOString().split("T")[0],
      suggestedDueDate: new Date(timestamp - 3 * dayInMs)
        .toISOString()
        .split("T")[0],
      createdAt: timestamp - 7 * dayInMs,
      goalId: `inactive-5-day-${timestamp}`,
      tags: ["demo", "inactive"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 35,
    },

    // 12-day inactive goal tasks
    {
      id: `inactive-12-task-${timestamp}`,
      title: "Stale task (12 days)",
      dueDate: new Date(timestamp - 10 * dayInMs).toISOString().split("T")[0],
      suggestedDueDate: new Date(timestamp - 10 * dayInMs)
        .toISOString()
        .split("T")[0],
      createdAt: timestamp - 15 * dayInMs,
      goalId: `inactive-12-day-${timestamp}`,
      tags: ["demo", "stale"],
      completed: false,
      priority: "high",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 50,
    },

    // 30-day abandoned goal tasks
    {
      id: `inactive-30-task-${timestamp}`,
      title: "Abandoned task (30 days)",
      dueDate: new Date(timestamp - 25 * dayInMs).toISOString().split("T")[0],
      suggestedDueDate: new Date(timestamp - 25 * dayInMs)
        .toISOString()
        .split("T")[0],
      createdAt: timestamp - 35 * dayInMs,
      goalId: `inactive-30-day-${timestamp}`,
      tags: ["demo", "abandoned"],
      completed: false,
      priority: "low",
      isArchived: false,
      repeatPattern: null,
      completionTimestamp: null,
      xp: 25,
    },
  ];

  // Add tasks
  for (const task of inactivityTasks) {
    await db.addTask(task);
  }

  // Create history entries for the active goal
  const activeGoalId = `active-goal-${timestamp}`;

  // Recent activity for the active goal
  for (let i = 1; i <= 5; i++) {
    if (i === 2) continue; // Skip one day to make the streak realistic

    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: `active-task-1-${timestamp}`,
      entityType: "task",
      timestamp: timestamp - i * dayInMs,
      details: { title: "Recently completed task" },
    });
  }

  // Add history for 5-day inactive goal - activity was 6 days ago
  await db.addHistoryEntry({
    id: crypto.randomUUID(),
    type: "edit",
    entityId: `inactive-5-day-${timestamp}`,
    entityType: "goal",
    timestamp: timestamp - 6 * dayInMs,
    details: { title: "5-Day Inactive Goal", action: "Edit title" },
  });

  // Add history for 12-day inactive goal - activity was 12 days ago
  await db.addHistoryEntry({
    id: crypto.randomUUID(),
    type: "add",
    entityId: `inactive-12-task-${timestamp}`,
    entityType: "task",
    timestamp: timestamp - 12 * dayInMs,
    details: { title: "Stale task (12 days)" },
  });

  // Add history for 30-day abandoned goal - activity was 30 days ago
  await db.addHistoryEntry({
    id: crypto.randomUUID(),
    type: "add",
    entityId: `inactive-30-task-${timestamp}`,
    entityType: "task",
    timestamp: timestamp - 30 * dayInMs,
    details: { title: "Abandoned task (30 days)" },
  });

  // Add theme-based tasks if they don't exist yet
  const themeTaskExists = await db.getTask("theme-task-monday-1");
  if (!themeTaskExists) {
    await addThemeBasedTasks();
  }
};

/**
 * Add some pre-built tasks that match the daily themes.
 * This will ensure there's data to demonstrate the Daily Themes Mode feature.
 */
export const addThemeBasedTasks = async (): Promise<void> => {
  // Get the daily themes
  const themes = await db.getDailyThemes();
  if (themes.length === 0) {
    console.log("No themes found. Creating default themes first.");
    await db.createDefaultThemes();
    themes.push(...(await db.getDailyThemes()));
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Get a theme by day name
  const getThemeByDay = (day: string): DailyTheme | undefined => {
    return themes.find(
      (theme) => theme.day.toLowerCase() === day.toLowerCase()
    );
  };

  // Tasks for Monday - Mind & Body
  const mondayTheme = getThemeByDay("monday");
  if (mondayTheme) {
    const mondayTasks: Task[] = [
      {
        id: "theme-task-monday-1",
        title: "Morning yoga session",
        dueDate: today,
        suggestedDueDate: today,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["health", "exercise", "mindfulness"],
        completed: false,
        priority: "high",
        isArchived: false,
        isQuiet: false,
        repeatPattern: { type: "weekly", interval: 1 },
        completionTimestamp: null,
        themeId: mondayTheme.id,
      },
      {
        id: "theme-task-monday-2",
        title: "Meditation practice",
        dueDate: today,
        suggestedDueDate: today,
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["mindfulness", "mental health"],
        completed: true,
        priority: "medium",
        isArchived: false,
        isQuiet: false,
        repeatPattern: { type: "daily", interval: 1 },
        completionTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
        themeId: mondayTheme.id,
      },
    ];

    // Add Monday tasks
    for (const task of mondayTasks) {
      await db.addTask(task);
    }
  }

  // Tasks for Tuesday - Work & Career
  const tuesdayTheme = getThemeByDay("tuesday");
  if (tuesdayTheme) {
    const tuesdayTasks: Task[] = [
      {
        id: "theme-task-tuesday-1",
        title: "Update resume",
        dueDate: tomorrow,
        suggestedDueDate: tomorrow,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["career", "professional"],
        completed: false,
        priority: "medium",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: tuesdayTheme.id,
      },
      {
        id: "theme-task-tuesday-2",
        title: "Career development research",
        dueDate: nextWeek,
        suggestedDueDate: nextWeek,
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["career", "learning", "productivity"],
        completed: false,
        priority: "low",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: tuesdayTheme.id,
      },
    ];

    // Add Tuesday tasks
    for (const task of tuesdayTasks) {
      await db.addTask(task);
    }
  }

  // Tasks for Wednesday - Relationships
  const wednesdayTheme = getThemeByDay("wednesday");
  if (wednesdayTheme) {
    const wednesdayTasks: Task[] = [
      {
        id: "theme-task-wednesday-1",
        title: "Call a friend",
        dueDate: tomorrow,
        suggestedDueDate: tomorrow,
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["friends", "social", "connection"],
        completed: false,
        priority: "high",
        isArchived: false,
        isQuiet: false,
        repeatPattern: { type: "weekly", interval: 1 },
        completionTimestamp: null,
        themeId: wednesdayTheme.id,
      },
      {
        id: "theme-task-wednesday-2",
        title: "Family dinner planning",
        dueDate: nextWeek,
        suggestedDueDate: nextWeek,
        createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: ["family", "connection", "social"],
        completed: false,
        priority: "medium",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: wednesdayTheme.id,
      },
    ];

    // Add Wednesday tasks
    for (const task of wednesdayTasks) {
      await db.addTask(task);
    }
  }

  // Also add some completed tasks for each theme to provide history
  const completedThemeTasks: Task[] = [];
  themes.forEach((theme) => {
    for (let i = 1; i <= 5; i++) {
      const now = Date.now();
      const daysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago

      completedThemeTasks.push({
        id: `theme-completed-${theme.day}-${i}`,
        title: `Completed ${theme.name} task ${i}`,
        dueDate: new Date(now - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        suggestedDueDate: new Date(now - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        createdAt: now - (daysAgo + 2) * 24 * 60 * 60 * 1000,
        goalId: null,
        tags: theme.tags.slice(0, 2), // Use a couple tags from the theme
        completed: true,
        priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as
          | "low"
          | "medium"
          | "high",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: now - daysAgo * 24 * 60 * 60 * 1000,
        themeId: theme.id,
      });
    }
  });

  // Add all completed theme tasks
  for (const task of completedThemeTasks) {
    const exists = await db.getTask(task.id);
    if (!exists) {
      await db.addTask(task);

      // Add history entries for these tasks
      if (task.completionTimestamp) {
        await db.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: task.id,
          entityType: "task",
          timestamp: task.completionTimestamp,
          details: { title: task.title },
        });
      }
    }
  }

  console.log("Theme-based tasks added successfully");
};
