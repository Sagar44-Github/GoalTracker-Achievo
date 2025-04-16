import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./TaskItem";
import { CommandInput } from "./CommandInput";
import {
  Plus,
  Mic,
  Network,
  Feather,
  Calendar as CalendarIcon,
  List,
  Clock,
  X,
  Archive,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/lib/db";
import {
  suggestTags,
  suggestDueDate,
  parseDateExpression,
} from "@/lib/taskUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraphView } from "./GraphView";
import { QuietTasksPanel } from "./QuietTasksPanel";
import { Switch } from "@/components/ui/switch";
import { TimelineJournalView } from "./TimelineJournalView";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";

// Before declaring it in global scope, check if it's already declared
// Use a different name for the local interface
interface TaskListSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

// Only add to global Window interface if properties don't already exist
declare global {
  interface Window {
    SpeechRecognition?: new () => TaskListSpeechRecognition;
    webkitSpeechRecognition?: new () => TaskListSpeechRecognition;
  }
}

export function TaskList() {
  const {
    goals,
    filteredTasks,
    quietTasks,
    showQuietPanel,
    toggleQuietPanel,
    currentGoalId,
    createTask,
    isFocusMode,
    focusTimer,
    isDailyThemeModeEnabled,
    currentDayTheme,
    getTasksMatchingCurrentTheme,
    tasks,
  } = useApp();

  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    dueDate: null,
    goalId: currentGoalId,
    tags: [],
    priority: "medium",
    repeatPattern: null,
    dependencies: [],
  });
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeView, setActiveView] = useState<"list" | "graph" | "timeline">(
    "list"
  );
  const [showThemeFilteredTasks, setShowThemeFilteredTasks] = useState(false);

  // Speech recognition setup
  const startListening = () => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);

        // Auto-fill the task form with the transcript
        const newTaskData = {
          ...newTask,
          title: transcript,
        };

        // Generate suggested tags
        const tags = suggestTags(transcript);
        setSuggestedTags(tags);
        newTaskData.tags = tags;

        // Attempt to parse a due date
        const dueDateMatch = transcript.match(/(by|on|due)\s+(.+?)(?:\s+|$)/i);
        if (dueDateMatch) {
          const dateExpression = dueDateMatch[2];
          const parsedDate = parseDateExpression(dateExpression);
          if (parsedDate) {
            newTaskData.dueDate = parsedDate;
          }
        }

        setNewTask(newTaskData);
        setIsAddTaskDialogOpen(true);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setNewTask({ ...newTask, title });

    // Generate suggested tags based on title
    if (title.length > 2) {
      const tags = suggestTags(title);
      setSuggestedTags(tags);
    } else {
      setSuggestedTags([]);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!newTask.tags?.includes(tag)) {
      setNewTask({
        ...newTask,
        tags: [...(newTask.tags || []), tag],
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags?.filter((t) => t !== tag) || [],
    });
  };

  const handleAddTask = async () => {
    if (newTask.title?.trim()) {
      try {
        console.log("Creating task:", newTask);
        await createTask({
          ...newTask,
          dependencies: [], // Initialize dependencies as an empty array
          isQuiet: newTask.isQuiet || false, // Ensure isQuiet is properly set
        });

        // Reset form
        setNewTask({
          title: "",
          dueDate: null,
          goalId: currentGoalId,
          tags: [],
          priority: "medium",
          repeatPattern: null,
          dependencies: [], // Reset dependencies
          isQuiet: false, // Reset the quiet flag
        });

        setSuggestedTags([]);
        setIsAddTaskDialogOpen(false);
      } catch (error) {
        console.error("Error creating task:", error);
      }
    }
  };

  // Add a function to check if a task belongs to an archived goal
  const isTaskFromArchivedGoal = (task: Task): boolean => {
    if (!task.goalId) return false;
    const goal = goals.find((g) => g.id === task.goalId);
    return goal?.isArchived === true;
  };

  // Sort tasks: archived goals first, then today's tasks, then future tasks, then past tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First check if tasks are from archived goals - prioritize those
    const aFromArchivedGoal = isTaskFromArchivedGoal(a);
    const bFromArchivedGoal = isTaskFromArchivedGoal(b);

    if (aFromArchivedGoal !== bFromArchivedGoal) {
      return aFromArchivedGoal ? -1 : 1; // Tasks from archived goals first
    }

    // Then by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Get current date (today) normalized to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // Get dates for tasks
    const aDate = a.dueDate ? new Date(a.dueDate) : null;
    const bDate = b.dueDate ? new Date(b.dueDate) : null;

    // Check if dates are today, in future, or in past
    const aIsToday = aDate && aDate.getTime() === todayTime;
    const bIsToday = bDate && bDate.getTime() === todayTime;
    const aIsFuture = aDate && aDate.getTime() > todayTime;
    const bIsFuture = bDate && bDate.getTime() > todayTime;
    const aIsPast = aDate && aDate.getTime() < todayTime;
    const bIsPast = bDate && bDate.getTime() < todayTime;

    // Today's tasks come first
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;

    // Future tasks come before past tasks
    if (aIsFuture && !bIsFuture && !bIsToday) return -1;
    if (!aIsFuture && !aIsToday && bIsFuture) return 1;

    // Past tasks appear in reverse chronological order (most recent first)
    if (aIsPast && bIsPast) {
      return bDate!.getTime() - aDate!.getTime();
    }

    // Future tasks appear in chronological order (nearest first)
    if (aIsFuture && bIsFuture) {
      return aDate!.getTime() - bDate!.getTime();
    }

    // Today's tasks maintained order
    if (aIsToday && bIsToday) {
      // For tasks on the same day, sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority =
        priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority =
        priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
    }

    // Tasks with dates before tasks without dates
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;

    // Then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority =
      priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
    const bPriority =
      priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Finally by creation date (newest first)
    return b.createdAt - a.createdAt;
  });

  // Auto-focus on the first high-priority task when in focus mode
  useEffect(() => {
    if (isFocusMode && sortedTasks.length > 0) {
      // Clear any previous highlights first
      document.querySelectorAll(".focus-highlight").forEach((el) => {
        el.classList.remove("focus-highlight");
      });

      // Set a small timeout to ensure the DOM has updated
      setTimeout(() => {
        // Scroll to the top task
        const topTaskElement = document.getElementById(
          `task-${sortedTasks[0].id}`
        );
        if (topTaskElement) {
          topTaskElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          topTaskElement.classList.add("focus-highlight");
        }
      }, 100);
    }

    return () => {
      // Remove highlight when exiting focus mode
      document.querySelectorAll(".focus-highlight").forEach((el) => {
        el.classList.remove("focus-highlight");
      });
    };
  }, [isFocusMode, sortedTasks]);

  // Get current goal name for header
  const currentGoal = goals.find((goal) => goal.id === currentGoalId);
  const headerText = currentGoalId
    ? `Tasks for ${currentGoal?.title}`
    : "All Tasks";

  // Debug logging for view state
  useEffect(() => {
    console.log("TaskList view state:", {
      activeView,
      currentGoalId,
      hasGoal: !!currentGoalId,
      shouldShowGraph: activeView === "graph" && !!currentGoalId,
    });
  }, [activeView, currentGoalId]);

  // Handle view toggle
  const toggleView = (view: "list" | "graph" | "timeline") => {
    console.log(`Switching to ${view} view`);
    setActiveView(view);
  };

  // Get tasks that match the current theme
  const tasksMatchingTheme = isDailyThemeModeEnabled
    ? getTasksMatchingCurrentTheme()
    : [];

  // Get high priority tasks directly from all tasks when in focus mode
  const focusModeTasksOverride = useMemo(() => {
    if (!isFocusMode) return [];

    // First try high priority tasks
    const highPriority = tasks.filter(
      (task) => task.priority === "high" && !task.completed && !task.isArchived
    );

    console.log(
      "FOCUS MODE EMERGENCY FIX - High priority tasks count:",
      highPriority.length
    );

    // If there are no high priority tasks, fall back to medium priority tasks
    if (highPriority.length === 0) {
      console.log(
        "FOCUS MODE EMERGENCY FIX - No high priority tasks, using medium priority as fallback"
      );
      const mediumPriority = tasks.filter(
        (task) =>
          task.priority === "medium" && !task.completed && !task.isArchived
      );

      if (mediumPriority.length > 0) {
        return mediumPriority;
      }

      // Last resort - just show any incomplete tasks
      console.log(
        "FOCUS MODE EMERGENCY FIX - No medium priority tasks either, showing any incomplete tasks"
      );
      return tasks.filter((task) => !task.completed && !task.isArchived);
    }

    return highPriority;
  }, [isFocusMode, tasks]);

  // Debug what tasks are being displayed in focus mode
  useEffect(() => {
    if (isFocusMode) {
      console.log("FOCUS MODE EMERGENCY - tasks list stats:");
      console.log("All tasks total:", tasks.length);
      console.log(
        "High priority tasks:",
        tasks.filter((t) => t.priority === "high").length
      );
      console.log(
        "Incomplete high priority:",
        tasks.filter((t) => t.priority === "high" && !t.completed).length
      );
      console.log("Focus mode tasks override:", focusModeTasksOverride.length);

      // Check if we have any tasks that should appear
      if (focusModeTasksOverride.length > 0) {
        console.log(
          "Example focus task titles:",
          focusModeTasksOverride.slice(0, 3).map((t) => t.title)
        );
      }
    }
  }, [isFocusMode, tasks, focusModeTasksOverride]);

  // Determine which tasks to display based on focus mode or theme filter
  const displayTasks = isFocusMode
    ? focusModeTasksOverride
    : showThemeFilteredTasks && isDailyThemeModeEnabled
    ? tasksMatchingTheme
    : sortedTasks;

  return (
    <div className="h-full flex flex-col overflow-hidden p-4">
      <div className="flex justify-between items-center mb-4">
        <h1
          className={cn(
            "text-xl font-semibold",
            isFocusMode && "text-2xl text-center w-full"
          )}
        >
          {currentGoalId
            ? goals.find((g) => g.id === currentGoalId)?.title || "Tasks"
            : "All Tasks"}
        </h1>

        {!isFocusMode && (
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/50 p-1 rounded-md">
              <Button
                variant={activeView === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleView("list")}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === "graph" ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleView("graph")}
                title="Graph View"
              >
                <Network className="h-4 w-4" />
              </Button>
              <Button
                variant={activeView === "timeline" ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => toggleView("timeline")}
                title="Timeline Journal"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddTaskDialogOpen(true)}
              className="flex gap-1 items-center"
            >
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </Button>
          </div>
        )}
      </div>

      {/* Theme Quote of the Day */}
      {isDailyThemeModeEnabled && currentDayTheme && currentDayTheme.quote && (
        <div
          className="p-3 rounded-md border italic text-sm"
          style={{
            borderColor: currentDayTheme.color,
            background: `${currentDayTheme.color}10`,
          }}
        >
          "{currentDayTheme.quote}"
        </div>
      )}

      {!isFocusMode && (
        <div className="mt-2">
          <CommandInput />
        </div>
      )}

      {isFocusMode && focusTimer !== null && (
        <div className="text-center py-2 bg-muted/50 rounded-md my-2">
          <span className="font-mono text-2xl">
            {Math.floor(focusTimer / 60)
              .toString()
              .padStart(2, "0")}
            :{(focusTimer % 60).toString().padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto pb-4 px-4">
        {activeView === "list" || !currentGoalId ? (
          <>
            <ul className="space-y-2">
              {displayTasks.map((task) => {
                const fromArchivedGoal = isTaskFromArchivedGoal(task);
                return (
                  <li
                    key={task.id}
                    id={`task-${task.id}`}
                    className={cn(
                      "border rounded-lg shadow-sm",
                      fromArchivedGoal &&
                        "border-amber-300 dark:border-amber-700",
                      isFocusMode &&
                        "bg-achievo-purple/10 border-achievo-purple border-2 p-1 my-4 shadow-md"
                    )}
                  >
                    {fromArchivedGoal && (
                      <div className="bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-xs flex items-center">
                        <Archive className="h-3 w-3 mr-1" />
                        <span>From archived goal</span>
                      </div>
                    )}
                    <TaskItem task={task} />
                  </li>
                );
              })}
              {displayTasks.length === 0 && !isFocusMode && (
                <li className="text-center py-8 text-muted-foreground">
                  No tasks to display
                </li>
              )}

              {displayTasks.length === 0 && isFocusMode && (
                <li className="text-center py-8 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg">
                  <p className="font-bold text-red-600 dark:text-red-400">
                    Focus Mode Issue
                  </p>
                  <p className="text-sm">
                    No high priority tasks found! Try creating a task with high
                    priority.
                  </p>
                  <p className="mt-4 text-xs">
                    Debug info: Total tasks: {tasks.length}, High priority:{" "}
                    {tasks.filter((t) => t.priority === "high").length},
                    Incomplete: {tasks.filter((t) => !t.completed).length}
                  </p>
                </li>
              )}
            </ul>

            {/* Quiet Tasks Panel */}
            <QuietTasksPanel />
          </>
        ) : activeView === "graph" ? (
          <GraphView goalId={currentGoalId || ""} />
        ) : (
          <TimelineJournalView />
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-lg w-[95%] sm:w-full">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task with details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={handleTitleChange}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="dueDate"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? (
                        format(parseISO(newTask.dueDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        newTask.dueDate ? parseISO(newTask.dueDate) : undefined
                      }
                      onSelect={(date) => {
                        setNewTask({
                          ...newTask,
                          dueDate: date ? format(date, "yyyy-MM-dd") : null,
                        });
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: value as any })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalId">Goal</Label>
              <Select
                value={newTask.goalId || "none"}
                onValueChange={(value) =>
                  setNewTask({
                    ...newTask,
                    goalId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="goalId">
                  <SelectValue placeholder="Select a goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Repeat Pattern option */}
            <div className="space-y-2">
              <Label htmlFor="repeatPattern">Repeat</Label>
              <Select
                value={
                  newTask.repeatPattern ? newTask.repeatPattern.type : "none"
                }
                onValueChange={(value) => {
                  if (value === "none") {
                    setNewTask({
                      ...newTask,
                      repeatPattern: null,
                    });
                  } else {
                    setNewTask({
                      ...newTask,
                      repeatPattern: {
                        type: value as
                          | "daily"
                          | "weekly"
                          | "monthly"
                          | "custom",
                        interval: 1,
                      },
                    });
                  }
                }}
              >
                <SelectTrigger id="repeatPattern">
                  <SelectValue placeholder="No repeat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quiet Task toggle */}
            <div className="flex items-center space-x-2 pt-2">
              <div className="flex-1">
                <Label
                  htmlFor="quiet-task-toggle"
                  className="flex items-center cursor-pointer"
                >
                  <Feather className="h-4 w-4 mr-2 text-amber-500" />
                  <span>Quiet Task</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  For mindful, low-pressure intentions
                </p>
              </div>
              <Switch
                id="quiet-task-toggle"
                checked={newTask.isQuiet || false}
                onCheckedChange={(checked) =>
                  setNewTask({
                    ...newTask,
                    isQuiet: checked,
                    priority: checked ? "low" : newTask.priority,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Textarea
                id="tags"
                placeholder="Add tags separated by comma"
                value={newTask.tags?.join(", ")}
                onChange={(e) =>
                  setNewTask({
                    ...newTask,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  })
                }
                className="h-20"
              />

              {/* Tags display */}
              <div className="flex flex-wrap gap-1 mt-2">
                {newTask.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="px-2 py-1">
                    #{tag}
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Suggested tags */}
              {suggestedTags.length > 0 &&
                !newTask.tags?.some((t) => suggestedTags.includes(t)) && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      Suggested tags:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleAddTag(tag)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <Button onClick={handleAddTask} className="w-full">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
