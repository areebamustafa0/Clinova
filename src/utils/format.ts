/** Client- and server-safe formatting helpers. */

const parse = (date: string) => new Date(`${date}T00:00:00Z`);

export function formatDate(date: string, style: "short" | "medium" | "long" = "medium"): string {
  if (!date) return "";
  const opts: Intl.DateTimeFormatOptions =
    style === "short"
      ? { day: "numeric", month: "short", timeZone: "UTC" }
      : style === "long"
        ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
        : { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", opts).format(parse(date));
}

export function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatMoney(value: number | string): string {
  const n = Number(value);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function statusLabel(status: string): string {
  return status === "no_show" ? "No show" : status.charAt(0).toUpperCase() + status.slice(1);
}

export function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
