// MansWell Voyage (was Logbook) · the logic. Travel only: reads the Atlas journeys (PP_Trips, never changes them) and reads/writes the LB_ tabs.
// Never reads or writes Pocket or Lens. Every Logbook row carries the Atlas journey ID (TrId), so Atlas can read lbTotals() later.
import { DB } from '../core.js';
import * as P from '../passport/engine.js';

export { P };
/* ───────── constants ───────── */
export const CATS = [
  { k: 'trans', n: 'Transportation', s: 'Transport', c: '#FF8A3D', e: '🚗' },
  { k: 'stay', n: 'Accommodation', s: 'Stay', c: '#B48CFF', e: '🛏️' },
  { k: 'meal', n: 'Meals', s: 'Meals', c: '#E9B949', e: '🍜' },
  { k: 'ess', n: 'Essentials', s: 'Essentials', c: '#5ED1C9', e: '🧴' },
  { k: 'souv', n: 'Souvenir', s: 'Souvenir', c: '#E2367A', e: '🎁' },
  { k: 'fun', n: 'Entertainment', s: 'Fun', c: '#6AA8FF', e: '🎟️' }];
export const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
/** The usual mix used to split a total budget. */
export const MIX = { trans: 0.25, stay: 0.27, meal: 0.2, ess: 0.1, souv: 0.08, fun: 0.1 };
export const MODES = [['bike', 'Bike', '🏍️'], ['car', 'Car', '🚗'], ['grab', 'Grab', '🚕'], ['bus', 'Bus', '🚌'], ['train', 'Train', '🚆'], ['walk', 'Walk', '🚶'], ['boat', 'Boat', '⛴️'], ['flight', 'Flight', '✈️']];
export const MODE = Object.fromEntries(MODES.map(m => [m[0], { k: m[0], n: m[1], e: m[2] }]));
/** Journey badges: one word per theme, no scores. */
export const BADGES = [
  { k: 'roads', n: 'Roads', e: '🛣️', o: ['Epic', 'Twisty', 'Smooth', 'Rough', 'Off-road'] },
  { k: 'scenery', n: 'Scenery', e: '🏔️', o: ['Breathtaking', 'Beautiful', 'Pleasant', 'Ordinary'] },
  { k: 'comfort', n: 'Riding comfort', e: '🏍️', o: ['Easy', 'Comfortable', 'Tiring', 'Tough'] },
  { k: 'food', n: 'Food & hospitality', e: '🍜', o: ['Unforgettable', 'Warm', 'Good', 'Meh'] },
  { k: 'value', n: 'Value for money', e: '💰', o: ['Great value', 'Fair', 'Pricey'] }];
/** What you found there. */
export const FINDS = [['cafe', 'Best cafe', '☕'], ['stay', 'Best stay', '🛏️'], ['meal', 'Best meal', '🍜'], ['street', 'Best street food', '🥢'], ['view', 'Best viewpoint', '🏞️'], ['road', 'Best road or pass', '🛣️'],
  ['gem', 'Hidden gem', '💎'], ['photo', 'Best photo spot', '📸'], ['buy', 'Must buy', '🎁'], ['people', 'Kindest people', '🤝'], ['tip', 'Tip for next time', '💡'], ['avoid', 'Skip next time', '⚠️']]
  .map(([k, n, e]) => ({ k, n, e }));
export const FIND = Object.fromEntries(FINDS.map(f => [f.k, f]));
export const BACK = [['yes', 'Yes, again'], ['maybe', 'Maybe'], ['once', 'Once was enough']];
export const EVEREST = 8849;
export const DAYC = ['#FF8A3D', '#5ED1C9', '#B48CFF', '#E9B949', '#6AA8FF', '#E2367A', '#34C77B', '#FF6B6B', '#C8A2FF', '#7FD4FF'];
const SYM = { MYR: 'RM', VND: '₫', THB: '฿', JPY: '¥', CNY: '¥', KRW: '₩', IDR: 'Rp', SGD: 'S$', USD: '$', EUR: '€', GBP: '£', TWD: 'NT$', PHP: '₱', INR: '₹', AUD: 'A$', NZD: 'NZ$', HKD: 'HK$', TRY: '₺', CHF: 'CHF', KHR: '៛', LAK: '₭', MMK: 'K', BND: 'B$' };
export const sym = cur => SYM[cur] || cur || '';
export const n0 = v => Math.round(Number(v) || 0).toLocaleString('en-US');
export const n1 = v => (Math.round((Number(v) || 0) * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
export const n2 = v => (Number(v) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const RM = v => 'RM ' + n0(v);
export const RM2 = v => 'RM ' + n2(v);
/** Local money: no decimals for big-unit currencies (₫ 180,000), two otherwise. */
export const money = (v, cur) => (sym(cur) + (sym(cur).length > 1 && !/\$/.test(sym(cur)) ? ' ' : '') + ((Number(v) || 0) >= 1000 || /VND|IDR|KRW|JPY|KHR|LAK|MMK/.test(cur) ? n0(v) : n2(v)));
/** 90 → "1h 30m", 45 → "45 min" */
export const dur = m => { m = Math.round(Number(m) || 0); if (!m) return '0 min'; const h = Math.floor(m / 60), r = m % 60; return h ? h + 'h' + (r ? ' ' + String(r).padStart(2, '0') + 'm' : '') : r + ' min'; };
/** "1h 30m", "1:30", "90", "1.5h", "45m" → minutes */
export function parseDur(t) {
  const s = String(t || '').trim().toLowerCase(); if (!s) return 0;
  let m = s.match(/^(\d+):(\d{1,2})$/); if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = s.match(/^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?|s)?)?)?$/); if (m && (m[1] || m[2])) return Math.round(Number(m[1] || 0) * 60 + Number(m[2] || 0));
  const v = Number(s.replace(/[^\d.]/g, '')); return isFinite(v) ? Math.round(v) : 0;
}

/* ───────── journeys (from Atlas only) ───────── */
export const journeys = () => P.trips();
export const journey = id => P.trip(id);
export function days(t) {
  const n = P.daysOf(t), out = []; if (!n) return out;
  const d0 = new Date(String(t.TrStart).slice(0, 10) + 'T00:00:00');
  for (let i = 0; i < n; i++) { const d = new Date(d0.getTime() + i * 864e5); out.push({ n: i + 1, d, iso: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }); }
  return out;
}
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const dayLabel = d => WD[d.d.getDay()] + ' ' + d.d.getDate() + ' ' + MO[d.d.getMonth()];
/** The journey's countries (Atlas order), and the main currency to use for cash. */
export const isosOf = id => P.isosOf(id);
export const curOf = iso => (P.BY[iso] && P.BY[iso].cur) || 'MYR';
export const mainCur = id => { const h = P.homeIso(); const iso = isosOf(id).find(x => x !== h) || isosOf(id)[0]; return iso ? curOf(iso) : 'MYR'; };
export const cursOf = id => [...new Set(isosOf(id).map(curOf).filter(c => c && c !== 'MYR'))];
/** Logbook rows whose journey was deleted in Atlas (asked about on the Journeys page). */
export function orphans() {
  const ids = new Set(DB.ppTrips.map(t => t.TrId)), o = {};
  const add = (tab, list, tk, kk) => { for (const r of DB[list]) if (r[tk] && !ids.has(r[tk])) (o[tab] = o[tab] || []).push(r[kk]); };
  add('LB_Stops', 'lbStops', 'LpTrip', 'LpId'); add('LB_Tracks', 'lbTracks', 'TkTrip', 'TkKey'); add('LB_Expenses', 'lbExp', 'ExTrip', 'ExId');
  add('LB_Budget', 'lbBudget', 'BgTrip', 'BgKey'); add('LB_Finds', 'lbFinds', 'FdTrip', 'FdId'); add('LB_Rates', 'lbRates', 'RtTrip', 'RtKey'); add('LB_Results', 'lbResults', 'RsTrip', 'RsTrip');
  return o;
}

/* ───────── itinerary ───────── */
export const stops = (id, day) => DB.lbStops.filter(s => s.LpTrip === id && (day === undefined || Number(s.LpDay) === Number(day))).sort((a, b) => (a.LpDay - b.LpDay) || (a.LpSeq || 0) - (b.LpSeq || 0));
export const hasPin = s => !!(s && (Number(s.LpLat) || Number(s.LpLng)));
export const track = (id, day) => DB.lbTracks.find(t => t.TkKey === id + '|' + day) || null;
export const legsOf = tk => { try { return JSON.parse((tk && tk.TkLegs) || '[]'); } catch (e) { return []; } };
export const eleOf = tk => String((tk && tk.TkEle) || '').split(',').filter(x => x !== '').map(Number);
/** A short signature of a day's stops: if it changes after the track was made, the track is out of date. */
export function sigOf(list) {
  const s = list.map(x => [x.LpId, (Number(x.LpLat) || 0).toFixed(4), (Number(x.LpLng) || 0).toFixed(4), x.LpMode].join(':')).join('|');
  let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36) + list.length;
}
export const isStale = (id, day) => { const tk = track(id, day); return !!tk && String(tk.TkSrc || '').startsWith('made') && tk.TkSrc !== 'made:' + sigOf(stops(id, day)); };
/** Google's encoded polyline → [[lat, lng], …] */
export function decodePoly(str) {
  const out = []; let i = 0, lat = 0, lng = 0; str = String(str || '');
  while (i < str.length) {
    let b, sh = 0, r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i < str.length); lat += r & 1 ? ~(r >> 1) : r >> 1;
    sh = 0; r = 0; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32 && i < str.length); lng += r & 1 ? ~(r >> 1) : r >> 1;
    out.push([lat / 1e5, lng / 1e5]);
  }
  return out;
}
export const hav = (a, b) => { const R = 6371, r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r, x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
/** The points to draw for a day: the made track, else straight lines between pins. */
export function lineOf(id, day) {
  const tk = track(id, day); if (tk && tk.TkPoly) return { pts: decodePoly(tk.TkPoly), road: true };
  const p = stops(id, day).filter(hasPin).map(s => [Number(s.LpLat), Number(s.LpLng)]);
  return { pts: p, road: false };
}
/** "09:30" → 570 */
const hm = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
/** Travel time into stop i: its arrival minus (the previous arrival + how long you stayed there). */
/** The start's time is when you left it; any other stop: arrived + stayed. */
const leftAt = (list, i) => { const a = hm(list[i].LpArr); return a === null ? null : a + (i === 0 ? 0 : Number(list[i].LpStay) || 0); };
export function legMin(list, i) {
  if (i < 1) return null; const a = leftAt(list, i - 1), b = hm(list[i].LpArr); if (a === null || b === null) return null;
  const m = b - a; return m < 0 ? null : m; // a time that doesn't add up is left out (shown as ⚠), never wrapped round to the next day
}
/** Minutes the times are off by when you'd have arrived before you left the last place (0 = fine). */
export function timeClash(list, i) { if (i < 1) return 0; const a = leftAt(list, i - 1), b = hm(list[i].LpArr); return a !== null && b !== null && b < a ? a - b : 0; }
/** km always come from the GPX track. */
export function dayKm(id, day) { const tk = track(id, day); return tk ? Number(tk.TkKm) || 0 : 0; }
export function dayMin(id, day) { const l = stops(id, day); let m = 0, any = false; for (let i = 1; i < l.length; i++) { const v = legMin(l, i); if (v !== null) { m += v; any = true; } } return any ? m : 0; }
/** A leg that can't be right (faster than 130 km/h on the road, or very far for its mode): a pin is probably wrong. */
export function oddLeg(list, i, lg) {
  if (!lg || !lg.km || i < 1) return false; const mode = list[i].LpMode; if (mode === 'flight') return false;
  const m = legMin(list, i); if (m) return lg.km / (m / 60) > (mode === 'walk' ? 12 : 130);
  return lg.km > (mode === 'walk' ? 40 : 700);
}
/** Climb, descent, highest and steepest for a day (from the made track). */
export function meters(id, day) {
  const tk = track(id, day); if (!tk) return null;
  const e = eleOf(tk), km = Number(tk.TkKm) || 0; let steep = 0;
  if (e.length > 2 && km) { const step = km * 1000 / (e.length - 1); for (let i = 2; i < e.length; i++) steep = Math.max(steep, Math.abs(e[i] - e[i - 2]) / (2 * step) * 100); }
  return { km, up: Number(tk.TkUp) || 0, down: Number(tk.TkDown) || 0, max: Number(tk.TkMax) || 0, steep: Math.min(steep, 40), ele: e };
}
/** Where each stop falls along the day's elevation profile (0..1). */
export function stopFractions(id, day) {
  const legs = legsOf(track(id, day)), tot = legs.reduce((s, l) => s + (l.km || 0), 0); if (!tot) return [];
  let c = 0; const out = [0]; for (const l of legs) { c += l.km || 0; out.push(c / tot); } return out;
}

/* ───────── money ───────── */
export const rateRow = (id, cur) => DB.lbRates.find(r => r.RtKey === id + '|' + cur) || null;
/** How much of the currency 1 MYR buys, set once for the journey. */
export const rate = (id, cur) => (cur === 'MYR' ? 1 : Number((rateRow(id, cur) || {}).RtRate) || 0);
export const expenses = id => DB.lbExp.filter(e => e.ExTrip === id).sort((a, b) => (a.ExDay - b.ExDay) || (a.ExSeq || 0) - (b.ExSeq || 0));
export const myrOf = e => Number(e.ExMyr) || 0;
/** Card: what the card really cost compared to your cash rate (percent), or null. */
export function cardCost(e, id) {
  if (e.ExPay !== 'card' || !Number(e.ExBill) || !Number(e.ExMyr)) return null;
  const r = rate(id || e.ExTrip, e.ExBillCur); if (!r) return null;
  return (Number(e.ExMyr) / (Number(e.ExBill) / r) - 1) * 100;
}
export function spend(id) {
  const by = Object.fromEntries(CATS.map(c => [c.k, 0])); let tot = 0, cash = 0, card = 0;
  for (const e of expenses(id)) { const v = myrOf(e); tot += v; by[e.ExCat] = (by[e.ExCat] || 0) + v; if (e.ExPay === 'card') card += v; else cash += v; }
  return { tot, by, cash, card, n: expenses(id).length };
}
export function budget(id) {
  const by = Object.fromEntries(CATS.map(c => [c.k, 0])); let tot = 0;
  for (const b of DB.lbBudget) if (b.BgTrip === id) { by[b.BgCat] = Number(b.BgAmt) || 0; tot += Number(b.BgAmt) || 0; }
  return { by, tot };
}
/** Split a total by the usual mix, rounded to RM 10, the last category takes the rounding. */
export function splitMix(total) {
  const out = {}; let used = 0; CATS.forEach((c, i) => { const v = i === CATS.length - 1 ? Math.max(0, total - used) : Math.round(total * MIX[c.k] / 10) * 10; out[c.k] = v; used += v; }); return out;
}
const BAND = { S1: [20000, 30000], S2: [15000, 20000], S3: [10000, 15000], A: [6500, 10000], B: [4000, 6500], C: [1500, 4000], D: [0, 1500] };
/** The Wanderlist tier of one of the journey's countries, if you gave one. */
export function tierOf(id) { for (const iso of isosOf(id)) { const p = P.place(iso); if (p && P.isTier(p.PlTier)) return p.PlTier; } return ''; }
export const tierBudget = c => (!P.isTier(c) ? 0 : (c[0] === 'S' ? BAND[c] : BAND[c[0]])[1] || 1500);
/** The tier the journey really was, from what you spent and how long it was. */
export function actualTier(spent, nDays) {
  if (!spent) return '';
  if (spent >= 10000) return spent > 20000 ? 'S1' : spent >= 15000 ? 'S2' : 'S3';
  const b = spent >= 6500 ? 'A' : spent >= 4000 ? 'B' : spent >= 1500 ? 'C' : 'D', l = nDays >= 21 ? 1 : nDays >= 13 ? 2 : nDays >= 6 ? 3 : 4;
  return b + l;
}

/* ───────── results ───────── */
export const result = id => DB.lbResults.find(r => r.RsTrip === id) || null;
export const blankResult = id => ({ RsTrip: id, RsRoads: 0, RsScenery: 0, RsComfort: 0, RsFood: 0, RsValue: 0, RsVerdict: '', RsBack: '', RsKmMode: '', RsBadges: '' });
export const badges = id => { try { return JSON.parse((result(id) || {}).RsBadges || '{}') || {}; } catch (e) { return {}; } };
export const finds = id => DB.lbFinds.filter(f => f.FdTrip === id).sort((a, b) => FINDS.findIndex(x => x.k === a.FdKind) - FINDS.findIndex(x => x.k === b.FdKind) || (a.FdSeq || 0) - (b.FdSeq || 0));
export const hasDiscovery = id => Object.keys(badges(id)).length > 0 || finds(id).length > 0 || !!(result(id) || {}).RsVerdict;

/** One set of totals per journey. Atlas reads this later (lbTotals is the connection). */
export function lbTotals(id) {
  const t = journey(id); if (!t) return null;
  const ds = days(t).map(d => d.n), st = stops(id), sp = spend(id), bg = budget(id);
  let km = 0, min = 0, up = 0, hi = 0, tracks = 0;
  for (const d of ds) {
    km += dayKm(id, d); min += dayMin(id, d);
    const tk = track(id, d); if (tk) { tracks++; up += Number(tk.TkUp) || 0; hi = Math.max(hi, Number(tk.TkMax) || 0); }
  }
  const r = result(id) || {};
  return { trip: id, name: t.TrName, days: ds.length, stops: st.length, tracks, km, min, climb: up, highest: hi, spent: sp.tot, cash: sp.cash, card: sp.card,
    budget: bg.tot, badges: badges(id), finds: finds(id).length, verdict: r.RsVerdict || '', back: r.RsBack || '', tier: actualTier(sp.tot, ds.length),
    filled: { itin: st.length > 0, exp: sp.n > 0, disc: hasDiscovery(id) } };
}
export const completeness = id => { const f = lbTotals(id).filled; return (f.itin + f.exp + f.disc) / 3; };

/* ───────── GPX ───────── */
const xe = s => String(s ?? '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
/** Height at each track point: the samples are spread evenly along the line. */
function eleAlong(pts, ele) {
  if (!ele.length) return pts.map(() => null);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hav(pts[i - 1], pts[i]));
  const tot = cum[cum.length - 1] || 1;
  return cum.map(c => { const f = c / tot * (ele.length - 1), i = Math.floor(f), r = f - i; return Math.round(ele[i] + ((ele[i + 1] ?? ele[i]) - ele[i]) * r); });
}
/** A .gpx file for the journey (or one day): one track per day, every pinned stop as a waypoint, with heights. */
export function gpx(id, onlyDay) {
  const t = journey(id), ds = days(t).filter(d => !onlyDay || d.n === onlyDay);
  let wpt = '', trk = '', nW = 0, nT = 0;
  for (const d of ds) {
    const tk = track(id, d.n), ln = lineOf(id, d.n), ele = eleAlong(ln.pts, eleOf(tk));
    stops(id, d.n).filter(hasPin).forEach(s => {
      let e = ''; if (tk && ln.pts.length) { let bi = 0, bd = 1e9; ln.pts.forEach((p, i) => { const dd = Math.abs(p[0] - s.LpLat) + Math.abs(p[1] - s.LpLng); if (dd < bd) { bd = dd; bi = i; } }); if (ele[bi] !== null) e = `<ele>${ele[bi]}</ele>`; }
      wpt += `<wpt lat="${Number(s.LpLat).toFixed(6)}" lon="${Number(s.LpLng).toFixed(6)}">${e}<name>${xe(s.LpPlace)}</name><desc>${xe('Day ' + d.n + (s.LpCity ? ' · ' + s.LpCity : '') + (s.LpNote ? ' · ' + s.LpNote : ''))}</desc></wpt>\n`; nW++;
    });
    if (ln.pts.length > 1) {
      trk += `<trk><name>${xe(t.TrName + ' · Day ' + d.n)}</name><type>${ln.road ? 'route' : 'straight'}</type><trkseg>\n` + ln.pts.map((p, i) => `<trkpt lat="${p[0].toFixed(6)}" lon="${p[1].toFixed(6)}">${ele[i] !== null ? `<ele>${ele[i]}</ele>` : ''}</trkpt>`).join('\n') + '\n</trkseg></trk>\n'; nT++;
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="MansWell Voyage" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${xe(t.TrName)}</name><time>${new Date().toISOString()}</time></metadata>\n${wpt}${trk}</gpx>\n`;
  return { xml, name: (t.TrName || 'journey').replace(/[\\/:*?"<>|]/g, ' ').trim() + (onlyDay ? ' · Day ' + onlyDay : ''), wpts: nW, trks: nT };
}
