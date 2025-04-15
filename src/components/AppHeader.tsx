import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DiagnosticModal } from "./DiagnosticModal";
import { DatabaseIcon, UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppHeader() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  function getUserInitials() {
    if (!currentUser?.email) return "U";
    const email = currentUser.email;
    return email.charAt(0).toUpperCase();
  }

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser?.photoURL || ""} alt="Profile" />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">
                {currentUser?.displayName || currentUser?.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
          Login
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDiagnostics(true)}
        title="Database Diagnostics"
      >
        <DatabaseIcon className="h-5 w-5" />
      </Button>

      <DiagnosticModal
        open={showDiagnostics}
        onOpenChange={setShowDiagnostics}
      />
    </div>
  );
}
