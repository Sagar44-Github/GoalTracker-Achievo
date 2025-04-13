import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DiagnosticModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiagnosticModal({ open, onOpenChange }: DiagnosticModalProps) {
  const [diagnostics, setDiagnostics] = useState<{
    healthy: boolean;
    message: string;
    details: any;
  }>({ healthy: true, message: "Checking database...", details: {} });
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (open) {
      checkDatabase();
    }
  }, [open]);

  const checkDatabase = async () => {
    setIsChecking(true);
    try {
      const result = await db.checkDatabaseHealth();
      setDiagnostics(result);
    } catch (error) {
      setDiagnostics({
        healthy: false,
        message: "Error checking database",
        details: { error: String(error) },
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Database Diagnostics</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Health Status</h3>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  diagnostics.healthy
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {diagnostics.healthy ? "Healthy" : "Issues Detected"}
              </span>
            </div>
            <p className="mt-2">{diagnostics.message}</p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="p-2 bg-muted font-mono text-xs">
              <pre className="overflow-auto max-h-60 p-2">
                {JSON.stringify(diagnostics.details, null, 2)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={checkDatabase} disabled={isChecking}>
              {isChecking ? "Checking..." : "Refresh Check"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
