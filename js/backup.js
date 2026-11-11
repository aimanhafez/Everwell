// MansWell — Backup: every tab of the Google Sheet in one Excel file, readable by people (names, not IDs).
import { DB, CONN, api, acc, Today, fmtD } from './core.js';

let xlsxLoading = null;
export function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) xlsxLoading = new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = 'js/vendor/xlsx.mini.min.js';
    s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxLoading = null; bad(new Error('Could not load the Excel writer. Check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return xlsxLoading;
}

const accName = id => (acc(id) || {}).AccName || id || '';

/** Builds the workbook. Returns { name, blob, counts }. */
export async function buildBackup() {
  const X = await loadXlsx();
  let log = DB.audit;
  try { if (CONN.v) log = await api('activityAll', {}, CONN.v, { quiet: true }); } catch (e) { /* offline: use what the phone has */ }
  const sheets = [
    ['Transactions', DB.txns.slice().sort((a, b) => (a.TxDate + String(a.TxSeq).padStart(6, '0') < b.TxDate + String(b.TxSeq).padStart(6, '0') ? -1 : 1)).map(t => ({
      Date: t.TxDate, Account: accName(t.TxAcc), Type: t.TxType, Direction: t.TxDir, Amount: t.TxAmt, Signed: t.TxDir === 'Out' ? -t.TxAmt : t.TxAmt,
      Category: t.TxCat, Payee: t.TxPayee, Description: t.TxDesc, Notes: t.TxNote, TransferId: t.TxTrf, Reference: t.TxRef, SplitOf: t.TxParent, IsSplit: t.TxIsSplit ? 'Yes' : '', Source: t.TxRule, Id: t.TxnId
    }))],
    ['Accounts', DB.accounts.map(a => ({ Name: a.AccName, Type: a.AccType, Class: a.AccClass, Opened: a.AccOpenDate, OpeningBalance: a.AccOB, CreditLimit: a.AccLimit, DueDay: a.AccDueDay, Status: a.AccStatus, Sweep: a.AccSweep, Remarks: a.AccRemarks, Id: a.AccId }))],
    ['Categories', DB.categories.map(c => ({ Name: c.CatName, Type: c.CatType, Budgeted: c.CatBudget ? 'Yes' : '', Active: c.CatActive ? 'Yes' : 'No', Colour: c.CatColor, Id: c.CatId }))],
    ['Payees', DB.payees.map(p => ({ Payee: p.PyName, Category: p.PyCat }))],
    ['Recurring', DB.recurring.map(r => ({ Name: r.RcName, Account: accName(r.RcAcc), Type: r.RcType, Amount: r.RcAmt, Category: r.RcCat, Payee: r.RcPayee, Every: r.RcFreq, Next: r.RcNext, Mode: r.RcMode, Active: r.RcActive ? 'Yes' : 'No', Id: r.RcId }))],
    ['Settings', DB.settings ? [{ ...DB.settings }] : []],
    ['Import memory', (DB.importMap || []).map(m => ({ Kind: m.MapKind, From: m.MapFrom, To: m.MapKind === 'code' ? m.MapTo : accName(m.MapTo), Updated: m.MapWhen }))],
    ['Imports', (DB.imports || []).map(i => ({ File: i.ImpFile, Account: accName(i.ImpAcc), Rows: i.ImpRows, From: i.ImpFrom, To: i.ImpTo, When: i.ImpWhen, Status: i.ImpStatus, Id: i.ImpId }))],
    ['Activity log', (log || []).map(a => ({ When: a.AuWhen, Action: a.AuAction, Reference: a.AuRef, Detail: a.AuDetail }))],
    ['Payslips', (() => { const sl = r => { const q = String(r.PsKey || '').split('|'); return q.length === 3 ? q[1] : 's1'; }, emp = {}; (DB.payslips || []).forEach(r => { if (r.PsGroup === 'meta') emp[r.PsMonth + sl(r)] = r.PsName && r.PsName !== 'Net pay' ? r.PsName : ''; });
      return (DB.payslips || []).slice().sort((a, b) => (a.PsMonth + sl(a) + String(a.PsSeq).padStart(3, '0') < b.PsMonth + sl(b) + String(b.PsSeq).padStart(3, '0') ? -1 : 1)).map(r => ({ Month: r.PsMonth, Employer: emp[r.PsMonth + sl(r)] || '', Line: r.PsGroup === 'meta' ? 'Net pay' : r.PsName || r.PsItem, Group: { earn: 'Earning', ded: 'Deduction', emp: 'Employer', meta: 'Net pay' }[r.PsGroup] || r.PsGroup, Amount: r.PsAmt, LinkedTransaction: r.PsTxn })); })()],
    ['Lens assets', (DB.lnAssets || []).map(a => ({ Asset: a.AsName, TrackedBy: a.AsKind, PocketCategory: a.AsCat, Opening: a.AsOpen, Group: ['Ready now', 'Within days', 'Retirement', 'Tabung'][Number(a.AsLiq) || 0], MonthlyEstimate: a.AsMonthly, Active: a.AsActive === false ? 'No' : 'Yes', Id: a.AsId }))],
    ['Lens values', (DB.lnValues || []).map(v => ({ Asset: ((DB.lnAssets || []).find(a => a.AsId === v.VaAsset) || {}).AsName || v.VaAsset, Date: v.VaDate, Kind: v.VaKind, Amount: v.VaAmt, Note: v.VaNote, Id: v.VaId }))],
    ['Lens goals', (DB.lnGoals || []).map(g => ({ Goal: g.GoName, Target: g.GoTarget, By: g.GoBy, AlreadySaved: g.GoHave, Priority: g.GoSeq, Id: g.GoId }))],
    ['Lens budgets', (DB.lnBudget || []).map(b => ({ Year: b.BuYear, Item: b.BuItem, Monthly: b.BuAmt, Type: b.BuType }))],
    ['Lens settings', (DB.lnSettings || []).map(s => ({ Setting: s.LsKey, Value: s.LsVal }))]
  ];
  const wb = X.utils.book_new();
  const counts = {};
  sheets.forEach(([name, rows]) => {
    counts[name] = rows.length;
    const ws = rows.length ? X.utils.json_to_sheet(rows) : X.utils.aoa_to_sheet([['(empty)']]);
    if (rows.length) ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.min(40, Math.max(k.length, ...rows.slice(0, 200).map(r => String(r[k] ?? '').length)) + 2) }));
    X.utils.book_append_sheet(wb, ws, name);
  });
  const data = X.write(wb, { bookType: 'xlsx', type: 'array' });
  const name = 'MansWell-backup-' + fmtD(Today(), 'yyyy-mm-dd') + '.xlsx';
  return { name, blob: new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), counts };
}

/** iPhone: opens the share sheet (Save to Files, Drive, Mail…). Elsewhere: downloads. */
export async function shareOrDownload(name, blob) {
  const file = typeof File === 'function' ? new File([blob], name, { type: blob.type }) : null;
  try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return 'shared'; } }
  catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'downloaded';
}
