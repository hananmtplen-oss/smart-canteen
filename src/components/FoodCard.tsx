import { useState } from 'react';
import { Check, Flame, Minus, Plus, ShoppingBag, TriangleAlert } from 'lucide-react';
import type { FoodItem } from '../types';
import { cls, inr } from '../lib/utils';
import { Badge, Button } from './ui';

export function FoodCard({
  food,
  inCart,
  addonNames = [],
  onAdd,
}: {
  food: FoodItem;
  inCart: number;
  /** Names of optional extras this dish accepts, shown as a hint. */
  addonNames?: string[];
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const soldOut = food.availableQty <= 0;
  const justAdded = inCart > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white card-shadow transition-all duration-200 hover:-translate-y-0.5 hover:card-shadow-lg">
      {/* Illustration */}
      <div className={cls('relative h-36 bg-gradient-to-br', food.gradient)}>
        <div className="absolute inset-0 bg-grid opacity-40 mix-blend-overlay" />
        <div
          className="absolute inset-0 flex items-center justify-center text-[64px] drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
          aria-hidden
        >
          {food.emoji}
        </div>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {food.tags.includes('Popular') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-orange-600 shadow-sm">
              <Flame size={11} /> POPULAR
            </span>
          )}
          {food.tags.includes('Limited') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 shadow-sm">
              <TriangleAlert size={11} /> LIMITED
            </span>
          )}
          {food.tags.includes('New') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
              NEW
            </span>
          )}
          {food.tags.includes('Veg') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-sm border border-emerald-600 p-[1px]">
                <span className="block h-full w-full rounded-full bg-emerald-600" />
              </span>
              VEG
            </span>
          )}
        </div>
        <div className="absolute right-3 bottom-3 rounded-xl bg-white/95 px-2.5 py-1 text-sm font-extrabold text-slate-900 shadow-sm backdrop-blur">
          {inr(food.price)}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] leading-snug font-bold text-slate-900">{food.name}</h3>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{food.description}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {soldOut ? (
            <Badge tone="rose">Sold out today</Badge>
          ) : food.availableQty <= 20 ? (
            <Badge tone="amber">
              <TriangleAlert size={11} /> Only {food.availableQty} left
            </Badge>
          ) : (
            <Badge tone="brand">
              <Check size={11} /> {food.availableQty} available
            </Badge>
          )}
          <Badge tone="slate">{food.category}</Badge>
          <Badge tone="slate">~{food.prepTimeMin} min</Badge>
        </div>

        {addonNames.length > 0 && (
          <p className="mt-2 text-[11px] font-semibold text-emerald-700">
            + optional {addonNames.join(' or ')}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="flex h-10 items-center rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={soldOut}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-900">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={soldOut || qty >= food.availableQty}
              onClick={() => setQty((q) => Math.min(food.availableQty, q + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>

          <Button
            size="sm"
            variant={justAdded ? 'secondary' : 'primary'}
            disabled={soldOut}
            className="flex-1"
            onClick={() => {
              onAdd(qty);
              setQty(1);
            }}
          >
            {justAdded ? (
              <>
                <Check size={14} /> Add more ({inCart})
              </>
            ) : (
              <>
                <ShoppingBag size={14} /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
