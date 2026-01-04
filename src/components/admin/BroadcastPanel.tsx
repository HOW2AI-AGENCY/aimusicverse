import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Megaphone, Image, X, FileText, ChevronDown } from "lucide-react";
import { useBroadcastNotification, useBroadcastTemplates, useSaveBroadcastTemplate } from "@/hooks/useBroadcast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

export function BroadcastPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const broadcast = useBroadcastNotification();
  const { data: templates } = useBroadcastTemplates();
  const saveTemplate = useSaveBroadcastTemplate();

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `broadcast-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('broadcast')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('broadcast').getPublicUrl(path);
      setImageUrl(urlData.publicUrl);
      setImageFile(file);
      toast.success('Изображение загружено');
    } catch (error) {
      toast.error('Ошибка загрузки: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const clearImage = () => {
    setImageUrl("");
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadTemplate = (template: { title: string; message: string; image_url?: string | null }) => {
    setTitle(template.title);
    setMessage(template.message);
    if (template.image_url) {
      setImageUrl(template.image_url);
    }
    setTemplatesOpen(false);
    toast.success('Шаблон загружен');
  };

  const handleSend = async () => {
    if (!title || !message) return;
    
    await broadcast.mutateAsync({ 
      title, 
      message, 
      targetType,
      imageUrl: imageUrl || undefined,
      saveAsTemplate,
      templateName: saveAsTemplate ? templateName : undefined,
    });
    
    setTitle("");
    setMessage("");
    setImageUrl("");
    setImageFile(null);
    setSaveAsTemplate(false);
    setTemplateName("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Рассылка уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Templates */}
        {templates && templates.length > 0 && (
          <Collapsible open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Шаблоны ({templates.length})
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template)}
                  className="w-full p-2 text-left text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="font-medium truncate">{template.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{template.title}</div>
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div>
          <Label>Заголовок</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок уведомления"
          />
        </div>

        <div>
          <Label>Сообщение</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Текст уведомления..."
            rows={4}
          />
        </div>

        {/* Image Upload */}
        <div>
          <Label>Изображение (опционально)</Label>
          <div className="mt-1">
            {imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={uploading}
                  className="hidden"
                  id="broadcast-image"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Image className="h-4 w-4 mr-2" />
                  )}
                  Загрузить изображение
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Получатели</Label>
          <Select value={targetType} onValueChange={setTargetType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все пользователи</SelectItem>
              <SelectItem value="premium">Premium пользователи</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save as template */}
        <div className="flex items-center justify-between">
          <Label htmlFor="save-template" className="cursor-pointer">Сохранить как шаблон</Label>
          <Switch
            id="save-template"
            checked={saveAsTemplate}
            onCheckedChange={setSaveAsTemplate}
          />
        </div>
        
        {saveAsTemplate && (
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Название шаблона"
          />
        )}

        <Button 
          onClick={handleSend}
          disabled={broadcast.isPending || !title || !message || (saveAsTemplate && !templateName)}
          className="w-full"
        >
          {broadcast.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Отправить всем
        </Button>
      </CardContent>
    </Card>
  );
}
