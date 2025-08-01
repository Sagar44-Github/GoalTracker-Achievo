import { useState } from "react";
import { Task, db } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/taskUtils";
import {
  CheckCircle,
  Circle,
  Edit,
  AlertCircle,
  CalendarDays,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { SimpleEditModal } from "./SimpleEditModal";

interface GoalTaskItemProps {
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

export function GoalTaskItem({ task }: GoalTaskItemProps) {
  // Add default values for task if it's undefined
  const safeTask: Task = task || {
    id: "",
    title: "",
    completed: false,
    createdAt: Date.now(),
    priority: "medium",
    tags: [],
    isArchived: false,
    dueDate: null,
    repeatPattern: null,
    completionTimestamp: null,
    goalId: null,
  };

  const appContext = useApp();
  // Handle possible undefined context
  const completeTask = appContext?.completeTask || (async () => {});
  const updateTask = appContext?.updateTask || (async () => "");
  const deleteTask = appContext?.deleteTask || (async () => {});
  const goals = appContext?.goals || [];

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>({ ...safeTask });

  // Format due date
  const dueDateText = formatDate(safeTask.dueDate);

  // Determine priority styling
  const getPriorityColor = () => {
    switch (safeTask?.priority) {
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

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (safeTask?.id) {
      completeTask(safeTask.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTask({ ...safeTask });
    setIsEditDialogOpen(true);
    console.log(
      `GoalTaskItem handleEdit: Set isEditDialogOpen to true for task ${safeTask.id}`
    );
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

      // Ensure all properties are properly set
      const taskToSave: Task = {
        ...editedTask,
        // Ensure required properties have proper values
        id: editedTask.id,
        title: editedTask.title.trim(),
        dueDate: editedTask.dueDate,
        createdAt: editedTask.createdAt,
        goalId: editedTask.goalId,
        completed: editedTask.completed,
        priority: editedTask.priority || "medium",
        isArchived: editedTask.isArchived || false,
        repeatPattern: editedTask.repeatPattern || null,
        completionTimestamp: editedTask.completionTimestamp || null,
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

          // Refresh data if available
          if (appContext?.refreshData) {
            setTimeout(() => {
              appContext.refreshData();
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
    setEditedTask({ ...editedTask, tags: tags || [] });
  };

  // Add console logging
  console.log("GoalTaskItem rendering, isEditDialogOpen:", isEditDialogOpen);

  // Verify state just before render
  console.log(
    `GoalTaskItem rendering with isEditDialogOpen = ${isEditDialogOpen}`
  );

  return (
    <>
      <div
        className={cn(
          "flex items-center p-2 rounded-md border border-border hover:bg-muted/50",
          safeTask.completed && "opacity-60"
        )}
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
                deleteTask(safeTask.id);
              }
            }}
            title="Delete task"
          >
            <Trash2 size={12} className="text-destructive" />
          </Button>

          {/* Edit button - directly below delete button */}
          <SimpleEditModal task={safeTask} className="mt-1" />
        </div>

        {/* Checkbox */}
        <button
          className={cn(
            "flex-shrink-0 w-4 h-4 rounded-full border-2 border-muted-foreground flex items-center justify-center mr-2 relative -mt-0.5",
            safeTask.completed && "bg-achievo-purple border-achievo-purple"
          )}
          onClick={handleComplete}
          title={safeTask.completed ? "Mark as incomplete" : "Mark as complete"}
          aria-label={
            safeTask.completed ? "Mark as incomplete" : "Mark as complete"
          }
        >
          {safeTask.completed && (
            <CheckCircle
              size={14}
              className="text-background"
              strokeWidth={2.5}
            />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              safeTask.completed && "line-through text-muted-foreground"
            )}
          >
            {safeTask.title}
          </p>

          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {/* Due date */}
            {safeTask.dueDate && (
              <div className="flex items-center">
                <CalendarDays size={12} className="mr-1" />
                {dueDateText}
              </div>
            )}

            {/* Priority */}
            <div className={cn("flex items-center", getPriorityColor())}>
              <AlertCircle size={12} className="mr-1" />
              {safeTask.priority}
            </div>
          </div>

          {/* Tags */}
          {safeTask.tags && safeTask.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {safeTask.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-2 py-0 text-xs"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Task Dialog - Control visibility solely with the 'open' prop */}
      <Dialog
        key={`edit-dialog-${safeTask.id}`}
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
                onValueChange={(goalId) => {
                  const newGoalId = goalId === "" ? null : goalId;
                  setEditedTask({
                    ...editedTask,
                    goalId: newGoalId,
                  });
                }}
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
