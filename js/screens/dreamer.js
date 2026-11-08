// Dreamer — main page (v2.0.1), "one door": clean dark page, orange grid glow, big headline, one card per app.
// Pennywise: Pocket (open), Lens (budget, P&L, forecast, goals — coming), one more (hidden).
// Roaming Dreamer: three apps, hidden until they launch.
// Only this screen changed; Pocket's screens, data and Google Sheet are untouched.
// Icons: Phosphor Icons (MIT). Fonts: Space Grotesk, IBM Plex Mono (SIL Open Font License), in /fonts.
import { html, NAV, Navigate, Notify, VERSION } from '../core.js';

const G = {"wallet":"<path d=\"M216,64H56a8,8,0,0,1,0-16H192a8,8,0,0,0,0-16H56A24,24,0,0,0,32,56V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V80A16,16,0,0,0,216,64Zm0,128H56a8,8,0,0,1-8-8V78.63A23.84,23.84,0,0,0,56,80H216Zm-48-60a12,12,0,1,1,12,12A12,12,0,0,1,168,132Z\"/>","aperture":"<path d=\"M201.54,54.46A104,104,0,0,0,54.46,201.54,104,104,0,0,0,201.54,54.46ZM190.23,65.78a88.18,88.18,0,0,1,11,13.48L167.55,119,139.63,40.78A87.34,87.34,0,0,1,190.23,65.78ZM155.59,133l-18.16,21.37-27.59-5L100.41,123l18.16-21.37,27.59,5ZM65.77,65.78a87.34,87.34,0,0,1,56.66-25.59l17.51,49L58.3,74.32A88,88,0,0,1,65.77,65.78ZM46.65,161.54a88.41,88.41,0,0,1,2.53-72.62l51.21,9.35Zm19.12,28.68a88.18,88.18,0,0,1-11-13.48L88.45,137l27.92,78.18A87.34,87.34,0,0,1,65.77,190.22Zm124.46,0a87.34,87.34,0,0,1-56.66,25.59l-17.51-49,81.64,14.91A88,88,0,0,1,190.23,190.22Zm-34.62-32.49,53.74-63.27a88.41,88.41,0,0,1-2.53,72.62Z\"/>","coins":"<path d=\"M184,89.57V84c0-25.08-37.83-44-88-44S8,58.92,8,84v40c0,20.89,26.25,37.49,64,42.46V172c0,25.08,37.83,44,88,44s88-18.92,88-44V132C248,111.3,222.58,94.68,184,89.57ZM232,132c0,13.22-30.79,28-72,28-3.73,0-7.43-.13-11.08-.37C170.49,151.77,184,139,184,124V105.74C213.87,110.19,232,122.27,232,132ZM72,150.25V126.46A183.74,183.74,0,0,0,96,128a183.74,183.74,0,0,0,24-1.54v23.79A163,163,0,0,1,96,152,163,163,0,0,1,72,150.25Zm96-40.32V124c0,8.39-12.41,17.4-32,22.87V123.5C148.91,120.37,159.84,115.71,168,109.93ZM96,56c41.21,0,72,14.78,72,28s-30.79,28-72,28S24,97.22,24,84,54.79,56,96,56ZM24,124V109.93c8.16,5.78,19.09,10.44,32,13.57v23.37C36.41,141.4,24,132.39,24,124Zm64,48v-4.17c2.63.1,5.29.17,8,.17,3.88,0,7.67-.13,11.39-.35A121.92,121.92,0,0,0,120,171.41v23.46C100.41,189.4,88,180.39,88,172Zm48,26.25V174.4a179.48,179.48,0,0,0,24,1.6,183.74,183.74,0,0,0,24-1.54v23.79a165.45,165.45,0,0,1-48,0Zm64-3.38V171.5c12.91-3.13,23.84-7.79,32-13.57V172C232,180.39,219.59,189.4,200,194.87Z\"/>","airplane-tilt":"<path d=\"M185.33,114.21l29.14-27.42.17-.17a32,32,0,0,0-45.26-45.26c0,.06-.11.11-.17.17L141.79,70.67l-83-30.2a8,8,0,0,0-8.39,1.86l-24,24a8,8,0,0,0,1.22,12.31l63.89,42.59L76.69,136H56a8,8,0,0,0-5.65,2.34l-24,24A8,8,0,0,0,29,175.42l36.82,14.73,14.7,36.75.06.16a8,8,0,0,0,13.18,2.47l23.87-23.88A8,8,0,0,0,120,200V179.31l14.76-14.76,42.59,63.89a8,8,0,0,0,12.31,1.22l24-24a8,8,0,0,0,1.86-8.39Zm-.07,97.23-42.59-63.88A8,8,0,0,0,136.8,144c-.27,0-.53,0-.79,0a8,8,0,0,0-5.66,2.35l-24,24A8,8,0,0,0,104,176v20.69L90.93,209.76,79.43,181A8,8,0,0,0,75,176.57l-28.74-11.5L59.32,152H80a8,8,0,0,0,5.66-2.34l24-24a8,8,0,0,0-1.22-12.32L44.56,70.74l13.5-13.49,83.22,30.26a8,8,0,0,0,8.56-2L180.78,52.6A16,16,0,0,1,203.4,75.23l-32.87,30.93a8,8,0,0,0-2,8.56l30.26,83.22Z\"/>","images":"<path d=\"M216,40H72A16,16,0,0,0,56,56V72H40A16,16,0,0,0,24,88V200a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V184h16a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM72,56H216v62.75l-10.07-10.06a16,16,0,0,0-22.63,0l-20,20-44-44a16,16,0,0,0-22.62,0L72,109.37ZM184,200H40V88H56v80a16,16,0,0,0,16,16H184Zm32-32H72V132l36-36,49.66,49.66a8,8,0,0,0,11.31,0L194.63,120,216,141.38V168ZM160,84a12,12,0,1,1,12,12A12,12,0,0,1,160,84Z\"/>","map-pin":"<path d=\"M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z\"/>","lock-simple":"<path d=\"M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96ZM208,208H48V96H208V208Z\"/>","arrow-right":"<path d=\"M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z\"/>","gear-six":"<path d=\"M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm109.94-52.79a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A112.1,112.1,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.62a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21Zm-15,34.91-28.57,16.25a8,8,0,0,0-3,3c-.58,1-1.19,2.06-1.81,3.06a7.94,7.94,0,0,0-1.22,4.21l-.15,32.25a95.89,95.89,0,0,1-25.37,14.3L134,199.13a8,8,0,0,0-3.91-1h-.19c-1.21,0-2.43,0-3.64,0a8.08,8.08,0,0,0-4.1,1l-28.84,16.1A96,96,0,0,1,67.88,201l-.11-32.2a8,8,0,0,0-1.22-4.22c-.62-1-1.23-2-1.8-3.06a8.09,8.09,0,0,0-3-3.06l-28.6-16.29a90.49,90.49,0,0,1,0-28.26L61.67,97.63a8,8,0,0,0,3-3c.58-1,1.19-2.06,1.81-3.06a7.94,7.94,0,0,0,1.22-4.21l.15-32.25a95.89,95.89,0,0,1,25.37-14.3L122,56.87a8,8,0,0,0,4.1,1c1.21,0,2.43,0,3.64,0a8.08,8.08,0,0,0,4.1-1l28.84-16.1A96,96,0,0,1,188.12,55l.11,32.2a8,8,0,0,0,1.22,4.22c.62,1,1.23,2,1.8,3.06a8.09,8.09,0,0,0,3,3.06l28.6,16.29A90.49,90.49,0,0,1,222.9,142.12Z\"/>","sign-in":"<path d=\"M141.66,133.66l-40,40a8,8,0,0,1-11.32-11.32L116.69,136H24a8,8,0,0,1,0-16h92.69L90.34,93.66a8,8,0,0,1,11.32-11.32l40,40A8,8,0,0,1,141.66,133.66ZM200,32H136a8,8,0,0,0,0,16h56V208H136a8,8,0,0,0,0,16h64a8,8,0,0,0,8-8V40A8,8,0,0,0,200,32Z\"/>"};
const glyph = (n, c, s) => `<svg width="${s}" height="${s}" viewBox="0 0 256 256" fill="${c}" aria-hidden="true">${G[n]}</svg>`;
const OR = '#FF7A1A';

// [id, name, description, glyph, colour, state]  state: open | locked | hidden
const GROUPS = [
  ['Pennywise', [
    ['pocket', 'Pocket', 'Accounts, transactions and balance sweep', 'wallet', '#FF8A3D', 'open'],
    ['lens', 'Lens', 'Budget, P&L, forecast and goals', 'aperture', '#3DDC84', 'locked'],
    ['assets', '', '', 'coins', '#FFC93C', 'hidden']]],
  ['Roaming Dreamer', [
    ['future', '', '', 'airplane-tilt', '#5AA8FF', 'hidden'],
    ['memories', '', '', 'images', '#FF6FAE', 'hidden'],
    ['bucket', '', '', 'map-pin', '#2FD6C8', 'hidden']]]
];

const CSS = `
${[400, 500, 600, 700].map(w => `@font-face{font-family:'Space Grotesk';font-weight:${w};font-display:swap;src:url('fonts/space-grotesk-latin-${w}-normal.woff2') format('woff2')}`).join('')}
@font-face{font-family:'Plex Mono';font-weight:400;font-display:swap;src:url('fonts/ibm-plex-mono-latin-400-normal.woff2') format('woff2')}
.dm{position:absolute;inset:0;background:#050607;color:#F2F4F5;font-family:'Space Grotesk',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
.dm *{box-sizing:border-box}
.dm .sc{position:absolute;inset:0}
.dm .hero{position:relative;padding:22px 20px 30px;overflow:hidden}
.dm .hero::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#2B1508 0%,rgba(5,6,7,.6) 70%,#050607 100%)}
.dm .hero::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,140,60,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,140,60,.06) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:linear-gradient(180deg,#000 0%,transparent 95%);mask-image:linear-gradient(180deg,#000 0%,transparent 95%)}
.dm .hero>*{position:relative;z-index:1}
.dm .top{display:flex;justify-content:space-between;align-items:center}
.dm .logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.4px}
.dm .logo img{width:34px;height:34px;border-radius:9px;display:block}
.dm .logo i{color:${OR};font-style:normal}
.dm .gear{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.dm .pill{display:inline-flex;align-items:center;gap:8px;margin-top:30px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.09);font:400 11px 'Plex Mono',ui-monospace,monospace;color:#C4C9CE}
.dm .pill i{width:6px;height:6px;border-radius:50%;background:${OR};box-shadow:0 0 8px ${OR}}
.dm h1{margin:16px 0 0;font-weight:700;font-size:34px;line-height:1.12;letter-spacing:-.8px}
.dm h1 span{color:${OR}}
.dm .sub{margin:14px 0 0;font-size:16px;line-height:1.5;color:#9CA3AA;max-width:330px}
.dm .cta{display:inline-flex;align-items:center;gap:10px;margin-top:22px;padding:11px 18px;border-radius:12px;background:${OR};color:#160A02;font-weight:600;font-size:14.5px}
.dm .list{padding:4px 16px 20px}
.dm .sec{margin:18px 4px 10px;font:400 10.5px 'Plex Mono',ui-monospace,monospace;letter-spacing:.14em;color:#6E767E;text-transform:uppercase}
.dm .card{position:relative;background:#0B0D10;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);padding:22px 24px 24px;margin-bottom:14px}
.dm .tile{width:50px;height:50px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 13%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 32%,transparent)}
.dm .lock{position:absolute;top:22px;right:22px;line-height:0}
.dm .card h4{margin:26px 0 0;font-weight:600;font-size:18px;letter-spacing:-.2px}
.dm .card p{margin:8px 0 0;font-size:13.5px;color:#8D959D}
.dm .card em{display:inline-block;margin-top:14px;font:400 10.5px 'Plex Mono',ui-monospace,monospace;letter-spacing:.06em;color:#9CA3AA;padding:4px 9px;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);font-style:normal}
.dm .card.mini{display:flex;align-items:center;gap:16px;padding:14px 18px}
.dm .card.mini .lock{top:50%;transform:translateY(-50%);right:20px}
.dm .card.mini b{font-weight:500;font-size:15px;color:#6E767E}
.dm .tile.blur{width:44px;height:44px;border-radius:12px;filter:blur(3.5px) saturate(.7);opacity:.6}
.dm .foot{text-align:center;padding:6px 0 40px;font-size:13px;color:#5E666E}
.dm .foot small{display:block;margin-top:6px;font:400 10px 'Plex Mono',ui-monospace,monospace;letter-spacing:.16em;color:#3E454C}
`;

export const scrDreamer = {
  view() {
    const openPocket = () => { NAV.stack = []; Navigate('scrHome'); };
    const tap = id => id === 'pocket' ? openPocket()
      : Notify(id === 'lens' ? 'Lens is coming soon: budget, P&L, forecast and goals.' : 'Coming soon.', 'info');
    const card = ([id, name, desc, gl, col, st]) => st === 'hidden'
      ? html`<div class="card mini tap" data-t=${'mod-' + id} role="button" aria-label="Coming soon" onClick=${() => tap(id)}>
          <div class="tile blur" style=${'--c:' + col} dangerouslySetInnerHTML=${{ __html: glyph(gl, col, 22) }}></div><b>Soon</b>
          <span class="lock" dangerouslySetInnerHTML=${{ __html: glyph('lock-simple', '#7D848C', 18) }}></span></div>`
      : html`<div class="card tap" data-t=${'mod-' + id} role="button" aria-label=${name} onClick=${() => tap(id)}>
          <div class="tile" style=${'--c:' + col} dangerouslySetInnerHTML=${{ __html: glyph(gl, col, 24) }}></div>
          <span class="lock" dangerouslySetInnerHTML=${{ __html: st === 'open' ? glyph('arrow-right', OR, 20) : glyph('lock-simple', '#7D848C', 18) }}></span>
          <h4>${name}</h4><p>${desc}</p>${st === 'locked' ? html`<em>Coming soon</em>` : null}</div>`;
    return html`<div class="dm" data-t="dreamerMain">
      <style>${CSS}</style>
      <div class="sc scroll">
        <div class="hero">
          <div class="top">
            <div class="logo"><img src="icons/apps/dreamer.png" alt=""/><span>Dreamer<i>.</i></span></div>
            <div class="gear tap" data-t="mainSettings" role="button" aria-label="Settings" onClick=${() => Navigate('scrMore')} dangerouslySetInnerHTML=${{ __html: glyph('gear-six', '#C4C9CE', 19) }}></div>
          </div>
          <div class="pill"><i></i>Money and journeys. One home.</div>
          <h1>All your dreams,<br/><span>one door.</span></h1>
          <p class="sub">Pocket is open. More apps unlock here as they're ready.</p>
          <div class="cta tap" data-t="openPocket" role="button" onClick=${openPocket}><span style="line-height:0" dangerouslySetInnerHTML=${{ __html: glyph('sign-in', '#160A02', 18) }}></span>Open Pocket</div>
        </div>
        <div class="list">${GROUPS.map(([g, apps]) => html`<div class="sec">${g}</div>${apps.map(card)}`)}</div>
        <div class="foot">Live well today. Build well for tomorrow.<small>DREAMER · V${VERSION}</small></div>
      </div>
    </div>`;
  }
};
