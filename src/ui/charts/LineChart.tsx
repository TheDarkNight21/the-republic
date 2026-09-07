import { useState } from 'react';
import type { RegimeTransition, YearRecord } from '@engine/types';
import { COLORS } from '../theme';
import { CHART_MARGIN, scaleLinear, ticks } from './axes';

export interface Series {
  key: keyof YearRecord;
  label: string;
  color: string;
}

interface Props {
  title: string;
  history: YearRecord[];
  transitions: RegimeTransition[];
  series: Series[];
  horizon: number;
  width?: number;
  height?: number;
  format?: (v: number) => string;
}

export function LineChart({ title, history, transitions, series, horizon, width = 380, height = 140, format = (v) => v.toFixed(2) }: Props) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const m = CHART_MARGIN;
  const x = scaleLinear([0, Math.max(horizon, history.length)], [m.left, width - m.right]);
  const y = scaleLinear([0, 1], [height - m.bottom, m.top]);
  const rec = hoverYear !== null ? history[hoverYear - 1] : null;

  return (
    <figure className="chart">
      <figcaption>
        {title}
        <span className="legend">
          {series.map((s) => (
            <span key={s.key}>
              <i className="legend-line" style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * width;
          const yr = Math.round((px - m.left) / (x(1) - x(0)));
          setHoverYear(yr >= 1 && yr <= history.length ? yr : null);
        }}
        onMouseLeave={() => setHoverYear(null)}
      >
        {ticks([0, 1], 4).map((t) => (
          <g key={t}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={m.left - 6} y={y(t) + 3} className="tick" textAnchor="end">
              {format(t)}
            </text>
          </g>
        ))}
        {ticks([0, horizon], 5).map((t) => (
          <text key={t} x={x(t)} y={height - 6} className="tick" textAnchor="middle">
            {t}
          </text>
        ))}
        {transitions.map((t) => (
          <line key={t.year} x1={x(t.year)} x2={x(t.year)} y1={m.top} y2={height - m.bottom} className="marker" />
        ))}
        {history.length > 1 &&
          series.map((s) => (
            <path
              key={s.key}
              d={history.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(r.year).toFixed(1)},${y(r[s.key] as number).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}
        {rec && (
          <g>
            <line x1={x(rec.year)} x2={x(rec.year)} y1={m.top} y2={height - m.bottom} className="crosshair" />
            {series.map((s) => (
              <circle key={s.key} cx={x(rec.year)} cy={y(rec[s.key] as number)} r={4} fill={s.color} stroke={COLORS.marble} strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {rec && (
        <div className="chart-tip">
          Year {rec.year}: {series.map((s) => `${s.label} ${format(rec[s.key] as number)}`).join(', ')}
        </div>
      )}
    </figure>
  );
}
