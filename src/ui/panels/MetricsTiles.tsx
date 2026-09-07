import type { YearRecord } from '@engine/types';
import { pct } from '../format';

interface Props {
  record: YearRecord | null;
}

const VIRTUES: { key: keyof YearRecord; label: string; note: string }[] = [
  { key: 'justice', label: 'Justice', note: 'each doing the work of their own nature (433a)' },
  { key: 'wisdom', label: 'Wisdom', note: 'rulers who truly have gold in the soul (428e)' },
  { key: 'courage', label: 'Courage', note: 'warriors of true silver who hold the line (429c)' },
  { key: 'harmony', label: 'Moderation', note: 'agreement about who should rule (432a)' },
];

export function MetricsTiles({ record }: Props) {
  if (!record) {
    return <p className="empty">Run the city to measure its virtues.</p>;
  }
  return (
    <div className="tiles">
      {VIRTUES.map((v) => (
        <div className="tile" key={v.key} title={v.note}>
          <span className="tile-value">{pct(record[v.key] as number)}</span>
          <span className="tile-label">{v.label}</span>
        </div>
      ))}
      <div className="tile" title="Inequality of private wealth among householders">
        <span className="tile-value">{(record.gini as number).toFixed(2)}</span>
        <span className="tile-label">Inequality</span>
      </div>
      <div className="tile" title="Share of guardians who truly have gold or silver in the soul">
        <span className="tile-value">{pct(record.guardianPurity)}</span>
        <span className="tile-label">Guardian purity</span>
      </div>
      <div className="tile" title="This year">
        <span className="tile-value">
          {record.births}
          <small> / {record.deaths}</small>
        </span>
        <span className="tile-label">Births / deaths</span>
      </div>
      <div className="tile" title="Rulers now in office">
        <span className="tile-value">{record.counts.rulers}</span>
        <span className="tile-label">{record.regime === 'tyranny' ? 'Tyrant and guard' : 'Rulers'}</span>
      </div>
    </div>
  );
}
