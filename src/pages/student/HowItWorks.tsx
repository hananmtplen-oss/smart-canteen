import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Cpu,
  Database,
  GraduationCap,
  QrCode,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  TriangleAlert,
  Users,
  Utensils,
} from 'lucide-react';
import { Badge, Card, InfoCard, LinkButton, ProgressBar, SectionHeading } from '../../components/ui';
import { useApp } from '../../lib/store';
import { demandBySlot } from '../../lib/selectors';
import { cls, slotLabel } from '../../lib/utils';

const PROBLEMS = [
  'Large queues to order food.',
  'A second queue just to pay.',
  'Every student arrives at 12:15 at once.',
  'No seating during the peak — people eat standing outside.',
  'Staff cannot predict how much to cook.',
  'Popular dishes run out while other food is thrown away.',
  'Cooks spend their time taking orders instead of cooking.',
];

const SOLUTIONS = [
  { icon: Smartphone, title: 'Digital pre-ordering', body: 'Students order from their phone before the break even starts.' },
  { icon: CalendarClock, title: 'Capacity-controlled slots', body: 'Six 12-minute windows, 50 orders each, first-come-first-served.' },
  { icon: QrCode, title: 'Single-use QR tokens', body: 'One scan per order. Screenshot reuse is detected and rejected.' },
  { icon: BrainCircuit, title: 'Demand forecasting', body: 'Confirmed per-dish demand plus a walk-in buffer for the kitchen.' },
  { icon: Users, title: 'Live occupancy', body: 'Anonymous door sensors publish how full the canteen actually is.' },
  { icon: Utensils, title: 'Walk-in buffer', body: 'Outsiders and cash customers are still served, by design.' },
];

const DATA_MODEL = [
  {
    icon: GraduationCap,
    name: 'User',
    tone: 'sky',
    fields: ['user_id', 'name', 'student_id', 'on_slot_events', 'off_slot_events'],
  },
  {
    icon: Utensils,
    name: 'FoodItem',
    tone: 'brand',
    fields: ['food_id', 'name', 'price', 'available_qty', 'popularity', 'prep_time_min'],
  },
  {
    icon: QrCode,
    name: 'Order',
    tone: 'violet',
    fields: [
      'order_id',
      'user_id',
      'items[]',
      'total_amount',
      'payment_status',
      'txn_id',
      'slot_id',
      'qr_token',
      'prep_status',
      'redeemed',
      'collected_at',
    ],
  },
  {
    icon: CalendarClock,
    name: 'Slot',
    tone: 'amber',
    fields: ['slot_id', 'start_time', 'end_time', 'max_capacity', 'current_bookings'],
  },
  {
    icon: Cpu,
    name: 'Occupancy',
    tone: 'rose',
    fields: ['current_count', 'max_capacity', 'crowd_level', 'last_sensor_update'],
  },
];

export default function HowItWorks() {
  const { state } = useApp();
  const slots = demandBySlot(state);

  return (
    <div className="space-y-12">
      <SectionHeading
        eyebrow="Documentation"
        title="How the Smart Canteen system works"
        subtitle="The idea in one line: move the queue out of the canteen and into the phone, then let the data tell the kitchen what to cook."
      />

      {/* Problem */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="border-rose-200/70 bg-rose-50/40">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-rose-600 uppercase">
            <TriangleAlert size={13} /> The problem today
          </div>
          <ul className="mt-4 space-y-2.5">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                {p}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-emerald-200/70 bg-emerald-50/40">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-emerald-700 uppercase">
            <Sparkles size={13} /> What Smart Canteen changes
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SOLUTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="rounded-xl bg-white p-3.5 ring-1 ring-emerald-100 ring-inset">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Icon size={16} />
                  </span>
                  <p className="mt-2.5 text-[13px] font-bold text-slate-800">{s.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{s.body}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* Architecture */}
      <section>
        <SectionHeading
          eyebrow="Architecture"
          title="One shared state, four interfaces"
          subtitle="Every screen in this prototype reads and writes the same order book, which is why a student's payment instantly changes the kitchen dashboard."
        />

        <Card className="mt-6">
          <div className="grid gap-4 lg:grid-cols-5 lg:items-stretch">
            <ArchBox
              icon={Cpu}
              title="ToF sensors + ESP32"
              lines={['Directional entry / exit counting', 'Anonymous occupancy only']}
              tone="rose"
            />
            <Arrow />
            <ArchBox
              icon={ServerCog}
              title="Smart Canteen service"
              lines={['Orders · slots · QR tokens', 'Occupancy stream', 'Demand aggregation']}
              tone="sky"
              highlight
            />
            <Arrow />
            <div className="space-y-3">
              <ArchBox
                icon={Smartphone}
                title="Student app"
                lines={['Menu · cart · slots', 'Mock payment · QR token']}
                tone="brand"
              />
              <ArchBox
                icon={Utensils}
                title="Kitchen dashboard"
                lines={['Queue · demand forecast', 'Slot load · occupancy']}
                tone="amber"
              />
              <ArchBox
                icon={QrCode}
                title="Collection scanner"
                lines={['Validate · redeem once', 'Off-slot tracking']}
                tone="violet"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <FlowNote title="Order path" body="Student → payment → order row → kitchen queue → QR scan → redeemed." />
            <FlowNote title="Sensor path" body="ToF → ESP32 → occupancy count → crowd level → every screen." />
            <FlowNote
              title="Planning path"
              body="Paid orders → per-dish demand → +15% walk-in buffer → recommended preparation."
            />
          </div>
        </Card>
      </section>

      {/* Slot timeline */}
      <section>
        <SectionHeading
          eyebrow="Core mechanism"
          title="Six windows that flatten the rush"
          subtitle="Lunch service is split into 12-minute collection windows. Booking is strictly first-come-first-served."
        />

        <Card className="mt-6">
          <div className="flex flex-wrap gap-2">
            {slots.map((row) => (
              <div
                key={row.slot.id}
                className={cls(
                  'min-w-[150px] flex-1 rounded-2xl border p-3.5',
                  row.utilization >= 100
                    ? 'border-rose-200 bg-rose-50'
                    : row.utilization >= 82
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[13px] font-extrabold text-slate-900">
                    {slotLabel(row.slot)}
                  </span>
                  {row.isRecommended && <Badge tone="sky">Best</Badge>}
                </div>
                <p className="mt-1.5 text-[11px] font-bold text-slate-600">
                  {row.booked} / {row.capacity} orders
                </p>
                <ProgressBar
                  value={row.booked}
                  max={row.capacity}
                  className="mt-2"
                  height="h-1.5"
                  tone={row.utilization >= 100 ? 'rose' : row.utilization >= 82 ? 'amber' : 'brand'}
                />
                <p className="mt-2 text-[10px] font-bold tracking-wide uppercase">
                  {row.utilization >= 100 ? (
                    <span className="text-rose-600">🔴 Full</span>
                  ) : (
                    <span className="text-emerald-600">🟢 Available</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <InfoCard icon={<Timer size={17} />} title="Slot policy — what students should know" tone="brand">
              <p>
                Slots distribute crowd flow. They are not a deadline: arriving late never forfeits the food.
                The system simply records whether collection happened inside the chosen window.
              </p>
              <p className="mt-2">
                Repeated off-slot collection makes capacity planning unreliable, so after{' '}
                <strong>{state.settings.penaltyThreshold} off-slot collections</strong> a{' '}
                <strong>₹{state.settings.penaltyAmount} scheduling adjustment</strong> may be added to future
                orders. That rule is configurable and currently{' '}
                <strong>{state.settings.schedulingPolicyEnabled ? 'on' : 'off'}</strong>.
              </p>
            </InfoCard>

            <InfoCard icon={<ShieldCheck size={17} />} title="Why the QR cannot be reused" tone="violet">
              <p>
                The QR encodes an opaque token such as{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">
                  SMARTCANTEEN_ORDER_TOKEN_8F7K29XQ
                </code>{' '}
                — never the order payload. The server keeps the token → order mapping, so a screenshot of
                somebody's QR is useless after their first scan.
              </p>
              <p className="mt-2">
                The scanner checks four things before handing over food: does the token exist, was payment
                successful, has it already been redeemed, and is the student inside or outside their chosen
                window.
              </p>
            </InfoCard>
          </div>
        </Card>
      </section>

      {/* Data model */}
      <section>
        <SectionHeading
          eyebrow="Data model"
          title="The five records behind the demo"
          subtitle="A realistic relational shape — the prototype persists this in localStorage, a production build would use a real database."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {DATA_MODEL.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.name} className="h-full">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cls(
                      'flex h-9 w-9 items-center justify-center rounded-xl',
                      m.tone === 'brand'
                        ? 'bg-emerald-50 text-emerald-600'
                        : m.tone === 'sky'
                          ? 'bg-sky-50 text-sky-600'
                          : m.tone === 'violet'
                            ? 'bg-violet-50 text-violet-600'
                            : m.tone === 'amber'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600',
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <p className="font-display text-sm font-extrabold text-slate-900">{m.name}</p>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {m.fields.map((f) => (
                    <li key={f} className="font-mono text-[11px] leading-relaxed text-slate-500">
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Hardware */}
      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            <Cpu size={13} /> Occupancy sensing
          </div>
          <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight text-slate-900">
            Time-of-Flight sensors + ESP32
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
            Two ToF sensor pairs sit at the entrance and exit. By comparing which beam breaks first, the ESP32
            knows whether a person is entering or leaving, keeps a running count, and publishes it to the Smart
            Canteen service over Wi-Fi.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { k: 'Sensing', v: 'VL53L0X ToF pairs' },
              { k: 'Controller', v: 'ESP32 over Wi-Fi / MQTT' },
              { k: 'Payload', v: 'Anonymous count only' },
            ].map((item) => (
              <div key={item.k} className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{item.k}</p>
                <p className="mt-0.5 text-[13px] font-bold text-slate-800">{item.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['No facial recognition', 'No phone tracking', 'No identity tracking', 'Anonymous occupancy only'].map(
              (t) => (
                <Badge key={t} tone="brand">
                  ✓ {t}
                </Badge>
              ),
            )}
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-[11px] leading-relaxed text-amber-800">
            In this prototype the sensor feed is simulated — the counters and the crowd level update live, but
            the numbers come from a model rather than physical hardware.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            <Database size={13} /> Demo environment
          </div>
          <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight text-slate-900">
            Everything runs locally
          </h3>
          <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-slate-600">
            {[
              'No payment gateway credentials required — payments are mocked.',
              'No QR scanner hardware — the kiosk page simulates the scan.',
              'No ESP32 needed — occupancy is simulated and can be driven by hand.',
              'No database — orders, slots and tokens persist in localStorage.',
              'No API keys — the whole prototype runs offline.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <LinkButton to="/demo" variant="dark">
              Open Demo Control Panel <ArrowRight size={15} />
            </LinkButton>
            <LinkButton to="/kitchen" variant="secondary">
              Kitchen Dashboard
            </LinkButton>
          </div>
        </Card>
      </section>
    </div>
  );
}

function ArchBox({
  icon: Icon,
  title,
  lines,
  tone,
  highlight,
}: {
  icon: typeof Cpu;
  title: string;
  lines: string[];
  tone: 'brand' | 'sky' | 'amber' | 'violet' | 'rose';
  highlight?: boolean;
}) {
  const tones: Record<string, string> = {
    brand: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  };
  return (
    <div
      className={cls(
        'rounded-2xl border p-4',
        highlight ? 'border-sky-300 bg-sky-50/50 ring-2 ring-sky-200' : 'border-slate-200 bg-white',
      )}
    >
      <span className={cls('inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset', tones[tone])}>
        <Icon size={17} />
      </span>
      <p className="mt-2.5 font-display text-[13px] font-extrabold text-slate-900">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {lines.map((l) => (
          <li key={l} className="text-[11px] leading-relaxed text-slate-500">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ArrowRight size={16} />
      </span>
    </div>
  );
}

function FlowNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
