import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, TriangleAlert } from 'lucide-react';
import { Badge, Button, Card, EmptyState, LinkButton, SectionHeading } from '../../components/ui';
import { useApp } from '../../lib/store';
import { cartSubtotal } from '../../lib/store';
import { inr } from '../../lib/utils';

export default function Cart() {
  const { state, dispatch } = useApp();
  const subtotal = cartSubtotal(state.cart);
  const count = state.cart.reduce((a, l) => a + l.qty, 0);
  const gst = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  if (state.cart.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Your cart" title="Shopping Cart" />
        <EmptyState
          icon={<ShoppingBag size={40} />}
          title="Your cart is empty"
          body="Add a few items from today's menu and pick a collection window to skip the queue."
          action={<LinkButton to="/menu">Browse the menu</LinkButton>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Step 1 of 3"
        title="Shopping Cart"
        subtitle="Review your items, then choose a 12-minute collection window."
        action={<Badge tone="brand">{count} item{count === 1 ? '' : 's'}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Card padded={false}>
          <ul className="divide-y divide-slate-100">
            {state.cart.map((line) => {
              const food = state.menu.find((f) => f.id === line.foodId);
              const limit = Math.max(1, food?.availableQty ?? 99);
              return (
                <li key={line.foodId} className="flex items-center gap-4 p-4 sm:p-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 text-2xl">
                    {line.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-slate-900">{line.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {inr(line.price)} each · {line.qty} × {inr(line.price)} ={' '}
                      <span className="font-bold text-slate-800">{inr(line.price * line.qty)}</span>
                    </p>
                    {limit <= 20 && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <TriangleAlert size={11} /> only {limit} portions left today
                      </p>
                    )}
                  </div>

                  <div className="flex h-10 items-center rounded-xl bg-slate-100 p-1">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() =>
                        dispatch({ type: 'SET_CART_QTY', foodId: line.foodId, qty: line.qty - 1 })
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums text-slate-900">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      disabled={line.qty >= limit}
                      onClick={() =>
                        dispatch({ type: 'SET_CART_QTY', foodId: line.foodId, qty: line.qty + 1 })
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'REMOVE_FROM_CART', foodId: line.foodId })}
                    className="rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
            <LinkButton to="/menu" variant="ghost" size="sm">
              + Add more items
            </LinkButton>
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'CLEAR_CART' })}>
              Clear cart
            </Button>
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-[136px]">
          <Card>
            <h3 className="font-display text-base font-extrabold tracking-tight text-slate-900">Bill summary</h3>

            <div className="mt-4 space-y-2.5">
              {state.cart.map((line) => (
                <div key={line.foodId} className="flex items-baseline justify-between text-[13px]">
                  <span className="text-slate-600">
                    {line.name} <span className="text-slate-400">× {line.qty}</span>
                  </span>
                  <span className="font-semibold text-slate-800">{inr(line.price * line.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-dashed border-slate-200 pt-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Item total</span>
                <span className="font-semibold text-slate-800">{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Taxes & charges (5%)</span>
                <span className="font-semibold text-slate-800">{inr(Math.round(gst))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Packaging</span>
                <span className="font-semibold text-emerald-600">Free</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-slate-200 pt-4">
              <span className="font-display text-sm font-bold text-slate-700">Total</span>
              <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                {inr(Math.round(total))}
              </span>
            </div>

            <LinkButton to="/slots" size="lg" className="mt-5 w-full">
              Continue to Select Collection Slot <ArrowRight size={16} />
            </LinkButton>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              You will pick your collection window on the next step.
            </p>
          </Card>

          <Card className="bg-emerald-50/60 ring-1 ring-emerald-100 ring-inset">
            <p className="text-[11px] font-bold tracking-[0.14em] text-emerald-700 uppercase">
              Why slots matter
            </p>
            <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
              The canteen serves 180 people at once but only has seating for far fewer. Spreading orders across
              six 12-minute windows is what removes the standing-outside-and-eating problem.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
