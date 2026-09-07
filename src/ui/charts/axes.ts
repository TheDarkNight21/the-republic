export interface Scale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
}

export function scaleLinear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const f = ((v: number) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0))) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

export function ticks(domain: [number, number], count: number): number[] {
  const [a, b] = domain;
  if (b <= a) return [a];
  const raw = (b - a) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const stepN = norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1;
  const stp = stepN * mag;
  const out: number[] = [];
  for (let v = Math.ceil(a / stp) * stp; v <= b + 1e-9; v += stp) out.push(Number(v.toFixed(6)));
  return out;
}

export const CHART_MARGIN = { top: 10, right: 12, bottom: 22, left: 34 };
