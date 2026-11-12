// Pocket · tab 4 · Payslip — the bank book only sees net pay; this records the whole payslip:
// gross → deductions (KWSP, PCB, zakat, PERKESO, SIP…) → net, plus what the employer pays. Net pay is linked to the
// Salary credit already in Pocket, so nothing is counted twice. KWSP flows on into Lens.
import { html } from '../vendor/preact-htm.js';
import { K, DB, L, Notify, rerender, save, guard, fmtD, Today, perKey, acc as accOf, oa, ta } from '../core.js';
import { TabHeader, NavBar, PasswordDialog, askPassword } from '../shared.js';
import { loadXlsx, shareOrDownload } from '../backup.js';
import { css, Sect, Sheet, openSheet, closeSheet, num, iconHtml, W2, Check } from '../lens/ui.js';
import * as P from '../payslip-data.js';

const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MONTH.map(m => m.slice(0, 3));
const kLong = k => MONTH[P.kM(k) - 1] + ' ' + P.kY(k);
const n2 = v => Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const psCss = () => `
.prow{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid ${K.sep}}
.prow .t{font-size:14px;font-weight:500;color:${K.text}}.prow .s{font-size:11px;color:${K.sub};margin-top:2px}.prow .r{text-align:right;font-size:14px;font-weight:600}
.prow.tot{border-top:1px solid ${K.line2}}.prow.tot .t,.prow.tot .r{font-size:15px;font-weight:700}
.pgrp{font-size:9.5px;font-weight:700;letter-spacing:1.2px;color:${K.or};padding:12px 0 4px}
.pdot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:7px}
.pmatch{display:flex;align-items:center;gap:10px;margin-top:12px;padding:11px 12px;border-radius:12px;font-size:12.5px;line-height:1.4}
.pmatch.ok{background:rgba(52,199,123,.07);box-shadow:inset 0 0 0 1px rgba(52,199,123,.28);color:${K.grn}}
.pmatch.warn{background:rgba(233,185,73,.07);box-shadow:inset 0 0 0 1px rgba(233,185,73,.3);color:${K.gold}}
.pmatch.no{background:${ta(.03)};box-shadow:inset 0 0 0 1px ${K.line};color:${K.sub}}
.pmatch b{color:${K.text}}
.pin{display:grid;grid-template-columns:1fr 128px;gap:10px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep}}
.ptabs{display:flex;gap:6px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:none}.ptabs::-webkit-scrollbar{display:none}
.ptab{flex:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:10px;box-shadow:inset 0 0 0 1px ${K.line2};color:${K.sub};cursor:pointer}
.ptab.on{color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.55)};background:${oa(.1)}}
.ptab small{display:block;font-size:10.5px;font-weight:500;color:${K.sub};margin-top:1px}
.padd{color:${K.or};font-size:13px;font-weight:600;padding:12px 0 0;cursor:pointer;text-align:center}
.pin .t{font-size:13.5px;font-weight:500}.pin .s{font-size:10.5px;color:${K.sub};margin-top:2px}.pin .s.ok{color:${K.grn}}.pin .s.warn{color:${K.gold}}
`;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/></svg>';
const canWrite = () => { if (DB.psOk) return true; Notify('Payslip needs the MansWell 3.1 Apps Script to save. Update Code.gs and deploy a new version (see README).', 'error'); return false; };
const txnLabel = t => (t ? `${t.TxCat || 'Income'} · ${(accOf(t.TxAcc) || {}).AccName || ''} · ${fmtD(t.TxDate, 'dd mmm')}` : '');

/* ── save / copy / remove ── */
function rowsFor(k, s, f) {
  const out = []; let seq = 0;
  const push = (group, item, name, amt) => { const v = num(amt); if (!v) return; out.push({ PsKey: P.psKey(k, item, s), PsMonth: P.mOf(k), PsItem: item, PsName: name || '', PsGroup: group, PsAmt: v, PsSeq: ++seq, PsTxn: '' }); };
  for (const g of ['earn', 'ded', 'emp']) { P.STD[g].forEach(([it]) => push(g, it, '', f.v[it])); f.extra.filter(x => x.g === g && String(x.name).trim()).forEach((x, i) => push(g, 'x' + g + (i + 1), String(x.name).trim(), x.amt)); }
  const net = netOf(f);
  out.push({ PsKey: P.psKey(k, '_net', s), PsMonth: P.mOf(k), PsItem: '_net', PsName: String(f.emp || '').trim(), PsGroup: 'meta', PsAmt: net, PsSeq: 99, PsTxn: f.txn || '' });
  return out;
}
const sumG = (f, g) => P.STD[g].reduce((s, [it]) => s + num(f.v[it]), 0) + f.extra.filter(x => x.g === g).reduce((s, x) => s + num(x.amt), 0);
const netOf = f => Math.round((sumG(f, 'earn') - sumG(f, 'ded')) * 100) / 100;
/** Saves rows; any old row in `scope` (one payslip, or the whole month) that is not in `rows` is removed. */
function write(k, rows, scope, action, detail) {
  if (!canWrite()) return;
  const keep = new Set(rows.map(r => r.PsKey));
  const del = scope.map(r => r.PsKey).filter(x => !keep.has(x));
  guard(async () => { await save({ up: { EW_Payslips: rows }, del: del.length ? { EW_Payslips: del } : {}, log: [{ AuAction: action, AuRef: 'PAYSLIP-' + P.mOf(k), AuDetail: detail }] }); });
}
function formFrom(ps) {
  const f = { v: {}, extra: [], txn: '', emp: ps ? ps.named : '' };
  if (ps) {
    for (const g of ['earn', 'ded', 'emp']) ps[g].forEach(x => { if (P.STD[g].some(([it]) => it === x.item)) f.v[x.item] = x.amt.toFixed(2); else f.extra.push({ g, name: x.name, amt: x.amt.toFixed(2) }); });
    f.txn = ps.txn ? ps.txn.TxnId : '';
  }
  return f;
}
const empName = (p, i) => p.employer || 'Employer ' + (i + 1);
function edit(l, k, s = 1) {
  const ps = P.payslip(k, s), f = formFrom(ps), more = P.slipsOf(k).length > (ps ? 1 : 0);
  if (!ps) f.txn = '';
  const wages = () => P.STD.earn.filter(([it]) => it !== 'ot').reduce((s, [it]) => s + num(f.v[it]), 0) + f.extra.filter(x => x.g === 'earn').reduce((s, x) => s + num(x.amt), 0);
  const hint = it => {
    const w = wages(); if (!w) return null;
    if (it === 'kwsp') { const e = Math.ceil(w * 0.11); const v = num(f.v.kwsp); return v && Math.abs(v - e) <= 1 ? ['ok', `11% of ${n2(w)} = ${n2(e)} ✓`] : ['warn', `11% of ${n2(w)} ≈ ${n2(e)}`]; }
    if (it === 'kwsp_er') { const r = w <= 5000 ? 13 : 12, e = Math.ceil(w * r / 100), v = num(f.v.kwsp_er); return v && Math.abs(v - e) <= 1 ? ['ok', `${r}% for wages ${w <= 5000 ? 'up to' : 'over'} RM 5,000 ✓`] : ['warn', `${r}% of ${n2(w)} ≈ ${n2(e)}`]; }
    return null;
  };
  const inp = (it, name, sub) => { const h = hint(it); return html`<div class="pin"><div><div class="t">${name}</div>${h ? html`<div class=${'s ' + h[0]}>${h[1]}</div>` : sub ? html`<div class="s">${sub}</div>` : null}</div>
    <input class="lin r" inputmode="decimal" placeholder="0.00" value=${f.v[it] || ''} onInput=${e => { f.v[it] = e.target.value; rerender(); }} data-t=${'ps-' + it} /></div>`; };
  const extras = g => f.extra.map((x, i) => x.g !== g ? null : html`<div class="pin" style="grid-template-columns:1fr 110px 24px"><input class="lin" style="height:36px;font-size:13.5px" placeholder="Name" value=${x.name} onInput=${e => { x.name = e.target.value; }} />
    <input class="lin r" style="height:36px" inputmode="decimal" placeholder="0.00" value=${x.amt} onInput=${e => { x.amt = e.target.value; rerender(); }} /><span style="cursor:pointer;color:${K.red}" onClick=${() => { f.extra.splice(i, 1); rerender(); }}>${iconHtml('trash', K.red, 16)}</span></div>`);
  const add = (g, label) => html`<div style=${`color:${K.or};font-size:13px;font-weight:600;padding:10px 0;cursor:pointer`} onClick=${() => { f.extra.push({ g, name: '', amt: '' }); rerender(); }} data-t=${'psAdd-' + g}>${label}</div>`;
  openSheet(l, {
    title: (more && !ps ? 'Another payslip · ' + MONTH[P.kM(k) - 1] : kLong(k) + ' payslip'),
    body: () => { const net = netOf(f), cands = P.candidates(k, net, s), linked = cands.find(t => t.TxnId === f.txn);
      if (!f.txnTouched && !f.txn && net > 0) { const a = P.autoLink(k, net, s); if (a) f.txn = a; }
      return html`
      <div class="lnote">${more && !ps ? 'For a second employer, or your old and new company in the month you changed jobs. Each payslip links to its own salary credit.' : "Type what's on your payslip. The KWSP amounts are checked for you."}</div>
      <div class="llab">Employer</div>
      <input class="lin" placeholder=${(linked && linked.TxPayee) || 'Company name'} value=${f.emp} onInput=${e => { f.emp = e.target.value; }} data-t="psEmp" />
      <div class="llab">Earnings</div>${P.STD.earn.map(([it, n]) => inp(it, n))}${extras('earn')}${add('earn', '+ Add earning · bonus, commission…')}
      <div class="llab">Deductions</div>${P.STD.ded.map(([it, n, s]) => inp(it, n, s))}${extras('ded')}${add('ded', '+ Add deduction · loan, koperasi, insurance…')}
      <div class="llab">Paid by employer</div>${P.STD.emp.map(([it, n]) => inp(it, n))}${extras('emp')}${add('emp', '+ Add employer contribution')}
      <div class="llab">Net pay</div>
      <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px" data-t="psNet">${W2(net)}</b>${linked ? html`<span class=${'lpill' + (Math.abs(linked.TxAmt - net) < 0.005 ? '' : ' red')} style=${Math.abs(linked.TxAmt - net) < 0.005 ? `color:${K.grn};border-color:rgba(52,199,123,.45);background:rgba(52,199,123,.1)` : ''}>${Math.abs(linked.TxAmt - net) < 0.005 ? 'MATCHED' : 'DIFFERENT'}</span>` : null}</div>
      <div class="llab">Salary in your bank book</div>
      <select class="lin" onChange=${e => { f.txn = e.target.value; f.txnTouched = true; rerender(); }} data-t="psTxn"><option value="">Not linked</option>${cands.map(t => html`<option value=${t.TxnId} selected=${t.TxnId === f.txn}>${txnLabel(t)} · ${W2(t.TxAmt)}</option>`)}</select>
      <div class="lnote" style="margin-top:6px">${cands.length ? 'Pick the salary credit for this month. Pocket matches it by amount when it can.' : 'No money-in transaction in Pocket for this month yet. You can link it later.'}</div>
      ${ps ? html`<div style="margin-top:16px"><button class="lbtnd" data-t="psDelete" onClick=${() => askPassword(l, 'remove the ' + kLong(k) + ' payslip' + (ps.employer ? ' from ' + ps.employer : ''), () => { if (!canWrite()) return; guard(async () => { await save({ del: { EW_Payslips: P.rowsOf(k, s).map(r => r.PsKey) }, log: [{ AuAction: 'Payslip removed', AuRef: 'PAYSLIP-' + P.mOf(k), AuDetail: kLong(k) + (ps.employer ? ' · ' + ps.employer : '') }] }); }); l.s = 0; closeSheet(l); })}>Remove this payslip</button></div>` : null}`; },
    onSave: () => { if (!sumG(f, 'earn')) { Notify('Enter at least your basic salary.', 'info'); return; }
      if (!String(f.emp).trim() && linkedPayee(f)) f.emp = linkedPayee(f);
      write(k, rowsFor(k, s, f), P.rowsOf(k, s), ps ? 'Payslip updated' : 'Payslip added', kLong(k) + (String(f.emp).trim() ? ' · ' + String(f.emp).trim() : '') + ' · net ' + n2(netOf(f))); l.s = s; closeSheet(l); },
    saveLabel: 'Save payslip'
  });
}
const linkedPayee = f => { const t = f.txn && DB.txns.find(x => x.TxnId === f.txn); return (t && t.TxPayee) || ''; };
/** Copies the previous month's payslips (all of them, or the ones picked) into month k, replacing what k had. */
function copyLast(l, k, pick) {
  const prev = P.psMonths().filter(x => x < k).pop(); if (!prev) return;
  const from = P.payslips(prev).filter(p => !pick || pick.has(p.s)); if (!from.length) return;
  const rows = [], excl = new Set();
  from.forEach((p, i) => { const f = formFrom(p); f.emp = p.named || p.employer; f.txn = P.autoLink(k, netOf(f), i + 1, excl); if (f.txn) excl.add(f.txn); rows.push(...rowsFor(k, i + 1, f)); });
  write(k, rows, P.rowsOf(k), 'Payslip copied', kLong(prev) + ' → ' + kLong(k) + (from.length > 1 ? ' · ' + from.length + ' payslips' : ''));
  l.k = k; l.s = 0; rerender();
}
/** Copy button: one payslip copies straight away; two or more let you pick (after a job change you want only the new one). */
function copyFlow(l, k, prev) {
  const list = P.payslips(prev);
  if (list.length < 2) return copyLast(l, k);
  const pick = new Set(list.map(p => p.s));
  openSheet(l, { title: 'Copy ' + MONTH[P.kM(prev) - 1], saveLabel: 'Copy',
    body: () => html`<div class="lnote">${MONTH[P.kM(prev) - 1]} has ${list.length} payslips. Pick the ones you still get.</div>
      ${list.map((p, i) => html`<div class="pin" style="grid-template-columns:24px 1fr auto;cursor:pointer" onClick=${() => { pick.has(p.s) ? pick.delete(p.s) : pick.add(p.s); rerender(); }} data-t=${'psPick-' + (i + 1)}>${Check(pick.has(p.s))}<div><div class="t">${empName(p, i)}</div><div class="s">Net ${n2(p.net)}</div></div><b style="font-size:13.5px">${n2(p.gross)}</b></div>`)}`,
    onSave: () => { if (!pick.size) { Notify('Pick at least one payslip.', 'info'); return; } closeSheet(l); copyLast(l, k, pick); } });
}
async function exportYear(y) {
  try {
    const X = await loadXlsx(), Y = P.payslipYear(y);
    const rows = Y.list.map(p => ({ Month: kLong(p.k), Employer: p.employer || '', Gross: p.gross, 'KWSP (you)': p.kwspYou, PCB: p.pcb, Zakat: p.zakat, PERKESO: p.socso, SIP: p.eis, 'Other deductions': p.otherDed, 'Net pay': p.net, 'KWSP (employer)': p.kwspEr, 'PERKESO (employer)': p.socsoEr, 'SIP (employer)': p.eisEr, 'Bank book': p.matched ? 'Matched' : p.linked ? 'Different by ' + n2(p.diff) : 'Not linked' }));
    rows.push({ Month: 'Total ' + y, Employer: '', Gross: Y.gross, 'KWSP (you)': Y.kwspYou, PCB: Y.pcb, Zakat: Y.zakat, PERKESO: round(Y.list.reduce((s, p) => s + p.socso, 0)), SIP: round(Y.list.reduce((s, p) => s + p.eis, 0)), 'Other deductions': Y.otherDed, 'Net pay': Y.net, 'KWSP (employer)': Y.kwspEr, 'PERKESO (employer)': round(Y.list.reduce((s, p) => s + p.socsoEr, 0)), 'SIP (employer)': round(Y.list.reduce((s, p) => s + p.eisEr, 0)), 'Bank book': Y.matched + ' of ' + Y.n + ' matched' });
    const ws = X.utils.json_to_sheet(rows); ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(12, k.length + 2) }));
    Object.keys(ws).forEach(a => { if (a[0] !== '!' && typeof ws[a].v === 'number') ws[a].z = '#,##0.00'; });
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'Payslips ' + y);
    await shareOrDownload('MansWell-Payslips-' + y + '.xlsx', new Blob([X.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  } catch (e) { Notify("Couldn't export: " + e.message, 'error'); }
}
const round = v => Math.round(v * 100) / 100;

export const scrPayslip = {
  onVisible(l) { if (!l.k) { const c = perKey(Today()); const last = P.psMonths().pop(); l.k = P.monthPay(c) || !last ? c : last; } },
  view(l) {
    if (!l.k) this.onVisible(l);
    const k = l.k, M = P.monthPay(k), list = M ? M.list : [], si = Math.max(0, list.findIndex(p => p.s === l.s)), ps = list[si] || null, multi = list.length > 1;
    const Y = P.payslipYear(P.kY(k)), prev = P.psMonths().filter(x => x < k).pop();
    const go = n => { l.k = P.kAdd(l.k, n); l.s = 0; rerender(); };
    const nMatched = list.filter(p => p.matched).length;
    const sel = html`<div class="lc lsel" data-t="psMonth"><span class="lcb" onClick=${() => go(-1)} aria-label="Previous month" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4 7 12l8 8"/></svg>' }}></span>
      <div class="t"><b>${kLong(k)}</b><span>${multi ? `${list.length} payslips · ${nMatched === list.length ? 'all matched' : nMatched + ' of ' + list.length + ' matched'}` : ps && ps.txn ? 'Paid ' + fmtD(ps.txn.TxDate, 'dd mmm') + ' · ' + ((accOf(ps.txn.TxAcc) || {}).AccName || '') : ps ? 'Not linked to the bank book yet' : 'No payslip yet'}</span></div>
      <span class="lcb" onClick=${() => go(1)} aria-label="Next month" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 4 8 8-8 8"/></svg>' }}></span></div>`;
    const note = DB.psOk ? null : html`<div class="lwarn">Payslip can't save yet. Update the Apps Script to MansWell 3.1 and deploy a new version. The README has the steps.</div>`;
    const empty = html`<div class="lc"><div class="lempty" style="padding:18px 6px">No payslip for ${MONTH[P.kM(k) - 1]} yet.<br/>Your bank book only sees net pay. Add the payslip to see the full picture: gross, deductions and what your employer pays.</div>
      <div style="display:flex;gap:8px">${prev ? html`<button class="lbtn" style="flex:1;padding:11px" onClick=${() => copyFlow(l, k, prev)} data-t="psCopy">${iconHtml('plus', K.text, 15)}Copy ${MON[P.kM(prev) - 1]}</button>` : null}<button class="lbtn o" style="flex:1;padding:11px" onClick=${() => edit(l, k)} data-t="psEnter">Enter payslip</button></div></div>`;
    const match = !ps ? null : ps.matched ? html`<div class="pmatch ok" data-t="psMatch"><span style="width:20px;height:20px;flex:none;color:${K.grn}" dangerouslySetInnerHTML=${{ __html: CHECK }}></span><div><b>Matches your bank book.</b> ${txnLabel(ps.txn)} · ${W2(ps.txn.TxAmt)}</div></div>`
      : ps.linked ? html`<div class="pmatch warn" data-t="psMatch"><div><b>Bank book shows ${W2(ps.txn.TxAmt)}</b> (${txnLabel(ps.txn)}), ${W2(Math.abs(ps.diff))} ${ps.diff > 0 ? 'more' : 'less'} than this net pay. Check the payslip or the transaction.</div></div>`
        : html`<div class="pmatch no" data-t="psMatch"><div>Not linked to a Salary transaction yet. Tap <b>Edit payslip</b> to link it once the salary is in Pocket.</div></div>`;
    const kids = ps ? html`
      <div class="lc lh" data-t="psHero">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="lcap">${multi ? 'Gross pay · ' + list.length + ' payslips' : 'Gross pay'}</span><span class="lpill" data-t="psTake">TAKE-HOME ${Math.round(M.net / M.gross * 100)}%</span></div>
        <div class="lbig" data-t="psGross">${W2(M.gross)}</div>
        <div class="lsub">${multi ? html`${list.map((p, i) => empName(p, i)).join(' + ')}<br/>` : null}${W2(M.dedT)} deducted before it reached your bank</div>
        <div style="display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px;margin-top:14px"><i style=${`width:${Math.max(0, M.net / M.gross * 100)}%;background:${K.grn}`}></i>${M.ded.map(d => html`<i style=${`width:${d.amt / M.gross * 100}%;background:${P.DED_COL[d.item] || '#8A6FD1'}`}></i>`)}</div>
        <div style=${`display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:${K.sub}`}><span><span class="pdot" style=${`background:${K.grn}`}></span>Net ${W2(M.net)}</span><span>Deductions ${W2(M.dedT)}</span></div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Net to bank</span><div class="lv" data-t="psNetHero">${W2(M.net)}</div></div><div><span class="lcap">Your real package</span><div class="lv" data-t="psPackage">${W2(M.gross + M.empT)}</div><div class="lsub" style="font-size:10.5px">gross + employer pays</div></div></div>
      </div>
      ${Sect(multi ? 'Payslips' : 'Gross to net')}
      <div class="lc" style="padding:10px 16px 14px" data-t="psStatement">
        ${multi ? html`<div class="ptabs" data-t="psTabs">${list.map((p, i) => html`<span class=${'ptab' + (i === si ? ' on' : '')} onClick=${() => { l.s = p.s; rerender(); }} data-t=${'psTab-' + (i + 1)}>${empName(p, i)}<small>Net ${n2(p.net)}${p.matched ? ' · matched' : ''}</small></span>`)}</div>`
          : ps.employer ? html`<div class="lcap" style="padding-top:4px" data-t="psEmployerName">${ps.employer}</div>` : null}
        <div class="pgrp">EARNINGS</div>${ps.earn.map(e => html`<div class="prow"><div class="t">${e.name}</div><div class="r">${n2(e.amt)}</div></div>`)}
        <div class="prow tot"><div class="t">Gross pay</div><div class="r">${n2(ps.gross)}</div></div>
        <div class="pgrp">DEDUCTIONS</div>${ps.ded.map(d => { const s = (P.STD.ded.find(x => x[0] === d.item) || [])[2]; return html`<div class="prow"><div><div class="t"><span class="pdot" style=${`background:${P.DED_COL[d.item] || '#8A6FD1'}`}></span>${d.name}</div>${s ? html`<div class="s" style="margin-left:15px">${s}</div>` : null}</div><div class="r">(${n2(d.amt)})</div></div>`; })}
        <div class="prow tot"><div class="t">Net pay</div><div class="r" style=${`color:${K.grn}`}>${n2(ps.net)}</div></div>
        ${match}
        <div style="display:flex;gap:8px;margin-top:12px">${prev ? html`<button class="lbtn" style="flex:1" onClick=${() => askPassword(l, 'replace ' + MONTH[P.kM(k) - 1] + ' with a copy of ' + MONTH[P.kM(prev) - 1], () => copyFlow(l, k, prev))}>Copy ${MON[P.kM(prev) - 1]}</button>` : null}<button class="lbtn o" style="flex:1" onClick=${() => edit(l, k, ps.s)} data-t="psEdit">Edit payslip</button></div>
        <div class="padd" onClick=${() => edit(l, k, P.nextSlip(k))} data-t="psAddSlip">+ Add a payslip from another employer</div>
      </div>
      ${ps.emp.length ? html`${Sect(multi ? 'Paid by ' + empName(ps, si) : 'Paid by your employer')}
      <div class="lc" style="padding:10px 16px 14px" data-t="psEmployer">
        <div class="lnote" style="padding:4px 0 6px">Not in your pay, but it's yours. KWSP goes to your retirement savings in Lens.</div>
        ${ps.emp.map(e => html`<div class="prow"><div class="t">${e.name}</div><div class="r">${n2(e.amt)}</div></div>`)}
        ${ps.kwsp ? html`<div class="prow tot"><div class="t">Into KWSP this month</div><div class="r" style=${`color:${K.or}`} data-t="psKwsp">${n2(ps.kwsp)}</div></div>` : null}
      </div>` : null}` : empty;
    const year = Y.n ? html`${Sect('This year', 'Export', () => exportYear(P.kY(k)), 'psExport')}
      <div class="lc" data-t="psYear">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">${P.kY(k)} · ${Y.n} payslip${Y.n === 1 ? '' : 's'}</span><span class=${'lpill'} style=${Y.matched === Y.n ? `color:${K.grn};border-color:rgba(52,199,123,.45);background:rgba(52,199,123,.1)` : ''}>${Y.matched === Y.n ? 'ALL MATCHED' : Y.matched + ' OF ' + Y.n + ' MATCHED'}</span></div>
        <div class="lg2 r2" style="margin-top:12px">
          <div><span class="lcap">Gross pay</span><div class="lv" data-t="psYGross">${W2(Y.gross)}</div></div><div><span class="lcap">Net to bank</span><div class="lv">${W2(Y.net)}</div></div>
          <div><span class="lcap">PCB tax paid</span><div class="lv" data-t="psYPcb">${W2(Y.pcb)}</div></div><div><span class="lcap">Zakat paid</span><div class="lv">${W2(Y.zakat)}</div></div>
          <div><span class="lcap">KWSP · you + employer</span><div class="lv" data-t="psYKwsp">${W2(Y.kwsp)}</div></div><div><span class="lcap">PERKESO + SIP</span><div class="lv">${W2(Y.socsoEis)}</div></div>
        </div>
        <div class="lnote" style="margin-top:12px">Ready for e-Filing: check these against your <b>EA form</b> next year. Zakat paid through salary also reduces the tax you owe.</div>
      </div>` : null;
    return html`<div>
      <style>${css()}${psCss()}</style>
      ${TabHeader()}
      ${L(18, 68, 240, 32, 'Payslip', { s: 17 })}
      <div class="lz" style="top:104px" id="pocketPayslip" data-t="pocketPayslip">${note}${sel}${kids}${year}<div style="height:6px"></div></div>
      ${NavBar(3)}
      ${Sheet(l)}
      ${PasswordDialog(l)}
    </div>`;
  }
};
