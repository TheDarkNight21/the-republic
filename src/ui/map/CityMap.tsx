import { useEffect, useRef, useState } from 'react';
import type { World } from '@engine/types';
import { capitalize } from '../format';
import { METAL_LABEL } from '../theme';
import { MAP_H, MAP_W } from './districts';
import { drawCitizens, drawStatic } from './draw';
import { PositionStore } from './positions';

interface Props {
  world: World;
  version: number;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

export function CityMap({ world, version, selectedId, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef(new PositionStore());
  const staticRef = useRef<{ canvas: HTMLCanvasElement; regime: string } | null>(null);
  const worldRef = useRef(world);
  worldRef.current = world;
  const [hover, setHover] = useState<{ id: number; x: number; y: number } | null>(null);
  const hoverRef = useRef<number | null>(null);
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const scaleRef = useRef(1);

  useEffect(() => {
    storeRef.current.sync(world);
  }, [world, version]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let tick = 0;

    const resize = () => {
      const w = wrap.clientWidth;
      const scale = w / MAP_W;
      scaleRef.current = scale;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(MAP_W * scale * dpr);
      canvas.height = Math.round(MAP_H * scale * dpr);
      canvas.style.width = `${MAP_W * scale}px`;
      canvas.style.height = `${MAP_H * scale}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    // Labels are drawn once per regime; redraw them when the typeface arrives.
    document.fonts?.ready.then(() => {
      staticRef.current = null;
    });

    const frame = () => {
      tick++;
      const w = worldRef.current;
      const store = storeRef.current;
      store.animate(w);
      const regime = w.regime.id;
      if (!staticRef.current || staticRef.current.regime !== regime) {
        const off = document.createElement('canvas');
        off.width = MAP_W;
        off.height = MAP_H;
        drawStatic(off.getContext('2d')!, regime);
        staticRef.current = { canvas: off, regime };
      }
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(scaleRef.current * dpr, 0, 0, scaleRef.current * dpr, 0, 0);
      ctx.drawImage(staticRef.current.canvas, 0, 0);
      drawCitizens(ctx, store, w, {
        selectedId: selectedRef.current,
        hoverId: hoverRef.current,
        festivalYear: w.scratch.festivalPaired.size > 0,
        warYear: w.scratch.combatants.size > 0,
        tick,
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const nearest = (e: React.MouseEvent): number | null => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scaleRef.current;
    const y = (e.clientY - rect.top) / scaleRef.current;
    const store = storeRef.current;
    const w = worldRef.current;
    let best: number | null = null;
    let bestD = 49;
    for (const i of w.living) {
      const dx = store.x[i] - x;
      const dy = store.y[i] - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  const hovered = hover ? world.citizens[hover.id] : null;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => {
          const id = nearest(e);
          hoverRef.current = id;
          setHover(id === null ? null : { id, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
        }}
        onMouseLeave={() => {
          hoverRef.current = null;
          setHover(null);
        }}
        onClick={(e) => onSelect(nearest(e))}
        role="img"
        aria-label="Plan of the city with one dot per citizen"
      />
      {hovered && hover && (
        <div className="map-tooltip" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <strong>{hovered.name}</strong>, {hovered.age}
          <br />
          {capitalize(METAL_LABEL[hovered.assignedClass])} · {hovered.role === 'producer' && hovered.occupation ? hovered.occupation : hovered.role}
        </div>
      )}
    </div>
  );
}
