import { useState } from 'react';
import type { RegimeTransition, YearRecord } from '@engine/types';
import { pct } from '../format';
import { COLORS } from '../theme';
import { CHART_MARGIN, scaleLinear, ticks } from './axes';

interface Props {
  history: YearRecord[];
  transitions: RegimeTransition[];
  horizon: number;
  width?: number;
  height?: number;
}

const SERIES = [
  { key: 'bronze', label: 'bronze', color: COLORS.bronze },
  { key: 'silver', label: 'silver', color: COLORS.silver },
  { key: 'gold', label: 'gold', color: COLORS.gold },
] as const;

export function StackedArea({ history, transitions, horizon, width = 380, height = 150 }: Props) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const m = CHART_MARGIN;
  const x = scaleLinear([0, Math.max(horizon, history.length)], [m.left, width - m.right]);
  const y = scaleLinear([0, 1], [height - m.bottom, m.top]);

  const paths = SERIES.map((s, idx) => {
    let d = '';
    const lower = (r: YearRecord) => {
      let acc = 0;
      for (let j = 0; j < idx; j++) acc += r.counts[SERIES[j].key] / r.population;
      return acc;
    };
    const upper = (r: YearRecord) => lower(r) + r.counts[s.key] / r.population;
    history.forEach((r, i) => (d += `${i === 0 ? 'M' : 'L'}${x(r.year).toFixed(1)},${y(upper(r)).toFixed(1)} `));
    for (let i = history.length - 1; i >= 0; i--) d += `L${x(history[i].year).toFixed(1)},${y(lower(history[i])).toFixed(1)} `;
    return { ...s, d: d + 'Z' };
  });

  const pauperPath = history.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(r.year).toFixed(1)},${y(r.counts.paupers / r.population).toFixed(1)}`).join(' ');
  const rec = hoverYear !== null ? history[hoverYear - 1] : null;

  return (
    <figure className="chart">
      <figcaption>
        Who the city is made of
        <span className="legend">
          {SERIES.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} /> {s.label}
            </span>
          ))}
          <span>
            <i className="legend-line" style={{ background: COLORS.pauper }} /> paupers
          </span>
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
              {pct(t)}
            </text>
          </g>
        ))}
        {ticks([0, horizon], 5).map((t) => (
          <text key={t} x={x(t)} y={height - 6} className="tick" textAnchor="middle">
            {t}
          </text>
        ))}
        {history.length > 1 && paths.map((p) => <path key={p.key} d={p.d} fill={p.color} stroke={COLORS.marble} strokeWidth={1} />)}
        {history.length > 1 && <path d={pauperPath} fill="none" stroke={COLORS.pauper} strokeWidth={2} />}
        {transitions.map((t, i) => (
          <g key={t.year}>
            <line x1={x(t.year)} x2={x(t.year)} y1={m.top} y2={height - m.bottom} className="marker" />
            <text x={x(t.year) + 3} y={m.top + 9 + (i % 4) * 11} className="marker-label">
              {t.to}
            </text>
          </g>
        ))}
        {rec && (
          <g>
            <line x1={x(rec.year)} x2={x(rec.year)} y1={m.top} y2={height - m.bottom} className="crosshair" />
          </g>
        )}
      </svg>
      {rec && (
        <div className="chart-tip">
          Year {rec.year}: {rec.counts.gold} gold, {rec.counts.silver} silver, {rec.counts.bronze} bronze
          {rec.counts.paupers > 0 && <>, {rec.counts.paupers} paupers</>}
        </div>
      )}
    </figure>
  );
}
