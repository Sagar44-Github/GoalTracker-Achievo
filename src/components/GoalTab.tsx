import { useState } from "react";
import { cn } from "@/lib/utils";
import { Goal } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { Edit, Trash2, MoreVertical, Star } from "lucide-react";
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
  const { updateGoal, deleteGoal, toggleGamificationView } = useApp();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState(goal.title);

  const handleClick = () => {
    // Turn off gamification view when selecting a goal
    toggleGamificationView(false);
    onClick();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(goal.title);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editedTitle.trim()) {
      await updateGoal({
        ...goal,
        title: editedTitle.trim(),
      });
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to delete "${goal.title}"? This cannot be undone.`
    );
    if (confirmed) {
      await deleteGoal(goal.id);
    }
  };

  // Calculate progress percentage
  const progressPercentage = goal.stats.percentage;

  return (
    <>
      {isCollapsed ? (
        <button
          className={cn(
            "w-full h-8 flex items-center justify-center rounded-md",
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
              className="absolute top-0 right-0 text-yellow-500 fill-yellow-500"
            />
          )}
        </button>
      ) : (
        <div
          className={cn(
            "group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "hover:bg-muted/50"
          )}
          onClick={handleClick}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: goal.color || "#9b87f5" }}
                ></div>
                <span className="text-sm font-medium truncate">
                  {goal.title}
                </span>

                {/* Display level badge if level is greater than 1 */}
                {goal.level && goal.level > 1 && (
                  <span className="text-xs font-semibold rounded-full bg-muted/40 px-1.5 inline-flex items-center">
                    {goal.level}
                  </span>
                )}

                {/* Display prestige stars if goal has prestigious */}
                {goal.prestigeLevel && goal.prestigeLevel > 0 && (
                  <div className="flex">
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
              <span className="text-xs text-muted-foreground ml-1">
                {goal.stats.completed}/{goal.stats.total}
              </span>
            </div>

            <div className="w-full bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-sidebar-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 ml-1"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit size={14} className="mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

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
    </>
  );
}
