import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/db";
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
import { TaskRepetitionHistory } from "./TaskRepetitionHistory";
import { toast } from "@/hooks/use-toast";

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const {
    goals,
    completeTask,
    updateTask,
    deleteTask,
    archiveTask,
    currentGoalId,
    isFocusMode,
    tasks,
  } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [showHistory, setShowHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Format due date
  const dueDateText = formatDate(task.dueDate);

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

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (processing) return; // Prevent multiple clicks

    setProcessing(true);
    console.log(
      "Checkbox clicked for task:",
      task.id,
      "Current status:",
      task.completed
    );

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

      // Simple non-blocking visual feedback
      // Show task as toggled even before the database operation completes
      const localDiv = document.getElementById(`task-checkbox-${task.id}`);
      if (localDiv) {
        if (!task.completed) {
          localDiv.classList.add("bg-achievo-purple", "border-achievo-purple");
        } else {
          localDiv.classList.remove(
            "bg-achievo-purple",
            "border-achievo-purple"
          );
        }
      }

      // Call the completeTask function
      await completeTask(task.id);
      console.log("Task completion toggled successfully");
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error("Error completing task:", error);

      // Try to retry a few times before giving up
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);

        // Wait a moment before retrying
        setTimeout(() => {
          handleComplete(e);
        }, 500 * (retryCount + 1)); // Exponential backoff

        return;
      }

      toast({
        title: "Error",
        description: "Could not complete the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = () => {
    setEditedTask({
      ...task,
      dependencies: task.dependencies || [], // Ensure dependencies is initialized
    });
    setIsEditDialogOpen(true);
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

      // Update the task
      await updateTask(editedTask);

      // Close dialog first for better UX
      setIsEditDialogOpen(false);

      // Success message
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      });
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

  return (
    <>
      <div
        className={cn("flex items-start gap-2", task.completed && "opacity-60")}
      >
        {/* Checkbox - Make larger in focus mode */}
        <div
          id={`task-checkbox-${task.id}`}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
            isFocusMode && "w-6 h-6",
            task.completed && "bg-achievo-purple border-achievo-purple",
            processing && "opacity-50"
          )}
          onClick={handleComplete}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? (
            <CheckCircle
              size={isFocusMode ? 18 : 14}
              className="text-background"
            />
          ) : (
            <Circle
              size={isFocusMode ? 18 : 14}
              className="text-muted-foreground"
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
                {task.goalId &&
                  (task.goalId !== currentGoalId || isFocusMode) && (
                    <div className="flex items-center">
                      {goals.find((g) => g.id === task.goalId)?.title}
                    </div>
                  )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1 mt-1">
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
                  <DropdownMenuItem onClick={() => archiveTask(task.id)}>
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

      {/* Edit Task Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          // If closing dialog, check if there are unsaved changes
          if (!open && JSON.stringify(task) !== JSON.stringify(editedTask)) {
            // Check if this is intentional
            const confirmed = window.confirm(
              "You have unsaved changes. Are you sure you want to close?"
            );
            if (!confirmed) {
              return;
            }
          }
          setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-md">
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
              <Input
                type="date"
                id="due-date"
                value={editedTask.dueDate || ""}
                onChange={(e) =>
                  setEditedTask({
                    ...editedTask,
                    dueDate: e.target.value || null,
                  })
                }
              />
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
