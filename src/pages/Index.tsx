
import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { TaskList } from '@/components/TaskList';
import { Dashboard } from '@/components/Dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, ListTodo } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks');
  
  return (
    <AppProvider>
      <div className="h-screen flex overflow-hidden">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs
            defaultValue="tasks"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'tasks' | 'dashboard')}
            className="flex-1 flex flex-col"
          >
            <div className="border-b px-4 py-2">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <ListTodo size={16} />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="tasks" className="flex-1 overflow-hidden m-0 data-[state=active]:flex-1">
              <TaskList />
            </TabsContent>
            
            <TabsContent value="dashboard" className="flex-1 overflow-auto m-0 data-[state=active]:flex-1">
              <Dashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppProvider>
  );
};

export default Index;
