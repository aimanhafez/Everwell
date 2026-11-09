// Pocket · Payslip data: gross → deductions → net, employer contributions, and the link to the Salary credit in the bank book.
// One row per line in EW_Payslips. Months are Pocket's financial months. Used by Pocket and by Lens.
// A month can hold more than one payslip (two employers, or a job change): the first keeps the 3.1 keys
// 'yyyy-mm|item'; the second is 'yyyy-mm|s2|item', and so on. The employer's name sits on the net-pay row.
// No new columns, so the 3.1 Apps Script works as it is.
import { DB, round2, perKey, PSTART, PEND, catTypeOf } from './core.js';

export const STD = {
  earn: [['basic', 'Basic salary'], ['allow', 'Fixed allowance'], ['ot', 'Overtime / claims']],
  ded: [['kwsp', 'KWSP (EPF) · you', '11% of wages'], ['pcb', 'PCB (monthly tax)', 'Potongan Cukai Bulanan'], ['zakat', 'Zakat', 'Also reduces your tax'], ['socso', 'PERKESO (SOCSO)', 'Employment injury & invalidity'], ['eis', 'SIP (EIS)', 'Employment insurance']],
  emp: [['kwsp_er', 'KWSP (EPF) · employer', ''], ['socso_er', 'PERKESO (SOCSO) · employer', ''], ['eis_er', 'SIP (EIS) · employer', '']]
};
export const DED_COL = { kwsp: '#FF6A00', pcb: '#E5484D', zakat: '#E9B949', socso: '#A3236F', eis: '#6B7178' };
const STD_NAME = Object.fromEntries([...STD.earn, ...STD.ded, ...STD.emp].map(([k, n]) => [k, n]));
const ORDER = Object.fromEntries([...STD.earn, ...STD.ded, ...STD.emp].map(([k], i) => [k, i]));

export const kY = k => Math.floor(k / 100), kM = k => k % 100;
export const kAdd = (k, n) => { const i = kY(k) * 12 + kM(k) - 1 + n; return Math.floor(i / 12) * 100 + (i % 12) + 1; };
export const mOf = k => kY(k) + '-' + String(kM(k)).padStart(2, '0');
export const kOfM = m => { const [y, mm] = String(m).split('-').map(Number); return y * 100 + mm; };
export const psKey = (k, item, s = 1) => mOf(k) + '|' + (s > 1 ? 's' + s + '|' : '') + item;
export const slipOf = r => { const p = String(r.PsKey || '').split('|'); return p.length === 3 ? Number(p[1].slice(1)) || 1 : 1; };

export function rowsOf(k, s) { const m = mOf(k); return DB.payslips.filter(r => r.PsMonth === m && (s == null || slipOf(r) === s)); }
/** The payslip numbers in a month, e.g. [1] or [1, 2]. */
export function slipsOf(k) { return [...new Set(rowsOf(k).filter(r => r.PsGroup !== 'meta').map(slipOf))].sort((a, b) => a - b); }
export const nextSlip = k => Math.max(0, ...slipsOf(k)) + 1;
export function psMonths() { return [...new Set(DB.payslips.filter(r => r.PsGroup !== 'meta').map(r => kOfM(r.PsMonth)))].sort((a, b) => a - b); }

/** One payslip (slip s of a month), or null. */
export function payslip(k, s = 1) {
  const rows = rowsOf(k, s); if (!rows.some(r => r.PsGroup !== 'meta')) return null;
  const line = r => ({ item: r.PsItem, name: r.PsName || STD_NAME[r.PsItem] || r.PsItem, amt: round2(Number(r.PsAmt) || 0), seq: Number(r.PsSeq) || 0 });
  const grp = g => rows.filter(r => r.PsGroup === g).map(line).sort((a, b) => (ORDER[a.item] ?? 50 + a.seq) - (ORDER[b.item] ?? 50 + b.seq));
  const earn = grp('earn'), ded = grp('ded'), emp = grp('emp');
  const sumL = l => round2(l.reduce((s, x) => s + x.amt, 0)), get = (l, it) => (l.find(x => x.item === it) || {}).amt || 0;
  const gross = sumL(earn), dedT = sumL(ded), net = round2(gross - dedT), empT = sumL(emp);
  const meta = rows.find(r => r.PsGroup === 'meta');
  const txn = meta && meta.PsTxn ? DB.txns.find(t => t.TxnId === meta.PsTxn) || null : null;
  const kwspYou = get(ded, 'kwsp'), kwspEr = get(emp, 'kwsp_er');
  const named = meta && meta.PsName && meta.PsName !== 'Net pay' ? String(meta.PsName) : '';
  return { k, s, employer: named || (txn && txn.TxPayee) || '', named, earn, ded, emp, gross, dedT, net, empT, kwspYou, kwspEr, kwsp: round2(kwspYou + kwspEr), pcb: get(ded, 'pcb'), zakat: get(ded, 'zakat'), socso: get(ded, 'socso'), eis: get(ded, 'eis'),
    socsoEr: get(emp, 'socso_er'), eisEr: get(emp, 'eis_er'), otherDed: round2(dedT - kwspYou - get(ded, 'pcb') - get(ded, 'zakat') - get(ded, 'socso') - get(ded, 'eis')),
    wages: round2(earn.filter(e => e.item !== 'ot').reduce((s, x) => s + x.amt, 0)),
    txn, linked: !!txn, matched: !!txn && Math.abs(txn.TxAmt - net) < 0.005, diff: txn ? round2(txn.TxAmt - net) : null,
    payDate: txn ? txn.TxDate : PEND(kY(k), kM(k)) };
}
/** Every payslip of a month, in order. */
export const payslips = k => slipsOf(k).map(s => payslip(k, s)).filter(Boolean);
const SUM_F = ['gross', 'dedT', 'net', 'empT', 'kwspYou', 'kwspEr', 'kwsp', 'pcb', 'zakat', 'socso', 'eis', 'socsoEr', 'eisEr', 'otherDed', 'wages'];
const mergeLines = ls => { const m = new Map(); ls.forEach(x => { const o = m.get(x.item + '|' + x.name); if (o) o.amt = round2(o.amt + x.amt); else m.set(x.item + '|' + x.name, { ...x }); }); return [...m.values()]; };
/** The whole month: all payslips added together (what Lens uses). Same fields as one payslip, plus list and n. */
export function monthPay(k) {
  const list = payslips(k); if (!list.length) return null;
  if (list.length === 1) return { ...list[0], list, n: 1 };
  const o = { k, s: 0, list, n: list.length, employer: list.map(p => p.employer).filter(Boolean).join(' + ') };
  SUM_F.forEach(f => { o[f] = round2(list.reduce((t, p) => t + p[f], 0)); });
  ['earn', 'ded', 'emp'].forEach(g => { o[g] = mergeLines(list.flatMap(p => p[g])); });
  o.linked = list.every(p => p.linked); o.matched = list.every(p => p.matched);
  o.payDate = list.map(p => p.payDate).sort().pop();
  return o;
}
/** Salary credits already linked to another payslip in the same month. */
const takenBy = (k, s) => new Set(DB.payslips.filter(r => r.PsMonth === mOf(k) && r.PsGroup === 'meta' && r.PsTxn && slipOf(r) !== s).map(r => r.PsTxn));
/** Money-in transactions in that month that could be the salary credit, best first. Leaves out credits linked to another payslip. */
export function candidates(k, net, s = 1, excl) {
  const from = PSTART(kY(k), kM(k)), to = PEND(kY(k), kM(k)), taken = takenBy(k, s);
  if (excl) excl.forEach(x => taken.add(x));
  return DB.txns.filter(t => t.TxDate >= from && t.TxDate <= to && !taken.has(t.TxnId) && !t.TxParent && !t.TxIsSplit && t.TxType === 'Income' && t.TxDir === 'In' && catTypeOf(t.TxCat) === 'Income')
    .sort((a, b) => (Math.abs(a.TxAmt - net) < 0.005 ? 0 : 1) - (Math.abs(b.TxAmt - net) < 0.005 ? 0 : 1) || (/salary|gaji|payroll/i.test(b.TxCat) ? 1 : 0) - (/salary|gaji|payroll/i.test(a.TxCat) ? 1 : 0) || b.TxAmt - a.TxAmt);
}
export function autoLink(k, net, s = 1, excl) {
  const c = candidates(k, net, s, excl);
  const exact = c.find(t => Math.abs(t.TxAmt - net) < 0.005);
  if (exact) return exact.TxnId;
  const sal = c.find(t => /salary|gaji|payroll/i.test(t.TxCat));
  return sal ? sal.TxnId : '';
}
/** Year to date over every payslip of a year (a month with two employers counts two payslips). */
export function payslipYear(y) {
  const list = psMonths().filter(k => kY(k) === y).flatMap(payslips);
  const S = f => round2(list.reduce((s, p) => s + p[f], 0));
  return { n: list.length, matched: list.filter(p => p.matched).length, list, gross: S('gross'), net: S('net'), pcb: S('pcb'), zakat: S('zakat'), kwsp: S('kwsp'), kwspYou: S('kwspYou'), kwspEr: S('kwspEr'), socsoEis: round2(S('socso') + S('eis')), dedT: S('dedT'), empT: S('empT'), otherDed: S('otherDed') };
}
/** KWSP (you + employer) by month, all employers together, for Lens: [{k, payDate, amt}] */
export function kwspFlows() { return psMonths().map(monthPay).filter(Boolean).map(p => ({ k: p.k, payDate: p.payDate, amt: p.kwsp })); }
export const hasPayslips = () => DB.payslips.some(r => r.PsGroup !== 'meta');
export { perKey };
