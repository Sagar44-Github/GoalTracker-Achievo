import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  calculateLevel,
  Badge as BadgeType,
  BADGES,
} from "@/lib/gamificationUtils";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  Award,
  Star,
  BarChart3,
  Target,
  Flame,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function GamificationView() {
  const { goals, tasks } = useApp();
  const [totalXP, setTotalXP] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate total user XP across all goals
  useEffect(() => {
    if (!goals) return;

    const xpSum = goals.reduce((sum, goal) => sum + (goal.xp || 0), 0);
    setTotalXP(xpSum);
  }, [goals]);

  // Calculate user level based on total XP
  const userLevel = calculateLevel(totalXP);

  // Find the highest streak among all goals
  const highestStreak = goals?.length
    ? Math.max(...goals.map((goal) => goal.streakCounter || 0))
    : 0;

  // Count completed tasks
  const completedTasks = tasks?.filter((task) => task.completed)?.length || 0;

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Achievements & Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and earn badges as you complete tasks
          </p>
        </div>
      </div>

      {/* User Level Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              User Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-2">
                <span className="text-4xl font-bold text-primary">
                  {userLevel.level}
                </span>
              </div>
              <h3 className="font-semibold">Level {userLevel.level}</h3>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span>XP: {userLevel.currentLevelXP}</span>
                  <span>Next: {userLevel.nextLevelXP}</span>
                </div>
                <Progress value={userLevel.xpProgress * 100} className="h-2" />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Total XP: {totalXP}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-orange-500/10 p-4 mb-2">
                <span className="text-4xl font-bold text-orange-500">
                  {highestStreak}
                </span>
              </div>
              <h3 className="font-semibold">Day Streak</h3>
              <p className="text-sm text-muted-foreground mt-4">
                {highestStreak > 0
                  ? `You're on a ${highestStreak} day streak!`
                  : "Start your streak by completing tasks today!"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="inline-flex items-center justify-center rounded-full bg-green-500/10 p-4 mb-2">
                <span className="text-4xl font-bold text-green-500">
                  {completedTasks}
                </span>
              </div>
              <h3 className="font-semibold">Completed Tasks</h3>
              <p className="text-sm text-muted-foreground mt-4">
                {completedTasks > 0
                  ? `Great job! You've completed ${completedTasks} tasks.`
                  : "Complete tasks to see your progress here."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1">
            <Medal className="w-4 h-4" />
            <span>All Badges</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>Goal Progress</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals?.slice(0, 4).map((goal) => (
              <BadgeDisplay key={goal.id} goalId={goal.id} />
            ))}
          </div>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Available Badges</CardTitle>
              <CardDescription>
                Complete special tasks to earn these badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {BADGES.map((badge) => (
                  <div
                    key={badge.id}
                    className="border rounded-lg p-4 text-center"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals?.map((goal) => (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{goal.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Level {goal.level || 1}</span>
                        <span>XP: {goal.xp || 0}</span>
                      </div>
                      <Progress
                        value={calculateLevel(goal.xp || 0).xpProgress * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="bg-orange-500/10 rounded-full p-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                      </div>
                      <span className="text-sm">
                        Streak: {goal.streakCounter || 0} days
                      </span>
                    </div>

                    {goal.prestigeLevel ? (
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-500/10 rounded-full p-1">
                          <Award className="w-4 h-4 text-purple-500" />
                        </div>
                        <span className="text-sm">
                          Prestige Level: {goal.prestigeLevel}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
