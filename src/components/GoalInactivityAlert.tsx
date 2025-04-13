import { useState, useEffect } from "react";
import { Goal } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Check, Edit, Moon, Archive, X, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GoalInactivityAlertProps {
  goal: Goal;
  onClose: () => void;
  inactiveDays: number;
}

export function GoalInactivityAlert({
  goal,
  onClose,
  inactiveDays,
}: GoalInactivityAlertProps) {
  const { updateGoal, deleteGoal } = useApp();

  // Handle reviving the goal
  const handleRevive = async () => {
    try {
      await updateGoal({
        ...goal,
        isPaused: false,
        isArchived: false,
        lastActiveDate: Date.now(),
      });

      toast({
        title: "Goal revived",
        description: `"${goal.title}" has been added to this week's mission queue.`,
      });

      onClose();
    } catch (error) {
      console.error("Error reviving goal:", error);
      toast({
        title: "Error",
        description: "Failed to revive goal.",
        variant: "destructive",
      });
    }
  };

  // Handle pausing the goal
  const handlePause = async () => {
    try {
      await updateGoal({
        ...goal,
        isPaused: true,
        isArchived: false,
      });

      toast({
        title: "Goal paused",
        description: `"${goal.title}" has been temporarily hidden from the dashboard.`,
      });

      onClose();
    } catch (error) {
      console.error("Error pausing goal:", error);
      toast({
        title: "Error",
        description: "Failed to pause goal.",
        variant: "destructive",
      });
    }
  };

  // Handle archiving the goal
  const handleArchive = async () => {
    try {
      await updateGoal({
        ...goal,
        isArchived: true,
        isPaused: false,
      });

      toast({
        title: "Goal archived",
        description: `"${goal.title}" has been moved to archives.`,
      });

      onClose();
    } catch (error) {
      console.error("Error archiving goal:", error);
      toast({
        title: "Error",
        description: "Failed to archive goal.",
        variant: "destructive",
      });
    }
  };

  return (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-sm font-medium">
        Goal Inactivity Notice
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          You haven't added or completed anything under "{goal.title}" in{" "}
          {inactiveDays} days. Still pursuing it?
        </p>

        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleRevive}
          >
            <Check size={14} className="text-green-600" />
            <span>Revive Goal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => {
              // Open the edit dialog through context
              // We'll update this when we create the goal edit functionality
              toast({
                title: "Redefine Goal",
                description: "Edit dialog opening...",
              });
              onClose();
            }}
          >
            <Edit size={14} className="text-blue-600" />
            <span>Redefine Goal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handlePause}
          >
            <Moon size={14} className="text-amber-600" />
            <span>Pause Goal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleArchive}
          >
            <Archive size={14} className="text-gray-600" />
            <span>Archive Goal</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={onClose}
          >
            <X size={14} />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
