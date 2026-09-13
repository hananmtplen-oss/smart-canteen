import { ArrowRight, CalendarClock, Clock3, QrCode, Receipt, ScanLine } from 'lucide-react';
import { OrderQR } from '../../components/OrderQR';
import { Badge, Card, EmptyState, LinkButton, SectionHeading, StatusBadge } from '../../components/ui';
import { useApp } from '../../lib/store';
import { userOrders } from '../../lib/selectors';
import { cls, dateTime, inr, longDate, orderStatusOf, slotLabel } from '../../lib/utils';

export default function MyOrders() {
  const { state } = useApp();
  const all = userOrders(state);
  const active = all.filter((o) => !o.redeemed);
  const history = all.filter((o) => o.redeemed);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your orders"
        title="My Orders"
        subtitle="Live tokens, kitchen progress and your full collection history."
        action={<Badge tone="brand">{all.length} total orders</Badge>}
      />

      {/* ---------------- Current order ---------------- */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-extrabold tracking-wide text-slate-500 uppercase">
          <QrCode size={15} /> Current Order
        </h3>

        {active.length === 0 ? (
          <EmptyState
            icon={<Receipt size={36} />}
            title="No active orders right now"
            body="Once you pre-order and pay, your QR token will appear here with live kitchen updates."
            action={<LinkButton to="/menu">Order lunch</LinkButton>}
          />
        ) : (
          <div className="space-y-5">
            {active.map((order) => {
              const slot = state.slots.find((s) => s.id === order.slotId);
              const status = orderStatusOf(order);
              return (
                <Card key={order.id} className="overflow-hidden">
                  <div className="grid gap-6 lg:grid-cols-[240px_1fr_auto] lg:items-center">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <OrderQR order={order} size={150} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-extrabold tracking-tight text-slate-900">
                          {order.id}
                        </span>
                        <StatusBadge status={status} />
                        {order.isDemo && <Badge tone="violet">Placed in this demo</Badge>}
                      </div>

                      <ul className="mt-3 space-y-1.5">
                        {order.items.map((l) => (
                          <li key={l.foodId} className="flex items-center gap-2 text-[13px] text-slate-600">
                            <span className="text-base">{l.emoji}</span>
                            <span className="font-semibold text-slate-800">{l.name}</span>
                            <span className="text-slate-400">× {l.qty}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[12px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                          <CalendarClock size={13} className="text-slate-400" />
                          {slot ? slotLabel(slot) : '—'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                          ✅ Payment successful
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                          <Clock3 size={13} className="text-slate-400" />
                          Ordered {dateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:items-end">
                      <span className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                        {inr(order.total)}
                      </span>
                      <LinkButton to={`/order/${order.id}`} size="sm">
                        View token <ArrowRight size={14} />
                      </LinkButton>
                      <LinkButton to="/scanner" variant="secondary" size="sm">
                        <ScanLine size={14} /> Simulate collection
                      </LinkButton>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- History ---------------- */}
      <section>
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-extrabold tracking-wide text-slate-500 uppercase">
          <Receipt size={15} /> Order History
        </h3>

        {history.length === 0 ? (
          <EmptyState icon={<Receipt size={34} />} title="No past orders yet" />
        ) : (
          <Card padded={false}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Food</th>
                    <th className="px-5 py-3.5">Slot</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((order) => {
                    const slot = state.slots.find((s) => s.id === order.slotId);
                    return (
                      <tr key={order.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 font-semibold whitespace-nowrap text-slate-600">
                          {longDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-800">
                            {order.items.map((l) => `${l.emoji} ${l.name}`).join(', ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium whitespace-nowrap text-slate-500">
                          {slot ? slotLabel(slot) : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{inr(order.total)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status="collected" />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-mono text-[11px] text-slate-400">{order.id}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {history.map((order) => {
                const slot = state.slots.find((s) => s.id === order.slotId);
                return (
                  <li key={order.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] font-bold text-slate-400">{order.id}</span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {longDate(order.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-slate-800">
                      {order.items.map((l) => `${l.emoji} ${l.name}`).join(', ')}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={cls('text-[11px] font-semibold text-slate-500')}>
                        {slot ? slotLabel(slot) : '—'} · {order.total ? inr(order.total) : ''}
                      </span>
                      <StatusBadge status="collected" />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
