import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG, Simulation, makeConfig, type DecayMode, type SimConfig } from '@engine/index';

/** ?seed=…&year=…&select=…&decay=stochastic|drift|off lets a state be linked to directly. */
function fromUrl(): { config: SimConfig; year: number; select: number | null } {
  const q = new URLSearchParams(window.location.search);
  const seed = Number.parseInt(q.get('seed') ?? '', 10);
  const decay = q.get('decay') as DecayMode | null;
  const config = makeConfig({
    seed: Number.isFinite(seed) ? seed : DEFAULT_CONFIG.seed,
    decay: { ...DEFAULT_CONFIG.decay, mode: decay === 'drift' || decay === 'off' || decay === 'stochastic' ? decay : DEFAULT_CONFIG.decay.mode },
  });
  const year = Number.parseInt(q.get('year') ?? '', 10);
  const select = Number.parseInt(q.get('select') ?? '', 10);
  return { config, year: Number.isFinite(year) ? Math.max(0, Math.min(1000, year)) : 0, select: Number.isFinite(select) ? select : null };
}

export const SPEEDS = [1, 2, 5, 10, 30, Infinity] as const;
export type Speed = (typeof SPEEDS)[number];

export function useSimulation() {
  const initRef = useRef<ReturnType<typeof fromUrl> | null>(null);
  if (initRef.current === null) initRef.current = fromUrl();
  const simRef = useRef<Simulation | null>(null);
  if (simRef.current === null) {
    simRef.current = new Simulation(initRef.current.config);
    simRef.current.run(initRef.current.year);
  }
  const sim = simRef.current;

  const [version, setVersion] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(5);
  const [selectedId, setSelectedId] = useState<number | null>(initRef.current.select);
  const [pastHorizon, setPastHorizon] = useState(false);

  const speedRef = useRef<Speed>(speed);
  speedRef.current = speed;
  const pastHorizonRef = useRef(pastHorizon);
  pastHorizonRef.current = pastHorizon;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      let stepped = false;
      const atEnd = () => sim.atHorizon && !pastHorizonRef.current;
      if (speedRef.current === Infinity) {
        const budget = now + 8;
        while (performance.now() < budget && !atEnd()) {
          sim.step();
          stepped = true;
        }
      } else {
        acc += dt * speedRef.current;
        let n = 0;
        while (acc >= 1 && n < 20 && !atEnd()) {
          sim.step();
          acc -= 1;
          n++;
          stepped = true;
        }
      }
      if (stepped) setVersion((v) => v + 1);
      if (atEnd()) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, sim]);

  const stepOnce = useCallback(() => {
    sim.step();
    setVersion((v) => v + 1);
  }, [sim]);

  const reset = useCallback(
    (config: SimConfig) => {
      setPlaying(false);
      sim.reset(config);
      setSelectedId(null);
      setPastHorizon(false);
      setVersion((v) => v + 1);
    },
    [sim],
  );

  const toggle = useCallback(() => {
    if (!playing && sim.atHorizon) setPastHorizon(true);
    setPlaying((p) => !p);
  }, [playing, sim]);

  return { sim, world: sim.world, version, playing, toggle, stepOnce, speed, setSpeed, selectedId, select: setSelectedId, reset };
}

export type SimulationHandle = ReturnType<typeof useSimulation>;
