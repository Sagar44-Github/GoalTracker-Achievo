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
import { CalendarDays, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedByDay: { date: string; count: number }[];
  tasksCompletedByHour: { hour: number; count: number }[];
  tasksCompletedByGoal: { goalId: string; goalTitle: string; count: number }[];
}

export function Dashboard() {
  const { goals, refreshData } = useApp();
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Today's Tasks Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays size={18} className="text-achievo-purple" />
                Today
              </CardTitle>
              <CardDescription>Tasks completed today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analyticsData?.tasksCompletedToday || 0}
              </p>
            </CardContent>
          </Card>

          {/* Weekly Tasks Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle size={18} className="text-achievo-blue" />
                This Week
              </CardTitle>
              <CardDescription>Tasks completed this week</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {analyticsData?.tasksCompletedThisWeek || 0}
              </p>
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp size={18} className="text-achievo-ocean-blue" />
                Longest Streak
              </CardTitle>
              <CardDescription>Consecutive days of activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{maxStreak}</p>
              {streakGoal && maxStreak > 0 && (
                <p className="text-sm text-muted-foreground">
                  on {streakGoal.title}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Most Productive Time Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock size={18} className="text-achievo-dark-purple" />
                Peak Hours
              </CardTitle>
              <CardDescription>Most productive time</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-3xl font-bold">-</p>
              ) : (
                <>
                  {analyticsData &&
                  analyticsData.tasksCompletedByHour.length > 0 ? (
                    <p className="text-3xl font-bold">
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
                    <p className="text-3xl font-bold">-</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          {/* Goal Completion Chart */}
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Tasks by Goal</CardTitle>
              <CardDescription>
                Distribution of completed tasks across goals
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="goalTitle"
                      label={({ goalTitle, percent }) =>
                        `${goalTitle}: ${(percent * 100).toFixed(0)}%`
                      }
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
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Activity Chart */}
          <Card className="h-[400px]">
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>
                Tasks completed over the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Completed"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Activity Chart */}
          <Card className="h-[400px] lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
              <CardDescription>
                When you're most productive throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              {lineData.some((item) => item.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} tasks`, "Completed"]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#0EA5E9"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Tasks Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
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
