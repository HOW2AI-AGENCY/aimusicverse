/**
 * AdminBroadcast - Broadcast management tab
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { BroadcastPanel } from "@/components/admin/BroadcastPanel";

export default function AdminBroadcast() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <BroadcastPanel />
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Блог
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Создавайте статьи и отправляйте их пользователям
          </p>
          <Button onClick={() => navigate("/blog")} className="w-full">
            <BookOpen className="h-4 w-4 mr-2" />
            Открыть блог
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
