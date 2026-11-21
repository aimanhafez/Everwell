// MansWell — main page (v3.16 Maison). Logo, date + greeting, serif headline, four jewel room cards: Pocket (where money is recorded), Lens (where it is understood), more rooms to come.
// Pocket theme. Only reads data; the rooms open their own screens.
import { html, K, DB, NAV, Navigate, Notify, rerender, oa, VERSION, Today, PLABEL, PSTART, PEND, Year, Month, flowSplit, store, SYNC, SURFACE, HAIR, n2, fmtD, ta } from '../core.js';
import { syncNow } from '../shared.js';
import { SWEEP_ID } from '../sweep.js';
import { logoTile } from '../logo.js';
import { THEMES, THEME_ORDER, appTheme, setAppTheme } from '../theme.js';
import { G } from '../core.js';
import * as E from '../lens/engine.js';

const ICON = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/>',
  aperture: '<circle cx="12" cy="12" r="9"/><path d="m14.3 3.3-4.6 8M20.6 9.5h-9.2M18 18.6l-4.6-8M9.7 20.7l4.6-8M3.4 14.5h9.2M6 5.4l4.6 8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7h6M9 10.5h4"/>',
  images: '<rect x="3" y="5" width="14" height="12" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V9"/><circle cx="8" cy="9.5" r="1.5"/><path d="m3 15 4-4 4 4 2-2 4 4"/>',
  signin: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>'
};
const ic = (n, c, s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const SOON = [['Keep', 'Renewals, servicing and warranties', '#E9B949', 'bell']];
/* the four room cards: deep jewel gradients that follow the app theme (start, middle, end) */
const ROOMS = {
  ember: [['#1b1410', '#5a2a08', '#ff6a00'], ['#121418', '#2a3340', '#55708a'], ['#1e1216', '#5a2238', '#b04a6a'], ['#0c1a22', '#1d4c5c', '#3f8aa6']],
  ivory: [['#2a1513', '#5e221e', '#8c2f2a'], ['#1f2a24', '#35503f', '#6b8a6f'], ['#3a2a18', '#7a5a30', '#b8925a'], ['#16222e', '#2c4458', '#5d7d96']],
  sapphire: [['#1a1608', '#5a4a20', '#d4b676'], ['#0e1830', '#1e3260', '#3f5fa8'], ['#1a1028', '#3a2458', '#7a5aa8'], ['#08202a', '#14485a', '#2f8aa0']],
  rose: [['#3a1d27', '#7c2d4a', '#d6457a'], ['#2c2a3a', '#55456e', '#a07ab8'], ['#5a2440', '#b65a6e', '#f0a483'], ['#16323f', '#2a6a7d', '#6aa8c7']],
  graphite: [['#0e0e10', '#2c2c30', '#6a6a70'], ['#121214', '#303034', '#58585e'], ['#161618', '#38383c', '#7a7a80'], ['#0c0c0e', '#26262a', '#4e4e54']]
};
const grad = c => `background:linear-gradient(135deg,${c[0]},${c[1]} 60%,${c[2]})`;
const WDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const greet = h => h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
const RMx = v => (v < 0 ? '−' : '') + 'RM ' + n2(Math.abs(v));

const css = () => `
.mw{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;color:${K.text};background:${K.bg}}.mw::-webkit-scrollbar{display:none}
.mw .in{position:relative;padding:24px 24px 0}
.mw .top{display:flex;justify-content:space-between;align-items:center}
.mw .lg{display:flex;align-items:center;gap:11px}.mw .lg>span:last-child{font:400 23px/1 Georgia,'Times New Roman',serif;letter-spacing:-.2px}.mw .lg i{color:${K.or};font-style:normal}
.mw .gear{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1px ${K.line};cursor:pointer}
.mw .k{font-size:10px;font-weight:600;letter-spacing:2.6px;text-transform:uppercase}
.mw .dt{margin-top:36px;color:${K.sub}}.mw .gr{margin-top:8px;color:${K.or}}
.mw h1{margin:12px 0 0;font:400 41px/1.04 Georgia,'Times New Roman',serif;letter-spacing:-.4px}.mw h1 i{color:${K.or}}
.mw .rule{display:flex;align-items:center;gap:10px;margin-top:20px;color:${K.mute};cursor:pointer}
.mw .rule>b{flex:1;height:1px;background:linear-gradient(90deg,${K.or},transparent)}
.mw .sync{font-size:10.5px;letter-spacing:.4px;display:flex;align-items:center;gap:6px;color:${K.sub}}.mw .sync i{width:6px;height:6px;border-radius:50%;background:var(--sc)}
.mw .list{position:relative;padding:20px 16px 0;display:flex;flex-direction:column;gap:10px}
.mw .rm{position:relative;border-radius:22px;overflow:hidden;height:106px;padding:18px 20px;display:flex;flex-direction:column;justify-content:flex-end;color:#fff;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,${K.light ? '.14' : '.35'});animation:mwUp .5s cubic-bezier(.2,.7,.2,1) both;transition:transform .15s}
.mw .rm:active{transform:scale(.985)}
.mw .rm .no{position:absolute;top:16px;left:20px;font:italic 12px Georgia,serif;opacity:.8}
.mw .rm .ar{position:absolute;top:14px;right:16px;width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45);display:grid;place-items:center;line-height:0}
.mw .rm h4{margin:0;font:400 27px/1 Georgia,'Times New Roman',serif}.mw .rm p{margin:6px 0 0;font-size:11px;opacity:.84;letter-spacing:.2px}
@keyframes mwUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.mw .keep{margin:12px 16px 0;padding:12px 4px calc(28px + env(safe-area-inset-bottom,0px));display:flex;justify-content:space-between;align-items:center;color:${K.mute};border-top:1px solid ${K.line};cursor:pointer}
.mw .keep span:first-child{font:italic 13px Georgia,serif}.mw .keep .k{letter-spacing:2px;font-size:9.5px}
`;
function syncedText() {
  if (SYNC.outbox.length) return navigator.onLine ? 'Saving to Google…' : 'Offline · will sync';
  const at = store.get('ew_cache_at', null); if (!at) return 'Tap to sync';
  const m = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  return m < 1 ? 'Synced just now' : m < 60 ? 'Synced ' + m + ' min ago' : m < 1440 ? 'Synced ' + Math.round(m / 60) + ' h ago' : 'Synced ' + fmtD(at.slice(0, 10), 'dd mmm');
}

/* Main page settings: the app theme (whole app) and the way into Pocket's settings. */
let panel = false;
const close = () => { panel = false; rerender(); };
function Settings() {
  const cur = appTheme();
  return html`<div class="mset" data-t="mainSheet"><style>${setCss()}</style>
    <div class="dimx" onClick=${close}></div>
    <div class="pnl"><div class="hd"><b>Settings</b><span onClick=${close} data-t="mainSheetClose">Close</span></div>
      <div class="cap2">APPEARANCE · WHOLE APP</div>
      <div class="ths">${THEME_ORDER.map(k => { const t = THEMES[k], c = { ...THEMES.ember.K, ...t.K, ...(k === 'ember' ? { bg: '#0D0F12', card: '#16191E', text: '#F4F2EE', sub: '#9AA0A8', or: '#FF6A00', line: '#262A31' } : {}) }, on = cur === k;
        return html`<div class=${'th' + (on ? ' on' : '')} onClick=${() => { setAppTheme(k); rerender(); }} data-t=${'th-' + k}>
          <div class="sw" style=${`background:${c.bg};box-shadow:inset 0 0 0 1px ${c.line}`}><div style=${`font:600 13px Georgia,serif;color:${c.text}`}>M<span style=${`color:${c.or}`}>.</span></div>
            <div style=${`margin-top:5px;height:16px;border-radius:5px;background:${c.card};box-shadow:inset 0 0 0 1px ${c.line};display:flex;align-items:center;gap:4px;padding:0 5px`}><i style=${`width:18px;height:4px;border-radius:2px;background:${c.sub}`}></i><i style=${`width:12px;height:4px;border-radius:2px;background:${c.or}`}></i></div></div>
          <div class="tt"><b>${t.name}</b><span>${t.note}</span></div><span class="ck">${on ? '✓' : ''}</span></div>`; })}</div>
      <div class="row2" onClick=${() => { panel = false; Navigate('scrMore'); }} data-t="mainPocketSettings"><div><b>Pocket settings</b><span>Accounts, categories, tracking period, backup</span></div><em>›</em></div>
      <div class="row2" onClick=${() => { panel = false; NAV.stack = []; Navigate('scrLensSettings'); }} data-t="mainLensSettings"><div><b>Lens settings</b><span>Opening balances, savings rule, status levels</span></div><em>›</em></div>
      <div class="row2" onClick=${() => { panel = false; G.ppOpenSettings = true; NAV.stack = []; Navigate('scrPpOverview'); }} data-t="mainPassportSettings"><div><b>Atlas settings</b><span>Home country, where your photos are kept</span></div><em>›</em></div>
      <div class="ft" data-t="mainVersion">Live well today. Build well for tomorrow.<small>MANSWELL · V${VERSION}</small></div>
    </div></div>`;
}
const setCss = () => `.mset{position:fixed;inset:0;z-index:70}.mset .dimx{position:absolute;inset:0;background:rgba(0,0,0,.55)}
.mset .pnl{position:absolute;left:0;right:0;bottom:0;max-height:88%;overflow-y:auto;background:${K.panel};border-radius:22px 22px 0 0;padding:16px 18px calc(env(safe-area-inset-bottom,0px) + 22px);box-shadow:inset 0 1px 0 ${ta(.08)};color:${K.text}}
.mset .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}.mset .hd b{font-size:18px}.mset .hd span{color:${K.sub};font-size:14px;cursor:pointer;padding:6px}
.mset .cap2{font-size:10px;font-weight:700;letter-spacing:1.6px;color:${K.sub};margin:12px 0 8px}
.mset .ths{display:flex;flex-direction:column;gap:9px}
.mset .th{display:grid;grid-template-columns:78px 1fr 20px;gap:12px;align-items:center;padding:9px;border-radius:14px;box-shadow:inset 0 0 0 1px ${K.line};cursor:pointer}
.mset .th.on{box-shadow:inset 0 0 0 1.5px ${K.or};background:${K.orTint}}
.mset .sw{height:52px;border-radius:10px;padding:7px 8px}
.mset .tt b{display:block;font-size:14px}.mset .tt span{display:block;font-size:11.5px;color:${K.sub};margin-top:2px;line-height:1.35}
.mset .ck{color:${K.or};font-weight:700;font-size:16px}
.mset .row2{display:flex;justify-content:space-between;align-items:center;padding:14px 4px;border-top:1px solid ${K.sep};cursor:pointer;margin-top:6px}
.mset .row2 b{display:block;font-size:14.5px}.mset .row2 span{display:block;font-size:11.5px;color:${K.sub};margin-top:2px}.mset .row2 em{font-style:normal;color:${K.or};font-size:20px}
.mset .ft{text-align:center;padding:22px 0 4px;font:italic 12.5px Georgia,serif;color:${K.mute};border-top:1px solid ${K.sep};margin-top:6px}.mset .ft small{display:block;margin-top:6px;font:600 9.5px -apple-system,sans-serif;letter-spacing:2px;color:${K.mute}}`;

export const scrDreamer = {
  view() {
    const openPocket = () => { NAV.stack = []; Navigate('scrHome'); };
    const openLens = () => { NAV.stack = []; Navigate('scrLensPnl'); };
    const openPassport = () => { NAV.stack = []; Navigate('scrPpOverview'); };
    const openLogbook = () => { NAV.stack = []; Navigate('scrLbJourneys'); };
    const soon = () => Notify('More rooms are on the way.', 'info');
    const now = new Date(), pal = ROOMS[appTheme()] || ROOMS.ember, busy = SYNC.outbox.length;
    const room = (i, t, n, sub, fn, id) => html`<div class="rm" style=${grad(pal[i]) + `;animation-delay:${80 + i * 70}ms`} data-t=${id} role="button" aria-label=${n} onClick=${fn}>
        <span class="no">0${i + 1}</span><span class="ar" dangerouslySetInnerHTML=${{ __html: ic('arrow', '#fff', 13) }}></span><h4>${n}</h4><p>${sub}</p></div>`;
    return html`<div class="mw" data-t="dreamerMain">
      <style>${css()}</style>
      <div class="in">
        <div class="top"><div class="lg"><span dangerouslySetInnerHTML=${{ __html: logoTile(36, 10) }}></span><span>MansWell<i>.</i></span></div>
          <div class="gear" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => { panel = true; rerender(); }} dangerouslySetInnerHTML=${{ __html: ic('gear', K.sub, 17) }}></div></div>
        <div class="k dt" data-t="mainDate">${WDAY[now.getDay()]} · ${now.getDate()} ${MON[now.getMonth()]}</div>
        <div class="k gr" data-t="mainGreet">${greet(now.getHours())}, Aiman</div>
        <h1>All your dreams,<br/><i>one door.</i></h1>
        <div class="rule" data-t="mainSync" onClick=${() => syncNow()}><b></b><span class="sync" style=${'--sc:' + (busy ? (navigator.onLine ? K.gold : K.mute) : '#3DBE84')}><i></i>${syncedText()}</span></div>
      </div>
      <div class="list">
        ${room(0, 'p', 'Pocket', 'Accounts · transactions · sweep', openPocket, 'mod-pocket')}
        ${room(1, 'l', 'Lens', 'P&L · savings · plan · budget', openLens, 'mod-lens')}
        ${room(2, 'a', 'Atlas', 'Odyssey · journeys · wanderlist', openPassport, 'mod-passport')}
        ${room(3, 'v', 'Voyage', 'Itinerary · expenses · discovery', openLogbook, 'mod-logbook')}
      </div>
      ${SOON.map(([n], i) => html`<div class="keep" data-t=${'mod-soon-' + (i + 1)} role="button" aria-label="Coming soon" onClick=${soon}><span>0${5 + i} · ${n}</span><span class="k">Soon</span></div>`)}
      ${panel ? Settings() : null}
    </div>`;
  }
};
