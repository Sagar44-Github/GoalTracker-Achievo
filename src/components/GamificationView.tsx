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
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { GoalInactivitySettings } from "./GoalInactivitySettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GamificationView() {
  const { goals, toggleGamificationView } = useApp();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("badges");

  // Get the selected goal from the goals list
  const selectedGoal = selectedGoalId
    ? goals.find((g) => g.id === selectedGoalId)
    : goals.length > 0
    ? goals[0]
    : null;

  useEffect(() => {
    if (goals.length > 0 && !selectedGoalId) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-5xl translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-200 sm:rounded-lg md:w-full overflow-y-auto max-h-[90vh] bg-background border">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Achievement Center</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGamificationView(false)}
            >
              <X size={18} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Goal Achievements</h3>
                  <p className="text-muted-foreground">
                    Track your progress and earn badges
                  </p>
                </div>

                <div className="mt-2 md:mt-0">
                  <Select
                    value={selectedGoalId || ""}
                    onValueChange={(value) => setSelectedGoalId(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          {goal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="badges">
                  <BadgeDisplay goal={selectedGoal} />
                </TabsContent>
                <TabsContent value="stats">
                  <Card>
                    <CardHeader>
                      <CardTitle>Goal Statistics</CardTitle>
                      <CardDescription>
                        Your progress and achievements for this goal
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedGoal && (
                          <>
                            <div>
                              <h4 className="font-medium mb-2">
                                Task Completion Rate
                              </h4>
                              <div className="flex justify-between text-sm mb-1">
                                <span>
                                  {selectedGoal.stats?.completed || 0}/
                                  {selectedGoal.stats?.total || 0} Tasks
                                </span>
                                <span>
                                  {selectedGoal.stats?.percentage || 0}%
                                </span>
                              </div>
                              <Progress
                                value={selectedGoal.stats?.percentage || 0}
                                className="h-2"
                              />
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">
                                Consecutive Days Streak
                              </h4>
                              <div className="flex items-center">
                                <Flame className="text-orange-500 mr-2" />
                                <span className="text-xl font-bold">
                                  {selectedGoal.stats?.streak || 0}
                                </span>
                                <span className="ml-1 text-muted-foreground">
                                  days
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">
                                Level Progress
                              </h4>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Level {selectedGoal.level || 1}</span>
                                <span>
                                  {selectedGoal.xp || 0}/
                                  {(selectedGoal.level || 1) * 100} XP
                                </span>
                              </div>
                              <Progress
                                value={
                                  ((selectedGoal.xp || 0) /
                                    ((selectedGoal.level || 1) * 100)) *
                                  100
                                }
                                className="h-2"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity History</CardTitle>
                      <CardDescription>
                        Your recent activities for this goal
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>History will be shown here...</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <GoalLevelDisplay goal={selectedGoal} />

              {/* Add Goal Inactivity Settings */}
              <GoalInactivitySettings />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
