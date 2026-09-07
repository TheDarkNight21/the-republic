import type { Occupation, SoulPart } from './types';

export type DecayMode = 'stochastic' | 'drift' | 'off';

export interface SimConfig {
  seed: number;
  horizonYears: number;
  targetPopulation: number;
  /** Bk IV 423a: "a thousand fighting men" suffices; ~18% of the city are guardians. */
  guardianShareTarget: number;
  decay: {
    mode: DecayMode;
    graceYears: number;
    errorProbabilityPerFestival: number;
    driftPerYear: number;
  };
  judgement: {
    /** A ruler without gold in the soul reads souls this well, relative to a philosopher. */
    nonGoldRuler: number;
    /** 546d-e: a ruler conceived out of season reads souls this much worse. */
    outOfSeasonRuler: number;
  };
  council: {
    size: number;
    /** A change must be carried this many years running before it takes effect. */
    inertiaYears: number;
    /** A ruler holding more than this multiple of the median votes as a lover of money (550e-551a). */
    richMultiple: number;
  };
  events: {
    /** 547a-c: when enough guardians have iron or bronze in the soul, the class pulls apart and settles on a compromise. */
    factionFloor: number;
    factionRate: number;
    /** 556e-557a: the poor rise when they are many and the rich have shown themselves weak. */
    revoltPauperFloor: number;
    revoltRate: number;
    /** 565c-566a: in an unequal democracy a champion of the people rises. */
    championGiniFloor: number;
    championRate: number;
    championMinYears: number;
    /** When a tyrant dies, the chance the strongest of the guard seizes the place. */
    successionChance: number;
  };
  assessment: {
    baseSigma: number;
    childGamesSigma: number;
    checkpoints: number[];
  };
  soul: {
    priors: Record<SoulPart, [number, number]>;
    heritability: number;
    noise: number;
    outOfSeasonExtraNoise: number;
    outOfSeasonAppetiteBias: number;
  };
  fertility: {
    guardianConceptionPerUnion: number;
    unsanctionedGuardianConception: number;
    outOfWindowGuardianConception: number;
    producerBasePerMarriedWoman: number;
    womenAges: [number, number];
    menAges: [number, number];
    producerMarriageAges: { F: number; M: number };
    producerMarriageChance: number;
    quotaGain: number;
  };
  war: {
    meanInterval: number;
    intervalJitter: number;
    severityRange: [number, number];
    firstWarYear: number;
    winThreshold: number;
  };
  mortality: {
    hazards: [number, number][]; // [maxAge, hazard]
    plagueChance: number;
    plagueExtraHazard: number;
    guardianMultiplier: number;
    pauperMultiplier: number;
    /** Extra hazard per unit of population above 1.2x the target: the land feeds only so many (373d-e). */
    crowdingHazard: number;
  };
  economy: {
    incomeByOccupation: Record<Occupation, number>;
    consumption: number;
    povertyFraction: number;
    /** 421d-422a: in the kallipolis the rulers hold craftsmen between these multiples of the median. */
    guardedFloor: number;
    guardedCap: number;
    pauperYears: number;
    droneMultiple: number;
    guardianPropertyChance: number;
    guardianPropertyMean: number;
    initialMedianWealth: number;
    initialWealthSigma: number;
  };
}

export const DEFAULT_CONFIG: SimConfig = {
  seed: 4231,
  horizonYears: 300,
  targetPopulation: 1000,
  guardianShareTarget: 0.18,
  decay: {
    mode: 'stochastic',
    graceYears: 40, // 546a-b: even the ideal city, "hard as it is to move", eventually errs
    errorProbabilityPerFestival: 0.02,
    driftPerYear: 0.002,
  },
  judgement: {
    nonGoldRuler: 0.3,
    outOfSeasonRuler: 0.35,
  },
  council: {
    size: 12,
    inertiaYears: 5,
    richMultiple: 1.5,
  },
  events: {
    factionFloor: 0.25,
    factionRate: 0.4,
    revoltPauperFloor: 0.15,
    revoltRate: 0.5,
    championGiniFloor: 0.3,
    championRate: 0.06,
    championMinYears: 10,
    successionChance: 0.7,
  },
  assessment: {
    baseSigma: 0.1,
    childGamesSigma: 0.25, // 537a: children observed at play
    checkpoints: [7, 10, 18, 20, 30, 35, 50], // 413d-e, 537-540
  },
  soul: {
    priors: { reason: [0.25, 0.2], spirit: [0.36, 0.2], appetite: [0.62, 0.2] },
    heritability: 0.8, // 415a-b: "for the most part you will produce children like yourselves"
    noise: 0.1,
    outOfSeasonExtraNoise: 0.12, // 547a: iron mixed with silver, bronze with gold
    outOfSeasonAppetiteBias: 0.06,
  },
  fertility: {
    guardianConceptionPerUnion: 0.7,
    unsanctionedGuardianConception: 0.03, // 461b
    outOfWindowGuardianConception: 0.01,
    producerBasePerMarriedWoman: 0.14,
    womenAges: [20, 40], // 460e
    menAges: [25, 55], // 460e
    producerMarriageAges: { F: 18, M: 22 },
    producerMarriageChance: 0.25,
    quotaGain: 0.15, // 460a: rulers keep the number of citizens constant
  },
  war: {
    meanInterval: 12,
    intervalJitter: 4,
    severityRange: [0.05, 0.25],
    firstWarYear: 8,
    winThreshold: 0.6,
  },
  mortality: {
    hazards: [
      [0, 0.06],
      [4, 0.015],
      [14, 0.004],
      [39, 0.007],
      [59, 0.018],
      [69, 0.05],
      [79, 0.12],
      [200, 0.3],
    ],
    plagueChance: 0.015,
    plagueExtraHazard: 0.08,
    guardianMultiplier: 0.85,
    pauperMultiplier: 1.3,
    crowdingHazard: 0.03,
  },
  economy: {
    incomeByOccupation: {
      farmer: 1.0,
      laborer: 0.8,
      cobbler: 1.0,
      weaver: 1.0,
      builder: 1.2,
      smith: 1.2,
      physician: 1.4,
      sailor: 1.3,
      retailer: 1.3,
      merchant: 1.6,
    },
    consumption: 0.8,
    povertyFraction: 0.2,
    guardedFloor: 0.5,
    guardedCap: 3,
    pauperYears: 3,
    droneMultiple: 5,
    guardianPropertyChance: 0.15, // 547b-c, 548a: secretly acquiring gold and silver
    guardianPropertyMean: 2,
    initialMedianWealth: 10,
    initialWealthSigma: 0.6,
  },
};

/** Deep-ish merge of partial overrides onto the defaults (one level of nesting is enough here). */
export function makeConfig(overrides: Partial<{ [K in keyof SimConfig]: Partial<SimConfig[K]> }> = {}): SimConfig {
  const out: Record<string, unknown> = { ...DEFAULT_CONFIG };
  for (const key of Object.keys(overrides) as (keyof SimConfig)[]) {
    const v = overrides[key];
    const base = DEFAULT_CONFIG[key];
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof base === 'object') {
      out[key] = { ...(base as object), ...(v as object) };
    } else if (v !== undefined) {
      out[key] = v;
    }
  }
  return out as unknown as SimConfig;
}
