// MansWell — main page (v3.0). One door: Pocket (where money is recorded), Lens (where it is understood), more rooms to come.
// Pocket theme. Only reads data; the rooms open their own screens.
import { html, K, DB, NAV, Navigate, Notify, VERSION, Today, PLABEL, PSTART, PEND, Year, Month, flowSplit, store, SYNC, SURFACE, HAIR, n2, fmtD } from '../core.js';
import { syncNow } from '../shared.js';
import { SWEEP_ID } from '../sweep.js';
import { logoTile } from '../logo.js';
import * as E from '../lens/engine.js';

const ICON = {
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/>',
  aperture: '<circle cx="12" cy="12" r="9"/><path d="m14.3 3.3-4.6 8M20.6 9.5h-9.2M18 18.6l-4.6-8M9.7 20.7l4.6-8M3.4 14.5h9.2M6 5.4l4.6 8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>'
};
const ic = (n, c, s) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;
const RMx = v => (v < 0 ? '−' : '') + 'RM ' + n2(Math.abs(v));

const CSS = `
.mw{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;color:${K.text}}.mw::-webkit-scrollbar{display:none}
.mw .glow{position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,#2B1508 0%,rgba(13,15,18,.55) 72%,${K.bg} 100%);pointer-events:none}
.mw .glow::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,140,60,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,140,60,.05) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:linear-gradient(180deg,#000,transparent 92%);mask-image:linear-gradient(180deg,#000,transparent 92%)}
.mw .in{position:relative;padding:22px 20px 0}
.mw .top{display:flex;justify-content:space-between;align-items:center}
.mw .lg{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;letter-spacing:-.3px}.mw .lg i{color:${K.or};font-style:normal}
.mw .gear{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);cursor:pointer}
.mw .pill{display:inline-flex;align-items:center;gap:8px;margin-top:30px;padding:6px 12px;border-radius:99px;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09);font-size:11px;color:#C4C9CE;cursor:pointer}
.mw .pill b{width:6px;height:6px;border-radius:50%;background:${K.or};box-shadow:0 0 8px ${K.or}}
.mw h1{margin:16px 0 0;font-size:34px;line-height:1.12;font-weight:700;letter-spacing:-.8px}.mw h1 span{color:${K.or}}
.mw .rooms{position:relative;padding:0 16px}
.mw .cap{display:flex;justify-content:space-between;margin:28px 4px 12px;font-size:10px;font-weight:600;letter-spacing:1.6px;color:${K.sub}}
.mw .card{position:relative;border-radius:18px;background:${SURFACE};box-shadow:inset 0 0 0 1px ${HAIR},inset 0 1px 0 rgba(255,255,255,.035);cursor:pointer}
.mw .hero{background:radial-gradient(260px 200px at 100% 0%,rgba(255,106,0,.30),transparent 70%),linear-gradient(135deg,#23272E,#121418);box-shadow:inset 0 0 0 1px rgba(255,106,0,.25)}
.mw .pk{padding:20px 20px 0}
.mw .tl{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:rgba(255,106,0,.12);box-shadow:inset 0 0 0 1px rgba(255,106,0,.32)}
.mw .corner{position:absolute;top:20px;right:20px}
.mw .pk h4{margin:16px 0 0;font-size:20px;font-weight:600}.mw .sub{font-size:12.5px;color:${K.sub};margin-top:4px}
.mw .st{display:grid;grid-template-columns:1fr 1fr;margin-top:16px;border-top:1px solid ${K.sep}}
.mw .st div{padding:13px 0 15px}.mw .st div+div{padding-left:16px;border-left:1px solid ${K.sep}}
.mw .st span{font-size:10px;font-weight:600;letter-spacing:1.6px;color:${K.sub}}.mw .st b{display:block;margin-top:5px;font-size:15.5px;font-weight:600}
.mw .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.mw .sq{height:170px;padding:18px;display:flex;flex-direction:column}
.mw .sq h5{margin:auto 0 0;font-size:16px;font-weight:600}
.mw .m4{display:grid;grid-template-columns:22px 22px;gap:5px}.mw .m4 span{width:22px;height:22px;border-radius:7px;filter:blur(1.8px);opacity:.75}
.mw .ft{text-align:center;padding:44px 0 34px;font-size:12.5px;color:#5E666E}.mw .ft small{display:block;margin-top:6px;font-size:10px;letter-spacing:2px;color:#3E454C}
`;
function syncedText() {
  if (SYNC.outbox.length) return navigator.onLine ? 'Saving to Google…' : 'Offline · will sync';
  const at = store.get('ew_cache_at', null); if (!at) return 'Tap to sync';
  const m = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  return m < 1 ? 'Synced just now' : m < 60 ? 'Synced ' + m + ' min ago' : m < 1440 ? 'Synced ' + Math.round(m / 60) + ' h ago' : 'Synced ' + fmtD(at.slice(0, 10), 'dd mmm');
}

export const scrDreamer = {
  view() {
    const openPocket = () => { NAV.stack = []; Navigate('scrHome'); };
    const openLens = () => { NAV.stack = []; Navigate('scrLensPnl'); };
    const lb = PLABEL(Today()), sp = flowSplit(PSTART(Year(lb), Month(lb)), PEND(Year(lb), Month(lb)));
    const sweep = DB.accounts.find(a => a.AccId === SWEEP_ID);
    const sweepBal = sweep ? E.acctBal(SWEEP_ID) : null;
    const last = E.kAdd(E.curKey(), -1), lm = E.month(last);
    const lensLine = lm.active && lm.rate !== null ? html`${E.kLabel(last).split(' ')[0]} saved <span style=${`color:${lm.rate >= 0 ? K.grn : K.red}`}>${(lm.rate < 0 ? '−' : '') + Math.abs(lm.rate).toFixed(1)}%</span>` : 'P&L, assets, plan, budget';
    return html`<div class="mw" data-t="dreamerMain">
      <style>${CSS}</style>
      <div class="glow"></div>
      <div class="in">
        <div class="top"><div class="lg"><span dangerouslySetInnerHTML=${{ __html: logoTile(36, 10) }}></span><span>MansWell<i>.</i></span></div>
          <div class="gear" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => Navigate('scrMore')} dangerouslySetInnerHTML=${{ __html: ic('gear', '#C4C9CE', 19) }}></div></div>
        <div class="pill" data-t="mainSync" onClick=${() => syncNow()}><b></b><span>${syncedText()}</span><span dangerouslySetInnerHTML=${{ __html: ic('sync', '#C4C9CE', 12) }}></span></div>
        <h1>All your dreams,<br/><span>one door.</span></h1>
      </div>
      <div class="rooms">
        <div class="cap"><span>ROOMS</span><span>2 OF 6 OPEN</span></div>
        <div class="card hero pk" data-t="mod-pocket" role="button" aria-label="Pocket" onClick=${openPocket}>
          <div class="tl" dangerouslySetInnerHTML=${{ __html: ic('wallet', '#FF8A3D', 24) }}></div><span class="corner" dangerouslySetInnerHTML=${{ __html: ic('arrow', K.or, 20) }}></span>
          <h4>Pocket</h4><div class="sub">Where money is recorded</div>
          <div class="st"><div><span>${sweep ? 'BALANCE SWEEP' : 'ACCOUNTS'}</span><b data-t="mainSweep">${sweep ? RMx(sweepBal) : String(DB.accounts.filter(a => a.AccStatus === 'Active' && a.AccType !== 'System').length)}</b></div>
            <div><span>SPENT · ${fmtD(lb, 'mmm').toUpperCase()}</span><b data-t="mainSpent">${RMx(sp.Exp)}</b></div></div>
        </div>
        <div class="g2">
          <div class="card hero sq" style="box-shadow:inset 0 0 0 1px rgba(255,106,0,.22)" data-t="mod-lens" role="button" aria-label="Lens" onClick=${openLens}>
            <div class="tl" dangerouslySetInnerHTML=${{ __html: ic('aperture', '#FF8A3D', 24) }}></div><span class="corner" style="top:18px;right:18px" dangerouslySetInnerHTML=${{ __html: ic('arrow', K.or, 18) }}></span>
            <h5>Lens</h5><div class="sub" data-t="mainLens">${lensLine}</div></div>
          <div class="card sq" data-t="mod-more" role="button" aria-label="Coming soon" onClick=${() => Notify('More rooms are on the way.', 'info')}>
            <div class="m4">${['#FFC93C', '#5AA8FF', '#FF6FAE', '#2FD6C8'].map(c => html`<span style=${`background:${c}33;box-shadow:inset 0 0 0 1px ${c}77`}></span>`)}</div>
            <span class="corner" style="top:18px;right:18px" dangerouslySetInnerHTML=${{ __html: ic('lock', '#7D848C', 18) }}></span>
            <h5 style="color:#C4C9CE">4 more</h5><div class="sub">On the way</div></div>
        </div>
      </div>
      <div class="ft">Live well today. Build well for tomorrow.<small>MANSWELL · V${VERSION}</small></div>
    </div>`;
  }
};
