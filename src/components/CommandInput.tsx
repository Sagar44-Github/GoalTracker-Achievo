
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Command, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export function CommandInput() {
  const { executeCommand } = useApp();
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && command.trim()) {
      setIsProcessing(true);
      
      try {
        const result = await executeCommand(command);
        
        if (result.success) {
          toast({
            title: 'Command Executed',
            description: result.message
          });
        } else {
          toast({
            title: 'Command Error',
            description: result.message,
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Failed to execute command:', error);
        toast({
          title: 'Command Failed',
          description: 'An error occurred while executing your command.',
          variant: 'destructive'
        });
      } finally {
        setCommand('');
        setIsProcessing(false);
      }
    }
  };
  
  return (
    <div className="relative">
      <Command className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
      
      <Input
        className={cn(
          "pl-10 pr-10 transition-colors",
          isProcessing && "bg-muted/50"
        )}
        placeholder="Type a command... (try 'add Buy groceries tomorrow')"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
      />
      
      {isProcessing && (
        <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 text-achievo-purple animate-pulse" size={16} />
      )}
    </div>
  );
}
