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
      <div className="h-screen flex overflow-hidden">
        {/* Only show sidebar when not in focus mode */}
        <Sidebar />
        <div className="flex-1 overflow-auto">
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
        "h-screen flex overflow-hidden transition-all duration-300",
        isFocusMode && "focus-mode-container"
      )}
    >
      {/* Only show sidebar when not in focus mode */}
      {!isFocusMode && <Sidebar />}

      <div className="flex-1 flex flex-col overflow-hidden">
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

        <Tabs
          defaultValue="tasks"
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "tasks" | "dashboard")
          }
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Only show tabs when not in focus mode */}
          {!isFocusMode ? (
            <div className="border-b px-4 py-2 tabs-header flex-shrink-0">
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
                <TabsTrigger
                  value="tasks"
                  className="flex items-center justify-center gap-1 sm:gap-2"
                >
                  <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">Tasks</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center justify-center gap-1 sm:gap-2"
                >
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm">Dashboard</span>
                </TabsTrigger>
              </TabsList>
            </div>
          ) : null}

          <TabsContent
            value="tasks"
            className="flex-1 overflow-hidden m-0 data-[state=active]:flex-1"
          >
            <TaskList />
          </TabsContent>

          <TabsContent
            value="dashboard"
            className="flex-1 overflow-auto m-0 data-[state=active]:flex-1"
          >
            <div className="flex-1 overflow-auto relative">
              <div className="p-2 border-b flex justify-end">
                <Tabs defaultValue="dashboard" className="w-auto">
                  <TabsList>
                    <TabsTrigger
                      value="dashboard"
                      className="flex items-center gap-1"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="timeline"
                      className="flex items-center gap-1"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Timeline</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="dashboard">
                    <Dashboard />
                  </TabsContent>
                  <TabsContent value="timeline">
                    <TimelineJournalView />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Focus mode overlay */}
      <FocusMode />
    </div>
  );
};

export default Index;
