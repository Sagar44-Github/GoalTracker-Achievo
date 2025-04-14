import { useState } from "react";
import { Task, Goal } from "@/lib/db";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Star, Sparkles, Flag, Award, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DayBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface TimelineCardProps {
  date: Date;
  tasks: Task[];
  taskCount: number;
  productivity: "low" | "medium" | "high";
  badges: string[];
  goals: Goal[];
  onCardClick: () => void;
}

export function TimelineCard({
  date,
  tasks,
  taskCount,
  productivity,
  badges,
  goals,
  onCardClick,
}: TimelineCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getProductivityColor = (productivity: "low" | "medium" | "high") => {
    switch (productivity) {
      case "high":
        return "bg-green-100 dark:bg-green-900/30";
      case "medium":
        return "bg-blue-100 dark:bg-blue-900/30";
      case "low":
        return "bg-gray-100 dark:bg-gray-800/30";
    }
  };

  const getTaskGoal = (task: Task) => {
    if (!task.goalId) return null;
    return goals.find((goal) => goal.id === task.goalId);
  };

  const getDayBadges = (badges: string[]): DayBadge[] => {
    const badgeMap: Record<string, DayBadge> = {
      "today-complete": {
        id: "today-complete",
        title: "Today Complete",
        description: "You completed tasks today!",
        icon: <Star className="h-4 w-4 text-yellow-500" />,
      },
      "productive-day": {
        id: "productive-day",
        title: "Highly Productive",
        description: "You completed 5 or more tasks today!",
        icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      },
      "new-goal": {
        id: "new-goal",
        title: "New Beginning",
        description: "You created a new goal on this day",
        icon: <Flag className="h-4 w-4 text-blue-500" />,
      },
    };

    return badges.map((badge) => badgeMap[badge]).filter(Boolean);
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 w-28 rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md",
        getProductivityColor(productivity),
        isHovered && "ring-2 ring-primary/50"
      )}
      onClick={onCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-2 bg-black/5 dark:bg-white/5 text-center">
        <div className="font-semibold">{format(date, "EEE")}</div>
        <div className="text-xs opacity-80">{format(date, "MMM d")}</div>
      </div>

      <div className="p-3 h-48 flex flex-col">
        {taskCount > 0 ? (
          <>
            <div className="mb-2 text-center">
              <span className="text-2xl font-bold">{taskCount}</span>
              <span className="text-xs ml-1 text-muted-foreground">tasks</span>
            </div>

            <div className="flex gap-1 flex-wrap mb-auto">
              {tasks.slice(0, 3).map((task) => {
                const goal = getTaskGoal(task);
                return (
                  <Badge
                    key={task.id}
                    variant="outline"
                    className="truncate max-w-full text-xs"
                    style={{
                      backgroundColor: goal?.color
                        ? `${goal.color}20`
                        : undefined,
                      borderColor: goal?.color ? `${goal.color}40` : undefined,
                    }}
                  >
                    {task.title.length > 16
                      ? `${task.title.substring(0, 16)}...`
                      : task.title}
                  </Badge>
                );
              })}
              {tasks.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tasks.length - 3} more
                </Badge>
              )}
            </div>

            {badges.length > 0 && (
              <div className="flex gap-1 justify-center mt-auto">
                {getDayBadges(badges)
                  .slice(0, 2)
                  .map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.title}
                      className="flex items-center"
                    >
                      {badge.icon}
                    </div>
                  ))}
                {badges.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{badges.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Quick emoji summary */}
            {isHovered && (
              <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1 shadow-sm">
                {productivity === "high" && "🔥"}
                {productivity === "medium" && "✨"}
                {productivity === "low" && "📝"}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <span>No tasks</span>
          </div>
        )}
      </div>
    </div>
  );
}
 