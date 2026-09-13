import { useEffect, useState } from 'react';
import { UtensilsCrossed, X } from 'lucide-react';
import type { FoodItem } from '../types';
import { cls, inr } from '../lib/utils';
import { Button } from './ui';

/**
 * Kerala Meals accepts an optional egg or fish fry. Add-ons live in the menu
 * list so they price and forecast like any other dish, but they are only ever
 * reachable through this chooser — never as standalone cards.
 */
export function AddonModal({
  open,
  food,
  qty,
  addonItems,
  onConfirm,
  onClose,
}: {
  open: boolean;
  food: FoodItem | null;
  qty: number;
  addonItems: FoodItem[];
  onConfirm: (addonIds: string[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!open) setPicked([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !food) return null;

  const addonTotal = addonItems
    .filter((a) => picked.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);
  // Add-ons are added one portion at a time; the cart is where quantity is tuned.
  const total = food.price * qty + addonTotal;

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-rise relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
              <UtensilsCrossed size={16} />
            </span>
            <div>
              <p className="font-display text-sm font-extrabold text-white">Add something extra?</p>
              <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                Optional add-ons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <span className="text-3xl" aria-hidden>
              {food.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-slate-900">{food.name}</p>
              <p className="text-xs text-slate-500">
                {inr(food.price)} × {qty}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {addonItems.map((a) => {
              const active = picked.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  aria-pressed={active}
                  className={cls(
                    'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all',
                    active
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {a.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{a.name}</span>
                    <span className="block text-xs text-slate-500">{a.description}</span>
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">+{inr(a.price)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button className="flex-1" onClick={() => onConfirm(picked)}>
              Add to cart · {inr(total)}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            Not required — tap Add to cart to take the meals plain.
          </p>
        </div>
      </div>
    </div>
  );
}
