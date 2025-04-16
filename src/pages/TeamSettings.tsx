import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Team, TeamMember } from "@/lib/db";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/teamUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Trash2, AlertTriangle } from "lucide-react";

export default function TeamSettings() {
  const { teamId } = useParams<{ teamId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [team, setTeam] = useState<Team | null>(null);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "",
  });

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

        // Initialize form data
        setFormData({
          name: teamData.name,
          description: teamData.description || "",
          color: teamData.color || "#4f46e5",
        });

        // Get team members
        const teamMembers = await db.getTeamMembers(teamId);

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

        // Check if user has edit permission
        if (!hasPermission(userMember, "edit_team")) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to edit team settings.",
            variant: "destructive",
          });
          navigate(`/teams/${teamId}`);
          return;
        }
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

  // Handle form change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team || !currentMember) return;

    // Validate
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Update team
      await db.updateTeam({
        ...team,
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      });

      toast({
        title: "Success",
        description: "Team settings updated successfully.",
      });

      // Refresh team data
      const updatedTeam = await db.getTeam(team.id);
      if (updatedTeam) {
        setTeam(updatedTeam);
      }
    } catch (error) {
      console.error("Error updating team:", error);
      toast({
        title: "Error",
        description: "Failed to update team settings.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!team || !currentMember) return;

    // Check if user has delete permission
    if (!hasPermission(currentMember, "delete_team")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete this team.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      await db.deleteTeam(team.id);

      toast({
        title: "Success",
        description: "Team deleted successfully.",
      });

      navigate("/teams");
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "Failed to delete team.",
        variant: "destructive",
      });
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No team or permission check failed
  if (!team || !currentMember) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="mb-6">You don't have permission to view this page.</p>
        <Button onClick={() => navigate("/teams")}>Back to Teams</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/teams/${team.id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          <span>Back to Team</span>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Team Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              Edit your team details and appearance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Team Color</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-16 h-10 p-1"
                  />
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6 flex items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Team Management */}
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Advanced team settings and actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: team.color || "#4f46e5" }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{team.name}</p>
                <p className="text-muted-foreground text-sm">
                  Code: {team.teamCode}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                These actions cannot be undone. Please be certain.
              </p>

              {hasPermission(currentMember, "delete_team") ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Team
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this team? This action
                        cannot be undone. All team members, tasks, and data will
                        be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTeam}
                        className="bg-destructive text-destructive-foreground"
                        disabled={deleting}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Team"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="destructive" className="w-full" disabled>
                  Delete Team (Requires Captain Permission)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
