import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChefHat,
  Clock,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  MonitorPlay,
  QrCode,
  ScanLine,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Users,
} from 'lucide-react';
import { useApp, useSimClock } from '../lib/store';
import { crowdOf } from '../lib/selectors';
import { CROWD_META, clock12, cls } from '../lib/utils';
import { Avatar } from './ui';

type ModeId = 'student' | 'kitchen' | 'scanner' | 'demo';

const MODES: Array<{ id: ModeId; to: string; label: string; short: string; icon: typeof Store }> = [
  { id: 'student', to: '/', label: 'Student', short: 'Student', icon: GraduationCap },
  { id: 'kitchen', to: '/kitchen', label: 'Kitchen', short: 'Kitchen', icon: ChefHat },
  { id: 'scanner', to: '/scanner', label: 'Scanner', short: 'Scan', icon: ScanLine },
  { id: 'demo', to: '/demo', label: 'Demo Panel', short: 'Demo', icon: SlidersHorizontal },
];

const STUDENT_NAV = [
  { to: '/', label: 'Home', icon: Store, end: true },
  { to: '/menu', label: 'Menu', icon: ShoppingBag, end: false },
  { to: '/orders', label: 'My Orders', icon: ClipboardList, end: false },
  { to: '/crowd', label: 'Crowd Status', icon: Users, end: false },
  { to: '/analytics', label: 'Analytics', icon: LineChart, end: false },
  { to: '/how-it-works', label: 'How It Works', icon: HelpCircle, end: false },
];

const KITCHEN_NAV = [
  { to: '/kitchen', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/kitchen/queue', label: 'Live Order Queue', icon: ClipboardList, end: false },
  { to: '/kitchen/demand', label: 'Demand Forecast', icon: BarChart3, end: false },
  { to: '/kitchen/slots', label: 'Slot Demand', icon: Clock, end: false },
  { to: '/kitchen/occupancy', label: 'Occupancy', icon: Users, end: false },
];

const SCANNER_NAV = [{ to: '/scanner', label: 'Smart Collection Scanner', icon: QrCode, end: true }];

const DEMO_NAV = [{ to: '/demo', label: 'Hackathon Demo Control Panel', icon: MonitorPlay, end: true }];

function modeFromPath(pathname: string): ModeId {
  if (pathname.startsWith('/kitchen')) return 'kitchen';
  if (pathname.startsWith('/scanner')) return 'scanner';
  if (pathname.startsWith('/demo')) return 'demo';
  return 'student';
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useApp();
  const { simMin } = useSimClock();
  const location = useLocation();
  const mode = modeFromPath(location.pathname);
  const cartCount = state.cart.reduce((acc, l) => acc + l.qty, 0);
  const crowd = CROWD_META[crowdOf(state)];

  const nav =
    mode === 'kitchen'
      ? KITCHEN_NAV
      : mode === 'scanner'
        ? SCANNER_NAV
        : mode === 'demo'
          ? DEMO_NAV
          : STUDENT_NAV;

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Row 1 — brand + live status */}
          <div className="flex h-16 items-center justify-between gap-3">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-lg shadow-md shadow-emerald-600/25">
                <span aria-hidden>🍲</span>
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-[15px] font-extrabold tracking-tight text-slate-900">
                  SMART CANTEEN
                </span>
                <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:block">
                  Pre-order · Crowd control · Demand planning
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-flex">
                <Clock size={13} className="text-slate-400" />
                <span className="tabular-nums">{clock12(simMin)}</span>
              </span>

              <span
                className={cls(
                  'hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide ring-1 ring-inset md:inline-flex',
                  crowd.bg,
                  crowd.text,
                  crowd.ring,
                )}
              >
                <span className={cls('h-1.5 w-1.5 rounded-full', crowd.dot)} />
                {state.occupancy.current}/{state.occupancy.max}
              </span>

              {mode === 'student' && (
                <Link
                  to="/cart"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                  aria-label="Cart"
                >
                  <ShoppingBag size={17} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-3 pl-1">
                <Avatar name={state.user.name} className="h-8 w-8" />
                <span className="hidden text-xs leading-tight sm:block">
                  <span className="block font-bold text-slate-800">{state.user.name.split(' ')[0]}</span>
                  <span className="block text-[10px] font-medium text-slate-400">{state.user.studentId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 — interface switcher + contextual nav */}
          <div className="scroll-x-hide flex items-center gap-2 overflow-x-auto pb-3">
            <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 p-1">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <Link
                    key={m.id}
                    to={m.to}
                    className={cls(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition-all',
                      active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{m.label}</span>
                    <span className="sm:hidden">{m.short}</span>
                  </Link>
                );
              })}
            </div>

            <span className="h-6 w-px shrink-0 bg-slate-200" />

            <nav className="flex shrink-0 items-center gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const isCart = item.to === '/cart';
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cls(
                        'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
                      )
                    }
                  >
                    <Icon size={15} />
                    {item.label}
                    {isCart && cartCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                        {cartCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-medium">
            <span className="font-display font-bold text-slate-700">Smart Canteen</span> — hackathon prototype.
            Payments, QR scanners and ESP32 Time-of-Flight occupancy sensors are <strong>simulated</strong>.
          </p>
          <p className="text-slate-400">No facial recognition · No phone tracking · Anonymous occupancy only</p>
        </div>
      </footer>
    </div>
  );
}
