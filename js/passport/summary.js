// MansWell Atlas · summary cards built from Voyage: the Odyssey cards (totals, favourite country, most spent, badges),
// the country overview on Journeys, and one journey's numbers, route, daily spending and expenses. Colours follow the theme.
import { html, K, rerender } from '../core.js';
import * as P from './engine.js';
import * as I from './insights.js';
import * as L from '../logbook/engine.js';
import { Ico } from '../logbook/icons.js';
import { RouteCard, routeCardCss } from '../logbook/map.js';

const oa = a => `rgba(${K.accRGB || '255,106,0'},${a})`;
const Flag = (iso, h = 16) => (iso ? html`<img class="pfl" src=${P.flagUrl(iso)} alt="" style=${`width:${Math.round(h * 4 / 3)}px;height:${h}px`} />` : null);
const rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); const n = m ? parseInt(m[1], 16) : 0xFF6A00; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const shades = () => { const [r, g, b] = rgb(K.or); return [0, 0.35, -0.3, 0.6, -0.52, 0.8].map(f => 'rgb(' + (f >= 0 ? [r, g, b].map(v => Math.round(v + (255 - v) * f)) : [r, g, b].map(v => Math.round(v * (1 + f)))).join(',') + ')'); };
const Stars = v => html`<span class="asst">${[1, 2, 3, 4, 5].map(i => html`<span>★<i style=${`width:${Math.max(0, Math.min(1, v - i + 1)) * 100}%`}>★</i></span>`)}</span>`;

export const css = () => routeCardCss() + `
.asg2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 12px 10px}
.askc{border-radius:14px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};overflow:hidden;min-width:0}.askc .h{font:800 10.5px Georgia,serif;letter-spacing:.6px;padding:10px 12px 0;text-transform:uppercase;color:${K.text}}
.askc .m{display:flex;align-items:center;justify-content:space-between;gap:6px;padding:8px 12px 11px}.askc .m b{font-size:26px;font-weight:700;color:${K.text}}.askc .m b.sm{font-size:18px;white-space:nowrap}
.askc .f{display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-top:1px solid ${K.sep};font-size:11.5px;font-weight:700;color:${K.text}}.askc .f span{display:inline-flex;align-items:center;gap:3px}.askc .f em{font-style:normal;color:${K.or};font-size:8.5px;font-weight:800;letter-spacing:.4px}
.asrk{display:grid;grid-template-columns:14px 26px 1fr auto;gap:9px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep};font-size:13px;color:${K.text}}.asrk:first-of-type{border-top:0}.asrk .r{text-align:right}.asrk .r b{display:block;color:${K.or};font-size:16px}
.asst{display:inline-flex;gap:1px;font-size:10px;color:${K.line2}}.asst span{position:relative}.asst i{position:absolute;left:0;top:0;overflow:hidden;color:${K.or};font-style:normal}
.asme{display:grid;grid-template-columns:14px 26px 1fr;gap:9px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep};font-size:13px;color:${K.text}}.asme:first-of-type{border-top:0}.asme .t{display:flex;justify-content:space-between;gap:8px}.asme .t span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.asme .b{position:relative;height:5px;border-radius:4px;background:${K.field};margin-top:6px}.asme .b i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,${oa(.4)},${K.or})}.asme .b u{position:absolute;top:-3px;bottom:-3px;width:3px;margin-left:-2px;border-radius:2px;background:${K.light ? K.text : '#fff'};box-shadow:0 0 6px ${oa(.9)}}.asme .p{font-size:10px;color:${K.or};font-weight:700;text-align:right;margin-top:3px}
.asbd{display:grid;grid-template-columns:1fr 1fr;gap:8px}.asbg{border-radius:14px;padding:12px 8px 10px;text-align:center;background:linear-gradient(180deg,${oa(.1)},${K.card2});box-shadow:inset 0 0 0 1.5px ${oa(.7)};border-top:4px solid ${K.or}}
.asbg.off{opacity:.5;filter:saturate(.5)}.asbg .ci{width:34px;height:34px;border-radius:50%;margin:0 auto 6px;display:grid;place-items:center;background:${oa(.16)}}.asbg .k{font-size:9.5px;font-weight:800;letter-spacing:.6px;color:${K.or}}.asbg b{display:block;font-size:16px;margin:4px 0 5px;color:${K.text}}
.astb{font-size:12px}.astb .hd,.astb .tr{display:grid;grid-template-columns:1.55fr .45fr .45fr .9fr .95fr .8fr .7fr;gap:4px;align-items:center}.astb .hd{font-size:7.5px;font-weight:800;letter-spacing:.4px;color:${K.sub};background:${K.field};border-radius:9px;padding:8px 7px;margin-top:8px}
.astb .hd span:not(:first-child),.astb .tr span:not(:first-child){text-align:right}.astb .tr{padding:10px 7px;border-bottom:1px solid ${K.sep};font-weight:700;color:${K.text};font-size:11.5px}.astb .tr:last-child{border-bottom:0}.astb .tr small{color:${K.sub};font-size:8px;font-weight:500}.astb .cn{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap}
.ask6{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 12px 10px}.ask6 div{border-radius:13px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};text-align:center;padding:11px 4px 9px;min-width:0}
.ask6 b{display:block;font:700 17px Georgia,serif;margin-top:5px;color:${K.text};white-space:nowrap}.ask6 span{display:block;font-size:8.5px;font-weight:800;letter-spacing:.8px;color:${K.sub};margin-top:5px}.ask6 em{display:block;font-style:normal;font-size:9px;font-weight:700;color:${K.or};margin-top:3px}
.asro{margin:0 12px 10px;border-radius:14px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};padding:11px 10px;overflow-x:auto;scrollbar-width:none}.asro::-webkit-scrollbar{display:none}
.asro .ln{position:relative;display:flex;gap:2px;margin-top:10px;min-width:max-content}.asro .ln:before{content:'';position:absolute;left:18px;right:18px;top:7px;height:2px;background:${K.or}}
.asro .d{position:relative;text-align:center;width:44px;flex:none}.asro .d i{display:block;width:14px;height:14px;border-radius:50%;margin:0 auto 5px;background:${K.or};box-shadow:0 0 0 3px ${K.card}}.asro .d i.s{background:#57C23A}.asro .d i.e{background:#E8343B}
.asro .d{width:50px!important}.asro .d b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-size:8.5px;line-height:1.15;min-height:19.5px;color:${K.text};overflow:hidden;word-break:break-word}.asro .d span{display:block;font-size:7.5px;color:${K.sub};margin-top:1px}
.askc .f2{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid ${K.sep}}.askc .f2 div{padding:7px 11px;font-size:12px;font-weight:700;color:${K.text};white-space:nowrap;min-width:0}.askc .f2 div+div{border-left:1px solid ${K.sep}}.askc .f2 em{display:block;font-style:normal;font-size:8px;font-weight:800;letter-spacing:.6px;color:${K.or};margin-top:1px}
.astop .r{display:grid;grid-template-columns:14px 1fr auto;gap:8px;padding:6px 0;font-size:12.5px;font-weight:700;color:${K.text}}.astop .r span:first-child{color:${K.or}}.astop .r .mu{color:${K.mute}}
.astop .ft{border-top:1px solid ${K.sep};margin-top:8px;padding-top:9px;display:flex;justify-content:space-between;align-items:flex-end}.astop .ft .k{font-size:9px;font-weight:800;letter-spacing:.5px;color:${K.text}}.astop .ft .s{font-size:9px;color:${K.sub};margin-top:3px}.astop .ft b{display:block;font-size:22px;margin-top:3px;color:${K.text}}
.asrd{display:flex;align-items:flex-end;gap:4px;height:112px;margin-top:10px}.asrd div{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;justify-content:flex-end;height:100%;font-size:8.5px;color:${K.sub};min-width:0}.asrd .v{color:${K.text};font-size:8px}.asrd i{display:block;width:100%;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,${K.or},${oa(.35)})}
.asti .hh{display:flex;justify-content:space-between;font-size:9.5px;font-weight:800;letter-spacing:1.3px;color:${K.sub};padding:0 0 8px 32px;border-bottom:1px solid ${K.sep}}.asti .mr{display:grid;grid-template-columns:24px 1fr auto;gap:10px;align-items:center;padding:9px 0}.asti .nm{font-size:12px;font-weight:700;letter-spacing:.5px;color:${K.text}}.asti .asst{font-size:16px;gap:3px}
.asdon{display:grid;grid-template-columns:1fr 124px 1fr;align-items:center;gap:4px;text-align:center}.asdon .big{font-size:26px;font-weight:800;color:${K.or}}.asdon .big.nb{color:${K.sub}}.asdon .lab{font-size:8.5px;font-weight:800;letter-spacing:.8px;color:${K.sub}}.asdon .rm{font-size:12px;margin-top:3px;color:${K.text}}
.assec{display:flex;align-items:center;gap:8px;margin:12px 2px 4px;font-size:11px;font-weight:800;letter-spacing:1.2px;color:${K.text}}.assec .ci{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1.3px ${K.or}}
.assb{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:6px 0 7px;background:${K.field}}.assb i{display:block}
.assbl{display:grid;gap:8px 2px;font-size:10px;text-align:center}.assbl div{border-right:1px solid ${K.sep};padding:2px;min-width:0}.assbl div.e{border-right:0}.assbl b{display:block;margin-top:4px;white-space:nowrap;font-size:12.5px;color:${K.text}}.assbl small{display:block;color:${K.sub};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
const Card = (title, kids, id, extra = '') => html`<div class="lc" data-t=${id}>${title ? html`<span class="lcap" style=${`display:block;color:${K.text};font-weight:800;letter-spacing:.8px;${extra}`}>${title}</span>` : null}${kids}</div>`;

/* ───────── Odyssey ───────── */
export function StatCards() {
  const t = I.totals();
  return html`<div class="asg2" data-t="oStats">
    <div class="askc"><div class="h">Total trips</div><div class="m">${Ico('trips', 40)}<b data-t="oTrips">${t.trips}</b></div>
      <div class="f"><span>${t.solo} ${Ico('solo', 14)}</span><span>${t.family} ${Ico('family', 14)}</span><span>${t.friends || '–'} ${Ico('group', 14)}</span></div></div>
    <div class="askc"><div class="h">Travel days</div><div class="m">${Ico('cal', 40)}<b data-t="oDays">${t.days}</b></div>
      <div class="f"><span data-t="oWork">${t.work} <em>WORKING</em></span><span>${t.off} <em>OFF DAYS</em></span></div></div>
    <div class="askc"><div class="h">Total expenses</div><div class="m">${Ico('wallet', 38)}<b class="sm" data-t="oSpent">${L.RM(t.spent)}</b></div>
      <div class="f2"><div data-t="oSpentTrip">${L.RM(t.perTrip)}<em>PER TRIP</em></div><div data-t="oSpentDay">${L.RM(t.perDay)}<em>PER DAY</em></div></div></div>
    <div class="askc"><div class="h">Total distance</div><div class="m">${Ico('gauge', 38)}<b class="sm" data-t="oKm">${L.n0(t.km)} km</b></div>
      <div class="f2"><div data-t="oKmTrip">${L.n0(t.kmTrip)} km<em>PER TRIP</em></div><div data-t="oKmDay">${L.n0(t.kmDay)} km<em>PER DAY</em></div></div></div></div>`;
}
export function Favourites() {
  const f = I.favourites();
  return Card('FAVOURITE COUNTRY', f.length ? f.map((x, i) => html`<div class="asrk" data-t=${'fav-' + x.iso}><span>${i + 1}</span>${Flag(x.iso, 18)}<span>${P.BY[x.iso].name}</span><span class="r"><b>${x.v.toFixed(1)}</b>${Stars(x.v)}</span></div>`)
    : html`<div class="lnote" style="margin-top:6px">Give your journeys a score in Voyage › Discovery.</div>`, 'oFav');
}
export function MostSpent(open) {
  const m = I.mostSpent();
  const sc = 1.5; // the budget mark sits at two thirds of the bar
  return Card('MOST SPENT', m.length ? html`${m.map((x, i) => { const over = x.diff !== null && x.diff > 0; return html`<div class="asme" style="cursor:pointer" onClick=${() => open(x.t.TrId)} data-t=${'ms-' + x.t.TrId}><span>${i + 1}</span>${Flag(x.iso, 18)}<div style="min-width:0"><div class="t"><span>${x.t.TrName}</span><b>${L.RM(x.v)}</b></div>
      <div class="b"><i style=${`width:${x.b ? Math.min(100, x.v / x.b / sc * 100).toFixed(1) : 100}%;${over ? `background:${K.red}` : ''}`}></i>${x.b ? html`<u style=${`left:${(100 / sc).toFixed(1)}%`}></u>` : null}</div>
      <div class="p" style=${x.diff === null ? `color:${K.sub}` : `color:${over ? K.red : K.grn}`} data-t=${'msPct-' + x.t.TrId}>${x.diff === null ? 'no budget set' : (over ? '+' : '−') + Math.abs(x.diff).toFixed(1) + '% ' + (over ? 'over' : 'under') + ' budget (' + L.RM(x.b) + ')'}</div></div></div>`; })}
      <div class="lnote" style="margin-top:6px">The line is that journey's budget in Voyage.</div>`
    : html`<div class="lnote" style="margin-top:6px">Add expenses in Voyage to see where the money went.</div>`, 'oMost');
}
export function Badges() {
  return Card('', html`<div class="lcap" style=${`display:block;text-align:center;color:${K.text};font-weight:800;letter-spacing:1px;margin-bottom:10px`}>BADGES</div>
    <div class="asbd">${I.badges().map(b => html`<div class=${'asbg' + (b.on ? '' : ' off')} data-t=${'bdg-' + b.k}><div class="ci">${Ico(b.ic, 18)}</div><div class="k">${b.n.toUpperCase()}</div><b>${b.val}</b>${Flag(b.iso, 12)}</div>`)}</div>`, 'oBadges');
}

/* ───────── riding (motorbike only) ───────── */
const hm = m => Math.floor(m / 60) + 'h ' + String(Math.round(m % 60)).padStart(2, '0') + 'm';
function TopRides(title, list, val, foot, footVal, id) {
  return html`<div class="lc astop" data-t=${id}><span class="lcap" style=${`display:block;color:${K.text};font-weight:800;letter-spacing:.8px`}>${title}</span>
    ${[0, 1, 2, 3, 4].map(i => { const r = list[i]; return html`<div class="r" data-t=${r ? id + '-' + (i + 1) : null}><span>${i + 1}</span><span class=${r ? '' : 'mu'}>${r ? r.t.TrName.toUpperCase() : '—'}</span><span>${r ? val(r) : ''}</span></div>`; })}
    <div class="ft"><div><div class="k">${foot}</div>${footVal ? html`<div class="s">${footVal.t.TrName.toUpperCase()} · DAY ${footVal.d.n}</div><b data-t=${id + 'Day'}>${footVal.v}</b>` : html`<div class="s">—</div>`}</div>${Ico('bike', 40)}</div></div>`;
}
export function Rides(l) {
  const r = I.rides(); if (!r.all.length) return null;
  const pick = r.all.find(x => x.t.TrId === l.rideTrip) || r.all[0], mx = Math.max(1, ...pick.days.map(d => d.km));
  return html`${TopRides('TOP 5 FARTHEST RIDES', r.byKm, x => L.n0(x.km) + ' km', 'FARTHEST DAY RIDE', r.far && { ...r.far, v: L.n0(r.far.d.km) + ' km' }, 'oFar')}
    ${TopRides('TOP 5 LONGEST RIDES', r.byMin, x => hm(x.min), 'LONGEST DAY RIDE', r.long && { ...r.long, v: hm(r.long.d.min) }, 'oLong')}
    <div class="lc" data-t="oRideDays"><span class="lcap" style=${`display:block;color:${K.text};font-weight:800;letter-spacing:.8px`}>RIDING DISTANCE PER DAY</span>
      ${r.all.length > 1 ? html`<div class="pchips" style="margin:8px 0 0">${r.all.map(x => html`<span class=${'pchip' + (x === pick ? ' on' : '')} onClick=${() => { l.rideTrip = x.t.TrId; rerender(); }} data-t=${'rideT-' + x.t.TrId}>${x.t.TrName}</span>`)}</div>` : html`<div class="lsub" style="margin:4px 0 0">${pick.t.TrName}</div>`}
      <div class="asrd">${pick.days.map(d => html`<div data-t=${'rd-' + d.n}><span class="v">${d.km ? L.n0(d.km) : ''}</span><i style=${`height:${(d.km / mx * 80).toFixed(0)}px`}></i><span>D${d.n}</span></div>`)}</div>
      <div class="lnote" style="margin-top:6px">Motorbike legs only.</div></div>`;
}

/* ───────── Journeys ───────── */
export function CountryTable() {
  const rows = I.countryOverview(); if (!rows.length) return null;
  return Card('COUNTRY EXPERIENCE OVERVIEW', html`<div class="astb"><div class="hd"><span>COUNTRY</span><span>TRIPS</span><span>DAYS</span><span>DISTANCE</span><span>GROUND COST</span><span>G.COST / DAY</span><span>DIST. / DAY</span></div>
    ${rows.map(r => html`<div class="tr" data-t=${'cx-' + r.iso}><span class="cn">${Flag(r.iso, 13)}${P.BY[r.iso].name}</span><span>${r.trips}</span><span>${r.days}</span><span>${L.n0(r.km)}<small>km</small></span><span><small>RM</small>${L.n0(r.cost)}</span>
      <span><small>RM</small>${r.days ? L.n0(r.cost / r.days) : 0}</span><span>${r.days ? L.n0(r.km / r.days) : 0}<small>km</small></span></div>`)}</div>`, 'jCountries');
}

/* ───────── one journey ───────── */
export function JourneyNumbers(id) {
  const j = I.journey(id), x = j.x, h = Math.floor(j.b.min / 60), mi = j.b.min % 60;
  return html`<div class="ask6" data-t="tNums">
    <div>${Ico('star', 24)}<b data-t="tRate">${x.overall ? x.overall.toFixed(1) : '—'}</b><span>RATING</span></div>
    <div>${Ico('cal', 24)}<b>${x.days} days</b><span>DAYS</span></div>
    <div>${Ico('wallet', 24)}<b data-t="tSpent">${x.spent ? L.RM(x.spent) : '—'}</b><span>EXPENSES</span></div>
    <div>${Ico('road', 24)}${j.b.pct ? html`<em>${j.b.pct.toFixed(1)}% by motorbike</em>` : null}<b data-t="tKm">${x.km ? L.n0(x.km) + ' km' : '—'}</b><span>DISTANCE</span></div>
    <div>${Ico('bike', 24)}<b data-t="tRide">${j.b.min ? h + 'h ' + String(mi).padStart(2, '0') + 'm' : '—'}</b><span>RIDING TIME</span></div>
    <div>${Ico('mount', 24)}<b data-t="tHigh">${x.highest ? L.n0(x.highest) + ' m' : '—'}</b><span>HIGHEST</span></div></div>`;
}
export function JourneyRoute(id) {
  const j = I.journey(id); if (!j.x.tracks && !L.stops(id).some(L.hasPin)) return null;
  return html`<div style="margin:0 12px 10px" data-t="tRouteMap">${RouteCard({ id, w: 366, h: 360, key: 'atlasRoute', plain: true, cityLabels: true })}</div>
    <div class="asro" data-t="tRouteOv"><span class="lcap" style=${`color:${K.text};font-weight:800;letter-spacing:.8px`}>ROUTE OVERVIEW</span>
      <div class="ln">${j.days.map(d => html`<div class="d" data-t=${'ro-' + d.n}><i class=${d.first ? 's' : d.last ? 'e' : ''}></i><b>${d.end || '—'}</b><span>Day ${d.n}</span><span>${d.km ? L.n0(d.km) + ' km' : '–'}</span></div>`)}</div></div>`;
}
/** Travel insights: your Trail Marks from Voyage › Discovery, view only. */
export function TravelInsights(id) {
  const r = L.result(id) || {}; if (!L.RATINGS.some(([k]) => Number(r[k]) > 0)) return null;
  return html`<div class="lc asti" data-t="tInsights"><span class="lcap" style=${`display:block;color:${K.text};font-weight:800;letter-spacing:.8px;margin-bottom:10px`}>TRAVEL INSIGHTS</span>
    <div class="hh"><span>METRIC</span><span>RATE</span></div>
    ${L.RATINGS.map(([k, n, ic]) => html`<div class="mr" data-t=${'ti-' + k}>${Ico(ic, 22)}<span class="nm">${n.toUpperCase()}</span>${Stars(Number(r[k]) || 0)}</div>`)}
    <div class="lnote" style="margin-top:4px">Rated in Voyage › Discovery.</div></div>`;
}
export function DailySpending(id) {
  const g = I.groundByDay(id); if (!g.some(x => x.v)) return null;
  const W = 340, H = 128, mx = Math.max(...g.map(x => x.v)) || 1, avg = g.reduce((s, x) => s + x.v, 0) / g.length, n = g.length;
  const X = i => 14 + i * (W - 28) / Math.max(1, n - 1), Y = v => H - 22 - v / mx * (H - 48);
  const pts = g.map((x, i) => [X(i), Y(x.v)]), line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''), top = g.findIndex(x => x.v === mx);
  return Card('', html`<div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lcap" style=${`color:${K.text};font-weight:800;letter-spacing:.8px`}>DAILY SPENDING</span><span style=${`font-size:8.5px;font-weight:800;letter-spacing:.8px;color:${K.sub}`}>GROUND COST ONLY</span></div>
    <svg viewBox=${`0 0 ${W} ${H}`} style="display:block;width:100%;height:auto;margin-top:6px" data-t="tDaily"><defs><linearGradient id="asdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${K.or} stop-opacity=".45" /><stop offset="1" stop-color=${K.or} stop-opacity="0" /></linearGradient></defs>
      <line x1="14" x2=${W - 14} y1=${Y(avg)} y2=${Y(avg)} stroke=${K.line2} stroke-dasharray="3 3" />
      <path d=${line + `L${pts[n - 1][0]},${H - 22}L${pts[0][0]},${H - 22}Z`} fill="url(#asdg)" /><path d=${line} fill="none" stroke=${K.or} stroke-width="2" stroke-linejoin="round" />
      <circle cx=${pts[top][0]} cy=${pts[top][1]} r="4" fill=${K.or} stroke=${K.card} stroke-width="2" />
      ${g.map((x, i) => html`${n <= 14 || i === top ? html`<text x=${X(i)} y=${pts[i][1] - 7} text-anchor="middle" font-size="7.5" fill=${i === top ? K.or : K.sub} font-weight=${i === top ? 700 : 400}>RM${L.n0(x.v)}</text>` : null}
        ${n <= 16 || i % 2 === 0 ? html`<text x=${X(i)} y=${H - 6} text-anchor="middle" font-size="7.5" font-weight="700" fill=${i === top ? K.or : K.sub}>D${x.n}</text>` : null}`)}</svg>`, 'tDailyCard');
}
export function ExpenseSplit(id) {
  const j = I.journey(id), sp = j.sp; if (!sp.tot) return null;
  const R = 50, C = 2 * Math.PI * R, gp = sp.ground / sp.tot, cols = shades();
  const part = (L0, tot) => html`<div class="assb">${L0.map((a, i) => html`<i style=${`width:${(a.v / tot * 100).toFixed(1)}%;background:${cols[i % 6]}`}></i>`)}</div>
    <div class="assbl" style=${`grid-template-columns:repeat(${L0.length > 4 ? 3 : L0.length},minmax(0,1fr))`}>${L0.map((a, i) => html`<div class=${(L0.length > 4 && i % 3 === 2) || i === L0.length - 1 ? 'e' : ''} title=${a.c.n} data-t=${'esc-' + a.c.k}>${Ico(a.c.i, 17)}<b>${L.RM(a.v)}</b></div>`)}</div>`;
  return Card('EXPENSES', html`<div class="asdon" style="margin-top:8px"><div><div class="big" data-t="tGroundPct">${Math.round(gp * 100)}%</div><div class="lab">GROUND COST</div><div class="rm">${L.RM(sp.ground)}</div></div>
      <svg viewBox="0 0 124 124" width="124" height="124"><circle cx="62" cy="62" r=${R} fill="none" stroke=${cols[3]} stroke-width="14" /><circle cx="62" cy="62" r=${R} fill="none" stroke=${K.or} stroke-width="14" stroke-dasharray=${`${(C * gp).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 62 62)" />
        <text x="62" y="55" text-anchor="middle" font-size="7" letter-spacing="1" fill=${K.sub}>TOTAL SPEND</text><text x="62" y="72" text-anchor="middle" font-size="15" font-weight="800" fill=${K.text}>${L.RM(sp.tot)}</text></svg>
      <div><div class="big nb">${Math.round((1 - gp) * 100)}%</div><div class="lab">NON-GROUND</div><div class="rm">${L.RM(sp.non)}</div></div></div>
    ${j.gcat.length ? html`<div class="assec"><span class="ci">${Ico('mount', 13)}</span>GROUND COST</div>${part(j.gcat, sp.ground)}` : null}
    ${j.ncat.length ? html`<div class="assec"><span class="ci">${Ico('plane', 13)}</span>NON-GROUND COST</div>${part(j.ncat, sp.non)}` : null}`, 'tExpSplit');
}
