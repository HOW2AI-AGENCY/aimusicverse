import { useTasks } from "@/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TaskSkeleton } from "@/components/ui/skeleton-loader";
import { CheckCircle2, Circle, Clock, Archive } from "lucide-react";

export const TaskList = () => {
  const { data: allTasks, isLoading: allLoading } = useTasks('all');
  const { data: todoTasks, isLoading: todoLoading } = useTasks('todo');
  const { data: inProgressTasks, isLoading: progressLoading } = useTasks('in_progress');
  const { data: completedTasks, isLoading: completedLoading } = useTasks('completed');

  const renderTasks = (tasks: any[] | undefined, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-3">
          {[1, 2, 3].map((i) => (
            <TaskSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (!tasks || tasks.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <Circle className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Нет задач</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 p-3">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-4 rounded-lg">
          <TabsTrigger value="all" className="gap-2">
            <Circle className="w-4 h-4" />
            Все {allTasks && `(${allTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="todo" className="gap-2">
            <Circle className="w-4 h-4" />
            К выполнению {todoTasks && `(${todoTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2">
            <Clock className="w-4 h-4" />
            В процессе {inProgressTasks && `(${inProgressTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Выполнено {completedTasks && `(${completedTasks.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="m-0">
          {renderTasks(allTasks, allLoading)}
        </TabsContent>
        <TabsContent value="todo" className="m-0">
          {renderTasks(todoTasks, todoLoading)}
        </TabsContent>
        <TabsContent value="in_progress" className="m-0">
          {renderTasks(inProgressTasks, progressLoading)}
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          {renderTasks(completedTasks, completedLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
};