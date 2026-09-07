import type { Citizen, World } from '@engine/types';
import { ROLE_LABEL, STAGE_LABEL, capitalize } from '../format';
import { COLORS, METAL_COLOR, METAL_LABEL } from '../theme';

interface Props {
  citizen: Citizen;
  world: World;
  onClose: () => void;
  onSelect: (id: number) => void;
}

const PARTS = [
  { key: 'reason', label: 'reason', color: COLORS.gold },
  { key: 'spirit', label: 'spirit', color: COLORS.silver },
  { key: 'appetite', label: 'appetite', color: COLORS.bronze },
] as const;

function Person({ id, world, onSelect }: { id: number; world: World; onSelect: (id: number) => void }) {
  const c = world.citizens[id];
  return (
    <button className="person-link" onClick={() => onSelect(id)}>
      <i style={{ background: METAL_COLOR[c.assignedClass] }} />
      {c.name}
      {!c.alive && <span className="muted"> †</span>}
    </button>
  );
}

export function CitizenInspector({ citizen: c, world, onClose, onSelect }: Props) {
  const mismatch = c.age >= 10 && c.assignedClass !== c.trueMetal;
  return (
    <aside className="inspector" aria-label={`Life of ${c.name}`}>
      <header className="inspector-head">
        <div>
          <h2>
            <i className="dot" style={{ background: METAL_COLOR[c.assignedClass] }} />
            {c.name}
          </h2>
          <p className="muted">
            {c.sex === 'F' ? 'Woman' : 'Man'}, {c.alive ? `aged ${c.age}` : `died in year ${c.deathYear} at ${c.age}`} · {ROLE_LABEL[c.role]}
            {c.occupation && c.role !== 'ruler' ? `, ${c.occupation}` : ''} · {STAGE_LABEL[c.stage]}
          </p>
        </div>
        <button className="btn btn-quiet" onClick={onClose} aria-label="Close">
          Close
        </button>
      </header>

      <section className="soul">
        <p className="soul-caption">
          The city judges {c.name} to be of <strong>{METAL_LABEL[c.assignedClass]}</strong>
          {c.assessedMetal === null && ' (not yet tested)'}. The faint bars show the soul as it truly is, which only we can see.
          {mismatch && (
            <>
              {' '}
              <span className="warn">In truth the soul is {METAL_LABEL[c.trueMetal]}.</span>
            </>
          )}
        </p>
        {PARTS.map((p) => (
          <div className="soul-row" key={p.key}>
            <span className="soul-label">{p.label}</span>
            <span className="soul-bar">
              <span className="soul-true" style={{ width: `${c.soul[p.key] * 100}%`, background: p.color }} />
              <span className="soul-seen" style={{ width: `${(c.observations ? c.evidence[p.key] : 0) * 100}%`, background: p.color }} />
            </span>
          </div>
        ))}
      </section>

      <dl className="facts">
        <dt>Parents</dt>
        <dd>
          {c.motherId === null ? (
            'Of the founding generation'
          ) : (
            <>
              <Person id={c.motherId} world={world} onSelect={onSelect} /> and <Person id={c.fatherId!} world={world} onSelect={onSelect} />
              {!c.parentsKnown && <span className="muted"> (recorded by the rulers; unknown to the citizen)</span>}
            </>
          )}
        </dd>
        {c.spouseId !== null && (
          <>
            <dt>Spouse</dt>
            <dd>
              <Person id={c.spouseId} world={world} onSelect={onSelect} />
            </dd>
          </>
        )}
        {c.childrenIds.length > 0 && (
          <>
            <dt>Children</dt>
            <dd>
              {c.childrenIds.map((id) => (
                <Person key={id} id={id} world={world} onSelect={onSelect} />
              ))}
            </dd>
          </>
        )}
        <dt>Holdings</dt>
        <dd>
          {c.wealth + c.property < 0.05
            ? c.assignedClass !== 'bronze'
              ? 'Nothing private; fed and housed by the city'
              : 'Nothing'
            : `${(c.wealth + c.property).toFixed(1)} in land and goods${c.property > 0 ? ', held in secret' : ''}`}
        </dd>
        {(c.warsFought > 0 || c.decorated || c.fled) && (
          <>
            <dt>Under arms</dt>
            <dd>
              {c.warsFought} {c.warsFought === 1 ? 'campaign' : 'campaigns'}
              {c.decorated && ', crowned for valor'}
              {c.fled && ', left the ranks'}
            </dd>
          </>
        )}
        {c.bornOutOfSeason && (
          <>
            <dt>Born</dt>
            <dd>Out of season, after the nuptial number was missed (546d)</dd>
          </>
        )}
      </dl>

      <ol className="life">
        {c.history.map((e, i) => (
          <li key={i} className={`life-${e.kind}`}>
            <span className="log-year">{e.year}</span>
            <span>{capitalize(e.text)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
