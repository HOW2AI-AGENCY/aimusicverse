/**
 * Structure Tool Panel - Uses fit_structure action to reorganize lyrics
 */

import { useState } from 'react';
import { motion } from '@/lib/motion';
import { LayoutGrid, X, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ToolPanelProps } from '../types';

const STRUCTURE_TEMPLATES = [
  { 
    id: 'verse-chorus', 
    label: 'Verse → Chorus', 
    desc: 'Классика: куплет-припев',
    structure: '[Verse]\n[Chorus]\n[Verse 2]\n[Chorus]'
  },
  { 
    id: 'full', 
    label: 'Полная песня', 
    desc: 'Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro',
    structure: '[Intro]\n[Verse]\n[Pre-Chorus]\n[Chorus]\n[Verse 2]\n[Pre-Chorus]\n[Chorus]\n[Bridge]\n[Chorus]\n[Outro]'
  },
  { 
    id: 'minimal', 
    label: 'Минимал', 
    desc: 'Verse, Hook, Verse',
    structure: '[Verse]\n[Hook]\n[Verse 2]\n[Hook]'
  },
  { 
    id: 'progressive', 
    label: 'Прогрессивная', 
    desc: 'С нарастанием и кульминацией',
    structure: '[Intro]\n[Verse]\n[Build]\n[Chorus]\n[Verse 2]\n[Build]\n[Chorus]\n[Breakdown]\n[Drop]\n[Outro]'
  },
  { 
    id: 'ballad', 
    label: 'Баллада', 
    desc: 'Эмоциональная структура',
    structure: '[Intro]\n[Verse]\n[Verse 2]\n[Chorus]\n[Verse 3]\n[Chorus]\n[Bridge]\n[Chorus]\n[Outro]'
  },
  { 
    id: 'hiphop', 
    label: 'Hip-Hop', 
    desc: 'Verse, Hook, Verse, Hook',
    structure: '[Intro]\n[Verse 1]\n[Hook]\n[Verse 2]\n[Hook]\n[Verse 3]\n[Hook]\n[Outro]'
  },
];

export function StructureToolPanel({ context, onExecute, onClose, isLoading }: ToolPanelProps) {
  const [selectedStructure, setSelectedStructure] = useState('verse-chorus');

  const hasContent = !!(context.existingLyrics || context.selectedSection?.content);

  const handleFitStructure = () => {
    const template = STRUCTURE_TEMPLATES.find(s => s.id === selectedStructure);
    onExecute({
      targetStructure: template?.structure || selectedStructure,
      structureName: template?.label,
      existingLyrics: context.existingLyrics,
      sectionContent: context.selectedSection?.content,
      genre: context.genre,
      mood: context.mood,
      title: context.title,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border border-indigo-500/30 rounded-lg bg-indigo-500/5 overflow-hidden"
    >
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium">Структура</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-3 h-3" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Перестроить текст по выбранному шаблону структуры
        </p>

        {!hasContent ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              Нет текста для перестроения. Сначала напишите текст.
            </p>
          </div>
        ) : (
          <>
            {/* Structure selection */}
            <div className="space-y-1.5">
              <Label className="text-xs">Выберите структуру</Label>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto">
                {STRUCTURE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedStructure(template.id)}
                    className={cn(
                      "p-2 rounded-lg border text-left transition-all",
                      selectedStructure === template.id
                        ? "border-indigo-500/50 bg-indigo-500/10"
                        : "border-border/50 hover:bg-muted/50"
                    )}
                    disabled={isLoading}
                  >
                    <p className="text-xs font-medium">{template.label}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{template.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview selected structure */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Структура</Label>
              <div className="p-2 rounded-md bg-muted/30 border border-border/50 max-h-[80px] overflow-y-auto">
                <p className="text-[10px] font-mono whitespace-pre-wrap text-muted-foreground">
                  {STRUCTURE_TEMPLATES.find(s => s.id === selectedStructure)?.structure}
                </p>
              </div>
            </div>

            {/* Execute Button */}
            <Button
              onClick={handleFitStructure}
              disabled={isLoading}
              className="w-full bg-indigo-500 hover:bg-indigo-600"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Применить структуру
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
