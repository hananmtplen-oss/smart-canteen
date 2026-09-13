import type {
  AppState,
  FoodCategory,
  FoodItem,
  FoodTag,
  Order,
  OrderLine,
  ScanEvent,
  Slot,
  User,
} from '../types';
import {
  dayStart,
  makeQrToken,
  makeTxnId,
  minutesOfDay,
  mulberry32,
  randomToken,
} from './utils';

/* ============================================================================
   Deterministic demo dataset.

   Numbers are tuned to look like a real midday rush:
     247 pre-orders spread over six 12-minute collection windows,
     ~2.3 items per order, occupancy sitting at 118 / 180.
   Because it is generated from a fixed seed, every "Reset Demo Data" click
   reproduces exactly the same canteen.
   ========================================================================== */

export const STATE_VERSION = 5;
export const STORAGE_KEY = 'smart-canteen.state.v5';

const RNG_SEED = 20260213;
const CAPACITY_PER_SLOT = 50;
const START_OF_LUNCH = 12 * 60; // 12:00
const SLOT_LENGTH = 12;
export const SLOT_COUNT = 6;
/** Simulated "now" the demo opens at. */
export const DEMO_START_MIN = 12 * 60 + 30; // 12:30 → inside the 3rd window

/**
 * Lunch-only menu. Four main dishes, plus two add-ons that are ordered as an
 * optional extra on the Kerala Meals (they are not shown as standalone cards).
 */
export const MENU: FoodItem[] = [
  {
    id: 'meals',
    name: 'Kerala Meals',
    emoji: '🍚',
    price: 60,
    category: 'Main Course',
    description: 'Rice, sambar, thoran, pickle, pappad and moru. Unlimited rice.',
    tags: ['Veg', 'Popular'],
    availableQty: 180,
    prepTimeMin: 5,
    popularity: 88,
    gradient: 'from-lime-300 via-emerald-400 to-teal-500',
    addons: ['fish-fry', 'egg'],
  },
  {
    id: 'chicken-biryani',
    name: 'Chicken Biryani',
    emoji: '🍛',
    price: 80,
    category: 'Main Course',
    description: 'Dum-cooked Malabar biryani with raita, pickle & pappad.',
    tags: ['Popular'],
    availableQty: 140,
    prepTimeMin: 12,
    popularity: 92,
    gradient: 'from-amber-300 via-orange-400 to-rose-500',
  },
  {
    id: 'veg-biryani',
    name: 'Veg Biryani',
    emoji: '🥘',
    price: 70,
    category: 'Main Course',
    description: 'Layered vegetable biryani with raita, pickle and pappad.',
    tags: ['Veg'],
    availableQty: 110,
    prepTimeMin: 10,
    popularity: 66,
    gradient: 'from-emerald-200 via-lime-400 to-green-600',
  },
  {
    id: 'fried-rice',
    name: 'Fried Rice',
    emoji: '🍜',
    price: 70,
    category: 'Main Course',
    description: 'Wok-tossed fried rice with egg, chicken and spring onion.',
    tags: [],
    availableQty: 120,
    prepTimeMin: 10,
    popularity: 74,
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
  },

  /* ---- Add-ons: ordered through the Kerala Meals popup, never listed alone. ---- */
  {
    id: 'fish-fry',
    name: 'Fish Fry',
    emoji: '🐟',
    price: 40,
    category: 'Add-on',
    description: 'Masala-coated fried fish, served on the side.',
    tags: ['Limited'],
    availableQty: 90,
    prepTimeMin: 6,
    popularity: 64,
    gradient: 'from-sky-200 via-cyan-400 to-blue-500',
  },
  {
    id: 'egg',
    name: 'Egg',
    emoji: '🥚',
    price: 15,
    category: 'Add-on',
    description: 'Boiled egg or a quick omelette to go with the meals.',
    tags: [],
    availableQty: 300,
    prepTimeMin: 3,
    popularity: 58,
    gradient: 'from-amber-100 via-yellow-300 to-amber-500',
  },
];

/** Probability that an order contains a given main dish. */
const ITEM_WEIGHTS: Record<string, number> = {
  meals: 0.55,
  'chicken-biryani': 0.4,
  'veg-biryani': 0.22,
  'fried-rice': 0.3,
};

/** Add-ons only ever ride along with a Kerala Meals order. */
const ADDON_WEIGHTS: Record<string, number> = {
  'fish-fry': 0.35,
  egg: 0.4,
};

/** Booked counts per window — the sum is exactly 247, matching "Today's Pre-Orders". */
const SLOT_BOOKINGS = [42, 50, 41, 38, 34, 42];

export const DEMO_USER: User = {
  id: 'USR-4471',
  name: 'Tony Stark',
  studentId: 'CSE24-4471',
  email: 'tony.stark@college.edu',
  onSlotEvents: 14,
  offSlotEvents: 0,
};

export const SLOT_DEFS: Slot[] = Array.from({ length: SLOT_COUNT }, (_, i) => ({
  id: `S${i + 1}`,
  startMin: START_OF_LUNCH + i * SLOT_LENGTH,
  endMin: START_OF_LUNCH + (i + 1) * SLOT_LENGTH,
  capacity: CAPACITY_PER_SLOT,
  booked: SLOT_BOOKINGS[i] ?? 0,
}));

function foodById(id: string): FoodItem {
  const found = MENU.find((f) => f.id === id);
  if (!found) throw new Error(`Unknown food id ${id}`);
  return found;
}

function rollItems(rand: () => number): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const food of MENU) {
    if (food.category === 'Add-on') continue; // rolled alongside the meals below
    const weight = ITEM_WEIGHTS[food.id] ?? 0;
    if (rand() < weight) {
      lines.push({ foodId: food.id, name: food.name, emoji: food.emoji, price: food.price, qty: 1 });
    }
  }

  // Add-ons only make sense as an extra on the meals.
  if (lines.some((l) => l.foodId === 'meals')) {
    for (const addonId of ['fish-fry', 'egg']) {
      if (rand() >= (ADDON_WEIGHTS[addonId] ?? 0)) continue;
      const addon = foodById(addonId);
      lines.push({
        foodId: addon.id,
        name: addon.name,
        emoji: addon.emoji,
        price: addon.price,
        qty: addonId === 'egg' && rand() < 0.15 ? 2 : 1,
      });
    }
  }

  if (lines.length === 0) {
    // Nobody orders nothing — fall back to the most likely dish.
    const fallback = foodById('meals');
    lines.push({
      foodId: fallback.id,
      name: fallback.name,
      emoji: fallback.emoji,
      price: fallback.price,
      qty: 1,
    });
  }
  return lines;
}

const STUDENT_NAMES = [
  'Tony Stark',
  'Rahul Nair',
  'Fathima Zahra',
  'Aditya Menon',
  'Sneha Pillai',
  'Mohammed Irfan',
  'Anjali Krishnan',
  'Vishnu Prasad',
  'Nithin Raj',
  'Meera Suresh',
];

function sumLines(lines: OrderLine[]): number {
  return lines.reduce((acc, l) => acc + l.price * l.qty, 0);
}

interface OrderSeedResult {
  orders: Order[];
  nextSeq: number;
  nextTxn: number;
}

/**
 * Builds today's pre-order book.
 * Preparation state is derived from where the order sits relative to the
 * simulated clock, so the kitchen queue always looks believable.
 */
function generateTodayOrders(now: number, simMin: number, rand: () => number): OrderSeedResult {
  const startOfDay = dayStart(now);
  const orders: Order[] = [];
  let seq = 1001;
  let txn = 100000;

  SLOT_DEFS.forEach((slot) => {
    for (let i = 0; i < slot.booked; i += 1) {
      const items = rollItems(rand);
      const subtotal = sumLines(items);
      const createdAt = startOfDay + (slot.startMin - 26 + Math.floor(rand() * 22)) * 60000;
      const studentName = STUDENT_NAMES[Math.floor(rand() * STUDENT_NAMES.length)];

      let prepStatus: Order['prepStatus'];
      let redeemed = false;
      let collectedAt: number | null = null;
      let collectedOnTime: boolean | null = null;

      if (slot.endMin <= simMin) {
        // Window already closed: nearly everything has been picked up.
        if (rand() < 0.93) {
          redeemed = true;
          prepStatus = 'collected';
          const collectMin = slot.startMin + Math.floor(rand() * 14);
          collectedAt = startOfDay + collectMin * 60000;
          collectedOnTime = collectMin <= slot.endMin + 4;
        } else {
          prepStatus = 'ready';
        }
      } else if (slot.startMin <= simMin) {
        // Window in progress: a proper live queue.
        const roll = rand();
        if (roll < 0.42) prepStatus = 'ready';
        else if (roll < 0.78) prepStatus = 'preparing';
        else prepStatus = 'confirmed';
      } else {
        const roll = rand();
        if (roll < 0.16) prepStatus = 'preparing';
        else prepStatus = 'confirmed';
      }

      orders.push({
        id: `SC-2026-${seq}`,
        userId: `USR-${2000 + (seq % 900)}`,
        studentName,
        studentId: `CSE2${(seq % 4) + 1}-${3000 + (seq % 900)}`,
        items,
        subtotal,
        schedulingAdjustment: 0,
        total: subtotal,
        paymentStatus: 'paid',
        paymentMethod: 'UPI',
        txnId: `TXN-DEMO-${txn}`,
        slotId: slot.id,
        qrToken: makeQrToken(rand),
        prepStatus,
        redeemed,
        collectedAt,
        collectedOnTime,
        createdAt,
        isDemo: false,
      });
      seq += 1;
      txn += Math.floor(rand() * 7) + 1;
    }
  });

  return { orders, nextSeq: seq, nextTxn: txn };
}

/** A believable personal order history for the demo student. */
function generateHistory(now: number, rand: () => number): Order[] {
  const picks: Array<{ daysAgo: number; slotIndex: number; ids: string[] }> = [
    { daysAgo: 1, slotIndex: 2, ids: ['chicken-biryani'] },
    { daysAgo: 2, slotIndex: 1, ids: ['meals', 'fish-fry'] },
    { daysAgo: 3, slotIndex: 3, ids: ['fried-rice'] },
    { daysAgo: 5, slotIndex: 4, ids: ['veg-biryani'] },
    { daysAgo: 6, slotIndex: 2, ids: ['meals', 'egg'] },
    { daysAgo: 8, slotIndex: 0, ids: ['chicken-biryani', 'egg'] },
    { daysAgo: 11, slotIndex: 1, ids: ['meals'] },
  ];

  return picks.map((pick, index) => {
    const slot = SLOT_DEFS[pick.slotIndex] ?? SLOT_DEFS[0];
    const items: OrderLine[] = pick.ids.map((id) => {
      const f = foodById(id);
      return { foodId: f.id, name: f.name, emoji: f.emoji, price: f.price, qty: 1 };
    });
    const subtotal = sumLines(items);
    const base = now - pick.daysAgo * 86400000;
    const collectedAt = dayStart(base) + (slot.startMin + 3) * 60000;
    return {
      id: `SC-2026-${901 + index}`,
      userId: DEMO_USER.id,
      studentName: DEMO_USER.name,
      studentId: DEMO_USER.studentId,
      items,
      subtotal,
      schedulingAdjustment: 0,
      total: subtotal,
      paymentStatus: 'paid',
      paymentMethod: index % 3 === 0 ? 'Card' : 'UPI',
      txnId: `TXN-DEMO-${700000 + Math.floor(rand() * 200000)}`,
      slotId: slot.id,
      qrToken: makeQrToken(rand),
      prepStatus: 'collected',
      redeemed: true,
      collectedAt,
      collectedOnTime: true,
      createdAt: dayStart(base) + (slot.startMin - 40) * 60000,
      isDemo: false,
    };
  });
}

/** Occupancy trend for the last two hours, settling on the live count. */
function generateReadings(now: number, current: number, rand: () => number) {
  const points = 25;
  const span = 110 * 60000;
  const out: Array<{ t: number; count: number }> = [];
  for (let i = 0; i < points; i += 1) {
    const ratio = i / (points - 1);
    // Two bumps — a first wave and the lunch peak we are sitting inside.
    const wave = Math.sin(ratio * Math.PI * 1.6) * 34 + Math.sin(ratio * Math.PI * 4.4) * 9;
    const value = Math.round(current - (1 - ratio) * 46 + wave * ratio + (rand() - 0.5) * 7);
    out.push({ t: now - span + (span * i) / (points - 1), count: Math.max(12, value) });
  }
  out[out.length - 1] = { t: now, count: current };
  return out;
}

function generateScanLog(now: number, orders: Order[]): ScanEvent[] {
  const recent = orders
    .filter((o) => o.redeemed && o.collectedAt)
    .sort((a, b) => (b.collectedAt ?? 0) - (a.collectedAt ?? 0))
    .slice(0, 6)
    .reverse();

  return recent.map((order, i) => ({
    id: `SCAN-${100 + i}`,
    at: order.collectedAt ?? now,
    token: order.qrToken,
    orderId: order.id,
    result: 'verified' as const,
    onTime: order.collectedOnTime ?? true,
    arrivalMin: order.collectedAt ? minutesOfDay(order.collectedAt) : DEMO_START_MIN,
  }));
}

export function createInitialState(now: number = Date.now()): AppState {
  const rand = mulberry32(RNG_SEED);

  // Bias the simulated clock so the canteen opens mid-rush.
  const clockOffsetMin = DEMO_START_MIN - minutesOfDay(now);
  const simMin = DEMO_START_MIN;

  const { orders: today, nextSeq, nextTxn } = generateTodayOrders(now, simMin, rand);
  const history = generateHistory(now, rand);
  const orders = [...history, ...today];

  const occupancy = { current: 118, max: 180, lastUpdate: now };

  return {
    version: STATE_VERSION,
    menu: MENU.map((f) => ({ ...f })),
    slots: SLOT_DEFS.map((s) => ({ ...s })),
    orders,
    user: { ...DEMO_USER },
    occupancy,
    readings: generateReadings(now, occupancy.current, rand),
    cart: [],
    selectedSlotId: null,
    activeOrderId: null,
    scanLog: generateScanLog(now, orders),
    settings: {
      walkInBufferPct: 15,
      schedulingPolicyEnabled: true,
      penaltyAmount: 5,
      penaltyThreshold: 3,
      liveSensor: true,
      autoAdvanceClock: true,
      forceNextPaymentFailure: false,
    },
    seq: nextSeq,
    txnSeq: nextTxn,
    clockOffsetMin,
    nowMs: now,
    scannerRequest: null,
  };
}

/* ---------- small helpers used by the demo control panel ---------- */

export function makeDemoToken(): string {
  return `${randomToken(Math.random, 8)}`;
}

export function makeDemoOrderId(seq: number): string {
  return `SC-2026-${seq}`;
}

export function makeDemoTxn(seq: number): string {
  return `TXN-DEMO-${seq}`;
}

export { makeQrToken, makeTxnId };

export const FOOD_CATEGORIES: FoodCategory[] = ['Main Course', 'Add-on'];

export const ALL_TAGS: FoodTag[] = ['Popular', 'Limited', 'New', 'Veg'];
