// The backend schedules daily jobs by UTC hour; these label each hour in the viewer's local time.

export function localTimeLabel(utcHour: number): string {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function localMinutes(utcHour: number): number {
  const d = new Date();
  d.setUTCHours(utcHour, 0, 0, 0);
  return d.getHours() * 60 + d.getMinutes();
}

export const UTC_HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ value: h, label: localTimeLabel(h) }))
  .sort((a, b) => localMinutes(a.value) - localMinutes(b.value));
