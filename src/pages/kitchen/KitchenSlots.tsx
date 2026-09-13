import { CalendarClock, Clock3, Info, Layers, Lock, Sparkles, Unlock, Users } from 'lucide-react';
import { SlotDemandChart } from '../../components/charts';
import {
  Badge,
  Button,
  Card,
  InfoCard,
  ProgressBar,
  SectionHeading,
  SlotStatusBadge,
  StatCard,
} from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { demandByFood, demandBySlot, recommendedSlot } from '../../lib/selectors';
import { cls, inr, isSameDay, percent, slotLabel } from '../../lib/utils';

export default function KitchenSlots() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const rows = demandBySlot(state);
  const best = recommendedSlot(state);
  const demand = demandByFood(state);

  const totalBooked = rows.reduce((a, r) => a + r.booked, 0);
  const totalCapacity = rows.reduce((a, r) => a + r.capacity, 0);
  const fullWindows = rows.filter((r) => r.utilization >= 100).length;

  /** Today's paid orders per window, grouped into dish quantities. */
  const dishesBySlot = state.slots.map((slot) => {
    const slotOrders = state.orders.filter(
      (o) => o.slotId === slot.id && o.paymentStatus === 'paid' && isSameDay(o.createdAt, state.nowMs),
    );
    const counts = new Map<string, number>();
    slotOrders.forEach((o) =>
      o.items.forEach((l) => counts.set(l.foodId, (counts.get(l.foodId) ?? 0) + l.qty)),
    );
    const entries = [...counts.entries()]
      .map(([id, qty]) => ({ food: demand.find((d) => d.food.id === id)?.food, qty }))
      .filter((e): e is { food: NonNullable<typeof e.food>; qty: number } => Boolean(e.food))
      .sort((a, b) => b.qty - a.qty);
    return {
      slotId: slot.id,
      entries,
      portions: entries.reduce((a, e) => a + e.qty, 0),
      value: slotOrders.reduce((a, o) => a + o.total, 0),
    };
  });

  const dishesFor = (slotId: string) => dishesBySlot.find((d) => d.slotId === slotId)!;

  const perSlotDishes = rows.map((row) => ({ row, top: dishesFor(row.slot.id).entries.slice(0, 3) }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Capacity"
        title="Slot-Wise Demand Dashboard"
        subtitle="How the 247 pre-orders of today's lunch service are distributed across six 12-minute collection windows."
        action={
          <Badge tone="sky">
            <CalendarClock size={11} /> {totalBooked} / {totalCapacity} capacity booked
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={totalBooked}
          sub={`Across ${rows.length} collection windows`}
          icon={<Layers size={17} />}
          tone="brand"
          accent
        />
        <StatCard
          label="Capacity utilisation"
          value={`${percent(totalBooked, totalCapacity)}%`}
          sub={`${totalCapacity - totalBooked} slots still bookable`}
          icon={<Users size={17} />}
          tone="sky"
        />
        <StatCard
          label="Full windows"
          value={fullWindows}
          sub={fullWindows > 0 ? 'Locked — students must pick another slot' : 'All windows still open'}
          icon={<Lock size={17} />}
          tone={fullWindows > 0 ? 'rose' : 'brand'}
        />
        <StatCard
          label="Quietest window"
          value={best ? slotLabel(best.slot) : '—'}
          sub={best ? `${best.booked}/${best.capacity} booked · ${best.utilization}%` : 'No open window'}
          icon={<Sparkles size={17} />}
          tone="amber"
        />
      </div>

      <Card>
        <SectionHeading
          eyebrow="Visual"
          title="Orders per collection window"
          subtitle="Grey is capacity, coloured bars are booked orders. Red windows are locked out for students."
        />
        <div className="mt-4">
          <SlotDemandChart rows={rows} height={280} />
        </div>
      </Card>

      {/* Slot table */}
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Slot load table
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Pre-ordered items per window — the figure the kitchen should plate for.
            </p>
          </div>
          <Badge tone="slate">
            <Clock3 size={11} /> Simulated clock {slotLabel({ startMin: simMin, endMin: simMin })}
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="px-5 py-3">Collection slot</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Items</th>
                <th className="px-5 py-3 text-right">Capacity</th>
                <th className="px-5 py-3">Utilisation</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Top dishes</th>
                <th className="px-5 py-3 text-right">Demo control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perSlotDishes.map(({ row, top }) => (
                <tr
                  key={row.slot.id}
                  className={cls('transition-colors hover:bg-slate-50/70', row.isCurrent && 'bg-emerald-50/40')}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-[13px] font-extrabold text-slate-900">
                        {slotLabel(row.slot)}
                      </span>
                      {row.isCurrent && <Badge tone="violet">Now serving</Badge>}
                      {row.isRecommended && <Badge tone="sky">Quietest</Badge>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">{row.orders}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-600">{row.items}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-600">
                    {row.booked} / {row.capacity}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24">
                        <ProgressBar
                          value={row.booked}
                          max={row.capacity}
                          height="h-2"
                          tone={
                            row.utilization >= 100
                              ? 'rose'
                              : row.utilization >= 82
                                ? 'amber'
                                : row.utilization >= 50
                                  ? 'sky'
                                  : 'brand'
                          }
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{row.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <SlotStatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {top.length === 0 && <span className="text-[11px] text-slate-400">—</span>}
                      {top.map((t) => (
                        <span
                          key={t.food.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                        >
                          {t.food.emoji} {t.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1.5">
                      {row.utilization >= 100 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dispatch({ type: 'FREE_SLOT', slotId: row.slot.id })}
                        >
                          <Unlock size={13} /> Reopen
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dispatch({ type: 'FILL_SLOT', slotId: row.slot.id })}
                        >
                          <Lock size={13} /> Fill
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Per-slot cards */}
      <div>
        <SectionHeading
          eyebrow="Window by window"
          title="Preparation targets per window"
          subtitle="How much of each dish to have ready as each window opens."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const { entries, value } = dishesFor(row.slot.id);
            const bufferFactor = 1 + state.settings.walkInBufferPct / 100;

            return (
              <Card key={row.slot.id} className={cls(row.isCurrent && 'ring-2 ring-emerald-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                      {slotLabel(row.slot)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                      {row.booked}/{row.capacity} booked · {row.items} portions
                    </p>
                  </div>
                  <SlotStatusBadge status={row.status} />
                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={row.booked}
                    max={row.capacity}
                    height="h-2"
                    tone={
                      row.utilization >= 100
                        ? 'rose'
                        : row.utilization >= 82
                          ? 'amber'
                          : row.utilization >= 50
                            ? 'sky'
                            : 'brand'
                    }
                  />
                </div>

                <ul className="mt-4 space-y-2">
                  {entries.slice(0, 5).map((e) => (
                    <li key={e.food.id} className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                        <span>{e.food.emoji}</span>
                        <span className="truncate">{e.food.name}</span>
                      </span>
                      <span className="shrink-0 font-bold text-slate-500">
                        {e.qty}
                        <span className="mx-1 text-slate-300">→</span>
                        <span className="font-display font-extrabold text-emerald-700">
                          {Math.ceil(e.qty * bufferFactor)}
                        </span>
                      </span>
                    </li>
                  ))}
                  {entries.length === 0 && (
                    <li className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-[12px] text-slate-400">
                      No pre-orders in this window
                    </li>
                  )}
                </ul>

                <p className="mt-3 border-t border-dashed border-slate-200 pt-3 text-[11px] text-slate-400">
                  Estimated value {inr(value)} · prepped with {state.settings.walkInBufferPct}% buffer
                </p>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<Info size={17} />} title="First-come-first-served by design" tone="brand">
          <p>
            Slot capacity is enforced on the student app: once a window hits 50 orders it turns red and cannot
            be selected. No overbooking, no queue at the counter.
          </p>
        </InfoCard>
        <InfoCard icon={<Users size={17} />} title="Why not just raise capacity?" tone="violet">
          <p>
            50 orders per 12 minutes is matched to what the counter can physically hand over. Raising it would
            simply move the queue from the corridor into the collection area.
          </p>
        </InfoCard>
        <InfoCard icon={<Clock3 size={17} />} title="Late collection is still allowed" tone="amber">
          <p>
            Windows guide the crowd, they do not punish students. Late arrivals are served from the same
            counter, and the system records the event for scheduling analysis only.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}
