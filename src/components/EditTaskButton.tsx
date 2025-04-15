import { useState } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { db, Task } from "@/lib/db";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";

// Direct update function
const updateTaskDirectly = async (task: Task): Promise<boolean> => {
  try {
    return await db.directTaskUpdate(task);
  } catch (error) {
    console.error("Direct update failed:", error);
    return false;
  }
};

interface EditTaskButtonProps {
  task: Task;
  className?: string;
}

export function EditTaskButton({ task, className }: EditTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const appContext = useApp();
  const updateTask = appContext?.updateTask || (async () => "");
  const goals = appContext?.goals || [];
  const refreshData = appContext?.refreshData || (async () => {});

  // Handle opening the dialog
  const handleOpenDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Make a fresh copy of the task
    setEditedTask({
      ...task,
      dependencies: task.dependencies || [],
      isQuiet: task.isQuiet || false,
      description: task.description || "",
      tags: task.tags || [],
    });

    // Open the dialog
    setIsOpen(true);
  };

  // Handle saving changes
  const handleSaveTask = async () => {
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
        title: editedTask.title.trim(),
        dueDate: editedTask.dueDate,
        createdAt: editedTask.createdAt,
        goalId: editedTask.goalId,
        completed: editedTask.completed,
        priority: editedTask.priority || "medium",
        isArchived: editedTask.isArchived || false,
        repeatPattern: editedTask.repeatPattern || null,
        completionTimestamp: editedTask.completionTimestamp || null,
        dependencies: editedTask.dependencies || [],
        tags: editedTask.tags || [],
      };

      // Try direct database update first
      try {
        const success = await updateTaskDirectly(taskToSave);

        if (success) {
          // Close dialog first for better UX
          setIsOpen(false);

          // Success message
          toast({
            title: "Task updated",
            description: "Your changes have been saved successfully.",
          });

          // Refresh data if available
          if (refreshData) {
            setTimeout(() => refreshData(), 100);
          }
        }
      } catch (directError) {
        console.error("Direct update failed:", directError);

        // Fall back to context update method
        try {
          await updateTask(taskToSave);
          setIsOpen(false);

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

  return (
    <>
      {/* Edit button */}
      <Button
        variant="ghost"
        size="icon"
        className={`flex-shrink-0 w-5 h-5 rounded-full hover:bg-muted/50 transition-colors ${
          className || ""
        }`}
        onClick={handleOpenDialog}
        title="Edit task"
      >
        <Edit size={12} className="text-muted-foreground" />
      </Button>

      {/* Dialog will always be in the DOM but only visible when isOpen=true */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Make changes to your task here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
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
              <Label htmlFor="edit-due-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    id="edit-due-date"
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
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editedTask.priority}
                onValueChange={(value) =>
                  setEditedTask({
                    ...editedTask,
                    priority: value as "low" | "medium" | "high",
                  })
                }
              >
                <SelectTrigger id="edit-priority">
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
              <Label htmlFor="edit-goal">Goal</Label>
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
                <SelectTrigger id="edit-goal">
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
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Textarea
                id="edit-tags"
                value={editedTask.tags.join(", ")}
                onChange={handleTagChange}
                placeholder="work, important, project"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              className="flex-1"
              disabled={!editedTask.title.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
