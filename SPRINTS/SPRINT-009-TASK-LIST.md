# Список задач для Спринта 009

**Спринт**: 009 - Track Details & Actions (User Stories 3 & 4)  
**Период**: 2025-12-29 - 2026-01-12 (2 недели)  
**Цель**: Реализовать панель деталей трека с лирикой, версиями, стемами, AI-анализом и расширенное меню действий (персона, студия, проекты, плейлисты)

---

## 📊 Прогресс спринта

**Общий прогресс**: 0% (0/19 задач)

- ⏳ **Запланировано**: 19 задач
- 🔄 **В работе**: 0 задач
- ✅ **Завершено**: 0 задач

---

## 🎯 Пользовательские сценарии (User Stories)

### User Story 3: Track Details Panel (P2)
**Как пользователь**, я хочу видеть полную информацию о треке с лирикой, версиями, стемами и AI-анализом, чтобы лучше понимать мою музыку и эффективно работать с версиями.

**Критерии приемки**:
1. ✅ Details sheet открывается из TrackCard/TrackRow
2. ✅ 6 табов: Details, Lyrics, Versions, Stems, Analysis, Changelog
3. ✅ Normal и timestamped лирика
4. ✅ Version-aware компоненты
5. ✅ AI analysis с визуализацией
6. ✅ Smooth animations 60fps
7. ✅ Lazy loading для стемов

### User Story 4: Track Actions Menu (P2)
**Как пользователь**, я хочу расширенные действия с треком (создание персоны, открытие в студии, добавление в проекты/плейлисты), чтобы эффективно использовать треки в творческом процессе.

**Критерии приемки**:
1. ✅ Create Persona из трека
2. ✅ Open in Studio для треков со стемами
3. ✅ Add to Project/Playlist
4. ✅ Share track с публичной ссылкой
5. ✅ Optimistic updates
6. ✅ Haptic feedback
7. ✅ Confirmation dialogs

---

## 📋 Задачи User Story 3: Track Details Panel (11 задач)

### US3-T01: TrackDetailsSheet Component 🔴 КРИТИЧНО
- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/track/TrackDetailsSheet.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: Sprint 008 завершен

**Описание**: Bottom sheet с табами для отображения полной информации о треке.

**Технические требования**:
- Responsive height: 70vh на mobile, 80vh на desktop
- 6 табов: Details, Lyrics, Versions, Stems, Analysis, Changelog
- Swipe down to close
- Smooth transitions между табами
- Loading states для каждого таба

**Реализация**:
```tsx
// src/components/track/TrackDetailsSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrackDetailsTab } from './TrackDetailsTab';
import { LyricsView } from './LyricsView';
import { VersionsTab } from './VersionsTab';
import { StemsTab } from './StemsTab';
import { AnalysisTab } from './AnalysisTab';
import { ChangelogTab } from './ChangelogTab';
import { useTrackDetails } from '@/hooks/useTrackDetails';

export function TrackDetailsSheet({ 
  trackId, 
  open, 
  onOpenChange 
}: TrackDetailsSheetProps) {
  const { data: details, isLoading } = useTrackDetails(trackId);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] md:h-[80vh]">
        <SheetHeader>
          <SheetTitle>{details?.title || 'Track Details'}</SheetTitle>
        </SheetHeader>
        
        <Tabs defaultValue="details" className="h-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="stems">Stems</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="changelog">Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="h-[calc(100%-56px)] overflow-auto">
            <TrackDetailsTab track={details} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="lyrics" className="h-[calc(100%-56px)] overflow-auto">
            <LyricsView lyrics={details?.lyrics} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="versions" className="h-[calc(100%-56px)] overflow-auto">
            <VersionsTab trackId={trackId} />
          </TabsContent>
          
          <TabsContent value="stems" className="h-[calc(100%-56px)] overflow-auto">
            <StemsTab trackId={trackId} />
          </TabsContent>
          
          <TabsContent value="analysis" className="h-[calc(100%-56px)] overflow-auto">
            <AnalysisTab trackId={trackId} />
          </TabsContent>
          
          <TabsContent value="changelog" className="h-[calc(100%-56px)] overflow-auto">
            <ChangelogTab trackId={trackId} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

**Проверка**:
- [ ] Sheet открывается плавно
- [ ] Табы переключаются без задержек
- [ ] Swipe down закрывает sheet
- [ ] Touch targets ≥44×44px

---

### US3-T02: TrackDetailsTab Component
- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/track/TrackDetailsTab.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: US3-T01

**Описание**: Вкладка с основной информацией о треке.

**Технические требования**:
- Отображает: cover, title, style, tags, duration, date, BPM (if available)
- Badges для типов (vocal/instrumental/stems)
- Master version indicator
- Responsive layout

**Реализация**:
```tsx
// src/components/track/TrackDetailsTab.tsx
export function TrackDetailsTab({ track, isLoading }: Props) {
  if (isLoading) return <SkeletonLoader type="details" />;
  
  return (
    <div className="space-y-4 p-4">
      <img 
        src={track.cover_url} 
        className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
        alt={track.title}
      />
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{track.title}</h2>
        <p className="text-muted-foreground">{track.style}</p>
        
        <div className="flex flex-wrap gap-2">
          {track.has_vocals && <Badge>Vocals</Badge>}
          {track.is_instrumental && <Badge variant="secondary">Instrumental</Badge>}
          {track.has_stems && <Badge variant="outline">Stems Available</Badge>}
          {track.is_primary && <Badge className="bg-amber-500">⭐ Primary</Badge>}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Duration</p>
          <p className="font-medium">{formatDuration(track.duration_seconds)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium">{formatDate(track.created_at)}</p>
        </div>
        {track.metadata?.bpm && (
          <div>
            <p className="text-muted-foreground">BPM</p>
            <p className="font-medium">{track.metadata.bpm}</p>
          </div>
        )}
        {track.metadata?.key && (
          <div>
            <p className="text-muted-foreground">Key</p>
            <p className="font-medium">{track.metadata.key}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Проверка**:
- [ ] Все поля отображаются корректно
- [ ] Badges показываются правильно
- [ ] Loading state работает

---

### US3-T03: LyricsView Component
- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/track/LyricsView.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: US3-T01

**Описание**: Отображение лирики трека (normal и timestamped режимы).

**Технические требования**:
- Support для normal lyrics (simple text)
- Support для timestamped lyrics (с синхронизацией)
- Auto-scroll к текущей строке
- Highlight активной строки
- Copy button

---

## 📋 Задачи User Story 4: Track Actions Menu (8 задач)

### US4-T01: CreatePersonaDialog Component 🔴 КРИТИЧНО
- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/track/CreatePersonaDialog.tsx` (создать)
- **Приоритет**: P0
- **Зависимости**: US3 завершен

**Описание**: Диалог для создания AI персоны на основе стиля трека.

**Технические требования**:
- Автозаполнение стиля из трека
- Preview персоны
- Validation
- Optimistic update

---

### US4-T02: OpenInStudio Action
- **Статус**: ⏳ Запланировано
- **Файл**: `src/components/track/TrackActionsMenu.tsx` (обновить)
- **Приоритет**: P0
- **Зависимости**: Track has stems

**Описание**: Открыть трек в Stem Studio для редактирования.

**Реализация**:
```tsx
const handleOpenInStudio = () => {
  if (!track.has_stems) {
    toast.info('Generate stems first to use Studio');
    return;
  }
  
  navigate(`/studio/${track.id}`);
  hapticFeedback('impact', 'light');
};
```

---

## 🎯 Критерии приемки спринта

### Функциональные требования
- [ ] Все задачи US3 (1-11) выполнены
- [ ] Все задачи US4 (1-8) выполнены
- [ ] TrackDetailsSheet работает со всеми табами
- [ ] Create Persona создает персону из трека
- [ ] Open in Studio открывает редактор стемов
- [ ] Add to Project/Playlist добавляет трек
- [ ] Share Track генерирует публичную ссылку

### Качество кода
- [ ] Code review пройден
- [ ] TypeScript: 0 ошибок
- [ ] ESLint: 0 новых ошибок
- [ ] Prettier: код отформатирован

### Performance
- [ ] Details sheet открывается <500ms
- [ ] Версии переключаются <300ms
- [ ] Smooth animations 60fps

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] ARIA labels на интерактивных элементах
- [ ] Keyboard navigation работает

---

## 📝 Команды для разработки

### Запуск проекта
```bash
npm run dev
```

### Проверка типов
```bash
npx tsc --noEmit
```

### Линтинг и форматирование
```bash
npm run lint
npm run format
```

### Тестирование
```bash
npm test
npm test:coverage
```

---

## 🔄 Следующий спринт

**Sprint 010: Homepage Discovery & AI Assistant (User Stories 5 & 6)**
- Период: 2026-01-12 - 2026-01-26
- Задачи: 25 задач
- Фокус: Homepage с публичным контентом и AI Assistant режим

---

*Последнее обновление: 2025-12-02*
