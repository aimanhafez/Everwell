// MansWell Voyage (was Logbook) · four pages: Journeys (every Atlas journey and what's filled in), Itinerary (day by day, the track, the day drawn),
// Expenses (cash in local currency, card in MYR, budget vs actual) and Discovery (journey badges, what you found, verdict, GPX).
// The route map, elevation meter and the numbers moved out: they go to Atlas (the summary) later.
import { html, K, G, rerender, Notify } from '../core.js';
import { Page, Sect, Switcher, Empty, Ring, cur, setCur, go, openStop, openPins, openExpense, openRate, openBudget, confirmAsk, lbsave, call, download, LimitNote, setBadge, openFind,
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
      ${i ? html`<div class="lbleg" data-t=${'leg-' + i}><span>${md.e}</span><b>${md.n}</b>
        ${lg ? html`<em data-t=${'legKm-' + i}>${L.n1(lg.km)} km</em>` : null}
        ${odd ? html`<span class="lbwarn" style="margin-left:auto;font-size:10.5px" onClick=${() => openPins(l, t.TrId, d, [i - 1, i])} data-t=${'legOdd-' + i}>⚠ check pins ›</span>` : null}</div>` : null}
      <div class="lbst" onClick=${() => openStop(l, t.TrId, d, s)} data-t=${'stop-' + i}><div class=${'b ' + badge(i, list.length)}>${i === 0 ? 'S' : i === list.length - 1 && list.length > 1 ? 'E' : i}</div>
        <div style="min-width:0"><div class="t">${s.LpPlace}${L.hasPin(s) ? html` <span style=${`color:${K.or};font-size:11px`}>●</span>` : null}</div><div class="s">${[s.LpCity, s.LpArr ? (i === 0 ? 'start ' : 'arrive ') + s.LpArr : '', s.LpNote].filter(Boolean).join(' · ')}</div></div>
        <div class="r">${i === 0 ? html`<b>START</b>` : i === list.length - 1 ? html`<b>END</b>` : null}</div></div>`; })}
    ${!list.length ? html`<div class="lnote" data-t="lbRest">No stops on Day ${d}. A day with no stops is a rest day.</div>` : null}
    ${making ? html`<div class="pprog" style="margin:12px 0 0" data-t="lbMaking">Making the track with Google Maps…</div>` : null}
    <div style="display:flex;gap:8px;margin-top:12px"><button class="lbtn" style="flex:1" onClick=${() => canWrite() && openStop(l, t.TrId, d, null)} data-t="lbAddStop">+ Add a stop</button>
      ${list.length > 1 ? html`<button class="lbtn o on" style="flex:1" disabled=${making} onClick=${() => canWrite() && openPins(l, t.TrId, d)} data-t="lbMake">${tk ? 'Make track again' : 'Make GPX track'}</button>` : null}</div>
  </div>`;
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
        <div class="lbmap" style="margin:0 12px 12px" data-t="lbDayMap">${RouteMap({ id, days: [d], w: 366, h: 220, key: 'dayMap' }).svg}</div>
        ${mt && mt.ele.length > 1 ? html`${Sect('Elevation', L.n0(mt.max) + ' m top')}
          <div class="lc" data-t="lbElev">${Profile(l, 'd' + d, mt.ele, mt.km, L.stopFractions(id, d))}
            <div class="lbm"><div><span>Route km</span><b data-t="mKm">${L.n0(mt.km)}</b></div><div><span>Climb</span><b data-t="mUp">↑ ${L.n0(mt.up)}</b></div><div><span>Descent</span><b>↓ ${L.n0(mt.down)}</b></div><div><span>Steepest</span><b>${mt.steep.toFixed(0)}%</b></div></div>
            <div class="lnote" style="margin-top:8px">Drag along the profile to read any point.</div></div>` : html`<div class="lwarn" data-t="lbNoEle">No heights for this day yet, so no elevation or climb. Tap “Make track again” to read them.</div>`}` : list.length > 1 ? html`
        <div class="lnote" style="margin:0 18px 14px">Make the GPX track to get the day's km, map and heights. Google follows the roads by each leg's transport.</div>` : null}
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

/* ───────── Discovery ───────── */
export const scrLbResults = {
  view(l) {
    const t = cur(); if (!t) return Page(l, 3, Empty('No journeys yet', 'Add a journey in Atlas first.'), 'scrLbResults');
    const id = t.TrId, r = L.result(id) || L.blankResult(id), bd = L.badges(id), fs = L.finds(id), g = L.gpx(id), x = L.lbTotals(id);
    const saveR = (k, v) => canWrite() && lbsave({ up: { LB_Results: [{ ...(L.result(id) || L.blankResult(id)), [k]: v }] } }, 'Discovery', t.TrName);
    const got = L.BADGES.filter(b => bd[b.k]);
    return Page(l, 3, html`
      ${Switcher(l, t)}
      <div class="ppass" data-t="lbDiscHero"><span class="lcap">Discovery</span>
        <div class="big" style="font-size:24px">${r.RsVerdict || 'What you found'}</div>
        ${got.length ? html`<div class="lbbadges" data-t="lbBadgeRow">${got.map(b => html`<span>${b.e} ${bd[b.k]} ${b.n === 'Riding comfort' ? 'ride' : b.n.split(' ')[0].toLowerCase()}</span>`)}</div>`
          : html`<div class="sub">Give the journey its badges and keep the places worth remembering.</div>`}</div>
      ${Sect('Journey badges', got.length + ' of 5')}
      <div class="lc" data-t="lbBadges">${L.BADGES.map(b => html`<div class="lbbg"><div class="t">${b.e} ${b.n}</div>
        <div class="pfr" style="margin-top:7px">${b.o.map(o => html`<span class=${'pchip' + (bd[b.k] === o ? ' on' : '')} style="padding:6px 10px" onClick=${() => setBadge(id, b.k, o)} data-t=${'bdg-' + b.k + '-' + o.replace(/\W/g, '')}>${o}</span>`)}</div></div>`)}</div>
      ${Sect('What you found', fs.length ? plural(fs.length, 'find') : '')}
      ${fs.length ? html`<div class="lc" data-t="lbFinds">${fs.map(f => { const k = L.FIND[f.FdKind] || L.FINDS[0]; return html`<div class="lbex" onClick=${() => openFind(l, id, f)} data-t=${'find-' + f.FdId}>
        <div class="e">${k.e}</div><div style="min-width:0"><div class="s" style="margin:0 0 2px;font-size:9.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${K.or}">${k.n}</div><div class="t">${f.FdName}</div>
          <div class="s">${[f.FdWhere, f.FdDay ? 'Day ' + f.FdDay : '', f.FdNote].filter(Boolean).join(' · ')}</div></div><div class="r">${Number(f.FdLat) ? html`<span class="lor">📍</span>` : null}</div></div>`; })}</div>` : null}
      <div class="pchips" style="flex-wrap:wrap;overflow:visible" data-t="lbFindKinds">${L.FINDS.filter(k => !fs.some(f => f.FdKind === k.k)).map(k => html`<span class="pchip" onClick=${() => canWrite() && openFind(l, id, null, k.k)} data-t=${'addFind-' + k.k}>+ ${k.e} ${k.n}</span>`)}
        ${fs.length ? html`<span class="pchip" onClick=${() => canWrite() && openFind(l, id, null)} data-t="addFind">+ Another</span>` : null}</div>
      ${Sect('Verdict')}
      <div class="lc" data-t="lbVerdictCard"><div class="llab" style="margin-top:0">In a few words</div><input class="lin" placeholder="Best ride so far" value=${r.RsVerdict} onChange=${e => saveR('RsVerdict', e.target.value.trim())} data-t="lbVerdict" />
        <div class="llab">Would you go back?</div>${Seg(L.BACK, r.RsBack, k => saveR('RsBack', r.RsBack === k ? '' : k), 'lbBack')}</div>
      ${Sect('GPX file')}
      <div class="lc" data-t="lbGpx"><div style="display:flex;gap:12px;align-items:center"><div style=${`width:44px;height:44px;border-radius:11px;display:grid;place-items:center;font:800 11px Inter;color:${K.or};background:${oa(.13)}`}>GPX</div>
        <div style="min-width:0"><b style=${`color:${K.text};font-size:14px`}>${g.name}.gpx</b><div class="lsub" style="margin:2px 0 0" data-t="lbGpxInfo">${plural(g.trks, 'day')} of track · ${plural(g.wpts, 'stop')} as waypoints${x.tracks ? ' · with heights' : ''}</div></div></div>
        ${g.trks || g.wpts ? html`<div style="display:flex;gap:8px;margin-top:12px"><button class="lbtnf" style="flex:1" onClick=${() => download(g.name + '.gpx', g.xml, 'application/gpx+xml')} data-t="lbGpxDl">Download</button>
          <button class="lbtn" style="flex:1" disabled=${!!l.gpxBusy} onClick=${async () => { if (!canWrite()) return; l.gpxBusy = true; rerender(); const res = await call('lbGpxSave', { name: g.name, folder: t.TrName, xml: g.xml }); l.gpxBusy = false; l.gpxSaved = res ? 'Saved to Drive › MansWell Passport › ' + t.TrName : ''; rerender(); }} data-t="lbGpxDrive">${l.gpxBusy ? 'Saving…' : 'Save to Drive'}</button></div>
          ${l.gpxSaved ? html`<div class="lnote" style="margin-top:8px" data-t="lbGpxSaved">${l.gpxSaved}</div>` : null}`
        : html`<div class="lnote" style="margin-top:8px">Add stops in Itinerary and make the track to get a GPX file.</div>`}
        <div class="lnote" style="margin-top:8px">One file for the whole journey: every day's track, every stop as a waypoint.</div></div>
    `, 'scrLbResults');
  }
};
