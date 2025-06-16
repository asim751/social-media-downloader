export function sanitizeFilename(filename) {
  if (!filename) return 'download';
  
  return filename
    // Replace full-width characters with half-width equivalents
    .replace(/？/g, '?')
    .replace(/｜/g, '|')
    .replace(/＃/g, '#')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/「/g, '"')
    .replace(/」/g, '"')
    // Remove problematic characters
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/[^\x00-\x7F]/g, '_') // Replace non-ASCII
    .replace(/_{2,}/g, '_') // Multiple underscores to single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 200) // Limit length
    || 'download';
}

export function generateCleanFilename(title, uniqueId, extension = 'mp4') {
  const cleanTitle = sanitizeFilename(title || 'video');
  return `${uniqueId}_${cleanTitle}.${extension}`;
}
