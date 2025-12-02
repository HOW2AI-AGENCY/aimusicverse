import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Track } from '@/hooks/useTracksOptimized';
import { Folder, Plus, Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTracks } from '@/hooks/useProjectTracks';
import { cn } from '@/lib/utils';
import { hapticImpact, hapticNotification } from '@/lib/haptic';

interface AddToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
}

export function AddToProjectDialog({ open, onOpenChange, track }: AddToProjectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { addTrackToProject } = useProjectTracks();

  // Filter projects by search query
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddToProject = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);

    try {
      hapticImpact('light');

      await addTrackToProject({
        projectId: selectedProjectId,
        trackId: track.id,
      });

      const project = projects?.find(p => p.id === selectedProjectId);
      hapticNotification('success');
      toast.success(`Added to "${project?.name}"`);
      onOpenChange(false);
      
      // Reset selection
      setSelectedProjectId(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add track to project:', error);
      toast.error('Failed to add track. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setSelectedProjectId(null);
        setSearchQuery('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            Add to Project
          </DialogTitle>
          <DialogDescription>
            Select a project to add "{track.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={loading}
            />
          </div>

          {/* Projects List */}
          <ScrollArea className="h-[300px] pr-4">
            {projectsLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Folder className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a project first to organize your tracks
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    disabled={loading}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
                      'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary',
                      selectedProjectId === project.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
                      selectedProjectId === project.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {selectedProjectId === project.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Folder className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Create New Project Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              // TODO: Open create project dialog
              toast.info('Create project feature coming soon');
            }}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToProject}
            disabled={loading || !selectedProjectId}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add to Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
