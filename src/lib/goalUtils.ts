import { Goal, Task, db } from "./db";

// Get goal statistics
export const getGoalStatistics = async (
  goalId: string
): Promise<{
  total: number;
  completed: number;
  percentage: number;
  streak: number;
}> => {
  const goal = await db.getGoal(goalId);
  if (!goal) {
    return { total: 0, completed: 0, percentage: 0, streak: 0 };
  }

  const tasks = await db.getTasksByGoal(goalId);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    percentage,
    streak: goal.streakCounter,
  };
};

// Get all goals with their statistics
export const getGoalsWithStatistics = async (): Promise<
  (Goal & {
    stats: {
      total: number;
      completed: number;
      percentage: number;
      streak: number;
    };
  })[]
> => {
  const goals = await db.getGoals();
  const goalsWithStats = await Promise.all(
    goals.map(async (goal) => {
      const stats = await getGoalStatistics(goal.id);
      return { ...goal, stats };
    })
  );

  return goalsWithStats;
};

// Get all tasks for dashboard analysis
export const getTasksForAnalysis = async (): Promise<{
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedByDay: { date: string; count: number }[];
  tasksCompletedByHour: { hour: number; count: number }[];
  tasksCompletedByGoal: { goalId: string; goalTitle: string; count: number }[];
}> => {
  const tasks = await db.getTasks();
  const goals = await db.getGoals();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week

  const completedTasks = tasks.filter(
    (task) => task.completed && task.completionTimestamp
  );

  // Tasks completed today
  const tasksCompletedToday = completedTasks.filter(
    (task) =>
      task.completionTimestamp && task.completionTimestamp >= today.getTime()
  ).length;

  // Tasks completed this week
  const tasksCompletedThisWeek = completedTasks.filter(
    (task) =>
      task.completionTimestamp &&
      task.completionTimestamp >= startOfWeek.getTime()
  ).length;

  // Tasks completed by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    return date.toISOString().split("T")[0];
  }).reverse();

  const tasksCompletedByDay = last7Days.map((date) => {
    const startOfDay = new Date(date).getTime();
    const endOfDay = startOfDay + 86400000; // +24 hours

    const count = completedTasks.filter(
      (task) =>
        task.completionTimestamp &&
        task.completionTimestamp >= startOfDay &&
        task.completionTimestamp < endOfDay
    ).length;

    return { date, count };
  });

  // Tasks completed by hour
  const tasksCompletedByHour = Array.from({ length: 24 }, (_, hour) => {
    const count = completedTasks.filter((task) => {
      if (!task.completionTimestamp) return false;
      const taskDate = new Date(task.completionTimestamp);
      return taskDate.getHours() === hour;
    }).length;

    return { hour, count };
  });

  // Tasks completed by goal
  const tasksCompletedByGoal = goals.map((goal) => {
    const count = completedTasks.filter(
      (task) => task.goalId === goal.id
    ).length;
    return { goalId: goal.id, goalTitle: goal.title, count };
  });

  return {
    tasksCompletedToday,
    tasksCompletedThisWeek,
    tasksCompletedByDay,
    tasksCompletedByHour,
    tasksCompletedByGoal,
  };
};

// Create a default set of goals if none exist
export const createDefaultGoals = async (): Promise<void> => {
  const goals = await db.getGoals();

  if (goals.length === 0) {
    const defaultGoals = [
      {
        id: crypto.randomUUID(),
        title: "Personal",
        createdAt: Date.now(),
        taskIds: [],
        order: 0,
        streakCounter: 0,
        lastCompletedDate: null,
        color: "#9b87f5", // Purple
      },
      {
        id: crypto.randomUUID(),
        title: "Work",
        createdAt: Date.now(),
        taskIds: [],
        order: 1,
        streakCounter: 0,
        lastCompletedDate: null,
        color: "#1EAEDB", // Blue
      },
      {
        id: crypto.randomUUID(),
        title: "Health",
        createdAt: Date.now(),
        taskIds: [],
        order: 2,
        streakCounter: 0,
        lastCompletedDate: null,
        color: "#0EA5E9", // Ocean Blue
      },
    ];

    for (const goal of defaultGoals) {
      await db.addGoal(goal);
    }
  }
};

// Resolve goal ID from name (for command parsing)
export const resolveGoalId = async (
  goalName: string
): Promise<string | null> => {
  const goals = await db.getGoals();
  const goal = goals.find(
    (g) =>
      g.title.toLowerCase() === goalName.toLowerCase() ||
      g.title.toLowerCase().includes(goalName.toLowerCase())
  );

  return goal ? goal.id : null;
};

// Generate a color for a new goal
export const generateGoalColor = async (): Promise<string> => {
  const colors = [
    "#9b87f5", // Purple
    "#1EAEDB", // Blue
    "#0EA5E9", // Ocean Blue
    "#7E69AB", // Dark Purple
    "#FF6B6B", // Red
    "#4CAF50", // Green
    "#FFA726", // Orange
    "#26C6DA", // Cyan
  ];

  const goals = await db.getGoals();
  const usedColors = goals.map((goal) => goal.color);

  // Find the first unused color
  const availableColor = colors.find((color) => !usedColors.includes(color));

  // If all colors are used, pick a random one
  return availableColor || colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Checks if a goal has had any activity within the specified time period
 * @param goalId The ID of the goal to check
 * @param days The number of days to check for activity
 * @returns Promise<boolean> True if the goal has been inactive, false otherwise
 */
export const checkGoalInactivity = async (
  goalId: string,
  days: number
): Promise<boolean> => {
  // Get all history entries for this goal and its tasks
  const goal = await db.getGoal(goalId);
  if (!goal) return false;

  // Get all tasks for this goal
  const goalTasks = await db.getTasksByGoal(goalId);
  const goalTaskIds = goalTasks.map((task) => task.id);

  // Get all history entries for this goal or its tasks
  const goalHistory = await db.getHistoryEntriesByEntityId(goalId);

  let taskHistories: any[] = [];
  for (const taskId of goalTaskIds) {
    const history = await db.getHistoryEntriesByEntityId(taskId);
    taskHistories = [...taskHistories, ...history];
  }

  // Combine all histories
  const allHistory = [...goalHistory, ...taskHistories];

  // If there's no history, consider it inactive
  if (allHistory.length === 0) return true;

  // Calculate the cutoff date
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  // Check if there are any entries after the cutoff date
  const hasRecentActivity = allHistory.some(
    (entry) => entry.timestamp > cutoffTime
  );

  // Return true if inactive (no recent activity)
  return !hasRecentActivity;
};

/**
 * Get goals that haven't had any activity for a specified number of days
 *
 * @param thresholdDays Number of days of inactivity to consider a goal as inactive
 * @returns Array of inactive goals
 */
export const getInactiveGoals = async (
  thresholdDays: number = 10
): Promise<Goal[]> => {
  try {
    const goals = await db.getGoals();
    const now = Date.now();
    const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Filter goals that:
    // 1. Are not archived or paused
    // 2. Have lastActiveDate older than the threshold
    // 3. If no lastActiveDate, use createdAt date
    return goals.filter((goal) => {
      // Skip archived or paused goals
      if (goal.isArchived || goal.isPaused) {
        return false;
      }

      // Use lastActiveDate if available, otherwise use createdAt
      const lastActivity = goal.lastActiveDate || goal.createdAt;

      // Check if the time since last activity exceeds the threshold
      return now - lastActivity > thresholdMs;
    });
  } catch (error) {
    console.error("Failed to get inactive goals:", error);
    return [];
  }
};
