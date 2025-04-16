import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { X, Timer, Check, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Task } from "@/lib/db";
import { formatDate } from "@/lib/taskUtils";

export function FocusMode() {
  // Get context safely
  const appContext = useApp();

  // Default values if context is not available
  const isFocusMode = appContext?.isFocusMode || false;
  const focusTimer = appContext?.focusTimer || null;
  const exitFocusMode = appContext?.exitFocusMode || (() => {});
  const allTasks = appContext?.tasks || [];
  const completeTask = appContext?.completeTask || (async () => {});

  // Local state for focus tasks (don't rely on filtered tasks from context)
  const [focusTasks, setFocusTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);

  // Get focus tasks directly from all tasks when component mounts or tasks change
  useEffect(() => {
    if (!isFocusMode) return;

    console.log("FOCUS MODE COMPONENT - Getting focus tasks");

    // Get high priority tasks
    const highPriorityTasks = allTasks.filter(
      (task) => task.priority === "high" && !task.completed && !task.isArchived
    );

    console.log(
      `FOCUS MODE COMPONENT - Found ${highPriorityTasks.length} high priority tasks`
    );

    // If no high priority tasks, fall back to medium priority
    if (highPriorityTasks.length === 0) {
      console.log(
        "FOCUS MODE COMPONENT - No high priority tasks, falling back to medium"
      );
      const mediumTasks = allTasks.filter(
        (task) =>
          task.priority === "medium" && !task.completed && !task.isArchived
      );

      if (mediumTasks.length > 0) {
        setFocusTasks(
          mediumTasks.sort((a, b) => {
            // Sort by due date
            if (a.dueDate && b.dueDate) {
              return (
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
              );
            } else if (a.dueDate) {
              return -1;
            } else if (b.dueDate) {
              return 1;
            }
            // Then by creation date
            return a.createdAt - b.createdAt;
          })
        );
      } else {
        // Last resort - any incomplete tasks
        console.log(
          "FOCUS MODE COMPONENT - No medium priority tasks either, showing any incomplete tasks"
        );
        setFocusTasks(
          allTasks.filter((task) => !task.completed && !task.isArchived)
        );
      }
    } else {
      // Use high priority tasks
      setFocusTasks(
        highPriorityTasks.sort((a, b) => {
          // Sort by due date
          if (a.dueDate && b.dueDate) {
            return (
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );
          } else if (a.dueDate) {
            return -1;
          } else if (b.dueDate) {
            return 1;
          }
          // Then by creation date
          return a.createdAt - b.createdAt;
        })
      );
    }

    setLoading(false);
  }, [isFocusMode, allTasks]);

  // Handle task completion
  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);

      // Move to the next task if available
      if (activeTaskIndex < focusTasks.length - 1) {
        setActiveTaskIndex(activeTaskIndex + 1);
      }

      // Remove the completed task from local focus tasks
      setFocusTasks(focusTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleSkipTask = () => {
    if (activeTaskIndex < focusTasks.length - 1) {
      setActiveTaskIndex(activeTaskIndex + 1);
    }
  };

  if (!isFocusMode) {
    return null;
  }

  // Format the timer (MM:SS)
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "25:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Get the current active task
  const currentTask =
    focusTasks.length > 0 ? focusTasks[activeTaskIndex] : null;

  return (
    <>
      {/* Timer UI */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-pulse-slow z-50">
        <Timer className="text-achievo-purple" size={18} />
        <span className="font-mono font-bold text-lg text-achievo-purple">
          {formatTime(focusTimer)}
        </span>
      </div>

      {/* Exit button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => exitFocusMode()}
        >
          <X size={16} className="mr-1" />
          Exit Focus Mode
        </Button>
      </div>

      {/* Custom Focus Mode Task Display */}
      <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-40 pt-20">
        <div className="max-w-2xl w-full px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="spinner h-10 w-10 mx-auto mb-4 border-4 border-achievo-purple border-t-transparent rounded-full animate-spin"></div>
              <p>Loading your focus tasks...</p>
            </div>
          ) : focusTasks.length === 0 ? (
            <div className="text-center py-12 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-lg">
              <p className="font-bold text-red-600 dark:text-red-400 text-lg mb-2">
                No Tasks Found
              </p>
              <p className="mb-4">
                You don't have any high priority tasks to focus on right now.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try creating some high priority tasks before entering focus
                mode.
              </p>
              <Button
                variant="outline"
                onClick={() => exitFocusMode()}
                className="border-red-300 dark:border-red-700"
              >
                Exit Focus Mode
              </Button>
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="mb-6">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  Task {activeTaskIndex + 1} of {focusTasks.length}
                </p>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div
                    className="h-full bg-achievo-purple rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((activeTaskIndex + 1) / focusTasks.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Active task card */}
              {currentTask && (
                <div className="bg-card border-2 border-achievo-purple rounded-lg p-6 mb-6 shadow-lg min-h-[200px] flex flex-col transform transition-all duration-300 ease-in-out">
                  <h2 className="text-2xl font-bold mb-4">
                    {currentTask.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentTask.priority === "high" && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 rounded-full text-xs font-bold">
                        HIGH PRIORITY
                      </span>
                    )}
                    {currentTask.dueDate && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 rounded-full text-xs">
                        Due: {formatDate(currentTask.dueDate)}
                      </span>
                    )}
                    {currentTask.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {currentTask.description && (
                    <p className="text-muted-foreground mb-6">
                      {currentTask.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => handleSkipTask()}
                      disabled={activeTaskIndex >= focusTasks.length - 1}
                    >
                      <CircleX size={16} />
                      Skip
                    </Button>
                    <Button
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleCompleteTask(currentTask.id)}
                    >
                      <Check size={16} />
                      Complete
                    </Button>
                  </div>
                </div>
              )}

              {/* Next up tasks preview */}
              {focusTasks.length > activeTaskIndex + 1 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Up Next
                  </h3>
                  <div className="space-y-2">
                    {focusTasks
                      .slice(activeTaskIndex + 1, activeTaskIndex + 3)
                      .map((task, index) => (
                        <div
                          key={task.id}
                          className="p-3 bg-muted/50 rounded border flex items-center gap-2"
                        >
                          <span className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-xs font-medium">
                            {activeTaskIndex + index + 2}
                          </span>
                          <span className="flex-1 truncate">{task.title}</span>
                          {task.priority === "high" && (
                            <span className="text-xs text-destructive font-medium">
                              HIGH
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
