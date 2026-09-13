import {
  AlertTriangle,
  Cpu,
  DoorOpen,
  Minus,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Thermometer,
  TrendingUp,
  Users,
  Wifi,
} from 'lucide-react';
import { OccupancyTrendChart } from '../../components/charts';
import {
  Badge,
  Button,
  Card,
  CrowdBadge,
  InfoCard,
  ProgressBar,
  SectionHeading,
  StatCard,
  Toggle,
} from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { demandBySlot, occupancyPercent } from '../../lib/selectors';
import { CROWD_META, clock12, cls, percent, slotLabel } from '../../lib/utils';

export default function KitchenOccupancy() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const pct = occupancyPercent(state);
  const level = pct <= 40 ? 'LOW' : pct <= 75 ? 'MODERATE' : 'HIGH';
  const meta = CROWD_META[level];
  const slots = demandBySlot(state);

  const seatGap = state.occupancy.max - state.occupancy.current;
  const recent = [...state.readings].slice(-8).reverse();

  const nodes = [
    { name: 'Entry Gate A', type: 'VL53L0X ToF pair', status: 'online' as const, events: 412 },
    { name: 'Exit Gate B', type: 'VL53L0X ToF pair', status: 'online' as const, events: 394 },
    { name: 'Counter Zone C', type: 'Optional presence node', status: 'idle' as const, events: 0 },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Sensors"
        title="Occupancy Monitoring Dashboard"
        subtitle="Anonymous people counting from the entrance and exit nodes. This is what powers every crowd level shown across the app."
        action={
          <Badge tone={state.settings.liveSensor ? 'brand' : 'slate'}>
            <Radio size={11} /> {state.settings.liveSensor ? 'Sensor feed live' : 'Feed paused'}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        {/* Gauge */}
        <Card className="flex flex-col items-center">
          <Gauge value={state.occupancy.current} max={state.occupancy.max} />

          <CrowdBadge level={level} className="mt-4" />

          <div className="mt-5 grid w-full grid-cols-3 gap-2.5">
            <MiniStat label="Inside" value={state.occupancy.current} />
            <MiniStat label="Capacity" value={state.occupancy.max} />
            <MiniStat label="Seats free" value={Math.max(0, seatGap)} />
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
            Sensor feed live · canteen clock {clock12(simMin)} · max {state.occupancy.max} people
          </p>
        </Card>

        {/* Controls */}
        <div className="space-y-5">
          <Card>
            <SectionHeading
              eyebrow="Demo controls"
              title="Simulate sensor activity"
              subtitle="Drive the ToF feed by hand during the presentation — the crowd level and every dashboard update instantly."
            />

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: 5 })}>
                <Plus size={15} /> 5 entering
              </Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: -5 })}>
                <Minus size={15} /> 5 leaving
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  dispatch({
                    type: 'SET_OCCUPANCY',
                    value: Math.round(state.occupancy.max * (0.3 + Math.random() * 0.6)),
                  })
                }
              >
                <Shuffle size={15} /> Randomize
              </Button>
              <Button
                variant="amber"
                onClick={() => dispatch({ type: 'SET_OCCUPANCY', value: Math.round(state.occupancy.max * 0.88) })}
              >
                <AlertTriangle size={15} /> Trigger high crowd
              </Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'SET_OCCUPANCY', value: 0 })}>
                <RotateCcw size={15} /> Empty canteen
              </Button>
              <Button
                variant="secondary"
                onClick={() => dispatch({ type: 'SET_OCCUPANCY', value: state.occupancy.max })}
              >
                <Users size={15} /> Fill to capacity
              </Button>
            </div>

            <div className="mt-4">
              <Toggle
                checked={state.settings.liveSensor}
                onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', patch: { liveSensor: v } })}
                label="Live sensor feed"
                hint="Continuously drifts occupancy along the lunch-rush curve"
              />
            </div>
          </Card>

          <Card>
            <SectionHeading eyebrow="Thresholds" title="How the crowd level is derived" />
            <div className="mt-4 space-y-3">
              {[
                { level: 'LOW' as const, range: '0–40%', action: 'Normal service, all counters open' },
                { level: 'MODERATE' as const, range: '41–75%', action: 'Stagger preparation, keep trays stocked' },
                { level: 'HIGH' as const, range: '76–100%', action: 'Prioritise ready orders, hold non-urgent cooking' },
              ].map((t) => {
                const m = CROWD_META[t.level];
                const active = t.level === level;
                return (
                  <div
                    key={t.level}
                    className={cls(
                      'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-all',
                      active ? cls(m.bg, m.ring, 'border-transparent ring-1') : 'border-slate-200 bg-white',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cls('h-2.5 w-2.5 rounded-full', m.dot)} />
                      <div>
                        <p className={cls('text-[12px] font-extrabold uppercase', active ? m.text : 'text-slate-500')}>
                          {m.emoji} {t.level}
                        </p>
                        <p className="text-[11px] text-slate-500">{t.range} of capacity</p>
                      </div>
                    </div>
                    <p className={cls('text-[11px] font-semibold', active ? m.text : 'text-slate-400')}>{t.action}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current occupancy"
          value={state.occupancy.current}
          sub="people inside right now"
          icon={<Users size={17} />}
          tone="violet"
        />
        <StatCard
          label="Maximum capacity"
          value={state.occupancy.max}
          sub="safe occupancy limit"
          icon={<Thermometer size={17} />}
          tone="sky"
        />
        <StatCard label="Occupancy" value={`${pct}%`} sub={meta.label} icon={<TrendingUp size={17} />} tone="amber" />
        <StatCard
          label="Crowd level"
          value={<CrowdBadge level={level} />}
          sub={`${Math.max(0, seatGap)} seats estimated free`}
          icon={<Radio size={17} />}
          tone="brand"
        />
      </div>

      <Card>
        <SectionHeading
          eyebrow="Trend"
          title="Occupancy over the last two hours"
          subtitle="Each point is an anonymous count sample from the entry and exit nodes."
        />
        <div className="mt-4">
          <OccupancyTrendChart readings={state.readings} max={state.occupancy.max} height={260} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <Card>
          <SectionHeading eyebrow="Hardware" title="Sensor nodes" />
          <div className="mt-4 space-y-3">
            {nodes.map((node) => (
              <div
                key={node.name}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cls(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      node.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400',
                    )}
                  >
                    <DoorOpen size={18} />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold text-slate-800">{node.name}</p>
                    <p className="text-[11px] text-slate-500">{node.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {node.events ? `${node.events} events today` : 'standby'}
                  </span>
                  <Badge tone={node.status === 'online' ? 'brand' : 'slate'}>
                    <Wifi size={11} /> {node.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Payload published</p>
            <code className="mt-1.5 block rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-emerald-300">
              {`{ "node": "gateA", "direction": "in",\n  "count": ${state.occupancy.current}, "max": ${state.occupancy.max},\n  "ts": "${clock12(simMin)}" }`}
            </code>
            <p className="mt-2 text-[11px] text-slate-500">
              No identifiers, no images, no device addresses — only a running count.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionHeading
              eyebrow="Log"
              title="Recent sensor samples"
              action={<Badge tone="slate">{state.readings.length} samples buffered</Badge>}
            />
            <div className="mt-4 space-y-1.5">
              {recent.map((r, i) => {
                const prev = recent[i + 1]?.count ?? r.count;
                const delta = r.count - prev;
                return (
                  <div
                    key={r.t + String(i)}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[12px]"
                  >
                    <span className="font-mono font-semibold text-slate-500">
                      {clock12(Math.max(0, simMin - i * 5))}
                    </span>
                    <span className="font-bold text-slate-800">{r.count} people</span>
                    <span
                      className={cls(
                        'w-16 text-right font-bold',
                        delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-500' : 'text-slate-400',
                      )}
                    >
                      {delta > 0 ? `+${delta}` : delta === 0 ? '±0' : delta}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHeading eyebrow="Upcoming load" title="Expected congestion by window" />
            <div className="mt-4 space-y-2.5">
              {slots.map((row) => {
                const expected = Math.round(state.occupancy.max * (0.35 + (row.booked / row.capacity) * 0.45));
                const expPct = percent(expected, state.occupancy.max);
                return (
                  <div key={row.slot.id}>
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="font-display font-bold text-slate-800">{slotLabel(row.slot)}</span>
                      <span className="font-semibold text-slate-500">
                        ~{expected} people ({expPct}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={expPct}
                      tone={expPct >= 76 ? 'rose' : expPct >= 41 ? 'amber' : 'brand'}
                      height="h-1.5"
                      className="mt-1"
                    />
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Derived from each window's booking load. Simulated estimate for planning only.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard icon={<Cpu size={17} />} title="Hardware description">
          <p>
            Time-of-Flight sensors installed at the entry and exit points detect directional movement. An ESP32
            microcontroller transmits anonymous occupancy data to the Smart Canteen system.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {['VL53L0X ToF', 'ESP32 · Wi-Fi', 'MQTT publish', 'No camera'].map((t) => (
              <Badge key={t} tone="sky">
                {t}
              </Badge>
            ))}
          </div>
        </InfoCard>

        <InfoCard icon={<ShieldCheck size={17} />} title="Privacy by design" tone="brand">
          <ul className="space-y-1.5">
            {[
              'No facial recognition of any kind.',
              'No phone, Wi-Fi or Bluetooth tracking.',
              'No personal identity is ever recorded.',
              'Only an anonymous occupancy estimate leaves the sensor.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[12px] font-semibold text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[9px] text-emerald-700">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2.5 text-center">
      <p className="font-display text-lg font-extrabold text-slate-900">{value}</p>
      <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>
    </div>
  );
}

function Gauge({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, Math.max(0, percent(value, max)));
  const radius = 78;
  const circumference = Math.PI * radius; // half circle
  const dash = (pct / 100) * circumference;
  const color = pct >= 76 ? '#ef4444' : pct >= 41 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative w-full max-w-[240px]">
      <svg viewBox="0 0 200 116" className="w-full">
        <path
          d="M 22 100 A 78 78 0 0 1 178 100"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 22 100 A 78 78 0 0 1 178 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.16,1,0.3,1), stroke 400ms' }}
        />
      </svg>

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
        <span className="font-display text-4xl leading-none font-extrabold tracking-tight text-slate-900">
          {value}
        </span>
        <span className="text-[11px] font-bold text-slate-400">of {max} people</span>
        <span className="mt-1 text-[11px] font-bold text-slate-500">{pct}% full</span>
      </div>
    </div>
  );
}
