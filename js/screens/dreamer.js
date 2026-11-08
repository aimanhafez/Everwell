// Dreamer — main page. Black, with sweeping orange light; one glowing door per module.
// Pocket is live (net worth, 6-month trend, this month). Financial and Roaming are coming.
import {
  html, K, DB, NAV, L, R, I, Flow, Brand, Navigate,
  PLABEL, PSTART, PEND, Year, Month, Today, fmtD, RM, sRM, pct, round2, flowSplit, addMonths, VERSION
} from '../core.js';
import { syncNow } from '../shared.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const OR = '#FF7A1A';

/* ── backdrop: two sweeping ribbons of light over black, with a soft glossy fold between them ── */
const SKY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 340" preserveAspectRatio="xMidYMin slice">
<style>
  .shine{animation:shine 7s ease-in-out infinite}
  @keyframes shine{0%,100%{opacity:.8}50%{opacity:1}}
  @media (prefers-reduced-motion:reduce){.shine{animation:none}}
</style>
<defs>
  <linearGradient id="ribbon" x1="150" y1="330" x2="400" y2="60" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FF6A00" stop-opacity="0"/><stop offset=".35" stop-color="#FF7A1A" stop-opacity=".95"/><stop offset=".8" stop-color="#FFB25E"/><stop offset="1" stop-color="#FFD6A0" stop-opacity=".8"/>
  </linearGradient>
  <linearGradient id="fold" x1="200" y1="300" x2="400" y2="40" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#2A2420" stop-opacity="0"/><stop offset=".5" stop-color="#2A2420" stop-opacity=".75"/><stop offset="1" stop-color="#3A2F26" stop-opacity=".9"/>
  </linearGradient>
  <linearGradient id="thin" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".6" stop-color="#FFFFFF" stop-opacity=".16"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="ember" cx="160" cy="330" r="120" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FF6A00" stop-opacity=".35"/><stop offset="1" stop-color="#FF6A00" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .045 0"/></filter>
</defs>
<rect width="390" height="340" fill="#0A0A0B"/>
<path d="M150 340 C 230 250, 300 150, 400 62 L 400 0 L 330 0 C 300 90, 250 190, 175 340 Z" fill="url(#fold)"/>
<path d="M210 0 C 270 40, 330 70, 400 110" stroke="url(#thin)" stroke-width="1" fill="none"/>
<path d="M245 340 C 290 270, 340 225, 400 205" stroke="#FFFFFF" stroke-opacity=".08" stroke-width="1" fill="none"/>
<path d="M330 0 C 300 90, 250 190, 175 340" stroke="#FFFFFF" stroke-opacity=".06" stroke-width="1" fill="none"/>
<g class="shine">
  <path d="M150 340 C 230 250, 300 150, 400 62" stroke="url(#ribbon)" stroke-width="9" fill="none" opacity=".45" filter="url(#blur)"/>
  <path d="M150 340 C 230 250, 300 150, 400 62" stroke="url(#ribbon)" stroke-width="1.8" fill="none"/>
</g>
<circle cx="160" cy="330" r="120" fill="url(#ember)"/>
<rect width="390" height="340" filter="url(#grain)"/>
</svg>`;

/* ── tile art (orange only) ── */
const FIN_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 96">
<defs>
  <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4A4E"/><stop offset="1" stop-color="#4A4A4E" stop-opacity=".05"/></linearGradient>
  <linearGradient id="ob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A33"/><stop offset="1" stop-color="#FF6A00" stop-opacity=".08"/></linearGradient>
  <linearGradient id="base" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00" stop-opacity=".9"/><stop offset="1" stop-color="#FF6A00" stop-opacity="0"/></linearGradient>
</defs>
${[[34, 58], [58, 50], [82, 42], [106, 32], [130, 24]].map(([x, y]) => `<rect x="${x - 12}" y="${y}" width="16" height="${86 - y}" rx="3" fill="url(#gb)"/>`).join('')}
<rect x="142" y="8" width="16" height="78" rx="3" fill="url(#ob)"/>
<rect x="142" y="8" width="16" height="3" rx="1.5" fill="#FFB25E"/>
<line x1="4" x2="158" y1="88" y2="88" stroke="url(#base)" stroke-width="1"/>
<circle cx="4" cy="88" r="2.4" fill="#FF7A1A"/>
</svg>`;
const ROAM_ART = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 96">
<defs>
  <radialGradient id="sph" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#4A4A4E"/><stop offset=".6" stop-color="#1E1E21"/><stop offset="1" stop-color="#0E0E10"/></radialGradient>
  <linearGradient id="orb" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00" stop-opacity=".15"/><stop offset=".6" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FFB25E"/></linearGradient>
  <linearGradient id="base2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF6A00" stop-opacity=".9"/><stop offset="1" stop-color="#FF6A00" stop-opacity="0"/></linearGradient>
  <filter id="og"><feGaussianBlur stdDeviation="2.5"/></filter>
</defs>
<circle cx="100" cy="50" r="36" fill="url(#sph)"/>
<g fill="none" stroke="#FFFFFF" stroke-opacity=".09">
  <ellipse cx="100" cy="50" rx="14" ry="36"/><ellipse cx="100" cy="50" rx="28" ry="36"/>
  <path d="M64 50h72M68 32h64M68 68h64"/>
</g>
<ellipse cx="96" cy="52" rx="66" ry="20" transform="rotate(-24 96 52)" fill="none" stroke="url(#orb)" stroke-width="1.2"/>
<circle cx="146" cy="30" r="6" fill="#FF6A00" opacity=".55" filter="url(#og)"/>
<circle cx="146" cy="30" r="3.4" fill="#FFF1E2" stroke="#FF6A00" stroke-width="1.6"/>
<line x1="4" x2="158" y1="88" y2="88" stroke="url(#base2)" stroke-width="1"/>
<circle cx="24" cy="88" r="2.4" fill="#FF7A1A"/>
</svg>`;

/* ── net worth at the end of each of the last 6 months (from Pocket transactions) ── */
function nwTrend() {
  const lb = PLABEL(Today());
  const points = [];
  for (let i = 5; i >= 0; i--) {
    const m = addMonths(lb, -i), end = i === 0 ? Today() : PEND(Year(m), Month(m));
    let v = 0;
    for (const t of DB.txns) if (!t.TxParent && t.TxDate <= end) v += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt;
    points.push({ label: fmtD(m, 'mmm'), v: round2(v) });
  }
  return points;
}
/** smooth line that never overshoots the real values (monotone cubic) */
function smooth(xy) {
  const n = xy.length, dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = xy[i + 1][0] - xy[i][0]; m[i] = (xy[i + 1][1] - xy[i][1]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
    if (h > 9) { const k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = 'M' + xy[0][0].toFixed(1) + ' ' + xy[0][1].toFixed(1);
  for (let i = 0; i < n - 1; i++) {
    const c1 = [xy[i][0] + dx[i] / 3, xy[i][1] + t[i] * dx[i] / 3], c2 = [xy[i + 1][0] - dx[i] / 3, xy[i + 1][1] - t[i + 1] * dx[i] / 3];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${xy[i + 1][0].toFixed(1)} ${xy[i + 1][1].toFixed(1)}`;
  }
  return d;
}
function spark(points, w, h) {
  const vs = points.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const xy = points.map((p, i) => [10 + i * ((w - 20) / (points.length - 1)), 6 + (h - 26) * (1 - (p.v - lo) / span)]);
  const line = smooth(xy), last = xy[xy.length - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6A00" stop-opacity=".55"/><stop offset="1" stop-color="#FF6A00" stop-opacity="0"/></linearGradient>
<filter id="gl"><feGaussianBlur stdDeviation="3"/></filter></defs>
${[0.33, 0.66, 1].map(f => `<line x1="10" x2="${w - 10}" y1="${(6 + (h - 26) * f).toFixed(1)}" y2="${(6 + (h - 26) * f).toFixed(1)}" stroke="#FFFFFF" stroke-opacity=".05"/>`).join('')}
<path d="${line} L${last[0].toFixed(1)} ${h - 20} L10 ${h - 20} Z" fill="url(#ar)"/>
<path d="${line}" stroke="#FF8A33" stroke-width="2.2" fill="none" stroke-linecap="round"/>
${xy.map(p => `<line x1="${p[0].toFixed(1)}" x2="${p[0].toFixed(1)}" y1="${h - 20}" y2="${h - 16}" stroke="#FFFFFF" stroke-opacity=".18"/>`).join('')}
<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="7" fill="#FF6A00" opacity=".6" filter="url(#gl)"/>
<circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.6" fill="#FFF3E6"/>
${points.map((p, i) => `<text x="${xy[i][0].toFixed(1)}" y="${h - 3}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="#7A7F87">${p.label}</text>`).join('')}
</svg>`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* glass panel with an orange rim that glows strongest at the bottom-right */
const GLASS = (strong) => `background:radial-gradient(120% 90% at 100% 100%, rgba(255,106,0,${strong ? 0.2 : 0.12}), transparent 55%), linear-gradient(160deg, #1B1816 0%, #111112 55%, #0D0D0E 100%);` +
  `box-shadow:inset 0 0 0 1px rgba(255,138,51,${strong ? 0.5 : 0.28}), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 ${strong ? 34 : 20}px rgba(255,106,0,${strong ? 0.22 : 0.12}), 0 24px 50px rgba(0,0,0,0.55);`;
const ICON_RING = 'background:radial-gradient(circle at 35% 30%, #2A2522, #141414);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.07);border-radius:50%;';

export const scrDreamer = {
  view() {
    const lb = PLABEL(Today());
    const sp = flowSplit(PSTART(Year(lb), Month(lb)), PEND(Year(lb), Month(lb)));
    const trend = nwTrend();
    const nw = trend[trend.length - 1].v, dlt = round2(nw - trend[trend.length - 2].v);
    const kept = sp.In > 0 ? (sp.In - sp.Out) / sp.In : null;
    const accN = DB.accounts.filter(a => a.AccStatus === 'Active' && a.AccType !== 'System').length;
    const mon = fmtD(lb, 'mmm').toUpperCase();
    const openPocket = () => { NAV.stack = []; Navigate('scrHome'); };
    const roundBtn = (x, ic, onClick, label) => html`
      <div class="abs tap" style=${`left:${x}px;top:22px;width:40px;height:40px;${ICON_RING}`} onClick=${onClick} aria-label=${label} role="button">${I(0, 0, 40, 40, ic, '#EDE6DC', { pad: 10 })}</div>`;
    const stat = (x, cap, v, c, id, divider) => html`
      ${divider ? R(x - 14, 2, 1, 36, 'rgba(255,255,255,0.08)') : null}
      ${L(x, 0, 104, 12, cap, { s: 5.5, w: 6, c: '#7A7F87', ls: 1.5 })}
      ${L(x, 15, 108, 20, v, { s: 10, w: 6, c: c || K.text, id })}`;
    const tile = (x, id, ic, art, name, strong) => html`
      <div class="abs" data-t=${'mod-' + id} style=${`left:${x}px;top:0;width:174px;height:182px;border-radius:22px;overflow:hidden;${GLASS(strong)}`}>
        <div class="abs" style=${`left:14px;top:14px;width:34px;height:34px;${ICON_RING}`}>${I(0, 0, 34, 34, ic, OR, { pad: 8 })}</div>
        ${L(58, 22, 110, 16, 'COMING SOON', { s: 5.5, w: 6, c: '#8A8F97', ls: 1.8 })}
        <div class="abs svgimg" style="left:7px;top:52px;width:160px;height:96px" dangerouslySetInnerHTML=${{ __html: art }}></div>
        ${L(16, 146, 130, 28, name, { s: 13.5, font: SERIF, c: '#F4EFE6', st: 'letter-spacing:-0.2px;' })}
        ${I(144, 150, 20, 20, 'ChevronRight', '#9A9FA7', { pad: 3 })}
      </div>`;

    const kids = html`
      <div class="box" style="position:relative;flex:none;width:390px;height:240px;margin:0 -12px;overflow:visible">
        <div class="abs svgimg" style="left:0;top:0;width:390px;height:340px;pointer-events:none" dangerouslySetInnerHTML=${{ __html: SKY }}></div>
        ${Brand(22, 20, 260, 44, false, false, 'Dreamer')}
        ${roundBtn(286, 'History', () => syncNow(), 'Refresh')}
        ${roundBtn(334, 'Settings', () => Navigate('scrMore'), 'Settings')}
        <div class="abs" style=${`left:22px;top:96px;width:300px;font-family:${SERIF};font-size:34px;line-height:1.08;color:#F4EFE6;letter-spacing:-0.6px`} data-t="greet">
          ${greeting()},<br/><span style="color:#FF7A1A">dreamer.</span>
        </div>
        ${L(23, 186, 300, 14, fmtD(Today(), 'dddd, dd mmmm yyyy').toUpperCase(), { s: 6, w: 6, c: '#A39B90', ls: 2 })}
      </div>
      <div class="box tap" data-t="mod-pocket" onClick=${openPocket} style=${`position:relative;flex:none;width:366px;height:258px;border-radius:26px;${GLASS(true)}`}>
        ${I(18, 16, 26, 26, 'Wallet', OR, { pad: 3 })}
        ${L(56, 21, 200, 14, 'POCKET DREAMER', { s: 6.5, w: 6, c: '#EDE6DC', ls: 2.4 })}
        ${L(220, 15, 128, 26, 'Open  ›', { s: 9, w: 6, c: OR, a: 'r' })}
        ${L(18, 52, 200, 12, 'NET WORTH', { s: 5.5, w: 6, c: '#8A8F97', ls: 1.8 })}
        ${L(18, 66, 280, 36, sRM(nw), { s: 21, w: 6, id: 'mainNw', c: '#F4EFE6', st: 'letter-spacing:-0.6px;' })}
        ${L(18, 102, 260, 16, (dlt >= 0 ? '▲ ' : '▼ ') + RM(Math.abs(dlt)) + ' since ' + trend[trend.length - 2].label, { s: 7.5, w: 6, c: dlt >= 0 ? K.grn : K.red, id: 'mainDelta' })}
        <div class="abs svgimg" style="left:6px;top:122px;width:354px;height:82px" dangerouslySetInnerHTML=${{ __html: spark(trend, 354, 82) }}></div>
        ${R(18, 210, 330, 1, 'rgba(255,255,255,0.07)')}
        <div class="abs" style="left:18px;top:218px;width:330px;height:38px">
          ${stat(0, mon + ' SPENT', RM(sp.Out), null, 'mainSpent')}
          ${stat(124, 'KEPT', kept === null ? '—' : pct(Math.max(kept, -9.99)), kept === null ? K.sub : kept >= 0 ? K.grn : '#FF5A4E', 'mainKept', true)}
          ${stat(222, 'ACCOUNTS', String(accN), null, 'mainAcc', true)}
        </div>
      </div>
      <div class="box" style="position:relative;flex:none;width:366px;height:182px;background:transparent;overflow:visible">
        ${tile(0, 'financial', 'Bars', FIN_ART, 'Financial', true)}
        ${tile(192, 'roaming', 'Globe', ROAM_ART, 'Roaming', false)}
      </div>
      <div class="box" style="position:relative;flex:none;width:366px;height:58px">
        ${L(0, 12, 366, 22, 'Live well today. Build well for tomorrow.', { s: 9.5, font: SERIF, c: '#7E838B', a: 'c', st: 'font-style:italic;' })}
        ${L(0, 36, 366, 14, 'DREAMER  ·  POCKET V' + VERSION, { s: 5.5, w: 6, c: '#5E636B', a: 'c', ls: 1.8 })}
      </div>`;

    return html`<div style="position:absolute;inset:0;background:#0A0A0B">${Flow(0, 0, 390, 844, kids, { pad: [0, 12, 30, 12], gap: 16 })}</div>`;
  }
};
