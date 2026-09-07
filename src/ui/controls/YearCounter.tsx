interface Props {
  year: number;
  horizon: number;
  population: number;
}

export function YearCounter({ year, horizon, population }: Props) {
  return (
    <div className="year">
      <span className="year-number">{year}</span>
      <span className="year-caption">
        of {horizon} years · {population.toLocaleString()} citizens
      </span>
    </div>
  );
}
