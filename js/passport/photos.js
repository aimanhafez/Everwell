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
  const big = draw(img, 1600, 0.82);
  let t = null; for (const [m, q] of [[360, 0.72], [320, 0.62], [260, 0.55], [200, 0.5]]) { t = draw(img, m, q); if (t.url.length < 45000) break; }
  const taken = file.lastModified ? new Date(file.lastModified).toISOString().slice(0, 10) : '';
  return { data: big.url.split(',')[1], thumb: t.url, w: big.w, h: big.h, taken };
}
export const newPhotoId = () => 'PH-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Upload photos one by one. onStep(i, n) reports progress. Returns the saved rows. */
export async function upload(files, o) {
  if (!navigator.onLine) { Notify('Photos need the internet to save to your Drive. Try again when you are online.', 'error'); return []; }
  const rows = [];
  for (let i = 0; i < files.length; i++) {
    o.onStep && o.onStep(i + 1, files.length);
    try {
      const p = await prepare(files[i]), id = newPhotoId();
      const row = await api('ppPhotoUp', { id, trip: o.trip, folder: o.folder, data: p.data, thumb: p.thumb, w: p.w, h: p.h, taken: p.taken, seq: (o.seq || 0) + i + 1 }, undefined, { quiet: true });
      mem.set(id, p.thumb); cachePut(keyT(id), p.thumb);
      applySaved({ PP_Photos: [row] }); rows.push(row);
    } catch (e) { Notify(/setupPassport/.test(e.message) ? e.message : "Couldn't save a photo: " + e.message, 'error'); if (/setupPassport/.test(e.message)) break; }
  }
  o.onStep && o.onStep(0, 0);
  rerender();
  return rows;
}
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
