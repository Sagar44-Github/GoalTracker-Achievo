
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Goal } from '@/lib/db';
import { useApp } from '@/context/AppContext';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GoalTabProps {
  goal: Goal & { stats: any };
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export function GoalTab({ goal, isActive, isCollapsed, onClick }: GoalTabProps) {
  const { updateGoal, deleteGoal } = useApp();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  
  const handleEdit = async () => {
    if (editTitle.trim() && editTitle !== goal.title) {
      await updateGoal({
        ...goal,
        title: editTitle.trim()
      });
      setIsEditDialogOpen(false);
    }
  };
  
  const handleDelete = async () => {
    await deleteGoal(goal.id);
    setIsDeleteDialogOpen(false);
  };
  
  // Calculate progress percentage
  const progressPercentage = goal.stats.percentage;
  
  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md group cursor-pointer transition-colors",
          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50",
          isCollapsed ? "justify-center p-2" : "p-2 pr-1"
        )}
        onClick={onClick}
      >
        {/* Color dot */}
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: goal.color || '#9b87f5' }}
        />
        
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{goal.title}</span>
                <span className="text-xs text-muted-foreground ml-1">{goal.stats.completed}/{goal.stats.total}</span>
              </div>
              
              {/* Progress bar */}
              <div className="goal-progress-bar mt-1">
                <div 
                  className="goal-progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
            />
            <Button onClick={handleEdit} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the "{goal.title}" goal. Tasks associated with this goal will remain, but they will no longer be linked to any goal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
