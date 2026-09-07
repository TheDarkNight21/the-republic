import { useState } from 'react';
import type { CityLogEntry, CityLogKind } from '@engine/types';

interface Props {
  log: CityLogEntry[];
  onSelect: (id: number) => void;
}

const FILTERS: { key: CityLogKind | 'all'; label: string }[] = [
  { key: 'all', label: 'Everything' },
  { key: 'regime', label: 'Regime' },
  { key: 'assessment', label: 'Sorting' },
  { key: 'festival', label: 'Festivals' },
  { key: 'war', label: 'War' },
  { key: 'council', label: 'Council' },
];

export function EventLog({ log, onSelect }: Props) {
  const [filter, setFilter] = useState<CityLogKind | 'all'>('all');
  const entries = (filter === 'all' ? log : log.filter((e) => e.kind === filter)).slice(-200).reverse();
  return (
    <section className="log">
      <div className="log-filters" role="group" aria-label="Filter the chronicle">
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip${filter === f.key ? ' is-active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <ol className="log-list">
        {entries.length === 0 && <li className="empty">Nothing of this kind has happened yet.</li>}
        {entries.map((e, i) => (
          <li key={`${e.year}-${i}`} className={`log-entry log-${e.kind}`}>
            <span className="log-year">{e.year}</span>
            {e.citizenIds && e.citizenIds.length > 0 ? (
              <button className="log-link" onClick={() => onSelect(e.citizenIds![0])}>
                {e.text}
              </button>
            ) : (
              <span>{e.text}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
