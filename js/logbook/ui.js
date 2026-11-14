// MansWell Voyage (was Logbook) · UI kit: the shell (header, four tabs), the journey switcher, and the sheets the tabs share
// (a stop, the pin check + making the track, an expense, the journey rate, the budget) and the full route map.
import { html, K, DB, NAV, I, Brand, Navigate, rerender, save, Notify, guard, G, store, api, applySaved } from '../core.js';
import { syncNow, PasswordDialog } from '../shared.js';
import { css as atlasCss, Seg, Flag, plural } from '../passport/ui.js';
import { Sheet, openSheet, closeSheet, oa, ta, newId } from '../lens/ui.js';
import * as L from './engine.js';
import { RouteMap, fit } from './map.js';

export { openSheet, closeSheet, oa, ta, newId, Seg, Flag, plural, L };
const P = L.P;

/* ───────── styles ───────── */
export const css = () => atlasCss() + `
.lbsw{display:flex;align-items:center;gap:10px;margin:2px 12px 10px;padding:10px 12px;border-radius:14px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};cursor:pointer}
.lbsw b{display:block;font-size:12px;font-weight:800;letter-spacing:1.2px;color:${K.text};text-transform:uppercase}.lbsw span{display:block;font-size:11px;color:${K.sub};margin-top:2px}.lbsw em{margin-left:auto;font-style:normal;color:${K.or};font-size:13px}
.lbj{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid ${K.sep};cursor:pointer}.lbj:first-child{border-top:0;padding-top:2px}.lbj:last-child{padding-bottom:2px}
.lbj .t{font-size:14.5px;font-weight:600;color:${K.text}}.lbj .s{font-size:11.5px;color:${K.sub};margin-top:2px}.lbj .r{text-align:right}.lbj .r b{display:block;font-size:13.5px;color:${K.text}}.lbj .r span{font-size:11px;color:${K.sub}}
.lbtag{display:inline-block;font-size:8.5px;font-weight:700;letter-spacing:.6px;padding:3px 6px;border-radius:5px;margin:5px 4px 0 0;color:${K.mute};box-shadow:inset 0 0 0 1px ${K.line2}}.lbtag.on{color:${K.or};background:${oa(.12)};box-shadow:none}
.lbday{display:flex;gap:6px;margin:0 12px 10px;overflow-x:auto;scrollbar-width:none}.lbday::-webkit-scrollbar{display:none}
.lbday span{flex:none;position:relative;font-size:12px;font-weight:600;color:${K.sub};padding:8px 12px;border-radius:11px;box-shadow:inset 0 0 0 1px ${K.line2};cursor:pointer}.lbday span.on{background:${K.or};color:${K.onAcc};box-shadow:none}
.lbday span i{position:absolute;right:5px;top:5px;width:5px;height:5px;border-radius:50%;background:${K.or}}.lbday span.on i{background:${K.onAcc}}
.lbst{display:grid;grid-template-columns:28px 1fr auto;gap:11px;align-items:center;padding:4px 0;cursor:pointer}
.lbst .b{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;color:${K.or};background:${oa(.13)};box-shadow:inset 0 0 0 1.5px ${oa(.55)}}.lbst .b.s{background:#34C77B;color:#fff;box-shadow:none}.lbst .b.e{background:#E5484D;color:#fff;box-shadow:none}
.lbst .t{font-size:14px;font-weight:600;color:${K.text}}.lbst .s{font-size:11.5px;color:${K.sub};margin-top:2px}.lbst .r{text-align:right;font-size:11px;color:${K.sub}}.lbst .r b{display:block;font-size:12.5px;color:${K.text}}
.lbleg{display:flex;align-items:center;gap:8px;margin:2px 0 2px 12px;padding:7px 0 7px 22px;border-left:2px dashed ${oa(.45)};font-size:11.5px;color:${K.sub}}.lbleg b{color:${K.text};font-weight:600}.lbleg em{font-style:normal;color:${K.or};font-weight:600}
.lbm{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.lbm div{border-radius:11px;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};padding:8px 9px}
.lbm span{display:block;font-size:8.5px;font-weight:700;letter-spacing:1px;color:${K.sub};text-transform:uppercase}.lbm b{display:block;font-size:14px;margin-top:3px;color:${K.text}}.lbm b .ptier{display:inline-grid;font-size:11px;letter-spacing:.4px;color:#0D0F12;text-transform:none;margin-top:1px}
.lblg{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid ${K.sep}}.lblg:first-child{border-top:0;padding-top:0}.lblg .t{font-size:13px;font-weight:600;color:${K.text};min-width:0}.lblg .r{text-align:right;white-space:nowrap}.lblg .r b{font-size:13.5px;color:${K.text}}
.lbmap{position:relative;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1px ${K.hair || K.line}}
.lbmap .ov{position:absolute;left:12px;top:10px;pointer-events:none}.lbmap .ov b{display:block;font:800 22px Inter,system-ui;letter-spacing:2px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.lbmap .ov2{position:absolute;right:12px;bottom:10px;text-align:right;pointer-events:none;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.7)}.lbmap .ov2 b{display:block;font-size:20px;font-weight:800;color:${K.or}}.lbmap .ov2 span{font-size:9.5px;font-weight:600;letter-spacing:1px;opacity:.85}
.lbmap .fb{position:absolute;right:10px;top:10px;font-size:11.5px;font-weight:600;color:#fff;padding:6px 10px;border-radius:99px;background:rgba(0,0,0,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);cursor:pointer}
.lbex{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid ${K.sep};cursor:pointer}.lbex:first-child{border-top:0;padding-top:2px}.lbex:last-child{padding-bottom:2px}
.lbex .e{font-size:19px;text-align:center}.lbex .t{font-size:13.5px;font-weight:600;color:${K.text}}.lbex .s{font-size:11px;color:${K.sub};margin-top:2px}.lbex .r{text-align:right}.lbex .r b{display:block;font-size:13.5px;color:${K.text}}.lbex .r span{font-size:10.5px;color:${K.sub}}
.lbpay{font-size:8.5px;font-weight:800;letter-spacing:.6px;padding:2px 5px;border-radius:4px;margin-left:6px;vertical-align:1px}.lbpay.cash{color:#34C77B;background:rgba(52,199,123,.13)}.lbpay.card{color:#6AA8FF;background:rgba(106,168,255,.14)}
.lbcat{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.lbcat div{border-radius:11px;padding:9px 4px;text-align:center;font-size:11px;font-weight:600;color:${K.sub};background:${K.field};box-shadow:inset 0 0 0 1px ${ta(.07)};cursor:pointer}
.lbcat div i{display:block;font-style:normal;font-size:18px;margin-bottom:3px}.lbcat div.on{color:${K.text};box-shadow:inset 0 0 0 1.5px var(--c);background:color-mix(in srgb,var(--c) 14%,${K.field})}
.lbmode{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.lbmode span{border-radius:10px;padding:7px 2px;text-align:center;font-size:11px;font-weight:600;color:${K.sub};background:${K.field};box-shadow:inset 0 0 0 1px ${ta(.07)};cursor:pointer}
.lbmode span i{display:block;font-style:normal;font-size:16px}.lbmode span.on{color:${K.or};background:${oa(.13)};box-shadow:inset 0 0 0 1.5px ${oa(.55)}}
.lbbar{display:grid;grid-template-columns:112px 1fr 64px;gap:9px;align-items:center;padding:7px 0;font-size:12px;color:${K.text}}
.lbbar .tr{position:relative;height:10px;border-radius:6px;background:${K.field}}.lbbar .tr i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}.lbbar .tr u{position:absolute;top:-4px;bottom:-4px;width:2px;border-radius:1px;background:${K.text}}
.lbbar .v{text-align:right;font-size:11px}.lbbar .v b{display:block;font-size:12px}.lbov{color:${K.red}}.lbun{color:#34C77B}
.lbstar{display:grid;grid-template-columns:1fr auto 34px;gap:10px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep}}.lbstar:first-child{border-top:0;padding-top:2px}
.lbstar .t{font-size:13.5px;font-weight:600;color:${K.text}}.lbstar .n{text-align:right;font-weight:700;font-size:14px;color:${K.text}}
.lbstars{display:flex;gap:3px}.lbstars span{position:relative;width:24px;height:24px;font-size:22px;line-height:24px;color:${K.line2};cursor:pointer;text-align:center}.lbstars span i{position:absolute;left:0;top:0;overflow:hidden;color:${K.gold};font-style:normal;white-space:nowrap}
.lbpin{padding:10px 0;border-top:1px solid ${K.sep}}.lbpin:first-child{border-top:0;padding-top:2px}.lbpin .h{display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center}
.lbpin .t{font-size:13.5px;font-weight:600;color:${K.text}}.lbpin .s{font-size:11px;color:${K.sub};margin-top:2px}.lbok{font-size:10px;font-weight:700;color:#34C77B}.lbwarn{font-size:10px;font-weight:700;color:${K.gold};cursor:pointer}.lbbad{font-size:10px;font-weight:700;color:${K.red}}
.lbch{margin:8px 0 0 36px;display:flex;flex-direction:column;gap:5px}.lbch div{font-size:11.5px;padding:7px 9px;border-radius:9px;background:${K.field};color:${K.sub};cursor:pointer}.lbch div.on{color:${K.text};box-shadow:inset 0 0 0 1.5px ${oa(.55)}}
.lbbadges{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.lbbadges span{font-size:12px;font-weight:700;padding:6px 10px;border-radius:99px;background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3)}
.lbbg{padding:10px 0;border-top:1px solid ${K.sep}}.lbbg:first-child{border-top:0;padding-top:2px}.lbbg .t{font-size:13.5px;font-weight:600;color:${K.text}}
.lbfull{position:absolute;inset:0;z-index:65;background:#000;display:flex;flex-direction:column}.lbfull .top{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 10px;color:#fff;font-size:14px;font-weight:600}.lbfull .top span{cursor:pointer;padding:4px 6px}
.lbfull .mp{flex:1;position:relative;overflow:hidden;touch-action:none}.lbfull .mp svg{position:absolute;inset:0;height:100%!important}
.lbfull .zb{position:absolute;right:12px;top:12px;display:flex;flex-direction:column;gap:6px}.lbfull .zb span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:rgba(20,22,26,.85);color:#fff;font-size:19px;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.lbfull .bt{padding:10px 14px 28px;display:flex;gap:8px;align-items:center;color:#ccc;font-size:11.5px;flex-wrap:wrap}
.lbdon{display:grid;grid-template-columns:136px 1fr;gap:14px;align-items:center}.lbleg2 div{display:grid;grid-template-columns:10px 1fr auto;gap:7px;align-items:center;font-size:12px;padding:3px 0;color:${K.text}}.lbleg2 i{width:9px;height:9px;border-radius:3px}.lbleg2 b{font-size:12px}
.lbev{display:grid;grid-template-columns:78px 1fr;gap:14px;align-items:end}
.lbcpd{display:flex;align-items:flex-end;gap:4px;height:84px;margin-top:8px}.lbcpd div{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:8.5px;color:${K.mute};height:100%;justify-content:flex-end}.lbcpd div i{display:block;width:100%;border-radius:4px 4px 2px 2px;background:linear-gradient(180deg,${K.or},${oa(.35)})}
`;

/* ───────── which journey ───────── */
export function cur() {
  const ts = L.journeys(); if (!ts.length) return null;
  const id = G.lbTrip || store.get('lb_trip', '');
  return ts.find(t => t.TrId === id) || ts[0];
}
export const setCur = id => { G.lbTrip = id; store.set('lb_trip', id); };

/* ───────── shell ───────── */
const TABS = [['Logbook', 'Journeys', 'scrLbJourneys'], ['Route', 'Itinerary', 'scrLbItinerary'], ['Wallet', 'Expenses', 'scrLbExpenses'], ['Compass', 'Discovery', 'scrLbResults']];
export const goHome = () => { NAV.stack = []; Navigate('scrDreamer'); };
export const go = scr => { NAV.stack = []; Navigate(scr); };
function Header() {
  return html`
    ${Brand(18, 18, 276, 44, false, false, 'Voyage', goHome)}
    ${I(298, 20, 36, 36, 'Grid', K.sub, { pad: 9, onClick: goHome, label: 'MansWell' })}
    ${I(338, 20, 36, 36, 'Reset', K.sub, { pad: 9, onClick: () => syncNow(), label: 'Refresh' })}`;
}
function Nav(active) {
  const w = 97.5;
  return html`<div class="navbar-glass"></div>
    ${active >= 0 ? html`<div class="abs" style=${`left:${w * active + w / 2 - 11}px;bottom:75px;width:22px;height:3px;border-radius:2px;background:${K.or};box-shadow:0 0 12px ${oa(0.55)}`}></div>`: null}
    ${TABS.map(([ic, lb, scr], i) => html`
      ${I(Math.round(w * i + w / 2 - 13), { b: 41 }, 26, 26, ic, i === active ? K.or : K.mute, { pad: 4, onClick: () => go(scr), label: 'Voyage ' + lb })}
      <div class="abs" style=${`left:${w * i}px;bottom:25px;width:${w}px;height:14px;text-align:center;font-size:10px;letter-spacing:.3px;font-weight:${i === active ? 600 : 400};color:${i === active ? K.or : K.mute};cursor:pointer`} onClick=${() => go(scr)}>${lb}</div>`)}`;
}
export function Page(l, active, kids, id) {
  return html`<div>
    <style>${css()}</style>
    ${Header()}
    <div class="lz" data-t=${id} id=${id}>${UpdateNote()}${kids}</div>
    ${Nav(active)}
    ${Sheet(l)}${FullMap(l)}${Confirm(l)}
    ${PasswordDialog(l)}
  </div>`;
}
export const Sect = (t, link, onLink, id) => html`<div class="lst"><h2>${t}<i>.</i></h2><div class="ln"></div>${link ? html`<span class="lk" onClick=${onLink} data-t=${id}>${link}</span>` : null}</div>`;
export function confirmAsk(l, title, msg, label, run) { l.confirm = { title, msg, label, run }; rerender(); }
function Confirm(l) {
  const c = l.confirm; if (!c) return null;
  const close = () => { l.confirm = null; rerender(); };
  return html`<div class="pconf" data-t="confirm"><div class="dim" onClick=${close}></div><div class="bx"><b>${c.title}</b><p>${c.msg}</p>
    <div class="row"><button class="lbtn" style="flex:1;padding:12px" onClick=${close} data-t="confirmNo">Cancel</button><button class="lbtnd" style="flex:1" onClick=${() => { l.confirm = null; c.run(); rerender(); }} data-t="confirmYes">${c.label}</button></div></div></div>`;
}

/* ───────── saving ───────── */
const ready = () => DB.lbOk && P.srvAtLeast('3.5.0');
export function canWrite() {
  if (ready()) return true;
  Notify('Voyage needs the MansWell 3.5 Apps Script to save. Update Code.gs and deploy a new version (see README).', 'error');
  return false;
}
export const lbsave = (ch, action, detail) => guard(async () => { if (!canWrite()) return; await save({ ...ch, log: [{ AuAction: 'Voyage · ' + action, AuRef: 'VOYAGE', AuDetail: detail || '' }] }); });
const UpdateNote = () => ready() ? null : html`<div class="lwarn" data-t="lbOldGs">Voyage can show your Atlas journeys, but it can't save yet. Paste the new Code.gs (MansWell 3.5), then Deploy › New version (run setupVoyage once if you never ran setupLogbook). The README has the steps.</div>`;
/** Calls the Apps Script directly (find a place, make a track, today's rate, save a file). */
export async function call(action, p, quiet) {
  try { return await api(action, p, undefined, { quiet: true }); } catch (e) {
    const m = String(e.message || e);
    if (/DAILY LIMIT/.test(m)) { G.lbLimit = new Date().toISOString().slice(0, 10); Notify(m.replace(/^.*DAILY LIMIT:\s*/, ''), 'error'); rerender(); return null; }
    if (!quiet) Notify(m, 'error'); return null;
  }
}

/* ───────── small pieces ───────── */
export function Switcher(l, t) {
  return html`<div class="lbsw" onClick=${() => openSwitch(l)} data-t="lbSwitch">${P.isosOf(t.TrId).slice(0, 3).map(iso => Flag(iso, 15))}
    <div style="min-width:0"><b data-t="lbCur">${t.TrName}</b><span>${P.range(t.TrStart, t.TrEnd)} · ${plural(P.daysOf(t), 'day')}</span></div><em>▾</em></div>`;
}
function openSwitch(l) {
  openSheet(l, { title: 'Choose a journey', body: () => html`<div>${L.journeys().map(t => html`<div class="pcr" onClick=${() => { setCur(t.TrId); closeSheet(l); }} data-t=${'lbPick-' + t.TrId}>
    <div style="display:flex;gap:2px">${P.isosOf(t.TrId).slice(0, 1).map(iso => Flag(iso, 18))}</div><div><div class="t">${t.TrName}</div><div class="s">${P.range(t.TrStart, t.TrEnd)}</div></div>
    ${cur() && cur().TrId === t.TrId ? html`<span class="lor">✓</span>` : html`<span></span>`}</div>`)}
    <div class="lnote" style="margin-top:10px">Journeys are added, renamed and re-dated in Atlas. Voyage follows.</div></div>` });
}
export function Empty(title, msg) {
  return html`<div class="lc" data-t="lbEmpty"><b style=${`font-size:16px;color:${K.text}`}>${title}</b><div class="lnote" style="margin-top:6px">${msg}</div>
    <div style="margin-top:12px"><button class="lbtn o on" onClick=${() => go('scrPpJourneys')} data-t="lbToAtlas">Open Atlas journeys</button></div></div>`;
}
export const Ring = (f, size = 40) => { const r = size / 2 - 4, c = 2 * Math.PI * r; return html`<svg width=${size} height=${size} viewBox=${`0 0 ${size} ${size}`}><circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${K.field} stroke-width="4" />
  <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${f >= 1 ? '#34C77B' : K.or} stroke-width="4" stroke-linecap="round" stroke-dasharray=${`${(c * f).toFixed(1)} ${c.toFixed(1)}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />
  <text x=${size / 2} y=${size / 2 + 3.5} text-anchor="middle" font-size="10" font-weight="700" fill=${K.text}>${f >= 1 ? '✓' : Math.round(f * 100) + '%'}</text></svg>`; };
/** Reads "12.5", "1,250" → number */
export const num = t => { const v = Number(String(t ?? '').replace(/[, ]/g, '')); return isFinite(v) ? v : 0; };
export function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
}

/* ───────── find a place with Google Maps, as you type ───────── */
const SUG = { t: null, n: 0 };
/** f: { place, city, country, pin, sug, look } — fills city, country and the pin when you pick a match. */
export function PlaceField(f, o = {}) {
  const look = v => {
    clearTimeout(SUG.t); f.sug = []; f.look = false;
    if (String(v).trim().length < 3) return rerender();
    SUG.t = setTimeout(async () => {
      const tok = ++SUG.n; f.look = true; rerender();
      const cn = (P.BY[f.country] || {}).name || '';
      const res = await call('lbGeocode', { q: v + (cn && !String(v).toLowerCase().includes(cn.toLowerCase()) ? ', ' + cn : ''), region: f.country || '', n: 5 }, true);
      if (tok !== SUG.n) return; f.look = false; f.sug = res || []; rerender();
    }, 750);
  };
  const pick = x => { f.place = x.name || f.place; if (x.city) f.city = x.city; if (x.cc && P.BY[x.cc]) f.country = x.cc; f.pin = { lat: x.lat, lng: x.lng, addr: x.addr }; f.sug = []; f.look = false; clearTimeout(SUG.t); SUG.n++; rerender(); };
  return html`<div>
    <input class="lin" placeholder=${o.ph || 'Start typing, e.g. Ma Pi Leng Pass'} value=${f.place} onInput=${e => { f.place = e.target.value; f.pin = null; look(f.place); }} data-t=${o.id || 'sPlace'} autocomplete="off" />
    ${f.look ? html`<div class="lsub" style="margin:6px 2px 0" data-t="sugLook">Looking on Google Maps…</div>` : null}
    ${f.sug && f.sug.length ? html`<div class="psug" data-t="sug">${f.sug.map((x, i) => html`<div class="pcr" style="grid-template-columns:22px 1fr" onClick=${() => pick(x)} data-t=${'sug-' + i}>
      <span style=${`color:${K.or}`}>📍</span><div><div class="t" style="font-size:13.5px">${x.name}</div><div class="s">${x.addr}</div></div></div>`)}</div>` : null}
    ${f.pin ? html`<div class="lnote" style="margin-top:6px" data-t="sPinned"><span class="lor">📍</span> ${f.pin.addr} · ${f.pin.lat.toFixed(3)}, ${f.pin.lng.toFixed(3)}</div>`
      : o.noHint ? null : html`<div class="lnote" style="margin-top:6px">Pick a match to fill the city and pin the place. Not listed? Type it anyway, it's searched again when you make the track.</div>`}
  </div>`;
}

/* ───────── a stop ───────── */
export function openStop(l, id, day, s) {
  const t = L.journey(id), list = L.stops(id, day), idx = s ? list.findIndex(x => x.LpId === s.LpId) : list.length, isos = P.isosOf(id);
  const prev = list[idx - 1] || list[list.length - 1];
  const f = { place: s ? s.LpPlace : '', city: s ? s.LpCity : '', country: s ? s.LpCountry : (prev && prev.LpCountry) || isos.find(x => x !== P.homeIso()) || isos[0] || '',
    pin: s && L.hasPin(s) ? { lat: Number(s.LpLat), lng: Number(s.LpLng), addr: s.LpAddr || 'Saved pin' } : null, sug: [], look: false,
    arr: s ? s.LpArr : '', stay: s && s.LpStay ? L.dur(s.LpStay) : '', mode: s ? s.LpMode || 'bike' : (prev && prev.LpMode) || 'bike', note: s ? s.LpNote : '', day };
  const first = () => (s ? idx === 0 && Number(f.day) === Number(s.LpDay) : list.length === 0);
  const move = dir => {
    const j = idx + dir; if (j < 0 || j >= list.length) return;
    const a = list[idx], b = list[j];
    lbsave({ up: { LB_Stops: [{ ...a, LpSeq: b.LpSeq }, { ...b, LpSeq: a.LpSeq }] } }, 'Stop moved', a.LpPlace); closeSheet(l);
  };
  openSheet(l, { title: (s ? 'Edit stop · ' : 'Add a stop · ') + 'Day ' + day, body: () => html`<div data-t="stopForm">
    <div class="llab" style="margin-top:4px">Place</div>${PlaceField(f)}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div><div class="llab">City / area</div><input class="lin" placeholder="filled from Google" value=${f.city} onInput=${e => { f.city = e.target.value; }} data-t="sCity" /></div>
      <div><div class="llab">Country</div><select class="lin" value=${f.country} onChange=${e => { f.country = e.target.value; }} data-t="sCountry">
        ${[...new Set([...isos, f.country].filter(Boolean))].map(iso => html`<option value=${iso}>${(P.BY[iso] || {}).name || iso}</option>`)}</select></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div><div class="llab">Day</div><select class="lin" value=${String(f.day)} onChange=${e => { f.day = Number(e.target.value); rerender(); }} data-t="sDay">${L.days(t).map(d => html`<option value=${String(d.n)}>Day ${d.n}</option>`)}</select></div>
      <div><div class="llab">${first() ? 'Left at' : 'Arrived'}</div><input class="lin" type="time" value=${f.arr} onInput=${e => { f.arr = e.target.value; }} data-t="sArr" /></div>
      <div><div class="llab">Stayed</div><input class="lin" placeholder="25m" value=${f.stay} onInput=${e => { f.stay = e.target.value; }} data-t="sStay" /></div></div>
    ${first() ? html`<div class="lnote" style="margin-top:10px">This is where the day starts.</div>` : html`
      <div class="llab">Got there by</div><div class="lbmode">${L.MODES.map(([k, n, e]) => html`<span class=${f.mode === k ? 'on' : ''} onClick=${() => { f.mode = k; rerender(); }} data-t=${'sMode-' + k}><i>${e}</i>${n}</span>`)}</div>
      <div class="lnote" style="margin-top:8px">Travel time is worked out from your times (arrived here − left the last place). Distance comes from the GPX track.</div>`}
    <div class="llab">Note · optional</div><input class="lin" placeholder="Fog cleared at the top" value=${f.note} onInput=${e => { f.note = e.target.value; }} data-t="sNote" />
    ${s ? html`<div style="display:flex;gap:8px;margin-top:12px"><button class="lbtn" style="flex:1" disabled=${idx === 0} onClick=${() => move(-1)} data-t="sUp">▲ Earlier</button><button class="lbtn" style="flex:1" disabled=${idx === list.length - 1} onClick=${() => move(1)} data-t="sDown">▼ Later</button></div>` : null}
  </div>`,
  saveLabel: s ? 'Save stop' : 'Add stop',
  onSave: () => {
    const place = f.place.trim(); if (!place) return Notify('Type the place.', 'error');
    const moved = s && Number(f.day) !== Number(s.LpDay), target = L.stops(id, f.day);
    const row = { LpId: s ? s.LpId : newId('LP'), LpTrip: id, LpDay: Number(f.day), LpSeq: s && !moved ? s.LpSeq : (target.reduce((m, x) => Math.max(m, x.LpSeq || 0), 0) + 1), LpPlace: place, LpCity: f.city.trim(), LpCountry: f.country,
      LpArr: f.arr, LpStay: L.parseDur(f.stay), LpMode: f.mode, LpKm: 0, LpMin: 0, LpNote: f.note.trim(),
      LpLat: f.pin ? Math.round(f.pin.lat * 1e6) / 1e6 : 0, LpLng: f.pin ? Math.round(f.pin.lng * 1e6) / 1e6 : 0, LpAddr: f.pin ? f.pin.addr : '' };
    lbsave({ up: { LB_Stops: [row] } }, s ? 'Stop edited' : 'Stop added', t.TrName + ' · Day ' + f.day + ' · ' + place);
    if (moved) (G.lbDayOf = G.lbDayOf || {})[id] = Number(f.day);
    closeSheet(l);
  },
  extra: s ? () => html`<button class="lbtn" style="padding:13px 14px;color:${K.red}" data-t="sDel" onClick=${() => confirmAsk(l, 'Delete this stop?', s.LpPlace + ' is removed from Day ' + day + '. Make the track again afterwards.', 'Delete', () => { lbsave({ del: { LB_Stops: [s.LpId] } }, 'Stop deleted', s.LpPlace); closeSheet(l); })}>Delete</button>` : null });
}

/* ───────── make the track (pins first when some are missing) ───────── */
const today = () => new Date().toISOString().slice(0, 10);
export const limitHit = () => G.lbLimit === today();
export const LimitNote = () => limitHit() ? html`<div class="lwarn" data-t="lbLimit">Google Maps' free daily limit is used up for today, so tracks and place search can't be made until tomorrow. Tracks already made are kept.</div>` : null;
async function makeTrack(id, day, upd) {
  const changed = upd.filter(u => { const o = DB.lbStops.find(x => x.LpId === u.LpId) || {}; return u.LpLat !== Number(o.LpLat) || u.LpLng !== Number(o.LpLng); });
  if (changed.length) await save({ up: { LB_Stops: changed }, log: [{ AuAction: 'Voyage · Pins saved', AuRef: 'VOYAGE', AuDetail: changed.length + ' stop(s)' }] });
  G.lbMaking = id + '|' + day; rerender();
  const row = await call('lbRoute', { trip: id, day, sig: L.sigOf(upd), pts: upd.map(u => ({ lat: u.LpLat, lng: u.LpLng, mode: u.LpMode })) });
  G.lbMaking = ''; if (row) applySaved({ LB_Tracks: [row] }); rerender();
  return !!row;
}
const qOf = s => [s.LpPlace, s.LpCity, (P.BY[s.LpCountry] || {}).name].filter(Boolean).join(', ');
/** Make GPX track: straight away when every stop has a pin; otherwise check the missing ones first. focus: open those rows (a leg that looks wrong). */
export function openPins(l, id, day, focus) {
  const list = L.stops(id, day);
  if (limitHit()) return Notify("Google Maps' free daily limit is used up for today. Try again tomorrow.", 'error');
  if (!focus && list.length > 1 && list.every(L.hasPin)) return guard(async () => { if (canWrite()) await makeTrack(id, day, list.map(s => ({ ...s, LpLat: Number(s.LpLat), LpLng: Number(s.LpLng) }))); });
  const f = { busy: false, rows: list.map((s, i) => ({ s, q: qOf(s), res: L.hasPin(s) ? [{ lat: Number(s.LpLat), lng: Number(s.LpLng), addr: s.LpAddr || 'Saved pin' }] : [], pick: L.hasPin(s) ? 0 : -1, st: L.hasPin(s) ? 'have' : 'wait', open: !!(focus && focus.includes(i)), man: '' })) };
  const find = async r => { r.st = 'look'; rerender(); const res = await call('lbGeocode', { q: r.q, region: r.s.LpCountry || '' }); r.res = res || []; r.pick = r.res.length ? 0 : -1; r.st = !res ? 'err' : r.res.length ? (r.res.length > 1 ? 'many' : 'sure') : 'none'; rerender(); };
  (async () => { for (const r of f.rows) if (r.st === 'wait') await find(r); })();
  const pinOf = r => (r.pick >= 0 && r.res[r.pick] ? r.res[r.pick] : null);
  openSheet(l, { title: 'Places found · Day ' + day, body: () => {
    const ok = f.rows.filter(pinOf).length;
    return html`<div data-t="pinCheck">${LimitNote()}
      <div class="lnote" style="margin:2px 0 10px" data-t="pinCount">${ok} of ${f.rows.length} found. Tap a place to search again or type its coordinates.</div>
      <div class="lfx" style="padding:8px 12px">${f.rows.map((r, i) => {
        const p = pinOf(r), b = i === 0 ? 's' : i === f.rows.length - 1 ? 'e' : '';
        const tag = r.st === 'look' || r.st === 'wait' ? html`<span class="lsub" style="margin:0">finding…</span>` : r.st === 'have' ? html`<span class="lbok">✓ saved</span>` : r.st === 'sure' ? html`<span class="lbok">✓ sure</span>`
          : r.st === 'many' ? html`<span class="lbwarn" data-t=${'pinChk-' + i}>${r.res.length} matches · check ›</span>` : r.st === 'man' ? html`<span class="lbok">✓ typed</span>` : html`<span class="lbbad" data-t=${'pinNo-' + i}>${r.st === 'err' ? 'error' : 'not found'} ›</span>`;
        return html`<div class="lbpin" data-t=${'pinRow-' + i}><div class="h"><div class="lbst" style="padding:0"><div class=${'b ' + b}>${i === 0 ? 'S' : i === f.rows.length - 1 ? 'E' : i}</div></div>
          <div style="min-width:0"><div class="t">${r.s.LpPlace}</div><div class="s">${p ? p.addr + ' · ' + p.lat.toFixed(2) + ', ' + p.lng.toFixed(2) : r.q}</div></div>
          <div onClick=${() => { r.open = !r.open; rerender(); }} style="cursor:pointer">${tag}</div></div>
          ${r.open ? html`<div class="lbch">${r.res.map((x, k) => html`<div class=${r.pick === k ? 'on' : ''} onClick=${() => { r.pick = k; r.st = 'sure'; r.open = false; rerender(); }} data-t=${'pinOpt-' + i + '-' + k}>${x.addr} · ${x.lat.toFixed(3)}, ${x.lng.toFixed(3)}</div>`)}
            <div style="display:flex;gap:6px;background:none;padding:0"><input class="lin" style="height:34px;font-size:12.5px" value=${r.q} onInput=${e => { r.q = e.target.value; }} data-t=${'pinQ-' + i} /><button class="lbtn" onClick=${() => find(r)} data-t=${'pinFind-' + i}>Search</button></div>
            <div style="display:flex;gap:6px;background:none;padding:0"><input class="lin" style="height:34px;font-size:12.5px" placeholder="or paste from Google Maps: 23.20, 105.37" value=${r.man} onInput=${e => { r.man = e.target.value; }} data-t=${'pinMan-' + i} />
              <button class="lbtn" data-t=${'pinSet-' + i} onClick=${() => { const m = r.man.match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/); if (!m || Math.abs(m[1]) > 90 || Math.abs(m[2]) > 180) return Notify('Type it as latitude, longitude, e.g. 23.20, 105.37', 'error'); r.res = [{ lat: Number(m[1]), lng: Number(m[2]), addr: 'Typed pin' }, ...r.res]; r.pick = 0; r.st = 'man'; r.open = false; rerender(); }}>Use</button></div></div>` : null}
        </div>`; })}</div>
      <div class="lnote" style="margin-top:10px">Each leg follows its transport: bike, car, Grab → roads · walk → footpaths · bus, train → transit or roads · flight, boat → a straight line.</div>
      ${G.lbMaking ? html`<div class="pprog" style="margin:10px 0 0" data-t="pinBusy">Making the track with Google Maps…</div>` : null}
    </div>`; },
  saveLabel: 'Make GPX track',
  onSave: () => guard(async () => {
    if (G.lbMaking || !canWrite()) return;
    const rows = f.rows.filter(pinOf); if (rows.length < 2) return Notify('A day needs at least two stops with a pin to make a track.', 'error');
    if (rows.length < f.rows.length) return Notify('Some stops have no pin yet. Search again or type the coordinates.', 'error');
    const upd = f.rows.map(r => { const p = pinOf(r); return { ...r.s, LpLat: Math.round(p.lat * 1e6) / 1e6, LpLng: Math.round(p.lng * 1e6) / 1e6, LpAddr: p.addr }; });
    if (await makeTrack(id, day, upd)) closeSheet(l);
  }) });
}

/* ───────── Discovery: badges and finds ───────── */
export function setBadge(id, k, v) {
  if (!canWrite()) return;
  const r = L.result(id) || L.blankResult(id), b = L.badges(id); if (b[k] === v) delete b[k]; else b[k] = v;
  lbsave({ up: { LB_Results: [{ ...r, RsBadges: JSON.stringify(b) }] } }, 'Badge', (L.journey(id) || {}).TrName + ' · ' + k + ' ' + (b[k] || 'cleared'));
}
export function openFind(l, id, fd, kind) {
  const t = L.journey(id), isos = P.isosOf(id);
  const f = { kind: fd ? fd.FdKind : kind || 'cafe', place: fd ? fd.FdName : '', city: fd ? fd.FdWhere : '', country: isos.find(x => x !== P.homeIso()) || isos[0] || '',
    pin: fd && (Number(fd.FdLat) || Number(fd.FdLng)) ? { lat: Number(fd.FdLat), lng: Number(fd.FdLng), addr: fd.FdWhere } : null, sug: [], look: false, day: fd ? Number(fd.FdDay) : 0, note: fd ? fd.FdNote : '' };
  openSheet(l, { title: fd ? 'Edit find' : 'Add a find', body: () => html`<div data-t="findForm">
    <div class="llab" style="margin-top:4px">What it is</div><div class="lbcat" style="grid-template-columns:repeat(3,1fr)">${L.FINDS.map(x => html`<div class=${f.kind === x.k ? 'on' : ''} style=${'--c:' + K.or} onClick=${() => { f.kind = x.k; rerender(); }} data-t=${'fKind-' + x.k}><i>${x.e}</i>${x.n}</div>`)}</div>
    <div class="llab">${['tip', 'avoid'].includes(f.kind) ? 'In a few words' : 'Name'}</div>${['tip', 'avoid', 'people'].includes(f.kind) ? html`<input class="lin" placeholder=${f.kind === 'tip' ? 'Bring a rain cover' : f.kind === 'avoid' ? 'Night riding on the pass' : 'The family at the homestay'} value=${f.place} onInput=${e => { f.place = e.target.value; }} data-t="fName" />` : PlaceField(f, { id: 'fName', ph: 'Start typing, e.g. Café Cũ', noHint: true })}
    <div style="display:grid;grid-template-columns:1fr 104px;gap:10px">
      <div><div class="llab">Where</div><input class="lin" placeholder="Dong Van" value=${f.city} onInput=${e => { f.city = e.target.value; }} data-t="fWhere" /></div>
      <div><div class="llab">Day</div><select class="lin" value=${String(f.day)} onChange=${e => { f.day = Number(e.target.value); }} data-t="fDay"><option value="0">—</option>${L.days(t).map(d => html`<option value=${String(d.n)}>Day ${d.n}</option>`)}</select></div></div>
    <div class="llab">Why · optional</div><input class="lin" placeholder="Egg coffee with a view of the valley" value=${f.note} onInput=${e => { f.note = e.target.value; }} data-t="fNote" />
  </div>`,
  onSave: () => {
    const name = f.place.trim(); if (!name) return Notify('Type what you found.', 'error');
    const seq = fd ? fd.FdSeq : L.finds(id).filter(x => x.FdKind === f.kind).reduce((m, x) => Math.max(m, x.FdSeq || 0), 0) + 1;
    lbsave({ up: { LB_Finds: [{ FdId: fd ? fd.FdId : newId('FD'), FdTrip: id, FdKind: f.kind, FdName: name, FdWhere: f.city.trim(), FdDay: Number(f.day) || 0, FdNote: f.note.trim(),
      FdLat: f.pin ? Math.round(f.pin.lat * 1e6) / 1e6 : 0, FdLng: f.pin ? Math.round(f.pin.lng * 1e6) / 1e6 : 0, FdSeq: seq }] } }, fd ? 'Find edited' : 'Find added', t.TrName + ' · ' + L.FIND[f.kind].n + ' · ' + name);
    closeSheet(l);
  },
  extra: fd ? () => html`<button class="lbtn" style="padding:13px 14px;color:${K.red}" data-t="fDel" onClick=${() => confirmAsk(l, 'Delete this find?', fd.FdName, 'Delete', () => { lbsave({ del: { LB_Finds: [fd.FdId] } }, 'Find deleted', fd.FdName); closeSheet(l); })}>Delete</button>` : null });
}

/* ───────── journey rate ───────── */
export async function todayRate(cur) { const r = await call('lbFx', { cur }); return r && r.rate ? Math.round(r.rate * 10000) / 10000 : 0; }
export function openRate(l, id, curr) {
  const t = L.journey(id), old = L.rate(id, curr), f = { v: old ? String(old) : '', busy: false };
  const cash = L.expenses(id).filter(e => e.ExPay !== 'card' && e.ExCur === curr);
  openSheet(l, { title: 'Journey rate · ' + curr, body: () => html`<div data-t="rateForm">
    <div class="llab" style="margin-top:4px">RM 1 =  ${L.sym(curr)} …</div><input class="lin" inputmode="decimal" placeholder="5760" value=${f.v} onInput=${e => { f.v = e.target.value; }} data-t="rateV" />
    <button class="lbtn" style="margin-top:8px" disabled=${f.busy} data-t="rateToday" onClick=${async () => { f.busy = true; rerender(); const r = await todayRate(curr); f.busy = false; if (r) f.v = String(r); rerender(); }}>${f.busy ? 'Asking Google…' : "Get today's rate"}</button>
    <div class="lnote" style="margin-top:10px">Set once for the journey and kept. Cash in ${curr} is worked out to MYR at this rate.${cash.length && old ? ' Changing it works out your ' + plural(cash.length, 'cash entry') + ' again.' : ''}</div></div>`,
  onSave: () => {
    const v = num(f.v); if (!(v > 0)) return Notify('Type how much ' + curr + ' RM 1 buys.', 'error');
    const up = { LB_Rates: [{ RtKey: id + '|' + curr, RtTrip: id, RtCur: curr, RtRate: v, RtDate: new Date().toISOString().slice(0, 10) }] };
    if (cash.length) up.LB_Expenses = cash.map(e => ({ ...e, ExRate: v, ExMyr: Math.round(e.ExAmt / v * 100) / 100 }));
    lbsave({ up }, 'Rate set', t.TrName + ' · RM 1 = ' + v + ' ' + curr); closeSheet(l);
  } });
}

/* ───────── an expense ───────── */
export function openExpense(l, id, e, preset = {}) {
  const t = L.journey(id), mc = L.mainCur(id), curs = [...new Set([mc, ...L.cursOf(id)])].filter(c => c !== 'MYR');
  const f = { cat: e ? e.ExCat : preset.cat || 'meal', what: e ? e.ExWhat : '', day: e ? Number(e.ExDay) : preset.day ?? 1, pay: e ? e.ExPay || 'cash' : 'cash',
    cur: e && e.ExPay !== 'card' ? e.ExCur : mc, amt: e ? String(e.ExAmt) : '', bill: e && Number(e.ExBill) ? String(e.ExBill) : '', billCur: (e && e.ExBillCur) || mc, rate: '', busy: false };
  const rateOf = c => (c === 'MYR' ? 1 : L.rate(id, c) || num(f.rate));
  openSheet(l, { title: e ? 'Edit expense' : 'Add an expense', body: () => {
    const a = num(f.amt), r = rateOf(f.cur), myr = f.pay === 'card' ? a : r ? a / r : 0, haveRate = f.cur === 'MYR' || L.rate(id, f.cur) > 0;
    const b = num(f.bill), cr = L.rate(id, f.billCur), cost = f.pay === 'card' && a && b && cr ? (a / (b / cr) - 1) * 100 : null;
    return html`<div data-t="expForm">
      <div class="llab" style="margin-top:4px">Category</div><div class="lbcat">${L.CATS.map(c => html`<div class=${f.cat === c.k ? 'on' : ''} style=${'--c:' + c.c} onClick=${() => { f.cat = c.k; rerender(); }} data-t=${'eCat-' + c.k}><i>${c.e}</i>${c.n}</div>`)}</div>
      <div style="display:grid;grid-template-columns:1fr 104px;gap:10px">
        <div><div class="llab">What</div><input class="lin" placeholder="Homestay Dong Van" value=${f.what} onInput=${ev => { f.what = ev.target.value; }} data-t="eWhat" /></div>
        <div><div class="llab">Day</div><select class="lin" value=${String(f.day)} onChange=${ev => { f.day = Number(ev.target.value); }} data-t="eDay"><option value="0">Before</option>${L.days(t).map(d => html`<option value=${String(d.n)}>Day ${d.n}</option>`)}</select></div></div>
      <div class="llab">Paid by</div>${Seg([['cash', '💵 Cash'], ['card', '💳 Card']], f.pay, k => { f.pay = k; rerender(); }, 'ePay')}
      <div class="lnote" style="margin-top:6px">${f.pay === 'cash' ? "Cash: type it in the country's currency." : 'Card: type the RM your bank charged.'}</div>
      ${f.pay === 'cash' ? html`
        <div style="display:grid;grid-template-columns:104px 1fr;gap:10px">
          <div><div class="llab">Currency</div><select class="lin" value=${f.cur} onChange=${ev => { f.cur = ev.target.value; rerender(); }} data-t="eCur">${[...curs, 'MYR'].map(c => html`<option value=${c}>${c}</option>`)}</select></div>
          <div><div class="llab">Amount · ${L.sym(f.cur)}</div><input class="lin" inputmode="decimal" placeholder="180,000" value=${f.amt} onInput=${ev => { f.amt = ev.target.value; rerender(); }} data-t="eAmt" /></div></div>
        ${haveRate ? (f.cur === 'MYR' ? null : html`<div class="lnote" style="margin-top:8px" data-t="eRateLine">At the journey's rate RM 1 = ${L.money(L.rate(id, f.cur), f.cur)}: <b class="lor" data-t="eMyr">${L.RM2(myr)}</b></div>`)
          : html`<div class="lfx" style="margin-top:10px;padding:10px 12px" data-t="eNeedRate"><div class="llab" style="margin-top:0">Journey rate · RM 1 = ${L.sym(f.cur)} …</div>
            <div style="display:flex;gap:6px"><input class="lin" inputmode="decimal" placeholder="5760" value=${f.rate} onInput=${ev => { f.rate = ev.target.value; rerender(); }} data-t="eRate" />
              <button class="lbtn" disabled=${f.busy} onClick=${async () => { f.busy = true; rerender(); const v = await todayRate(f.cur); f.busy = false; if (v) f.rate = String(v); rerender(); }} data-t="eRateToday">${f.busy ? '…' : 'Today'}</button></div>
            <div class="lnote" style="margin-top:6px">Set once for this journey and kept.${myr ? ' This one is ' + L.RM2(myr) + '.' : ''}</div></div>`}` : html`
        <div class="llab">Amount · RM</div><input class="lin" inputmode="decimal" placeholder="79.40" value=${f.amt} onInput=${ev => { f.amt = ev.target.value; rerender(); }} data-t="eAmt" />
        <div style="display:grid;grid-template-columns:104px 1fr;gap:10px">
          <div><div class="llab">Bill in</div><select class="lin" value=${f.billCur} onChange=${ev => { f.billCur = ev.target.value; rerender(); }} data-t="eBillCur">${curs.map(c => html`<option value=${c}>${c}</option>`)}</select></div>
          <div><div class="llab">On the bill · optional</div><input class="lin" inputmode="decimal" placeholder="450,000" value=${f.bill} onInput=${ev => { f.bill = ev.target.value; rerender(); }} data-t="eBill" /></div></div>
        ${a && b ? html`<div class="lnote" style="margin-top:8px" data-t="eCardRate">Card rate worked out RM 1 = ${L.money(b / a, f.billCur)}${cr ? html` · your cash rate ${L.money(cr, f.billCur)} · <b class=${cost > 0 ? 'lbov' : 'lbun'}>${cost >= 0 ? '+' : ''}${cost.toFixed(1)}% card cost</b>` : ' · set the journey rate to see the card cost'}</div>` : null}`}
    </div>`; },
  onSave: () => {
    const a = num(f.amt); if (!(a > 0)) return Notify('Type the amount.', 'error');
    const up = {}; let r = 1;
    if (f.pay === 'cash' && f.cur !== 'MYR') {
      r = L.rate(id, f.cur);
      if (!r) { r = num(f.rate); if (!(r > 0)) return Notify('Set the journey rate for ' + f.cur + ' first.', 'error'); up.LB_Rates = [{ RtKey: id + '|' + f.cur, RtTrip: id, RtCur: f.cur, RtRate: r, RtDate: new Date().toISOString().slice(0, 10) }]; }
    }
    const card = f.pay === 'card', b = card ? num(f.bill) : 0, seq = e ? e.ExSeq : L.expenses(id).filter(x => Number(x.ExDay) === Number(f.day)).reduce((m, x) => Math.max(m, x.ExSeq || 0), 0) + 1;
    up.LB_Expenses = [{ ExId: e ? e.ExId : newId('EX'), ExTrip: id, ExDay: Number(f.day), ExCat: f.cat, ExWhat: f.what.trim() || L.CAT[f.cat].n, ExPay: f.pay, ExAmt: a, ExCur: card ? 'MYR' : f.cur,
      ExRate: card ? (b ? Math.round(b / a * 10000) / 10000 : 0) : r, ExMyr: Math.round((card ? a : a / r) * 100) / 100, ExBill: b, ExBillCur: card && b ? f.billCur : '', ExSeq: seq }];
    lbsave({ up }, e ? 'Expense edited' : 'Expense added', t.TrName + ' · ' + up.LB_Expenses[0].ExWhat + ' · ' + L.RM2(up.LB_Expenses[0].ExMyr));
    closeSheet(l);
  },
  extra: e ? () => html`<button class="lbtn" style="padding:13px 14px;color:${K.red}" data-t="eDel" onClick=${() => confirmAsk(l, 'Delete this expense?', e.ExWhat + ' · ' + L.RM2(e.ExMyr), 'Delete', () => { lbsave({ del: { LB_Expenses: [e.ExId] } }, 'Expense deleted', e.ExWhat); closeSheet(l); })}>Delete</button>` : null });
}

/* ───────── budget ───────── */
export function openBudget(l, id) {
  const t = L.journey(id), bg = L.budget(id), tier = L.tierOf(id);
  const f = { mode: 'total', total: bg.tot ? String(bg.tot) : '', each: Object.fromEntries(L.CATS.map(c => [c.k, bg.by[c.k] ? String(bg.by[c.k]) : ''])) };
  openSheet(l, { title: 'Budget · ' + t.TrName, body: () => {
    const split = L.splitMix(num(f.total));
    return html`<div data-t="budForm">
      ${Seg([['total', 'Type a total'], ['each', 'Each category']], f.mode, k => { if (k === 'each' && num(f.total) && !L.CATS.some(c => num(f.each[c.k]))) f.each = Object.fromEntries(L.CATS.map(c => [c.k, String(split[c.k])])); f.mode = k; rerender(); }, 'bMode')}
      ${tier ? html`<div class="ptres" style=${'--c:' + P.TIER_COLOR[tier[0]] + ';cursor:pointer'} onClick=${() => { f.mode = 'total'; f.total = String(L.tierBudget(tier)); rerender(); }} data-t="bTier">
        <span class="ptier" style=${'--c:' + P.TIER_COLOR[tier[0]]}>${tier}</span><div><b>Start from your Wanderlist tier · ${L.RM(L.tierBudget(tier))}</b><span>${P.tierText(tier)}</span></div></div>` : null}
      ${f.mode === 'total' ? html`<div class="llab">Total budget · RM</div><input class="lin" inputmode="decimal" placeholder="4,000" value=${f.total} onInput=${e => { f.total = e.target.value; rerender(); }} data-t="bTotal" />
        <div class="lfx" style="margin-top:10px;padding:6px 12px">${L.CATS.map(c => html`<div class="lr" style="padding:6px 0"><span class="t">${c.e} ${c.n}</span><span class="r" data-t=${'bSplit-' + c.k}>${L.RM(split[c.k])}</span></div>`)}</div>
        <div class="lnote" style="margin-top:6px">Split by the usual mix. Choose “Each category” to change any of them.</div>`
      : html`${L.CATS.map(c => html`<div style="display:grid;grid-template-columns:1fr 130px;gap:10px;align-items:center;margin-top:8px"><span style=${`font-size:13.5px;color:${K.text}`}>${c.e} ${c.n}</span>
          <input class="lin r" inputmode="decimal" placeholder="0" value=${f.each[c.k]} onInput=${e => { f.each[c.k] = e.target.value; rerender(); }} data-t=${'bEach-' + c.k} /></div>`)}
        <div class="lnote" style="margin-top:8px">Total ${L.RM(L.CATS.reduce((s, c) => s + num(f.each[c.k]), 0))}</div>`}
    </div>`; },
  onSave: () => {
    const v = f.mode === 'total' ? L.splitMix(num(f.total)) : Object.fromEntries(L.CATS.map(c => [c.k, num(f.each[c.k])]));
    lbsave({ up: { LB_Budget: L.CATS.map(c => ({ BgKey: id + '|' + c.k, BgTrip: id, BgCat: c.k, BgAmt: v[c.k] || 0 })) } }, 'Budget set', t.TrName + ' · ' + L.RM(L.CATS.reduce((s, c) => s + (v[c.k] || 0), 0)));
    closeSheet(l);
  } });
}

/* ───────── the full route map ───────── */
export function openFull(l, id) { l.full = { id, perDay: l.perDay !== false && !!l.perDay, view: null, base: null }; rerender(); }
function FullMap(l) {
  const fm = l.full; if (!fm) return null;
  const t = L.journey(fm.id); if (!t) return null;
  const w = 390, h = 640, ds = L.days(t).map(d => d.n);
  if (!fm.view) { const m = RouteMap({ id: fm.id, days: ds, w, h, labels: false }); fm.view = { ...m.view }; fm.base = m.view.k; }
  const zoom = (f, cx = w / 2, cy = h / 2) => { const v = fm.view, lon = v.x0 + cx / v.k, yy = v.y0 - cy / v.k; v.k = Math.max(fm.base * 0.5, Math.min(fm.base * 40, v.k * f)); v.x0 = lon - cx / v.k; v.y0 = yy + cy / v.k; rerender(); };
  const pts = fm.pts || (fm.pts = new Map());
  const down = e => { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); fm.pinch = null; };
  const moveP = e => {
    if (!pts.has(e.pointerId)) return; const r = e.currentTarget.getBoundingClientRect(), sc = w / r.width, old = pts.get(e.pointerId);
    if (pts.size === 1) { fm.view.x0 -= (e.clientX - old[0]) * sc / fm.view.k; fm.view.y0 += (e.clientY - old[1]) * sc / fm.view.k; pts.set(e.pointerId, [e.clientX, e.clientY]); rerender(); return; }
    pts.set(e.pointerId, [e.clientX, e.clientY]); const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (fm.pinch) zoom(d / fm.pinch, ((a[0] + b[0]) / 2 - r.left) * sc, ((a[1] + b[1]) / 2 - r.top) * sc); fm.pinch = d;
  };
  const up = e => { pts.delete(e.pointerId); fm.pinch = null; };
  const m = RouteMap({ id: fm.id, days: ds, w, h, view: fm.view, baseK: fm.base, perDay: fm.perDay, key: 'fullMap', onPin: d => { l.full = null; (G.lbDayOf = G.lbDayOf || {})[fm.id] = d; go('scrLbItinerary'); } });
  return html`<div class="lbfull" data-t="lbFull"><div class="top"><span>${t.TrName}</span><span onClick=${() => { l.full = null; rerender(); }} data-t="fullClose">✕</span></div>
    <div class="mp" onPointerDown=${down} onPointerMove=${moveP} onPointerUp=${up} onPointerCancel=${up} onWheel=${e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.25 : 0.8); }}>${m.svg}
      <div class="zb"><span onClick=${() => zoom(1.6)} data-t="fullIn">+</span><span onClick=${() => zoom(1 / 1.6)} data-t="fullOut">−</span><span style="font-size:13px" onClick=${() => { fm.view = null; rerender(); }} data-t="fullReset">⤢</span></div></div>
    <div class="bt">${Seg([['one', 'One colour'], ['day', 'Colour by day']], fm.perDay ? 'day' : 'one', k => { fm.perDay = k === 'day'; rerender(); }, 'fullCol')}
      ${fm.perDay ? html`<div style="display:flex;gap:8px;flex-wrap:wrap;width:100%">${ds.filter(d => L.lineOf(fm.id, d).pts.length).map(d => html`<span style="display:inline-flex;gap:4px;align-items:center"><i style=${`width:10px;height:3px;border-radius:2px;background:${L.DAYC[(d - 1) % L.DAYC.length]}`}></i>D${d}</span>`)}</div>` : null}
      <span style="width:100%">Pinch or use + − to zoom, drag to move, tap a pin to open that day.</span></div></div>`;
}
export { fit };
