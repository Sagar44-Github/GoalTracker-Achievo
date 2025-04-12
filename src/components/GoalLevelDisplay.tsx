import { useState, useEffect } from "react";
import { Goal } from "@/lib/db";
import { calculateLevel, prestigeGoal } from "@/lib/gamificationUtils";
import { useApp } from "@/context/AppContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trophy, Zap, BarChart2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface GoalLevelDisplayProps {
  goal: Goal;
}

export function GoalLevelDisplay({ goal }: GoalLevelDisplayProps) {
  const { refreshData } = useApp();
  const [levelInfo, setLevelInfo] = useState({
    level: goal.level || 1,
    currentLevelXP: 0,
    nextLevelXP: 100,
    xpProgress: 0,
  });
  const [canPrestige, setCanPrestige] = useState(false);
  const [xpAnimValue, setXpAnimValue] = useState(0);

  useEffect(() => {
    // Calculate level info
    const currentXP = goal.xp || 0;
    const info = calculateLevel(currentXP);
    setLevelInfo(info);

    // Check if can prestige (at max level with 100% XP)
    setCanPrestige(info.level === 10 && info.xpProgress >= 1);

    // Animate XP bar filling
    setXpAnimValue(0);
    const timeout = setTimeout(() => {
      setXpAnimValue(Math.round(info.xpProgress * 100));
    }, 100);

    return () => clearTimeout(timeout);
  }, [goal]);

  const handlePrestige = async () => {
    const result = await prestigeGoal(goal.id);

    if (result.success) {
      toast({
        title: "Goal Prestiged!",
        description: `Your goal has been prestiged to level ${result.prestigeLevel}!`,
        variant: "default",
      });

      await refreshData();
    } else {
      toast({
        title: "Cannot Prestige Yet",
        description: "Reach max level first to prestige this goal",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            Goal Progress
          </CardTitle>
          {goal.prestigeLevel && goal.prestigeLevel > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: goal.prestigeLevel }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className="text-yellow-500 fill-yellow-500"
                />
              ))}
              <span className="text-xs font-semibold">
                Prestige {goal.prestigeLevel}
              </span>
            </div>
          )}
        </div>
        <CardDescription className="text-sm">
          Level up your goal by completing tasks
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Level & XP Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-sm">
              <Zap size={16} className="text-achievo-purple" />
              <span className="font-medium">Level {levelInfo.level}</span>
            </div>
            <span className="text-xs font-mono">
              {levelInfo.currentLevelXP}/{levelInfo.nextLevelXP} XP
            </span>
          </div>

          <Progress value={xpAnimValue} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground mb-1">Streak</div>
            <div className="text-lg font-bold">
              {goal.streakCounter || 0} days
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground mb-1">Total XP</div>
            <div className="text-lg font-bold">{goal.xp || 0}</div>
          </div>
        </div>

        {/* Prestige Button */}
        {canPrestige && (
          <Button
            onClick={handlePrestige}
            className="w-full bg-gradient-to-r from-yellow-500 to-achievo-purple hover:from-yellow-600 hover:to-achievo-purple/90"
          >
            <Star className="mr-2 h-4 w-4" /> Prestige This Goal
          </Button>
        )}

        {/* Prestige Explanation */}
        {!canPrestige && levelInfo.level < 10 && (
          <div className="text-xs text-center text-muted-foreground">
            Reach Level 10 to prestige this goal
          </div>
        )}
      </CardContent>

      {goal.prestigeLevel && goal.prestigeLevel > 0 && (
        <CardFooter className="pt-0">
          <div className="w-full text-xs text-center">
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5"
            >
              <Star
                size={12}
                className="text-yellow-500 fill-yellow-500 mr-1"
              />
              Prestiged {goal.prestigeLevel}{" "}
              {goal.prestigeLevel === 1 ? "time" : "times"}
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
