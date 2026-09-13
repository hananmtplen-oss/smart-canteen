import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCheck,
  Clock3,
  CookingPot,
  CreditCard,
  FastForward,
  MonitorPlay,
  Plus,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  Utensils,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CrowdBadge,
  LinkButton,
  ProgressBar,
  SectionHeading,
  StatCard,
  Toggle,
} from '../../components/ui';
import { createInitialState } from '../../lib/seed';
import { simulatedTimestamp, useApp, useSimClock } from '../../lib/store';
import { demandBySlot, kitchenStats, occupancyPercent } from '../../lib/selectors';
import { clock12, inr, makeQrToken, makeTxnId, slotLabel } from '../../lib/utils';
import type { Order, OrderLine } from '../../types';

const DEMO_FLOW = [
  { step: 'Student opens Smart Canteen', to: '/' },
  { step: 'Student sees the current crowd level', to: '/crowd' },
  { step: 'Student selects food', to: '/menu' },
  { step: 'Student selects an available 12-minute slot', to: '/slots' },
  { step: 'Student completes the mock UPI payment', to: '/checkout' },
  { step: 'Unique QR token is generated', to: '/orders' },
  { step: 'Order appears in the Kitchen Dashboard', to: '/kitchen/queue' },
  { step: 'Kitchen marks Preparing → Ready', to: '/kitchen/queue' },
  { step: 'Student reaches the QR scanner', to: '/scanner' },
  { step: 'QR is scanned, verified and collected', to: '/scanner' },
  { step: 'Scanning the same QR again → ALREADY REDEEMED', to: '/scanner' },
];

const STUDENT_NAMES = ['Athul Kumar', 'Sara Thomas', 'Rohan Das', 'Nikhil Varma', 'Fidha Nasrin'];

export default function DemoPanel() {
  const { state, dispatch } = useApp();
  const { simMin, simMs } = useSimClock();
  const navigate = useNavigate();

  const stats = kitchenStats(state);
  const slots = demandBySlot(state);
  const currentSlot = slots.find((s) => s.isCurrent) ?? slots.find((s) => s.utilization < 100) ?? slots[0];

  /* ---------- simulations ---------- */

  function addStudentOrder(): Order {
    const pick = state.menu.filter((f) => f.availableQty > 0);
    const chosen: OrderLine[] = [];
    const shuffled = [...pick].sort(() => Math.random() - 0.5);
    shuffled.slice(0, 2 + Math.floor(Math.random() * 2)).forEach((f) => {
      chosen.push({ foodId: f.id, name: f.name, emoji: f.emoji, price: f.price, qty: 1 });
    });
    const subtotal = chosen.reduce((a, l) => a + l.price * l.qty, 0);
    const order: Order = {
      id: `SC-2026-${state.seq}`,
      userId: `USR-${3000 + Math.floor(Math.random() * 900)}`,
      studentName: STUDENT_NAMES[Math.floor(Math.random() * STUDENT_NAMES.length)],
      studentId: `CSE24-${4000 + Math.floor(Math.random() * 900)}`,
      items: chosen,
      subtotal,
      schedulingAdjustment: 0,
      total: subtotal,
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      txnId: makeTxnId(),
      slotId: currentSlot.slot.id,
      qrToken: makeQrToken(),
      prepStatus: 'confirmed',
      redeemed: false,
      collectedAt: null,
      collectedOnTime: null,
      createdAt: simulatedTimestamp(state),
      isDemo: false,
    };
    dispatch({ type: 'ADD_SIMULATED_ORDER', order });
    return order;
  }

  function loadDemoBasket() {
    dispatch({ type: 'CLEAR_CART' });
    dispatch({ type: 'ADD_TO_CART', foodId: 'chicken-biryani', qty: 1 });
    dispatch({ type: 'ADD_TO_CART', foodId: 'meals', qty: 1 });
    dispatch({ type: 'ADD_TO_CART', foodId: 'fish-fry', qty: 1 });
    // Prefer the window being served right now, then the next open one — never
    // a window that has already closed.
    const target =
      slots.find((s) => s.slot.startMin <= simMin && s.slot.endMin > simMin && s.utilization < 100) ??
      slots.find((s) => s.slot.endMin > simMin && s.utilization < 100) ??
      slots.find((s) => s.utilization < 100);
    if (target) dispatch({ type: 'SELECT_SLOT', slotId: target.slot.id });
    navigate('/checkout');
  }

  function scanValid() {
    const ready = state.orders.find((o) => o.prepStatus === 'ready' && !o.redeemed && o.paymentStatus === 'paid');
    const inCurrent = state.orders.find(
      (o) => o.slotId === currentSlot.slot.id && !o.redeemed && o.paymentStatus === 'paid',
    );
    const target = ready ?? inCurrent;
    if (!target) return;
    if (target.prepStatus !== 'ready') {
      dispatch({ type: 'SET_PREP_STATUS', orderId: target.id, status: 'ready' });
    }
    dispatch({ type: 'SET_SCANNER_REQUEST', request: { kind: 'valid', orderId: target.id, nonce: Date.now() } });
    navigate('/scanner');
  }

  function scanDuplicate() {
    const target =
      state.orders.find((o) => o.redeemed && o.paymentStatus === 'paid') ??
      state.orders.find((o) => o.paymentStatus === 'paid');
    dispatch({
      type: 'SET_SCANNER_REQUEST',
      request: { kind: 'duplicate', orderId: target?.id ?? null, nonce: Date.now() },
    });
    navigate('/scanner');
  }

  function scanInvalid() {
    dispatch({ type: 'SET_SCANNER_REQUEST', request: { kind: 'invalid', orderId: null, nonce: Date.now() } });
    navigate('/scanner');
  }

  function queueOffSlotDemo() {
    const open = state.orders.filter((o) => !o.redeemed && o.paymentStatus === 'paid');
    const plated = open.filter((o) => o.prepStatus === 'ready');
    const inCurrentWindow = (o: Order) => {
      const s = state.slots.find((x) => x.id === o.slotId);
      return !!s && s.startMin <= simMin && simMin < s.endMin;
    };
    // Prefer an order from the window running right now so the clock jump is obvious.
    const target =
      plated.find(inCurrentWindow) ??
      [...plated].sort(
        (a, b) =>
          (state.slots.find((s) => s.id === b.slotId)?.startMin ?? 0) -
          (state.slots.find((s) => s.id === a.slotId)?.startMin ?? 0),
      )[0] ??
      open.find(inCurrentWindow) ??
      open[0];
    if (!target) return;
    // Push the clock well past the order's window so the scanner flags it as off-slot.
    const slot = state.slots.find((s) => s.id === target.slotId);
    if (slot) dispatch({ type: 'ADVANCE_CLOCK', minutes: Math.max(1, slot.endMin + 20 - simMin) });
    dispatch({ type: 'SET_SCANNER_REQUEST', request: { kind: 'valid', orderId: target.id, nonce: Date.now() } });
    navigate('/scanner');
  }

  function resetDemo() {
    dispatch({ type: 'RESET_DEMO', state: createInitialState() });
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Presenter console"
        title="Hackathon Demo Control Panel"
        subtitle="Drive the whole system from one screen. Every button below writes to the same live state the student, kitchen and scanner interfaces use."
        action={
          <Badge tone="violet">
            <MonitorPlay size={11} /> Simulated clock {clock12(simMin)}
          </Badge>
        }
      />

      {/* Live snapshot */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pre-orders today"
          value={stats.preOrdersToday}
          sub="Live from the order book"
          icon={<Utensils size={17} />}
          tone="brand"
          accent
        />
        <StatCard
          label="Pending orders"
          value={stats.pending}
          sub={`${stats.ready} plated · ${stats.preparing} preparing`}
          icon={<CookingPot size={17} />}
          tone="amber"
        />
        <StatCard
          label="Occupancy"
          value={`${state.occupancy.current}/${state.occupancy.max}`}
          sub={`${occupancyPercent(state)}% full`}
          icon={<Users size={17} />}
          tone="violet"
        />
        <StatCard
          label="Crowd level"
          value={<CrowdBadge level={stats.crowd} />}
          sub={`Current window ${currentSlot ? slotLabel(currentSlot.slot) : '—'}`}
          icon={<Sparkles size={17} />}
          tone="sky"
        />
      </div>

      {/* Demo flow */}
      <Card>
        <SectionHeading
          eyebrow="Script"
          title="Critical demo flow"
          subtitle="Follow this order during the pitch — every step is clickable."
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/')}>
                Start from the top
              </Button>
              <Button
                size="sm"
                variant="dark"
                onClick={() => {
                  addStudentOrder();
                  navigate('/kitchen/queue');
                }}
              >
                <FastForward size={13} /> Skip to kitchen
              </Button>
            </div>
          }
        />
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_FLOW.map((item, i) => (
            <li key={item.step}>
              <button
                type="button"
                onClick={() => navigate(item.to)}
                className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[12px] leading-relaxed font-semibold text-slate-700">{item.step}</span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      {/* Control groups */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Orders */}
        <Card>
          <PanelHeader icon={ShoppingBag} title="Order simulation" tone="brand" />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => addStudentOrder()}>
              <Plus size={15} /> Add student order
            </Button>
            <Button variant="secondary" onClick={() => {
              const target = slots.find((s) => s.utilization < 100);
              if (target) dispatch({ type: 'FILL_SLOT', slotId: target.slot.id });
            }}>
              <BadgeCheck size={15} /> Fill a slot
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'BULK_PREP', status: 'ready', from: 'preparing' })}
            >
              <CheckCheck size={15} /> Mark preparing as ready
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'BULK_PREP', status: 'preparing', from: 'confirmed' })}
            >
              <CookingPot size={15} /> Mark all as preparing
            </Button>
            <Button variant="secondary" onClick={loadDemoBasket} className="sm:col-span-2">
              <Utensils size={15} /> Load a demo basket &amp; open checkout
            </Button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            New orders appear instantly on the Kitchen Live Queue and update the demand forecast.
          </p>
        </Card>

        {/* Payments */}
        <Card>
          <PanelHeader icon={CreditCard} title="Payment simulation" tone="sky" />
          <div className="mt-4 space-y-3">
            <Toggle
              checked={state.settings.forceNextPaymentFailure}
              onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { forceNextPaymentFailure: v } })}
              label="Force next payment to FAIL"
              hint="Turn on, then complete a checkout to show a declined transaction"
            />
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Button variant="secondary" onClick={loadDemoBasket}>
                <CreditCard size={15} /> Simulate payment success
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch({ type: 'UPDATE_SETTINGS', patch: { forceNextPaymentFailure: true } });
                  loadDemoBasket();
                }}
              >
                <AlertTriangle size={15} /> Simulate payment failure
              </Button>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            A failed payment creates no order, consumes no slot and debits nothing — just like a real decline.
          </p>
        </Card>

        {/* QR */}
        <Card>
          <PanelHeader icon={QrCode} title="QR verification simulation" tone="violet" />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button onClick={scanValid}>
              <BadgeCheck size={15} /> Simulate valid QR
            </Button>
            <Button variant="secondary" onClick={scanDuplicate}>
              <RefreshCw size={15} /> Simulate duplicate QR
            </Button>
            <Button variant="secondary" onClick={scanInvalid}>
              <Trash2 size={15} /> Simulate invalid QR
            </Button>
            <Button variant="amber" onClick={queueOffSlotDemo}>
              <Clock3 size={15} /> Off-slot collection demo
            </Button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Duplicate scans report <strong>ALREADY REDEEMED</strong>; the off-slot demo jumps the clock past the
            order's window while still allowing collection.
          </p>
        </Card>

        {/* Occupancy */}
        <Card>
          <PanelHeader icon={Users} title="Occupancy simulation" tone="amber" />
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: 5 })}>
              <TrendingUp size={15} /> Increase occupancy
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: -5 })}>
              <TrendingDown size={15} /> Decrease occupancy
            </Button>
            <Button
              variant="amber"
              onClick={() => dispatch({ type: 'SET_OCCUPANCY', value: Math.round(state.occupancy.max * 0.9) })}
            >
              <AlertTriangle size={15} /> Trigger high crowd alert
            </Button>
            <Button
              variant="secondary"
              onClick={() => dispatch({ type: 'SET_OCCUPANCY', value: Math.round(state.occupancy.max * 0.33) })}
            >
              <Users size={15} /> Quiet canteen
            </Button>
          </div>

          <div className="mt-4">
            <ProgressBar
              value={state.occupancy.current}
              max={state.occupancy.max}
              tone={stats.crowd === 'HIGH' ? 'rose' : stats.crowd === 'MODERATE' ? 'amber' : 'brand'}
            />
            <p className="mt-2 text-[11px] font-semibold text-slate-500">
              {state.occupancy.current} of {state.occupancy.max} people inside · crowd level {stats.crowd}
            </p>
          </div>
        </Card>

        {/* Clock */}
        <Card>
          <PanelHeader icon={Clock3} title="Simulated clock" tone="slate" />
          <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3.5 text-center">
            <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Canteen time</p>
            <p className="font-display text-3xl font-extrabold text-white">{clock12(simMin)}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Real time {new Date(simMs).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · offset{' '}
              {Math.round(state.clockOffsetMin)} min
            </p>
          </div>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADVANCE_CLOCK', minutes: 12 })}>
              <FastForward size={15} /> +12 min
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADVANCE_CLOCK', minutes: 30 })}>
              <FastForward size={15} /> +30 min
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: 'RESET_CLOCK' })}>
              Reset clock
            </Button>
          </div>
          <div className="mt-3">
            <Toggle
              checked={state.settings.autoAdvanceClock}
              onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { autoAdvanceClock: v } })}
              label="Clock runs in real time"
              hint="Turn off to freeze the simulated time during the pitch"
            />
          </div>
        </Card>

        {/* Settings */}
        <Card>
          <PanelHeader icon={Sparkles} title="Policy & data settings" tone="brand" />

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-bold text-slate-700">Walk-in buffer</span>
                <span className="font-display text-sm font-extrabold text-emerald-700">
                  +{state.settings.walkInBufferPct}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={state.settings.walkInBufferPct}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_SETTINGS', patch: { walkInBufferPct: Number(e.target.value) } })
                }
                className="mt-2 w-full accent-emerald-600"
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-bold text-slate-700">Off-slot threshold</span>
                <span className="font-display text-sm font-extrabold text-amber-700">
                  {state.settings.penaltyThreshold} events
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={state.settings.penaltyThreshold}
                onChange={(e) =>
                  dispatch({ type: 'UPDATE_SETTINGS', patch: { penaltyThreshold: Number(e.target.value) } })
                }
                className="mt-2 w-full accent-amber-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                After this many off-slot collections a {inr(state.settings.penaltyAmount)} scheduling adjustment
                applies to future orders.
              </p>
            </div>

            <Toggle
              checked={state.settings.schedulingPolicyEnabled}
              onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { schedulingPolicyEnabled: v } })}
              label="Scheduling policy enabled"
              hint="Controls whether the ₹5 adjustment can ever apply"
            />

            <Toggle
              checked={state.settings.liveSensor}
              onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { liveSensor: v } })}
              label="Live sensor feed"
              hint="Simulated ToF / ESP32 occupancy stream"
            />

            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3">
              <span className="text-[11px] font-semibold text-slate-600">
                Student record: {state.user.onSlotEvents} on-time · {state.user.offSlotEvents} off-slot
              </span>
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'RESET_RELIABILITY' })}>
                <RefreshCw size={13} /> Reset reliability record
              </Button>
            </div>

            <Button variant="danger" className="w-full" onClick={resetDemo}>
              <RefreshCw size={15} /> Reset demo data
            </Button>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Restores the original 247 pre-orders, empty cart, 118/180 occupancy and the simulated clock at
              12:30 PM. Clears anything you placed during the demo.
            </p>
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <Card className="bg-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-emerald-300 uppercase">
              Jump straight to an interface
            </p>
            <p className="mt-1 text-[12px] text-slate-300">
              Handy when switching between the student phone, the kitchen screen and the counter kiosk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <LinkButton to="/" className="bg-white text-slate-900 hover:bg-slate-100 shadow-none">
              Student
            </LinkButton>
            <LinkButton
              to="/kitchen"
              variant="ghost"
              className="text-white ring-1 ring-white/25 hover:bg-white/10"
            >
              Kitchen
            </LinkButton>
            <LinkButton
              to="/scanner"
              variant="ghost"
              className="text-white ring-1 ring-white/25 hover:bg-white/10"
            >
              Scanner
            </LinkButton>
            <LinkButton
              to="/analytics"
              variant="ghost"
              className="text-white ring-1 ring-white/25 hover:bg-white/10"
            >
              Impact
            </LinkButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  tone,
}: {
  icon: typeof ShoppingBag;
  title: string;
  tone: 'brand' | 'sky' | 'violet' | 'amber' | 'slate';
}) {
  const tones: Record<string, string> = {
    brand: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">{title}</h3>
    </div>
  );
}
