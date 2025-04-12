import { Task, db } from "./db";

/**
 * Retrieves task completion history for a given task
 */
export async function getTaskCompletionHistory(taskId: string) {
  // Initialize with the current task state
  const task = await db.getTask(taskId);
  if (!task) {
    return {
      completionHistory: [],
      currentStreak: 0,
      longestStreak: 0,
      missedCount: 0,
    };
  }

  // Get all history entries related to this task
  const historyEntries = await db.getHistoryEntriesByEntityId(taskId);

  // Include other tasks with the same title that might be repeats
  // For example, if we have a recurring task "Workout" that creates new tasks
  const relatedTasks = await db.getTasksByTitle(task.title);
  const relatedTaskIds = relatedTasks.map((t) => t.id);

  // Get history for all related tasks
  const allRelatedHistory = [];
  for (const id of relatedTaskIds) {
    const entries = await db.getHistoryEntriesByEntityId(id);
    allRelatedHistory.push(...entries);
  }

  // Combine and sort all history entries
  const combinedHistory = [...historyEntries, ...allRelatedHistory]
    .filter((entry) => entry.type === "complete")
    .sort((a, b) => b.timestamp - a.timestamp); // Sort newest first

  // Create a map of dates and completions
  // This helps with deduplicating multiple completions on the same day
  const dateMap = new Map();
  const today = new Date().toISOString().split("T")[0];

  // Fill in the last 84 days (12 weeks)
  for (let i = 0; i < 84; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dateMap.set(dateStr, { date: dateStr, completed: false });
  }

  // Mark days with completions
  combinedHistory.forEach((entry) => {
    const date = new Date(entry.timestamp).toISOString().split("T")[0];
    if (dateMap.has(date)) {
      dateMap.set(date, { date, completed: true });
    }
  });

  // Convert map back to array and sort by date
  const completionHistory = Array.from(dateMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate current streak (consecutive completed days)
  let currentStreak = 0;
  for (const entry of completionHistory) {
    if (entry.completed) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 0;
  for (const entry of completionHistory) {
    if (entry.completed) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }

  // Calculate missed days in the last 28 days
  const last28Days = completionHistory.slice(0, 28);
  const missedCount = last28Days.filter((entry) => !entry.completed).length;

  return {
    completionHistory,
    currentStreak,
    longestStreak,
    missedCount,
  };
}

/**
 * Generates a motivational message based on streak data
 */
export function getMotivationalMessage(
  currentStreak: number,
  longestStreak: number,
  missedCount: number
) {
  if (currentStreak >= 7) {
    return `🔥 ${currentStreak} days in a row! Amazing streak!`;
  } else if (currentStreak >= 3) {
    return `⚡ You're on a ${currentStreak}-day streak! Keep it up!`;
  } else if (longestStreak > currentStreak && longestStreak > 3) {
    return `Don't break your ${longestStreak}-day record! You can do it!`;
  } else if (missedCount > 7) {
    return `Getting back on track will boost your progress!`;
  } else {
    return `Build a habit by completing this task regularly!`;
  }
}

/**
 * Calculates weekday consistency for a task
 * Returns an object with weekday names and completion percentages
 */
export function getWeekdayConsistency(
  completionHistory: { date: string; completed: boolean }[]
) {
  const weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const weekdayCounts = Array(7).fill(0);
  const weekdayCompletions = Array(7).fill(0);

  completionHistory.forEach((entry) => {
    const date = new Date(entry.date);
    const weekday = date.getDay();

    weekdayCounts[weekday]++;
    if (entry.completed) {
      weekdayCompletions[weekday]++;
    }
  });

  // Calculate percentage for each weekday
  const weekdayStats = weekdays.map((name, index) => {
    const count = weekdayCounts[index];
    const completions = weekdayCompletions[index];
    const percentage = count > 0 ? Math.round((completions / count) * 100) : 0;

    return {
      name,
      percentage,
      count,
      completions,
    };
  });

  return weekdayStats;
}
