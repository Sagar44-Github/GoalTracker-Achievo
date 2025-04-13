import { useState } from "react";
import { Task } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { formatDate } from "@/lib/taskUtils";
import {
  CheckCircle,
  Circle,
  Edit,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface GoalTaskItemProps {
  task: Task;
}

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
  };

  const handleSaveEdit = async () => {
    if (editedTask) {
      await updateTask(editedTask);
      setIsEditDialogOpen(false);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setEditedTask({ ...editedTask, tags: tags || [] });
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer",
          safeTask.completed && "opacity-60"
        )}
        onClick={handleEdit}
      >
        {/* Checkbox */}
        <button
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center mr-2",
            safeTask.completed && "bg-achievo-purple border-achievo-purple"
          )}
          onClick={handleComplete}
          title={safeTask.completed ? "Mark as incomplete" : "Mark as complete"}
          aria-label={
            safeTask.completed ? "Mark as incomplete" : "Mark as complete"
          }
        >
          {safeTask.completed ? (
            <CheckCircle size={14} className="text-background" />
          ) : null}
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

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-2"
          onClick={handleEdit}
        >
          <Edit size={14} />
        </Button>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
              />
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
                <SelectTrigger>
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
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    goalId: value || null,
                  })
                }
              >
                <SelectTrigger>
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
                value={editedTask.tags ? editedTask.tags.join(", ") : ""}
                onChange={handleTagChange}
              />
            </div>

            <Button onClick={handleSaveEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
