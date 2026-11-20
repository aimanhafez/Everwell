// MansWell Atlas · the summary of your journeys, read from Voyage (itinerary, tracks, expenses, your score).
// Travel only: never reads Pocket or Lens. Voyage stays the place where the details are written.
import * as P from './engine.js';
import * as L from '../logbook/engine.js';
import { DB } from '../core.js';

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
/** Motorbike riding per day of a journey: km (from the track legs) and minutes (from your times). */
export function rideDays(id) {
  return L.days(P.trip(id)).map(d => { const list = L.stops(id, d.n), legs = L.legsOf(L.track(id, d.n)); let km = 0, min = 0;
    for (let i = 1; i < list.length; i++) if (list[i].LpMode === 'bike') { km += (legs[i - 1] || {}).km || 0; min += L.legMin(list, i) || 0; }
    return { n: d.n, km, min }; });
}
/** Top rides (motorbike only): journeys by km and by time, and the single farthest / longest day. */
export function rides() {
  const rs = pastTrips().map(t => ({ t, days: rideDays(t.TrId) })).map(r => ({ ...r, km: r.days.reduce((s, d) => s + d.km, 0), min: r.days.reduce((s, d) => s + d.min, 0) }));
  let far = null, long = null; for (const r of rs) for (const d of r.days) { if (d.km > (far ? far.d.km : 0)) far = { t: r.t, d }; if (d.min > (long ? long.d.min : 0)) long = { t: r.t, d }; }
  return { byKm: rs.filter(r => r.km > 0).sort((a, b) => b.km - a.km).slice(0, 5), byMin: rs.filter(r => r.min > 0).sort((a, b) => b.min - a.min).slice(0, 5), far, long, all: rs.filter(r => r.km > 0) };
}
/** Where distance is measured from: Kuala Lumpur for Malaysia (its map point is in Borneo), else the home country's point. */
export function homePoint() { const h = P.homeIso(); if (h === 'MY') return [3.139, 101.687]; const c = P.BY[h]; return c ? [c.lat, c.lng] : null; }
/** The journey's country for each day: the country of its last stop (else the journey's first country). */
function dayIso(id, n) { const l = L.stops(id, n); return (l.length && l[l.length - 1].LpCountry) || mainIso(id); }
/** Ground cost per day (spread items share by day). */
export function groundByDay(id) { return L.days(P.trip(id)).map(d => ({ n: d.n, v: L.dayItems(id, d.n).filter(x => !L.isNon(x.e)).reduce((s, x) => s + x.share, 0) })); }

export function totals() {
  const ts = pastTrips(), xs = ts.map(t => ({ t, x: L.lbTotals(t.TrId) }));
  const w = k => ts.filter(t => P.withList(t).includes(k)).length;
  const wo = ts.reduce((s, t) => { const r = workOff(t); s.w += r.w; s.o += r.o; return s; }, { w: 0, o: 0 });
  const spent = xs.reduce((s, a) => s + a.x.spent, 0), km = xs.reduce((s, a) => s + a.x.km, 0), days = ts.reduce((s, t) => s + P.daysOf(t), 0);
  return { perTrip: ts.length ? spent / ts.length : 0, perDay: days ? spent / days : 0, kmTrip: ts.length ? km / ts.length : 0, kmDay: days ? km / days : 0, trips: ts.length, solo: w('Solo'), family: w('Family'), friends: w('Friends'), days: ts.reduce((s, t) => s + P.daysOf(t), 0), work: wo.w, off: wo.o,
    spent: xs.reduce((s, a) => s + a.x.spent, 0), km: xs.reduce((s, a) => s + a.x.km, 0) };
}
/** Your Voyage score per country (average of the journeys that went there). */
export function favourites() {
  const by = {};
  for (const t of pastTrips()) { const v = L.overall(t.TrId); if (!v) continue; for (const iso of new Set(P.isosOf(t.TrId))) { if (iso === P.homeIso()) continue; (by[iso] = by[iso] || []).push(v); } }
  void by;
  // by journey: each scored journey once, under its main country (the country big, the journey's name small)
  return pastTrips().map(t => ({ t, iso: mainIso(t.TrId), v: L.overall(t.TrId) })).filter(x => x.v && x.iso && x.iso !== P.homeIso())
    .sort((a, b) => b.v - a.v || String(b.t.TrStart).localeCompare(String(a.t.TrStart))).slice(0, 5);
}
/** The journeys you spent most on, each against its own Voyage budget. */
export function mostSpent() {
  const xs = pastTrips().map(t => ({ t, v: L.spend(t.TrId).tot, b: L.budget(t.TrId).tot })).filter(a => a.v > 0);
  return xs.sort((a, b) => b.v - a.v).slice(0, 5).map(a => ({ ...a, iso: mainIso(a.t.TrId), diff: a.b ? (a.v / a.b - 1) * 100 : null }));
}
const best = (arr, f) => arr.reduce((b, x) => (f(x) > (b ? f(b) : 0) ? x : b), null);
/** Six badges. */
export function badges() {
  const ts = pastTrips(), xs = ts.map(t => ({ t, x: L.lbTotals(t.TrId), b: bikeOf(t.TrId) })), hp = homePoint();
  // farthest place reached: your Voyage pins in that country, else the country's map point
  const doneIds = new Set(ts.map(t => t.TrId)), myStops = DB.lbStops.filter(s => doneIds.has(s.LpTrip)); // upcoming trips don't count yet
  const reach = c => { const pins = myStops.filter(s => s.LpCountry === c.iso && L.hasPin(s)).map(s => [Number(s.LpLat), Number(s.LpLng)]); const pts = pins.length ? pins : [[c.lat, c.lng]]; return Math.max(...pts.map(q => L.hav(hp, q))); };
  const far = hp ? best(P.visitedList().filter(c => c.lat || myStops.some(s => s.LpCountry === c.iso)), reach) : null;
  const B = (k, n, ic, a, val, iso) => ({ k, n, ic, val: a ? val(a) : '—', iso: a ? iso(a) : '', on: !!a });
  return [
    B('long', 'The Long Haul', 'cal', best(xs, a => a.x.days), a => a.x.days + ' days', a => mainIso(a.t.TrId)),
    B('far', 'World Wanderer', 'globe', far, c => L.n0(reach(c)) + ' km away', c => c.iso),
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
  const dayRows = L.days(t).map(d => { const l = L.stops(id, d.n); return { n: d.n, end: l.length ? (l[l.length - 1].LpCity || l[l.length - 1].LpProv || l[l.length - 1].LpPlace) : '', km: L.dayKm(id, d.n), first: d.n === 1, last: d.n === L.days(t).length }; });
  const cat = non => L.CATS.map(c => ({ c, v: L.expenses(id).filter(e => e.ExCat === c.k && L.isNon(e) === non).reduce((s, e) => s + L.myrOf(e), 0) })).filter(a => a.v > 0).sort((a, b) => b.v - a.v);
  return { x, b, sp, days: dayRows, ground: groundByDay(id), gcat: cat(false), ncat: cat(true), has: x.stops > 0 || sp.n > 0 || x.overall > 0 };
}

/** Milestones in four groups (tap a group to see its steps): countries, continents, km on the motorbike, who you travel with. */
export function milestones() {
  const n = P.firstVisits().length, s = P.stats(), km = Math.round(rides().all.reduce((a, r) => a + r.km, 0)), ts = pastTrips();
  const w = k => ts.filter(t => P.withList(t).includes(k)).length;
  const step = (id, name, desc, need, have, show) => ({ id, name, desc, need, have: Math.min(have, need), done: have >= need, show: show || (h => Math.min(h, need).toLocaleString('en-US') + '/' + need.toLocaleString('en-US')) });
  const G = [
    { id: 'countries', name: 'Countries', have: n, unit: c => (c === 1 ? '1 country' : c + ' countries'), items: [step('first', 'First Light', '1 country', 1, n), step('wayfarer', 'Wayfarer', '5 countries', 5, n), step('nomad', 'Nomad Soul', '10 countries', 10, n), step('carto', 'Cartographer', '25 countries', 25, n), step('bearer', 'Atlas Bearer', '50 countries', 50, n)] },
    { id: 'world', name: 'World', have: s.conts, unit: c => (c === 1 ? '1 continent' : c + ' continents'), items: [step('shores', 'Two Shores', '2 continents', 2, s.conts), step('far', 'Far Horizons', '4 continents', 4, s.conts), step('seven', 'Seven Horizons', 'All 7 continents', 7, s.conts)] },
    { id: 'road', name: 'On the road', have: km, unit: c => c.toLocaleString('en-US') + ' km by motorbike', items: [step('k1', 'First Thousand', '1,000 km', 1000, km), step('k5', 'Long Rider', '5,000 km', 5000, km), step('k10', 'Iron Butt', '10,000 km', 10000, km), step('k40', 'Around the World', '40,075 km', 40075, km, h => Math.floor(Math.min(h, 40075) / 40075 * 100) + '%')] },
    { id: 'type', name: 'Journey type', have: null, unit: () => w('Solo') + ' solo · ' + w('Family') + ' family · ' + w('Friends') + ' friends · ' + w('Partner') + ' partner',
      items: [step('solo', 'Solo Spirit', '5 solo journeys', 5, w('Solo')), step('fam', 'Family Ties', '5 family journeys', 5, w('Family')), step('friends', 'Good Company', '5 with friends', 5, w('Friends')), step('partner', 'Two of Us', '5 with a partner', 5, w('Partner'))] }];
  G.forEach(g => { g.done = g.items.filter(i => i.done).length; const nx = g.items.find(i => !i.done); g.sub = g.unit(g.have) + (g.have !== null && nx ? ' · next: ' + nx.name + ' at ' + nx.desc.replace(/ (countries|continents)$/, '') : ''); });
  return G;
}
