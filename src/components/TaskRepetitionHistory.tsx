import { useState, useEffect } from "react";
import { Task } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flame, CalendarDays, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getTaskCompletionHistory,
  getMotivationalMessage,
  getWeekdayConsistency,
} from "@/lib/taskHistoryUtils";

interface TaskRepetitionHistoryProps {
  task: Task;
}

interface CompletionData {
  date: string;
  completed: boolean;
}

export function TaskRepetitionHistory({ task }: TaskRepetitionHistoryProps) {
  const [completionHistory, setCompletionHistory] = useState<CompletionData[]>(
    []
  );
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [weekdayStats, setWeekdayStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch task history from the database
  useEffect(() => {
    async function fetchTaskHistory() {
      try {
        setIsLoading(true);

        // Use our utility function to get task history data
        const historyData = await getTaskCompletionHistory(task.id);

        setCompletionHistory(historyData.completionHistory);
        setCurrentStreak(historyData.currentStreak);
        setLongestStreak(historyData.longestStreak);
        setMissedCount(historyData.missedCount);

        // Calculate weekday consistency
        const weekdayData = getWeekdayConsistency(
          historyData.completionHistory
        );
        setWeekdayStats(weekdayData);
      } catch (error) {
        console.error("Error fetching task history:", error);
        // Fallback to mock data for demonstration
        generateMockCompletionData();
      } finally {
        setIsLoading(false);
      }
    }

    if (task.repeatPattern) {
      fetchTaskHistory();
    }
  }, [task]);

  // Generate mock completion data for demonstration as fallback
  const generateMockCompletionData = () => {
    const today = new Date();
    const history: CompletionData[] = [];

    // Generate 12 weeks of data (84 days)
    for (let i = 0; i < 84; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Create somewhat realistic patterns
      // Higher completion rate for recent days, more random for older days
      const recentThreshold = 14; // More consistent recent pattern

      let completed = false;
      if (i < recentThreshold) {
        // Recent days: 80% completion rate with a pattern
        completed = i % 2 === 0 || Math.random() < 0.3;
      } else {
        // Older days: More random with 60% completion rate
        completed = Math.random() < 0.6;
      }

      history.push({
        date: dateStr,
        completed,
      });
    }

    setCompletionHistory(history);

    // Calculate streaks and stats
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Current streak
    let current = 0;
    for (const entry of sortedHistory) {
      if (entry.completed) {
        current++;
      } else {
        break;
      }
    }

    // Longest streak
    let longest = 0;
    let currentRun = 0;
    for (const entry of sortedHistory) {
      if (entry.completed) {
        currentRun++;
        longest = Math.max(longest, currentRun);
      } else {
        currentRun = 0;
      }
    }

    // Missed days
    const last28Days = sortedHistory.slice(0, 28);
    const missedDays = last28Days.filter((entry) => !entry.completed).length;

    setCurrentStreak(current);
    setLongestStreak(longest);
    setMissedCount(missedDays);

    // Calculate weekday consistency
    const weekdayData = getWeekdayConsistency(history);
    setWeekdayStats(weekdayData);
  };

  // If there's no repeat pattern, we don't show this component
  if (!task.repeatPattern) {
    return null;
  }

  // Find the best weekday (highest completion percentage)
  const getBestWeekday = () => {
    if (!weekdayStats.length) return null;

    const bestDay = weekdayStats.reduce(
      (best, day) => (day.percentage > best.percentage ? day : best),
      weekdayStats[0]
    );

    return bestDay.percentage > 50 ? bestDay : null;
  };

  const bestWeekday = getBestWeekday();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays size={16} className="text-achievo-purple" />
          Repetition History
        </CardTitle>
        <CardDescription className="text-sm">
          Track your habit consistency for "{task.title}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Loading history data...
            </p>
          </div>
        ) : (
          <>
            {/* Streaks Summary */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Current Streak</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {currentStreak}{" "}
                  <span className="text-sm font-normal">days</span>
                </p>
              </div>

              <div className="flex-1 bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-1 text-sm">
                  <Flame className="h-4 w-4 text-achievo-purple" />
                  <span className="font-medium">Longest Streak</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {longestStreak}{" "}
                  <span className="text-sm font-normal">days</span>
                </p>
              </div>

              <div className="flex-1 bg-muted/20 rounded-lg p-3">
                <div className="flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Missed</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {missedCount}{" "}
                  <span className="text-sm font-normal">days</span>
                </p>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-achievo-purple/10 rounded-lg p-3 mb-4">
              <p className="text-center font-medium text-sm">
                {getMotivationalMessage(
                  currentStreak,
                  longestStreak,
                  missedCount
                )}
              </p>
            </div>

            {/* Best Performance Day */}
            {bestWeekday && (
              <div className="mb-4 bg-muted/10 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium">Best day:</span> You complete
                  this task {bestWeekday.percentage}% of the time on{" "}
                  <span className="font-semibold text-achievo-purple">
                    {bestWeekday.name}s
                  </span>
                  !
                </p>
              </div>
            )}

            {/* Completion Heatmap */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Completion Heatmap</h4>
              <div className="flex flex-wrap gap-1">
                {completionHistory.slice(0, 84).map((entry, index) => (
                  <div
                    key={entry.date}
                    className={cn(
                      "w-3 h-3 rounded-sm transition-colors",
                      entry.completed
                        ? "bg-achievo-purple hover:bg-achievo-purple/80"
                        : "bg-muted hover:bg-muted/80"
                    )}
                    title={`${entry.date}: ${
                      entry.completed ? "Completed" : "Missed"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  84 days ago
                </span>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
            </div>

            {/* Helpful Tips */}
            <div className="text-xs text-muted-foreground">
              <p>
                Tip: Consistent completion builds stronger habits. Try to avoid
                breaking your streak!
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
