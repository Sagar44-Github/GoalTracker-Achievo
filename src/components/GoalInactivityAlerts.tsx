import { useState } from "react";
import { Goal } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { GoalInactivityAlert } from "./GoalInactivityAlert";

export function GoalInactivityAlerts() {
  const appContext = useApp();
  const inactiveGoals = appContext?.inactiveGoals || [];
  const dismissInactiveGoal = appContext?.dismissInactiveGoal || (() => {});
  const inactivityThreshold = appContext?.inactivityThreshold || 10;

  if (inactiveGoals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      {inactiveGoals.map((goal) => (
        <GoalInactivityAlert
          key={goal.id}
          goal={goal}
          inactiveDays={inactivityThreshold}
          onClose={() => dismissInactiveGoal(goal.id)}
        />
      ))}
    </div>
  );
}
