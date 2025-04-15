import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { Dashboard } from "@/components/Dashboard";
import { TimelineJournalView } from "@/components/TimelineJournalView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ListTodo,
  Database,
  Plus,
  Target,
  CheckSquare,
  RefreshCw,
  AlertTriangle,
  Trophy,
  HardDrive,
  Clock,
} from "lucide-react";
import { FocusMode } from "@/components/FocusMode";
import { cn } from "@/lib/utils";
import { GamificationView } from "@/components/GamificationView";
import { Button } from "@/components/ui/button";
import { addPrebuiltData, addInactivityDemoData } from "@/lib/prebuiltData";
import { toast } from "@/hooks/use-toast";

// Add CSS for sidebar-related layout adjustments
import "../styles/sidebar-layout.css";

// Function to reset the database in case of corruption
const resetDatabase = async (): Promise<void> => {
  try {
    console.log("Attempting to delete database");
    // Delete the entire database
    const deleteRequest = window.indexedDB.deleteDatabase("achievo-db");

    deleteRequest.onsuccess = async () => {
      console.log("Database deleted successfully");
      toast({
        title: "Database Reset",
        description: "Database has been reset. Reloading page...",
      });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    deleteRequest.onerror = () => {
      console.error("Failed to delete database:", deleteRequest.error);
      toast({
        title: "Error",
        description: "Failed to reset database. Try refreshing the page.",
        variant: "destructive",
      });
    };
  } catch (error) {
    console.error("Error resetting database:", error);
    toast({
      title: "Error",
      description: "Failed to reset database. Try refreshing the page.",
      variant: "destructive",
    });
  }
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<"tasks" | "dashboard">("tasks");
  const [isMobile, setIsMobile] = useState(false);
  const [showEmergencyReset, setShowEmergencyReset] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem("sidebar-collapsed");
    return savedState ? JSON.parse(savedState) : false;
  });

  // Monitor sidebar collapsed state
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem("sidebar-collapsed");
      if (savedState) {
        setSidebarCollapsed(JSON.parse(savedState));
      }
    };

    // Listen for changes to localStorage
    window.addEventListener("storage", handleStorageChange);

    // Also set up a periodic check for changes
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Get context safely
  const appContext = useApp();

  // Default value if context is not available
  const isFocusMode = appContext?.isFocusMode || false;
  const showGamificationView = appContext?.showGamificationView || false;
  const refreshData = appContext?.refreshData;
  const createGoal = appContext?.createGoal;
  const createTask = appContext?.createTask;
  const tasks = appContext?.tasks || [];

  // Handle adding demo data
  const handleAddDemoData = () => addInactivityDemoData();

  const handleCreateTestGoal = () => {
    if (createGoal) {
      const goalId = createGoal("Test Goal");
      if (refreshData) refreshData();
      toast({
        title: "Test Goal Created",
        description: "A new test goal has been added",
      });
    }
  };

  const handleCreateTestTask = () => {
    if (createTask) {
      const today = new Date().toISOString().split("T")[0];
      const taskId = createTask({
        title: "Test Task",
        dueDate: today,
        suggestedDueDate: today,
        priority: "medium",
        tags: ["test"],
      });
      if (refreshData) refreshData();
      toast({
        title: "Test Task Created",
        description: "A new test task has been added",
      });
    }
  };

  // Check for mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add resize listener
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Switch to tasks tab when focus mode is activated
  useEffect(() => {
    if (isFocusMode) {
      setActiveTab("tasks");
    }
  }, [isFocusMode]);

  // Show gamification view if selected
  if (showGamificationView && !isFocusMode) {
    return (
      <div className="h-screen flex overflow-hidden app-container">
        {/* Only show sidebar when not in focus mode */}
        <Sidebar />
        <div className="flex-1 overflow-auto main-content">
          <div className="p-4 flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleAddDemoData}
            >
              <Database size={16} />
              <span>Add Demo Data</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleCreateTestGoal}
            >
              <Target size={16} />
              <span>Create Test Goal</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleCreateTestTask}
            >
              <CheckSquare size={16} />
              <span>Create Test Task</span>
            </Button>
            {showEmergencyReset && (
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                onClick={resetDatabase}
              >
                <AlertTriangle size={16} />
                <span>Reset Database</span>
              </Button>
            )}
          </div>
          <GamificationView />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-screen flex overflow-hidden app-container transition-all duration-200",
        isFocusMode && "focus-mode-container",
        sidebarCollapsed && "sidebar-collapsed"
      )}
    >
      {/* Only show sidebar when not in focus mode */}
      {!isFocusMode && <Sidebar />}

      <div className="flex-1 flex flex-col overflow-hidden main-content">
        {!isFocusMode && (
          <div className="p-2 flex flex-wrap gap-2 justify-end">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleAddDemoData}
              >
                <Database size={16} />
                <span>Add Demo Data</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleCreateTestGoal}
              >
                <Target size={16} />
                <span>Create Goal</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={handleCreateTestTask}
              >
                <CheckSquare size={16} />
                <span>Create Task</span>
              </Button>
              {showEmergencyReset && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={resetDatabase}
                >
                  <AlertTriangle size={16} />
                  <span>Reset Database</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowEmergencyReset((prev) => !prev)}
              >
                <RefreshCw size={16} />
                <span>Show Reset Option</span>
              </Button>
            </div>
          </div>
        )}

        {isFocusMode ? (
          <FocusMode />
        ) : (
          <div className="flex-1 p-2 overflow-auto">
            {isMobile ? (
              // Mobile view - simplify with just Task List
              <div className="h-full">
                <TaskList />
              </div>
            ) : (
              // Desktop view - Tabs with Task & Dashboard
              <Tabs
                defaultValue="tasks"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as any)}
                className="h-full flex flex-col"
              >
                <div className="flex justify-between items-center mb-2">
                  <TabsList>
                    <TabsTrigger value="tasks" className="flex items-center">
                      <ListTodo className="mr-2 h-4 w-4" />
                      Tasks
                    </TabsTrigger>
                    <TabsTrigger
                      value="dashboard"
                      className="flex items-center"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Dashboard
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="tasks"
                  className="flex-1 overflow-hidden space-y-1 mt-0"
                >
                  <TaskList />
                </TabsContent>

                <TabsContent
                  value="dashboard"
                  className="flex-1 overflow-auto space-y-8 mt-0"
                >
                  <Dashboard />
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
