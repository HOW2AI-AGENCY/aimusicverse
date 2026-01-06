import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from '@/lib/motion';
import {
  Mic2,
  Mic,
  Upload,
  Cloud,
  FileMusic,
  PenLine,
  History,
  FileText,
  FolderOpen,
  Plus,
  User,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Dialogs
import { AudioActionDialog } from '@/components/generate-form/AudioActionDialog';
import { ReferenceDrawer } from '@/components/audio-reference';
import { QuickProjectSheet } from '@/components/project/QuickProjectSheet';

interface ActionConfig {
  id: string;
  icon: typeof Mic2;
  label: string;
  color: string;
  bgClass: string;
  hoverClass: string;
  actions: Array<{
    id: string;
    icon: typeof Mic;
    label: string;
    description: string;
    path?: string;
    actionType?: 'record' | 'upload' | 'cloud' | 'project';
  }>;
}

const MAIN_ACTIONS: ActionConfig[] = [
  {
    id: 'audio',
    icon: Mic2,
    label: 'Аудио референс',
    color: 'orange',
    bgClass: 'from-orange-500/20 to-amber-500/10',
    hoverClass: 'hover:border-orange-500/40',
    actions: [
      { id: 'record', icon: Mic, label: 'Запись с микрофона', description: 'Записать аудио', actionType: 'record' },
      { id: 'upload', icon: Upload, label: 'Загрузить файл', description: 'До 20MB', actionType: 'upload' },
      { id: 'cloud', icon: Cloud, label: 'Из облака', description: 'Загруженные ранее', actionType: 'cloud' },
    ],
  },
  {
    id: 'lyrics',
    icon: FileMusic,
    label: 'Lyrics Studio',
    color: 'violet',
    bgClass: 'from-violet-500/20 to-purple-500/10',
    hoverClass: 'hover:border-violet-500/40',
    actions: [
      { id: 'write', icon: PenLine, label: 'Написать трек', description: 'AI помощник', path: '/lyrics-studio' },
      { id: 'history', icon: History, label: 'История генераций', description: 'Прошлые тексты', path: '/content-hub?tab=lyrics' },
      { id: 'templates', icon: FileText, label: 'Сохранённые шаблоны', description: 'Мои наработки', path: '/content-hub?tab=templates' },
    ],
  },
  {
    id: 'projects',
    icon: FolderOpen,
    label: 'Проекты',
    color: 'emerald',
    bgClass: 'from-emerald-500/20 to-teal-500/10',
    hoverClass: 'hover:border-emerald-500/40',
    actions: [
      { id: 'create', icon: Plus, label: 'Создать проект', description: 'Альбом, EP, сингл', actionType: 'project' },
      { id: 'my', icon: User, label: 'Мои проекты', description: 'Личные проекты', path: '/projects' },
      { id: 'public', icon: Globe, label: 'Публичные проекты', description: 'Сообщество', path: '/community?tab=projects' },
    ],
  },
];

interface MainActionsBarProps {
  className?: string;
}

export function MainActionsBar({ className }: MainActionsBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audioDialogOpen, setAudioDialogOpen] = useState(false);
  const [cloudDrawerOpen, setCloudDrawerOpen] = useState(false);
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);

  const handleAction = (action: ActionConfig['actions'][0]) => {
    if (action.path) {
      navigate(action.path);
      return;
    }

    switch (action.actionType) {
      case 'record':
      case 'upload':
        setAudioDialogOpen(true);
        break;
      case 'cloud':
        setCloudDrawerOpen(true);
        break;
      case 'project':
        setProjectSheetOpen(true);
        break;
    }
  };

  const handleAudioSelected = (file: File, mode: 'cover' | 'extend') => {
    // Navigate to generate with the file
    navigate('/generate', { state: { audioFile: file, audioMode: mode } });
    setAudioDialogOpen(false);
  };

  const handleReferenceSelect = () => {
    // Navigate to generate after selection
    navigate('/generate');
    setCloudDrawerOpen(false);
  };

  return (
    <>
      <div className={cn('flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide', className)}>
        {MAIN_ACTIONS.map((action, index) => (
          <DropdownMenu key={action.id}>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex-1 min-w-[110px]"
              >
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5',
                    'bg-gradient-to-br border-border/50 rounded-xl',
                    'transition-all duration-200 shadow-sm hover:shadow-md',
                    action.bgClass,
                    action.hoverClass
                  )}
                >
                  <action.icon className={cn('w-5 h-5', {
                    'text-orange-400': action.color === 'orange',
                    'text-violet-400': action.color === 'violet',
                    'text-emerald-400': action.color === 'emerald',
                  })} />
                  <span className="text-xs font-medium text-foreground/90 whitespace-nowrap">
                    {action.label}
                  </span>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="center" 
              className="w-56 bg-card/95 backdrop-blur-md border-border/60"
            >
              {action.actions.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleAction(item)}
                  className="flex items-start gap-3 py-2.5 px-3 cursor-pointer"
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br',
                    action.bgClass
                  )}>
                    <item.icon className={cn('w-4 h-4', {
                      'text-orange-400': action.color === 'orange',
                      'text-violet-400': action.color === 'violet',
                      'text-emerald-400': action.color === 'emerald',
                    })} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      </div>

      {/* Dialogs */}
      <AudioActionDialog
        open={audioDialogOpen}
        onOpenChange={setAudioDialogOpen}
        onAudioSelected={handleAudioSelected}
        initialMode="cover"
      />

      <ReferenceDrawer
        open={cloudDrawerOpen}
        onOpenChange={setCloudDrawerOpen}
        onSelect={handleReferenceSelect}
      />

      <QuickProjectSheet
        open={projectSheetOpen}
        onOpenChange={setProjectSheetOpen}
      />
    </>
  );
}
