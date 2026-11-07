// scrAccounts, scrAccountDetail, scrAccountEdit
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Gal, Svg, Flow, TI, DD, heroBg, Navigate, Back, Replace, Notify, rerender, guard, save,
  bal, acc, byTxDesc, stStart, fmtD, Today, PLABEL, PSTART, Year, Month, addDays, addMonths, perKey, RM, sRM, n0, Value, round2,
  mkTxn, txnId, nextTxSeq, shortName, accMoveUpTo
} from '../core.js';
import { TabHeader, NavBar, DetailHeader, SaveBar, DateBox, Calendar } from '../shared.js';

/* ───────────── Accounts list ───────────── */
export const scrAccounts = {
  view() {
    const list = DB.accounts.map(a => ({ ...a, Bal: bal(a.AccId) }))
      .sort((a, b) => {
        const k = x => (x.AccStatus === 'Closed' ? '3' : x.AccClass === 'Asset' ? '1' : '2') + String(x.AccSeq).padStart(4, '0');
        return k(a) < k(b) ? -1 : 1;
      });
    return html`<div>
      ${TabHeader()}
      ${L(18, 68, 240, 32, 'Accounts', { s: 17 })}
      ${L(18, 106, 260, 14, 'YOUR ACCOUNTS  ·  ' + DB.accounts.length + '   ·   CURRENT BALANCE', { s: 7.5, w: 6, c: K.mute })}
      ${Gal(12, 132, 366, 568, list, 78, a => html`
        ${B(0, 0, 366, 70, '', { fill: K.card, b: K.line, r: 14 })}
        ${C(14, 16, 38, a.AccColor)}
        ${L(14, 16, 38, 38, a.AccShort, { s: 8, w: 7, a: 'c', c: '#FFFFFF' })}
        ${L(64, 15, 152, 20, a.AccName, { s: 10.5, w: 6, c: a.AccStatus === 'Closed' ? K.mute : K.text })}
        ${L(64, 36, 152, 16, a.AccType + (a.AccStatus === 'Closed' ? '  ·  Closed' : ''), { s: 8, c: K.sub })}
        ${L(206, 15, 146, 20, a.AccClass === 'Liability' ? RM(-a.Bal) : sRM(a.Bal), { s: 12.5, w: 6, a: 'r', c: a.AccClass === 'Liability' || a.Bal < 0 ? K.red : K.text })}
        ${L(206, 36, 146, 16, a.AccClass === 'Liability' ? (a.AccLimit > 0 ? 'Owed  ·  RM ' + n0(a.AccLimit + a.Bal) + ' available' : 'Owed') : '', { s: 8, c: K.sub, a: 'r' })}`,
      { scroll: true, stretch: true, onSelect: a => { G.gblAccId = a.AccId; Navigate('scrAccountDetail'); }, key: a => a.AccId })}
      ${!DB.accounts.length ? L(12, 152, 366, 40, 'No accounts yet.', { s: 10, c: K.mute, a: 'c' }) : null}
      ${B(52, { b: 92 }, 286, 44, '＋   Add account', { fill: K.card, b: K.or, c: K.or, r: 22, s: 10.5, onClick: () => { G.gblEditMode = 'new'; Navigate('scrAccountEdit'); }, id: 'addAccount' })}
      ${NavBar(1)}
    </div>`;
  }
};

/* ───────────── Account detail ───────────── */
function trendSvg(accId) {
  const l0 = PLABEL(Today());
  const base = PSTART(Year(l0), Month(l0));
  const ms = [1, 2, 3, 4, 5, 6].map(v => {
    const e = addMonths(base, v - 5);
    const pe = addDays(e, -1);
    return { Mi: v, Lb: fmtD(addDays(e, -1), 'mmm').toUpperCase(), Bv: accMoveUpTo(accId, Year(pe) * 100 + Month(pe)) };
  });
  const mx = Math.max(...ms.map(m => m.Bv)), mn = Math.min(Math.min(...ms.map(m => m.Bv)), 0);
  const rg = Math.max(mx - mn, 1);
  const pt = m => (30 + (m.Mi - 1) * 56) + ',' + (108 - (m.Bv - mn) / rg * 90).toFixed(1);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 340 150'><line x1='8' y1='112' x2='332' y2='112' stroke='#2A2E35'/><polyline fill='none' stroke='#FF6A00' stroke-width='3' stroke-linejoin='round' points='${ms.map(pt).join(' ')}'/>` +
    ms.map(m => `<circle cx='${30 + (m.Mi - 1) * 56}' cy='${(108 - (m.Bv - mn) / rg * 90).toFixed(1)}' r='4' fill='#0F1114' stroke='#FF6A00' stroke-width='2'/><text x='${30 + (m.Mi - 1) * 56}' y='132' text-anchor='middle' font-family='Segoe UI,Arial' font-size='10' fill='${m.Mi === 6 ? '#FF6A00' : '#A0A6AE'}'>${m.Lb}</text>`).join('') + '</svg>';
}

export const scrAccountDetail = {
  onVisible(l) { l.locConfirmClose = false; },
  view(l) {
    const a = acc(G.gblAccId);
    if (!a) return html`<div>${DetailHeader('Account')}</div>`;
    const b = bal(a.AccId);
    const isL = a.AccClass === 'Liability';
    const l0 = PLABEL(Today());
    const mStart = PSTART(Year(l0), Month(l0));
    const mine = DB.txns.filter(t => t.TxAcc === a.AccId && !t.TxParent);
    const thisM = mine.filter(t => t.TxDate >= mStart && t.TxType !== 'Opening Balance');
    const inM = thisM.filter(t => t.TxDir === 'In').reduce((s, t) => s + t.TxAmt, 0);
    const outM = thisM.filter(t => t.TxDir === 'Out').reduce((s, t) => s + t.TxAmt, 0);
    const hist = mine.slice().sort(byTxDesc).slice(0, 60);
    const runBal = t => round2(b - mine.filter(x => x.TxDate > t.TxDate || (x.TxDate === t.TxDate && x.TxSeq > t.TxSeq)).reduce((s, x) => s + (x.TxDir === 'In' ? x.TxAmt : -x.TxAmt), 0));
    const closed = a.AccStatus === 'Closed';

    const closeTap = () => guard(async () => {
      if (closed) {
        await save({ up: { EW_Accounts: [{ ...a, AccStatus: 'Active' }] }, log: [{ AuAction: 'Reopen account', AuRef: a.AccId, AuDetail: a.AccName }] });
        Notify('Account reopened.', 'success');
      } else if (Math.abs(b) >= 0.005) {
        Notify('Balance must be RM 0.00 before closing.', 'error');
      } else if (!l.locConfirmClose) {
        l.locConfirmClose = true;
      } else {
        await save({ up: { EW_Accounts: [{ ...a, AccStatus: 'Closed' }] }, log: [{ AuAction: 'Close account', AuRef: a.AccId, AuDetail: a.AccName }] });
        l.locConfirmClose = false;
        Notify('Account closed.', 'success');
      }
    });
    const histH = 52 + Math.max(hist.length, 1) * 58 + 44;

    const kids = html`
      ${Box(null, 0, 366, 150, html`
        ${Svg(0, 0, 366, 150, heroBg(150), { stretch: true })}
        ${C(18, 18, 38, a.AccColor)}${L(18, 18, 38, 38, a.AccShort, { s: 8, w: 7, a: 'c', c: '#FFFFFF' })}
        ${L(66, 18, 282, 20, a.AccName, { s: 10.5, w: 6 })}
        ${L(66, 38, 282, 16, a.AccType + (closed ? '  ·  Closed' : ''), { s: 8, c: K.sub })}
        ${L(18, 74, 200, 14, isL ? 'AMOUNT OWED' : 'BALANCE', { s: 7.5, w: 6, c: K.sub })}
        ${L(18, 88, 330, 32, isL ? RM(-b) : sRM(b), { s: 20, w: 6, c: isL ? K.red : K.text, id: 'accBal' })}
        ${L(18, 122, 330, 16, isL && a.AccLimit > 0 ? RM(a.AccLimit + b) + ' available of RM ' + n0(a.AccLimit) + (a.AccDueDay > 0 ? '  ·  due on day ' + a.AccDueDay : '') : '', { s: 8, c: K.sub })}`, { r: 16 })}
      ${Box(null, 0, 366, 44, html`
        ${B(0, 0, 178, 42, '＋  Transaction', { fill: K.or, c: '#FFFFFF', r: 21, s: 10, onClick: () => { G.gblPrefill = { PfAcc: a.AccId, PfType: 'Expense', PfAmt: 0, PfCat: '', PfPayee: '', PfRule: '', PfDate: Today() }; G.gblEditMode = 'prefill'; Navigate('scrTxnEdit'); } })}
        ${B(188, 0, 178, 42, '⇄  Transfer', { fill: K.field, b: K.line, r: 21, s: 10, onClick: () => Navigate('scrTransfer') })}`)}
      ${Card(null, 0, 366, 66, html`
        ${L(18, 14, 178, 14, 'IN THIS MONTH', { s: 7.5, w: 6, c: K.sub })}
        ${L(18, 30, 168, 20, RM(inM), { s: 12.5, w: 6, c: K.grn })}
        ${L(196, 14, 178, 14, 'OUT THIS MONTH', { s: 7.5, w: 6, c: K.sub })}
        ${L(196, 30, 148, 20, RM(outM), { s: 12.5, w: 6 })}`)}
      ${Card(null, 0, 366, 196, html`
        ${L(16, 14, 246, 22, 'Balance trend', { s: 11.5, w: 6 })}
        ${Svg(6, 40, 354, 150, trendSvg(a.AccId))}`)}
      ${Card(null, 0, 366, histH, html`
        ${L(16, 14, 246, 22, 'History', { s: 11.5, w: 6 })}
        ${Gal(0, 46, 366, hist.length * 58, hist, 58, t => html`
          ${L(10, 10, 40, 22, fmtD(t.TxDate, 'dd'), { s: 13, w: 6, a: 'c' })}
          ${L(10, 32, 40, 14, fmtD(t.TxDate, 'mmm').toUpperCase(), { s: 7.5, w: 7, a: 'c', c: K.or })}
          ${R(58, 10, 1, 38, K.line)}
          ${L(70, 10, 166, 18, t.TxPayee || t.TxDesc || t.TxType, { s: 10, w: 6 })}
          ${L(70, 30, 166, 16, (t.TxType === 'Transfer' ? 'Transfer' : t.TxCat) + (t.TxIsSplit ? '  ·  Split' : ''), { s: 8, c: K.sub })}
          ${L(226, 10, 126, 18, (t.TxDir === 'In' ? '+' : '−') + RM(t.TxAmt), { s: 10, w: 6, a: 'r', c: t.TxType === 'Transfer' ? K.sub : t.TxDir === 'In' ? K.grn : K.text })}
          ${L(226, 30, 126, 16, 'Bal ' + sRM(runBal(t)), { s: 8, c: K.sub, a: 'r' })}
          ${R(70, 57, 282, 1, K.sep)}`, { onSelect: t => { G.gblTxnId = t.TxnId; Navigate('scrTxnDetail'); }, key: t => t.TxnId })}
        ${L(16, 52 + Math.max(hist.length, 1) * 58 - (hist.length ? 0 : 0), 334, 32, hist.length ? (mine.length > 60 ? 'Showing the latest 60 transactions.' : 'Showing every transaction since ' + fmtD(a.AccOpenDate || stStart(), 'dd mmm yyyy') + '.') : 'No transactions yet.', { s: 8, c: K.mute, wrap: true })}`)}
      ${Card(null, 0, 366, 96, html`
        ${L(18, 12, 330, 30, closed ? 'This account is closed. Reopen it to record new transactions.' : 'An account can be closed when its balance is RM 0.00. Its history is kept.', { s: 8, c: K.sub, wrap: true })}
        ${B(18, 46, 330, 38, closed ? 'Reopen account' : l.locConfirmClose ? 'Tap again to close' : 'Close account', { fill: K.field, b: K.red, c: K.red, r: 19, s: 10, onClick: closeTap, id: 'closeAcc' })}`)}
      ${Box(null, 0, 366, 20, null)}`;

    return html`<div>
      ${DetailHeader(a.AccName, I(344, 20, 36, 36, 'Edit', K.or, { pad: 8, onClick: () => { G.gblEditMode = 'edit'; Navigate('scrAccountEdit'); }, label: 'Edit account' }))}
      ${Flow(0, 66, 390, 764, kids, { pad: [12, 12, 16, 12] })}
    </div>`;
  }
};

/* ───────────── Account create / edit ───────────── */
const COLORS = ['#E0A800', '#C8102E', '#1E6BD6', '#EE4D2D', '#2E9E62', '#7B3FE4', '#FF6A00', '#5D6D7E'];
const TYPES = ['Debit Card', 'E-Wallet', 'Credit Card', 'Cash'];

export const scrAccountEdit = {
  onVisible(l) {
    const a = G.gblEditMode === 'edit' ? acc(G.gblAccId) : null;
    l.locA = a;
    l.locOB = a ? DB.txns.find(t => t.TxAcc === a.AccId && t.TxType === 'Opening Balance') || null : null;
    l.locAType = (a && a.AccType) || 'Debit Card';
    l.locColor = (a && a.AccColor) || '#E0A800';
    l.name = a ? a.AccName : '';
    l.open = l.locOB ? String(l.locOB.TxAmt) : '';
    l.locD_aeOpenDate = (a && a.AccOpenDate) || stStart() || Today();
    l.txt_aeOpenDate = undefined; l.locCalOpen_aeOpenDate = false;
    l.status = (a && a.AccStatus) || 'Active';
    l.remarks = a ? a.AccRemarks : '';
    l.limit = a && a.AccLimit ? String(a.AccLimit) : '';
    l.due = a && a.AccDueDay ? String(a.AccDueDay) : '';
  },
  view(l) {
    const edit = G.gblEditMode === 'edit';
    const cc = l.locAType === 'Credit Card';
    const s1 = cc ? 0 : 76, s2 = s1 + (edit ? 0 : 76);
    const set = k => v => { l[k] = v; rerender(); };
    const typeBtn = (t, x) => B(x, 98, 87, 34, t, { fill: l.locAType === t ? K.or : K.field, c: l.locAType === t ? '#FFFFFF' : K.sub, b: l.locAType === t ? K.or : K.line, r: 17, s: 9, onClick: () => { l.locAType = t; rerender(); }, id: 'type-' + t });
    const form = html`
      ${L(0, 4, 366, 14, 'ACCOUNT NAME', { s: 7.5, w: 6, c: K.sub })}
      ${TI(0, 22, 366, 44, l.name, set('name'), { hint: 'e.g. Maybank Savings', max: 40, id: 'accName' })}
      ${L(0, 80, 366, 14, 'ACCOUNT TYPE', { s: 7.5, w: 6, c: K.sub })}
      ${typeBtn('Debit Card', 0)}${typeBtn('E-Wallet', 93)}${typeBtn('Credit Card', 186)}${typeBtn('Cash', 279)}
      ${L(0, 146, 366, 14, 'COLOUR', { s: 7.5, w: 6, c: K.sub })}
      ${Gal(0, 164, 366, 40, COLORS, 45, c => C(4, 4, 32, c, { b: l.locColor === c ? '#FFFFFF' : undefined, bt: 2, onClick: () => { l.locColor = c; rerender(); } }), { horizontal: true })}
      ${L(0, 218, 178, 14, cc ? 'OPENING AMOUNT OWED (RM)' : 'OPENING BALANCE (RM)', { s: 7.5, w: 6, c: K.sub })}
      ${TI(0, 236, 178, 44, l.open, set('open'), { hint: '0.00', num: true, id: 'accOpen' })}
      ${L(188, 218, 178, 14, 'AS AT', { s: 7.5, w: 6, c: K.sub })}
      ${DateBox(l, 'aeOpenDate', 188, 236, 178, 44)}
      ${cc ? html`
        ${L(0, 294, 178, 14, 'CREDIT LIMIT (RM)', { s: 7.5, w: 6, c: K.sub })}
        ${TI(0, 312, 178, 44, l.limit, set('limit'), { hint: '0', num: true, id: 'accLimit' })}
        ${L(188, 294, 178, 14, 'PAYMENT DUE DAY', { s: 7.5, w: 6, c: K.sub })}
        ${TI(188, 312, 178, 44, l.due, set('due'), { hint: '1 - 31', num: true, id: 'accDue' })}` : null}
      ${edit ? html`
        ${L(0, 370 - s1, 366, 14, 'STATUS', { s: 7.5, w: 6, c: K.sub })}
        ${DD(0, 388 - s1, 366, 44, ['Active', 'Closed'], l.status, set('status'), { id: 'accStatus' })}` : null}
      ${L(0, 446 - s2, 366, 14, 'NOTES', { s: 7.5, w: 6, c: K.sub })}
      ${TI(0, 464 - s2, 366, 64, l.remarks, set('remarks'), { hint: 'Optional', multiline: true, id: 'accNotes' })}
      ${L(0, 538 - s2, 366, 40, 'Balances are never typed in. The opening balance is saved as the first transaction and every balance is calculated from transactions.', { s: 8, c: K.mute, wrap: true, top: true })}`;

    const onSave = () => guard(async () => {
      const nm = l.name.trim();
      const ob = Value(l.open) ?? 0;
      const cls = cc ? 'Liability' : 'Asset';
      const od = l.locD_aeOpenDate;
      const a = l.locA;
      if (!nm) return Notify('Account name is required.', 'error');
      if (DB.accounts.some(x => x.AccName.toLowerCase() === nm.toLowerCase() && x.AccId !== (a ? a.AccId : '-'))) return Notify('An account with this name already exists.', 'error');
      if (ob < 0) return Notify('Enter the opening balance as a positive amount (for credit cards, the amount owed).', 'error');
      if (stStart() && od < stStart()) return Notify("The opening date can't be before your tracking start (" + fmtD(stStart(), 'dd mmm yyyy') + ').', 'error');
      if (edit && l.status === 'Closed' && Math.abs(bal(a.AccId)) >= 0.005) return Notify('An account can only be closed when its balance is RM 0.00.', 'error');
      const fields = { AccName: nm, AccShort: shortName(nm), AccColor: l.locColor, AccType: l.locAType, AccClass: cls, AccOpenDate: od,
        AccLimit: cc ? (Value(l.limit) ?? 0) : 0, AccDueDay: cc ? (Value(l.due) ?? 0) : 0, AccStatus: edit ? (l.status || 'Active') : 'Active', AccRemarks: l.remarks || '', AccOB: ob };
      const txUps = [];
      if (edit) {
        const row = { ...a, ...fields };
        if (l.locOB) txUps.push({ ...l.locOB, TxAmt: ob, TxDate: od, TxDir: cls === 'Liability' ? 'Out' : 'In' });
        else if (ob > 0) { const ts = nextTxSeq(); txUps.push(mkTxn({ TxnId: txnId(od, ts), TxSeq: ts, TxAcc: a.AccId, TxDate: od, TxType: 'Opening Balance', TxDir: cls === 'Liability' ? 'Out' : 'In', TxAmt: ob, TxCat: 'Opening Balance', TxDesc: 'Opening balance' })); }
        await save({ up: { EW_Accounts: [row], EW_Transactions: txUps }, log: [{ AuAction: 'Edit account', AuRef: a.AccId, AuDetail: nm }] });
        G.gblAccId = a.AccId;
        Notify('Account updated.', 'success');
      } else {
        const sq = DB.accounts.reduce((m, x) => Math.max(m, x.AccSeq || 0), 0) + 1;
        const aid = 'ACC-' + String(sq).padStart(4, '0');
        const row = { AccId: aid, AccSeq: sq, ...fields };
        if (ob > 0) { const ts = nextTxSeq(); txUps.push(mkTxn({ TxnId: txnId(od, ts), TxSeq: ts, TxAcc: aid, TxDate: od, TxType: 'Opening Balance', TxDir: cls === 'Liability' ? 'Out' : 'In', TxAmt: ob, TxCat: 'Opening Balance', TxDesc: 'Opening balance' })); }
        await save({ up: { EW_Accounts: [row], EW_Transactions: txUps }, log: [{ AuAction: 'Create account', AuRef: aid, AuDetail: nm }] });
        G.gblAccId = aid;
        Notify('Account created.', 'success');
      }
      Replace('scrAccountDetail');
    });

    return html`<div>
      ${DetailHeader(edit ? 'Edit account' : 'New account')}
      ${Flow(0, 66, 390, 700, Box(null, 0, 366, 582 - s2, form), { pad: [16, 12, 16, 12], gap: 8 })}
      ${SaveBar(edit ? 'Save changes' : 'Create account', onSave, 'saveAccount')}
      ${Calendar(l, 'aeOpenDate')}
    </div>`;
  }
};
