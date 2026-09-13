/* ============================================================================
   Smart Canteen — shared data model
   Everything the student, kitchen, scanner and demo interfaces exchange.
   ========================================================================== */

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type FoodTag = 'Popular' | 'Limited' | 'New' | 'Veg';

export type FoodCategory = 'Main Course' | 'Add-on';

export interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  category: FoodCategory;
  description: string;
  tags: FoodTag[];
  /** Portions the kitchen still has prepped and unsold today. */
  availableQty: number;
  prepTimeMin: number;
  /** 0–100 historical popularity index (used for analytics + sorting). */
  popularity: number;
  /** Tailwind gradient used for the placeholder illustration. */
  gradient: string;
  /**
   * Ids of add-on items that can be attached to this dish — Kerala Meals offers
   * an egg or a fish fry. Add-ons live in the menu list so they price and
   * forecast like any other dish, but they are not shown as standalone cards.
   */
  addons?: string[];
}

export interface Slot {
  id: string;
  /** Minutes since midnight — makes window maths trivial. */
  startMin: number;
  endMin: number;
  capacity: number;
  booked: number;
}

export interface OrderLine {
  foodId: string;
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';

/** confirmed → preparing → ready → collected */
export type PrepStatus = 'confirmed' | 'preparing' | 'ready' | 'collected';

export interface Order {
  id: string;
  userId: string;
  studentName: string;
  studentId: string;
  items: OrderLine[];
  subtotal: number;
  /** ₹5 scheduling adjustment applied after repeated off-slot collection. */
  schedulingAdjustment: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'UPI' | 'Card' | 'Wallet' | null;
  txnId: string | null;
  slotId: string;
  /** Opaque secure token encoded into the QR — never the raw order payload. */
  qrToken: string;
  prepStatus: PrepStatus;
  redeemed: boolean;
  collectedAt: number | null;
  collectedOnTime: boolean | null;
  createdAt: number;
  /** Orders created live from this browser session. */
  isDemo: boolean;
}

export interface User {
  id: string;
  name: string;
  studentId: string;
  email: string;
  onSlotEvents: number;
  offSlotEvents: number;
}

export interface OccupancyState {
  current: number;
  max: number;
  lastUpdate: number;
}

export interface SensorReading {
  t: number;
  count: number;
}

export type ScanResult = 'verified' | 'redeemed' | 'invalid' | 'not-ready';

export interface ScanEvent {
  id: string;
  at: number;
  token: string;
  orderId: string | null;
  result: ScanResult;
  onTime: boolean;
  /** Simulated arrival time (minutes since midnight). */
  arrivalMin: number;
}

export interface Settings {
  walkInBufferPct: number;
  schedulingPolicyEnabled: boolean;
  penaltyAmount: number;
  penaltyThreshold: number;
  liveSensor: boolean;
  autoAdvanceClock: boolean;
  forceNextPaymentFailure: boolean;
}

export interface ScannerRequest {
  kind: 'valid' | 'duplicate' | 'invalid' | 'not-ready';
  orderId: string | null;
  nonce: number;
}

export interface AppState {
  version: number;
  menu: FoodItem[];
  slots: Slot[];
  orders: Order[];
  user: User;
  occupancy: OccupancyState;
  readings: SensorReading[];
  cart: OrderLine[];
  selectedSlotId: string | null;
  activeOrderId: string | null;
  scanLog: ScanEvent[];
  settings: Settings;
  /** Monotonic counter backing order IDs (SC-2026-####). */
  seq: number;
  txnSeq: number;
  /** Simulated wall clock = real Date.now() biased by clockOffsetMin. */
  clockOffsetMin: number;
  nowMs: number;
  scannerRequest: ScannerRequest | null;
}

/* ---------- Actions ---------- */

export type Action =
  | { type: 'ADD_TO_CART'; foodId: string; qty: number }
  | { type: 'SET_CART_QTY'; foodId: string; qty: number }
  | { type: 'REMOVE_FROM_CART'; foodId: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SELECT_SLOT'; slotId: string | null }
  | { type: 'PLACE_ORDER'; order: Order }
  | { type: 'ADD_SIMULATED_ORDER'; order: Order }
  | { type: 'SET_PREP_STATUS'; orderId: string; status: PrepStatus }
  | { type: 'REDEEM_ORDER'; orderId: string; arrivalMin: number }
  | { type: 'REGISTER_SCAN'; event: ScanEvent }
  | { type: 'ADJUST_OCCUPANCY'; delta: number }
  | { type: 'SET_OCCUPANCY'; value: number }
  | { type: 'TICK_SENSOR' }
  | { type: 'TICK_CLOCK' }
  | { type: 'ADVANCE_CLOCK'; minutes: number }
  | { type: 'RESET_CLOCK' }
  | { type: 'RESET_RELIABILITY' }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'FILL_SLOT'; slotId: string }
  | { type: 'FREE_SLOT'; slotId: string }
  | { type: 'BULK_PREP'; status: PrepStatus; from: 'confirmed' | 'preparing' | 'ready' }
  | { type: 'SET_ACTIVE_ORDER'; orderId: string | null }
  | { type: 'SET_SCANNER_REQUEST'; request: ScannerRequest | null }
  | { type: 'RESET_DEMO'; state: AppState };

/* ---------- Derived view models ---------- */

export interface SlotDemandRow {
  slot: Slot;
  orders: number;
  items: number;
  booked: number;
  capacity: number;
  utilization: number;
  status: 'Available' | 'Low' | 'Busy' | 'Full';
  isCurrent: boolean;
  isRecommended: boolean;
}

export interface DemandRow {
  food: FoodItem;
  qty: number;
  orders: number;
  /** qty + walk-in buffer, rounded up. */
  recommended: number;
  share: number;
  buffer: number;
}
