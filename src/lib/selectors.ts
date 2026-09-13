import type {
  AppState,
  CrowdLevel,
  DemandRow,
  Order,
  Slot,
  SlotDemandRow,
  User,
} from '../types';
import { simMinutesOf } from './store';
import { crowdLevel, isSameDay, percent, slotStatusLabel } from './utils';

/* ============================================================================
   Pure derivations. The kitchen dashboard, analytics page and student pages all
   read from these, so a single placed order ripples everywhere consistently.
   ========================================================================== */

export function slotById(state: AppState, slotId: string | null): Slot | undefined {
  if (!slotId) return undefined;
  return state.slots.find((s) => s.id === slotId);
}

export function foodById(state: AppState, foodId: string) {
  return state.menu.find((f) => f.id === foodId);
}

/** Orders placed today (excludes the seeded personal history from other days). */
export function todayOrders(state: AppState): Order[] {
  return state.orders.filter((o) => isSameDay(o.createdAt, state.nowMs));
}

export function todayPaidOrders(state: AppState): Order[] {
  return todayOrders(state).filter((o) => o.paymentStatus === 'paid');
}

export function ordersInSlot(state: AppState, slotId: string): Order[] {
  return todayPaidOrders(state).filter((o) => o.slotId === slotId);
}

export function userOrders(state: AppState): Order[] {
  return state.orders
    .filter((o) => o.userId === state.user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Orders safe to offer in the scanner kiosk dropdown. */
export function scannableOrders(state: AppState): Order[] {
  return todayPaidOrders(state).sort((a, b) => {
    if (a.redeemed !== b.redeemed) return a.redeemed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}

/* ---------- crowd ---------- */

export function crowdOf(state: AppState): CrowdLevel {
  return crowdLevel(state.occupancy.current, state.occupancy.max);
}

export function occupancyPercent(state: AppState): number {
  return percent(state.occupancy.current, state.occupancy.max);
}

/* ---------- demand forecasting ---------- */

/**
 * Confirmed demand per dish, plus the recommended preparation quantity which
 * adds the walk-in buffer for outsiders and cash-paying customers.
 */
export function demandByFood(state: AppState): DemandRow[] {
  const buffer = state.settings.walkInBufferPct;
  const paid = todayPaidOrders(state);

  const rows = state.menu.map((food) => {
    let qty = 0;
    let orders = 0;
    paid.forEach((o) => {
      o.items.forEach((l) => {
        if (l.foodId === food.id) {
          qty += l.qty;
          orders += 1;
        }
      });
    });
    return { food, qty, orders };
  });

  const totalQty = rows.reduce((acc, r) => acc + r.qty, 0) || 1;

  return rows
    .map<DemandRow>((r) => ({
      food: r.food,
      qty: r.qty,
      orders: r.orders,
      buffer: Math.ceil((r.qty * buffer) / 100),
      recommended: Math.ceil(r.qty * (1 + buffer / 100)),
      share: Math.round((r.qty / totalQty) * 1000) / 10,
    }))
    .sort((a, b) => b.qty - a.qty);
}

/** Slot-wise demand table with utilisation + a recommended quieter window. */
export function demandBySlot(state: AppState): SlotDemandRow[] {
  const simMin = simMinutesOf(state);
  const paid = todayPaidOrders(state);

  const base = state.slots.map((slot) => {
    const orders = paid.filter((o) => o.slotId === slot.id);
    const items = orders.reduce((acc, o) => acc + o.items.reduce((s, l) => s + l.qty, 0), 0);
    const utilization = percent(slot.booked, slot.capacity);
    return {
      slot,
      orders: orders.length,
      items,
      booked: slot.booked,
      capacity: slot.capacity,
      utilization,
      status: slotStatusLabel(utilization),
      isCurrent: simMin >= slot.startMin && simMin < slot.endMin,
      isRecommended: false,
    };
  });

  // Only windows that are still ahead of the simulated clock can be recommended.
  const open = base.filter((r) => r.utilization < 100 && r.slot.endMin > simMin);
  const best = open.length
    ? open.reduce((a, b) => (b.utilization < a.utilization ? b : a))
    : undefined;
  if (best) best.isRecommended = true;

  return base;
}

export function recommendedSlot(state: AppState): SlotDemandRow | undefined {
  return demandBySlot(state).find((r) => r.isRecommended);
}

/** Expected remaining walk-in / cash traffic for this lunch service. */
export function walkInEstimate(state: AppState): number {
  return Math.round(state.occupancy.current * 0.34);
}

/* ---------- kitchen metrics ---------- */

export interface KitchenStats {
  preOrdersToday: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  collected: number;
  readyNotCollected: number;
  itemsToPrepare: number;
  remainingBuffers: number;
  crowd: CrowdLevel;
  occupancy: number;
  occupancyMax: number;
  paidToday: number;
  avgOrderValue: number;
  liveOrders: number;
}

export function kitchenStats(state: AppState): KitchenStats {
  const today = todayPaidOrders(state);
  const live = today.filter((o) => !o.redeemed);

  const counts = { confirmed: 0, preparing: 0, ready: 0, collected: 0 };
  today.forEach((o) => {
    if (o.redeemed) counts.collected += 1;
    else counts[o.prepStatus === 'collected' ? 'confirmed' : o.prepStatus] += 1;
  });

  const revenue = today.reduce((acc, o) => acc + o.total, 0);

  return {
    preOrdersToday: today.length,
    pending: live.length,
    confirmed: counts.confirmed,
    preparing: counts.preparing,
    ready: counts.ready,
    collected: counts.collected,
    readyNotCollected: today.filter((o) => o.prepStatus === 'ready' && !o.redeemed).length,
    itemsToPrepare: live.reduce((acc, o) => acc + o.items.reduce((s, l) => s + l.qty, 0), 0),
    remainingBuffers: demandByFood(state).reduce((acc, r) => acc + r.buffer, 0),
    crowd: crowdOf(state),
    occupancy: state.occupancy.current,
    occupancyMax: state.occupancy.max,
    paidToday: today.length,
    avgOrderValue: today.length ? Math.round(revenue / today.length) : 0,
    liveOrders: live.length,
  };
}

/* ---------- scheduling reliability ---------- */

export interface Reliability {
  level: 'excellent' | 'good' | 'needs-improvement';
  label: string;
  message: string;
  score: number;
  offSlotEvents: number;
  penaltyActive: boolean;
}

export function reliabilityOf(user: User, threshold: number): Reliability {
  const total = user.onSlotEvents + user.offSlotEvents;
  const score = total === 0 ? 100 : Math.round((user.onSlotEvents / total) * 100);
  const penaltyActive = user.offSlotEvents >= threshold;

  if (score >= 90) {
    return {
      level: 'excellent',
      label: 'Excellent',
      message: 'You usually collect your orders within your selected time window.',
      score,
      offSlotEvents: user.offSlotEvents,
      penaltyActive,
    };
  }
  if (score >= 70) {
    return {
      level: 'good',
      label: 'Good',
      message: 'Mostly on time — a couple of collections slipped outside the window.',
      score,
      offSlotEvents: user.offSlotEvents,
      penaltyActive,
    };
  }
  return {
    level: 'needs-improvement',
    label: 'Needs Improvement',
    message: 'Repeated off-slot collection may affect future scheduling benefits.',
    score,
    offSlotEvents: user.offSlotEvents,
    penaltyActive,
  };
}

/* ---------- analytics (clearly labelled as simulated) ---------- */

export interface ImpactMetrics {
  queueReduction: number;
  preOrdersToday: number;
  wasteReduction: number;
  peakDistribution: string;
  avgItemsPerOrder: number;
  onTimeRate: number;
  offSlotRate: number;
  slotUtilisation: number;
  peakSlotShare: number;
  busiestSlot: SlotDemandRow | undefined;
  quietestSlot: SlotDemandRow | undefined;
  revenue: number;
}

export function impactMetrics(state: AppState): ImpactMetrics {
  const slots = demandBySlot(state);
  const today = todayPaidOrders(state);
  const totalItems = today.reduce((acc, o) => acc + o.items.reduce((s, l) => s + l.qty, 0), 0);
  const totalBooked = slots.reduce((acc, r) => acc + r.booked, 0);
  const totalCapacity = slots.reduce((acc, r) => acc + r.capacity, 0);

  const collected = state.orders.filter((o) => o.collectedOnTime !== null);
  const onTime = collected.filter((o) => o.collectedOnTime).length;

  const sorted = [...slots].sort((a, b) => b.booked - a.booked);

  return {
    // These headline percentages are demo/projection figures, not measurements.
    queueReduction: 65,
    preOrdersToday: today.length,
    wasteReduction: 18,
    peakDistribution: 'Improved',
    avgItemsPerOrder: today.length ? Math.round((totalItems / today.length) * 10) / 10 : 0,
    onTimeRate: collected.length ? percent(onTime, collected.length) : 100,
    offSlotRate: collected.length ? percent(collected.length - onTime, collected.length) : 0,
    slotUtilisation: percent(totalBooked, totalCapacity),
    peakSlotShare: totalBooked ? percent(sorted[0]?.booked ?? 0, totalBooked) : 0,
    busiestSlot: sorted[0],
    quietestSlot: sorted[sorted.length - 1],
    revenue: today.reduce((acc, o) => acc + o.total, 0),
  };
}
