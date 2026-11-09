// MansWell · Lens UI kit: Pocket's header, cards and bottom bar, plus sheets and inputs for Lens forms.
import { html, K, NAV, DB, I, L, R, Brand, Navigate, rerender, save, Notify, guard, SURFACE, HAIR, n0, n2 } from '../core.js';
import { syncNow, PasswordDialog } from '../shared.js';

export const CSS = `
.lz{position:absolute;left:0;top:70px;width:390px;bottom:78px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:18px}
.lz::-webkit-scrollbar{display:none}
.lz *{box-sizing:border-box}
.lst{display:flex;align-items:center;gap:12px;margin:22px 16px 12px}
.lst h2{margin:0;font:400 23px Georgia,"Times New Roman",serif;white-space:nowrap;color:${K.text}}.lst h2 i{color:${K.or};font-style:normal}
.lst .ln{flex:1;height:1px;background:linear-gradient(90deg,rgba(255,106,0,.55),rgba(255,106,0,0))}
.lst .lk{font-size:12.5px;font-weight:600;color:${K.or};white-space:nowrap;cursor:pointer}
.lc{margin:0 12px 12px;background:${SURFACE};box-shadow:inset 0 0 0 1px ${HAIR},inset 0 1px 0 rgba(255,255,255,.035);border-radius:16px;padding:16px;position:relative}
.lh{background:radial-gradient(260px 200px at 100% 0%,rgba(255,106,0,.30),transparent 70%),linear-gradient(135deg,#23272E,#121418);box-shadow:inset 0 0 0 1px #2C3038}
.lcap{font-size:10px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:${K.sub}}
.lpill{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.8px;color:${K.or};background:rgba(255,106,0,.1);border:1px solid rgba(255,106,0,.45);border-radius:99px;padding:4px 10px;white-space:nowrap}
.lpill.red{color:${K.red};background:rgba(229,72,77,.1);border-color:rgba(229,72,77,.5)}
.lbig{font-size:31px;font-weight:700;letter-spacing:-.3px;margin-top:6px;color:${K.text}}
.lbig small{font-size:15px;color:${K.sub};font-weight:500}
.lsub{font-size:12px;color:${K.sub};margin-top:4px;line-height:1.4}
.lup{color:${K.grn}}.ldn{color:${K.red}}.lgd{color:${K.gold}}.lmu{color:${K.mute}}.lor{color:${K.or}}
.lhr{height:1px;background:${K.sep};margin:14px 0}
.lg2{display:grid;grid-template-columns:1fr 1fr}.lg2>div+div{padding-left:14px;border-left:1px solid ${K.sep}}
.lg2>div:nth-child(3){padding-left:0;border-left:0}
.lg2.r2>div:nth-child(n+3){padding-top:12px;margin-top:12px;border-top:1px solid ${K.sep}}
.lv{font-size:15.5px;font-weight:600;margin-top:5px;color:${K.text}}.lv small{font-size:11px;color:${K.sub};font-weight:500;margin-left:4px}
.lsel{display:flex;align-items:center;justify-content:space-between;padding:12px 14px}
.lcb{width:36px;height:36px;border-radius:50%;background:${K.field};box-shadow:inset 0 0 0 1px ${HAIR};display:grid;place-items:center;cursor:pointer;color:${K.text}}
.lcb svg{width:16px;height:16px}
.lsel .t{text-align:center}.lsel .t b{display:block;font-size:20px;font-weight:500}.lsel .t span{font-size:11.5px;color:${K.sub}}
.lr{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 0;border-top:1px solid ${K.sep}}
.lr:first-child{border-top:0;padding-top:2px}
.lr .t{font-size:14.5px;font-weight:600;color:${K.text}}.lr .s{font-size:11.5px;color:${K.sub};margin-top:3px;line-height:1.35}
.lr .r{text-align:right;font-size:14px;font-weight:600}.lr .r small{display:block;font-size:11px;font-weight:500;margin-top:3px}
.lr.tap:active{background:rgba(255,255,255,.03)}
.lib{width:36px;height:36px;border-radius:50%;background:rgba(255,106,0,.1);display:grid;place-items:center;color:${K.or}}
.lib svg{width:18px;height:18px}
.lchip{display:inline-block;font-size:9.5px;font-weight:700;letter-spacing:.6px;padding:3px 8px;border-radius:99px;text-transform:uppercase;white-space:nowrap}
.c-grn{color:${K.grn};background:rgba(52,199,123,.12)}.c-gold{color:${K.gold};background:rgba(233,185,73,.12)}.c-red{color:${K.red};background:rgba(229,72,77,.12)}.c-mu{color:${K.sub};background:${K.field}}.c-or{color:${K.or};background:rgba(255,106,0,.12)}
.lbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:10px;box-shadow:inset 0 0 0 1px #2C3038;color:${K.text};cursor:pointer;white-space:nowrap;background:transparent;border:0;font-family:inherit}
.lbtn.o{box-shadow:inset 0 0 0 1px rgba(255,106,0,.5);color:${K.or}}.lbtn.on{background:rgba(255,106,0,.12)}
.lbtn svg{width:15px;height:15px}
.lbtnf{display:block;width:100%;text-align:center;font-size:15px;font-weight:700;padding:14px;border-radius:23px;background:${K.or};color:#fff;cursor:pointer;border:0;font-family:inherit}
.lbtnd{display:block;width:100%;text-align:center;font-size:14.5px;font-weight:700;padding:12px;border-radius:12px;box-shadow:inset 0 0 0 1px rgba(229,72,77,.55);color:${K.red};cursor:pointer;background:transparent;border:0;font-family:inherit}
.lnote{font-size:11.5px;line-height:1.5;color:${K.sub}}.lnote b{color:${K.text};font-weight:600}.lnote b.lup{color:${K.grn}}.lnote b.lgd{color:${K.gold}}.lnote b.ldn{color:${K.red}}
.lbar{height:6px;border-radius:3px;background:${K.field};overflow:hidden}.lbar i{display:block;height:100%;border-radius:3px}
.lfx{background:#1A1E24;box-shadow:inset 0 0 0 1px ${K.line};border-radius:12px;padding:12px}
.lin{width:100%;height:40px;border:0;outline:none;border-radius:10px;padding:0 12px;background:${K.field};color:${K.text};font-size:15px;font-weight:600;font-family:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07);-webkit-appearance:none;appearance:none}
.lin:focus{box-shadow:inset 0 0 0 1px ${K.or}}
.lin.r{text-align:right}.lin:disabled{opacity:.55}
select.lin{padding-right:30px;background-image:linear-gradient(45deg,transparent 50%,${K.sub} 50%),linear-gradient(135deg,${K.sub} 50%,transparent 50%);background-position:calc(100% - 16px) 18px,calc(100% - 11px) 18px;background-size:5px 5px;background-repeat:no-repeat}
.llab{font-size:10px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${K.sub};margin:14px 0 6px}
.lchk{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;flex:none;box-shadow:inset 0 0 0 1.5px #3A3F47}.lchk.on{background:${K.or};box-shadow:none}.lchk.red.on{background:${K.red}}
.lchk svg{width:14px;height:14px;color:#fff}
.lsw{width:46px;height:28px;border-radius:99px;background:#626872;position:relative;flex:none;cursor:pointer}.lsw i{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .15s}.lsw.on{background:${K.or}}.lsw.on i{transform:translateX(18px)}
.lempty{text-align:center;padding:26px 10px;color:${K.sub};font-size:13px;line-height:1.5}
.lwarn{margin:0 12px 12px;padding:12px 14px;border-radius:12px;background:rgba(233,185,73,.08);box-shadow:inset 0 0 0 1px rgba(233,185,73,.3);font-size:12px;line-height:1.45;color:#E8D5A6}
/* sheet */
.lsh{position:absolute;inset:0;z-index:45}.lsh .dim{position:absolute;inset:0;background:rgba(0,0,0,.62)}
.lsh .pnl{position:absolute;left:0;right:0;bottom:0;max-height:86%;display:flex;flex-direction:column;background:#15181D;border-radius:22px 22px 0 0;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)}
.lsh .hd{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 10px}
.lsh .hd b{font-size:17px;font-weight:600}.lsh .hd span{cursor:pointer;color:${K.sub};font-size:14px;padding:6px}
.lsh .bd{overflow-y:auto;padding:0 18px 12px;-webkit-overflow-scrolling:touch}
.lsh .ft{padding:12px 18px 28px;display:flex;gap:10px;box-shadow:inset 0 1px 0 ${K.sep}}
/* statement */
.ltw{overflow-x:auto;overflow-y:hidden;margin:0 -16px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.ltw::-webkit-scrollbar{display:none}
.ltbl{border-collapse:separate;border-spacing:0;font-size:11.5px;color:${K.text}}
.ltbl td,.ltbl th{padding:6px 7px;text-align:right;white-space:nowrap;border-top:1px solid ${K.sep}}
.ltbl th{font-size:10px;font-weight:600;letter-spacing:1px;color:${K.sub};border-top:0;padding-bottom:8px;text-transform:uppercase}
.ltbl td:first-child,.ltbl th:first-child{text-align:left;padding-left:16px;position:sticky;left:0;z-index:1;background:#171A1F;max-width:136px;min-width:136px;overflow:hidden;text-overflow:ellipsis;box-shadow:6px 0 8px -6px rgba(0,0,0,.7)}
.ltbl td:last-child,.ltbl th:last-child{padding-right:16px}
.ltbl .sec td{font-size:9.5px;font-weight:700;letter-spacing:1.2px;color:${K.or};padding-top:14px;border-top:0;text-transform:uppercase}
.ltbl .tot td{font-weight:700;border-top:1px solid #2E333B}.ltbl .gp td{font-weight:600}
.ltbl .key td{font-weight:700;font-size:12.5px;background:rgba(255,106,0,.05)}.ltbl .key td:first-child{background:#1D1B1A}
.ltbl td.hi{background:rgba(255,106,0,.16);color:#FFB27A;border-radius:4px}
.ltbl td.cur,.ltbl th.cur{background:rgba(255,255,255,.03)}
.ltbl td.ytd,.ltbl th.ytd{border-left:1px solid #2E333B;font-weight:700}
.ltbl .more td{color:${K.or};font-weight:600;cursor:pointer}
.ldot{display:inline-block;width:6px;height:6px;border-radius:50%;margin-left:4px;vertical-align:1px}
`;
export const STC = { grn: K.grn, grn2: K.grn, gold: K.gold, red: K.red };
export const chipCls = c => ({ grn: 'c-grn', grn2: 'c-grn', gold: 'c-gold', red: 'c-red' })[c] || 'c-mu';
export const svgI = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">${ICONS[name] || ''}</svg>`;
const ICONS = {
  left: '<path d="M15 4 7 12l8 8"/>', right: '<path d="m9 4 8 8-8 8"/>', check: '<path d="m5 12.5 4.5 4.5L19 7"/>', plus: '<path d="M12 4v16M4 12h16"/>',
  excel: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 8 8 8M16 8l-8 8"/>', expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};
export const iconHtml = (name, c, s = 20) => html`<span style=${`display:inline-flex;width:${s}px;height:${s}px;color:${c || 'currentColor'}`} dangerouslySetInnerHTML=${{ __html: svgI(name) }}></span>`;
export const pIcon = (name, c, s = 18) => html`<span style=${`display:inline-flex;width:${s}px;height:${s}px;color:${c || 'currentColor'}`} dangerouslySetInnerHTML=${{ __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">${PICON[name] || ''}</svg>` }}></span>`;
const PICON = {
  shield: '<path d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>', card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.6 12 20 12 20z"/>', umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>', link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>', signal: '<rect x="8" y="2.5" width="8" height="19" rx="4"/><circle cx="12" cy="7.5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="16.5" r="1.4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/>',
  excel: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7"/>', table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 10v10"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M3 11v4c0 1.7 2.7 3 6 3 1.1 0 2.2-.2 3-.5"/><ellipse cx="16" cy="14" rx="5" ry="2.6"/><path d="M11 14v3.4c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V14"/>'
};

/* money */
export const W0 = v => (v < 0 ? '−' : '') + 'RM ' + n0(Math.abs(v));
export const W2 = v => (v < 0 ? '−' : '') + 'RM ' + n2(Math.abs(v));
export const acc = (v, out) => { const x = out ? -v : v; if (Math.round(x) === 0) return html`<span class="lmu">–</span>`; return x < 0 ? '(' + n0(-x) + ')' : n0(x); };
export const pctTxt = r => (r === null || r === undefined ? '–' : (r < 0 ? '−' : '') + Math.abs(r).toFixed(1) + '%');

/* page chrome */
const TABS = [['Chart', 'P&L', 'scrLensPnl'], ['Coins', 'Assets', 'scrLensAssets'], ['Compass', 'Plan', 'scrLensPlan'], ['Calculator', 'Budget', 'scrLensBudget'], ['Settings', 'Settings', 'scrLensSettings']];
export const goHome = () => { NAV.stack = []; Navigate('scrDreamer'); };
export function LensHeader(onGuide) {
  return html`
    ${Brand(18, 18, 276, 44, false, false, 'Lens', goHome)}
    ${onGuide ? I(258, 20, 36, 36, 'Guide', K.sub, { pad: 9, onClick: onGuide, label: 'Guide' }) : null}
    ${I(298, 20, 36, 36, 'Grid', K.sub, { pad: 9, onClick: goHome, label: 'MansWell' })}
    ${I(338, 20, 36, 36, 'Reset', K.sub, { pad: 9, onClick: () => syncNow(), label: 'Refresh' })}`;
}
export function LensNav(active) {
  return html`
    <div class="navbar-glass"></div>
    ${R(28 + active * 78, { b: 75 }, 22, 3, K.or, { r: 2, st: 'box-shadow:0 0 12px rgba(255,106,0,0.55);' })}
    ${TABS.map(([ic, lb, scr], i) => html`
      ${I(26 + i * 78, { b: 41 }, 26, 26, ic, i === active ? K.or : K.mute, { pad: 4, onClick: () => Navigate(scr), label: 'Lens ' + lb })}
      ${L(i * 78, { b: 25 }, 78, 14, lb, { s: 7.5, c: i === active ? K.or : K.mute, w: i === active ? 6 : 4, a: 'c', ls: 0.3, onClick: () => Navigate(scr) })}`)}`;
}
export function Page(l, active, kids, id, onGuide) {
  return html`<div>
    <style>${CSS}</style>
    ${LensHeader(onGuide)}
    <div class="lz" data-t=${id} id=${id}>${kids}</div>
    ${LensNav(active)}
    ${Sheet(l)}
    ${PasswordDialog(l)}
  </div>`;
}
export const Sect = (t, link, onLink, id) => html`<div class="lst"><h2>${t}<i>.</i></h2><div class="ln"></div>${link ? html`<span class="lk" onClick=${onLink} data-t=${id}>${link}</span>` : null}</div>`;
export const Cap = t => html`<span class="lcap">${t}</span>`;
export const Check = (on, red) => html`<span class=${'lchk' + (on ? ' on' : '') + (red ? ' red' : '')} dangerouslySetInnerHTML=${{ __html: on ? svgI('check') : '' }}></span>`;
export const Switch = (on, onClick, id) => html`<span class=${'lsw' + (on ? ' on' : '')} onClick=${onClick} data-t=${id} role="switch" aria-checked=${on}><i></i></span>`;

/* sheet (bottom panel) */
export function openSheet(l, s) { l.sheet = s; rerender(); }
export function closeSheet(l) { l.sheet = null; rerender(); }
export function Sheet(l) {
  const s = l.sheet; if (!s) return null;
  return html`<div class="lsh" data-t="sheet">
    <div class="dim" onClick=${() => closeSheet(l)}></div>
    <div class="pnl">
      <div class="hd"><b>${s.title}</b><span onClick=${() => closeSheet(l)} data-t="sheetClose">Close</span></div>
      <div class="bd">${s.body()}</div>
      ${s.onSave || s.extra ? html`<div class="ft">${s.extra ? s.extra() : null}${s.onSave ? html`<button class="lbtnf" style="flex:1" data-t="sheetSave" onClick=${() => s.onSave()}>${s.saveLabel || 'Save'}</button>` : null}</div>` : null}
    </div></div>`;
}

/* writes: blocked (with a clear note) until the Apps Script is v3 */
export function canWrite() {
  if (DB.lnOk) return true;
  Notify('Lens needs the MansWell 3.0 Apps Script to save. Update Code.gs and deploy a new version (see README).', 'error');
  return false;
}
export const lsave = (ch, action, detail) => guard(async () => { if (!canWrite()) return; await save({ ...ch, log: [{ AuAction: 'Lens · ' + action, AuRef: 'LENS', AuDetail: detail || '' }] }); });
export const UpdateNote = () => DB.lnOk ? null : html`<div class="lwarn">Lens can read your Pocket data, but it can't save its own data yet. Update the Apps Script to MansWell 3.0 and deploy a new version. The README has the steps.</div>`;
export const num = t => { const v = Number(String(t ?? '').replace(/[, ]/g, '')); return isFinite(v) ? v : 0; };
export const newId = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
