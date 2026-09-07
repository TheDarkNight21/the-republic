import type { RegimeId, World } from '@engine/types';
import { COLORS, METAL_COLOR, REGIME_WASH } from '../theme';
import { DISTRICT_GROUPS, LOTS, MAP_H, MAP_W, WALL } from './districts';
import type { PositionStore } from './positions';

const FONT = '"Spectral", Georgia, serif';

export function drawStatic(ctx: CanvasRenderingContext2D, regime: RegimeId): void {
  ctx.fillStyle = COLORS.marble;
  ctx.fillRect(0, 0, MAP_W, MAP_H);
  ctx.fillStyle = REGIME_WASH[regime];
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Furrows on the farmland.
  const farms = LOTS.find((l) => l.key === 'farms')!.rect;
  ctx.strokeStyle = COLORS.marbleLine;
  ctx.lineWidth = 1;
  for (let y = farms.y + 14; y < farms.y + farms.h; y += 14) {
    ctx.beginPath();
    ctx.moveTo(farms.x + 8, y);
    ctx.lineTo(farms.x + farms.w - 8, y);
    ctx.stroke();
  }

  for (const lot of LOTS) {
    if (lot.key === 'barracks/officers') continue;
    const r = lot.rect;
    ctx.fillStyle = lot.key === 'temple' ? COLORS.blueSoft : lot.key === 'farms' || lot.key === 'battlefield' ? 'transparent' : COLORS.marbleDeep;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COLORS.marbleLine;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    if (lot.label) {
      ctx.fillStyle = COLORS.inkMuted;
      ctx.font = `italic ${lot.small ? 11 : 12}px ${FONT}`;
      ctx.textBaseline = 'top';
      ctx.fillText(lot.label, r.x + 6, r.y + 4);
    }
  }
  for (const g of DISTRICT_GROUPS) {
    ctx.strokeStyle = COLORS.inkFaint;
    ctx.lineWidth = 1;
    ctx.strokeRect(g.rect.x - 4.5, g.rect.y - 4.5, g.rect.w + 9, g.rect.h + 9);
    ctx.fillStyle = COLORS.ink;
    ctx.font = `600 13px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(g.label, g.rect.x - 2, g.rect.y - 7);
  }

  // The wall, with towers at the corners.
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  WALL.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  for (const [x, y] of WALL) ctx.fillRect(x - 3, y - 3, 6, 6);

  ctx.fillStyle = COLORS.inkMuted;
  ctx.font = `italic 12px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('outside the walls', 712, 480);
}

export interface DrawOptions {
  selectedId: number | null;
  hoverId: number | null;
  festivalYear: boolean;
  warYear: boolean;
  tick: number;
}

export function drawCitizens(ctx: CanvasRenderingContext2D, store: PositionStore, world: World, opt: DrawOptions): void {
  const temple = LOTS.find((l) => l.key === 'temple')!.rect;
  if (opt.festivalYear) {
    const pulse = 0.5 + 0.5 * Math.sin(opt.tick / 12);
    ctx.fillStyle = `rgba(47, 93, 168, ${0.08 + 0.12 * pulse})`;
    ctx.fillRect(temple.x, temple.y, temple.w, temple.h);
  }
  if (opt.warYear) {
    const f = LOTS.find((l) => l.key === 'battlefield')!.rect;
    ctx.fillStyle = 'rgba(122, 46, 46, 0.12)';
    ctx.fillRect(f.x, f.y, f.w, f.h);
  }

  const n = world.citizens.length;
  for (let i = 0; i < n; i++) {
    const a = store.alpha[i];
    if (a <= 0) continue;
    const c = world.citizens[i];
    const x = store.x[i];
    const y = store.y[i];
    const dim = c.role === 'pauper' ? 0.45 : 1;
    ctx.globalAlpha = a * dim;
    ctx.fillStyle = METAL_COLOR[c.assignedClass];
    if (c.role === 'ruler' || c.role === 'tyrant') {
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.globalAlpha = a;
      ctx.strokeStyle = c.role === 'tyrant' ? COLORS.danger : COLORS.ink;
      ctx.lineWidth = c.role === 'tyrant' ? 2 : 1;
      ctx.strokeRect(x - 3.5, y - 3.5, 7, 7);
    } else {
      ctx.fillRect(x - 2, y - 2, 4, 4);
      if (c.fled) {
        ctx.globalAlpha = a;
        ctx.fillStyle = COLORS.danger;
        ctx.fillRect(x - 1, y - 4, 2, 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  const ring = (id: number, color: string) => {
    const c = world.citizens[id];
    if (!c || !c.alive) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(store.x[id], store.y[id], 7, 0, Math.PI * 2);
    ctx.stroke();
  };
  if (opt.hoverId !== null) ring(opt.hoverId, COLORS.inkMuted);
  if (opt.selectedId !== null) ring(opt.selectedId, COLORS.blue);
}
