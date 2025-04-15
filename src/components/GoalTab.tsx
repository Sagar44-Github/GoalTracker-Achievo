import { useState } from "react";
import { cn } from "@/lib/utils";
import { Goal, Task } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import {
  Edit,
  Trash2,
  MoreVertical,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Database,
  MoreHorizontal,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GoalTaskItem } from "./GoalTaskItem";
import { addInactivityDemoData, addPrebuiltData } from "@/lib/prebuiltData";
import { toast } from "@/hooks/use-toast";

interface GoalTabProps {
  goal: Goal & { stats: any };
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export function GoalTab({
  goal,
  isActive,
  isCollapsed,
  onClick,
}: GoalTabProps) {
  const {
    setCurrentGoalId,
    setGoalWithLoading,
    currentGoalId,
    filteredTasks,
    tasks,
    goals,
    updateGoal,
    deleteGoal,
    toggleGamificationView,
    addTask,
    refreshData,
    archiveGoal,
  } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Get tasks for this goal
  const goalTasks =
    tasks?.filter((task) => task.goalId === goal.id && !task.completed) || [];
  const completedTasks =
    tasks?.filter((task) => task.goalId === goal.id && task.completed) || [];

  const handleClick = async () => {
    // Turn off gamification view when selecting a goal
    toggleGamificationView(false);
    await handleGoalSelect();
    onClick();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(goal.title);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editedTitle.trim()) {
      try {
        await updateGoal({
          ...goal,
          title: editedTitle.trim(),
        });
        setIsEditDialogOpen(false);
        toast({
          title: "Goal updated",
          description: "Goal title has been updated successfully.",
        });
      } catch (error) {
        console.error("Failed to update goal:", error);
        toast({
          title: "Error",
          description: "Failed to update goal. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteGoal(goal.id);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Goal deleted",
        description: "The goal has been deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete goal:", error);
      toast({
        title: "Error",
        description: "Failed to delete goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoalSelect = async () => {
    try {
      // Use the optimized setGoalWithLoading function instead
      setGoalWithLoading(goal.id);

      // Update the lastActiveDate timestamp for this goal
      if (goal.id) {
        await updateGoal({
          ...goal,
          lastActiveDate: Date.now(),
        });
      }
    } catch (error) {
      console.error("Failed to select goal:", error);
    }
  };

  const toggleTasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTasksExpanded(!isTasksExpanded);
  };

  const handleAddTask = async () => {
    if (newTaskTitle.trim()) {
      await addTask({
        title: newTaskTitle.trim(),
        goalId: goal.id,
        priority: "medium",
        dueDate: null,
      });
      setNewTaskTitle("");
      setIsAddTaskDialogOpen(false);
    }
  };

  const openAddTaskDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTaskTitle("");
    setIsAddTaskDialogOpen(true);
  };

  // Handle adding demo data
  const handleAddDemoData = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addPrebuiltData();
      await addInactivityDemoData();
      await refreshData();
      toast({
        title: "Success",
        description: "Demo data has been added!",
      });
    } catch (error) {
      console.error("Failed to add demo data:", error);
      toast({
        title: "Error",
        description: "Failed to add demo data.",
        variant: "destructive",
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage = goal.stats?.percentage || 0;

  // Handle archive goal
  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the parent

    if (confirm(`Are you sure you want to archive the goal "${goal.title}"?`)) {
      await archiveGoal(goal.id);
    }
  };

  return (
    <>
      {isCollapsed ? (
        <button
          className={cn(
            "w-full h-8 flex items-center justify-center rounded-md relative",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted/50"
          )}
          onClick={handleClick}
          title={goal.title}
        >
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: goal.color || "#9b87f5" }}
          ></div>

          {/* Show prestige stars in collapsed view */}
          {goal.prestigeLevel && goal.prestigeLevel > 0 && (
            <Star
              size={8}
              className="absolute top-0.5 right-0.5 text-yellow-500 fill-yellow-500"
            />
          )}
        </button>
      ) : (
        <div className="flex flex-col mb-1">
          <div
            className={cn(
              "group flex items-center justify-between rounded-md px-2 py-2 cursor-pointer",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-muted/50"
            )}
            onClick={handleClick}
          >
            <div className="flex-1 min-w-0 mr-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 max-w-[70%]">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: goal.color || "#9b87f5" }}
                  ></div>
                  <div className="flex items-center gap-1 truncate">
                    <span className="text-sm font-medium truncate">
                      {goal.title}
                    </span>

                    {/* Display level badge if level is greater than 1 */}
                    {goal.level && goal.level > 1 && (
                      <span className="text-xs font-semibold rounded-full bg-muted/40 px-1.5 inline-flex items-center flex-shrink-0">
                        {goal.level}
                      </span>
                    )}

                    {/* Display prestige stars if goal has prestigious */}
                    {goal.prestigeLevel && goal.prestigeLevel > 0 && (
                      <div className="flex flex-shrink-0">
                        {Array.from({
                          length: Math.min(goal.prestigeLevel, 3),
                        }).map((_, i) => (
                          <Star
                            key={i}
                            size={10}
                            className="text-yellow-500 fill-yellow-500"
                            style={{ marginLeft: i > 0 ? -6 : 0 }}
                          />
                        ))}
                        {goal.prestigeLevel > 3 && (
                          <span className="text-[9px] text-yellow-500 font-bold ml-0.5">
                            +{goal.prestigeLevel - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-1 flex-shrink-0 font-medium">
                  {goal.stats.completed}/{goal.stats.total}
                </span>
              </div>

              <div className="w-full bg-muted/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-sidebar-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center space-x-0.5 flex-shrink-0">
              {/* Toggle tasks button */}
              {goalTasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-60 hover:opacity-100 flex-shrink-0"
                  onClick={toggleTasks}
                >
                  {isTasksExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </Button>
              )}

              {/* Goal menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={openAddTaskDialog}>
                    <Plus size={14} className="mr-2" />
                    Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit size={14} className="mr-2" />
                    Edit Goal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddDemoData}>
                    <Database size={14} className="mr-2" />
                    Add Demo Data
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete Goal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Goal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tasks list for this goal */}
          {isTasksExpanded && goalTasks.length > 0 && (
            <div className="ml-4 mt-1 space-y-1 mb-1">
              {goalTasks.map((task) => (
                <GoalTaskItem key={task.id} task={task} />
              ))}

              {/* Quick add task button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full justify-start pl-2 h-7 opacity-70 hover:opacity-100"
                onClick={openAddTaskDialog}
              >
                <Plus size={12} className="mr-1" />
                Add Task
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Goal title"
              autoFocus
            />
            <Button onClick={handleSaveEdit} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{goal.title}" and all of its tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task to {goal.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task name"
              autoFocus
            />
            <Button onClick={handleAddTask} className="w-full">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
