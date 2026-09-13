import { BrainCircuit, ChefHat, Info, PackageCheck, Sparkles, TrendingUp, Users, Utensils } from 'lucide-react';
import { DemandDonut, FoodDemandChart } from '../../components/charts';
import { Badge, Card, InfoCard, ProgressBar, SectionHeading, StatCard } from '../../components/ui';
import { useApp } from '../../lib/store';
import { demandByFood, kitchenStats, walkInEstimate } from '../../lib/selectors';
import { inr, percent } from '../../lib/utils';

export default function KitchenDemand() {
  const { state, dispatch } = useApp();
  const demand = demandByFood(state);
  const stats = kitchenStats(state);
  const bufferPct = state.settings.walkInBufferPct;

  const totalConfirmed = demand.reduce((a, r) => a + r.qty, 0);
  const totalRecommended = demand.reduce((a, r) => a + r.recommended, 0);
  const totalBuffer = totalRecommended - totalConfirmed;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Forecasting"
        title="Confirmed Lunch Demand"
        subtitle="Live demand pulled straight from today's paid pre-orders, plus a buffer for walk-in customers, outsiders and cash payments."
        action={
          <Badge tone="brand">
            <Sparkles size={11} /> Live from the order book
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Confirmed portions"
          value={totalConfirmed}
          sub="Across all pre-orders today"
          icon={<Utensils size={17} />}
          tone="brand"
          accent
        />
        <StatCard
          label="Walk-in buffer"
          value={`+${bufferPct}%`}
          sub={`${totalBuffer} extra portions to prepare`}
          icon={<Users size={17} />}
          tone="amber"
        />
        <StatCard
          label="Recommended preparation"
          value={totalRecommended}
          sub="Confirmed demand + buffer"
          icon={<ChefHat size={17} />}
          tone="sky"
        />
        <StatCard
          label="Still to prepare"
          value={stats.itemsToPrepare}
          sub="Portions in unpaid-for orders"
          icon={<PackageCheck size={17} />}
          tone="violet"
        />
      </div>

      {/* Buffer control */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              <TrendingUp size={13} /> Walk-in demand buffer
            </div>
            <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight text-slate-900">
              Extra preparation for people who did not pre-order
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
              Not everyone will use the app — outsiders, cash-paying students and spontaneous walk-ins still
              show up. The kitchen must prepare for confirmed demand <strong>plus</strong> an estimated buffer
              so nobody is turned away.
            </p>
            <div className="mt-3 rounded-xl bg-slate-900 px-4 py-3">
              <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Recommended buffer
              </p>
              <p className="font-display text-2xl font-extrabold text-emerald-300">+{bufferPct}%</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {walkInEstimate(state)} people are estimated to still walk in during this service.
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm">
            <label className="block text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">
              Adjust buffer ({bufferPct}%)
            </label>
            <input
              type="range"
              min={0}
              max={40}
              step={1}
              value={bufferPct}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_SETTINGS', patch: { walkInBufferPct: Number(e.target.value) } })
              }
              className="mt-3 w-full accent-emerald-600"
            />
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
              <span>0%</span>
              <span>20%</span>
              <span>40%</span>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                { label: 'Outsiders & guests', share: 0.45 },
                { label: 'Cash-paying students', share: 0.38 },
                { label: 'Spontaneous walk-ins', share: 0.17 },
              ].map((g) => {
                const count = Math.round(totalBuffer * g.share);
                return (
                  <div key={g.label}>
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="font-semibold text-slate-600">{g.label}</span>
                      <span className="font-bold text-slate-900">~{count} portions</span>
                    </div>
                    <ProgressBar value={g.share * 100} max={100} tone="amber" height="h-1.5" className="mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-800">
          <strong>Demand Planning Recommendation</strong> — this is a guidance figure for the kitchen, not an
          exact prediction. Adjusting the buffer slider recalculates every recommendation live.
        </p>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Card>
          <SectionHeading
            eyebrow="Per dish"
            title="Confirmed demand vs recommended preparation"
            subtitle="Green is what students have already paid for. Amber adds the walk-in buffer."
          />
          <div className="mt-4">
            <FoodDemandChart rows={demand} height={330} />
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Mix" title="Share of confirmed demand" />
          <div className="mt-4">
            <DemandDonut rows={demand} height={300} />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Highest-value dish</p>
            <p className="mt-0.5 font-display text-base font-extrabold text-slate-900">
              {demand[0]?.food.emoji} {demand[0]?.food.name}
            </p>
            <p className="text-[11px] text-slate-500">
              {demand[0]?.qty} orders · {percent(demand[0]?.qty ?? 0, totalConfirmed)}% of confirmed portions ·
              popularity index {demand[0]?.food.popularity}
            </p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Preparation worksheet
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Hand this to the kitchen line. Prices shown for reference only.
            </p>
          </div>
          <Badge tone="sky">
            <BrainCircuit size={11} /> Auto-generated from {stats.preOrdersToday} orders
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th className="px-5 py-3">Dish</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Confirmed qty</th>
                <th className="px-5 py-3 text-right">Buffer</th>
                <th className="px-5 py-3 text-right">Prepare</th>
                <th className="px-5 py-3 text-right">Share</th>
                <th className="px-5 py-3">Demand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demand.map((row) => (
                <tr key={row.food.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{row.food.emoji}</span>
                      <div>
                        <p className="font-bold text-slate-800">{row.food.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {inr(row.food.price)} · {row.food.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-600">{row.orders}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-slate-900">{row.qty}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-amber-600">+{row.buffer}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-display text-base font-extrabold text-emerald-700">
                      {row.recommended}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-500">{row.share}%</td>
                  <td className="px-5 py-3.5">
                    <div className="w-28">
                      <ProgressBar value={row.recommended} max={demand[0]?.recommended ?? 1} tone="brand" height="h-2" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-[13px] font-extrabold">
                <td className="px-5 py-3.5 text-slate-700">Total</td>
                <td />
                <td className="px-5 py-3.5 text-right text-slate-900">{totalConfirmed}</td>
                <td className="px-5 py-3.5 text-right text-amber-600">+{totalBuffer}</td>
                <td className="px-5 py-3.5 text-right text-emerald-700">{totalRecommended}</td>
                <td className="px-5 py-3.5 text-right text-slate-500">100%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<Info size={17} />} title="How confirmed demand is calculated" tone="sky">
          <p>
            Every order with a successful payment contributes its item quantities to this table the instant it
            is created. Nothing is estimated here — these are real bookings from the demo order book.
          </p>
        </InfoCard>
        <InfoCard icon={<Users size={17} />} title="Why a buffer is needed" tone="amber">
          <p>
            Pre-ordering will not reach 100% adoption on day one. Without a buffer, walk-in students and campus
            guests would find empty trays — the fastest way to kill trust in the system.
          </p>
        </InfoCard>
        <InfoCard icon={<ChefHat size={17} />} title="From forecast to the line" tone="brand">
          <p>
            The worksheet above is the practical output: quantities in portions per dish, ready to be called out
            on the kitchen line before each collection window opens.
          </p>
        </InfoCard>
      </div>
    </div>
  );
}
