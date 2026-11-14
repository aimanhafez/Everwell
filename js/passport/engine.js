// MansWell Passport · the travel logic. Travel only: reads and writes the PP_ tabs, never Pocket or Lens.
// One rule for status everywhere: Visited = a trip includes it, or you marked it visited before Atlas.
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
const MS = [['first', 'First Light', 'Your first country', 1], ['wayfarer', 'Wayfarer', '5 countries', 5], ['nomad', 'Nomad Soul', '10 countries', 10], ['carto', 'Cartographer', '25 countries', 25]];
export function milestones() {
  const fv = firstVisits().filter(x => !x.c.ex), s = stats();
  const out = MS.map(([id, name, desc, need]) => ({ id, name, desc, need, have: Math.min(fv.length, need), done: fv.length >= need, by: fv.length >= need ? fv[need - 1].c : null }));
  out.push({ id: 'seven', name: 'Seven Horizons', desc: 'Every continent', need: 7, have: s.conts, done: s.conts >= 7, by: null, next: CONTINENTS.filter(c => !s.contSet.has(c))[0] || '' });
  out.push({ id: 'bearer', name: 'Atlas Bearer', desc: '50 countries', need: 50, have: Math.min(fv.length, 50), done: fv.length >= 50, by: fv.length >= 50 ? fv[49].c : null });
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

/* ───────── Wanderlist: tiers and "I'm going" ───────── */
export const TIER_LETTERS = ['S', 'A', 'B', 'C', 'D'];
export const TIER_COLOR = { S: '#E9B949', A: '#FF8A3D', B: '#B48CFF', C: '#5ED1C9', D: '#8A9099' };
export const TIER_BUDGET = { A: 'RM6,500 – 10,000', B: 'RM4,000 – 6,500', C: 'RM1,500 – 4,000', D: 'Below RM1,500' };
export const TIER_SHORT = { S: 'RM10k+', A: '6.5k–10k', B: '4k–6.5k', C: '1.5k–4k', D: '< 1.5k' };
export const S_LEVELS = { S1: 'Above RM20,000', S2: 'RM15,000 – 20,000', S3: 'RM10,000 – 15,000' };
export const LENGTHS = { 1: '21–30 days', 2: '13–20 days', 3: '6–12 days', 4: 'Below 5 days' };
export const LEN_SHORT = { 1: '21–30 d', 2: '13–20 d', 3: '6–12 d', 4: '≤ 5 d' };
export const isTier = c => /^(S[1-3]|[ABCD][1-4])$/.test(String(c || ''));
/** "B2" → "13–20 days · RM4,000 – 6,500"; "S2" → "RM15,000 – 20,000" */
export const tierText = c => !isTier(c) ? '' : c[0] === 'S' ? S_LEVELS[c] : LENGTHS[c[1]] + ' · ' + TIER_BUDGET[c[0]];
export const tierRank = c => (isTier(c) ? TIER_LETTERS.indexOf(c[0]) * 10 + Number(c[1]) : 999);
export const isGoing = p => !!p && p.PlGo === 'going';
export const going = () => wishlist().filter(isGoing).sort((a, b) => (a.PlGoYear || 9999) - (b.PlGoYear || 9999) || (a.PlSeq || 0) - (b.PlSeq || 0));
export const dreaming = () => wishlist().filter(p => !isGoing(p));

/* ───────── route: places per country ───────── */
export const splitPlaces = t => String(t || '').split(/\s*(?:,|→|->|;|\n)\s*/).map(s => s.trim()).filter(Boolean);
/** Each country of a trip with its places. Older trips kept one route for the whole trip: it goes with the first country. */
export function routeOf(t) {
  const st = stopsOf(t.TrId), any = st.some(s => s.StRoute);
  return st.map((s, i) => ({ iso: s.StIso, days: s.StDays, places: splitPlaces(any ? s.StRoute : i === 0 ? t.TrRoute : '') }));
}

/* ───────── facts under the map ───────── */
export function facts() {
  const ts = trips().filter(t => t.TrStart <= Today());
  const cnt = {}; for (const t of ts) for (const iso of new Set(isosOf(t.TrId))) if (iso !== homeIso()) cnt[iso] = (cnt[iso] || 0) + 1;
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1] || BY[a[0]].name.localeCompare(BY[b[0]].name))[0];
  const longest = ts.slice().sort((a, b) => daysOf(b) - daysOf(a))[0];
  const fv = firstVisits().filter(x => x.at !== '9999'), newest = fv[fv.length - 1];
  return { returned: top && top[1] > 1 ? { iso: top[0], n: top[1] } : null, longest: longest || null, newest: newest ? { iso: newest.c.iso, at: newest.at } : null };
}
/** Is the Apps Script new enough for a feature? */
export const srvAtLeast = v => { const a = String(DB.srvVer || '0').split('.').map(Number), b = v.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0); } return true; };
