import { useMemo, useState } from 'react';
import {
  ChefHat,
  CheckCheck,
  Clock3,
  CookingPot,
  Layers,
  PackageCheck,
  QrCode,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge, Button, Card, EmptyState, LinkButton, SectionHeading, Tabs } from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { kitchenStats } from '../../lib/selectors';
import { PREP_META, clock12, cls, minutesOfDay, slotLabel } from '../../lib/utils';
import type { Order, PrepStatus, Slot } from '../../types';

type FilterId = 'active' | 'confirmed' | 'preparing' | 'ready';

/** How many plated orders the log is willing to show at once. */
const READY_LIMIT = 2;

/** Short, glanceable status words — this list is meant to read like a log. */
const SHORT_LABEL: Record<PrepStatus, string> = {
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  collected: 'Collected',
};

const NEXT_ACTION: Record<PrepStatus, { label: string; status?: PrepStatus; variant: 'primary' | 'secondary' }> = {
  confirmed: { label: 'Start', status: 'preparing', variant: 'secondary' },
  preparing: { label: 'Ready', status: 'ready', variant: 'primary' },
  ready: { label: 'Awaiting pickup', status: undefined, variant: 'secondary' },
  collected: { label: 'Collected', status: undefined, variant: 'secondary' },
};

/**
 * The log is deliberately small: at most two plated orders, plus everything
 * being worked on for the window running right now. The rest of the day's
 * book stays hidden so the screen reads at a glance.
 */
function focusOrders(list: Order[], slots: Slot[], simMin: number): Order[] {
  const current = slots.find((s) => s.startMin <= simMin && s.endMin > simMin);

  // When more is plated than we show, prefer the trays whose window is closest
  // to now — those are the ones actually waiting on the counter.
  const distanceToNow = (o: Order) => {
    const slot = slots.find((s) => s.id === o.slotId);
    return slot ? Math.abs(slot.startMin - simMin) : Number.MAX_SAFE_INTEGER;
  };
  const ready = list
    .filter((o) => !o.redeemed && o.prepStatus === 'ready')
    .sort((a, b) => distanceToNow(a) - distanceToNow(b))
    .slice(0, READY_LIMIT);

  const inProgress = list.filter((o) => !o.redeemed && o.prepStatus !== 'ready' && o.slotId === current?.id);
  return [...ready, ...inProgress];
}

/**
 * Kitchen-facing priority: hand over what is plated (0), then serve the window
 * running right now (1), then upcoming windows in order (2).
 */
function priorityRank(order: Order, slots: Slot[], simMin: number) {
  const slot = slots.find((s) => s.id === order.slotId);
  if (order.prepStatus === 'ready') return 0;
  if (!slot) return 3;
  if (slot.startMin <= simMin && simMin < slot.endMin) return 1;
  if (slot.startMin > simMin) return 2;
  return 3;
}

export default function KitchenQueue() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const [filter, setFilter] = useState<FilterId>('active');
  const [query, setQuery] = useState('');

  const stats = kitchenStats(state);

  const focused = useMemo(() => {
    const paid = state.orders.filter((o) => o.paymentStatus === 'paid');
    return focusOrders(paid, state.slots, simMin).sort((a, b) => {
      const ra = priorityRank(a, state.slots, simMin);
      const rb = priorityRank(b, state.slots, simMin);
      if (ra !== rb) return ra - rb;
      return b.createdAt - a.createdAt;
    });
  }, [state.orders, state.slots, simMin]);

  const filtered = useMemo(() => {
    let list = focused;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.studentId.toLowerCase().includes(q),
      );
    }
    if (filter === 'active') return list;
    return list.filter((o) => o.prepStatus === filter);
  }, [focused, filter, query]);

  const tabs: Array<{ id: FilterId; label: string; badge?: React.ReactNode }> = [
    { id: 'active', label: 'Active', badge: <Count n={focused.length} /> },
    { id: 'confirmed', label: 'Confirmed', badge: <Count n={stats.confirmed} /> },
    { id: 'preparing', label: 'Preparing', badge: <Count n={stats.preparing} /> },
    { id: 'ready', label: 'Ready', badge: <Count n={stats.ready} tone="brand" /> },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Kitchen"
        title="Live Order Log"
        subtitle="Every paid order lands here the moment a student checks out. Update a line and the student's token page changes instantly."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'BULK_PREP', status: 'preparing', from: 'confirmed' })}
            >
              <CookingPot size={14} /> Start all confirmed
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => dispatch({ type: 'BULK_PREP', status: 'ready', from: 'preparing' })}
            >
              <PackageCheck size={14} /> Mark all preparing ready
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Confirmed', value: stats.confirmed, tone: 'amber', icon: Clock3 },
          { label: 'Preparing', value: stats.preparing, tone: 'sky', icon: CookingPot },
          { label: 'Ready', value: stats.ready, tone: 'brand', icon: PackageCheck },
          { label: 'Collected', value: stats.collected, tone: 'slate', icon: CheckCheck },
        ].map((s) => {
          const Icon = s.icon;
          const tones: Record<string, string> = {
            amber: 'bg-amber-50 text-amber-600',
            sky: 'bg-sky-50 text-sky-600',
            brand: 'bg-emerald-50 text-emerald-600',
            slate: 'bg-slate-100 text-slate-500',
          };
          return (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 card-shadow">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[s.tone]}`}>
                <Icon size={17} />
              </span>
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-slate-900">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={tabs} value={filter} onChange={setFilter} />
          <div className="relative">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID or student…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-[13px] font-medium outline-none focus:border-emerald-500 focus:bg-white sm:w-64"
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ChefHat size={38} />}
          title="Nothing waiting on the counter"
          body="The log only shows up to two plated orders plus whatever is being prepared for the window running right now."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase min-[480px]:flex">
            <span className="w-[64px] shrink-0">Time</span>
            <span className="w-[84px] shrink-0">Order</span>
            <span className="min-w-0 flex-1">Items</span>
            <span className="hidden w-[88px] shrink-0 lg:block">Window</span>
            <span className="w-[100px] shrink-0">Status</span>
            <span className="w-[64px] shrink-0 text-right">Action</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((order) => (
              <LogRow
                key={order.id}
                order={order}
                slotName={slotLabel(state.slots.find((s) => s.id === order.slotId) ?? state.slots[0])}
                onStatus={(status) => dispatch({ type: 'SET_PREP_STATUS', orderId: order.id, status })}
              />
            ))}
          </div>
        </Card>
      )}

      <Card className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 ring-inset">
              <Layers size={17} />
            </span>
            <p className="max-w-2xl text-[12px] leading-relaxed text-slate-500">
              <strong className="text-slate-700">Demo tip for judges:</strong> mark a line as <em>Ready</em>, then
              open the{' '}
              <LinkButton to="/scanner" variant="ghost" size="sm" className="px-1.5">
                <QrCode size={13} /> Smart Collection Scanner
              </LinkButton>{' '}
              and scan it to complete the loop. The full day's book lives on the demand and slot pages.
            </p>
          </div>
          <Badge tone="violet">
            <Sparkles size={11} /> {stats.itemsToPrepare} portions in the queue
          </Badge>
        </div>
      </Card>
    </div>
  );
}

function Count({ n, tone = 'slate' }: { n: number; tone?: 'slate' | 'brand' }) {
  if (n === 0) return null;
  return (
    <span
      className={cls(
        'rounded-full px-1.5 text-[10px] font-bold',
        tone === 'brand' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600',
      )}
    >
      {n}
    </span>
  );
}

/**
 * One order = one line. Deliberately flat and text-first so the same list reads
 * fine on a big monitor, a tablet at the counter, or a simple character display.
 * Item names are shown in full — never clipped.
 */
function LogRow({
  order,
  slotName,
  onStatus,
}: {
  order: Order;
  slotName: string;
  onStatus: (s: PrepStatus) => void;
}) {
  const status: PrepStatus = order.redeemed ? 'collected' : order.prepStatus;
  const meta = PREP_META[status];
  const action = NEXT_ACTION[order.prepStatus];
  const items = order.items.map((l) => `${l.name} ×${l.qty}`).join(', ');

  return (
    <div
      className={cls(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition-colors hover:bg-slate-50',
        order.redeemed && 'opacity-55',
        status === 'ready' && 'bg-emerald-50/40',
      )}
    >
      <span className="w-[64px] shrink-0 font-mono text-[12px] tabular-nums text-slate-400">
        {clock12(minutesOfDay(order.createdAt))}
      </span>
      <span className="w-[84px] shrink-0 font-mono text-[12px] font-bold text-slate-900">{order.id}</span>
      {/* Takes its own line on narrow screens, then stretches inline on wider ones. */}
      <span className="min-w-0 basis-full text-[13px] leading-snug text-slate-700 min-[480px]:basis-0 min-[480px]:grow">
        {items}
      </span>
      <span className="hidden w-[88px] shrink-0 font-mono text-[11px] text-slate-400 lg:block">{slotName}</span>
      <span className="w-[100px] shrink-0">
        <span
          className={cls(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold',
            meta.bg,
            meta.text,
          )}
        >
          <span className={cls('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {SHORT_LABEL[status]}
        </span>
      </span>
      <span className="flex w-[64px] shrink-0 justify-end">
        {action.status ? (
          <Button size="sm" variant={action.variant} onClick={() => action.status && onStatus(action.status)}>
            {action.label}
          </Button>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">—</span>
        )}
      </span>
    </div>
  );
}
