import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Task } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  X,
  Timer,
  Zap,
  ListChecks,
  Flame,
  Check,
  Circle,
} from "lucide-react";
import Draggable from "react-draggable";

// Augment the AppContextType to include the tasks property
interface ExtendedAppContextType {
  tasks?: Task[];
  goals?: any[];
  isFocusMode?: boolean;
  focusTimer?: number | null;
  currentGoalId?: string | null;
  completeTask?: (id: string) => Promise<void>;
}

export function FloatingDashboard() {
  // Try to access context safely
  const appContext = useApp() as ExtendedAppContextType;

  // Return null if context is not available to avoid errors
  if (!appContext) {
    console.error("App context not available in FloatingDashboard");
    return null;
  }

  const {
    tasks = [],
    goals = [],
    isFocusMode = false,
    focusTimer = null,
    currentGoalId = null,
    completeTask,
  } = appContext;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isDocked, setIsDocked] = useState(true); // Track if dashboard is in default position

  const nodeRef = useRef(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Detect mobile and set initial position accordingly
  useEffect(() => {
    try {
      const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        const smallMobile = window.innerWidth < 380;
        setIsMobile(mobile);
        setIsSmallMobile(smallMobile);

        // Only update position if we haven't initialized yet or if we're docked
        if (!initialized || isDocked) {
          if (mobile) {
            // For mobile, dock to bottom center
            setPosition({
              x: Math.max(
                0,
                (window.innerWidth - (smallMobile ? 280 : 300)) / 2
              ),
              y: window.innerHeight - (smallMobile ? 80 : 100),
            });
            setIsCollapsed(true);
          } else {
            // For desktop, dock to top right
            setPosition({ x: window.innerWidth - 320, y: 60 });
          }
          setInitialized(true);
        }
      };

      // Check on mount
      checkMobile();

      // Add resize listener
      window.addEventListener("resize", checkMobile);

      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    } catch (err) {
      console.error("Error in FloatingDashboard mobile detection:", err);
    }
  }, [initialized, isDocked]);

  // Ensure dashboard stays within viewport when resizing
  useEffect(() => {
    const handleResize = () => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // If dashboard is outside viewport, adjust position
        if (rect.right > viewportWidth) {
          setPosition((prev) => ({
            ...prev,
            x: Math.max(0, viewportWidth - rect.width - 10),
          }));
        }
        if (rect.bottom > viewportHeight) {
          setPosition((prev) => ({
            ...prev,
            y: Math.max(0, viewportHeight - rect.height - 10),
          }));
        }
        if (rect.left < 0) {
          setPosition((prev) => ({ ...prev, x: 10 }));
        }
        if (rect.top < 0) {
          setPosition((prev) => ({ ...prev, y: 10 }));
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate XP based on completed tasks
  useEffect(() => {
    try {
      if (!tasks || tasks.length === 0) return;

      const completedTasks = tasks.filter((task) => task.completed).length;
      setCurrentXP(completedTasks * 10); // 10 XP per completed task

      // Set streak from the current goal
      if (currentGoalId && goals && goals.length > 0) {
        const currentGoal = goals.find((g) => g.id === currentGoalId);
        if (currentGoal) {
          setStreak(currentGoal.streakCounter || 0);
        }
      } else if (goals && goals.length > 0) {
        // If no current goal, use the highest streak
        const highestStreak = Math.max(
          ...goals.map((g) => g.streakCounter || 0)
        );
        setStreak(highestStreak);
      }

      // Filter today's tasks
      const tasksForToday = tasks.filter(
        (task) => !task.isArchived && task.dueDate === today
      );
      setTodaysTasks(tasksForToday);
    } catch (err) {
      console.error("Error in FloatingDashboard data processing:", err);
    }
  }, [tasks, goals, currentGoalId, today]);

  // Format the timer (MM:SS)
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handler for toggling task completion
  const handleToggleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (completeTask) {
      completeTask(taskId);
    }
  };

  // Handle drag stop - detect if it's been moved from default position
  const handleDragStop = (e: any, data: { x: number; y: number }) => {
    setPosition({ x: data.x, y: data.y });

    // Compare with the expected default position to determine if docked
    const defaultPos = isMobile
      ? {
          x: Math.max(0, (window.innerWidth - (isSmallMobile ? 280 : 300)) / 2),
          y: window.innerHeight - (isSmallMobile ? 80 : 100),
        }
      : { x: window.innerWidth - 320, y: 60 };

    // Allow some threshold for considering it "docked"
    const threshold = 20;
    const isDraggedFromDock =
      Math.abs(data.x - defaultPos.x) > threshold ||
      Math.abs(data.y - defaultPos.y) > threshold;

    setIsDocked(!isDraggedFromDock);
  };

  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 right-4 rounded-full shadow-lg z-50 h-10 w-10"
        size="sm"
        onClick={() => setIsVisible(true)}
        aria-label="Show dashboard"
      >
        <ListChecks size={18} />
      </Button>
    );
  }

  // Calculate default position based on device
  const defaultPosition = isMobile
    ? {
        x: Math.max(0, (window.innerWidth - (isSmallMobile ? 280 : 300)) / 2),
        y: window.innerHeight - (isSmallMobile ? 80 : 100),
      }
    : { x: window.innerWidth - 320, y: 60 };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      defaultPosition={defaultPosition}
      position={position.x === 0 && position.y === 0 ? undefined : position}
      onStop={handleDragStop}
      bounds="body"
    >
      <div
        ref={nodeRef}
        className={cn(
          "fixed shadow-xl rounded-lg bg-background border border-border z-50 transition-all duration-300 floating-dashboard",
          isMobile
            ? isCollapsed
              ? "w-auto min-w-20 max-w-32 sm:max-w-36"
              : "w-[90vw] max-w-[300px]"
            : isCollapsed
            ? "w-40 sm:w-48"
            : "w-64 sm:w-72"
        )}
        style={{
          touchAction: "none",
          ...(isMobile && !isCollapsed && isDocked
            ? { left: 0, right: 0, margin: "0 auto" }
            : {}),
        }}
      >
        {/* Header / Drag Handle */}
        <div className="drag-handle flex items-center justify-between p-1.5 sm:p-2 border-b cursor-move">
          <div className="flex items-center gap-1">
            <GripHorizontal size={14} className="text-muted-foreground" />
            <span className="font-medium text-[10px] xs:text-xs sm:text-sm">
              {isCollapsed ? "Dashboard" : "Mini Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown size={12} className="sm:w-4 sm:h-4" />
              ) : (
                <ChevronUp size={12} className="sm:w-4 sm:h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground"
              onClick={() => setIsVisible(false)}
            >
              <X size={12} className="sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Widget Body */}
        {!isCollapsed && (
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
            {/* XP Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs">
                  <Zap size={12} className="text-yellow-500 sm:w-4 sm:h-4" />
                  <span className="font-medium">XP Progress</span>
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-xs font-mono">
                  {currentXP} XP
                </span>
              </div>
              <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-achievo-purple"
                  style={{
                    width: `${Math.min(100, (currentXP / 1000) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Streak & Timer */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-lg p-1.5 sm:p-2">
                <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                  <Flame size={10} className="text-orange-500 sm:w-4 sm:h-4" />
                  <span className="font-medium">Current Streak</span>
                </div>
                <p className="text-sm xs:text-base sm:text-xl font-bold">
                  {streak} days
                </p>
              </div>

              <div className="bg-muted/30 rounded-lg p-1.5 sm:p-2">
                <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs mb-0.5 sm:mb-1">
                  <Timer
                    size={10}
                    className="text-achievo-purple sm:w-4 sm:h-4"
                  />
                  <span className="font-medium">Focus Timer</span>
                </div>
                <p className="text-sm xs:text-base sm:text-xl font-bold font-mono">
                  {isFocusMode ? formatTime(focusTimer) : "--:--"}
                </p>
              </div>
            </div>

            {/* Today's Tasks */}
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center gap-1 text-[9px] xs:text-[10px] sm:text-xs">
                  <ListChecks
                    size={10}
                    className="text-green-500 sm:w-4 sm:h-4"
                  />
                  <span className="font-medium">Today's Tasks</span>
                </div>
                <span className="text-[9px] xs:text-[10px] sm:text-xs">
                  {todaysTasks.filter((t) => t.completed).length}/
                  {todaysTasks.length}
                </span>
              </div>

              <div className="max-h-24 xs:max-h-28 sm:max-h-40 overflow-y-auto space-y-1 pr-1 hide-scrollbar">
                {!todaysTasks || todaysTasks.length === 0 ? (
                  <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground text-center py-2">
                    No tasks due today
                  </p>
                ) : (
                  todaysTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "text-[9px] xs:text-[10px] sm:text-xs px-2 py-1 sm:py-1.5 rounded border flex items-start gap-1 sm:gap-1.5 group",
                        task.completed ? "opacity-70" : ""
                      )}
                    >
                      <button
                        onClick={(e) => handleToggleComplete(task.id, e)}
                        className={cn(
                          "w-3 h-3 sm:w-4 sm:h-4 mt-0 flex-shrink-0 rounded-full border flex items-center justify-center",
                          task.completed
                            ? "bg-green-500 border-green-500"
                            : "border-muted-foreground"
                        )}
                        aria-label={
                          task.completed
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >
                        {task.completed && (
                          <Check
                            size={8}
                            className="text-white sm:w-3 sm:h-3"
                          />
                        )}
                      </button>
                      <span
                        className={cn(
                          "flex-1 break-words",
                          task.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      <div
                        className={cn(
                          "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1 flex-shrink-0",
                          task.priority === "high"
                            ? "bg-destructive"
                            : task.priority === "medium"
                            ? "bg-orange-500"
                            : "bg-blue-500"
                        )}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Collapsed View */}
        {isCollapsed && (
          <div className="p-1.5 sm:p-2 flex items-center justify-around gap-1 sm:gap-2">
            <div className="flex flex-col items-center">
              <Zap size={12} className="text-yellow-500 sm:w-4 sm:h-4" />
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                {currentXP}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Flame size={12} className="text-orange-500 sm:w-4 sm:h-4" />
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                {streak}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Timer size={12} className="text-achievo-purple sm:w-4 sm:h-4" />
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                {isFocusMode ? formatTime(focusTimer).split(":")[0] : "--"}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <ListChecks size={12} className="text-green-500 sm:w-4 sm:h-4" />
              <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-mono">
                {todaysTasks.filter((t) => t.completed).length}/
                {todaysTasks.length}
              </span>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
}
