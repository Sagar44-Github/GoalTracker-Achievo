import { useState } from "react";
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
  } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

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

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };

  const handleEdit = () => {
    setEditedTask({ ...task });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    await updateTask(editedTask);
    setIsEditDialogOpen(false);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setEditedTask({ ...editedTask, tags });
  };

  return (
    <>
      <div
        className={cn("flex items-start gap-2", task.completed && "opacity-60")}
      >
        {/* Checkbox - Make larger in focus mode */}
        <button
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center",
            isFocusMode && "w-6 h-6",
            task.completed && "bg-achievo-purple border-achievo-purple"
          )}
          onClick={handleComplete}
          title={task.completed ? "Mark as incomplete" : "Mark as complete"}
          aria-label={
            task.completed ? "Mark as incomplete" : "Mark as complete"
          }
        >
          {task.completed ? (
            <CheckCircle
              size={isFocusMode ? 18 : 14}
              className="text-background"
            />
          ) : null}
        </button>

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
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.tags.map((tag) => (
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update the task details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Task</Label>
              <Input
                id="editTitle"
                value={editedTask.title}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, title: e.target.value })
                }
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="date"
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
                <Label htmlFor="editPriority">Priority</Label>
                <Select
                  value={editedTask.priority}
                  onValueChange={(value) =>
                    setEditedTask({ ...editedTask, priority: value as any })
                  }
                >
                  <SelectTrigger id="editPriority">
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
              <Label htmlFor="editGoalId">Goal</Label>
              <Select
                value={editedTask.goalId || "none"}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    goalId: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger id="editGoalId">
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

            <div className="space-y-2">
              <Label htmlFor="editTags">Tags</Label>
              <Textarea
                id="editTags"
                placeholder="Add tags separated by comma"
                value={editedTask.tags.join(", ")}
                onChange={handleTagChange}
                className="h-20"
              />

              {/* Tags display */}
              <div className="flex flex-wrap gap-1 mt-2">
                {editedTask.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="px-2 py-1">
                    #{tag}
                    <button
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditedTask({
                          ...editedTask,
                          tags: editedTask.tags.filter((t) => t !== tag),
                        });
                      }}
                    >
                      &times;
                    </button>
                  </Badge>
                ))}
              </div>
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
