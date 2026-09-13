import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { Dispatch, ReactNode } from 'react';
import type { Action, AppState, Order, OrderLine } from '../types';
import { DEMO_START_MIN, createInitialState, STATE_VERSION, STORAGE_KEY } from './seed';
import { clamp, makeQrToken, minutesOfDay } from './utils';

/* ============================================================================
   Single source of truth for the whole prototype.

   Student ordering, the kitchen queue, the QR scanner, the occupancy sensors
   and the demo control panel all read and write this one reducer, which is why
   a student placing an order instantly changes the kitchen dashboard.
   State is mirrored into localStorage so a refresh never loses the demo.
   ========================================================================== */

function loadState(): AppState {
  if (typeof window === 'undefined') return createInitialState();
  try {
    // Drop superseded saves so an old, much larger dataset never lingers and
    // eats into the storage quota.
    for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('smart-canteen.state.') && key !== STORAGE_KEY) {
        window.localStorage.removeItem(key);
      }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== STATE_VERSION) return createInitialState();
    // Re-anchor the live clock on reload.
    return { ...parsed, nowMs: Date.now(), scannerRequest: null };
  } catch {
    return createInitialState();
  }
}

function withReading(state: AppState, current: number, nowMs: number): AppState {
  const readings = [...state.readings, { t: nowMs, count: current }].slice(-70);
  return {
    ...state,
    occupancy: { ...state.occupancy, current, lastUpdate: nowMs },
    readings,
  };
}

/** Smooth lunch-rush occupancy curve used by the simulated ToF sensor feed. */
function sensorTarget(simMin: number, max: number): number {
  const peak = 12 * 60 + 40;
  const spread = 60;
  const g = Math.exp(-((simMin - peak) ** 2) / (2 * spread * spread));
  return Math.round(max * (0.16 + 0.5 * g));
}

function applyPrepStatus(state: AppState, status: Order['prepStatus'], from: Order['prepStatus']): AppState {
  return {
    ...state,
    orders: state.orders.map((o) =>
      !o.redeemed && o.paymentStatus === 'paid' && o.prepStatus === from ? { ...o, prepStatus: status } : o,
    ),
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const food = state.menu.find((f) => f.id === action.foodId);
      if (!food) return state;
      const existing = state.cart.find((l) => l.foodId === action.foodId);
      const maxQty = Math.max(1, food.availableQty);
      const cart = existing
        ? state.cart.map((l) =>
            l.foodId === action.foodId ? { ...l, qty: clamp(l.qty + action.qty, 1, maxQty) } : l,
          )
        : [
            ...state.cart,
            { foodId: food.id, name: food.name, emoji: food.emoji, price: food.price, qty: clamp(action.qty, 1, maxQty) },
          ];
      return { ...state, cart };
    }

    case 'SET_CART_QTY': {
      const food = state.menu.find((f) => f.id === action.foodId);
      const maxQty = Math.max(1, food?.availableQty ?? 99);
      const cart =
        action.qty <= 0
          ? state.cart.filter((l) => l.foodId !== action.foodId)
          : state.cart.map((l) =>
              l.foodId === action.foodId ? { ...l, qty: clamp(action.qty, 1, maxQty) } : l,
            );
      return { ...state, cart };
    }

    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter((l) => l.foodId !== action.foodId) };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'SELECT_SLOT':
      return { ...state, selectedSlotId: action.slotId };

    case 'PLACE_ORDER': {
      const order = action.order;
      return {
        ...state,
        orders: [order, ...state.orders],
        seq: state.seq + 1,
        menu: state.menu.map((f) => {
          const line = order.items.find((l) => l.foodId === f.id);
          if (!line) return f;
          return { ...f, availableQty: Math.max(0, f.availableQty - line.qty) };
        }),
        slots: state.slots.map((s) =>
          s.id === order.slotId ? { ...s, booked: Math.min(s.capacity, s.booked + 1) } : s,
        ),
        cart: [],
        selectedSlotId: null,
        activeOrderId: order.id,
      };
    }

    case 'ADD_SIMULATED_ORDER': {
      // Used by the demo control panel to inject an order without touching the
      // presenter's own cart.
      const order = action.order;
      return {
        ...state,
        orders: [order, ...state.orders],
        seq: state.seq + 1,
        menu: state.menu.map((f) => {
          const line = order.items.find((l) => l.foodId === f.id);
          return line ? { ...f, availableQty: Math.max(0, f.availableQty - line.qty) } : f;
        }),
        slots: state.slots.map((s) =>
          s.id === order.slotId ? { ...s, booked: Math.min(s.capacity, s.booked + 1) } : s,
        ),
      };
    }

    case 'SET_PREP_STATUS':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId ? { ...o, prepStatus: action.status } : o,
        ),
      };

    case 'REDEEM_ORDER': {
      const order = state.orders.find((o) => o.id === action.orderId);
      const slot = order ? state.slots.find((s) => s.id === order.slotId) : undefined;
      const onTime = order && slot ? action.arrivalMin <= slot.endMin + 4 : true;
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.orderId
            ? {
                ...o,
                redeemed: true,
                prepStatus: 'collected',
                collectedAt: simulatedTimestamp(state),
                collectedOnTime: onTime,
              }
            : o,
        ),
        user: order
          ? {
              ...state.user,
              onSlotEvents: state.user.onSlotEvents + (onTime ? 1 : 0),
              offSlotEvents: state.user.offSlotEvents + (onTime ? 0 : 1),
            }
          : state.user,
      };
    }

    case 'REGISTER_SCAN':
      return { ...state, scanLog: [...state.scanLog, action.event].slice(-40) };

    case 'ADJUST_OCCUPANCY': {
      const current = clamp(state.occupancy.current + action.delta, 0, state.occupancy.max);
      return withReading(state, current, state.nowMs);
    }

    case 'SET_OCCUPANCY': {
      const current = clamp(action.value, 0, state.occupancy.max);
      return withReading(state, current, state.nowMs);
    }

    case 'TICK_SENSOR': {
      if (!state.settings.liveSensor) return state;
      const simMin = minutesOfDay(state.nowMs + state.clockOffsetMin * 60000);
      const target = sensorTarget(simMin, state.occupancy.max);
      const drift = (target - state.occupancy.current) * 0.12;
      const noise = (Math.random() - 0.5) * 7;
      const next = clamp(Math.round(state.occupancy.current + drift + noise), 0, state.occupancy.max);
      if (next === state.occupancy.current) return state;
      return withReading(state, next, state.nowMs);
    }

    case 'TICK_CLOCK': {
      const nextNow = Date.now();
      const elapsedMin = (nextNow - state.nowMs) / 60000;
      const clockOffsetMin = state.settings.autoAdvanceClock
        ? state.clockOffsetMin
        : state.clockOffsetMin - elapsedMin;
      return { ...state, nowMs: nextNow, clockOffsetMin };
    }

    case 'ADVANCE_CLOCK': {
      const clockOffsetMin = state.clockOffsetMin + action.minutes;
      const next = { ...state, clockOffsetMin };
      const simMin = minutesOfDay(next.nowMs + clockOffsetMin * 60000);
      const target = sensorTarget(simMin, state.occupancy.max);
      const drift = Math.round((target - state.occupancy.current) * 0.45);
      return withReading(next, clamp(state.occupancy.current + drift, 0, state.occupancy.max), state.nowMs);
    }

    case 'RESET_CLOCK': {
      const now = Date.now();
      return { ...state, nowMs: now, clockOffsetMin: DEMO_START_MIN - minutesOfDay(now) };
    }

    case 'RESET_RELIABILITY':
      return { ...state, user: { ...state.user, offSlotEvents: 0, onSlotEvents: 0 } };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'FILL_SLOT':
      return {
        ...state,
        slots: state.slots.map((s) => (s.id === action.slotId ? { ...s, booked: s.capacity } : s)),
      };

    case 'FREE_SLOT':
      return {
        ...state,
        slots: state.slots.map((s) => (s.id === action.slotId ? { ...s, booked: 0 } : s)),
      };

    case 'BULK_PREP':
      return applyPrepStatus(state, action.status, action.from);

    case 'SET_ACTIVE_ORDER':
      return { ...state, activeOrderId: action.orderId };

    case 'SET_SCANNER_REQUEST':
      return { ...state, scannerRequest: action.request };

    case 'RESET_DEMO':
      return action.state;

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist the demo so a refresh never resets the story being told.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, scannerRequest: null }));
    } catch {
      /* storage full or unavailable — the demo still runs from memory */
    }
  }, [state]);

  // Simulated wall clock.
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK_CLOCK' }), 15000);
    return () => window.clearInterval(id);
  }, []);

  // Simulated ESP32 / Time-of-Flight sensor feed.
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK_SENSOR' }), 7000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/* ---------- derived clock helpers ---------- */

export function simMinutesOf(state: AppState): number {
  return minutesOfDay(state.nowMs + state.clockOffsetMin * 60000);
}

/**
 * A real timestamp pinned to the simulated canteen clock, so an order placed at
 * "12:26 PM" is stamped 12:26 PM even though the wall clock says otherwise.
 */
export function simulatedTimestamp(state: AppState): number {
  const d = new Date(state.nowMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + simMinutesOf(state) * 60000;
}

export function useSimClock() {
  const { state } = useApp();
  return useMemo(
    () => ({
      nowMs: state.nowMs,
      simMs: state.nowMs + state.clockOffsetMin * 60000,
      simMin: simMinutesOf(state),
    }),
    [state.nowMs, state.clockOffsetMin],
  );
}

/* ---------- order assembly ---------- */

export function cartSubtotal(cart: OrderLine[]): number {
  return cart.reduce((acc, l) => acc + l.price * l.qty, 0);
}

/**
 * Turns the current cart + selected slot into a paid order.
 * Applies the ₹5 scheduling adjustment once a student has repeatedly collected
 * outside their chosen window, per the documented scheduling policy.
 */
export function buildOrderFromCart(
  state: AppState,
  opts: { txnId: string; method: Order['paymentMethod']; failed?: boolean },
): Order | null {
  if (state.cart.length === 0 || !state.selectedSlotId) return null;
  const subtotal = cartSubtotal(state.cart);
  const penaltyApplies =
    state.settings.schedulingPolicyEnabled &&
    state.user.offSlotEvents >= state.settings.penaltyThreshold;
  const schedulingAdjustment = penaltyApplies ? state.settings.penaltyAmount : 0;

  return {
    id: `SC-2026-${state.seq}`,
    userId: state.user.id,
    studentName: state.user.name,
    studentId: state.user.studentId,
    items: state.cart.map((l) => ({ ...l })),
    subtotal,
    schedulingAdjustment,
    total: subtotal + schedulingAdjustment,
    paymentStatus: opts.failed ? 'failed' : 'paid',
    paymentMethod: opts.method,
    txnId: opts.failed ? null : opts.txnId,
    slotId: state.selectedSlotId,
    qrToken: makeQrToken(),
    prepStatus: 'confirmed',
    redeemed: false,
    collectedAt: null,
    collectedOnTime: null,
    createdAt: simulatedTimestamp(state),
    isDemo: true,
  };
}
