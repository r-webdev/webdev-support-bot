import { emplaceMap } from '../../../utils/mapEmplace.js';

const formatter = new Intl.DateTimeFormat('en-us', {
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: "2-digit",
});

export function dateFormat(
  date: Date,
  fn: (obj: Record<Intl.DateTimeFormatPartTypes, string | string[]>) => string
) {
  const parts = formatter.formatToParts(date);
  const map = new Map<Intl.DateTimeFormatPartTypes, string | string[]>();

  for (const { type, value } of parts) {
    emplaceMap(map, type, {
      update: existing => Array.isArray(existing) ? [...existing, value] : [existing, value],
      insert: () => value,
    });
  }

  return fn(
    Object.fromEntries(map) as Record<
      Intl.DateTimeFormatPartTypes, string | string[]
    >
  );
}
