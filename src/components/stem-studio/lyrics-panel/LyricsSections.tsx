/**
 * LyricsSections Component
 *
 * Detects and displays song sections (verse, chorus, bridge, etc.).
 * Extracted from StudioLyricsPanel for better maintainability.
 *
 * @feature Spec 001 - Phase 3: Component Maintainability
 * @priority P1 - Split StudioLyricsPanel (624 lines → subcomponents)
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scissors, Wand2 } from "lucide-react";
import type { LyricLine } from "./LyricsRenderer";

export interface DetectedSection {
  type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "unknown";
  lines: LyricLine[];
  startTime: number;
  endTime: number;
  text: string;
}

export interface LyricsSectionsProps {
  lines: LyricLine[];
  currentTime: number;
  highlightedSection?: DetectedSection | null;
  onSectionSelect?: (section: DetectedSection) => void;
  selectionMode?: boolean;
  className?: string;
}

// Section detection constants
const SECTION_GAP_THRESHOLD = 1.5; // seconds
const MIN_SECTION_LINES = 2;
const MAX_SECTION_LINES = 8;

export function useLyricsSections(lines: LyricLine[]): DetectedSection[] {
  return React.useMemo(() => {
    if (lines.length === 0) return [];

    const sections: DetectedSection[] = [];
    let currentSectionLines: LyricLine[] = [];
    let lastEndTime = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const gap = line.startTime - lastEndTime;

      // Check if this should start a new section
      const shouldSplit =
        currentSectionLines.length >= MAX_SECTION_LINES ||
        (gap > SECTION_GAP_THRESHOLD && currentSectionLines.length >= MIN_SECTION_LINES);

      if (shouldSplit && currentSectionLines.length > 0) {
        // Finalize current section
        const sectionText = currentSectionLines
          .map((l) => l.text)
          .join(" ")
          .trim();
        const sectionType = detectSectionType(sectionText);

        sections.push({
          type: sectionType,
          lines: [...currentSectionLines],
          startTime: currentSectionLines[0].startTime,
          endTime: currentSectionLines[currentSectionLines.length - 1].endTime,
          text: sectionText,
        });

        currentSectionLines = [];
      }

      currentSectionLines.push(line);
      lastEndTime = line.endTime;
    }

    // Add final section
    if (currentSectionLines.length > 0) {
      const sectionText = currentSectionLines
        .map((l) => l.text)
        .join(" ")
        .trim();
      const sectionType = detectSectionType(sectionText);

      sections.push({
        type: sectionType,
        lines: currentSectionLines,
        startTime: currentSectionLines[0].startTime,
        endTime: currentSectionLines[currentSectionLines.length - 1].endTime,
        text: sectionText,
      });
    }

    return sections;
  }, [lines]);
}

function detectSectionType(text: string): DetectedSection["type"] {
  const lower = text.toLowerCase();

  // Simple pattern matching
  if (lower.includes("chorus") || lower.includes("припев")) return "chorus";
  if (lower.includes("verse") || lower.includes("куплет")) return "verse";
  if (lower.includes("bridge") || lower.includes("мост")) return "bridge";
  if (lower.includes("intro") || lower.includes("вступление")) return "intro";
  if (lower.includes("outro") || lower.includes("завершение")) return "outro";

  return "unknown";
}

export const LyricsSections = React.forwardRef<HTMLDivElement, LyricsSectionsProps>(
  ({ lines, currentTime, highlightedSection, onSectionSelect, selectionMode = false, className }, ref) => {
    const sections = useLyricsSections(lines);

    const getSectionVariant = (type: DetectedSection["type"]) => {
      switch (type) {
        case "chorus":
          return "bg-warning/10 text-warning border-warning/30";
        case "verse":
          return "bg-primary/10 text-primary border-primary/30";
        case "bridge":
          return "bg-accent/10 text-accent border-accent/30";
        default:
          return "bg-muted/10 text-muted-foreground border-muted/30";
      }
    };

    if (sections.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        {selectionMode && <div className="text-xs text-muted-foreground mb-2">Выберите секцию для замены</div>}
        {sections.map((section, index) => {
          const isHighlighted = highlightedSection?.startTime === section.startTime;
          const isActive = currentTime >= section.startTime && currentTime <= section.endTime;

          return (
            <div
              key={`${index}-${section.startTime}`}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                getSectionVariant(section.type),
                isActive && "ring-2 ring-ring",
                isHighlighted && "ring-2 ring-warning",
              )}
            >
              <Badge variant="outline" className="text-[10px] shrink-0">
                {section.type.toUpperCase()}
              </Badge>
              <span className="flex-1 text-sm truncate">{section.text}</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatTime(section.startTime)}</span>
              {selectionMode && onSectionSelect && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onSectionSelect(section)}
                >
                  <Scissors className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

LyricsSections.displayName = "LyricsSections";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
