import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChefHat,
  CheckCheck,
  Clock3,
  CookingPot,
  PackageCheck,
  Radio,
  Users,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { OccupancyTrendChart, SlotDemandChart } from '../../components/charts';
import {
  Badge,
  Button,
  Card,
  CrowdBadge,
  LinkButton,
  ProgressBar,
  SectionHeading,
  StatCard,
  StatusBadge,
} from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { demandByFood, demandBySlot, kitchenStats, walkInEstimate } from '../../lib/selectors';
import { clock12, inr, slotLabel } from '../../lib/utils';

export default function KitchenOverview() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const stats = kitchenStats(state);
  const demand = demandByFood(state);
  const slots = demandBySlot(state);

  const currentWindow = slots.find((s) => s.isCurrent);
  const nextWindow = slots.find((s) => s.slot.startMin > simMin);
  const ready = state.orders
    .filter((o) => o.prepStatus === 'ready' && !o.redeemed && o.paymentStatus === 'paid')
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 6);

  const liveQueue = state.orders
    .filter((o) => !o.redeemed && o.paymentStatus === 'paid')
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Command header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-900 p-6 text-white sm:p-8">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase">
              <Radio size={12} className="text-emerald-400" /> Kitchen command center · live
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Lunch Service Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Confirmed pre-orders, per-dish demand and live occupancy in one view. Every student payment lands
              here immediately — no phone calls, no order slips.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-300 uppercase">
                Current window
              </p>
              <p className="font-display text-xl font-extrabold">
                {currentWindow ? slotLabel(currentWindow.slot) : 'Between windows'}
              </p>
              <p className="text-[11px] font-semibold text-emerald-300">
                Clock {clock12(simMin)} · {stats.ready} plated awaiting pickup
              </p>
            </div>
            <div className="flex gap-2">
              <LinkButton
                to="/kitchen/queue"
                className="bg-white text-slate-900 hover:bg-slate-100 shadow-none"
              >
                Open live queue <ArrowRight size={15} />
              </LinkButton>
              <LinkButton
                to="/scanner"
                variant="ghost"
                className="text-white ring-1 ring-white/25 hover:bg-white/10"
              >
                Scanner
              </LinkButton>
            </div>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's pre-orders"
          value={stats.preOrdersToday}
          sub={`${inr(stats.avgOrderValue)} average order value`}
          icon={<Utensils size={17} />}
          tone="brand"
        />
        <StatCard
          label="Current pending orders"
          value={stats.pending}
          sub={`${stats.confirmed} confirmed · ${stats.preparing} preparing`}
          icon={<CookingPot size={17} />}
          tone="amber"
        />
        <StatCard
          label="Current occupancy"
          value={`${stats.occupancy} / ${stats.occupancyMax}`}
          sub={`Walk-in estimate remaining: ~${walkInEstimate(state)} people`}
          icon={<Users size={17} />}
          tone="violet"
        />
        <StatCard
          label="Crowd level"
          value={<CrowdBadge level={stats.crowd} />}
          sub={`${Math.round((stats.occupancy / stats.occupancyMax) * 100)}% of safe capacity`}
          icon={<Radio size={17} />}
          tone="sky"
        />
      </div>

      {/* Status strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Confirmed', value: stats.confirmed, tone: 'amber', icon: Clock3 },
          { label: 'Being prepared', value: stats.preparing, tone: 'sky', icon: CookingPot },
          { label: 'Ready for collection', value: stats.ready, tone: 'brand', icon: PackageCheck },
          { label: 'Collected today', value: stats.collected, tone: 'slate', icon: CheckCheck },
        ].map((s) => {
          const Icon = s.icon;
          const tones: Record<string, string> = {
            amber: 'bg-amber-50 text-amber-600',
            sky: 'bg-sky-50 text-sky-600',
            brand: 'bg-emerald-50 text-emerald-600',
            slate: 'bg-slate-100 text-slate-500',
          };
          return (
            <div
              key={s.label}
              className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 card-shadow"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[s.tone]}`}>
                <Icon size={19} />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold tracking-tight text-slate-900">{s.value}</p>
                <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start">
        {/* Demand snapshot */}
        <Card>
          <SectionHeading
            eyebrow="Preparation plan"
            title="What to cook next"
            subtitle={`Confirmed demand plus a ${state.settings.walkInBufferPct}% walk-in buffer. ${stats.itemsToPrepare} portions still to prepare.`}
            action={
              <Link
                to="/kitchen/demand"
                className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Full forecast <ArrowRight size={14} />
              </Link>
            }
          />

          <div className="mt-5 space-y-3.5">
            {demand.slice(0, 6).map((row) => (
              <div key={row.food.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-slate-800">
                    <span className="text-base">{row.food.emoji}</span>
                    {row.food.name}
                  </span>
                  <span className="text-[12px] font-semibold text-slate-500">
                    {row.qty} confirmed
                    <span className="mx-1.5 text-slate-300">→</span>
                    <span className="font-display text-sm font-extrabold text-emerald-700">
                      {row.recommended} portions
                    </span>
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar
                    value={row.recommended}
                    max={demand[0]?.recommended ?? 1}
                    tone="brand"
                    height="h-2"
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-500">
            Demand Planning Recommendation — an estimate, not an exact prediction. The buffer covers outsiders
            and cash-paying customers.
          </p>
        </Card>

        {/* Occupancy + slots */}
        <div className="space-y-5">
          <Card>
            <SectionHeading eyebrow="Live sensors" title="Canteen occupancy" />
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats.occupancy}
                  <span className="text-base font-bold text-slate-400"> / {stats.occupancyMax}</span>
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {Math.round((stats.occupancy / stats.occupancyMax) * 100)}% · {stats.crowd}
                </p>
              </div>
              <CrowdBadge level={stats.crowd} />
            </div>
            <div className="mt-3">
              <ProgressBar
                value={stats.occupancy}
                max={stats.occupancyMax}
                tone={stats.crowd === 'HIGH' ? 'rose' : stats.crowd === 'MODERATE' ? 'amber' : 'brand'}
                height="h-2.5"
              />
            </div>
            <div className="mt-4">
              <OccupancyTrendChart readings={state.readings} max={state.occupancy.max} height={150} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: 5 })}>
                +5 in
              </Button>
              <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: -5 })}>
                −5 out
              </Button>
              <LinkButton to="/kitchen/occupancy" size="sm" variant="ghost">
                Details
              </LinkButton>
            </div>
          </Card>

          <Card>
            <SectionHeading eyebrow="Slot load" title="Orders per window" />
            <div className="mt-3">
              <SlotDemandChart rows={slots} height={190} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {nextWindow ? (
                <Badge tone="sky">Next window {slotLabel(nextWindow.slot)} · {nextWindow.booked}/{nextWindow.capacity}</Badge>
              ) : (
                <Badge tone="slate">Lunch service finished</Badge>
              )}
              <LinkButton to="/kitchen/slots" variant="ghost" size="sm">
                Slot table <ArrowRight size={13} />
              </LinkButton>
            </div>
          </Card>
        </div>
      </div>

      {/* Ready for collection + live queue */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <Card>
          <SectionHeading
            eyebrow="Counter"
            title="Waiting to be collected"
            subtitle="These orders are plated and sitting at the collection counter."
            action={<Badge tone="brand">{stats.readyNotCollected} waiting</Badge>}
          />

          <div className="mt-4 space-y-2.5">
            {ready.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-6 text-center text-[13px] text-slate-500">
                Nothing on the counter right now.
              </p>
            )}
            {ready.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold text-emerald-800">{order.id}</p>
                  <p className="truncate text-[13px] font-bold text-slate-800">
                    {order.items.map((l) => `${l.emoji} ${l.name} ×${l.qty}`).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-500">{order.studentName} · {order.studentId}</p>
                </div>
                <Badge tone="brand">🟢 Ready</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Incoming"
            title="Live order queue"
            subtitle="Oldest first. Move orders through Confirmed → Preparing → Ready."
            action={
              <LinkButton to="/kitchen/queue" variant="secondary" size="sm">
                Manage all <ArrowRight size={13} />
              </LinkButton>
            }
          />

          <div className="mt-4 space-y-2.5">
            {liveQueue.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-3.5 py-6 text-center text-[13px] text-slate-500">
                Queue is clear — every order has been collected.
              </p>
            )}
            {liveQueue.map((order) => {
              const slot = state.slots.find((s) => s.id === order.slotId);
              return (
                <div key={order.id} className="rounded-xl border border-slate-200 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{order.id}</span>
                    <StatusBadge status={order.prepStatus} />
                  </div>
                  <p className="mt-2 text-[13px] font-bold text-slate-800">
                    {order.items.map((l) => `${l.emoji} ${l.name} ×${l.qty}`).join(', ')}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={11} /> {slot ? slotLabel(slot) : '—'}
                    </span>
                    <span>{order.studentName}</span>
                    <span className="font-bold text-slate-700">{inr(order.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Alert */}
      {stats.crowd === 'HIGH' && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle size={19} className="mt-0.5 shrink-0 text-rose-600" />
          <div>
            <p className="font-display text-sm font-extrabold text-rose-800">High crowd alert</p>
            <p className="mt-1 text-[13px] leading-relaxed text-rose-900/80">
              Occupancy has crossed 76% of safe capacity. Prioritise ready-to-collect orders, and hold
              non-urgent preparation until the current window clears.
            </p>
          </div>
        </div>
      )}

      <Card className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 ring-inset">
              <ChefHat size={19} />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-slate-800">
                Staff efficiency tip
              </p>
              <p className="mt-0.5 max-w-2xl text-[12px] leading-relaxed text-slate-500">
                Because payment is already settled, the counter only has to hand over the tray. That removes
                roughly one third of the current service time per student.
              </p>
            </div>
          </div>
          <LinkButton to="/kitchen/demand" variant="dark">
            <BarChart3 size={15} /> Demand forecast
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
