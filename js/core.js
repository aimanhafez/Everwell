// MansWell — core: state, data access, Power Fx-like helpers and drawing primitives (Pocket + Lens).
// Every screen is drawn on a 390 x 844 canvas (the Power Apps phone layout) and scaled to the device.
import { html, render } from './vendor/preact-htm.js';
export { html };

export const VERSION = '3.6.1';

/* ───────────── Colours (same values as the Power App) ───────────── */
export const K = {
  bg: '#0D0F12', card: '#16191E', field: '#1E2228', line: '#262A31', sep: '#21252B',
  text: '#F4F2EE', sub: '#9AA0A8', mute: '#626872', or: '#FF6A00', grn: '#34C77B', red: '#E5484D', gold: '#E9B949',
  orSoft: 'rgba(255,106,0,0.12)', orBorder: 'rgba(255,106,0,0.45)', orTint: 'rgba(255,106,0,0.1)'
};
export const PALETTE = ['#FF6A00', '#E5484D', '#A3236F', '#E9B949', '#6B7178', '#34C77B'];

/* ───────────── Data (the SharePoint lists, now Google Sheet tabs) ───────────── */
export const DB = { settings: null, accounts: [], categories: [], payees: [], recurring: [], txns: [], audit: [], importMap: [], imports: [], sysOk: false,
  lnSettings: [], lnAssets: [], lnValues: [], lnGoals: [], lnBudget: [], lnOk: false, payslips: [], psOk: false,
  ppSettings: [], ppPlaces: [], ppTrips: [], ppStops: [], ppPhotos: [], ppOk: false,
  lbStops: [], lbTracks: [], lbExp: [], lbBudget: [], lbRates: [], lbResults: [], lbFinds: [], lbPlaces: null, lbOk: false };

/* ───────────── Global variables (Set(...) in the Power App) ───────────── */
export const G = {
  gblCycleDay: 28, gblMonth: 1, gblYear: 2026, gblFrom: '', gblTo: '',
  gblAccId: 'ACC-0001', gblTxnId: '', gblEditMode: 'new', gblCatTab: 'Categories',
  gblPrefill: { PfAcc: '', PfType: 'Expense', PfAmt: 0, PfCat: '', PfPayee: '', PfRule: '', PfDate: '' },
  gblTxAll: true, gblTxFrom: '', gblTxTo: '', gblTxLbl: 'All time'
};

/* ───────────── Screen-local variables (UpdateContext) ───────────── */
export const LOC = {};
export function loc(scr) { return LOC[scr] || (LOC[scr] = {}); }

/* ───────────── Dates (kept as 'yyyy-mm-dd' text) ───────────── */
const p2 = n => (n < 10 ? '0' : '') + n;
export function D(y, m, d) { // like Date(y, m, d) — overflow rolls over
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() + '-' + p2(dt.getUTCMonth() + 1) + '-' + p2(dt.getUTCDate());
}
export function parts(ds) { return ds.split('-').map(Number); }
export function Year(ds) { return parts(ds)[0]; }
export function Month(ds) { return parts(ds)[1]; }
export function Day(ds) { return parts(ds)[2]; }
export function Today() { const d = new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
export function addDays(ds, n) { const [y, m, d] = parts(ds); return D(y, m, d + n); }
export function addMonths(ds, n) { // DateAdd(..., Months) clamps to the month's last day
  const [y, m, d] = parts(ds);
  const idx = y * 12 + (m - 1) + n, ny = Math.floor(idx / 12), nm = idx % 12 + 1;
  const last = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return D(ny, nm, Math.min(d, last));
}
export function addYears(ds, n) { return addMonths(ds, 12 * n); }
export function diffDays(a, b) { const [y1, m1, d1] = parts(a), [y2, m2, d2] = parts(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5); }
export function weekday(ds) { const [y, m, d] = parts(ds); return new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1; } // Sunday = 1
export const minD = (a, b) => (a < b ? a : b);
export const maxD = (a, b) => (a > b ? a : b);

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export { MON };
export function fmtD(ds, f) {
  if (!ds) return '';
  const [y, m, d] = parts(ds);
  switch (f) {
    case 'dd mmm yyyy': return p2(d) + ' ' + MON[m - 1] + ' ' + y;
    case 'dd mmm': return p2(d) + ' ' + MON[m - 1];
    case 'mmm yyyy': return MON[m - 1] + ' ' + y;
    case 'mmmm yyyy': return MONTH[m - 1] + ' ' + y;
    case 'dd/mm/yyyy': return p2(d) + '/' + p2(m) + '/' + y;
    case 'dddd, dd mmmm yyyy': return DOW[weekday(ds) - 1] + ', ' + p2(d) + ' ' + MONTH[m - 1] + ' ' + y;
    case 'mmm': return MON[m - 1];
    case 'dd': return p2(d);
    default: return ds;
  }
}
export function fmtTime(iso, f) {
  if (!iso) return '';
  const t = new Date(iso);
  const dd = p2(t.getDate()), mm = p2(t.getMonth() + 1), hh = p2(t.getHours()), mi = p2(t.getMinutes());
  return f === 'dd/mm hh:mm' ? `${dd}/${mm} ${hh}:${mi}` : `${dd}/${mm}/${t.getFullYear()} ${hh}:${mi}`;
}
/** Parses "dd/mm/yyyy" the way the app's date boxes do. Returns a date or null. */
export function parseDMY(text) {
  const t = String(text || '').trim().replace(/[-.]/g, '/');
  const p = t.split('/');
  if (p.length !== 3) return null;
  const d = Number(p[0]) || 0, m = Number(p[1]) || 0, y0 = Number(p[2]) || 0;
  const y = y0 < 100 ? 2000 + y0 : y0;
  if (m >= 1 && m <= 12 && d >= 1 && y >= 1900 && y <= 2100 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate()) return D(y, m, d);
  return null;
}

/* ───────────── Financial months (cycle day, default 28) ───────────── */
export function CD() { return G.gblCycleDay || 28; }
/* Year rules (3.1.6): each year can start its months on its own day (24th–2nd), set when the previous year is closed.
 * Stored in EW_Settings.StYears as JSON: { cycle: { "2027": 25 }, closedThrough: "2026-12-27", closed: [2026] }.
 * A closed year never changes: the first month of the next year stretches or shrinks to meet the new day.
 * With no rules, every function below behaves exactly as before. */
let yrMemo = { src: undefined, v: {} }, pkMemo = new Map();
export function yearRules() {
  const src = DB.settings && DB.settings.StYears;
  if (yrMemo.src !== src) { let v = {}; try { v = JSON.parse(src || '{}') || {}; } catch (e) { v = {}; } yrMemo = { src, v }; pkMemo = new Map(); }
  return yrMemo.v;
}
function ruleOf(y) { const c = yearRules().cycle || {}; let best = null; for (const k of Object.keys(c)) if (+k <= y && (best === null || +k > best)) best = +k; return best === null ? null : Number(c[best]); }
/** The month-start day used by year y. */
export function cdOf(y) { const r = ruleOf(y); return r === null ? CD() : r; }
// day 1–2 from a rule: the month is named by the month it starts in (Jan = 2 Jan – 1 Feb); 24–31: by the month it ends in.
function rawStart(y, m, cd, rule) { return cd === 1 ? D(y, m, 1) : (rule && cd <= 2) ? D(y, m, cd) : addMonths(D(y, m, cd), -1); }
const sameRule = (a, b) => cdOf(a) === cdOf(b) && (ruleOf(a) === null) === (ruleOf(b) === null);
export function PSTART(y, m, cd) {
  if (cd !== undefined) return rawStart(y, m, cd, false);
  if (m === 1 && !sameRule(y, y - 1)) return addDays(PEND(y - 1, 12), 1);
  return rawStart(y, m, cdOf(y), ruleOf(y) !== null);
}
export function PEND(y, m, cd) {
  if (cd !== undefined) return addDays(addMonths(rawStart(y, m, cd, false), 1), -1);
  return addDays(rawStart(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, cdOf(y), ruleOf(y) !== null), -1);
}
/** The financial month (yyyymm) a date belongs to. */
export function perKey(ds) {
  yearRules(); const hit = pkMemo.get(ds); if (hit) return hit;
  const [y, m] = parts(ds), k0 = y * 100 + m, add = (k, n) => { const i = Math.floor(k / 100) * 12 + (k % 100) - 1 + n; return Math.floor(i / 12) * 100 + (i % 12) + 1; };
  let out = k0;
  for (const k of [add(k0, 1), k0, add(k0, -1)]) { const yy = Math.floor(k / 100), mm = k % 100; if (PSTART(yy, mm) <= ds && ds <= PEND(yy, mm)) { out = k; break; } }
  pkMemo.set(ds, out); return out;
}
/** The month a date belongs to (first day of that calendar month). With an explicit cycle day: the old single-rule answer. */
export function PLABEL(ds, cd) {
  if (cd !== undefined) { const [y, m, d] = parts(ds); return cd > 1 && d >= cd ? addMonths(D(y, m, 1), 1) : D(y, m, 1); }
  const k = perKey(ds); return D(Math.floor(k / 100), k % 100, 1);
}
/** The last day of the latest closed year ('' when none). Nothing on or before it can change in Pocket. */
export const yearClosedThrough = () => String(yearRules().closedThrough || '');
/** Years closed so far, e.g. [2026]. */
export const closedYears = () => (Array.isArray(yearRules().closed) ? yearRules().closed.map(Number) : []);
export function ordinal(o) { const k = o >= 11 && o <= 13 ? 0 : o % 10; return o + (k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'); }

export function setMonth(y, m) {
  G.gblYear = y; G.gblMonth = m;
  G.gblFrom = PSTART(y, m);
  G.gblTo = PEND(y, m);
}
export function monthLabel(f) { return fmtD(D(G.gblYear, G.gblMonth, 1), f); }
export function resetTxPeriodToMonth() {
  G.gblTxAll = false; G.gblTxFrom = G.gblFrom; G.gblTxTo = G.gblTo; G.gblTxLbl = monthLabel('mmm yyyy');
}

/* ───────────── Numbers ───────────── */
const nf2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
export const n2 = v => nf2.format(Math.round((Number(v) || 0) * 100) / 100);
export const n0 = v => nf0.format(Math.round(Number(v) || 0) || 0); // never "-0"
export const RM = v => 'RM ' + n2(v);
export const sRM = v => (v < 0 ? '-' : '') + 'RM ' + n2(Math.abs(v)); // If(x<0,"-","") & "RM " & Text(Abs(x))
export const pct = v => Math.round((Number(v) || 0) * 100) + '%';
export function Value(t) { const s = String(t ?? '').replace(/,/g, '').trim(); if (s === '') return null; const n = Number(s); return isFinite(n) ? n : null; }
export const sum = (list, f) => list.reduce((s, x) => s + (Number(f(x)) || 0), 0);
export const round2 = v => Math.round(v * 100) / 100;

/* ───────────── Derived figures (replace the EW_Summary list) ───────────── */
export function bal(accId) {
  let b = 0;
  for (const t of DB.txns) if (t.TxAcc === accId && !t.TxParent) b += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt;
  return round2(b);
}
/** Account movement per month key (A|period|account) */
export function accMoveUpTo(accId, key) {
  let b = 0;
  for (const t of DB.txns) if (t.TxAcc === accId && !t.TxParent && perKey(t.TxDate) <= key) b += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt;
  return round2(b);
}
/** The category decides which side a transaction counts on (Income category → money in, any other → money out);
 *  the type decides the sign. So Income booked to Sports lowers Sports spending, and Expense booked to Salary lowers income. */
let catMapSrc = null, catMapRev = -1, catMap = null;
export function catTypeOf(name) {
  if (catMapSrc !== DB.categories || catMapRev !== DBREV) { catMapSrc = DB.categories; catMapRev = DBREV; catMap = new Map((DB.categories || []).map(c => [c.CatName, c.CatType])); }
  return catMap.get(name);
}
export function flowOf(t) {
  const T = t.TxType;
  if (t.TxIsSplit || (T !== 'Income' && T !== 'Expense' && T !== 'Refund')) return null;
  const moneyIn = T !== 'Expense';               // Refund = older payback type, money in
  const ct = catTypeOf(t.TxCat);
  const side = ct === 'Income' ? 'In' : ct ? 'Out' : (moneyIn ? 'In' : 'Out');
  const v = (side === 'In') === moneyIn ? t.TxAmt : -t.TxAmt;
  return { side, v };
}
/** Money in / money out between two dates, netted by category side */
export function flowSum(from = G.gblFrom, to = G.gblTo) {
  let In = 0, Out = 0;
  for (const t of DB.txns) {
    if (t.TxDate < from || t.TxDate > to) continue;
    const f = flowOf(t); if (!f) continue;
    if (f.side === 'In') In += f.v; else Out += f.v;
  }
  return { In: round2(In), Out: round2(Out) };
}
/** Money out split into spending (Expense categories) and saving (Savings/Asset categories) */
export function flowSplit(from = G.gblFrom, to = G.gblTo) {
  let In = 0, Exp = 0, Sav = 0;
  const byInc = {};
  for (const t of DB.txns) {
    if (t.TxDate < from || t.TxDate > to) continue;
    const f = flowOf(t); if (!f) continue;
    if (f.side === 'In') { In += f.v; byInc[t.TxCat] = (byInc[t.TxCat] || 0) + f.v; }
    else if (catTypeOf(t.TxCat) === 'Savings/Asset') Sav += f.v; else Exp += f.v;
  }
  const top = Object.keys(byInc).sort((a, b) => byInc[b] - byInc[a])[0] || '';
  return { In: round2(In), Exp: round2(Exp), Sav: round2(Sav), Out: round2(Exp + Sav), Top: top };
}
/** Category totals for a month key or a year: {In, Out, N} — split lines instead of split parents. */
export function catTotals(filter) {
  const r = { In: 0, Out: 0, N: 0, by: {} };
  for (const t of DB.txns) {
    const f = flowOf(t); if (!f) continue;
    if (!filter(perKey(t.TxDate))) continue;
    r.N++; r[f.side] += f.v;
    const c = r.by[t.TxCat] || (r.by[t.TxCat] = { In: 0, Out: 0, N: 0 });
    c.N++; c[f.side] += f.v;
  }
  return r;
}
/** PSUM: sum of a type in the selected month */
export function psum(type, from = G.gblFrom, to = G.gblTo) {
  let s = 0;
  for (const t of DB.txns) if (!t.TxIsSplit && t.TxDate >= from && t.TxDate <= to && t.TxType === type) s += t.TxAmt;
  return round2(s);
}
/** Spending by category for the selected month (net of any money back into that category), biggest first */
export function catSpend(from = G.gblFrom, to = G.gblTo) {
  const by = {};
  for (const t of DB.txns) {
    if (t.TxDate < from || t.TxDate > to) continue;
    const f = flowOf(t);
    if (f && f.side === 'Out') by[t.TxCat] = (by[t.TxCat] || 0) + f.v;
  }
  const known = new Set(DB.categories.map(c => c.CatName));
  const extra = Object.keys(by).filter(k => !known.has(k)).map(k => ({ CatName: k || 'Uncategorised', CatType: 'Expense' }));
  return DB.categories.filter(c => c.CatType === 'Expense' || c.CatType === 'Savings/Asset').concat(extra)
    .map(c => ({ ...c, Amt: round2(by[c.CatName === 'Uncategorised' && !known.has('Uncategorised') ? '' : c.CatName] || 0) })).filter(c => c.Amt > 0)
    .sort((a, b) => b.Amt - a.Amt);
}
export const acc = id => DB.accounts.find(a => a.AccId === id);
export const accByName = nm => DB.accounts.find(a => a.AccName === nm);
export const txn = id => DB.txns.find(t => t.TxnId === id);
export const dueCount = () => DB.recurring.filter(r => r.RcActive && r.RcNext <= Today()).length;
export const txSortKey = t => t.TxDate.replace(/-/g, '') + String(t.TxSeq).padStart(6, '0');
export const byTxDesc = (a, b) => (txSortKey(a) < txSortKey(b) ? 1 : -1);
export function nextTxSeq() { return DB.txns.reduce((m, t) => Math.max(m, t.TxSeq || 0), 0) + 1; }
export function shortName(nm) {
  const t = nm.trim();
  const sp = t.indexOf(' ');
  return (sp < 0 ? t.slice(0, 2) : t[0] + t[sp + 1]).toUpperCase();
}

/* ───────────── Connection + API (SharePoint → Google Sheet) ───────────── */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
};
export { store };
export const CONN = { v: store.get('ew_conn', null) };

let busyN = 0;
function setBusy(d) { busyN += d; document.body.classList.toggle('busy', busyN > 0); }

export async function api(action, payload, conn = CONN.v, opts = {}) {
  if (!conn) throw new Error('Not connected.');
  if (!navigator.onLine) { const e = new Error("You're offline."); e.offline = true; throw e; }
  if (!opts.quiet) setBusy(1);
  try {
    let res;
    try {
      res = await fetch(conn.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ key: conn.key, action, payload: payload || {} }) });
    } catch (e) { const er = new Error("Can't reach Google. Check your internet connection."); er.offline = true; throw er; }
    const text = await res.text();
    let j;
    try { j = JSON.parse(text); } catch (e) { throw new Error('Unexpected reply. Check the Web app URL and that access is set to "Anyone".'); }
    if (!j.ok) { const err = new Error(j.error || 'Something went wrong.'); err.code = j.code; throw err; }
    return j.data;
  } finally { if (!opts.quiet) setBusy(-1); }
}

/* ───────────── Fast saving: change the app first, sync to Google in the background ─────────────
 * Every save is applied on the phone straight away and put in an "outbox" kept in phone storage.
 * The outbox is sent to Google one batch at a time. Each batch is safe to send twice (rows are keyed),
 * so nothing is lost if the app is closed, offline or interrupted: it is sent again next time. */
const MAP = { LB_Stops: ['lbStops', 'LpId'], LB_Tracks: ['lbTracks', 'TkKey'], LB_Expenses: ['lbExp', 'ExId'], LB_Budget: ['lbBudget', 'BgKey'], LB_Rates: ['lbRates', 'RtKey'], LB_Results: ['lbResults', 'RsTrip'], LB_Finds: ['lbFinds', 'FdId'], PP_Settings: ['ppSettings', 'PsetKey'], PP_Places: ['ppPlaces', 'PlIso'], PP_Trips: ['ppTrips', 'TrId'], PP_Stops: ['ppStops', 'StKey'], PP_Photos: ['ppPhotos', 'PhId'], EW_Payslips: ['payslips', 'PsKey'], LN_Settings: ['lnSettings', 'LsKey'], LN_Assets: ['lnAssets', 'AsId'], LN_Values: ['lnValues', 'VaId'], LN_Goals: ['lnGoals', 'GoId'], LN_Budget: ['lnBudget', 'BuKey'],
  SYS_ImportMap: ['importMap', 'MapKey'], SYS_Imports: ['imports', 'ImpId'], EW_Accounts: ['accounts', 'AccId'], EW_Categories: ['categories', 'CatId'], EW_Payees: ['payees', 'PyName'], EW_Recurring: ['recurring', 'RcId'], EW_Transactions: ['txns', 'TxnId'] };
export const SYNC = { outbox: store.get('ew_outbox', []), flushing: false, failed: false, timer: null };
/** Bumped whenever the data changes, so cached totals (Lens P&L) never show an old category, date or type. */
export let DBREV = 0;
function applyLocal(p) {
  DBREV++;
  for (const [t, keys] of Object.entries(p.deletes || {})) {
    if (!MAP[t]) continue;
    const [list, k] = MAP[t];
    DB[list] = DB[list].filter(x => !keys.includes(x[k]));
  }
  for (const [t, rows] of Object.entries(p.upserts || {})) {
    if (t === 'EW_Settings') { DB.settings = { ...rows[0] }; continue; }
    const [list, k] = MAP[t];
    for (const row of rows) {
      const i = DB[list].findIndex(x => x[k] === row[k]);
      if (i >= 0) DB[list][i] = { ...row }; else DB[list].push({ ...row });
    }
  }
  for (const l of p.log || []) if (!DB.audit.some(a => a.AuId === l.AuId)) DB.audit.unshift(l);
}
function syncState() {
  document.body.classList.toggle('syncing', SYNC.outbox.length > 0);
  document.body.classList.toggle('sync-wait', SYNC.outbox.length > 0 && (SYNC.failed || !navigator.onLine));
  const el = document.getElementById('syncnote');
  if (el) el.textContent = SYNC.outbox.length ? (navigator.onLine ? 'Saving to Google Sheets…' : 'Offline · ' + SYNC.outbox.length + ' change(s) saved on this phone, will sync') : '';
}
function persistOutbox() { store.set('ew_outbox', SYNC.outbox); syncState(); }
let cacheTimer = null;
const writeCache = () => { cacheTimer = null; store.set('ew_data', { at: Date.now(), settings: DB.settings, accounts: DB.accounts, categories: DB.categories, payees: DB.payees, recurring: DB.recurring, txns: DB.txns, audit: DB.audit.slice(0, 30), importMap: DB.importMap, imports: DB.imports, sysOk: DB.sysOk,
  lens: { settings: DB.lnSettings, assets: DB.lnAssets, values: DB.lnValues, goals: DB.lnGoals, budget: DB.lnBudget }, lnOk: DB.lnOk, payslips: DB.payslips, psOk: DB.psOk,
  passport: { settings: DB.ppSettings, places: DB.ppPlaces, trips: DB.ppTrips, stops: DB.ppStops, photos: DB.ppPhotos }, ppOk: DB.ppOk, srvVer: DB.srvVer,
  logbook: { stops: DB.lbStops, tracks: DB.lbTracks, expenses: DB.lbExp, budget: DB.lbBudget, rates: DB.lbRates, results: DB.lbResults, finds: DB.lbFinds, places: DB.lbPlaces }, lbOk: DB.lbOk }); };
function persistCache() { clearTimeout(cacheTimer); cacheTimer = setTimeout(writeCache, 300); }
/** Write a pending cache save now (the app is being closed / hidden). */
export function flushCache() { if (cacheTimer) { clearTimeout(cacheTimer); writeCache(); } }
export async function flush() {
  if (SYNC.flushing || !CONN.v) return;
  SYNC.flushing = true; syncState();
  try {
    while (SYNC.outbox.length) {
      const item = SYNC.outbox[0];
      try {
        await api('commit', item.p, CONN.v, { quiet: true });
        SYNC.outbox.shift(); SYNC.failed = false; persistOutbox();
      } catch (e) {
        if (e.offline) { SYNC.failed = true; break; }
        if (e.code === 'AUTH') { SYNC.failed = true; CONN.authError = e.message; NAV.stack = ['connect']; rerender(); break; }
        item.tries = (item.tries || 0) + 1;
        if (item.tries >= 3) {
          SYNC.outbox.shift(); persistOutbox();
          Notify("Couldn't save one change to Google Sheets: " + e.message + ' Tap ↻ to reload your data.', 'error');
        } else { persistOutbox(); SYNC.failed = true; break; }
      }
    }
  } finally {
    SYNC.flushing = false; syncState();
    clearTimeout(SYNC.timer);
    if (SYNC.outbox.length) SYNC.timer = setTimeout(flush, 8000);
  }
}
/** Last chance when the app is closed: hand pending batches to the browser to deliver. */
export function beaconOutbox() {
  if (!CONN.v || !SYNC.outbox.length || !navigator.sendBeacon) return;
  for (const item of SYNC.outbox) {
    try { navigator.sendBeacon(CONN.v.url, new Blob([JSON.stringify({ key: CONN.v.key, action: 'commit', payload: item.p })], { type: 'text/plain;charset=utf-8' })); } catch (e) { /* ignore */ }
  }
}

function applyLoaded(d) {
  DBREV++;
  DB.settings = d.settings ? { ...d.settings } : null;
  DB.accounts = d.accounts;
  DB.categories = d.categories;
  DB.payees = d.payees;
  DB.recurring = d.recurring;
  DB.txns = d.transactions || d.txns;
  DB.audit = d.activity || d.audit || [];
  // Dreamer tabs exist only once the Apps Script is v2.0 or newer
  DB.sysOk = Array.isArray(d.importMap) || !!d.sysOk;
  DB.importMap = d.importMap || []; DB.imports = d.imports || [];
  // Payslip tab exists only once the Apps Script is v3.1 or newer
  DB.psOk = Array.isArray(d.payslips) || !!d.psOk; DB.payslips = d.payslips || [];
  // Lens tabs exist only once the Apps Script is v3.0 or newer
  const ln = d.lens || null;
  DB.lnOk = !!ln || !!d.lnOk;
  DB.lnSettings = (ln && ln.settings) || []; DB.lnAssets = (ln && ln.assets) || []; DB.lnValues = (ln && ln.values) || [];
  DB.lnGoals = (ln && ln.goals) || []; DB.lnBudget = (ln && ln.budget) || [];
  // Passport tabs exist only once the Apps Script is v3.2 or newer
  const pp = d.passport || null;
  DB.srvVer = String(d.version || d.srvVer || '');
  DB.ppOk = !!pp || !!d.ppOk;
  DB.ppSettings = (pp && pp.settings) || []; DB.ppPlaces = (pp && pp.places) || []; DB.ppTrips = (pp && pp.trips) || []; DB.ppStops = (pp && pp.stops) || []; DB.ppPhotos = (pp && pp.photos) || [];
  // Logbook tabs exist only once the Apps Script is v3.4 or newer
  const lb = d.logbook || null;
  DB.lbOk = !!lb || !!d.lbOk;
  DB.lbStops = (lb && lb.stops) || []; DB.lbTracks = (lb && lb.tracks) || []; DB.lbExp = (lb && lb.expenses) || []; DB.lbBudget = (lb && lb.budget) || []; DB.lbRates = (lb && lb.rates) || []; DB.lbResults = (lb && lb.results) || []; DB.lbFinds = (lb && lb.finds) || []; DB.lbPlaces = (lb && lb.places) || DB.lbPlaces || null;
  for (const item of SYNC.outbox) applyLocal(item.p); // changes not yet on Google stay visible
  G.gblCycleDay = (DB.settings && DB.settings.StCycleDay) || 28;
  const l = PLABEL(Today());
  setMonth(Year(l), Month(l));
  G.gblTxAll = false; G.gblTxFrom = G.gblFrom; G.gblTxTo = G.gblTo; G.gblTxLbl = monthLabel('mmm yyyy');
}
/** Shows the copy saved on this phone straight away (it is refreshed from Google right after). */
export function loadCached() {
  const d = store.get('ew_data', null);
  if (!d || !d.accounts) return false;
  applyLoaded(d);
  return true;
}
/** Loads every list from Google (App.OnStart). */
export async function loadAll(opts = {}) {
  const d = await api('bootstrap', {}, CONN.v, { quiet: !!opts.quiet });
  applyLoaded(d);
  persistCache();
  store.set('ew_cache_at', new Date().toISOString());
  return d;
}

/**
 * Saves a set of changes. ch = { up: {Table:[rows]}, del: {Table:[keys]}, log: [{AuAction, AuRef, AuDetail}] }
 * The app updates immediately; the Google Sheet is updated in the background (see flush).
 */
/** A closed year can't change from the app: transactions and payslips on or before its last day are refused. */
function closedBlock(ch) {
  const ct = yearClosedThrough(); if (!ct) return '';
  const up = ch.up || {}, del = ch.del || {}, old = id => (DB.txns.find(t => t.TxnId === id) || {}).TxDate;
  const bad = (up.EW_Transactions || []).some(t => (t.TxDate && t.TxDate <= ct) || (old(t.TxnId) && old(t.TxnId) <= ct))
    || (del.EW_Transactions || []).some(id => old(id) && old(id) <= ct)
    || (up.EW_Payslips || []).some(r => String(r.PsMonth || '') <= ct.slice(0, 7)) || (del.EW_Payslips || []).some(k => String(k).slice(0, 7) <= ct.slice(0, 7));
  return bad ? 'That falls in a closed year (locked up to ' + fmtD(ct, 'dd mmm yyyy') + '). Change it in the Google Sheet if you really need to.' : '';
}
/** Rows the Apps Script already saved (a photo upload): show them now, nothing to send. */
export function applySaved(up) { applyLocal({ upserts: up || {}, deletes: {} }); persistCache(); }
export async function save(ch) {
  const blocked = closedBlock(ch);
  if (blocked) { const e = new Error(blocked); e.code = 'LOCKED'; throw e; }
  const now = new Date().toISOString();
  const log = (ch.log || []).map(l => ({ AuId: 'AU-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), AuWhen: now, AuAction: String(l.AuAction || ''), AuRef: String(l.AuRef || ''), AuDetail: String(l.AuDetail || '') }));
  const p = { upserts: ch.up || {}, deletes: ch.del || {}, log };
  applyLocal(p);
  persistCache();
  SYNC.outbox.push({ p, tries: 0 });
  persistOutbox();
  flush();
  return { logged: log };
}
export function settingsRow(over = {}) {
  const s = DB.settings || { Title: 'Settings', StStart: '', StCycleDay: 28, StLowBal: 200, StCurrency: 'MYR' };
  return { Title: 'Settings', StStart: s.StStart || '', StCycleDay: s.StCycleDay || 28, StLowBal: s.StLowBal ?? 200, StCurrency: s.StCurrency || 'MYR',
    StSweepAuto: !!s.StSweepAuto, StSweepFrom: Number(s.StSweepFrom) || 0, StSweepLog: s.StSweepLog || '', StYears: s.StYears || '', ...over };
}
export const stStart = () => (DB.settings && DB.settings.StStart) || '';
export const lowBal = () => (DB.settings ? Number(DB.settings.StLowBal) : 200);

/* ───────────── Navigation (Navigate / Back) ───────────── */
export const NAV = { stack: [], screens: {} };
export function Navigate(name) {
  NAV.stack.push(name);
  if (NAV.stack.length > 40) NAV.stack.splice(0, NAV.stack.length - 40);
  showScreen(name);
}
/** Leave the current (form) screen and go to `name`: back to it if it is just below, otherwise open it. */
export function Replace(name) {
  NAV.stack.pop();
  if (NAV.stack[NAV.stack.length - 1] === name) showScreen(name);
  else Navigate(name);
}
export function Back() {
  if (NAV.stack.length > 1) NAV.stack.pop();
  showScreen(NAV.stack[NAV.stack.length - 1]);
}
function showScreen(name) {
  const s = NAV.screens[name];
  if (s && s.onVisible) s.onVisible(loc(name));
  rerender();
  requestAnimationFrame(() => document.querySelectorAll('#stage .scroll, #stage .lz').forEach(el => { el.scrollTop = 0; }));
}
export function current() { return NAV.stack[NAV.stack.length - 1]; }

/* ───────────── Notify (Power Apps banner) ───────────── */
let toastTimer;
export function Notify(msg, kind = 'info') {
  if (kind === 'success') return; // no green banners: the screen itself shows the result
  const el = document.getElementById('notify');
  el.textContent = msg;
  el.className = 'show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, kind === 'error' ? 5000 : 3000);
}
/** Runs a save action and reports errors like IfError(..., Notify("Couldn't save ...")) */
export async function guard(fn) {
  try { await fn(); } catch (e) {
    if (e.code === 'AUTH') { CONN.authError = e.message; NAV.stack = ['connect']; rerender(); return; }
    if (e.code === 'LOCKED') { Notify(e.message, 'error'); rerender(); return; }
    Notify("Couldn't save to Google Sheets: " + e.message, 'error');
  }
  rerender();
}

/* ───────────── Rendering ───────────── */
let root;
export function mount(el) { root = el; }
let pending = false;
/** Lets the theme module recolour K just before a screen renders (Lens only). */
let themeHook = null;
export const setThemeHook = fn => { themeHook = fn; };
export function rerender() {
  if (pending) return;
  pending = true;
  // After the current event finishes (a microtask could redraw while a tap is still bubbling).
  setTimeout(() => {
    pending = false;
    const name = current();
    const s = NAV.screens[name];
    if (themeHook) themeHook(name);
    render(s ? s.view(loc(name)) : html``, root);
  }, 0);
}

/* ───────────── Drawing primitives (absolute, in canvas pixels) ───────────── */
export const fs = pt => (pt * 4 / 3).toFixed(2) + 'px'; // Power Apps sizes are points
const W = { 6: 600, 7: 700, 4: 400 };
/** Absolute position. y can be {b: n} to anchor n px from the bottom of the 844 canvas. */
export function pos(x, y, w, h) {
  let s = `left:${x}px;width:${w}px;`;
  if (typeof y === 'object') s += `bottom:${y.b}px;height:${h}px;`;
  else s += `top:${y}px;height:${h}px;`;
  return s;
}
export const fromBottom = (y, h) => ({ b: 844 - y - h });

/** Label */
const isCap = (t, sz) => typeof t === 'string' && sz <= 8 && t.length > 2 && /[A-Z]/.test(t) && t === t.toUpperCase();
export function L(x, y, w, h, text, o = {}) {
  if (o.ls === undefined && isCap(text, o.s || 10)) o = { ...o, ls: 0.9 };
  const st = pos(x, y, w, h) + `color:${o.c || K.text};font-size:${fs(o.s || 10)};font-weight:${W[o.w] || 400};` +
    `text-align:${o.a === 'c' ? 'center' : o.a === 'r' ? 'right' : 'left'};` +
    (o.wrap ? `white-space:normal;align-items:${o.top ? 'flex-start' : 'center'};line-height:1.25;` : '') + (o.font ? `font-family:${o.font};` : '') + (o.ls ? `letter-spacing:${o.ls}px;` : '') + (o.st || '');
  return html`<div class="lbl ${o.wrap ? 'wrap' : ''} ${o.onClick ? 'tap' : ''}" style=${st} onClick=${o.onClick} data-t=${o.id}><span>${text}</span></div>`;
}
/** Rectangle */
export function R(x, y, w, h, fill, o = {}) {
  const st = pos(x, y, w, h) + `background:${fill};border-radius:${o.r || 0}px;` + (o.b ? `box-shadow:inset 0 0 0 ${o.bt || 1}px ${o.b};` : '') + (o.st || '');
  return html`<div class="abs ${o.onClick ? 'tap' : ''}" style=${st} onClick=${o.onClick}></div>`;
}
/** Circle */
export function C(x, y, d, fill, o = {}) { return R(x, y, d, d, fill, { ...o, r: d / 2 }); }
/** Icon (Power Apps icon names) */
export function I(x, y, w, h, name, color, o = {}) {
  const pad = o.pad ?? 4;
  const st = pos(x, y, w, h) + `color:${color};padding:${pad}px;` + (o.st || '');
  return html`<div class="abs icon ${o.onClick ? 'tap' : ''}" style=${st} onClick=${o.onClick} aria-label=${o.label || name} role=${o.onClick ? 'button' : undefined}>${icon(name)}</div>`;
}
/** Button */
export function B(x, y, w, h, text, o = {}) {
  const st = pos(x, y, w, h) + `background:${o.fill || K.field};color:${o.c || K.text};border-radius:${o.r ?? Math.round(h / 2)}px;` +
    `font-size:${fs(o.s || 10)};font-weight:${W[o.w || 6]};letter-spacing:.2px;` +
    (o.b ? `box-shadow:inset 0 0 0 ${o.bt || 1}px ${o.b};` : o.fill === K.or && !o.flat ? `box-shadow:0 6px 18px ${oa(0.22)}, inset 0 1px 0 ${ta(0.18)};` : '') + (o.st || '');
  return html`<button class="btn" style=${st} disabled=${!!o.disabled} onClick=${o.onClick} data-t=${o.id}>${text}</button>`;
}
/** Card / container (manual layout). In a flow, pass x=null to stack. */
export function Box(x, y, w, h, kids, o = {}) {
  const st = (x === null ? `position:relative;flex:none;width:${w}px;height:${h}px;` : pos(x, y, w, h) + 'position:absolute;') +
    `background:${o.fill || 'transparent'};border-radius:${o.r || 0}px;` + (o.b ? `box-shadow:inset 0 0 0 ${o.bt || 1}px ${o.b};` : '') + (o.st || '');
  return html`<div class="box" style=${st} data-t=${o.id}>${kids}</div>`;
}
export let SURFACE = 'linear-gradient(180deg, #191C22 0%, #15181D 100%)';
export let HAIR = 'rgba(255,255,255,0.065)';
const SURFACE0 = SURFACE, HAIR0 = HAIR;
/** Theme hook: card surface and hairline for the active theme. */
export function setSurface(sf, hr) { SURFACE = sf || SURFACE0; HAIR = hr || HAIR0; }
/** Colour helpers: the theme's accent, and its tint (white on dark themes), at an alpha. */
export const oa = a => `rgba(${K.accRGB || '255,106,0'},${a})`;
export const ta = a => `rgba(${K.tintRGB || '255,255,255'},${a})`;
export function Card(x, y, w, h, kids, o = {}) {
  const b = o.b || K.hair || HAIR;
  return Box(x, y, w, h, kids, { ...o, fill: o.fill || K.surface || SURFACE, r: o.r ?? 16, b: undefined, st: `box-shadow:inset 0 0 0 1px ${b}, inset 0 1px 0 ${ta(0.035)};` + (o.st || '') });
}
/** Vertical auto-layout scroll container (LayoutMode.Auto). Top stays at y, bottom stays (844 - y - h) from the canvas bottom. */
export function Flow(x, y, w, h, kids, o = {}) {
  const pad = o.pad || [4, 12, 16, 12];
  const st = `left:${x}px;width:${w}px;top:${y}px;bottom:${844 - y - h}px;padding:${pad[0]}px ${pad[1]}px ${pad[2]}px ${pad[3]}px;gap:${o.gap ?? 10}px;` + (o.st || '');
  return html`<div class="scroll flow" style=${st}>${kids}</div>`;
}
/** Gallery: a list of fixed-height rows. o.scroll makes it scroll; o.stretch keeps its bottom edge anchored. o.wrap = columns. */
export function Gal(x, y, w, h, items, size, tpl, o = {}) {
  let st = pos(x, y, w, h);
  if (o.stretch) st = `left:${x}px;width:${w}px;top:${y}px;bottom:${844 - y - h}px;`;
  if (o.inset) st = `left:${x}px;width:${w}px;top:${o.inset[0]}px;bottom:${o.inset[1]}px;`;
  if (o.horizontal) {
    return html`<div class="abs gal hz" style=${st}>${items.map((it, i) => html`<div class="row" style=${`width:${size}px;height:${h}px;`} key=${o.key ? o.key(it) : i} onClick=${o.onSelect ? () => o.onSelect(it) : undefined}>${tpl(it, i)}</div>`)}</div>`;
  }
  const cw = o.wrap ? w / o.wrap : w;
  return html`<div class="abs gal ${o.scroll ? 'scroll' : ''} ${o.wrap ? 'wrapg' : ''}" style=${st}>
    ${items.map((it, i) => html`<div class="row ${o.onSelect ? 'tap' : ''}" style=${`width:${cw}px;height:${size}px;`} key=${o.key ? o.key(it) : i} onClick=${o.onSelect ? () => o.onSelect(it) : undefined}>${tpl(it, i)}</div>`)}
  </div>`;
}
/** Text input */
export function TI(x, y, w, h, value, onInput, o = {}) {
  const st = pos(x, y, w, h) + `background:${o.fill || K.field};color:${o.c || K.text};font-size:${fs(o.s || 12)};font-weight:${W[o.w] || 400};border-radius:${o.r ?? 10}px;` +
    `padding:0 ${o.padR ?? o.pad ?? 12}px 0 ${o.pad ?? 12}px;text-align:${o.a === 'c' ? 'center' : 'left'};` + (o.bt === 0 ? 'box-shadow:none;' : `box-shadow:inset 0 0 0 1px ${o.b || ta(0.07)};`) + (o.st || '');
  if (o.multiline) {
    return html`<textarea class="inp" style=${st + 'padding-top:10px;padding-bottom:10px;resize:none;'} placeholder=${o.hint || ''} value=${value ?? ''} maxlength=${o.max} onInput=${e => onInput(e.target.value)} data-t=${o.id}></textarea>`;
  }
  return html`<input class="inp ${o.bt === 0 ? 'nob' : ''}" style=${st} placeholder=${o.hint || ''} value=${value ?? ''} maxlength=${o.max}
    inputmode=${o.num ? 'decimal' : undefined} autocomplete="off" autocorrect="off" spellcheck="false"
    onInput=${e => onInput(e.target.value)} onChange=${o.onChange ? e => o.onChange(e.target.value) : undefined}
    onKeyDown=${o.onChange ? e => { if (e.key === 'Enter') e.target.blur(); } : undefined} data-t=${o.id} />`;
}
/** Dropdown (classic) */
export function DD(x, y, w, h, items, value, onChange, o = {}) {
  const st = pos(x, y, w, h) + `background:${o.fill || K.field};border-radius:${o.r ?? 10}px;overflow:hidden;` + (o.bt === 0 ? '' : `box-shadow:inset 0 0 0 1px ${o.b || ta(0.07)};`);
  return html`<div class="abs dd" style=${st}>
    <select style=${`color:${K.text};font-size:${fs(o.s || 12)};padding:0 ${h}px 0 ${o.pad ?? 12}px;`} value=${value ?? ''} onChange=${e => onChange(e.target.value)} data-t=${o.id}>
      ${o.allowEmpty || !items.includes(value) ? html`<option value="">${''}</option>` : null}
      ${items.map(v => html`<option value=${v}>${v}</option>`)}
    </select>
    <div class="chev" style=${`width:${Math.min(h, 40)}px;background:transparent;color:${o.chev || K.or};`}>${icon('ChevronDown')}</div>
  </div>`;
}
/** Toggle */
export function Tog(x, y, w, h, on, onChange) {
  return html`<div class="abs tog ${on ? 'on' : ''}" style=${pos(x, y, w, h)} onClick=${() => onChange(!on)} role="switch" aria-checked=${on}><i></i></div>`;
}
/** HtmlViewer brand mark */
export function Brand(x, y, w, h, center, big, name = 'MansWell', onClick) {
  return html`<div class="abs brand ${center ? 'c' : ''} ${onClick ? 'tap' : ''}" style=${pos(x, y, w, h)} onClick=${onClick} data-t="brand">
    <div class="mark" style=${`font-size:${big ? 30 : 25}px`}>${name}<span>.</span></div>
    <div class="tag" style=${`margin-top:${big ? 7 : 5}px;letter-spacing:${big ? 1.8 : 1.7}px`}>LIVE WELL TODAY. BUILD WELL FOR TOMORROW.</div>
  </div>`;
}
/** Image from an SVG string */
export function Svg(x, y, w, h, svg, o = {}) {
  return html`<div class="abs svgimg ${o.stretch ? 'stretch' : ''}" style=${pos(x, y, w, h)} dangerouslySetInnerHTML=${{ __html: svg }}></div>`;
}
export function heroBg(h) {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 366 ${h}' preserveAspectRatio='none'><defs><linearGradient id='g${h}' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${K.card2}'/><stop offset='1' stop-color='${K.card2}'/></linearGradient><radialGradient id='r${h}' cx='1' cy='0' r='0.75'><stop offset='0' stop-color='${K.or}' stop-opacity='0.30'/><stop offset='1' stop-color='${K.or}' stop-opacity='0'/></radialGradient></defs><rect width='366' height='${h}' rx='16' fill='url(#g${h})'/><rect width='366' height='${h}' rx='16' fill='url(#r${h})'/><rect x='0.5' y='0.5' width='365' height='${h - 1}' rx='15.5' fill='none' stroke='${K.line2}'/></svg>`;
}
export const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

/* ───────────── Icons (Power Apps icon set, drawn as SVG) ───────────── */
const P = {
  Receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  Coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M3 11v4c0 1.7 2.7 3 6 3 1.1 0 2.2-.2 3-.5"/><ellipse cx="16" cy="14" rx="5" ry="2.6"/><path d="M11 14v3.4c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6V14"/>',
  Compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/>',
  Calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7v3h-7z"/><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01"/>',
  Chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
  Aperture: '<circle cx="12" cy="12" r="9"/><path d="m14.3 3.3-4.6 8M20.6 9.5h-9.2M18 18.6l-4.6-8M9.7 20.7l4.6-8M3.4 14.5h9.2M6 5.4l4.6 8"/>',
  Flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  Link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  Percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  Signal: '<rect x="8" y="2.5" width="8" height="19" rx="4"/><circle cx="12" cy="7.5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="16.5" r="1.6"/>',
  Heart: '<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.6 12 20 12 20z"/>',
  Umbrella: '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/><path d="M12 3v0"/>',
  Table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 10v10"/>',
  Expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  Guide: '<path d="M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1v13c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z"/><path d="M12 6.5v13"/>',
  Reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v5h5"/>',
  Bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  ChevronLeft: '<path d="M15 4 7 12l8 8"/>',
  ChevronRight: '<path d="m9 4 8 8-8 8"/>',
  ChevronDown: '<path d="m4 8 8 8 8-8"/>',
  Add: '<path d="M12 3v18M3 12h18"/>',
  Home: '<path d="M3 11 12 3l9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  Money: '<rect x="2" y="6" width="20" height="12" rx="1.5"/><circle cx="12" cy="12" r="3"/><path d="M5.5 9v.01M18.5 15v.01"/>',
  DetailList: '<path d="M9 5h12M9 12h12M9 19h12"/><rect x="3" y="3.5" width="3" height="3"/><rect x="3" y="10.5" width="3" height="3"/><rect x="3" y="17.5" width="3" height="3"/>',
  Trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  Settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  Search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>',
  CalendarBlank: '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  Sync: '<path d="M20 11a8 8 0 0 0-14.3-4.3L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.3L20 15"/><path d="M20 20v-5h-5"/>',
  Tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  ShoppingCart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/>',
  Person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6"/>',
  Edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  Note: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h8"/>',
  Cancel: '<path d="M5 5l14 14M19 5 5 19"/>',
  Check: '<path d="m4 12.5 5 5L20 6.5"/>',
  ArrowDown: '<path d="M12 4v16M5 13l7 7 7-7"/>',
  Lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><path d="M12 15v2.5"/>',
  Shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/>',
  Clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  Gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>',
  Download: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/>',
  Grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  Wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/><circle cx="16.5" cy="13.5" r=".6"/>',
  Bars: '<path d="M5 19v-4"/><path d="M10 19v-7"/><path d="M15 19v-10"/><path d="M20 19V5"/>',
  Globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5s-1.2 6.1-3.8 8.5c-2.6-2.4-3.8-5.2-3.8-8.5S9.4 5.9 12 3.5z"/>',
  History: '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4.5v3.6h3.6"/><path d="M12 8v4.2l2.8 1.8"/>',
  Trash: '<path d="M4 6h16M9 6V4h6v2M6 6l1 15h10l1-15"/><path d="M10 10v7M14 10v7"/>',
  Passport: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="10" r="3.2"/><path d="M8.8 10h6.4M12 6.8c-1.2 1.6-1.2 4.8 0 6.4M12 6.8c1.2 1.6 1.2 4.8 0 6.4M9 17h6"/>',
  Plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  Star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  Logbook: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7h6M9 10.5h4"/>',
  Route: '<circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="5" r="2.2"/><path d="M8.2 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.8"/>',
  Wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/>',
  Medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5 6 3h4l2 5 2-5h4l-2.5 7.5"/><path d="m12 12.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z"/>',
  Images: '<rect x="3" y="5" width="14" height="12" rx="2"/><path d="M7 21h12a2 2 0 0 0 2-2V9"/><circle cx="8" cy="9.5" r="1.5"/><path d="m3 15 4-4 4 4 2-2 4 4"/>'
};
export function icon(name) {
  return html`<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: P[name] || '' }}></svg>`;
}

/** A full transaction row with every column filled in. */
export function mkTxn(f) {
  return { TxnId: '', TxSeq: 0, TxAcc: '', TxDate: Today(), TxType: 'Expense', TxDir: 'Out', TxAmt: 0, TxCat: '', TxPayee: '', TxDesc: '', TxNote: '', TxTrf: '', TxRef: '', TxParent: '', TxIsSplit: false, TxRule: '', ...f };
}
export const txnId = (date, seq) => 'TXN-' + Year(date) + '-' + String(seq).padStart(6, '0');
