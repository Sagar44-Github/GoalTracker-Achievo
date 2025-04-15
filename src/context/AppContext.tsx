import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Goal, Task, HistoryEntry, DailyTheme, db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import {
  applyTaskCompletionXP,
  checkEarnedBadges,
} from "@/lib/gamificationUtils";
import { addPrebuiltData, addInactivityDemoData } from "@/lib/prebuiltData";
import { getInactiveGoals } from "@/lib/goalUtils";

// Define the type for our context
export interface AppContextType {
  goals: (Goal & { stats: any })[];
  tasks: Task[];
  filteredTasks: Task[];
  quietTasks: Task[];
  showQuietPanel: boolean;
  toggleQuietPanel: () => void;
  currentGoalId: string | null;
  isLoading: boolean;
  isDarkMode: boolean;
  isFocusMode: boolean;
  focusTimer: number | null;
  showGamificationView: boolean;

  // Goal inactivity settings and state
  inactivityThreshold: number;
  setInactivityThreshold: (days: number) => void;
  inactiveGoals: Goal[];
  dismissedInactiveGoals: string[];
  goalDismissStatus: boolean;

  // Daily Theme Mode properties and methods
  dailyThemes: DailyTheme[];
  currentDayTheme: DailyTheme | null;
  isDailyThemeModeEnabled: boolean;
  toggleDailyThemeMode: () => void;
  updateDailyTheme: (theme: DailyTheme) => Promise<string>;
  getTasksMatchingCurrentTheme: () => Task[];
  isTaskMatchingCurrentTheme: (task: Task) => boolean;

  // Methods
  setCurrentGoalId: (goalId: string | null) => void;
  setGoalWithLoading: (goalId: string | null) => void;
  createGoal: (title: string) => Promise<string>;
  updateGoal: (goal: Goal) => Promise<string>;
  deleteGoal: (id: string) => Promise<void>;

  createTask: (taskData: Partial<Task>) => Promise<string>;
  updateTask: (task: Task) => Promise<string>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;

  filterTasks: (filter: "all" | "today" | "completed" | "archived") => void;
  executeCommand: (
    command: string
  ) => Promise<{ success: boolean; message: string }>;
  toggleDarkMode: () => void;
  toggleGamificationView: (show?: boolean) => void;
  refreshData: () => Promise<void>;

  // Focus mode methods
  enterFocusMode: () => void;
  exitFocusMode: () => void;

  // New methods
  forceInactivityCheck: () => Promise<Goal[]>;
  deleteAllData: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  toggleShowCompleted: () => void;
  dismissInactiveGoal: (goalId: string) => void;
  undoDismissInactiveGoal: (goalId: string) => void;
  updateInactivityThreshold: (days: number) => void;

  // Task methods
  addTask: (taskData: Partial<Task>) => Promise<string>;

  // New method
  forceCheckBadges: () => Promise<void>;

  // New properties
  filteredGoals: Goal[];
  filterGoals: (filter: "active" | "archived") => void;
  archiveGoal: (id: string) => Promise<void>;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<(Goal & { stats: any })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [quietTasks, setQuietTasks] = useState<Task[]>([]);
  const [showQuietPanel, setShowQuietPanel] = useState(() => {
    try {
      const savedValue = localStorage.getItem("achievo-show-quiet-panel");
      return savedValue === "true";
    } catch (error) {
      console.error("Failed to load quiet panel preference:", error);
      return false;
    }
  });
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const savedMode = localStorage.getItem("achievo-dark-mode");
    return savedMode
      ? savedMode === "true"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Focus mode states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState<number | null>(null);
  const [focusTimerInterval, setFocusTimerInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Gamification view state
  const [showGamificationView, setShowGamificationView] = useState(() => {
    // Initialize from localStorage or default to false
    const savedGamificationState = localStorage.getItem(
      "achievo-gamification-view"
    );
    return savedGamificationState ? savedGamificationState === "true" : false;
  });

  // Error handling for the context
  const [contextError, setContextError] = useState<Error | null>(null);

  // Goal inactivity state
  const [inactivityThreshold, setInactivityThreshold] = useState(() => {
    const savedThreshold = localStorage.getItem("achievo-inactivity-threshold");
    return savedThreshold ? parseInt(savedThreshold, 10) : 10; // Default 10 days
  });
  const [inactiveGoals, setInactiveGoals] = useState<Goal[]>([]);
  const [dismissedInactiveGoals, setDismissedInactiveGoals] = useState<
    string[]
  >([]);
  const [goalDismissStatus, setGoalDismissStatus] = useState(false);

  // Daily Theme Mode properties and methods
  const [dailyThemes, setDailyThemes] = useState<DailyTheme[]>([]);
  const [currentDayTheme, setCurrentDayTheme] = useState<DailyTheme | null>(
    null
  );
  const [isDailyThemeModeEnabled, setIsDailyThemeModeEnabled] = useState(false);

  // New properties
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);

  // Load data when component mounts
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        // Create default goals if none exist
        // await createDefaultGoals(); // This function is not defined yet, using db.createDefaultData() instead

        // Add initial data
        await db.createDefaultData();

        // Load goals and tasks
        await refreshData();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Check for daily theme mode preferences in localStorage
  useEffect(() => {
    const savedThemeMode = localStorage.getItem("achievo-daily-theme-mode");
    if (savedThemeMode) {
      setIsDailyThemeModeEnabled(savedThemeMode === "true");
    }
  }, []);

  // Save daily theme mode preferences to localStorage
  useEffect(() => {
    localStorage.setItem(
      "achievo-daily-theme-mode",
      isDailyThemeModeEnabled.toString()
    );
  }, [isDailyThemeModeEnabled]);

  // Load current day's theme
  useEffect(() => {
    const loadCurrentDayTheme = async () => {
      try {
        const date = new Date();
        const day = date.getDay(); // 0-6, where 0 is Sunday and 6 is Saturday

        let dayName;
        if (day === 0 || day === 6) {
          dayName = "weekend"; // Weekend
        } else {
          // Convert day number to day name
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          dayName = dayNames[day];
        }

        const theme = await db.getDailyThemeByDay(dayName);
        setCurrentDayTheme(theme || null);
      } catch (error) {
        console.error("Failed to load current day theme:", error);
      }
    };

    loadCurrentDayTheme();
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("achievo-dark-mode", isDarkMode.toString());
  }, [isDarkMode]);

  // Persist inactivity threshold to localStorage
  useEffect(() => {
    localStorage.setItem(
      "achievo-inactivity-threshold",
      inactivityThreshold.toString()
    );
  }, [inactivityThreshold]);

  // Check for inactive goals periodically
  useEffect(() => {
    const checkInactiveGoals = async () => {
      try {
        const inactive = await getInactiveGoals(inactivityThreshold);
        // Filter out dismissed goals
        const filteredInactive = inactive.filter(
          (goal) => !dismissedInactiveGoals.includes(goal.id)
        );
        setInactiveGoals(filteredInactive);
      } catch (error) {
        console.error("Failed to check inactive goals:", error);
      }
    };

    // Check when component mounts
    checkInactiveGoals();

    // Set up interval to check periodically (daily)
    const intervalId = setInterval(checkInactiveGoals, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [inactivityThreshold, goals, dismissedInactiveGoals]);

  // Function to refresh data from the database
  const refreshData = async () => {
    try {
      // Load goals
      const loadedGoals = await db.getGoals();

      // Load tasks
      const loadedTasks = await db.getTasks();

      // Load daily themes
      const loadedThemes = await db.getDailyThemes();
      setDailyThemes(loadedThemes);

      // Update current day theme
      const date = new Date();
      const day = date.getDay();
      let dayName;
      if (day === 0 || day === 6) {
        dayName = "weekend";
      } else {
        const dayNames = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        dayName = dayNames[day];
      }

      const currentTheme = loadedThemes.find(
        (theme) => theme.day.toLowerCase() === dayName
      );
      setCurrentDayTheme(currentTheme || null);

      // Calculate stats for each goal
      const goalsWithStats = loadedGoals.map((goal) => {
        const goalTasks = loadedTasks.filter((task) => task.goalId === goal.id);
        const completedTasks = goalTasks.filter((task) => task.completed);

        return {
          ...goal,
          stats: {
            total: goalTasks.length,
            completed: completedTasks.length,
            percentage:
              goalTasks.length > 0
                ? Math.round((completedTasks.length / goalTasks.length) * 100)
                : 0,
            streak: goal.streakCounter || 0,
          },
        };
      });

      setGoals(goalsWithStats);
      setTasks(loadedTasks);

      // Apply current filter
      applyTaskFilter(loadedTasks);

      // Check for inactive goals after data refresh
      const inactive = await getInactiveGoals(inactivityThreshold);
      const filteredInactive = inactive.filter(
        (goal) => !dismissedInactiveGoals.includes(goal.id)
      );
      setInactiveGoals(filteredInactive);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  // Force check for inactive goals - useful after adding demo data
  const forceInactivityCheck = async () => {
    try {
      const inactive = await getInactiveGoals(inactivityThreshold);
      const filteredInactive = inactive.filter(
        (goal) => !dismissedInactiveGoals.includes(goal.id)
      );
      setInactiveGoals(filteredInactive);
      return filteredInactive;
    } catch (error) {
      console.error("Failed to check inactive goals:", error);
      return [];
    }
  };

  // Function to apply task filter
  const applyTaskFilter = (tasksToFilter = tasks, goalId = currentGoalId) => {
    try {
      console.log(`Filtering tasks for goal ${goalId || "all"}`);

      // Get lists of active and archived goal IDs
      const activeGoalIds = goals
        .filter((goal) => !goal.isArchived)
        .map((goal) => goal.id);

      const archivedGoalIds = goals
        .filter((goal) => goal.isArchived === true) // Explicitly check true
        .map((goal) => goal.id);

      console.log(
        `Active goals: ${activeGoalIds.length}, Archived goals: ${archivedGoalIds.length}`
      );

      // First, filter out quiet tasks for the main task list
      const nonQuietTasks = tasksToFilter.filter(
        (task) => task.isQuiet !== true
      );

      const quietTasksList = tasksToFilter.filter(
        (task) =>
          task.isQuiet === true &&
          !task.isArchived &&
          (task.goalId ? activeGoalIds.includes(task.goalId) : true)
      );

      console.log(`Filtered quiet tasks: ${quietTasksList.length}`);

      // Set the quiet tasks
      setQuietTasks(quietTasksList);

      if (goalId) {
        // Filter by specific goal
        setFilteredTasks(
          nonQuietTasks.filter(
            (task) => task.goalId === goalId && !task.isArchived
          )
        );
      } else {
        // Show all non-archived tasks with those from archived goals at the top

        // Get tasks from archived goals
        const tasksFromArchivedGoals: Task[] = [];
        // Get regular tasks
        const regularTasks: Task[] = [];

        // Split tasks into two arrays - KEEP THIS SEPARATION
        for (const task of nonQuietTasks) {
          if (!task.isArchived) {
            if (task.goalId && archivedGoalIds.includes(task.goalId)) {
              tasksFromArchivedGoals.push(task);
            } else if (!task.goalId || activeGoalIds.includes(task.goalId)) {
              regularTasks.push(task);
            }
          }
        }

        console.log(
          `Tasks from archived goals: ${tasksFromArchivedGoals.length}`
        );
        console.log(`Regular tasks: ${regularTasks.length}`);

        // Create prioritized list - archived goal tasks first
        const prioritizedTasks = [...tasksFromArchivedGoals, ...regularTasks];
        console.log(
          `Total tasks after prioritization: ${prioritizedTasks.length}`
        );

        // Set the filtered tasks
        setFilteredTasks(prioritizedTasks);
      }
    } catch (error) {
      console.error("Error applying task filter:", error);
      // Fallback to showing all tasks
      setFilteredTasks(
        tasksToFilter.filter(
          (task) => !task.isArchived && task.isQuiet !== true
        )
      );
      setQuietTasks(
        tasksToFilter.filter(
          (task) => task.isQuiet === true && !task.isArchived
        )
      );
    }
  };

  // Update filtered tasks when tasks or currentGoalId changes
  useEffect(() => {
    // Debounce to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      applyTaskFilter();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [tasks, currentGoalId]);

  // Set current goal with optimized loading state
  const setGoalWithLoading = (goalId: string | null) => {
    // Skip if already on this goal
    if (goalId === currentGoalId) return;

    // Set loading state
    setIsLoading(true);

    // Update the goal with a slight delay to allow the UI to show loading state
    setTimeout(() => {
      setCurrentGoalId(goalId);

      // Apply filter immediately for this goal to reduce perceived delay
      const goalTasks = tasks.filter(
        (task) =>
          !task.isArchived &&
          task.isQuiet !== true &&
          (goalId ? task.goalId === goalId : true)
      );
      setFilteredTasks(goalTasks);

      // End loading state after a short delay
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }, 10);
  };

  // Filter tasks by specific criteria
  const filterTasks = (filter: "all" | "today" | "completed" | "archived") => {
    const today = new Date().toISOString().split("T")[0];

    switch (filter) {
      case "today":
        setFilteredTasks(
          tasks.filter((task) => task.dueDate === today && !task.isArchived)
        );
        break;
      case "completed":
        setFilteredTasks(
          tasks.filter((task) => task.completed && !task.isArchived)
        );
        break;
      case "archived":
        setFilteredTasks(tasks.filter((task) => task.isArchived));
        break;
      case "all":
        // Show all non-archived tasks, including completed ones
        setFilteredTasks(tasks.filter((task) => !task.isArchived));
        break;
    }
  };

  // Goal operations
  const createGoal = async (title: string): Promise<string> => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title,
      createdAt: Date.now(),
      taskIds: [],
      order: goals.length,
      streakCounter: 0,
      lastCompletedDate: null,
      color: generateRandomColor(),
    };

    await db.addGoal(newGoal);
    await refreshData();
    return newGoal.id;
  };

  const updateGoal = async (goal: Goal): Promise<string> => {
    await db.updateGoal(goal);
    await refreshData();
    return goal.id;
  };

  const deleteGoal = async (id: string): Promise<void> => {
    await db.deleteGoal(id);
    await refreshData();
    if (currentGoalId === id) {
      setCurrentGoalId(null);
    }
  };

  // Task operations
  const createTask = async (taskData: Partial<Task>): Promise<string> => {
    try {
      console.log("Creating task with data:", taskData);

      // Make sure isQuiet is a boolean
      const isQuiet = taskData.isQuiet === true;
      console.log("isQuiet value:", isQuiet);

      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || "",
        dueDate: taskData.dueDate || null,
        suggestedDueDate: taskData.suggestedDueDate || null,
        createdAt: Date.now(),
        goalId: taskData.goalId || null,
        tags: taskData.tags || [],
        completed: taskData.completed || false,
        priority: taskData.priority || "medium",
        isArchived: false,
        isQuiet: isQuiet, // Use our processed boolean value
        repeatPattern: taskData.repeatPattern || null,
        completionTimestamp: null,
        dependencies: taskData.dependencies || [],
        description: taskData.description || "",
      };

      console.log("Final task object to create:", newTask);

      const taskId = await db.addTask(newTask);

      // Update the goal's lastActiveDate if it has one
      if (newTask.goalId) {
        const goal = await db.getGoal(newTask.goalId);
        if (goal) {
          await db.updateGoal({
            ...goal,
            lastActiveDate: Date.now(),
          });
        }
      }

      await refreshData();
      return taskId;
    } catch (error) {
      console.error("Error in createTask:", error);
      throw error; // Re-throw the error so it can be caught by the caller
    }
  };

  const updateTask = async (task: Task): Promise<string> => {
    try {
      console.log("Updating task:", task);

      // Get the old task to compare changes
      const oldTask = await db.getTask(task.id);
      if (!oldTask) {
        console.warn(`Task with id ${task.id} not found, will create new`);
      }

      // Make sure isQuiet is explicitly set as a boolean value
      const taskToUpdate = {
        ...task,
        isQuiet: task.isQuiet === true,
      };

      console.log("Task to update with isQuiet value:", taskToUpdate.isQuiet);

      // Validate and clean the task object to ensure all required fields have values
      const validatedTask: Task = {
        id: taskToUpdate.id,
        title: taskToUpdate.title || "",
        dueDate: taskToUpdate.dueDate,
        suggestedDueDate: taskToUpdate.suggestedDueDate,
        createdAt: taskToUpdate.createdAt || Date.now(),
        goalId: taskToUpdate.goalId,
        tags: Array.isArray(taskToUpdate.tags) ? taskToUpdate.tags : [],
        completed: Boolean(taskToUpdate.completed),
        priority: taskToUpdate.priority || "medium",
        isArchived: Boolean(taskToUpdate.isArchived),
        isQuiet: Boolean(taskToUpdate.isQuiet), // Explicitly use Boolean conversion
        repeatPattern: taskToUpdate.repeatPattern || null,
        completionTimestamp: taskToUpdate.completionTimestamp,
        dependencies: Array.isArray(taskToUpdate.dependencies)
          ? taskToUpdate.dependencies
          : [],
        description: taskToUpdate.description || "",
      };

      // Try the standard update method first
      try {
        await db.updateTask(validatedTask);
        console.log("Task updated successfully:", task.id);
      } catch (updateError) {
        console.error(
          "Standard update failed, trying direct method:",
          updateError
        );

        // Use the direct update method as fallback
        const directSuccess = await db.directTaskUpdate(validatedTask);
        if (!directSuccess) {
          throw new Error("Both update methods failed");
        }
      }

      // Update the goal's lastActiveDate if it has one
      if (taskToUpdate.goalId) {
        try {
          const goal = await db.getGoal(taskToUpdate.goalId);
          if (goal) {
            await db.updateGoal({
              ...goal,
              lastActiveDate: Date.now(),
            });
          }
        } catch (goalError) {
          console.warn("Could not update goal lastActiveDate:", goalError);
          // Continue even if goal update fails
        }
      }

      // Add history entry for this update
      try {
        await db.addHistoryEntry({
          id: crypto.randomUUID(),
          type: "edit",
          entityId: taskToUpdate.id,
          entityType: "task",
          timestamp: Date.now(),
          details: { title: taskToUpdate.title },
        });
      } catch (historyError) {
        console.warn("Could not add history entry:", historyError);
        // Continue even if history update fails
      }

      // Refresh data and return
      await refreshData();
      return taskToUpdate.id;
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw new Error(
        `Failed to update task: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const completeTask = async (id: string): Promise<void> => {
    try {
      // Get task with retry logic
      let task: Task | null = null;
      let retries = 0;
      const maxRetries = 3;

      while (!task && retries < maxRetries) {
        try {
          const fetchedTask = await db.getTask(id);
          if (!fetchedTask) {
            throw new Error(`Task not found: ${id}`);
          }
          task = fetchedTask;
        } catch (err) {
          retries++;
          if (retries >= maxRetries) {
            throw err;
          }

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 300 * retries));
        }
      }

      if (!task) {
        toast({
          title: "Error",
          description: "Task not found",
          variant: "destructive",
        });
        return;
      }

      const now = Date.now();
      const isCompleted = !task.completed;

      // Toggle completion status
      const updatedTask: Task = {
        ...task,
        completed: isCompleted,
        completionTimestamp: isCompleted ? now : null,
      };

      // Save to database first - this is the most important operation
      await db.updateTask(updatedTask);

      // Update local state
      setTasks((currentTasks) =>
        currentTasks.map((t) => (t.id === id ? updatedTask : t))
      );

      setFilteredTasks((currentFilteredTasks) =>
        currentFilteredTasks.map((t) => (t.id === id ? updatedTask : t))
      );

      // Add to history
      await db.addHistoryEntry({
        id: crypto.randomUUID(),
        type: "complete",
        entityId: task.id,
        entityType: "task",
        timestamp: now,
        details: { title: task.title, completed: isCompleted },
      });

      // Update the goal's lastActiveDate if it has one
      if (task.goalId) {
        const goal = await db.getGoal(task.goalId);
        if (goal) {
          await db.updateGoal({
            ...goal,
            lastActiveDate: now,
          });

          // If the task is completed, update the goal's streak counter
          if (isCompleted) {
            await db.updateGoalStreakOnTaskCompletion(task.goalId);
          }
        }
      }

      // If the task is completed, apply the gamification effects
      if (isCompleted) {
        try {
          const xpEarned = await applyTaskCompletionXP(task.id);

          // Show a toast notification with XP earned
          toast({
            title: `Task completed!`,
            description: `You earned ${xpEarned} XP for completing "${task.title}"`,
          });
        } catch (error) {
          console.error("Error applying XP:", error);
        }

        // If the task is a repeating task, create the next occurrence
        if (
          task.repeatPattern &&
          (task.repeatPattern.type === "daily" ||
            task.repeatPattern.type === "weekly" ||
            task.repeatPattern.type === "monthly")
        ) {
          // Create the next occurrence in a separate async operation
          setTimeout(async () => {
            try {
              await createNextOccurrence(task as Task, new Date(now));
              // Simple refresh without debouncing
              await refreshData();
            } catch (error) {
              // Silently handle error creating occurrence
            }
          }, 500);
        }
      } else {
        toast({
          title: "Task marked incomplete",
          description: `"${task.title}" has been re-opened`,
        });

        // Refresh data
        await refreshData();
      }
    } catch (error) {
      // Silently handle error
    }
  };

  // Create the next occurrence of a repeating task
  const createNextOccurrence = async (
    task: Task,
    completionDate: Date = new Date()
  ): Promise<void> => {
    if (!task.repeatPattern) {
      return;
    }

    // Create a new task based on the repeat pattern
    let newDueDate: string | null = null;

    // Always use the completion date as the base for calculating the next occurrence
    const currentDate = new Date(completionDate);

    switch (task.repeatPattern.type) {
      case "daily":
        currentDate.setDate(
          currentDate.getDate() + task.repeatPattern.interval
        );
        newDueDate = currentDate.toISOString().split("T")[0];
        break;
      case "weekly":
        currentDate.setDate(
          currentDate.getDate() + 7 * task.repeatPattern.interval
        );
        newDueDate = currentDate.toISOString().split("T")[0];
        break;
      case "monthly":
        currentDate.setMonth(
          currentDate.getMonth() + task.repeatPattern.interval
        );
        newDueDate = currentDate.toISOString().split("T")[0];
        break;
    }

    // Check if the end date has been reached
    if (
      task.repeatPattern.endDate &&
      newDueDate &&
      newDueDate > task.repeatPattern.endDate
    ) {
      return; // Don't create a new occurrence if we've passed the end date
    }

    // Create the next occurrence of this repeating task
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: task.title,
      dueDate: newDueDate,
      suggestedDueDate: newDueDate,
      createdAt: Date.now(),
      goalId: task.goalId,
      tags: task.tags,
      completed: false,
      priority: task.priority,
      isArchived: false,
      isQuiet: task.isQuiet, // Include isQuiet property
      repeatPattern: task.repeatPattern,
      completionTimestamp: null,
      dependencies: task.dependencies || [],
      themeId: task.themeId, // Preserve theme association
      description: task.description, // Maintain the task description
    };

    await db.addTask(newTask);

    // Notify the user about the next occurrence
    toast({
      title: "Repeating Task",
      description: `Next occurrence scheduled for ${newDueDate}`,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await db.deleteTask(id);
    await refreshData();
  };

  const archiveTask = async (id: string): Promise<void> => {
    const task = await db.getTask(id);
    if (task) {
      task.isArchived = true;
      await db.updateTask(task);
      await refreshData();
    }
  };

  // Focus mode functions
  const enterFocusMode = () => {
    // Hide non-priority tasks and select top urgent task
    const urgentTasks = tasks
      .filter((task) => !task.completed && !task.isArchived)
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }

        // Then by due date
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        } else if (a.dueDate) {
          return -1;
        } else if (b.dueDate) {
          return 1;
        }

        // Finally by creation date
        return a.createdAt - b.createdAt;
      });

    // Filter to only show high priority tasks
    setFilteredTasks(urgentTasks.filter((task) => task.priority === "high"));

    // Start a 25-minute timer (1500 seconds)
    setFocusTimer(1500);

    // Update the timer every second
    const interval = setInterval(() => {
      setFocusTimer((prevTimer) => {
        if (prevTimer === null || prevTimer <= 0) {
          // Timer expired, exit focus mode
          if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
          }
          setIsFocusMode(false);

          // Show completion notification
          toast({
            title: "Focus Session Complete!",
            description:
              "25-minute focus session has ended. Take a short break before starting another one.",
          });

          return null;
        }
        return prevTimer - 1;
      });
    }, 1000);

    setFocusTimerInterval(interval);
    setIsFocusMode(true);

    // Add class to document for full-screen styles
    document.documentElement.classList.add("focus-mode");

    // Play a sound to indicate focus mode has started
    try {
      const audio = new Audio("/focus-start.mp3");
      audio.play().catch((e) => console.log("Audio play failed:", e));
    } catch (e) {
      console.log("Audio not supported:", e);
    }
  };

  const exitFocusMode = () => {
    // Clear the focus mode state
    setIsFocusMode(false);
    setFocusTimer(null);

    // Clear interval if running
    if (focusTimerInterval) {
      clearInterval(focusTimerInterval);
    }

    // Show completion notification
    toast({
      title: "Focus mode exited",
      description: "You've exited focus mode",
    });
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (focusTimerInterval) {
        clearInterval(focusTimerInterval);
      }
    };
  }, [focusTimerInterval]);

  // Command execution
  const executeCommand = async (
    command: string
  ): Promise<{ success: boolean; message: string }> => {
    // Focus mode commands
    if (command.trim().toLowerCase() === "go into focus mode") {
      enterFocusMode();
      return {
        success: true,
        message: "Entered focus mode. 25-minute timer started.",
      };
    }

    if (command.trim().toLowerCase() === "exit focus mode") {
      exitFocusMode();
      return { success: true, message: "Focus mode exited." };
    }

    // Simple command parsing for now
    const addMatch = command.match(
      /^add\s+(.+?)(?:\s+by\s+(.+?))?(?:\s+under\s+(.+?))?$/i
    );

    if (addMatch) {
      const title = addMatch[1].trim();
      const dueDate = addMatch[2] ? parseDateExpression(addMatch[2]) : null;
      let goalId: string | null = null;

      if (addMatch[3]) {
        // Find the goal by title
        const goalName = addMatch[3].trim();
        const goal = goals.find(
          (g) => g.title.toLowerCase() === goalName.toLowerCase()
        );
        if (goal) {
          goalId = goal.id;
        }
      } else {
        // Use current goal if selected
        goalId = currentGoalId;
      }

      await createTask({
        title,
        dueDate,
        goalId,
        tags: [],
        priority: "medium",
      });

      return {
        success: true,
        message: `Added task: "${title}"${dueDate ? ` due by ${dueDate}` : ""}${
          goalId ? ` under "${goals.find((g) => g.id === goalId)?.title}"` : ""
        }`,
      };
    }

    return {
      success: false,
      message:
        'Unknown command. Try "add [task] by [date]" or "go into focus mode"',
    };
  };

  // Helper functions
  const generateRandomColor = (): string => {
    const colors = [
      "#4CAF50", // Green
      "#2196F3", // Blue
      "#9C27B0", // Purple
      "#FF5722", // Deep Orange
      "#607D8B", // Blue Grey
      "#795548", // Brown
      "#009688", // Teal
      "#673AB7", // Deep Purple
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const parseDateExpression = (expression: string): string | null => {
    try {
      const today = new Date();

      if (expression.toLowerCase() === "today") {
        return today.toISOString().split("T")[0];
      }

      if (expression.toLowerCase() === "tomorrow") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
      }

      // Try to parse the date
      const date = new Date(expression);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      return null;
    } catch (error) {
      console.error("Failed to parse date expression:", error);
      return null;
    }
  };

  // Toggle gamification view
  const toggleGamificationView = (show?: boolean) => {
    const newState = typeof show === "boolean" ? show : !showGamificationView;
    setShowGamificationView(newState);

    // Persist to localStorage
    localStorage.setItem("achievo-gamification-view", newState.toString());

    // Exit focus mode if entering gamification view
    if (newState === true && isFocusMode) {
      exitFocusMode();
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Function to dismiss an inactive goal alert
  const dismissInactiveGoal = (goalId: string) => {
    setDismissedInactiveGoals((prev) => [...prev, goalId]);
  };

  // Function to undo a dismissed inactive goal
  const undoDismissInactiveGoal = (goalId: string) => {
    setDismissedInactiveGoals((prev) => prev.filter((id) => id !== goalId));
  };

  // Function to update inactivity threshold
  const updateInactivityThreshold = (days: number) => {
    setInactivityThreshold(days);
  };

  // Function to delete all data (for debugging/testing)
  const deleteAllData = async (): Promise<void> => {
    try {
      await db.clearAllData();
      toast({
        title: "Data cleared",
        description: "All application data has been reset",
      });
      await refreshData();
    } catch (error) {
      console.error("Failed to clear data:", error);
      toast({
        title: "Error",
        description: "Failed to clear application data",
        variant: "destructive",
      });
    }
  };

  // Function to reset the database in case of corruption
  const resetDatabase = async (): Promise<void> => {
    try {
      console.log("Attempting to delete database");
      // Delete the entire database
      const deleteRequest = window.indexedDB.deleteDatabase("achievo-db");

      deleteRequest.onsuccess = async () => {
        console.log("Database deleted successfully");
        toast({
          title: "Database Reset",
          description: "Database has been reset. Reloading page...",
        });

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      };

      deleteRequest.onerror = () => {
        console.error("Failed to delete database:", deleteRequest.error);
        toast({
          title: "Error",
          description: "Failed to reset database. Try refreshing the page.",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error("Error resetting database:", error);
      toast({
        title: "Error",
        description: "Failed to reset database. Try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  // Toggle showing completed tasks
  const toggleShowCompleted = () => {
    const showCompleted = !filteredTasks.some((task) => task.completed);

    if (showCompleted) {
      // Show all tasks including completed ones
      setFilteredTasks(
        tasks.filter(
          (task) =>
            (currentGoalId ? task.goalId === currentGoalId : true) &&
            !task.isArchived
        )
      );
    } else {
      // Filter out completed tasks
      setFilteredTasks(
        tasks.filter(
          (task) =>
            (currentGoalId ? task.goalId === currentGoalId : true) &&
            !task.isArchived &&
            !task.completed
        )
      );
    }
  };

  // Force check for badges
  const forceCheckBadges = async (): Promise<void> => {
    try {
      console.log("Force checking badges for all goals...");
      const allGoals = await db.getGoals();
      const allTasks = await db.getTasks();

      for (const goal of allGoals) {
        const goalTasks = allTasks.filter((task) => task.goalId === goal.id);
        const earnedBadges = await checkEarnedBadges(goal.id);

        // Update goal with badges if found
        if (earnedBadges.length > 0) {
          const goalBadges = goal.badges || [];
          let badgesUpdated = false;

          for (const badge of earnedBadges) {
            if (!goalBadges.includes(badge.id)) {
              goalBadges.push(badge.id);
              badgesUpdated = true;

              // Notify user of earned badge
              toast({
                title: "Badge Earned!",
                description: `You earned the "${badge.name}" badge for ${goal.title}!`,
              });
            }
          }

          if (badgesUpdated) {
            await db.updateGoal({
              ...goal,
              badges: goalBadges,
            });
          }
        }
      }

      // Refresh data to reflect changes
      await refreshData();
    } catch (error) {
      console.error("Failed to check badges:", error);
    }
  };

  // Daily Theme Mode methods
  const toggleDailyThemeMode = () => {
    setIsDailyThemeModeEnabled((prev) => !prev);
    localStorage.setItem(
      "achievo-daily-theme-mode",
      (!isDailyThemeModeEnabled).toString()
    );
  };

  const updateDailyTheme = async (theme: DailyTheme): Promise<string> => {
    await db.updateDailyTheme(theme);
    await refreshData();
    return theme.id;
  };

  const getTasksMatchingCurrentTheme = (): Task[] => {
    if (!currentDayTheme || !isDailyThemeModeEnabled) return [];

    return tasks.filter((task) => isTaskMatchingCurrentTheme(task));
  };

  const isTaskMatchingCurrentTheme = (task: Task): boolean => {
    if (!currentDayTheme || !isDailyThemeModeEnabled) return false;

    // Check if the task has a direct themeId match
    if (task.themeId === currentDayTheme.id) return true;

    // Check if any of the task tags match the theme tags
    if (task.tags && task.tags.length > 0 && currentDayTheme.tags) {
      for (const tag of task.tags) {
        if (currentDayTheme.tags.includes(tag.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  };

  // Toggle quiet tasks panel
  const toggleQuietPanel = () => {
    console.log(
      "Toggling quiet panel from",
      showQuietPanel,
      "to",
      !showQuietPanel
    );

    // Update the state
    setShowQuietPanel((prev) => !prev);

    // Save the preference to localStorage
    try {
      localStorage.setItem(
        "achievo-show-quiet-panel",
        (!showQuietPanel).toString()
      );
    } catch (error) {
      console.error("Failed to save quiet panel preference:", error);
    }
  };

  // Filter goals by active/archived state
  const filterGoals = (filter: "active" | "archived") => {
    try {
      console.log(
        `Filtering goals by '${filter}' (total goals: ${goals.length})`
      );

      // Debug log all goals with their isArchived status
      goals.forEach((goal: Goal & { stats: any }) => {
        console.log(
          `Goal: ${goal.title} (ID: ${goal.id}), isArchived: ${goal.isArchived}`
        );
      });

      if (filter === "archived") {
        // Explicitly filter for goals where isArchived is EXACTLY true (not just truthy)
        const archivedGoals = goals.filter(
          (goal: Goal & { stats: any }) => goal.isArchived === true
        );
        console.log(`Found ${archivedGoals.length} archived goals`);

        // Log each archived goal for debugging
        archivedGoals.forEach((goal: Goal & { stats: any }) => {
          console.log(`Archived goal: ${goal.title} (ID: ${goal.id})`);
        });

        // Set the filtered goals
        setFilteredGoals(archivedGoals);
      } else {
        // Show non-archived goals
        const activeGoals = goals.filter(
          (goal: Goal & { stats: any }) => !goal.isArchived
        );
        console.log(`Found ${activeGoals.length} active goals`);
        setFilteredGoals(activeGoals);
      }
    } catch (error) {
      console.error("Error filtering goals:", error);
      // Fallback to showing all goals
      setFilteredGoals(goals);
    }
  };

  // Initially set filtered goals to active goals
  useEffect(() => {
    setFilteredGoals(goals.filter((goal) => !goal.isArchived));
  }, [goals]);

  // Archive goal
  const archiveGoal = async (id: string): Promise<void> => {
    try {
      console.log(`Archiving goal with ID: ${id}`);

      // Get the goal
      const goal = await db.getGoal(id);
      if (!goal) {
        console.error("Goal not found for archiving:", id);
        return;
      }

      console.log(`Found goal to archive: ${goal.title}`);

      // Create a fully updated goal object with isArchived=true
      const updatedGoal: Goal = {
        ...goal,
        isArchived: true,
      };

      console.log("Updating goal in database, setting isArchived to true");
      await db.updateGoal(updatedGoal);
      console.log("Database update successful");

      // Create a history entry
      await db.addHistoryEntry({
        id: crypto.randomUUID(),
        type: "archive",
        entityId: id,
        entityType: "goal",
        timestamp: Date.now(),
        details: { goalTitle: goal.title },
      });

      // If the archived goal was the current goal, set current goal to null
      if (currentGoalId === id) {
        setCurrentGoalId(null);
      }

      // Update goals in memory
      console.log("Updating goals state in memory");
      setGoals((prevGoals) =>
        prevGoals.map((g) => (g.id === id ? { ...g, isArchived: true } : g))
      );

      // Refresh data from database
      console.log("Refreshing data from database");
      await refreshData();

      toast({
        title: "Goal Archived",
        description: `"${goal.title}" has been moved to archives`,
      });

      // Explicitly trigger a filter for archived goals to update UI
      console.log("Explicitly requesting archived goals filter");
      setTimeout(() => {
        filterGoals("archived");
        console.log("Filtered goals state updated for archived goals");
      }, 500);
    } catch (error) {
      console.error("Failed to archive goal:", error);
      toast({
        title: "Error",
        description: "Failed to archive goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Wrap provider value in try-catch to prevent unhandled errors
  let providerValue: AppContextType;
  try {
    providerValue = {
      goals,
      tasks,
      filteredTasks,
      quietTasks,
      showQuietPanel,
      toggleQuietPanel,
      currentGoalId,
      isLoading,
      isDarkMode,
      isFocusMode,
      focusTimer,
      showGamificationView,
      inactivityThreshold,
      setInactivityThreshold,
      inactiveGoals,
      dismissedInactiveGoals,
      goalDismissStatus,
      setCurrentGoalId,
      setGoalWithLoading,
      createGoal,
      updateGoal,
      deleteGoal,
      createTask,
      updateTask,
      completeTask,
      deleteTask,
      archiveTask,
      filterTasks,
      executeCommand,
      toggleDarkMode,
      toggleGamificationView,
      refreshData,
      enterFocusMode,
      exitFocusMode,
      forceInactivityCheck,
      deleteAllData,
      resetDatabase,
      toggleShowCompleted,
      dismissInactiveGoal,
      undoDismissInactiveGoal,
      updateInactivityThreshold,
      addTask: createTask,
      forceCheckBadges,
      dailyThemes,
      currentDayTheme,
      isDailyThemeModeEnabled,
      toggleDailyThemeMode,
      updateDailyTheme,
      getTasksMatchingCurrentTheme,
      isTaskMatchingCurrentTheme,
      filteredGoals,
      filterGoals,
      archiveGoal,
    };
  } catch (error) {
    console.error("Error in AppContext:", error);
    providerValue = {
      goals: [],
      tasks: [],
      filteredTasks: [],
      quietTasks: [],
      showQuietPanel: false,
      toggleQuietPanel: () => {},
      currentGoalId: null,
      isLoading: false,
      isDarkMode: false,
      isFocusMode: false,
      focusTimer: null,
      showGamificationView: false,
      inactivityThreshold: 10,
      setInactivityThreshold: () => {},
      inactiveGoals: [],
      dismissedInactiveGoals: [],
      goalDismissStatus: false,
      setCurrentGoalId: () => {},
      setGoalWithLoading: () => {},
      createGoal: async () => "",
      updateGoal: async () => "",
      deleteGoal: async () => {},
      createTask: async () => "",
      updateTask: async () => "",
      completeTask: async () => {},
      deleteTask: async () => {},
      archiveTask: async () => {},
      filterTasks: () => {},
      executeCommand: async () => ({
        success: false,
        message: "Context error",
      }),
      toggleDarkMode: () => {},
      toggleGamificationView: () => {},
      refreshData: async () => {},
      enterFocusMode: () => {},
      exitFocusMode: () => {},
      forceInactivityCheck: async () => [],
      deleteAllData: async () => {},
      resetDatabase: async () => {},
      toggleShowCompleted: () => {},
      dismissInactiveGoal: () => {},
      undoDismissInactiveGoal: () => {},
      updateInactivityThreshold: () => {},
      addTask: async () => "",
      forceCheckBadges: async () => {},
      dailyThemes: [],
      currentDayTheme: null,
      isDailyThemeModeEnabled: false,
      toggleDailyThemeMode: () => {},
      updateDailyTheme: async () => "",
      getTasksMatchingCurrentTheme: () => [],
      isTaskMatchingCurrentTheme: () => false,
      filteredGoals: [],
      filterGoals: () => {},
      archiveGoal: async () => {},
    };
  }

  // Error handling for the context
  useEffect(() => {
    try {
      // Log any context errors to console
      if (contextError) {
        console.error("AppContext Error:", contextError);
      }
    } catch (err) {
      console.error("Error in error handler:", err);
    }
  }, [contextError]);

  return (
    <AppContext.Provider value={providerValue}>{children}</AppContext.Provider>
  );
};

// Hook to use the AppContext
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    console.warn("useApp must be used within an AppProvider");
  }
  return context;
};
