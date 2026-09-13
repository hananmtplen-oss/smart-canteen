import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CrowdLevel, PrepStatus } from '../types';
import { CROWD_META, PREP_META, cls, percent } from '../lib/utils';

/* ============================================================================
   Shared UI kit — keeps every interface visually consistent.
   ========================================================================== */

export type Tone = 'brand' | 'amber' | 'rose' | 'sky' | 'slate' | 'violet' | 'dark';

const TONE_BADGE: Record<Tone, string> = {
  brand: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  dark: 'bg-slate-900 text-white ring-slate-800',
};

const TONE_BAR: Record<Tone, string> = {
  brand: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
  violet: 'bg-violet-500',
  dark: 'bg-slate-900',
};

/* ---------- Card ---------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cls(
        'rounded-2xl border border-slate-200/80 bg-white card-shadow',
        padded && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cls('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Buttons ---------- */

export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'ghost' | 'danger' | 'amber';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/25',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm',
  secondary:
    'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 active:bg-slate-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-600/25',
  amber: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm shadow-amber-500/25',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cls(
    'inline-flex select-none items-center justify-center font-semibold transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:bg-current',
    VARIANT[variant],
    SIZE[size],
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button {...rest} className={buttonClass(variant, size, className)} />;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link to={to} onClick={onClick} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ---------- Badges ---------- */

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset',
        TONE_BADGE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CrowdBadge({ level, className }: { level: CrowdLevel; className?: string }) {
  const meta = CROWD_META[level];
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ring-1 ring-inset',
        meta.bg,
        meta.text,
        meta.ring,
        className,
      )}
    >
      <span className={cls('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: PrepStatus; className?: string }) {
  const meta = PREP_META[status];
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ring-slate-200',
        meta.bg,
        meta.text,
        className,
      )}
    >
      <span className={cls('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

export function SlotStatusBadge({ status }: { status: 'Available' | 'Low' | 'Busy' | 'Full' }) {
  const map: Record<string, { tone: Tone; dot: string }> = {
    Available: { tone: 'brand', dot: 'bg-emerald-500' },
    Low: { tone: 'sky', dot: 'bg-sky-500' },
    Busy: { tone: 'amber', dot: 'bg-amber-500' },
    Full: { tone: 'rose', dot: 'bg-rose-500' },
  };
  const meta = map[status];
  return (
    <Badge tone={status === 'Full' ? 'rose' : meta.tone}>
      <span className={cls('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {status}
    </Badge>
  );
}

/* ---------- Progress ---------- */

export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  className,
  height = 'h-2.5',
  animated = true,
}: {
  value: number;
  max?: number;
  tone?: Tone;
  className?: string;
  height?: string;
  animated?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, percent(value, max)));
  return (
    <div className={cls('w-full overflow-hidden rounded-full bg-slate-100', height, className)}>
      <div
        className={cls(
          'h-full rounded-full',
          TONE_BAR[tone],
          animated && 'transition-[width] duration-700 ease-out',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function barTone(load: number): Tone {
  if (load >= 100) return 'rose';
  if (load >= 82) return 'amber';
  if (load >= 50) return 'sky';
  return 'brand';
}

/* ---------- Stat card ---------- */

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'slate',
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  accent?: boolean;
}) {
  return (
    <div
      className={cls(
        'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 card-shadow sm:p-5',
        accent && 'ring-1 ring-emerald-100',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
          <div className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
            {value}
          </div>
          {sub && <div className="mt-1 text-xs font-medium text-slate-500">{sub}</div>}
        </div>
        {icon && (
          <div className={cls('shrink-0 rounded-xl p-2.5 ring-1 ring-inset', TONE_BADGE[tone])}>{icon}</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition-colors hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      </span>
      <span
        className={cls(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-emerald-500' : 'bg-slate-300',
        )}
      >
        <span
          className={cls(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <p className="font-display text-base font-bold text-slate-700">{title}</p>
      {body && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function InfoCard({
  icon,
  title,
  children,
  tone = 'sky',
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cls(
        'rounded-2xl border border-slate-200/80 bg-white p-4 ring-1 ring-inset card-shadow sm:p-5',
        TONE_BADGE[tone].split(' ')[2],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cls('rounded-xl p-2 ring-1 ring-inset', TONE_BADGE[tone])}>{icon}</div>
        )}
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-slate-900">{title}</p>
          <div className="mt-1 text-[13px] leading-relaxed text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <span className="text-right text-[13px] font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cls(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white ring-2 ring-white',
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; badge?: ReactNode }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="scroll-x-hide flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cls(
            'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-all',
            value === tab.id
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {tab.label}
          {tab.badge}
        </button>
      ))}
    </div>
  );
}
