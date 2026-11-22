// MansWell Atlas (was Passport) · three pages: Odyssey (your world: search + map, journeys, going, stamps, milestones),
// Journeys (+ one journey) and Wanderlist (dreaming → going, with tiers).
import { html, K, DB, G, rerender, Today, Notify, NAV, Navigate, store } from '../core.js';
import * as S from './summary.js';
import * as I from './insights.js';
import * as LB from '../logbook/engine.js';
import { Page, Sect, Cap, Flag, WorldMap, Legend, focusMap, openCountry, openWish, openGoing, openDream, removeGoing, CLEAR, openTrip, openTripEdit, deleteTrip, openPick, openPhoto,
  confirmAsk, psave, canWrite, plural, tripLine, go, openSheet, closeSheet, TierBadge, WISHC, P, PH } from './ui.js';

const MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const tripFlags = (id, h = 14) => P.isosOf(id).map(iso => Flag(iso, h));
const coverBg = t => { const c = P.coverOf(t); return PH.bg(c && c.PhId, t.TrId); };
const coverHd = t => { const c = P.coverOf(t); return PH.bgHd(c && c.PhId, t.TrId); };
const countries = n => plural(n, 'country');
const PRI = { H: 'High', M: 'Medium', L: 'Low' };

/* ───────── Odyssey ───────── */
function Stamp(l, x) {
  const s = P.stampOf(x.c.iso, x.i), at = x.at !== '9999' ? x.at : '';
  return html`<div class=${'pstp ' + s.shape} style=${`--s:${s.color};--r:${s.rot}deg`} onClick=${() => openCountry(l, x.c.iso)} data-t=${'stamp-' + x.c.iso + (x.trip ? '-' + x.trip.TrId : '')} title=${x.c.name + (x.trip ? ' · ' + x.trip.TrName : '')}>
    <div>${Flag(x.c.iso, 14)}<b>${x.c.iso}</b><span>${at ? MONS[Number(at.slice(5, 7)) - 1] + ' ' + at.slice(0, 4) : 'VISITED'}</span></div></div>`;
}
const StPillSm = iso => { const st = iso === P.homeIso() ? 'home' : P.status(iso), n = st === 'visited' ? P.tripsIn(iso).length : 0; return html`<span class=${'pst ' + st} data-t=${'st-' + iso}>${{ visited: 'Visited', wish: 'Wanderlist', none: 'Not yet', home: 'Home' }[st]}${n > 1 ? ' ×' + n : ''}</span>`; };
/** The country you picked from the search: highlighted on the map, with Visited / Wanderlist right here. */
function PickCard(l, iso) {
  const c = P.BY[iso], st = P.status(iso), locked = P.byTrip(iso), ts = P.tripsIn(iso), pl = P.place(iso), home = iso === P.homeIso(), first = P.firstVisit(iso);
  const been = () => { if (locked) return; psave({ up: { PP_Places: [{ ...(pl || { PlIso: iso, PlPri: 'M', PlYear: 0, PlWhy: '', PlSee: '', PlNote: '', PlSeq: 0, PlPhoto: '', PlAdded: Today(), PlFirst: '' }), PlStatus: st === 'visited' ? '' : 'been', PlGo: '' }] } }, st === 'visited' ? 'Status cleared' : 'Visited before', c.name); };
  return html`<div class="ppick" data-t="pickCard">
    <div class="t">${Flag(iso, 30)}<div style="min-width:0;flex:1"><b data-t="pickName">${c.name}</b><div class="lsub" style="margin:0">${[c.cap, c.curName, c.cont].filter(Boolean).join(' · ')}${first ? ' · first visit ' + P.fmtMon(first) : ''}</div></div>
      <span class="x" onClick=${() => { l.sel = ''; l.q = ''; rerender(); }} data-t="pickClose">✕</span></div>
    ${home ? html`<div class="lnote" style="margin-top:8px">Your home country: on the map, never counted.</div>` : html`
      <div class="pb2"><button class=${'v' + (st === 'visited' ? ' on' : '')} onClick=${been} data-t="pickVisited" disabled=${locked}>${st === 'visited' ? '✓ Visited' : 'Mark visited'}</button>
        <button class=${'w' + (st === 'wish' ? ' on' : '')} onClick=${() => (st === 'visited' ? null : openWish(l, iso))} data-t="pickWish" disabled=${st === 'visited'}>${st === 'wish' ? '☆ On Wanderlist' : '☆ Wanderlist'}</button></div>
      <div class="lnote" style="margin-top:8px">${locked ? html`Visited by ${plural(ts.length, 'journey')}: ${ts.map((t, i) => html`${i ? ', ' : ''}<span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => openTrip(t.TrId)}>${t.TrName}</span>`)}.` : st === 'visited' ? 'Marked visited, no journey written up. Tap again to undo.' : st === 'wish' ? (P.isGoing(pl) ? 'Going in ' + pl.PlGoYear + '.' : 'Dreaming. Confirm in Wanderlist when you are going.') : 'Not visited yet.'}
        <span class="lor" style="cursor:pointer;font-weight:600;margin-left:4px" onClick=${() => openCountry(l, iso)} data-t="pickMore">Details ›</span></div>`}
  </div>`;
}
export const scrPpOverview = {
  view(l) {
    const s = P.stats(), ts = P.trips(), fx = P.facts(), gw = P.going();
    const empty = !ts.length && !DB.ppPlaces.length;
    const fv = P.stamps(), shownSt = l.allSt ? fv : fv.slice(0, 8);
    const q = l.q || '', sug = q.trim() && !l.sel ? P.search(q).slice(0, 5) : [];
    const pick = iso => { l.sel = iso; l.q = P.BY[iso].name; focusMap('odyssey', iso); rerender(); };
    return Page(l, 0, html`
      <div class="ppass" data-t="ppHero">
        <span class="lcap">Odyssey${s.since ? ' · since ' + P.yearOf(s.since) : ''}</span>
        <div class="big" data-t="ppCount">${countries(s.n)}</div>
        <div class="sub"><b data-t="ppPct">${s.pct.toFixed(1)}%</b> of ${P.WORLD_N} countries · <b data-t="ppConts">${s.conts} of 7</b> continents${s.extra ? html` · +${plural(s.extra, 'place')}` : null}</div>
        <div class="bar"><i style=${`width:${Math.max(s.n ? 1.5 : 0, s.pct)}%`}></i></div>
      </div>
      ${empty ? html`<div class="lc" data-t="ppWelcome"><b style=${`font-size:16px;color:${K.text}`}>Start your Atlas</b>
        <div class="lnote" style="margin-top:6px">Search a country below to mark where you've been, add a journey you've taken, or start your Wanderlist.</div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)} data-t="ppFirstTrip">+ Add a journey</button><button class="lbtn" onClick=${() => go('scrPpWishlist')}>Wanderlist</button></div></div>` : null}
      <div class="psrch" style="margin-bottom:0"><span style=${`color:${l.sel ? K.or : K.mute}`}>⌕</span><input placeholder="Search a country to see it on the map" value=${q} onInput=${e => { l.q = e.target.value; l.sel = ''; rerender(); }} data-t="oQ" />${q ? html`<span style=${`color:${K.sub};cursor:pointer`} onClick=${() => { l.q = ''; l.sel = ''; rerender(); }} data-t="oQx">✕</span>` : null}</div>
      ${sug.length ? html`<div class="psug" style="margin:6px 12px 0" data-t="oSug">${sug.map(c => html`<div class="pcr" onClick=${() => pick(c.iso)} data-t=${'oPick-' + c.iso}>${Flag(c.iso, 18)}<div><div class="t" style="font-size:13.5px">${c.name}</div><div class="s">${[c.cap, c.cont].filter(Boolean).join(' · ')}</div></div>${StPillSm(c.iso)}</div>`)}</div>` : q.trim() && !l.sel ? html`<div class="lsub" style="margin:8px 18px 0">No country matches “${q}”.</div>` : null}
      <div class="lc" style="padding:8px;margin-top:10px">${WorldMap('odyssey', { live: true, h: 200, sel: l.sel, onPick: iso => pick(iso) })}<div style="padding:0 4px">${Legend(s)}</div></div>
      ${l.sel && P.BY[l.sel] ? PickCard(l, l.sel) : null}
      <style>${S.css()}</style>
      ${S.StatCards()}
      ${fv.length ? html`${Sect('Borderless', plural(fv.length, 'stamp'))}
        <div class="lc" data-t="oStamps"><div class="pstamps">${shownSt.map((x, i) => Stamp(l, { ...x, i }))}${fv.length < 8 ? html`<div class="pstp lock" style="--r:0deg"><div><b>+</b><span>NEXT ONE</span></div></div>` : null}</div>
          ${fv.length > 8 ? html`<div class="lsub" style="text-align:center;margin-top:10px"><span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => { l.allSt = !l.allSt; rerender(); }} data-t="oAllSt">${l.allSt ? 'Show fewer' : '+' + (fv.length - 8) + ' more · show all'}</span></div>` : null}</div>` : null}
      ${S.Favourites()}
      ${S.MostSpent(id => openTrip(id))}
      ${S.CountryTable()}
      ${S.Badges()}
      ${S.Rides(l)}
      ${S.Milestones(l)}
    `, 'ppOverview');
  }
};

/* ───────── Journeys ───────── */
export const scrPpJourneys = {
  view(l) {
    const all = P.trips(), yrs = [...new Set(all.map(t => P.yearOf(t.TrStart)))];
    const ctry = [...new Set(all.flatMap(t => P.isosOf(t.TrId)))].sort((a, b) => P.BY[a].name.localeCompare(P.BY[b].name));
    const list = all.filter(t => (!l.yr || P.yearOf(t.TrStart) === Number(l.yr)) && (!l.ctry || P.isosOf(t.TrId).includes(l.ctry)) && (!l.with || P.withList(t).includes(l.with)));
    const byYear = []; for (const t of list) { const y = P.yearOf(t.TrStart); let g = byYear.find(x => x.y === y); if (!g) byYear.push(g = { y, ts: [] }); g.ts.push(t); }
    const sel = (v, set, opts, all0, id) => html`<select class=${'pchip' + (v ? ' on' : '')} style="border:0;font-family:inherit;-webkit-appearance:none;appearance:none" onChange=${e => { set(e.target.value); rerender(); }} data-t=${id}><option value="">${all0}</option>${opts.map(([k, t]) => html`<option value=${k} selected=${String(k) === String(v)}>${t}</option>`)}</select>`;
    // summary strip, quick filters, the latest journey as a big cover, then a timeline by year (one smart figure per row)
    const kmOf = t => { const x = LB.lbTotals(t.TrId); return x ? x.km : 0; };
    const fig = t => { const x = LB.lbTotals(t.TrId) || {}; return x.overall ? ['★ ' + x.overall.toFixed(1), 'SCORE'] : x.spent ? ['RM' + (x.spent >= 1000 ? (x.spent / 1000).toFixed(1) + 'k' : Math.round(x.spent)), 'SPENT'] : x.km ? [Math.round(x.km).toLocaleString('en-US'), 'KM'] : ['', '']; };
    const totKm = list.reduce((s, t) => s + kmOf(t), 0), totD = list.reduce((s, t) => s + P.daysOf(t), 0), totC = new Set(list.flatMap(t => P.isosOf(t.TrId))).size;
    const hero = list[0], rest = list.slice(1);
    const byYear2 = []; for (const t of rest) { const y = P.yearOf(t.TrStart); let g = byYear2.find(x => x.y === y); if (!g) byYear2.push(g = { y, ts: [] }); g.ts.push(t); }
    const yStat = y => { const ts = list.filter(t => P.yearOf(t.TrStart) === y), cs = new Set(ts.flatMap(t => P.isosOf(t.TrId))); return plural(ts.length, 'JOURNEY') + ' · ' + ts.reduce((s, t) => s + P.daysOf(t), 0) + ' DAYS · ' + plural(cs.size, 'COUNTRY'); };
    const hx = hero && (LB.lbTotals(hero.TrId) || {});
    return Page(l, 1, html`
      ${Sect('Journeys', '+ New journey', () => openTripEdit(l, null), 'jNew')}
      ${all.length ? html`<div class="jsum" data-t="jSum"><div><b>${list.length}</b><span>${list.length === 1 ? 'JOURNEY' : 'JOURNEYS'}</span></div><div><b>${totD}</b><span>DAYS</span></div><div><b>${totC}</b><span>${totC === 1 ? 'COUNTRY' : 'COUNTRIES'}</span></div><div><b>${Math.round(totKm).toLocaleString('en-US')}</b><span>KM</span></div></div>
        <div class="pchips">${sel(l.with, v => { l.with = v; }, P.WITH.map(w => [w, w]), 'Everyone ▾', 'jWith')}${sel(l.yr, v => { l.yr = v; }, yrs.map(y => [y, String(y)]), 'All years ▾', 'jYear')}${sel(l.ctry, v => { l.ctry = v; }, ctry.map(i => [i, P.BY[i].name]), 'Country ▾', 'jCtry')}</div>` : null}
      ${!all.length ? html`<div class="lc lempty" data-t="jEmpty">No journeys yet. Add the first one: name, countries, dates and who you went with. Photos come after.<div style="margin-top:12px"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)}>+ Add a journey</button></div></div>`
        : !list.length ? html`<div class="lc lempty">No journeys match these filters.</div>`
        : html`<div class="jhero" onClick=${() => openTrip(hero.TrId)} data-t=${'jTrip-' + hero.TrId}><div class="ph" style=${coverHd(hero)}></div>
            <span class="fl">${tripFlags(hero.TrId, 14)}</span>${hx.overall ? html`<span class="sc">★ ${hx.overall.toFixed(1)}</span>` : null}
            <div class="tx"><div class="k">${l.yr || l.ctry || l.with ? 'MOST RECENT MATCH' : 'LATEST'} · ${P.range(hero.TrStart, hero.TrEnd).toUpperCase()}</div><b>${hero.TrName}</b>
              <div class="m"><span>${plural(P.daysOf(hero), 'day')}</span>${hero.TrWith ? html`<span>${P.withTxt(hero)}</span>` : null}${P.isosOf(hero.TrId).length > 1 ? html`<span>${countries(P.isosOf(hero.TrId).length)}</span>` : null}${hx.km ? html`<span>${Math.round(hx.km).toLocaleString('en-US')} km</span>` : null}</div></div></div>
          ${rest.length ? html`<div class="jtl">${byYear2.map(g => html`<div class="jyr" data-t=${'jYr-' + g.y}><b>${g.y}</b><span>${yStat(g.y)}</span></div>
            ${g.ts.map(t => { const [v, u] = fig(t); return html`<div class="jrow" onClick=${() => openTrip(t.TrId)} data-t=${'jTrip-' + t.TrId}><span class="th" style=${coverHd(t)}></span>
              <span class="t"><b>${t.TrName}</b><span>${tripLine(t)}</span><span class="f">${tripFlags(t.TrId, 12)}</span></span>${v ? html`<span class="r"><b>${v}</b><span>${u}</span></span>` : null}</div>`; })}`)}</div>` : null}`}
    `, 'ppJourneys');
  }
};

/* ───────── one journey ───────── */
export const scrPpTrip = {
  view(l) {
    const t = P.trip(G.ppTrip);
    if (!t) return Page(l, 1, html`<div class="lc lempty">This journey was deleted.<div style="margin-top:10px"><button class="lbtn" onClick=${() => go('scrPpJourneys')}>Back to Journeys</button></div></div>`, 'ppTrip');
    if (l.tid !== t.TrId) { l.tid = t.TrId; l.allPh = false; }
    const route = P.routeOf(t), photos = P.photosOf(t.TrId), d = P.daysOf(t), nVid = photos.filter(PH.isVideo).length, cnt = [plural(photos.length - nVid, 'photo'), nVid ? plural(nVid, 'video') : ''].filter(Boolean).join(' · ');
    const isNew = iso => { const ts = P.tripsIn(iso); const pl = P.place(iso); return ts.length && ts[ts.length - 1].TrId === t.TrId && !(pl && pl.PlStatus === 'been' && pl.PlFirst && pl.PlFirst < t.TrStart); };
    const nNew = route.filter(r => isNew(r.iso)).length;
    const moments = String(t.TrMoments || '').split('\n').map(s => s.trim()).filter(Boolean);
    const folder = P.yearOf(t.TrStart) + ' · ' + t.TrName;
    const add = async e => {
      const files = [...(e.target.files || [])]; e.target.value = ''; if (!files.length || !canWrite()) return;
      const seq = photos.reduce((m, p) => Math.max(m, p.PhSeq || 0), 0), imgs = files.filter(f => !/^video\//.test(f.type)), vids = files.filter(f => /^video\//.test(f.type));
      const left = x => (x === null ? '' : x < 60 ? ' · about ' + Math.max(5, Math.round(x / 5) * 5) + ' s left' : ' · about ' + Math.round(x / 60) + ' min left');
      if (imgs.length) await PH.upload(imgs, { trip: t.TrId, folder, seq, onStep: (i, n, x) => { l.up = n ? { t: 'Saving ' + i + ' of ' + n + left(x), p: i / n } : ''; rerender(); } });
      if (vids.length) await PH.uploadVideos(vids, { trip: t.TrId, folder, seq: seq + imgs.length, onStep: (tx, fr) => { l.up = tx ? { t: tx, p: fr || 0 } : ''; rerender(); } });
    };
    const addCover = async e => {
      const files = [...(e.target.files || [])].slice(0, 1); e.target.value = ''; if (!files.length || !canWrite()) return;
      const rows = await PH.upload(files, { trip: t.TrId, folder, seq: 0, onStep: (i, n) => { l.up = n ? { t: 'Saving your cover photo to Drive…', p: null } : ''; rerender(); } });
      if (rows[0]) psave({ up: { PP_Trips: [{ ...P.trip(t.TrId), TrCover: rows[0].PhId }] } }, 'Journey cover', t.TrName);
    };
    const hasCover = !!P.coverOf(t), cv = (P.coverOf(t) || {}).PhId;
    const shown = l.allPh ? photos : photos.slice(0, 9), more = photos.length - 9;
    return Page(l, 1, html`
      <div class="pcover" style=${coverHd(t)} data-t="tCover">
        ${DB.ppOk ? html`<label class=${'pcvb' + (hasCover ? '' : ' big')} data-t="tCoverAdd">${hasCover ? 'Change cover' : '+ Add a cover photo'}<input class="pfile" type="file" accept="image/*" onChange=${addCover} data-t="tCoverFile" /></label>` : null}
        <div class="abs" style="left:16px;top:14px;z-index:2;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer" onClick=${() => go('scrPpJourneys')} data-t="tBack">‹ Journeys</div>
        <div class="abs" style="right:16px;top:14px;z-index:2;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer" onClick=${() => openTripEdit(l, t)} data-t="tEdit">Edit</div>
        <div class="ov"><b data-t="tTitle">${t.TrName}</b><span>${P.range(t.TrStart, t.TrEnd)}</span></div></div>
      <div class="pstrip"><div><span>Days</span><b data-t="tDays">${d}</b></div><div><span>With</span><b>${P.withTxt(t) || '—'}</b></div><div><span>Countries</span><b data-t="tN">${route.length}${nNew ? html`<em> · ${nNew} new</em>` : null}</b></div></div>
      ${route.map(r => html`<div class="proute" data-t=${'tStop-' + r.iso}>
        <div class="hd" onClick=${() => openCountry(l, r.iso)}>${Flag(r.iso, 16)}<b>${P.BY[r.iso].name}</b>${r.days ? html`<span>· ${plural(r.days, 'day')}</span>` : null}${isNew(r.iso) ? html`<em>NEW</em>` : null}</div>
        ${r.places.length ? html`<div class="pstops">${r.places.map((pl, i) => html`${i ? html`<i class="lk2"></i>` : null}<span class="pst2" data-t=${'tPlace-' + r.iso + '-' + i}><i>${i + 1}</i>${pl}</span>`)}</div>` : null}</div>`)}
      ${t.TrDesc ? html`<div class="lc">${Cap('The story')}<div style=${`font-size:14px;line-height:1.55;margin-top:7px;color:${K.text};white-space:pre-wrap`}>${t.TrDesc}</div></div>` : null}
      <style>${S.css()}</style>
      ${S.JourneyNumbers(t.TrId)}
      ${S.JourneyRoute(t.TrId)}
      ${S.Highlights(t.TrId)}
      ${S.JourneyElevation(l, t.TrId)}
      ${S.DailySpending(t.TrId)}
      ${S.ExpenseSplit(t.TrId)}
      ${I.journey(t.TrId).has ? null : html`<div class="lc" data-t="tVoyageHint"><b style=${`color:${K.text}`}>The rest comes from Voyage</b><div class="lnote" style="margin-top:4px">Add this journey's itinerary, expenses and score in Voyage to see the route map, daily spending and expenses here.</div>
        <button class="lbtn o on" style="margin-top:10px" onClick=${() => { G.lbTrip = t.TrId; store.set('lb_trip', t.TrId); NAV.stack = []; Navigate('scrLbItinerary'); }} data-t="tToVoyage">Open in Voyage</button></div>`}
      ${t.TrNotes ? html`<div class="lc">${Cap('My notes')}<div class="lnote" style="margin-top:6px;white-space:pre-wrap;font-size:12.5px">${t.TrNotes}</div></div>` : null}
      ${Sect('Memories', photos.length > 9 ? (l.allPh ? 'Show 9 · ' : 'See all · ') + cnt : cnt, photos.length > 9 ? () => { l.allPh = !l.allPh; rerender(); } : null, 'tSeeAll')}
      ${l.up ? html`<div class="pprog" data-t="tUp">${l.up.t}${l.up.p !== null ? html`<div class="lbar" style="margin-top:7px"><i style=${`width:${Math.round(l.up.p * 100)}%;background:${K.or}`}></i></div>` : null}</div>` : null}
      <div class="pgal" data-t="tGal">${shown.map((p, i) => { const last = !l.allPh && i === 8 && more > 0; return html`<div class=${(cv === p.PhId ? 'cv' : '') + (last ? ' more' : '')} data-m=${'+' + more} style=${PH.bg(p.PhId, p.PhId)} onClick=${() => { if (last) { l.allPh = true; rerender(); } else openPhoto(l, p); }} data-t=${'ph-' + p.PhId}>${PH.isVideo(p) && !last ? html`<span class="pvid"><i>▶</i><b>${PH.durTxt(p.PhDur)}</b></span>` : null}</div>`; })}
        ${photos.length < 9 || l.allPh ? html`<label class="add" data-t="tAddPh">${DB.ppOk ? html`<span>+ Add photos<br/>or videos</span><input class="pfile" type="file" accept="image/*,video/*" multiple onChange=${add} data-t="tFile" />` : html`<span style="font-size:10.5px">Update the Apps Script to add photos</span>`}</label>` : null}</div>
      ${photos.length >= 9 && !l.allPh && DB.ppOk ? html`<div style="margin:-4px 12px 12px"><label class="lbtn" style="width:100%;padding:10px" data-t="tAddPh2">+ Add photos or videos<input class="pfile" type="file" accept="image/*,video/*" multiple onChange=${add} data-t="tFile2" /></label></div>` : null}
      ${S.TravelInsights(t.TrId)}
      <div style="display:flex;gap:8px;margin:6px 12px 18px"><button class="lbtn" style="flex:1;padding:12px" onClick=${() => openTripEdit(l, t)} data-t="tEdit2">Edit journey</button><button class="lbtnd" style="flex:1" onClick=${() => deleteTrip(l, t)} data-t="tDelete">Delete journey</button></div>
    `, 'ppTrip');
  }
};

/* ───────── Wanderlist: + Add → Dreaming → Confirm → Going ───────── */
function wishActions(l, d) {
  const nm = P.dreamName(d);
  openSheet(l, { title: nm, body: () => html`<div data-t="wishActions" style="display:flex;flex-direction:column;gap:9px;padding-bottom:6px">
    <button class="lbtnf" onClick=${() => { closeSheet(l); openGoing(l, d); }} data-t="waGoing">Confirm I'm going</button>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openDream(l, d); }} data-t="waEdit">Edit priority, tier, places</button>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: d.isos }); }} data-t="waTrip">I went: add the journey</button>
    <button class="lbtnd" onClick=${() => { closeSheet(l); confirmAsk(l, 'Delete ' + nm + '?', 'It leaves your Wanderlist with its tier, places and notes.', 'Delete', () => psave({ up: { PP_Places: d.places.map(p => ({ ...p, ...CLEAR })) } }, 'Wanderlist removed', nm)); }} data-t="waRemove">Delete</button>
  </div>` });
}
function move(list, i, dir) {
  const j = i + dir; if (j < 0 || j >= list.length) return;
  const o = list.slice(); [o[i], o[j]] = [o[j], o[i]]; let k = 1;
  const rows = []; o.forEach(d => d.places.forEach(p => rows.push({ ...p, PlSeq: k++ })));
  psave({ up: { PP_Places: rows } }, 'Wanderlist order', P.dreamName(list[i]));
}
/** Going · an upcoming trip: one card; plan it in Voyage or remove it (back to Dreaming). Countries can't be changed. */
function goingActions(l, t) {
  const plan = () => { G.lbTrip = t.TrId; store.set('lb_trip', t.TrId); Navigate('scrLbItinerary'); };
  openSheet(l, { title: t.TrName, body: () => html`<div data-t="goActions" style="display:flex;flex-direction:column;gap:9px;padding-bottom:6px">
    <button class="lbtnf" onClick=${() => { closeSheet(l); plan(); }} data-t="gaPlan">Plan in Voyage</button>
    <button class="lbtnd" onClick=${() => { closeSheet(l); removeGoing(l, t); }} data-t="gaRemove">Remove from Going</button>
    <div class="lnote">It goes back to Dreaming with its priority and tier.</div></div>` });
}
const UpCard = (l, t) => {
  const isos = P.isosOf(t.TrId), n = P.daysTo(t), x = { days: new Set(LB.stops(t.TrId).map(s => Number(s.LpDay))).size, spent: LB.spend(t.TrId).tot };
  const plan = e => { e.stopPropagation(); G.lbTrip = t.TrId; store.set('lb_trip', t.TrId); Navigate('scrLbItinerary'); };
  return html`<div class="lc pup" data-t=${'up-' + t.TrId} onClick=${() => goingActions(l, t)} style="cursor:pointer">
    <div style="display:flex;justify-content:space-between;align-items:center"><div class="pfls">${isos.map(i => Flag(i, 22))}</div><span class="pupt" data-t=${'upIn-' + t.TrId}>${n ? 'IN ' + plural(n, 'DAY') : 'ON THE ROAD'}</span></div>
    <div class="t">${t.TrName}</div>
    <div class="s">${isos.map(i => P.BY[i].name).join(' · ')}</div><div class="s">${tripLine(t)}</div>
    <div class="pupf"><span>${x.days || x.spent ? [x.days ? 'Itinerary ' + plural(x.days, 'day') : '', x.spent ? LB.RM(x.spent) + ' booked' : ''].filter(Boolean).join(' · ') : 'Nothing planned yet'}</span>
      <span class="lor" style="font-weight:700;cursor:pointer" onClick=${plan} data-t=${'upPlan-' + t.TrId}>Plan in Voyage ›</span></div></div>`;
};
/** Going from before 3.11.1 (a year and days, no dates): shown as it was; remove only. */
/** Going (simple): one row per trip, flags on one line, the year and days, and the indicator. Tap to put it back to Dreaming. */
const GRow = (l, ps) => { const h = ps[0], names = ps.map(p => P.BY[p.PlIso].name).join(' · ');
  return html`<div class="pdr" data-t=${'wl-' + ps.map(p => p.PlIso).join('-')} style="cursor:pointer" onClick=${() => confirmAsk(l, 'Remove ' + names + ' from Going?', 'It goes back to Dreaming.', 'Remove', () => psave({ up: { PP_Places: ps.map(p => ({ ...p, PlGo: '', PlGoYear: 0, PlGoDays: 0 })) } }, 'Back to dreaming', names))}>
    <div style="min-width:0"><div class="pfls">${ps.map(p => Flag(p.PlIso, 20))}</div><div class="t">${names}</div><div class="s" data-t=${'goLine-' + h.PlIso}>${[h.PlGoYear || '', h.PlGoDays ? plural(h.PlGoDays, 'day') : ''].filter(Boolean).join(' · ')}</div></div>
    <div>${TierBadge(h.PlTier)}</div></div>`; };
/** A dream: flags on one line, the country names below. */
const DRow = (l, d, extra) => { const tags = String(d.see || '').split('|').filter(Boolean); return html`<div class="pdr" data-t=${'wl-' + d.isos.join('-')}>
  <div onClick=${() => wishActions(l, d)} style="cursor:pointer;min-width:0">
    <div class="pfls">${d.isos.map(i => Flag(i, 20))}</div>
    <div class="t">${P.dreamName(d)} <span class=${'ppri ' + d.pri}>${(PRI[d.pri] || 'Medium').toUpperCase()}</span></div>
    <div class="s">${P.isTier(d.tier) ? P.tierText(d.tier) : [...new Set(d.isos.map(i => P.BY[i].cont))].join(' · ')}</div>
    ${tags.length ? html`<div class="ptags">${tags.map(s => html`<i>${s}</i>`)}</div>` : null}</div>
  <div style="display:flex;gap:8px;align-items:flex-start">${TierBadge(d.tier)}${extra || null}</div></div>`; };
export const scrPpWishlist = {
  view(l) {
    const all = P.wishlist(), gw = P.going(), ups = P.upcoming(), sort = l.sort || 'order', PR = { H: 0, M: 1, L: 2 };
    const base = P.dreams();
    const list = sort === 'order' ? base : base.slice().sort(sort === 'pri' ? (a, b) => (PR[a.pri] ?? 1) - (PR[b.pri] ?? 1) || a.seq - b.seq
      : sort === 'tier' ? (a, b) => P.tierRank(a.tier) - P.tierRank(b.tier) || a.seq - b.seq : (a, b) => a.cont.localeCompare(b.cont) || a.seq - b.seq);
    const addNew = () => openDream(l, null);
    // counted by trip: a dream or a going trip with several countries is one destination
    const gGroups = []; for (const p of gw) { const k = p.PlDream || 'c:' + p.PlIso; let g = gGroups.find(x => x.k === k); if (!g) gGroups.push(g = { k, ps: [] }); g.ps.push(p); }
    const tripTiers = [...base.map(d => d.tier), ...gGroups.map(g => g.ps[0].PlTier), ...ups.map(() => '')], nTrips = tripTiers.length;
    const tally = P.TIER_LETTERS.map(x => [x, tripTiers.filter(c => P.isTier(c) && c[0] === x).length]), noTier = tripTiers.filter(c => !P.isTier(c)).length;
    const nGo = gGroups.length + ups.length;
    return Page(l, 2, html`
      ${Sect('Wanderlist', '+ Add', addNew, 'wlAdd')}
      ${nTrips ? html`<div class="lc" data-t="wlTally"><span class="lcap">${plural(nTrips, 'destination')} · ${nGo} going</span>
        <div class="ptiers">${tally.filter(([, n]) => n).map(([x, n]) => html`<i style=${`width:${n / nTrips * 100}%;background:${P.TIER_COLOR[x]}`}></i>`)}${noTier ? html`<i style=${`width:${noTier / nTrips * 100}%;background:${K.line2}`}></i>` : null}</div>
        <div class="ptl">${tally.map(([x, n]) => html`<span style=${`--c:${P.TIER_COLOR[x]}`}>${x} ${n}</span>`)}${noTier ? html`<span style=${`--c:${K.line2}`}>No tier ${noTier}</span>` : null}</div></div>` : null}
      ${!all.length && !ups.length ? html`<div class="lc lempty" data-t="wlEmpty">Places you dream of go here, one or more countries at a time, with a tier for budget and length. Confirm when you're going.<div style="margin-top:12px"><button class="lbtn o on" onClick=${addNew}>+ Add a destination</button></div></div>` : null}
      ${nGo ? html`${Sect('Going', String(nGo))}${ups.map(t => UpCard(l, t))}${gGroups.length ? html`<div class="lc" data-t="wlGoing">${gGroups.map(g => GRow(l, g.ps))}</div>` : null}` : null}
      ${base.length ? html`${Sect('Dreaming', String(base.length))}
        <div class="pchips">${[['order', 'My order'], ['pri', 'Priority'], ['tier', 'Tier'], ['cont', 'Continent']].map(([k, t]) => html`<span class=${'pchip' + (sort === k ? ' on' : '')} onClick=${() => { l.sort = k; rerender(); }} data-t=${'wlSort-' + k}>${t}</span>`)}</div>
        <div class="lc" data-t="wlList">${list.map((d, i) => DRow(l, d, sort === 'order' ? html`<div class="pord"><span onClick=${() => move(list, i, -1)} data-t=${'wlUp-' + d.isos[0]} style=${i ? '' : 'opacity:.3'}>▲</span><span onClick=${() => move(list, i, 1)} data-t=${'wlDn-' + d.isos[0]} style=${i < list.length - 1 ? '' : 'opacity:.3'}>▼</span></div>` : null))}</div>
        <div class="lnote" style="margin:0 18px">Tap a dream to confirm you're going, edit it or delete it.${sort === 'order' ? ' ▲ ▼ set your order.' : ''}</div>` : null}
    `, 'ppWishlist');
  }
};
