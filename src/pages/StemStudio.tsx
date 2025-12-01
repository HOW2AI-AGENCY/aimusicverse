import { useParams } from 'react-router-dom';
import { StemStudioContent } from '@/components/stem-studio/StemStudioContent';

export default function StemStudio() {
  const params = useParams();
  const trackId = params.trackId;

  if (!trackId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Трек не найден</p>
      </div>
    );
  }

  return <StemStudioContent key={trackId} trackId={trackId} />;
}
