import { Cpu, Minus, Plus, Radio, Shuffle, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CrowdCard } from '../../components/CrowdCard';
import { OccupancyTrendChart } from '../../components/charts';
import { Badge, Button, Card, InfoCard, LinkButton, ProgressBar, SectionHeading, StatCard } from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { demandBySlot, occupancyPercent, recommendedSlot } from '../../lib/selectors';
import { CROWD_META, cls, clock12, percent, slotLabel } from '../../lib/utils';

export default function CrowdStatus() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const navigate = useNavigate();
  const pct = occupancyPercent(state);
  const meta = CROWD_META[state.occupancy.current / state.occupancy.max <= 0.4 ? 'LOW' : pct <= 75 ? 'MODERATE' : 'HIGH'];
  const slots = demandBySlot(state);
  const quietest = recommendedSlot(state);
  const upcoming = slots.filter((s) => s.slot.endMin > simMin);

  const seatsFree = Math.max(0, state.occupancy.max - state.occupancy.current);
  const waitEstimate = pct < 41 ? 2 : pct < 76 ? 6 : 13;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Live"
        title="Crowd Status"
        subtitle="Anonymous occupancy readings from the entrance and exit sensors, refreshed continuously during service."
        action={
          <Badge tone="sky">
            <Radio size={11} /> Sensor feed {state.settings.liveSensor ? 'live' : 'paused'}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        <CrowdCard />

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="People inside"
            value={state.occupancy.current}
            sub={`of ${state.occupancy.max} safe capacity`}
            icon={<Users size={17} />}
            tone="violet"
          />
          <StatCard
            label="Seats likely free"
            value={seatsFree}
            sub="Estimated from live occupancy"
            icon={<TrendingUp size={17} />}
            tone="brand"
          />
          <StatCard
            label="Expected counter wait"
            value={`~${waitEstimate} min`}
            sub="For walk-up ordering today"
            icon={<Sparkles size={17} />}
            tone="amber"
          />
          <StatCard
            label="Occupancy"
            value={`${pct}%`}
            sub={meta.label}
            icon={<Users size={17} />}
            tone="sky"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <SectionHeading
            eyebrow="Trend"
            title="Occupancy over the last two hours"
            subtitle="The lunch peak is visible — pre-ordering flattens it by moving demand into timed windows."
          />
          <div className="mt-4">
            <OccupancyTrendChart readings={state.readings} max={state.occupancy.max} height={230} />
          </div>
        </Card>

        <Card>
          <SectionHeading eyebrow="Demo controls" title="Simulate the sensor feed" />
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            In production an ESP32 publishes these events from Time-of-Flight sensors at the doors. Here you can
            drive them by hand for the demo.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: 5 })}>
              <Plus size={15} /> 5 entering
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: 'ADJUST_OCCUPANCY', delta: -5 })}>
              <Minus size={15} /> 5 leaving
            </Button>
            <Button
              variant="secondary"
              className="col-span-2"
              onClick={() =>
                dispatch({
                  type: 'SET_OCCUPANCY',
                  value: Math.round(
                    state.occupancy.max * (0.32 + Math.random() * 0.55),
                  ),
                })
              }
            >
              <Shuffle size={15} /> Randomize sensor activity
            </Button>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
              <span>Busiest upcoming window</span>
              <span>Load</span>
            </div>
            {upcoming.slice(0, 4).map((row) => (
              <div key={row.slot.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-display text-[13px] font-bold text-slate-800">
                  {slotLabel(row.slot)}
                </span>
                <ProgressBar
                  value={row.booked}
                  max={row.capacity}
                  tone={row.utilization >= 100 ? 'rose' : row.utilization >= 82 ? 'amber' : row.utilization >= 50 ? 'sky' : 'brand'}
                  height="h-2"
                />
                <span className="w-11 shrink-0 text-right text-[11px] font-bold text-slate-500">
                  {row.utilization}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <InfoCard icon={<Cpu size={17} />} title="How It Works — hardware">
          <p>
            Time-of-Flight sensors installed at the entry and exit points detect directional movement. An ESP32
            microcontroller transmits anonymous occupancy counts to the Smart Canteen system.
          </p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {['No facial recognition', 'No phone tracking', 'No personal identity tracking', 'Anonymous occupancy only'].map(
              (item) => (
                <li key={item} className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[9px] text-emerald-700">
                    ✓
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </InfoCard>

        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <p className="text-[11px] font-bold tracking-[0.16em] text-emerald-100 uppercase">
            Best time to walk in
          </p>
          {quietest ? (
            <>
              <p className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                {slotLabel(quietest.slot)}
              </p>
              <p className="mt-1 text-sm text-emerald-50/90">
                Quietest open window — only {quietest.booked} of {quietest.capacity} slots booked (
                {quietest.utilization}%). Ordering now gets you seated fastest.
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Button
                  variant="secondary"
                  className="bg-white text-emerald-700 ring-0 hover:bg-emerald-50"
                  onClick={() => navigate('/menu')}
                >
                  Order for this window
                </Button>
                <LinkButton
                  to="/how-it-works"
                  variant="ghost"
                  className="text-emerald-50 ring-1 ring-white/30 hover:bg-white/10 hover:text-white"
                >
                  How the system works
                </LinkButton>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 font-display text-xl font-extrabold">All windows are currently full</p>
              <p className="mt-1 text-sm text-emerald-50/90">
                Walk in and the counter staff will serve you — the buffer covers walk-in customers.
              </p>
            </>
          )}
          <p className="mt-4 text-[11px] text-emerald-100/80">
            Occupancy {clock12(simMin)} · {state.occupancy.current} people ·{' '}
            {percent(state.occupancy.current, state.occupancy.max)}% full · mode {cls(meta.label.toLowerCase())}
          </p>
        </Card>
      </div>
    </div>
  );
}
