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
function geoPaths(v, conts) {
  need(conts);
  const lon0 = v.x0, lon1 = v.x0 + v.w / v.k, yTop = v.y0, yBot = v.y0 - v.h / v.k;
  // bounding boxes are in lon/lat: convert the view's mercator y back to lat
  const lat = y => (2 * Math.atan(Math.exp(y * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI, la0 = lat(yBot), la1 = lat(yTop);
  const hit = bb => bb[2] >= lon0 && bb[0] <= lon1 && bb[3] >= la0 && bb[1] <= la1;
  const ring = (a, close) => { let s = ''; let px = -1e9, py = -1e9; for (let i = 0; i < a.length; i += 2) { const x = (a[i] - v.x0) * v.k, y = (v.y0 - my(a[i + 1])) * v.k; if (i && Math.abs(x - px) < 0.6 && Math.abs(y - py) < 0.6 && i < a.length - 2) continue; s += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); px = x; py = y; } return s + (close ? 'Z' : ''); };
  let land = '', prov = '';
  if (GEO.land) for (const c of GEO.land) for (const r of c.rings) if (hit(r.bb)) land += ring(r.a, true);
  for (const cn of conts) { const ls = GEO.prov[CK[cn]]; if (ls) for (const r of ls) if (hit(r.bb)) prov += ring(r.a, false); }
  return { land, prov };
}

/* ───────── the route map ───────── */
let uid = 0;
const trunc = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
/**
 * o: { id, days:[n…], w, h, perDay, view (optional {x0,y0,k}), labels (default true), onPin(day), key }
 * Returns { svg, view } so callers (the full map) can pan and zoom.
 */
export function RouteMap(o) {
  const id = o.id, ds = o.days, w = o.w, h = o.h, light = false; // always the dark map (like your example); the route takes the theme's colour
  const lines = ds.map(d => ({ d, ...L.lineOf(id, d) })).filter(x => x.pts.length);
  const pins = []; ds.forEach(d => L.stops(id, d).filter(L.hasPin).forEach(s => pins.push({ d, s })));
  const all = [].concat(...lines.map(x => x.pts), pins.map(p => [Number(p.s.LpLat), Number(p.s.LpLng)]));
  const v = o.view || fit(all, w, h);
  const conts = [...new Set(L.isosOf(id).map(iso => (L.P.BY[iso] || {}).cont).filter(Boolean))];
  const g = geoPaths(v, conts.length ? conts : ['Asia']);
  const sea = light ? '#DCE5EC' : '#05070A', land = light ? '#FBFAF7' : '#1A1F27', edge = light ? '#B9C1C9' : '#3A4350', prov = light ? 'rgba(80,90,100,.3)' : 'rgba(180,190,205,.24)';
  const fid = 'lbg' + (++uid), z = o.view ? Math.sqrt(v.k / (o.baseK || v.k)) : 1;
  const path = pts => pts.map((p, i) => { const q = P2(v, p[0], p[1]); return (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join('');
  const route = lines.map((x, i) => {
    const c = o.perDay ? L.DAYC[(x.d - 1) % L.DAYC.length] : K.or, d = path(x.pts), dash = x.road ? '' : '5 5';
    return html`<g key=${'r' + i}><path d=${d} fill="none" stroke=${c} stroke-width=${7 / z} stroke-opacity=".38" stroke-linecap="round" stroke-linejoin="round" filter=${`url(#${fid})`} />
      <path d=${d} fill="none" stroke=${c} stroke-width=${2.6 / z} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray=${dash} />
      <path d=${d} fill="none" stroke=${light ? '#fff' : '#FFE3C7'} stroke-width=${0.9 / z} stroke-opacity=${o.perDay ? 0 : 0.8} stroke-linecap="round" stroke-dasharray=${dash} /></g>`;
  });
  const first = pins[0], last = pins[pins.length - 1], showLab = o.labels !== false;
  // keep labels apart: skip one that would sit on top of an earlier one
  const placed = [];
  const pinEls = pins.map((p, i) => {
    const [x, y] = P2(v, Number(p.s.LpLat), Number(p.s.LpLng)), isS = p === first, isE = p === last && pins.length > 1;
    const fill = isS ? '#34C77B' : isE ? '#E5484D' : (light ? '#fff' : '#0D0F12'), ring = isS || isE ? '#fff' : (o.perDay ? L.DAYC[(p.d - 1) % L.DAYC.length] : K.or), r = (isS || isE ? 6.5 : 5) / z;
    let lab = null;
    if (showLab && x > -20 && x < w + 20 && y > -20 && y < h + 20 && !placed.some(q => Math.abs(q[0] - x) < 70 && Math.abs(q[1] - y) < 14)) {
      placed.push([x, y]); const right = x < w * 0.68;
      lab = html`<text x=${x + (right ? 9 : -9) / z} y=${y + 3.5 / z} text-anchor=${right ? 'start' : 'end'} font-size=${10.5 / z} font-weight="600" fill=${light ? '#1D232B' : '#F1F3F6'} stroke=${light ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.85)'} stroke-width=${3 / z} paint-order="stroke" style="pointer-events:none">${trunc(p.s.LpPlace, 20)}</text>`;
    }
    return html`<g key=${'p' + i} style=${o.onPin ? 'cursor:pointer' : ''} onClick=${o.onPin ? () => o.onPin(p.d, p.s) : null} data-t=${'pin-' + p.s.LpId}>
      <circle cx=${x} cy=${y} r=${r + 4 / z} fill=${ring} opacity=".18" /><circle cx=${x} cy=${y} r=${r} fill=${fill} stroke=${ring} stroke-width=${2 / z} />${lab}</g>`;
  });
  const svg = html`<svg viewBox=${`0 0 ${w} ${h}`} width=${w} height=${h} style="display:block;width:100%;height:auto" data-t=${o.key || 'routeMap'}>
    <defs><filter id=${fid} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=${3.2 / z} /></filter></defs>
    <rect width=${w} height=${h} fill=${sea} />
    ${g.land ? html`<path d=${g.land} fill=${land} stroke=${edge} stroke-width=".7" fill-rule="evenodd" />` : html`<text x=${w / 2} y=${h / 2} text-anchor="middle" font-size="11" fill=${light ? '#889' : '#556'}>Loading map…</text>`}
    ${g.prov ? html`<path d=${g.prov} fill="none" stroke=${prov} stroke-width=".6" stroke-dasharray="2.5 2" />` : null}
    ${route}${pinEls}
  </svg>`;
  return { svg, view: v, empty: !all.length };
}

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
