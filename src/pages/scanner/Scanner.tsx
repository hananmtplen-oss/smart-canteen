import { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  CircleCheck,
  Clock3,
  History,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Badge, Button, Card, SectionHeading, StatusBadge } from '../../components/ui';
import { simulatedTimestamp, useApp, useSimClock } from '../../lib/store';
import { scannableOrders } from '../../lib/selectors';
import { cls, clock12, dateTime, inr, makeQrToken, shortId, slotLabel } from '../../lib/utils';
import type { Order, ScanResult } from '../../types';

interface ScanOutcome {
  result: ScanResult;
  order: Order | null;
  token: string;
  onTime: boolean;
  arrivalMin: number;
  windowLabel: string;
  collected: boolean;
}

export default function Scanner() {
  const { state, dispatch } = useApp();
  const { simMin } = useSimClock();
  const [selectedId, setSelectedId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const handledNonce = useRef<number>(-1);

  const orders = scannableOrders(state);
  const active = orders.filter((o) => !o.redeemed);

  // Default the demo dropdown to something sensible.
  useEffect(() => {
    if (!selectedId && active.length > 0) setSelectedId(active[0].id);
  }, [selectedId, active]);

  const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

  async function performScan(target: { orderId?: string; token?: string }) {
    setScanning(true);
    setOutcome(null);
    await delay(target.token && !target.orderId ? 1550 : 1250);

    const order =
      (target.orderId ? state.orders.find((o) => o.id === target.orderId) : undefined) ??
      (target.token ? state.orders.find((o) => o.qrToken === target.token) : undefined) ??
      null;

    const token = target.token ?? order?.qrToken ?? `SMARTCANTEEN_ORDER_TOKEN_${shortId().toUpperCase()}`;
    const slot = order ? state.slots.find((s) => s.id === order.slotId) : undefined;
    const arrivalMin = simMin;
    const onTime = slot ? arrivalMin >= slot.startMin && arrivalMin <= slot.endMin + 4 : false;

    let result: ScanResult;
    if (!order || order.paymentStatus !== 'paid') result = 'invalid';
    else if (order.redeemed) result = 'redeemed';
    else if (order.prepStatus !== 'ready') result = 'not-ready';
    else result = 'verified';

    setScanning(false);
    dispatch({
      type: 'REGISTER_SCAN',
      event: {
        id: `SCAN-${shortId().toUpperCase()}`,
        at: simulatedTimestamp(state),
        token,
        orderId: order?.id ?? null,
        result,
        onTime,
        arrivalMin,
      },
    });

    setOutcome({
      result,
      order,
      token,
      onTime,
      arrivalMin,
      windowLabel: slot ? slotLabel(slot) : '—',
      collected: false,
    });
  }

  // Requests pushed in from the Hackathon Demo Control Panel.
  useEffect(() => {
    const req = state.scannerRequest;
    if (!req || req.nonce === handledNonce.current) return;
    handledNonce.current = req.nonce;
    let cancelled = false;
    void (async () => {
      if (req.kind === 'invalid') {
        await performScan({ token: makeQrToken() });
      } else if (req.kind === 'duplicate') {
        const target =
          state.orders.find((o) => o.redeemed) ?? state.orders.find((o) => o.id === req.orderId) ?? null;
        if (!cancelled && target) await performScan({ orderId: target.id });
      } else if (req.orderId) {
        await performScan({ orderId: req.orderId });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scannerRequest?.nonce]);

  const suggestedValid =
    active.find((o) => {
      const slot = state.slots.find((s) => s.id === o.slotId);
      return slot && simMin >= slot.startMin && simMin < slot.endMin;
    }) ?? active[0];

  function confirmCollection() {
    if (!outcome?.order) return;
    dispatch({ type: 'REDEEM_ORDER', orderId: outcome.order.id, arrivalMin: outcome.arrivalMin });
    setOutcome({ ...outcome, collected: true });
  }

  const redeemedToday = state.orders.filter((o) => o.redeemed).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Collection counter"
        title="Smart Collection Scanner"
        subtitle="The kiosk that validates every digital food token before a tray is handed over. One token, one collection — forever."
        action={
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">
              <BadgeCheck size={11} /> {redeemedToday} collected today
            </Badge>
            <Badge tone="slate">
              <Clock3 size={11} /> Kiosk clock {clock12(simMin)}
            </Badge>
          </div>
        }
      />

      {/* Kiosk */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 ring-1 ring-slate-800 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          {/* Viewfinder */}
          <div className="flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/10">
              <div className="absolute inset-0 bg-grid-dark opacity-40" />

              {/* Corner brackets */}
              <span className="absolute top-5 left-5 h-10 w-10 rounded-tl-2xl border-t-4 border-l-4 border-emerald-400/90" />
              <span className="absolute top-5 right-5 h-10 w-10 rounded-tr-2xl border-t-4 border-r-4 border-emerald-400/90" />
              <span className="absolute bottom-5 left-5 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-emerald-400/90" />
              <span className="absolute right-5 bottom-5 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-emerald-400/90" />

              {/* Fake QR target */}
              <div className="absolute inset-0 flex items-center justify-center">
                {scanning ? (
                  <div className="grid grid-cols-6 gap-1 opacity-70">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <span
                        key={i}
                        className={cls('h-4 w-4 rounded-[3px]', i % 3 === 0 ? 'bg-emerald-300' : 'bg-slate-700')}
                      />
                    ))}
                  </div>
                ) : (
                  <QrCode size={120} className="text-slate-700" strokeWidth={1.2} />
                )}
              </div>

              {/* Scanning line */}
              {scanning && (
                <>
                  <div className="absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-emerald-400/35 to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-1 animate-scanline bg-emerald-400 shadow-[0_0_22px_6px_rgba(52,211,153,0.65)]" />
                </>
              )}

              {!scanning && (
                <div className="absolute inset-x-0 bottom-6 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-emerald-300 uppercase">
                    Ready to scan
                  </span>
                </div>
              )}
            </div>

            <p className="mt-4 text-center font-display text-base font-extrabold text-white">
              {scanning ? 'Scanning…' : 'Scan Your Food QR'}
            </p>
            <p className="mt-1 text-center text-[11px] text-slate-400">
              Hold the student's QR inside the frame. Hardware scanner is simulated in this prototype.
            </p>

            <div className="mt-5 w-full space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                  Select demo order
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-[13px] font-semibold text-white outline-none focus:border-emerald-500"
                >
                  {active.length === 0 && <option value="">No active orders</option>}
                  {active.map((o) => {
                    const slot = state.slots.find((s) => s.id === o.slotId);
                    return (
                      <option key={o.id} value={o.id}>
                        {o.id} · {slot ? slotLabel(slot) : '—'} · {o.items.length} item(s)
                      </option>
                    );
                  })}
                </select>
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={scanning || !selectedId}
                onClick={() => void performScan({ orderId: selectedId })}
              >
                <ScanLine size={17} /> {scanning ? 'Scanning…' : 'Scan & Verify'}
              </Button>

              {suggestedValid && (
                <button
                  type="button"
                  disabled={scanning}
                  onClick={() => {
                    setSelectedId(suggestedValid.id);
                    void performScan({ orderId: suggestedValid.id });
                  }}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-40"
                >
                  ⚡ Quick scan the next ready order ({suggestedValid.id})
                </button>
              )}
            </div>

            <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                Or paste a token manually
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="SMARTCANTEEN_ORDER_TOKEN_…"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-3 font-mono text-[11px] text-emerald-300 outline-none focus:border-emerald-500"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!manualToken.trim() || scanning}
                  onClick={() => void performScan({ token: manualToken.trim() })}
                >
                  Verify
                </Button>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void performScan({ token: makeQrToken() })}
                  className="rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/30 ring-inset transition-colors hover:bg-rose-500/20"
                >
                  Demo: invalid token
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const already = state.orders.find((o) => o.redeemed);
                    if (already) void performScan({ token: already.qrToken });
                  }}
                  className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-300 ring-1 ring-amber-500/30 ring-inset transition-colors hover:bg-amber-500/20"
                >
                  Demo: duplicate scan
                </button>
              </div>
            </div>
          </div>

          {/* Result panel */}
          <div className="min-h-[420px]">
            {!outcome && !scanning && (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                  <ScanLine size={24} />
                </span>
                <p className="mt-4 font-display text-base font-bold text-white">Awaiting a scan</p>
                <p className="mt-1.5 max-w-sm text-[12px] leading-relaxed text-slate-400">
                  Pick an order from the dropdown and hit <strong className="text-slate-200">Scan &amp; Verify</strong>.
                  Try scanning the same token twice to see the anti-reuse protection.
                </p>
                <div className="mt-6 grid w-full max-w-md gap-2 text-left">
                  {[
                    'Does the token exist in the order book?',
                    'Was the payment successful?',
                    'Has this order already been collected?',
                    'Is the student inside their chosen window?',
                  ].map((q, i) => (
                    <div
                      key={q}
                      className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-2.5 text-[12px] text-slate-300"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300">
                        {i + 1}
                      </span>
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanning && (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-16 text-center">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 animate-ring rounded-full bg-emerald-500/25" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <ScanLine size={24} />
                  </span>
                </div>
                <p className="mt-5 font-display text-lg font-extrabold text-white">Verifying token…</p>
                <p className="mt-1 font-mono text-[11px] break-all text-emerald-300">
                  {state.orders.find((o) => o.id === selectedId)?.qrToken ?? manualToken}
                </p>
              </div>
            )}

            {outcome && !scanning && (
              <ResultPanel
                outcome={outcome}
                onConfirm={confirmCollection}
                onReset={() => setOutcome(null)}
                onRescan={() => void performScan({ orderId: outcome.order?.id })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Scan log */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card padded={false}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-slate-900">
                <History size={16} className="text-slate-400" /> Scan log
              </h3>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Every verification attempt is recorded, including rejected and duplicate scans.
              </p>
            </div>
            <Badge tone="slate">{state.scanLog.length} events</Badge>
          </div>

          <ul className="divide-y divide-slate-100">
            {[...state.scanLog].reverse().slice(0, 10).map((event) => {
              const tone =
                event.result === 'invalid'
                  ? 'rose'
                  : event.result === 'redeemed'
                    ? 'amber'
                    : event.result === 'not-ready'
                      ? 'violet'
                      : 'brand';
              return (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[12px] font-bold text-slate-800">
                      <span className="font-mono">{event.orderId ?? 'UNKNOWN'}</span>
                      <Badge tone={tone}>
                        {event.result === 'verified'
                          ? '✅ Verified'
                          : event.result === 'redeemed'
                            ? '❌ Already redeemed'
                            : event.result === 'not-ready'
                              ? '⚠️ Not ready'
                              : '❌ Invalid'}
                      </Badge>
                      {!event.onTime && event.result !== 'invalid' && <Badge tone="amber">Off-slot</Badge>}
                    </p>
                    <p className="mt-1 font-mono text-[10px] break-all text-slate-400">{event.token}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">{clock12(event.arrivalMin)}</span>
                </li>
              );
            })}
            {state.scanLog.length === 0 && (
              <li className="px-5 py-8 text-center text-[13px] text-slate-400">No scans recorded yet.</li>
            )}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight text-slate-900">
              <ShieldCheck size={16} className="text-slate-400" /> Validation rules
            </h3>
            <ul className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-slate-600">
              {[
                'The QR carries an opaque token, never the order contents.',
                'A token maps to exactly one order and can be redeemed once.',
                'A second scan reports ALREADY REDEEMED with the original time.',
                'Arriving outside the chosen window never blocks collection.',
                'Off-slot collections are logged for scheduling analysis.',
                'A failed or pending payment can never be collected.',
              ].map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {r}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="bg-slate-900 text-white">
            <p className="text-[11px] font-bold tracking-[0.16em] text-emerald-300 uppercase">
              Off-slot policy (reminder)
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
              Students arriving outside their window are <strong className="text-white">always served</strong>.
              The system records the event, and after {state.settings.penaltyThreshold} off-slot collections a{' '}
              {inr(state.settings.penaltyAmount)} scheduling adjustment can be added to future orders.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Current student record: {state.user.onSlotEvents} on-time · {state.user.offSlotEvents} off-slot.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ResultPanel({
  outcome,
  onConfirm,
  onReset,
  onRescan,
}: {
  outcome: ScanOutcome;
  onConfirm: () => void;
  onReset: () => void;
  onRescan: () => void;
}) {
  const { order, result, collected, onTime, windowLabel, arrivalMin } = outcome;

  /* ---------- collected / redeemed ---------- */
  if (result === 'redeemed' || collected) {
    const isDuplicate = result === 'redeemed' && !collected;
    return (
      <div
        className={cls(
          'animate-pop flex h-full flex-col justify-center rounded-3xl border px-6 py-10 text-center',
          isDuplicate ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10',
        )}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
          {isDuplicate ? '❌' : '✅'}
        </div>
        <h3
          className={cls(
            'mt-5 font-display text-2xl font-extrabold tracking-tight text-white',
          )}
        >
          {isDuplicate ? 'ALREADY REDEEMED' : 'COLLECTION CONFIRMED'}
        </h3>

        {isDuplicate ? (
          <>
            <p className="mt-2 text-sm text-rose-100">
              This order was already collected
              {order?.collectedAt ? ` at ${clock12(new Date(order.collectedAt).getHours() * 60 + new Date(order.collectedAt).getMinutes())}` : ''}.
            </p>
            <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-rose-100/80">
              This is the same protection against QR screenshot reuse: the token is invalidated the moment the
              order is handed over. Do not release a second tray.
            </p>
            <div className="mx-auto mt-5 w-full max-w-sm rounded-2xl bg-slate-950/50 p-4 text-left">
              <Row label="Order ID" value={order?.id ?? '—'} mono />
              <Row label="Student" value={order?.studentName ?? '—'} />
              <Row label="Items" value={order?.items.map((l) => `${l.emoji} ${l.name} ×${l.qty}`).join(', ') ?? '—'} />
              <Row
                label="Collected at"
                value={order?.collectedAt ? dateTime(order.collectedAt) : 'unknown'}
                last
              />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-emerald-100">
              Order <strong className="font-mono">{order?.id}</strong> handed over successfully.
            </p>
            <div className="mx-auto mt-5 w-full max-w-sm rounded-2xl bg-slate-950/50 p-4 text-left">
              <Row label="Order ID" value={order?.id ?? '—'} mono />
              <Row label="Items" value={order?.items.map((l) => `${l.emoji} ${l.name} ×${l.qty}`).join(', ') ?? '—'} />
              <Row label="Collection window" value={windowLabel} />
              <Row label="Arrival" value={clock12(arrivalMin)} />
              {!onTime && <Row label="Off-slot collection" value="Recorded" tone />}
              <Row label="Amount paid" value={order ? inr(order.total) : '—'} last />
            </div>
            <p className="mt-4 text-[12px] font-semibold text-emerald-200">
              🔴 This token is now REDEEMED and can never be used again.
            </p>
          </>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="secondary" onClick={onReset}>
            <ScanLine size={15} /> Scan next order
          </Button>
          {isDuplicate && (
            <Button variant="secondary" onClick={onRescan}>
              Re-scan this token
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ---------- invalid ---------- */
  if (result === 'invalid') {
    return (
      <div className="animate-pop flex h-full flex-col justify-center rounded-3xl border border-rose-500/30 bg-rose-500/10 px-6 py-10 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
          ❌
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white">INVALID TOKEN</h3>
        <p className="mt-2 text-sm text-rose-100">Order not found.</p>
        <p className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed text-rose-100/80">
          No order in the book matches this token, or the payment for it never completed. Nothing is handed over.
        </p>
        <div className="mx-auto mt-5 w-full max-w-sm rounded-2xl bg-slate-950/50 p-4 text-left">
          <Row label="Token" value={outcome.token} mono wrap />
          <Row label="Attempt time" value={clock12(arrivalMin)} last />
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={onReset}>
            <ScanLine size={15} /> Try another token
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- verified / not-ready ---------- */
  const notReady = result === 'not-ready';
  return (
    <div className="animate-pop space-y-4">
      {!onTime && order && (
        <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <TriangleAlert size={19} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-display text-sm font-extrabold tracking-wide text-amber-200 uppercase">
              ⚠️ Outside preferred collection window
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-amber-100/90">
              This order is valid and may still be collected. The student chose{' '}
              <strong className="text-white">{windowLabel}</strong> and is arriving at{' '}
              <strong className="text-white">{clock12(arrivalMin)}</strong>. The late arrival is logged as an
              off-slot collection event — food is never withheld.
            </p>
          </div>
        </div>
      )}

      <div
        className={cls(
          'rounded-3xl border px-6 py-8 text-center',
          notReady ? 'border-violet-500/30 bg-violet-500/10' : 'border-emerald-500/30 bg-emerald-500/10',
        )}
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl">
          {notReady ? '⏳' : '✅'}
        </div>
        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white">
          {notReady ? 'ORDER NOT PLATED YET' : 'ORDER VERIFIED'}
        </h3>
        <p className="mt-2 text-sm text-emerald-100/90">
          {notReady
            ? 'Payment is valid but the kitchen has not marked this order ready. You may still hand it over if the tray is prepared.'
            : 'Token valid, payment successful, order not yet collected.'}
        </p>

        <div className="mx-auto mt-5 w-full max-w-md rounded-2xl bg-slate-950/50 p-4 text-left">
          <Row label="Order ID" value={order?.id ?? '—'} mono />
          <Row label="Student" value={`${order?.studentName ?? '—'} · ${order?.studentId ?? ''}`} />
          <Row label="Items" value={order?.items.map((l) => `${l.emoji} ${l.name} ×${l.qty}`).join(', ') ?? '—'} />
          <Row label="Collection window" value={windowLabel} />
          <Row label="Arrival" value={clock12(arrivalMin)} />
          <Row label="Amount paid" value={order ? inr(order.total) : '—'} />
          <Row label="Transaction" value={order?.txnId ?? '—'} mono last />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Badge tone="brand">✅ Payment verified</Badge>
          {order && <StatusBadge status={order.prepStatus} />}
          <Badge tone={onTime ? 'brand' : 'amber'}>
            {onTime ? (
              <>
                <Timer size={11} /> Within window
              </>
            ) : (
              <>
                <CircleAlert size={11} /> Off-slot arrival
              </>
            )}
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onConfirm}>
            <CircleCheck size={17} /> CONFIRM COLLECTION
          </Button>
          <Button size="lg" variant="secondary" onClick={onReset}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert size={12} /> The token is invalidated the moment you confirm.
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} /> Student: {order?.studentName ?? '—'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles size={12} /> Demo kiosk · no hardware required
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  wrap,
  tone,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wrap?: boolean;
  tone?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cls(
        'flex items-baseline justify-between gap-4 py-1.5',
        !last && 'border-b border-white/10',
      )}
    >
      <span className="shrink-0 text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">{label}</span>
      <span
        className={cls(
          'text-right text-[12px] font-semibold',
          mono && 'font-mono text-[11px]',
          wrap ? 'break-all' : 'truncate',
          tone ? 'text-amber-300' : 'text-white',
        )}
      >
        {value}
      </span>
    </div>
  );
}
