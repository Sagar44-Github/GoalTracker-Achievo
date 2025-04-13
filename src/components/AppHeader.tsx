import { useState } from "react";
import { DiagnosticModal } from "./DiagnosticModal";
import { DatabaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  return (
    <>
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
    </>
  );
}
