import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Team, TeamMember } from "@/lib/db";
import { db } from "@/lib/db";
import { addSampleTeam } from "@/lib/prebuiltData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus, Loader2, UserPlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Teams() {
  const { currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-teams");

  // Form states
  const [joinCode, setJoinCode] = useState("");
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    color: "#4f46e5", // Default color
  });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // Fetch user's teams
  useEffect(() => {
    const fetchTeams = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const userTeams = await db.getTeamsForUser(currentUser.uid);
        setTeams(userTeams);

        // Fetch members for each team
        const membersObj: Record<string, TeamMember[]> = {};
        for (const team of userTeams) {
          membersObj[team.id] = await db.getTeamMembers(team.id);
        }
        setTeamMembers(membersObj);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Failed to load your teams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [currentUser]);

  // Handle join team
  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to join a team.",
        variant: "destructive",
      });
      return;
    }

    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid team code.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const teamMember = await db.joinTeam(
        joinCode.trim().toUpperCase(),
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Team Member"
      );

      if (teamMember) {
        toast({
          title: "Success",
          description: "You have joined the team successfully!",
        });
        setJoinCode("");

        // Refresh teams
        const userTeams = await db.getTeamsForUser(currentUser.uid);
        setTeams(userTeams);

        // Switch to my teams tab
        setActiveTab("my-teams");
      }
    } catch (error) {
      console.error("Error joining team:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to join team.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle create team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a team.",
        variant: "destructive",
      });
      return;
    }

    if (!newTeam.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const team = await db.createTeam({
        name: newTeam.name.trim(),
        description: newTeam.description.trim(),
        color: newTeam.color,
        createdBy: currentUser.uid,
      });

      toast({
        title: "Success",
        description: `Team "${team.name}" created with code: ${team.teamCode}`,
      });

      // Reset form
      setNewTeam({
        name: "",
        description: "",
        color: "#4f46e5",
      });

      // Refresh teams and switch to my teams tab
      const userTeams = await db.getTeamsForUser(currentUser.uid);
      setTeams(userTeams);
      setActiveTab("my-teams");
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle team selection
  const handleViewTeam = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  // Add sample team for demonstration
  const handleAddSampleTeam = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add a sample team.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    toast({
      title: "Creating Sample Team",
      description: "Please wait while we set up your sample team...",
    });

    try {
      // Call the addSampleTeam function with the current user's info
      await addSampleTeam(
        currentUser.uid,
        currentUser.displayName || currentUser.email || "Captain"
      );

      toast({
        title: "Success",
        description:
          "A sample team with members and tasks has been created for you!",
      });

      // Refresh teams
      const userTeams = await db.getTeamsForUser(currentUser.uid);
      setTeams(userTeams);

      // Refresh team members for the newly created team
      const membersObj: Record<string, TeamMember[]> = {};
      for (const team of userTeams) {
        membersObj[team.id] = await db.getTeamMembers(team.id);
      }
      setTeamMembers(membersObj);

      // Switch to my-teams tab
      setActiveTab("my-teams");
    } catch (error) {
      console.error("Error adding sample team:", error);
      toast({
        title: "Error",
        description: "Failed to add sample team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Teams</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="my-teams" className="flex items-center gap-2">
            <Users size={16} />
            <span>My Teams</span>
          </TabsTrigger>
          <TabsTrigger value="join-team" className="flex items-center gap-2">
            <UserPlus size={16} />
            <span>Join Team</span>
          </TabsTrigger>
          <TabsTrigger value="create-team" className="flex items-center gap-2">
            <Plus size={16} />
            <span>Create Team</span>
          </TabsTrigger>
        </TabsList>

        {/* My Teams Tab */}
        <TabsContent value="my-teams">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-muted-foreground mb-4">
                You're not a member of any teams yet
              </h3>
              <p className="mb-6 max-w-md mx-auto">
                Create a new team or join an existing one using a team code.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setActiveTab("join-team")}>
                  Join a Team
                </Button>
                <Button onClick={() => setActiveTab("create-team")}>
                  Create a Team
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAddSampleTeam}
                  className="flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus2 size={16} />
                      <span>Add Sample Team</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSampleTeam}
                  className="flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus2 size={16} />
                      <span>Add Sample Team</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => {
                  const members = teamMembers[team.id] || [];
                  const userMember = members.find(
                    (m) => m.userId === currentUser?.uid
                  );

                  return (
                    <Card key={team.id} className="overflow-hidden">
                      <div
                        className="h-2"
                        style={{ backgroundColor: team.color || "#4f46e5" }}
                      />
                      <CardHeader>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>{team.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium">
                            Team Code:
                          </span>
                          <Badge variant="outline">{team.teamCode}</Badge>
                        </div>

                        <div className="mb-4">
                          <span className="text-sm font-medium block mb-2">
                            Your Role:
                          </span>
                          <Badge
                            variant={
                              userMember?.role === "captain"
                                ? "default"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {userMember?.role || "Member"}
                          </Badge>
                        </div>

                        <div>
                          <span className="text-sm font-medium block mb-2">
                            Members:
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {members.length} member
                            {members.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => handleViewTeam(team.id)}
                        >
                          View Team
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Join Team Tab */}
        <TabsContent value="join-team">
          <Card>
            <CardHeader>
              <CardTitle>Join a Team</CardTitle>
              <CardDescription>
                Enter the team code provided by your team captain to join.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="join-code">Team Code</Label>
                  <Input
                    id="join-code"
                    placeholder="Enter 6-character team code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="uppercase"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !joinCode.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Team"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Team Tab */}
        <TabsContent value="create-team">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Team</CardTitle>
              <CardDescription>
                Create a team and invite others to join with a unique team code.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={newTeam.name}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="team-description">
                    Description (Optional)
                  </Label>
                  <Input
                    id="team-description"
                    placeholder="Brief description of your team"
                    value={newTeam.description}
                    onChange={(e) =>
                      setNewTeam({ ...newTeam, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="team-color">Team Color</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="team-color"
                      type="color"
                      value={newTeam.color}
                      onChange={(e) =>
                        setNewTeam({ ...newTeam, color: e.target.value })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: newTeam.color }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || !newTeam.name.trim()}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
