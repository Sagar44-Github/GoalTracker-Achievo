import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Team, TeamMember, TeamTask } from "@/lib/db";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/teamUtils";
import { generateLeaderboard } from "@/lib/teamUtils";
import { calculateTaskPoints } from "@/lib/teamUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  ClipboardList,
  Trophy,
  Plus,
  Loader2,
  Settings,
  UserCog,
  Crown,
  ArrowLeft,
  Check,
  XCircle,
} from "lucide-react";

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  // Form states
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    assignedTo: "",
  });

  const [showAddTask, setShowAddTask] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId || !currentUser) return;

      setLoading(true);
      try {
        // Get team
        const teamData = await db.getTeam(teamId);
        if (!teamData) {
          toast({
            title: "Error",
            description: "Team not found.",
            variant: "destructive",
          });
          navigate("/teams");
          return;
        }
        setTeam(teamData);

        // Get team members
        const teamMembers = await db.getTeamMembers(teamId);
        setMembers(teamMembers);

        // Find current user's member record
        const userMember = teamMembers.find(
          (m) => m.userId === currentUser.uid
        );
        if (!userMember) {
          toast({
            title: "Access Denied",
            description: "You are not a member of this team.",
            variant: "destructive",
          });
          navigate("/teams");
          return;
        }
        setCurrentMember(userMember);

        // Get team tasks
        const teamTasks = await db.getTeamTasks(teamId);
        setTasks(teamTasks);
      } catch (error) {
        console.error("Error fetching team data:", error);
        toast({
          title: "Error",
          description: "Failed to load team data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, currentUser, navigate]);

  // Handle creating a new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !team || !currentMember) return;

    // Check if user has permission to assign tasks
    if (!hasPermission(currentMember, "assign_tasks")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to assign tasks.",
        variant: "destructive",
      });
      return;
    }

    if (!newTask.title.trim() || !newTask.assignedTo) {
      toast({
        title: "Error",
        description: "Please enter a task title and select a team member.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Create the team task
      const taskId = await db.createTeamTask({
        title: newTask.title.trim(),
        description: newTask.description?.trim() || "",
        dueDate: null,
        suggestedDueDate: null,
        goalId: null,
        tags: [],
        completed: false,
        priority: newTask.priority,
        isArchived: false,
        isQuiet: false,
        repeatPattern: null,
        completionTimestamp: null,
        dependencies: [],
        teamId: team.id,
        assignedBy: currentUser.uid,
        assignedTo: newTask.assignedTo,
        pointValue: calculateTaskPoints(newTask.priority),
      });

      // Reset form and refresh tasks
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
      });
      setShowAddTask(false);

      // Refresh tasks
      const teamTasks = await db.getTeamTasks(team.id);
      setTasks(teamTasks);

      toast({
        title: "Task Created",
        description: "Team task has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating team task:", error);
      toast({
        title: "Error",
        description: "Failed to create team task.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle completing a task
  const handleCompleteTask = async (taskId: string) => {
    if (!currentUser || !team) return;

    try {
      await db.completeTeamTask(taskId);

      // Refresh tasks and members (for updated points)
      const teamTasks = await db.getTeamTasks(team.id);
      setTasks(teamTasks);

      const teamMembers = await db.getTeamMembers(team.id);
      setMembers(teamMembers);

      // Update current member
      const userMember = teamMembers.find((m) => m.userId === currentUser.uid);
      if (userMember) {
        setCurrentMember(userMember);
      }

      toast({
        title: "Task Completed",
        description: "Task marked as complete and points awarded.",
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task.",
        variant: "destructive",
      });
    }
  };

  // Handle changing a member's role
  const handleChangeRole = async (
    memberId: string,
    newRole: TeamMember["role"]
  ) => {
    if (!currentUser || !team || !currentMember) return;

    // Check if user has permission to promote members
    if (!hasPermission(currentMember, "promote_members")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to change member roles.",
        variant: "destructive",
      });
      return;
    }

    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      await db.changeTeamMemberRole(team.id, member.userId, newRole);

      // Refresh members
      const teamMembers = await db.getTeamMembers(team.id);
      setMembers(teamMembers);

      // Update current member in case their role changed
      const userMember = teamMembers.find((m) => m.userId === currentUser.uid);
      if (userMember) {
        setCurrentMember(userMember);
      }

      toast({
        title: "Role Changed",
        description: `${member.displayName}'s role has been updated to ${newRole}.`,
      });
    } catch (error) {
      console.error("Error changing role:", error);
      toast({
        title: "Error",
        description: "Failed to change member role.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team || !currentMember) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Team Not Found</h1>
        <p className="mb-6">
          The team you're looking for doesn't exist or you don't have access.
        </p>
        <Button onClick={() => navigate("/teams")}>Back to Teams</Button>
      </div>
    );
  }

  // Generate leaderboard
  const leaderboard = generateLeaderboard(members);

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/teams")}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Back to Teams</span>
        </Button>

        {hasPermission(currentMember, "edit_team") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/teams/${team.id}/settings`)}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Team Settings</span>
          </Button>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: team.color || "#4f46e5" }}
          >
            {team.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-muted-foreground">{team.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="outline" className="px-3 py-1">
            Code: {team.teamCode}
          </Badge>
          <Badge
            variant={currentMember.role === "captain" ? "default" : "secondary"}
            className="px-3 py-1 capitalize"
          >
            {currentMember.role}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList size={16} />
            <span>Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users size={16} />
            <span>Members</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy size={16} />
            <span>Leaderboard</span>
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Team Tasks</h2>

            {hasPermission(currentMember, "assign_tasks") && (
              <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>Add Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Team Task</DialogTitle>
                    <DialogDescription>
                      Assign a new task to a team member. They will earn points
                      when the task is completed.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        placeholder="What needs to be done?"
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="task-description">
                        Description (Optional)
                      </Label>
                      <Textarea
                        id="task-description"
                        placeholder="Add details about this task"
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="task-priority">Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value) =>
                          setNewTask({
                            ...newTask,
                            priority: value as "low" | "medium" | "high",
                          })
                        }
                      >
                        <SelectTrigger id="task-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (1 point)</SelectItem>
                          <SelectItem value="medium">
                            Medium (3 points)
                          </SelectItem>
                          <SelectItem value="high">High (5 points)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="task-assignee">Assign To</Label>
                      <Select
                        value={newTask.assignedTo}
                        onValueChange={(value) =>
                          setNewTask({ ...newTask, assignedTo: value })
                        }
                      >
                        <SelectTrigger id="task-assignee">
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.userId}>
                              {member.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={
                          submitting ||
                          !newTask.title.trim() ||
                          !newTask.assignedTo
                        }
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Task"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-muted-foreground mb-4">
                No tasks yet
              </h3>
              <p className="mb-6 max-w-md mx-auto">
                {hasPermission(currentMember, "assign_tasks")
                  ? "Create some tasks and assign them to team members."
                  : "There are no tasks assigned to team members yet."}
              </p>
              {hasPermission(currentMember, "assign_tasks") && (
                <Button onClick={() => setShowAddTask(true)}>
                  Add First Task
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tasks assigned to current user */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Tasks</h3>
                <div className="space-y-2">
                  {tasks
                    .filter(
                      (task) =>
                        task.assignedTo === currentUser?.uid && !task.completed
                    )
                    .map((task) => (
                      <Card key={task.id} className="relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 w-1 h-full"
                          style={{
                            backgroundColor:
                              task.priority === "high"
                                ? "#ef4444"
                                : task.priority === "medium"
                                ? "#f59e0b"
                                : "#84cc16",
                          }}
                        />
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="capitalize">
                                {task.priority} Priority
                              </Badge>
                              <Badge variant="secondary">
                                {task.pointValue} points
                              </Badge>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteTask(task.id)}
                            className="flex items-center gap-1"
                          >
                            <Check size={16} />
                            <span>Complete</span>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}

                  {tasks.filter(
                    (task) =>
                      task.assignedTo === currentUser?.uid && !task.completed
                  ).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      You have no pending tasks.
                    </p>
                  )}
                </div>
              </div>

              {/* All team tasks */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Team Tasks</h3>
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const assignee = members.find(
                      (m) => m.userId === task.assignedTo
                    );

                    return (
                      <Card
                        key={task.id}
                        className={`relative overflow-hidden ${
                          task.completed ? "opacity-70" : ""
                        }`}
                      >
                        <div
                          className="absolute top-0 left-0 w-1 h-full"
                          style={{
                            backgroundColor:
                              task.priority === "high"
                                ? "#ef4444"
                                : task.priority === "medium"
                                ? "#f59e0b"
                                : "#84cc16",
                          }}
                        />
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                {task.title}
                                {task.completed && (
                                  <Badge variant="outline" className="ml-2">
                                    Completed
                                  </Badge>
                                )}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {task.assignedTo === currentUser?.uid &&
                              !task.completed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCompleteTask(task.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Check size={16} />
                                  <span>Complete</span>
                                </Button>
                              )}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {task.priority} Priority
                            </Badge>
                            <Badge variant="secondary">
                              {task.pointValue} points
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Assigned to: {assignee?.displayName || "Unknown"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Team Members</h2>
          </div>

          <div className="space-y-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.displayName}</h4>
                        {member.role === "captain" && (
                          <Crown size={16} className="text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                        <Badge variant="secondary">
                          {member.points} points
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Role change dropdown (only visible for captains) */}
                  {hasPermission(currentMember, "promote_members") &&
                    member.userId !== currentMember.userId && (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleChangeRole(
                            member.id,
                            value as "captain" | "vice-captain" | "member"
                          )
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="captain">Captain</SelectItem>
                          <SelectItem value="vice-captain">
                            Vice Captain
                          </SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Team Leaderboard</h2>
            <p className="text-muted-foreground">
              Team members earn points by completing tasks.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Points Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                        {entry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.name}</p>
                          {entry.role === "captain" && (
                            <Crown size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {entry.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-500" />
                      <span className="font-bold">{entry.points} points</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
