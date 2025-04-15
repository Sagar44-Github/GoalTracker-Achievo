import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the database schema
interface TaskStore {
  key: string;
  value: Task;
  indexes: {
    "by-goalId": string;
    "by-dueDate": string;
    "by-completed": boolean;
  };
}

export interface AchievoDB extends DBSchema {
  goals: {
    key: string;
    value: Goal;
    indexes: { "by-order": number };
  };
  tasks: TaskStore;
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { "by-timestamp": number };
  };
  dailyThemes: {
    key: string;
    value: DailyTheme;
    indexes: { "by-day": string };
  };
  userProfiles: {
    key: string; // userId
    value: UserProfile;
  };
}

// Define the data types
export interface Goal {
  id: string;
  title: string;
  createdAt: number;
  taskIds: string[];
  order: number;
  streakCounter: number;
  lastCompletedDate: string | null;
  color?: string;
  level?: number;
  xp?: number;
  prestigeLevel?: number; // Number of times the goal has prestiged
  badges?: string[]; // IDs of earned badges
  isArchived?: boolean;
  isPaused?: boolean;
  lastActiveDate?: number; // Timestamp of last activity
}

export interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  suggestedDueDate: string | null;
  createdAt: number;
  goalId: string | null;
  tags: string[];
  completed: boolean;
  priority: "low" | "medium" | "high";
  isArchived: boolean;
  isQuiet: boolean; // Flag for quiet tasks that appear in the Quiet Zone panel
  repeatPattern: RepeatPattern | null;
  completionTimestamp: number | null;
  dependencies?: string[]; // Task IDs that this task depends on
  xp?: number; // Experience points earned for completing this task
  timeSpent?: number; // Time spent on this task in milliseconds
  themeId?: string; // Associated daily theme ID
  description?: string; // Task description or notes
}

export interface RepeatPattern {
  type: "daily" | "weekly" | "monthly" | "custom";
  interval: number;
  endDate?: string;
}

export interface HistoryEntry {
  id: string;
  type: "add" | "complete" | "edit" | "delete" | "archive";
  entityId: string;
  entityType: "task" | "goal";
  timestamp: number;
  details: any;
}

export interface DailyTheme {
  id: string;
  day: string; // "monday", "tuesday", etc., or "weekend"
  name: string;
  description?: string;
  color?: string;
  quote?: string;
  tags: string[]; // Tags that are associated with this theme
}

// Define the user profile data type
export interface UserProfile {
  userId: string;
  displayName?: string;
  customAvatar?: string; // URL or data URI for custom avatar
  avatarIcon?: string; // Icon name or identifier
  dateOfBirth?: string;
  bio?: string;
  location?: string;
  hobbies?: string[];
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  preferences?: {
    theme?: string;
    notificationsEnabled?: boolean;
    [key: string]: any;
  };
  createdAt: number;
  updatedAt: number;
}

// Database singleton
let dbPromise: Promise<IDBPDatabase<AchievoDB>> | null = null;

// Initialize the database
const initDB = async () => {
  if (!dbPromise) {
    try {
      console.log("Initializing database...");

      // First check if indexedDB is available
      if (!window.indexedDB) {
        throw new Error(
          "Your browser doesn't support IndexedDB. Some features may not work."
        );
      }

      // Pre-close any existing connections to avoid blocking
      await closeExistingConnections();

      dbPromise = openDB<AchievoDB>("achievo-db", 1, {
        upgrade(db) {
          console.log("Upgrading database schema...");
          // Create stores if they don't exist
          if (!db.objectStoreNames.contains("goals")) {
            console.log("Creating goals store");
            const goalStore = db.createObjectStore("goals", { keyPath: "id" });
            goalStore.createIndex("by-order", "order");
          }

          if (!db.objectStoreNames.contains("tasks")) {
            console.log("Creating tasks store");
            const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
            taskStore.createIndex("by-goalId", "goalId");
            taskStore.createIndex("by-dueDate", "dueDate");
            taskStore.createIndex("by-completed", "completed");
          }

          if (!db.objectStoreNames.contains("history")) {
            console.log("Creating history store");
            const historyStore = db.createObjectStore("history", {
              keyPath: "id",
            });
            historyStore.createIndex("by-timestamp", "timestamp");
          }

          if (!db.objectStoreNames.contains("dailyThemes")) {
            console.log("Creating daily themes store");
            const dailyThemesStore = db.createObjectStore("dailyThemes", {
              keyPath: "id",
            });
            dailyThemesStore.createIndex("by-day", "day");
          }

          if (!db.objectStoreNames.contains("userProfiles")) {
            console.log("Creating user profiles store");
            db.createObjectStore("userProfiles", { keyPath: "userId" });
          }

          console.log("Database schema upgrade complete");
        },
        blocked() {
          console.warn("Database blocked - another connection is still open");
          // Attempt to close any existing connections
          closeExistingConnections();
        },
        blocking() {
          console.warn("This connection is blocking a database upgrade");
          // Close this connection to allow the upgrade to proceed
          if (dbPromise) {
            dbPromise.then((db) => db.close());
            dbPromise = null;
          }
        },
        terminated(e) {
          console.error("Database connection was terminated unexpectedly", e);
          dbPromise = null; // Reset so we can try again
        },
      });
      console.log("Database initialization complete");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      dbPromise = null;

      // Attempt recovery by deleting and recreating the database
      try {
        await recoverDatabase();
        return initDB(); // Recursively try again
      } catch (recoveryError) {
        console.error("Recovery failed:", recoveryError);
        throw new Error(
          "Database initialization failed and recovery was unsuccessful. Please refresh the page."
        );
      }
    }
  }
  return dbPromise;
};

// Helper function to close existing connections
const closeExistingConnections = async (): Promise<void> => {
  try {
    if (typeof window.indexedDB.databases === "function") {
      const dbs = await window.indexedDB.databases();
      const achievoDB = dbs.find((db) => db.name === "achievo-db");
      if (achievoDB) {
        console.log("Closing existing database connection");
        // We can't directly close it, but we can force-delete and recreate it
        await new Promise<void>((resolve, reject) => {
          try {
            // If we have an existing connection, close it
            if (dbPromise) {
              dbPromise
                .then((db) => {
                  db.close();
                  dbPromise = null;
                  resolve();
                })
                .catch((err) => {
                  console.warn("Could not close existing connection:", err);
                  resolve(); // Continue anyway
                });
            } else {
              resolve();
            }
          } catch (e) {
            console.warn("Error closing connection:", e);
            resolve(); // Continue anyway
          }
        });
      }
    }
  } catch (e) {
    console.warn("Database closing not supported:", e);
  }
};

// Helper function to recover database by deleting and recreating
const recoverDatabase = async (): Promise<void> => {
  try {
    console.log("Attempting database recovery...");
    return new Promise<void>((resolve, reject) => {
      try {
        const deleteRequest = window.indexedDB.deleteDatabase("achievo-db");
        deleteRequest.onsuccess = () => {
          console.log("Database deleted for recovery");
          setTimeout(resolve, 500); // Wait before trying to recreate
        };
        deleteRequest.onerror = (event) => {
          console.error("Could not delete database for recovery:", event);
          reject(new Error("Failed to delete database for recovery"));
        };
      } catch (e) {
        console.error("Error in recovery:", e);
        reject(e);
      }
    });
  } catch (e) {
    throw new Error(
      `Recovery failed: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};

// Database API
export const db = {
  // Goal operations
  async getGoals(): Promise<Goal[]> {
    try {
      const db = await initDB();
      return db.getAllFromIndex("goals", "by-order");
    } catch (error) {
      console.error("Error in getGoals:", error);
      return [];
    }
  },

  async getGoal(id: string): Promise<Goal | undefined> {
    try {
      const db = await initDB();
      return db.get("goals", id);
    } catch (error) {
      console.error(`Error in getGoal(${id}):`, error);
      return undefined;
    }
  },

  async addGoal(goal: Goal): Promise<string> {
    try {
      console.log("Adding goal:", goal);
      const db = await initDB();
      await db.add("goals", goal);
      console.log("Goal added successfully:", goal.id);
      return goal.id;
    } catch (error) {
      console.error("Error in addGoal:", error);
      throw new Error(
        "Failed to add goal: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async updateGoal(goal: Goal): Promise<string> {
    try {
      const db = await initDB();
      await db.put("goals", goal);
      return goal.id;
    } catch (error) {
      console.error("Error in updateGoal:", error);
      throw new Error(
        "Failed to update goal: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async deleteGoal(id: string): Promise<void> {
    try {
      const db = await initDB();
      await db.delete("goals", id);
    } catch (error) {
      console.error(`Error in deleteGoal(${id}):`, error);
      throw new Error(
        "Failed to delete goal: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  // Task operations
  async getTasks(): Promise<Task[]> {
    try {
      const db = await initDB();
      return db.getAll("tasks");
    } catch (error) {
      console.error("Error in getTasks:", error);
      return [];
    }
  },

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    try {
      const db = await initDB();
      return db.getAllFromIndex("tasks", "by-goalId", goalId);
    } catch (error) {
      console.error(`Error in getTasksByGoal(${goalId}):`, error);
      return [];
    }
  },

  async getTask(id: string): Promise<Task | undefined> {
    try {
      const db = await initDB();
      return db.get("tasks", id);
    } catch (error) {
      console.error(`Error in getTask(${id}):`, error);
      return undefined;
    }
  },

  async addTask(task: Task): Promise<string> {
    try {
      console.log("Adding task:", task);
      const db = await initDB();
      await db.add("tasks", task);
      console.log("Task added successfully:", task.id);

      // Update goal's taskIds if the task is assigned to a goal
      if (task.goalId) {
        const goal = await this.getGoal(task.goalId);
        if (goal) {
          goal.taskIds = goal.taskIds || []; // Ensure taskIds exists
          goal.taskIds.push(task.id);
          await this.updateGoal(goal);
        }
      }

      // Add to history
      await this.addHistoryEntry({
        id: crypto.randomUUID(),
        type: "add",
        entityId: task.id,
        entityType: "task",
        timestamp: Date.now(),
        details: { title: task.title },
      });

      return task.id;
    } catch (error) {
      console.error("Error in addTask:", error);
      throw new Error(
        "Failed to add task: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async updateTask(task: Task): Promise<string> {
    try {
      const db = await initDB();
      console.log("DB instance ready for updateTask:", !!db);

      // Get the old task to compare changes
      const oldTask = await this.getTask(task.id);
      if (!oldTask) {
        console.warn("Task not found when updating:", task.id);
      }

      // Ensure the task has all required properties
      const validatedTask: Task = {
        id: task.id,
        title: task.title || "",
        dueDate: task.dueDate,
        suggestedDueDate: task.suggestedDueDate,
        createdAt: task.createdAt,
        goalId: task.goalId,
        tags: Array.isArray(task.tags) ? task.tags : [],
        completed: Boolean(task.completed),
        priority: task.priority || "medium",
        isArchived: Boolean(task.isArchived),
        isQuiet: Boolean(task.isQuiet),
        repeatPattern: task.repeatPattern,
        completionTimestamp: task.completionTimestamp,
        dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
        themeId: task.themeId,
        description: task.description || "",
      };

      console.log("Validated task for update:", validatedTask);

      // Update the task with retry mechanism
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          console.log(`Update attempt ${attempts + 1} for task ${task.id}`);
          await db.put("tasks", validatedTask);
          console.log(`Task ${task.id} updated successfully`);
          break; // Break out of loop if successful
        } catch (error) {
          attempts++;
          console.warn(`Task update attempt ${attempts} failed:`, error);

          if (attempts >= maxAttempts) {
            throw error; // Rethrow if all attempts failed
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 300 * attempts));
        }
      }

      // If goal assignment changed, update both goals
      if (oldTask && oldTask.goalId !== task.goalId) {
        // Remove from old goal
        if (oldTask.goalId) {
          const oldGoal = await this.getGoal(oldTask.goalId);
          if (oldGoal) {
            oldGoal.taskIds = oldGoal.taskIds.filter((id) => id !== task.id);
            await this.updateGoal(oldGoal);
          }
        }

        // Add to new goal
        if (task.goalId) {
          const newGoal = await this.getGoal(task.goalId);
          if (newGoal && !newGoal.taskIds.includes(task.id)) {
            newGoal.taskIds.push(task.id);
            await this.updateGoal(newGoal);
          }
        }
      }

      // Add to history if task was completed
      if (oldTask && !oldTask.completed && task.completed) {
        await this.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: task.id,
          entityType: "task",
          timestamp: Date.now(),
          details: { title: task.title },
        });

        // Update goal streak if task was completed
        if (task.goalId) {
          await this.updateGoalStreakOnTaskCompletion(task.goalId);
        }
      }

      return task.id;
    } catch (error) {
      console.error("Failed to update task:", error);
      throw new Error(
        "Failed to update task: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async deleteTask(id: string): Promise<void> {
    const db = await initDB();
    const task = await this.getTask(id);

    if (task) {
      // Remove task from goal's taskIds
      if (task.goalId) {
        const goal = await this.getGoal(task.goalId);
        if (goal) {
          goal.taskIds = goal.taskIds.filter((taskId) => taskId !== id);
          await this.updateGoal(goal);
        }
      }

      // Add to history
      await this.addHistoryEntry({
        id: crypto.randomUUID(),
        type: "delete",
        entityId: id,
        entityType: "task",
        timestamp: Date.now(),
        details: { title: task.title },
      });

      await db.delete("tasks", id);
    }
  },

  // History operations
  async getHistory(limit: number = 50): Promise<HistoryEntry[]> {
    const db = await initDB();
    return db.getAllFromIndex("history", "by-timestamp", null, limit);
  },

  async addHistoryEntry(entry: HistoryEntry): Promise<string> {
    const db = await initDB();
    await db.add("history", entry);
    return entry.id;
  },

  // Helper methods
  async updateGoalStreakOnTaskCompletion(goalId: string): Promise<void> {
    const goal = await this.getGoal(goalId);
    if (!goal) return;

    const today = new Date().toISOString().split("T")[0];

    // If this is the first task completed today
    if (goal.lastCompletedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      // Check if the last completed date was yesterday to maintain streak
      if (goal.lastCompletedDate === yesterday) {
        goal.streakCounter++;
      } else if (
        goal.lastCompletedDate !== null &&
        goal.lastCompletedDate !== today
      ) {
        // Reset streak if more than a day was missed
        goal.streakCounter = 1;
      } else if (goal.lastCompletedDate === null) {
        // Start streak if this is the first completion ever
        goal.streakCounter = 1;
      }

      goal.lastCompletedDate = today;
      await this.updateGoal(goal);
    }
  },

  // History related methods
  async getHistoryEntriesByEntityId(entityId: string): Promise<HistoryEntry[]> {
    const db = await initDB();
    const allEntries = await db.getAll("history");
    return allEntries.filter((entry) => entry.entityId === entityId);
  },

  async getTasksByTitle(title: string): Promise<Task[]> {
    const db = await initDB();
    const allTasks = await db.getAll("tasks");
    // Case-insensitive search for tasks with similar titles
    return allTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(task.title.toLowerCase())
    );
  },

  // Daily Themes operations
  async getDailyThemes(): Promise<DailyTheme[]> {
    try {
      const db = await initDB();
      return db.getAll("dailyThemes");
    } catch (error) {
      console.error("Error in getDailyThemes:", error);
      return [];
    }
  },

  async getDailyThemeByDay(day: string): Promise<DailyTheme | undefined> {
    try {
      const db = await initDB();
      const index = db.transaction("dailyThemes").store.index("by-day");
      return index.get(day.toLowerCase());
    } catch (error) {
      console.error(`Error in getDailyThemeByDay(${day}):`, error);
      return undefined;
    }
  },

  async addDailyTheme(theme: DailyTheme): Promise<string> {
    try {
      const db = await initDB();
      await db.put("dailyThemes", theme);
      return theme.id;
    } catch (error) {
      console.error("Error in addDailyTheme:", error);
      throw new Error(
        "Failed to add theme: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async updateDailyTheme(theme: DailyTheme): Promise<string> {
    try {
      const db = await initDB();
      await db.put("dailyThemes", theme);
      return theme.id;
    } catch (error) {
      console.error("Error in updateDailyTheme:", error);
      throw new Error(
        "Failed to update theme: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async deleteDailyTheme(id: string): Promise<void> {
    try {
      const db = await initDB();
      await db.delete("dailyThemes", id);
    } catch (error) {
      console.error("Error in deleteDailyTheme:", error);
      throw new Error(
        "Failed to delete theme: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  },

  async createDefaultThemes(): Promise<void> {
    try {
      const defaultThemes: DailyTheme[] = [
        {
          id: crypto.randomUUID(),
          day: "monday",
          name: "Mind & Body",
          description: "Focus on physical and mental well-being",
          color: "#4CAF50", // Green
          quote:
            "Take care of your body. It's the only place you have to live.",
          tags: ["health", "wellness", "exercise", "mindfulness", "meditation"],
        },
        {
          id: crypto.randomUUID(),
          day: "tuesday",
          name: "Work & Career",
          description: "Focus on professional growth and development",
          color: "#2196F3", // Blue
          quote: "The only way to do great work is to love what you do.",
          tags: ["work", "career", "professional", "productivity", "job"],
        },
        {
          id: crypto.randomUUID(),
          day: "wednesday",
          name: "Relationships",
          description: "Focus on building and maintaining relationships",
          color: "#E91E63", // Pink
          quote:
            "The quality of your life is determined by the quality of your relationships.",
          tags: ["family", "friends", "social", "connection", "community"],
        },
        {
          id: crypto.randomUUID(),
          day: "thursday",
          name: "Deep Focus",
          description: "Focus on deep work and complex projects",
          color: "#673AB7", // Deep Purple
          quote: "The ability to focus is the ability to succeed.",
          tags: ["focus", "deep work", "concentration", "project", "creative"],
        },
        {
          id: crypto.randomUUID(),
          day: "friday",
          name: "Side Projects",
          description: "Focus on personal projects and hobbies",
          color: "#FF9800", // Orange
          quote: "Creativity is intelligence having fun.",
          tags: ["hobby", "creative", "project", "personal", "fun"],
        },
        {
          id: crypto.randomUUID(),
          day: "weekend",
          name: "Recharge & Reflect",
          description: "Focus on rest, reflection, and planning",
          color: "#795548", // Brown
          quote: "Rest and reflection produce progress.",
          tags: ["rest", "relax", "reflect", "plan", "recharge"],
        },
      ];

      const db = await initDB();

      // Check if themes already exist
      const existingThemes = await this.getDailyThemes();
      if (existingThemes.length === 0) {
        // Add default themes
        for (const theme of defaultThemes) {
          await db.add("dailyThemes", theme);
        }
        console.log("Default themes created");
      }
    } catch (error) {
      console.error("Error creating default themes:", error);
    }
  },

  // Update createDefaultData to include themes
  async createDefaultData(): Promise<void> {
    try {
      // Check if data already exists
      const existingGoals = await this.getGoals();
      if (existingGoals.length > 0) return;

      // Create some initial goals
      const initialGoals: Goal[] = [
        {
          id: "fitness-goal",
          title: "Get Fit",
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          taskIds: [],
          order: 0,
          streakCounter: 5,
          lastCompletedDate: new Date().toISOString().split("T")[0],
          color: "#4CAF50",
          level: 1,
          xp: 100,
        },
        {
          id: "work-goal",
          title: "Career Growth",
          createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
          taskIds: [],
          order: 1,
          streakCounter: 3,
          lastCompletedDate: new Date().toISOString().split("T")[0],
          color: "#2196F3",
          level: 1,
          xp: 75,
        },
        {
          id: "personal-dev",
          title: "Personal Development",
          createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
          taskIds: [],
          order: 2,
          streakCounter: 2,
          lastCompletedDate: null,
          color: "#9C27B0",
          level: 1,
          xp: 50,
        },
      ];

      // Add goals
      for (const goal of initialGoals) {
        await this.addGoal(goal);
      }

      // Create some initial tasks
      const initialTasks: Task[] = [
        {
          id: "task-1",
          title: "Complete 30-minute workout",
          dueDate: new Date().toISOString().split("T")[0],
          suggestedDueDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          goalId: "fitness-goal",
          tags: ["exercise", "health"],
          completed: true,
          priority: "high",
          isArchived: false,
          isQuiet: false,
          repeatPattern: { type: "daily", interval: 1 },
          completionTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
          xp: 50,
          timeSpent: 30 * 60 * 1000,
        },
        {
          id: "task-2",
          title: "Update resume",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          suggestedDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          goalId: "work-goal",
          tags: ["career", "job"],
          completed: false,
          priority: "medium",
          isArchived: false,
          isQuiet: false,
          repeatPattern: null,
          completionTimestamp: null,
          xp: 75,
        },
        {
          id: "task-3",
          title: "Read a personal development book",
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          suggestedDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
          goalId: "personal-dev",
          tags: ["reading", "learning"],
          completed: false,
          priority: "low",
          isArchived: false,
          isQuiet: false,
          repeatPattern: null,
          completionTimestamp: null,
          xp: 50,
        },
        {
          id: "task-4",
          title: "Research interview questions",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          suggestedDueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
          goalId: "work-goal",
          tags: ["interview", "preparation"],
          completed: false,
          priority: "high",
          isArchived: false,
          isQuiet: false,
          repeatPattern: null,
          completionTimestamp: null,
          dependencies: ["task-2"],
          xp: 100,
        },
        // Additional repeating tasks for testing history
        {
          id: "task-5",
          title: "Meditate for 10 minutes",
          dueDate: new Date().toISOString().split("T")[0],
          suggestedDueDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // Created 60 days ago
          goalId: "personal-dev",
          tags: ["wellbeing", "mindfulness"],
          completed: true,
          priority: "medium",
          isArchived: false,
          isQuiet: false,
          repeatPattern: { type: "daily", interval: 1 },
          completionTimestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, // Completed yesterday
          xp: 30,
        },
        {
          id: "task-6",
          title: "Weekly planning session",
          dueDate: new Date().toISOString().split("T")[0],
          suggestedDueDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // Created 90 days ago
          goalId: "work-goal",
          tags: ["planning", "productivity"],
          completed: false,
          priority: "high",
          isArchived: false,
          isQuiet: false,
          repeatPattern: { type: "weekly", interval: 1 },
          completionTimestamp: null,
          xp: 50,
        },
        {
          id: "task-7",
          title: "Learn a new coding skill",
          dueDate: new Date().toISOString().split("T")[0],
          suggestedDueDate: new Date().toISOString().split("T")[0],
          createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // Created 45 days ago
          goalId: "personal-dev",
          tags: ["coding", "learning"],
          completed: true,
          priority: "medium",
          isArchived: false,
          isQuiet: false,
          repeatPattern: { type: "weekly", interval: 1 },
          completionTimestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // Completed 2 days ago
          xp: 80,
        },
      ];

      // Add tasks
      for (const task of initialTasks) {
        await this.addTask(task);
      }

      // Add some history entries to simulate task completion history
      // This will help demonstrate the streak and history features
      const today = new Date();
      const now = Date.now();

      // Create history for the daily workout task (task-1)
      for (let i = 1; i <= 60; i++) {
        // Skip some days randomly to create realistic completion patterns
        if (i % 4 === 0 || i % 7 === 0) {
          continue; // Skip this day to simulate missed days
        }

        const timestamp = now - i * 24 * 60 * 60 * 1000;
        await this.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: "task-1",
          entityType: "task",
          timestamp: timestamp,
          details: { title: "Complete 30-minute workout" },
        });
      }

      // Create history for meditation task (task-5)
      // Create a good streak recently
      for (let i = 1; i <= 14; i++) {
        const timestamp = now - i * 24 * 60 * 60 * 1000;
        await this.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: "task-5",
          entityType: "task",
          timestamp: timestamp,
          details: { title: "Meditate for 10 minutes" },
        });
      }

      // Add some gaps and then more history
      for (let i = 20; i <= 50; i++) {
        // Create pattern with more gaps
        if (i % 3 === 0 || i % 5 === 0) {
          continue; // Skip to create gaps
        }

        const timestamp = now - i * 24 * 60 * 60 * 1000;
        await this.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: "task-5",
          entityType: "task",
          timestamp: timestamp,
          details: { title: "Meditate for 10 minutes" },
        });
      }

      // Create weekly coding skill task history (task-7)
      for (let i = 1; i <= 6; i++) {
        const timestamp = now - i * 7 * 24 * 60 * 60 * 1000;
        await this.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "complete",
          entityId: "task-7",
          entityType: "task",
          timestamp: timestamp,
          details: { title: "Learn a new coding skill" },
        });
      }

      // Create default themes
      await this.createDefaultThemes();

      console.log("Default data created");
    } catch (error) {
      console.error("Error creating default data:", error);
    }
  },

  /**
   * Clear all data from the database.
   * This is useful for testing and debugging.
   */
  clearAllData: async (): Promise<void> => {
    try {
      const db = await openDB();

      // Clear all stores
      await db.clear("goals");
      await db.clear("tasks");
      await db.clear("history");
      await db.clear("dailyThemes");

      console.log("All data cleared from database");
    } catch (error) {
      console.error("Failed to clear database:", error);
      throw error;
    }
  },

  /**
   * Diagnostic function to check database health
   * Returns information about the database state
   */
  async checkDatabaseHealth(): Promise<{
    healthy: boolean;
    message: string;
    details: any;
  }> {
    try {
      // Check if we can initialize the database
      const db = await initDB();

      // Try to read goals and tasks
      const goals = await db.getAll("goals");
      const tasks = await db.getAll("tasks");

      // Try a simple write operation
      const testTask: Task = {
        id: "test-" + Date.now(),
        title: "Database test task",
        dueDate: null,
        suggestedDueDate: null,
        createdAt: Date.now(),
        goalId: null,
        tags: [],
        completed: false,
        priority: "medium",
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        dependencies: [],
        description: "This is a test task to verify database write operations",
      };

      // Add the test task
      await db.add("tasks", testTask);

      // Verify we can read it back
      const verifyTask = await db.get("tasks", testTask.id);

      // Clean up test task
      if (verifyTask) {
        await db.delete("tasks", testTask.id);
      }

      // Check results
      const healthy = Boolean(verifyTask && verifyTask.id === testTask.id);

      return {
        healthy,
        message: healthy
          ? "Database is operating normally"
          : "Database operations are failing",
        details: {
          goalsCount: goals.length,
          tasksCount: tasks.length,
          testTaskRetrieved: Boolean(verifyTask),
          dbInstance: Boolean(db),
        },
      };
    } catch (error) {
      console.error("Database health check failed:", error);
      return {
        healthy: false,
        message: "Database health check failed with error",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },

  /**
   * Direct update method for tasks that bypasses most error checks
   * This is used as a reliable fallback for task editing
   */
  async directTaskUpdate(task: Task): Promise<boolean> {
    try {
      // Validate required fields
      if (!task.id) {
        throw new Error("Task ID is required");
      }

      console.log(
        "Direct task update for task:",
        task.id,
        "isQuiet:",
        task.isQuiet
      );

      // Open database and update in a single transaction
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("achievo-db", 1);

        request.onerror = () => {
          reject(new Error("Failed to open database"));
        };

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["tasks"], "readwrite");
          const store = transaction.objectStore("tasks");

          // Ensure the task has all required properties with valid values
          const validTask: Task = {
            id: task.id,
            title: task.title || "",
            dueDate: task.dueDate,
            suggestedDueDate: task.suggestedDueDate,
            createdAt: task.createdAt || Date.now(),
            goalId: task.goalId,
            tags: Array.isArray(task.tags) ? task.tags : [],
            completed: Boolean(task.completed),
            priority: task.priority || "medium",
            isArchived: Boolean(task.isArchived),
            isQuiet: Boolean(task.isQuiet), // Explicitly cast to boolean
            repeatPattern: task.repeatPattern || null,
            completionTimestamp: task.completionTimestamp,
            dependencies: Array.isArray(task.dependencies)
              ? task.dependencies
              : [],
            description: task.description || "",
          };

          console.log("Validated task for direct update:", validTask);

          const updateRequest = store.put(validTask);

          updateRequest.onsuccess = () => {
            console.log("Task updated directly:", task.id);
            resolve(true);
          };

          updateRequest.onerror = (error) => {
            console.error("Failed to update task directly:", error);
            reject(new Error("Failed to update task"));
          };

          transaction.oncomplete = () => {
            db.close();
          };
        };
      });
    } catch (error) {
      console.error("Direct task update failed:", error);
      return false;
    }
  },

  // User profile operations
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const db = await initDB();
      return db.get("userProfiles", userId);
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  },

  async createOrUpdateUserProfile(profile: UserProfile): Promise<void> {
    try {
      const db = await initDB();
      profile.updatedAt = Date.now();
      await db.put("userProfiles", profile);
    } catch (error) {
      console.error("Error in createOrUpdateUserProfile:", error);
    }
  },

  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const db = await initDB();
      await db.delete("userProfiles", userId);
    } catch (error) {
      console.error("Error in deleteUserProfile:", error);
    }
  },
};
