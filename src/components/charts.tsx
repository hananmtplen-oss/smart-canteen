import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DemandRow, SlotDemandRow } from '../types';
import { clock12, slotLabel } from '../lib/utils';

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 12px 28px -16px rgba(15,23,42,0.35)',
  padding: '8px 12px',
} as const;

const AXIS = { fontSize: 11, fill: '#94a3b8' } as const;

export const CHART_COLORS = [
  '#059669',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
  '#ec4899',
];

/* ---------- Occupancy trend ---------- */

export function OccupancyTrendChart({
  readings,
  max,
  height = 200,
}: {
  readings: Array<{ t: number; count: number }>;
  max: number;
  height?: number;
}) {
  const data = readings.map((r) => {
    const d = new Date(r.t);
    return {
      label: clock12(d.getHours() * 60 + d.getMinutes()).replace(' ', ''),
      count: r.count,
      capacity: max,
    };
  });

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={26} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={[0, max]} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ fontWeight: 700, color: '#0f172a' }} />
          <Area
            type="monotone"
            dataKey="count"
            name="People inside"
            stroke="#059669"
            strokeWidth={2.5}
            fill="url(#occFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Slot demand bars ---------- */

export function SlotDemandChart({ rows, height = 240 }: { rows: SlotDemandRow[]; height?: number }) {
  const data = rows.map((r) => ({
    label: slotLabel(r.slot),
    booked: r.booked,
    capacity: r.capacity,
    orders: r.orders,
    util: r.utilization,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ fontWeight: 700, color: '#0f172a' }} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
          <Bar dataKey="capacity" name="Capacity" fill="#e2e8f0" radius={[6, 6, 0, 0]} maxBarSize={30} />
          <Bar dataKey="booked" name="Booked" radius={[6, 6, 0, 0]} maxBarSize={30}>
            {data.map((d) => (
              <Cell
                key={d.label}
                fill={d.util >= 100 ? '#ef4444' : d.util >= 82 ? '#f59e0b' : d.util >= 50 ? '#0ea5e9' : '#10b981'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Food demand bars ---------- */

export function FoodDemandChart({ rows, height = 260 }: { rows: DemandRow[]; height?: number }) {
  const data = rows
    .filter((r) => r.qty > 0)
    .map((r) => ({
      label: r.food.name.replace(' (Cutlet / Roll)', ''),
      confirmed: r.qty,
      recommended: r.recommended,
    }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }} barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={118} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ fontWeight: 700, color: '#0f172a' }} cursor={{ fill: '#f8fafc' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
          <Bar dataKey="confirmed" name="Confirmed orders" fill="#059669" radius={[0, 5, 5, 0]} maxBarSize={13} />
          <Bar dataKey="recommended" name="Recommended prep (+buffer)" fill="#fbbf24" radius={[0, 5, 5, 0]} maxBarSize={13} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Food demand donut ---------- */

export function DemandDonut({ rows, height = 260 }: { rows: DemandRow[]; height?: number }) {
  const data = rows
    .filter((r) => r.qty > 0)
    .map((r) => ({ name: r.food.name.replace(' (Cutlet / Roll)', ''), value: r.qty, emoji: r.food.emoji }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="80%"
            paddingAngle={2}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
