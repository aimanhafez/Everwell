// MansWell Logbook · the route map (dark land, province lines, a glowing road route, labelled pins) and the elevation profile.
// Drawn by the app from small Natural Earth files that load only when a map is first shown (one file per continent).
import { html, K, rerender } from '../core.js';
import * as L from './engine.js';

/* ───────── map data, loaded on first use ───────── */
const GEO = { land: null, prov: {}, loading: {} };
const CK = { Africa: 'af', Asia: 'as', Europe: 'eu', 'North America': 'na', 'South America': 'sa', Oceania: 'oc' };
const decode = d => { const o = new Float64Array(d.length); let x = 0, y = 0; for (let i = 0; i < d.length; i += 2) { x += d[i]; y += d[i + 1]; o[i] = x / 100; o[i + 1] = y / 100; } return o; };
const bbOf = a => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < a.length; i += 2) { if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i]; if (a[i + 1] < y0) y0 = a[i + 1]; if (a[i + 1] > y1) y1 = a[i + 1]; } return [x0, y0, x1, y1]; };
function need(conts) {
  if (!GEO.land && !GEO.loading.land) {
    GEO.loading.land = import('./geo/land.js').then(m => { GEO.land = m.LAND.map(([iso, a3, rings]) => ({ iso, rings: rings.map(r => { const a = decode(r); return { a, bb: bbOf(a) }; }) })); rerender(); }).catch(() => { GEO.loading.land = null; });
  }
  for (const c of conts) {
    const k = CK[c]; if (!k || GEO.prov[k] || GEO.loading[k]) continue;
    GEO.loading[k] = import('./geo/prov-' + k + '.js').then(m => { GEO.prov[k] = m.LINES.map(r => { const a = decode(r); return { a, bb: bbOf(a) }; }); rerender(); }).catch(() => { GEO.loading[k] = null; });
  }
}
export const geoReady = () => !!GEO.land;

/* ───────── projection (Web Mercator, degrees) ───────── */
const my = lat => Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360)) * 180 / Math.PI;
/** The view that fits points [[lat,lng]] in w×h with padding, as {x0, y0, k} so px = (lng - x0)·k, py = (y0 - my(lat))·k. */
export function fit(pts, w, h, pad = 0.18, minSpan = 0.25) {
  if (!pts.length) pts = [[3.1, 101.7]];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [la, ln] of pts) { const y = my(la); x0 = Math.min(x0, ln); x1 = Math.max(x1, ln); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  let sx = Math.max(x1 - x0, minSpan), sy = Math.max(y1 - y0, minSpan); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  sx *= 1 + pad * 2; sy *= 1 + pad * 2; const k = Math.min(w / sx, h / sy);
  return { x0: cx - w / 2 / k, y0: cy + h / 2 / k, k, w, h };
}
const P2 = (v, la, ln) => [(ln - v.x0) * v.k, (v.y0 - my(la)) * v.k];
function geoPaths(v, conts, home = []) {
  need(conts);
  const lon0 = v.x0, lon1 = v.x0 + v.w / v.k, yTop = v.y0, yBot = v.y0 - v.h / v.k;
  // bounding boxes are in lon/lat: convert the view's mercator y back to lat
  const lat = y => (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI, la0 = lat(yBot), la1 = lat(yTop);
  const hit = bb => bb[2] >= lon0 && bb[0] <= lon1 && bb[3] >= la0 && bb[1] <= la1;
  const ring = (a, close) => { let s = ''; let px = -1e9, py = -1e9; for (let i = 0; i < a.length; i += 2) { const x = (a[i] - v.x0) * v.k, y = (v.y0 - my(a[i + 1])) * v.k; if (i && Math.abs(x - px) < 0.6 && Math.abs(y - py) < 0.6 && i < a.length - 2) continue; s += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); px = x; py = y; } return s + (close ? 'Z' : ''); };
  let land = '', lit = '', prov = '';
  if (GEO.land) for (const c of GEO.land) for (const r of c.rings) if (hit(r.bb)) { if (home.includes(c.iso)) lit += ring(r.a, true); else land += ring(r.a, true); }
  for (const cn of conts) { const ls = GEO.prov[CK[cn]]; if (ls) for (const r of ls) if (hit(r.bb)) prov += ring(r.a, false); }
  return { land, lit, prov, ready: !!GEO.land };
}

/* ───────── the route map ───────── */
/** The theme's accent, and a lighter version for the bright core of the road. */
const hexRgb = h => { const r = /rgb\((\d+),(\d+),(\d+)\)/.exec(String(h || '').replace(/\s/g, '')); if (r) return [+r[1], +r[2], +r[3]]; const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '').trim()); if (!m) return [255, 122, 26]; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixW = (h, f) => { const [r, g, b] = hexRgb(h); return 'rgb(' + [r, g, b].map(v => Math.round(v + (255 - v) * f)).join(',') + ')'; };
/** On the dark map a light theme's deep accent (Ivory maroon) is lifted a little so it still glows. */
const accent = () => { const a = /^#?[0-9a-f]{6}$/i.test(String(K.or || '').trim()) ? K.or : '#FF7A1A'; return K.light ? mixW(a, 0.3) : a; };
let uid = 0;
const trunc = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
/**
 * o: { id, days:[n…], w, h, perDay, view (optional {x0,y0,k}), labels (default true), onPin(day), key }
 * Returns { svg, view } so callers (the full map) can pan and zoom.
 */
export function RouteMap(o) {
  const id = o.id, ds = o.days, w = o.w, h = o.h;
  const lines = ds.map(d => ({ d, ...L.lineOf(id, d) })).filter(x => x.pts.length);
  const pins = []; ds.forEach(d => L.stops(id, d).filter(L.hasPin).forEach(s => pins.push({ d, s })));
  const all = [].concat(...lines.map(x => x.pts), pins.map(p => [Number(p.s.LpLat), Number(p.s.LpLng)]));
  const v = o.view || fit(all, w, h, o.pad ?? 0.2);
  const isos = L.isosOf(id), conts = [...new Set(isos.map(iso => (L.P.BY[iso] || {}).cont).filter(Boolean))];
  const g = geoPaths(v, conts.length ? conts : ['Asia'], isos);
  // style of the example map: dark sea, darker neighbours, the journey's country lit, thin province lines, glowing orange road
  const fid = 'lbg' + (++uid), z = o.view ? Math.sqrt(v.k / (o.baseK || v.k)) : 1, s1 = 1 / z;
  const path = pts => pts.map((p, i) => { const q = P2(v, p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('');
  const route = lines.map((x, i) => {
    const c = o.perDay ? L.DAYC[(x.d - 1) % L.DAYC.length] : mixW(accent(), 0.08), glow = o.perDay ? c : accent(), d = path(x.pts), dash = x.road ? '' : '6 6';
    return html`<g key=${'r' + i}><path d=${d} fill="none" stroke=${glow} stroke-width=${11 * s1} stroke-opacity=".42" stroke-linecap="round" stroke-linejoin="round" filter=${`url(#${fid})`} />
      <path d=${d} fill="none" stroke=${c} stroke-width=${3.4 * s1} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray=${dash} />
      <path d=${d} fill="none" stroke=${mixW(accent(), 0.6)} stroke-width=${1.2 * s1} stroke-opacity=${o.perDay ? 0.5 : 0.95} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray=${dash} /></g>`;
  });
  const first = pins[0], last = pins[pins.length - 1], showLab = o.labels !== false, placed = [];
  const pinEls = pins.map((p, i) => {
    const [x, y] = P2(v, Number(p.s.LpLat), Number(p.s.LpLng)), isS = p === first, isE = p === last && pins.length > 1;
    const c = isS ? '#57C23A' : isE ? '#E8343B' : (o.perDay ? L.DAYC[(p.d - 1) % L.DAYC.length] : accent()), r = 7 * s1;
    let lab = null;
    const name = trunc(p.s.LpPlace, 18), tw = (name.length * 6.3 + 14) * s1, th = 20 * s1;
    if (showLab && x > -20 && x < w + 20 && y > -20 && y < h + 20 && !placed.some(q => Math.abs(q[1] - y) < th + 2 * s1 && Math.abs(q[0] - x) < tw + 10 * s1)) {
      const right = x + 12 * s1 + tw < w - 4; placed.push([x, y]);
      const lx = right ? x + 11 * s1 : x - 11 * s1 - tw;
      lab = html`<g style="pointer-events:none"><rect x=${lx} y=${y - th / 2} width=${tw} height=${th} rx=${6 * s1} fill="rgba(9,11,15,.84)" stroke="rgba(255,255,255,.1)" stroke-width=${s1} />
        <text x=${lx + 7 * s1} y=${y + 4 * s1} font-size=${11 * s1} font-weight="600" fill="#EEF0F3">${name}</text></g>`;
    }
    return html`<g key=${'p' + i} style=${o.onPin ? 'cursor:pointer' : ''} onClick=${o.onPin ? () => o.onPin(p.d, p.s) : null} data-t=${'pin-' + p.s.LpId}>
      <circle cx=${x} cy=${y} r=${r * 1.9} fill=${c} opacity=".25" filter=${`url(#${fid}b)`} /><circle cx=${x} cy=${y} r=${r} fill=${c} stroke="rgba(255,255,255,.92)" stroke-width=${1.5 * s1} /><circle cx=${x} cy=${y} r=${r * 0.36} fill="#fff" />${lab}</g>`;
  });
  const svg = html`<svg viewBox=${`0 0 ${w} ${h}`} width=${w} height=${h} style="display:block;width:100%;height:auto" data-t=${o.key || 'routeMap'}>
    <defs><filter id=${fid} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=${4.5 * s1} /></filter><filter id=${fid + 'b'}><feGaussianBlur stdDeviation=${2.5 * s1} /></filter>
      <radialGradient id=${fid + 'v'} cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#11141A" /><stop offset="1" stop-color="#07080B" /></radialGradient></defs>
    <rect width=${w} height=${h} fill=${`url(#${fid}v)`} />
    ${g.ready ? html`<path d=${g.land} fill="#0D0F13" stroke="#1C2027" stroke-width=".8" fill-rule="evenodd" /><path d=${g.lit} fill="#181C23" stroke="#3B424D" stroke-width="1.3" fill-rule="evenodd" />`
      : html`<text x=${w / 2} y=${h / 2} text-anchor="middle" font-size="11" fill="#556">Loading map…</text>`}
    ${g.prov ? html`<path d=${g.prov} fill="none" stroke="rgba(160,170,185,.17)" stroke-width=".7" />` : null}
    ${route}${pinEls}
  </svg>`;
  return { svg, view: v, empty: !all.length };
}

/** The journey map card in the style of the example (ROUTE MAP · View Full Map · country, total km, days). Ready for Atlas. */
export function RouteCard(o) {
  const t = L.journey(o.id); if (!t) return null;
  const tot = L.lbTotals(o.id), iso = L.isosOf(o.id).find(x => x !== L.P.homeIso()) || L.isosOf(o.id)[0], cn = ((L.P.BY[iso] || {}).name || '').toUpperCase();
  const m = RouteMap({ id: o.id, days: L.days(t).map(d => d.n), w: o.w || 366, h: o.h || 400, perDay: o.perDay, onPin: o.onPin, key: o.key || 'routeCard', pad: 0.16 });
  return html`<div class="lbcard" data-t=${(o.key || 'routeCard') + 'Box'}>${m.svg}
    <div class="hd"><b>ROUTE MAP</b>${o.onFull ? html`<span onClick=${o.onFull} data-t="routeFull">View Full Map <i>⤢</i></span>` : null}</div>
    <div class="ov"><div class="c">${cn}</div><div class="ln"></div>
      <div class="st"><i></i><div><b>${L.n0(tot.km)} Km</b><span>Total Distance</span></div></div><div class="bar"></div>
      <div class="st"><i></i><div><b>${tot.days} Days</b><span>Total Trip</span></div></div></div></div>`;
}
export const routeCardCss = () => { const a = accent(), soft = mixW(a, 0.75); return `
.lbcard{position:relative;border-radius:18px;overflow:hidden;background:#07080B;box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.lbcard .hd{position:absolute;left:16px;right:16px;top:14px;display:flex;justify-content:space-between;align-items:center;color:#fff}.lbcard .hd b{font:800 16px Inter,system-ui;letter-spacing:.5px}
.lbcard .hd span{font-size:12px;color:#C9CED6;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.lbcard .hd i{font-style:normal;margin-left:8px;display:inline-block;text-decoration:none}
.lbcard .ov{position:absolute;left:16px;bottom:16px;color:#fff;pointer-events:none}.lbcard .c{font:700 16px Inter,system-ui;letter-spacing:1.4px;color:#9AA3AE}.lbcard .ln{width:96px;height:1px;background:#3A414C;margin:6px 0 10px}
.lbcard .st{display:grid;grid-template-columns:20px 1fr;gap:9px;align-items:start}.lbcard .st i{width:16px;height:16px;border-radius:50%;border:3px solid ${a};background:#0B0D11;display:block;box-shadow:0 0 8px color-mix(in srgb,${a} 60%,transparent);position:relative}
.lbcard .st i:after{content:'';position:absolute;inset:2.5px;border-radius:50%;background:${soft}}.lbcard .st b{font-size:19px;font-weight:600;display:block;line-height:1}.lbcard .st span{font-size:11px;color:#9AA3AE;display:block;margin-top:4px}
.lbcard .bar{width:2px;height:16px;background:${a};margin:3px 0 3px 7px}
.lbday .ov2,.lbmap .ovc{pointer-events:none}`; };

/* ───────── elevation profile ───────── */
/** ele: heights spread evenly along km. fr: stop positions (0..1). l.scrub (0..1) shows one point. */
export function Profile(l, key, ele, km, fr = [], o = {}) {
  const w = o.w || 340, h = o.h || 104, padL = 30, padB = 16, W = w - padL - 4, H = h - padB - 6;
  if (ele.length < 2) return html`<div class="lnote">No heights yet.</div>`;
  let lo = Math.min(...ele), hi = Math.max(...ele); const span = Math.max(100, hi - lo); lo = Math.max(0, lo - span * 0.12); hi = hi + span * 0.08;
  const X = f => padL + f * W, Y = v => 6 + H - (v - lo) / (hi - lo) * H;
  const line = ele.map((v, i) => (i ? 'L' : 'M') + X(i / (ele.length - 1)).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
  const step = (hi - lo) > 1600 ? 1000 : (hi - lo) > 700 ? 500 : (hi - lo) > 300 ? 200 : 100, grid = [];
  for (let g = Math.ceil(lo / step) * step; g < hi; g += step) grid.push(g);
  const kmStep = km > 400 ? 100 : km > 150 ? 50 : km > 60 ? 20 : km > 20 ? 5 : 1, kms = []; for (let k = 0; k <= km; k += kmStep) kms.push(k);
  const sc = l.scrub && l.scrub[key] !== undefined ? l.scrub[key] : null, gid = 'lbe' + key;
  const at = sc === null ? null : (() => { const f = sc * (ele.length - 1), i = Math.floor(f); return Math.round(ele[i] + ((ele[i + 1] ?? ele[i]) - ele[i]) * (f - i)); })();
  const move = e => { const r = e.currentTarget.getBoundingClientRect(), f = ((e.clientX - r.left) / r.width * w - padL) / W; (l.scrub = l.scrub || {})[key] = Math.max(0, Math.min(1, f)); rerender(); };
  const himax = ele.indexOf(Math.max(...ele));
  return html`<svg viewBox=${`0 0 ${w} ${h}`} style="display:block;width:100%;height:auto;touch-action:pan-y" onPointerDown=${move} onPointerMove=${e => (e.buttons || e.pointerType === 'touch') && move(e)} data-t=${'prof-' + key}>
    <defs><linearGradient id=${gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color=${K.or} stop-opacity=".55" /><stop offset="1" stop-color=${K.or} stop-opacity=".03" /></linearGradient></defs>
    ${grid.map(g => html`<line x1=${padL} x2=${w - 4} y1=${Y(g)} y2=${Y(g)} stroke=${K.sep} stroke-dasharray="2 3" /><text x=${padL - 4} y=${Y(g) + 3} text-anchor="end" font-size="8.5" fill=${K.mute}>${g >= 1000 ? (g / 1000) + 'k' : g}</text>`)}
    ${kms.map(k => html`<text x=${X(k / (km || 1))} y=${h - 3} text-anchor="middle" font-size="8.5" fill=${K.mute}>${k}</text>`)}
    <path d=${line + `L${X(1)},${6 + H}L${X(0)},${6 + H}Z`} fill=${`url(#${gid})`} /><path d=${line} fill="none" stroke=${K.or} stroke-width="1.8" stroke-linejoin="round" />
    ${fr.map((f, i) => html`<g><line x1=${X(f)} x2=${X(f)} y1=${6} y2=${6 + H} stroke=${K.text} stroke-opacity=".18" /><circle cx=${X(f)} cy=${8} r="6.5" fill=${i === 0 ? '#34C77B' : i === fr.length - 1 ? '#E5484D' : K.panel} stroke=${K.or} stroke-width=${i === 0 || i === fr.length - 1 ? 0 : 1.2} /><text x=${X(f)} y=${10.8} text-anchor="middle" font-size="7.5" font-weight="700" fill=${i === 0 || i === fr.length - 1 ? '#fff' : K.text}>${i === 0 ? 'S' : i === fr.length - 1 ? 'E' : i}</text></g>`)}
    <circle cx=${X(himax / (ele.length - 1))} cy=${Y(ele[himax])} r="3" fill=${K.or} stroke=${K.panel} stroke-width="1.5" />
    ${sc !== null ? html`<g data-t=${'scrub-' + key}><line x1=${X(sc)} x2=${X(sc)} y1=${6} y2=${6 + H} stroke=${K.text} stroke-width="1" /><circle cx=${X(sc)} cy=${Y(at)} r="4" fill=${K.text} />
      <text x=${Math.min(w - 50, Math.max(padL + 40, X(sc)))} y=${Math.max(16, Y(at) - 9)} text-anchor="middle" font-size="10" font-weight="700" fill=${K.text} stroke=${K.panel} stroke-width="3" paint-order="stroke">km ${L.n0(sc * km)} · ${L.n0(at)} m</text></g>` : null}
  </svg>`;
}
