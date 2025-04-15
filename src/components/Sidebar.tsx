import { useState, useEffect } from "react";
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
  Palette,
  Archive,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoalTab } from "./GoalTab";
import { DailyThemeSettings } from "./DailyThemeSettings";
import { useNavigate, useLocation } from "react-router-dom";

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
    isDailyThemeModeEnabled,
    currentDayTheme,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  // Check if currently viewing archived tasks
  const isViewingArchived = location.pathname === "/archived-tasks";

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);

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
            location.pathname === "/archived-goals" &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          onClick={() => navigate("/archived-goals")}
        >
          <Archive size={18} className="mr-2" />
          {!isCollapsed && <span>Archived Goals</span>}
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

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1 relative",
            showThemeSettings &&
              "bg-sidebar-accent text-sidebar-accent-foreground"
          )}
          onClick={() => setShowThemeSettings(true)}
        >
          <Palette size={18} className="mr-2" />
          {!isCollapsed && <span>Daily Themes</span>}
          {isDailyThemeModeEnabled && currentDayTheme && (
            <div
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: currentDayTheme.color }}
            ></div>
          )}
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
          {goals
            .filter((goal) => !goal.isArchived)
            .map((goal) => (
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
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/archived-goals")}>
                <Archive className="mr-2 h-4 w-4" />
                Archived Goals
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/archived-tasks")}>
                <Archive className="mr-2 h-4 w-4" />
                Archived Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Daily Theme Settings Dialog */}
      <Dialog open={showThemeSettings} onOpenChange={setShowThemeSettings}>
        <DialogContent className="max-w-3xl h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette size={18} />
              Daily Themes Settings
            </DialogTitle>
          </DialogHeader>
          <DailyThemeSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
}
