import { GenerateHub } from '@/components/generate/GenerateHub';

export default function Generate() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <GenerateHub />
      </div>
    </div>
  );
}
