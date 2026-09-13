import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  ChefHat,
  Clock3,
  QrCode,
  Sparkles,
  TrendingDown,
  Users,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CrowdCard } from '../../components/CrowdCard';
import { FoodCard } from '../../components/FoodCard';
import { Badge, Card, LinkButton, ProgressBar, SectionHeading, StatCard } from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { demandByFood, demandBySlot, kitchenStats, reliabilityOf } from '../../lib/selectors';
import { clock12, inr, percent, slotLabel } from '../../lib/utils';

const STEPS = [
  {
    icon: Utensils,
    title: 'Pick your food',
    body: 'Browse the live menu and add items to your cart — exactly like a food app.',
  },
  {
    icon: CalendarClock,
    title: 'Choose a 12-min window',
    body: 'First-come-first-served slots spread the rush. Full windows lock automatically.',
  },
  {
    icon: QrCode,
    title: 'Pay & get a QR token',
    body: 'Mock UPI payment issues a unique secure token that maps to your order.',
  },
  {
    icon: BadgeCheck,
    title: 'Scan and collect',
    body: 'Walk in during your window, scan once, and your order is handed over instantly.',
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'Demand forecasting',
    body: 'Every pre-order feeds a live kitchen forecast with a walk-in buffer recommendation.',
    tone: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: QrCode,
    title: 'Single-use QR tokens',
    body: 'Opaque tokens stop screenshot reuse — a second scan reports ALREADY REDEEMED.',
    tone: 'text-sky-600 bg-sky-50',
  },
  {
    icon: Users,
    title: 'Live crowd levels',
    body: 'Anonymous entrance/exit sensors publish occupancy so students can time their visit.',
    tone: 'text-violet-600 bg-violet-50',
  },
  {
    icon: TrendingDown,
    title: 'Less wastage',
    body: 'Prep follows confirmed demand plus a measured buffer, instead of guesswork.',
    tone: 'text-amber-600 bg-amber-50',
  },
];

const FUTURE = [
  'Expand ordering to breakfast and evening snacks',
  'Integrate real payment gateways (Razorpay / UPI autopay)',
  'Connect live ESP32 ToF sensor data over MQTT',
  'AI-based demand forecasting with weather + timetable signals',
  'Dynamic slot capacity that adapts to real-time throughput',
  'Multi-canteen support across campus',
  'Loyalty rewards for on-time collection',
  'Personalised food recommendations',
  'Automatic kitchen inventory management',
];

export default function Home() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const stats = kitchenStats(state);
  const slots = demandBySlot(state);
  const demand = demandByFood(state);
  const reliability = reliabilityOf(state.user, state.settings.penaltyThreshold);

  const popular = [...state.menu]
    .filter((f) => f.tags.includes('Popular'))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);

  const upcoming = slots.filter((s) => s.slot.endMin > simMin).slice(0, 4);
  const openCapacity = slots.reduce((acc, s) => acc + Math.max(0, s.capacity - s.booked), 0);
  const nextSlot = upcoming.find((s) => s.utilization < 100);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />

        <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-emerald-700 uppercase backdrop-blur">
              <Sparkles size={13} /> College hackathon prototype · fully interactive
            </div>

            <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-slate-900 text-balance-tight sm:text-5xl lg:text-[56px]">
              Skip the Queue.
              <br />
              <span className="shimmer-text">Eat Smarter.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Pre-order your food, choose a convenient collection window, avoid unnecessary queues, and help
              reduce food waste. The kitchen sees confirmed demand in real time — so your lunch is ready when
              you arrive.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LinkButton to="/menu" size="lg">
                Order Lunch <ArrowRight size={17} />
              </LinkButton>
              <LinkButton to="/crowd" size="lg" variant="secondary">
                Check Crowd Status
              </LinkButton>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={14} className="text-emerald-500" /> 12-minute collection windows
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-emerald-500" /> {openCapacity} slots still open today
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ChefHat size={14} className="text-emerald-500" /> {stats.preOrdersToday} pre-orders live
              </span>
            </div>
          </div>

          {/* Phone mock */}
          <div className="relative mx-auto w-full max-w-[290px]">
            <div className="animate-float rounded-[34px] border-[10px] border-slate-900 bg-slate-900 shadow-2xl">
              <div className="overflow-hidden rounded-[26px] bg-white">
                <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
                  <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase">Smart Canteen</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                    {clock12(simMin)}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                    <span className="text-[11px] font-bold text-slate-500">🟡 MODERATELY BUSY</span>
                    <span className="text-[11px] font-extrabold text-slate-900">
                      {state.occupancy.current}/{state.occupancy.max}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 text-lg">
                        🍛
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">Chicken Biryani</p>
                        <p className="text-[10px] text-slate-400">×1 · {inr(80)}</p>
                      </div>
                      <Badge tone="brand">Paid</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-2">
                    <QRCodeSVG value="SMARTCANTEEN_ORDER_TOKEN_8F7K29XQ" size={104} level="M" marginSize={0} />
                  </div>

                  <div className="rounded-xl bg-slate-900 px-3 py-2 text-center">
                    <p className="text-[9px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                      Collection window
                    </p>
                    <p className="font-display text-sm font-extrabold text-white">
                      {nextSlot ? slotLabel(nextSlot.slot) : '12:36–12:48'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Ready for collection
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIVE STATUS ================= */}
      <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <CrowdCard />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Today's pre-orders"
            value={stats.preOrdersToday}
            sub="Confirmed & paid orders"
            icon={<Utensils size={17} />}
            tone="brand"
          />
          <StatCard
            label="Awaiting collection"
            value={stats.pending}
            sub={`${stats.ready} already plated at the counter`}
            icon={<ChefHat size={17} />}
            tone="amber"
          />
          <StatCard
            label="Average queue saved"
            value="~9 min"
            sub="Versus walk-up ordering (projected)"
            icon={<Clock3 size={17} />}
            tone="sky"
          />
          <StatCard
            label="Slot reliability"
            value={reliability.label}
            sub={`${reliability.score}% on-time collection record`}
            icon={<BadgeCheck size={17} />}
            tone={reliability.level === 'excellent' ? 'brand' : 'amber'}
          />
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section>
        <SectionHeading
          eyebrow="How it works"
          title="Four steps from craving to collection"
          subtitle="Designed so the canteen never has to handle an unmanaged crowd again."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 ring-inset">
                    <Icon size={18} />
                  </span>
                  <span className="font-display text-2xl font-extrabold text-slate-200">{i + 1}</span>
                </div>
                <h3 className="mt-3.5 font-display text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ================= MENU PREVIEW + SLOTS ================= */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Today's counter"
            title="Popular right now"
            action={
              <Link
                to="/menu"
                className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Full menu <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {popular.map((food) => {
              const inCart = state.cart.find((l) => l.foodId === food.id)?.qty ?? 0;
              return (
                <FoodCard
                  key={food.id}
                  food={food}
                  inCart={inCart}
                  onAdd={(qty) => dispatch({ type: 'ADD_TO_CART', foodId: food.id, qty })}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading eyebrow="Book early" title="Today's collection windows" />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Each window holds 50 orders. Booking is first-come-first-served, and full windows lock instantly.
            </p>

            <div className="mt-4 space-y-2.5">
              {upcoming.map((row) => (
                <div
                  key={row.slot.id}
                  className="rounded-xl border border-slate-200 p-3 transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm font-extrabold text-slate-900">
                      {slotLabel(row.slot)}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {row.booked}/{row.capacity}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      value={row.booked}
                      max={row.capacity}
                      tone={
                        row.utilization >= 100 ? 'rose' : row.utilization >= 82 ? 'amber' : row.utilization >= 50 ? 'sky' : 'brand'
                      }
                      height="h-1.5"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {row.utilization >= 100 ? (
                      <Badge tone="rose">🔴 FULL</Badge>
                    ) : (
                      <Badge tone="brand">🟢 {row.capacity - row.booked} left</Badge>
                    )}
                    {row.isCurrent && <Badge tone="violet">Now serving</Badge>}
                    {row.isRecommended && <Badge tone="sky">Recommended</Badge>}
                  </div>
                </div>
              ))}
            </div>

            <LinkButton to="/menu" variant="dark" className="mt-4 w-full">
              Start an order <ArrowRight size={15} />
            </LinkButton>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <p className="text-[11px] font-bold tracking-[0.16em] text-emerald-300 uppercase">
              Demand planning (live)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              The kitchen is preparing for these confirmed numbers right now. The walk-in buffer of{' '}
              <strong className="text-white">+{state.settings.walkInBufferPct}%</strong> covers outsiders and
              cash-paying customers.
            </p>
            <div className="mt-4 space-y-2.5">
              {demand.slice(0, 4).map((row) => (
                <div key={row.food.id}>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-semibold text-white">
                      {row.food.emoji} {row.food.name}
                    </span>
                    <span className="font-bold text-emerald-300">
                      {row.qty} → {row.recommended}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={row.recommended} max={demand[0]?.recommended ?? 1} tone="brand" height="h-1" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3.5 text-[10px] text-slate-400">
              Demand Planning Recommendation — not an exact prediction. Simulated data for demonstration.
            </p>
          </Card>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section>
        <SectionHeading
          eyebrow="Why it works"
          title="Four innovations working together"
          subtitle="Ordering, capacity control, verification and sensing share one live state — that is what makes the system smarter than a queue."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title}>
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}>
                  <Icon size={20} />
                </span>
                <h3 className="mt-3.5 font-display text-sm font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ================= IMPACT STRIP ================= */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white sm:p-9">
        <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { value: `${percent(stats.collected, stats.preOrdersToday) || 0}%`, label: 'Orders already collected today' },
            { value: `${stats.avgOrderValue ? inr(stats.avgOrderValue) : '—'}`, label: 'Average pre-order value' },
            { value: `${stats.itemsToPrepare}`, label: 'Portions still to prepare' },
            { value: `${state.settings.walkInBufferPct}%`, label: 'Walk-in buffer being planned' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-extrabold tracking-tight">{s.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-50/90">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <LinkButton
            to="/analytics"
            className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-none"
          >
            See the projected impact
          </LinkButton>
          <span className="text-[11px] font-semibold text-emerald-100/80">
            All figures on this prototype are demo / simulated analytics.
          </span>
        </div>
      </section>

      {/* ================= FUTURE ================= */}
      <section>
        <SectionHeading
          eyebrow="Roadmap"
          title="Future possibilities"
          subtitle="Where this prototype goes next once real payments and ESP32 Time-of-Flight sensors are connected."
        />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 card-shadow"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[11px] font-bold text-emerald-600">
                →
              </span>
              <p className="text-[13px] leading-relaxed font-medium text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
