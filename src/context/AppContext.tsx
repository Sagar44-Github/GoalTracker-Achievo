import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Goal, Task, HistoryEntry, db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { applyTaskCompletionXP } from "@/lib/gamificationUtils";

// Define the type for our context
interface AppContextType {
  goals: (Goal & { stats: any })[];
  filteredTasks: Task[];
  currentGoalId: string | null;
  isLoading: boolean;
  isDarkMode: boolean;
  isFocusMode: boolean;
  focusTimer: number | null;
  showGamificationView: boolean;

  // Methods
  setCurrentGoalId: (goalId: string | null) => void;
  createGoal: (title: string) => Promise<string>;
  updateGoal: (goal: Goal) => Promise<string>;
  deleteGoal: (id: string) => Promise<void>;

  createTask: (task: Partial<Task>) => Promise<string>;
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
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<(Goal & { stats: any })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
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
  const [showGamificationView, setShowGamificationView] = useState(false);

  // Error handling for the context
  const [contextError, setContextError] = useState<Error | null>(null);

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

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("achievo-dark-mode", isDarkMode.toString());
  }, [isDarkMode]);

  // Function to refresh data from the database
  const refreshData = async () => {
    try {
      // Load goals
      const loadedGoals = await db.getGoals();

      // Load tasks
      const loadedTasks = await db.getTasks();

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
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  // Function to apply task filter
  const applyTaskFilter = (tasksToFilter = tasks) => {
    if (currentGoalId) {
      // Filter by current goal
      setFilteredTasks(
        tasksToFilter.filter(
          (task) => task.goalId === currentGoalId && !task.isArchived
        )
      );
    } else {
      // Show all non-archived tasks
      setFilteredTasks(tasksToFilter.filter((task) => !task.isArchived));
    }
  };

  // Update filtered tasks when tasks or currentGoalId changes
  useEffect(() => {
    applyTaskFilter();
  }, [tasks, currentGoalId]);

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
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskData.title || "",
      dueDate: taskData.dueDate || null,
      suggestedDueDate: taskData.suggestedDueDate || null,
      createdAt: Date.now(),
      goalId: taskData.goalId || null,
      tags: taskData.tags || [],
      completed: false,
      priority: taskData.priority || "medium",
      isArchived: false,
      repeatPattern: taskData.repeatPattern || null,
      completionTimestamp: null,
    };

    const taskId = await db.addTask(newTask);
    await refreshData();
    return taskId;
  };

  const updateTask = async (task: Task): Promise<string> => {
    const taskId = await db.updateTask(task);
    await refreshData();
    return taskId;
  };

  const completeTask = async (id: string): Promise<void> => {
    const task = await db.getTask(id);
    if (task) {
      // Check for dependencies if trying to complete the task
      if (
        !task.completed &&
        task.dependencies &&
        task.dependencies.length > 0
      ) {
        const allTasks = await db.getTasks();
        const hasPendingDependencies = task.dependencies.some((depId) => {
          const depTask = allTasks.find((t) => t.id === depId);
          return depTask && !depTask.completed;
        });

        if (hasPendingDependencies) {
          toast({
            title: "Cannot complete task",
            description: "Complete prerequisite tasks first",
            variant: "destructive",
          });
          return;
        }
      }

      task.completed = !task.completed;
      task.completionTimestamp = task.completed ? Date.now() : null;
      await db.updateTask(task);

      // If task was marked as completed and belongs to a goal, apply XP
      if (task.completed && task.goalId) {
        try {
          const result = await applyTaskCompletionXP(task.id);

          // Notify user of XP gained
          if (result.xpEarned > 0) {
            toast({
              title: `+${result.xpEarned} XP`,
              description: "Task completed!",
              variant: "default",
            });
          }

          // Notify user of level up
          if (result.leveledUp && result.newLevel) {
            toast({
              title: `Level Up!`,
              description: `Goal reached level ${result.newLevel}!`,
              variant: "default",
            });
          }

          // Notify user of new badges
          if (result.newBadges.length > 0) {
            for (const badge of result.newBadges) {
              toast({
                title: `New Badge: ${badge.name}`,
                description: badge.description,
                variant: "default",
              });
            }
          }
        } catch (error) {
          console.error("Failed to apply XP for task completion:", error);
        }
      }

      await refreshData();
    }
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
          setFocusMode(false);

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
    setIsFocusMode(false);

    // Clear timer
    if (focusTimerInterval) {
      clearInterval(focusTimerInterval);
      setFocusTimerInterval(null);
    }
    setFocusTimer(null);

    // Remove focus mode class
    document.documentElement.classList.remove("focus-mode");

    // Reset to standard task filtering
    applyTaskFilter();

    // Play a sound to indicate focus mode has ended
    try {
      const audio = new Audio("/focus-end.mp3");
      audio.play().catch((e) => console.log("Audio play failed:", e));
    } catch (e) {
      console.log("Audio not supported:", e);
    }
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
      let goalId = null;

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
    if (typeof show === "boolean") {
      setShowGamificationView(show);
    } else {
      setShowGamificationView((prev) => !prev);
    }

    // Exit focus mode if entering gamification view
    if (show === true && isFocusMode) {
      exitFocusMode();
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Wrap provider value in try-catch to prevent unhandled errors
  let providerValue: AppContextType;
  try {
    providerValue = {
      goals,
      filteredTasks,
      currentGoalId,
      isLoading,
      isDarkMode,
      isFocusMode,
      focusTimer,
      showGamificationView,
      setCurrentGoalId,
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
    };
  } catch (error) {
    // If there's an error creating the provider value, use a safe fallback
    console.error("Error creating context value:", error);
    setContextError(error as Error);

    // Provide a minimal fallback value
    providerValue = {
      goals: [],
      filteredTasks: [],
      currentGoalId: null,
      isLoading: false,
      isDarkMode: false,
      isFocusMode: false,
      focusTimer: null,
      showGamificationView: false,
      setCurrentGoalId: () => {},
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
