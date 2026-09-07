import { BLOC_LABEL, BOOLEAN_KEYS, INSTITUTION_LABEL, REGIME_INFO, happinessRatioToKing, type Bloc } from '@engine/index';
import type { World } from '@engine/types';

const ORDER: Bloc[] = ['philosophers', 'honorLovers', 'moneyLovers', 'people', 'tyrant'];

export function RegimeBadge({ world }: { world: World }) {
  const info = REGIME_INFO[world.regime.id];
  const last = world.regime.transitions[world.regime.transitions.length - 1];
  const ratio = happinessRatioToKing(world.regime.id);
  const council = ORDER.filter((b) => world.regime.council[b] > 0).map((b) => `${world.regime.council[b]} ${BLOC_LABEL[b]}`);
  const standing = BOOLEAN_KEYS.filter((k) => world.institutions[k]);
  const fallen = BOOLEAN_KEYS.filter((k) => !world.institutions[k]);
  return (
    <section className={`regime regime-${world.regime.id}`}>
      <h2 className="regime-title">{info.title}</h2>
      <p className="regime-desc">{info.description}</p>
      <p className="regime-meta">
        Since year {world.regime.sinceYear}
        {council.length > 0 && <> · in council: {council.join(', ')}</>}
        {world.regime.nuptialErrorYear !== null && <> · the nuptial number was missed in year {world.regime.nuptialErrorYear}</>}
        {ratio > 1 && <> · the just king lives {ratio}× more pleasantly than these rulers (587e)</>}
      </p>
      <p className="institutions">
        {standing.map((k) => (
          <span key={k} className="inst inst-standing">
            {INSTITUTION_LABEL[k]}
          </span>
        ))}
        {fallen.map((k) => (
          <span key={k} className="inst inst-fallen">
            {INSTITUTION_LABEL[k]}
          </span>
        ))}
      </p>
      {last && <p className="regime-cause">{last.cause}</p>}
    </section>
  );
}
