import { useState } from 'react';
import { DEFAULT_CONFIG, makeConfig, type DecayMode, type SimConfig } from '@engine/index';

interface Props {
  config: SimConfig;
  onApply: (config: SimConfig) => void;
}

export function ParametersPanel({ config, onApply }: Props) {
  const [seed, setSeed] = useState(String(config.seed));
  const [mode, setMode] = useState<DecayMode>(config.decay.mode);
  const [population, setPopulation] = useState(config.targetPopulation);
  const [sigma, setSigma] = useState(config.assessment.baseSigma);

  const apply = (s = seed) => {
    const seedNum = Number.parseInt(s, 10);
    onApply(
      makeConfig({
        seed: Number.isFinite(seedNum) ? seedNum : DEFAULT_CONFIG.seed,
        targetPopulation: population,
        decay: { ...DEFAULT_CONFIG.decay, mode },
        assessment: { ...DEFAULT_CONFIG.assessment, baseSigma: sigma },
      }),
    );
  };

  return (
    <form
      className="params"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <label>
        Seed
        <span className="params-row">
          <input value={seed} onChange={(e) => setSeed(e.target.value)} inputMode="numeric" />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={() => {
              const s = String(Math.floor(Math.random() * 100000));
              setSeed(s);
              apply(s);
            }}
          >
            New city
          </button>
        </span>
      </label>
      <label>
        How the decline begins
        <select value={mode} onChange={(e) => setMode(e.target.value as DecayMode)}>
          <option value="stochastic">The rulers one day miss the nuptial number</option>
          <option value="drift">Their judgement erodes a little every year</option>
          <option value="off">It never begins</option>
        </select>
      </label>
      <label>
        City size the rulers aim for: {population}
        <input type="range" min={800} max={1500} step={50} value={population} onChange={(e) => setPopulation(Number(e.target.value))} />
      </label>
      <label>
        How clearly the rulers see a soul: {sigma <= 0.06 ? 'almost perfectly' : sigma <= 0.12 ? 'well' : sigma <= 0.18 ? 'dimly' : 'barely'}
        <input type="range" min={0.03} max={0.25} step={0.01} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} />
      </label>
      <button className="btn btn-primary" type="submit">
        Found the city again
      </button>
    </form>
  );
}
