import React, { useRef, useState, useEffect, useContext } from "react";
import {
  eachDayOfInterval,
  subDays,
  format,
  isToday,
  isWeekend,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import TimelineCard from "./TimelineCard";
import { AppContext } from "../context/AppContext";
import { Goal, HistoryEntry, Task } from "../lib/db";
import { mockTimelineDb } from "../lib/mockTimelineData";

interface TimelineProps {
  initialDays?: number;
}

const Timeline: React.FC<TimelineProps> = ({ initialDays = 30 }) => {
  const { goals } = useContext(AppContext);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [days, setDays] = useState(initialDays);
  const [loading, setLoading] = useState(true);
  const [timelineTasks, setTimelineTasks] = useState<Task[]>([]);
  const [timelineHistory, setTimelineHistory] = useState<HistoryEntry[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      setLoading(true);

      try {
        // In a real implementation, you would use your actual database
        // For now, we'll use the mock data
        const tasks = await mockTimelineDb.getTasks();
        const history = await mockTimelineDb.getHistory();

        setTimelineTasks(tasks);
        setTimelineHistory(history);
      } catch (error) {
        console.error("Error loading timeline data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTimelineData();
  }, [days]);

  // Get date range for the timeline
  const dateRange = eachDayOfInterval({
    start: subDays(new Date(), days - 1),
    end: new Date(),
  });

  // Scroll to today when the component mounts
  useEffect(() => {
    if (timelineRef.current) {
      const timeline = timelineRef.current;
      const scrollWidth = timeline.scrollWidth;
      const clientWidth = timeline.clientWidth;
      timeline.scrollLeft = scrollWidth - clientWidth;
    }
  }, [loading]);

  // Handle scrolling left/right
  const handleScroll = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const timeline = timelineRef.current;
      const scrollAmount = timeline.clientWidth * 0.8;

      if (direction === "left") {
        timeline.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        timeline.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // Load more days
  const loadMoreDays = () => {
    setDays((prev) => prev + 30);
  };

  // Calculate productivity score (0-10) based on completed tasks and goal progress
  const getProductivityScore = (date: Date): number => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Count completed tasks on this day
    const completedTasks = timelineTasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = format(new Date(task.completedAt), "yyyy-MM-dd");
      return completedDate === dateStr;
    });

    // Count history entries on this day
    const dayHistoryEntries = timelineHistory.filter((entry) => {
      const entryDate = format(new Date(entry.timestamp), "yyyy-MM-dd");
      return entryDate === dateStr;
    });

    // Basic algorithm: score based on # of completed tasks and activities
    // More sophisticated algorithms could factor in task difficulty, goal progress, etc.
    const taskScore = Math.min(completedTasks.length * 2, 10);
    const activityScore = Math.min(dayHistoryEntries.length, 5);

    // Combine scores with weights
    const combinedScore = taskScore * 0.7 + activityScore * 0.3;

    // Lower weekend expectations slightly
    const weekendFactor = isWeekend(date) ? 1.25 : 1;

    // Calculate final score (0-10)
    return Math.min(Math.round(combinedScore * weekendFactor), 10);
  };

  // Get tasks for a specific day
  const getTasksForDay = (date: Date): Task[] => {
    const dateStr = format(date, "yyyy-MM-dd");

    return timelineTasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = format(new Date(task.completedAt), "yyyy-MM-dd");
      return completedDate === dateStr;
    });
  };

  // Get badges for special days
  const getBadgesForDay = (date: Date): string[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    const badges: string[] = [];

    const tasksCompleted = timelineTasks.filter((task) => {
      if (!task.completedAt) return false;
      const completedDate = format(new Date(task.completedAt), "yyyy-MM-dd");
      return completedDate === dateStr;
    }).length;

    // Award badges based on activity
    if (tasksCompleted >= 10) badges.push("perfect");
    if (tasksCompleted >= 5) badges.push("achievement");

    // Add streak badges (in a real app, you'd calculate actual streaks)
    if (dateStr.endsWith("7") || dateStr.endsWith("0")) {
      badges.push("streak");
    }

    // Check for milestones in history
    const hasMilestone = timelineHistory.some((entry) => {
      const entryDate = format(new Date(entry.timestamp), "yyyy-MM-dd");
      return entryDate === dateStr && entry.type === "milestone";
    });

    if (hasMilestone) badges.push("milestone");

    return badges;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Timeline Journal
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMoreDays()}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span>{days} days</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <div className="flex">
            <button
              onClick={() => handleScroll("left")}
              className="p-1 rounded-l-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className="p-1 rounded-r-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={timelineRef}
            className="flex gap-3 overflow-x-auto pb-4 snap-x"
            style={{ scrollbarWidth: "thin" }}
          >
            {dateRange.map((date) => {
              const dayTasks = getTasksForDay(date);
              const productivity = getProductivityScore(date);
              const badges = getBadgesForDay(date);

              return (
                <div key={date.toISOString()} className="snap-center">
                  <TimelineCard
                    date={date}
                    tasks={dayTasks}
                    taskCount={dayTasks.length}
                    productivity={productivity}
                    badges={badges}
                    goals={goals}
                    selected={
                      selectedDate
                        ? selectedDate.toDateString() === date.toDateString()
                        : false
                    }
                    onCardClick={() => setSelectedDate(date)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="mt-6 border rounded-lg p-4 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {isToday(selectedDate)
                ? "Today"
                : format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h3>
            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Completed Tasks Section */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Completed Tasks
              </h4>
              <div className="space-y-2">
                {getTasksForDay(selectedDate).length > 0 ? (
                  getTasksForDay(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <div className="mt-0.5 min-w-4">
                        <div className="h-4 w-4 rounded-full bg-green-500 dark:bg-green-600"></div>
                      </div>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.goalId &&
                          goals.find((g) => g.id === task.goalId) && (
                            <div className="flex items-center gap-1 mt-1">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: goals.find(
                                    (g) => g.id === task.goalId
                                  )?.color,
                                }}
                              ></div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {goals.find((g) => g.id === task.goalId)?.title}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                    No tasks completed on this day
                  </div>
                )}
              </div>
            </div>

            {/* Journal Notes Section - In a real app, you would load actual notes */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Journal Notes
              </h4>
              <div className="p-2 text-sm text-gray-500 dark:text-gray-400">
                No notes for this day
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
