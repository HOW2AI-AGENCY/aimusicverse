/**
 * Add Track Dialog
 * Dialog for adding new tracks to the studio project
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "@/lib/icons";
import type { TrackType } from "@/stores/useUnifiedStudioStore";

interface AddTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: TrackType, name: string) => void;
}

function getDefaultTrackName(type: TrackType): string {
  const names: Record<TrackType, string> = {
    main: "Main Track",
    vocal: "Вокал",
    instrumental: "Инструментал",
    stem: "Stem",
    sfx: "SFX",
    drums: "Ударные",
    bass: "Бас",
    other: "Дорожка",
  };
  return names[type];
}

export function AddTrackDialog({ open, onOpenChange, onAdd }: AddTrackDialogProps) {
  const [type, setType] = useState<TrackType>("instrumental");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setType("instrumental");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackName = name.trim() || getDefaultTrackName(type);
    onAdd(type, trackName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить дорожку</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Тип дорожки</Label>
            <Select value={type} onValueChange={(v) => setType(v as TrackType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vocal">🎤 Вокал</SelectItem>
                <SelectItem value="instrumental">🎸 Инструментал</SelectItem>
                <SelectItem value="drums">🥁 Ударные</SelectItem>
                <SelectItem value="bass">🎸 Бас</SelectItem>
                <SelectItem value="sfx">✨ SFX / Эффекты</SelectItem>
                <SelectItem value="other">📁 Другое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={getDefaultTrackName(type)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { getDefaultTrackName };
