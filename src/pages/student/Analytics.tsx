import { BarChart3, FlaskConical, Info, PieChart, TrendingDown, Users, Waves } from 'lucide-react';
import { DemandDonut, FoodDemandChart, SlotDemandChart } from '../../components/charts';
import { Badge, Card, InfoCard, ProgressBar, SectionHeading, StatCard } from '../../components/ui';
import { useApp } from '../../lib/store';
import { demandByFood, demandBySlot, impactMetrics, occupancyPercent } from '../../lib/selectors';
import { inr, percent, slotLabel } from '../../lib/utils';

export default function Analytics() {
  const { state } = useApp();
  const metrics = impactMetrics(state);
  const slots = demandBySlot(state);
  const demand = demandByFood(state);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Impact"
        title="Smart Canteen Impact"
        subtitle="A projection of what this system changes once deployed, computed from the live demo dataset."
        action={<Badge tone="amber">DEMO / SIMULATED ANALYTICS</Badge>}
      />

      {/* Simulation disclaimer */}
      <div className="flex flex-wrap items-start gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 ring-1 ring-amber-200 ring-inset">
          <FlaskConical size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold tracking-wide text-amber-900 uppercase">
            These are simulated results, not measured outcomes
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-amber-900/80">
            The queue-reduction and waste-reduction percentages below are illustrative targets for this
            hackathon prototype. Order counts, slot loads and demand figures are computed live from the demo
            dataset; nothing here is a verified field measurement.
          </p>
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Estimated queue reduction"
          value={`${metrics.queueReduction}%`}
          sub="Projected, based on timed collection windows"
          icon={<TrendingDown size={17} />}
          tone="brand"
          accent
        />
        <StatCard
          label="Pre-orders today"
          value={metrics.preOrdersToday}
          sub="Live count from the order book"
          icon={<BarChart3 size={17} />}
          tone="sky"
        />
        <StatCard
          label="Estimated food waste reduction"
          value={`${metrics.wasteReduction}%`}
          sub="Projected from demand-led prep"
          icon={<Waves size={17} />}
          tone="violet"
        />
        <StatCard
          label="Peak crowd distribution"
          value={metrics.peakDistribution}
          sub={`Busiest window holds ${metrics.peakSlotShare}% of orders`}
          icon={<Users size={17} />}
          tone="amber"
        />
      </div>

      {/* Live derived metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">Slot utilisation</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-slate-900">
            {metrics.slotUtilisation}%
          </p>
          <ProgressBar value={metrics.slotUtilisation} className="mt-3" tone="brand" />
          <p className="mt-2 text-[11px] text-slate-500">
            Occupied capacity across all six collection windows
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            On-time collection rate
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-slate-900">{metrics.onTimeRate}%</p>
          <ProgressBar
            value={metrics.onTimeRate}
            className="mt-3"
            tone={metrics.onTimeRate >= 85 ? 'brand' : 'amber'}
          />
          <p className="mt-2 text-[11px] text-slate-500">
            Off-slot collections recorded: {metrics.offSlotRate}%
          </p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Average order size
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-slate-900">
            {metrics.avgItemsPerOrder}
          </p>
          <p className="mt-3 text-[11px] text-slate-500">Items per pre-order today</p>
        </Card>
        <Card>
          <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            Current occupancy
          </p>
          <p className="mt-1.5 font-display text-2xl font-extrabold text-slate-900">
            {state.occupancy.current}/{state.occupancy.max}
          </p>
          <ProgressBar value={occupancyPercent(state)} className="mt-3" tone="violet" />
          <p className="mt-2 text-[11px] text-slate-500">
            Simulated pre-order revenue: {inr(metrics.revenue)}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <Card>
          <SectionHeading
            eyebrow="Crowd distribution"
            title="Orders per collection window"
            subtitle="Bar height is the booked load; the colour reflects how close that window is to capacity."
          />
          <div className="mt-4">
            <SlotDemandChart rows={slots} height={250} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Busiest window</p>
              <p className="mt-0.5 font-display text-base font-extrabold text-slate-900">
                {metrics.busiestSlot ? slotLabel(metrics.busiestSlot.slot) : '—'}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics.busiestSlot?.booked} orders · {metrics.busiestSlot?.utilization}% full
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3.5 py-3">
              <p className="text-[11px] font-bold tracking-wide text-emerald-600 uppercase">
                Quietest window
              </p>
              <p className="mt-0.5 font-display text-base font-extrabold text-emerald-800">
                {metrics.quietestSlot ? slotLabel(metrics.quietestSlot.slot) : '—'}
              </p>
              <p className="text-[11px] text-emerald-700/80">
                {metrics.quietestSlot?.booked} orders · {metrics.quietestSlot?.utilization}% full
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <SectionHeading
            eyebrow="Demand mix"
            title="Share of portions by dish"
            subtitle="Donut slices show how today's confirmed demand splits across the menu."
          />
          <div className="mt-4">
            <DemandDonut rows={demand} height={270} />
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading
          eyebrow="Forecast detail"
          title="Confirmed demand vs recommended preparation"
          subtitle="The amber bar adds the walk-in buffer for outsiders and cash-paying customers."
        />
        <div className="mt-4">
          <FoodDemandChart rows={demand} height={300} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<Info size={17} />} title="How the queue reduction is estimated" tone="sky">
          <p>
            Baseline: a single 90-minute lunch rush with {metrics.preOrdersToday} orders arriving at random.
            Projected: the same volume spread across six fixed 12-minute windows, with payment already settled
            before arrival. Removing the order-and-pay step from the counter is what produces the{' '}
            {metrics.queueReduction}% projected reduction.
          </p>
        </InfoCard>
        <InfoCard icon={<Waves size={17} />} title="How the waste reduction is estimated" tone="brand">
          <p>
            Waste falls when preparation follows confirmed demand plus a measured buffer, instead of a
            guess. Comparing today's recommended preparation totals against a typical over-preparation margin
            gives the {metrics.wasteReduction}% projection. Real validation needs a multi-week trial with
            weighed waste.
          </p>
        </InfoCard>
        <InfoCard icon={<PieChart size={17} />} title="What we would measure for real" tone="violet">
          <p>
            Weighted food waste per service, sensor-known peak occupancy, median time from arrival to leaving
            with food, on-time collection rate, and counter throughput per 12-minute window — all tracked
            automatically once the system runs live.
          </p>
        </InfoCard>
      </div>

      <Card className="bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-sm font-extrabold text-slate-800">
              Peak distribution improvement
            </p>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-500">
              Currently the busiest window carries {metrics.peakSlotShare}% of all bookings. With dynamic slot
              capacity (in the roadmap) that share would be capped closer to {percent(1, 6)}% — a flat profile
              the canteen can staff precisely.
            </p>
          </div>
          <Badge tone="slate">Simulated projection</Badge>
        </div>
      </Card>
    </div>
  );
}
