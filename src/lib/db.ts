
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Define the database schema
export interface AchievoDB extends DBSchema {
  goals: {
    key: string;
    value: Goal;
    indexes: { 'by-order': number };
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-goalId': string; 'by-dueDate': string; 'by-completed': boolean };
  };
  history: {
    key: string;
    value: HistoryEntry;
    indexes: { 'by-timestamp': number };
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
  priority: 'low' | 'medium' | 'high';
  isArchived: boolean;
  repeatPattern: RepeatPattern | null;
  completionTimestamp: number | null;
}

export interface RepeatPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  endDate?: string;
}

export interface HistoryEntry {
  id: string;
  type: 'add' | 'complete' | 'edit' | 'delete' | 'archive';
  entityId: string;
  entityType: 'task' | 'goal';
  timestamp: number;
  details: any;
}

// Database singleton
let dbPromise: Promise<IDBPDatabase<AchievoDB>> | null = null;

// Initialize the database
const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<AchievoDB>('achievo-db', 1, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('goals')) {
          const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
          goalStore.createIndex('by-order', 'order');
        }

        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-goalId', 'goalId');
          taskStore.createIndex('by-dueDate', 'dueDate');
          taskStore.createIndex('by-completed', 'completed');
        }

        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
};

// Database API
export const db = {
  // Goal operations
  async getGoals(): Promise<Goal[]> {
    const db = await initDB();
    return db.getAllFromIndex('goals', 'by-order');
  },

  async getGoal(id: string): Promise<Goal | undefined> {
    const db = await initDB();
    return db.get('goals', id);
  },

  async addGoal(goal: Goal): Promise<string> {
    const db = await initDB();
    await db.add('goals', goal);
    return goal.id;
  },

  async updateGoal(goal: Goal): Promise<string> {
    const db = await initDB();
    await db.put('goals', goal);
    return goal.id;
  },

  async deleteGoal(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('goals', id);
  },

  // Task operations
  async getTasks(): Promise<Task[]> {
    const db = await initDB();
    return db.getAll('tasks');
  },

  async getTasksByGoal(goalId: string): Promise<Task[]> {
    const db = await initDB();
    return db.getAllFromIndex('tasks', 'by-goalId', goalId);
  },

  async getTask(id: string): Promise<Task | undefined> {
    const db = await initDB();
    return db.get('tasks', id);
  },

  async addTask(task: Task): Promise<string> {
    const db = await initDB();
    await db.add('tasks', task);

    // Update goal's taskIds if the task is assigned to a goal
    if (task.goalId) {
      const goal = await this.getGoal(task.goalId);
      if (goal) {
        goal.taskIds.push(task.id);
        await this.updateGoal(goal);
      }
    }

    // Add to history
    await this.addHistoryEntry({
      id: crypto.randomUUID(),
      type: 'add',
      entityId: task.id,
      entityType: 'task',
      timestamp: Date.now(),
      details: { title: task.title }
    });

    return task.id;
  },

  async updateTask(task: Task): Promise<string> {
    const db = await initDB();
    
    // Get the old task to compare changes
    const oldTask = await this.getTask(task.id);
    
    // Update the task
    await db.put('tasks', task);
    
    // If goal assignment changed, update both goals
    if (oldTask && oldTask.goalId !== task.goalId) {
      // Remove from old goal
      if (oldTask.goalId) {
        const oldGoal = await this.getGoal(oldTask.goalId);
        if (oldGoal) {
          oldGoal.taskIds = oldGoal.taskIds.filter(id => id !== task.id);
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
        type: 'complete',
        entityId: task.id,
        entityType: 'task',
        timestamp: Date.now(),
        details: { title: task.title }
      });
      
      // Update goal streak if task was completed
      if (task.goalId) {
        await this.updateGoalStreakOnTaskCompletion(task.goalId);
      }
    }
    
    return task.id;
  },

  async deleteTask(id: string): Promise<void> {
    const db = await initDB();
    const task = await this.getTask(id);
    
    if (task) {
      // Remove task from goal's taskIds
      if (task.goalId) {
        const goal = await this.getGoal(task.goalId);
        if (goal) {
          goal.taskIds = goal.taskIds.filter(taskId => taskId !== id);
          await this.updateGoal(goal);
        }
      }
      
      // Add to history
      await this.addHistoryEntry({
        id: crypto.randomUUID(),
        type: 'delete',
        entityId: id,
        entityType: 'task',
        timestamp: Date.now(),
        details: { title: task.title }
      });
      
      await db.delete('tasks', id);
    }
  },

  // History operations
  async getHistory(limit: number = 50): Promise<HistoryEntry[]> {
    const db = await initDB();
    return db.getAllFromIndex('history', 'by-timestamp', null, limit);
  },

  async addHistoryEntry(entry: HistoryEntry): Promise<string> {
    const db = await initDB();
    await db.add('history', entry);
    return entry.id;
  },

  // Helper methods
  async updateGoalStreakOnTaskCompletion(goalId: string): Promise<void> {
    const goal = await this.getGoal(goalId);
    if (!goal) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // If this is the first task completed today
    if (goal.lastCompletedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Check if the last completed date was yesterday to maintain streak
      if (goal.lastCompletedDate === yesterday) {
        goal.streakCounter++;
      } else if (goal.lastCompletedDate !== null && goal.lastCompletedDate !== today) {
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

  async createDefaultData(): Promise<void> {
    // Check if data already exists
    const existingGoals = await this.getGoals();
    if (existingGoals.length > 0) return;

    // Create some initial goals
    const initialGoals: Goal[] = [
      {
        id: 'fitness-goal',
        title: 'Get Fit',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
        taskIds: [],
        order: 0,
        streakCounter: 5,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        color: '#4CAF50'
      },
      {
        id: 'work-goal',
        title: 'Career Growth',
        createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
        taskIds: [],
        order: 1,
        streakCounter: 3,
        lastCompletedDate: new Date().toISOString().split('T')[0],
        color: '#2196F3'
      },
      {
        id: 'personal-dev',
        title: 'Personal Development',
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        taskIds: [],
        order: 2,
        streakCounter: 2,
        lastCompletedDate: null,
        color: '#9C27B0'
      }
    ];

    // Add goals
    for (const goal of initialGoals) {
      await this.addGoal(goal);
    }

    // Create some initial tasks
    const initialTasks: Task[] = [
      {
        id: 'task-1',
        title: 'Complete 30-minute workout',
        dueDate: new Date().toISOString().split('T')[0],
        suggestedDueDate: new Date().toISOString().split('T')[0],
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        goalId: 'fitness-goal',
        tags: ['exercise', 'health'],
        completed: true,
        priority: 'high',
        isArchived: false,
        repeatPattern: { type: 'daily', interval: 1 },
        completionTimestamp: Date.now() - 4 * 24 * 60 * 60 * 1000
      },
      {
        id: 'task-2',
        title: 'Update resume',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        goalId: 'work-goal',
        tags: ['career', 'job'],
        completed: false,
        priority: 'medium',
        isArchived: false,
        repeatPattern: null,
        completionTimestamp: null
      },
      {
        id: 'task-3',
        title: 'Read a personal development book',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        suggestedDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
        goalId: 'personal-dev',
        tags: ['reading', 'learning'],
        completed: false,
        priority: 'low',
        isArchived: false,
        repeatPattern: null,
        completionTimestamp: null
      }
    ];

    // Add tasks
    for (const task of initialTasks) {
      await this.addTask(task);
    }
  }
};
