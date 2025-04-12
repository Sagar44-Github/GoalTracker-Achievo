import { Task, Goal, db } from "./db";

// XP calculation constants
const XP_BASE = {
  LOW: 10,
  MEDIUM: 25,
  HIGH: 50,
};

const STREAK_MULTIPLIERS = [
  { threshold: 30, multiplier: 3.0 },
  { threshold: 14, multiplier: 2.0 },
  { threshold: 7, multiplier: 1.5 },
  { threshold: 3, multiplier: 1.2 },
  { threshold: 0, multiplier: 1.0 },
];

// Urgency bonus (days until due)
const URGENCY_BONUS = {
  SAME_DAY: 1.5, // Due today
  WITHIN_WEEK: 1.2, // Due within a week
  DEFAULT: 1.0, // Due later or no due date
};

// Level calculation constants
const XP_PER_LEVEL = 100; // Base XP needed per level
const LEVEL_SCALING = 1.5; // How much more XP is needed for each level
const MAX_LEVEL = 10; // Maximum level before prestige

/**
 * Calculate XP for completing a task based on difficulty, urgency, and streak
 */
export function calculateTaskXP(task: Task, streak: number = 0): number {
  // Base XP based on priority
  let baseXP = XP_BASE.MEDIUM; // Default medium priority

  if (task.priority === "high") {
    baseXP = XP_BASE.HIGH;
  } else if (task.priority === "low") {
    baseXP = XP_BASE.LOW;
  }

  // Apply streak multiplier
  const streakMultiplier =
    STREAK_MULTIPLIERS.find((s) => streak >= s.threshold)?.multiplier || 1.0;

  // Calculate urgency multiplier
  let urgencyMultiplier = URGENCY_BONUS.DEFAULT;

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue === 0) {
      urgencyMultiplier = URGENCY_BONUS.SAME_DAY;
    } else if (daysUntilDue <= 7) {
      urgencyMultiplier = URGENCY_BONUS.WITHIN_WEEK;
    }
  }

  // Calculate total XP, round to nearest whole number
  const totalXP = Math.round(baseXP * streakMultiplier * urgencyMultiplier);

  return totalXP;
}

/**
 * Calculate XP needed for a specific level
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;

  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += Math.floor(XP_PER_LEVEL * Math.pow(LEVEL_SCALING, (i - 1) / 3));
  }

  return totalXP;
}

/**
 * Calculate level based on current XP
 */
export function calculateLevel(xp: number): {
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  xpProgress: number;
} {
  let level = 1;
  let xpForNextLevel = XP_PER_LEVEL;

  // Find the level based on XP
  while (xp >= xpForNextLevel && level < MAX_LEVEL) {
    xp -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(
      XP_PER_LEVEL * Math.pow(LEVEL_SCALING, (level - 1) / 3)
    );
  }

  // If at max level, cap XP
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    const nextLevelXP = xpForNextLevel;
    const currentLevelXP = xp;
    const xpProgress = currentLevelXP / nextLevelXP;

    return { level, currentLevelXP, nextLevelXP, xpProgress };
  }

  const nextLevelXP = xpForNextLevel;
  const currentLevelXP = xp;
  const xpProgress = currentLevelXP / nextLevelXP;

  return { level, currentLevelXP, nextLevelXP, xpProgress };
}

/**
 * Prestige a goal (reset level but keep a prestige badge)
 */
export async function prestigeGoal(
  goalId: string
): Promise<{ success: boolean; prestigeLevel: number }> {
  const goal = await db.getGoal(goalId);

  if (!goal) {
    return { success: false, prestigeLevel: 0 };
  }

  // Check if goal is at max level
  const goalLevel = goal.level || 1;
  if (goalLevel < MAX_LEVEL) {
    return { success: false, prestigeLevel: 0 };
  }

  // Calculate new prestige level
  const prestigeLevel = (goal.prestigeLevel || 0) + 1;

  // Update goal with prestige information
  await db.updateGoal({
    ...goal,
    xp: 0,
    level: 1,
    prestigeLevel,
  });

  return { success: true, prestigeLevel };
}

// Badge definitions
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: (goal: Goal, tasks: Task[]) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: "streak-warrior",
    name: "Streak Warrior",
    description: "Maintain a streak of 7 days or more",
    icon: "🔥",
    criteria: (goal) => (goal.streakCounter || 0) >= 7,
  },
  {
    id: "master-of-goals",
    name: "Master of Goals",
    description: "Reach level 5 on a goal",
    icon: "🏆",
    criteria: (goal) => (goal.level || 1) >= 5,
  },
  {
    id: "prestige-achiever",
    name: "Prestige Achiever",
    description: "Prestige a goal at least once",
    icon: "⭐",
    criteria: (goal) => (goal.prestigeLevel || 0) >= 1,
  },
  {
    id: "task-champion",
    name: "Task Champion",
    description: "Complete 20 tasks for a single goal",
    icon: "🏅",
    criteria: (goal, tasks) => {
      const goalTasks = tasks.filter(
        (t) => t.goalId === goal.id && t.completed
      );
      return goalTasks.length >= 20;
    },
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete 10 high priority tasks",
    icon: "💯",
    criteria: (goal, tasks) => {
      const highPriorityTasks = tasks.filter(
        (t) => t.goalId === goal.id && t.completed && t.priority === "high"
      );
      return highPriorityTasks.length >= 10;
    },
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Complete 5 tasks before their due date",
    icon: "🐦",
    criteria: (goal, tasks) => {
      const earlyTasks = tasks.filter((t) => {
        if (
          t.goalId !== goal.id ||
          !t.completed ||
          !t.completionTimestamp ||
          !t.dueDate
        ) {
          return false;
        }
        const completionDate = new Date(t.completionTimestamp);
        const dueDate = new Date(t.dueDate);
        return completionDate < dueDate;
      });
      return earlyTasks.length >= 5;
    },
  },
  {
    id: "consistent",
    name: "Consistency King",
    description: "Complete tasks on 5 consecutive days",
    icon: "👑",
    criteria: (goal) => (goal.streakCounter || 0) >= 5,
  },
];

/**
 * Check which badges a goal has earned
 */
export async function checkEarnedBadges(goalId: string): Promise<Badge[]> {
  const goal = await db.getGoal(goalId);
  if (!goal) return [];

  // Get all tasks for this goal
  const tasks = await db.getTasksByGoal(goalId);

  // Check each badge
  const earnedBadges = BADGES.filter((badge) => badge.criteria(goal, tasks));

  return earnedBadges;
}

/**
 * Apply XP to a goal when completing a task
 */
export async function applyTaskCompletionXP(taskId: string): Promise<{
  xpEarned: number;
  newLevel?: number;
  leveledUp: boolean;
  newBadges: Badge[];
}> {
  const task = await db.getTask(taskId);
  if (!task || !task.goalId) {
    return { xpEarned: 0, leveledUp: false, newBadges: [] };
  }

  const goal = await db.getGoal(task.goalId);
  if (!goal) {
    return { xpEarned: 0, leveledUp: false, newBadges: [] };
  }

  // Calculate XP based on task and current streak
  const xpEarned = calculateTaskXP(task, goal.streakCounter || 0);

  // Get current level info
  const currentGoalXP = goal.xp || 0;
  const currentLevelInfo = calculateLevel(currentGoalXP);

  // Add XP to goal
  const newGoalXP = currentGoalXP + xpEarned;
  const newLevelInfo = calculateLevel(newGoalXP);

  // Check if leveled up
  const leveledUp = newLevelInfo.level > currentLevelInfo.level;

  // Save updated goal
  await db.updateGoal({
    ...goal,
    xp: newGoalXP,
    level: newLevelInfo.level,
  });

  // Check for new badges
  const prevBadges = await checkEarnedBadges(goal.id);
  const prevBadgeIds = prevBadges.map((b) => b.id);

  // Update status and check badges again
  const newBadges = (await checkEarnedBadges(goal.id)).filter(
    (badge) => !prevBadgeIds.includes(badge.id)
  );

  return {
    xpEarned,
    newLevel: leveledUp ? newLevelInfo.level : undefined,
    leveledUp,
    newBadges,
  };
}

/**
 * Get badges display data for a goal
 */
export async function getGoalBadges(goalId: string): Promise<{
  earnedBadges: Badge[];
  availableBadges: Badge[];
}> {
  const earnedBadges = await checkEarnedBadges(goalId);
  const earnedBadgeIds = earnedBadges.map((b) => b.id);

  const availableBadges = BADGES.filter(
    (badge) => !earnedBadgeIds.includes(badge.id)
  );

  return {
    earnedBadges,
    availableBadges,
  };
}
