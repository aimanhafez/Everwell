// MansWell · Lens engine. Pure calculations: reads Pocket's data (never writes it) and Lens's own LN_ tabs.
// Money is counted the way Pocket counts it (flowOf): the category decides the side, transfers and split parents
// are left out, paybacks net off inside their category. Months are Pocket's financial months (cycle day).
import { DB, Today, perKey, PSTART, PEND, addDays, addMonths, D, round2, flowOf, catTypeOf, stStart, MON } from '../core.js';
import { kwspFlows, hasPayslips, monthPay } from '../payslip-data.js';

/* ───────── settings (LN_Settings: one row per key, JSON value) ───────── */
const SINK_RX = /travel/i;
const ESS_RX = /ptptn|loan|utilit|bill|transport|fuel|toll|parking|food|f&b|groceries|medical|health|clinic|bank|personal|apparel|rent|housing|insurance|education|school|phone|internet/i;
export function lget(key, def) {
  const r = DB.lnSettings.find(x => x.LsKey === key);
  if (!r || r.LsVal === '' || r.LsVal == null) return def;
  try { return JSON.parse(r.LsVal); } catch (e) { return def; }
}
export const lrow = (key, val) => ({ LsKey: key, LsVal: JSON.stringify(val) });
export const savCats = () => DB.categories.filter(c => c.CatType === 'Savings/Asset' && c.CatActive !== false).map(c => c.CatName);
export const expCats = () => DB.categories.filter(c => c.CatType === 'Expense' && c.CatActive !== false).map(c => c.CatName);
export const incCats = () => DB.categories.filter(c => c.CatType === 'Income' && c.CatActive !== false).map(c => c.CatName);
let usedMemo = { n: -1, set: null };
export const used = () => { if (usedMemo.n !== DB.txns.length) usedMemo = { n: DB.txns.length, set: new Set(DB.txns.map(t => t.TxCat)) }; return usedMemo.set; };
export const savCatsUsed = () => savCats().filter(c => used().has(c));
export const expCatsUsed = () => expCats().filter(c => used().has(c));
export const sinking = () => lget('sinking', savCats().filter(n => SINK_RX.test(n)));
export const essential = () => lget('essential', expCatsUsed().filter(n => ESS_RX.test(n)));
export const thresholds = () => ({ strong: Number(lget('strong', 30)), healthy: Number(lget('healthy', 20)) });
export const efMonths = () => Number(lget('efMonths', 6));
export const assumptions = () => ({ growth: Number(lget('growth', 0)), infl: Number(lget('infl', 3)), sideShare: Number(lget('sideShare', 50)) });

/* ───────── months ───────── */
export const kY = k => Math.floor(k / 100), kM = k => k % 100;
export const kAdd = (k, n) => { const i = kY(k) * 12 + kM(k) - 1 + n; return Math.floor(i / 12) * 100 + (i % 12) + 1; };
export const kDiff = (a, b) => (kY(b) * 12 + kM(b)) - (kY(a) * 12 + kM(a));
export const kStart = k => PSTART(kY(k), kM(k));
export const kEnd = k => PEND(kY(k), kM(k));
export const kLabel = (k, long) => (long ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] : MON)[kM(k) - 1] + (long === 'm' ? '' : ' ' + kY(k));
export const curKey = () => perKey(Today());
export const startKey = () => (stStart() ? perKey(stStart()) : (DB.txns.length ? Math.min(...DB.txns.map(t => perKey(t.TxDate))) : curKey()));
export const isClosed = k => k < curKey();
export const openDate = () => (stStart() ? addDays(stStart(), -1) : addDays(kStart(startKey()), -1));

/* ───────── P&L ───────── */
let pnlMemo = { sig: '', by: null };
function sigOf() { return DB.txns.length + '|' + DB.categories.length + '|' + (DB.txns[DB.txns.length - 1] || {}).TxnId + '|' + DB.txns.reduce((s, t) => s + (t.TxAmt || 0), 0).toFixed(2) + '|' + JSON.stringify(sinking()) + '|' + (DB.settings && DB.settings.StCycleDay); }
/** month key → { inc:{cat:v}, sav:{cat:v}, exp:{cat:v} } */
function byMonth() {
  const sig = sigOf();
  if (pnlMemo.sig === sig) return pnlMemo.by;
  const by = {};
  for (const t of DB.txns) {
    const f = flowOf(t); if (!f || !f.v) continue;
    const k = perKey(t.TxDate), cat = t.TxCat || 'Uncategorised';
    const m = by[k] || (by[k] = { inc: {}, sav: {}, exp: {} });
    const grp = f.side === 'In' ? m.inc : catTypeOf(t.TxCat) === 'Savings/Asset' ? m.sav : m.exp;
    grp[cat] = round2((grp[cat] || 0) + f.v);
  }
  pnlMemo = { sig, by };
  return by;
}
const tot = o => round2(Object.values(o).reduce((s, v) => s + v, 0));
export function month(k) {
  const m = byMonth()[k] || { inc: {}, sav: {}, exp: {} };
  const sink = sinking();
  const totIn = tot(m.inc), totSav = tot(m.sav), totExp = tot(m.exp);
  const left = round2(totIn - totSav - totExp);
  const counted = round2(Object.entries(m.sav).filter(([c]) => !sink.includes(c)).reduce((s, [, v]) => s + v, 0));
  const saved = round2(counted + left);
  const active = Object.keys(m.inc).length + Object.keys(m.sav).length + Object.keys(m.exp).length > 0;
  return { k, ...m, totIn, totSav, totExp, left, saved, active, rate: totIn > 0 ? saved / totIn * 100 : null, closed: isClosed(k) };
}
export function status(mo) {
  if (!mo.active) return null;
  const { strong, healthy } = thresholds();
  if (mo.rate === null) return mo.saved < 0 ? ['Deficit', 'red'] : null;
  return mo.rate >= strong ? ['Strong', 'grn'] : mo.rate >= healthy ? ['Healthy', 'grn2'] : mo.rate >= 0 ? ['Watch', 'gold'] : ['Deficit', 'red'];
}
export const yearKeys = y => Array.from({ length: 12 }, (_, i) => y * 100 + i + 1);
export function pnlYear(y) {
  const months = yearKeys(y).map(month);
  const done = months.filter(m => m.closed && m.active);
  const rows = grp => {
    const names = new Set(); months.forEach(m => Object.keys(m[grp]).forEach(n => names.add(n)));
    return [...names].map(n => { const vals = months.map(m => m[grp][n] || 0); const ytd = round2(done.reduce((s, m) => s + (m[grp][n] || 0), 0));
      return { n, vals, ytd, avg: done.length ? ytd / done.length : 0 }; }).sort((a, b) => Math.abs(b.ytd) - Math.abs(a.ytd) || a.n.localeCompare(b.n));
  };
  const Y = f => round2(done.reduce((s, m) => s + m[f], 0));
  const ytd = { totIn: Y('totIn'), totSav: Y('totSav'), totExp: Y('totExp'), left: Y('left'), saved: Y('saved') };
  ytd.rate = ytd.totIn > 0 ? ytd.saved / ytd.totIn * 100 : null;
  const counted = round2(done.reduce((s, m) => s + Object.entries(m.sav).filter(([c]) => !sinking().includes(c)).reduce((a, [, v]) => a + v, 0), 0));
  return { y, months, done, inc: rows('inc'), sav: rows('sav'), exp: rows('exp'), ytd, counted, healthy: done.filter(m => { const s = status(m); return s && (s[1] === 'grn' || s[1] === 'grn2'); }).length };
}
/** What moved this month compared with the months before it (up to 12 closed months, same rules). */
export function movers(k, n = 4) {
  const prev = []; for (let i = 1; i <= 12; i++) { const m = month(kAdd(k, -i)); if (m.active && kAdd(k, -i) >= startKey()) prev.push(m); }
  if (!prev.length) return { prev: 0, list: [] };
  const cur = month(k), out = [];
  const avgOf = (grp, c) => prev.reduce((s, m) => s + (m[grp][c] || 0), 0) / prev.length;
  for (const grp of ['inc', 'exp']) {
    const names = new Set([...Object.keys(cur[grp]), ...prev.flatMap(m => Object.keys(m[grp]))]);
    for (const c of names) { const a = avgOf(grp, c), d = (cur[grp][c] || 0) - a; if (Math.abs(d) >= 1) out.push({ n: c, grp, d: round2(d), avg: round2(a), good: grp === 'inc' ? d > 0 : d < 0 }); }
  }
  const avgSaved = prev.reduce((s, m) => s + m.saved, 0) / prev.length, avgIn = prev.reduce((s, m) => s + m.totIn, 0);
  return { prev: prev.length, list: out.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, n), avgSaved: round2(avgSaved), avgRate: avgIn > 0 ? prev.reduce((s, m) => s + m.saved, 0) / avgIn * 100 : null };
}
/** Cells worth a second look: an expense more than double its usual month (and over RM 150). */
export function unusual(row, i, monthsDone) {
  const v = row.vals[i]; if (!(v > 150)) return false;
  const base = monthsDone.filter(j => j !== i).map(j => row.vals[j]);
  if (base.length < 2) return false;
  const a = base.reduce((s, x) => s + Math.abs(x), 0) / base.length;
  return v > 2 * a;
}
/** Average saved per month over the last closed months (up to 6) that have activity. */
export function savingPower() {
  const out = []; for (let i = 1; i <= 24 && out.length < 6; i++) { const k = kAdd(curKey(), -i); if (k < startKey()) break; const m = month(k); if (m.active) out.push(m); }
  return { n: out.length, v: out.length ? round2(out.reduce((s, m) => s + m.saved, 0) / out.length) : 0, from: out.length ? out[out.length - 1].k : null, to: out.length ? out[0].k : null };
}
export function essentialMonthly() {
  const ess = essential(), out = [];
  for (let i = 1; i <= 24 && out.length < 6; i++) { const k = kAdd(curKey(), -i); if (k < startKey()) break; const m = month(k); if (m.active) out.push(ess.reduce((s, c) => s + (m.exp[c] || 0), 0)); }
  return out.length ? round2(out.reduce((s, v) => s + v, 0) / out.length) : 0;
}

/* ───────── assets (roll-forward) ───────── */
export const assets = () => DB.lnAssets.filter(a => a.AsActive !== false).sort((a, b) => (a.AsSeq || 0) - (b.AsSeq || 0));
/** A Tabung is money set aside for a purpose. Stored as access group 3 on LN_Assets (no new columns). */
export const isTabung = a => Number(a.AsLiq) === 3;
export const ignoredCats = () => { const v = lget('ignoreCats', []); return Array.isArray(v) ? v : []; };
export const linkedCats = () => new Set(assets().filter(a => a.AsKind === 'category').map(a => a.AsCat));
/** Offered once a category has its first transaction, so Pocket's unused default categories never nag. */
export const newCats = () => { const lk = linkedCats(), ig = ignoredCats(), u = used(); return savCats().filter(c => !lk.has(c) && !ig.includes(c) && u.has(c)); };
/** Money into and out of a Pocket category (deposits, withdrawals) between two dates. */
export function catSplit(cat, from, to) { let i = 0, o = 0; for (const t of DB.txns) { if (t.TxCat !== cat || (from && t.TxDate < from) || (to && t.TxDate > to)) continue; const f = flowOf(t); if (!f || f.side !== 'Out') continue; if (f.v >= 0) i += f.v; else o -= f.v; } return { inn: round2(i), out: round2(o) }; }
function monthsBetween(d1, d2) { const [y1, m1, a] = d1.split('-').map(Number), [y2, m2, b] = d2.split('-').map(Number); return Math.max(0, (y2 * 12 + m2) - (y1 * 12 + m1) - (b < a ? 1 : 0)); }
export function acctBal(accId, upTo) { let b = 0; for (const t of DB.txns) if (t.TxAcc === accId && !t.TxParent && (!upTo || t.TxDate <= upTo)) b += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt; return round2(b); }
export function catFlow(cat, from, to) { let s = 0; for (const t of DB.txns) { if (t.TxCat !== cat || (from && t.TxDate < from) || (to && t.TxDate > to)) continue; const f = flowOf(t); if (f && f.side === 'Out') s += f.v; } return round2(s); }
export const valuesOf = id => DB.lnValues.filter(v => v.VaAsset === id).sort((a, b) => (a.VaDate < b.VaDate ? -1 : a.VaDate > b.VaDate ? 1 : 0));
export function openingOf(a) { return a.AsKind === 'account' ? acctBal(a.AsAcc, openDate()) : Number(a.AsOpen) || 0; }
/** KWSP-type assets grow from Pocket payslips (you + employer). Months without a payslip use the monthly estimate.
 *  That holds whether KWSP is a value you update or linked to a Pocket category (then top-ups and withdrawals in Pocket count too). */
export const isKwsp = a => a.AsCat === 'payslip:kwsp' || /kwsp|epf/i.test(a.AsName || '') || (a.AsKind === 'category' && /kwsp|epf/i.test(a.AsCat || ''));
export const payslipFed = a => (a.AsKind === 'manual' || a.AsKind === 'category') && isKwsp(a);
export function manualFlows(a, fromExcl, toIncl) {
  const mo = Number(a.AsMonthly) || 0;
  if (!payslipFed(a) || !hasPayslips()) return { v: round2(mo * monthsBetween(fromExcl, toIncl)), est: mo > 0 && monthsBetween(fromExcl, toIncl) > 0, ps: false };
  const flows = kwspFlows(), byK = new Map(flows.map(f => [f.k, f]));
  let v = 0, est = false;
  for (let k = perKey(addDays(fromExcl, 1)); k <= perKey(toIncl); k = kAdd(k, 1)) {
    const f = byK.get(k);
    if (f) { if (f.payDate > fromExcl && f.payDate <= toIncl) v += f.amt; }
    else if (mo && kEnd(k) > fromExcl && kEnd(k) <= toIncl) { v += mo; est = true; }
  }
  return { v: round2(v), est, ps: true };
}
export function valueAt(a, date) {
  if (a.AsKind === 'account') return acctBal(a.AsAcc, date);
  const vals = valuesOf(a.AsId).filter(v => v.VaDate <= date);
  const lastSet = [...vals].reverse().find(v => v.VaKind === 'value');
  const baseDate = lastSet ? lastSet.VaDate : openDate(), base = lastSet ? Number(lastSet.VaAmt) : Number(a.AsOpen) || 0;
  const flows = a.AsKind === 'category' ? round2(catFlow(a.AsCat, addDays(baseDate, 1), date) + (payslipFed(a) ? manualFlows(a, baseDate, date).v : 0)) : manualFlows(a, baseDate, date).v;
  const adds = vals.filter(v => v.VaKind === 'add' && v.VaDate > baseDate).reduce((s, v) => s + Number(v.VaAmt), 0);
  return round2(base + flows + adds);
}
export function rollForward() {
  const today = Today(), od = openDate();
  const list = assets().map(a => {
    const open = openingOf(a), now = valueAt(a, today);
    const mf = a.AsKind === 'manual' || payslipFed(a) ? manualFlows(a, od, today) : null;
    const pocket = a.AsKind === 'category' ? catFlow(a.AsCat, addDays(od, 1), today) : 0;
    const inn = a.AsKind === 'account' ? round2(now - open) : a.AsKind === 'category' ? round2(pocket + (mf ? mf.v : 0)) : mf.v;
    const vals = valuesOf(a.AsId), last = vals[vals.length - 1];
    return { a, open, inn, pocket, psIn: mf && mf.ps ? mf.v : 0, grow: round2(now - open - inn), now, est: !!(mf && mf.est), ps: !!(mf && mf.ps), last, liq: Number(a.AsLiq) || 0 };
  });
  list.forEach(r => { if (!isTabung(r.a)) return; const sp = r.a.AsKind === 'category' ? catSplit(r.a.AsCat, addDays(od, 1), today) : { inn: 0, out: 0 }; r.used = sp.out; r.tin = round2(r.now - r.open + sp.out); });
  const A = list.filter(r => !isTabung(r.a)), B = list.filter(r => isTabung(r.a));
  const T = (L, f) => round2(L.reduce((s, r) => s + (r[f] || 0), 0));
  return { list, assets: A, tabung: B, open: T(A, 'open'), inn: T(A, 'inn'), grow: T(A, 'grow'), now: T(A, 'now'),
    tab: { open: T(B, 'open'), inn: T(B, 'tin'), used: T(B, 'used'), now: T(B, 'now') } };
}
/** Values for the growth chart: the opening balance, then each month-end, then today. Per asset and in total. */
export function assetSeries() {
  const ks = []; for (let k = startKey(); k <= curKey() && ks.length < 36; k = kAdd(k, 1)) ks.push(k);
  const dates = [openDate(), ...ks.map(k => (k === curKey() ? Today() : kEnd(k)))];
  const rows = assets().map(a => ({ a, vals: dates.map(d => valueAt(a, d)) }));
  const sum = L => dates.map((d, i) => round2(L.reduce((s, r) => s + r.vals[i], 0)));
  return { ks: [null, ...ks], dates, rows, total: sum(rows.filter(r => !isTabung(r.a))), tabTotal: sum(rows.filter(r => isTabung(r.a))), hasTab: rows.some(r => isTabung(r.a)) };
}
export const readyNow = () => round2(rollForward().list.filter(r => r.liq === 0).reduce((s, r) => s + r.now, 0));

/** What a retirement-type asset receives a month: the average of the last 3 payslips if it is payslip-fed, else its estimate. */
export function monthlyInto(a) {
  if (payslipFed(a) && hasPayslips()) { const f = kwspFlows().slice(-3); if (f.length) return round2(f.reduce((s, x) => s + x.amt, 0) / f.length); }
  return Number(a.AsMonthly) || 0;
}
/** Payroll for a P&L month (gross view): gross, deductions by kind and net salary, from all that month's payslips. */
export function payroll(k) { return monthPay(k); }

/* ───────── cards: is any balance carried past its due date? ───────── */
export function cardStatus() {
  const cards = DB.accounts.filter(a => a.AccClass === 'Liability' && a.AccStatus !== 'Closed' && a.AccType !== 'System');
  if (!cards.length) return { none: true };
  const lastEnd = kEnd(kAdd(curKey(), -1)), today = Today();
  let carried = 0, due = null;
  for (const c of cards) {
    const owed = -acctBal(c.AccId, lastEnd);
    if (owed <= 0.005) continue;
    const paid = DB.txns.filter(t => t.TxAcc === c.AccId && !t.TxParent && t.TxDate > lastEnd && t.TxDir === 'In').reduce((s, t) => s + t.TxAmt, 0);
    const left = round2(owed - paid); if (left <= 0.005) continue;
    const dd = Number(c.AccDueDay) || 0;
    let dueDate = null;
    if (dd) { const [y, m] = lastEnd.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); dueDate = D(y, m, Math.min(dd, last));
      if (dueDate <= lastEnd) { const nx = addMonths(D(y, m, 1), 1), [y2, m2] = nx.split('-').map(Number); dueDate = D(y2, m2, Math.min(dd, new Date(Date.UTC(y2, m2, 0)).getUTCDate())); } }
    if (dueDate && today <= dueDate) { due = !due || dueDate < due ? dueDate : due; continue; }
    carried += left;
  }
  return { carried: round2(carried), due, cards: cards.length };
}

/* ───────── plan: goals funded in priority order from saving power ───────── */
export const goals = () => DB.lnGoals.filter(g => g.GoActive !== false && g.GoKind !== 'emergency').sort((a, b) => (a.GoSeq || 0) - (b.GoSeq || 0));
export const byKey = s => { const [y, m] = String(s || '').split('-').map(Number); return y && m ? y * 100 + m : null; };
export function goalHave(g) { const a = g.GoAsset && assets().find(x => x.AsId === g.GoAsset); return round2((a ? valueAt(a, Today()) : 0) + (Number(g.GoHave) || 0)); }
export function planGoals() {
  const ess = essentialMonthly(), efT = round2(efMonths() * ess), ready = readyNow();
  const efBy = byKey(lget('efBy', '')) || kAdd(curKey(), 8);
  const list = [];
  if (ess > 0) list.push({ id: 'EF', n: 'Emergency fund', kind: 'emergency', target: efT, have: ready, by: efBy, src: 'Ready-now savings · ' + efMonths() + ' months of essentials' });
  for (const g of goals()) { const a = g.GoAsset && assets().find(x => x.AsId === g.GoAsset); list.push({ id: g.GoId, g, n: g.GoName, kind: 'goal', target: Number(g.GoTarget) || 0, have: goalHave(g), by: byKey(g.GoBy) || kAdd(curKey(), 24), src: a ? ('funded by ' + a.AsName) : (Number(g.GoHave) ? 'Saved so far' : 'Not linked yet') }); }
  return list;
}
/** Month 0 = the current month. Returns finish month index per goal (null = beyond 30 years). */
export function simulate(list, power) {
  const g = Math.max(0, assumptions().growth) / 100 / 12;
  const c0 = curKey();
  const need = list.map(x => Math.max(0, round2(x.target - x.have)));
  const left = need.slice(), done = need.map(v => (v <= 0.5 ? -1 : null)), alloc = list.map(() => []);
  const due = list.map(x => Math.max(0, kDiff(c0, x.by)));
  const pace = list.map((x, i) => (need[i] > 0 ? need[i] / (due[i] + 1) : 0));
  for (let m = 0; m < 360 && done.some(d => d === null); m++) {
    let p = Math.max(0, power);
    list.forEach((x, i) => { if (done[i] !== null) { alloc[i].push(0); return; } if (g) left[i] -= (x.target - left[i]) * g; const a = Math.min(pace[i], Math.max(0, left[i]), p); left[i] -= a; p -= a; alloc[i].push(a); });
    list.forEach((x, i) => { if (done[i] === null && p > 0) { const a = Math.min(Math.max(0, left[i]), p); left[i] -= a; p -= a; alloc[i][m] += a; } if (done[i] === null && left[i] <= 0.5) done[i] = m; });
  }
  return { done, alloc, due, pace, need };
}
export function planFixes(list, power, i) {
  const base = simulate(list, power); if (base.done[i] !== null && base.done[i] <= base.due[i]) return null;
  const onTime = (lst, pw) => { const s = simulate(lst, pw); return s.done[i] !== null && s.done[i] <= s.due[i]; };
  const withGoal = ch => list.map((x, j) => (j === i ? { ...x, ...ch } : x));
  let extra = 10; while (extra < 100000 && !onTime(list, power + extra)) extra += extra < 500 ? 10 : 50;
  // earliest finish month that is really on time once the goal's own pace changes
  let moveTo = null; const from = Math.max(base.due[i] + 1, base.done[i] === null ? base.due[i] + 1 : base.done[i] - 3);
  for (let d = from; d <= from + 240; d++) if (onTime(withGoal({ by: kAdd(curKey(), d) }), power)) { moveTo = kAdd(curKey(), d); break; }
  // highest target (in RM 100 steps) reachable by the original date
  let lower = Math.floor(list[i].target / 100) * 100; while (lower > list[i].have && !onTime(withGoal({ target: lower }), power)) lower -= 100;
  return { extra, moveTo, lower: Math.max(0, lower) };
}
/* ───────── budget ───────── */
const FIXED_RX = /ptptn|loan|subscri|utilit|insurance|rent|internet|phone|mobile|takaful|installment|instalment|zakat/i;
const ANNUAL_RX = /medical|health|education|school|event|wedding|electronic|gadget|repair|maint|apparel|cloth|travel|holiday|home|deco|furnit|collection|gift|tax|road|service/i;
export const defaultYear = () => (kM(curKey()) >= 10 ? kY(curKey()) + 1 : kY(curKey()));
export const budRows = y => DB.lnBudget.filter(b => Number(b.BuYear) === y);
export const budGet = (y, item) => DB.lnBudget.find(b => b.BuKey === y + '|' + item);
export const budKey = (y, item) => y + '|' + item;
export const typeOf = (y, cat) => { const r = budGet(y, cat); return (r && r.BuType) || (FIXED_RX.test(cat) ? 'Fixed' : ANNUAL_RX.test(cat) ? 'Annual' : 'Day-to-day'); };
/** The months a budget is built from: the closed months of the year before (or the last 12 closed months). */
export function baseMonths(y) {
  let ks = yearKeys(y - 1).filter(k => isClosed(k) && month(k).active);
  if (ks.length < 3) { ks = []; for (let i = 1; i <= 12; i++) { const k = kAdd(curKey(), -i); if (k < startKey()) break; if (month(k).active) ks.push(k); } }
  return ks.sort();
}
const median = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
export function budgetBase(y) {
  const ks = baseMonths(y), ms = ks.map(month), n = ms.length || 1, infl = assumptions().infl / 100;
  const cats = [...new Set([...expCats(), ...ms.flatMap(m => Object.keys(m.exp))])];
  const exp = cats.map(c => {
    const vals = ms.map(m => m.exp[c] || 0), avg = vals.reduce((s, v) => s + v, 0) / n, t = typeOf(y, c);
    const lastNZ = [...vals].reverse().find(v => v > 0) || 0;
    const sug = t === 'Fixed' ? (lastNZ || avg) : t === 'Annual' ? avg : median(vals) * (1 + infl);
    return { n: c, t, avg: round2(avg), sug: Math.max(0, Math.round(sug / 5) * 5), yearTotal: round2(avg * 12) };
  }).filter(r => r.avg > 0 || budGet(y, r.n)).sort((a, b) => b.avg - a.avg);
  const inc = [...new Set([...incCats(), ...ms.flatMap(m => Object.keys(m.inc))])].map(c => { const avg = ms.reduce((s, m) => s + (m.inc[c] || 0), 0) / n; return { n: c, avg: round2(avg) }; }).filter(r => r.avg > 0).sort((a, b) => b.avg - a.avg);
  const { sideShare } = assumptions();
  inc.forEach((r, i) => { r.sug = Math.round(i === 0 ? r.avg * (1 + infl + 0.01) : r.avg * sideShare / 100); r.main = i === 0; });
  const savedRate = (() => { const t = ms.reduce((s, m) => s + m.totIn, 0); return t > 0 ? ms.reduce((s, m) => s + m.saved, 0) / t * 100 : null; })();
  const avgExp = round2(ms.reduce((s, m) => s + m.totExp, 0) / n);
  return { ks, exp, inc, savedRate, avgExp };
}
export function budget(y) {
  const base = budgetBase(y), has = budRows(y).length > 0;
  const val = (item, d) => { const r = budGet(y, item); return r ? Number(r.BuAmt) || 0 : d; };
  const inc = base.inc.map(r => ({ ...r, plan: val('_inc:' + r.n, has ? 0 : r.sug) }));
  const exp = base.exp.map(r => ({ ...r, plan: val(r.n, has ? 0 : r.sug) }));
  const incT = round2(inc.reduce((s, r) => s + r.plan, 0)), rate = val('_rate', 30), save = Math.round(incT * rate / 100), spend = round2(exp.reduce((s, r) => s + r.plan, 0));
  const ess = essential(), needs = round2(exp.filter(r => ess.includes(r.n)).reduce((s, r) => s + r.plan, 0));
  return { y, base, has, inc, exp, incT, rate, save, spend, buffer: round2(incT - save - spend), locked: !!val('_locked', 0), needs, wants: round2(spend - needs), annual: exp.filter(r => r.t === 'Annual') };
}
/** Budget vs actual for one month (only when that year has a budget). */
export function vsBudget(k) {
  const y = kY(k); if (!budRows(y).length) return null;
  const m = month(k), rows = budRows(y).filter(b => !String(b.BuItem).startsWith('_'));
  const list = rows.map(b => ({ n: b.BuItem, plan: Number(b.BuAmt) || 0, act: m.exp[b.BuItem] || 0 })).map(r => ({ ...r, over: round2(r.act - r.plan) }));
  const plan = round2(list.reduce((s, r) => s + r.plan, 0)), act = m.totExp;
  return { plan, act, over: list.filter(r => r.over > 0.5).sort((a, b) => b.over - a.over) };
}
