import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Task, db } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/taskUtils";
import {
  CheckCircle,
  Circle,
  Edit,
  Trash2,
  Archive,
  MoreHorizontal,
  CalendarDays,
  AlertCircle,
  Tag,
  BarChart2,
  Feather,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TaskRepetitionHistory } from "./TaskRepetitionHistory";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { SimpleEditModal } from "./SimpleEditModal";

interface TaskItemProps {
  task: Task;
}

// Replace the updateTaskDirectly function with a simpler version that uses db.directTaskUpdate
const updateTaskDirectly = async (task: Task): Promise<boolean> => {
  try {
    return await db.directTaskUpdate(task);
  } catch (error) {
    console.error("Direct update failed:", error);
    return false;
  }
};

export function TaskItem({ task }: TaskItemProps) {
  // Get the context safely
  const appContext = useApp();

  // Safely destructure context with defaults
  const goals = appContext?.goals || [];
  const completeTask = appContext?.completeTask || (async () => {});
  const updateTask = appContext?.updateTask || (async () => "");
  const deleteTask = appContext?.deleteTask || (async () => {});
  const archiveTask = appContext?.archiveTask || (async () => {});
  const currentGoalId = appContext?.currentGoalId || null;
  const isFocusMode = appContext?.isFocusMode || false;
  const tasks = Array.isArray(appContext?.tasks) ? appContext.tasks : [];
  const isDailyThemeModeEnabled = appContext?.isDailyThemeModeEnabled || false;
  const currentDayTheme = appContext?.currentDayTheme;
  const isTaskMatchingCurrentTheme =
    appContext?.isTaskMatchingCurrentTheme || (() => false);
  const refreshData = appContext?.refreshData || (async () => {});

  // Check if task belongs to an archived goal
  const isFromArchivedGoal = task.goalId
    ? goals.some((goal) => goal.id === task.goalId && goal.isArchived === true)
    : false;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [showHistory, setShowHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Format due date
  const dueDateText = formatDate(task.dueDate);

  // Update editedTask when task prop changes
  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditedTask(task);
    }
  }, [task, isEditDialogOpen]);

  // Get the goal for this task
  const taskGoal = task.goalId ? goals.find((g) => g.id === task.goalId) : null;

  // Determine priority styling
  const getPriorityColor = () => {
    switch (task.priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-orange-500 dark:text-orange-400";
      case "low":
        return "text-blue-500 dark:text-blue-400";
      default:
        return "";
    }
  };

  // Check if task matches current theme
  const matchesCurrentTheme =
    isDailyThemeModeEnabled && isTaskMatchingCurrentTheme(task);

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (processing) return; // Prevent multiple clicks

    setProcessing(true);

    try {
      // Check if this task has uncompleted dependencies
      if (
        !task.completed &&
        task.dependencies &&
        task.dependencies.length > 0
      ) {
        const hasPendingDependencies = task.dependencies.some((depId) => {
          const depTask = tasks?.find((t) => t.id === depId);
          return depTask && !depTask.completed;
        });

        if (hasPendingDependencies) {
          toast({
            title: "Task blocked",
            description: "Complete prerequisite tasks first",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }
      }

      // Call the completeTask function
      await completeTask(task.id);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      // Try to retry a few times before giving up
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);

        // Wait a moment before retrying
        setTimeout(() => {
          handleComplete(e);
        }, 500 * (retryCount + 1)); // Exponential backoff

        return;
      }

      // Silently handle error
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = () => {
    // Make a fresh copy of the task to edit
    console.log("Opening edit dialog for task:", task);

    // Ensure all properties are properly copied and initialized
    setEditedTask({
      ...task,
      dependencies: task.dependencies || [],
      isQuiet: task.isQuiet || false,
      description: task.description || "",
      tags: task.tags || [],
    });

    setIsEditDialogOpen(true);
    console.log(
      `TaskItem handleEdit: Set isEditDialogOpen to true for task ${task.id}`
    );
    console.log("Edit dialog should now be open");
  };

  const handleSaveEdit = async () => {
    try {
      // Validate required fields
      if (!editedTask.title.trim()) {
        toast({
          title: "Error",
          description: "Task title is required",
          variant: "destructive",
        });
        return;
      }

      // Show loading toast
      toast({
        title: "Saving task...",
        description: "Please wait while your changes are saved",
      });

      // Explicitly handle isQuiet property
      const isQuiet = editedTask.isQuiet === true;
      console.log("Saving task with isQuiet value:", isQuiet);

      // Ensure all properties are properly set
      const taskToSave: Task = {
        ...editedTask,
        // Ensure required properties have proper values
        id: editedTask.id,
        title: editedTask.title.trim(),
        dueDate: editedTask.dueDate,
        suggestedDueDate: editedTask.suggestedDueDate,
        createdAt: editedTask.createdAt,
        goalId: editedTask.goalId,
        completed: editedTask.completed,
        priority: editedTask.priority || "medium",
        isArchived: editedTask.isArchived || false,
        isQuiet: isQuiet,
        repeatPattern: editedTask.repeatPattern || null,
        completionTimestamp: editedTask.completionTimestamp || null,
        dependencies: editedTask.dependencies || [],
        tags: editedTask.tags || [],
      };

      // Try direct database update first - this is more reliable
      try {
        const success = await updateTaskDirectly(taskToSave);

        if (success) {
          // Close dialog first for better UX
          setIsEditDialogOpen(false);

          // Success message
          toast({
            title: "Task updated",
            description: "Your changes have been saved successfully.",
          });

          // Refresh data to show updated tasks
          if (refreshData) {
            setTimeout(() => {
              refreshData();
            }, 100);
          }
        }
      } catch (directError) {
        console.error("Direct update failed:", directError);

        // Fall back to context update method
        try {
          await updateTask(taskToSave);
          setIsEditDialogOpen(false);

          toast({
            title: "Task updated",
            description: "Your changes have been saved successfully.",
          });
        } catch (updateError) {
          console.error("All update methods failed:", updateError);
          toast({
            title: "Error",
            description: "Failed to update task. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setEditedTask({ ...editedTask, tags });
  };

  // Safely change goal assignment with error handling
  const handleGoalChange = (goalId: string) => {
    try {
      // If empty string, set to null (no goal)
      const newGoalId = goalId === "" ? null : goalId;

      setEditedTask({
        ...editedTask,
        goalId: newGoalId,
      });
    } catch (error) {
      console.error("Error changing goal assignment:", error);
      toast({
        title: "Error",
        description: "Failed to change goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await archiveTask(task.id);
      toast({
        title: "Task Archived",
        description: `"${task.title}" has been archived`,
      });
    } catch (error) {
      console.error("Failed to archive task:", error);
      toast({
        title: "Error",
        description: "Failed to archive task",
        variant: "destructive",
      });
    }
  };

  // Add console logging
  console.log("TaskItem rendering, isEditDialogOpen:", isEditDialogOpen);

  // Verify state just before render
  console.log(`TaskItem rendering with isEditDialogOpen = ${isEditDialogOpen}`);

  return (
    <>
      <div
        id={`task-${task.id}`}
        className={cn(
          "flex items-center gap-2 task-item p-2 rounded-md",
          task.completed && "opacity-60",
          matchesCurrentTheme && isDailyThemeModeEnabled && "theme-task",
          isFromArchivedGoal && "bg-muted border-l-2 border-yellow-400"
        )}
        style={
          matchesCurrentTheme && currentDayTheme
            ? {
                borderLeft: `3px solid ${
                  currentDayTheme.color || "var(--border)"
                }`,
                paddingLeft: "8px",
                borderRadius: "4px",
                background: `${currentDayTheme.color}10`, // 10% opacity of theme color
              }
            : undefined
        }
      >
        {/* Delete button */}
        <div className="flex flex-col items-center mr-1">
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (
                window.confirm("Are you sure you want to delete this task?")
              ) {
                deleteTask(task.id);
              }
            }}
            title="Delete task"
          >
            <Trash2 size={12} className="text-destructive" />
          </Button>

          {/* Edit button - directly below delete button */}
          <SimpleEditModal task={task} className="mt-1" />
        </div>

        {/* Checkbox - Make larger in focus mode */}
        <div
          id={`task-checkbox-${task.id}`}
          className={cn(
            "flex-shrink-0 w-4 h-4 rounded-full border-2 border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative -mt-9",
            isFocusMode && "w-5 h-5",
            task.completed && "bg-achievo-purple border-achievo-purple",
            processing && "opacity-50"
          )}
          onClick={handleComplete}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed && (
            <CheckCircle
              size={isFocusMode ? 16 : 14}
              className="text-background"
              strokeWidth={2.5}
            />
          )}
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm",
                  isFocusMode && "text-base font-medium",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {/* Due date */}
                {task.dueDate && (
                  <div className="flex items-center">
                    <CalendarDays size={12} className="mr-1" />
                    {dueDateText}
                  </div>
                )}

                {/* Priority */}
                <div className={cn("flex items-center", getPriorityColor())}>
                  <AlertCircle size={12} className="mr-1" />
                  {task.priority}
                </div>

                {/* Goal - Always show in focus mode */}
                {task.goalId && (
                  <div className="flex items-center">
                    {isFromArchivedGoal ? (
                      <Badge
                        variant="outline"
                        className="px-1.5 text-xs bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300"
                      >
                        <Archive className="h-2.5 w-2.5 mr-1" />
                        {taskGoal?.title || "Archived Goal"}
                      </Badge>
                    ) : (
                      taskGoal?.title
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1 mt-1">
                {task.isQuiet && (
                  <Badge
                    variant="outline"
                    className="px-2 py-0 text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  >
                    <Feather className="h-3 w-3 mr-1" />
                    quiet
                  </Badge>
                )}
                {task.tags.length > 0 && (
                  <>
                    {task.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="px-2 py-0 text-xs"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </>
                )}

                {/* Dependencies indicator */}
                {task.dependencies && task.dependencies.length > 0 && (
                  <Badge
                    variant="outline"
                    className="px-2 py-0 text-xs bg-muted"
                  >
                    {task.dependencies.length}{" "}
                    {task.dependencies.length === 1
                      ? "dependency"
                      : "dependencies"}
                  </Badge>
                )}

                {/* History toggle button for repeating tasks */}
                {task.repeatPattern && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 px-2 ml-auto text-[10px] gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHistory(!showHistory);
                    }}
                  >
                    <BarChart2 size={12} />
                    {showHistory ? "Hide History" : "Show History"}
                  </Button>
                )}
              </div>
            </div>

            {/* Actions - Hide dropdown menu button in focus mode */}
            {!isFocusMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit size={14} className="mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive size={14} className="mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Task Repetition History for repeating tasks */}
      {task.repeatPattern && showHistory && (
        <TaskRepetitionHistory task={task} />
      )}

      {/* Edit Task Dialog - Control visibility solely with the 'open' prop */}
      <Dialog
        key={`edit-dialog-${task.id}`}
        open={isEditDialogOpen}
        // onOpenChange is temporarily removed for debugging
      >
        <DialogContent className="max-w-md task-edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                className={!editedTask.title.trim() ? "border-destructive" : ""}
                placeholder="Enter a task title"
                autoFocus
              />
              {!editedTask.title.trim() && (
                <p className="text-xs text-destructive">Title is required</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="due-date"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedTask.dueDate ? (
                      format(parseISO(editedTask.dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      editedTask.dueDate
                        ? parseISO(editedTask.dueDate)
                        : undefined
                    }
                    onSelect={(date) => {
                      setEditedTask({
                        ...editedTask,
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
                value={editedTask.priority}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    priority: value as "low" | "medium" | "high",
                  })
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
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Select
                value={editedTask.goalId || ""}
                onValueChange={handleGoalChange}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="No goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No goal</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Textarea
                id="tags"
                value={editedTask.tags.join(", ")}
                onChange={handleTagChange}
                placeholder="work, important, project"
              />
            </div>

            {/* Add Repeat Pattern option */}
            <div className="space-y-2">
              <Label htmlFor="repeatPattern">Repeat</Label>
              <Select
                value={
                  editedTask.repeatPattern
                    ? editedTask.repeatPattern.type
                    : "none"
                }
                onValueChange={(value) => {
                  if (value === "none") {
                    setEditedTask({
                      ...editedTask,
                      repeatPattern: null,
                    });
                  } else {
                    setEditedTask({
                      ...editedTask,
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

            {/* Quiet Task Toggle */}
            <div className="flex items-center justify-between space-x-2 pt-4 pb-2 border-t mt-4">
              <div className="space-y-0.5">
                <Label htmlFor="quiet-task" className="flex items-center">
                  <Feather className="h-4 w-4 mr-2 text-amber-500" />
                  Quiet Task
                </Label>
                <p className="text-xs text-muted-foreground">
                  For mindful, low-pressure intentions
                </p>
              </div>
              <Switch
                id="quiet-task"
                checked={editedTask.isQuiet === true}
                onCheckedChange={(checked) => {
                  console.log("Setting isQuiet to:", checked);
                  setEditedTask({
                    ...editedTask,
                    isQuiet: checked,
                    // If it's a quiet task, default to low priority
                    priority: checked ? "low" : editedTask.priority,
                  });
                }}
                className="bg-amber-100 data-[state=checked]:bg-amber-500"
              />
            </div>

            {/* Display Dependencies */}
            {editedTask.dependencies && editedTask.dependencies.length > 0 && (
              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="p-2 border rounded-md space-y-1 max-h-[100px] overflow-y-auto">
                  {editedTask.dependencies.map((depId) => {
                    const depTask = tasks?.find((t) => t.id === depId);
                    return depTask ? (
                      <div
                        key={depId}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm truncate">
                          {depTask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditedTask({
                              ...editedTask,
                              dependencies: editedTask.dependencies!.filter(
                                (id) => id !== depId
                              ),
                            });
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  To add more dependencies, use the Graph View
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="flex-1"
                disabled={!editedTask.title.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
