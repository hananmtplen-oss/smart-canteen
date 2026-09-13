import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Wallet,
  X,
} from 'lucide-react';
import type { Order } from '../types';
import { Button } from './ui';
import { clock12, cls, dateTime, inr, minutesOfDay } from '../lib/utils';

type Method = 'UPI' | 'Card' | 'Wallet';
type Phase = 'method' | 'processing' | 'success' | 'failed';

const METHODS: Array<{ id: Method; label: string; icon: typeof Smartphone; hint: string }> = [
  { id: 'UPI', label: 'UPI', icon: Smartphone, hint: 'GPay · PhonePe · Paytm · BHIM' },
  { id: 'Card', label: 'Card', icon: CreditCard, hint: 'Debit / Credit · Visa, RuPay' },
  { id: 'Wallet', label: 'Wallet', icon: Wallet, hint: 'Campus wallet · Paytm wallet' },
];

const STEPS = [
  'Connecting to payment gateway…',
  'Authorising transaction…',
  'Confirming your order…',
];

export function PaymentModal({
  open,
  adjustment,
  total,
  slotLabel,
  itemCount,
  onPay,
  onClose,
  onViewToken,
}: {
  open: boolean;
  adjustment: number;
  total: number;
  slotLabel: string;
  itemCount: number;
  onPay: (method: Method) => { ok: boolean; order: Order | null };
  onClose: () => void;
  onViewToken: (order: Order) => void;
}) {
  const [method, setMethod] = useState<Method>('UPI');
  const [phase, setPhase] = useState<Phase>('method');
  const [step, setStep] = useState(0);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase('method');
      setStep(0);
      setOrder(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'processing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, phase, onClose]);

  if (!open) return null;

  const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

  async function runPayment() {
    setPhase('processing');
    for (let i = 0; i < STEPS.length; i += 1) {
      setStep(i);
      await delay(i === 0 ? 900 : 750);
    }
    const result = onPay(method);
    if (result.ok && result.order) {
      setOrder(result.order);
      setPhase('success');
    } else {
      setPhase('failed');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-rise relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <Lock size={16} />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-white">Secure Checkout</p>
              <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Mock gateway · demo only
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={phase === 'processing'}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount strip */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
          <div className="text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{itemCount} item(s)</span> · slot {slotLabel}
            {adjustment > 0 && (
              <span className="ml-1 font-semibold text-amber-700">· +{inr(adjustment)} scheduling</span>
            )}
          </div>
          <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900">{inr(total)}</div>
        </div>

        <div className="p-5">
          {phase === 'method' && (
            <div className="animate-rise">
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={cls(
                        'flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-all',
                        active
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <Icon size={20} className={active ? 'text-emerald-600' : 'text-slate-400'} />
                      <span
                        className={cls(
                          'text-[13px] font-bold',
                          active ? 'text-emerald-700' : 'text-slate-600',
                        )}
                      >
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-3">
                {method === 'UPI' && (
                  <>
                    <Field label="UPI ID">
                      <input
                        defaultValue="student@upi"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </Field>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                      <BadgeCheck size={13} /> Verified UPI handle · collect request will appear in your app
                    </div>
                  </>
                )}

                {method === 'Card' && (
                  <>
                    <Field label="Card number">
                      <input
                        defaultValue="4111 1111 1111 1111"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Expiry">
                        <input
                          defaultValue="12/28"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </Field>
                      <Field label="CVV">
                        <input
                          defaultValue="123"
                          type="password"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 tabular-nums outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </Field>
                    </div>
                  </>
                )}

                {method === 'Wallet' && (
                  <div className="space-y-2">
                    {[
                      { name: 'Campus Wallet', balance: 640, icon: Landmark },
                      { name: 'Paytm Wallet', balance: 312, icon: Wallet },
                    ].map((w) => {
                      const Icon = w.icon;
                      return (
                        <label
                          key={w.name}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition-colors hover:bg-slate-50"
                        >
                          <input type="radio" name="wallet" defaultChecked className="accent-emerald-600" />
                          <Icon size={17} className="text-slate-400" />
                          <span className="flex-1 text-sm font-semibold text-slate-700">{w.name}</span>
                          <span className="text-xs font-bold text-slate-500">Balance {inr(w.balance)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <Button size="lg" className="mt-6 w-full" onClick={() => void runPayment()}>
                <Lock size={15} /> Pay {inr(total)}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
                <ShieldCheck size={12} /> Demo gateway — no real money moves and no credentials are stored.
              </p>
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex flex-col items-center py-8">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ring" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <Loader2 size={26} className="animate-spin text-emerald-600" />
                </span>
              </div>
              <p className="mt-5 font-display text-base font-bold text-slate-900">{STEPS[step]}</p>
              <p className="mt-1 text-xs text-slate-400">Please do not close this window</p>

              <div className="mt-6 w-full max-w-xs space-y-2">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-2.5 text-xs">
                    <span
                      className={cls(
                        'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                        i < step
                          ? 'bg-emerald-500 text-white'
                          : i === step
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      {i < step ? '✓' : i + 1}
                    </span>
                    <span className={cls('font-medium', i <= step ? 'text-slate-700' : 'text-slate-400')}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'success' && order && (
            <div className="animate-rise text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
                ✅
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight text-emerald-700">
                PAYMENT SUCCESSFUL
              </h3>
              <p className="mt-1 text-xs text-slate-500">Your order is confirmed and the kitchen has been notified.</p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                <Receipt label="Transaction ID" value={order.txnId ?? '—'} mono />
                <Receipt label="Order ID" value={order.id} mono />
                <Receipt label="Amount paid" value={inr(order.total)} strong />
                <Receipt
                  label="Date / time"
                  value={`${dateTime(order.createdAt)}`}
                  last
                />
              </div>

              <Button size="lg" className="mt-5 w-full" onClick={() => onViewToken(order)}>
                View Digital Food Token →
              </Button>
              <p className="mt-3 text-[11px] text-slate-400">
                Keep this token ready — it is your only way to collect the order.
              </p>
            </div>
          )}

          {phase === 'failed' && (
            <div className="animate-rise text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">
                ❌
              </div>
              <h3 className="mt-4 font-display text-xl font-extrabold tracking-tight text-rose-700">
                PAYMENT FAILED
              </h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                The demo gateway declined this transaction. No order was created, no slot was consumed and no
                money was debited.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-left text-[11px] font-semibold text-amber-700">
                <TriangleAlert size={13} />
                Simulated failure triggered from the Demo Control Panel.
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => setPhase('method')}>
                  Try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold tracking-[0.1em] text-slate-500 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Receipt({
  label,
  value,
  mono,
  strong,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${last ? '' : 'border-b border-slate-200/70'}`}>
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      <span
        className={cls(
          'text-right text-slate-900',
          mono && 'font-mono text-xs',
          strong ? 'font-display text-base font-extrabold' : 'text-xs font-semibold',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function simulatedNowLabel(ts: number): string {
  return clock12(minutesOfDay(ts));
}
