import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { Trash2, Calendar, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Task = Tables<"tasks"> & {
  task_categories: Tables<"task_categories"> | null;
};

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
};

const priorityLabels = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочно",
};

interface TaskItemProps {
  task: Task;
}

export const TaskItem = ({ task }: TaskItemProps) => {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggleComplete = () => {
    updateTask.mutate({
      id: task.id,
      updates: {
        status: task.status === 'completed' ? 'todo' : 'completed',
      },
    });
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card transition-all hover:shadow-md",
        task.status === 'completed' && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.status === 'completed'}
          onCheckedChange={handleToggleComplete}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className={cn(
                "font-medium text-card-foreground",
                task.status === 'completed' && "line-through"
              )}
            >
              {task.title}
            </h4>
            {task.task_categories && (
              <Badge
                variant="outline"
                style={{
                  borderColor: task.task_categories.color,
                  color: task.task_categories.color,
                }}
              >
                {task.task_categories.name}
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={priorityColors[task.priority]}
            >
              <Flag className="w-3 h-3 mr-1" />
              {priorityLabels[task.priority]}
            </Badge>
            
            {task.due_date && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(task.due_date), {
                  addSuffix: true,
                  locale: ru,
                })}
              </Badge>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="flex-shrink-0"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};