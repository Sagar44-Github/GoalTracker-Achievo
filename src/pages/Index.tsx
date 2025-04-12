import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Sidebar } from "@/components/Sidebar";
import { TaskList } from "@/components/TaskList";
import { Dashboard } from "@/components/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, ListTodo } from "lucide-react";
import { FocusMode } from "@/components/FocusMode";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"tasks" | "dashboard">("tasks");
  const [isMobile, setIsMobile] = useState(false);

  // Get context safely
  const appContext = useApp();

  // Default value if context is not available
  const isFocusMode = appContext?.isFocusMode || false;

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
            <Dashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Focus mode overlay */}
      <FocusMode />
    </div>
  );
};

export default Index;
