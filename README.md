# Kallipolis

An agent-based simulation of the city Plato describes in *The Republic*, run as literally as the
text allows. A thousand citizens are born with a hidden tripartite soul, sorted by the rulers into
gold, silver and bronze, educated, paired at marriage festivals, sent to war, and watched year by
year on a plan of the city. If the rulers ever miss the "nuptial number", the city may
decline through the regimes of Book VIII, timocracy, oligarchy, democracy, tyranny, or it may
not: nothing in the code decides that in advance.

```
npm install
npm run dev        # open http://localhost:5173
npm test           # engine tests, including a 10-seed check that the decline runs its course
npm run calibrate  # print population, class shares and regime years per seed
```

Deep links: `?seed=42&year=200&select=17&decay=off` founds a city with that seed, runs it to
that year, opens that citizen, and (here) never lets the decline begin.

## What is on screen

- **The plan of the city.** One dot per citizen, colored by the class the city has assigned them:
  gold, silver or bronze. Guardian children live in the rearing pen, then the academy; auxiliaries
  eat at the common mess; rulers sit in council; craftsmen work in the agora and the farms outside
  the walls. Paired guardians spend the festival year at the temple, and warriors leave for the
  field when war comes. Click a dot to read a life.
- **The citizen's soul.** The inspector shows the soul as the city has judged it and, faintly
  behind, as it truly is. The city never sees the faint bars; the viewer does.
- **The four virtues** of Book IV, measured each year: justice (each adult doing the work of their
  own nature), wisdom (rulers who truly have gold in the soul), courage (warriors of true silver
  who hold the line) and moderation (agreement across the classes about who should rule).
- **The chronicle**: festivals, wars, promotions and demotions, council decisions, the missed
  nuptial number, and each change of regime with the metrics that caused it.

## Nothing about the society is scripted

There is no regime state machine. Each year the sitting rulers vote on the institutions of the
city from their own natures and their own purses, and the regime name is read off two facts:
how office is filled, and what still stands.

- **Who votes how.** A ruler with gold in the soul votes as a philosopher. A silver soul votes as
  a lover of honor. Anyone holding more than one and a half times the median votes as a lover of
  money, and so does a bronze soul inside the landed guardian class. A poor bronze soul votes as
  one of the people. A tyrant votes alone. Each interest wants what Book VIII says it wants:
  philosophers keep the academy, the testing of souls, communal living, the regulation of births,
  the guard against wealth and poverty, and the ban on guardian property; honor-lovers drop
  dialectic and the property ban; money-lovers close the academy, fix a property qualification
  and charge the poor rent; the people want the lot; the tyrant wants taxes and war.
- **Inertia.** A change must be carried five years running before it takes effect.
- **Judgement.** The noise with which the city reads a soul depends on the actual council: a
  ruler without gold in the soul, or one conceived after the nuptial number was missed, tests
  badly (546d-e). Bad testing lets the wrong souls into the guardian class and, later, into
  council, which makes testing worse. That loop is the whole engine of decline. Nothing forces it,
  and in some cities it never closes.
- **Three things are not voted.** The guardians' faction struggle, which settles on the
  timocratic compromise once enough of them have bronze in the soul (547a-c). The rising of the
  poor against a few weak rich (556e-557a), which brings the lot. The champion of the people who
  becomes a tyrant in an unequal democracy (565c-566a). When a tyrant dies the strongest of the
  guard usually takes his place; otherwise office falls back to the lot.
- **Recovery is possible.** Philosophers can take office back, but only once the guardian class
  is sound enough to consent, which needs the testing of souls to have been running.

Across seeds the results differ honestly: some cities stand for the whole 300 years, some fall
to timocracy and stop there, some swing between oligarchy and democracy, some end in tyranny.
The tests check the mechanisms (a philosopher majority preserves everything; a spirited majority
ends dialectic and the property ban after five years; no revolt without paupers; the first fall
is always the compromise; tyranny only ever follows democracy), not a fixed outcome.

## The rules encoded

| Rule | Where in the text | How it runs |
|---|---|---|
| Tripartite soul | IV 435-441 | Each citizen has reason, spirit and appetite; the strongest part is their true metal, hidden from the city |
| Myth of the Metals | III 414-415, 537a | Rulers observe children at play (7) and test at 10, 18, 20, 30, 35 and 50; a craftsman's gold child is raised up, a guardian's bronze child sent down |
| One person, one job | II 370, IV 433 | Craftsmen take one craft at 14 and keep it; job-hopping appears only where the council permits it |
| Guardian education | II-III, VII 535-540 | Music and gymnastics to 17, military training to 20, mathematics to 30 for the gold, dialectic to 35 for the best, offices to 50, then philosophy and rule in turn |
| Guardians own nothing | III 416-417 | Fed from a levy on the craftsmen; wealth 0 while communal living stands; nothing private passes to them by inheritance |
| Community of women and children | V 457-461 | Yearly festivals with rigged lots pair the best with the best, gold before silver; women 20-40 and men 25-55; children go to the rearing pen and never learn their parents; children of unsanctioned unions are not admitted |
| Women as guardians | V 451-457 | Women are sorted, educated and fight alongside men |
| The city stays one | IV 423, V 460a | The rulers set the number of marriages each year from recent deaths, war losses and the shortfall against a target of 1,000 |
| Neither wealth nor poverty | IV 421-422 | While the guard stands, craftsmen are kept between half and three times the median holding |
| War | V 466-471 | Auxiliaries of fighting age take the field; those who leave the ranks are made craftsmen; the brave are crowned |
| The nuptial number | VIII 546 | After a grace period each festival carries a small chance the rulers err, larger when their judgement is poor; children conceived afterward are noisier, more appetitive, and poor testers themselves |
| Division of the land | VIII 547b-c | The moment the property ban falls, every guardian whose appetite outweighs reason takes a share |
| Rent | VIII 555c-e | Where the council allows it, the poor pay part of their earnings to those above the median |
| The happiness of the regimes | IX 587e | The just king lives 729 times more pleasantly than the tyrant |

Every number lives in `src/engine/config.ts` with its reference.

## Where things are

- `src/engine` is pure TypeScript with no React. `tick.ts` runs the year in order: aging,
  deaths, war, sorting, education, crafts, the economy, the council (selection, then the vote),
  the festival, private households, births, metrics, the unvoted events, classification,
  placement. Each rule is one file in `systems/`. Politics lives in `regime/`: the interests and
  their preferences in `institutions.ts`, the vote in `vote.ts`, the faction struggle, revolt
  and champion in `events.ts`, and the council's judgement in `judgement.ts`.
- `src/ui` is the React app: the canvas map in `map/`, hand-drawn SVG charts in `charts/`, the
  inspector, chronicle and controls in `panels/` and `controls/`.
- `scripts/calibrate.ts` prints a run per seed; `VERBOSE=1` prints every tenth year.

Moderation is an interpretation of 432a: an adult consents to the order of the city when they
stand where their nature places them and accept the part of the soul that rules. Moderation is
the mean of that consent across the three natures, so a resentful minority counts.
