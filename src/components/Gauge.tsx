import { band, bandColor } from "@/lib/readiness";

// Circular readiness gauge. `value` is 0..1.
export default function Gauge({ value, size = 140, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = bandColor[band(pct)];

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label={`${Math.round(pct * 100)} percent ready`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-100" fontSize={size * 0.22} fontWeight={700}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <span className="mt-1 text-sm text-slate-400">{label}</span>}
    </div>
  );
}
