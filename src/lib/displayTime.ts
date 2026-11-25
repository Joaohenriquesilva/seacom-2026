export function displayTime(value: string): string {
  return value.replace(/\b(\d{2}):(\d{2})\b/g, '$1h$2');
}
