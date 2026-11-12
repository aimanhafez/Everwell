// MansWell — main page (v3.0.2). One door, rooms as full-width cards: Pocket (where money is recorded), Lens (where it is understood), more rooms to come.
// Pocket theme. Only reads data; the rooms open their own screens.
import { html, K, DB, NAV, Navigate, Notify, rerender, oa, VERSION, Today, PLABEL, PSTART, PEND, Year, Month, flowSplit, store, SYNC, SURFACE, HAIR, n2, fmtD, ta } from '../core.js';
import { syncNow } from '../shared.js';
import { SWEEP_ID } from '../sweep.js';
import { logoTile } from '../logo.js';
import { THEMES, THEME_ORDER, appTheme, setAppTheme } from '../theme.js';
import * as E from '../lens/engine.js';

const ICON = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/>',
  aperture: '<circle cx="12" cy="12" r="9"/><path d="m14.3 3.3-4.6 8M20.6 9.5h-9.2M18 18.6l-4.6-8M9.7 20.7l4.6-8M3.4 14.5h9.2M6 5.4l4.6 8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  images: '<rect x="3" y="5" width="14" height="12" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V9"/><circle cx="8" cy="9.5" r="1.5"/><path d="m3 15 4-4 4 4 2-2 4 4"/>',
  signin: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>'
};
const ic = (n, c, s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const SOON = [['Roaming', 'Trips, past and future', '#5AA8FF', 'plane'], ['Memories', 'Places and moments kept', '#FF6FAE', 'images']];
const RMx = v => (v < 0 ? '−' : '') + 'RM ' + n2(Math.abs(v));

const css = () => `
.mw{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;color:${K.text}}.mw::-webkit-scrollbar{display:none}
.mw .glow{position:absolute;left:0;right:0;top:0;height:440px;background:${K.light ? `radial-gradient(120% 90% at 85% 0%,${K.glow},transparent 70%)` : K.mainGlow ? K.mainGlow : `linear-gradient(180deg,#2B1508 0%,rgba(13,15,18,.55) 72%,${K.bg} 100%)`};pointer-events:none}
.mw .glow::after{content:"";position:absolute;inset:0;background-image:linear-gradient(${oa(.05)} 1px,transparent 1px),linear-gradient(90deg,${oa(.05)} 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 92%);mask-image:linear-gradient(180deg,#000,transparent 92%)}
.mw .in{position:relative;padding:22px 20px 30px}
.mw .top{display:flex;justify-content:space-between;align-items:center}
.mw .lg{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;letter-spacing:-.3px}.mw .lg i{color:${K.or};font-style:normal}
.mw .gear{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:${ta(.04)};box-shadow:inset 0 0 0 1px ${ta(.08)};cursor:pointer}
.mw .pill{display:inline-flex;align-items:center;gap:8px;margin-top:30px;padding:6px 12px;border-radius:99px;background:${K.light ? ta(.05) : 'rgba(0,0,0,.35)'};box-shadow:inset 0 0 0 1px ${ta(.09)};font-size:11px;color:${K.sub};cursor:pointer}
.mw .pill b{width:6px;height:6px;border-radius:50%;background:${K.or};box-shadow:0 0 8px ${K.or}}
.mw h1{margin:16px 0 0;font-size:34px;line-height:1.12;font-weight:700;letter-spacing:-.8px}.mw h1 span{color:${K.or}}
.mw .lead{margin-top:14px;font-size:16px;line-height:1.5;color:${K.sub}}
.mw .cta{display:inline-flex;align-items:center;gap:10px;margin-top:22px;padding:11px 18px;border-radius:12px;background:${K.or};color:${K.ctaText || K.onAcc};font-weight:600;font-size:14.5px;cursor:pointer}
.mw .list{position:relative;padding:4px 16px 0}
.mw .cap{margin:18px 4px 12px;font-size:10.5px;font-weight:600;letter-spacing:2px;color:${K.sub}}
.mw .card{position:relative;background:${SURFACE};border-radius:16px;box-shadow:inset 0 0 0 1px ${ta(.08)},inset 0 1px 0 ${ta(.035)};padding:22px 24px 22px;margin-bottom:14px;cursor:pointer}
.mw .card:active{filter:brightness(1.08)}
.mw .tile{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 13%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 34%,transparent)}
.mw .lk{position:absolute;top:24px;right:24px;line-height:0}
.mw .card h4{margin:26px 0 0;font-size:19px;font-weight:600}
.mw .card p{margin:8px 0 0;font-size:14px;color:${K.sub}}
.mw .stats{display:grid;grid-template-columns:1fr 1fr;margin-top:16px;border-top:1px solid ${K.sep}}
.mw .stats div{padding:12px 0 0;min-width:0}.mw .stats div+div{padding-left:16px;border-left:1px solid ${K.sep}}
.mw .stats span{font-size:9.5px;font-weight:600;letter-spacing:1.6px;color:${K.sub}}.mw .stats b{display:block;margin-top:4px;font-size:15px;font-weight:600}
.mw .soon .blur{filter:blur(5px) saturate(.75);opacity:.55;pointer-events:none}
.mw .soonbox{position:absolute;right:20px;bottom:20px;display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:10px;background:${ta(.05)};box-shadow:inset 0 0 0 1px ${ta(.12)};font-size:12.5px;font-weight:600;color:${K.sub}}
.mw .ft{text-align:center;padding:30px 0 40px;font-size:12.5px;color:${K.mute}}.mw .ft small{display:block;margin-top:6px;font-size:10px;letter-spacing:2px;color:${K.line2}}
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
.mset .row2 b{display:block;font-size:14.5px}.mset .row2 span{display:block;font-size:11.5px;color:${K.sub};margin-top:2px}.mset .row2 em{font-style:normal;color:${K.or};font-size:20px}`;

export const scrDreamer = {
  view() {
    const openPocket = () => { NAV.stack = []; Navigate('scrHome'); };
    const openLens = () => { NAV.stack = []; Navigate('scrLensPnl'); };
    const soon = () => Notify('More rooms are on the way.', 'info');
    const lb = PLABEL(Today()), sp = flowSplit(PSTART(Year(lb), Month(lb)), PEND(Year(lb), Month(lb)));
    const sweep = DB.accounts.find(a => a.AccId === SWEEP_ID);
    const last = E.kAdd(E.curKey(), -1), lm = E.month(last);
    const yr = E.pnlYear(E.kY(E.curKey()));
    const rate = lm.active && lm.rate !== null ? lm.rate : null;
    return html`<div class="mw" data-t="dreamerMain">
      <style>${css()}</style>
      <div class="glow"></div>
      <div class="in">
        <div class="top"><div class="lg"><span dangerouslySetInnerHTML=${{ __html: logoTile(36, 10) }}></span><span>MansWell<i>.</i></span></div>
          <div class="gear" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => { panel = true; rerender(); }} dangerouslySetInnerHTML=${{ __html: ic('gear', K.sub, 19) }}></div></div>
        <div class="pill" data-t="mainSync" onClick=${() => syncNow()}><b></b><span>${syncedText()}</span><span dangerouslySetInnerHTML=${{ __html: ic('sync', K.sub, 12) }}></span></div>
        <h1>All your dreams,<br/><span>one door.</span></h1>
        <div class="lead">Pocket records your money. Lens helps you understand it.</div>
        <div class="cta" data-t="openPocket" role="button" onClick=${openPocket}><span style="line-height:0" dangerouslySetInnerHTML=${{ __html: ic('signin', K.ctaText || K.onAcc, 18) }}></span>Open Pocket</div>
      </div>
      <div class="list">
        <div class="cap">ROOMS · 2 OF 4 OPEN</div>
        <div class="card" data-t="mod-pocket" role="button" aria-label="Pocket" onClick=${openPocket}>
          <div class="tile" style="--c:#FF8A3D" dangerouslySetInnerHTML=${{ __html: ic('wallet', '#FF8A3D', 26) }}></div><span class="lk" dangerouslySetInnerHTML=${{ __html: ic('arrow', K.or, 24) }}></span>
          <h4>Pocket</h4><p>Accounts, transactions and balance sweep</p>
        </div>
        <div class="card" data-t="mod-lens" role="button" aria-label="Lens" onClick=${openLens}>
          <div class="tile" style="--c:#3DDC84" dangerouslySetInnerHTML=${{ __html: ic('aperture', '#3DDC84', 26) }}></div><span class="lk" dangerouslySetInnerHTML=${{ __html: ic('arrow', K.or, 24) }}></span>
          <h4>Lens</h4><p>P&L, savings & assets, plan and budget</p>
        </div>
        ${SOON.map(([n, sub, c, g], i) => html`<div class="card soon" data-t=${'mod-soon-' + (i + 1)} role="button" aria-label="Coming soon" onClick=${soon}>
          <div class="blur"><div class="tile" style=${'--c:' + c} dangerouslySetInnerHTML=${{ __html: ic(g, c, 26) }}></div><h4>${n}</h4><p>${sub}</p></div>
          <span class="soonbox"><span style="line-height:0" dangerouslySetInnerHTML=${{ __html: ic('lock', K.sub, 14) }}></span>Soon</span></div>`)}
      </div>
      <div class="ft">Live well today. Build well for tomorrow.<small>MANSWELL · V${VERSION}</small></div>
      ${panel ? Settings() : null}
    </div>`;
  }
};
