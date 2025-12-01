import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SimpleModeProps {
  onBack: () => void;
}

export const SimpleMode = ({ onBack }: SimpleModeProps) => {
  return (
    <div className="p-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к выбору режима
      </Button>
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Простой режим</h2>
        <p className="text-muted-foreground">
          Этот режим находится в разработке. Здесь будет простой интерфейс для быстрой генерации музыки.
        </p>
      </Card>
    </div>
  );
};
