import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChefHat,
  Clock,
  Cpu,
  Gauge,
  Leaf,
  Presentation as PresentationIcon,
  QrCode,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Timer,
  TrendingDown,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { cls } from '../lib/utils';

/* ============================================================================
   Judge-facing pitch deck.

   Rendered full-screen *outside* the app shell so it reads as a slide deck
   rather than a page of the product. The last slide hands off to the real
   application, which is the whole point of the intro: show the pitch, then
   show it working.
   ========================================================================== */

type Accent = 'emerald' | 'sky' | 'amber' | 'violet';

const ACCENT: Record<Accent, { text: string; ring: string; bg: string; glow: string; dot: string }> = {
  emerald: {
    text: 'text-emerald-300',
    ring: 'ring-emerald-400/25',
    bg: 'bg-emerald-400/10',
    glow: 'bg-emerald-500',
    dot: 'bg-emerald-400',
  },
  sky: {
    text: 'text-sky-300',
    ring: 'ring-sky-400/25',
    bg: 'bg-sky-400/10',
    glow: 'bg-sky-500',
    dot: 'bg-sky-400',
  },
  amber: {
    text: 'text-amber-300',
    ring: 'ring-amber-400/25',
    bg: 'bg-amber-400/10',
    glow: 'bg-amber-500',
    dot: 'bg-amber-400',
  },
  violet: {
    text: 'text-violet-300',
    ring: 'ring-violet-400/25',
    bg: 'bg-violet-400/10',
    glow: 'bg-violet-500',
    dot: 'bg-violet-400',
  },
};

const HEADLINE_GRADIENT =
  'bg-gradient-to-br from-white via-white to-emerald-200/70 bg-clip-text text-transparent';

/* ---------- Slide building blocks ---------- */

function SlideHead({
  eyebrow,
  title,
  lead,
  accent = 'emerald',
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  accent?: Accent;
}) {
  const a = ACCENT[accent];
  return (
    <div className="animate-deck-step">
      <div className={cls('flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] uppercase', a.text)}>
        <span className={cls('h-1.5 w-1.5 rounded-full', a.dot)} />
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-3xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl">
        {title}
      </h2>
      {lead && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300/90 sm:text-base">{lead}</p>
      )}
    </div>
  );
}

function Tile({
  icon,
  title,
  body,
  accent = 'emerald',
  step,
  delay = 0,
}: {
  icon: ReactNode;
  title: ReactNode;
  body: ReactNode;
  accent?: Accent;
  step?: number;
  delay?: number;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className="animate-deck-step group relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className={cls('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', a.bg, a.ring, a.text)}>
          {icon}
        </span>
        {step !== undefined && (
          <span className="font-display text-xs font-extrabold tracking-[0.2em] text-slate-500">
            STEP {String(step).padStart(2, '0')}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-[15px] leading-snug font-bold text-white">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

function Metric({
  value,
  label,
  hint,
  accent = 'emerald',
  delay = 0,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  accent?: Accent;
  delay?: number;
}) {
  const a = ACCENT[accent];
  return (
    <div
      className="animate-deck-step rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-4 text-center sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cls('font-display text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl', a.text)}>
        {value}
      </div>
      <div className="mt-1.5 text-[12px] font-bold tracking-wide text-white uppercase">{label}</div>
      {hint && <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{hint}</div>}
    </div>
  );
}

function Pill({ children, accent = 'emerald' }: { children: ReactNode; accent?: Accent }) {
  const a = ACCENT[accent];
  return (
    <span
      className={cls(
        'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase ring-1 ring-inset',
        a.bg,
        a.ring,
        a.text,
      )}
    >
      {children}
    </span>
  );
}

/* ---------- Slide 1 — cover ---------- */

function CoverSlide() {
  return (
    <div className="animate-deck text-center">
      <div className="flex justify-center">
        <Pill>
          <Sparkles size={12} /> Hackathon Prototype · 2026
        </Pill>
      </div>

      <h1 className="mt-4 font-display text-[2.7rem] leading-[0.95] font-extrabold tracking-tight sm:text-6xl lg:text-8xl">
        <span className={HEADLINE_GRADIENT}>SMART</span>
        <br />
        <span className={HEADLINE_GRADIENT}>CANTEEN</span>
      </h1>

      <p className="mx-auto mt-3 max-w-2xl text-[13px] leading-relaxed text-slate-300 sm:text-lg">
        Intelligent pre-ordering, crowd management &amp; food demand planning for the college canteen —
        built so students never queue, and the kitchen never guesses.
      </p>

      {/* Team badge with a five-node pentagon motif */}
      <div className="mt-5 flex justify-center">
        <div className="inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-2.5 backdrop-blur-sm">
          <span className="relative block h-10 w-11 shrink-0" aria-hidden>
            {[
              'left-1/2 top-0 -translate-x-1/2',
              'right-0 top-[30%]',
              'bottom-[6%] right-[12%]',
              'bottom-[6%] left-[12%]',
              'left-0 top-[30%]',
            ].map((pos, i) => (
              <span
                key={i}
                className={cls(
                  'absolute h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.55)]',
                  pos,
                )}
              />
            ))}
          </span>
          <span className="text-left">
            <span className="block text-[10px] font-bold tracking-[0.24em] text-slate-500 uppercase">
              Presented by
            </span>
            <span className="block font-display text-lg font-extrabold tracking-[0.18em] text-white">
              TEAM PENTAGON
            </span>
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        {[
          { icon: <Timer size={16} />, label: '12-minute', sub: 'collection slots' },
          { icon: <QrCode size={16} />, label: 'Single-use QR', sub: 'contactless pickup' },
          { icon: <Gauge size={16} />, label: 'Live occupancy', sub: 'before you walk over' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5"
          >
            <span className="text-emerald-300">{s.icon}</span>
            <span className="text-left">
              <span className="block text-[13px] font-bold text-white">{s.label}</span>
              <span className="block text-[11px] text-slate-500">{s.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Slide 2 — problem ---------- */

const PROBLEM_TILES = [
  {
    icon: <Users size={17} />,
    title: 'Everyone arrives at the same minute',
    body: 'Classes end together, so ninety minutes of demand lands in a fifteen-minute window. The queue is a scheduling problem, not a capacity problem.',
    accent: 'amber' as Accent,
  },
  {
    icon: <Clock size={17} />,
    title: 'The queue is invisible from the classroom',
    body: 'Students have no way of knowing how crowded the canteen is right now, so they walk over and join the worst of it — or skip lunch entirely.',
    accent: 'amber' as Accent,
  },
  {
    icon: <ChefHat size={17} />,
    title: 'The kitchen is cooking blind',
    body: 'No signal for how many plates to prepare. Over-cook and food is thrown away; under-cook and students are turned away at the counter.',
    accent: 'amber' as Accent,
  },
  {
    icon: <Wallet size={17} />,
    title: 'Payment blocks the serving counter',
    body: 'Cash, change and UPI authorisation all happen at the busiest moment, adding dead time to every single student in the line.',
    accent: 'amber' as Accent,
  },
];

const DEMAND_BARS = [14, 22, 33, 47, 63, 80, 95, 100, 86, 61, 38, 24, 16, 11, 8];

function ProblemSlide() {
  return (
    <div>
      <SlideHead
        accent="amber"
        eyebrow="The problem statement"
        title={
          <>
            A lunch break that is spent
            <br />
            standing in a line.
          </>
        }
        lead="Long queues, unpredictable demand and wasted food are not three separate problems — they are three symptoms of one: nobody knows what is about to happen at 12:30 PM."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        {PROBLEM_TILES.map((t, i) => (
          <Tile key={String(t.title)} {...t} delay={120 + i * 90} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Slide 3 — root cause ---------- */

function CauseSlide() {
  return (
    <div>
      <SlideHead
        accent="amber"
        eyebrow="Why it happens"
        title="Demand arrives in a spike. Capacity is flat."
        lead="A canteen can only serve so many plates per minute. The problem is not the total number of lunches — it is that they all show up at once, with no information flowing in either direction."
      />

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Arrival spike chart */}
        <div className="animate-deck-step rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5" style={{ animationDelay: '120ms' }}>
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-bold tracking-wide text-white uppercase">Arrivals vs serving capacity</p>
            <span className="text-[11px] font-semibold text-slate-500">11:48 → 13:00</span>
          </div>

          <div className="relative mt-4 h-28 sm:h-36">
            {/* capacity line */}
            <div className="absolute inset-x-0 top-[42%] border-t border-dashed border-emerald-400/50" />
            <span className="absolute top-[42%] right-0 -translate-y-full pb-1 text-[10px] font-bold tracking-wide text-emerald-300 uppercase">
              serving capacity
            </span>

            <div className="flex h-full items-end gap-1">
              {DEMAND_BARS.map((v, i) => {
                const overload = v > 42;
                return (
                  <div
                    key={i}
                    className={cls(
                      'flex-1 rounded-t-[3px] transition-all',
                      overload
                        ? 'bg-gradient-to-t from-rose-500/40 to-rose-400'
                        : 'bg-gradient-to-t from-emerald-500/30 to-emerald-400/80',
                    )}
                    style={{ height: `${v}%` }}
                  />
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-slate-400">
            <span className="font-bold text-rose-300">Red = overload.</span> For roughly forty minutes the
            canteen receives more students than it can physically serve, then sits idle all afternoon.
          </p>
        </div>

        {/* Compact list rather than full cards — three stacked cards pushed the
            third cause below the fold on a 720p projector. */}
        <div className="grid grid-cols-1 gap-2.5 min-[520px]:grid-cols-3 lg:grid-cols-1">
          {[
            {
              title: 'No supply signal',
              body: 'The kitchen plans by habit, not by data.',
            },
            {
              title: 'No demand signal',
              body: 'Students cannot see the crowd, so they cannot pick a better time.',
            },
            {
              title: 'No way to spread the load',
              body: 'Nothing rewards coming at 12:48 instead of 12:30.',
            },
          ].map((t, i) => (
            <div
              key={t.title}
              className="animate-deck-step flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 sm:p-3.5"
              style={{ animationDelay: `${220 + i * 90}ms` }}
            >
              <span className="mt-0.5 shrink-0 text-amber-300">
                <AlertTriangle size={16} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[14px] leading-snug font-bold text-white">
                  {t.title}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-slate-400">{t.body}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Slide 4 — solution ---------- */

const SOLUTION = [
  {
    icon: <ShoppingBag size={17} />,
    title: 'Pre-order from the classroom',
    body: 'Students pick their lunch in seconds, on the phone, long before the bell rings.',
  },
  {
    icon: <Timer size={17} />,
    title: 'Choose a 12-minute slot',
    body: 'Capacity per window is capped, so the crowd is spread across the whole lunch hour automatically.',
  },
  {
    icon: <Wallet size={17} />,
    title: 'Pay upfront (mock UPI)',
    body: 'The order is locked in before the student leaves class. Nothing to settle at the counter.',
  },
  {
    icon: <QrCode size={17} />,
    title: 'Get a unique QR token',
    body: 'One token per order, tied to that student and that collection window. Single-use, tamper-evident.',
  },
  {
    icon: <ScanLine size={17} />,
    title: 'Scan and walk away',
    body: 'Kitchen scans the token, hands over the tray. Verified, marked collected, invalidated.',
  },
  {
    icon: <Gauge size={17} />,
    title: 'Occupancy you can see first',
    body: 'Live ToF sensor counts show how busy the hall is, so students pick a quieter window.',
  },
];

function SolutionSlide() {
  return (
    <div>
      <SlideHead
        eyebrow="Our solution"
        title="Turn the queue into a schedule."
        lead="Smart Canteen is a single system with four faces — student, kitchen, scanner and admin — sharing one live state. Every action in one face is instantly true in the others."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
        {SOLUTION.map((t, i) => (
          <Tile key={String(t.title)} {...t} delay={120 + i * 80} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Slide 5 — student flow ---------- */

const JOURNEY = [
  { title: 'See the crowd', body: 'Home screen shows live hall occupancy and the quietest upcoming window.' },
  { title: 'Pick the food', body: 'Today’s lunch menu — Kerala Meals with an optional fish fry or egg, biryanis, fried rice.' },
  { title: 'Book a slot', body: '12-minute windows with live capacity. Full windows are closed off, not oversold.' },
  { title: 'Pay by UPI', body: 'Three-stage mock authorisation produces a real transaction ID and confirms the order.' },
  { title: 'Show the QR', body: 'A scannable token appears instantly, alongside prep status and the collection window.' },
  { title: 'Collect & go', body: 'One scan, one tray. The token dies on first use, so it can never be redeemed twice.' },
];

function JourneySlide() {
  return (
    <div>
      <SlideHead
        accent="sky"
        eyebrow="How it works · the student"
        title="Six taps between class and lunch."
        lead="This is the flow judges can drive end-to-end on the live build. Nothing below is a mock-up screen — each step writes into the same state the kitchen and scanner read from."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
        {JOURNEY.map((t, i) => (
          <Tile
            key={t.title}
            step={i + 1}
            icon={<span className="font-display text-[13px] font-extrabold">{i + 1}</span>}
            accent="sky"
            title={t.title}
            body={t.body}
            delay={120 + i * 80}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Slide 6 — kitchen ---------- */

function KitchenSlide() {
  return (
    <div>
      <SlideHead
        accent="violet"
        eyebrow="The other half of the system"
        title="The kitchen stops guessing."
        lead="Every pre-order is a data point. By the time the lunch rush starts, the canteen already knows what to cook, how much, and by when."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={<BarChart3 size={17} />}
          accent="violet"
          title="Demand forecast per dish"
          body="Projected plates for each item, refreshed as orders land — so prep starts ahead of the peak."
          delay={120}
        />
        <Tile
          icon={<Clock size={17} />}
          accent="violet"
          title="Slot-wise demand"
          body="Heat map of bookings per 12-minute window, showing exactly when to have trays ready."
          delay={200}
        />
        <Tile
          icon={<ChefHat size={17} />}
          accent="violet"
          title="Live order log"
          body="One line per order, confirmed → preparing → ready, updating the student’s token in real time."
          delay={280}
        />
        <Tile
          icon={<Users size={17} />}
          accent="violet"
          title="Walk-in buffer planning"
          body="A share of capacity is held back for students who arrive without pre-ordering."
          delay={360}
        />
      </div>

      <div
        className="animate-deck-step mt-4 flex flex-col gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-4 sm:flex-row sm:items-center sm:p-5"
        style={{ animationDelay: '440ms' }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/25 ring-inset">
          <Zap size={17} />
        </span>
        <p className="text-[13px] leading-relaxed text-slate-300">
          <span className="font-bold text-white">The batch-cooking win:</span> instead of frying on demand for a
          scrambling queue, the kitchen cooks per slot. Trays leave the counter in seconds because the food is
          already plated for that window — and the surplus that used to be thrown away becomes a measured buffer.
        </p>
      </div>
    </div>
  );
}

/* ---------- Slide 7 — benefits / differentiators ---------- */

function BenefitsSlide() {
  return (
    <div>
      <SlideHead
        eyebrow="Benefits from our side"
        title="What the system gives back."
        lead="Beyond shorter queues, several gains fall out of the design for free."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          {
            icon: <ShieldCheck size={17} />,
            title: 'Double-collection is impossible',
            body: 'Each QR token is validated once and permanently marked redeemed. A repeat scan returns ALREADY REDEEMED instead of a second tray — closing the biggest leak in any token-based handover.',
            accent: 'emerald' as Accent,
          },
          {
            icon: <Store size={17} />,
            title: 'A no-show deterrent that is fair',
            body: 'Every student carries a slot reliability record. Reliable students keep priority on peak windows; serial no-shows lose that priority, not their lunch.',
            accent: 'emerald' as Accent,
          },
          {
            icon: <Leaf size={17} />,
            title: 'Less food waste, less stress',
            body: 'Cooking to measured demand instead of gut feel cuts surplus, cost and disposal — and gives the kitchen a calm, planned service instead of forty frantic minutes.',
            accent: 'emerald' as Accent,
          },
          {
            icon: <TrendingDown size={17} />,
            title: 'Runs on software, not hardware',
            body: 'The full pre-order, payment, QR and demand-planning loop works with no sensors and no new equipment. The occupancy hardware plugs in later as an upgrade, not a prerequisite.',
            accent: 'emerald' as Accent,
          },
          {
            icon: <Users size={17} />,
            title: 'Nobody is excluded',
            body: 'A capacity share is reserved for walk-in students, so the canteen still serves anyone who did not pre-order or does not own a smartphone-heavy routine.',
            accent: 'emerald' as Accent,
          },
          {
            icon: <ShieldCheck size={17} />,
            title: 'Privacy by design',
            body: 'Occupancy comes from anonymous sensor counts. No facial recognition, no phone tracking, no personal data bent into surveillance.',
            accent: 'emerald' as Accent,
          },
        ].map((t, i) => (
          <Tile key={String(t.title)} {...t} delay={120 + i * 80} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Slide 8 — impact ---------- */

function ImpactSlide() {
  return (
    <div>
      <SlideHead
        accent="sky"
        eyebrow="Simulated impact"
        title="What the numbers look like when the load is spread."
        lead="Projections from the built-in simulation: the same 180-seat hall, the same lunch service, with pre-ordering and slot caps in place."
      />

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric value="−70%" label="Peak queue time" hint="Load moved off the 12:30 spike" accent="sky" delay={120} />
        <Metric value="−30%" label="Food waste" hint="Cooking to forecast, not guesswork" accent="sky" delay={200} />
        <Metric value="+2.4×" label="Plates per hour" hint="Throughput in the peak window" accent="sky" delay={280} />
        <Metric value="≤5 s" label="Collection time" hint="Scan, verify, hand over" accent="sky" delay={360} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[520px]:grid-cols-3">
        {[
          {
            icon: <Users size={17} />,
            title: 'For students',
            body: 'A guaranteed meal in a guaranteed window. Lunch becomes something you plan, not something you queue for.',
          },
          {
            icon: <ChefHat size={17} />,
            title: 'For the canteen',
            body: 'Predictable prep, measurable demand, less wastage, and revenue that is already collected before serving starts.',
          },
          {
            icon: <Store size={17} />,
            title: 'For the campus',
            body: 'A calmer, less congested dining hall and a measurable sustainability story for the institution.',
          },
        ].map((t, i) => (
          <Tile key={t.title} {...t} accent="sky" delay={440 + i * 90} />
        ))}
      </div>

      <p className="animate-deck-step mt-4 text-[11px] text-slate-500" style={{ animationDelay: '720ms' }}>
        Figures are projections produced by the in-app simulation, not measured campus data.
      </p>
    </div>
  );
}

/* ---------- Slide 9 — roadmap ---------- */

function RoadmapSlide() {
  const phases = [
    {
      tag: 'Phase 1 · built',
      title: 'Software-only pilot',
      body: 'Pre-order, slot caps, mock UPI, QR tokens, kitchen dashboard and demand forecast — the complete loop, deployable to a canteen as-is.',
      icon: <ShoppingBag size={17} />,
      accent: 'emerald' as Accent,
    },
    {
      tag: 'Phase 2 · next',
      title: 'Real hardware & payments',
      body: 'ESP32 Time-of-Flight sensors at the entrance for live anonymous occupancy, plus a production UPI payment gateway.',
      icon: <Cpu size={17} />,
      accent: 'sky' as Accent,
    },
    {
      tag: 'Phase 3 · scale',
      title: 'Learned forecasting',
      body: 'Replace the simulation with models trained on real order history — weather, exam weeks and campus events included.',
      icon: <BarChart3 size={17} />,
      accent: 'violet' as Accent,
    },
  ];

  return (
    <div>
      <SlideHead
        accent="violet"
        eyebrow="Feasibility & roadmap"
        title="Built to be deployed, not just demoed."
        lead="Phase 1 is finished and running today with zero external dependencies. Each later phase bolts on without redesigning the core."
      />

      <div className="mt-7 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {phases.map((p, i) => {
          const a = ACCENT[p.accent];
          return (
            <div
              key={p.title}
              className="animate-deck-step relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              style={{ animationDelay: `${120 + i * 110}ms` }}
            >
              <div className={cls('absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl', a.glow, 'opacity-20')} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className={cls('flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset', a.bg, a.ring, a.text)}>
                    {p.icon}
                  </span>
                  <span className={cls('text-[10px] font-extrabold tracking-[0.18em] uppercase', a.text)}>
                    {p.tag}
                  </span>
                </div>
                <p className="mt-3.5 font-display text-lg font-bold text-white">{p.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{p.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {['React + TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'Client-side state engine', 'ESP32 ToF sensors (planned)'].map(
          (t, i) => (
            <span
              key={t}
              className="animate-deck-step rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300"
              style={{ animationDelay: `${460 + i * 60}ms` }}
            >
              {t}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ---------- Slide 10 — handoff ---------- */

function HandoffSlide({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="animate-deck text-center">
      <div className="flex justify-center">
        <Pill accent="sky">
          <Sparkles size={12} /> Live demo
        </Pill>
      </div>

      <h2 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
        <span className={HEADLINE_GRADIENT}>Now let&apos;s look at</span>
        <br />
        <span className={HEADLINE_GRADIENT}>the website.</span>
      </h2>

      <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
        Every flow in this deck is built and working. Place an order, watch it appear in the kitchen, then scan
        the token twice — the second scan is the one to watch.
      </p>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onEnter}
          className="group inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-7 py-4 font-display text-base font-extrabold text-white shadow-[0_20px_60px_-18px_rgba(16,185,129,0.85)] transition-all hover:-translate-y-0.5 hover:bg-emerald-400 active:translate-y-0 sm:px-9 sm:text-lg"
        >
          <PresentationIcon size={20} />
          Let&apos;s look at the website
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 text-left min-[480px]:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <ShoppingBag size={16} />, title: 'Order a lunch', body: 'Menu → slot → mock UPI payment → QR token.' },
          { icon: <ChefHat size={16} />, title: 'Watch the kitchen', body: 'The same order arrives in the live log; mark it ready.' },
          { icon: <ScanLine size={16} />, title: 'Scan it twice', body: 'First scan verifies, second returns ALREADY REDEEMED.' },
          { icon: <Gauge size={16} />, title: 'Move the sensors', body: 'Push occupancy up and watch the crowd level respond.' },
        ].map((s, i) => (
          <div
            key={s.title}
            className="animate-deck-step rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            style={{ animationDelay: `${160 + i * 90}ms` }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/25 ring-inset">
              {s.icon}
            </span>
            <p className="mt-3 font-display text-sm font-bold text-white">{s.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 font-display text-[13px] font-extrabold tracking-[0.24em] text-slate-500 uppercase">
        Team Pentagon
      </p>
    </div>
  );
}

/* ---------- Deck shell ---------- */

export function Presentation({ onEnter }: { onEnter: () => void }) {
  const slides = useMemo(
    () => [
      { label: 'Cover', accent: 'emerald' as Accent, render: () => <CoverSlide /> },
      { label: 'Problem', accent: 'amber' as Accent, render: () => <ProblemSlide /> },
      { label: 'Root cause', accent: 'amber' as Accent, render: () => <CauseSlide /> },
      { label: 'Solution', accent: 'emerald' as Accent, render: () => <SolutionSlide /> },
      { label: 'Student flow', accent: 'sky' as Accent, render: () => <JourneySlide /> },
      { label: 'Kitchen', accent: 'violet' as Accent, render: () => <KitchenSlide /> },
      { label: 'Benefits', accent: 'emerald' as Accent, render: () => <BenefitsSlide /> },
      { label: 'Impact', accent: 'sky' as Accent, render: () => <ImpactSlide /> },
      { label: 'Roadmap', accent: 'violet' as Accent, render: () => <RoadmapSlide /> },
      { label: 'Live demo', accent: 'emerald' as Accent, render: () => <HandoffSlide onEnter={onEnter} /> },
    ],
    [onEnter],
  );

  const [index, setIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const touchX = useRef<number | null>(null);
  const last = slides.length - 1;

  const go = useCallback(
    (next: number) => {
      setIndex((cur) => {
        const clamped = Math.max(0, Math.min(last, next));
        if (clamped !== cur) {
          // Keep the slide top in view when a slide is taller than the viewport.
          slideRef.current?.scrollTo({ top: 0 });
          window.scrollTo({ top: 0 });
        }
        return clamped;
      });
    },
    [last],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        go(last);
      } else if (e.key === 'Escape') {
        onEnter();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, last, onEnter]);

  // The deck hides its scrollbar for a cleaner look, which would otherwise leave
  // anything below the fold invisible — on a short projector viewport that reads
  // as a missing bullet. Watch the scroll position and say so explicitly.
  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    const measure = () => setHasMore(el.scrollHeight - el.clientHeight - el.scrollTop > 12);
    measure();
    // Observe rather than sampling on a timer: the slide's height changes when
    // webfonts swap in and when the footer itself grows, and a one-shot
    // measurement misses both.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [index]);

  const showMore = useCallback(() => {
    const el = slideRef.current;
    if (!el) return;
    el.scrollBy({ top: Math.max(180, el.clientHeight * 0.8), behavior: 'smooth' });
  }, []);

  const slide = slides[index];
  const accent = ACCENT[slide.accent];

  return (
    <div
      className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-slate-950 text-white"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        if (start === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) > 60) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* ---------- Background ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#0b1f1a_0%,#020617_55%,#020617_100%)]" />
        <div className="bg-grid-dark absolute inset-0 opacity-[0.35]" />
        {/* Kept emerald/teal on every slide — shifting the backdrop hue per
            slide muddies the whole deck. Accent colour lives in the content. */}
        <div className="animate-aurora absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full bg-emerald-500 opacity-25 blur-[120px]" />
        <div className="animate-aurora-slow absolute -right-40 -bottom-48 h-[34rem] w-[34rem] rounded-full bg-teal-500 blur-[130px] opacity-20" />
      </div>

      {/* ---------- Header ---------- */}
      <header className="relative z-20 shrink-0 border-b border-white/5 bg-slate-950/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-base shadow-md shadow-emerald-900/40">
              <span aria-hidden>🍲</span>
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[13px] font-extrabold tracking-tight">
                SMART CANTEEN
              </span>
              <span className="block text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                Team Pentagon
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-400 tabular-nums sm:inline-block">
              {slide.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300 tabular-nums">
              {index + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={onEnter}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Skip the intro and go straight to the app (Esc)"
            >
              <X size={12} />
              <span className="hidden sm:inline">Skip intro</span>
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="h-0.5 w-full bg-white/5">
          <div
            className={cls('h-full transition-[width] duration-500 ease-out', accent.glow)}
            style={{ width: `${((index + 1) / slides.length) * 100}%` }}
          />
        </div>
      </header>

      {/* ---------- Slide ---------- */}
      <main
        ref={slideRef}
        className="scroll-x-hide relative z-10 flex min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
      >
        {/* my-auto rather than align-items-center: a centred flex child taller
            than the scroll container gets clipped at the top edge with no way to
            scroll back to it. Auto margins fall back to 0 instead of overflowing. */}
        <div key={index} className="mx-auto my-auto w-full max-w-6xl">
          {slide.render()}
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="relative z-20 shrink-0 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm">
        {/* Lives in the footer, not floating over the slide — an overlay here
            would hide the very content it is pointing at. */}
        {hasMore && (
          <div className="flex justify-center pt-2.5">
            <button
              type="button"
              onClick={showMore}
              className="animate-deck-step inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-[11px] font-bold text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
            >
              <ArrowDown size={12} />
              More on this slide
            </button>
          </div>
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[12px] font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white/[0.04]"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to ${s.label}`}
                title={s.label}
                className={cls(
                  'h-2 rounded-full transition-all duration-300',
                  i === index ? cls('w-7', accent.glow) : 'w-2 bg-white/20 hover:bg-white/40',
                )}
              />
            ))}
          </div>

          {index === last ? (
            <button
              type="button"
              onClick={onEnter}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-[12px] font-extrabold text-white shadow-lg shadow-emerald-900/40 transition-colors hover:bg-emerald-400"
            >
              Open website
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-[12px] font-extrabold text-slate-900 transition-colors hover:bg-slate-200"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <p className="pb-2.5 text-center text-[10px] font-medium tracking-wide text-slate-600">
          {hasMore ? 'Scroll for the rest of this slide' : 'Use ← → or swipe · Esc skips to the app'}
        </p>
      </footer>
    </div>
  );
}
