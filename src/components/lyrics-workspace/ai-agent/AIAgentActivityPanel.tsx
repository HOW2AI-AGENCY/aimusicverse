/**
 * AIAgentActivityPanel - Compact transparency panel for the AI agent.
 * Shows the working context (project/track/section), the current action,
 * the list of tasks when running a workflow, and recent agent actions.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import {
  Folder,
  Music,
  FileText,
  ListChecks,
  Check,
  Loader2,
  ChevronDown,
  Bot,
  Activity,
  Clock,
  XCircle,
} from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AIAgentContext, AIToolId, AgentAction } from "./types";
import { AI_TOOLS } from "./constants";

interface WorkflowTask {
  label: string;
}

interface WorkflowState {
  name: string;
  steps: WorkflowTask[];
  currentStepIndex: number;
  status: "idle" | "running" | "paused" | "completed" | "error";
  stepResults: Record<number, unknown>;
}

interface AIAgentActivityPanelProps {
  context: AIAgentContext;
  activeTool?: AIToolId | null;
  workflow?: WorkflowState;
  actions?: AgentAction[];
  className?: string;
}

function getCurrentActionLabel(activeTool: AIToolId | null | undefined, workflow?: WorkflowState): string {
  if (activeTool) {
    const tool = AI_TOOLS.find((t) => t.id === activeTool);
    return tool ? tool.name : "Обработка";
  }

  if (workflow) {
    if (workflow.status === "completed") return "Workflow завершён";
    if (workflow.status === "paused") return "Workflow на паузе";
    if (workflow.status === "error") return "Ошибка workflow";
    const step = workflow.steps[workflow.currentStepIndex];
    return step ? `${step.label}...` : "Выполняю...";
  }

  return "Готов к работе";
}

function getWorkingFileLabel(context: AIAgentContext): string {
  const parts: string[] = [];
  if (context.projectContext?.projectTitle) parts.push(context.projectContext.projectTitle);
  if (context.trackContext?.title) parts.push(`#${context.trackContext.position + 1} ${context.trackContext.title}`);
  if (context.selectedSection?.type) parts.push(context.selectedSection.type);
  if (parts.length === 0) return context.existingLyrics ? "Текущий текст" : "Нет открытого файла";
  return parts.join(" / ");
}

function formatShortTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function AIAgentActivityPanel({
  context,
  activeTool,
  workflow,
  actions = [],
  className,
}: AIAgentActivityPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const hasContext =
    context.projectContext || context.trackContext || context.selectedSection || context.existingLyrics;

  if (!hasContext && !activeTool && !workflow && actions.length === 0) return null;

  const actionLabel = getCurrentActionLabel(activeTool, workflow);
  const isBusy = !!activeTool || workflow?.status === "running" || actions.some((a) => a.status === "running");
  const workingFile = getWorkingFileLabel(context);
  const recentActions = actions.slice(0, 5);

  return (
    <div className={cn("mx-3 mb-2 rounded-xl bg-muted/40 border border-border/40 overflow-hidden", className)}>
      {/* Header: current action + context summary */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            ) : (
              <Bot className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{actionLabel}</p>
            <p className="text-[0.625rem] text-muted-foreground truncate">{workingFile}</p>
          </div>
        </div>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", expanded && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2.5">
              {/* Working file */}
              <div className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wide">Файл</p>
                  <p className="text-xs font-medium truncate">{workingFile}</p>
                  {context.existingLyrics && (
                    <p className="text-[0.625rem] text-muted-foreground">{context.existingLyrics.length} символов</p>
                  )}
                </div>
              </div>

              {/* Context */}
              <div className="flex flex-wrap gap-1.5">
                {context.projectContext?.projectTitle && (
                  <Badge variant="secondary" className="text-[0.625rem] gap-1">
                    <Folder className="w-3 h-3" />
                    {context.projectContext.projectTitle}
                  </Badge>
                )}
                {context.trackContext && (
                  <Badge variant="outline" className="text-[0.625rem] gap-1">
                    <Music className="w-3 h-3" />#{context.trackContext.position + 1} {context.trackContext.title}
                  </Badge>
                )}
                {context.selectedSection?.type && (
                  <Badge variant="outline" className="text-[0.625rem] gap-1">
                    <FileText className="w-3 h-3" />
                    {context.selectedSection.type}
                  </Badge>
                )}
                {context.existingLyrics && (
                  <Badge variant="outline" className="text-[0.625rem] gap-1">
                    <FileText className="w-3 h-3" />
                    {context.existingLyrics.length} симв
                  </Badge>
                )}
              </div>

              {/* Recent actions */}
              {recentActions.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                    <Activity className="w-3 h-3" />
                    <span>Действия агента</span>
                  </div>
                  <div className="space-y-1">
                    {recentActions.map((action) => (
                      <div
                        key={action.id}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded-md text-xs",
                          action.status === "running" && "bg-primary/10 text-primary",
                          action.status === "completed" && "text-foreground",
                          action.status === "error" && "bg-destructive/10 text-destructive",
                        )}
                      >
                        {action.status === "running" ? (
                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        ) : action.status === "error" ? (
                          <XCircle className="w-3 h-3 shrink-0" />
                        ) : (
                          <Check className="w-3 h-3 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{action.label}</span>
                        <span className="text-[0.625rem] text-muted-foreground shrink-0 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatShortTime(action.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {workflow && workflow.steps.length > 0 && (
                <div className="pt-1">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[0.625rem] text-muted-foreground uppercase tracking-wide">
                    <ListChecks className="w-3 h-3" />
                    <span>Задачи</span>
                  </div>
                  <div className="space-y-1">
                    {workflow.steps.map((step, index) => {
                      const raw = workflow.stepResults[index];
                      const result =
                        typeof raw === "object" && raw !== null ? (raw as { skipped?: boolean }) : undefined;
                      const isComplete = !!result && !result.skipped;
                      const isSkipped = result?.skipped === true;
                      const isCurrent = index === workflow.currentStepIndex && workflow.status === "running";
                      const isPending = !isComplete && !isSkipped && !isCurrent;

                      return (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-md text-xs",
                            isComplete && "bg-emerald-500/10 text-emerald-500",
                            isSkipped && "bg-muted text-muted-foreground line-through",
                            isCurrent && "bg-primary/10 text-primary",
                            isPending && "text-muted-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full flex items-center justify-center border text-[0.5rem] shrink-0",
                              isComplete && "bg-emerald-500 border-emerald-500 text-background",
                              isCurrent && "border-primary",
                              isPending && "border-muted-foreground/40",
                            )}
                          >
                            {isComplete ? <Check className="w-3 h-3" /> : index + 1}
                          </div>
                          <span className="truncate">{step.label}</span>
                          {isCurrent && <Loader2 className="w-3 h-3 animate-spin ml-auto shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
