import { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Task } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info } from "lucide-react";
import TaskNode from "./TaskNode";

interface TaskGraphProps {
  goalId: string;
}

// Define custom node types
const nodeTypes = {
  taskNode: TaskNode,
};

export function TaskGraph({ goalId }: TaskGraphProps) {
  const appContext = useApp();
  const tasks = appContext?.tasks || [];
  const updateTask = appContext?.updateTask;

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);

  // Debug render indicator
  useEffect(() => {
    console.log("TaskGraph component mounted with goalId:", goalId);
    return () => {
      console.log("TaskGraph component unmounted");
    };
  }, [goalId]);

  // Function to convert tasks to nodes
  const tasksToNodes = useCallback(
    (tasks: Task[]): Node[] => {
      const filteredTasks = tasks.filter(
        (task) =>
          task.goalId === goalId && !task.isArchived && task.isQuiet !== true
      );

      console.log(`Converting ${filteredTasks.length} tasks to nodes`);

      // Use a grid layout for initial positioning
      // We'll create a layout with roughly sqrt(N) rows and columns
      const columns = Math.ceil(Math.sqrt(filteredTasks.length));

      return filteredTasks.map((task, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
          id: task.id,
          position: { x: column * 300, y: row * 180 },
          data: {
            label: task.title,
            task,
            completed: task.completed,
            priority: task.priority,
            dueDate: task.dueDate,
            isBlocked: task.dependencies?.some((depId) => {
              const depTask = tasks.find((t) => t.id === depId);
              return depTask && !depTask.completed;
            }),
          },
          type: "taskNode", // Use our custom node
        };
      });
    },
    [goalId, tasks]
  );

  // Function to create edges based on task dependencies
  const createEdges = useCallback(
    (tasks: Task[]): Edge[] => {
      const edges: Edge[] = [];

      tasks.forEach((task) => {
        if (task.dependencies && task.dependencies.length > 0) {
          task.dependencies.forEach((depId) => {
            // Make sure both tasks belong to this goal
            const depTask = tasks.find((t) => t.id === depId);
            if (depTask && depTask.goalId === goalId) {
              edges.push({
                id: `${depId}-${task.id}`,
                source: depId,
                target: task.id,
                animated: !depTask.completed,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
                style: { stroke: depTask.completed ? "#22c55e" : "#64748b" },
              });
            }
          });
        }
      });

      return edges;
    },
    [goalId]
  );

  // Initial setup of nodes and edges
  useEffect(() => {
    if (tasks.length > 0) {
      const newNodes = tasksToNodes(tasks);
      const newEdges = createEdges(tasks);
      console.log("Setting nodes and edges:", {
        nodes: newNodes.length,
        edges: newEdges.length,
      });
      setNodes(newNodes);
      setEdges(newEdges);
      setIsLoading(false);
    }
  }, [tasks, tasksToNodes, createEdges]);

  // Handle node changes (position, selection)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodes) => applyNodeChanges(changes, nodes)),
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edges) => applyEdgeChanges(changes, edges)),
    []
  );

  // Add a new edge when connecting nodes - this creates a dependency
  const onConnect = useCallback(
    async (connection: Connection) => {
      // Add the edge to the state
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );

      // Update the task with the new dependency
      if (connection.source && connection.target && updateTask) {
        const sourceTask = tasks.find((task) => task.id === connection.source);
        const targetTask = tasks.find((task) => task.id === connection.target);

        if (sourceTask && targetTask) {
          // Check if this would create a circular dependency
          if (hasDependency(sourceTask, targetTask.id, tasks)) {
            toast({
              title: "Circular dependency detected",
              description: "This would create a circular dependency chain.",
              variant: "destructive",
            });

            // Remove the edge we just added
            setEdges((edges) =>
              edges.filter(
                (edge) =>
                  !(
                    edge.source === connection.source &&
                    edge.target === connection.target
                  )
              )
            );
            return;
          }

          // Update the target task to depend on the source
          const dependencies = targetTask.dependencies || [];
          if (!dependencies.includes(sourceTask.id)) {
            const updatedTask = {
              ...targetTask,
              dependencies: [...dependencies, sourceTask.id],
            };
            await updateTask(updatedTask);

            toast({
              title: "Dependency added",
              description: `${targetTask.title} now depends on ${sourceTask.title}`,
            });
          }
        }
      }
    },
    [tasks, updateTask]
  );

  // Helper function to check if a task depends on another task (direct or indirect)
  const hasDependency = (
    task: Task,
    dependencyId: string,
    allTasks: Task[]
  ): boolean => {
    // Check for direct dependency (would create a cycle)
    if (dependencyId === task.id) {
      return true;
    }

    // Check if the dependency task depends on our task (would create a cycle)
    const dependencyTask = allTasks.find((t) => t.id === dependencyId);
    if (
      !dependencyTask ||
      !dependencyTask.dependencies ||
      dependencyTask.dependencies.length === 0
    ) {
      return false;
    }

    // Recursively check dependencies of dependencies
    return dependencyTask.dependencies.some((depId) =>
      hasDependency(task, depId, allTasks)
    );
  };

  // Handle edge deletion - remove the dependency
  const onEdgeDelete = useCallback(
    async (edge: Edge) => {
      if (!updateTask) return;

      const targetTask = tasks.find((task) => task.id === edge.target);
      if (targetTask && targetTask.dependencies) {
        const updatedTask = {
          ...targetTask,
          dependencies: targetTask.dependencies.filter(
            (depId) => depId !== edge.source
          ),
        };
        await updateTask(updatedTask);

        toast({
          title: "Dependency removed",
          description: "Task dependency has been removed.",
        });
      }
    },
    [tasks, updateTask]
  );

  // Handle edge click - we'll use this for deletion
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const confirmed = window.confirm(
        "Do you want to remove this dependency?"
      );
      if (confirmed) {
        setEdges((edges) => edges.filter((e) => e.id !== edge.id));
        onEdgeDelete(edge);
      }
    },
    [onEdgeDelete]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] p-8">
        <p className="text-lg">Loading task graph...</p>
      </div>
    );
  }

  const totalTasks = nodes.length;
  const completedTasks = nodes.filter((node) => node.data.completed).length;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Task Dependencies</h3>
          <p className="text-sm text-muted-foreground">
            {completedTasks} of {totalTasks} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHelpVisible(!helpVisible)}
          >
            <Info size={16} className="mr-1" />
            Help
          </Button>
        </div>
      </div>

      {helpVisible && (
        <div className="p-3 bg-muted/30 border-b">
          <h4 className="font-semibold flex items-center gap-1 mb-1">
            <AlertCircle size={16} />
            How to use the dependency graph
          </h4>
          <ul className="text-sm space-y-1 list-disc pl-5">
            <li>Drag nodes to rearrange the graph</li>
            <li>
              Connect tasks by dragging from one node to another (source→target)
            </li>
            <li>Click on connections to delete dependencies</li>
            <li>
              Tasks with dependencies can't be completed until prerequisites are
              done
            </li>
          </ul>
        </div>
      )}

      <div
        className="flex-grow"
        style={{
          height: "calc(100vh - 200px)",
          minHeight: "500px",
          width: "100%",
        }}
      >
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-muted-foreground">
              No tasks to display in graph view
            </p>
          </div>
        ) : (
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              style={{ background: "var(--background)" }}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}

// Add a default export for lazy loading
export default TaskGraph;
