import {
  BadgeCheck,
  CalendarClock,
  ChefHat,
  CircleCheck,
  Clock3,
  Flame,
  QrCode,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { OrderQR } from '../../components/OrderQR';
import { Badge, Card, EmptyState, LinkButton, SectionHeading, StatusBadge } from '../../components/ui';
import { useApp } from '../../lib/store';
import { kitchenStats } from '../../lib/selectors';
import { PREP_META, cls, dateTime, inr, orderStatusOf, slotLabel } from '../../lib/utils';
import type { PrepStatus } from '../../types';

const FLOW: PrepStatus[] = ['confirmed', 'preparing', 'ready', 'collected'];

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { state } = useApp();
  const order = state.orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Digital token" title="Order not found" />
        <EmptyState
          icon={<QrCode size={38} />}
          title="We couldn't find that order"
          body="The order ID in the link does not exist in this demo session."
          action={<LinkButton to="/orders">See my orders</LinkButton>}
        />
      </div>
    );
  }

  const slot = state.slots.find((s) => s.id === order.slotId);
  const status = orderStatusOf(order);
  const meta = PREP_META[status];
  const stats = kitchenStats(state);
  const queueAhead = state.orders.filter(
    (o) =>
      o.slotId === order.slotId &&
      !o.redeemed &&
      o.createdAt < order.createdAt &&
      o.paymentStatus === 'paid',
  ).length;

  const currentIndex = FLOW.indexOf(status);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Payment successful"
        title="Your Digital Food Token"
        subtitle="Show this QR code at the Smart Canteen collection counter. It is unique to this order and can only be redeemed once."
        action={
          <Badge tone={order.redeemed ? 'slate' : 'brand'}>
            <Sparkles size={11} /> {order.redeemed ? 'Redeemed' : 'Active token'}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        {/* Token */}
        <Card className={cls('relative overflow-hidden', order.redeemed && 'bg-slate-50')}>
          <div
            className={cls('absolute inset-x-0 top-0 h-1', order.redeemed ? 'bg-slate-300' : 'bg-emerald-500')}
          />
          <div className="flex flex-col items-center pt-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              <QrCode size={13} /> Scan at the counter
            </div>

            <div className="relative mt-4">
              <OrderQR order={order} dimmed={order.redeemed} />
              {order.redeemed && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="rotate-[-14deg] rounded-xl border-4 border-rose-500 px-4 py-1.5 font-display text-xl font-extrabold tracking-wider text-rose-500">
                    REDEEMED
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-center">
              <p className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase">
                Collection window
              </p>
              <p className="font-display text-2xl font-extrabold tracking-tight text-white">
                {slot ? slotLabel(slot) : '—'}
              </p>
            </div>

            <div className="mt-4 grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Order ID</p>
                <p className="font-mono text-[13px] font-bold text-slate-900">{order.id}</p>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">Status</p>
                <p className={cls('text-[13px] font-bold', meta.text)}>
                  {meta.emoji} {meta.label}
                </p>
              </div>
            </div>

            {order.redeemed && order.collectedAt ? (
              <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl bg-slate-100 px-3.5 py-3">
                <CircleCheck size={15} className="mt-0.5 shrink-0 text-slate-500" />
                <p className="text-[12px] leading-relaxed text-slate-600">
                  Collected at <strong>{dateTime(order.collectedAt)}</strong>
                  {order.collectedOnTime === false && (
                    <span className="font-semibold text-amber-700"> (outside the preferred window)</span>
                  )}
                  . This token can no longer be redeemed.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-3">
                <ScanLine size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] leading-relaxed text-emerald-800">
                  Take this to the{' '}
                  <a href="#/scanner" className="font-bold underline">
                    Smart Collection Scanner
                  </a>{' '}
                  when you are ready to collect.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Status + receipt */}
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-slate-900">
                <ChefHat size={16} className="text-slate-400" /> Live kitchen status
              </h3>
              <StatusBadge status={status} />
            </div>

            <div className="mt-5 space-y-0">
              {FLOW.map((step, i) => {
                const stepMeta = PREP_META[step];
                const done = i < currentIndex;
                const active = i === currentIndex;
                return (
                  <div key={step} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={cls(
                          'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                          done
                            ? 'bg-emerald-500 text-white'
                            : active
                              ? cls(stepMeta.bg, stepMeta.text, 'ring-2 ring-current/20')
                              : 'bg-slate-100 text-slate-400',
                        )}
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      {i < FLOW.length - 1 && (
                        <span className={cls('my-0.5 h-7 w-0.5 rounded', done ? 'bg-emerald-400' : 'bg-slate-200')} />
                      )}
                    </div>
                    <div className="pb-1.5">
                      <p
                        className={cls(
                          'text-[13px] font-bold',
                          active ? 'text-slate-900' : done ? 'text-slate-500' : 'text-slate-400',
                        )}
                      >
                        {stepMeta.emoji} {stepMeta.label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {step === 'confirmed' && 'Payment received, order queued for the kitchen.'}
                        {step === 'preparing' && 'A cook has picked up your order.'}
                        {step === 'ready' && 'Plated and waiting at the collection counter.'}
                        {step === 'collected' && 'Handed over — token redeemed.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!order.redeemed && order.prepStatus !== 'ready' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[12px] font-semibold text-slate-600">
                <Clock3 size={14} className="text-slate-400" />
                {queueAhead > 0
                  ? `${queueAhead} order${queueAhead === 1 ? '' : 's'} ahead of you in this window.`
                  : 'You are next in this collection window.'}
                <span className="ml-auto text-slate-400">{stats.itemsToPrepare} portions in the queue</span>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">
              Order receipt
            </h3>
            <ul className="mt-3 divide-y divide-slate-100">
              {order.items.map((line) => (
                <li key={line.foodId} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-700">
                    <span className="text-lg">{line.emoji}</span>
                    {line.name}
                    <span className="text-slate-400">× {line.qty}</span>
                  </span>
                  <span className="text-[13px] font-bold text-slate-900">{inr(line.price * line.qty)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 space-y-2 border-t border-dashed border-slate-200 pt-3 text-[12px]">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              {order.schedulingAdjustment > 0 && (
                <Row
                  label="Scheduling adjustment"
                  value={`+${inr(order.schedulingAdjustment)}`}
                  tone="amber"
                />
              )}
              <Row label="Paid via" value={order.paymentMethod ?? 'UPI'} />
              <Row label="Transaction ID" value={order.txnId ?? '—'} mono />
              <Row label="Ordered at" value={dateTime(order.createdAt)} />
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-3.5">
              <span className="font-display text-sm font-bold text-slate-700">Amount paid</span>
              <span className="font-display text-2xl font-extrabold tracking-tight text-emerald-700">
                {inr(order.total)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[12px] font-semibold text-emerald-700">
              <BadgeCheck size={14} /> Payment verified · order confirmed
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <LinkButton to="/scanner" variant="dark">
              <ScanLine size={15} /> Go to Scanner
            </LinkButton>
            <LinkButton to="/orders" variant="secondary">
              My Orders
            </LinkButton>
            <LinkButton to="/menu" variant="ghost">
              <Flame size={14} /> Order something else
            </LinkButton>
          </div>

          <Card className="bg-slate-50">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-slate-400 uppercase">
              <CalendarClock size={13} /> Slot policy reminder
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
              Collection windows distribute the crowd — they are not a deadline. If you arrive late your order
              is still handed over. Repeated off-slot collection is tracked and may add a{' '}
              {inr(state.settings.penaltyAmount)} scheduling adjustment to future orders.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'amber';
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span
        className={cls(
          'font-semibold',
          mono && 'font-mono text-[11px]',
          tone === 'amber' ? 'text-amber-700' : 'text-slate-800',
        )}
      >
        {value}
      </span>
    </div>
  );
}
