import { Goal, Task, DailyTheme, db, TeamMember, TeamTask } from "./db";

/**
 * Add realistic goals and tasks that represent common life goals
 */
export const addRealisticGoals = async (): Promise<void> => {
  // Check if the realistic goals already exist to avoid duplicates
  const existingGoals = await db.getGoals();
  const realisticGoalIds = [
    "fitness-health",
    "career-development",
    "personal-finance",
    "reading-books",
    "side-project",
  ];

  // If any of these goals already exist, we'll assume data was already added
  if (existingGoals.some((goal) => realisticGoalIds.includes(goal.id))) {
    console.log("Realistic goals already exist. Skipping.");
    return;
  }

  console.log("Adding realistic goals and tasks...");

  // Create realistic goals
  const realisticGoals: Goal[] = [
    {
      id: "fitness-health",
      title: "Fitness & Health",
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      taskIds: [],
      order: 10,
      streakCounter: 12,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#4CAF50", // Green
      level: 3,
      xp: 350,
      lastActiveDate: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
    {
      id: "career-development",
      title: "Career Growth",
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      taskIds: [],
      order: 11,
      streakCounter: 5,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#2196F3", // Blue
      level: 4,
      xp: 520,
      lastActiveDate: Date.now(),
    },
    {
      id: "personal-finance",
      title: "Financial Freedom",
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      taskIds: [],
      order: 12,
      streakCounter: 8,
      lastCompletedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      color: "#9C27B0", // Purple
      level: 2,
      xp: 290,
      lastActiveDate: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: "reading-books",
      title: "Read 24 Books This Year",
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      taskIds: [],
      order: 13,
      streakCounter: 3,
      lastCompletedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      color: "#FF5722", // Deep Orange
      level: 2,
      xp: 270,
      lastActiveDate: Date.now() - 4 * 24 * 60 * 60 * 1000,
    },
    {
      id: "side-project",
      title: "Launch My App",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      taskIds: [],
      order: 14,
      streakCounter: 10,
      lastCompletedDate: new Date().toISOString().split("T")[0],
      color: "#607D8B", // Blue Grey
      level: 2,
      xp: 240,
      lastActiveDate: Date.now(),
      badges: ["consistent-effort", "innovator"],
    },
  ];

  // Add goals
  for (const goal of realisticGoals) {
    await db.addGoal(goal);
  }

  // Create realistic tasks
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const realisticTasks: Task[] = [
    // Fitness & Health Tasks
    {
      id: "fitness-1",
      title: "Morning run - 5K",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
      goalId: "fitness-health",
      tags: ["exercise", "cardio", "morning-routine"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "daily", interval: 1 },
      completionTimestamp: null,
      description:
        "Complete a 5K run before breakfast to boost metabolism and energy for the day",
    },
    {
      id: "fitness-2",
      title: "Strength training session",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
      goalId: "fitness-health",
      tags: ["exercise", "strength", "weights"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "weekly", interval: 2 },
      completionTimestamp: null,
      description: "Focus on upper body - chest, shoulders, arms, back",
    },
    {
      id: "fitness-3",
      title: "Prepare healthy meal plan for the week",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "fitness-health",
      tags: ["nutrition", "planning", "meal-prep"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: null,
      description:
        "Plan balanced meals with proper protein, carbs, and vegetables. Include shopping list.",
    },
    {
      id: "fitness-4",
      title: "Annual physical checkup",
      dueDate: nextMonth,
      suggestedDueDate: nextMonth,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      goalId: "fitness-health",
      tags: ["health", "doctor", "preventive"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Schedule annual physical with Dr. Reynolds - include blood work and fitness assessment",
    },

    // Career Development Tasks
    {
      id: "career-1",
      title: "Complete AWS certification course",
      dueDate: twoWeeks,
      suggestedDueDate: twoWeeks,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      goalId: "career-development",
      tags: ["certification", "cloud", "learning"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Finish remaining modules in AWS Solutions Architect course and schedule exam",
    },
    {
      id: "career-2",
      title: "Update LinkedIn profile",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      goalId: "career-development",
      tags: ["networking", "professional"],
      completed: true,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      description:
        "Update with recent projects, refreshed summary, and add new skills",
    },
    {
      id: "career-3",
      title: "Prepare for quarterly performance review",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "career-development",
      tags: ["work", "review", "preparation"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Document achievements, gather metrics, outline growth areas and goals for next quarter",
    },
    {
      id: "career-4",
      title: "Read industry newsletter",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      goalId: "career-development",
      tags: ["reading", "industry-news", "trends"],
      completed: false,
      priority: "low",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "weekly", interval: 1 },
      completionTimestamp: null,
      description:
        "Stay current on latest developments, technologies, and market trends",
    },

    // Financial Freedom Tasks
    {
      id: "finance-1",
      title: "Review monthly budget",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      goalId: "personal-finance",
      tags: ["budget", "money", "review"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "monthly", interval: 1 },
      completionTimestamp: null,
      description:
        "Check spending against budget, adjust categories as needed, identify areas to optimize",
    },
    {
      id: "finance-2",
      title: "Research investment options",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      goalId: "personal-finance",
      tags: ["investing", "research", "retirement"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Compare ETFs, consider rebalancing portfolio, check fee structures",
    },
    {
      id: "finance-3",
      title: "Set up automatic savings transfer",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "personal-finance",
      tags: ["automation", "savings", "banking"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Configure 10% of paycheck to automatically transfer to high-yield savings account",
    },

    // Reading Goal Tasks
    {
      id: "reading-1",
      title: "Finish 'Atomic Habits' book",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      goalId: "reading-books",
      tags: ["book", "self-improvement", "habits"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Currently on chapter 8 - read remaining chapters and take notes on key concepts",
    },
    {
      id: "reading-2",
      title: "Daily reading session - 30 minutes",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      goalId: "reading-books",
      tags: ["reading", "daily-habit", "books"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "daily", interval: 1 },
      completionTimestamp: null,
      description:
        "Dedicate 30 minutes of focused reading time with no distractions",
    },
    {
      id: "reading-3",
      title: "Update reading list & choose next book",
      dueDate: twoWeeks,
      suggestedDueDate: twoWeeks,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      goalId: "reading-books",
      tags: ["planning", "books", "list"],
      completed: false,
      priority: "low",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "monthly", interval: 1 },
      completionTimestamp: null,
      description:
        "Refresh reading list, prioritize next books, consider mix of fiction and non-fiction",
    },

    // Side Project Tasks
    {
      id: "app-1",
      title: "Implement user authentication system",
      dueDate: nextWeek,
      suggestedDueDate: nextWeek,
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      goalId: "side-project",
      tags: ["development", "coding", "auth"],
      completed: true,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
      description:
        "Set up Firebase auth with email/password and Google sign-in options",
    },
    {
      id: "app-2",
      title: "Design landing page mockup",
      dueDate: tomorrow,
      suggestedDueDate: tomorrow,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      goalId: "side-project",
      tags: ["design", "UI", "mockup"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Create Figma design for homepage with value proposition, features, and signup form",
    },
    {
      id: "app-3",
      title: "Conduct user testing session",
      dueDate: twoWeeks,
      suggestedDueDate: twoWeeks,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      goalId: "side-project",
      tags: ["testing", "feedback", "UX"],
      completed: false,
      priority: "high",
      isArchived: false,
      isQuiet: false,
      repeatPattern: null,
      completionTimestamp: null,
      description:
        "Set up 30-minute sessions with 5 test users, prepare testing script and scenarios",
    },
    {
      id: "app-4",
      title: "Work on app for 1 hour",
      dueDate: today,
      suggestedDueDate: today,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      goalId: "side-project",
      tags: ["coding", "development", "consistent"],
      completed: false,
      priority: "medium",
      isArchived: false,
      isQuiet: false,
      repeatPattern: { type: "daily", interval: 1 },
      completionTimestamp: null,
      description:
        "Dedicated daily coding session to maintain momentum on the project",
    },
  ];

  // Add tasks
  for (const task of realisticTasks) {
    await db.addTask(task);
  }

  // Create history for daily tasks
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  // Daily reading history (regular but with occasional misses)
  for (let i = 1; i <= 30; i++) {
    // Skip some days to make it realistic
    if (i % 4 === 0 || i % 7 === 0) {
      continue;
    }

    const timestamp = now - i * dayInMs;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "reading-2",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Daily reading session - 30 minutes" },
    });
  }

  // Daily app work (very consistent)
  for (let i = 1; i <= 25; i++) {
    // Skip very rarely - this person is dedicated!
    if (i % 13 === 0) {
      continue;
    }

    const timestamp = now - i * dayInMs;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "app-4",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Work on app for 1 hour" },
    });
  }

  // Morning runs (somewhat consistent but with more gaps)
  for (let i = 1; i <= 40; i++) {
    // Skip more frequently - running is harder to maintain
    if (i % 3 === 0 || i % 5 === 0) {
      continue;
    }

    const timestamp = now - i * dayInMs;
    await db.addHistoryEntry({
      id: crypto.randomUUID(),
      type: "complete",
      entityId: "fitness-1",
      entityType: "task",
      timestamp: timestamp,
      details: { title: "Morning run - 5K" },
    });
  }

  console.log("Realistic goals and tasks added successfully!");
};

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
  } else {
    console.log("Adding additional pre-built data...");

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
  }

  // Add realistic goals and tasks
  await addRealisticGoals();

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
  console.log("Checking for existing theme-based tasks...");

  // Check if theme tasks already exist
  const existingTasks = await db.getTasks();
  const themeTaskExists = existingTasks.some((task) =>
    task.id.startsWith("theme-")
  );

  if (themeTaskExists) {
    console.log("Theme-based tasks already exist. Skipping.");
    return;
  }

  console.log("No theme-based tasks found. Adding default themes and tasks...");

  // Get existing themes or create default ones
  let themes = await db.getDailyThemes();

  if (themes.length === 0) {
    // Create default themes for each day
    const defaultThemes = [
      {
        id: "monday-theme",
        day: "Monday",
        name: "Growth & Learning",
        tags: ["learning", "growth", "skills", "education"],
        color: "#4CAF50", // Green
        quote:
          "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
      },
      {
        id: "tuesday-theme",
        day: "Tuesday",
        name: "Health & Wellness",
        tags: ["health", "wellness", "fitness", "nutrition"],
        color: "#2196F3", // Blue
        quote: "Take care of your body. It's the only place you have to live.",
      },
      {
        id: "wednesday-theme",
        day: "Wednesday",
        name: "Connection & Relationships",
        tags: ["family", "friends", "connection", "social"],
        color: "#9C27B0", // Purple
        quote:
          "The quality of your life is determined by the quality of your relationships.",
      },
      // Add more default themes as needed
    ];

    for (const theme of defaultThemes) {
      await db.addDailyTheme(theme);
    }

    themes = defaultThemes;
  }

  // Monday theme tasks
  const mondayTheme =
    themes.find((theme) => theme.day === "Monday") || themes[0];
  if (mondayTheme) {
    const mondayTasks = [
      {
        id: "theme-monday-1",
        title: "Read a chapter of a book",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        goalId: null,
        tags: ["learning", "reading", "growth"],
        completed: false,
        priority: "medium",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: mondayTheme.id,
      },
      {
        id: "theme-monday-2",
        title: "Watch an educational video",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        goalId: null,
        tags: ["learning", "education", "video"],
        completed: false,
        priority: "low",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: mondayTheme.id,
      },
    ];

    // Add Monday tasks
    for (const task of mondayTasks) {
      await db.addTask(task);
    }
  }

  // Tuesday theme tasks
  const tuesdayTheme =
    themes.find((theme) => theme.day === "Tuesday") || themes[1];
  if (tuesdayTheme) {
    const tuesdayTasks = [
      {
        id: "theme-tuesday-1",
        title: "30-minute workout",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        goalId: null,
        tags: ["health", "fitness", "exercise"],
        completed: false,
        priority: "high",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: tuesdayTheme.id,
      },
      {
        id: "theme-tuesday-2",
        title: "Prepare a healthy meal",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        goalId: null,
        tags: ["health", "nutrition", "cooking"],
        completed: false,
        priority: "medium",
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

  // Wednesday theme tasks
  const wednesdayTheme =
    themes.find((theme) => theme.day === "Wednesday") || themes[2];
  if (wednesdayTheme) {
    const wednesdayTasks = [
      {
        id: "theme-wednesday-1",
        title: "Call a friend or family member",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
        createdAt: Date.now(),
        goalId: null,
        tags: ["family", "connection", "communication"],
        completed: false,
        priority: "high",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        themeId: wednesdayTheme.id,
      },
      {
        id: "theme-wednesday-2",
        title: "Schedule a get-together",
        dueDate: new Date().toISOString().split("T")[0], // Today
        suggestedDueDate: new Date().toISOString().split("T")[0],
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

/**
 * Add a sample team with the current user as captain and fictional team members.
 * This is for demonstration purposes only.
 */
export const addSampleTeam = async (
  currentUserId: string,
  currentUserName: string
): Promise<void> => {
  console.log("Starting sample team creation process...");

  try {
    // Check if the user already has a sample team
    const userTeams = await db.getTeamsForUser(currentUserId);
    const sampleTeamExists = userTeams.some(
      (team) => team.name === "Productivity Champions"
    );

    if (sampleTeamExists) {
      console.log("Sample team already exists. Skipping creation.");
      return;
    }

    console.log("Creating sample team with ID based on timestamp...");
    const timestamp = Date.now();

    // Create the team with a unique ID
    const team = await db.createTeam({
      name: "Productivity Champions",
      description:
        "A team dedicated to achieving maximum productivity and personal growth.",
      color: "#9c27b0", // Purple
      createdBy: currentUserId,
    });

    console.log(
      `Sample team created with ID: ${team.id} and code: ${team.teamCode}`
    );

    // Define fictional team members with unique IDs
    const teamMembers = [
      {
        id: `${team.id}-member1-${timestamp}`,
        teamId: team.id,
        userId: `member1-${timestamp}`,
        displayName: "Alex Thompson",
        role: "vice-captain" as const,
        joinedAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // Joined 14 days ago
        points: 135,
      },
      {
        id: `${team.id}-member2-${timestamp}`,
        teamId: team.id,
        userId: `member2-${timestamp}`,
        displayName: "Jamie Rodriguez",
        role: "member" as const,
        joinedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // Joined 10 days ago
        points: 87,
      },
      {
        id: `${team.id}-member3-${timestamp}`,
        teamId: team.id,
        userId: `member3-${timestamp}`,
        displayName: "Morgan Chen",
        role: "member" as const,
        joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // Joined 7 days ago
        points: 42,
      },
      {
        id: `${team.id}-member4-${timestamp}`,
        teamId: team.id,
        userId: `member4-${timestamp}`,
        displayName: "Taylor Williams",
        role: "member" as const,
        joinedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // Joined 3 days ago
        points: 65,
      },
    ];

    // Add team members to the database one by one with error handling
    console.log("Adding team members...");
    for (const member of teamMembers) {
      try {
        await db.add("teamMembers", member);
        console.log(`Added team member: ${member.displayName}`);
      } catch (error) {
        console.error(`Error adding team member ${member.displayName}:`, error);
      }
    }

    // Add some sample team tasks with unique IDs
    const teamTasks = [
      {
        id: `${team.id}-task1-${timestamp}`,
        title: "Prepare weekly team report",
        description:
          "Compile the weekly productivity metrics and prepare a summary report",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Due in 2 days
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: ["report", "team"],
        completed: false,
        priority: "high" as const,
        isArchived: false,
        isQuiet: false,
        repeatPattern: { type: "weekly" as const, interval: 1 },
        completionTimestamp: null,
        teamId: team.id,
        assignedBy: currentUserId,
        assignedTo: `member1-${timestamp}`, // Assigned to vice-captain
        pointValue: 5,
      },
      {
        id: `${team.id}-task2-${timestamp}`,
        title: "Research productivity tools",
        description:
          "Find and evaluate new productivity tools that could benefit the team",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Due in 5 days
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: ["research", "tools"],
        completed: false,
        priority: "medium" as const,
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        teamId: team.id,
        assignedBy: currentUserId,
        assignedTo: `member2-${timestamp}`,
        pointValue: 3,
      },
      {
        id: `${team.id}-task3-${timestamp}`,
        title: "Plan team building activity",
        description: "Organize a virtual team building activity for next month",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Due in 10 days
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: ["team building", "event"],
        completed: false,
        priority: "low" as const,
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        teamId: team.id,
        assignedBy: currentUserId,
        assignedTo: `member3-${timestamp}`,
        pointValue: 1,
      },
      {
        id: `${team.id}-task4-${timestamp}`,
        title: "Update team documentation",
        description: "Review and update the team's documentation and processes",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Due in 3 days
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: ["documentation", "process"],
        completed: true,
        priority: "medium" as const,
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: Date.now() - 12 * 60 * 60 * 1000, // Completed 12 hours ago
        teamId: team.id,
        assignedBy: currentUserId,
        assignedTo: `member4-${timestamp}`,
        pointValue: 3,
      },
      {
        id: `${team.id}-task5-${timestamp}`,
        title: "Team weekly check-in",
        description: "Review progress and discuss any blockers",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Due tomorrow
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: ["meeting", "check-in"],
        completed: false,
        priority: "high" as const,
        isArchived: false,
        isQuiet: false,
        repeatPattern: { type: "weekly" as const, interval: 1 },
        completionTimestamp: null,
        teamId: team.id,
        assignedBy: currentUserId,
        assignedTo: currentUserId, // Assigned to current user (captain)
        pointValue: 5,
      },
    ];

    // Add tasks to the database with error handling
    console.log("Adding team tasks...");
    for (const task of teamTasks) {
      try {
        await db.add("teamTasks", task);
        console.log(`Added team task: ${task.title}`);
      } catch (error) {
        console.error(`Error adding team task ${task.title}:`, error);
      }
    }

    // Add the current user as the team captain if not already added
    try {
      const captainMemberId = `${team.id}-${currentUserId}`;
      const captainExists = await db.getTeamMember(team.id, currentUserId);

      if (!captainExists) {
        const captainMember = {
          id: captainMemberId,
          teamId: team.id,
          userId: currentUserId,
          displayName: currentUserName,
          role: "captain" as const,
          joinedAt: Date.now(),
          points: 150,
        };

        await db.add("teamMembers", captainMember);
        console.log("Added current user as team captain");
      }
    } catch (error) {
      console.error("Error adding team captain:", error);
    }

    console.log("Sample team created successfully with members and tasks");
  } catch (error) {
    console.error("Error in addSampleTeam function:", error);
    throw error; // Re-throw to let calling code handle it
  }
};
