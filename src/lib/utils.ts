import type { CrowdLevel, Order, PrepStatus, Slot } from '../types';

/* ---------- class name helper ---------- */
export function cls(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ---------- deterministic PRNG (so demo data never changes between reloads) ---------- */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function randomToken(rand: () => number = Math.random, length = 8): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TOKEN_ALPHABET[Math.floor(rand() * TOKEN_ALPHABET.length)];
  }
  return out;
}

export const QR_PREFIX = 'SMARTCANTEEN_ORDER_TOKEN_';

export function makeQrToken(rand: () => number = Math.random): string {
  return `${QR_PREFIX}${randomToken(rand, 8)}`;
}

export function makeTxnId(rand: () => number = Math.random): string {
  return `TXN-DEMO-${Math.floor(100000 + rand() * 899999)}`;
}

/* ---------- formatting ---------- */
export function inr(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

/** 750 → "12:30" */
export function clock24(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 750 → "12:30 PM" */
export function clock12(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = Math.round(min) % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function minutesOfDay(ts: number): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

export function slotLabel(slot: Pick<Slot, 'startMin' | 'endMin'>): string {
  return `${clock24(slot.startMin)}–${clock24(slot.endMin)}`;
}

export function longDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function dateTime(ts: number): string {
  return `${longDate(ts)} · ${clock12(minutesOfDay(ts))}`;
}

/* ---------- maths ---------- */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function percent(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

export function crowdLevel(current: number, max: number): CrowdLevel {
  const p = max <= 0 ? 0 : (current / max) * 100;
  if (p <= 40) return 'LOW';
  if (p <= 75) return 'MODERATE';
  return 'HIGH';
}

export function dayStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function isSameDay(a: number, b: number): boolean {
  return dayStart(a) === dayStart(b);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/* ---------- labels ---------- */
export const CROWD_META: Record<
  CrowdLevel,
  { label: string; dot: string; text: string; bg: string; ring: string; bar: string; emoji: string }
> = {
  LOW: {
    label: 'LOW CROWD',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    bar: 'bg-emerald-500',
    emoji: '🟢',
  },
  MODERATE: {
    label: 'MODERATELY BUSY',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    bar: 'bg-amber-500',
    emoji: '🟡',
  },
  HIGH: {
    label: 'HIGH CROWD',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    ring: 'ring-rose-200',
    bar: 'bg-rose-500',
    emoji: '🔴',
  },
};

export const PREP_META: Record<PrepStatus, { label: string; dot: string; text: string; bg: string; emoji: string }> = {
  confirmed: {
    label: 'Order Confirmed',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    emoji: '🟡',
  },
  preparing: {
    label: 'Being Prepared',
    dot: 'bg-sky-500',
    text: 'text-sky-700',
    bg: 'bg-sky-50',
    emoji: '🔵',
  },
  ready: {
    label: 'Ready for Collection',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    emoji: '🟢',
  },
  collected: {
    label: 'Collected',
    dot: 'bg-slate-500',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    emoji: '⚫',
  },
};

export function orderStatusOf(order: Order): PrepStatus {
  return order.redeemed ? 'collected' : order.prepStatus;
}

export function slotStatusLabel(utilization: number): 'Available' | 'Low' | 'Busy' | 'Full' {
  if (utilization >= 100) return 'Full';
  if (utilization >= 82) return 'Busy';
  if (utilization >= 50) return 'Available';
  return 'Low';
}

/** Cheap stable-ish id for scan log entries. */
export function shortId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function pluralize(n: number, word: string, plural = `${word}s`): string {
  return `${n} ${n === 1 ? word : plural}`;
}
