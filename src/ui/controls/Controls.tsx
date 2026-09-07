import { SPEEDS, type Speed } from '../useSimulation';

interface Props {
  playing: boolean;
  onToggle: () => void;
  onStep: () => void;
  speed: Speed;
  onSpeed: (s: Speed) => void;
  atHorizon: boolean;
}

const speedLabel = (s: Speed) => (s === Infinity ? 'fastest' : `${s}×`);

export function Controls({ playing, onToggle, onStep, speed, onSpeed, atHorizon }: Props) {
  return (
    <div className="controls">
      <button className="btn btn-primary" onClick={onToggle} aria-pressed={playing}>
        {playing ? 'Pause' : atHorizon ? 'Run past the horizon' : 'Run'}
      </button>
      <button className="btn" onClick={onStep} disabled={playing}>
        One year
      </button>
      <div className="speed" role="group" aria-label="Years per second">
        {SPEEDS.map((s) => (
          <button key={String(s)} className={`speed-btn${s === speed ? ' is-active' : ''}`} onClick={() => onSpeed(s)}>
            {speedLabel(s)}
          </button>
        ))}
      </div>
    </div>
  );
}
