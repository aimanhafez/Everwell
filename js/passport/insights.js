// MansWell Atlas · the summary of your journeys, read from Voyage (itinerary, tracks, expenses, your score).
// Travel only: never reads Pocket or Lens. Voyage stays the place where the details are written.
import * as P from './engine.js';
import * as L from '../logbook/engine.js';

const pastTrips = () => P.trips();
const d0 = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
/** Weekdays and weekends (Sat–Sun) of a journey. Public holidays are not counted. */
export function workOff(t) {
  let w = 0, o = 0; const n = P.daysOf(t), a = d0(t.TrStart);
  for (let i = 0; i < n; i++) { const d = new Date(a.getTime() + i * 864e5).getDay(); if (d === 0 || d === 6) o++; else w++; }
  return { w, o };
}
const mainIso = id => { const h = P.homeIso(); return P.isosOf(id).find(x => x !== h) || P.isosOf(id)[0] || ''; };
/** Km on bike legs and minutes on bike legs (from the tracks and your times). */
export function bikeOf(id) {
  const t = P.trip(id); let km = 0, min = 0, all = 0;
  for (const d of L.days(t)) {
    const list = L.stops(id, d.n), legs = L.legsOf(L.track(id, d.n));
    for (let i = 1; i < list.length; i++) { const k = (legs[i - 1] || {}).km || 0; all += k; if (list[i].LpMode === 'bike') { km += k; min += L.legMin(list, i) || 0; } }
  }
  return { km, min, pct: all ? km / all * 100 : 0 };
}
/** The journey's country for each day: the country of its last stop (else the journey's first country). */
function dayIso(id, n) { const l = L.stops(id, n); return (l.length && l[l.length - 1].LpCountry) || mainIso(id); }
/** Ground cost per day (spread items share by day). */
export function groundByDay(id) { return L.days(P.trip(id)).map(d => ({ n: d.n, v: L.dayItems(id, d.n).filter(x => !L.isNon(x.e)).reduce((s, x) => s + x.share, 0) })); }

export function totals() {
  const ts = pastTrips(), xs = ts.map(t => ({ t, x: L.lbTotals(t.TrId) }));
  const w = k => ts.filter(t => P.withList(t).includes(k)).length;
  const wo = ts.reduce((s, t) => { const r = workOff(t); s.w += r.w; s.o += r.o; return s; }, { w: 0, o: 0 });
  return { trips: ts.length, solo: w('Solo'), family: w('Family'), friends: w('Friends'), days: ts.reduce((s, t) => s + P.daysOf(t), 0), work: wo.w, off: wo.o,
    spent: xs.reduce((s, a) => s + a.x.spent, 0), km: xs.reduce((s, a) => s + a.x.km, 0) };
}
/** Your Voyage score per country (average of the journeys that went there). */
export function favourites() {
  const by = {};
  for (const t of pastTrips()) { const v = L.overall(t.TrId); if (!v) continue; for (const iso of new Set(P.isosOf(t.TrId))) { if (iso === P.homeIso()) continue; (by[iso] = by[iso] || []).push(v); } }
  return Object.entries(by).map(([iso, a]) => ({ iso, v: a.reduce((s, x) => s + x, 0) / a.length })).sort((a, b) => b.v - a.v || P.BY[a.iso].name.localeCompare(P.BY[b.iso].name)).slice(0, 3);
}
/** The journeys you spent most on, with their share of everything. */
export function mostSpent() {
  const xs = pastTrips().map(t => ({ t, v: L.spend(t.TrId).tot })).filter(a => a.v > 0), tot = xs.reduce((s, a) => s + a.v, 0);
  return xs.sort((a, b) => b.v - a.v).slice(0, 3).map(a => ({ ...a, iso: mainIso(a.t.TrId), pct: tot ? a.v / tot * 100 : 0, top: xs[0] ? a.v / Math.max(...xs.map(x => x.v)) : 0 }));
}
const best = (arr, f) => arr.reduce((b, x) => (f(x) > (b ? f(b) : 0) ? x : b), null);
/** Six badges. */
export function badges() {
  const ts = pastTrips(), xs = ts.map(t => ({ t, x: L.lbTotals(t.TrId), b: bikeOf(t.TrId) })), home = P.BY[P.homeIso()];
  const far = home ? best(P.visitedList().filter(c => c.iso !== home.iso && c.lat), c => L.hav([home.lat, home.lng], [c.lat, c.lng])) : null;
  const B = (k, n, ic, a, val, iso) => ({ k, n, ic, val: a ? val(a) : '—', iso: a ? iso(a) : '', on: !!a });
  return [
    B('long', 'The Long Haul', 'cal', best(xs, a => a.x.days), a => a.x.days + ' days', a => mainIso(a.t.TrId)),
    B('far', 'World Wanderer', 'globe', far, c => L.n0(L.hav([home.lat, home.lng], [c.lat, c.lng])) + ' km away', c => c.iso),
    B('lux', 'Luxury Voyager', 'wallet', best(xs, a => a.x.spent), a => L.RM(a.x.spent), a => mainIso(a.t.TrId)),
    B('cham', 'Travel Chameleon', 'compass', best(xs, a => a.x.stops), a => a.x.stops + ' stops', a => mainIso(a.t.TrId)),
    B('throttle', 'Throttle Master', 'bike', best(xs, a => a.b.km), a => L.n0(a.b.km) + ' km', a => mainIso(a.t.TrId)),
    B('high', 'The High Road', 'mount', best(xs, a => a.x.highest), a => L.n0(a.x.highest) + ' m', a => mainIso(a.t.TrId))];
}
/** Each country: trips, days, km, ground cost, per day. */
export function countryOverview() {
  const by = {};
  for (const t of pastTrips()) {
    const id = t.TrId;
    for (const iso of new Set(P.isosOf(id))) { if (iso === P.homeIso()) continue; (by[iso] = by[iso] || { iso, trips: 0, days: 0, km: 0, cost: 0 }).trips++; }
    for (const d of L.days(t)) {
      const iso = dayIso(id, d.n); if (!iso || iso === P.homeIso()) continue;
      const r = by[iso] = by[iso] || { iso, trips: 0, days: 0, km: 0, cost: 0 };
      r.days++; r.km += L.dayKm(id, d.n); r.cost += L.dayItems(id, d.n).filter(x => !L.isNon(x.e)).reduce((s, x) => s + x.share, 0);
    }
  }
  return Object.values(by).filter(r => r.trips).sort((a, b) => b.days - a.days || P.BY[a.iso].name.localeCompare(P.BY[b.iso].name));
}
/** One journey's numbers for its Atlas page. */
export function journey(id) {
  const t = P.trip(id), x = L.lbTotals(id), b = bikeOf(id), sp = L.spend(id);
  const dayRows = L.days(t).map(d => { const l = L.stops(id, d.n); return { n: d.n, end: l.length ? l[l.length - 1].LpPlace : '', km: L.dayKm(id, d.n), first: d.n === 1, last: d.n === L.days(t).length }; });
  const cat = non => L.CATS.map(c => ({ c, v: L.expenses(id).filter(e => e.ExCat === c.k && L.isNon(e) === non).reduce((s, e) => s + L.myrOf(e), 0) })).filter(a => a.v > 0).sort((a, b) => b.v - a.v);
  return { x, b, sp, days: dayRows, ground: groundByDay(id), gcat: cat(false), ncat: cat(true), has: x.stops > 0 || sp.n > 0 || x.overall > 0 };
}
