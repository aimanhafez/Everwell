// MansWell Voyage (was Logbook) · four pages: Journeys (every Atlas journey and what's filled in), Itinerary (day by day, the track, the day drawn),
// Expenses (cash in local currency, card in MYR, budget vs actual) and Discovery (journey badges, what you found, verdict, GPX).
// The route map, elevation meter and the numbers moved out: they go to Atlas (the summary) later.
import { html, K, G, rerender, Notify } from '../core.js';
import { Page, Sect, Switcher, Empty, Ring, cur, setCur, go, openStop, openPins, openExpense, openRate, openBudget, confirmAsk, lbsave, call, download, LimitNote, Stars, openFind, PlacesBar, Ico, Tile, makeAll, saveDay,
  canWrite, Seg, Flag, plural, oa, L } from './ui.js';
import { RouteMap, Profile } from './map.js';

const P = L.P;
const dayOf = (t) => { const m = G.lbDayOf || (G.lbDayOf = {}); const n = L.days(t).length; let d = Number(m[t.TrId]) || 1; if (d > n) d = n || 1; return d; };
const setDay = (t, d) => { (G.lbDayOf = G.lbDayOf || {})[t.TrId] = d; rerender(); };
const badge = (i, n) => (i === 0 ? 's' : i === n - 1 && n > 1 ? 'e' : '');

/* ───────── Journeys ───────── */
export const scrLbJourneys = {
  view(l) {
    const ts = L.journeys(), tot = ts.map(t => L.lbTotals(t.TrId)), orph = L.orphans(), nOrph = Object.values(orph).reduce((s, a) => s + a.length, 0);
    const spent = tot.reduce((s, x) => s + x.spent, 0), km = tot.reduce((s, x) => s + x.km, 0), cnt = k => tot.filter(x => x.filled[k]).length;
    return Page(l, 0, html`
      <div class="ppass" data-t="lbHero"><span class="lcap">All journeys · logged</span>
        <div class="big" data-t="lbSpent">${L.RM(spent)}</div>
        <div class="sub">spent on ${plural(ts.length, 'journey')} · <b data-t="lbKm">${L.n0(km)} km</b> on the road</div>
        <div class="g3"><div><span class="lcap">Itinerary</span><b data-t="lbNItin">${cnt('itin')} of ${ts.length}</b></div><div><span class="lcap">Expenses</span><b data-t="lbNExp">${cnt('exp')} of ${ts.length}</b></div><div><span class="lcap">Discovery</span><b data-t="lbNDisc">${cnt('disc')} of ${ts.length}</b></div></div></div>
      ${nOrph ? html`<div class="lwarn" data-t="lbOrphan">${plural(nOrph, 'Voyage detail')} belong to a journey deleted in Atlas.
        <span class="lor" style="cursor:pointer;font-weight:700;margin-left:4px" data-t="lbOrphanDel" onClick=${() => confirmAsk(l, 'Remove the leftover details?', 'Stops, tracks, expenses, budget and discoveries of journeys deleted in Atlas are removed. Your other journeys are not touched.', 'Remove', () => lbsave({ del: orph }, 'Leftovers removed', nOrph + ' rows'))}>Remove ›</span></div>` : null}
      ${!ts.length ? Empty('No journeys yet', 'Journeys start in Atlas. Add one there and it shows up here, ready for its itinerary, expenses and discoveries.') : html`
        ${Sect('Journeys', 'from Atlas')}
        <div class="lc" data-t="lbList">${ts.map((t, i) => { const x = tot[i]; return html`<div class="lbj" onClick=${() => { setCur(t.TrId); go('scrLbItinerary'); }} data-t=${'lbJ-' + t.TrId}>
          ${Ring(L.completeness(t.TrId), 44)}
          <div style="min-width:0"><div class="t">${t.TrName}</div><div class="s">${P.range(t.TrStart, t.TrEnd)} · ${plural(x.days, 'day')}</div>
            <div><span class=${'lbtag' + (x.filled.itin ? ' on' : '')}>ITINERARY</span><span class=${'lbtag' + (x.filled.exp ? ' on' : '')}>EXPENSES</span><span class=${'lbtag' + (x.filled.disc ? ' on' : '')}>DISCOVERY</span></div></div>
          <div class="r"><b>${x.spent ? L.RM(x.spent) : '—'}</b><span>${x.km ? L.n0(x.km) + ' km' : '—'}</span></div></div>`; })}</div>
        <div class="lnote" style="margin:0 18px 14px">Add a journey in Atlas and it shows up here. Rename it or change its dates in Atlas and Voyage follows.</div>`}
    `, 'scrLbJourneys');
  }
};

/* ───────── Itinerary ───────── */
function Stops(l, t, d, list, tk) {
  const legs = L.legsOf(tk), making = G.lbMaking === t.TrId + '|' + d;
  return html`<div class="lc" data-t="lbStops">
    ${list.map((s, i) => { const lg = legs[i - 1], odd = i && tk && L.oddLeg(list, i, lg), md = L.MODE[s.LpMode] || L.MODE.bike; return html`
      ${i ? html`<div class="lbleg" data-t=${'leg-' + i}>${Ico(md.i, 17)}<b>${md.n}</b>
        ${lg ? html`<em data-t=${'legKm-' + i}>${L.n1(lg.km)} km</em>` : null}
        ${odd ? html`<span class="lbwarn" style="margin-left:auto;font-size:10.5px" onClick=${() => openPins(l, t.TrId, d, [i - 1, i])} data-t=${'legOdd-' + i}>⚠ check pins ›</span>` : null}
        ${L.timeClash(list, i) ? html`<span class="lbwarn" style="margin-left:auto;font-size:10.5px" onClick=${() => openStop(l, t.TrId, d, list[i - 1])} data-t=${'legTime-' + i}>⚠ times don't add up ›</span>` : null}</div>` : null}
      <div class="lbst" onClick=${() => openStop(l, t.TrId, d, s)} data-t=${'stop-' + i}><div class=${'b ' + badge(i, list.length)}>${i === 0 ? 'S' : i === list.length - 1 && list.length > 1 ? 'E' : i}</div>
        <div style="min-width:0"><div class="t">${s.LpPlace}${L.hasPin(s) ? html` <span style=${`color:${K.or};font-size:11px`}>●</span>` : null}${s.LpBorder === 'y' ? html`<span class="lbpay spl" data-t=${'border-' + i}>BORDER</span>` : null}</div><div class="s">${[s.LpCity, s.LpArr ? (i === 0 ? 'start ' : 'arrive ') + s.LpArr : '', s.LpNote].filter(Boolean).join(' · ')}</div></div>
        <div class="r">${i === 0 ? html`<b>START</b>` : i === list.length - 1 ? html`<b>END</b>` : null}</div></div>`; })}
    ${!list.length ? html`<div class="lnote" data-t="lbRest">No stops on Day ${d}. A day with no stops is a rest day.</div>` : null}
    ${making ? html`<div class="pprog" style="margin:12px 0 0" data-t="lbMaking">Making the track with Google Maps…</div>` : null}
    <div style="display:flex;gap:8px;margin-top:12px"><button class="lbtn" style="flex:1" onClick=${() => canWrite() && openStop(l, t.TrId, d, null)} data-t="lbAddStop">+ Add a stop</button>
      ${list.length > 1 ? html`<button class="lbtn o on" style="flex:1" disabled=${making} onClick=${() => canWrite() && openPins(l, t.TrId, d)} data-t="lbMake">${tk ? 'Make track again' : 'Make GPX track'}</button>` : null}</div>
  </div>`;
}
function DayStory(l, id, d) {
  const r = L.dayRow(id, d) || {};
  return html`${Sect('Day story')}<div class="lc" data-t="lbStory"><textarea class="lin" rows="3" value=${r.DyStory || ''} onChange=${e => saveDay(id, d, 'DyStory', e.target.value.trim())} data-t="dStory"></textarea>
    <div class="pfr" style="margin-top:8px">${L.MOODS.map(([k, n]) => html`<span class=${'pchip' + (r.DyMood === k ? ' on' : '')} style="padding:6px 10px" onClick=${() => saveDay(id, d, 'DyMood', r.DyMood === k ? '' : k)} data-t=${'mood-' + k}>${n}</span>`)}</div></div>`;
}
function NightStop(l, t, d, list) {
  const id = t.TrId, end = list[list.length - 1], stays = L.dayItems(id, d).filter(x => x.e.ExCat === 'stay');
  return html`${Sect('Night stop')}<div class="lc" data-t="lbNight"><div class="lbex" style="cursor:default">${Tile('bed', 34)}<div style="min-width:0"><div class="t">${end.LpPlace}</div><div class="s">${[end.LpCity, end.LpProv].filter(Boolean).join(' · ') || 'where Day ' + d + ' ends'}</div></div><div></div></div>
    ${stays.length ? stays.map(x => html`<div class="lr" style="padding:6px 0;cursor:pointer" onClick=${() => openExpense(l, id, x.e)} data-t=${'nightExp-' + x.e.ExId}><span class="t" style="font-size:12.5px">${x.e.ExWhat}${x.n ? ' · ' + x.k + '/' + x.n : ''}</span><span class="r"><b>${L.RM2(x.share)}</b></span></div>`)
      : html`<div class="lnote" style="margin-top:4px">No accommodation expense on Day ${d}. <span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => canWrite() && openExpense(l, id, null, { day: d, cat: 'stay' })} data-t="nightAdd">Add one ›</span></div>`}</div>`;
}
function Borders(id) {
  const b = L.borders(id); if (!b.length) return null;
  return html`${Sect('Borders')}<div class="lc" data-t="lbBorders">${b.map(x => html`<div class="lbex" style="cursor:default">${Tile('flag', 34)}<div style="min-width:0"><div class="t">${x.s.LpPlace}</div><div class="s">Day ${x.day}${x.s.LpArr ? ' · ' + x.s.LpArr : ''}</div></div>
    <div class="r"><b class="lor">${x.from && x.from !== x.to ? x.from + ' → ' + x.to : x.to}</b></div></div>`)}</div>`;
}
function WholeJourney(l, t) {
  const id = t.TrId, rows = L.days(t).map(x => ({ n: x.n, st: L.stops(id, x.n).length, km: L.dayKm(id, x.n), min: L.dayMin(id, x.n), up: Number((L.track(id, x.n) || {}).TkUp) || 0, tk: !!L.track(id, x.n), stale: L.isStale(id, x.n) }));
  const need = rows.filter(r => r.st > 1 && (!r.tk || r.stale)).length, busy = G.lbAll;
  return html`${Sect('Whole journey')}<div class="lc lbwj" data-t="lbWhole"><div class="hh"><span>DAY</span><span>KM</span><span>ON THE ROAD</span><span>CLIMB</span></div>
    ${rows.map(r => html`<div class="rw" onClick=${() => setDay(t, r.n)} data-t=${'wj-' + r.n}><span>Day ${r.n}${r.st > 1 && (!r.tk || r.stale) ? html`<i>•</i>` : null}</span><b>${r.tk ? L.n0(r.km) : '—'}</b><b>${r.min ? L.dur(r.min) : '—'}</b><b>${r.up ? '↑ ' + L.n0(r.up) : '—'}</b></div>`)}
    <div class="rw tot"><span>Total</span><b>${L.n0(rows.reduce((s, r) => s + r.km, 0))}</b><b>${L.dur(rows.reduce((s, r) => s + r.min, 0))}</b><b>↑ ${L.n0(rows.reduce((s, r) => s + r.up, 0))}</b></div>
    ${busy ? html`<div class="pprog" style="margin:10px 0 0" data-t="lbAllBusy">Making track ${busy.i} of ${busy.n}…</div>`
      : html`<button class="lbtn o on" style="width:100%;margin-top:10px" disabled=${!need} onClick=${() => makeAll(l, id)} data-t="lbMakeAll">${need ? 'Make all tracks · ' + plural(need, 'day') : 'All tracks made'}</button>`}
    ${l.allMsg ? html`<div class="lnote" style="margin-top:8px" data-t="lbAllMsg">${l.allMsg}</div>` : null}</div>`;
}
export const scrLbItinerary = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 1, Empty('No journeys yet', 'Add a journey in Atlas first. Its days come from the dates you set there.'), 'scrLbItinerary');
    const id = t.TrId, ds = L.days(t), d = dayOf(t), dd = ds[d - 1], list = L.stops(id, d), tk = L.track(id, d), mt = L.meters(id, d), stale = L.isStale(id, d);
    const min = L.dayMin(id, d);
    return Page(l, 1, html`
      ${Switcher(l, t)}
      <div class="lbday" data-t="lbDays">${ds.map(x => html`<span class=${x.n === d ? 'on' : ''} onClick=${() => setDay(t, x.n)} data-t=${'day-' + x.n}>Day ${x.n}${L.stops(id, x.n).length ? html`<i></i>` : null}</span>`)}</div>
      ${LimitNote()}
      ${Sect('Day ' + d, dd ? L.dayLabel(dd) : '')}
      <div class="pstrip" data-t="lbDaySum" style="margin-top:0"><div><span>Today</span><b data-t="lbDayKm">${tk ? L.n0(mt.km) + ' km' : '—'}</b></div><div><span>On the road</span><b data-t="lbDayMin">${min ? L.dur(min) : '—'}</b></div><div><span>Highest</span><b data-t="lbDayHi">${tk && mt.max ? L.n0(mt.max) + ' m' : '—'}</b></div></div>
      ${Stops(l, t, d, list, tk)}
      ${stale ? html`<div class="lwarn" data-t="lbStale">The stops changed after this track was made. Tap “Make track again”.</div>` : null}
      ${tk ? html`
        ${Sect('On the map', 'Day GPX', () => { const g = L.gpx(id, d); download(g.name + '.gpx', g.xml, 'application/gpx+xml'); }, 'lbDayGpx')}
        <div class="lbmap" style="margin:0 12px 12px;background:#07080B" data-t="lbDayMap">${RouteMap({ id, days: [d], w: 366, h: 240, key: 'dayMap' }).svg}</div>

        ${mt && mt.ele.length > 1 ? html`${Sect('Elevation', L.n0(mt.max) + ' m top')}
          <div class="lc" data-t="lbElev">${Profile(l, 'd' + d, mt.ele, mt.km, L.stopFractions(id, d))}
            <div class="lbm"><div><span>Route km</span><b data-t="mKm">${L.n0(mt.km)}</b></div><div><span>Climb</span><b data-t="mUp">↑ ${L.n0(mt.up)}</b></div><div><span>Descent</span><b>↓ ${L.n0(mt.down)}</b></div><div><span>Steepest</span><b>${mt.steep.toFixed(0)}%</b></div></div>
            <div class="lnote" style="margin-top:8px">Drag along the profile to read any point.</div></div>` : html`<div class="lwarn" data-t="lbNoEle">No heights for this day yet, so no elevation or climb. Tap “Make track again” to read them.</div>`}` : list.length > 1 ? html`
        <div class="lnote" style="margin:0 18px 14px">Make the GPX track to get the day's km, map and heights. Google follows the roads by each leg's transport.</div>` : null}
      ${Borders(id)}
    `, 'scrLbItinerary');
  }
};

/* ───────── Expenses ───────── */
const rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); const n = m ? parseInt(m[1], 16) : 0xFF6A00; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
/** Six shades of the theme colour for the donut (like the example: one family of colours). */
export function shades() {
  const [r, g, b] = rgb(K.or);
  return [0, 0.35, -0.3, 0.6, -0.52, 0.8].map(f => f >= 0 ? [r, g, b].map(v => Math.round(v + (255 - v) * f)) : [r, g, b].map(v => Math.round(v * (1 + f))));
}
const css3 = a => 'rgb(' + a.join(',') + ')';
const lum = a => (0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2]) / 255;
function Donut(sp) {
  const S = 168, cx = S / 2, R = 62, W = 28, cols = shades(); let a0 = -Math.PI / 2;
  const segs = L.CATS.map((c, i) => ({ c, i, v: sp.by[c.k] || 0 })).filter(x => x.v > 0);
  const pt = (r, a) => [cx + r * Math.cos(a), cx + r * Math.sin(a)];
  const arcs = segs.map(x => {
    const f = x.v / sp.tot, a1 = a0 + f * Math.PI * 2 - (segs.length > 1 ? 0.0001 : 0.0002), r1 = R + W / 2, r0 = R - W / 2, big = f > 0.5 ? 1 : 0;
    const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r1, a1), [x3, y3] = pt(r0, a1), [x4, y4] = pt(r0, a0), m = (a0 + a1) / 2, [tx, ty] = pt(R, m); a0 = a1 + 0.0001;
    return html`<path d=${`M${x1},${y1}A${r1},${r1} 0 ${big} 1 ${x2},${y2}L${x3},${y3}A${r0},${r0} 0 ${big} 0 ${x4},${y4}Z`} fill=${css3(cols[x.i])} stroke=${K.surface || K.card} stroke-width="1.5" />
      ${f >= 0.05 ? html`<text x=${tx} y=${ty + 4} text-anchor="middle" font-size="11" font-weight="700" fill=${lum(cols[x.i]) > 0.62 ? '#1A1A1A' : '#FFFFFF'}>${Math.round(f * 100)}%</text>` : null}`;
  });
  return html`<svg width=${S} height=${S} viewBox=${`0 0 ${S} ${S}`} data-t="lbDonut">${sp.tot ? arcs : html`<circle cx=${cx} cy=${cx} r=${R} fill="none" stroke=${K.field} stroke-width=${W} />`}
    <text x=${cx} y=${cx - 5} text-anchor="middle" font-size="12" fill=${K.sub}>RM</text><text x=${cx} y=${cx + 15} text-anchor="middle" font-size="20" font-weight="800" fill=${K.text}>${L.n0(sp.tot)}</text></svg>`;
}
function SpendCard(sp) {
  const cols = shades(), top = L.CATS.map((c, i) => ({ c, i, v: sp.by[c.k] || 0 })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 3);
  return html`<div class="lc lbdc" data-t="lbSpend"><div class="hh">EXPENSES BY CATEGORY</div>
    <div class="lbdg">${Donut(sp)}<div class="lbdl">${L.CATS.map((c, i) => html`<div data-t=${'cat-' + c.k}><i style=${'background:' + css3(cols[i])}></i>${c.n}</div>`)}</div></div>
    ${top.length ? html`<div class="lbdt">${top.map(x => html`<div><b><i style=${'background:' + css3(cols[x.i])}></i>${x.c.n}</b><span>${L.RM(x.v)} <em>${Math.round(x.v / sp.tot * 100)}%</em></span></div>`)}</div>` : null}</div>`;
}
function Gauge(p) {
  const W = 128, cx = 64, cy = 70, R = 50, pt = f => [cx + R * Math.cos(Math.PI * (1 - f)), cy - R * Math.sin(Math.PI * (1 - f))];
  const arc = (f, col) => { const [x0, y0] = pt(0), [x1, y1] = pt(Math.max(0.001, Math.min(1, f))); return html`<path d=${`M${x0},${y0}A${R},${R} 0 0 1 ${x1},${y1}`} fill="none" stroke=${col} stroke-width="12" stroke-linecap="round" />`; };
  return html`<svg viewBox=${`0 0 ${W} 84`} width=${W} height="84" data-t="lbGauge">${arc(1, K.field)}${arc(p, p > 1 ? K.red : K.or)}
    <text x=${cx} y=${cy - 8} text-anchor="middle" font-size="22" font-weight="800" fill=${K.text}>${Math.round(p * 100)}%</text><text x=${cx} y=${cy + 8} text-anchor="middle" font-size="9" letter-spacing="1" fill=${K.sub}>OF BUDGET</text></svg>`;
}
function BudgetCard(l, t, sp, bg) {
  const id = t.TrId, tier = L.tierOf(id);
  if (!bg.tot) return html`<div class="lc" data-t="lbNoBudget"><b style=${`color:${K.text}`}>No budget yet</b><div class="lnote" style="margin-top:4px">Set one before you go and see each category over or under after.${tier ? ' Your Wanderlist tier ' + tier + ' suggests ' + L.RM(L.tierBudget(tier)) + '.' : ''}</div>
    <button class="lbtn o on" style="margin-top:10px" onClick=${() => canWrite() && openBudget(l, id)} data-t="lbSetBudget">Set a budget</button></div>`;
  const diff = sp.tot - bg.tot, cols = shades(), scale = 1.5; // the budget mark sits at two thirds; anything 50% or more over fills the bar
  return html`<div class="lbbva" data-t="lbBudget"><div class="top">${Gauge(sp.tot / bg.tot)}<div style="min-width:0"><div class="k">BUDGET VS ACTUAL</div>
      <div class="big">${L.RM(sp.tot)} <span>of ${L.RM(bg.tot)}</span></div>
      <span class=${'lbpill ' + (diff > 0 ? 'over' : 'ok')} data-t="lbBudRes">${diff > 0 ? L.RM(diff) + ' over budget' : L.RM(-diff) + ' left · on track'}</span>${tier ? html`<div class="tier">Wanderlist tier ${tier}</div>` : null}</div></div>
    ${L.CATS.map((c, i) => { const a = sp.by[c.k], b = bg.by[c.k], dv = a - b, p = b ? a / b : 0, col = 'rgb(' + cols[i].join(',') + ')'; return html`<div class="cr" data-t=${'bud-' + c.k}>${Tile(c.i, 30)}<div style="min-width:0">
      <div class="hd2"><b>${c.n}</b><span><b>${L.RM(a)}</b> / ${b ? L.RM(b) : '—'}</span></div>
      <div class="trk"><i style=${`width:${Math.min(100, (b ? p : a ? 1 : 0) / scale * 100).toFixed(1)}%;background:linear-gradient(90deg,${col},${K.or})`}></i>${b ? html`<u style=${`left:${(100 / scale).toFixed(1)}%`}></u>` : null}</div>
      <div class="ft"><span>${b ? Math.round(p * 100) + '% used' : 'no budget'}</span>${b || a ? html`<em class=${dv > 0 ? 'lbov' : 'lbun'}>${dv > 0 ? '+' + L.RM(dv) + ' over' : L.RM(-dv) + ' left'}</em>` : null}</div></div></div>`; })}
    <div class="ftr"><span><i></i> mark = budget</span><span class="lor" style="cursor:pointer;font-weight:700" onClick=${() => canWrite() && openBudget(l, id)} data-t="lbEditBudget">Edit budget ›</span></div></div>`;
}
function ExRow(l, id, e, x) {
  const c = L.CAT[e.ExCat] || L.CATS[0], cc = L.cardCost(e, id), share = x && x.n, myr = L.myrPaid(e.ExPay), at = e.ExStop ? (L.stops(id).find(s => s.LpId === e.ExStop) || {}).LpPlace : '';
  return html`<div class="lbex" onClick=${() => openExpense(l, id, e)} data-t=${'exp-' + e.ExId}>
    ${Tile(c.i, 34)}<div style="min-width:0"><div class="t">${e.ExWhat}${share ? html`<span class="lbpay spl" data-t=${'expShare-' + e.ExId}>${x.k}/${x.n}</span>` : null}${L.isNon(e) ? html`<span class="lbpay non">NON-GROUND</span>` : null}</div>
      <div class="s">${[c.n, L.payName(e.ExPay), at, e.ExNote].filter(Boolean).join(' · ')}</div></div>
    <div class="r">${share ? html`<b>${L.RM2(x.share)}</b><span>share</span>` : myr ? html`<b>${L.RM2(e.ExMyr)}</b><span>${e.ExBill ? L.money(e.ExBill, e.ExBillCur) + ' on bill' + (cc !== null ? ' · ' + (cc >= 0 ? '+' : '') + cc.toFixed(1) + '%' : '') : ''}</span>`
      : e.ExCur === 'MYR' ? html`<b>${L.RM2(e.ExMyr)}</b>` : html`<b>${L.money(e.ExAmt, e.ExCur)}</b><span>${L.RM2(e.ExMyr)}</span>`}</div></div>`;
}
export const scrLbExpenses = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 2, Empty('No journeys yet', 'Add a journey in Atlas first.'), 'scrLbExpenses');
    const id = t.TrId, sp = L.spend(id), bg = L.budget(id), all = L.expenses(id), ds = L.days(t);
    const sel = typeof l.exDay === 'number' && l.exDay <= ds.length ? l.exDay : 0;
    const curs = L.cursOf(id).length ? L.cursOf(id) : [L.mainCur(id)].filter(c => c !== 'MYR');
    const items = sel === 0 ? all.filter(e => Number(e.ExDay) === 0 && !L.span(e)).map(e => ({ e, share: L.myrOf(e), k: 0, n: 0 })) : L.dayItems(id, sel);
    const body = items.length ? html`${Sect(sel ? 'Day ' + sel : 'Before the trip', L.RM(items.reduce((s, x) => s + x.share, 0)))}<div class="lc" data-t=${'expDay-' + sel}>${items.map(x => ExRow(l, id, x.e, x))}</div>`
      : html`<div class="lnote" style="margin:4px 18px 14px" data-t="lbNoExp">Nothing ${sel ? 'on Day ' + sel : 'before the trip'} yet.</div>`;
    const gp = sp.tot ? Math.round(sp.ground / sp.tot * 100) : 0;
    return Page(l, 2, html`
      ${Switcher(l, t)}
      ${SpendCard(sp)}
      <div class="lbm" style="grid-template-columns:1fr 1fr;margin:0 12px 10px;cursor:pointer" onClick=${() => canWrite() && openBudget(l, id)} data-t="lbBL"><div><span>Budget ›</span><b>${bg.tot ? L.RM(bg.tot) : 'Set'}</b></div>
        <div><span>${bg.tot && sp.tot > bg.tot ? 'Over' : 'Left'}</span><b class=${bg.tot && sp.tot > bg.tot ? 'lbov' : ''} data-t="lbLeft">${bg.tot ? L.RM(Math.abs(bg.tot - sp.tot)) : '—'}</b></div></div>
      ${sp.tot ? html`<div class="lc lbgr" data-t="lbGround"><div class="h"><span><i></i>Ground <b>${L.RM(sp.ground)}</b></span><span class="n"><i></i>Non-ground <b>${L.RM(sp.non)}</b></span></div>
        <div class="bar"><i style=${`width:${gp}%`}></i></div></div>` : null}
      <div class="lc" data-t="lbRates" style="padding:10px 14px">${curs.map(c => { const r = L.rate(id, c); return html`<div class="lr" style="padding:5px 0;cursor:pointer" onClick=${() => canWrite() && openRate(l, id, c)} data-t=${'lbRate-' + c}>
        <span class="t">Journey rate · ${c}</span><span class="r">${r ? html`RM 1 = ${L.money(r, c)} <span class="lor">›</span>` : html`<span class="lor" style="font-weight:600">Set the rate ›</span>`}</span></div>`; })}
        ${!curs.length ? html`<div class="lsub" style="margin:0">Cash is in MYR for this journey.</div>` : null}</div>
      <div class="lbday" data-t="exDays">${[[0, 'Before'], ...ds.map(d => [d.n, 'Day ' + d.n])].map(([k, n]) => html`<span class=${sel === k ? 'on' : ''} onClick=${() => { l.exDay = k; rerender(); }} data-t=${'exD-' + k}>${n}</span>`)}</div>
      <div style="margin:0 12px 10px"><button class="lbtnf" style="width:100%" onClick=${() => canWrite() && openExpense(l, id, null, { day: sel })} data-t="lbAddExp">+ Add an expense</button></div>
      ${body}
    `, 'scrLbExpenses');
  }
};

/* ───────── Discovery ───────── */
export const scrLbResults = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 3, Empty('No journeys yet', 'Add a journey in Atlas first.'), 'scrLbResults');
    const id = t.TrId, r = L.result(id) || L.blankResult(id), fs = L.finds(id), g = L.gpx(id), x = L.lbTotals(id), ov = L.overall(id);
    const saveR = (k, v) => canWrite() && lbsave({ up: { LB_Results: [{ ...(L.result(id) || L.blankResult(id)), [k]: v }] } }, 'Discovery', t.TrName);
    const left = L.FINDS.filter(k => !fs.some(f => f.FdKind === k.k));
    return Page(l, 3, html`
      ${Switcher(l, t)}
      <div class="lbhero" data-t="lbDiscHero"><div class="k">THE JOURNEY'S SCORE · YOUR RATING</div>
        <div class="v"><b data-t="lbScore">${ov ? (ov % 1 ? ov.toFixed(1) : ov) : '—'}</b><span>/ 5</span></div>
        <div class="s">${Stars(id, 'RsOverall', ov, { big: true, c: K.heroText || '#fff' })}</div>
        ${r.RsVerdict ? html`<div class="q">“${r.RsVerdict}”</div>` : html`<div class="q2">Tap a star to give the journey its score. Tap it again for a half.</div>`}</div>
      ${Sect('Trail Marks')}
      <div class="lc lbmt" data-t="lbRate"><div class="hh"><span>METRIC</span><span>RATE</span></div>
        ${L.RATINGS.map(([k, n, ic]) => html`<div class="mr">${Ico(ic, 22)}<span class="n">${n.toUpperCase()}</span>${Stars(id, k, Number(r[k]) || 0)}</div>`)}</div>
      ${Sect('Hidden Treasures', fs.length ? fs.length + ' found' : '')}
      ${fs.length ? html`<div class="lc" data-t="lbFinds">${fs.map(f => { const k = L.FIND[f.FdKind]; return html`<div class="lbex" onClick=${() => openFind(l, id, f)} data-t=${'find-' + f.FdId}>
        ${Tile(k.i, 34)}<div style="min-width:0"><div class="kk">${k.n.toUpperCase()}</div><div class="t">${f.FdName}</div>
          <div class="s">${[f.FdWhere, f.FdProv, f.FdDay ? 'Day ' + f.FdDay : '', f.FdNote].filter(Boolean).join(' · ')}</div></div><div class="r">${Number(f.FdLat) ? Ico('view', 14, K.sub) : null}</div></div>`; })}</div>` : null}
      <div class="pchips" style="flex-wrap:wrap;overflow:visible" data-t="lbFindKinds">${left.map(k => html`<span class="pchip lbadd" onClick=${() => canWrite() && openFind(l, id, null, k.k)} data-t=${'addFind-' + k.k}>${Ico(k.i, 15)} + ${k.n}</span>`)}
        ${fs.length ? html`<span class="pchip lbadd" onClick=${() => canWrite() && openFind(l, id, null)} data-t="addFind">+ Another</span>` : null}</div>
      ${Sect('The Last Word')}
      <div class="lc" data-t="lbVerdictCard"><div class="llab" style="margin-top:0">In a few words</div><input class="lin" value=${r.RsVerdict} onChange=${e => saveR('RsVerdict', e.target.value.trim())} data-t="lbVerdict" />
        <div class="llab">Would you go back?</div>${Seg(L.BACK, r.RsBack, k => saveR('RsBack', r.RsBack === k ? '' : k), 'lbBack')}</div>
      ${Sect('Trail File')}
      <div class="lbgx" data-t="lbGpx"><div class="f">GPX</div><div class="t">${g.name}.gpx<span data-t="lbGpxInfo">${plural(g.trks, 'day')} · ${plural(g.wpts, 'stop')}${x.tracks ? ' · with heights' : ''}</span></div>
        ${g.trks || g.wpts ? html`<button class="lbtnf" onClick=${() => download(g.name + '.gpx', g.xml, 'application/gpx+xml')} data-t="lbGpxDl">Download</button>
          <button class="lbtn" disabled=${!!l.gpxBusy} onClick=${async () => { if (!canWrite()) return; l.gpxBusy = true; rerender(); const res = await call('lbGpxSave', { name: g.name, folder: t.TrName, xml: g.xml }); l.gpxBusy = false; l.gpxSaved = res ? 'Saved to Drive › MansWell Passport › ' + t.TrName : ''; rerender(); }} data-t="lbGpxDrive">${l.gpxBusy ? '…' : 'Drive'}</button>` : null}</div>
      ${l.gpxSaved ? html`<div class="lnote" style="margin:-4px 18px 12px" data-t="lbGpxSaved">${l.gpxSaved}</div>` : !(g.trks || g.wpts) ? html`<div class="lnote" style="margin:-4px 18px 12px">Make a track in Itinerary to get the file.</div>` : null}
    `, 'scrLbResults');
  }
};
