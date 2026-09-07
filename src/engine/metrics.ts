import { REGIME_INFO } from './regime/institutions';
import { isAdult, isGuardian, isGuardianClass, isWarrior } from './population';
import { partOf } from './soul';
import type { AgeBands, Citizen, Metal, SoulPart, World, YearRecord } from './types';

export function gini(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const s = [...values].sort((a, b) => a - b);
  let cum = 0;
  let weighted = 0;
  for (let i = 0; i < n; i++) {
    cum += s[i];
    weighted += (i + 1) * s[i];
  }
  if (cum === 0) return 0;
  return (2 * weighted) / (n * cum) - (n + 1) / n;
}

function roleConsistent(c: Citizen): boolean {
  switch (c.role) {
    case 'ruler':
      return c.trueMetal === 'gold';
    case 'auxiliary':
    case 'officer':
      return c.trueMetal !== 'bronze';
    case 'producer':
    case 'pauper':
    case 'drone':
      return c.trueMetal === 'bronze';
    case 'trainee':
      return c.trueMetal !== 'bronze';
    case 'child':
      return true;
    default:
      return false;
  }
}

function rulersDominantPart(world: World): SoulPart {
  const votes: Record<SoulPart, number> = { reason: 0, spirit: 0, appetite: 0 };
  for (const id of world.rulers) {
    const c = world.citizens[id];
    if (c.alive) votes[partOf(c.trueMetal)]++;
  }
  if (votes.reason >= votes.spirit && votes.reason >= votes.appetite) return 'reason';
  return votes.spirit >= votes.appetite ? 'spirit' : 'appetite';
}

/** 432a: moderation is the agreement of the naturally better and worse about who should rule. */
function consents(c: Citizen, rulersPart: SoulPart): boolean {
  if (c.assignedClass !== c.trueMetal) return false;
  if (rulersPart === 'reason') return true;
  if (rulersPart === 'spirit') return c.trueMetal !== 'gold';
  return c.trueMetal === 'bronze';
}

function emptyBands(): AgeBands {
  const mk = (): Record<Metal, number[]> => ({ gold: new Array(20).fill(0), silver: new Array(20).fill(0), bronze: new Array(20).fill(0) });
  return { F: mk(), M: mk() };
}

export function computeMetrics(world: World): YearRecord {
  const counts = { gold: 0, silver: 0, bronze: 0, paupers: 0, drones: 0, rulers: 0, auxiliaries: 0 };
  const ageBands = emptyBands();
  const consent: Record<Metal, [number, number]> = { gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  const rulersPart = rulersDominantPart(world);
  const householdWealth: number[] = [];
  let adults = 0;
  let just = 0;
  let matched = 0;
  let guardianAdults = 0;
  let pureGuardians = 0;
  let propertied = 0;
  let warriors = 0;
  let brave = 0;
  let paupers = 0;

  for (const i of world.living) {
    const c = world.citizens[i];
    counts[c.assignedClass]++;
    ageBands[c.sex][c.assignedClass][Math.min(19, Math.floor(c.age / 5))]++;
    if (c.role === 'pauper') counts.paupers++;
    if (c.role === 'drone') counts.drones++;
    if (c.role === 'auxiliary' || c.role === 'officer') counts.auxiliaries++;
    if (!isAdult(c)) continue;
    adults++;
    const match = c.assignedClass === c.trueMetal;
    if (match) matched++;
    if (match && c.jobChanges === 0 && roleConsistent(c)) just++;
    const cs = consent[c.trueMetal];
    cs[1]++;
    if (consents(c, rulersPart)) cs[0]++;
    if (isGuardian(c)) {
      guardianAdults++;
      if (isGuardianClass(c.trueMetal)) pureGuardians++;
      if (c.property > 0) propertied++;
      if (c.property > 0) householdWealth.push(c.wealth + c.property);
    } else {
      householdWealth.push(c.wealth + c.property);
    }
    if (isWarrior(c) && c.role !== 'bodyguard') {
      warriors++;
      if (isGuardianClass(c.trueMetal) && !c.fled) brave++;
    }
    if (c.role === 'pauper') paupers++;
  }

  let rulersTrulyGold = 0;
  let livingRulers = 0;
  for (const id of world.rulers) {
    const c = world.citizens[id];
    if (!c.alive) continue;
    livingRulers++;
    if (c.trueMetal === 'gold') rulersTrulyGold++;
  }
  counts.rulers = livingRulers;

  const classConsents = (['gold', 'silver', 'bronze'] as Metal[]).filter((m) => consent[m][1] > 0).map((m) => consent[m][0] / consent[m][1]);
  const harmony = classConsents.length ? classConsents.reduce((a, b) => a + b, 0) / classConsents.length : 0;

  return {
    year: world.year,
    regime: world.regime.id,
    population: world.living.length,
    counts,
    births: world.scratch.births,
    notReared: world.scratch.notReared,
    deaths: world.scratch.deaths,
    warCasualties: world.scratch.warCasualties,
    justice: adults ? just / adults : 0,
    harmony,
    wisdom: livingRulers ? rulersTrulyGold / livingRulers : 0,
    courage: warriors ? brave / warriors : 0,
    gini: gini(householdWealth),
    guardianPurity: guardianAdults ? pureGuardians / guardianAdults : 0,
    guardianPropertyShare: guardianAdults ? propertied / guardianAdults : 0,
    mismatchShare: adults ? 1 - matched / adults : 0,
    pauperShare: adults ? paupers / adults : 0,
    ageBands,
  };
}

export function happinessOf(world: World): number {
  return REGIME_INFO[world.regime.id].happiness;
}
