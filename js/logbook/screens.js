// MansWell Logbook · four pages: Journeys (every Atlas journey and what's filled in), Itinerary (day by day, the track, the day drawn),
// Expenses (cash in local currency, card in MYR, budget vs actual) and Results (ratings, the numbers, elevation meter, route map, GPX).
import { html, K, G, rerender, Notify } from '../core.js';
import { Page, Sect, Switcher, Empty, Ring, cur, setCur, go, openStop, openPins, openExpense, openRate, openBudget, openFull, confirmAsk, lbsave, call, download,
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
        <div class="g3"><div><span class="lcap">Itinerary</span><b data-t="lbNItin">${cnt('itin')} of ${ts.length}</b></div><div><span class="lcap">Expenses</span><b data-t="lbNExp">${cnt('exp')} of ${ts.length}</b></div><div><span class="lcap">Rated</span><b data-t="lbNRated">${cnt('rated')} of ${ts.length}</b></div></div></div>
      ${nOrph ? html`<div class="lwarn" data-t="lbOrphan">${plural(nOrph, 'Logbook detail')} belong to a journey deleted in Atlas.
        <span class="lor" style="cursor:pointer;font-weight:700;margin-left:4px" data-t="lbOrphanDel" onClick=${() => confirmAsk(l, 'Remove the leftover details?', 'Stops, tracks, expenses, budget and ratings of journeys deleted in Atlas are removed. Your other journeys are not touched.', 'Remove', () => lbsave({ del: orph }, 'Leftovers removed', nOrph + ' rows'))}>Remove ›</span></div>` : null}
      ${!ts.length ? Empty('No journeys yet', 'Journeys start in Atlas. Add one there and it shows up here, ready for its itinerary, expenses and ratings.') : html`
        ${Sect('Journeys', 'from Atlas')}
        <div class="lc" data-t="lbList">${ts.map((t, i) => { const x = tot[i]; return html`<div class="lbj" onClick=${() => { setCur(t.TrId); go('scrLbItinerary'); }} data-t=${'lbJ-' + t.TrId}>
          ${Ring(L.completeness(t.TrId), 44)}
          <div style="min-width:0"><div class="t">${t.TrName}</div><div class="s">${P.range(t.TrStart, t.TrEnd)} · ${plural(x.days, 'day')}</div>
            <div><span class=${'lbtag' + (x.filled.itin ? ' on' : '')}>ITINERARY</span><span class=${'lbtag' + (x.filled.exp ? ' on' : '')}>EXPENSES</span><span class=${'lbtag' + (x.filled.rated ? ' on' : '')}>${x.filled.rated ? 'RATED ' + x.overall.toFixed(1) : 'RATE IT'}</span></div></div>
          <div class="r"><b>${x.spent ? L.RM(x.spent) : '—'}</b><span>${x.km ? L.n0(x.km) + ' km' : '—'}</span></div></div>`; })}</div>
        <div class="lnote" style="margin:0 18px 14px">Add a journey in Atlas and it shows up here. Rename it or change its dates in Atlas and Logbook follows.</div>`}
    `, 'scrLbJourneys');
  }
};

/* ───────── Itinerary ───────── */
function Stops(l, t, d, list, tk) {
  const legs = L.legsOf(tk);
  return html`<div class="lc" data-t="lbStops">
    ${list.map((s, i) => html`
      ${i ? html`<div class="lbleg" data-t=${'leg-' + i}><span>${(L.MODE[s.LpMode] || L.MODE.bike).e}</span><b>${(L.MODE[s.LpMode] || L.MODE.bike).n}</b>
        ${s.LpKm ? html`<span>· ${L.n1(s.LpKm)} km</span>` : null}${s.LpMin ? html`<span>· ${L.dur(s.LpMin)}</span>` : null}
        ${legs[i - 1] ? html`<em data-t=${'legRoad-' + i}>${legs[i - 1].road ? 'road ' : 'straight '}${L.n1(legs[i - 1].km)} km</em>` : null}</div>` : null}
      <div class="lbst" onClick=${() => openStop(l, t.TrId, d, s)} data-t=${'stop-' + i}><div class=${'b ' + badge(i, list.length)}>${i === 0 ? 'S' : i === list.length - 1 && list.length > 1 ? 'E' : i}</div>
        <div style="min-width:0"><div class="t">${s.LpPlace}${L.hasPin(s) ? html` <span style=${`color:${K.or};font-size:11px`}>●</span>` : null}</div><div class="s">${[s.LpCity, s.LpArr ? (i === 0 ? 'start ' : 'arrive ') + s.LpArr : '', s.LpNote].filter(Boolean).join(' · ')}</div></div>
        <div class="r">${i === 0 ? html`<b>START</b>` : i === list.length - 1 ? html`<b>END</b>` : null}${s.LpStay ? L.dur(s.LpStay) + ' stayed' : ''}</div></div>`)}
    ${!list.length ? html`<div class="lnote" data-t="lbRest">No stops on Day ${d}. A day with no stops is a rest day.</div>` : null}
    <div style="display:flex;gap:8px;margin-top:12px"><button class="lbtn" style="flex:1" onClick=${() => canWrite() && openStop(l, t.TrId, d, null)} data-t="lbAddStop">+ Add a stop</button>
      ${list.length > 1 ? html`<button class="lbtn o on" style="flex:1" onClick=${() => canWrite() && openPins(l, t.TrId, d)} data-t="lbMake">${tk ? 'Make track again' : 'Make GPX track'}</button>` : null}</div>
  </div>`;
}
export const scrLbItinerary = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 1, Empty('No journeys yet', 'Add a journey in Atlas first. Its days come from the dates you set there.'), 'scrLbItinerary');
    const id = t.TrId, ds = L.days(t), d = dayOf(t), dd = ds[d - 1], list = L.stops(id, d), tk = L.track(id, d), mt = L.meters(id, d), stale = L.isStale(id, d);
    const km = L.dayKm(id, d), min = L.dayMin(id, d), mode = L.kmMode(id);
    return Page(l, 1, html`
      ${Switcher(l, t)}
      <div class="lbday" data-t="lbDays">${ds.map(x => html`<span class=${x.n === d ? 'on' : ''} onClick=${() => setDay(t, x.n)} data-t=${'day-' + x.n}>Day ${x.n}${L.stops(id, x.n).length ? html`<i></i>` : null}</span>`)}</div>
      ${Sect('Day ' + d, dd ? L.dayLabel(dd) : '')}
      ${Stops(l, t, d, list, tk)}
      <div class="pstrip" data-t="lbDaySum"><div><span>Today</span><b data-t="lbDayKm">${L.n0(km)} km</b></div><div><span>On the road</span><b>${L.dur(min)}</b></div><div><span>Stops</span><b>${Math.max(0, list.length - 2)}${list.length ? html` <em>+ start, end</em>` : null}</b></div></div>
      ${stale ? html`<div class="lwarn" data-t="lbStale">The stops changed after this track was made. Tap “Make track again”.</div>` : null}
      ${tk ? html`
        ${Sect('On the map', 'Day GPX', () => { const g = L.gpx(id, d); download(g.name + '.gpx', g.xml, 'application/gpx+xml'); }, 'lbDayGpx')}
        <div class="lbmap" style="margin:0 12px 12px" data-t="lbDayMap">${RouteMap({ id, days: [d], w: 366, h: 220, key: 'dayMap' }).svg}</div>
        <div class="lc" data-t="lbLegs">${list.slice(1).map((s, i) => { const lg = L.legsOf(tk)[i] || {}; return html`<div class="lblg"><div class="t">${(L.MODE[s.LpMode] || L.MODE.bike).e} ${list[i].LpPlace} → ${s.LpPlace}<div class="lsub" style="margin:2px 0 0;font-weight:400">typed ${s.LpKm ? L.n1(s.LpKm) + ' km' : '—'}${s.LpMin ? ' · ' + L.dur(s.LpMin) : ''}</div></div>
            <div class="r"><b>${L.n1(lg.km || 0)} km</b><div class="lsub" style="margin:2px 0 0">${lg.road ? (lg.min ? L.dur(lg.min) : 'road') : 'straight line'}</div></div></div>`; })}
          <div class="llab">Which km counts for this journey</div>${Seg([['road', 'Road km (track)'], ['typed', 'Typed km']], mode, k => lbsave({ up: { LB_Results: [{ ...(L.result(id) || L.blankResult(id)), RsKmMode: k }] } }, 'Km choice', t.TrName + ' · ' + k), 'lbKmMode')}</div>
        ${mt && mt.ele.length > 1 ? html`${Sect('Elevation', L.n0(mt.max) + ' m top')}
          <div class="lc" data-t="lbElev">${Profile(l, 'd' + d, mt.ele, mt.km, L.stopFractions(id, d))}
            <div class="lbm"><div><span>Route km</span><b data-t="mKm">${L.n0(mt.km)}</b></div><div><span>Climb</span><b data-t="mUp">↑ ${L.n0(mt.up)}</b></div><div><span>Descent</span><b>↓ ${L.n0(mt.down)}</b></div><div><span>Highest</span><b data-t="mMax">${L.n0(mt.max)} m</b></div></div>
            <div class="lnote" style="margin-top:8px">Steepest about ${mt.steep.toFixed(0)}%. Drag along the profile to read any point.</div></div>` : null}` : list.length > 1 ? html`
        <div class="lnote" style="margin:0 18px 14px">Make the GPX track to draw this day on the map with road km, climb and heights. Google finds each stop, then follows the roads by each leg's transport.</div>` : null}
    `, 'scrLbItinerary');
  }
};

/* ───────── Expenses ───────── */
function Donut(by, tot, size = 132) {
  const r = size / 2 - 10, c = 2 * Math.PI * r; let off = 0;
  return html`<svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`} data-t="lbDonut"><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${K.field} stroke-width="16" />
    ${tot ? L.CATS.filter(x => by[x.k] > 0).map(x => { const f = by[x.k] / tot, el = html`<circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${x.c} stroke-width="16" stroke-dasharray=${`${Math.max(0, c * f - 1.5).toFixed(1)} ${c.toFixed(1)}`} stroke-dashoffset=${(-off * c).toFixed(1)} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />`; off += f; return el; }) : null}
    <text x=${size / 2} y=${size / 2 - 6} text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1" fill=${K.sub}>MYR</text><text x=${size / 2} y=${size / 2 + 13} text-anchor="middle" font-size="18" font-weight="800" fill=${K.text}>${L.n0(tot)}</text></svg>`;
}
function BudgetCard(l, t, sp, bg) {
  const id = t.TrId, tier = L.tierOf(id);
  if (!bg.tot) return html`<div class="lc" data-t="lbNoBudget"><b style=${`color:${K.text}`}>No budget yet</b><div class="lnote" style="margin-top:4px">Set one before you go and see each category over or under after.${tier ? ' Your Wanderlist tier ' + tier + ' suggests ' + L.RM(L.tierBudget(tier)) + '.' : ''}</div>
    <button class="lbtn o on" style="margin-top:10px" onClick=${() => canWrite() && openBudget(l, id)} data-t="lbSetBudget">Set a budget</button></div>`;
  const diff = sp.tot - bg.tot, mx = Math.max(...L.CATS.map(c => Math.max(sp.by[c.k], bg.by[c.k])), 1);
  return html`<div class="lc" data-t="lbBudget"><span class="lcap">Budget vs actual · MYR</span>
    <div style=${`font-size:19px;font-weight:700;margin-top:4px;color:${K.text}`}>${L.RM(sp.tot)} <span style=${`font-size:13px;font-weight:500;color:${K.sub}`}>of ${L.RM(bg.tot)} budget</span></div>
    <div class=${diff > 0 ? 'lbov' : 'lbun'} style="font-size:12.5px;font-weight:600;margin-top:2px" data-t="lbBudRes">${L.RM(Math.abs(diff))} ${diff > 0 ? 'over' : 'under'}${tier ? html`<span style=${`color:${K.sub};font-weight:500`}> · Wanderlist tier ${tier}</span>` : null}</div>
    <div style="margin-top:8px">${L.CATS.map(c => { const a = sp.by[c.k], b = bg.by[c.k], dv = a - b; return html`<div class="lbbar" data-t=${'bud-' + c.k}><span>${c.n}</span>
      <div class="tr"><i style=${`width:${(a / mx * 100).toFixed(1)}%;background:${c.c}`}></i>${b ? html`<u style=${`left:${(b / mx * 100).toFixed(1)}%`}></u>` : null}</div>
      <div class="v"><b>${L.n0(a)}</b><span class=${dv > 0 ? 'lbov' : 'lbun'}>${b || a ? (dv > 0 ? '+' : '−') + L.n0(Math.abs(dv)) : ''}</span></div></div>`; })}</div>
    <div class="lnote" style="margin-top:6px">The white line is the budget. <span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => canWrite() && openBudget(l, id)} data-t="lbEditBudget">Edit budget ›</span></div></div>`;
}
export const scrLbExpenses = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 2, Empty('No journeys yet', 'Add a journey in Atlas first.'), 'scrLbExpenses');
    const id = t.TrId, sp = L.spend(id), bg = L.budget(id), f = l.cat || '', all = L.expenses(id), list = all.filter(e => !f || e.ExCat === f);
    const curs = L.cursOf(id).length ? L.cursOf(id) : [L.mainCur(id)].filter(c => c !== 'MYR');
    const groups = []; for (const e of list) { const g = groups[groups.length - 1]; if (g && g.d === Number(e.ExDay)) g.list.push(e); else groups.push({ d: Number(e.ExDay), list: [e] }); }
    const ds = L.days(t);
    return Page(l, 2, html`
      ${Switcher(l, t)}
      <div class="lc" data-t="lbSpend"><div class="lbdon">${Donut(sp.by, sp.tot)}<div class="lbleg2">${L.CATS.map(c => html`<div><i style=${'background:' + c.c}></i><span>${c.n}</span><b data-t=${'cat-' + c.k}>${L.n0(sp.by[c.k])}</b></div>`)}</div></div>
        <div class="lbm" style="grid-template-columns:repeat(3,1fr)"><div><span>Budget</span><b>${bg.tot ? L.RM(bg.tot) : '—'}</b></div><div><span>${bg.tot && sp.tot > bg.tot ? 'Over' : 'Left'}</span><b class=${bg.tot && sp.tot > bg.tot ? 'lbov' : ''} data-t="lbLeft">${bg.tot ? L.RM(Math.abs(bg.tot - sp.tot)) : '—'}</b></div>
          <div><span>Cash · card</span><b data-t="lbSplit">${sp.tot ? Math.round(sp.cash / sp.tot * 100) + '% · ' + Math.round(sp.card / sp.tot * 100) + '%' : '—'}</b></div></div></div>
      <div class="lc" data-t="lbRates" style="padding:10px 14px">${curs.map(c => { const r = L.rate(id, c); return html`<div class="lr" style="padding:5px 0;cursor:pointer" onClick=${() => canWrite() && openRate(l, id, c)} data-t=${'lbRate-' + c}>
        <span class="t">Journey rate · ${c}</span><span class="r">${r ? html`RM 1 = ${L.money(r, c)} <span class="lor">›</span>` : html`<span class="lor" style="font-weight:600">Set the rate ›</span>`}</span></div>`; })}
        ${!curs.length ? html`<div class="lsub" style="margin:0">Cash is in MYR for this journey.</div>` : null}</div>
      ${BudgetCard(l, t, sp, bg)}
      <div class="pchips" style="margin-top:2px">${[['', 'All'], ...L.CATS.map(c => [c.k, c.s])].map(([k, n]) => html`<span class=${'pchip' + (f === k ? ' on' : '')} onClick=${() => { l.cat = k; rerender(); }} data-t=${'eF-' + (k || 'all')}>${n}</span>`)}</div>
      <div style="margin:0 12px 10px"><button class="lbtnf" style="width:100%" onClick=${() => canWrite() && openExpense(l, id, null, { day: dayOf(t), cat: f || undefined })} data-t="lbAddExp">+ Add an expense</button></div>
      ${!list.length ? html`<div class="lnote" style="margin:4px 18px 14px" data-t="lbNoExp">${all.length ? 'Nothing in this category.' : 'No expenses yet. Cash goes in the country’s currency, card in the RM your bank charged.'}</div>` : null}
      ${groups.map(g => html`${Sect(g.d ? 'Day ' + g.d : 'Before the trip', L.RM(g.list.reduce((s, e) => s + L.myrOf(e), 0)))}
        <div class="lc" data-t=${'expDay-' + g.d}>${g.list.map(e => { const c = L.CAT[e.ExCat] || L.CATS[0], cc = L.cardCost(e, id); return html`<div class="lbex" onClick=${() => openExpense(l, id, e)} data-t=${'exp-' + e.ExId}>
          <div class="e">${c.e}</div><div style="min-width:0"><div class="t">${e.ExWhat}<span class=${'lbpay ' + (e.ExPay === 'card' ? 'card' : 'cash')}>${e.ExPay === 'card' ? 'CARD' : 'CASH'}</span></div><div class="s">${c.n}${e.ExPay === 'card' ? ' · charged in MYR' : ''}</div></div>
          <div class="r">${e.ExPay === 'card' ? html`<b>${L.RM2(e.ExMyr)}</b><span>${e.ExBill ? L.money(e.ExBill, e.ExBillCur) + ' on bill' + (cc !== null ? ' · ' + (cc >= 0 ? '+' : '') + cc.toFixed(1) + '%' : '') : ''}</span>`
            : e.ExCur === 'MYR' ? html`<b>${L.RM2(e.ExMyr)}</b>` : html`<b>${L.money(e.ExAmt, e.ExCur)}</b><span>${L.RM2(e.ExMyr)}</span>`}</div></div>`; })}</div>`)}
      ${ds.length ? null : null}
    `, 'scrLbExpenses');
  }
};

/* ───────── Results ───────── */
function Stars(l, id, k, v) {
  const set = n => { if (!canWrite()) return; const r = L.result(id) || L.blankResult(id); lbsave({ up: { LB_Results: [{ ...r, [k]: n }] } }, 'Rated', k + ' ' + n); };
  return html`<div class="lbstars">${[1, 2, 3, 4, 5].map(i => { const fl = Math.max(0, Math.min(1, v - i + 1)); return html`<span onClick=${() => set(v === i ? i - 0.5 : i)} data-t=${'star-' + k + '-' + i}>★<i style=${`width:${fl * 100}%`}>★</i></span>`; })}</div>`;
}
function Everest(climb) {
  const n = climb / L.EVEREST, h = 150, full = Math.max(1, Math.ceil(n)), fill = Math.min(1, n / full);
  return html`<svg width="78" height=${h} viewBox=${`0 0 78 ${h}`} data-t="lbEverest">
    <defs><linearGradient id="lbevg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color=${K.or} stop-opacity=".35" /><stop offset="1" stop-color=${K.or} /></linearGradient></defs>
    <path d=${`M4,${h} L39,8 L74,${h} Z`} fill=${K.field} stroke=${K.line2} />
    <clipPath id="lbevc"><path d=${`M4,${h} L39,8 L74,${h} Z`} /></clipPath>
    <rect x="0" y=${h - (h - 8) * fill} width="78" height=${(h - 8) * fill} fill="url(#lbevg)" clip-path="url(#lbevc)" />
    <path d=${`M30,${8 + 26} L39,8 L48,${8 + 26} L43,${8 + 22} L39,${8 + 27} L35,${8 + 22} Z`} fill="#fff" opacity=".85" />
    ${Array.from({ length: full - 1 }, (_, i) => html`<line x1="10" x2="68" y1=${h - (h - 8) * (i + 1) / full} y2=${h - (h - 8) * (i + 1) / full} stroke=${K.text} stroke-opacity=".35" stroke-dasharray="3 3" />`)}
  </svg>`;
}
export const scrLbResults = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 3, Empty('No journeys yet', 'Add a journey in Atlas first.'), 'scrLbResults');
    const id = t.TrId, r = L.result(id) || L.blankResult(id), x = L.lbTotals(id), ov = L.overall(id), ds = L.days(t);
    const perDay = ds.map(d => ({ d: d.n, up: Number((L.track(id, d.n) || {}).TkUp) || 0, max: Number((L.track(id, d.n) || {}).TkMax) || 0 }));
    const mxUp = Math.max(1, ...perDay.map(p => p.up)), highs = perDay.filter(p => p.max).sort((a, b) => b.max - a.max).slice(0, 3);
    const country = (P.BY[P.isosOf(id).find(i => i !== P.homeIso()) || P.isosOf(id)[0]] || {}).name || '';
    const diff = x.budget ? x.spent - x.budget : null, g = L.gpx(id), hasLine = ds.some(d => L.lineOf(id, d.n).pts.length > 1);
    const saveR = (k, v) => canWrite() && lbsave({ up: { LB_Results: [{ ...(L.result(id) || L.blankResult(id)), [k]: v }] } }, 'Results', t.TrName);
    const m = hasLine ? RouteMap({ id, days: ds.map(d => d.n), w: 366, h: 260, perDay: !!l.perDay, labels: true, key: 'bigMap', onPin: d => { (G.lbDayOf = G.lbDayOf || {})[id] = d; go('scrLbItinerary'); } }) : null;
    return Page(l, 3, html`
      ${Switcher(l, t)}
      <div class="ppass" data-t="lbOverall"><span class="lcap">Overall · out of 5</span>
        <div class="big" data-t="lbScore">${ov ? ov.toFixed(1) : '—'}</div>
        <div class="sub">${r.RsVerdict ? html`<b>${r.RsVerdict}</b> · ` : null}average of the five below</div></div>
      ${Sect('Rate it')}
      <div class="lc" data-t="lbRate">${L.RATINGS.map(([k, n]) => html`<div class="lbstar"><span class="t">${n}</span>${Stars(l, id, k, Number(r[k]) || 0)}<span class="n" data-t=${'rv-' + k}>${Number(r[k]) ? Number(r[k]).toFixed(1) : '–'}</span></div>`)}
        <div class="llab">Verdict · in a few words</div><input class="lin" placeholder="Best ride so far" value=${r.RsVerdict} onChange=${e => saveR('RsVerdict', e.target.value.trim())} data-t="lbVerdict" />
        <div class="llab">Would you go back?</div>${Seg(L.BACK, r.RsBack, k => saveR('RsBack', r.RsBack === k ? '' : k), 'lbBack')}</div>
      ${Sect('The numbers', 'worked out')}
      <div class="lbm" style="grid-template-columns:repeat(3,1fr);margin:0 12px 12px" data-t="lbNums">
        <div><span>Distance</span><b data-t="nKm">${L.n0(x.km)} km</b></div><div><span>On the road</span><b>${x.min ? Math.round(x.min / 60) + ' h' : '—'}</b></div><div><span>Spent</span><b data-t="nSpent">${x.spent ? L.RM(x.spent) : '—'}</b></div>
        <div><span>Actual tier</span><b data-t="nTier">${x.tier ? html`<span class="ptier" style=${'--c:' + P.TIER_COLOR[x.tier[0]]}>${x.tier}</span>` : '—'}</b></div><div><span>Climbed</span><b data-t="nClimb">${x.climb ? L.n0(x.climb) + ' m' : '—'}</b></div>
        <div><span>Budget</span><b class=${diff === null ? '' : diff > 0 ? 'lbov' : 'lbun'}>${diff === null ? '—' : L.RM(Math.abs(diff)) + (diff > 0 ? ' over' : ' under')}</b></div></div>
      ${x.climb ? html`${Sect('Elevation meter')}
        <div class="lc" data-t="lbMeter"><div class="lbev">${Everest(x.climb)}<div><div style=${`font-size:22px;font-weight:800;color:${K.text}`} data-t="lbClimbed">${L.n0(x.climb)} m</div>
          <div class="lsub" style="margin:2px 0 0">climbed · <b class="lor" data-t="lbEvX">${(x.climb / L.EVEREST).toFixed(1)}× Everest</b> (${L.n0(L.EVEREST)} m)</div>
          ${highs.length ? html`<div style="margin-top:10px">${highs.map(h => html`<div class="lr" style="padding:3px 0"><span class="t" style="font-size:12px">Day ${h.d} top</span><span class="r" style="font-size:12px"><b>${L.n0(h.max)} m</b></span></div>`)}</div>` : null}</div></div>
          <div class="lcap" style="display:block;margin-top:12px">Climb per day · m</div>
          <div class="lbcpd">${perDay.map(p => html`<div><i style=${`height:${Math.max(p.up ? 4 : 0, p.up / mxUp * 66)}px`}></i>D${p.d}</div>`)}</div></div>` : null}
      ${m ? html`${Sect('Route map', 'View full map ⤢', () => openFull(l, id), 'lbFullOpen')}
        <div class="lbmap" style="margin:0 12px 8px" data-t="lbBigMap">${m.svg}
          <div class="ov"><b>${country.toUpperCase()}</b></div><div class="ov2"><b data-t="lbMapKm">${L.n0(x.km)} km</b><span>TOTAL DISTANCE · ${plural(x.days, 'DAY')}</span></div></div>
        <div style="margin:0 12px 12px">${Seg([['one', 'One colour'], ['day', 'Colour by day']], l.perDay ? 'day' : 'one', k => { l.perDay = k === 'day'; rerender(); }, 'lbCol')}</div>` : null}
      ${Sect('GPX file')}
      <div class="lc" data-t="lbGpx"><div style="display:flex;gap:12px;align-items:center"><div style=${`width:44px;height:44px;border-radius:11px;display:grid;place-items:center;font:800 11px Inter;color:${K.or};background:${oa(.13)}`}>GPX</div>
        <div style="min-width:0"><b style=${`color:${K.text};font-size:14px`}>${g.name}.gpx</b><div class="lsub" style="margin:2px 0 0" data-t="lbGpxInfo">${plural(g.trks, 'day')} of track · ${plural(g.wpts, 'stop')} as waypoints${x.tracks ? ' · with heights' : ''}</div></div></div>
        ${g.trks || g.wpts ? html`<div style="display:flex;gap:8px;margin-top:12px"><button class="lbtnf" style="flex:1" onClick=${() => download(g.name + '.gpx', g.xml, 'application/gpx+xml')} data-t="lbGpxDl">Download</button>
          <button class="lbtn" style="flex:1" disabled=${!!l.gpxBusy} onClick=${async () => { if (!canWrite()) return; l.gpxBusy = true; rerender(); const res = await call('lbGpxSave', { name: g.name, folder: t.TrName, xml: g.xml }); l.gpxBusy = false; l.gpxSaved = res ? 'Saved to Drive › MansWell Passport › ' + t.TrName : ''; rerender(); }} data-t="lbGpxDrive">${l.gpxBusy ? 'Saving…' : 'Save to Drive'}</button></div>
          ${l.gpxSaved ? html`<div class="lnote" style="margin-top:8px" data-t="lbGpxSaved">${l.gpxSaved}</div>` : null}`
        : html`<div class="lnote" style="margin-top:8px">Add stops in Itinerary and make the track to get a GPX file.</div>`}
        <div class="lnote" style="margin-top:8px">Opens in riding, hiking and map apps that read GPX.</div></div>
    `, 'scrLbResults');
  }
};
