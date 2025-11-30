import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LongPromptAssistant } from '@/components/suno/LongPromptAssistant';

interface Step2InfoProps {
  onNext: (data: { title: string; lyrics: string }) => void;
  onBack: () => void;
}

export const Step2Info = ({ onNext, onBack }: Step2InfoProps) => {
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');

  const handleNext = () => {
    onNext({ title, lyrics });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Основная информация</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Название трека</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Мой новый хит" />
        </div>

        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Вручную</TabsTrigger>
            <TabsTrigger value="ai">AI Ассистент</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="mt-4">
            <Label htmlFor="lyrics">Текст песни</Label>
            <Textarea id="lyrics" value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="[Куплет]..." rows={8} />
          </TabsContent>
          <TabsContent value="ai" className="mt-4">
            <LongPromptAssistant onGenerateParts={(parts) => setLyrics(parts.join('\\n\\n'))} />
          </TabsContent>
        </Tabs>

      </div>
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>Назад</Button>
        <Button onClick={handleNext}>Далее</Button>
      </div>
    </div>
  );
};
