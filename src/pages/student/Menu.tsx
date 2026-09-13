import { useMemo, useState } from 'react';
import { ArrowRight, Flame, Sparkles, Utensils } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AddonModal } from '../../components/AddonModal';
import { FoodCard } from '../../components/FoodCard';
import { Badge, Button, Card, LinkButton, SectionHeading } from '../../components/ui';
import { useApp } from '../../lib/store';
import { kitchenStats } from '../../lib/selectors';
import { cls, inr } from '../../lib/utils';
import type { FoodItem } from '../../types';

export default function Menu() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  /** Set when a dish with add-ons is added, so the chooser can open first. */
  const [pending, setPending] = useState<{ food: FoodItem; qty: number } | null>(null);

  const stats = kitchenStats(state);
  const cartCount = state.cart.reduce((a, l) => a + l.qty, 0);
  const cartTotal = state.cart.reduce((a, l) => a + l.qty * l.price, 0);

  // Add-ons are ordered through the Kerala Meals chooser, never as their own card.
  const items = useMemo(() => state.menu.filter((f) => f.category !== 'Add-on'), [state.menu]);

  const addonItems = useMemo(
    () => (pending?.food.addons ?? []).map((id) => state.menu.find((f) => f.id === id)).filter(Boolean) as FoodItem[],
    [pending, state.menu],
  );

  function confirmAddons(addonIds: string[]) {
    if (!pending) return;
    dispatch({ type: 'ADD_TO_CART', foodId: pending.food.id, qty: pending.qty });
    addonIds.forEach((id) => dispatch({ type: 'ADD_TO_CART', foodId: id, qty: 1 }));
    setPending(null);
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Today's lunch menu"
        title="What's cooking at the Smart Canteen"
        subtitle="Four dishes, cooked fresh for lunch service. Availability reflects portions already prepped — it drops as orders come in."
        action={
          <div className="flex items-center gap-2">
            <Badge tone="brand">
              <Sparkles size={11} /> {stats.preOrdersToday} pre-orders today
            </Badge>
            <Badge tone="amber">
              <Utensils size={11} /> {stats.itemsToPrepare} portions queued
            </Badge>
          </div>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((food) => {
          const inCart = state.cart.find((l) => l.foodId === food.id)?.qty ?? 0;
          return (
            <FoodCard
              key={food.id}
              food={food}
              inCart={inCart}
              addonNames={(food.addons ?? [])
                .map((id) => state.menu.find((f) => f.id === id)?.name)
                .filter(Boolean) as string[]}
              onAdd={(qty) => {
                if (food.addons?.length) setPending({ food, qty });
                else dispatch({ type: 'ADD_TO_CART', foodId: food.id, qty });
              }}
            />
          );
        })}
      </div>

      <Card className="bg-slate-50">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <Flame size={14} className="text-orange-500" />
          <span>
            <strong className="text-slate-700">Tip for judges:</strong> add a Kerala Meals with a fish fry, then go to
            the{' '}
            <Link to="/kitchen/demand" className="font-bold text-emerald-700 hover:underline">
              Kitchen Demand Forecast
            </Link>{' '}
            — confirmed demand and the walk-in buffer update the moment you check out.
          </span>
        </div>
      </Card>

      {/* Sticky cart bar */}
      <div
        className={cls(
          'fixed inset-x-0 bottom-0 z-30 transition-transform duration-300',
          cartCount > 0 ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 p-3 pl-5 shadow-2xl">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-300">
                {cartCount} item{cartCount === 1 ? '' : 's'} in cart
              </p>
              <p className="font-display text-lg font-extrabold text-white">{inr(cartTotal)}</p>
            </div>
            <Button onClick={() => navigate('/cart')} size="lg">
              View cart & choose slot <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {cartCount > 0 && <div className="h-20" />}

      <div className="lg:hidden">
        <LinkButton to="/cart" variant="secondary" className="w-full">
          Go to cart
        </LinkButton>
      </div>

      <AddonModal
        open={pending !== null}
        food={pending?.food ?? null}
        qty={pending?.qty ?? 1}
        addonItems={addonItems}
        onConfirm={confirmAddons}
        onClose={() => setPending(null)}
      />
    </div>
  );
}
