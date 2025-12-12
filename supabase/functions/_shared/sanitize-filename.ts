/**
 * Sanitize filename to be safe for storage
 * Removes special characters, emoji, and other problematic chars
 */
export function sanitizeFilename(filename: string): string {
  // Get file extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot > 0 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot > 0 ? filename.substring(lastDot) : '';
  
  // Remove special characters and emoji, keep alphanumeric, dash, underscore
  const sanitized = name
    .replace(/[^\w-]/g, '') // Remove special chars, keep word chars and dash
    .replace(/-+/g, '-') // Remove consecutive dashes
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
  
  // If nothing left, use fallback
  return (sanitized || 'file') + ext;
}
