// MansWell Passport · the travel logic. Travel only: reads and writes the PP_ tabs, never Pocket or Lens.
// One rule for status everywhere: Visited = a trip includes it, or you marked it visited before Passport.
// Wishlist = you wished for it and it isn't visited. Not yet = everything else. So a country can never be both.
import { DB, Today } from '../core.js';
import { COUNTRY_ROWS } from './countries.js';

export const COUNTRIES = COUNTRY_ROWS.map(r => ({ iso: r[0], name: r[1], iso3: r[2], num: r[3], cap: r[4], cont: r[5], cur: r[6], curName: r[7], lat: r[8], lng: r[9], ex: !!r[10] }));
export const BY = Object.fromEntries(COUNTRIES.map(c => [c.iso, c]));
export const WORLD_N = COUNTRIES.filter(c => !c.ex).length; // 195
export const CONTINENTS = ['Africa', 'Antarctica', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];
export const WITH = ['Solo', 'Family', 'Friends', 'Partner', 'Other'];
/** Who you went with: one or more, stored as "Solo, Friends". */
export const withList = t => String((t && t.TrWith) || '').split(',').map(s => s.trim()).filter(Boolean);
export const withTxt = t => withList(t).join(' & ');
export const flagUrl = iso => 'flags/' + String(iso).toLowerCase() + '.svg';

/* dates */
const d0 = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
export const daysOf = t => (t && t.TrStart && t.TrEnd ? Math.max(1, Math.round((d0(t.TrEnd) - d0(t.TrStart)) / 864e5) + 1) : 0);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = s => { if (!s) return ''; const d = d0(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
export const fmtMon = s => { if (!s) return ''; const d = d0(s); return MON[d.getMonth()] + ' ' + d.getFullYear(); };
/** "12–17 Oct 2026", "28 Sep – 3 Oct 2026", "30 Dec 2025 – 4 Jan 2026" */
export function range(a, b) {
  if (!a) return ''; if (!b || b === a) return fmtDay(a);
  const x = d0(a), y = d0(b);
  if (x.getFullYear() !== y.getFullYear()) return fmtDay(a) + ' – ' + fmtDay(b);
  if (x.getMonth() !== y.getMonth()) return x.getDate() + ' ' + MON[x.getMonth()] + ' – ' + y.getDate() + ' ' + MON[y.getMonth()] + ' ' + y.getFullYear();
  return x.getDate() + '–' + y.getDate() + ' ' + MON[y.getMonth()] + ' ' + y.getFullYear();
}
export const yearOf = s => Number(String(s || '').slice(0, 4)) || 0;

/* settings */
export const pget = (k, def) => { const r = DB.ppSettings.find(x => x.PsetKey === k); if (!r) return def; try { return JSON.parse(r.PsetVal); } catch (e) { return r.PsetVal; } };
export const prow = (k, v) => ({ PsetKey: k, PsetVal: JSON.stringify(v) });
export const homeIso = () => pget('home', 'MY');

/* trips, stops, places */
export const trips = () => DB.ppTrips.slice().sort((a, b) => (b.TrStart || '').localeCompare(a.TrStart || '') || (b.TrAdded || '').localeCompare(a.TrAdded || ''));
export const trip = id => DB.ppTrips.find(t => t.TrId === id) || null;
export const stopsOf = id => DB.ppStops.filter(s => s.StTrip === id).sort((a, b) => (a.StSeq || 0) - (b.StSeq || 0));
export const isosOf = id => stopsOf(id).map(s => s.StIso);
export const tripsIn = iso => { const ids = new Set(DB.ppStops.filter(s => s.StIso === iso).map(s => s.StTrip)); return trips().filter(t => ids.has(t.TrId)); };
export const place = iso => DB.ppPlaces.find(p => p.PlIso === iso) || null;
export const photosOf = id => DB.ppPhotos.filter(p => p.PhTrip === id).sort((a, b) => (a.PhSeq || 0) - (b.PhSeq || 0) || (a.PhId < b.PhId ? -1 : 1));
export const coverOf = t => (t && t.TrCover && DB.ppPhotos.find(p => p.PhId === t.TrCover)) || photosOf(t && t.TrId)[0] || null;

/** iso → 'visited' | 'wish' | 'none' (home is 'home' for the map only) */
let memo = { sig: '', st: null };
function statusMap() {
  const sig = DB.ppStops.length + '|' + DB.ppPlaces.map(p => p.PlIso + p.PlStatus).join(',') + '|' + DB.ppTrips.length + '|' + DB.ppStops.map(s => s.StKey).join(',');
  if (memo.sig === sig) return memo.st;
  const st = {}, tripIds = new Set(DB.ppTrips.map(t => t.TrId));
  for (const p of DB.ppPlaces) if (p.PlStatus === 'wish') st[p.PlIso] = 'wish';
  for (const p of DB.ppPlaces) if (p.PlStatus === 'been') st[p.PlIso] = 'visited';
  for (const s of DB.ppStops) if (tripIds.has(s.StTrip)) st[s.StIso] = 'visited';
  memo = { sig, st };
  return st;
}
export const status = iso => statusMap()[iso] || 'none';
export const isVisited = iso => status(iso) === 'visited';
/** Visited only through trips (then the status can't be changed by hand). */
export const byTrip = iso => tripsIn(iso).length > 0;

/** First visit: the earliest trip that includes it, or the month you gave when marking it visited. */
export function firstVisit(iso) {
  const t = tripsIn(iso); const fromTrip = t.length ? t[t.length - 1].TrStart : '';
  const p = place(iso), manual = p && p.PlStatus === 'been' ? String(p.PlFirst || '') : '';
  if (fromTrip && manual) return fromTrip < manual ? fromTrip : manual;
  return fromTrip || manual;
}
export const visitedList = () => COUNTRIES.filter(c => isVisited(c.iso) && c.iso !== homeIso());
export const wishlist = () => DB.ppPlaces.filter(p => p.PlStatus === 'wish' && !isVisited(p.PlIso) && BY[p.PlIso]).sort((a, b) => (a.PlSeq || 0) - (b.PlSeq || 0) || (a.PlAdded || '').localeCompare(b.PlAdded || ''));
export const nextSeq = () => DB.ppPlaces.reduce((m, p) => Math.max(m, Number(p.PlSeq) || 0), 0) + 1;

/** Overview numbers. Countries = the 195; places like Taiwan or Hong Kong are counted apart. Home isn't counted. */
export function stats() {
  const v = visitedList(), countries = v.filter(c => !c.ex), extra = v.filter(c => c.ex);
  const conts = new Set(v.map(c => c.cont));
  const ts = trips().filter(t => t.TrStart <= Today());
  const days = ts.reduce((s, t) => s + daysOf(t), 0);
  return { n: countries.length, extra: extra.length, pct: countries.length / WORLD_N * 100, conts: conts.size, contSet: conts, trips: ts.length, days, wish: wishlist().length, since: ts.length ? ts[ts.length - 1].TrStart : '' };
}

/** Countries in the order you first went there (for stamps and milestones). */
export function firstVisits() {
  return visitedList().map(c => ({ c, at: firstVisit(c.iso) || '9999' })).sort((a, b) => a.at.localeCompare(b.at) || a.c.name.localeCompare(b.c.name));
}
const MS = [['first', 'First Country', 'Your first destination abroad', 1], ['explorer', 'Explorer', '5 countries visited', 5], ['wanderer', 'World Wanderer', '10 countries visited', 10], ['global', 'Global Explorer', '25 countries visited', 25]];
export function milestones() {
  const fv = firstVisits().filter(x => !x.c.ex), s = stats();
  const out = MS.map(([id, name, desc, need]) => ({ id, name, desc, need, have: Math.min(fv.length, need), done: fv.length >= need, by: fv.length >= need ? fv[need - 1].c : null }));
  out.push({ id: 'continental', name: 'Continental Traveller', desc: 'All seven continents', need: 7, have: s.conts, done: s.conts >= 7, by: null, next: CONTINENTS.filter(c => !s.contSet.has(c))[0] || '' });
  return out;
}

/** A stamp's look comes from the country code, so it never changes. */
const STAMP_C = ['#FF8A1F', '#F06AA0', '#B48CFF', '#5ED1C9', '#E9B949', '#FF6F61', '#7FB3FF'];
export function stampOf(iso) { let h = 0; for (const ch of iso) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return { color: STAMP_C[h % STAMP_C.length], sq: h % 3 === 0, rot: ((h >> 3) % 21) - 10 }; }

/* search */
const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function search(q, f = {}) {
  const k = fold(q).trim();
  return COUNTRIES.filter(c => (!k || fold(c.name).includes(k) || c.iso.toLowerCase() === k || c.iso3.toLowerCase() === k || fold(c.cap).includes(k))
    && (!f.cont || c.cont === f.cont) && (!f.st || status(c.iso) === f.st));
}
