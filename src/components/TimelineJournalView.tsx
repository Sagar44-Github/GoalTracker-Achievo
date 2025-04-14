import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { Task, HistoryEntry, db } from "@/lib/db";
import { format, subDays, isSameDay, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Award,
  Tag,
  Flag,
  Sparkles,
  Smile,
  Meh,
  Frown,
  MessageSquare,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimelineCard } from "./TimelineCard";

interface DayData {
  date: Date;
  tasks: Task[];
  history: HistoryEntry[];
  taskCount: number;
  productivity: "low" | "medium" | "high";
  badges: string[];
}

interface DayBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function TimelineJournalView() {
  const appContext = useApp();
  const goals = appContext?.goals || [];
  const timelineRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState<DayData[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);

  // Number of days to show in the timeline
  const daysToShow = 30;

  useEffect(() => {
    loadTimelineData();
  }, []);

  const loadTimelineData = async () => {
    setIsLoading(true);
    try {
      // Get all tasks and history entries
      const allTasks = await db.getTasks();
      const historyEntries = await db.getHistory(500); // Get up to 500 recent history entries

      const today = new Date();
      const timelineData: DayData[] = [];

      // Generate data for the past N days
      for (let i = 0; i < daysToShow; i++) {
        const date = subDays(today, i);
        const dayTasks = allTasks.filter(
          (task) =>
            task.completionTimestamp &&
            isSameDay(new Date(task.completionTimestamp), date)
        );

        const dayHistory = historyEntries.filter((entry) =>
          isSameDay(new Date(entry.timestamp), date)
        );

        // Determine productivity level based on task count
        let productivity: "low" | "medium" | "high" = "low";
        if (dayTasks.length >= 5) {
          productivity = "high";
        } else if (dayTasks.length >= 2) {
          productivity = "medium";
        }

        // Generate badges for special achievements
        const badges: string[] = [];
        if (dayTasks.length > 0 && i === 0) {
          badges.push("today-complete");
        }
        if (dayTasks.length >= 5) {
          badges.push("productive-day");
        }
        if (
          dayHistory.some(
            (entry) => entry.type === "add" && entry.entityType === "goal"
          )
        ) {
          badges.push("new-goal");
        }

        timelineData.push({
          date,
          tasks: dayTasks,
          history: dayHistory,
          taskCount: dayTasks.length,
          productivity,
          badges,
        });
      }

      setDays(timelineData);
    } catch (error) {
      console.error("Error loading timeline data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayClick = (day: DayData) => {
    setSelectedDay(day);
    setShowDayDialog(true);
  };

  const scrollTimeline = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      timelineRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
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

  const getTaskGoal = (task: Task) => {
    if (!task.goalId) return null;
    return goals.find((goal) => goal.id === task.goalId);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Timeline Journal</h2>
          <p className="text-muted-foreground">
            Your journey of accomplishments and growth
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadTimelineData()}
            title="Refresh timeline"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollTimeline("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollTimeline("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex space-x-4 overflow-hidden py-8">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-20 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="flex space-x-4 overflow-x-auto pb-4 pt-2 px-2"
          style={{ scrollBehavior: "smooth" }}
          ref={timelineRef}
        >
          {days.map((day, index) => (
            <TimelineCard
              key={day.date.toISOString()}
              date={day.date}
              tasks={day.tasks}
              taskCount={day.taskCount}
              productivity={day.productivity}
              badges={day.badges}
              goals={goals}
              onCardClick={() => handleDayClick(day)}
            />
          ))}
        </div>
      )}

      {/* Day Detail Dialog */}
      {selectedDay && (
        <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(selectedDay.date, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Badges Section */}
              {selectedDay.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {getDayBadges(selectedDay.badges).map((badge) => (
                    <Badge
                      key={badge.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1"
                    >
                      {badge.icon}
                      <span>{badge.title}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Tasks Completed Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  Tasks Completed
                </h3>

                {selectedDay.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDay.tasks.map((task) => {
                      const goal = getTaskGoal(task);
                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-md border bg-card flex justify-between items-start"
                        >
                          <div>
                            <div className="font-medium">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-2">
                              {goal && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: goal.color
                                      ? `${goal.color}20`
                                      : undefined,
                                    borderColor: goal.color
                                      ? `${goal.color}40`
                                      : undefined,
                                  }}
                                >
                                  {goal.title}
                                </Badge>
                              )}

                              {task.tags &&
                                task.tags.map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs flex items-center gap-1"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                          </div>

                          {task.completionTimestamp && (
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(task.completionTimestamp),
                                "h:mm a"
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No tasks completed on this day
                  </div>
                )}
              </div>

              {/* Notes & Activity Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  Activity Log
                </h3>

                {selectedDay.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDay.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="text-sm flex items-center gap-2 p-2 rounded-md bg-muted/30"
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          {entry.type === "add" &&
                            entry.entityType === "goal" && (
                              <span>
                                Created a new goal:{" "}
                                <strong>{entry.details?.title}</strong>
                              </span>
                            )}
                          {entry.type === "add" &&
                            entry.entityType === "task" && (
                              <span>
                                Added a new task:{" "}
                                <strong>{entry.details?.title}</strong>
                              </span>
                            )}
                          {entry.type === "edit" && (
                            <span>
                              Edited {entry.entityType}:{" "}
                              <strong>{entry.details?.title}</strong>
                            </span>
                          )}
                          {entry.type === "complete" && (
                            <span>
                              {entry.details?.completed
                                ? "Completed"
                                : "Uncompleted"}{" "}
                              task: <strong>{entry.details?.title}</strong>
                            </span>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {format(new Date(entry.timestamp), "h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    No activity recorded on this day
                  </div>
                )}
              </div>

              {/* Productivity Summary */}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Daily Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedDay.taskCount === 0 && "No tasks completed"}
                      {selectedDay.taskCount === 1 && "1 task completed"}
                      {selectedDay.taskCount > 1 &&
                        `${selectedDay.taskCount} tasks completed`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedDay.productivity === "high" && (
                      <Smile className="h-6 w-6 text-green-500" />
                    )}
                    {selectedDay.productivity === "medium" && (
                      <Meh className="h-6 w-6 text-blue-500" />
                    )}
                    {selectedDay.productivity === "low" && (
                      <Frown className="h-6 w-6 text-muted-foreground" />
                    )}

                    <div className="text-sm font-medium">
                      {selectedDay.productivity === "high" &&
                        "Highly Productive Day"}
                      {selectedDay.productivity === "medium" &&
                        "Productive Day"}
                      {selectedDay.productivity === "low" &&
                        "Light Activity Day"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
