// Dreamer — main page (v2.0.1). iPhone dark home-screen style: one tile per app, grouped.
// Pennywise: Pocket (live), Compass (planning: budget, P&L, forecast, goals — coming), one more (hidden).
// Roaming Dreamer: three apps, hidden until they launch.
// Only this screen changed; Pocket's screens, data and Google Sheet are untouched.
import { html, NAV, Navigate, Notify, VERSION } from '../core.js';

const GEAR = '<svg viewBox="0 0 256 256" width="19" height="19" fill="#EDEDF0"><path d="M237.94,107.21a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A111.92,111.92,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.63a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"/></svg>';

// [id, name, live] — only Pocket opens today. Compass is shown; the rest stay hidden until they launch.
const GROUPS = [
  ['Pennywise', [['pocket', 'Pocket', 'open'], ['compass', 'Compass', 'shown'], ['assets', '', 'hidden']]],
  ['Roaming Dreamer', [['future', '', 'hidden'], ['memories', '', 'hidden'], ['bucket', '', 'hidden']]]
];

const CSS = `
.dm{position:absolute;inset:0;background:#000;color:#fff;overflow:hidden;letter-spacing:-.01em}
.dm::before{content:"";position:absolute;inset:0;background:radial-gradient(420px 320px at 50% 40%,rgba(255,255,255,.035),transparent 70%);pointer-events:none}
.dm .hd{position:absolute;top:22px;left:24px;right:24px;height:40px;display:flex;justify-content:space-between;align-items:center}
.dm .lg{display:flex;align-items:center;gap:12px}
.dm .lg img{width:40px;height:40px;border-radius:10px}
.dm .lg b{font:600 24px Georgia,"Times New Roman",serif;letter-spacing:-.3px;color:#F4F2EE}
.dm .lg b i{color:#FF6A00;font-style:normal}
.dm .gear{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.08);display:grid;place-items:center}
.dm .sec{position:absolute;left:24px;right:24px}
.dm .sec h3{margin:0;font-size:13px;font-weight:600;letter-spacing:.06em;color:rgba(255,255,255,.55);text-transform:uppercase;padding-left:4px}
.dm .row{display:grid;grid-template-columns:repeat(3,1fr);margin-top:16px}
.dm .app{display:grid;justify-items:center;align-content:start}
.dm .app img{width:72px;height:72px;display:block}
.dm .app b{margin-top:8px;font-size:13.5px;font-weight:500}
.dm .app span{margin-top:2px;font-size:11px;font-weight:500;color:rgba(255,255,255,.45)}
.dm .app.hidden img{filter:blur(5px) saturate(.6);opacity:.55}
.dm .app.hidden b{color:rgba(255,255,255,.5)}
.dm .div{position:absolute;left:28px;right:28px;height:1px;background:rgba(255,255,255,.07)}
.dm .ft{position:absolute;left:0;right:0;bottom:30px;text-align:center}
.dm .ft b{display:block;font-size:13px;font-weight:500;color:rgba(255,255,255,.35)}
.dm .ft small{display:block;margin-top:6px;font-size:9.5px;font-weight:600;letter-spacing:.18em;color:rgba(255,255,255,.2)}
`;

export const scrDreamer = {
  view() {
    const open = id => {
      if (id === 'pocket') { NAV.stack = []; Navigate('scrHome'); return; }
      Notify(id === 'compass' ? 'Compass is coming soon: budget, P&L, forecast and goals.' : 'Coming soon.', 'info');
    };
    const app = ([id, name, st]) => html`
      <div class=${'app tap ' + st} data-t=${'mod-' + id} role="button" aria-label=${name || 'Coming soon'} onClick=${() => open(id)}>
        <img src=${'icons/apps/' + id + '.png'} alt="" draggable="false"/>
        ${st === 'hidden' ? html`<b>Soon</b>` : html`<b>${name}</b><span>${st === 'open' ? 'Open' : 'Soon'}</span>`}
      </div>`;
    return html`<div class="dm" data-t="dreamerMain">
      <style>${CSS}</style>
      <div class="hd">
        <div class="lg"><img src="icons/apps/dreamer.png" alt=""/><b>Dreamer<i>.</i></b></div>
        <div class="gear tap" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => Navigate('scrMore')} dangerouslySetInnerHTML=${{ __html: GEAR }}></div>
      </div>
      ${GROUPS.map(([title, apps], gi) => html`
        <div class="sec" style=${`top:${110 + gi * 196}px`}><h3>${title}</h3><div class="row">${apps.map(app)}</div></div>`)}
      <div class="div" style="top:286px"></div>
      <div class="ft"><b>Live well today. Build well for tomorrow.</b><small>DREAMER · V${VERSION}</small></div>
    </div>`;
  }
};
