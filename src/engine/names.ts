import type { Rng } from './rng';
import type { Sex } from './types';

const STEMS = [
  'Ari', 'Kle', 'Demo', 'Theo', 'Phil', 'Xen', 'Lys', 'Nik', 'Tim', 'Kall', 'Eu', 'Poly', 'Hipp',
  'Andr', 'Diog', 'Ana', 'Pro', 'Her', 'Iso', 'Pher', 'Meg', 'Leon', 'Aga', 'Alk', 'Char', 'Dio',
  'Epi', 'Glau', 'Hiero', 'Kri', 'Mel', 'Nau', 'Ono', 'Pan', 'Rhod', 'Sim', 'Thra', 'Zen',
];
const MALE = ['stos', 'on', 'phon', 'kles', 'machos', 'andros', 'ippos', 'doros', 'krates', 'genes', 'stratos', 'laos', 'menes', 'nikos', 'theos', 'medes', 'archos'];
const FEMALE = ['a', 'ia', 'ippe', 'ike', 'sta', 'one', 'thea', 'doria', 'kleia', 'phile', 'strate', 'nike', 'agora', 'ippa', 'tima'];

export function makeName(rng: Rng, sex: Sex): string {
  const stem = rng.pick(STEMS);
  const end = rng.pick(sex === 'M' ? MALE : FEMALE);
  // Avoid a doubled vowel at the join ("Ono" + "on" would give "Onoon").
  const last = stem[stem.length - 1];
  const joined = last === end[0] ? stem.slice(0, -1) + end : stem + end;
  return joined;
}
