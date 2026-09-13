import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Download, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import type { Order } from '../types';
import { QR_PREFIX, cls } from '../lib/utils';

/**
 * Renders the scannable digital food token.
 * The QR payload is an opaque token — never the order contents.
 */
export function OrderQR({
  order,
  size = 186,
  dimmed = false,
}: {
  order: Order;
  size?: number;
  dimmed?: boolean;
}) {
  const [showRaw, setShowRaw] = useState(false);
  // A separate high-resolution canvas is kept off-screen purely so the download
  // is a clean PNG with a proper quiet zone — the SVG on screen stays crisp.
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${order.id}-food-token.png`;
    link.click();
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={cls(
          'relative rounded-2xl bg-white p-4 ring-1 ring-slate-200',
          dimmed && 'opacity-45 saturate-0',
        )}
      >
        <Corner className="-top-1.5 -left-1.5 border-t-3 border-l-3 rounded-tl-xl" />
        <Corner className="-top-1.5 -right-1.5 border-t-3 border-r-3 rounded-tr-xl" />
        <Corner className="-bottom-1.5 -left-1.5 border-b-3 border-l-3 rounded-bl-xl" />
        <Corner className="-bottom-1.5 -right-1.5 border-b-3 border-r-3 rounded-br-xl" />
        <QRCodeSVG
          value={order.qrToken}
          size={size}
          level="H"
          bgColor="#ffffff"
          fgColor="#0f172a"
          marginSize={0}
        />
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-[0.18em] text-slate-400">
          SMART CANTEEN · DIGITAL FOOD TOKEN
        </div>
      </div>

      <div className="mt-3 w-full max-w-xs text-center">
        <div className="font-display text-lg font-extrabold tracking-tight text-slate-900">{order.id}</div>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-800"
        >
          {showRaw ? <EyeOff size={12} /> : <Eye size={12} />}
          {showRaw ? 'Hide secure token' : 'Show secure token'}
        </button>
        {showRaw && (
          <code className="mt-1.5 block truncate rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-emerald-300">
            {order.qrToken}
          </code>
        )}

        <button
          type="button"
          onClick={handleDownload}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-slate-700"
        >
          <Download size={12} /> Download QR
        </button>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] leading-relaxed text-slate-400">
          <ShieldCheck size={11} /> Opaque token · maps to this order on the server · cannot be reused after
          collection
        </p>
      </div>

      <div className="hidden" aria-hidden="true">
        <QRCodeCanvas
          ref={canvasRef}
          value={order.qrToken}
          size={640}
          level="H"
          bgColor="#ffffff"
          fgColor="#0f172a"
          marginSize={4}
        />
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span className={cls('absolute h-6 w-6 border-emerald-500', className)} />;
}

export function tokenPreview(token: string): string {
  return token.startsWith(QR_PREFIX) ? `…${token.slice(QR_PREFIX.length)}` : token;
}
