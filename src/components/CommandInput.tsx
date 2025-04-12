import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Input } from "@/components/ui/input";
import { Command, Sparkles, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

// Define the SpeechRecognition type to avoid TypeScript errors
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function CommandInput() {
  const { executeCommand, isFocusMode } = useApp();
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = "en-US";

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setCommand(transcript);

        // Check for focus mode commands
        const lowerTranscript = transcript.toLowerCase().trim();
        if (
          lowerTranscript === "go into focus mode" ||
          lowerTranscript === "start focus mode" ||
          lowerTranscript === "focus mode" ||
          lowerTranscript === "focus now"
        ) {
          handleCommandExecution("go into focus mode");
        } else if (
          lowerTranscript === "exit focus mode" ||
          lowerTranscript === "leave focus mode" ||
          lowerTranscript === "end focus mode" ||
          lowerTranscript === "stop focus mode"
        ) {
          handleCommandExecution("exit focus mode");
        } else {
          // For other commands, just execute the transcript
          handleCommandExecution(transcript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    } else if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
    }
  };

  const handleCommandExecution = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsProcessing(true);

    try {
      const result = await executeCommand(cmd);

      if (result.success) {
        toast({
          title: "Command Executed",
          description: result.message,
        });
      } else {
        toast({
          title: "Command Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to execute command:", error);
      toast({
        title: "Command Failed",
        description: "An error occurred while executing your command.",
        variant: "destructive",
      });
    } finally {
      setCommand("");
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && command.trim()) {
      handleCommandExecution(command);
    }
  };

  return (
    <div className="relative">
      <Command
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        size={16}
      />

      <Input
        className={cn(
          "pl-10 pr-10 transition-colors",
          isProcessing && "bg-muted/50"
        )}
        placeholder={
          isFocusMode
            ? "Type 'exit focus mode' to return to normal view"
            : "Type a command... (try 'go into focus mode' or 'add Buy groceries tomorrow')"
        }
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {isProcessing && (
          <Sparkles className="text-achievo-purple animate-pulse" size={16} />
        )}

        <button
          onClick={startListening}
          disabled={isProcessing}
          className={cn(
            "ml-2 p-1 rounded-full",
            isListening && "bg-achievo-purple/10"
          )}
          title="Use voice command"
          aria-label="Use voice command"
        >
          <Mic
            size={16}
            className={cn(
              "text-muted-foreground",
              isListening && "text-achievo-purple animate-pulse"
            )}
          />
        </button>
      </div>
    </div>
  );
}
