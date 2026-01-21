/**
 * useHomePageEffects - URL parameter and navigation effects for home page
 * 
 * Handles deep linking and URL parameter processing
 * 
 * @module hooks/useHomePageEffects
 */

import { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { logger } from "@/lib/logger";

interface UseHomePageEffectsOptions {
  onOpenGenerateSheet: () => void;
  onOpenRecognitionDialog: () => void;
}

export function useHomePageEffects({
  onOpenGenerateSheet,
  onOpenRecognitionDialog,
}: UseHomePageEffectsOptions) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle navigation state for opening GenerateSheet
  useEffect(() => {
    if (location.state?.openGenerate) {
      onOpenGenerateSheet();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, onOpenGenerateSheet]);

  // Handle URL parameters for generation
  useEffect(() => {
    const style = searchParams.get('style');
    const mood = searchParams.get('mood');
    const tempo = searchParams.get('tempo');
    const instruments = searchParams.get('instruments');
    const remix = searchParams.get('remix');
    const quick = searchParams.get('quick');
    const mode = searchParams.get('mode');
    const ref = searchParams.get('ref');
    const stem = searchParams.get('stem');

    // Check if we have any generation-related parameters
    const hasGenerationParams = style || mood || tempo || instruments || remix || quick || mode || ref || stem;

    if (hasGenerationParams) {
      // If preset parameters exist, store them in sessionStorage for GenerateSheet
      if (style || mood || tempo || instruments) {
        const presetParams = {
          style,
          mood,
          tempo,
          instruments: instruments?.split(','),
        };
        sessionStorage.setItem('presetParams', JSON.stringify(presetParams));
        if (quick === 'true') {
          sessionStorage.setItem('fromQuickCreate', 'true');
        }
        logger.info('Index page: Stored preset params from URL', { style, mood, tempo, instruments });
      }

      // For remix/cover/extend parameters, store them for GenerateSheet
      if (remix) {
        sessionStorage.setItem('remixTrackId', remix);
      }
      if (mode && ref) {
        sessionStorage.setItem('audioMode', JSON.stringify({ mode, ref, stem }));
      }

      // Open the GenerateSheet and clean URL params
      onOpenGenerateSheet();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, onOpenGenerateSheet]);

  // Handle deep link for recognition
  useEffect(() => {
    if (searchParams.get('recognize') === 'true') {
      onOpenRecognitionDialog();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, onOpenRecognitionDialog]);
}
