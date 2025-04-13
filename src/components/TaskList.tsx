import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./TaskItem";
import { CommandInput } from "./CommandInput";
import { Plus, Mic, Network } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

// Define the SpeechRecognition type to avoid TypeScript errors
interface SpeechRecognition extends EventTarget {
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

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function TaskList() {
  const {
    goals,
    filteredTasks,
    currentGoalId,
    createTask,
    isFocusMode,
    focusTimer,
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
  const [activeView, setActiveView] = useState<"list" | "graph">("list");

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
      await createTask({
        ...newTask,
        dependencies: [], // Initialize dependencies as an empty array
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
      });

      setSuggestedTags([]);
      setIsAddTaskDialogOpen(false);
    }
  };

  // Sort tasks: incomplete first, then by priority, then by due date, then by creation date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by completion status
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Then by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority =
      priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
    const bPriority =
      priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Then by due date (if available)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }

    // Finally by creation date (newest first)
    return b.createdAt - a.createdAt;
  });

  // Auto-focus on the first high-priority task when in focus mode
  useEffect(() => {
    if (isFocusMode && sortedTasks.length > 0) {
      // Scroll to the top task
      const topTaskElement = document.getElementById(
        `task-${sortedTasks[0].id}`
      );
      if (topTaskElement) {
        topTaskElement.scrollIntoView({ behavior: "smooth", block: "center" });
        topTaskElement.classList.add("focus-highlight");
      }
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
  const toggleView = (view: "list" | "graph") => {
    console.log(`Switching to ${view} view`);
    setActiveView(view);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="border-b p-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{headerText}</h1>
          {/* Focus Mode Timer Display */}
          {isFocusMode && focusTimer !== null && (
            <div className="text-xl font-bold">
              {Math.floor(focusTimer / 60)}:
              {(focusTimer % 60).toString().padStart(2, "0")}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isFocusMode && (
            <>
              {currentGoalId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toggleView(activeView === "list" ? "graph" : "list")
                  }
                >
                  <Network size={16} className="mr-1" />
                  {activeView === "list" ? "Graph View" : "List View"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddTaskDialogOpen(true)}
              >
                <Plus size={16} className="mr-1" />
                Add Task
              </Button>
              <Button variant="outline" size="icon" onClick={startListening}>
                <Mic size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Command input for quick add */}
      <CommandInput />

      {/* View selector */}
      {!isFocusMode && currentGoalId && (
        <div className="border-b px-3 py-2">
          <Tabs
            value={activeView}
            onValueChange={(v) => toggleView(v as "list" | "graph")}
            className="w-full"
          >
            <TabsList className="grid w-60 grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="graph">Graph View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Main content - either list or graph */}
      <div className="flex-1 overflow-auto">
        {activeView === "list" || !currentGoalId ? (
          <ul className="space-y-2 p-3">
            {sortedTasks.map((task) => (
              <li key={task.id} className="border rounded-lg shadow-sm">
                <TaskItem task={task} />
              </li>
            ))}
            {sortedTasks.length === 0 && (
              <li className="text-center py-8 text-muted-foreground">
                No tasks to display
              </li>
            )}
          </ul>
        ) : (
          <div
            id="graph-container"
            className="h-full w-full"
            style={{ height: "calc(100vh - 160px)" }}
          >
            <GraphView goalId={currentGoalId} />
          </div>
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
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate || ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
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
