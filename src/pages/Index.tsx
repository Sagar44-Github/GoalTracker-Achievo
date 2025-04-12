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

  // Get context safely
  const appContext = useApp();

  // Default value if context is not available
  const isFocusMode = appContext?.isFocusMode || false;

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
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <ListTodo size={16} />
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center gap-2"
                >
                  <BarChart3 size={16} />
                  Dashboard
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
