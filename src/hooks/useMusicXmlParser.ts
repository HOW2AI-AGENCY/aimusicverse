/**
 * MusicXML Parser Hook
 * Parses MusicXML files and extracts musical data
 */

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'MusicXmlParser' });

export interface ParsedNote {
  pitch: string;
  octave: number;
  duration: number;
  type: string;
  voice: number;
  staff: number;
  startTime: number;
}

export interface ParsedMeasure {
  number: number;
  notes: ParsedNote[];
}

export interface ParsedMusicXml {
  title: string | null;
  composer: string | null;
  measures: ParsedMeasure[];
  parts: Array<{ id: string; name: string; measures: ParsedMeasure[] }>;
  notes: ParsedNote[];
  duration: number;
  bpm: number | null;
  keySignature: string | null;
  timeSignature: { numerator: number; denominator: number } | null;
  partNames: string[];
}

export function useMusicXmlParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedXml, setParsedXml] = useState<ParsedMusicXml | null>(null);

  const parseMusicXmlFromUrl = useCallback(async (xmlUrl: string): Promise<ParsedMusicXml | null> => {
    setIsLoading(true);
    setError(null);

    try {
      log.info('Fetching MusicXML file', { xmlUrl });

      const response = await fetch(xmlUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch MusicXML: ${response.status}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid MusicXML format');
      }

      // Extract title and composer
      const title = xmlDoc.querySelector('work > work-title')?.textContent ||
                   xmlDoc.querySelector('movement-title')?.textContent || null;
      const composer = xmlDoc.querySelector('identification > creator[type="composer"]')?.textContent || null;

      // Parse parts
      const partElements = xmlDoc.querySelectorAll('part');
      const parts: ParsedMusicXml['parts'] = [];

      partElements.forEach((partEl) => {
        const partId = partEl.getAttribute('id') || '';
        const partName = xmlDoc.querySelector(`part-list > score-part[id="${partId}"] > part-name`)?.textContent || partId;
        
        const measures: ParsedMeasure[] = [];
        const measureElements = partEl.querySelectorAll('measure');
        
        measureElements.forEach((measureEl) => {
          const measureNumber = parseInt(measureEl.getAttribute('number') || '0', 10);
          const notes: ParsedNote[] = [];
          
          // Parse notes in measure
          const noteElements = measureEl.querySelectorAll('note');
          noteElements.forEach((noteEl) => {
            const pitch = noteEl.querySelector('pitch > step')?.textContent || '';
            const octave = parseInt(noteEl.querySelector('pitch > octave')?.textContent || '4', 10);
            const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1', 10);
            const type = noteEl.querySelector('type')?.textContent || 'quarter';
            const voice = parseInt(noteEl.querySelector('voice')?.textContent || '1', 10);
            const staff = parseInt(noteEl.querySelector('staff')?.textContent || '1', 10);

            if (pitch) {
              notes.push({
                pitch,
                octave,
                duration,
                type,
                voice,
                staff,
                startTime: 0, // Would need to calculate based on previous notes
              });
            }
          });

          measures.push({ number: measureNumber, notes });
        });

        parts.push({ id: partId, name: partName, measures });
      });

      const result: ParsedMusicXml = {
        title,
        composer,
        measures: parts[0]?.measures || [],
        parts,
      };

      setParsedXml(result);
      log.info('MusicXML parsed successfully', { title, partsCount: parts.length });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      log.error('Failed to parse MusicXML', { error: errorMessage });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedXml(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    parsedXml,
    parseMusicXmlFromUrl,
    reset,
  };
}
