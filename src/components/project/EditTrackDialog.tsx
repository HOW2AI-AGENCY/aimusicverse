import { useState, useEffect } from "react";
import { UnifiedDialog } from "@/components/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectTracks, ProjectTrack } from "@/hooks/useProjectTracks";
import { toast } from "sonner";
import { Save, FileText, Sliders } from "@/lib/icons";
import { TrackParamsEditor } from "./TrackParamsEditor";

interface EditTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: ProjectTrack;
}

interface TrackParams {
  bpm_target?: number | null;
  key_signature?: string | null;
  energy_level?: number | null;
  vocal_style?: string | null;
  instrumental_only?: boolean;
  reference_url?: string | null;
}

export const EditTrackDialog = ({ open, onOpenChange, track }: EditTrackDialogProps) => {
  const { updateTrack } = useProjectTracks(track.project_id);
  const [formData, setFormData] = useState({
    title: track.title,
    style_prompt: track.style_prompt || "",
    notes: track.notes || "",
  });

  const [trackParams, setTrackParams] = useState<TrackParams>({
    bpm_target: track.bpm_target,
    key_signature: track.key_signature,
    energy_level: track.energy_level,
    vocal_style: track.vocal_style,
    instrumental_only: track.instrumental_only ?? false,
    reference_url: track.reference_url,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        title: track.title,
        style_prompt: track.style_prompt || "",
        notes: track.notes || "",
      });
      setTrackParams({
        bpm_target: track.bpm_target,
        key_signature: track.key_signature,
        energy_level: track.energy_level,
        vocal_style: track.vocal_style,
        instrumental_only: track.instrumental_only ?? false,
        reference_url: track.reference_url,
      });
    }
  }, [open, track]);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Введите название трека");
      return;
    }

    updateTrack({
      id: track.id,
      updates: {
        title: formData.title,
        style_prompt: formData.style_prompt || null,
        notes: formData.notes || null,
        ...trackParams,
      },
    });

    onOpenChange(false);
    toast.success("Трек обновлен");
  };

  return (
    <UnifiedDialog
      variant="modal"
      open={open}
      onOpenChange={onOpenChange}
      title="Редактировать трек"
      size="md"
      footer={
        <Button onClick={handleSubmit} className="w-full gap-2">
          <Save className="w-4 h-4" />
          Сохранить
        </Button>
      }
    >
      <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="basic" className="gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" />
            Основные
          </TabsTrigger>
          <TabsTrigger value="params" className="gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5" />
            Параметры
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="basic" className="mt-0 space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Стиль / Теги</Label>
              <Input
                id="style"
                value={formData.style_prompt}
                onChange={(e) => setFormData({ ...formData, style_prompt: e.target.value })}
                placeholder="Pop, энергичный, гитара..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Идеи, комментарии..."
              />
            </div>
          </TabsContent>

          <TabsContent value="params" className="mt-0 pb-4">
            <TrackParamsEditor params={trackParams} onChange={setTrackParams} compact />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </UnifiedDialog>
  );
};
