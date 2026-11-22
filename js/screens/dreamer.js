// MansWell — main page (v3.16 Maison). Logo, date + greeting, serif headline, four jewel room cards: Pocket (where money is recorded), Lens (where it is understood), more rooms to come.
// Pocket theme. Only reads data; the rooms open their own screens.
import { html, K, DB, NAV, Navigate, Notify, rerender, oa, VERSION, Today, PLABEL, PSTART, PEND, Year, Month, flowSplit, store, SYNC, SURFACE, HAIR, n2, fmtD, ta } from '../core.js';
import { syncNow } from '../shared.js';
import { SWEEP_ID } from '../sweep.js';
import { logoTile } from '../logo.js';
import { THEMES, THEME_ORDER, appTheme, setAppTheme } from '../theme.js';
import { G } from '../core.js';
import * as E from '../lens/engine.js';
import { askPin, PinGate, pinCss } from '../pin.js';

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
  safe: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1.2"/><path d="M12 7.8v1.4M12 14.8v1.4M7.8 12h1.4M14.8 12h1.4M6 20v1.5M18 20v1.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  del: '<path d="M9 6h11v12H9l-6-6z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>',
  signin: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>'
};
const ic = (n, c, s, w) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="${w || 1.9}" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
/* The lookbook: one tall glass card per room. Colours come only from the theme: a deep stage, its accent and gold. */
const LOOKS = {
  rose: { dark: 1, bg: 'linear-gradient(175deg,#1e0a14 0%,#3d1328 55%,#1a0910 100%)', glow: 'rgba(240,138,174,.30)', gold: '#E2C28A', acc: '#F2B8CD', tx: '#FFFFFF', sub: 'rgba(255,255,255,.62)', err: '#F4A3BF' },
  ember: { dark: 1, bg: 'linear-gradient(175deg,#0D0F12 0%,#1c130b 55%,#0D0F12 100%)', glow: 'rgba(255,106,0,.26)', gold: '#E7C08A', acc: '#FF8A3D', tx: '#FFFFFF', sub: 'rgba(255,255,255,.6)', err: '#FF9A86' },
  ivory: { dark: 0, bg: 'linear-gradient(175deg,#F8F3EA 0%,#EFE5D3 60%,#F6F1E8 100%)', glow: 'rgba(140,47,42,.14)', gold: '#A8761E', acc: '#8C2F2A', tx: '#2A1A14', sub: 'rgba(42,26,20,.6)', err: '#B3261E' },
  sapphire: { dark: 1, bg: 'linear-gradient(175deg,#070c1a 0%,#12204a 55%,#070c1a 100%)', glow: 'rgba(90,130,220,.30)', gold: '#D4B676', acc: '#D4B676', tx: '#FFFFFF', sub: 'rgba(255,255,255,.6)', err: '#F4A3A3' },
  graphite: { dark: 1, bg: 'linear-gradient(175deg,#0B0B0C 0%,#1c1c1f 55%,#0B0B0C 100%)', glow: 'rgba(255,255,255,.12)', gold: '#D8D8DC', acc: '#FFFFFF', tx: '#FFFFFF', sub: 'rgba(255,255,255,.55)', err: '#F4A3A3' }
};
const mix = (c, a) => `color-mix(in srgb,${c} ${Math.round(a * 100)}%,transparent)`;
export function look() {
  const L = { ...(LOOKS[appTheme()] || LOOKS.ember) };
  Object.assign(L, {
    style: `background:radial-gradient(80% 50% at 50% 60%,${L.glow},transparent 70%),${L.bg}`,
    glass: L.dark ? 'linear-gradient(165deg,rgba(255,255,255,.14),rgba(255,255,255,.03))' : 'linear-gradient(165deg,rgba(255,255,255,.96),rgba(255,255,255,.62))',
    goldLine: mix(L.gold, .55), goldGlow: mix(L.gold, .6), glowSoft: mix(L.acc, .3),
    chip: L.dark ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.7)', chipLine: L.dark ? 'rgba(255,255,255,.2)' : 'rgba(42,26,20,.14)',
    keyBg: L.dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.55)', keyLine: mix(L.gold, .38), keyOn: mix(L.gold, .22)
  });
  return L;
}
const RMS = [
  { id: 'pocket', grp: 'Financial', name: 'Pocket', sub: 'Accounts, transactions, sweep', ic: 'wallet', pin: 1 },
  { id: 'lens', grp: 'Financial', name: 'Lens', sub: 'P&L, savings, plan, budget', ic: 'aperture', pin: 1 },
  { id: 'vault', grp: 'Personal', name: 'Vault', sub: 'Papers and tax receipts', ic: 'safe', soon: 1 },
  { id: 'passport', grp: 'Travel', name: 'Atlas', sub: 'Odyssey, journeys, wanderlist', ic: 'globe' },
  { id: 'logbook', grp: 'Travel', name: 'Voyage', sub: 'Itinerary, expenses, discovery', ic: 'compass' }
];
const WDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const greet = h => h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
const RMx = v => (v < 0 ? '−' : '') + 'RM ' + n2(Math.abs(v));
const car = { at: null, dx: 0, x0: null, moved: false };

const css = L => `
.mw{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;color:${L.tx};${L.style}}.mw::-webkit-scrollbar{display:none}
.mw:after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}
.mw .fl{position:relative;min-height:100%;display:flex;flex-direction:column}
.mw .top{display:flex;justify-content:space-between;align-items:center;padding:22px 22px 0}
.mw .lg{display:flex;align-items:center;gap:11px}.mw .lg>span:last-child{font:400 22px/1 Georgia,'Times New Roman',serif;letter-spacing:-.2px}.mw .lg i{color:${L.acc};font-style:normal}
.mw .gear{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:${L.chip};box-shadow:inset 0 0 0 1px ${L.chipLine}}
.mw .k{font-size:9.5px;font-weight:600;letter-spacing:2.6px;text-transform:uppercase}
.mw .hero{padding:30px 26px 0}.mw .dt{color:${L.sub}}
.mw h1{margin:10px 0 0;font:400 36px/1.06 Georgia,'Times New Roman',serif;letter-spacing:-.4px}.mw h1 i{color:${L.acc}}
.mw .tag{font:italic 14px Georgia,serif;color:${L.sub};margin-top:10px}
.mw .car{position:relative;height:372px;margin-top:auto;padding-top:28px;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.mw .cd{position:absolute;left:81px;top:6px;width:228px;height:360px;border-radius:26px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;cursor:pointer;
  background:${L.glass};box-shadow:inset 0 0 0 1px ${L.goldLine},0 30px 60px rgba(0,0,0,${L.dark ? '.42' : '.14'});transition:transform .5s cubic-bezier(.2,.75,.2,1),opacity .5s;will-change:transform}
.mw .cd:before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,${L.dark ? '.18' : '.7'}),transparent 40%);pointer-events:none}
.mw .car.drag .cd{transition:none}
.mw .cd .tp{display:flex;justify-content:space-between;align-items:center;min-height:15px;position:relative}.mw .cd .tp .k{font-size:8.5px;letter-spacing:2.2px;color:${L.gold}}
.mw .cd .emb{align-self:center;width:96px;height:96px;border-radius:50%;display:grid;place-items:center;position:relative;box-shadow:inset 0 0 0 1px ${L.goldLine},0 0 44px ${L.glowSoft}}
.mw .cd h4{margin:0;font:400 34px/1 Georgia,'Times New Roman',serif;position:relative}.mw .cd p{margin:8px 0 0;font:italic 13px Georgia,serif;color:${L.sub};position:relative}
.mw .cd .go{display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:14px;border-top:1px solid ${mix(L.tx, .18)};position:relative}.mw .cd .go .k{color:${L.sub}}
.mw .cd.soon .emb,.mw .cd.soon h4{opacity:.5}
.mw .dots{display:flex;justify-content:center;gap:6px;margin-top:14px}.mw .dots i{width:5px;height:5px;border-radius:3px;background:${mix(L.tx, .3)};transition:all .35s}.mw .dots i.on{width:22px;background:${L.gold}}
.mw .names{display:flex;justify-content:center;gap:18px;margin-top:14px;font:400 14px Georgia,serif;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}.mw .names span{color:${mix(L.tx, .45)};cursor:pointer;padding:4px 0;transition:color .3s}.mw .names span.on{color:${L.tx}}.mw .names span.dim{opacity:.6}
.mw .sync{text-align:center;font:italic 12px Georgia,serif;color:${mix(L.tx, .5)};padding:18px 0 calc(26px + env(safe-area-inset-bottom,0px));cursor:pointer}
.mw .sync i{display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--sc);margin-right:7px;vertical-align:middle}
@keyframes mwUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}.mw .hero,.mw .car{animation:mwUp .6s cubic-bezier(.2,.7,.2,1) both}.mw .car{animation-delay:.08s}
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
      <div class="row2" onClick=${() => { panel = false; askPin('Pocket', 'wallet', () => Navigate('scrMore')); }} data-t="mainPocketSettings"><div><b>Pocket settings</b><span>Accounts, categories, tracking period, backup</span></div><em>›</em></div>
      <div class="row2" onClick=${() => { panel = false; askPin('Lens', 'aperture', () => { NAV.stack = []; Navigate('scrLensSettings'); }); }} data-t="mainLensSettings"><div><b>Lens settings</b><span>Opening balances, savings rule, status levels</span></div><em>›</em></div>
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

/* card pose: centre card, neighbours smaller and dimmer, the rest off stage (off = position from the open card) */
const pose = (off, dx) => `translateX(${off * 251 + dx}px) scale(${off === 0 && !dx ? 1 : Math.abs(off) >= 1 ? .86 : .93})`;

export const scrDreamer = {
  view() {
    const L = look();
    const fin = (r, go) => askPin(r.name, r.ic, go);
    const OPEN = {
      pocket: () => { NAV.stack = []; Navigate('scrHome'); }, lens: () => { NAV.stack = []; Navigate('scrLensPnl'); },
      passport: () => { NAV.stack = []; Navigate('scrPpOverview'); }, logbook: () => { NAV.stack = []; Navigate('scrLbJourneys'); },
      vault: () => Notify('Vault is still in development.', 'info')
    };
    const enter = r => { store.set('mw_room', r.id); if (r.soon) return OPEN[r.id](); if (r.pin) return fin(r, OPEN[r.id]); OPEN[r.id](); };
    if (car.at === null) { const last = RMS.findIndex(r => r.id === store.get('mw_room', 'pocket')); car.at = last >= 0 ? last : 0; }
    const at = car.at, to = i => { car.at = Math.max(0, Math.min(RMS.length - 1, i)); rerender(); };
    const down = e => { car.x0 = e.clientX; car.dx = 0; car.moved = false; };
    const move = e => { if (car.x0 == null) return; car.dx = e.clientX - car.x0; if (Math.abs(car.dx) > 6) { car.moved = true; const t = e.currentTarget; t.classList.add('drag'); t.querySelectorAll('.cd').forEach((c, i) => { c.style.transform = pose(i - at, car.dx); }); } };
    const up = e => { const t = e.currentTarget; t.classList.remove('drag'); const dx = car.dx; car.x0 = null; car.dx = 0; if (car.moved && Math.abs(dx) > 40) return to(at + (dx < 0 ? 1 : -1)); t.querySelectorAll('.cd').forEach((c, i) => { c.style.transform = pose(i - at, 0); }); };
    const tap = (r, i) => { if (car.moved) { car.moved = false; return; } if (i !== at) return to(i); enter(r); };
    const now = new Date(), busy = SYNC.outbox.length;
    return html`<div class="mw" data-t="dreamerMain">
      <style>${css(L)}${pinCss(L)}</style>
      <div class="fl">
        <div class="top"><div class="lg"><span dangerouslySetInnerHTML=${{ __html: logoTile(36, 10) }}></span><span>MansWell<i>.</i></span></div>
          <div class="gear" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => { panel = true; rerender(); }} dangerouslySetInnerHTML=${{ __html: ic('gear', L.tx, 16, 1.5) }}></div></div>
        <div class="hero"><div class="k dt" data-t="mainDate">${WDAY[now.getDay()]} · ${now.getDate()} ${MON[now.getMonth()]}</div>
          <h1 data-t="mainGreet">${greet(now.getHours())}, <i>Aiman.</i></h1><div class="tag">All your dreams, one door.</div></div>
        <div class="car" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onPointerLeave=${e => { if (car.x0 != null) up(e); }}>
          ${RMS.map((r, i) => html`<div class=${'cd' + (r.soon ? ' soon' : '')} style=${`transform:${pose(i - at, 0)};opacity:${Math.abs(i - at) > 1 ? 0 : i === at ? 1 : .5};z-index:${5 - Math.abs(i - at)}`}
              data-t=${'mod-' + r.id} role="button" aria-label=${r.name} onClick=${() => tap(r, i)}>
            <div class="tp"><span class="k">${r.grp}</span>${r.soon ? null : html`<span style="line-height:0" dangerouslySetInnerHTML=${{ __html: ic(r.pin ? 'lock' : 'arrow', L.gold, 14, 1.5) }}></span>`}</div>
            <div class="emb" dangerouslySetInnerHTML=${{ __html: ic(r.ic, L.gold, 42, 1.1) }}></div>
            <div><h4>${r.name}</h4><p>${r.sub}</p>
              <div class="go"><span class="k">${r.soon ? 'In development' : r.pin ? 'Enter · PIN' : 'Enter'}</span><span style="line-height:0" dangerouslySetInnerHTML=${{ __html: ic(r.soon ? 'lock' : 'arrow', r.soon ? L.sub : L.tx, 15, 1.5) }}></span></div></div></div>`)}
        </div>
        <div class="dots">${RMS.map((r, i) => html`<i class=${i === at ? 'on' : ''}></i>`)}</div>
        <div class="names">${RMS.map((r, i) => html`<span class=${(i === at ? 'on' : '') + (r.soon ? ' dim' : '')} onClick=${() => to(i)} data-t=${'nav-' + r.id}>${r.name}</span>`)}</div>
        <div class="sync" data-t="mainSync" onClick=${() => syncNow()} style=${'--sc:' + (busy ? (navigator.onLine ? L.gold : L.sub) : '#3DBE84')}><i></i>${syncedText()}</div>
      </div>
      ${PinGate(L, ic)}
      ${panel ? Settings() : null}
    </div>`;
  }
};
