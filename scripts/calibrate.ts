import { DEFAULT_CONFIG, makeConfig, Simulation, assessmentSigma, councilJudgement } from '../src/engine';

const seeds = process.argv.slice(2).map(Number);
const list = seeds.length ? seeds : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const verbose = process.env.VERBOSE === '1';
const mode = (process.env.DECAY as 'stochastic' | 'drift' | 'off') ?? DEFAULT_CONFIG.decay.mode;

for (const seed of list) {
  const judgement = {
    nonGoldRuler: Number(process.env.NONGOLD ?? DEFAULT_CONFIG.judgement.nonGoldRuler),
    outOfSeasonRuler: Number(process.env.OOS ?? DEFAULT_CONFIG.judgement.outOfSeasonRuler),
  };
  const sim = new Simulation(makeConfig({ seed, decay: { ...DEFAULT_CONFIG.decay, mode }, judgement }));
  const t0 = performance.now();
  sim.run(sim.config.horizonYears);
  const ms = performance.now() - t0;
  const w = sim.world;
  const h = w.history;
  const pops = h.map((r) => r.population);
  const gShare = h.slice(30).map((r) => (r.counts.gold + r.counts.silver) / r.population);
  const births = h.map((r) => r.births);
  const tr = w.regime.transitions.map((t) => `${t.to}@${t.year}`).join(' ');
  const inst = Object.entries(w.institutions).filter(([, v]) => typeof v === 'boolean' && !v).map(([k]) => k).join(',');
  console.log(
    `seed ${seed}: pop ${Math.min(...pops)}-${Math.max(...pops)} guard ${Math.min(...gShare).toFixed(2)}-${Math.max(...gShare).toFixed(2)} births/yr ${(births.reduce((a, b) => a + b, 0) / births.length).toFixed(1)} err@${w.regime.nuptialErrorYear ?? '-'} ${tr || 'no transitions'} final ${w.regime.id} fallen:[${inst}] judg ${councilJudgement(w).toFixed(2)} sigma ${assessmentSigma(w).toFixed(2)} wis ${h[h.length-1].wisdom.toFixed(2)} pur ${h[h.length-1].guardianPurity.toFixed(2)} (${ms.toFixed(0)}ms)`,
  );
  if (verbose) {
    for (const r of h) {
      if (r.year % 10 !== 0) continue;
      console.log(
        `  y${r.year} ${r.regime.padEnd(11)} pop ${r.population} g/s/b ${r.counts.gold}/${r.counts.silver}/${r.counts.bronze} rulers ${r.counts.rulers} aux ${r.counts.auxiliaries} just ${r.justice.toFixed(2)} harm ${r.harmony.toFixed(2)} wis ${r.wisdom.toFixed(2)} cour ${r.courage.toFixed(2)} gini ${r.gini.toFixed(2)} pur ${r.guardianPurity.toFixed(2)} prop ${r.guardianPropertyShare.toFixed(2)} paup ${r.pauperShare.toFixed(2)} b/d ${r.births}/${r.deaths} nr ${r.notReared} council ${Object.entries(w.regime.council).filter(([,v])=>v>0).map(([k,v])=>`${k[0]}${v}`).join('')}`,
      );
    }
  }
}
