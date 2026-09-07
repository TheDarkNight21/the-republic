import { useState } from 'react';
import { CityMap } from '@ui/map/CityMap';
import { Controls } from '@ui/controls/Controls';
import { ParametersPanel } from '@ui/controls/ParametersPanel';
import { RegimeBadge } from '@ui/controls/RegimeBadge';
import { YearCounter } from '@ui/controls/YearCounter';
import { LineChart } from '@ui/charts/LineChart';
import { PopulationPyramid } from '@ui/charts/PopulationPyramid';
import { StackedArea } from '@ui/charts/StackedArea';
import { CitizenInspector } from '@ui/panels/CitizenInspector';
import { EventLog } from '@ui/panels/EventLog';
import { MetricsTiles } from '@ui/panels/MetricsTiles';
import { COLORS } from '@ui/theme';
import { useSimulation } from '@ui/useSimulation';

const VIRTUES = [
  { key: 'justice', label: 'justice', color: COLORS.ink },
  { key: 'wisdom', label: 'wisdom', color: COLORS.gold },
  { key: 'courage', label: 'courage', color: COLORS.bronze },
  { key: 'harmony', label: 'moderation', color: COLORS.silver },
] as const;

const WEALTH = [
  { key: 'gini', label: 'inequality', color: COLORS.ink },
  { key: 'pauperShare', label: 'paupers', color: COLORS.pauper },
] as const;

export default function App() {
  const s = useSimulation();
  const [showParams, setShowParams] = useState(false);
  const world = s.world;
  const last = world.history[world.history.length - 1] ?? null;
  const selected = s.selectedId !== null ? world.citizens[s.selectedId] : null;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Kallipolis</h1>
          <p>Plato's city, run by its own rules</p>
        </div>
        <YearCounter year={world.year} horizon={world.config.horizonYears} population={world.living.length} />
        <Controls playing={s.playing} onToggle={s.toggle} onStep={s.stepOnce} speed={s.speed} onSpeed={s.setSpeed} atHorizon={s.sim.atHorizon} />
        <button className={`btn${showParams ? ' is-active' : ''}`} onClick={() => setShowParams((v) => !v)} aria-expanded={showParams}>
          Found a new city
        </button>
      </header>

      <main className="main">
        <div className="map-col">
          <CityMap world={world} version={s.version} selectedId={s.selectedId} onSelect={s.select} />
          {selected && <CitizenInspector citizen={selected} world={world} onClose={() => s.select(null)} onSelect={s.select} />}
          {showParams && (
            <div className="params-drawer">
              <ParametersPanel
                config={world.config}
                onApply={(cfg) => {
                  s.reset(cfg);
                  setShowParams(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="side">
          <RegimeBadge world={world} />
          <MetricsTiles record={last} />
          <StackedArea history={world.history} transitions={world.regime.transitions} horizon={world.config.horizonYears} />
          <LineChart title="The four virtues of the city" history={world.history} transitions={world.regime.transitions} series={[...VIRTUES]} horizon={world.config.horizonYears} format={(v) => `${Math.round(v * 100)}%`} />
          <LineChart title="Wealth and want" history={world.history} transitions={world.regime.transitions} series={[...WEALTH]} horizon={world.config.horizonYears} height={110} />
          {last && <PopulationPyramid bands={last.ageBands} />}
          <EventLog log={world.log} onSelect={s.select} />
        </div>
      </main>
    </div>
  );
}
