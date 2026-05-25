export function isTempAlert(temp: number | null | undefined): boolean {
  return temp !== null && temp !== undefined && (temp > 30 || temp < 2);
}

export function isHumAlert(hum: number | null | undefined): boolean {
  return hum !== null && hum !== undefined && (hum > 80 || hum < 30);
}

export function isAnyAlert(temp: number | null | undefined, hum: number | null | undefined): boolean {
  return isTempAlert(temp) || isHumAlert(hum);
}

export function severityLabel(temp: number | null | undefined, hum: number | null | undefined): string {
  const t = isTempAlert(temp);
  const h = isHumAlert(hum);
  if (t && h) return 'Crítica';
  if (t) return 'Temperatura';
  if (h) return 'Humedad';
  return 'Info';
}

export function severityClass(temp: number | null | undefined, hum: number | null | undefined): 'critical' | 'warning' | 'info' {
  const t = isTempAlert(temp);
  const h = isHumAlert(hum);
  if (t && h) return 'critical';
  if (t) return 'warning';
  if (h) return 'warning';
  return 'info';
}
