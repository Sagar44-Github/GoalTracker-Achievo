import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Task } from "@/lib/db";
import { cn } from "@/lib/utils";
import { CalendarDays, CheckCircle, Lock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/taskUtils";

interface TaskNodeProps {
  data: {
    label: string;
    task: Task;
    completed: boolean;
    priority: "low" | "medium" | "high";
    dueDate: string | null;
    isBlocked: boolean;
  };
  isConnectable: boolean;
}

function TaskNode({ data, isConnectable }: TaskNodeProps) {
  const { task, completed, priority, dueDate, isBlocked } = data;

  // Determine priority styling
  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-orange-500 dark:text-orange-400";
      case "low":
        return "text-blue-500 dark:text-blue-400";
      default:
        return "";
    }
  };

  const formattedDueDate = dueDate ? formatDate(dueDate) : null;

  return (
    <div
      className={cn(
        "p-3 min-w-52 max-w-72 rounded-lg shadow-md border",
        completed
          ? "bg-green-50 dark:bg-green-950 border-green-500"
          : "bg-card",
        !completed && isBlocked && "opacity-60"
      )}
    >
      {/* Source handle - where arrows start */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
      />

      {/* Target handle - where arrows end */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-primary"
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
                {formattedDueDate}
              </div>
            )}

            <div
              className={cn("flex items-center text-xs", getPriorityColor())}
            >
              <AlertCircle size={10} className="mr-1" />
              {priority}
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="px-1.5 py-0 text-[10px]"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {isBlocked && !completed && (
        <div className="mt-2 text-xs flex items-center text-muted-foreground">
          <Lock size={10} className="mr-1" />
          Waiting for prerequisite tasks
        </div>
      )}
    </div>
  );
}

export default memo(TaskNode);
