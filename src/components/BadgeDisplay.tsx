import { useState, useEffect } from "react";
import { Badge as BadgeType, getGoalBadges } from "@/lib/gamificationUtils";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Medal, Trophy, LockKeyhole } from "lucide-react";

interface BadgeDisplayProps {
  goalId: string;
}

export function BadgeDisplay({ goalId }: BadgeDisplayProps) {
  const [badges, setBadges] = useState<{
    earnedBadges: BadgeType[];
    availableBadges: BadgeType[];
  }>({
    earnedBadges: [],
    availableBadges: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setLoading(true);
        const badgeData = await getGoalBadges(goalId);
        setBadges(badgeData);
      } catch (error) {
        console.error("Failed to load badges:", error);
      } finally {
        setLoading(false);
      }
    };

    if (goalId) {
      loadBadges();
    }
  }, [goalId]);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Medal size={16} className="text-achievo-purple" />
          Badges & Achievements
        </CardTitle>
        <CardDescription className="text-sm">
          Complete special challenges to earn badges
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-sm text-muted-foreground">Loading badges...</p>
          </div>
        ) : (
          <>
            {/* Earned Badges */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Earned Badges</h4>
              {badges.earnedBadges.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No badges earned yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    {badges.earnedBadges.map((badge) => (
                      <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                          <div className="w-10 h-10 flex items-center justify-center bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-help">
                            <span className="text-xl">{badge.icon}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-56">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {badge.name}
                            </p>
                            <p className="text-xs">{badge.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* Available Badges */}
            <div>
              <h4 className="text-sm font-medium mb-2">Available Badges</h4>
              {badges.availableBadges.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  All badges earned! Congratulations!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <TooltipProvider>
                    {badges.availableBadges.map((badge) => (
                      <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                          <div className="w-10 h-10 flex items-center justify-center bg-muted/30 border border-dashed rounded-lg opacity-60 hover:opacity-80 transition-opacity cursor-help">
                            <LockKeyhole
                              size={16}
                              className="text-muted-foreground"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-56">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {badge.name}
                            </p>
                            <p className="text-xs">{badge.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
