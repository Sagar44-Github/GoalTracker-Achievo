import { useState } from "react";
import { DiagnosticModal } from "./DiagnosticModal";
import { DatabaseIcon } from "lucide-react";

const [showDiagnostics, setShowDiagnostics] = useState(false);

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