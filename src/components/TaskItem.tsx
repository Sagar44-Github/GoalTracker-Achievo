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

    // Check if this task has uncompleted dependencies
    if (!task.completed && task.dependencies && task.dependencies.length > 0) {
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
        return;
      }
    }

    completeTask(task.id);
  };

  const handleEdit = () => {
    setEditedTask({
      ...task,
      dependencies: task.dependencies || [], // Ensure dependencies is initialized
    });
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
                value={editedTask.tags.join(", ")}
                onChange={handleTagChange}
              />
            </div>

            {/* Display Dependencies */}
            {editedTask.dependencies && editedTask.dependencies.length > 0 && (
              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="p-2 border rounded-md space-y-1">
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

            <Button onClick={handleSaveEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
