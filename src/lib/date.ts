export function formatDateInTimezone(date: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is what we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function todayInTimezone(timeZone: string): string {
  return formatDateInTimezone(new Date(), timeZone);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns the UTC instant corresponding to local midnight of `dateStr` in `timeZone`.
export function zonedMidnightUtc(dateStr: string, timeZone: string): Date {
  const assumedUtc = new Date(`${dateStr}T00:00:00Z`);
  // The offset can differ between UTC midnight and local midnight on DST
  // change days, so resolve it once, then re-resolve at the guessed instant.
  const first = new Date(
    assumedUtc.getTime() + zoneOffsetMs(assumedUtc, timeZone),
  );
  return new Date(assumedUtc.getTime() + zoneOffsetMs(first, timeZone));
}

// Returns (UTC instant - local wall clock read as UTC) for `at` in `timeZone`.
function zoneOffsetMs(at: Date, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(at);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");
  const localAsUtc = new Date(
    `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}Z`,
  );
  return at.getTime() - localAsUtc.getTime();
}

export function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
