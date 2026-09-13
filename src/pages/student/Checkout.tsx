import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  Lock,
  Receipt,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../../components/PaymentModal';
import { Badge, Button, Card, LinkButton, SectionHeading } from '../../components/ui';
import { buildOrderFromCart, cartSubtotal, useApp } from '../../lib/store';
import { reliabilityOf } from '../../lib/selectors';
import { inr, makeTxnId, slotLabel } from '../../lib/utils';
import type { Order, OrderLine, Slot } from '../../types';

interface CheckoutSnapshot {
  lines: OrderLine[];
  slotId: string;
}

export default function Checkout() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<CheckoutSnapshot | null>(null);

  const reliability = reliabilityOf(state.user, state.settings.penaltyThreshold);

  /**
   * While the payment modal is open we read from a frozen snapshot, because
   * placing the order empties the cart and would otherwise unmount the modal
   * before the student ever sees their receipt.
   */
  const view = useMemo(() => {
    const snapshotSlot = snapshot ? state.slots.find((s) => s.id === snapshot.slotId) : undefined;
    if (open && snapshot && snapshotSlot) {
      return { lines: snapshot.lines, slot: snapshotSlot as Slot };
    }
    const liveSlot = state.slots.find((s) => s.id === state.selectedSlotId);
    if (state.cart.length > 0 && liveSlot) {
      return { lines: state.cart, slot: liveSlot };
    }
    return null;
  }, [open, snapshot, state.cart, state.selectedSlotId, state.slots]);

  if (!view) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Step 3 of 3" title="Order Summary" />
        <Card>
          <div className="py-12 text-center">
            <p className="text-4xl">🧾</p>
            <p className="mt-3 font-display text-base font-bold text-slate-700">Nothing to pay for yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add items and select a collection window to reach the payment step.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <LinkButton to="/menu">Browse the menu</LinkButton>
              <LinkButton to="/orders" variant="secondary">
                My orders
              </LinkButton>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const { lines, slot } = view;
  const subtotal = cartSubtotal(lines);
  const penaltyActive = reliability.penaltyActive && state.settings.schedulingPolicyEnabled;
  const adjustment = penaltyActive ? state.settings.penaltyAmount : 0;
  const total = subtotal + adjustment;

  /** Called by the payment modal when the student taps "Pay". */
  function handlePay(method: 'UPI' | 'Card' | 'Wallet'): { ok: boolean; order: Order | null } {
    const forcedFailure = state.settings.forceNextPaymentFailure;
    const order = buildOrderFromCart(state, { txnId: makeTxnId(), method });
    if (!order) return { ok: false, order: null };

    if (forcedFailure) {
      // Simulated decline — consume the flag, create no order, consume no slot.
      dispatch({ type: 'UPDATE_SETTINGS', patch: { forceNextPaymentFailure: false } });
      return { ok: false, order: null };
    }

    dispatch({ type: 'PLACE_ORDER', order });
    return { ok: true, order };
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Step 3 of 3"
        title="Order Summary"
        subtitle="Confirm the details and complete the mock payment. A unique QR food token is issued instantly."
        action={<Badge tone="brand">Secure mock checkout</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-slate-900">
                <Receipt size={16} className="text-slate-400" /> Food items
              </h3>
              <LinkButton to="/menu" variant="ghost" size="sm">
                <ArrowLeft size={13} /> Edit
              </LinkButton>
            </div>

            <ul className="mt-4 divide-y divide-slate-100">
              {lines.map((line) => (
                <li key={line.foodId} className="flex items-center gap-3 py-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 text-xl">
                    {line.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-900">{line.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {inr(line.price)} × {line.qty}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{inr(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-slate-900">
                <CalendarClock size={16} className="text-slate-400" /> Collection slot
              </h3>
              <LinkButton to="/slots" variant="ghost" size="sm">
                Change slot
              </LinkButton>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3.5">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  Collect between
                </p>
                <p className="font-display text-xl font-extrabold text-white">{slotLabel(slot)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">Capacity</p>
                <p className="text-sm font-bold text-emerald-300">
                  {slot.booked}/{slot.capacity} booked
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              Late collection is always allowed — your food is held at the counter and never discarded because
              you missed your window.
            </p>
          </Card>

          <Card>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Payment method
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose a method in the next step. This is a simulated gateway — nothing leaves your browser.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: Smartphone, label: 'UPI', hint: 'student@upi' },
                { icon: CreditCard, label: 'Card', hint: 'Visa · RuPay' },
                { icon: Wallet, label: 'Wallet', hint: 'Campus wallet' },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-slate-200 px-3 py-3.5 text-center transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <Icon size={19} className="mx-auto text-slate-400" />
                    <p className="mt-1.5 text-[13px] font-bold text-slate-700">{m.label}</p>
                    <p className="text-[10px] text-slate-400">{m.hint}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Bill */}
        <div className="space-y-4 lg:sticky lg:top-[136px]">
          <Card>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">Bill details</h3>
            <div className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Item total</span>
                <span className="font-semibold text-slate-800">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxes & charges (5%)</span>
                <span className="font-semibold text-emerald-600">Included</span>
              </div>
              {adjustment > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Scheduling adjustment</span>
                  <span className="font-semibold">+{inr(adjustment)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
              <span className="font-display text-sm font-bold text-slate-700">Total payable</span>
              <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                {inr(total)}
              </span>
            </div>

            {adjustment > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
                <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                <span>
                  Scheduling reliability notice: repeated off-slot collection has added a {inr(adjustment)}{' '}
                  scheduling adjustment to this order. Collecting within your window keeps this off future
                  bills.
                </span>
              </div>
            )}

            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => {
                setSnapshot({ lines: lines.map((l) => ({ ...l })), slotId: slot.id });
                setOpen(true);
              }}
            >
              <Lock size={15} /> Proceed to Payment · {inr(total)}
            </Button>

            {state.settings.forceNextPaymentFailure && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-700">
                <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                Demo mode: the next payment attempt is set to FAIL from the Demo Control Panel.
              </div>
            )}

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck size={12} /> No real card, UPI or bank credentials are collected.
            </p>
          </Card>

          <Card className="bg-slate-900 text-white">
            <p className="text-[11px] font-bold tracking-[0.16em] text-emerald-300 uppercase">
              What happens next
            </p>
            <ol className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-slate-300">
              {[
                'Your order is written to the kitchen queue instantly.',
                'Confirmed demand for each dish updates on the staff dashboard.',
                'A unique secure QR token is issued for this order only.',
                'Scan it once at the counter — a repeat scan reports ALREADY REDEEMED.',
              ].map((line, i) => (
                <li key={line} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-emerald-300">
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <PaymentModal
        open={open}
        adjustment={adjustment}
        total={total}
        slotLabel={slotLabel(slot)}
        itemCount={lines.reduce((a, l) => a + l.qty, 0)}
        onPay={handlePay}
        onClose={() => setOpen(false)}
        onViewToken={(order) => {
          setOpen(false);
          setSnapshot(null);
          navigate(`/order/${order.id}`);
        }}
      />
    </div>
  );
}
