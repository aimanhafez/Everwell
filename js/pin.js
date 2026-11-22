// MansWell — 6-digit PIN for the financial rooms (Pocket, Lens). Asked every time one is opened from the main page.
// The PIN is kept on this device only, as a salted SHA-256 hash. Setting it (first time, or "Forgot PIN?") needs the MansWell password.
import { html, rerender, store } from './core.js';
import { GUARD_PASSWORD } from './shared.js';

const KEY = 'mw_pin';
export const gate = { g: null }; // { room, icon, go, step: 'enter'|'pw'|'set'|'confirm', val, first, err, shake }
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function hash(salt, pin) {
  const data = new TextEncoder().encode(salt + ':' + pin);
  if (window.crypto && crypto.subtle) return hex(await crypto.subtle.digest('SHA-256', data));
  let h = 2166136261; for (const c of data) { h ^= c; h = Math.imul(h, 16777619) >>> 0; } return 'f' + h.toString(16); // non-secure origin fallback
}
const saved = () => { try { const p = store.get(KEY, null); return p && p.salt && p.hash ? p : null; } catch (e) { return null; } };
export const hasPin = () => !!saved();

/** Ask for the PIN, then run go(). First time on this device: MansWell password, then choose a PIN twice. */
export function askPin(room, icon, go) { gate.g = { room, icon, go, step: saved() ? 'enter' : 'pw', val: '', first: '', err: '', reset: !saved() }; rerender(); }
const close = () => { gate.g = null; rerender(); };
const fail = (g, msg) => { g.err = msg; g.val = ''; g.shake = (g.shake || 0) + 1; rerender(); };

async function digit(d) {
  const g = gate.g; if (!g || g.step === 'pw' || g.busy) return;
  if (d === 'del') { g.val = g.val.slice(0, -1); g.err = ''; rerender(); return; }
  if (g.val.length >= 6) return;
  g.val += d; g.err = ''; rerender();
  if (g.val.length < 6) return;
  g.busy = true; await new Promise(r => setTimeout(r, 140)); g.busy = false;
  if (g.step === 'enter') {
    const p = saved();
    if (p && await hash(p.salt, g.val) === p.hash) { const go = g.go; gate.g = null; go(); return; }
    return fail(g, 'That PIN didn’t match. Try again.');
  }
  if (g.step === 'set') { g.first = g.val; g.val = ''; g.step = 'confirm'; rerender(); return; }
  if (g.step === 'confirm') {
    if (g.val !== g.first) { g.step = 'set'; g.first = ''; return fail(g, 'The two PINs were different. Choose again.'); }
    const salt = hex(crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : new Uint8Array(12).map(() => Math.random() * 256));
    store.set(KEY, { salt, hash: await hash(salt, g.val), at: new Date().toISOString() });
    const go = g.go; gate.g = null; go();
  }
}
function password() {
  const g = gate.g, el = document.getElementById('pinPw'); const v = el ? el.value : '';
  if (v !== GUARD_PASSWORD) { g.err = 'Wrong password. Try again.'; g.shake = (g.shake || 0) + 1; if (el) el.value = ''; rerender(); return; }
  g.step = 'set'; g.val = ''; g.err = ''; rerender();
}

const SUB = { enter: 'Enter your 6-digit PIN', pw: 'Your MansWell password, to set a PIN', set: 'Choose a 6-digit PIN', confirm: 'Enter it once more' };
/** The PIN screen (L = look colours from the main page). */
export function PinGate(L, ic) {
  const g = gate.g; if (!g) return null;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
  if (!window.__pinKeys) { window.__pinKeys = 1; document.addEventListener('keydown', e => { const x = gate.g; if (!x) return; if (e.key === 'Escape') return close(); if (x.step === 'pw') return; if (/^[0-9]$/.test(e.key)) { e.preventDefault(); digit(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); digit('del'); } }); }
  if (g.step === 'pw') setTimeout(() => { const x = document.getElementById('pinPw'); if (x && document.activeElement !== x) x.focus(); }, 30);
  return html`<div class="pinx" data-t="pinGate" style=${L.style}>
    <div class="ph"><span class="ci" onClick=${close} data-t="pinClose" aria-label="Back" dangerouslySetInnerHTML=${{ __html: ic('back', L.tx, 15) }}></span><span class="k">Financial</span><span style="width:38px"></span></div>
    <div class="pe"><div class="emb2" dangerouslySetInnerHTML=${{ __html: ic(g.icon, L.gold, 30, 1.1) }}></div><h2>${g.room}</h2>
      <div class=${'it' + (g.err ? ' er' : '')} data-t="pinMsg">${g.err || SUB[g.step]}</div>
      ${g.step === 'pw' ? html`<div class="pwr" key=${'s' + (g.shake || 0)}><input id="pinPw" type="password" autocomplete="current-password" placeholder="Password" data-t="pinPw" onKeyDown=${e => { if (e.key === 'Enter') password(); }} /><span class="go" onClick=${password} data-t="pinPwGo" dangerouslySetInnerHTML=${{ __html: ic('arrow', '#fff', 16, 1.8) }}></span></div>`
        : html`<div class=${'pd' + (g.err ? ' err' : '')} key=${'d' + (g.shake || 0)} data-t="pinDots">${[0, 1, 2, 3, 4, 5].map(i => html`<i class=${i < g.val.length ? 'f' : ''}></i>`)}</div>`}</div>
    ${g.step === 'pw' ? null : html`<div class="kp">${keys.map(k => k === '' ? html`<span class="key blank"></span>` : html`<span class=${'key' + (k === 'del' ? ' blank' : '')} onClick=${() => digit(k)} data-t=${'pk-' + k}>${k === 'del' ? html`<i style="line-height:0" dangerouslySetInnerHTML=${{ __html: ic('del', L.tx, 22, 1.3) }}></i>` : k}</span>`)}</div>`}
    ${g.step === 'enter' ? html`<div class="fg" onClick=${() => { g.step = 'pw'; g.val = ''; g.err = ''; rerender(); }} data-t="pinForgot">Forgot PIN?</div>` : null}
  </div>`;
}
export const pinCss = L => `
.pinx{position:fixed;inset:0;z-index:80;overflow:hidden;outline:0;color:${L.tx};display:flex;flex-direction:column;animation:pinIn .28s ease both}
@keyframes pinIn{from{opacity:0}to{opacity:1}}
.pinx .ph{display:flex;justify-content:space-between;align-items:center;padding:calc(18px + env(safe-area-inset-top,0px)) 22px 0}
.pinx .ph .k{color:${L.sub}}
.pinx .ci{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:${L.chip};box-shadow:inset 0 0 0 1px ${L.chipLine}}
.pinx .pe{text-align:center;margin-top:40px}
.pinx .emb2{width:74px;height:74px;border-radius:50%;margin:0 auto;display:grid;place-items:center;box-shadow:inset 0 0 0 1px ${L.goldLine},0 0 40px ${L.glowSoft}}
.pinx h2{font:400 34px/1.1 Georgia,'Times New Roman',serif;margin:18px 0 0}
.pinx .it{font:italic 14px Georgia,serif;color:${L.sub};margin-top:8px;min-height:20px}.pinx .it.er{color:${L.err}}
.pinx .pd{display:flex;justify-content:center;gap:16px;margin-top:26px}
.pinx .pd i{width:11px;height:11px;border-radius:50%;box-shadow:inset 0 0 0 1px ${L.goldLine};transition:background .15s}
.pinx .pd i.f{background:${L.gold};box-shadow:0 0 10px ${L.goldGlow}}
.pinx .pd.err{animation:pinShake .4s ease}.pinx .pd.err i{box-shadow:inset 0 0 0 1px ${L.err}}
@keyframes pinShake{0%,100%{transform:none}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.pinx .pwr{display:flex;align-items:center;gap:12px;margin:28px 44px 0;padding-bottom:10px;border-bottom:1px solid ${L.goldLine};animation:pinShake .4s ease}
.pinx .pwr input{flex:1;background:none;border:0;outline:0;color:${L.tx};font:400 17px Georgia,serif;letter-spacing:1px;min-width:0}
.pinx .pwr input::placeholder{color:${L.sub};font-style:italic}
.pinx .pwr .go{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:linear-gradient(135deg,${L.gold},${L.acc});box-shadow:0 8px 22px ${L.glowSoft}}
.pinx .kp{display:grid;grid-template-columns:repeat(3,68px);justify-content:center;column-gap:26px;row-gap:12px;margin-top:auto;padding-bottom:12px}
.pinx .key{width:68px;height:68px;border-radius:50%;display:grid;place-items:center;font:400 29px Georgia,serif;cursor:pointer;user-select:none;-webkit-user-select:none;background:${L.keyBg};box-shadow:inset 0 0 0 1px ${L.keyLine};transition:background .12s}
.pinx .key:active{background:${L.keyOn}}.pinx .key.blank{background:none;box-shadow:none}
.pinx .fg{text-align:center;font:italic 13px Georgia,serif;color:${L.sub};padding:6px 0 calc(26px + env(safe-area-inset-bottom,0px));cursor:pointer}
.pinx .kp:last-child{padding-bottom:calc(40px + env(safe-area-inset-bottom,0px))}
`;
