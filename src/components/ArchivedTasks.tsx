import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftCircle, Archive, ChevronLeft } from "lucide-react";
import { Task } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function ArchivedTasks() {
  const { tasks, filteredTasks, filterTasks, updateTask, goals } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load archived tasks when component mounts
  useEffect(() => {
    filterTasks("archived");
  }, [filterTasks]);

  const handleUnarchive = async (task: Task) => {
    setIsLoading(true);
    try {
      const updatedTask = { ...task, isArchived: false };
      await updateTask(updatedTask);

      toast({
        title: "Task Unarchived",
        description: `"${task.title}" has been restored`,
      });

      // Refresh the archived tasks list
      filterTasks("archived");
    } catch (error) {
      console.error("Failed to unarchive task:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    // Navigate back to the main app
    navigate("/");
  };

  // Get goal title by ID and check if goal is archived
  const getGoalTitle = (goalId: string | null) => {
    if (!goalId) return "No Goal";
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return "Unknown Goal";

    // Return with archived indicator if goal is archived
    return goal.isArchived ? `${goal.title} (archived)` : goal.title;
  };

  // Get goal color by ID
  const getGoalColor = (goalId: string | null) => {
    if (!goalId) return "#6b7280";
    const goal = goals.find((g) => g.id === goalId);
    return goal?.color || "#6b7280";
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Archived Tasks</h1>
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <CardDescription className="text-lg">
              No archived tasks found
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              When you archive tasks, they will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getGoalColor(task.goalId) }}
                    />
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                  </div>
                  {task.completed && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-green-100 dark:bg-green-900"
                    >
                      Completed
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">
                  {task.completionTimestamp
                    ? `Completed ${formatDistanceToNow(
                        task.completionTimestamp,
                        { addSuffix: true }
                      )}`
                    : `From goal: ${getGoalTitle(task.goalId)}`}
                </CardDescription>
                {task.goalId &&
                  goals.find((g) => g.id === task.goalId)?.isArchived && (
                    <Badge
                      variant="outline"
                      className="mt-2 px-1.5 py-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300"
                    >
                      <Archive className="h-3 w-3 mr-1" />
                      Task from archived goal
                    </Badge>
                  )}
              </CardHeader>
              <CardContent className="flex-1">
                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUnarchive(task)}
                  disabled={isLoading}
                >
                  <ArrowLeftCircle className="h-4 w-4 mr-2" />
                  Unarchive Task
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
