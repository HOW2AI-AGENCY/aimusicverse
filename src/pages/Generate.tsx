import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logger } from '@/lib/logger';

export default function Generate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    try {
      // Extract preset parameters from URL
      const presetId = searchParams.get('preset');
      const style = searchParams.get('style');
      const mood = searchParams.get('mood');
      const tempo = searchParams.get('tempo');
      const instruments = searchParams.get('instruments');
      
      // If preset parameters exist, store them in sessionStorage for GenerateSheet
      if (presetId) {
        const presetParams = {
          presetId,
          style,
          mood,
          tempo,
          instruments: instruments?.split(','),
        };
        
        sessionStorage.setItem('presetParams', JSON.stringify(presetParams));
        logger.info('Generate page: Stored preset params', { presetId });
      }
      
      // Redirect to home with state to open GenerateSheet
      navigate('/', { state: { openGenerate: true } });
    } catch (error) {
      logger.error('Generate page: Failed to process params', error instanceof Error ? error : new Error(String(error)));
      navigate('/', { state: { openGenerate: true } });
    }
  }, [navigate, searchParams]);

  return null;
}
