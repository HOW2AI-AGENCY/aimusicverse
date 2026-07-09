import { useState } from "react";
import { Copy, Check, Bot, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const MCP_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp`;

export default function Connect() {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    toast.success("URL скопирован");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Подключить AI-ассистента</h1>
        <p className="text-muted-foreground">
          Подключите ChatGPT или Claude к MusicVerse AI, чтобы искать треки и работать со своей библиотекой через ассистента.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Server URL</CardTitle>
          <CardDescription>Скопируйте этот адрес — он понадобится на шаге ниже.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
            <code className="flex-1 truncate text-sm font-mono">{MCP_URL}</code>
            <Button size="sm" variant="secondary" onClick={copyUrl} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-2">{copied ? "Скопировано" : "Копировать"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="chatgpt" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chatgpt">
            <Bot className="mr-2 h-4 w-4" /> ChatGPT
          </TabsTrigger>
          <TabsTrigger value="claude">
            <MessageSquare className="mr-2 h-4 w-4" /> Claude
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chatgpt">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Подключение к ChatGPT</CardTitle>
              <CardDescription>Требуется ChatGPT с поддержкой коннекторов.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm list-decimal list-inside">
                <li>
                  Откройте{" "}
                  <a
                    href="https://chatgpt.com/#settings/Connectors/Advanced"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    Настройки → Connectors → Advanced
                  </a>{" "}
                  и включите Developer mode (прочтите предупреждение о рисках).
                </li>
                <li>В окне чата откройте меню «+» и включите Developer mode.</li>
                <li>Нажмите «Add sources», затем «Connect more».</li>
                <li>Задайте название коннектора и вставьте URL сверху.</li>
                <li>Попросите ChatGPT воспользоваться MusicVerse AI.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claude">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Подключение к Claude</CardTitle>
              <CardDescription>Работает в Claude.ai с поддержкой custom connectors.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm list-decimal list-inside">
                <li>
                  Откройте{" "}
                  <a
                    href="https://claude.ai/customize/connectors?modal=add-custom-connector"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    Claude → Connectors → Add custom connector
                  </a>
                  .
                </li>
                <li>Задайте название коннектора и вставьте URL сверху.</li>
                <li>Включите коннектор в окне чата и попросите Claude воспользоваться приложением.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Что сможет ассистент</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Искать публичные треки MusicVerse AI, получать детали конкретного трека и — после входа в ваш аккаунт — читать
            вашу собственную библиотеку. При первом обращении ассистент попросит вас войти через MusicVerse AI.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
