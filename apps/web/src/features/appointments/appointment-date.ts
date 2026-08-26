import type { Locale } from "@/i18n";

const delhiTimeZone = "Asia/Kolkata";

function delhiDateParts(now: Date): Readonly<{ year: string; month: string; day: string }> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: delhiTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value ?? "";
  return { year: part("year"), month: part("month"), day: part("day") };
}

export function currentDelhiDate(now = new Date()): string {
  const { year, month, day } = delhiDateParts(now);
  return `${year}-${month}-${day}`;
}

export function currentDelhiMonth(now = new Date()): string {
  const { year, month } = delhiDateParts(now);
  return `${year}-${month}`;
}

export function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + offset, 1, 12));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatAppointmentMonth(month: string, locale: Locale): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, monthNumber - 1, 1, 12)));
}

export function formatAppointmentDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function appointmentDayNumber(date: string, locale: Locale): string {
  return new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(
    Number(date.slice(8, 10)),
  );
}
