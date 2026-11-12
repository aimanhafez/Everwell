// MansWell — start-up: scale the 390 x 844 canvas to the device, register screens, load data (App.OnStart).
import { html, render } from './vendor/preact-htm.js';
import { NAV, CONN, mount, rerender, loadAll, loadCached, flush, beaconOutbox, flushCache, Navigate, stStart, Notify, K } from './core.js';
import { autoSweep } from './sweep.js';
import './theme.js';
import { scrHome } from './screens/home.js';
import { scrAccounts, scrAccountDetail, scrAccountEdit } from './screens/accounts.js';
import { scrTransactions, scrTxnDetail, scrTxnEdit, scrTransfer, scrSplit } from './screens/transactions.js';
import { scrRecurring, scrCategories, scrMore, scrSetup, scrAnalysis, scrActivity, connect } from './screens/more.js';
import { scrImport } from './screens/import.js';
import { scrDreamer } from './screens/dreamer.js';
import { scrPayslip } from './screens/payslip.js';
import { scrYearClose } from './screens/yearclose.js';
import { scrLensPnl } from './lens/pnl.js';
import { scrLensAssets } from './lens/assets.js';
import { scrLensPlan } from './lens/plan.js';
import { scrLensBudget } from './lens/budget.js';
import { scrLensSettings } from './lens/settings.js';

Object.assign(NAV.screens, { scrHome, scrAccounts, scrAccountDetail, scrAccountEdit, scrTransactions, scrTxnDetail, scrTxnEdit, scrTransfer, scrSplit, scrRecurring, scrCategories, scrMore, scrSetup, scrAnalysis, scrActivity, scrImport, scrDreamer, connect, scrPayslip, scrYearClose, scrLensPnl, scrLensAssets, scrLensPlan, scrLensBudget, scrLensSettings });

const stage = document.getElementById('stage');
mount(stage);

/* Fit the canvas like Power Apps "scale to fit": full width, height follows the screen. */
function fit() {
  const probe = getComputedStyle(document.getElementById('safe-probe'));
  const top = parseFloat(probe.paddingTop) || 0;
  const W = window.innerWidth, Hh = window.innerHeight - top;
  let s = W / 390;
  if (Hh / s < 640) s = Math.max(Hh / 640, 0.5); // very short / wide windows (desktop)
  if (s * 390 > W) s = W / 390;
  const left = Math.max(0, (W - 390 * s) / 2);
  stage.style.transform = `scale(${s})`;
  stage.style.left = left + 'px';
  stage.style.top = top + 'px';
  stage.style.height = (Hh / s) + 'px';
}
window.addEventListener('resize', fit);
window.addEventListener('orientationchange', () => setTimeout(fit, 200));
fit();

function splash(msg, retry) {
  render(html`<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">
    <div class="brand c"><div class="mark" style="font-size:30px">MansWell<span>.</span></div><div class="tag" style="margin-top:7px;letter-spacing:1.8px">LIVE WELL TODAY. BUILD WELL FOR TOMORROW.</div></div>
    <div style=${`color:${K.sub};font-size:12px;max-width:300px;text-align:center`}>${msg}</div>
    ${retry ? html`<button class="btn" style=${`position:relative;width:160px;height:40px;border-radius:20px;background:${K.or};color:#fff;font-weight:600`} onClick=${retry}>Try again</button>` : null}
  </div>`, stage);
}

async function boot() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (!CONN.v) { NAV.stack = []; Navigate('connect'); return; }
  const start = () => { NAV.stack = []; Navigate(stStart() ? 'scrDreamer' : 'scrSetup'); }; // StartScreen: If(IsBlank(StStart), scrSetup, scrHome)
  const cached = loadCached();
  if (cached) start(); else splash('Loading your money…');
  try {
    await loadAll({ quiet: cached });
    if (!cached) start(); else rerender();
    flush();
    autoSweep().then(() => rerender()).catch(e => Notify('Monthly sweep could not run: ' + e.message + ' It will retry next time you open MansWell.', 'error'));
  } catch (e) {
    if (e.code === 'AUTH') { CONN.authError = e.message; NAV.stack = []; Navigate('connect'); return; }
    if (cached) { flush(); return; } // keep working with the copy on this phone
    splash(navigator.onLine ? e.message : "You're offline. Connect to the internet to load your data.", boot);
  }
}
window.addEventListener('online', () => { flush(); rerender(); });
window.addEventListener('offline', () => rerender());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { flushCache(); beaconOutbox(); } else flush(); });
window.addEventListener('pagehide', () => { flushCache(); beaconOutbox(); });
boot();
