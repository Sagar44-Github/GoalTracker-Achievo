import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Menu,
  Plus,
  Settings,
  Sun,
  Moon,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalTab } from "./GoalTab";

export function Sidebar() {
  const {
    goals,
    currentGoalId,
    setCurrentGoalId,
    createGoal,
    filterTasks,
    isDarkMode,
    toggleDarkMode,
    showGamificationView,
    toggleGamificationView,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);

  const handleAddGoal = async () => {
    if (newGoalTitle.trim()) {
      const goalId = await createGoal(newGoalTitle.trim());
      setNewGoalTitle("");
      setIsAddGoalDialogOpen(false);
      setCurrentGoalId(goalId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddGoal();
    }
  };

  return (
    <div
      className={cn(
        "h-screen flex flex-col border-r bg-sidebar transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">Achievo</h1>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1",
            !currentGoalId &&
              !showGamificationView &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          onClick={() => {
            setCurrentGoalId(null);
            filterTasks("all");
            toggleGamificationView(false);
          }}
        >
          <ListTodo size={18} className="mr-2" />
          {!isCollapsed && <span>All Tasks</span>}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start mb-1"
          onClick={() => {
            filterTasks("today");
            toggleGamificationView(false);
          }}
        >
          <CalendarDays size={18} className="mr-2" />
          {!isCollapsed && <span>Today</span>}
        </Button>

        <Button
          variant="ghost"
          className="w-full justify-start mb-1"
          onClick={() => {
            filterTasks("completed");
            toggleGamificationView(false);
          }}
        >
          <CheckCircle size={18} className="mr-2" />
          {!isCollapsed && <span>Completed</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1",
            showGamificationView &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          onClick={() => toggleGamificationView(true)}
        >
          <Trophy size={18} className="mr-2" />
          {!isCollapsed && <span>Achievements</span>}
        </Button>
      </div>

      {/* Goals Section with Scrolling */}
      <div className="px-3 mt-2 flex flex-col flex-grow overflow-hidden">
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              GOALS
            </h2>

            <Dialog
              open={isAddGoalDialogOpen}
              onOpenChange={setIsAddGoalDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus size={16} />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input
                    placeholder="Goal name"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                  <Button onClick={handleAddGoal} className="w-full">
                    Create Goal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <div className="space-y-1 overflow-y-auto flex-grow pr-1 scrollbar-thin">
          {goals.map((goal) => (
            <GoalTab
              key={goal.id}
              goal={goal}
              isActive={currentGoalId === goal.id}
              isCollapsed={isCollapsed}
              onClick={() => setCurrentGoalId(goal.id)}
            />
          ))}

          {isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddGoalDialogOpen(true)}
              className="w-full h-8 flex items-center justify-center"
            >
              <Plus size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => filterTasks("archived")}>
                View Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
