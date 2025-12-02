
import { GenerateHub } from '@/components/generate/GenerateHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Generate() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Центр генерации
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Выберите удобный для вас способ создания музыки с помощью ИИ.
          </p>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <GenerateHub />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
