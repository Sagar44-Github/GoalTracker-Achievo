import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftCircle,
  Archive,
  ChevronLeft,
  RefreshCw,
  Database,
} from "lucide-react";
import { Goal, db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

export function ArchivedGoals() {
  const { goals, filteredGoals, filterGoals, updateGoal, refreshData } =
    useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbGoals, setDbGoals] = useState<Goal[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();

  // Function to check directly from database
  const checkDatabaseDirectly = async () => {
    try {
      // Get all goals directly from the database
      const allGoals = await db.getGoals();
      setDbGoals(allGoals);

      // Count archived goals in database
      const archivedCount = allGoals.filter(
        (g) => g.isArchived === true
      ).length;
      console.log(`Direct DB check: ${archivedCount} archived goals`);

      if (archivedCount > 0) {
        const archivedGoals = allGoals.filter((g) => g.isArchived === true);
        console.log("Archived goals from DB:", archivedGoals);
      }

      toast({
        title: "Database Check",
        description: `Found ${allGoals.length} total goals, ${archivedCount} archived.`,
      });
    } catch (error) {
      console.error("Error checking database:", error);
      toast({
        title: "Error",
        description: "Failed to check database",
        variant: "destructive",
      });
    }
  };

  // Function to load archived goals
  const loadArchivedGoals = async () => {
    setIsRefreshing(true);
    console.log("ArchivedGoals: Loading archived goals");
    console.log("Total goals before filtering:", goals.length);

    // First refresh data from database
    await refreshData();

    // Count archived goals directly
    const archivedCount = goals.filter((g) => g.isArchived === true).length;
    console.log(`Directly found ${archivedCount} archived goals`);

    // Apply filter
    filterGoals("archived");

    // Manually check again after filtering
    setTimeout(() => {
      console.log("ArchivedGoals: Filtered goals count:", filteredGoals.length);
      console.log(
        "ArchivedGoals: Filtered goal IDs:",
        filteredGoals.map((g) => g.id).join(", ")
      );
      setIsRefreshing(false);
    }, 100);
  };

  // Load archived goals when component mounts
  useEffect(() => {
    loadArchivedGoals();
  }, []);

  const handleUnarchive = async (goal: Goal) => {
    setIsLoading(true);
    try {
      console.log(`Unarchiving goal: ${goal.id} - ${goal.title}`);
      const updatedGoal = {
        ...goal,
        isArchived: false,
      };

      await updateGoal(updatedGoal);
      toast({
        title: "Goal Unarchived",
        description: `"${goal.title}" has been restored`,
      });

      // Reload all data
      await loadArchivedGoals();
    } catch (error) {
      console.error("Failed to unarchive goal:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive goal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    // Navigate back to the main app
    navigate("/");
  };

  // Get direct count of archived goals for comparison
  const archivedGoalsCount = goals.filter((g) => g.isArchived === true).length;
  const dbArchivedGoalsCount = dbGoals.filter(
    (g) => g.isArchived === true
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Archived Goals</h1>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={checkDatabaseDirectly}>
            <Database className="h-4 w-4 mr-1" />
            Check DB
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadArchivedGoals}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Debug info - will help identify if goals exist but aren't showing */}
      <div className="mb-4 p-2 bg-muted/40 rounded text-xs">
        <p>Total goals in memory: {goals.length}</p>
        <p>Total goals in DB: {dbGoals.length}</p>
        <p>Direct archived count (memory): {archivedGoalsCount}</p>
        <p>Direct archived count (DB): {dbArchivedGoalsCount}</p>
        <p>Filtered archived goals: {filteredGoals.length}</p>
        {(archivedGoalsCount > 0 || dbArchivedGoalsCount > 0) &&
          filteredGoals.length === 0 && (
            <div className="text-red-500 font-bold mt-2 p-1 bg-red-100 dark:bg-red-900 rounded">
              <p>Archived goals exist but aren't showing!</p>
              <p>Try checking the database directly and refreshing.</p>
            </div>
          )}

        {dbArchivedGoalsCount > 0 && (
          <Button
            variant="link"
            size="sm"
            className="text-xs p-0 mt-1 h-auto"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Hide Details" : "Show Details"}
          </Button>
        )}

        {showDebug && dbArchivedGoalsCount > 0 && (
          <div className="mt-2 p-2 bg-black/10 dark:bg-white/10 rounded overflow-x-auto">
            <pre className="text-xs">
              {JSON.stringify(
                dbGoals.filter((g) => g.isArchived === true),
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {filteredGoals.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[200px]">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <CardDescription className="text-lg">
              {archivedGoalsCount > 0 || dbArchivedGoalsCount > 0
                ? "Archived goals exist but aren't displaying properly"
                : "No archived goals found"}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {archivedGoalsCount > 0 || dbArchivedGoalsCount > 0
                ? "Try refreshing to fix this issue"
                : "When you archive goals, they will appear here"}
            </p>
            {(archivedGoalsCount > 0 || dbArchivedGoalsCount > 0) && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDatabaseDirectly}
                >
                  <Database className="h-4 w-4 mr-1" />
                  Check DB
                </Button>
                <Button variant="outline" size="sm" onClick={loadArchivedGoals}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <Card key={goal.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: goal.color || "#6b7280" }}
                  />
                  {goal.title}
                </CardTitle>
                <CardDescription>
                  Archived{" "}
                  {goal.lastActiveDate
                    ? formatDistanceToNow(goal.lastActiveDate, {
                        addSuffix: true,
                      })
                    : "some time ago"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Could add statistics or other info here */}
                <div className="text-sm text-muted-foreground">
                  {goal.taskIds?.length || 0} tasks
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ID: {goal.id}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleUnarchive(goal)}
                  disabled={isLoading}
                >
                  <ArrowLeftCircle className="h-4 w-4 mr-2" />
                  Unarchive Goal
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
