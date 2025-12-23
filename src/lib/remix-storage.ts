/**
 * Remix Storage Utility
 * 
 * Manages session storage for remix data when creating track remixes.
 */

const REMIX_DATA_KEY = 'musicverse_remix_data';

export interface RemixData {
  parentTrackId: string;
  parentTrackTitle: string;
  title: string;
  style: string;
  lyrics: string;
  tags: string;
}

export function setRemixData(data: RemixData) {
  sessionStorage.setItem(REMIX_DATA_KEY, JSON.stringify(data));
}

export function getRemixData(): RemixData | null {
  const data = sessionStorage.getItem(REMIX_DATA_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearRemixData() {
  sessionStorage.removeItem(REMIX_DATA_KEY);
}