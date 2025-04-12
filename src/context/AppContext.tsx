
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Goal, Task, db } from '@/lib/db';
import { getGoalsWithStatistics, createDefaultGoals } from '@/lib/goalUtils';
import { parseCommand, suggestTags, suggestDueDate } from '@/lib/taskUtils';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  // State
  goals: (Goal & { stats: any })[];
  tasks: Task[];
  currentGoalId: string | null;
  filteredTasks: Task[];
  isLoading: boolean;
  isDarkMode: boolean;
  
  // Goal actions
  setCurrentGoalId: (id: string | null) => void;
  createGoal: (title: string) => Promise<string>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  reorderGoals: (goalIds: string[]) => Promise<void>;
  
  // Task actions
  createTask: (task: Partial<Task>) => Promise<string>;
  updateTask: (task: Task) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  
  // Filters and views
  filterTasks: (filter: string) => void;
  executeCommand: (command: string) => Promise<{ success: boolean, message: string }>;
  
  // Theme
  toggleDarkMode: () => void;
  
  // Voice input
  processSpeechInput: (text: string) => any;
  
  // App state
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  // State
  const [goals, setGoals] = useState<(Goal & { stats: any })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? savedMode === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Initialize app data
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        // Create default goals if none exist
        await createDefaultGoals();
        
        // Load goals and tasks
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initApp();
  }, []);
  
  // Apply dark mode theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);
  
  // Refresh all data
  const refreshData = async () => {
    try {
      // Load goals with statistics
      const loadedGoals = await getGoalsWithStatistics();
      setGoals(loadedGoals);
      
      // If no current goal is selected, select the first one
      if (!currentGoalId && loadedGoals.length > 0) {
        setCurrentGoalId(loadedGoals[0].id);
      }
      
      // Load all tasks
      const loadedTasks = await db.getTasks();
      setTasks(loadedTasks);
      
      // Update filtered tasks
      updateFilteredTasks(loadedTasks, currentGoalId);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };
  
  // Update filtered tasks when tasks or current goal changes
  useEffect(() => {
    updateFilteredTasks(tasks, currentGoalId);
  }, [tasks, currentGoalId]);
  
  // Helper to update filtered tasks
  const updateFilteredTasks = (allTasks: Task[], goalId: string | null) => {
    if (goalId) {
      // Filter by current goal
      setFilteredTasks(allTasks.filter(task => 
        task.goalId === goalId && !task.isArchived
      ));
    } else {
      // Show all non-archived tasks
      setFilteredTasks(allTasks.filter(task => !task.isArchived));
    }
  };
  
  // Filter tasks
  const filterTasks = (filter: string) => {
    let filtered: Task[];
    
    switch(filter) {
      case 'all':
        filtered = tasks.filter(task => !task.isArchived);
        break;
      case 'today':
        const today = new Date().toISOString().split('T')[0];
        filtered = tasks.filter(task => 
          !task.isArchived && task.dueDate === today
        );
        break;
      case 'upcoming':
        const currentDate = new Date().toISOString().split('T')[0];
        filtered = tasks.filter(task => 
          !task.isArchived && 
          task.dueDate && 
          task.dueDate > currentDate
        );
        break;
      case 'completed':
        filtered = tasks.filter(task => task.completed && !task.isArchived);
        break;
      case 'archived':
        filtered = tasks.filter(task => task.isArchived);
        break;
      default:
        if (filter.startsWith('goal:') && filter.length > 5) {
          const goalId = filter.substring(5);
          filtered = tasks.filter(task => 
            !task.isArchived && task.goalId === goalId
          );
        } else if (filter.startsWith('tag:') && filter.length > 4) {
          const tag = filter.substring(4);
          filtered = tasks.filter(task => 
            !task.isArchived && task.tags.includes(tag)
          );
        } else {
          filtered = tasks.filter(task => !task.isArchived);
        }
    }
    
    setFilteredTasks(filtered);
  };
  
  // Goal actions
  const createGoal = async (title: string): Promise<string> => {
    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        title,
        createdAt: Date.now(),
        taskIds: [],
        order: goals.length,
        streakCounter: 0,
        lastCompletedDate: null,
        color: '#9b87f5' // Default purple
      };
      
      const goalId = await db.addGoal(newGoal);
      await refreshData();
      
      toast({
        title: 'Goal Created',
        description: `"${title}" goal has been created successfully.`
      });
      
      return goalId;
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: 'Failed to Create Goal',
        description: 'There was an error creating your goal.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const updateGoal = async (goal: Goal): Promise<void> => {
    try {
      await db.updateGoal(goal);
      await refreshData();
      
      toast({
        title: 'Goal Updated',
        description: `"${goal.title}" has been updated.`
      });
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast({
        title: 'Failed to Update Goal',
        description: 'There was an error updating your goal.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const deleteGoal = async (id: string): Promise<void> => {
    try {
      // Get the goal to be deleted
      const goal = await db.getGoal(id);
      if (!goal) return;
      
      // Get all tasks for this goal
      const goalTasks = await db.getTasksByGoal(id);
      
      // Update each task to no longer be associated with this goal
      for (const task of goalTasks) {
        task.goalId = null;
        await db.updateTask(task);
      }
      
      // Delete the goal
      await db.deleteGoal(id);
      
      // If the deleted goal was the current one, select another one
      if (currentGoalId === id) {
        const remainingGoals = await db.getGoals();
        setCurrentGoalId(remainingGoals.length > 0 ? remainingGoals[0].id : null);
      }
      
      await refreshData();
      
      toast({
        title: 'Goal Deleted',
        description: `"${goal.title}" has been deleted.`
      });
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast({
        title: 'Failed to Delete Goal',
        description: 'There was an error deleting the goal.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const reorderGoals = async (goalIds: string[]): Promise<void> => {
    try {
      // Update order of each goal
      for (let i = 0; i < goalIds.length; i++) {
        const goal = await db.getGoal(goalIds[i]);
        if (goal) {
          goal.order = i;
          await db.updateGoal(goal);
        }
      }
      
      await refreshData();
    } catch (error) {
      console.error('Failed to reorder goals:', error);
      toast({
        title: 'Failed to Reorder Goals',
        description: 'There was an error reordering your goals.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Task actions
  const createTask = async (taskData: Partial<Task>): Promise<string> => {
    try {
      // Generate suggested tags if not provided
      const tags = taskData.tags || suggestTags(taskData.title || '');
      
      // Generate suggested due date if not provided
      const suggestedDueDate = taskData.dueDate || suggestDueDate({
        ...taskData,
        tags
      });
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title || '',
        dueDate: taskData.dueDate || null,
        suggestedDueDate,
        createdAt: Date.now(),
        goalId: taskData.goalId || currentGoalId,
        tags,
        completed: false,
        priority: taskData.priority || 'medium',
        isArchived: false,
        repeatPattern: taskData.repeatPattern || null,
        completionTimestamp: null
      };
      
      const taskId = await db.addTask(newTask);
      await refreshData();
      
      toast({
        title: 'Task Created',
        description: `"${newTask.title}" has been added.`
      });
      
      return taskId;
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: 'Failed to Create Task',
        description: 'There was an error creating your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const updateTask = async (task: Task): Promise<void> => {
    try {
      await db.updateTask(task);
      await refreshData();
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: 'Failed to Update Task',
        description: 'There was an error updating your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const completeTask = async (id: string): Promise<void> => {
    try {
      const task = await db.getTask(id);
      if (!task) return;
      
      // Update task
      task.completed = !task.completed;
      task.completionTimestamp = task.completed ? Date.now() : null;
      
      await db.updateTask(task);
      await refreshData();
      
      if (task.completed) {
        toast({
          title: 'Task Completed',
          description: `"${task.title}" has been marked as complete.`
        });
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast({
        title: 'Failed to Complete Task',
        description: 'There was an error completing your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const deleteTask = async (id: string): Promise<void> => {
    try {
      const task = await db.getTask(id);
      if (!task) return;
      
      await db.deleteTask(id);
      await refreshData();
      
      toast({
        title: 'Task Deleted',
        description: `"${task.title}" has been deleted.`
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: 'Failed to Delete Task',
        description: 'There was an error deleting your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const archiveTask = async (id: string): Promise<void> => {
    try {
      const task = await db.getTask(id);
      if (!task) return;
      
      task.isArchived = true;
      await db.updateTask(task);
      await refreshData();
      
      toast({
        title: 'Task Archived',
        description: `"${task.title}" has been archived.`
      });
    } catch (error) {
      console.error('Failed to archive task:', error);
      toast({
        title: 'Failed to Archive Task',
        description: 'There was an error archiving your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  const unarchiveTask = async (id: string): Promise<void> => {
    try {
      const task = await db.getTask(id);
      if (!task) return;
      
      task.isArchived = false;
      await db.updateTask(task);
      await refreshData();
      
      toast({
        title: 'Task Restored',
        description: `"${task.title}" has been unarchived.`
      });
    } catch (error) {
      console.error('Failed to unarchive task:', error);
      toast({
        title: 'Failed to Unarchive Task',
        description: 'There was an error unarchiving your task.',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Process voice input
  const processSpeechInput = (text: string) => {
    // Use the taskUtils to parse the speech input
    return { text };
  };
  
  // Execute natural language command
  const executeCommand = async (commandText: string): Promise<{ success: boolean, message: string }> => {
    try {
      const command = parseCommand(commandText);
      
      if (!command) {
        return { 
          success: false, 
          message: "I couldn't understand that command. Try 'add', 'complete', 'delete', 'show', or 'move'." 
        };
      }
      
      switch (command.action) {
        case 'add':
          if (!command.title) {
            return { success: false, message: 'Task title is required.' };
          }
          
          // Resolve goal ID if provided
          let goalId = currentGoalId;
          if (command.goalId) {
            const resolvedGoalId = goals.find(g => 
              g.title.toLowerCase() === command.goalId?.toLowerCase() ||
              g.title.toLowerCase().includes(command.goalId?.toLowerCase() || '')
            )?.id;
            
            if (resolvedGoalId) {
              goalId = resolvedGoalId;
            }
          }
          
          await createTask({
            title: command.title,
            dueDate: command.dueDate,
            goalId,
            tags: command.tags,
            priority: command.priority
          });
          
          return { 
            success: true, 
            message: `Added task "${command.title}"${command.dueDate ? ` due ${command.dueDate}` : ''}.` 
          };
          
        case 'complete':
          if (!command.title) {
            return { success: false, message: 'Task title is required.' };
          }
          
          // Find task by title (partial match)
          const taskToComplete = tasks.find(t => 
            t.title.toLowerCase().includes(command.title?.toLowerCase() || '')
          );
          
          if (!taskToComplete) {
            return { success: false, message: `No task found matching "${command.title}".` };
          }
          
          await completeTask(taskToComplete.id);
          return { 
            success: true, 
            message: `Marked "${taskToComplete.title}" as complete.` 
          };
          
        case 'delete':
          if (!command.title) {
            return { success: false, message: 'Task title is required.' };
          }
          
          // Find task by title (partial match)
          const taskToDelete = tasks.find(t => 
            t.title.toLowerCase().includes(command.title?.toLowerCase() || '')
          );
          
          if (!taskToDelete) {
            return { success: false, message: `No task found matching "${command.title}".` };
          }
          
          await deleteTask(taskToDelete.id);
          return { 
            success: true, 
            message: `Deleted task "${taskToDelete.title}".` 
          };
          
        case 'show':
          if (command.goalId) {
            // Find goal by name
            const goal = goals.find(g => 
              g.title.toLowerCase() === command.goalId?.toLowerCase() ||
              g.title.toLowerCase().includes(command.goalId?.toLowerCase() || '')
            );
            
            if (!goal) {
              return { success: false, message: `No goal found matching "${command.goalId}".` };
            }
            
            setCurrentGoalId(goal.id);
            return { 
              success: true, 
              message: `Showing tasks for goal "${goal.title}".` 
            };
          } else if (command.dueDate) {
            // Apply predefined filter
            filterTasks(command.dueDate);
            return { 
              success: true, 
              message: `Showing ${command.dueDate} tasks.` 
            };
          } else {
            // Show all tasks
            filterTasks('all');
            return { success: true, message: 'Showing all tasks.' };
          }
          
        case 'move':
          if (!command.title || !command.goalId) {
            return { 
              success: false, 
              message: 'Both task title and goal name are required for move command.' 
            };
          }
          
          // Find task by title
          const taskToMove = tasks.find(t => 
            t.title.toLowerCase().includes(command.title?.toLowerCase() || '')
          );
          
          if (!taskToMove) {
            return { success: false, message: `No task found matching "${command.title}".` };
          }
          
          // Find goal by name
          const targetGoal = goals.find(g => 
            g.title.toLowerCase() === command.goalId?.toLowerCase() ||
            g.title.toLowerCase().includes(command.goalId?.toLowerCase() || '')
          );
          
          if (!targetGoal) {
            return { success: false, message: `No goal found matching "${command.goalId}".` };
          }
          
          // Update task's goal
          taskToMove.goalId = targetGoal.id;
          await updateTask(taskToMove);
          
          return { 
            success: true, 
            message: `Moved "${taskToMove.title}" to goal "${targetGoal.title}".` 
          };
          
        default:
          return { 
            success: false, 
            message: 'Unknown command. Try "add", "complete", "delete", "show", or "move".' 
          };
      }
    } catch (error) {
      console.error('Failed to execute command:', error);
      return { 
        success: false, 
        message: 'An error occurred while executing your command.' 
      };
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
  const value = {
    // State
    goals,
    tasks,
    currentGoalId,
    filteredTasks,
    isLoading,
    isDarkMode,
    
    // Goal actions
    setCurrentGoalId,
    createGoal,
    updateGoal,
    deleteGoal,
    reorderGoals,
    
    // Task actions
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    
    // Filters and views
    filterTasks,
    executeCommand,
    
    // Theme
    toggleDarkMode,
    
    // Voice input
    processSpeechInput,
    
    // App state
    refreshData
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  
  return context;
}
