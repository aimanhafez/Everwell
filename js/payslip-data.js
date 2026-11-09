// Pocket · Payslip data: gross → deductions → net, employer contributions, and the link to the Salary credit in the bank book.
// One row per line in EW_Payslips (PsMonth|PsItem). Months are Pocket's financial months. Used by Pocket and by Lens.
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
export const psKey = (k, item) => mOf(k) + '|' + item;

export function rowsOf(k) { const m = mOf(k); return DB.payslips.filter(r => r.PsMonth === m); }
export function psMonths() { return [...new Set(DB.payslips.filter(r => r.PsGroup !== 'meta').map(r => kOfM(r.PsMonth)))].sort((a, b) => a - b); }

/** The payslip for a month, or null. */
export function payslip(k) {
  const rows = rowsOf(k); if (!rows.some(r => r.PsGroup !== 'meta')) return null;
  const line = r => ({ item: r.PsItem, name: r.PsName || STD_NAME[r.PsItem] || r.PsItem, amt: round2(Number(r.PsAmt) || 0), seq: Number(r.PsSeq) || 0 });
  const grp = g => rows.filter(r => r.PsGroup === g).map(line).sort((a, b) => (ORDER[a.item] ?? 50 + a.seq) - (ORDER[b.item] ?? 50 + b.seq));
  const earn = grp('earn'), ded = grp('ded'), emp = grp('emp');
  const sumL = l => round2(l.reduce((s, x) => s + x.amt, 0)), get = (l, it) => (l.find(x => x.item === it) || {}).amt || 0;
  const gross = sumL(earn), dedT = sumL(ded), net = round2(gross - dedT), empT = sumL(emp);
  const meta = rows.find(r => r.PsGroup === 'meta');
  const txn = meta && meta.PsTxn ? DB.txns.find(t => t.TxnId === meta.PsTxn) || null : null;
  const kwspYou = get(ded, 'kwsp'), kwspEr = get(emp, 'kwsp_er');
  return { k, earn, ded, emp, gross, dedT, net, empT, kwspYou, kwspEr, kwsp: round2(kwspYou + kwspEr), pcb: get(ded, 'pcb'), zakat: get(ded, 'zakat'), socso: get(ded, 'socso'), eis: get(ded, 'eis'),
    socsoEr: get(emp, 'socso_er'), eisEr: get(emp, 'eis_er'), otherDed: round2(dedT - kwspYou - get(ded, 'pcb') - get(ded, 'zakat') - get(ded, 'socso') - get(ded, 'eis')),
    wages: round2(earn.filter(e => e.item !== 'ot').reduce((s, x) => s + x.amt, 0)),
    txn, linked: !!txn, matched: !!txn && Math.abs(txn.TxAmt - net) < 0.005, diff: txn ? round2(txn.TxAmt - net) : null,
    payDate: txn ? txn.TxDate : PEND(kY(k), kM(k)) };
}
/** Money-in transactions in that month that could be the salary credit, best first. */
export function candidates(k, net) {
  const from = PSTART(kY(k), kM(k)), to = PEND(kY(k), kM(k));
  return DB.txns.filter(t => t.TxDate >= from && t.TxDate <= to && !t.TxParent && !t.TxIsSplit && t.TxType === 'Income' && t.TxDir === 'In' && catTypeOf(t.TxCat) === 'Income')
    .sort((a, b) => (Math.abs(a.TxAmt - net) < 0.005 ? 0 : 1) - (Math.abs(b.TxAmt - net) < 0.005 ? 0 : 1) || (/salary|gaji|payroll/i.test(b.TxCat) ? 1 : 0) - (/salary|gaji|payroll/i.test(a.TxCat) ? 1 : 0) || b.TxAmt - a.TxAmt);
}
export function autoLink(k, net) {
  const c = candidates(k, net);
  const exact = c.find(t => Math.abs(t.TxAmt - net) < 0.005);
  if (exact) return exact.TxnId;
  const sal = c.find(t => /salary|gaji|payroll/i.test(t.TxCat));
  return sal ? sal.TxnId : '';
}
/** Year to date over the payslips of a year. */
export function payslipYear(y) {
  const list = psMonths().filter(k => kY(k) === y).map(payslip).filter(Boolean);
  const S = f => round2(list.reduce((s, p) => s + p[f], 0));
  return { n: list.length, matched: list.filter(p => p.matched).length, list, gross: S('gross'), net: S('net'), pcb: S('pcb'), zakat: S('zakat'), kwsp: S('kwsp'), kwspYou: S('kwspYou'), kwspEr: S('kwspEr'), socsoEis: round2(S('socso') + S('eis')), dedT: S('dedT'), empT: S('empT'), otherDed: S('otherDed') };
}
/** KWSP (you + employer) by payslip, for Lens: [{k, payDate, amt}] */
export function kwspFlows() { return psMonths().map(payslip).filter(Boolean).map(p => ({ k: p.k, payDate: p.payDate, amt: p.kwsp })); }
export const hasPayslips = () => DB.payslips.some(r => r.PsGroup !== 'meta');
export { perKey };
