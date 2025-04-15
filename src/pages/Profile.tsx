import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
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

export default function Profile() {
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

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
    if (!currentUser?.email) return "U";
    const email = currentUser.email;
    return email.charAt(0).toUpperCase();
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentUser?.photoURL || ""} alt="Profile" />
              <AvatarFallback className="text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Profile
          </CardTitle>
          <CardDescription className="text-center">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/")}
          >
            Back to Dashboard
          </Button>
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
