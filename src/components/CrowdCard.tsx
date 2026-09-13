import { Activity, Radio } from 'lucide-react';
import { useApp, useSimClock } from '../lib/store';
import { crowdOf, occupancyPercent } from '../lib/selectors';
import { CROWD_META, cls, clock12 } from '../lib/utils';
import { Card } from './ui';

const THRESHOLDS: Array<{ level: 'LOW' | 'MODERATE' | 'HIGH'; range: string }> = [
  { level: 'LOW', range: '0–40%' },
  { level: 'MODERATE', range: '41–75%' },
  { level: 'HIGH', range: '76–100%' },
];

export function CrowdCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { state } = useApp();
  const { simMin } = useSimClock();
  const level = crowdOf(state);
  const meta = CROWD_META[level];
  const pct = occupancyPercent(state);
  const lastUpdate = clock12(simMin);

  return (
    <Card className={cls('relative overflow-hidden', className)} padded={!compact}>
      <div className={cls('absolute inset-x-0 top-0 h-1', meta.bar)} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
            <Activity size={13} /> Canteen Status
          </div>
          <div
            className={cls(
              'mt-2 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide ring-1 ring-inset',
              meta.bg,
              meta.text,
              meta.ring,
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className={cls('absolute inline-flex h-full w-full rounded-full opacity-70', meta.dot, 'animate-ring')} />
              <span className={cls('relative inline-flex h-2 w-2 rounded-full', meta.dot)} />
            </span>
            {meta.emoji} {meta.label}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Estimated occupancy</div>
          <div className="font-display text-3xl leading-none font-extrabold tracking-tight text-slate-900">
            {state.occupancy.current}
            <span className="text-base font-bold text-slate-400"> / {state.occupancy.max}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400">people</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>{pct}% full</span>
          <span className="inline-flex items-center gap-1">
            <Radio size={11} className="text-emerald-500" /> live sensor feed · {lastUpdate}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cls('h-full rounded-full transition-[width] duration-700 ease-out', meta.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {THRESHOLDS.map((t) => {
          const m = CROWD_META[t.level];
          const active = t.level === level;
          return (
            <div
              key={t.level}
              className={cls(
                'rounded-xl border px-2.5 py-2 text-center transition-all',
                active ? cls(m.bg, m.ring, 'border-transparent ring-1') : 'border-slate-200 bg-white',
              )}
            >
              <div className={cls('text-[10px] font-extrabold uppercase', active ? m.text : 'text-slate-400')}>
                {m.emoji} {t.level}
              </div>
              <div className={cls('mt-0.5 text-[10px] font-semibold', active ? m.text : 'text-slate-400')}>
                {t.range}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3.5 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
        Occupancy is estimated using anonymous entrance/exit counting sensors. No cameras, no facial
        recognition and no personal device tracking.
      </p>
    </Card>
  );
}
