export const LOCALE = 'es-CO';

export function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString(LOCALE);
}
