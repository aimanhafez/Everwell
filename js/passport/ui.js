// MansWell Passport · UI kit: the shell (header, five tabs), flags, the world map, and the sheets every tab shares
// (one country, add/edit a trip, a wish, pick a country, photo viewer, confirm). Same look and theme as Lens.
import { html, K, DB, NAV, I, Brand, Navigate, rerender, save, Notify, guard, Today, G, store } from '../core.js';
import { syncNow, PasswordDialog, askPassword } from '../shared.js';
import { css as lensCss, Sheet, openSheet, closeSheet, oa, ta, Cap, newId } from '../lens/ui.js';
import * as P from './engine.js';
import { MAP_W, MAP_H, SHAPES, OTHER, DOTS } from './geo.js';
import * as PH from './photos.js';

export { openSheet, closeSheet, Cap, newId, oa, ta };
export const WISHC = () => (K.light ? '#7B3FE4' : '#E2367A');
export const PINK = '#E2367A', PURPLE = '#7B3FE4';

/* ───────── styles ───────── */
export const css = () => lensCss() + `
.pfl{display:inline-block;flex:none;border-radius:3px;object-fit:cover;vertical-align:middle;box-shadow:0 0 0 1px ${ta(.14)};background:${ta(.06)}}
.ppass{margin:0 12px 12px;border-radius:20px;padding:18px;position:relative;overflow:hidden;color:#fff;background:linear-gradient(135deg,${K.or} 0%,${PINK} 58%,${PURPLE} 100%);box-shadow:0 14px 30px ${oa(.18)}}
.ppass:after{content:'';position:absolute;right:-34px;top:-34px;width:160px;height:160px;border-radius:50%;border:1.5px solid rgba(255,255,255,.22);box-shadow:0 0 0 20px rgba(255,255,255,.06),0 0 0 40px rgba(255,255,255,.04);pointer-events:none}
.ppass .lcap{color:rgba(255,255,255,.82)}.ppass .big{font-size:34px;font-weight:700;letter-spacing:-.5px;margin-top:4px}.ppass .sub{font-size:12.5px;color:rgba(255,255,255,.9);margin-top:3px}.ppass .sub b{color:#fff}
.ppass .bar{height:6px;border-radius:6px;background:rgba(255,255,255,.25);margin-top:12px;overflow:hidden}.ppass .bar i{display:block;height:100%;background:#fff;border-radius:6px}
.ppass .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:13px}.ppass .g3 div{background:rgba(255,255,255,.15);border-radius:11px;padding:8px 10px}.ppass .g3 b{display:block;font-size:17px;margin-top:2px}
.pmap{position:relative;border-radius:12px;overflow:hidden;background:${K.light ? ta(.03) : 'rgba(0,0,0,.18)'}}
.pmap svg{display:block;width:100%}.pmap.live svg{touch-action:none;cursor:grab}
.pmap .zb{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:5px}.pmap .zb span{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${K.panel};box-shadow:inset 0 0 0 1px ${K.line2};color:${K.text};font-size:17px;font-weight:600;cursor:pointer;user-select:none}
.pleg{display:flex;gap:12px;flex-wrap:wrap;font-size:10.5px;color:${K.sub};margin-top:9px}.pleg span{display:inline-flex;align-items:center;gap:5px}.pleg i{width:9px;height:9px;border-radius:2px;display:inline-block}
.pchips{display:flex;gap:6px;margin:0 12px 10px;overflow-x:auto;scrollbar-width:none}.pchips::-webkit-scrollbar{display:none}
.pchip{flex:none;font-size:12px;font-weight:600;color:${K.sub};padding:7px 11px;border-radius:99px;box-shadow:inset 0 0 0 1px ${K.line2};white-space:nowrap;cursor:pointer;background:transparent}
.pchip.on{background:${oa(.13)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.5)}}
.psrch{display:flex;align-items:center;gap:8px;margin:0 12px 10px;padding:0 12px;height:42px;border-radius:12px;background:${K.field};box-shadow:inset 0 0 0 1px ${ta(.07)}}
.psrch input{flex:1;border:0;outline:0;background:transparent;color:${K.text};font-size:15px;font-family:inherit;min-width:0}.psrch input::placeholder{color:${K.mute}}
.pcr{display:grid;grid-template-columns:30px 1fr auto;gap:11px;align-items:center;padding:10px 0;border-top:1px solid ${K.sep};cursor:pointer}.pcr:first-child{border-top:0;padding-top:2px}.pcr:last-child{padding-bottom:2px}
.pcr .t{font-size:14px;font-weight:600;color:${K.text}}.pcr .s{font-size:11.5px;color:${K.sub};margin-top:2px}
.pst{font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:4px 8px;border-radius:99px;white-space:nowrap;text-transform:uppercase}
.pst.visited{color:${K.or};background:${oa(.13)}}.pst.wish{color:${WISHC()};background:${WISHC()}22}.pst.none{color:${K.sub};background:${ta(.06)}}.pst.home{color:${K.text};background:${ta(.1)}}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pgc{border-radius:12px;padding:10px 8px;text-align:center;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};cursor:pointer;position:relative}
.pgc .n{font-size:11.5px;font-weight:600;margin-top:7px;color:${K.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pgc .s{font-size:9.5px;color:${K.sub};margin-top:2px}
.pgc .dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%}
.ptrip{margin:0 12px 12px;border-radius:16px;overflow:hidden;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};cursor:pointer}
.ptrip .ph{height:118px;position:relative}.ptrip .ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.45))}
.ptrip .ph .fl{position:absolute;right:10px;bottom:9px;z-index:1;display:flex;gap:4px}
.ptrip .tx{padding:11px 14px 12px}.ptrip b{font-size:15px;color:${K.text}}.ptrip .s{font-size:11.5px;color:${K.sub};margin-top:3px}
.pyr{display:flex;justify-content:space-between;align-items:baseline;margin:18px 18px 8px}.pyr b{font:400 20px Georgia,serif;color:${K.text}}.pyr span{font-size:10px;font-weight:600;letter-spacing:.8px;color:${K.mute}}
.phl{display:grid;grid-template-columns:58px 1fr auto;gap:11px;align-items:center;padding:9px 0;border-top:1px solid ${K.sep};cursor:pointer}.phl:first-child{border-top:0;padding-top:0}.phl:last-child{padding-bottom:0}
.phl .im{width:58px;height:44px;border-radius:9px}.phl .t{font-size:13.5px;font-weight:600;color:${K.text};display:flex;gap:6px;align-items:center}.phl .s{font-size:11px;color:${K.sub};margin-top:2px}
.pk{font-size:9px;font-weight:700;letter-spacing:1.2px}
.pfr{display:flex;gap:6px;flex-wrap:wrap}
.pfc{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:6px 10px 6px 7px;border-radius:99px;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};color:${K.text};cursor:pointer}
.pbad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.pbad div{text-align:center;font-size:9.5px;color:${K.sub};line-height:1.25}.pbad i{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 5px;border-radius:50%;font:700 13px Inter,system-ui;font-style:normal;color:#fff;background:linear-gradient(135deg,${K.or},${PINK});box-shadow:0 4px 12px ${oa(.25)}}
.pbad .off i{background:${K.field};color:${K.mute};box-shadow:inset 0 0 0 1.5px ${K.line2}}.pbad b{display:block;color:${K.text};font-size:10px}
.pcover{position:relative;height:250px}.pcover:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),transparent 30%,transparent 50%,rgba(0,0,0,.6))}
.pcover .ov{position:absolute;left:18px;right:18px;bottom:16px;z-index:1;color:#fff}.pcover .ov b{display:block;font:400 28px Georgia,serif;text-shadow:0 2px 12px rgba(0,0,0,.4)}.pcover .ov span{font-size:12.5px;opacity:.92}
.pmeta{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 12px}.pmeta div{background:${K.card2};border-radius:12px;padding:9px 11px;box-shadow:inset 0 0 0 1px ${K.line}}.pmeta b{display:block;font-size:14.5px;margin-top:3px;color:${K.text}}
.pgal{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 12px 12px}.pgal div{aspect-ratio:1;border-radius:9px;cursor:pointer;position:relative}
.pgal .add{display:grid;place-items:center;text-align:center;font-size:11.5px;font-weight:600;color:${K.or};box-shadow:inset 0 0 0 1.5px ${oa(.45)};border-radius:9px;background:${oa(.06)}}
.pgal .cv:after{content:'COVER';position:absolute;left:5px;top:5px;font-size:8px;font-weight:700;letter-spacing:.8px;color:#fff;background:rgba(0,0,0,.5);padding:2px 5px;border-radius:4px}
ul.pmom{list-style:none;margin:0;padding:0}ul.pmom li{position:relative;padding:7px 0 7px 16px;font-size:13.5px;line-height:1.45;color:${K.text};border-top:1px solid ${K.sep}}ul.pmom li:first-child{border-top:0;padding-top:0}
ul.pmom li:before{content:'';position:absolute;left:0;top:14px;width:6px;height:6px;border-radius:50%;background:${PINK}}ul.pmom li:first-child:before{top:7px}
.pwl{display:grid;grid-template-columns:34px 1fr auto;gap:11px;align-items:start;padding:12px 0;border-top:1px solid ${K.sep}}.pwl:first-child{border-top:0;padding-top:2px}.pwl:last-child{padding-bottom:2px}
.pwl .t{font-size:14.5px;font-weight:600;color:${K.text}}.pwl .s{font-size:11.5px;color:${K.sub};margin-top:2px;line-height:1.4}
.ptags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.ptags i{font-style:normal;font-size:10.5px;color:${K.sub};background:${K.field};border-radius:6px;padding:3px 7px}
.pord{display:flex;flex-direction:column;gap:4px;align-items:flex-end}.pord span{width:26px;height:22px;border-radius:7px;display:grid;place-items:center;color:${K.sub};box-shadow:inset 0 0 0 1px ${K.line2};cursor:pointer;font-size:11px}
.ppri{font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:4px 8px;border-radius:99px}.ppri.H{color:${K.red};background:rgba(229,72,77,.12)}.ppri.M{color:${K.gold};background:rgba(233,185,73,.13)}.ppri.L{color:${K.sub};background:${ta(.07)}}
.pwall{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 12px 12px}.pwall div{aspect-ratio:1;border-radius:9px;cursor:pointer}.pwall div:first-child{grid-column:span 2;grid-row:span 2}
.pstamps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.pstp{aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;position:relative;border:2px solid var(--s);color:var(--s);transform:rotate(var(--r));cursor:pointer}
.pstp:before{content:'';position:absolute;inset:4px;border-radius:50%;border:1px dashed var(--s);opacity:.7}.pstp.sq{border-radius:13px}.pstp.sq:before{border-radius:9px}
.pstp b{font:800 16px Inter,system-ui;letter-spacing:1px;display:block}.pstp span{font-size:7.5px;font-weight:700;letter-spacing:.8px;display:block}
.pstp.lock{--s:${K.line2};color:${K.mute}}
.pview{position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.94);display:flex;flex-direction:column}
.pview .top{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 8px;color:#fff;font-size:14px}.pview .top span{cursor:pointer;padding:6px}
.pview .im{flex:1;display:grid;place-items:center;padding:6px}.pview .im img{max-width:100%;max-height:100%;border-radius:6px}
.pview .bt{display:flex;gap:8px;padding:12px 16px 30px}.pview .bt button{flex:1;padding:12px;border-radius:12px;border:0;font:600 13px inherit;font-family:inherit;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}.pview .bt button.d{color:#FF7A7E}
.pconf{position:absolute;inset:0;z-index:70;display:grid;place-items:center}.pconf .dim{position:absolute;inset:0;background:rgba(0,0,0,.6)}
.pconf .bx{position:relative;width:310px;background:${K.panel};border-radius:18px;padding:20px;box-shadow:inset 0 0 0 1px ${K.line2};color:${K.text}}
.pconf .bx b{display:block;font-size:16px}.pconf .bx p{font-size:13px;color:${K.sub};line-height:1.5;margin:8px 0 16px}.pconf .row{display:flex;gap:8px}
.pseg{display:grid;gap:4px;background:${K.field};border-radius:12px;padding:4px;box-shadow:inset 0 0 0 1px ${ta(.06)}}
.pseg span{text-align:center;font-size:12.5px;font-weight:600;color:${K.sub};padding:9px 0;border-radius:9px;cursor:pointer}.pseg span.on{background:${oa(.14)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.5)}}
.pseg.dis span{cursor:default;opacity:.75}
textarea.lin{height:auto;min-height:74px;padding:10px 12px;line-height:1.45;font-weight:500;resize:vertical}
.psug{margin-top:6px;border-radius:12px;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};padding:2px 12px}
.pstop{display:grid;grid-template-columns:26px 1fr 74px 28px;gap:9px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep}}.pstop:first-child{border-top:0}
.pstop .t{font-size:14px;font-weight:600}.pstop .x{color:${K.red};text-align:center;cursor:pointer;font-size:18px}
.pfile{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.pprog{margin:0 12px 12px;padding:10px 14px;border-radius:12px;background:${oa(.08)};box-shadow:inset 0 0 0 1px ${oa(.3)};font-size:12.5px;color:${K.or}}
`;

/* ───────── shell ───────── */
const TABS = [['Passport', 'Overview', 'scrPpOverview'], ['Globe', 'World', 'scrPpWorld'], ['Plane', 'Journeys', 'scrPpJourneys'], ['Star', 'Wishlist', 'scrPpWishlist'], ['Images', 'Memories', 'scrPpMemories']];
export const goHome = () => { NAV.stack = []; Navigate('scrDreamer'); };
export const go = scr => { NAV.stack = []; Navigate(scr); };
function Header(l) {
  return html`
    ${Brand(18, 18, 236, 44, false, false, 'Passport', goHome)}
    ${I(258, 20, 36, 36, 'Settings', K.sub, { pad: 9, onClick: () => openSettings(l), label: 'Passport settings' })}
    ${I(298, 20, 36, 36, 'Grid', K.sub, { pad: 9, onClick: goHome, label: 'MansWell' })}
    ${I(338, 20, 36, 36, 'Reset', K.sub, { pad: 9, onClick: () => syncNow(), label: 'Refresh' })}`;
}
function Nav(active) {
  return html`<div class="navbar-glass"></div>
    ${active >= 0 ? html`<div class="abs" style=${`left:${28 + active * 78}px;bottom:75px;width:22px;height:3px;border-radius:2px;background:${K.or};box-shadow:0 0 12px ${oa(0.55)}`}></div>` : null}
    ${TABS.map(([ic, lb, scr], i) => html`
      ${I(26 + i * 78, { b: 41 }, 26, 26, ic, i === active ? K.or : K.mute, { pad: 4, onClick: () => go(scr), label: 'Passport ' + lb })}
      <div class="abs" style=${`left:${i * 78}px;bottom:25px;width:78px;height:14px;text-align:center;font-size:10px;letter-spacing:.3px;font-weight:${i === active ? 600 : 400};color:${i === active ? K.or : K.mute};cursor:pointer`} onClick=${() => go(scr)}>${lb}</div>`)}`;
}
export function Page(l, active, kids, id) {
  if (G.ppOpenSettings) { G.ppOpenSettings = false; setTimeout(() => openSettings(l), 0); }
  return html`<div>
    <style>${css()}</style>
    ${Header(l)}
    <div class="lz" data-t=${id} id=${id}>${UpdateNote()}${kids}</div>
    ${Nav(active)}
    ${Sheet(l)}${Confirm(l)}${Viewer(l)}
    ${PasswordDialog(l)}
  </div>`;
}
export const Sect = (t, link, onLink, id) => html`<div class="lst"><h2>${t}<i>.</i></h2><div class="ln"></div>${link ? html`<span class="lk" onClick=${onLink} data-t=${id}>${link}</span>` : null}</div>`;

/* ───────── saving ───────── */
export function canWrite() {
  if (DB.ppOk) return true;
  Notify('Passport needs the MansWell 3.2 Apps Script to save. Update Code.gs and deploy a new version (see README).', 'error');
  return false;
}
export const psave = (ch, action, detail) => guard(async () => { if (!canWrite()) return; await save({ ...ch, log: [{ AuAction: 'Passport · ' + action, AuRef: 'PASSPORT', AuDetail: detail || '' }] }); });
const UpdateNote = () => DB.ppOk ? null : html`<div class="lwarn">Passport is ready, but it can't save yet. Update the Apps Script to MansWell 3.2 and deploy a new version. The README has the steps.</div>`;

/* ───────── small pieces ───────── */
export const Flag = (iso, h = 18) => html`<img class="pfl" src=${P.flagUrl(iso)} loading="lazy" alt="" style=${`width:${Math.round(h * 4 / 3)}px;height:${h}px`} />`;
const ST_TXT = { visited: 'Visited', wish: 'Wishlist', none: 'Not yet', home: 'Home' };
export function StPill(iso) {
  const st = iso === P.homeIso() ? 'home' : P.status(iso), n = st === 'visited' ? P.tripsIn(iso).length : 0;
  return html`<span class=${'pst ' + st} data-t=${'st-' + iso}>${ST_TXT[st]}${n > 1 ? ' ×' + n : ''}</span>`;
}
export const plural = (n, w) => n + ' ' + (n === 1 ? w : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + (w === w.toUpperCase() ? 'IES' : 'ies') : w + (w === w.toUpperCase() ? 'S' : 's'));
export const tripLine = t => P.range(t.TrStart, t.TrEnd) + ' · ' + plural(P.daysOf(t), 'day') + (t.TrWith ? ' · ' + t.TrWith : '');
export const Seg = (opts, cur, set, id, dis) => html`<div class=${'pseg' + (dis ? ' dis' : '')} style=${`grid-template-columns:repeat(${opts.length},1fr)`}>${opts.map(([k, t]) => html`<span class=${cur === k ? 'on' : ''} data-t=${id + '-' + k} onClick=${() => !dis && set(k)}>${t}</span>`)}</div>`;

/* ───────── the map ───────── */
const MST = {};
const clampV = st => { st.z = Math.max(1, Math.min(st.z, 12)); const w = MAP_W / st.z, h = MAP_H / st.z; st.cx = Math.max(w / 2, Math.min(MAP_W - w / 2, st.cx)); st.cy = Math.max(h / 2, Math.min(MAP_H - h / 2, st.cy)); };
const vbOf = st => { const w = MAP_W / st.z, h = MAP_H / st.z; return [st.cx - w / 2, st.cy - h / 2, w, h].map(v => v.toFixed(1)).join(' '); };
export function focusMap(key, iso) {
  const st = MST[key] || (MST[key] = { z: 1, cx: MAP_W / 2, cy: MAP_H / 2 });
  const c = P.BY[iso]; if (!c) return;
  const pt = DOTS[iso] || centerOf(iso); if (!pt) return;
  st.z = Math.max(st.z, 3); st.cx = pt[0]; st.cy = pt[1]; clampV(st);
}
function centerOf(iso) {
  const d = SHAPES[iso]; if (!d) return null;
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}
/** The world map. o.live: pan, pinch, zoom and tap a country (o.onPick). o.sel: highlighted country. */
export function WorldMap(key, o = {}) {
  const st = MST[key] || (MST[key] = { z: 1, cx: MAP_W / 2, cy: MAP_H / 2 });
  const home = P.homeIso(), wc = WISHC(), none = K.light ? 'rgba(60,40,20,.13)' : ta(.13);
  const fill = iso => { if (iso === home) return K.light ? 'rgba(60,40,20,.45)' : ta(.55); const s = P.status(iso); return s === 'visited' ? K.or : s === 'wish' ? `url(#ph-${key})` : none; };
  const stroke = iso => (iso === o.sel ? (K.light ? '#000' : '#fff') : P.status(iso) === 'wish' ? wc : (K.light ? '#FFFDF8' : K.bg));
  const sw = iso => (iso === o.sel ? 1.6 : P.status(iso) === 'wish' ? 0.7 : 0.4) / Math.sqrt(st.z);
  const r = 4.2 / Math.sqrt(st.z);
  const ptrs = new Map(); let start = null, moved = 0;
  const svgOf = e => e.currentTarget;
  const down = e => { if (!o.live) return; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); start = { st: { ...st }, pts: [...ptrs.values()].map(p => [...p]) }; moved = 0; };
  const move = e => {
    if (!o.live || !ptrs.has(e.pointerId) || !start) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const svg = svgOf(e), rect = svg.getBoundingClientRect(), k = (MAP_W / start.st.z) / rect.width;
    const pts = [...ptrs.values()];
    if (pts.length >= 2 && start.pts.length >= 2) {
      const d0 = Math.hypot(start.pts[0][0] - start.pts[1][0], start.pts[0][1] - start.pts[1][1]) || 1, d1 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      st.z = start.st.z * d1 / d0; moved = 99;
    } else {
      const dx = pts[0][0] - start.pts[0][0], dy = pts[0][1] - start.pts[0][1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      st.cx = start.st.cx - dx * k; st.cy = start.st.cy - dy * k;
    }
    clampV(st); svg.setAttribute('viewBox', vbOf(st));
  };
  const up = e => {
    if (!o.live || !ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (!ptrs.size) {
      if (moved < 6) { const el = document.elementFromPoint(e.clientX, e.clientY), iso = el && el.getAttribute && el.getAttribute('data-iso'); if (iso && o.onPick) o.onPick(iso); }
      start = null; rerender();
    } else start = { st: { ...st }, pts: [...ptrs.values()].map(p => [...p]) };
  };
  const wheel = e => { if (!o.live) return; e.preventDefault(); st.z *= e.deltaY < 0 ? 1.25 : 0.8; clampV(st); rerender(); };
  const zoom = f => { st.z *= f; clampV(st); rerender(); };
  const tapStatic = e => { if (o.live || !o.onTap) return; o.onTap(); };
  const dots = Object.entries(DOTS).filter(([iso]) => P.BY[iso]);
  return html`<div class=${'pmap' + (o.live ? ' live' : '')} data-t=${'map-' + key} onClick=${tapStatic}>
    <svg viewBox=${vbOf(st)} style=${`height:${o.h || 180}px`} preserveAspectRatio="xMidYMid meet" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onWheel=${wheel}>
      <defs><pattern id=${'ph-' + key} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill=${wc + '30'}/><line x1="0" y1="0" x2="0" y2="5" stroke=${wc} stroke-width="2.2"/></pattern></defs>
      <path d=${OTHER} fill=${none} stroke=${K.light ? '#FFFDF8' : K.bg} stroke-width=${0.4 / Math.sqrt(st.z)} />
      ${Object.entries(SHAPES).map(([iso, d]) => html`<path key=${iso} d=${d} data-iso=${iso} fill=${fill(iso)} stroke=${stroke(iso)} stroke-width=${sw(iso)} />`)}
      ${dots.map(([iso, [x, y]]) => { const s = iso === home ? 'home' : P.status(iso); return html`<circle key=${'d' + iso} cx=${x} cy=${y} r=${s === 'none' ? r * 0.7 : r} data-iso=${iso} fill=${s === 'visited' ? K.or : s === 'wish' ? wc : s === 'home' ? ta(.6) : none} stroke=${iso === o.sel ? '#fff' : 'none'} stroke-width=${1.2 / Math.sqrt(st.z)} />`; })}
    </svg>
    ${o.live ? html`<div class="zb"><span onClick=${() => zoom(1.6)} data-t="zoomIn">+</span><span onClick=${() => zoom(1 / 1.6)} data-t="zoomOut">−</span><span onClick=${() => { st.z = 1; st.cx = MAP_W / 2; st.cy = MAP_H / 2; rerender(); }} style="font-size:12px" data-t="zoomReset">⤢</span></div>` : null}
  </div>`;
}
export const Legend = (s, extra) => html`<div class="pleg"><span><i style=${`background:${K.or}`}></i>Visited ${s ? s.n + s.extra : ''}</span><span><i style=${`background:${WISHC()}`}></i>Wishlist ${s ? s.wish : ''}</span><span><i style=${`background:${K.light ? 'rgba(60,40,20,.45)' : ta(.55)}`}></i>Home</span><span><i style=${`background:${K.light ? 'rgba(60,40,20,.13)' : ta(.13)}`}></i>Not yet</span>${extra || null}</div>`;

/* ───────── confirm ───────── */
export function confirmAsk(l, title, msg, label, run) { l.confirm = { title, msg, label, run }; rerender(); }
function Confirm(l) {
  const c = l.confirm; if (!c) return null;
  const close = () => { l.confirm = null; rerender(); };
  return html`<div class="pconf" data-t="confirm"><div class="dim" onClick=${close}></div><div class="bx"><b>${c.title}</b><p>${c.msg}</p>
    <div class="row"><button class="lbtn" style="flex:1;padding:12px" onClick=${close} data-t="confirmNo">Cancel</button><button class="lbtnd" style="flex:1" onClick=${() => { l.confirm = null; c.run(); rerender(); }} data-t="confirmYes">${c.label || 'Delete'}</button></div></div></div>`;
}

/* ───────── photo viewer ───────── */
export function openPhoto(l, ph, o = {}) {
  l.pview = { ph, o, src: null, err: '' }; rerender();
  PH.full(ph.PhId).then(s => { if (l.pview && l.pview.ph === ph) { l.pview.src = s; rerender(); } }).catch(e => { if (l.pview) { l.pview.err = e.message; rerender(); } });
}
function Viewer(l) {
  const v = l.pview; if (!v) return null;
  const close = () => { l.pview = null; rerender(); };
  const t = v.ph.PhTrip && P.trip(v.ph.PhTrip);
  const prev = v.src || PH.thumb(v.ph.PhId);
  return html`<div class="pview" data-t="viewer">
    <div class="top"><span onClick=${close} data-t="viewerClose">‹ Back</span><span style="font-size:12px;opacity:.8">${t ? t.TrName : ''}${v.ph.PhTaken ? ' · ' + P.fmtDay(v.ph.PhTaken) : ''}</span></div>
    <div class="im">${prev ? html`<img src=${prev} alt="" />` : html`<span style="color:#aaa;font-size:13px">${v.err || 'Loading…'}</span>`}</div>
    <div class="bt">
      ${t && v.o.cover !== false ? html`<button onClick=${() => { psave({ up: { PP_Trips: [{ ...t, TrCover: v.ph.PhId }] } }, 'Trip cover', t.TrName); close(); }} data-t="setCover">${t.TrCover === v.ph.PhId ? '✓ Cover' : 'Set as cover'}</button>` : null}
      ${v.o.onOpenTrip && t ? html`<button onClick=${() => { close(); v.o.onOpenTrip(t); }} data-t="openTrip">Open trip</button>` : null}
      ${v.o.del !== false ? html`<button class="d" data-t="photoDel" onClick=${() => confirmAsk(l, 'Delete this photo?', 'It is removed from the trip and moved to the bin in your Google Drive.', 'Delete', () => guard(async () => {
        if (!canWrite()) return;
        await PH.remove([v.ph.PhId]); await save({ del: { PP_Photos: [v.ph.PhId] }, up: t && t.TrCover === v.ph.PhId ? { PP_Trips: [{ ...t, TrCover: '' }] } : {}, log: [{ AuAction: 'Passport · Photo deleted', AuRef: 'PASSPORT', AuDetail: t ? t.TrName : '' }] }); close();
      }))}>Delete</button>` : null}
    </div></div>`;
}

/* ───────── pick a country ───────── */
export function openPick(l, o) {
  const f = { q: '' };
  openSheet(l, { title: o.title || 'Choose a country', body: () => {
    const list = P.search(f.q).filter(c => !o.filter || o.filter(c)).slice(0, 60);
    return html`<div class="psrch" style="margin:2px 0 10px"><input placeholder="Search countries" value=${f.q} onInput=${e => { f.q = e.target.value; rerender(); }} data-t="pickQ" /></div>
      <div>${list.length ? list.map(c => html`<div class="pcr" data-t=${'pick-' + c.iso} onClick=${() => o.onPick(c.iso)}>${Flag(c.iso, 20)}<div><div class="t">${c.name}</div><div class="s">${c.cont}${c.ex ? ' · territory' : ''}</div></div>${StPill(c.iso)}</div>`) : html`<div class="lempty">No country matches “${f.q}”.</div>`}</div>`;
  } });
}

/* ───────── one country ───────── */
export function openCountry(l, iso, o = {}) {
  const c = P.BY[iso]; if (!c) return;
  const f = { first: (P.place(iso) || {}).PlFirst || '' };
  openSheet(l, { title: '', body: () => {
    const st = P.status(iso), locked = P.byTrip(iso), pl = P.place(iso), ts = P.tripsIn(iso), home = iso === P.homeIso();
    const setSt = k => {
      if (locked || k === st) return;
      if (k === 'wish') { closeSheet(l); openWish(l, iso); return; }
      const row = { ...(pl || { PlIso: iso, PlPri: 'M', PlYear: 0, PlWhy: '', PlSee: '', PlNote: '', PlSeq: 0, PlPhoto: '', PlAdded: Today(), PlFirst: '' }), PlStatus: k === 'visited' ? 'been' : '' };
      psave({ up: { PP_Places: [row] } }, k === 'visited' ? 'Visited before' : 'Status cleared', c.name);
    };
    const first = P.firstVisit(iso);
    return html`<div data-t="country">
      <div style="display:flex;gap:14px;align-items:center">${Flag(iso, 46)}<div><div style="font:400 27px Georgia,serif;color:${K.text}" data-t="cName">${c.name}</div><div class="lsub" style="margin:0">${c.iso} · ${c.iso3}${c.num ? ' · ' + c.num : ''}${c.ex ? ' · territory' : ''}</div></div></div>
      <div class="lg2 r2 lfx" style="margin-top:14px">
        <div>${Cap('Capital')}<div class="lv">${c.cap || '—'}</div></div><div>${Cap('Currency')}<div class="lv" style="font-size:13.5px">${c.curName ? c.curName + ' · ' + c.cur : '—'}</div></div>
        <div>${Cap('Continent')}<div class="lv">${c.cont}</div></div><div>${Cap('First visit')}<div class="lv" data-t="cFirst">${first ? P.fmtMon(first) : '—'}</div></div></div>
      ${home ? html`<div class="lnote" style="margin-top:12px">This is your home country. It shows on the map but isn't counted. Change it in Passport settings.</div>` : html`
        <div style="margin-top:14px">${Seg([['visited', 'Visited'], ['wish', 'Wishlist'], ['none', 'Not yet']], st, setSt, 'cst', locked)}</div>
        <div class="lnote" style="margin-top:7px">${locked ? html`Visited because ${plural(ts.length, 'trip')} include${ts.length === 1 ? 's' : ''} ${c.name}. To change it, edit or delete ${ts.length === 1 ? 'that trip' : 'those trips'}.` : st === 'visited' ? 'Marked as visited before Passport, with no trip written up.' : st === 'wish' ? 'On your wishlist. Add a trip when you go and it moves to Visited by itself.' : 'Not visited yet.'}</div>
        ${st === 'visited' && !locked ? html`<div class="llab">First visit (optional)</div><input class="lin" type="month" value=${String(f.first).slice(0, 7)} data-t="cFirstIn" onChange=${e => { f.first = e.target.value ? e.target.value + '-01' : ''; psave({ up: { PP_Places: [{ ...pl, PlFirst: f.first }] } }, 'First visit', c.name); }} />` : null}`}
      ${pl && (pl.PlWhy || pl.PlSee || pl.PlNote) ? html`<div class="lfx" style="margin-top:12px">${Cap(st === 'wish' ? 'Why you want to go' : 'From your wishlist')}
        ${pl.PlWhy ? html`<div style="font-size:13.5px;margin-top:5px;color:${K.text}">${pl.PlWhy}</div>` : null}
        ${pl.PlSee ? html`<div class="ptags">${String(pl.PlSee).split('|').filter(Boolean).map(s => html`<i>${s}</i>`)}</div>` : null}
        ${pl.PlNote ? html`<div class="lnote" style="margin-top:6px">${pl.PlNote}</div>` : null}
        ${st === 'wish' ? html`<div style="margin-top:9px"><span class="lbtn o" onClick=${() => { closeSheet(l); openWish(l, iso); }} data-t="cEditWish">Edit wish</span></div>` : null}</div>` : null}
      ${ts.length ? html`<div class="lst" style="margin:18px 0 8px"><h2 style="font-size:19px">Your trips here<i>.</i></h2><div class="ln"></div><span class="lk">${ts.length}</span></div>
        <div class="lfx">${ts.map(t => { const cv = P.coverOf(t); return html`<div class="phl" onClick=${() => { closeSheet(l); openTrip(t.TrId); }} data-t=${'cTrip-' + t.TrId}><div class="im" style=${PH.bg(cv && cv.PhId, t.TrId)}></div><div><div class="t">${t.TrName}</div><div class="s">${tripLine(t)}</div></div><span style=${`color:${K.mute}`}>›</span></div>`; })}</div>` : null}
      ${home ? null : html`<button class="lbtnf" style="margin-top:16px" data-t="cAddTrip" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: [iso] }); }}>+ Add a trip to ${c.name}</button>`}
    </div>`;
  } });
}

/* ───────── a wish ───────── */
export function openWish(l, iso) {
  const c = P.BY[iso], pl = P.place(iso);
  const f = { pri: (pl && pl.PlPri) || 'M', year: pl && pl.PlYear ? String(pl.PlYear) : '', why: (pl && pl.PlWhy) || '', see: pl && pl.PlSee ? String(pl.PlSee).split('|').join(', ') : '', note: (pl && pl.PlNote) || '', busy: '' };
  const isWish = pl && pl.PlStatus === 'wish';
  openSheet(l, { title: (isWish ? 'Edit wish · ' : 'Add to wishlist · ') + c.name, body: () => html`<div data-t="wishForm">
      <div style="display:flex;gap:12px;align-items:center">${Flag(iso, 30)}<div><b style=${`font-size:16px;color:${K.text}`}>${c.name}</b><div class="lsub" style="margin:0">${c.cont}${c.cap ? ' · ' + c.cap : ''}</div></div></div>
      <div class="llab">Priority</div>${Seg([['H', 'High'], ['M', 'Medium'], ['L', 'Low']], f.pri, k => { f.pri = k; rerender(); }, 'wPri')}
      <div class="llab">Expected year</div><input class="lin" inputmode="numeric" placeholder="e.g. ${new Date().getFullYear() + 1}" value=${f.year} onInput=${e => { f.year = e.target.value.replace(/\D/g, '').slice(0, 4); }} data-t="wYear" />
      <div class="llab">Why you want to go</div><input class="lin" placeholder="Northern lights, food, a festival…" value=${f.why} onInput=${e => { f.why = e.target.value; }} data-t="wWhy" />
      <div class="llab">Places to see · separate with commas</div><input class="lin" placeholder="Reykjavík, Vík, Jökulsárlón" value=${f.see} onInput=${e => { f.see = e.target.value; }} data-t="wSee" />
      <div class="llab">Notes</div><textarea class="lin" placeholder="Best season, visa, ideas" value=${f.note} onInput=${e => { f.note = e.target.value; }} data-t="wNote"></textarea>
      ${pl && pl.PlPhoto ? html`<div class="llab">Inspiration photo</div><div style=${'height:120px;border-radius:12px;' + PH.bg(pl.PlPhoto, iso)}></div>` : null}
      ${DB.ppOk ? html`<div style="margin-top:10px"><label class="lbtn">${f.busy || (pl && pl.PlPhoto ? 'Change inspiration photo' : '+ Inspiration photo (optional)')}<input class="pfile" type="file" accept="image/*" onChange=${async e => {
        const file = e.target.files && e.target.files[0]; if (!file) return;
        const rows = await PH.upload([file], { trip: 'WISH:' + iso, folder: 'Wishlist', onStep: (i) => { f.busy = i ? 'Saving photo…' : ''; rerender(); } });
        if (rows[0]) { const base = P.place(iso) || { PlIso: iso, PlStatus: '', PlPri: f.pri, PlYear: 0, PlWhy: '', PlSee: '', PlNote: '', PlSeq: P.nextSeq(), PlAdded: Today(), PlFirst: '' }; psave({ up: { PP_Places: [{ ...base, PlPhoto: rows[0].PhId }] } }, 'Wish photo', c.name); }
      }} /></label></div>` : null}
    </div>`,
  saveLabel: isWish ? 'Save' : 'Add to wishlist',
  extra: isWish ? () => html`<button class="lbtn" style="padding:13px 14px;color:${K.red}" data-t="wRemove" onClick=${() => confirmAsk(l, 'Remove ' + c.name + ' from your wishlist?', 'Your notes for it are removed too.', 'Remove', () => { psave({ up: { PP_Places: [{ ...P.place(iso), PlStatus: '', PlWhy: '', PlSee: '', PlNote: '', PlYear: 0 }] } }, 'Wish removed', c.name); closeSheet(l); })}>Remove</button>` : null,
  onSave: () => {
    if (P.isVisited(iso)) { Notify(c.name + ' is already visited, so it can\'t be on the wishlist.', 'error'); return; }
    const y = Number(f.year) || 0; if (f.year && (y < 2000 || y > 2100)) { Notify('Enter a year like ' + (new Date().getFullYear() + 1) + '.', 'error'); return; }
    const cur = P.place(iso);
    const row = { PlIso: iso, PlStatus: 'wish', PlPri: f.pri, PlYear: y, PlWhy: f.why.trim(), PlSee: f.see.split(',').map(s => s.trim()).filter(Boolean).join('|'), PlNote: f.note.trim(), PlSeq: cur && cur.PlStatus === 'wish' && cur.PlSeq ? cur.PlSeq : P.nextSeq(), PlPhoto: (cur && cur.PlPhoto) || '', PlAdded: cur && cur.PlStatus === 'wish' && cur.PlAdded ? cur.PlAdded : Today(), PlFirst: (cur && cur.PlFirst) || '' };
    psave({ up: { PP_Places: [row] } }, isWish ? 'Wish edited' : 'Wish added', c.name); closeSheet(l);
  } });
}

/* ───────── add / edit a trip ───────── */
export function openTrip(id) { G.ppTrip = id; Navigate('scrPpTrip'); }
export function openTripEdit(l, t, preset = {}) {
  const stops = t ? P.stopsOf(t.TrId).map(s => ({ iso: s.StIso, days: s.StDays ? String(s.StDays) : '' })) : (preset.isos || []).map(iso => ({ iso, days: '' }));
  const f = { name: t ? t.TrName : '', start: t ? t.TrStart : '', end: t ? t.TrEnd : '', with: t ? t.TrWith : 'Solo', route: t ? t.TrRoute : '', desc: t ? t.TrDesc : '', mom: t ? t.TrMoments : '', notes: t ? t.TrNotes : '', stops, q: '' };
  const dur = () => (f.start && f.end && f.end >= f.start ? P.daysOf({ TrStart: f.start, TrEnd: f.end }) : 0);
  openSheet(l, { title: t ? 'Edit trip' : 'New trip', body: () => {
    const sug = f.q.trim() ? P.search(f.q).filter(c => !f.stops.some(s => s.iso === c.iso) && c.iso !== P.homeIso()).slice(0, 5) : [];
    const d = dur();
    return html`<div data-t="tripForm">
      <div class="llab" style="margin-top:4px">Trip name</div><input class="lin" placeholder="Indochina by land" value=${f.name} onInput=${e => { f.name = e.target.value; }} data-t="tName" />
      <div class="llab">Countries · in the order you went</div>
      ${f.stops.length ? html`<div class="lfx" style="padding:4px 12px">${f.stops.map((s, i) => html`<div class="pstop" data-t=${'stop-' + s.iso}>${Flag(s.iso, 18)}<div class="t">${P.BY[s.iso].name}</div>
        <input class="lin r" style="height:34px;font-size:13px" inputmode="numeric" placeholder="days" value=${s.days} onInput=${e => { s.days = e.target.value.replace(/\D/g, ''); }} data-t=${'stopDays-' + s.iso} />
        <span class="x" onClick=${() => { f.stops.splice(i, 1); rerender(); }} data-t=${'stopX-' + s.iso}>×</span></div>`)}</div>` : null}
      <div class="psrch" style="margin:8px 0 0"><input placeholder=${f.stops.length ? 'Add another country' : 'Search a country'} value=${f.q} onInput=${e => { f.q = e.target.value; rerender(); }} data-t="tCountryQ" /></div>
      ${sug.length ? html`<div class="psug">${sug.map(c => html`<div class="pcr" data-t=${'tAdd-' + c.iso} onClick=${() => { f.stops.push({ iso: c.iso, days: '' }); f.q = ''; rerender(); }}>${Flag(c.iso, 18)}<div><div class="t" style="font-size:13.5px">${c.name}</div><div class="s">${c.cont}</div></div>${StPill(c.iso)}</div>`)}</div>` : null}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div class="llab">From</div><input class="lin" type="date" value=${f.start} max=${Today()} onInput=${e => { f.start = e.target.value; if (!f.end || f.end < f.start) f.end = f.start; rerender(); }} data-t="tStart" /></div>
        <div><div class="llab">To</div><input class="lin" type="date" value=${f.end} min=${f.start} onInput=${e => { f.end = e.target.value; rerender(); }} data-t="tEnd" /></div></div>
      <div class="lnote" style="margin-top:6px" data-t="tDur">${d ? plural(d, 'day') + ' in total' + (f.stops.length > 1 ? '. Days per country are optional.' : '.') : 'The length is worked out from the dates.'}</div>
      <div class="llab">Who with</div>${Seg(P.WITH.map(w => [w, w]), f.with, k => { f.with = k; rerender(); }, 'tWith')}
      <div class="llab">Route (optional)</div><input class="lin" placeholder="Hanoi → Phnom Penh → Bangkok" value=${f.route} onInput=${e => { f.route = e.target.value; }} data-t="tRoute" />
      <div class="llab">The story</div><textarea class="lin" placeholder="What the trip was about" value=${f.desc} onInput=${e => { f.desc = e.target.value; }} data-t="tDesc"></textarea>
      <div class="llab">Memorable moments · one per line</div><textarea class="lin" placeholder=${'Sunrise at Angkor Wat\nNight train to Hanoi'} value=${f.mom} onInput=${e => { f.mom = e.target.value; }} data-t="tMom"></textarea>
      <div class="llab">My notes</div><textarea class="lin" placeholder="Visa, tips, what to do differently" value=${f.notes} onInput=${e => { f.notes = e.target.value; }} data-t="tNotes"></textarea>
      ${t ? null : html`<div class="lnote" style="margin-top:10px">Add photos on the trip page after saving.</div>`}
    </div>`;
  },
  saveLabel: t ? 'Save trip' : 'Save trip',
  onSave: () => {
    const name = f.name.trim();
    if (!name) return Notify('Give the trip a name.', 'error');
    if (!f.stops.length) return Notify('Add at least one country.', 'error');
    if (!f.start || !f.end) return Notify('Choose the dates.', 'error');
    if (f.end < f.start) return Notify('The trip ends before it starts.', 'error');
    if (f.start > Today()) return Notify('Journeys are trips you have taken. Put future trips on your Wishlist.', 'error');
    const d = dur(), sum = f.stops.reduce((s, x) => s + (Number(x.days) || 0), 0);
    if (sum > d) return Notify('The days per country add up to ' + sum + ', but the trip is ' + d + ' days.', 'error');
    const id = t ? t.TrId : newId('TR');
    const row = { TrId: id, TrName: name, TrStart: f.start, TrEnd: f.end, TrWith: f.with, TrDesc: f.desc.trim(), TrMoments: f.mom.trim(), TrNotes: f.notes.trim(), TrRoute: f.route.trim(), TrCover: t ? t.TrCover : '', TrAdded: t ? t.TrAdded : new Date().toISOString() };
    const keep = f.stops.map((s, i) => ({ StKey: id + '|' + s.iso, StTrip: id, StIso: s.iso, StDays: Number(s.days) || 0, StSeq: i + 1 }));
    const gone = t ? P.stopsOf(id).filter(s => !keep.some(k => k.StKey === s.StKey)).map(s => s.StKey) : [];
    psave({ up: { PP_Trips: [row], PP_Stops: keep }, del: gone.length ? { PP_Stops: gone } : {} }, t ? 'Trip edited' : 'Trip added', name + ' · ' + keep.map(k => k.StIso).join(', '));
    closeSheet(l);
    if (!t) openTrip(id);
  } });
}
/** Delete a trip (password): its photos go to the Drive bin, its countries go back to wishlist / not yet unless another trip has them. */
export function deleteTrip(l, t) {
  askPassword(l, 'delete ' + t.TrName + ' (' + plural(P.photosOf(t.TrId).length, 'photo') + ')', () => guard(async () => {
    if (!canWrite()) return;
    const ph = P.photosOf(t.TrId).map(p => p.PhId);
    if (ph.length) { if (!navigator.onLine) { Notify('Deleting a trip with photos needs the internet.', 'error'); return; } await PH.remove(ph); }
    await save({ del: { PP_Trips: [t.TrId], PP_Stops: P.stopsOf(t.TrId).map(s => s.StKey), PP_Photos: ph }, log: [{ AuAction: 'Passport · Trip deleted', AuRef: 'PASSPORT', AuDetail: t.TrName }] });
    go('scrPpJourneys');
  }));
}

/* ───────── settings ───────── */
export function openSettings(l) {
  const f = { home: P.homeIso() };
  openSheet(l, { title: 'Passport settings', body: () => html`<div data-t="ppSettings">
      <div class="llab" style="margin-top:4px">Home country</div>
      <select class="lin" value=${f.home} onChange=${e => { f.home = e.target.value; }} data-t="ppHome">${P.COUNTRIES.filter(c => !c.ex).map(c => html`<option value=${c.iso} selected=${c.iso === f.home}>${c.name}</option>`)}</select>
      <div class="lnote" style="margin-top:6px">Shown on the map, never counted as visited.</div>
      <div class="lfx" style="margin-top:14px"><div class="lnote"><b>Where your travel data lives.</b> In the same Google Sheet, in its own tabs (PP_…). Photos are saved privately in your Google Drive › <b>MansWell Passport</b>, one folder per trip. Passport never reads or changes your money.</div></div>
    </div>`,
  onSave: () => { psave({ up: { PP_Settings: [P.prow('home', f.home)] } }, 'Home country', P.BY[f.home].name); closeSheet(l); } });
}
export { P, PH, store };
