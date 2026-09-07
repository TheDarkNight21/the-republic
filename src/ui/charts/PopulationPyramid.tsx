import type { AgeBands } from '@engine/types';
import { COLORS, METAL_COLOR } from '../theme';

interface Props {
  bands: AgeBands;
  width?: number;
  height?: number;
}

const METALS = ['bronze', 'silver', 'gold'] as const;

export function PopulationPyramid({ bands, width = 380, height = 170 }: Props) {
  const rows = 20;
  const rowH = (height - 16) / rows;
  const mid = width / 2;
  const half = mid - 30;
  let max = 1;
  for (const sex of ['F', 'M'] as const) for (let i = 0; i < rows; i++) max = Math.max(max, METALS.reduce((a, m) => a + bands[sex][m][i], 0));
  const sx = half / max;

  return (
    <figure className="chart">
      <figcaption>
        Ages, women to the left and men to the right
        <span className="legend">
          {METALS.map((m) => (
            <span key={m}>
              <i style={{ background: METAL_COLOR[m] }} /> {m}
            </span>
          ))}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: rows }, (_, i) => {
          const yy = height - 16 - (i + 1) * rowH;
          let lx = mid - 12;
          let rx = mid + 12;
          return (
            <g key={i}>
              {i % 4 === 0 && (
                <text x={mid} y={yy + rowH - 1} className="tick" textAnchor="middle">
                  {i * 5}
                </text>
              )}
              {METALS.map((m) => {
                const wf = bands.F[m][i] * sx;
                const wm = bands.M[m][i] * sx;
                const el = (
                  <g key={m}>
                    {wf > 0 && <rect x={lx - wf} y={yy + 1} width={wf} height={Math.max(1, rowH - 2)} fill={METAL_COLOR[m]} />}
                    {wm > 0 && <rect x={rx} y={yy + 1} width={wm} height={Math.max(1, rowH - 2)} fill={METAL_COLOR[m]} />}
                  </g>
                );
                lx -= wf;
                rx += wm;
                return el;
              })}
            </g>
          );
        })}
        <line x1={mid - 12} x2={mid - 12} y1={0} y2={height - 16} stroke={COLORS.inkFaint} />
        <line x1={mid + 12} x2={mid + 12} y1={0} y2={height - 16} stroke={COLORS.inkFaint} />
        <text x={mid - 16} y={height - 4} className="tick" textAnchor="end">
          women
        </text>
        <text x={mid + 16} y={height - 4} className="tick">
          men
        </text>
      </svg>
    </figure>
  );
}
