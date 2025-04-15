import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserProfile, db } from "@/lib/db";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parse, parseISO } from "date-fns";
import { CalendarIcon, Save, Loader2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Available avatar icons
const avatarIcons = [
  { id: "default", name: "Default" },
  { id: "cat", name: "Cat", emoji: "🐱" },
  { id: "dog", name: "Dog", emoji: "🐶" },
  { id: "rocket", name: "Rocket", emoji: "🚀" },
  { id: "star", name: "Star", emoji: "⭐" },
  { id: "heart", name: "Heart", emoji: "❤️" },
  { id: "book", name: "Book", emoji: "📚" },
  { id: "music", name: "Music", emoji: "🎵" },
  { id: "sports", name: "Sports", emoji: "🏅" },
  { id: "code", name: "Code", emoji: "💻" },
  { id: "art", name: "Art", emoji: "🎨" },
  { id: "coffee", name: "Coffee", emoji: "☕" },
];

export default function Profile() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [saveLoading, setSaveLoading] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const appContext = useApp();

  // User profile state
  const [profile, setProfile] = useState<UserProfile>({
    userId: currentUser?.uid || "",
    displayName: currentUser?.displayName || "",
    customAvatar: currentUser?.photoURL || "",
    avatarIcon: "default",
    dateOfBirth: "",
    bio: "",
    location: "",
    hobbies: [],
    socialLinks: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // New hobby field
  const [newHobby, setNewHobby] = useState("");

  // Fetch user profile when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser?.uid) {
        setLoading(true);
        try {
          const userProfile = await db.getUserProfile(currentUser.uid);
          if (userProfile) {
            setProfile(userProfile);
          } else {
            // Create a default profile
            const defaultProfile: UserProfile = {
              userId: currentUser.uid,
              displayName: currentUser.displayName || "",
              customAvatar: currentUser.photoURL || "",
              avatarIcon: "default",
              hobbies: [],
              socialLinks: {},
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await db.createOrUpdateUserProfile(defaultProfile);
            setProfile(defaultProfile);
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Failed to load user profile");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Refresh goals when component mounts
  useEffect(() => {
    if (appContext?.refreshData) {
      appContext.refreshData().catch((err) => {
        console.error("Error refreshing data:", err);
      });
    }
  }, [appContext]);

  async function handleLogout() {
    setError("");

    try {
      await logout();
      navigate("/login");
    } catch {
      setError("Failed to log out");
    }
  }

  // Function to get user's initials for avatar fallback
  function getUserInitials() {
    if (profile.displayName) {
      return profile.displayName.charAt(0).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "U";
  }

  // Function to save profile changes
  async function saveProfile() {
    if (!currentUser) return;

    setSaveLoading(true);
    setError("");
    setSuccess("");

    try {
      await db.createOrUpdateUserProfile({
        ...profile,
        updatedAt: Date.now(),
      });
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile changes");
    } finally {
      setSaveLoading(false);
    }
  }

  // Function to add hobby
  function addHobby() {
    if (newHobby.trim() && !profile.hobbies?.includes(newHobby.trim())) {
      setProfile({
        ...profile,
        hobbies: [...(profile.hobbies || []), newHobby.trim()],
      });
      setNewHobby("");
    }
  }

  // Function to remove hobby
  function removeHobby(hobby: string) {
    setProfile({
      ...profile,
      hobbies: profile.hobbies?.filter((h) => h !== hobby) || [],
    });
  }

  // Handle goal change
  function handleGoalChange(goalId: string) {
    if (appContext?.setCurrentGoalId) {
      if (goalId) {
        appContext.setCurrentGoalId(goalId);
      } else {
        appContext.setCurrentGoalId(null);
      }
    }
  }

  // Get avatar display
  function getAvatarDisplay() {
    // If user has selected a custom icon
    if (profile.avatarIcon && profile.avatarIcon !== "default") {
      const icon = avatarIcons.find((i) => i.id === profile.avatarIcon);
      if (icon && icon.emoji) {
        return <div className="text-4xl">{icon.emoji}</div>;
      }
    }

    // Otherwise use photo URL or fallback
    return (
      <>
        <AvatarImage src={profile.customAvatar || ""} alt="Profile" />
        <AvatarFallback className="text-2xl">
          {getUserInitials()}
        </AvatarFallback>
      </>
    );
  }

  // Filtered active goals from app context
  const goals = appContext?.goals || [];
  const currentGoalId = appContext?.currentGoalId || "";
  const activeGoals = goals.filter((goal) => !goal.isArchived);

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-4xl shadow-lg flex flex-col max-h-[90vh]">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">{getAvatarDisplay()}</Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {profile.displayName || currentUser?.email || "Profile"}
          </CardTitle>
          <CardDescription className="text-center">
            Manage your account and personal information
          </CardDescription>
        </CardHeader>

        <Tabs
          defaultValue="account"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="account" className="flex-1">
                Account
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex-1">
                Personal
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex-1">
                Appearance
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="space-y-4 pt-6 flex-1 overflow-y-auto">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert
                variant="default"
                className="bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
              >
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="account" className="space-y-4 mt-0 h-full">
              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email
                </h3>
                <p className="mt-1">{currentUser?.email}</p>
              </div>

              {currentUser?.emailVerified ? (
                <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <h3 className="text-sm font-medium text-green-600 dark:text-green-400">
                    Email Verified
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your email has been verified.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Email Not Verified
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Please verify your email address.
                  </p>
                </div>
              )}

              <div className="border rounded-lg p-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Account Created
                </h3>
                <p className="mt-1">
                  {currentUser?.metadata.creationTime
                    ? new Date(
                        currentUser.metadata.creationTime
                      ).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  placeholder="Your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primaryGoal">Primary Goal</Label>
                {appContext ? (
                  <Select
                    value={currentGoalId || ""}
                    onValueChange={handleGoalChange}
                  >
                    <SelectTrigger id="primaryGoal" className="w-full">
                      <SelectValue placeholder="Select your primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No primary goal</SelectItem>
                      {activeGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id}>
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: goal.color || "#888" }}
                            />
                            {goal.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="border rounded p-3 text-center text-muted-foreground">
                    Goal selection not available
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your primary goal will be displayed first in your dashboard.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4 mt-0 h-full">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="dateOfBirth"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {profile.dateOfBirth ? (
                        format(
                          parse(profile.dateOfBirth, "yyyy-MM-dd", new Date()),
                          "PPP"
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        profile.dateOfBirth
                          ? parse(profile.dateOfBirth, "yyyy-MM-dd", new Date())
                          : undefined
                      }
                      onSelect={(date) =>
                        setProfile({
                          ...profile,
                          dateOfBirth: date
                            ? format(date, "yyyy-MM-dd")
                            : undefined,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, location: e.target.value })
                  }
                  placeholder="Your location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  placeholder="Tell us about yourself"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Hobbies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.hobbies?.map((hobby) => (
                    <Badge key={hobby} className="px-3 py-1">
                      {hobby}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeHobby(hobby)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newHobby}
                    onChange={(e) => setNewHobby(e.target.value)}
                    placeholder="Add a hobby"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addHobby();
                      }
                    }}
                  />
                  <Button onClick={addHobby}>Add</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-0 h-full">
              <div className="space-y-2">
                <Label>Choose Your Avatar</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                  {avatarIcons.map((icon) => (
                    <Button
                      key={icon.id}
                      variant={
                        profile.avatarIcon === icon.id ? "default" : "outline"
                      }
                      className="h-16 flex flex-col justify-center items-center"
                      onClick={() =>
                        setProfile({ ...profile, avatarIcon: icon.id })
                      }
                    >
                      <div className="text-2xl mb-1">
                        {icon.emoji || icon.name.charAt(0)}
                      </div>
                      <div className="text-xs">{icon.name}</div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAvatar">Custom Avatar URL</Label>
                <Input
                  id="customAvatar"
                  value={profile.customAvatar || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, customAvatar: e.target.value })
                  }
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL for your custom avatar image.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>

        <CardFooter className="flex flex-col gap-2 border-t p-4 bg-slate-50 dark:bg-slate-900 sticky bottom-0">
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              onClick={saveProfile}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
