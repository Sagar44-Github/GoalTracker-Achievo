import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface SimpleEditModalProps {
  task: Task;
  className?: string;
}

export function SimpleEditModal({ task, className }: SimpleEditModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);

  const appContext = useApp();
  const updateTask = appContext?.updateTask || (async () => "");
  const goals = appContext?.goals || [];
  const refreshData = appContext?.refreshData || (async () => {});

  // Reset edited task when the underlying task changes
  useEffect(() => {
    setEditedTask({
      ...task,
      dependencies: task.dependencies || [],
      isQuiet: task.isQuiet || false,
      description: task.description || "",
      tags: task.tags || [],
    });
  }, [task]);

  // Handle opening the modal
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  // Handle closing the modal
  const handleCloseModal = () => {
    setIsOpen(false);
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
        onClick={handleOpenModal}
        title="Edit task"
      >
        <Edit size={12} className="text-muted-foreground" />
      </Button>

      {/* Modal overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6 pointer-events-auto text-foreground">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Edit Task
                </h2>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="simple-edit-title"
                    className="text-foreground"
                  >
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="simple-edit-title"
                    value={editedTask.title}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, title: e.target.value })
                    }
                    className={
                      !editedTask.title.trim() ? "border-destructive" : ""
                    }
                    placeholder="Enter a task title"
                    autoFocus
                  />
                  {!editedTask.title.trim() && (
                    <p className="text-xs text-destructive">
                      Title is required
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="simple-edit-priority"
                    className="text-foreground"
                  >
                    Priority
                  </Label>
                  <select
                    id="simple-edit-priority"
                    value={editedTask.priority}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    aria-labelledby="simple-edit-priority"
                    title="Priority"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="simple-edit-goal" className="text-foreground">
                    Goal
                  </Label>
                  <select
                    id="simple-edit-goal"
                    value={editedTask.goalId || ""}
                    onChange={(e) => {
                      const newGoalId =
                        e.target.value === "" ? null : e.target.value;
                      setEditedTask({
                        ...editedTask,
                        goalId: newGoalId,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                    aria-labelledby="simple-edit-goal"
                    title="Goal"
                  >
                    <option value="">No goal</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="simple-edit-tags" className="text-foreground">
                    Tags (comma-separated)
                  </Label>
                  <Textarea
                    id="simple-edit-tags"
                    value={editedTask.tags.join(", ")}
                    onChange={handleTagChange}
                    placeholder="work, important, project"
                    className="bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
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
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
