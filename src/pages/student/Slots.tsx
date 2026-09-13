import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Clock3,
  Info,
  ShieldCheck,
  Sparkles,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, InfoCard, LinkButton, ProgressBar, SectionHeading, SlotStatusBadge } from '../../components/ui';
import { useApp, useSimClock } from '../../lib/store';
import { cartSubtotal } from '../../lib/store';
import { reliabilityOf } from '../../lib/selectors';
import { cls, inr, slotLabel } from '../../lib/utils';

export default function Slots() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const navigate = useNavigate();
  const [policyOpen, setPolicyOpen] = useState(false);

  const subtotal = cartSubtotal(state.cart);
  const selected = state.slots.find((s) => s.id === state.selectedSlotId);
  const reliability = reliabilityOf(state.user, state.settings.penaltyThreshold);

  if (state.cart.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Step 2 of 3" title="Select a collection slot" />
        <Card>
          <div className="py-12 text-center">
            <p className="text-4xl">🕒</p>
            <p className="mt-3 font-display text-base font-bold text-slate-700">Your cart is empty</p>
            <p className="mt-1 text-sm text-slate-500">Pick some food first — then choose when to collect it.</p>
            <div className="mt-5 flex justify-center">
              <LinkButton to="/menu">Browse the menu</LinkButton>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const busiestRemaining = Math.max(
    ...state.slots.filter((s) => s.booked < s.capacity).map((s) => s.booked / s.capacity),
    0,
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Step 2 of 3"
        title="Choose your 12-minute collection window"
        subtitle="Slots are first-come-first-served. Once a window reaches 50 orders it locks automatically — book early to get your preferred time."
        action={
          <Badge tone="sky">
            <Sparkles size={11} /> {reliability.label} reliability
          </Badge>
        }
      />

      {/* Policy banner */}
      <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 ring-1 ring-emerald-200 ring-inset">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-emerald-900">
            You will never lose your food by arriving late.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/80">
            Collection slots are designed to distribute crowd flow and reduce congestion. Occasional late
            collection is allowed — the system simply tracks repeated off-slot collection.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        {/* Slot grid */}
        <div className="space-y-4">
          {state.slots.map((slot) => {
            const utilization = Math.round((slot.booked / slot.capacity) * 100);
            const full = slot.booked >= slot.capacity;
            const isSelected = state.selectedSlotId === slot.id;
            const isCurrent = simMin >= slot.startMin && simMin < slot.endMin;
            const isPast = simMin >= slot.endMin;
            const remaining = slot.capacity - slot.booked;
            const quietest =
              !full && remaining === Math.max(...state.slots.map((s) => s.capacity - s.booked));
            const crowdTone =
              utilization >= 100 ? 'rose' : utilization >= 82 ? 'amber' : utilization >= 50 ? 'sky' : 'brand';
            const expected =
              utilization >= 100
                ? 'Very busy'
                : utilization >= 82
                  ? 'Busy'
                  : utilization >= 50
                    ? 'Moderate'
                    : 'Low expected crowd';

            return (
              <button
                key={slot.id}
                type="button"
                disabled={full || isPast}
                onClick={() => dispatch({ type: 'SELECT_SLOT', slotId: slot.id })}
                className={cls(
                  'w-full rounded-2xl border bg-white p-4 text-left transition-all sm:p-5',
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 card-shadow-lg'
                    : 'border-slate-200 card-shadow hover:border-emerald-300',
                  (full || isPast) && 'cursor-not-allowed opacity-60 hover:border-slate-200',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={cls(
                        'flex h-11 w-11 items-center justify-center rounded-xl font-display text-xs font-extrabold',
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {slot.id}
                    </span>
                    <div>
                      <p className="font-display text-lg leading-tight font-extrabold tracking-tight text-slate-900">
                        {slotLabel(slot)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{expected}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isCurrent && <Badge tone="violet">Now serving</Badge>}
                    {quietest && !isCurrent && <Badge tone="sky">Recommended</Badge>}
                    {isPast && <Badge tone="slate">Window closed</Badge>}
                    <SlotStatusBadge status={full ? 'Full' : utilization >= 82 ? 'Busy' : utilization >= 50 ? 'Available' : 'Low'} />
                  </div>
                </div>

                <div className="mt-3.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">
                      {slot.booked} / {slot.capacity} orders booked
                    </span>
                    <span className={cls(utilization >= 100 ? 'text-rose-600' : 'text-slate-400')}>
                      {utilization}%
                    </span>
                  </div>
                  <ProgressBar value={slot.booked} max={slot.capacity} tone={crowdTone} height="h-2" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  {full ? (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      🔴 FULL — this window is closed, please choose another slot
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      🟢 AVAILABLE — {remaining} slot{remaining === 1 ? '' : 's'} left
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-[136px]">
          <Card>
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
              <CalendarClock size={13} /> Your selection
            </div>
            {selected ? (
              <div className="mt-3">
                <p className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                  {slotLabel(selected)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.capacity - selected.booked} of {selected.capacity} slots still free
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Pick one of the windows to continue.</p>
            )}

            <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Items</span>
                <span className="font-semibold text-slate-800">
                  {state.cart.reduce((a, l) => a + l.qty, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order total</span>
                <span className="font-semibold text-slate-800">{inr(subtotal)}</span>
              </div>
              {reliability.penaltyActive && state.settings.schedulingPolicyEnabled && (
                <div className="flex justify-between text-amber-700">
                  <span>Scheduling adjustment</span>
                  <span className="font-semibold">+{inr(state.settings.penaltyAmount)}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="mt-5 w-full"
              disabled={!selected}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Payment <ArrowRight size={16} />
            </Button>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Mock payment — no real gateway is contacted.
            </p>
          </Card>

          {/* Reliability score */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                <BadgeCheck size={13} /> Slot reliability score
              </div>
              <Badge tone={reliability.level === 'excellent' ? 'brand' : reliability.level === 'good' ? 'sky' : 'amber'}>
                {reliability.label}
              </Badge>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                {reliability.score}%
              </span>
              <span className="pb-1 text-[11px] font-semibold text-slate-500">on-time collection</span>
            </div>
            <ProgressBar
              value={reliability.score}
              tone={reliability.level === 'excellent' ? 'brand' : reliability.level === 'good' ? 'sky' : 'amber'}
              className="mt-3"
            />

            <p className="mt-3 text-[12px] leading-relaxed text-slate-500">{reliability.message}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <p className="font-display text-lg font-extrabold text-emerald-700">{state.user.onSlotEvents}</p>
                <p className="text-[10px] font-bold tracking-wide text-emerald-600/80 uppercase">Within window</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-3 py-2">
                <p className="font-display text-lg font-extrabold text-amber-700">{state.user.offSlotEvents}</p>
                <p className="text-[10px] font-bold tracking-wide text-amber-600/80 uppercase">Off-slot</p>
              </div>
            </div>
          </Card>

          {/* Scheduling policy */}
          <Card padded={false}>
            <button
              type="button"
              onClick={() => setPolicyOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="flex items-center gap-2.5">
                <Info size={15} className="text-slate-400" />
                <span className="font-display text-sm font-bold text-slate-800">Scheduling Policy</span>
              </span>
              <ChevronDown
                size={16}
                className={cls('text-slate-400 transition-transform', policyOpen && 'rotate-180')}
              />
            </button>
            {policyOpen && (
              <div className="animate-rise space-y-3 border-t border-slate-100 px-5 py-4 text-[12px] leading-relaxed text-slate-600">
                <p>
                  Collection windows exist purely to spread the crowd. Arriving late does{' '}
                  <strong>not</strong> forfeit your order.
                </p>
                <p>
                  However, repeatedly ignoring your chosen window makes capacity planning unreliable.
                  After {state.settings.penaltyThreshold} off-slot collections, a{' '}
                  <strong>{inr(state.settings.penaltyAmount)} scheduling adjustment</strong> may be added to
                  future orders.
                </p>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <Timer size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  <p className="text-[11px]">
                    Currently{' '}
                    <strong>{state.settings.schedulingPolicyEnabled ? 'enabled' : 'disabled'}</strong> ·{' '}
                    {state.user.offSlotEvents} of {state.settings.penaltyThreshold} off-slot events recorded
                    this term.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      dispatch({
                        type: 'UPDATE_SETTINGS',
                        patch: { schedulingPolicyEnabled: !state.settings.schedulingPolicyEnabled },
                      })
                    }
                  >
                    {state.settings.schedulingPolicyEnabled ? 'Disable for demo' : 'Enable for demo'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <InfoCard
            icon={<Clock3 size={16} />}
            title="How the crowd is spread"
            tone="violet"
            className={busiestRemaining > 0.9 ? 'ring-amber-200' : undefined}
          >
            <p>
              The busiest open window is at {Math.round(busiestRemaining * 100)}% capacity. Choosing a quieter
              window gets you seated faster and helps the kitchen plate in sequence.
            </p>
          </InfoCard>

          {reliability.offSlotEvents > 0 && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[12px] leading-relaxed text-amber-800">
                You have collected outside your window {reliability.offSlotEvents} time
                {reliability.offSlotEvents === 1 ? '' : 's'}. Your food was never withheld.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
