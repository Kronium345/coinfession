import dayjs, { type Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeekBarPoint = {
  label: (typeof WEEKDAY_LABELS)[number];
  total: number;
  date: Dayjs;
};

export function isPayingSubscription(sub: Subscription): boolean {
  const status = (sub.status ?? "active").toLowerCase();
  return status === "active";
}

/** Cash-basis: full renewal price when renewalDate falls inside the calendar month. */
export function renewalChargeInCalendarMonth(
  sub: Subscription,
  month: Dayjs
): number {
  if (!sub.renewalDate || !isPayingSubscription(sub)) return 0;
  const renewal = dayjs(sub.renewalDate);
  if (!renewal.isValid()) return 0;
  if (!renewal.isSame(month, "month")) {
    return 0;
  }
  return sub.price;
}

export function totalScheduledChargesInMonth(
  subs: Subscription[],
  month: Dayjs
): number {
  return subs.reduce(
    (sum, sub) => sum + renewalChargeInCalendarMonth(sub, month),
    0
  );
}

/** Month-over-month percent change of the same cash-basis metric. */
export function monthOverMonthPercentChange(
  currentMonthCharges: number,
  previousMonthCharges: number
): number | null {
  if (previousMonthCharges <= 0) return null;
  return (
    ((currentMonthCharges - previousMonthCharges) / previousMonthCharges) * 100
  );
}

export function buildWeekRenewalBars(
  subs: Subscription[],
  anchor: Dayjs
): WeekBarPoint[] {
  const weekStart = anchor.startOf("isoWeek");
  const paying = subs.filter(isPayingSubscription);

  return WEEKDAY_LABELS.map((label, index) => {
    const day = weekStart.add(index, "day");
    const total = paying
      .filter((sub) => {
        if (!sub.renewalDate) return false;
        const r = dayjs(sub.renewalDate);
        return r.isValid() && r.isSame(day, "day");
      })
      .reduce((sum, sub) => sum + sub.price, 0);

    return { label, total, date: day };
  });
}

export function pickHighlightBarIndex(points: WeekBarPoint[]): number | null {
  const max = Math.max(...points.map((p) => p.total), 0);
  if (max <= 0) return null;
  return points.findIndex((p) => p.total === max);
}

export type HistoryRow = Subscription & { renewal: Dayjs };

export function buildHistoryRows(
  subs: Subscription[],
  month: Dayjs,
  limit: number
): HistoryRow[] {
  const paying = subs.filter(isPayingSubscription).filter((s) => s.renewalDate);
  const withRenewal = paying
    .map((sub) => ({
      ...sub,
      renewal: dayjs(sub.renewalDate),
    }))
    .filter((row) => row.renewal.isValid());

  const inMonth = withRenewal
    .filter((row) => row.renewal.isSame(month, "month"))
    .sort((a, b) => b.renewal.valueOf() - a.renewal.valueOf());

  if (inMonth.length >= limit) {
    return inMonth.slice(0, limit);
  }

  const fallback = withRenewal
    .sort((a, b) => a.renewal.valueOf() - b.renewal.valueOf())
    .slice(0, limit);

  return fallback.length ? fallback : [];
}

export function niceAxisMax(value: number): number {
  if (value <= 0) return 45;
  const padded = value * 1.12;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}

export function axisTicks(max: number, count: number): number[] {
  const step = max / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, i) => Math.round(step * i));
}
