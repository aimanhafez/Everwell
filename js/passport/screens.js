// MansWell Atlas (was Passport) · three pages: Odyssey (your world: search + map, journeys, going, stamps, milestones),
// Journeys (+ one journey) and Wanderlist (dreaming → going, with tiers).
import { html, K, DB, G, rerender, Today, Notify } from '../core.js';
import { Page, Sect, Cap, Flag, WorldMap, Legend, focusMap, openCountry, openWish, openGoing, openTrip, openTripEdit, deleteTrip, openPick, openPhoto,
  confirmAsk, psave, canWrite, plural, tripLine, go, openSheet, closeSheet, TierBadge, WISHC, P, PH } from './ui.js';

const MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const tripFlags = (id, h = 14) => P.isosOf(id).map(iso => Flag(iso, h));
const coverBg = t => { const c = P.coverOf(t); return PH.bg(c && c.PhId, t.TrId); };
const coverHd = t => { const c = P.coverOf(t); return PH.bgHd(c && c.PhId, t.TrId); };
const countries = n => plural(n, 'country');
const PRI = { H: 'High', M: 'Medium', L: 'Low' };

/* ───────── Odyssey ───────── */
function Stamp(l, x) {
  const s = P.stampOf(x.c.iso), at = x.at !== '9999' ? x.at : '';
  return html`<div class=${'pstp' + (s.sq ? ' sq' : '')} style=${`--s:${s.color};--r:${s.rot}deg`} onClick=${() => openCountry(l, x.c.iso)} data-t=${'stamp-' + x.c.iso} title=${x.c.name}>
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
    const s = P.stats(), ts = P.trips(), ms = P.milestones(), fx = P.facts(), gw = P.going();
    const empty = !ts.length && !DB.ppPlaces.length;
    const fv = P.firstVisits(), shownSt = l.allSt ? fv : fv.slice(0, 8);
    const q = l.q || '', sug = q.trim() && !l.sel ? P.search(q).slice(0, 5) : [];
    const pick = iso => { l.sel = iso; l.q = P.BY[iso].name; focusMap('odyssey', iso); rerender(); };
    return Page(l, 0, html`
      <div class="ppass" data-t="ppHero">
        <span class="lcap">Odyssey${s.since ? ' · since ' + P.yearOf(s.since) : ''}</span>
        <div class="big" data-t="ppCount">${countries(s.n)}</div>
        <div class="sub"><b data-t="ppPct">${s.pct.toFixed(1)}%</b> of ${P.WORLD_N} countries · <b data-t="ppConts">${s.conts} of 7</b> continents${s.extra ? html` · +${plural(s.extra, 'place')}` : null}</div>
        <div class="bar"><i style=${`width:${Math.max(s.n ? 1.5 : 0, s.pct)}%`}></i></div>
        <div class="g3"><div><span class="lcap">Journeys</span><b data-t="ppTrips">${s.trips}</b></div><div><span class="lcap">Wanderlist</span><b data-t="ppWish">${s.wish}</b></div><div><span class="lcap">Days away</span><b data-t="ppDays">${s.days}</b></div></div>
      </div>
      ${empty ? html`<div class="lc" data-t="ppWelcome"><b style=${`font-size:16px;color:${K.text}`}>Start your Atlas</b>
        <div class="lnote" style="margin-top:6px">Search a country below to mark where you've been, add a journey you've taken, or start your Wanderlist.</div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)} data-t="ppFirstTrip">+ Add a journey</button><button class="lbtn" onClick=${() => go('scrPpWishlist')}>Wanderlist</button></div></div>` : null}
      <div class="psrch" style="margin-bottom:0"><span style=${`color:${l.sel ? K.or : K.mute}`}>⌕</span><input placeholder="Search a country to see it on the map" value=${q} onInput=${e => { l.q = e.target.value; l.sel = ''; rerender(); }} data-t="oQ" />${q ? html`<span style=${`color:${K.sub};cursor:pointer`} onClick=${() => { l.q = ''; l.sel = ''; rerender(); }} data-t="oQx">✕</span>` : null}</div>
      ${sug.length ? html`<div class="psug" style="margin:6px 12px 0" data-t="oSug">${sug.map(c => html`<div class="pcr" onClick=${() => pick(c.iso)} data-t=${'oPick-' + c.iso}>${Flag(c.iso, 18)}<div><div class="t" style="font-size:13.5px">${c.name}</div><div class="s">${[c.cap, c.cont].filter(Boolean).join(' · ')}</div></div>${StPillSm(c.iso)}</div>`)}</div>` : q.trim() && !l.sel ? html`<div class="lsub" style="margin:8px 18px 0">No country matches “${q}”.</div>` : null}
      <div class="lc" style="padding:8px;margin-top:10px">${WorldMap('odyssey', { live: true, h: 200, sel: l.sel, onPick: iso => pick(iso) })}<div style="padding:0 4px">${Legend(s)}</div></div>
      ${l.sel && P.BY[l.sel] ? PickCard(l, l.sel) : null}
      ${fx.returned || fx.longest || fx.newest ? html`<div class="pfacts" data-t="oFacts">
        <div><span>Most returned</span><b>${fx.returned ? html`${P.BY[fx.returned.iso].name} ×${fx.returned.n}` : '—'}</b></div>
        <div><span>Longest journey</span><b>${fx.longest ? html`${fx.longest.TrName} · ${P.daysOf(fx.longest)}d` : '—'}</b></div>
        <div><span>Newest stamp</span><b>${fx.newest ? html`${P.BY[fx.newest.iso].name} · ${P.fmtMon(fx.newest.at)}` : '—'}</b></div></div>` : null}
      ${ts.length ? html`${Sect('Journeys', 'All', () => go('scrPpJourneys'), 'ovAllTrips')}
        <div class="lc">${ts.slice(0, 3).map(t => html`<div class="phl" onClick=${() => openTrip(t.TrId)} data-t=${'ovTrip-' + t.TrId}><div class="im" style=${coverBg(t)}></div><div><div class="t">${t.TrName}</div><div class="s">${tripLine(t)}</div></div><span style="display:flex;gap:3px">${tripFlags(t.TrId, 12).slice(0, 3)}</span></div>`)}</div>` : null}
      ${gw.length ? html`${Sect('Wanderlist', 'Going', () => go('scrPpWishlist'), 'ovWish')}
        <div class="lc" data-t="ovGoing">${gw.map(p => html`<div class="pgo" onClick=${() => openCountry(l, p.PlIso)} data-t=${'ovGo-' + p.PlIso}>${Flag(p.PlIso, 20)}<div><div class="t">${P.BY[p.PlIso].name}</div><div class="s">${p.PlGoYear} · ${plural(p.PlGoDays, 'day')}</div></div><span class="pgoing">GOING</span></div>`)}</div>` : null}
      ${fv.length ? html`${Sect('Borderless', plural(fv.length, 'stamp'))}
        <div class="lc" data-t="oStamps"><div class="pstamps">${shownSt.map(x => Stamp(l, x))}${fv.length < 8 ? html`<div class="pstp lock" style="--r:0deg"><div><b>+</b><span>NEXT ONE</span></div></div>` : null}</div>
          ${fv.length > 8 ? html`<div class="lsub" style="text-align:center;margin-top:10px"><span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => { l.allSt = !l.allSt; rerender(); }} data-t="oAllSt">${l.allSt ? 'Show fewer' : '+' + (fv.length - 8) + ' more · show all'}</span></div>` : null}</div>` : null}
      ${Sect('Milestones', ms.filter(m => m.done).length + ' of ' + ms.length)}
      <div class="lc" data-t="oMs">${ms.map((m, i) => html`<div class="lr" style=${i ? '' : 'border-top:0;padding-top:2px'} data-t=${'ms-' + m.id}>
          <div class="lib" style=${m.done ? `background:${K.or};color:${K.onAcc}` : `background:${K.field};color:${K.mute};box-shadow:inset 0 0 0 1.5px ${K.line2}`}><b style="font-size:11.5px">${m.need}</b></div>
          <div><div class="t" style="font:400 16px Georgia,serif">${m.name}</div><div class="s">${m.desc}${m.done && m.by ? ' · reached in ' + m.by.name : ''}${!m.done && m.next ? ' · next: ' + m.next : !m.done ? ' · ' + (m.need - m.have) + ' to go' : ''}</div>
            ${m.done ? null : html`<div class="lbar" style="margin-top:7px"><i style=${`width:${m.have / m.need * 100}%;background:${K.or}`}></i></div>`}</div>
          <div class="r" style=${m.done ? `color:${K.grn}` : ''}>${m.done ? '✓' : m.have + '/' + m.need}</div></div>`)}</div>
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
    return Page(l, 1, html`
      ${Sect('Journeys', '+ New journey', () => openTripEdit(l, null), 'jNew')}
      ${all.length ? html`<div class="pchips">${sel(l.yr, v => { l.yr = v; }, yrs.map(y => [y, String(y)]), 'All years ▾', 'jYear')}${sel(l.ctry, v => { l.ctry = v; }, ctry.map(i => [i, P.BY[i].name]), 'Country ▾', 'jCtry')}${sel(l.with, v => { l.with = v; }, P.WITH.map(w => [w, w]), 'Who with ▾', 'jWith')}</div>` : null}
      ${!all.length ? html`<div class="lc lempty" data-t="jEmpty">No journeys yet. Add the first one: name, countries, dates and who you went with. Photos come after.<div style="margin-top:12px"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)}>+ Add a journey</button></div></div>`
        : !list.length ? html`<div class="lc lempty">No journeys match these filters.</div>`
        : byYear.map(g => { const cs = new Set(g.ts.flatMap(t => P.isosOf(t.TrId))); return html`<div class="pyr" data-t=${'jYr-' + g.y}><b>${g.y}</b><span>${plural(g.ts.length, 'JOURNEY')} · ${g.ts.reduce((s, t) => s + P.daysOf(t), 0)} DAYS · ${plural(cs.size, 'COUNTRY')}</span></div>
          ${g.ts.map(t => html`<div class="ptrip" onClick=${() => openTrip(t.TrId)} data-t=${'jTrip-' + t.TrId}><div class="ph" style=${coverHd(t)}><span class="fl">${tripFlags(t.TrId, 15)}</span></div>
            <div class="tx"><b>${t.TrName}</b><div class="s">${tripLine(t)}${P.isosOf(t.TrId).length > 1 ? ' · ' + countries(P.isosOf(t.TrId).length) : ''}${P.photosOf(t.TrId).length ? ' · ' + plural(P.photosOf(t.TrId).length, 'photo') : ''}</div></div></div>`)}`; })}
    `, 'ppJourneys');
  }
};

/* ───────── one journey ───────── */
export const scrPpTrip = {
  view(l) {
    const t = P.trip(G.ppTrip);
    if (!t) return Page(l, 1, html`<div class="lc lempty">This journey was deleted.<div style="margin-top:10px"><button class="lbtn" onClick=${() => go('scrPpJourneys')}>Back to Journeys</button></div></div>`, 'ppTrip');
    if (l.tid !== t.TrId) { l.tid = t.TrId; l.allPh = false; }
    const route = P.routeOf(t), photos = P.photosOf(t.TrId), d = P.daysOf(t);
    const isNew = iso => { const ts = P.tripsIn(iso); const pl = P.place(iso); return ts.length && ts[ts.length - 1].TrId === t.TrId && !(pl && pl.PlStatus === 'been' && pl.PlFirst && pl.PlFirst < t.TrStart); };
    const nNew = route.filter(r => isNew(r.iso)).length;
    const moments = String(t.TrMoments || '').split('\n').map(s => s.trim()).filter(Boolean);
    const folder = P.yearOf(t.TrStart) + ' · ' + t.TrName;
    const add = async e => {
      const files = [...(e.target.files || [])]; e.target.value = ''; if (!files.length || !canWrite()) return;
      await PH.upload(files, { trip: t.TrId, folder, seq: photos.reduce((m, p) => Math.max(m, p.PhSeq || 0), 0), onStep: (i, n) => { l.up = i ? 'Saving photo ' + i + ' of ' + n + ' to your Drive…' : ''; rerender(); } });
    };
    const addCover = async e => {
      const files = [...(e.target.files || [])].slice(0, 1); e.target.value = ''; if (!files.length || !canWrite()) return;
      const rows = await PH.upload(files, { trip: t.TrId, folder, seq: 0, onStep: (i) => { l.up = i ? 'Saving your cover photo to Drive…' : ''; rerender(); } });
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
      ${Sect('Memories', photos.length > 9 ? (l.allPh ? 'Show 9' : 'See all ' + photos.length) : plural(photos.length, 'photo'), photos.length > 9 ? () => { l.allPh = !l.allPh; rerender(); } : null, 'tSeeAll')}
      ${l.up ? html`<div class="pprog" data-t="tUp">${l.up}</div>` : null}
      <div class="pgal" data-t="tGal">${shown.map((p, i) => { const last = !l.allPh && i === 8 && more > 0; return html`<div class=${(cv === p.PhId ? 'cv' : '') + (last ? ' more' : '')} data-m=${'+' + more} style=${PH.bg(p.PhId, p.PhId)} onClick=${() => { if (last) { l.allPh = true; rerender(); } else openPhoto(l, p); }} data-t=${'ph-' + p.PhId}></div>`; })}
        ${photos.length < 9 || l.allPh ? html`<label class="add" data-t="tAddPh">${DB.ppOk ? html`<span>+ Add<br/>photos</span><input class="pfile" type="file" accept="image/*" multiple onChange=${add} data-t="tFile" />` : html`<span style="font-size:10.5px">Update the Apps Script to add photos</span>`}</label>` : null}</div>
      ${photos.length >= 9 && !l.allPh && DB.ppOk ? html`<div style="margin:-4px 12px 12px"><label class="lbtn" style="width:100%;padding:10px" data-t="tAddPh2">+ Add photos<input class="pfile" type="file" accept="image/*" multiple onChange=${add} data-t="tFile2" /></label></div>` : null}
      ${moments.length ? html`${Sect('Moments', plural(moments.length, 'highlight'))}<div class="pmoms" data-t="tMoments">${moments.map((m, i) => html`<div class=${'pmo' + (i ? '' : ' big')} data-n=${String(i + 1).padStart(2, '0')}><span>${i ? 'MOMENT' : 'THE HIGHLIGHT'}</span><b>${m}</b></div>`)}</div>` : null}
      ${t.TrNotes ? html`<div class="lc">${Cap('My notes')}<div class="lnote" style="margin-top:6px;white-space:pre-wrap;font-size:12.5px">${t.TrNotes}</div></div>` : null}
      <div style="display:flex;gap:8px;margin:6px 12px 18px"><button class="lbtn" style="flex:1;padding:12px" onClick=${() => openTripEdit(l, t)} data-t="tEdit2">Edit journey</button><button class="lbtnd" style="flex:1" onClick=${() => deleteTrip(l, t)} data-t="tDelete">Delete journey</button></div>
    `, 'ppTrip');
  }
};

/* ───────── Wanderlist ───────── */
function wishActions(l, p) {
  const c = P.BY[p.PlIso], gg = P.isGoing(p);
  openSheet(l, { title: c.name, body: () => html`<div data-t="wishActions" style="display:flex;flex-direction:column;gap:9px;padding-bottom:6px">
    ${gg ? html`<button class="lbtnf" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: [p.PlIso] }); }} data-t="waTrip">✓ I'm back: add the journey</button>
      <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openGoing(l, p.PlIso); }} data-t="waGoing">Change year or days</button>`
      : html`<button class="lbtnf" onClick=${() => { closeSheet(l); openGoing(l, p.PlIso); }} data-t="waGoing">Confirm I'm going</button>
      <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: [p.PlIso] }); }} data-t="waTrip">I went: add the journey</button>`}
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openWish(l, p.PlIso); }} data-t="waEdit">Edit priority, tier, places</button>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); psave({ up: { PP_Places: [{ ...p, PlStatus: 'been', PlGo: '' }] } }, 'Visited before', c.name); }} data-t="waBeen">Visited before, no journey to write up</button>
    <button class="lbtnd" onClick=${() => { closeSheet(l); confirmAsk(l, 'Remove ' + c.name + ' from your Wanderlist?', 'Its tier, places and notes are removed too.', 'Remove', () => psave({ up: { PP_Places: [{ ...p, PlStatus: '', PlWhy: '', PlSee: '', PlNote: '', PlYear: 0, PlTier: '', PlGo: '', PlGoYear: 0, PlGoDays: 0 }] } }, 'Wanderlist removed', c.name)); }} data-t="waRemove">Remove from Wanderlist</button>
  </div>` });
}
function move(list, i, d) {
  const j = i + d; if (j < 0 || j >= list.length) return;
  const rows = list.map((p, k) => ({ ...p, PlSeq: k + 1 }));
  [rows[i].PlSeq, rows[j].PlSeq] = [rows[j].PlSeq, rows[i].PlSeq];
  psave({ up: { PP_Places: rows } }, 'Wanderlist order', P.BY[list[i].PlIso].name);
}
const WRow = (l, p, extra) => { const c = P.BY[p.PlIso]; return html`<div class="pwl" data-t=${'wl-' + p.PlIso}>
  <div onClick=${() => wishActions(l, p)} style="cursor:pointer">${Flag(p.PlIso, 25)}</div>
  <div onClick=${() => wishActions(l, p)} style="cursor:pointer;min-width:0"><div class="t">${c.name}${P.isGoing(p) ? null : html` <span class=${'ppri ' + (p.PlPri || 'M')}>${(PRI[p.PlPri] || 'Medium').toUpperCase()}</span>`}</div>
    <div class="s">${P.isGoing(p) ? p.PlGoYear + ' · ' + plural(p.PlGoDays, 'day') : c.cont}${P.isTier(p.PlTier) ? ' · ' + P.tierText(p.PlTier) : ''}</div>
    ${p.PlSee ? html`<div class="ptags">${String(p.PlSee).split('|').filter(Boolean).map(s => html`<i>${s}</i>`)}</div>` : null}</div>
  <div style="display:flex;gap:8px;align-items:flex-start">${TierBadge(p.PlTier)}${extra || null}</div></div>`; };
export const scrPpWishlist = {
  view(l) {
    const all = P.wishlist(), gw = P.going(), sort = l.sort || 'order', PR = { H: 0, M: 1, L: 2 };
    const base = P.dreaming();
    const list = sort === 'order' ? base : base.slice().sort(sort === 'pri' ? (a, b) => (PR[a.PlPri] ?? 1) - (PR[b.PlPri] ?? 1) || a.PlSeq - b.PlSeq
      : sort === 'tier' ? (a, b) => P.tierRank(a.PlTier) - P.tierRank(b.PlTier) || a.PlSeq - b.PlSeq : (a, b) => P.BY[a.PlIso].cont.localeCompare(P.BY[b.PlIso].cont) || a.PlSeq - b.PlSeq);
    const addNew = () => openPick(l, { title: 'Add to Wanderlist', filter: c => !P.isVisited(c.iso) && P.status(c.iso) !== 'wish' && c.iso !== P.homeIso(), onPick: iso => { closeSheet(l); openWish(l, iso); } });
    const tally = P.TIER_LETTERS.map(x => [x, all.filter(p => P.isTier(p.PlTier) && p.PlTier[0] === x).length]), noTier = all.filter(p => !P.isTier(p.PlTier)).length;
    return Page(l, 2, html`
      ${Sect('Wanderlist', '+ Add', addNew, 'wlAdd')}
      ${all.length ? html`<div class="lc" data-t="wlTally"><span class="lcap">${plural(all.length, 'destination')} · ${gw.length} confirmed</span>
        <div class="ptiers">${tally.filter(([, n]) => n).map(([x, n]) => html`<i style=${`width:${n / all.length * 100}%;background:${P.TIER_COLOR[x]}`}></i>`)}${noTier ? html`<i style=${`width:${noTier / all.length * 100}%;background:${K.line2}`}></i>` : null}</div>
        <div class="ptl">${tally.map(([x, n]) => html`<span style=${`--c:${P.TIER_COLOR[x]}`}>${x} ${n}</span>`)}${noTier ? html`<span style=${`--c:${K.line2}`}>No tier ${noTier}</span>` : null}</div></div>` : null}
      ${!all.length ? html`<div class="lc lempty" data-t="wlEmpty">Places you dream of go here, with a tier for budget and length. Confirm when you're going and they show on Odyssey.<div style="margin-top:12px"><button class="lbtn o on" onClick=${addNew}>+ Add a destination</button></div></div>` : null}
      ${gw.length ? html`${Sect('Going', String(gw.length))}<div class="lc" data-t="wlGoing">${gw.map(p => WRow(l, p))}</div>` : null}
      ${base.length ? html`${Sect('Dreaming', String(base.length))}
        <div class="pchips">${[['order', 'My order'], ['pri', 'Priority'], ['tier', 'Tier'], ['cont', 'Continent']].map(([k, t]) => html`<span class=${'pchip' + (sort === k ? ' on' : '')} onClick=${() => { l.sort = k; rerender(); }} data-t=${'wlSort-' + k}>${t}</span>`)}</div>
        <div class="lc" data-t="wlList">${list.map((p, i) => WRow(l, p, sort === 'order' ? html`<div class="pord"><span onClick=${() => move(list, i, -1)} data-t=${'wlUp-' + p.PlIso} style=${i ? '' : 'opacity:.3'}>▲</span><span onClick=${() => move(list, i, 1)} data-t=${'wlDn-' + p.PlIso} style=${i < list.length - 1 ? '' : 'opacity:.3'}>▼</span></div>` : null))}</div>
        <div class="lnote" style="margin:0 18px">Tap a destination to confirm you're going, edit it or remove it.${sort === 'order' ? ' ▲ ▼ set your order.' : ''}</div>` : null}
    `, 'ppWishlist');
  }
};
