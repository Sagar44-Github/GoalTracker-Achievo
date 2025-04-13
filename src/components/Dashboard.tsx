import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getTasksForAnalysis } from "@/lib/goalUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  CalendarDays,
  CheckCircle,
  TrendingUp,
  Clock,
  ChevronUp,
  ChevronDown,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { addPrebuiltData, addInactivityDemoData } from "@/lib/prebuiltData";
import { toast } from "@/hooks/use-toast";
import { GoalInactivityAlerts } from "./GoalInactivityAlerts";

interface AnalyticsData {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedByDay: { date: string; count: number }[];
  tasksCompletedByHour: { hour: number; count: number }[];
  tasksCompletedByGoal: { goalId: string; goalTitle: string; count: number }[];
}

export function Dashboard() {
  const appContext = useApp();

  // Return early if context is not available
  if (!appContext) {
    console.error("App context not available in Dashboard");
    return null;
  }

  const { goals, refreshData, toggleGamificationView } = appContext;
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getTasksForAnalysis();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Failed to load analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [refreshData]);

  // Format data for charts
  const formatDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatHour = (hour: number) => {
    return `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
  };

  // Prepare data for pie chart (by goal)
  const pieData =
    analyticsData?.tasksCompletedByGoal.filter((g) => g.count > 0) || [];

  // Prepare data for bar chart (by day)
  const barData =
    analyticsData?.tasksCompletedByDay.map((d) => ({
      name: formatDayOfWeek(d.date),
      count: d.count,
    })) || [];

  // Prepare data for line chart (by hour)
  const lineData =
    analyticsData?.tasksCompletedByHour.map((h) => ({
      name: formatHour(h.hour),
      count: h.count,
    })) || [];

  // Colors for pie chart
  const COLORS = [
    "#9b87f5",
    "#1EAEDB",
    "#0EA5E9",
    "#7E69AB",
    "#FF6B6B",
    "#4CAF50",
    "#FFA726",
    "#26C6DA",
  ];

  // Determine longest streak
  const maxStreak = goals.reduce(
    (max, goal) => Math.max(max, goal.stats.streak),
    0
  );
  const streakGoal = goals.find((goal) => goal.stats.streak === maxStreak);

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
              onClick={async () => {
                try {
                  await addPrebuiltData();
                  await addInactivityDemoData();
                  await refreshData();
                  toast({
                    title: "Success",
                    description: "Demo data has been added!",
                  });
                } catch (error) {
                  console.error("Failed to add demo data:", error);
                  toast({
                    title: "Error",
                    description: "Failed to add demo data.",
                    variant: "destructive",
                  });
                }
              }}
            >
              <span>Add Demo Data</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => toggleGamificationView(true)}
            >
              <Trophy size={16} className="text-yellow-500" />
              <span className="hidden sm:inline">View Achievements</span>
              <span className="sm:hidden">Achievements</span>
            </Button>
          </div>
        </div>

        {/* Goal Inactivity Alerts */}
        <GoalInactivityAlerts />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          {/* Today's Tasks Card */}
          <Card>
            <CardHeader className="p-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                <CalendarDays size={16} className="text-achievo-purple" />
                <span>Today</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tasks completed today
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <p className="text-xl sm:text-3xl font-bold">
                {analyticsData?.tasksCompletedToday || 0}
              </p>
            </CardContent>
          </Card>

          {/* Weekly Tasks Card */}
          <Card>
            <CardHeader className="p-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                <CheckCircle size={16} className="text-achievo-blue" />
                <span>This Week</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tasks completed this week
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <p className="text-xl sm:text-3xl font-bold">
                {analyticsData?.tasksCompletedThisWeek || 0}
              </p>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card>
            <CardHeader className="p-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                <TrendingUp size={16} className="text-achievo-ocean-blue" />
                <span>Streak</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Consecutive days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              <p className="text-xl sm:text-3xl font-bold">{maxStreak}</p>
              {streakGoal && maxStreak > 0 && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  on {streakGoal.title}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Most Productive Time Card */}
          <Card>
            <CardHeader className="p-2 sm:p-4 sm:pb-2">
              <CardTitle className="text-sm sm:text-lg flex items-center gap-1 sm:gap-2">
                <Clock size={16} className="text-achievo-dark-purple" />
                <span>Peak Hours</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Most productive
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
              {loading ? (
                <p className="text-xl sm:text-3xl font-bold">-</p>
              ) : (
                <>
                  {analyticsData &&
                  analyticsData.tasksCompletedByHour.length > 0 ? (
                    <p className="text-xl sm:text-3xl font-bold">
                      {formatHour(
                        analyticsData.tasksCompletedByHour.reduce(
                          (maxHour, current) =>
                            current.count >
                            analyticsData.tasksCompletedByHour[maxHour].count
                              ? current.hour
                              : maxHour,
                          0
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-xl sm:text-3xl font-bold">-</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 pb-6 sm:pb-10">
          {/* Goal Completion Chart */}
          <Card className="h-[300px] sm:h-[400px]">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">
                Tasks by Goal
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution of completed tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0 h-[200px] sm:h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="goalTitle"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} tasks`, name]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Activity Chart */}
          <Card className="h-[300px] sm:h-[400px]">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">
                Daily Activity
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tasks completed over the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0 h-[200px] sm:h-[300px]">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barData}
                    margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Completed"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#9b87f5"
                      radius={[4, 4, 0, 0]}
                      name="Tasks Completed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Activity Chart */}
          <Card className="h-[300px] sm:h-[400px] lg:col-span-2">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-sm sm:text-base">
                Activity by Hour
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                When you're most productive
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0 h-[200px] sm:h-[300px]">
              {lineData.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Completed"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0EA5E9"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
