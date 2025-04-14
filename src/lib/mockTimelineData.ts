import { v4 as uuidv4 } from "uuid";
import { addDays, subDays } from "date-fns";
import { Task, Goal, HistoryEntry } from "./db";

// Tag options for random generation
const TAG_OPTIONS = [
  "work",
  "personal",
  "health",
  "learning",
  "finance",
  "family",
  "friends",
  "home",
  "travel",
  "project",
];

// Mock task titles for random generation
const TASK_TITLES = [
  "Complete project proposal",
  "Review code PR",
  "Finish presentation slides",
  "Research new frameworks",
  "Update documentation",
  "Send weekly report",
  "Schedule team meeting",
  "Call client about requirements",
  "Fix critical bug in production",
  "Implement new feature",
  "Write blog post",
  "Create design mockups",
  "Update portfolio website",
  "Read technical article",
  "Go for a run",
  "Meditate for 15 minutes",
  "Cook healthy dinner",
  "Grocery shopping",
  "Plan weekend activities",
  "Clean apartment",
  "Pay monthly bills",
  "Schedule doctor appointment",
  "Call parents",
  "Respond to important emails",
  "Submit tax documents",
  "Back up computer files",
  "Water plants",
  "Buy birthday gift",
  "Refactor legacy code",
  "Create test cases",
];

// Mock goal data
const MOCK_GOALS: Goal[] = [
  {
    id: "1",
    title: "Health & Wellness",
    description: "Improve physical and mental wellbeing",
    color: "#10b981", // green
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Career Development",
    description: "Enhance skills and advance professionally",
    color: "#3b82f6", // blue
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Personal Projects",
    description: "Work on passion projects and hobbies",
    color: "#8b5cf6", // purple
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Family & Relationships",
    description: "Nurture important relationships",
    color: "#ec4899", // pink
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Financial Freedom",
    description: "Build wealth and financial independence",
    color: "#f59e0b", // amber
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper function to get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random number of items from array
const getRandomItems = <T>(array: T[], max: number): T[] => {
  const count = Math.floor(Math.random() * max) + 1;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate random task for a specific date
const generateRandomTask = (date: Date, completed = true): Task => {
  const goalId = Math.random() > 0.2 ? getRandomItem(MOCK_GOALS).id : null;
  const completionTimestamp = completed ? date.toISOString() : null;

  return {
    id: uuidv4(),
    title: getRandomItem(TASK_TITLES),
    description:
      Math.random() > 0.7 ? "This is a sample task description." : "",
    isCompleted: completed,
    createdAt: subDays(date, Math.floor(Math.random() * 7)).toISOString(),
    updatedAt: date.toISOString(),
    completionTimestamp,
    goalId,
    isArchived: false,
    isQuiet: Math.random() > 0.8,
    dueDate:
      Math.random() > 0.5
        ? addDays(date, Math.floor(Math.random() * 7)).toISOString()
        : null,
    priority: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
    tags: Math.random() > 0.5 ? getRandomItems(TAG_OPTIONS, 3) : [],
    repeat: null,
  };
};

// Generate random history entry for a date
const generateRandomHistoryEntry = (
  date: Date,
  entityId: string
): HistoryEntry => {
  const types = ["add", "edit", "complete"];
  const entityTypes = ["task", "goal"];

  const type = getRandomItem(types);
  const entityType = getRandomItem(entityTypes);

  return {
    id: uuidv4(),
    timestamp: date.toISOString(),
    type,
    entityType,
    entityId,
    details: {
      title: type === "complete" ? "Completed task" : "Some entity title",
      completed: type === "complete" ? true : undefined,
    },
  };
};

// Generate a set of tasks and history entries for the past N days
export const generateMockTimelineData = (days = 30) => {
  const tasks: Task[] = [];
  const history: HistoryEntry[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = subDays(today, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    // Generate more tasks for weekdays, fewer for weekends
    const taskCount = isWeekend
      ? Math.floor(Math.random() * 3)
      : Math.floor(Math.random() * 7) + 1;

    // Generate completed tasks for this day
    for (let j = 0; j < taskCount; j++) {
      const task = generateRandomTask(date);
      tasks.push(task);

      // Add a completion history entry
      if (task.completionTimestamp) {
        history.push({
          id: uuidv4(),
          timestamp: task.completionTimestamp,
          type: "complete",
          entityType: "task",
          entityId: task.id,
          details: {
            title: task.title,
            completed: true,
          },
        });
      }
    }

    // Add some history entries
    const historyEntryCount = Math.floor(Math.random() * 5) + 1;
    for (let j = 0; j < historyEntryCount; j++) {
      const historyEntry = generateRandomHistoryEntry(date, uuidv4());
      history.push(historyEntry);
    }

    // Occasionally add a goal creation event
    if (Math.random() > 0.9) {
      const goal = getRandomItem(MOCK_GOALS);
      history.push({
        id: uuidv4(),
        timestamp: date.toISOString(),
        type: "add",
        entityType: "goal",
        entityId: goal.id,
        details: {
          title: goal.title,
        },
      });
    }
  }

  return {
    tasks,
    history,
    goals: MOCK_GOALS,
  };
};

// Mock database access functions for development and testing
export const mockTimelineDb = {
  getTasks: async (): Promise<Task[]> => {
    const { tasks } = generateMockTimelineData();
    return tasks;
  },
  getHistory: async (limit = 500): Promise<HistoryEntry[]> => {
    const { history } = generateMockTimelineData();
    return history.slice(0, limit);
  },
  getGoals: async (): Promise<Goal[]> => {
    return MOCK_GOALS;
  },
};

// Generate random tasks completed in the past 60 days
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = [];
  const now = new Date();

  // Sample task titles
  const taskTitles = [
    "Complete project proposal",
    "Review code PR",
    "Read chapter 5",
    "Send follow-up email",
    "Update documentation",
    "Exercise for 30 minutes",
    "Meditate for 10 minutes",
    "Plan meals for the week",
    "Call family",
    "Clean the kitchen",
    "Organize desk",
    "Pay bills",
    "Write journal entry",
    "Practice guitar",
    "Learn React hooks",
  ];

  // Generate 100 random completed tasks
  for (let i = 0; i < 100; i++) {
    // Random completion date between today and 60 days ago
    const daysAgo = Math.floor(Math.random() * 60);
    const completedAt = subDays(now, daysAgo);

    // Random creation date before completion
    const createdDaysAgo = daysAgo + Math.floor(Math.random() * 10);
    const createdAt = subDays(now, createdDaysAgo);

    // Random tags
    const tags = [];
    const tagOptions = [
      "work",
      "personal",
      "health",
      "learning",
      "home",
      "urgent",
      "creative",
    ];
    const tagCount = Math.floor(Math.random() * 3);
    for (let j = 0; j < tagCount; j++) {
      const randomTag =
        tagOptions[Math.floor(Math.random() * tagOptions.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }

    // Random goal assignment (some tasks may not have a goal)
    const goalId =
      Math.random() > 0.3
        ? `goal-${Math.floor(Math.random() * 5) + 1}`
        : undefined;

    tasks.push({
      id: `task-${i}`,
      title: taskTitles[Math.floor(Math.random() * taskTitles.length)],
      description:
        Math.random() > 0.7 ? "This is a sample task description." : "",
      createdAt: createdAt.toISOString(),
      updatedAt: createdAt.toISOString(),
      completedAt: completedAt.toISOString(),
      priority: Math.floor(Math.random() * 3),
      goalId,
      tags,
      isQuiet: Math.random() > 0.8,
      isArchived: false,
      repeat: null,
    });
  }

  return tasks;
};

// Generate random history entries for the past 60 days
const generateMockHistory = (): HistoryEntry[] => {
  const history: HistoryEntry[] = [];
  const now = new Date();

  // Milestone entries
  const milestones = [
    "Completed first project milestone",
    "Reached 50 tasks completed",
    "Finished reading a book",
    "Completed workout goal",
    "Learned a new skill",
  ];

  // Notes entries
  const notes = [
    "Today was productive. I managed to complete several important tasks.",
    "Feeling motivated after completing my morning routine.",
    "Need to prioritize better tomorrow.",
    "Great progress on my main project today.",
    "Tired but satisfied with what I accomplished.",
  ];

  // Mood entries
  const moods = ["great", "good", "neutral", "bad", "terrible"];

  // Add milestone entries
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const timestamp = subDays(now, daysAgo).toISOString();

    history.push({
      id: `milestone-${i}`,
      type: "milestone",
      content: milestones[Math.floor(Math.random() * milestones.length)],
      timestamp,
    });
  }

  // Add notes entries
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const timestamp = subDays(now, daysAgo).toISOString();

    history.push({
      id: `note-${i}`,
      type: "note",
      content: notes[Math.floor(Math.random() * notes.length)],
      timestamp,
    });
  }

  // Add mood entries
  for (let i = 0; i < 45; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const timestamp = subDays(now, daysAgo).toISOString();

    history.push({
      id: `mood-${i}`,
      type: "mood",
      content: moods[Math.floor(Math.random() * moods.length)],
      timestamp,
    });
  }

  return history;
};

// Create pre-generated mock data
const mockTasks = generateMockTasks();
const mockHistory = generateMockHistory();

// Mock database API
export const mockTimelineDb = {
  getTasks: async (): Promise<Task[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockTasks;
  },

  getHistory: async (): Promise<HistoryEntry[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockHistory;
  },

  getTasksForDate: async (date: Date): Promise<Task[]> => {
    const dateStr = date.toISOString().split("T")[0];

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return mockTasks.filter((task) => {
      if (!task.completedAt) return false;
      return task.completedAt.startsWith(dateStr);
    });
  },

  getHistoryForDate: async (date: Date): Promise<HistoryEntry[]> => {
    const dateStr = date.toISOString().split("T")[0];

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return mockHistory.filter((entry) => entry.timestamp.startsWith(dateStr));
  },
};
