// scrTransactions, scrTxnDetail, scrTxnEdit, scrTransfer, scrSplit
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Gal, Svg, Flow, TI, DD, heroBg, Navigate, Back, Replace, Notify, rerender, guard, save, api,
  bal, acc, accByName, txn, byTxDesc, stStart, fmtD, fmtTime, Today, PLABEL, PSTART, PEND, Year, Month, addDays, addMonths, addYears, diffDays,
  RM, sRM, Value, round2, mkTxn, txnId, nextTxSeq, CD
} from '../core.js';
import { TabHeader, NavBar, DetailHeader, SaveBar, DateBox, Calendar, Fab, FlowCard, MonthGrid, AuditRows } from '../shared.js';
import { txnRow, openTxn } from './home.js';

const curMonthStart = () => { const l = PLABEL(Today()); return PSTART(Year(l), Month(l)); };
const incl = (hay, q) => String(hay || '').toLowerCase().includes(q.toLowerCase());

/* ───────────── Transactions list ───────────── */
export const scrTransactions = {
  onVisible(l) {
    if (!l.locTxType) { l.locTxType = 'All'; l.locTxCat = 'All'; l.locTxAcc = ''; l.locTxYear = Year(Today()); l.q = ''; }
    l.locSheet = '';
  },
  view(l) {
    const q = l.q || '';
    const F = DB.txns.filter(t => !t.TxParent && t.TxType !== 'Opening Balance' &&
      ((!l.locTxAcc && !(t.TxType === 'Transfer' && t.TxDir === 'In')) || (l.locTxAcc && t.TxAcc === l.locTxAcc)) &&
      (G.gblTxAll || (t.TxDate >= G.gblTxFrom && t.TxDate <= G.gblTxTo)) &&
      (l.locTxType === 'All' || t.TxType === l.locTxType) &&
      (l.locTxCat === 'All' || t.TxCat === l.locTxCat) &&
      (!q || incl(t.TxDesc, q) || incl(t.TxPayee, q) || incl(t.TxCat, q) || incl(t.TxnId, q)));
    const inV = round2(F.filter(t => t.TxType === 'Income' || (l.locTxAcc && t.TxType === 'Transfer' && t.TxDir === 'In')).reduce((s, t) => s + t.TxAmt, 0));
    const outV = round2(F.filter(t => t.TxType === 'Expense' || (l.locTxAcc && t.TxType === 'Transfer' && t.TxDir === 'Out')).reduce((s, t) => s + t.TxAmt, 0));
    const list = F.slice().sort(byTxDesc);
    const perOn = G.gblTxAll || G.gblTxFrom !== curMonthStart();
    const accOn = !!l.locTxAcc, catOn = l.locTxCat !== 'All';
    const anyOn = perOn || accOn || catOn || l.locTxType !== 'All' || !!q;

    const pill = (x, on, ic, cap, val, sheet, id) => Box(x, 156, 118, 44, html`
      ${B(0, 0, 118, 44, '', { fill: on ? K.orTint : K.card, b: on ? K.or : K.line, r: 22, onClick: () => open(sheet), id })}
      ${I(12, 15, 14, 14, ic, on ? K.or : K.sub, { pad: 0, onClick: () => open(sheet) })}
      ${L(32, 7, 70, 12, cap, { s: 6.5, w: 6, c: on ? K.or : K.mute, onClick: () => open(sheet) })}
      ${L(32, 19, 70, 18, val, { s: 8.5, w: 6, onClick: () => open(sheet) })}
      ${I(100, 17, 10, 10, 'ChevronDown', K.sub, { pad: 0, onClick: () => open(sheet) })}`);
    const open = s => { l.locSheet = s; if (s === 'per') l.locTxYear = G.gblTxAll ? Year(Today()) : Year(addDays(G.gblTxFrom, 10)); rerender(); };
    const typeBtn = (t, x) => B(x, 3, 90, 28, t, { fill: l.locTxType === t ? K.or : 'transparent', c: l.locTxType === t ? '#FFFFFF' : K.sub, r: 14, s: 8.5, onClick: () => { l.locTxType = t; rerender(); }, id: 'tt-' + t });
    const clear = () => {
      G.gblTxAll = false; G.gblTxFrom = curMonthStart(); G.gblTxTo = addDays(addMonths(G.gblTxFrom, 1), -1); G.gblTxLbl = fmtD(G.gblTxTo, 'mmm yyyy');
      l.locTxAcc = ''; l.locTxCat = 'All'; l.locTxType = 'All'; l.q = ''; rerender();
    };

    return html`<div>
      ${TabHeader()}
      ${L(18, 70, 240, 32, 'Transactions', { s: 17 })}
      ${anyOn ? L(268, 74, 110, 26, 'Clear filters', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: clear, id: 'clearFilters' }) : null}
      ${TI(12, 110, 366, 38, q, v => { l.q = v; rerender(); }, { hint: 'Search payee, description or category', fill: K.card, r: 19, pad: 38, padR: 12, id: 'search' })}
      ${I(24, 119, 20, 20, 'Search', K.sub, { pad: 2 })}
      ${pill(12, perOn, 'CalendarBlank', 'PERIOD', G.gblTxAll ? 'All time' : G.gblTxLbl, 'per', 'pillPer')}
      ${pill(136, accOn, 'Money', 'ACCOUNT', accOn ? (acc(l.locTxAcc) || {}).AccName : 'All', 'acc', 'pillAcc')}
      ${pill(260, catOn, 'Tag', 'CATEGORY', catOn ? l.locTxCat : 'All', 'cat', 'pillCat')}
      ${Box(12, 208, 366, 34, html`${typeBtn('All', 3)}${typeBtn('Expense', 93)}${typeBtn('Income', 183)}${typeBtn('Transfer', 273)}`, { fill: K.card, r: 17, b: K.line })}
      ${FlowCard(inV, outV, G.gblTxAll ? 'All time' : G.gblTxLbl, { x: 12, y: 250, id: 'txFlow' })}
      ${L(16, 376, 260, 14, list.length + ' TRANSACTIONS', { s: 7.5, w: 6, c: K.sub, id: 'txCount' })}
      ${Gal(12, 398, 366, 368, list, 54, txnRow, { scroll: true, stretch: true, onSelect: openTxn, key: t => t.TxnId })}
      ${!list.length ? L(12, 428, 366, 40, 'No transactions for this filter.', { s: 10, c: K.mute, a: 'c' }) : null}
      ${Fab(() => { G.gblEditMode = 'new'; G.gblTxnId = ''; Navigate('scrTxnEdit'); })}
      ${NavBar(2)}
      ${l.locSheet ? Sheet(l) : null}
    </div>`;
  }
};

function Sheet(l) {
  const close = () => { l.locSheet = ''; rerender(); };
  const accs = DB.accounts.slice().sort((a, b) => ((a.AccStatus === 'Closed' ? '2' : '1') + String(a.AccSeq).padStart(4, '0')) < ((b.AccStatus === 'Closed' ? '2' : '1') + String(b.AccSeq).padStart(4, '0')) ? -1 : 1);
  const cats = DB.categories.filter(c => c.CatActive && ['Expense', 'Savings/Asset', 'Income'].includes(c.CatType)).sort((a, b) => (a.CatType + a.CatName < b.CatType + b.CatName ? -1 : 1));
  const h = (l.locSheet === 'per' ? 400 : l.locSheet === 'acc' ? 130 + Math.min(accs.length, 7) * 50 : 450) + 24;
  const y = Math.max(0, 844 - h);
  const yr = l.locTxYear ?? Year(Today());
  const ys = PSTART(yr, 1), ye = PEND(yr, 12);
  const wholeOn = !G.gblTxAll && G.gblTxFrom === ys && G.gblTxTo === ye;
  let body;
  if (l.locSheet === 'per') {
    body = html`
      ${B(20, 64, 170, 36, 'All time', { fill: G.gblTxAll ? K.or : K.field, c: G.gblTxAll ? '#FFFFFF' : K.sub, b: G.gblTxAll ? K.or : K.line, r: 18, s: 9.5, onClick: () => { G.gblTxAll = true; G.gblTxLbl = 'All time'; close(); }, id: 'allTime' })}
      ${B(200, 64, 170, 36, 'Whole year ' + yr, { fill: wholeOn ? K.or : K.field, c: wholeOn ? '#FFFFFF' : K.sub, b: wholeOn ? K.or : K.line, r: 18, s: 9.5, onClick: () => { G.gblTxAll = false; G.gblTxFrom = ys; G.gblTxTo = ye; G.gblTxLbl = 'Year ' + yr; close(); }, id: 'wholeYear' })}
      ${MonthGrid(yr, v => { l.locTxYear = v; rerender(); },
        no => !G.gblTxAll && PSTART(yr, no) === G.gblTxFrom && diffDays(G.gblTxFrom, G.gblTxTo) < 32,
        no => { const st = PSTART(yr, no); G.gblTxAll = false; G.gblTxFrom = st; G.gblTxTo = addDays(addMonths(st, 1), -1); G.gblTxLbl = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][no - 1] + ' ' + yr; close(); },
        { x: 12, y: 112 })}`;
  } else if (l.locSheet === 'acc') {
    const allOn = !l.locTxAcc;
    body = html`
      ${B(12, 62, 366, 44, '', { fill: allOn ? K.orTint : 'transparent', r: 12, onClick: () => { l.locTxAcc = ''; close(); } })}
      ${L(24, 62, 270, 44, 'All accounts', { s: 10.5, w: 6, c: allOn ? K.or : K.text, onClick: () => { l.locTxAcc = ''; close(); } })}
      ${allOn ? I(342, 73, 22, 22, 'Check', K.or, { pad: 2 }) : null}
      ${Gal(12, 110, 366, Math.min(accs.length, 7) * 50, accs, 50, a => html`
        ${C(8, 11, 28, a.AccColor)}${L(8, 11, 28, 28, a.AccShort, { s: 7, w: 7, a: 'c', c: '#FFFFFF' })}
        ${L(48, 6, 266, 20, a.AccName, { s: 10.5, w: 6, c: l.locTxAcc === a.AccId ? K.or : K.text })}
        ${L(48, 26, 266, 16, a.AccType + (a.AccStatus === 'Closed' ? '  ·  Closed' : ''), { s: 8, c: K.sub })}
        ${l.locTxAcc === a.AccId ? I(324, 14, 22, 22, 'Check', K.or, { pad: 2 }) : null}
        ${R(48, 49, 306, 1, K.sep)}`, { scroll: true, onSelect: a => { l.locTxAcc = a.AccId; close(); }, key: a => a.AccId })}`;
  } else {
    const allOn = l.locTxCat === 'All';
    body = html`
      ${B(12, 62, 366, 44, '', { fill: allOn ? K.orTint : 'transparent', r: 12, onClick: () => { l.locTxCat = 'All'; close(); } })}
      ${L(24, 62, 270, 44, 'All categories', { s: 10.5, w: 6, c: allOn ? K.or : K.text, onClick: () => { l.locTxCat = 'All'; close(); } })}
      ${allOn ? I(342, 73, 22, 22, 'Check', K.or, { pad: 2 }) : null}
      ${Gal(12, 110, 366, 322, cats, 46, c => html`
        ${C(12, 18, 10, c.CatColor)}
        ${L(34, 0, 216, 46, c.CatName, { s: 10.5, w: l.locTxCat === c.CatName ? 6 : 4, c: l.locTxCat === c.CatName ? K.or : K.text })}
        ${L(246, 0, 70, 46, c.CatType.toUpperCase(), { s: 6.5, w: 6, c: c.CatType === 'Income' ? K.grn : K.mute, a: 'r' })}
        ${l.locTxCat === c.CatName ? I(324, 12, 22, 22, 'Check', K.or, { pad: 2 }) : null}
        ${R(34, 45, 316, 1, K.sep)}`, { scroll: true, onSelect: c => { l.locTxCat = c.CatName; close(); }, key: c => c.CatId })}`;
  }
  return html`<div class="abs" style="inset:0;z-index:20">
    <div class="abs dim" style="inset:0" onClick=${close}></div>
    ${Box(0, { b: 0 }, 390, h, html`
      ${R(175, 10, 40, 4, K.line)}
      ${L(20, 24, 310, 30, l.locSheet === 'per' ? 'Choose a period' : l.locSheet === 'acc' ? 'Choose an account' : 'Choose a category', { s: 14 })}
      ${I(338, 22, 34, 34, 'Cancel', K.sub, { pad: 8, onClick: close, label: 'Close' })}
      ${body}`, { fill: K.card, r: 22, b: K.line, st: 'border-bottom-left-radius:0;border-bottom-right-radius:0;', id: 'sheet' })}
  </div>`;
}

/* ───────────── Transaction detail ───────────── */
export const scrTxnDetail = {
  onVisible(l) {
    l.locConfirmDel = false;
    l.aud = [];
    const t = txn(G.gblTxnId);
    if (!t) return;
    const refs = [t.TxnId]; if (t.TxTrf) refs.push(t.TxTrf);
    const want = G.gblTxnId;
    api('activityFor', { refs }).then(r => { if (G.gblTxnId === want) { l.aud = r; rerender(); } }).catch(() => { /* history is optional */ });
  },
  view(l) {
    const T = txn(G.gblTxnId);
    if (!T) return html`<div>${DetailHeader('Transaction')}${L(12, 90, 366, 30, 'This transaction no longer exists.', { s: 10, c: K.mute, a: 'c' })}</div>`;
    const typeC = T.TxType === 'Income' ? K.grn : T.TxType === 'Transfer' ? K.sub : T.TxType === 'Opening Balance' ? K.mute : K.or;
    const other = T.TxTrf ? DB.txns.find(x => x.TxTrf === T.TxTrf && x.TxnId !== T.TxnId) : null;
    const rule = DB.recurring.find(r => r.RcId === T.TxRule);
    const kv = [
      ['Date', fmtD(T.TxDate, 'dddd, dd mmmm yyyy')],
      [T.TxType === 'Transfer' ? (T.TxDir === 'Out' ? 'From' : 'To') : 'Account', (acc(T.TxAcc) || {}).AccName],
      [T.TxDir === 'Out' ? 'To' : 'From', other ? (acc(other.TxAcc) || {}).AccName : ''],
      ['Category', ['Transfer', 'Opening Balance'].includes(T.TxType) ? '' : T.TxCat],
      [T.TxDir === 'In' ? 'Payer' : 'Payee', T.TxPayee],
      ['Description', T.TxDesc], ['Transfer ID', T.TxTrf], ['Split of', T.TxParent],
      ['Recurring', rule ? rule.RcName : ''], ['Notes', T.TxNote], ['Reference', T.TxnId]
    ].filter(x => x[1]);
    const lines = DB.txns.filter(x => x.TxParent === T.TxnId);
    const canEdit = ['Income', 'Expense'].includes(T.TxType) && !T.TxParent;
    const canDel = !T.TxParent && T.TxType !== 'Opening Balance';
    const aud = (l.aud || []).slice().sort((a, b) => (a.AuWhen < b.AuWhen ? 1 : -1)).slice(0, 8);
    const note = T.TxType === 'Opening Balance' ? 'Opening balances are changed from the account screen.' : T.TxType === 'Transfer' ? 'Transfers can be deleted and recorded again. Deleting removes both sides and any fee.' : T.TxParent ? 'This is a split line. Open the original transaction to change it.' : '';

    const del = () => guard(async () => {
      if (!l.locConfirmDel) { l.locConfirmDel = true; return; }
      const id = T.TxnId, trf = T.TxTrf;
      const ids = DB.txns.filter(x => x.TxnId === id || x.TxParent === id || (trf && (x.TxTrf === trf || x.TxRef === trf))).map(x => x.TxnId);
      await save({ del: { EW_Transactions: ids }, log: [{ AuAction: 'Delete', AuRef: id, AuDetail: trf ? 'Transfer ' + trf + ' (both sides)' : 'Transaction' }] });
      l.locConfirmDel = false;
      Notify('Deleted.', 'success');
      Back();
    });

    const kids = html`
      ${Box(null, 0, 366, 150, html`
        ${Svg(0, 0, 366, 150, heroBg(150), { stretch: true })}
        ${B(128, 18, 110, 24, T.TxType.toUpperCase(), { fill: 'transparent', b: typeC, c: typeC, r: 12, s: 8.5 })}
        ${L(16, 52, 334, 40, (T.TxDir === 'In' ? '+' : '−') + RM(T.TxAmt), { s: 22, w: 6, a: 'c', c: T.TxType === 'Transfer' ? K.sub : T.TxDir === 'In' ? K.grn : K.text, id: 'tdAmt' })}
        ${L(16, 94, 334, 20, T.TxPayee || T.TxDesc || T.TxType, { s: 10.5, a: 'c' })}
        ${L(16, 116, 334, 16, fmtD(T.TxDate, 'dd mmm yyyy') + (T.TxIsSplit ? '  ·  Split' : ''), { s: 8, c: K.sub, a: 'c' })}`, { r: 16 })}
      ${Card(null, 0, 366, 12 + kv.length * 42, Gal(0, 6, 366, kv.length * 42, kv, 42, ([k, v]) => html`
        ${L(16, 14, 110, 14, k.toUpperCase(), { s: 7.5, w: 6, c: K.sub })}
        ${L(126, 0, 224, 42, v, { s: 10, a: 'r' })}
        ${R(16, 41, 334, 1, K.sep)}`), { id: 'tdInfo' })}
      ${T.TxIsSplit ? Card(null, 0, 366, 52 + lines.length * 42, html`
        ${L(16, 14, 246, 22, 'Split lines', { s: 11.5, w: 6 })}
        ${Gal(0, 46, 366, lines.length * 42, lines, 42, x => html`
          ${L(16, 0, 200, 42, x.TxCat, { s: 10 })}
          ${L(220, 0, 130, 42, RM(x.TxAmt), { s: 10, w: 6, a: 'r' })}
          ${R(16, 41, 334, 1, K.sep)}`)}`) : null}
      ${Card(null, 0, 366, 148, html`
        ${L(16, 14, 246, 22, 'Actions', { s: 11.5, w: 6 })}
        ${B(16, 46, 162, 40, 'Edit', { fill: K.or, c: '#FFFFFF', r: 20, s: 10, disabled: !canEdit, onClick: () => { G.gblEditMode = 'edit'; Navigate('scrTxnEdit'); }, id: 'tdEdit' })}
        ${B(188, 46, 162, 40, 'Duplicate', { fill: K.field, b: K.line, r: 20, s: 10, disabled: !canEdit, onClick: () => { G.gblEditMode = 'dup'; Navigate('scrTxnEdit'); }, id: 'tdDup' })}
        ${B(16, 94, 162, 40, T.TxIsSplit ? 'Edit split' : 'Split', { fill: K.field, b: K.line, r: 20, s: 10, disabled: !canEdit, onClick: () => Navigate('scrSplit'), id: 'tdSplit' })}
        ${B(188, 94, 162, 40, l.locConfirmDel ? 'Tap to confirm' : 'Delete', { fill: K.field, b: K.red, c: K.red, r: 20, s: 10, disabled: !canDel, onClick: del, id: 'tdDel' })}`)}
      ${note ? L(null, 0, 366, 30, note, { s: 8, c: K.mute, wrap: true, st: 'position:relative;flex:none;' }) : null}
      ${Card(null, 0, 366, 52 + aud.length * 44, html`
        ${L(16, 14, 246, 22, 'History', { s: 11.5, w: 6 })}
        <div class="abs" style="left:0;top:46px;width:366px">${AuditRows(aud, w => fmtTime(w, 'dd/mm/yyyy hh:mm'), 210, 140)}</div>`)}
      ${Box(null, 0, 366, 20, null)}`;
    return html`<div>
      ${DetailHeader('Transaction')}
      ${Flow(0, 66, 390, 764, kids, { pad: [12, 12, 16, 12] })}
    </div>`;
  }
};

/* ───────────── Transaction create / edit / duplicate ───────────── */
function payeeState(l) {
  const q = (l.payeeQ || '').trim();
  const exact = DB.payees.find(p => p.PyName.toLowerCase() === q.toLowerCase());
  const matches = q ? DB.payees.filter(p => incl(p.PyName, q)).sort((a, b) => (a.PyName < b.PyName ? -1 : 1)).slice(0, 5) : [];
  const resolved = exact ? exact.PyName : (matches.length === 1 ? matches[0].PyName : '');
  return { q, exact, matches, resolved, searching: !!q && !exact };
}
function catOk(name, type) {
  return DB.categories.some(c => c.CatName === name && c.CatActive && (c.CatType === type || (type === 'Expense' && c.CatType === 'Savings/Asset')));
}
function pickPayee(l, p) {
  l.locPayee = p.PyName; l.payeeQ = p.PyName;
  if (catOk(p.PyCat, l.locType)) l.locCat = p.PyCat;
  rerender();
}

export const scrTxnEdit = {
  onVisible(l) {
    const m = G.gblEditMode, P = G.gblPrefill;
    const T = ['edit', 'dup'].includes(m) ? txn(G.gblTxnId) : null;
    l.locT = T;
    l.locType = m === 'prefill' ? P.PfType : m === 'new' ? 'Expense' : T.TxType;
    l.locPayee = m === 'prefill' ? P.PfPayee : m === 'new' ? '' : T.TxPayee;
    l.locCat = m === 'prefill' ? P.PfCat : m === 'new' ? '' : T.TxCat;
    l.payeeQ = l.locPayee;
    l.amt = m === 'prefill' ? (P.PfAmt > 0 ? String(P.PfAmt) : '') : m === 'new' ? '' : String(T.TxAmt);
    const openAcc = id => { const a = acc(id); return a && a.AccStatus !== 'Closed' ? a.AccName : ''; };
    l.acc = m === 'prefill' ? ((acc(P.PfAcc) || {}).AccName || '') : m === 'new' ? openAcc(G.gblAccId) : ((acc(T.TxAcc) || {}).AccName || '');
    l.locD_teDate = m === 'prefill' ? P.PfDate : (m === 'new' || m === 'dup') ? Today() : T.TxDate;
    l.txt_teDate = undefined; l.locCalOpen_teDate = false;
    l.desc = ['edit', 'dup'].includes(m) ? T.TxDesc : '';
    l.note = ['edit', 'dup'].includes(m) ? T.TxNote : '';
  },
  view(l) {
    const mode = G.gblEditMode;
    const ps = payeeState(l);
    const income = l.locType === 'Income';
    const cats = DB.categories.filter(c => c.CatActive && (c.CatType === l.locType || (l.locType === 'Expense' && c.CatType === 'Savings/Asset'))).map(c => c.CatName).sort();
    const accs = DB.accounts.filter(a => a.AccStatus !== 'Closed').map(a => a.AccName).sort();
    const accVal = l.acc || accs[0] || '';
    const seg = (t, x) => B(x, 3, 100, 32, t, { fill: l.locType === t ? K.or : 'transparent', c: l.locType === t ? '#FFFFFF' : K.sub, r: 16, s: 9.5, id: 'seg-' + t,
      onClick: () => {
        if (t === 'Transfer') { if (mode === 'edit') Notify('To make this a transfer, delete it and record a transfer.', 'warning'); else Navigate('scrTransfer'); return; }
        l.locType = t; l.locCat = ''; rerender();
      } });
    const row = (y, ic, cap, ctrl) => html`
      ${C(12, y, 32, K.field)}${I(19, y + 7, 18, 18, ic, K.or, { pad: 1 })}
      ${L(60, y - 4, 286, 14, cap, { s: 7.5, w: 6, c: K.mute })}
      ${ps.searching && ic !== 'Person' ? null : ctrl}
      ${R(54, y + 44, 296, 1, K.sep)}`;
    const resH = ps.matches.length ? ps.matches.length * 44 + 8 : 44 + 8;

    const form = html`
      ${Box(30, 4, 306, 38, html`${seg('Expense', 3)}${seg('Income', 103)}${seg('Transfer', 203)}`, { fill: K.card, r: 19, b: K.line })}
      ${L(0, 62, 366, 14, 'AMOUNT  ·  RM', { s: 7.5, w: 6, c: K.mute, a: 'c' })}
      ${TI(20, 78, 326, 56, l.amt, v => { l.amt = v; rerender(); }, { hint: '0.00', num: true, s: 26, w: 6, a: 'c', fill: 'transparent', bt: 0, c: income ? K.grn : K.text, pad: 0, id: 'amount' })}
      ${R(113, 136, 140, 2, income ? K.grn : K.or)}
      ${L(0, 144, 366, 18, (income ? 'Received' : 'Spent') + '  ·  ' + fmtD(l.locD_teDate, 'dddd, dd mmmm yyyy'), { s: 8, c: K.sub, a: 'c' })}
      ${Card(0, 178, 366, 350, html`
        ${row(13, 'Person', income ? 'PAYER' : 'PAYEE', null)}
        ${TI(54, 22, 266, 32, l.payeeQ, v => { l.payeeQ = v; rerender(); }, { hint: 'Type to search your payees', fill: K.card, bt: 0, pad: 6, id: 'payee',
          onChange: () => { const s = payeeState(l); if (s.exact) pickPayee(l, s.exact); else if (s.matches.length === 1) pickPayee(l, s.matches[0]); } })}
        ${ps.q && !ps.resolved ? I(322, 24, 28, 28, 'Cancel', K.mute, { pad: 6, onClick: () => { l.locPayee = ''; l.payeeQ = ''; rerender(); } }) : null}
        ${ps.resolved ? I(322, 24, 28, 28, 'Check', K.grn, { pad: 6 }) : null}
        ${row(71, 'Tag', 'CATEGORY', DD(54, 80, 296, 32, cats, cats.includes(l.locCat) ? l.locCat : '', v => { l.locCat = v; rerender(); }, { fill: K.card, bt: 0, chev: K.sub, chevBg: K.card, pad: 6, allowEmpty: true, id: 'category' }))}
        ${row(129, 'Money', income ? 'RECEIVED INTO' : 'PAID FROM', DD(54, 138, 296, 32, accs, accVal, v => { l.acc = v; rerender(); }, { fill: K.card, bt: 0, chev: K.sub, chevBg: K.card, pad: 6, id: 'account' }))}
        ${row(187, 'CalendarBlank', 'DATE', DateBox(l, 'teDate', 54, 196, 296, 32, { fill: K.card, border: false, pad: 6, icoRight: 4 }))}
        ${row(245, 'Edit', 'DESCRIPTION', TI(54, 254, 296, 32, l.desc, v => { l.desc = v; rerender(); }, { hint: 'What was it for?', fill: K.card, bt: 0, pad: 6, id: 'desc' }))}
        ${row(303, 'Note', 'NOTES', TI(54, 312, 296, 32, l.note, v => { l.note = v; rerender(); }, { hint: 'Optional', fill: K.card, bt: 0, pad: 6, id: 'note' }))}`)}
      ${ps.searching ? Box(46, 230, 304, resH, html`
        ${Gal(0, 4, 304, ps.matches.length * 44, ps.matches, 44, p => html`
          ${C(12, 11, 22, K.card)}${L(12, 11, 22, 22, p.PyName.slice(0, 1).toUpperCase(), { s: 7.5, w: 7, a: 'c', c: K.or })}
          ${L(44, 0, 154, 44, p.PyName, { s: 10.5, w: 6 })}
          ${L(194, 0, 98, 44, p.PyCat, { s: 8, c: K.sub, a: 'r' })}
          ${R(44, 43, 248, 1, K.line)}`, { onSelect: p => pickPayee(l, p), key: p => p.PyName })}
        ${!ps.matches.length ? L(14, 4, 276, 44, 'No payee matches. Add new payees in Settings → Payees.', { s: 8, c: K.sub, wrap: true }) : null}`,
      { fill: K.field, r: 12, b: K.or, id: 'payeeResults' }) : null}
      ${L(0, 538, 366, 16, 'Only payees from your list can be used  ·  Settings → Payees', { s: 8, c: K.mute, a: 'c' })}`;

    const onSave = () => guard(async () => {
      const amt = Value(l.amt);
      const a = accByName(accVal);
      const cat = cats.includes(l.locCat) ? l.locCat : '';
      const T = l.locT;
      const d = l.locD_teDate;
      const PAYEE = ps.resolved;
      if (amt === null || amt <= 0) return Notify('Enter an amount greater than 0.', 'error');
      if (!a) return Notify('Choose an account.', 'error');
      if (!cat) return Notify('Choose a category.', 'error');
      if (ps.q && !PAYEE) return Notify('Tap a payee from the list (type a few more letters if several match), or leave it empty.', 'error');
      if (stStart() && d < stStart()) return Notify('This date is before your tracking start (' + fmtD(stStart(), 'dd mmm yyyy') + ').', 'error');
      if (mode === 'edit' && T.TxIsSplit && Math.abs(amt - T.TxAmt) >= 0.005) return Notify('This transaction is split. Remove the split before changing the amount.', 'error');
      const dir = l.locType === 'Income' ? 'In' : 'Out';
      const detail = l.locType + ' RM ' + RM(amt).slice(3) + ' ' + cat;
      if (mode === 'edit') {
        const ups = [{ ...T, TxAcc: a.AccId, TxDate: d, TxType: l.locType, TxDir: dir, TxAmt: round2(amt), TxCat: cat, TxPayee: PAYEE, TxDesc: (l.desc || '').trim(), TxNote: l.note || '' }];
        DB.txns.filter(x => x.TxParent === T.TxnId).forEach(x => ups.push({ ...x, TxAcc: a.AccId, TxDate: d, TxType: l.locType, TxDir: dir, TxPayee: PAYEE }));
        await save({ up: { EW_Transactions: ups }, log: [{ AuAction: 'Edit transaction', AuRef: T.TxnId, AuDetail: detail }] });
        G.gblTxnId = T.TxnId;
      } else {
        const ts = nextTxSeq();
        const tid = txnId(d, ts);
        const row = mkTxn({ TxnId: tid, TxSeq: ts, TxAcc: a.AccId, TxDate: d, TxType: l.locType, TxDir: dir, TxAmt: round2(amt), TxCat: cat, TxPayee: PAYEE, TxDesc: (l.desc || '').trim(), TxNote: l.note || '', TxRule: mode === 'prefill' ? G.gblPrefill.PfRule : '' });
        const up = { EW_Transactions: [row] };
        if (mode === 'prefill' && G.gblPrefill.PfRule) {
          const r = DB.recurring.find(x => x.RcId === G.gblPrefill.PfRule);
          if (r) up.EW_Recurring = [{ ...r, RcNext: r.RcFreq === 'Weekly' ? addDays(r.RcNext, 7) : r.RcFreq === 'Yearly' ? addYears(r.RcNext, 1) : addMonths(r.RcNext, 1) }];
        }
        await save({ up, log: [{ AuAction: mode === 'dup' ? 'Duplicate transaction' : 'Create transaction', AuRef: tid, AuDetail: detail }] });
        G.gblTxnId = tid;
      }
      Notify('Saved.', 'success');
      Replace('scrTxnDetail');
    });

    const title = mode === 'edit' ? 'Edit transaction' : mode === 'dup' ? 'Duplicate transaction' : 'New transaction';
    return html`<div>
      ${DetailHeader(title)}
      ${Flow(0, 66, 390, 700, Box(null, 0, 366, 566, form, { st: 'overflow:visible' }), { pad: [14, 12, 16, 12], gap: 8 })}
      ${SaveBar('Save transaction', onSave, 'saveTxn')}
      ${Calendar(l, 'teDate')}
    </div>`;
  }
};

/* ───────────── Fund transfer ───────────── */
export const scrTransfer = {
  onVisible(l) {
    l.locFromNm = ''; l.locToNm = ''; l.amt = ''; l.fee = ''; l.ref = '';
    l.locD_tfDate = Today(); l.txt_tfDate = undefined; l.locCalOpen_tfDate = false;
    l.from = null; l.to = null;
  },
  view(l) {
    const names = DB.accounts.filter(a => a.AccStatus !== 'Closed').map(a => a.AccName).sort();
    const g = acc(G.gblAccId);
    const from = l.from ?? (l.locFromNm || (g && g.AccStatus !== 'Closed' ? g.AccName : '') || '');
    const fromV = names.includes(from) ? from : (names[0] || '');
    const to = l.to ?? (l.locToNm || names.find(n => n !== fromV) || '');
    const fa = accByName(fromV), ta = accByName(to);
    const swap = () => { l.from = to; l.to = fromV; rerender(); };
    const fb = fa ? bal(fa.AccId) : 0, tb = ta ? bal(ta.AccId) : 0;
    const form = html`
      ${Card(0, 0, 366, 100, html`
        ${L(16, 12, 200, 14, 'FROM', { s: 7.5, w: 6, c: K.sub })}
        ${DD(16, 30, 334, 42, names, fromV, v => { l.from = v; rerender(); }, { id: 'from' })}
        ${L(16, 76, 334, 16, 'Balance ' + sRM(fb), { s: 8, c: K.sub })}`)}
      ${R(182.5, 100, 1, 48, K.line)}
      ${C(165, 106, 36, K.field, { b: K.or, onClick: swap })}
      ${I(172, 113, 22, 22, 'ArrowDown', K.or, { pad: 2, onClick: swap, label: 'Swap' })}
      ${L(211, 114, 120, 20, 'Tap to swap', { s: 7.5, c: K.mute, onClick: swap })}
      ${Card(0, 148, 366, 100, html`
        ${L(16, 12, 200, 14, 'TO', { s: 7.5, w: 6, c: K.sub })}
        ${DD(16, 30, 334, 42, names, names.includes(to) ? to : '', v => { l.to = v; rerender(); }, { id: 'to' })}
        ${L(16, 76, 334, 16, ta && ta.AccClass === 'Liability' ? 'Owed ' + RM(-tb) + '  ·  this pays the card' : 'Balance ' + sRM(tb), { s: 8, c: K.sub })}`)}
      ${L(0, 264, 178, 14, 'AMOUNT (RM)', { s: 7.5, w: 6, c: K.sub })}
      ${TI(0, 282, 178, 48, l.amt, v => { l.amt = v; rerender(); }, { hint: '0.00', num: true, s: 16, w: 6, id: 'tfAmt' })}
      ${L(188, 264, 178, 14, 'DATE', { s: 7.5, w: 6, c: K.sub })}
      ${DateBox(l, 'tfDate', 188, 282, 178, 48)}
      ${L(0, 344, 178, 14, 'FEE (OPTIONAL)', { s: 7.5, w: 6, c: K.sub })}
      ${TI(0, 362, 178, 44, l.fee, v => { l.fee = v; rerender(); }, { hint: '0.00', num: true, id: 'tfFee' })}
      ${L(188, 344, 178, 14, 'DESCRIPTION', { s: 7.5, w: 6, c: K.sub })}
      ${TI(188, 362, 178, 44, l.ref, v => { l.ref = v; rerender(); }, { hint: 'e.g. TNG top-up', id: 'tfRef' })}
      ${L(0, 420, 366, 40, 'A transfer moves money between your own accounts. It is never counted as income or spending. A fee is saved as Bank Charges.', { s: 8, c: K.mute, wrap: true, top: true })}`;

    const onSave = () => guard(async () => {
      const amt = Value(l.amt), fee = Value(l.fee) ?? 0, d = l.locD_tfDate;
      if (!fa || !ta) return Notify('Choose both accounts.', 'error');
      if (fa.AccId === ta.AccId) return Notify('From and To must be different accounts.', 'error');
      if (amt === null || amt <= 0) return Notify('Enter an amount greater than 0.', 'error');
      if (fee < 0) return Notify("The fee can't be negative.", 'error');
      if (stStart() && d < stStart()) return Notify('This date is before your tracking start (' + fmtD(stStart(), 'dd mmm yyyy') + ').', 'error');
      const ts = nextTxSeq();
      const trf = 'TRF-' + Year(d) + '-' + String(ts).padStart(6, '0');
      const desc = (l.ref || '').trim() || 'Transfer';
      const rows = [
        mkTxn({ TxnId: txnId(d, ts), TxSeq: ts, TxAcc: fa.AccId, TxDate: d, TxType: 'Transfer', TxDir: 'Out', TxAmt: round2(amt), TxCat: 'Transfer', TxDesc: desc, TxTrf: trf }),
        mkTxn({ TxnId: txnId(d, ts + 1), TxSeq: ts + 1, TxAcc: ta.AccId, TxDate: d, TxType: 'Transfer', TxDir: 'In', TxAmt: round2(amt), TxCat: 'Transfer', TxDesc: desc, TxTrf: trf })
      ];
      if (fee > 0) rows.push(mkTxn({ TxnId: txnId(d, ts + 2), TxSeq: ts + 2, TxAcc: fa.AccId, TxDate: d, TxType: 'Expense', TxDir: 'Out', TxAmt: round2(fee), TxCat: 'Bank Charges', TxDesc: 'Transfer fee - ' + trf, TxRef: trf }));
      await save({ up: { EW_Transactions: rows }, log: [{ AuAction: 'Create transfer', AuRef: trf, AuDetail: fa.AccName + ' -> ' + ta.AccName + ' RM ' + RM(amt).slice(3) }] });
      G.gblTxnId = rows[0].TxnId;
      Notify('Transfer saved.', 'success');
      Replace('scrTxnDetail');
    });

    return html`<div>
      ${DetailHeader('Fund transfer')}
      ${Flow(0, 66, 390, 700, Box(null, 0, 366, 464, form), { pad: [16, 12, 16, 12], gap: 8 })}
      ${SaveBar('Save transfer', onSave, 'saveTransfer')}
      ${Calendar(l, 'tfDate')}
    </div>`;
  }
};

/* ───────────── Split ───────────── */
export const scrSplit = {
  onVisible(l) {
    const P = txn(G.gblTxnId);
    l.lines = P && P.TxIsSplit
      ? DB.txns.filter(x => x.TxParent === P.TxnId).map((c, i) => ({ SpLine: i + 1, SpCat: c.TxCat, SpAmt: c.TxAmt, SpNote: c.TxNote }))
      : P ? [{ SpLine: 1, SpCat: P.TxCat, SpAmt: P.TxAmt, SpNote: '' }] : [];
    l.locFill = ''; l.cat = '';
  },
  view(l) {
    const P = txn(G.gblTxnId);
    if (!P) return html`<div>${DetailHeader('Split transaction')}</div>`;
    const left = round2(P.TxAmt - l.lines.reduce((s, x) => s + x.SpAmt, 0));
    const ok = Math.abs(left) < 0.005;
    const kind = P.TxType === 'Income' ? 'Income' : 'Expense';
    const cats = DB.categories.filter(c => c.CatActive && (c.CatType === kind || (kind === 'Expense' && c.CatType === 'Savings/Asset'))).map(c => c.CatName).sort();
    const catV = cats.includes(l.cat) ? l.cat : cats[0];

    const addLine = () => {
      const v = Value(l.locFill);
      if (v === null || v <= 0) return Notify('Enter an amount.', 'error');
      l.lines.push({ SpLine: l.lines.reduce((m, x) => Math.max(m, x.SpLine), 0) + 1, SpCat: catV, SpAmt: round2(v), SpNote: '' });
      l.locFill = ''; rerender();
    };
    const unsplit = () => guard(async () => {
      const kids = DB.txns.filter(x => x.TxParent === P.TxnId).map(x => x.TxnId);
      await save({ del: { EW_Transactions: kids }, up: { EW_Transactions: [{ ...P, TxIsSplit: false }] }, log: [{ AuAction: 'Remove split', AuRef: P.TxnId, AuDetail: 'Split removed' }] });
      Notify('Split removed.', 'success');
      Back();
    });
    const onSave = () => guard(async () => {
      if (l.lines.length < 2) return Notify('A split needs at least 2 lines.', 'error');
      if (l.lines.some(x => x.SpAmt <= 0)) return Notify('Every line needs an amount greater than 0.', 'error');
      if (!ok) return Notify('Lines must add up to ' + RM(P.TxAmt) + '.', 'error');
      const base = nextTxSeq() - 1;
      const old = DB.txns.filter(x => x.TxParent === P.TxnId).map(x => x.TxnId);
      const rows = l.lines.map((ln, i) => mkTxn({ TxnId: P.TxnId + '-S' + (i + 1), TxSeq: base + i + 1, TxAcc: P.TxAcc, TxDate: P.TxDate, TxType: P.TxType, TxDir: P.TxDir, TxAmt: ln.SpAmt, TxCat: ln.SpCat, TxPayee: P.TxPayee, TxDesc: 'Split ' + (i + 1) + ' of ' + P.TxnId, TxParent: P.TxnId, TxNote: ln.SpNote }));
      const del = old.filter(id => !rows.some(r => r.TxnId === id));
      await save({ del: { EW_Transactions: del }, up: { EW_Transactions: [...rows, { ...P, TxIsSplit: true }] }, log: [{ AuAction: 'Split', AuRef: P.TxnId, AuDetail: l.lines.length + ' lines' }] });
      Notify('Split saved.', 'success');
      Back();
    });

    const kids = html`
      ${Card(null, 0, 366, 108, html`
        ${L(16, 12, 334, 18, (P.TxPayee || P.TxDesc) + '  ·  ' + fmtD(P.TxDate, 'dd mmm yyyy'), { s: 8.5, c: K.sub })}
        ${L(16, 32, 334, 32, RM(P.TxAmt), { s: 18, w: 6 })}
        ${L(16, 72, 334, 22, ok ? 'Fully allocated' : 'Left to allocate: ' + sRM(left), { s: 10, w: 6, c: ok ? K.grn : K.red, id: 'spLeft' })}`)}
      ${Card(null, 0, 366, 52 + l.lines.length * 50, html`
        ${L(16, 14, 246, 22, 'Split lines', { s: 11.5, w: 6 })}
        ${Gal(0, 46, 366, l.lines.length * 50, l.lines, 50, ln => html`
          ${L(16, 0, 200, 50, ln.SpCat, { s: 10 })}
          ${L(190, 0, 120, 50, RM(ln.SpAmt), { s: 10, w: 6, a: 'r' })}
          ${I(316, 9, 32, 32, 'Trash', K.red, { pad: 7, onClick: () => { l.lines = l.lines.filter(x => x !== ln); rerender(); }, label: 'Remove line' })}
          ${R(16, 49, 334, 1, K.sep)}`, { key: ln => ln.SpLine })}`)}
      ${Card(null, 0, 366, 146, html`
        ${L(16, 14, 246, 22, 'Add a line', { s: 11.5, w: 6 })}
        ${DD(16, 44, 334, 40, cats, catV, v => { l.cat = v; rerender(); }, { id: 'spCat' })}
        ${TI(16, 92, 216, 40, l.locFill, v => { l.locFill = v; rerender(); }, { hint: 'Amount', num: true, id: 'spAmt' })}
        ${B(240, 92, 110, 40, 'Remaining', { fill: K.field, b: K.line, r: 10, s: 9.5, onClick: () => { l.locFill = String(Math.max(left, 0)); rerender(); }, id: 'spFill' })}`)}
      ${B(null, 0, 366, 40, '＋  Add line', { fill: K.field, b: K.line, r: 20, s: 10, onClick: addLine, st: 'position:relative;flex:none;', id: 'spAdd' })}
      ${P.TxIsSplit ? B(null, 0, 366, 40, 'Remove split', { fill: K.field, b: K.red, c: K.red, r: 20, s: 10, onClick: unsplit, st: 'position:relative;flex:none;', id: 'spRemove' }) : null}
      ${Box(null, 0, 366, 16, null)}`;
    return html`<div>
      ${DetailHeader('Split transaction')}
      ${Flow(0, 66, 390, 700, kids, { pad: [12, 12, 16, 12] })}
      ${SaveBar('Save split', onSave, 'saveSplit')}
    </div>`;
  }
};
