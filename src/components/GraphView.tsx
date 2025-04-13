import React, { useState, useEffect, useCallback } from "react";
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
import {
  AlertCircle,
  Info,
  Lock,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/taskUtils";

// Define the custom node component directly in this file
const TaskNode = ({ data, isConnectable }: any) => {
  const { task, completed, priority, dueDate, isBlocked } = data;

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-orange-500";
      case "low":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "p-3 min-w-52 max-w-72 rounded-lg shadow-md border bg-background",
        completed ? "bg-green-50 dark:bg-green-950 border-green-500" : "",
        !completed && isBlocked ? "opacity-60" : ""
      )}
    >
      {/* Source handle - where arrows start */}
      <div
        className="w-3 h-3 absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-primary rounded-full"
        style={{ position: "absolute", zIndex: 1 }}
      />

      {/* Target handle - where arrows end */}
      <div
        className="w-3 h-3 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full"
        style={{ position: "absolute", zIndex: 1 }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            {completed ? (
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
            ) : isBlocked ? (
              <Lock size={16} className="text-muted-foreground flex-shrink-0" />
            ) : (
              <div
                className={cn(
                  "flex-shrink-0 w-4 h-4 rounded-full",
                  priority === "high"
                    ? "bg-red-500"
                    : priority === "medium"
                    ? "bg-orange-500"
                    : "bg-blue-500"
                )}
              />
            )}
            <h3
              className={cn(
                "font-medium text-sm",
                completed && "line-through text-muted-foreground"
              )}
            >
              {data.label}
            </h3>
          </div>

          <div className="mt-2 flex flex-wrap gap-1">
            {dueDate && (
              <div className="flex items-center text-xs text-muted-foreground">
                <CalendarDays size={10} className="mr-1" />
                {formatDate(dueDate)}
              </div>
            )}

            <div
              className={cn(
                "flex items-center text-xs",
                getPriorityColor(priority)
              )}
            >
              <AlertCircle size={10} className="mr-1" />
              {priority}
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-1.5 py-0 text-[10px]"
                >
                  #{tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  +{task.tags.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {isBlocked && !completed && (
        <div className="mt-2 text-xs flex items-center text-muted-foreground">
          <Lock size={10} className="mr-1" />
          Waiting for prerequisites
        </div>
      )}
    </div>
  );
};

export function GraphView({ goalId }: { goalId: string }) {
  const { tasks, updateTask } = useApp();

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  console.log("GraphView rendering with goalId:", goalId);

  // Define custom node types
  const nodeTypes = {
    taskNode: TaskNode,
  };

  // Function to convert tasks to nodes
  const tasksToNodes = useCallback(
    (tasks: Task[]): Node[] => {
      // Only include tasks for the current goal and non-quiet tasks
      const goalTasks = tasks.filter(
        (task) =>
          (goalId ? task.goalId === goalId : true) &&
          !task.isArchived &&
          task.isQuiet !== true
      );

      // Use a grid layout for initial positioning
      const columns = Math.ceil(Math.sqrt(goalTasks.length));

      return goalTasks.map((task, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        return {
          id: task.id,
          position: { x: column * 300, y: row * 200 },
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
            isCriticalPath: false,
          },
          type: "taskNode",
        };
      });
    },
    [goalId]
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
    if (tasks && tasks.length > 0) {
      const newNodes = tasksToNodes(tasks);
      const newEdges = createEdges(tasks);
      console.log("Setting graph data:", {
        nodes: newNodes.length,
        edges: newEdges.length,
      });
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [tasks, tasksToNodes, createEdges]);

  // Handle node changes (position, selection)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
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
      if (connection.source && connection.target) {
        const sourceTask = tasks.find((task) => task.id === connection.source);
        const targetTask = tasks.find((task) => task.id === connection.target);

        if (sourceTask && targetTask) {
          // Check if this would create a circular dependency
          if (connection.source === connection.target) {
            toast({
              title: "Invalid dependency",
              description: "A task cannot depend on itself",
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

  // Handle edge deletion - remove the dependency
  const onEdgeDelete = useCallback(
    async (edge: Edge) => {
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
          description: "Task dependency has been removed",
        });
      }
    },
    [tasks, updateTask]
  );

  // Handle edge click - we'll use this for deletion
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
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
            <li>Connect tasks by dragging from one node to another</li>
            <li>Click on connections to delete dependencies</li>
            <li>
              Tasks with dependencies can't be completed until prerequisites are
              done
            </li>
          </ul>
        </div>
      )}

      <div
        className="relative flex-grow"
        style={{ minHeight: "500px", height: "100%" }}
      >
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-muted-foreground">
              No tasks to display in graph view
            </p>
          </div>
        ) : (
          <ReactFlowProvider>
            <div style={{ height: "100%", width: "100%" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                fitView
                connectionMode="loose"
                proOptions={{ hideAttribution: true }}
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
