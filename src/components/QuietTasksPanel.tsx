import { useState, useEffect } from "react";
import { Task } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/taskUtils";
import {
  Feather,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  X,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskItem } from "./TaskItem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QuietTasksPanel() {
  // Get app context
  const appContext = useApp();

  // Safely access context properties
  const quietTasks = appContext?.quietTasks || [];
  const showQuietPanel = appContext?.showQuietPanel || false;
  const toggleQuietPanel = appContext?.toggleQuietPanel || (() => {});
  const createTask = appContext?.createTask || (async () => "");
  const refreshData = appContext?.refreshData || (async () => {});

  const [isExpanded, setIsExpanded] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  // Debug logging
  useEffect(() => {
    console.log(
      "QuietTasksPanel rendered with",
      quietTasks.length,
      "quiet tasks"
    );
    console.log("showQuietPanel is", showQuietPanel);
  }, [quietTasks.length, showQuietPanel]);

  if (!showQuietPanel) {
    return null;
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      try {
        console.log("Creating quiet task:", newTaskTitle);
        const taskId = await createTask({
          title: newTaskTitle,
          description: newTaskDescription,
          isQuiet: true,
          priority: "low",
          tags: ["quiet"],
          dueDate: null,
          completed: false,
        });

        console.log("Quiet task created successfully with ID:", taskId);

        // Refresh to make sure the new task shows up
        if (refreshData) {
          await refreshData();
        }

        // Reset form
        setNewTaskTitle("");
        setNewTaskDescription("");
        setIsAddingTask(false);
      } catch (error) {
        console.error("Error creating quiet task:", error);
        // Keep the dialog open so user can try again
      }
    }
  };

  return (
    <>
      <Card
        className="border-t-4 bg-card/50 backdrop-blur-sm mt-4 transition-all duration-300 overflow-hidden"
        style={{ borderTopColor: "var(--amber-500)" }}
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Feather className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-lg font-medium text-amber-700 dark:text-amber-400">
                Quiet Intentions
              </CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => {
                  console.log("Opening add quiet task dialog");
                  setIsAddingTask(true);
                }}
                title="Add quiet task"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={toggleExpand}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={toggleQuietPanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Low-pressure, mindful tasks without reminders or stats
          </CardDescription>
        </CardHeader>

        {isExpanded && (
          <CardContent className="px-3 pb-3 pt-0">
            {quietTasks.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground italic">
                <p>No quiet tasks yet.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    console.log(
                      "Opening add quiet task dialog from empty state"
                    );
                    setIsAddingTask(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add a mindful intention
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {quietTasks.map((task) => (
                  <li
                    key={task.id}
                    className="border-0 rounded-lg shadow-sm bg-background/60"
                  >
                    <TaskItem task={task} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add Quiet Task Dialog */}
      <Dialog
        open={isAddingTask}
        onOpenChange={(open) => {
          console.log("Dialog open state changing to:", open);
          setIsAddingTask(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Feather className="h-4 w-4 mr-2 text-amber-500" />
              Add Quiet Intention
            </DialogTitle>
            <DialogDescription>
              Create a mindful, low-pressure task without deadlines or metrics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="quiet-title">Intention</Label>
              <Input
                id="quiet-title"
                placeholder="E.g., Write in journal, Call an old friend..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-amber-50/30"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiet-description">Thoughts (optional)</Label>
              <Textarea
                id="quiet-description"
                placeholder="Any additional notes..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="bg-amber-50/30 min-h-[100px]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                  setIsAddingTask(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTask}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
                disabled={!newTaskTitle.trim()}
              >
                Add Intention
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
