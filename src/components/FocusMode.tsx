import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { X, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export function FocusMode() {
  // Get context safely
  const appContext = useApp();

  // Default values if context is not available
  const isFocusMode = appContext?.isFocusMode || false;
  const focusTimer = appContext?.focusTimer || null;
  const exitFocusMode = appContext?.exitFocusMode || (() => {});

  if (!isFocusMode) {
    return null;
  }

  // Format the timer (MM:SS)
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "25:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      {/* Timer UI */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-pulse-slow z-50">
        <Timer className="text-achievo-purple" size={18} />
        <span className="font-mono font-bold text-lg text-achievo-purple">
          {formatTime(focusTimer)}
        </span>
      </div>

      {/* Exit button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => exitFocusMode()}
        >
          <X size={16} className="mr-1" />
          Exit Focus Mode
        </Button>
      </div>
    </>
  );
}
