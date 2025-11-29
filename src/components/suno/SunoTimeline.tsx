import { LyricSection, SECTION_LABELS } from './types';

interface SunoTimelineProps {
  sections: LyricSection[];
}

export const SunoTimeline = ({ sections }: SunoTimelineProps) => {
  if (sections.length === 0) return null;

  return (
    <div className="w-full">
      <div className="text-xs text-muted-foreground mb-2">Структура трека</div>
      <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
        {sections.map((section, index) => {
          const label = SECTION_LABELS[section.type];
          const width = `${100 / sections.length}%`;
          
          return (
            <div
              key={section.id}
              className={`${label.color} flex items-center justify-center text-xs font-medium transition-all hover:opacity-80 cursor-pointer`}
              style={{ width, minWidth: '32px' }}
              title={`${index + 1}. ${label.ru}`}
            >
              <span className="hidden sm:inline">{index + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Начало</span>
        <span>{sections.length} секций</span>
        <span>Конец</span>
      </div>
    </div>
  );
};
