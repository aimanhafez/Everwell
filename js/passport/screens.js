// MansWell Passport · the screens: Overview, World, Journeys (+ one trip), Wishlist, Memories.
import { html, K, DB, G, rerender, Today, Notify } from '../core.js';
import { Page, Sect, Cap, Flag, StPill, WorldMap, Legend, focusMap, openCountry, openWish, openTrip, openTripEdit, deleteTrip, openPick, openPhoto,
  confirmAsk, psave, canWrite, plural, tripLine, go, openSheet, closeSheet, WISHC, P, PH } from './ui.js';

const MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const tripFlags = (id, h = 14) => P.isosOf(id).map(iso => Flag(iso, h));
const coverBg = t => { const c = P.coverOf(t); return PH.bg(c && c.PhId, t.TrId); };

/* ───────── Overview ───────── */
export const scrPpOverview = {
  view(l) {
    const s = P.stats(), ts = P.trips(), wl = P.wishlist(), ms = P.milestones();
    const empty = !ts.length && !DB.ppPlaces.length;
    const recent = []; for (const t of ts) for (const iso of P.isosOf(t.TrId)) if (!recent.includes(iso) && iso !== P.homeIso()) recent.push(iso);
    const newly = wl.slice().sort((a, b) => (b.PlAdded || '').localeCompare(a.PlAdded || '')).slice(0, 3);
    const vis = P.firstVisits().slice().reverse();
    return Page(l, 0, html`
      <div class="ppass" data-t="ppHero">
        <span class="lcap">Your world${s.since ? ' · since ' + P.yearOf(s.since) : ''}</span>
        <div class="big" data-t="ppCount">${plural(s.n, 'country').replace('countrys', 'countries')}</div>
        <div class="sub"><b data-t="ppPct">${s.pct.toFixed(1)}%</b> of ${P.WORLD_N} countries · <b data-t="ppConts">${s.conts} of 7</b> continents${s.extra ? html` · +${plural(s.extra, 'place')}` : null}</div>
        <div class="bar"><i style=${`width:${Math.max(s.n ? 1.5 : 0, s.pct)}%`}></i></div>
        <div class="g3"><div><span class="lcap">Trips</span><b data-t="ppTrips">${s.trips}</b></div><div><span class="lcap">Wishlist</span><b data-t="ppWish">${s.wish}</b></div><div><span class="lcap">Days away</span><b data-t="ppDays">${s.days}</b></div></div>
      </div>
      ${empty ? html`<div class="lc" data-t="ppWelcome"><b style=${`font-size:16px;color:${K.text}`}>Start your passport</b>
        <div class="lnote" style="margin-top:6px">Write up a trip you've taken, mark the countries you've been to before, or start a wishlist. Everything here is about travel only.</div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)} data-t="ppFirstTrip">+ Add a trip</button><button class="lbtn" onClick=${() => go('scrPpWorld')}>Mark countries</button><button class="lbtn" onClick=${() => go('scrPpWishlist')}>Wishlist</button></div></div>` : null}
      <div class="lc" style="padding:10px">${WorldMap('ov', { h: 150, onTap: () => go('scrPpWorld') })}${Legend(s)}</div>
      ${ts.length ? html`${Sect('Latest trips', 'All', () => go('scrPpJourneys'), 'ovAllTrips')}
        <div class="lc">${ts.slice(0, 3).map(t => html`<div class="phl" onClick=${() => openTrip(t.TrId)} data-t=${'ovTrip-' + t.TrId}><div class="im" style=${coverBg(t)}></div><div><div class="t">${t.TrName}</div><div class="s">${tripLine(t)}</div></div><span style="display:flex;gap:3px">${tripFlags(t.TrId, 12).slice(0, 3)}</span></div>`)}</div>` : null}
      ${recent.length ? html`${Sect('Recently visited')}<div class="lc"><div class="pfr">${recent.slice(0, 8).map(iso => html`<span class="pfc" onClick=${() => openCountry(l, iso)}>${Flag(iso, 15)}${P.BY[iso].name}</span>`)}</div></div>` : null}
      ${wl.length ? html`${Sect('Dream destinations', 'Wishlist', () => go('scrPpWishlist'), 'ovWish')}
        <div class="lc"><span class="pk" style=${`color:${WISHC()}`}>NEXT DREAMS</span>
          <div style="margin-top:8px">${wl.slice(0, 3).map(p => html`<div class="phl" onClick=${() => openCountry(l, p.PlIso)}><div class="im" style=${PH.bg(p.PlPhoto, p.PlIso)}></div><div><div class="t">${P.BY[p.PlIso].name} ${Flag(p.PlIso, 12)}</div><div class="s">${{ H: 'High', M: 'Medium', L: 'Low' }[p.PlPri] || 'Medium'}${p.PlYear ? ' · ' + p.PlYear : ''}${p.PlWhy ? ' · ' + p.PlWhy : ''}</div></div><span></span></div>`)}</div>
          ${newly.length ? html`<div class="lhr"></div><span class="pk" style=${`color:${K.sub}`}>NEWLY WISHED</span><div class="pfr" style="margin-top:8px">${newly.map(p => html`<span class="pfc" onClick=${() => openCountry(l, p.PlIso)}>${Flag(p.PlIso, 15)}${P.BY[p.PlIso].name}<span style=${`color:${K.mute};font-weight:500`}>${p.PlAdded ? P.fmtDay(p.PlAdded).replace(/ \d{4}$/, '') : ''}</span></span>`)}</div>` : null}</div>` : null}
      ${vis.length ? html`${Sect('Your collection', 'See all', () => { G.ppWorldSt = 'visited'; go('scrPpWorld'); }, 'ovColl')}
        <div class="lc"><span class="pk" style=${`color:${K.or}`}>VISITED · ${vis.length}</span><div class="pfr" style="margin-top:8px">${vis.map(x => html`<span onClick=${() => openCountry(l, x.c.iso)} style="cursor:pointer" title=${x.c.name}>${Flag(x.c.iso, 22)}</span>`)}</div>
          ${wl.length ? html`<div class="lhr"></div><span class="pk" style=${`color:${WISHC()}`}>WISHLIST · ${wl.length}</span><div class="pfr" style="margin-top:8px">${wl.map(p => html`<span onClick=${() => openCountry(l, p.PlIso)} style="cursor:pointer;opacity:.85">${Flag(p.PlIso, 22)}</span>`)}</div>` : null}</div>` : null}
      ${Sect('Milestones', s.n + ' / 25', () => go('scrPpMemories'), 'ovMs')}
      <div class="lc" onClick=${() => go('scrPpMemories')} style="cursor:pointer"><div class="pbad">${ms.map(m => html`<div class=${m.done ? '' : 'off'} data-t=${'ms-' + m.id}><i>${m.need}</i><b>${{ first: 'First', explorer: 'Explorer', wanderer: 'Wanderer', global: 'Global', continental: 'Continents' }[m.id]}</b>${m.done ? 'done' : m.have + ' of ' + m.need}</div>`)}</div></div>
    `, 'ppOverview');
  }
};

/* ───────── World ───────── */
export const scrPpWorld = {
  onVisible(l) { if (G.ppWorldSt !== undefined) { l.st = G.ppWorldSt; G.ppWorldSt = undefined; } },
  view(l) {
    const s = P.stats(), q = l.q || '', st = l.st || '', cont = l.cont || '', grid = l.view === 'grid';
    const list = P.search(q, { cont, st: st === 'none' ? '' : st }).filter(c => st !== 'none' || (P.status(c.iso) === 'none'));
    const pick = iso => { l.sel = iso; focusMap('world', iso); openCountry(l, iso); };
    const n = k => P.COUNTRIES.filter(c => P.status(c.iso) === k).length;
    return Page(l, 1, html`
      ${Sect('My world', grid ? '☰ List' : '▦ Grid', () => { l.view = grid ? 'list' : 'grid'; rerender(); }, 'wView')}
      <div class="lc" style="padding:8px">${WorldMap('world', { live: true, h: 210, sel: l.sel, onPick: pick })}<div style="padding:0 4px">${Legend(s, html`<span style=${`margin-left:auto;color:${K.mute}`}>pinch or + to zoom</span>`)}</div></div>
      <div class="psrch"><span style=${`color:${K.mute}`}>⌕</span><input placeholder=${'Search ' + P.COUNTRIES.length + ' countries and places'} value=${q} onInput=${e => { l.q = e.target.value; rerender(); }} data-t="wQ" />${q ? html`<span style=${`color:${K.sub};cursor:pointer`} onClick=${() => { l.q = ''; rerender(); }}>✕</span>` : null}</div>
      <div class="pchips">${[['', 'All'], ['visited', 'Visited ' + n('visited')], ['wish', 'Wishlist ' + n('wish')], ['none', 'Not yet']].map(([k, t]) => html`<span class=${'pchip' + (st === k ? ' on' : '')} onClick=${() => { l.st = k; rerender(); }} data-t=${'wSt-' + (k || 'all')}>${t}</span>`)}
        <select class=${'pchip' + (cont ? ' on' : '')} style="border:0;font-family:inherit;-webkit-appearance:none;appearance:none" value=${cont} onChange=${e => { l.cont = e.target.value; rerender(); }} data-t="wCont"><option value="">Continent ▾</option>${P.CONTINENTS.map(c => html`<option value=${c} selected=${c === cont}>${c}</option>`)}</select></div>
      <div class="lsub" style="margin:0 18px 8px" data-t="wCount">${plural(list.length, 'country').replace('countrys', 'countries')}${q || st || cont ? '' : ' · tap one to open it'}</div>
      ${!list.length ? html`<div class="lc lempty">Nothing matches. Try another name or filter.</div>` : grid
        ? html`<div class="lc"><div class="pgrid">${list.map(c => { const k = c.iso === P.homeIso() ? 'home' : P.status(c.iso); return html`<div class="pgc" onClick=${() => pick(c.iso)} data-t=${'wc-' + c.iso}>${Flag(c.iso, 30)}<div class="n">${c.name}</div><div class="s">${c.cont}</div>${k !== 'none' ? html`<span class="dot" style=${`background:${k === 'visited' ? K.or : k === 'wish' ? WISHC() : K.sub}`}></span>` : null}</div>`; })}</div></div>`
        : html`<div class="lc">${list.map(c => html`<div class="pcr" onClick=${() => pick(c.iso)} data-t=${'wc-' + c.iso}>${Flag(c.iso, 21)}<div><div class="t">${c.name}</div><div class="s">${[c.cap, c.cont, c.cur].filter(Boolean).join(' · ')}</div></div>${StPill(c.iso)}</div>`)}</div>`}
    `, 'ppWorld');
  }
};

/* ───────── Journeys ───────── */
export const scrPpJourneys = {
  view(l) {
    const all = P.trips(), yrs = [...new Set(all.map(t => P.yearOf(t.TrStart)))];
    const ctry = [...new Set(all.flatMap(t => P.isosOf(t.TrId)))].sort((a, b) => P.BY[a].name.localeCompare(P.BY[b].name));
    const list = all.filter(t => (!l.yr || P.yearOf(t.TrStart) === Number(l.yr)) && (!l.ctry || P.isosOf(t.TrId).includes(l.ctry)) && (!l.with || t.TrWith === l.with));
    const byYear = []; for (const t of list) { const y = P.yearOf(t.TrStart); let g = byYear.find(x => x.y === y); if (!g) byYear.push(g = { y, ts: [] }); g.ts.push(t); }
    const sel = (v, set, opts, all0, id) => html`<select class=${'pchip' + (v ? ' on' : '')} style="border:0;font-family:inherit;-webkit-appearance:none;appearance:none" onChange=${e => { set(e.target.value); rerender(); }} data-t=${id}><option value="">${all0}</option>${opts.map(([k, t]) => html`<option value=${k} selected=${String(k) === String(v)}>${t}</option>`)}</select>`;
    return Page(l, 2, html`
      ${Sect('Journeys', '+ New trip', () => openTripEdit(l, null), 'jNew')}
      ${all.length ? html`<div class="pchips">${sel(l.yr, v => { l.yr = v; }, yrs.map(y => [y, String(y)]), 'All years ▾', 'jYear')}${sel(l.ctry, v => { l.ctry = v; }, ctry.map(i => [i, P.BY[i].name]), 'Country ▾', 'jCtry')}${sel(l.with, v => { l.with = v; }, P.WITH.map(w => [w, w]), 'Who with ▾', 'jWith')}</div>` : null}
      ${!all.length ? html`<div class="lc lempty" data-t="jEmpty">No trips yet. Add the first one: name, countries, dates and who you went with. Photos come after.<div style="margin-top:12px"><button class="lbtn o on" onClick=${() => openTripEdit(l, null)}>+ Add a trip</button></div></div>`
        : !list.length ? html`<div class="lc lempty">No trips match these filters.</div>`
        : byYear.map(g => { const cs = new Set(g.ts.flatMap(t => P.isosOf(t.TrId))); return html`<div class="pyr" data-t=${'jYr-' + g.y}><b>${g.y}</b><span>${plural(g.ts.length, 'TRIP').toUpperCase()} · ${g.ts.reduce((s, t) => s + P.daysOf(t), 0)} DAYS · ${plural(cs.size, 'COUNTRY').replace('COUNTRYS', 'COUNTRIES')}</span></div>
          ${g.ts.map(t => html`<div class="ptrip" onClick=${() => openTrip(t.TrId)} data-t=${'jTrip-' + t.TrId}><div class="ph" style=${coverBg(t)}><span class="fl">${tripFlags(t.TrId, 15)}</span></div>
            <div class="tx"><b>${t.TrName}</b><div class="s">${tripLine(t)}${P.isosOf(t.TrId).length > 1 ? ' · ' + plural(P.isosOf(t.TrId).length, 'country').replace('countrys', 'countries') : ''}${P.photosOf(t.TrId).length ? ' · ' + plural(P.photosOf(t.TrId).length, 'photo') : ''}</div></div></div>`)}`; })}
    `, 'ppJourneys');
  }
};

/* ───────── one trip ───────── */
export const scrPpTrip = {
  view(l) {
    const t = P.trip(G.ppTrip);
    if (!t) return Page(l, 2, html`<div class="lc lempty">This trip was deleted.<div style="margin-top:10px"><button class="lbtn" onClick=${() => go('scrPpJourneys')}>Back to Journeys</button></div></div>`, 'ppTrip');
    const stops = P.stopsOf(t.TrId), photos = P.photosOf(t.TrId), d = P.daysOf(t);
    const isNew = iso => { const ts = P.tripsIn(iso); const pl = P.place(iso); return ts.length && ts[ts.length - 1].TrId === t.TrId && !(pl && pl.PlStatus === 'been' && pl.PlFirst && pl.PlFirst < t.TrStart); };
    const nNew = stops.filter(s => isNew(s.StIso)).length;
    const moments = String(t.TrMoments || '').split('\n').map(s => s.trim()).filter(Boolean);
    const add = async e => {
      const files = [...(e.target.files || [])]; e.target.value = ''; if (!files.length || !canWrite()) return;
      await PH.upload(files, { trip: t.TrId, folder: P.yearOf(t.TrStart) + ' · ' + t.TrName, seq: photos.reduce((m, p) => Math.max(m, p.PhSeq || 0), 0), onStep: (i, n) => { l.up = i ? 'Saving photo ' + i + ' of ' + n + ' to your Drive…' : ''; rerender(); } });
    };
    return Page(l, 2, html`
      <div class="pcover" style=${coverBg(t)} data-t="tCover">
        <div class="abs" style="left:16px;top:14px;z-index:2;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer" onClick=${() => go('scrPpJourneys')} data-t="tBack">‹ Journeys</div>
        <div class="abs" style="right:16px;top:14px;z-index:2;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer" onClick=${() => openTripEdit(l, t)} data-t="tEdit">Edit</div>
        <div class="ov"><b data-t="tTitle">${t.TrName}</b><span>${P.range(t.TrStart, t.TrEnd)}${t.TrRoute ? ' · ' + t.TrRoute : ''}</span></div></div>
      <div class="pmeta"><div>${Cap('Days')}<b data-t="tDays">${d}</b></div><div>${Cap('With')}<b>${t.TrWith || '—'}</b></div><div>${Cap('Countries')}<b data-t="tN">${stops.length}${nNew ? html` <span style=${`font-size:11px;color:${K.or}`}>· ${nNew} new</span>` : null}</b></div></div>
      <div class="pfr" style="margin:0 12px 12px">${stops.map(s => html`<span class="pfc" onClick=${() => openCountry(l, s.StIso)} data-t=${'tStop-' + s.StIso}>${Flag(s.StIso, 15)}${P.BY[s.StIso].name}${s.StDays ? html`<span style=${`color:${K.sub};font-weight:500`}>· ${s.StDays}d</span>` : null}${isNew(s.StIso) ? html`<span style=${`color:${K.or};font-size:9px;font-weight:700;letter-spacing:.5px`}>NEW</span>` : null}</span>`)}</div>
      ${t.TrDesc ? html`<div class="lc">${Cap('The story')}<div style=${`font-size:14px;line-height:1.55;margin-top:7px;color:${K.text};white-space:pre-wrap`}>${t.TrDesc}</div></div>` : null}
      ${Sect('Gallery', plural(photos.length, 'photo'))}
      ${l.up ? html`<div class="pprog" data-t="tUp">${l.up}</div>` : null}
      <div class="pgal" data-t="tGal">${photos.map(p => html`<div class=${t.TrCover === p.PhId ? 'cv' : ''} style=${PH.bg(p.PhId, p.PhId)} onClick=${() => openPhoto(l, p)} data-t=${'ph-' + p.PhId}></div>`)}
        <label class="add" data-t="tAddPh">${DB.ppOk ? html`<span>+ Add<br/>photos</span><input class="pfile" type="file" accept="image/*" multiple onChange=${add} data-t="tFile" />` : html`<span style="font-size:10.5px">Update the Apps Script to add photos</span>`}</label></div>
      ${moments.length ? html`${Sect('Moments')}<div class="lc"><ul class="pmom">${moments.map(m => html`<li>${m}</li>`)}</ul></div>` : null}
      ${t.TrNotes ? html`<div class="lc">${Cap('My notes')}<div class="lnote" style="margin-top:6px;white-space:pre-wrap;font-size:12.5px">${t.TrNotes}</div></div>` : null}
      <div style="display:flex;gap:8px;margin:6px 12px 18px"><button class="lbtn" style="flex:1;padding:12px" onClick=${() => openTripEdit(l, t)} data-t="tEdit2">Edit trip</button><button class="lbtnd" style="flex:1" onClick=${() => deleteTrip(l, t)} data-t="tDelete">Delete trip</button></div>
    `, 'ppTrip');
  }
};

/* ───────── Wishlist ───────── */
function wishActions(l, p) {
  const c = P.BY[p.PlIso];
  openSheet(l, { title: c.name, body: () => html`<div data-t="wishActions" style="display:flex;flex-direction:column;gap:9px;padding-bottom:6px">
    <button class="lbtnf" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: [p.PlIso] }); }} data-t="waTrip">✓ I went: add the trip</button>
    <div class="lnote" style="text-align:center;margin-top:-2px">Saving the trip moves ${c.name} to Visited. Your notes stay on its country page.</div>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); psave({ up: { PP_Places: [{ ...p, PlStatus: 'been' }] } }, 'Visited before', c.name); }} data-t="waBeen">Visited before, no trip to write up</button>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openWish(l, p.PlIso); }} data-t="waEdit">Edit wish</button>
    <button class="lbtn" style="padding:12px" onClick=${() => { closeSheet(l); openCountry(l, p.PlIso); }}>Country details</button>
    <button class="lbtnd" onClick=${() => { closeSheet(l); confirmAsk(l, 'Remove ' + c.name + ' from your wishlist?', 'Your notes for it are removed too.', 'Remove', () => psave({ up: { PP_Places: [{ ...p, PlStatus: '', PlWhy: '', PlSee: '', PlNote: '', PlYear: 0 }] } }, 'Wish removed', c.name)); }} data-t="waRemove">Remove from wishlist</button>
  </div>` });
}
function move(list, i, d) {
  const j = i + d; if (j < 0 || j >= list.length) return;
  const rows = list.map((p, k) => ({ ...p, PlSeq: k + 1 }));
  [rows[i].PlSeq, rows[j].PlSeq] = [rows[j].PlSeq, rows[i].PlSeq];
  psave({ up: { PP_Places: rows } }, 'Wishlist order', P.BY[list[i].PlIso].name);
}
export const scrPpWishlist = {
  view(l) {
    const base = P.wishlist(), sort = l.sort || 'order', PR = { H: 0, M: 1, L: 2 };
    const list = sort === 'order' ? base : base.slice().sort(sort === 'pri' ? (a, b) => (PR[a.PlPri] ?? 1) - (PR[b.PlPri] ?? 1) || a.PlSeq - b.PlSeq
      : sort === 'year' ? (a, b) => (a.PlYear || 9999) - (b.PlYear || 9999) || a.PlSeq - b.PlSeq : (a, b) => P.BY[a.PlIso].cont.localeCompare(P.BY[b.PlIso].cont) || a.PlSeq - b.PlSeq);
    const addNew = () => openPick(l, { title: 'Add a dream destination', filter: c => !P.isVisited(c.iso) && P.status(c.iso) !== 'wish' && c.iso !== P.homeIso(), onPick: iso => { closeSheet(l); openWish(l, iso); } });
    return Page(l, 3, html`
      ${Sect('Wishlist', '+ Add', addNew, 'wlAdd')}
      ${base.length ? html`<div class="pchips">${[['order', 'My order'], ['pri', 'Priority'], ['year', 'Year'], ['cont', 'Continent']].map(([k, t]) => html`<span class=${'pchip' + (sort === k ? ' on' : '')} onClick=${() => { l.sort = k; rerender(); }} data-t=${'wlSort-' + k}>${t}</span>`)}</div>` : null}
      ${!base.length ? html`<div class="lc lempty" data-t="wlEmpty">Your dream destinations go here: why you want to go, what to see, and when.<div style="margin-top:12px"><button class="lbtn o on" onClick=${addNew}>+ Add a destination</button></div></div>`
        : html`<div class="lc" data-t="wlList">${list.map((p, i) => { const c = P.BY[p.PlIso]; return html`<div class="pwl" data-t=${'wl-' + p.PlIso}>
          <div onClick=${() => wishActions(l, p)} style="cursor:pointer">${Flag(p.PlIso, 25)}</div>
          <div onClick=${() => wishActions(l, p)} style="cursor:pointer;min-width:0"><div class="t">${c.name}</div><div class="s">${p.PlWhy || c.cont}</div>
            ${p.PlSee ? html`<div class="ptags">${String(p.PlSee).split('|').filter(Boolean).map(s => html`<i>${s}</i>`)}</div>` : null}</div>
          <div style="display:flex;gap:8px;align-items:flex-start"><div style="text-align:right"><span class=${'ppri ' + (p.PlPri || 'M')}>${{ H: 'HIGH', M: 'MEDIUM', L: 'LOW' }[p.PlPri] || 'MEDIUM'}</span><div class="lsub" style="margin-top:5px">${p.PlYear || '—'}</div></div>
            ${sort === 'order' ? html`<div class="pord"><span onClick=${() => move(list, i, -1)} data-t=${'wlUp-' + p.PlIso} style=${i ? '' : 'opacity:.3'}>▲</span><span onClick=${() => move(list, i, 1)} data-t=${'wlDn-' + p.PlIso} style=${i < list.length - 1 ? '' : 'opacity:.3'}>▼</span></div>` : null}</div>
        </div>`; })}</div>
        <div class="lnote" style="margin:0 18px">Tap a destination to add the trip when you go, edit it or remove it.${sort === 'order' ? ' Use ▲ ▼ to set your order.' : ''}</div>`}
    `, 'ppWishlist');
  }
};

/* ───────── Memories ───────── */
export const scrPpMemories = {
  view(l) {
    const ts = P.trips(), tripOf = Object.fromEntries(ts.map(t => [t.TrId, t]));
    const yrs = [...new Set(ts.map(t => P.yearOf(t.TrStart)))];
    const photos = DB.ppPhotos.filter(p => tripOf[p.PhTrip] && (!l.yr || P.yearOf(tripOf[p.PhTrip].TrStart) === Number(l.yr)))
      .sort((a, b) => (tripOf[b.PhTrip].TrStart || '').localeCompare(tripOf[a.PhTrip].TrStart || '') || (a.PhSeq || 0) - (b.PhSeq || 0));
    const shown = l.allPh ? photos : photos.slice(0, 15);
    const fv = P.firstVisits(), ms = P.milestones();
    return Page(l, 4, html`
      ${Sect('Memories', null)}
      ${yrs.length > 1 ? html`<div class="pchips">${[['', 'All years'], ...yrs.map(y => [String(y), String(y)])].map(([k, t]) => html`<span class=${'pchip' + ((l.yr || '') === k ? ' on' : '')} onClick=${() => { l.yr = k; rerender(); }} data-t=${'mYr-' + (k || 'all')}>${t}</span>`)}</div>` : null}
      ${photos.length ? html`<div class="pwall" data-t="mWall">${shown.map(p => html`<div style=${PH.bg(p.PhId, p.PhId)} onClick=${() => openPhoto(l, p, { onOpenTrip: t => openTrip(t.TrId) })} data-t=${'mPh-' + p.PhId}></div>`)}</div>
        <div class="lsub" style="margin:-4px 18px 6px">${plural(photos.length, 'photo')} from ${plural(new Set(photos.map(p => p.PhTrip)).size, 'trip')} · tap one to open it${photos.length > 15 ? html` · <span class="lor" style="cursor:pointer;font-weight:600" onClick=${() => { l.allPh = !l.allPh; rerender(); }}>${l.allPh ? 'Show fewer' : 'Show all'}</span>` : null}</div>`
        : html`<div class="lc lempty">Photos you add to your trips gather here.</div>`}
      ${Sect('Passport stamps', String(fv.length))}
      <div class="lc" data-t="mStamps">${fv.length ? html`<div class="pstamps">${fv.map(x => { const s = P.stampOf(x.c.iso), at = x.at !== '9999' ? x.at : ''; return html`<div class=${'pstp' + (s.sq ? ' sq' : '')} style=${`--s:${s.color};--r:${s.rot}deg`} onClick=${() => openCountry(l, x.c.iso)} data-t=${'stamp-' + x.c.iso} title=${x.c.name}><div><b>${x.c.iso}</b><span>${at ? MONS[Number(at.slice(5, 7)) - 1] + ' ' + at.slice(0, 4) : 'VISITED'}</span></div></div>`; })}
          <div class="pstp lock" style="--r:0deg"><div><b>+</b><span>NEXT ONE</span></div></div></div>`
        : html`<div class="lempty" style="padding:12px">Every new country gives you a stamp.</div>`}</div>
      ${Sect('Milestones')}
      <div class="lc" data-t="mMs">${ms.map((m, i) => html`<div class="lr" style=${i ? '' : 'border-top:0;padding-top:2px'}>
          <div class="lib" style=${m.done ? '' : `background:${K.field};color:${K.mute}`}><b style="font-size:12px">${m.need}</b></div>
          <div><div class="t" style="font-size:14px">${m.name}</div><div class="s">${m.desc}${m.done && m.by ? ' · reached with ' + m.by.name : ''}${!m.done && m.next ? ' · next: ' + m.next : ''}</div>
            ${m.done ? null : html`<div class="lbar" style="margin-top:7px"><i style=${`width:${m.have / m.need * 100}%;background:linear-gradient(90deg,${K.or},#E2367A)`}></i></div>`}</div>
          <div class="r" style=${m.done ? `color:${K.grn}` : ''}>${m.done ? 'Done' : m.have + '/' + m.need}</div></div>`)}</div>
    `, 'ppMemories');
  }
};
