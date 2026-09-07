export const pct = (x: number, digits = 0): string => `${(x * 100).toFixed(digits)}%`;
export const num = (x: number, digits = 0): string => x.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export const STAGE_LABEL: Record<string, string> = {
  infant: 'infant',
  child: 'child',
  musicGymnastics: 'music and gymnastics',
  militaryTraining: 'military training',
  mathematics: 'mathematics',
  dialectic: 'dialectic',
  practicalOffice: 'offices and commands',
  philosophy: 'philosophy and rule',
  auxiliary: 'under arms',
  apprentice: 'apprentice',
  working: 'at work',
  elder: 'elder',
};

export const ROLE_LABEL: Record<string, string> = {
  child: 'child',
  trainee: 'in training',
  auxiliary: 'auxiliary',
  officer: 'officer',
  ruler: 'ruler',
  producer: 'craftsman',
  pauper: 'pauper',
  drone: 'drone',
  tyrant: 'tyrant',
  bodyguard: 'bodyguard',
};
