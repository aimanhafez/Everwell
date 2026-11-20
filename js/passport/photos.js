// MansWell Passport · photos. Resized on the phone, the full photo saved to your Drive (private), a small preview
// kept in PP_Thumbs. Previews are kept on this phone after the first look, so lists open fast and work offline.
import { api, applySaved, rerender, Notify } from '../core.js';

const mem = new Map(), want = new Set();
let timer = null;
const CACHE = 'manswell-pp-photos';
const cacheOpen = () => (typeof caches !== 'undefined' ? caches.open(CACHE).catch(() => null) : Promise.resolve(null));
const keyT = id => new Request(location.origin + '/__pp/t/' + encodeURIComponent(id));
const keyF = id => new Request(location.origin + '/__pp/f/' + encodeURIComponent(id));
async function cacheGet(req) { const c = await cacheOpen(); if (!c) return null; const r = await c.match(req); return r ? r.text() : null; }
async function cachePut(req, text) { const c = await cacheOpen(); if (c) await c.put(req, new Response(text)).catch(() => {}); }

/** The preview of a photo, or null while it loads (the screen redraws when it arrives). */
export function thumb(id) {
  if (!id) return null;
  if (mem.has(id)) return mem.get(id);
  if (!want.has(id)) { want.add(id); clearTimeout(timer); timer = setTimeout(loadThumbs, 30); }
  return null;
}
async function loadThumbs() {
  const ids = [...want].filter(id => !mem.has(id)); want.clear(); if (!ids.length) return;
  const miss = [];
  for (const id of ids) { const t = await cacheGet(keyT(id)); if (t) mem.set(id, t); else miss.push(id); }
  for (let i = 0; i < miss.length; i += 40) {
    const part = miss.slice(i, i + 40);
    try {
      const got = await api('ppThumbs', { ids: part }, undefined, { quiet: true }) || {};
      for (const id of part) { const t = got[id] || ''; mem.set(id, t); if (t) cachePut(keyT(id), t); }
    } catch (e) { part.forEach(id => mem.delete(id)); }
  }
  rerender();
}

/** The full photo for big places (trip cover, Journeys cards): the preview shows first, the sharp one replaces it. */
const memF = new Map(), wantF = new Set();
export function hd(id) {
  if (!id) return null;
  if (memF.has(id)) return memF.get(id);
  if (!wantF.has(id)) {
    wantF.add(id);
    cacheGet(keyF(id)).then(c => c || api('ppPhoto', { id }, undefined, { quiet: true }).then(r => { cachePut(keyF(id), r.data); return r.data; }))
      .then(d => { memF.set(id, d || ''); rerender(); }).catch(() => { memF.set(id, ''); });
  }
  return null;
}
/** Background for a big photo spot: sharp photo when ready, the preview (or a gradient) until then. */
export function bgHd(id, seed) { const h = id ? hd(id) : null; return h ? `background:center/cover no-repeat url("${h}")` : bg(id, seed); }

/** The full photo (from this phone if seen before, otherwise from Drive). */
export async function full(id) {
  const c = await cacheGet(keyF(id)); if (c) return c;
  const r = await api('ppPhoto', { id });
  cachePut(keyF(id), r.data);
  return r.data;
}

/* resize on the phone */
function loadImg(file) {
  return new Promise((res, rej) => { const u = URL.createObjectURL(file), img = new Image(); img.onload = () => { res(img); setTimeout(() => URL.revokeObjectURL(u), 1000); }; img.onerror = () => rej(new Error('That file is not a photo this phone can open.')); img.src = u; });
}
function draw(img, max, q) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * r)), h = Math.max(1, Math.round(img.naturalHeight * r));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(img, 0, 0, w, h);
  return { url: cv.toDataURL('image/jpeg', q), w, h };
}
export async function prepare(file) {
  const img = await loadImg(file);
  const big = draw(img, 1440, 0.8); // a lighter file: about a third smaller, still sharp on a phone
  let t = null; for (const [m, q] of [[360, 0.72], [320, 0.62], [260, 0.55], [200, 0.5]]) { t = draw(img, m, q); if (t.url.length < 45000) break; }
  const taken = file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 10) : '';
  return { data: big.url.split(',')[1], thumb: t.url, w: big.w, h: big.h, taken };
}
export const newPhotoId = () => 'PH-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Upload photos, 3 at a time. onStep(done, n, secsLeft) reports progress. Returns the saved rows (in the order picked). */
export async function upload(files, o) {
  if (!navigator.onLine) { Notify('Photos need the internet to save to your Drive. Try again when you are online.', 'error'); return []; }
  const rows = new Array(files.length), t0 = Date.now(); let next = 0, done = 0, stop = false;
  const step = () => { const el = (Date.now() - t0) / 1000, left = done ? Math.round(el / done * (files.length - done)) : null; o.onStep && o.onStep(done, files.length, left); };
  step();
  const one = async i => {
    const p = await prepare(files[i]), id = newPhotoId();
    const row = await api('ppPhotoUp', { id, trip: o.trip, folder: o.folder, data: p.data, thumb: p.thumb, w: p.w, h: p.h, taken: p.taken, seq: (o.seq || 0) + i + 1 }, undefined, { quiet: true });
    mem.set(id, p.thumb); cachePut(keyT(id), p.thumb);
    const fullUrl = 'data:image/jpeg;base64,' + p.data; memF.set(id, fullUrl); cachePut(keyF(id), fullUrl);
    applySaved({ PP_Photos: [row] }); rows[i] = row;
  };
  const worker = async () => { while (!stop && next < files.length) { const i = next++; try { await one(i); } catch (e) { Notify(/setupPassport/.test(e.message) ? e.message : "Couldn't save a photo: " + e.message, 'error'); if (/setupPassport/.test(e.message)) stop = true; } done++; step(); rerender(); } };
  await Promise.all([worker(), worker(), worker()]);
  o.onStep && o.onStep(0, 0);
  rerender();
  return rows.filter(Boolean);
}
/* videos: a still frame for the preview, then the file goes to Drive in 4 MB parts */
export const MAX_VIDEO_S = 125, MAX_VIDEO_MB = 500;
/** Length, size and a still frame of a video. Phones differ a lot here (an iPhone often won't open a video it isn't playing),
 *  so every step has a time limit and falls back: no frame → a plain preview; no length → the video still saves. */
const plainThumb = () => { const c = document.createElement('canvas'); c.width = 360; c.height = 240; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 360, 240);
  gr.addColorStop(0, '#2B1E4A'); gr.addColorStop(0.55, '#7B3FE4'); gr.addColorStop(1, '#E2367A'); g.fillStyle = gr; g.fillRect(0, 0, 360, 240);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(180, 120, 34, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(168, 102); g.lineTo(198, 120); g.lineTo(168, 138); g.fill(); return c.toDataURL('image/jpeg', 0.7); };
const once = (el, evs, ms) => new Promise(res => { let t = null; const done = ok => { clearTimeout(t); evs.forEach(e => el.removeEventListener(e, on)); res(ok); }, on = () => done(true); evs.forEach(e => el.addEventListener(e, on)); t = setTimeout(() => done(false), ms); });
async function videoInfo(file) {
  const u = URL.createObjectURL(file), v = document.createElement('video');
  v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
  v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
  document.body.appendChild(v); v.src = u; try { v.load(); } catch (e) { /* older browsers */ }
  const out = { dur: 0, w: 0, h: 0, thumb: '' };
  try {
    if (await once(v, ['loadedmetadata', 'error'], 9000) && !v.error) {
      out.dur = isFinite(v.duration) ? v.duration : 0; out.w = v.videoWidth; out.h = v.videoHeight;
      // a frame to draw: seek a little in; if the phone won't, play for a moment
      let ok = v.readyState >= 2 || await once(v, ['loadeddata'], 3000);
      try { v.currentTime = Math.min(0.5, (out.dur || 1) / 3); ok = await once(v, ['seeked'], 4000); } catch (e) { ok = false; }
      if (!ok) { try { const pl = v.play(); if (pl && pl.then) await Promise.race([pl, new Promise(r => setTimeout(r, 3000))]); ok = await once(v, ['timeupdate'], 3000); v.pause(); } catch (e) { ok = false; } }
      if (v.videoWidth) {
        const r = Math.min(1, 360 / Math.max(v.videoWidth, v.videoHeight)), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(v.videoWidth * r)); cv.height = Math.max(1, Math.round(v.videoHeight * r));
        try { cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); const d = cv.toDataURL('image/jpeg', 0.7); if (d.length > 3000) out.thumb = d; } catch (e) { /* frame not drawable (some HDR videos) */ }
      }
    }
  } finally { v.removeAttribute('src'); try { v.load(); } catch (e) { /* */ } v.remove(); URL.revokeObjectURL(u); }
  if (!out.thumb) out.thumb = plainThumb();
  return out;
}
const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
/** Send one part straight to Drive's upload address. Resolves 'more' (308), 'done' (200/201) or rejects (blocked / network). */
function putPart(url, blob, start, total, onBytes) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest(); x.open('PUT', url); x.timeout = 180000;
    x.setRequestHeader('Content-Range', 'bytes ' + start + '-' + (start + blob.size - 1) + '/' + total);
    x.upload.onprogress = e => onBytes && onBytes(start + e.loaded);
    x.onload = () => (x.status === 308 ? res('more') : x.status === 200 || x.status === 201 ? res('done') : rej(new Error('Drive said ' + x.status)));
    x.onerror = () => rej(new Error('blocked')); x.ontimeout = () => rej(new Error('timed out'));
    x.send(blob);
  });
}
const mb = n => (n / 1048576 >= 100 ? Math.round(n / 1048576) : (n / 1048576).toFixed(1)) + ' MB';
const eta = s => (s < 60 ? 'about ' + Math.max(5, Math.round(s / 5) * 5) + ' s left' : 'about ' + Math.round(s / 60) + ' min left');
/** Upload videos one by one. Each goes straight from the phone to your Drive in 16 MB parts (no detour), with live progress;
 *  if the phone can't reach Drive that way, the rest goes through the Apps Script in 4 MB parts. onStep(text, fraction) reports progress. */
export async function uploadVideos(files, o) {
  if (!navigator.onLine) { Notify('Videos need the internet to save to your Drive.', 'error'); return []; }
  const rows = [], skipped = [], failed = [], DIRECT = 16 * 1024 * 1024, PART = 4 * 1024 * 1024;
  for (let k = 0; k < files.length; k++) {
    const f = files[k], tag = 'Saving video ' + (k + 1) + ' of ' + files.length;
    try {
      if (f.size > MAX_VIDEO_MB * 1024 * 1024) { skipped.push(f.name); continue; }
      o.onStep && o.onStep(tag + ' · getting it ready…', 0);
      const info = await videoInfo(f);
      if (info.dur > MAX_VIDEO_S || (!info.dur && f.size > 400 * 1024 * 1024)) { skipped.push(f.name); continue; }
      const id = newPhotoId().replace('PH-', 'VD-'), ext = (f.name.split('.').pop() || 'mp4').toLowerCase(), taken = f.lastModified ? new Date(f.lastModified).toISOString().slice(0, 10) : '';
      const meta = { id, total: f.size, mime: f.type || 'video/mp4', trip: o.trip, w: info.w, h: info.h, taken, seq: (o.seq || 0) + k + 1, dur: Math.round(info.dur), thumb: info.thumb };
      const st = await api('ppVideoStart', { id, folder: o.folder, size: f.size, mime: meta.mime, ext, origin: location.origin }, undefined, { quiet: true });
      const t0 = Date.now(), show = sent => { const el = (Date.now() - t0) / 1000, left = sent > 0 ? el / sent * (f.size - sent) : 0; o.onStep && o.onStep(tag + ' · ' + mb(sent) + ' of ' + mb(f.size) + (sent > 0 && el > 3 ? ' · ' + eta(left) : ''), sent / f.size); };
      show(0);
      // 1 · straight to Drive
      let at = 0;
      if (st && st.url) {
        try { for (; at < f.size; at += DIRECT) { const r = await putPart(st.url, f.slice(at, Math.min(f.size, at + DIRECT)), at, f.size, show); if (r === 'done') { at = f.size; break; } } } catch (e) { /* blocked or dropped: carry on below from where Drive got to */ }
      }
      // 2 · ask how far it got (and save the row if it is complete); finish through the Apps Script if needed
      let r = await api('ppVideoPart', { ...meta, query: true }, undefined, { quiet: true });
      let next = r && r.row ? f.size : (r && r.next) || 0;
      while (!(r && r.row) && next < f.size) {
        show(next);
        const data = b64(await f.slice(next, Math.min(f.size, next + PART)).arrayBuffer());
        r = await api('ppVideoPart', { ...meta, data, start: next }, undefined, { quiet: true });
        next = r && r.row ? f.size : (r && r.next) || next + PART;
      }
      if (r && r.row) { mem.set(id, info.thumb); cachePut(keyT(id), info.thumb); applySaved({ PP_Photos: [r.row] }); rows.push(r.row); rerender(); }
    } catch (e) { failed.push(f.name + ' (' + e.message + ')'); }
  }
  o.onStep && o.onStep('', 0);
  if (skipped.length) Notify(skipped.length + (skipped.length === 1 ? ' video was' : ' videos were') + ' not saved: longer than 2 minutes or too big. Trim ' + (skipped.length === 1 ? 'it' : 'them') + ' on the phone and add again.', 'error');
  else if (failed.length) Notify("Couldn't save " + failed.length + (failed.length === 1 ? ' video: ' : ' videos, e.g. ') + failed[0], 'error');
  rerender();
  return rows;
}
export const isVideo = p => p && p.PhKind === 'video';
export const durTxt = s => { s = Math.round(Number(s) || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
export const driveUrl = p => 'https://drive.google.com/file/d/' + encodeURIComponent(p.PhFile) + '/view';
/** Delete photos from Drive and the Sheet (needs the internet). */
export async function remove(ids) {
  if (!ids.length) return;
  await api('ppPhotoDel', { ids });
  ids.forEach(id => mem.delete(id));
}
/** Background style for a photo tile: the preview once it is here, a soft gradient until then. */
const GR = ['linear-gradient(160deg,#FFB36B,#E2367A 60%,#4B2A7A)', 'linear-gradient(165deg,#5ED1C9,#1E6F8C 60%,#0E2E4A)', 'linear-gradient(165deg,#F4C27A,#D9783A 50%,#7A2E22)', 'linear-gradient(165deg,#2B1E4A,#7B3FE4 45%,#E2367A)', 'linear-gradient(165deg,#C8E6A0,#4E9A5B 55%,#1E4A35)', 'linear-gradient(170deg,#9FC8E8,#E8EEF6 45%,#7C93B8)'];
export function bg(id, seed) {
  const t = id ? thumb(id) : null;
  if (t) return `background:center/cover no-repeat url("${t}")`;
  let h = 0; for (const ch of String(seed || id || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `background:${GR[h % GR.length]}`;
}
