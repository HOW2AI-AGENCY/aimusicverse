import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { CheckSquare } from "lucide-react";

export default function Tasks() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-primary">
            <CheckSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Мои задачи</h1>
            <p className="text-muted-foreground">Управляйте своими делами эффективно</p>
          </div>
        </div>

        <TaskForm />

        <Card className="p-4">
          <TaskList />
        </Card>
      </div>
    </div>
  );
}