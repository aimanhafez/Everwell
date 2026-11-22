// MansWell Passport · the travel logic. Travel only: reads and writes the PP_ tabs, never Pocket or Lens.
// One rule for status everywhere: Visited = a trip includes it, or you marked it visited before Atlas.
// Wishlist = you wished for it and it isn't visited. Not yet = everything else. So a country can never be both.
import { DB, Today } from '../core.js';
import { COUNTRY_ROWS } from './countries.js';
import { UK_PARTS } from './ukparts.js';

export const COUNTRIES = COUNTRY_ROWS.map(r => ({ iso: r[0], name: r[1], iso3: r[2], num: r[3], cap: r[4], cont: r[5], cur: r[6], curName: r[7], lat: r[8], lng: r[9], ex: !!r[10] })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
export const BY = Object.fromEntries(COUNTRIES.map(c => [c.iso, c]));
/** Since 3.12 the United Kingdom is England, Scotland, Wales and Northern Ireland. "GB" stays readable for entries saved
 *  before (until they are moved, see ukLeft), but it is not on the map, in search or in the count. */
export const UK = ['GB-ENG', 'GB-SCT', 'GB-WLS', 'GB-NIR'];
BY.GB = { iso: 'GB', name: 'United Kingdom', iso3: 'GBR', num: '826', cap: 'London', cont: 'Europe', cur: 'GBP', curName: 'British pound', lat: 54, lng: -2, ex: 2, legacy: true };
/** Google and OpenStreetMap still say "GB": the region to search in for a country of ours. */
export const regionOf = iso => (String(iso || '').startsWith('GB-') ? 'GB' : iso);
const inRing = (r, la, lo) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [y1, x1] = r[i], [y2, x2] = r[j]; if ((y1 > la) !== (y2 > la) && lo < (x2 - x1) * (la - y1) / (y2 - y1) + x1) c = !c; } return c; };
/** Which of the four a point is in (the nearest one for a pin just off the coast). */
export function ukPartAt(lat, lng) {
  lat = Number(lat); lng = Number(lng); if (!lat && !lng) return '';
  for (const k of UK) if (UK_PARTS[k].some(r => inRing(r, lat, lng))) return k;
  let best = '', bd = 1e9; for (const k of UK) for (const r of UK_PARTS[k]) for (const [y, x] of r) { const d = (y - lat) ** 2 + ((x - lng) * 0.6) ** 2; if (d < bd) { bd = d; best = k; } }
  return bd < 1 ? best : '';
}
/** Entries saved as "United Kingdom" before 3.12 that still need England, Scotland, Wales or Northern Ireland. */
export function ukLeft() {
  const tids = new Set(DB.ppStops.filter(s => s.StIso === 'GB').map(s => s.StTrip));
  return { trips: DB.ppTrips.filter(t => tids.has(t.TrId)), places: DB.ppPlaces.filter(p => p.PlIso === 'GB' && (p.PlStatus === 'wish' || p.PlStatus === 'been')),
    stops: DB.lbStops.filter(s => s.LpCountry === 'GB'), junk: DB.ppPlaces.filter(p => p.PlIso === 'GB' && p.PlStatus !== 'wish' && p.PlStatus !== 'been') };
}
const UK_NAME = { england: 'GB-ENG', scotland: 'GB-SCT', wales: 'GB-WLS', cymru: 'GB-WLS', 'northern ireland': 'GB-NIR' };
/** A search result's country code → ours: "GB" becomes the part (from its province name, else its pin). */
export function ccToIso(cc, prov, lat, lng) {
  cc = String(cc || '').toUpperCase(); if (cc !== 'GB') return BY[cc] && !BY[cc].legacy ? cc : '';
  return UK_NAME[String(prov || '').trim().toLowerCase()] || ukPartAt(lat, lng) || '';
}
export const WORLD_N = COUNTRIES.filter(c => !c.ex).length; // 219: every place in Atlas counts as a country (3.13)
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
/** A trip confirmed in Wanderlist (TrPlan 'going') stays upcoming until its end date has passed; then it is a normal, completed journey. */
export const isUpcoming = t => !!t && t.TrPlan === 'going' && String(t.TrEnd || t.TrStart || '').slice(0, 10) >= Today();
const done = () => DB.ppTrips.filter(t => !isUpcoming(t));
/** Upcoming trips (Wanderlist › Going and Voyage only), soonest first. */
export const upcoming = () => DB.ppTrips.filter(isUpcoming).sort((a, b) => (a.TrStart || '').localeCompare(b.TrStart || ''));
/** Completed journeys only (Atlas › Journeys, Odyssey, insights). */
export const trips = () => done().sort((a, b) => (b.TrStart || '').localeCompare(a.TrStart || '') || (b.TrAdded || '').localeCompare(a.TrAdded || ''));
export const trip = id => DB.ppTrips.find(t => t.TrId === id) || null;
export const stopsOf = id => DB.ppStops.filter(s => s.StTrip === id).sort((a, b) => (a.StSeq || 0) - (b.StSeq || 0));
export const isosOf = id => stopsOf(id).map(s => s.StIso);
export const tripsIn = iso => { const ids = new Set(DB.ppStops.filter(s => s.StIso === iso).map(s => s.StTrip)); return trips().filter(t => ids.has(t.TrId)); };
export const place = iso => DB.ppPlaces.find(p => p.PlIso === iso) || null;
export const photosOf = id => DB.ppPhotos.filter(p => p.PhTrip === id).sort((a, b) => (a.PhSeq || 0) - (b.PhSeq || 0) || (a.PhId < b.PhId ? -1 : 1));
export const coverOf = t => (t && t.TrCover && DB.ppPhotos.find(p => p.PhId === t.TrCover && p.PhKind !== 'video')) || photosOf(t && t.TrId).find(p => p.PhKind !== 'video') || null;

/** iso → 'visited' | 'wish' | 'none' (home is 'home' for the map only) */
let memo = { sig: '', st: null };
function statusMap() {
  const sig = DB.ppStops.length + '|' + DB.ppPlaces.map(p => p.PlIso + p.PlStatus).join(',') + '|' + DB.ppTrips.map(t => t.TrId + (isUpcoming(t) ? 'u' : '')).join(',') + '|' + DB.ppStops.map(s => s.StKey).join(',');
  if (memo.sig === sig) return memo.st;
  const st = {}, tripIds = new Set(done().map(t => t.TrId));
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

/** Overview numbers. Countries = all 219 (Taiwan, Faroe Islands … count too). Home isn't counted. */
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
/** Borderless: one stamp per visit: each journey to a country, plus countries marked visited without a journey. Oldest first. */
export function stamps() {
  const home = homeIso(), out = [], byTrip = new Set();
  for (const t of trips()) for (const iso of new Set(isosOf(t.TrId))) { const c = BY[iso]; if (!c || c.legacy || iso === home) continue; out.push({ c, at: String(t.TrStart || '9999'), trip: t }); byTrip.add(iso); }
  for (const p of DB.ppPlaces) { const c = BY[p.PlIso]; if (p.PlStatus === 'been' && c && !c.legacy && p.PlIso !== home && !byTrip.has(p.PlIso)) out.push({ c, at: String(p.PlFirst || '9999') }); }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.c.name.localeCompare(b.c.name));
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
const UK_ALIAS = ['uk', 'united kingdom', 'britain', 'great britain', 'gb', 'gbr'];
export function search(q, f = {}) {
  const k = fold(q).trim();
  return COUNTRIES.filter(c => (!k || fold(c.name).includes(k) || c.iso.toLowerCase() === k || c.iso3.toLowerCase() === k || fold(c.cap).includes(k) || (c.iso.startsWith('GB-') && k.length > 1 && UK_ALIAS.some(a => a.startsWith(k))))
    && (!f.cont || c.cont === f.cont) && (!f.st || status(c.iso) === f.st))
    .map((c, i) => [k && fold(c.name).startsWith(k) ? 0 : k && c.iso.startsWith('GB-') && UK_ALIAS.some(a => a.startsWith(k)) ? 1 : k && fold(c.name).includes(k) ? 2 : 3, i, c]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
}

/* ───────── Wanderlist: tiers and "I'm going" ───────── */
export const TIER_LETTERS = ['S', 'A', 'B', 'C', 'D'];
export const TIER_COLOR = { S: '#E9B949', A: '#FF8A3D', B: '#B48CFF', C: '#5ED1C9', D: '#8A9099' };
export const TIER_BUDGET = { A: 'RM8,001 – 12,000', B: 'RM5,001 – 8,000', C: 'RM2,001 – 5,000', D: 'RM2,000 & below' };
export const TIER_SHORT = { S: 'RM12k+', A: '8k–12k', B: '5k–8k', C: '2k–5k', D: '≤ 2k' };
export const S_LEVELS = { S1: 'Above RM20,000', S2: 'RM16,501 – 20,000', S3: 'RM12,001 – 16,500' };
export const LENGTHS = { 1: '22+ days', 2: '15–21 days', 3: '8–14 days', 4: '7 days or less' };
export const LEN_SHORT = { 1: '22+ d', 2: '15–21 d', 3: '8–14 d', 4: '≤ 7 d' };
export const isTier = c => /^(S[1-3]|[ABCD][1-4])$/.test(String(c || ''));
/** "B2" → "15–21 days · RM5,001 – 8,000"; "S2" → "RM16,501 – 20,000" */
export const tierText = c => !isTier(c) ? '' : c[0] === 'S' ? S_LEVELS[c] : LENGTHS[c[1]] + ' · ' + TIER_BUDGET[c[0]];
export const tierRank = c => (isTier(c) ? TIER_LETTERS.indexOf(c[0]) * 10 + Number(c[1]) : 999);
export const isGoing = p => !!p && p.PlGo === 'going';
/** Countries already inside an upcoming trip (they show on the trip's card, not as their own rows). */
export const upIsos = () => new Set(upcoming().flatMap(t => isosOf(t.TrId)));
/** Days until an upcoming trip starts (0 = on the road now). */
export const daysTo = t => Math.max(0, Math.round((d0(t.TrStart) - d0(Today())) / 864e5));
export const going = () => { const u = upIsos(); return wishlist().filter(p => isGoing(p) && !u.has(p.PlIso)).sort((a, b) => (a.PlGoYear || 9999) - (b.PlGoYear || 9999) || (a.PlSeq || 0) - (b.PlSeq || 0)); };
export const dreaming = () => { const u = upIsos(); return wishlist().filter(p => !isGoing(p) && !u.has(p.PlIso)); };
/** A dream = one Dreaming row: countries added together share PlDream (one country on its own has none).
 *  Priority, tier, places and notes are the same on every country of the dream. */
const dreamKey = p => p.PlDream || 'c:' + p.PlIso;
export function dreams() {
  const m = new Map(), u = upIsos(), inTrip = new Set();
  wishlist().forEach(p => { if (u.has(p.PlIso)) inTrip.add(dreamKey(p)); });
  dreaming().forEach(p => { const k = dreamKey(p); if (inTrip.has(k)) return; if (!m.has(k)) m.set(k, []); m.get(k).push(p); });
  return [...m.entries()].map(([id, ps]) => { ps.sort((a, b) => (a.PlSeq || 0) - (b.PlSeq || 0)); const h = ps[0];
    return { id, group: h.PlDream || '', isos: ps.map(p => p.PlIso), places: ps, seq: h.PlSeq || 0, pri: h.PlPri || 'M', tier: h.PlTier || '', see: h.PlSee || '', note: h.PlNote || '', cont: (BY[h.PlIso] || {}).cont || '' }; })
    .sort((a, b) => a.seq - b.seq);
}
/** The dream a wished country belongs to (even if it is in an upcoming trip). */
export function dreamOf(iso) {
  const p = place(iso); if (!p) return null; const k = dreamKey(p);
  const ps = wishlist().filter(x => dreamKey(x) === k).sort((a, b) => (a.PlSeq || 0) - (b.PlSeq || 0)); if (!ps.length) return null; const h = ps[0];
  return { id: k, group: h.PlDream || '', isos: ps.map(x => x.PlIso), places: ps, seq: h.PlSeq || 0, pri: h.PlPri || 'M', tier: h.PlTier || '', see: h.PlSee || '', note: h.PlNote || '', cont: (BY[h.PlIso] || {}).cont || '' };
}
export const dreamName = d => d.isos.map(i => (BY[i] || {}).name).join(' · ');

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
