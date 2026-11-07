// scrRecurring, scrCategories, scrMore (Settings), scrSetup, scrAnalysis, plus the one-time connect screen.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Gal, Svg, Flow, TI, DD, Tog, Brand, heroBg, Navigate, Back, Notify, rerender, guard, save, api,
  bal, acc, accByName, stStart, lowBal, fmtD, fmtTime, Today, PLABEL, PSTART, PEND, Year, Month, D, addDays, addMonths, addYears,
  RM, sRM, n0, pct, Value, round2, mkTxn, txnId, nextTxSeq, catTotals, catSpend, psum, flowSum, ordinal, setMonth, monthLabel, settingsRow,
  PALETTE, CONN, store, loadAll, NAV, VERSION, perKey, SURFACE, HAIR, SYNC, flush
} from '../core.js';
import { TabHeader, NavBar, DetailHeader, SaveBar, DateBox, Calendar, Fab, FlowCard, PeriodCard, AuditRows, askPassword, PasswordDialog } from '../shared.js';
import { donutSvg } from './home.js';

/* ───────────── Recurring ───────────── */
export const scrRecurring = {
  onVisible(l) { l.locEdit = false; l.locConfirmDel = false; },
  view(l) {
    const due = DB.recurring.filter(r => r.RcActive && r.RcNext <= Today());
    const list = DB.recurring.slice().sort((a, b) => ((a.RcActive ? '1' : '2') + a.RcNext < (b.RcActive ? '1' : '2') + b.RcNext ? -1 : 1));
    const openEdit = r => {
      Object.assign(l, { locEdit: true, locConfirmDel: false, locR: r, name: r ? r.RcName : '', acc: r ? (acc(r.RcAcc) || {}).AccName || '' : '', type: r ? r.RcType : 'Expense',
        amt: r ? String(r.RcAmt) : '', cat: r ? r.RcCat : '', payee: r ? r.RcPayee : '', freq: r ? r.RcFreq : 'Monthly', mode: r ? r.RcMode : 'Auto-post', locD_rcNext: (r && r.RcNext) || Today(), txt_rcNext: undefined });
      rerender();
    };
    const post = () => guard(async () => {
      const auto = DB.recurring.filter(r => r.RcActive && r.RcMode === 'Auto-post' && r.RcNext <= Today());
      if (!auto.length) return Notify('Nothing is due.', 'info');
      const base = nextTxSeq() - 1;
      const rows = auto.map((r, i) => mkTxn({ TxnId: txnId(r.RcNext, base + i + 1), TxSeq: base + i + 1, TxAcc: r.RcAcc, TxDate: r.RcNext, TxType: r.RcType, TxDir: r.RcType === 'Income' ? 'In' : 'Out', TxAmt: r.RcAmt, TxCat: r.RcCat, TxPayee: r.RcPayee, TxDesc: r.RcName, TxRule: r.RcId }));
      const rec = auto.map(r => ({ ...r, RcNext: r.RcFreq === 'Weekly' ? addDays(r.RcNext, 7) : r.RcFreq === 'Yearly' ? addYears(r.RcNext, 1) : addMonths(r.RcNext, 1) }));
      await save({ up: { EW_Transactions: rows, EW_Recurring: rec }, log: [{ AuAction: 'Post recurring', AuRef: 'RECURRING', AuDetail: auto.length + ' item(s) recorded' }] });
      Notify(auto.length + ' item(s) recorded.', 'success');
    });
    const record = r => { G.gblPrefill = { PfAcc: r.RcAcc, PfType: r.RcType, PfAmt: r.RcAmt, PfCat: r.RcCat, PfPayee: r.RcPayee, PfRule: r.RcId, PfDate: r.RcNext < Today() ? r.RcNext : Today() }; G.gblEditMode = 'prefill'; Navigate('scrTxnEdit'); };

    let panel = null;
    if (l.locEdit) {
      const R0 = l.locR;
      const accs = DB.accounts.filter(a => a.AccStatus !== 'Closed').map(a => a.AccName).sort();
      const cats = DB.categories.filter(c => c.CatActive && (c.CatType === l.type || (l.type === 'Expense' && c.CatType === 'Savings/Asset'))).map(c => c.CatName).sort();
      const pays = DB.payees.map(p => p.PyName).sort();
      const set = k => v => { l[k] = v; rerender(); };
      const cap = (x, y, w, t) => L(x, y, w, 14, t, { s: 7.5, w: 6, c: K.sub });
      const onSave = () => guard(async () => {
        const amt = Value(l.amt), a = accByName(l.acc), nm = (l.name || '').trim(), cat = cats.includes(l.cat) ? l.cat : '';
        if (!nm) return Notify('Name is required.', 'error');
        if (!a) return Notify('Choose an account.', 'error');
        if (amt === null || amt <= 0) return Notify('Enter an amount greater than 0.', 'error');
        if (!cat) return Notify('Choose a category.', 'error');
        const f = { RcName: nm, RcAcc: a.AccId, RcType: l.type, RcAmt: round2(amt), RcCat: cat, RcPayee: l.payee || '', RcFreq: l.freq, RcNext: l.locD_rcNext, RcMode: l.mode };
        if (!R0) {
          const sq = DB.recurring.reduce((m, r) => Math.max(m, r.RcSeq || 0), 0) + 1;
          const id = 'REC-' + String(sq).padStart(4, '0');
          await save({ up: { EW_Recurring: [{ RcId: id, RcSeq: sq, ...f, RcActive: true }] }, log: [{ AuAction: 'Create recurring', AuRef: id, AuDetail: nm }] });
        } else {
          await save({ up: { EW_Recurring: [{ ...R0, ...f }] }, log: [{ AuAction: 'Edit recurring', AuRef: R0.RcId, AuDetail: nm }] });
        }
        l.locEdit = false;
        Notify('Saved.', 'success');
      });
      const toggle = () => guard(async () => { await save({ up: { EW_Recurring: [{ ...R0, RcActive: !R0.RcActive }] }, log: [{ AuAction: R0.RcActive ? 'Pause recurring' : 'Resume recurring', AuRef: R0.RcId, AuDetail: R0.RcName }] }); l.locR = DB.recurring.find(r => r.RcId === R0.RcId); });
      const del = () => guard(async () => {
        if (!l.locConfirmDel) { l.locConfirmDel = true; return; }
        await save({ del: { EW_Recurring: [R0.RcId] }, log: [{ AuAction: 'Delete recurring', AuRef: R0.RcId, AuDetail: R0.RcName }] });
        l.locEdit = false; l.locConfirmDel = false;
      });
      panel = Box(0, 66, 390, 778, html`
        ${cap(12, 16, 366, 'NAME')}${TI(12, 34, 366, 42, l.name, set('name'), { hint: 'e.g. House rent', id: 'rcName' })}
        ${cap(12, 86, 366, 'ACCOUNT')}${DD(12, 104, 366, 42, accs, l.acc, set('acc'), { id: 'rcAcc' })}
        ${cap(12, 156, 178, 'TYPE')}${DD(12, 174, 178, 42, ['Expense', 'Income'], l.type, v => { l.type = v; l.cat = ''; rerender(); }, { id: 'rcType' })}
        ${cap(200, 156, 178, 'AMOUNT (RM)')}${TI(200, 174, 178, 42, l.amt, set('amt'), { hint: '0.00', num: true, id: 'rcAmt' })}
        ${cap(12, 226, 178, 'CATEGORY')}${DD(12, 244, 178, 42, cats, cats.includes(l.cat) ? l.cat : '', set('cat'), { id: 'rcCat' })}
        ${cap(200, 226, 178, 'PAYEE')}${DD(200, 244, 178, 42, pays, l.payee, set('payee'), { allowEmpty: true, id: 'rcPayee' })}
        ${cap(12, 296, 178, 'FREQUENCY')}${DD(12, 314, 178, 42, ['Monthly', 'Weekly', 'Yearly'], l.freq, set('freq'), { id: 'rcFreq' })}
        ${cap(200, 296, 178, 'NEXT DUE')}${DateBox(l, 'rcNext', 200, 314, 178, 42)}
        ${cap(12, 366, 366, 'MODE')}${DD(12, 384, 366, 42, ['Auto-post', 'Remind'], l.mode, set('mode'), { id: 'rcMode' })}
        ${L(12, 430, 366, 30, 'Auto-post: "Record due items" adds it for you. Remind: the bell lights up and you tap Record.', { s: 8, c: K.mute, wrap: true })}
        ${B(12, 466, 116, 42, 'Save', { fill: K.or, c: '#FFFFFF', r: 21, s: 10, onClick: onSave, id: 'rcSave' })}
        ${R0 ? B(136, 466, 116, 42, R0.RcActive ? 'Pause' : 'Resume', { fill: K.field, b: HAIR, r: 21, s: 10, onClick: toggle, id: 'rcToggle' }) : null}
        ${R0 ? B(260, 466, 116, 42, l.locConfirmDel ? 'Confirm' : 'Delete', { fill: K.field, b: K.red, c: K.red, r: 21, s: 10, onClick: del, id: 'rcDel' }) : null}`,
      { fill: K.bg, st: 'bottom:0;height:auto;' });
    }

    const title = l.locEdit ? (l.locR ? 'Edit recurring item' : 'New recurring item') : 'Recurring';
    return html`<div>
      ${I(6, 20, 36, 36, 'ChevronLeft', K.text, { pad: 6, onClick: () => { if (l.locEdit) { l.locEdit = false; rerender(); } else Back(); }, label: 'Back' })}
      ${L(50, 16, 290, 44, title, { s: 12, w: 6, a: 'c' })}
      ${R(0, 65, 390, 1, K.sep)}
      ${Card(12, 76, 366, 92, html`
        ${L(16, 12, 334, 20, due.length + ' item(s) due', { s: 11.5, w: 6, id: 'rcDue' })}
        ${L(16, 32, 334, 16, 'Tap Record on a reminder, or record all auto-post items below.', { s: 8, c: K.sub })}
        ${B(16, 54, 334, 30, 'Record due auto-post items', { fill: K.or, c: '#FFFFFF', r: 15, s: 9.5, onClick: post, id: 'rcPost' })}`)}
      ${Gal(12, 178, 366, 652, list, 84, r => html`
        ${B(0, 0, 366, 76, '', { fill: SURFACE, b: HAIR, r: 16, flat: true })}
        ${L(16, 12, 206, 18, r.RcName, { s: 10.5, w: 6, c: r.RcActive ? K.text : K.mute })}
        ${L(16, 31, 206, 16, ((acc(r.RcAcc) || {}).AccName || '') + '  ·  ' + r.RcFreq, { s: 8, c: K.sub })}
        ${L(16, 50, 206, 14, !r.RcActive ? 'PAUSED' : (r.RcNext <= Today() ? 'DUE ' : 'NEXT ') + fmtD(r.RcNext, 'dd mmm').toUpperCase() + '  ·  ' + r.RcMode.toUpperCase(), { s: 7.5, w: 6, c: !r.RcActive ? K.mute : r.RcNext <= Today() ? K.red : K.or })}
        ${L(220, 12, 130, 20, (r.RcType === 'Income' ? '+' : '−') + RM(r.RcAmt), { s: 10.5, w: 6, a: 'r', c: r.RcType === 'Income' ? K.grn : K.text })}
        ${r.RcActive && r.RcNext <= addDays(Today(), 7) ? html`<div onClick=${e => e.stopPropagation()}>${B(270, 40, 80, 26, 'Record', { fill: K.or, c: '#FFFFFF', r: 13, s: 8.5, onClick: () => record(r), id: 'rec-' + r.RcId })}</div>` : null}`,
      { scroll: true, stretch: true, onSelect: openEdit, key: r => r.RcId })}
      ${Fab(() => openEdit(null), 760)}
      ${panel}
      ${l.locEdit ? Calendar(l, 'rcNext') : null}
    </div>`;
  }
};

/* ───────────── Categories & Payees ───────────── */
const CAT_COLORS = ['#FF6A00', '#E5484D', '#A3236F', '#E9B949', '#34C77B', '#1E6BD6', '#7B3FE4', '#626872'];
const fade = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

export const scrCategories = {
  onVisible(l) { l.locCatEdit = false; l.locPyEdit = false; l.locConfirmDel = false; l.locTab = G.gblCatTab; l.q = ''; },
  view(l) {
    const isCat = (l.locTab || 'Categories') === 'Categories';
    const ct = l.locCatType || 'Expense';
    const used = {};
    DB.txns.forEach(t => { if (!t.TxIsSplit && (t.TxType === 'Income' || t.TxType === 'Expense' || t.TxType === 'Refund')) used[t.TxCat] = (used[t.TxCat] || 0) + 1; });
    const cats = DB.categories.filter(c => c.CatType === ct).sort((a, b) => (a.CatName < b.CatName ? -1 : 1));
    const q = (l.q || '').toLowerCase();
    const pays = DB.payees.filter(p => !q || p.PyName.toLowerCase().includes(q) || (p.PyCat || '').toLowerCase().includes(q)).sort((a, b) => (a.PyName < b.PyName ? -1 : 1));
    const typeBtn = (t, x) => B(x, 76, 118, 34, t, { fill: ct === t ? K.or : K.field, c: ct === t ? '#FFFFFF' : K.sub, b: ct === t ? K.or : K.line, r: 17, s: 9, onClick: () => { l.locCatType = t; rerender(); }, id: 'ct-' + t });
    const openCat = c => { Object.assign(l, { locCatEdit: true, locConfirmDel: false, locC: c, locColor: c ? c.CatColor : '#FF6A00', name: c ? c.CatName : '', ctype: c ? c.CatType : ct, budget: c ? c.CatBudget : true, active: c ? c.CatActive : true }); rerender(); };
    const openPay = p => { Object.assign(l, { locPyEdit: true, locConfirmDel: false, locP: p, pname: p ? p.PyName : '', pcat: p ? p.PyCat : '' }); rerender(); };

    let panel = null;
    if (l.locCatEdit) {
      const C0 = l.locC;
      const onSave = () => guard(async () => {
        const nm = (l.name || '').trim(), old = C0 ? C0.CatName : '';
        if (!nm) return Notify('Name is required.', 'error');
        if (DB.categories.some(c => c.CatName.toLowerCase() === nm.toLowerCase() && c.CatId !== (C0 ? C0.CatId : '-'))) return Notify('This category already exists.', 'error');
        const f = { CatName: nm, CatType: l.ctype, CatPL: '', CatFixed: '', CatEss: '', CatBudget: !!l.budget, CatColor: l.locColor, CatActive: !!l.active };
        if (!C0) {
          const sq = DB.categories.reduce((m, c) => Math.max(m, c.CatSeq || 0), 0) + 1;
          const id = 'CAT-' + String(sq).padStart(3, '0');
          await save({ up: { EW_Categories: [{ CatId: id, CatSeq: sq, ...f }] }, log: [{ AuAction: 'Create category', AuRef: id, AuDetail: nm }] });
        } else {
          const up = { EW_Categories: [{ ...C0, ...f }] };
          if (old !== nm) {
            up.EW_Transactions = DB.txns.filter(t => t.TxCat === old).map(t => ({ ...t, TxCat: nm }));
            up.EW_Payees = DB.payees.filter(p => p.PyCat === old).map(p => ({ ...p, PyCat: nm }));
            up.EW_Recurring = DB.recurring.filter(r => r.RcCat === old).map(r => ({ ...r, RcCat: nm }));
          }
          await save({ up, log: [{ AuAction: 'Edit category', AuRef: C0.CatId, AuDetail: old !== nm ? old + ' renamed to ' + nm : nm }] });
        }
        l.locCatEdit = false;
        Notify('Category saved.', 'success');
      });
      const del = () => guard(async () => {
        if (DB.txns.some(t => t.TxCat === C0.CatName) || DB.recurring.some(r => r.RcCat === C0.CatName)) return Notify('This category is in use. Switch it to inactive instead.', 'error');
        if (!l.locConfirmDel) { l.locConfirmDel = true; return; }
        await save({ del: { EW_Categories: [C0.CatId] }, log: [{ AuAction: 'Delete category', AuRef: C0.CatId, AuDetail: C0.CatName }] });
        l.locCatEdit = false; l.locConfirmDel = false;
      });
      panel = Box(0, 66, 390, 778, html`
        ${L(12, 16, 366, 14, 'CATEGORY NAME', { s: 7.5, w: 6, c: K.sub })}
        ${TI(12, 34, 366, 42, l.name, v => { l.name = v; rerender(); }, { hint: 'e.g. Pets', id: 'catName' })}
        ${L(12, 86, 366, 14, 'TYPE', { s: 7.5, w: 6, c: K.sub })}
        ${DD(12, 104, 366, 42, ['Expense', 'Savings/Asset', 'Income'], l.ctype, v => { l.ctype = v; rerender(); }, { id: 'catType' })}
        ${L(12, 148, 366, 30, 'Savings/Asset is money out like an expense, kept apart so savings and investments are not mixed with spending.', { s: 8, c: K.mute, wrap: true })}
        ${L(12, 186, 286, 36, 'Include in budgets (later module)', { s: 10 })}
        ${Tog(318, 190, 56, 28, !!l.budget, v => { l.budget = v; rerender(); })}
        ${L(12, 226, 286, 36, 'Active (shown in pickers)', { s: 10 })}
        ${Tog(318, 230, 56, 28, !!l.active, v => { l.active = v; rerender(); })}
        ${L(12, 270, 366, 14, 'COLOUR', { s: 7.5, w: 6, c: K.sub })}
        ${Gal(12, 288, 366, 48, CAT_COLORS, 46, c => html`
          ${C(0, 1, 46, l.locColor === c ? fade(c, 0.45) : 'transparent', { onClick: () => { l.locColor = c; rerender(); } })}
          ${C(6, 7, 34, l.locColor === c ? c : fade(c, 0.75), { b: l.locColor === c ? '#FFFFFF' : undefined, bt: 3, onClick: () => { l.locColor = c; rerender(); } })}
          ${l.locColor === c ? I(14, 15, 18, 18, 'Check', '#FFFFFF', { pad: 1 }) : null}`, { horizontal: true })}
        ${B(12, 352, 179, 42, 'Save', { fill: K.or, c: '#FFFFFF', r: 21, s: 10, onClick: onSave, id: 'catSave' })}
        ${C0 ? B(199, 352, 179, 42, l.locConfirmDel ? 'Confirm delete' : 'Delete', { fill: K.field, b: K.red, c: K.red, r: 21, s: 10, onClick: del, id: 'catDel' }) : null}`,
      { fill: K.bg, st: 'bottom:0;height:auto;' });
    } else if (l.locPyEdit) {
      const P0 = l.locP;
      const pcats = DB.categories.filter(c => c.CatActive && ['Income', 'Expense', 'Savings/Asset'].includes(c.CatType)).map(c => c.CatName).sort();
      const onSave = () => guard(async () => {
        const nm = (l.pname || '').trim(), old = P0 ? P0.PyName : '';
        if (!nm) return Notify('Name is required.', 'error');
        if (DB.payees.some(p => p.PyName.toLowerCase() === nm.toLowerCase() && p.PyName !== (old || '-'))) return Notify('This payee already exists.', 'error');
        const row = { PyName: nm, PyCat: pcats.includes(l.pcat) ? l.pcat : '' };
        if (!P0) await save({ up: { EW_Payees: [row] }, log: [{ AuAction: 'Create payee', AuRef: nm, AuDetail: row.PyCat }] });
        else {
          const up = { EW_Payees: [row] }, del = {};
          if (old !== nm) {
            del.EW_Payees = [old];
            up.EW_Transactions = DB.txns.filter(t => t.TxPayee === old).map(t => ({ ...t, TxPayee: nm }));
            up.EW_Recurring = DB.recurring.filter(r => r.RcPayee === old).map(r => ({ ...r, RcPayee: nm }));
          }
          await save({ up, del, log: [{ AuAction: 'Edit payee', AuRef: nm, AuDetail: old !== nm ? old + ' renamed to ' + nm : nm }] });
        }
        l.locPyEdit = false;
        Notify('Payee saved.', 'success');
      });
      const del = () => guard(async () => {
        if (!l.locConfirmDel) { l.locConfirmDel = true; return; }
        await save({ del: { EW_Payees: [P0.PyName] }, log: [{ AuAction: 'Delete payee', AuRef: P0.PyName, AuDetail: P0.PyName }] });
        l.locPyEdit = false; l.locConfirmDel = false;
      });
      panel = Box(0, 66, 390, 778, html`
        ${L(12, 16, 366, 14, 'PAYEE NAME', { s: 7.5, w: 6, c: K.sub })}
        ${TI(12, 34, 366, 42, l.pname, v => { l.pname = v; rerender(); }, { hint: 'e.g. 99 Speedmart', id: 'pyName' })}
        ${L(12, 86, 366, 14, 'DEFAULT CATEGORY', { s: 7.5, w: 6, c: K.sub })}
        ${DD(12, 104, 366, 42, pcats, pcats.includes(l.pcat) ? l.pcat : '', v => { l.pcat = v; rerender(); }, { id: 'pyCat' })}
        ${L(12, 150, 366, 30, 'When you pick this payee on a transaction, this category is filled in for you.', { s: 8, c: K.mute, wrap: true })}
        ${B(12, 186, 179, 42, 'Save', { fill: K.or, c: '#FFFFFF', r: 21, s: 10, onClick: onSave, id: 'pySave' })}
        ${P0 ? B(199, 186, 179, 42, l.locConfirmDel ? 'Confirm delete' : 'Delete', { fill: K.field, b: K.red, c: K.red, r: 21, s: 10, onClick: del, id: 'pyDel' }) : null}
        ${P0 ? L(12, 236, 366, 30, 'Deleting a payee keeps the name on past transactions.', { s: 8, c: K.mute }) : null}`,
      { fill: K.bg, st: 'bottom:0;height:auto;' });
    }

    const title = l.locCatEdit ? (l.locC ? 'Edit category' : 'New category') : l.locPyEdit ? (l.locP ? 'Edit payee' : 'New payee') : (l.locTab || 'Categories');
    return html`<div>
      ${I(6, 20, 36, 36, 'ChevronLeft', K.text, { pad: 6, onClick: () => { if (l.locCatEdit || l.locPyEdit) { l.locCatEdit = false; l.locPyEdit = false; rerender(); } else Back(); }, label: 'Back' })}
      ${L(50, 16, 290, 44, title, { s: 12, w: 6, a: 'c' })}
      ${R(0, 65, 390, 1, K.sep)}
      ${isCat ? html`${typeBtn('Expense', 12)}${typeBtn('Savings/Asset', 136)}${typeBtn('Income', 260)}` : html`
        ${TI(12, 76, 366, 38, l.q, v => { l.q = v; rerender(); }, { hint: 'Search payees', fill: K.card, pad: 38, padR: 12, id: 'pySearch' })}
        ${I(22, 85, 20, 20, 'Search', K.sub, { pad: 2 })}`}
      ${Box(12, 124, 366, 636, isCat
        ? Gal(0, 4, 366, 628, cats, 54, c => html`
            ${C(16, 21, 12, c.CatColor)}
            ${L(40, 9, 226, 18, c.CatName, { s: 10.5, w: 6, c: c.CatActive ? K.text : K.mute })}
            ${L(40, 28, 226, 16, c.CatType + (c.CatActive ? '' : '  ·  Inactive'), { s: 8, c: K.sub })}
            ${L(266, 0, 86, 54, (used[c.CatName] || 0) + ' txns', { s: 8.5, c: K.sub, a: 'r' })}
            ${R(40, 53, 312, 1, K.sep)}`, { scroll: true, inset: [4, 4], onSelect: openCat, key: c => c.CatId })
        : Gal(0, 4, 366, 628, pays, 54, p => html`
            ${L(16, 9, 334, 18, p.PyName, { s: 10.5, w: 6 })}
            ${L(16, 28, 334, 16, 'Default: ' + (p.PyCat || '—'), { s: 8, c: K.sub })}
            ${R(16, 53, 334, 1, K.sep)}`, { scroll: true, inset: [4, 4], onSelect: openPay, key: p => p.PyName }),
      { fill: SURFACE, r: 16, b: HAIR, st: 'height:auto;bottom:84px;' })}
      ${B(52, { b: 28 }, 286, 44, isCat ? '＋   Add category' : '＋   Add payee', { fill: K.card, b: K.or, c: K.or, r: 22, s: 10.5, onClick: () => (isCat ? openCat(null) : openPay(null)), id: 'ctAdd' })}
      ${panel}
    </div>`;
  }
};

/* ───────────── Settings (scrMore) ───────────── */
export const scrMore = {
  onVisible(l) { l.pwd = null; },
  view(l) {
    const menu = [
      ['Person', 'Payees', 'Your list of shops, billers and people', () => { G.gblCatTab = 'Payees'; Navigate('scrCategories'); }],
      ['Tag', 'Categories', 'F&B, Transport, Sports and more', () => { G.gblCatTab = 'Categories'; Navigate('scrCategories'); }],
      ['Sync', 'Recurring', 'Salary, rent and bills', () => Navigate('scrRecurring')],
      ['Note', 'Activity log', 'Every change you make, newest first', () => Navigate('scrActivity')],
      ['CalendarBlank', 'Tracking period', 'From ' + fmtD(stStart(), 'dd mmm yyyy') + '  ·  months start on day ' + G.gblCycleDay, () => Navigate('scrSetup')]
    ];
    const csvText = () => {
      const rows = DB.txns.filter(t => t.TxType !== 'Opening Balance' && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo)
        .sort((a, b) => (a.TxDate + String(a.TxSeq).padStart(6, '0') < b.TxDate + String(b.TxSeq).padStart(6, '0') ? -1 : 1));
      const c = s => String(s || '').replace(/,/g, ' ');
      return 'Date,Account,Type,Amount,Category,Payee,Description,Notes,TransferId,SplitOf,Id\n' + rows.map(t =>
        [t.TxDate, c((acc(t.TxAcc) || {}).AccName), t.TxType, (t.TxDir === 'Out' ? '-' : '') + t.TxAmt.toFixed(2), c(t.TxCat), c(t.TxPayee), c(t.TxDesc), c(t.TxNote), t.TxTrf, t.TxParent, t.TxnId].join(',')).join('\n');
    };
    const csvName = () => 'PocketDreamer-' + G.gblYear + '-' + String(G.gblMonth).padStart(2, '0') + '.csv';
    const flash = (k, msg) => { l[k] = msg; rerender(); setTimeout(() => { l[k] = ''; rerender(); }, 1800); };
    /** iPhone: opens the share sheet (Save to Files, WhatsApp, Mail…). Elsewhere: downloads the file. */
    const download = async () => {
      const text = csvText();
      const file = typeof File === 'function' ? new File([text], csvName(), { type: 'text/csv' }) : null;
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: csvName() }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = csvName();
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      flash('dlNote', 'Saved ✓');
    };
    const copy = async () => {
      const text = csvText();
      try { await navigator.clipboard.writeText(text); }
      catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      flash('copied', 'Copied ✓');
    };
    const recalc = () => askPassword(l, 'recalculate monthly totals', () => guard(async () => {
      Notify('Recalculating…', 'info');
      await loadAll();
      Notify('Monthly totals recalculated.', 'success');
    }));
    const fresh = () => askPassword(l, 'delete all accounts and transactions', () => guard(async () => {
      await flush();
      await api('startFresh');
      SYNC.outbox = []; store.del('ew_outbox'); store.del('ew_data');
      DB.txns = []; DB.accounts = []; DB.recurring = []; DB.audit = [];
      DB.settings = settingsRow({ StStart: '' });
      Notify('All accounts and transactions deleted. Categories and payees were kept.', 'success');
      NAV.stack = []; Navigate('scrSetup');
    }));
    const disconnect = () => askPassword(l, 'disconnect this device', () => {
      store.del('ew_conn'); store.del('ew_data'); store.del('ew_outbox'); SYNC.outbox = []; CONN.v = null; NAV.stack = []; Navigate('connect');
    });
    const actionRow = (y, ic, title, sub, color, onClick, id, last) => html`
      ${C(16, y + 13, 36, color === K.red ? 'rgba(229,72,77,0.12)' : K.field)}
      ${I(25, y + 22, 18, 18, ic, color, { pad: 0 })}
      ${L(64, y + 12, 230, 20, title, { s: 10.5, w: 6, c: color === K.red ? K.red : K.text })}
      ${L(64, y + 32, 230, 16, sub, { s: 8, c: K.sub })}
      ${I(318, y + 23, 16, 16, 'Lock', K.mute, { pad: 0 })}
      ${last ? null : R(64, y + 61, 286, 1, K.sep)}
      ${B(0, y, 366, 62, '', { fill: 'transparent', r: 0, flat: true, onClick, id })}`;
    const url = CONN.v ? CONN.v.url.replace(/^https:\/\//, '') : '';
    const kids = html`
      ${Card(null, 0, 366, 318, html`${menu.map(([ic, nm, sb, go], i) => html`
        ${C(16, 17 + 62 * i, 36, K.field)}
        ${I(25, 26 + 62 * i, 18, 18, ic, K.or, { pad: 0 })}
        ${L(64, 16 + 62 * i, 256, 20, nm, { s: 10.5, w: 6 })}
        ${L(64, 36 + 62 * i, 256, 16, sb, { s: 8, c: K.sub })}
        ${I(326, 23 + 62 * i, 24, 24, 'ChevronRight', K.mute, { pad: 3 })}
        ${i < 4 ? R(64, 65 + 62 * i, 286, 1, K.sep) : null}
        ${B(0, 4 + 62 * i, 366, 62, '', { fill: 'transparent', r: 0, flat: true, onClick: go, id: 'menu-' + nm })}`)}`)}
      ${Card(null, 0, 366, 128, html`
        ${C(16, 14, 36, K.field)}${I(25, 23, 18, 18, 'Note', K.or, { pad: 0 })}
        ${L(64, 13, 230, 20, 'Export transactions', { s: 10.5, w: 6 })}
        ${L(64, 33, 280, 16, monthLabel('mmmm yyyy') + '  ·  ' + DB.txns.filter(t => t.TxType !== 'Opening Balance' && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo).length + ' rows  ·  for Excel or Google Sheets', { s: 8, c: K.sub })}
        ${B(16, 70, 162, 40, l.dlNote || 'Download CSV', { fill: K.or, c: '#FFFFFF', r: 20, s: 10, onClick: download, id: 'csvDownload' })}
        ${B(188, 70, 162, 40, l.copied || 'Copy as text', { fill: K.field, b: HAIR, r: 20, s: 10, onClick: copy, id: 'csvCopy' })}`, { id: 'exportCard' })}
      ${SubHead('Data')}
      ${Card(null, 0, 366, 124, html`
        ${actionRow(0, 'Sync', 'Recalculate monthly totals', 'Reload everything from your Google Sheet', K.or, recalc, 'recalc')}
        ${actionRow(62, 'Trash', 'Start fresh', 'Delete all accounts and transactions', K.red, fresh, 'startFresh', true)}`, { id: 'dataCard' })}
      ${SubHead('Data Connection')}
      ${Card(null, 0, 366, 124, html`
        ${C(16, 13, 36, K.field)}${I(25, 22, 18, 18, 'Shield', K.grn, { pad: 0 })}
        ${L(64, 12, 196, 20, 'Google Sheet', { s: 10.5, w: 6 })}
        ${L(64, 32, 196, 16, url.length > 34 ? url.slice(0, 22) + '…' + url.slice(-9) : url, { s: 8, c: K.sub, st: 'overflow:hidden;' })}
        ${B(268, 21, 82, 22, 'CONNECTED', { fill: 'rgba(52,199,123,0.08)', b: 'rgba(52,199,123,0.3)', c: K.grn, r: 11, s: 6.5, flat: true, id: 'connPill' })}
        ${R(64, 61, 286, 1, K.sep)}
        ${actionRow(62, 'Lock', 'Disconnect this device', 'You will need the URL and key again', K.red, disconnect, 'disconnect', true)}`, { id: 'connCard' })}
      ${L(null, 0, 366, 30, 'Pocket Dreamer  ·  v' + VERSION, { s: 8, c: K.mute, a: 'c', st: 'position:relative;flex:none;' })}
      ${Box(null, 0, 366, 16, null)}`;
    return html`<div>
      ${TabHeader()}
      ${L(18, 68, 240, 32, 'Settings', { s: 17 })}
      ${Flow(0, 104, 390, 662, kids)}
      ${NavBar(4)}
      ${PasswordDialog(l)}
    </div>`;
  }
};
function SubHead(t) {
  return html`<div class="box" style="position:relative;flex:none;width:366px;height:22px;padding:6px 4px 0;color:#9AA0A8;font-size:${'9.33px'};font-weight:600;letter-spacing:1.2px">${t.toUpperCase()}</div>`;
}

/* ───────────── Activity log (all entries) ───────────── */
export const scrActivity = {
  onVisible(l) {
    l.all = null;
    api('activityAll', {}, undefined, { quiet: true }).then(r => { const seen = new Set(r.map(a => a.AuId)); r = [...r, ...DB.audit.filter(a => !seen.has(a.AuId))]; l.all = r; rerender(); }).catch(() => { l.all = DB.audit.slice(); l.partial = true; rerender(); });
  },
  view(l) {
    const list = (l.all || DB.audit).slice().sort((a, b) => (a.AuWhen < b.AuWhen ? 1 : -1));
    const dayKey = iso => { const t = new Date(iso); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
    const groups = [];
    list.forEach(a => { const k = dayKey(a.AuWhen); let g = groups[groups.length - 1]; if (!g || g.k !== k) { g = { k, items: [] }; groups.push(g); } g.items.push(a); });
    const label = k => k === Today() ? 'TODAY' : k === addDays(Today(), -1) ? 'YESTERDAY' : fmtD(k, 'dd mmm yyyy').toUpperCase();
    const kids = html`
      ${Box(null, 0, 366, 40, html`
        ${L(4, 4, 250, 16, list.length + (list.length === 1 ? ' entry' : ' entries'), { s: 10, w: 6 })}
        ${L(4, 22, 340, 14, l.all === null ? 'Loading…' : l.partial ? 'Showing the latest entries.' : 'Newest first', { s: 8, c: K.sub })}`)}
      ${groups.map(g => html`
        ${SubHead(label(g.k))}
        ${Card(null, 0, 366, g.items.length * 58 + 8, html`<div class="abs" style="left:0;top:4px;width:366px">${g.items.map((a, i) => html`<div class="row" style="position:relative;height:58px;width:366px">
          ${C(16, 15, 28, K.field)}${I(22, 21, 16, 16, actIcon(a.AuAction), K.or, { pad: 0 })}
          ${L(56, 9, 220, 18, a.AuAction, { s: 10, w: 6 })}
          ${L(56, 28, 290, 16, a.AuDetail || a.AuRef, { s: 8, c: K.sub })}
          ${L(276, 9, 74, 18, fmtTime(a.AuWhen, 'dd/mm hh:mm').slice(6), { s: 8, c: K.mute, a: 'r' })}
          ${i < g.items.length - 1 ? R(56, 57, 294, 1, K.sep) : null}
        </div>`)}</div>`)}`)}
      ${!list.length && l.all !== null ? Card(null, 0, 366, 84, L(16, 0, 334, 84, 'No activity yet.', { s: 9.5, c: K.mute, a: 'c' })) : null}
      ${Box(null, 0, 366, 16, null)}`;
    return html`<div>
      ${DetailHeader('Activity log')}
      ${Flow(0, 66, 390, 778, kids, { pad: [12, 12, 24, 12] })}
    </div>`;
  }
};
function actIcon(a) {
  a = a || '';
  if (/delete|remove|start fresh/i.test(a)) return 'Trash';
  if (/transfer/i.test(a)) return 'Sync';
  if (/account/i.test(a)) return 'Money';
  if (/categor/i.test(a)) return 'Tag';
  if (/payee/i.test(a)) return 'Person';
  if (/recurring/i.test(a)) return 'Clock';
  if (/setup|period/i.test(a)) return 'CalendarBlank';
  if (/split/i.test(a)) return 'DetailList';
  return 'Edit';
}

/* ───────────── Setup / Tracking period ───────────── */
export const scrSetup = {
  onVisible(l) {
    l.locFirst = !stStart();
    l.locDay = (DB.settings && DB.settings.StCycleDay) || 28;
    l.locD_suStart = stStart() || '2025-12-28';
    l.txt_suStart = undefined; l.locCalOpen_suStart = false;
  },
  view(l) {
    const day = l.locDay;
    const st = l.locD_suStart;
    const first = st ? PLABEL(st, day) : null;
    const nMonths = st ? (() => { const a = PLABEL(st, day), b = PLABEL(Today(), day); return (Year(b) - Year(a)) * 12 + Month(b) - Month(a) + 1; })() : 0;
    const exS = PSTART(2026, 1, day), exE = PEND(2026, 1, day);
    const onBegin = () => guard(async () => {
      if (!st) return Notify('Choose the date tracking starts.', 'error');
      if (st > Today()) return Notify("The start date can't be in the future.", 'error');
      const detail = 'Starts ' + fmtD(st, 'dd mmm yyyy') + ', months from day ' + day;
      await save({ up: { EW_Settings: [settingsRow({ StStart: st, StCycleDay: day })] }, log: [{ AuAction: l.locFirst ? 'Setup' : 'Tracking period', AuRef: 'SYSTEM', AuDetail: detail }] });
      G.gblCycleDay = day;
      const lb = PLABEL(Today()); setMonth(Year(lb), Month(lb));
      G.gblTxAll = false; G.gblTxFrom = G.gblFrom; G.gblTxTo = G.gblTo; G.gblTxLbl = monthLabel('mmm yyyy');
      if (l.locFirst) { NAV.stack = []; Navigate('scrHome'); }
      else { Notify('Tracking period saved.', 'success'); Back(); }
    });
    return html`<div><div class="scroll" style="position:absolute;inset:0"><div style="position:relative;height:844px">
      ${L(294, 26, 80, 16, 'v' + VERSION, { s: 7.5, c: K.mute, a: 'r' })}
      ${!l.locFirst ? I(6, 20, 36, 36, 'ChevronLeft', K.text, { pad: 6, onClick: () => Back(), label: 'Back' }) : null}
      ${Brand(0, 44, 390, 52, true, true)}
      ${L(12, 116, 366, 30, l.locFirst ? 'Set your starting point' : 'Tracking period', { s: 18, a: 'c' })}
      ${L(32, 150, 326, 34, 'Pocket Dreamer measures your money from a start date, in months that begin on a day you choose.', { s: 8.5, c: K.sub, a: 'c', wrap: true })}
      ${Card(12, 196, 366, 112, html`
        ${C(16, 14, 30, K.field)}${I(22, 20, 18, 18, 'CalendarBlank', K.or, { pad: 1 })}
        ${L(56, 22, 294, 14, 'TRACKING STARTS ON', { s: 7.5, w: 6, c: K.sub })}
        ${DateBox(l, 'suStart', 16, 52, 334, 42, { w: 6 })}`)}
      ${Card(12, 318, 366, 150, html`
        ${C(16, 14, 30, K.field)}${I(22, 20, 18, 18, 'Sync', K.or, { pad: 1 })}
        ${L(56, 22, 294, 14, 'EACH MONTH STARTS ON DAY', { s: 7.5, w: 6, c: K.sub })}
        ${C(16, 60, 40, K.field, { b: HAIR, onClick: () => { l.locDay = Math.max(1, day - 1); rerender(); } })}
        ${L(16, 60, 40, 40, '−', { s: 16, a: 'c', onClick: () => { l.locDay = Math.max(1, day - 1); rerender(); }, id: 'dayMinus' })}
        ${L(60, 54, 64, 52, String(day), { s: 28, a: 'c', c: K.or, id: 'cycleDay' })}
        ${C(128, 60, 40, K.field, { b: HAIR, onClick: () => { l.locDay = Math.min(28, day + 1); rerender(); } })}
        ${L(128, 60, 40, 40, '+', { s: 15, a: 'c', onClick: () => { l.locDay = Math.min(28, day + 1); rerender(); }, id: 'dayPlus' })}
        ${L(184, 56, 166, 48, day === 1 ? 'From the 1st to the last day of each month.' : 'From the ' + ordinal(day) + ' to the ' + ordinal(day - 1) + ' of the next month.', { s: 8.5, wrap: true })}
        ${R(16, 114, 334, 1, K.sep)}
        ${L(16, 120, 334, 22, 'e.g. January 2026  =  ' + fmtD(exS, 'dd mmm yyyy') + '  –  ' + fmtD(exE, 'dd mmm yyyy'), { s: 8, c: K.sub })}`)}
      ${Card(12, 478, 366, 96, html`
        ${L(18, 14, 200, 14, 'YOUR FIRST MONTH', { s: 7.5, w: 6, c: K.or })}
        ${B(238, 12, 110, 22, st ? nMonths + (nMonths === 1 ? ' MONTH' : ' MONTHS') + ' TO DATE' : '—', { fill: K.orSoft, b: K.orBorder, c: K.or, r: 11, s: 7.5 })}
        ${L(18, 36, 330, 30, first ? fmtD(first, 'mmmm yyyy') : '—', { s: 16, id: 'firstMonth' })}
        ${L(18, 66, 330, 18, first ? fmtD(PSTART(Year(first), Month(first), day), 'dd mmm yyyy') + '  –  ' + fmtD(PEND(Year(first), Month(first), day), 'dd mmm yyyy') : '', { s: 8.5, c: K.sub })}`, { b: 'rgba(255,106,0,0.55)' })}
      ${L(22, { b: 86 }, 346, 32, l.locFirst ? 'Your data is saved in your Google Sheet, so it shows on every device you use.' : 'Changing the start day only regroups your months. No transaction is changed.', { s: 8, c: K.mute, a: 'c', wrap: true })}
      ${B(12, { b: 30 }, 366, 48, l.locFirst ? 'Begin with my own accounts' : 'Save changes', { fill: K.or, c: '#FFFFFF', r: 24, s: 11, onClick: onBegin, id: 'begin' })}
      </div></div>
      ${Calendar(l, 'suStart')}
    </div>`;
  }
};

/* ───────────── Analysis ───────────── */
function last12() {
  const l0 = PLABEL(Today());
  const base = PSTART(Year(l0), Month(l0));
  return Array.from({ length: 12 }, (_, i) => { const s = addMonths(base, -i); return { I: i + 1, S: s, L: fmtD(addDays(addMonths(s, 1), -1), 'mmm yyyy') }; });
}
function barsSvg() {
  const ms = [1, 2, 3, 4, 5, 6].map(v => {
    const s = addMonths(G.gblFrom, v - 6);
    const pe = addDays(addMonths(s, 1), -1);
    const k = Year(pe) * 100 + Month(pe);
    const t = catTotals(x => x === k);
    return { Mi: v, Lb: fmtD(pe, 'mmm').toUpperCase(), Vi: t.In, Vo: t.Out };
  });
  const mx = Math.max(...ms.map(m => m.Vi), ...ms.map(m => m.Vo), 1);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 340 150'><line x1='8' y1='12' x2='332' y2='12' stroke='#262A30'/><line x1='8' y1='62' x2='332' y2='62' stroke='#262A30'/><line x1='8' y1='112' x2='332' y2='112' stroke='#2A2E35'/>` +
    ms.map(m => `<rect x='${18 + (m.Mi - 1) * 54}' y='${(112 - m.Vi / mx * 96).toFixed(1)}' width='16' height='${(m.Vi / mx * 96).toFixed(1)}' rx='3' fill='#2ECC71'/><rect x='${36 + (m.Mi - 1) * 54}' y='${(112 - Math.max(m.Vo, 0) / mx * 96).toFixed(1)}' width='16' height='${(Math.max(m.Vo, 0) / mx * 96).toFixed(1)}' rx='3' fill='#FF6A00'/><text x='${35 + (m.Mi - 1) * 54}' y='132' text-anchor='middle' font-family='Segoe UI,Arial' font-size='10' fill='${m.Mi === 6 ? '#FF6A00' : '#A0A6AE'}'>${m.Lb}</text>`).join('') +
    `<text x='332' y='9' text-anchor='end' font-family='Segoe UI,Arial' font-size='9' fill='#6B7178'>RM ${n0(mx)}</text></svg>`;
}

/* Full Analysis screen — kept ready for when it is switched back on. */
export const scrAnalysisFull = {
  onVisible(l) {
    const m = last12();
    l.vsA = m[1].L; l.vsB = m[2].L;
    l.locPick = false; l.locPickYear = G.gblYear;
  },
  view(l) {
    const months = last12();
    const keyOf = lab => { const it = months.find(x => x.L === lab) || months[0]; const pe = addDays(addMonths(it.S, 1), -1); return Year(pe) * 100 + Month(pe); };
    const A = catTotals(k => k === keyOf(l.vsA)), Bt = catTotals(k => k === keyOf(l.vsB));
    const topOf = t => { const e = Object.entries(t.by).filter(([, v]) => v.Out > 0).sort((a, b) => b[1].Out - a[1].Out)[0]; return e ? e[0] : '—'; };
    const { In: inc, Out: out } = flowSum();
    const spend = catSpend();
    const top5 = spend.slice(0, 5);
    const spendTot = round2(spend.reduce((s, x) => s + x.Amt, 0));
    const pay = DB.payees.map(p => ({ ...p, Amt: round2(DB.txns.filter(t => !t.TxIsSplit && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo && t.TxType === 'Expense' && t.TxPayee === p.PyName).reduce((s, t) => s + t.TxAmt, 0)) }))
      .filter(p => p.Amt > 0).sort((a, b) => b.Amt - a.Amt).slice(0, 5).map((p, i) => ({ Rk: i + 1, Nm: p.PyName, Amt: p.Amt }));
    const payMax = Math.max(...pay.map(p => p.Amt), 1);
    const tbl = spend.map(c => ({ ...c, Cnt: DB.txns.filter(t => !t.TxIsSplit && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo && t.TxCat === c.CatName && t.TxType === 'Expense').length }));
    const sy = Year(stStart() || Today());
    const years = [];
    for (let y = sy - 1; y <= Year(Today()) + 1; y++) { const t = catTotals(k => Math.floor(k / 100) === y); if (t.In + t.Out > 0) years.push({ Y: y, I: t.In, O: t.Out }); }
    years.sort((a, b) => b.Y - a.Y);
    const all = catTotals(() => true);
    const vsBox = (x, y, cap, a, b) => Box(x, y, 162, 64, html`
      ${L(12, 8, 138, 14, cap, { s: 7.5, w: 6, c: K.sub })}
      ${L(12, 24, 138, 18, a, { s: 10.5, w: 6 })}
      ${L(12, 42, 138, 16, 'vs ' + b, { s: 8, c: K.or })}`, { fill: K.field, r: 10, b: HAIR });

    const kids = html`
      ${PeriodCard(l)}
      ${FlowCard(inc, out, monthLabel('mmm yyyy'), { id: 'anFlow' })}
      ${Card(null, 0, 366, 218, html`
        ${L(16, 14, 246, 22, 'In vs out', { s: 11.5, w: 6 })}
        ${L(16, 34, 160, 14, 'LAST 6 MONTHS', { s: 7.5, w: 6, c: K.sub })}
        ${C(262, 22, 7, K.grn)}${L(274, 18, 30, 14, 'IN', { s: 7.5, w: 6, c: K.sub })}
        ${C(308, 22, 7, K.or)}${L(320, 18, 34, 14, 'OUT', { s: 7.5, w: 6, c: K.sub })}
        ${Svg(6, 54, 354, 158, barsSvg())}`)}
      ${Card(null, 0, 366, 206, html`
        ${L(16, 14, 246, 22, 'Spending by category', { s: 11.5, w: 6 })}
        ${Svg(10, 46, 150, 150, donutSvg(top5))}
        ${Gal(172, 54, 180, 140, top5.map((c, i) => ({ Idx: i + 1, Nm: c.CatName, Amt: c.Amt })), 28, it => html`
          ${C(0, 10, 8, PALETTE[it.Idx - 1])}
          ${L(16, 0, 90, 28, it.Nm, { s: 8.5 })}
          ${L(110, 0, 70, 28, 'RM ' + n0(it.Amt), { s: 8.5, w: 6, a: 'r' })}`)}`)}
      ${Card(null, 0, 366, 52 + Math.max(pay.length, 1) * 50, html`
        ${L(16, 14, 246, 22, 'Top payees', { s: 11.5, w: 6 })}
        ${Gal(0, 46, 366, pay.length * 50, pay, 50, p => html`
          ${L(16, 0, 20, 32, String(p.Rk), { s: 10, w: 6, c: K.or })}
          ${L(38, 0, 180, 32, p.Nm, { s: 10 })}
          ${L(220, 0, 130, 32, RM(p.Amt), { s: 10, w: 6, a: 'r' })}
          ${R(38, 34, 312, 3, K.field)}
          ${R(38, 34, Math.max(2, 312 * p.Amt / payMax), 3, K.or)}`)}`)}
      ${Card(null, 0, 366, 258, html`
        ${L(16, 14, 246, 22, 'Compare months', { s: 11.5, w: 6 })}
        ${DD(16, 46, 134, 34, months.map(m => m.L), l.vsA, v => { l.vsA = v; rerender(); }, { s: 10.5, pad: 10, id: 'vsA' })}
        ${C(166, 46, 34, K.card, { b: K.or })}${L(166, 46, 34, 34, 'VS', { s: 8, w: 7, c: K.or, a: 'c' })}
        ${DD(216, 46, 134, 34, months.map(m => m.L), l.vsB, v => { l.vsB = v; rerender(); }, { s: 10.5, pad: 10, id: 'vsB' })}
        ${vsBox(16, 92, 'MONEY IN', RM(A.In), RM(Bt.In))}
        ${vsBox(188, 92, 'MONEY OUT', RM(A.Out), RM(Bt.Out))}
        ${vsBox(16, 164, 'NET', RM(A.In - A.Out), RM(Bt.In - Bt.Out))}
        ${vsBox(188, 164, 'TRANSACTIONS', String(A.N), String(Bt.N))}
        ${L(16, 232, 334, 18, 'Top category: ' + topOf(A) + '  vs  ' + topOf(Bt), { s: 8, c: K.sub })}`, { id: 'compare' })}
      ${Card(null, 0, 366, 84 + Math.max(tbl.length, 1) * 34, html`
        ${L(16, 14, 246, 22, 'Category breakdown', { s: 11.5, w: 6 })}
        ${L(16, 44, 150, 14, 'CATEGORY', { s: 7.5, w: 6, c: K.sub })}${L(166, 44, 40, 14, 'TXNS', { s: 7.5, w: 6, c: K.sub, a: 'r' })}
        ${L(210, 44, 92, 14, 'AMOUNT', { s: 7.5, w: 6, c: K.sub, a: 'r' })}${L(306, 44, 44, 14, '%', { s: 7.5, w: 6, c: K.sub, a: 'r' })}
        ${Gal(0, 62, 366, tbl.length * 34, tbl, 34, c => html`
          ${L(16, 0, 148, 34, c.CatName, { s: 9 })}
          ${L(166, 0, 40, 34, String(c.Cnt), { s: 9, c: K.sub, a: 'r' })}
          ${L(210, 0, 92, 34, RM(c.Amt).slice(3), { s: 9, a: 'r' })}
          ${L(306, 0, 44, 34, pct(c.Amt / Math.max(spendTot, 1)), { s: 9, w: 6, c: K.or, a: 'r' })}
          ${R(16, 33, 334, 1, K.sep)}`)}
        ${L(16, 66 + tbl.length * 34, 150, 18, 'Total', { s: 10, w: 6, c: K.or })}
        ${L(190, 66 + tbl.length * 34, 160, 18, RM(spendTot), { s: 10, w: 6, c: K.or, a: 'r' })}`)}
      ${Card(null, 0, 366, 110 + Math.max(years.length, 1) * 34, html`
        ${L(16, 14, 246, 22, 'Since you started', { s: 11.5, w: 6 })}
        ${L(16, 34, 334, 16, 'From ' + fmtD(stStart(), 'dd mmm yyyy') + '  ·  years follow your months', { s: 8, c: K.sub })}
        ${L(16, 58, 83, 14, 'YEAR', { s: 7.5, w: 6, c: K.sub })}${L(99, 58, 83, 14, 'INCOME', { s: 7.5, w: 6, c: K.sub, a: 'r' })}
        ${L(182, 58, 83, 14, 'SPENDING', { s: 7.5, w: 6, c: K.sub, a: 'r' })}${L(265, 58, 83, 14, 'NET', { s: 7.5, w: 6, c: K.sub, a: 'r' })}
        ${Gal(0, 76, 366, years.length * 34, years, 34, y => html`
          ${L(16, 0, 83, 34, String(y.Y), { s: 9, w: 6 })}
          ${L(99, 0, 83, 34, n0(y.I), { s: 9, c: K.grn, a: 'r' })}
          ${L(182, 0, 83, 34, n0(y.O), { s: 9, a: 'r' })}
          ${L(265, 0, 83, 34, (y.I - y.O < 0 ? '-' : '') + n0(Math.abs(y.I - y.O)), { s: 9, w: 6, c: y.I - y.O < 0 ? K.red : K.grn, a: 'r' })}
          ${R(16, 33, 334, 1, K.sep)}`)}
        ${L(16, 80 + years.length * 34, 83, 22, 'Total', { s: 10, w: 6, c: K.or })}
        ${L(99, 80 + years.length * 34, 83, 22, n0(all.In), { s: 9, w: 6, c: K.or, a: 'r' })}
        ${L(182, 80 + years.length * 34, 83, 22, n0(all.Out), { s: 9, w: 6, c: K.or, a: 'r' })}
        ${L(265, 80 + years.length * 34, 83, 22, (all.In - all.Out < 0 ? '-' : '') + n0(Math.abs(all.In - all.Out)), { s: 9, w: 6, c: K.or, a: 'r' })}`)}
      ${L(null, 0, 366, 30, 'Income and spending exclude transfers and opening balances. Split transactions count by their lines.', { s: 8, c: K.mute, wrap: true, st: 'position:relative;flex:none;' })}
      ${Box(null, 0, 366, 16, null)}`;
    return html`<div>
      ${TabHeader()}
      ${L(18, 68, 240, 32, 'Analysis', { s: 17 })}
      ${Flow(0, 104, 390, 662, kids)}
      ${NavBar(3)}
    </div>`;
  }
};

/* ───────────── Analysis (coming soon) ───────────── */
const SOON = [
  ['Trending', 'In vs out', 'Six months of money in and out, side by side'],
  ['Tag', 'Spending by category', 'Where each ringgit goes, with share of total'],
  ['Person', 'Top payees', 'The shops and billers you pay the most'],
  ['Sync', 'Compare months', 'Any two months: in, out, net and count'],
  ['DetailList', 'Category breakdown', 'Every category with transactions and %'],
  ['CalendarBlank', 'Since you started', 'Year-by-year income, spending and net']
];
function soonArt() {
  const bars = [38, 56, 44, 70, 52, 84, 66].map((h, i) => `<rect x='${18 + i * 34}' y='${112 - h}' width='14' height='${h}' rx='3' fill='${i === 5 ? '#FF6A00' : 'rgba(255,255,255,0.08)'}'/>`).join('');
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 130'><defs><linearGradient id='al' x1='0' x2='1'><stop offset='0' stop-color='#FF6A00' stop-opacity='0.15'/><stop offset='1' stop-color='#FF6A00'/></linearGradient></defs>${bars}<polyline fill='none' stroke='url(#al)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' points='25,86 59,70 93,78 127,52 161,62 195,34 229,44'/><circle cx='195' cy='34' r='5' fill='#0D0F12' stroke='#FF6A00' stroke-width='2'/><line x1='8' y1='112.5' x2='252' y2='112.5' stroke='rgba(255,255,255,0.1)'/></svg>`;
}
export const scrAnalysis = {
  view() {
    const kids = html`
      ${Card(null, 0, 366, 300, html`
        ${Svg(0, 0, 366, 300, heroBg(300), { stretch: true })}
        ${B(16, 18, 124, 24, 'IN DEVELOPMENT', { fill: K.orSoft, b: K.orBorder, c: K.or, r: 12, s: 6.5, flat: true, id: 'soonPill' })}
        ${Svg(53, 50, 260, 130, soonArt())}
        ${L(16, 196, 334, 30, html`<span style="font-family:Georgia,'Times New Roman',serif;font-size:24px">Deploying soon<span style="color:#FF6A00">.</span></span>`, { s: 18, a: 'c' })}
        ${L(28, 230, 310, 50, 'A deeper look at your money is on the way. Your data is already being recorded, so every chart will be ready on day one.', { s: 8.5, c: K.sub, a: 'c', wrap: true })}`, { id: 'soonHero' })}
      ${Box(null, 0, 366, 22, html`<div style="padding:6px 4px 0;color:#9AA0A8;font-size:9.33px;font-weight:600;letter-spacing:1.2px">WHAT'S COMING</div>`)}
      ${Card(null, 0, 366, SOON.length * 58 + 8, html`<div class="abs" style="left:0;top:4px;width:366px">${SOON.map(([ic, t, d], i) => html`<div class="row" style="position:relative;height:58px;width:366px">
        ${C(16, 13, 32, K.field)}${I(24, 21, 16, 16, ic, K.or, { pad: 0 })}
        ${L(60, 10, 270, 18, t, { s: 10, w: 6 })}
        ${L(60, 29, 280, 16, d, { s: 8, c: K.sub })}
        ${i < SOON.length - 1 ? R(60, 57, 290, 1, K.sep) : null}
      </div>`)}</div>`)}
      ${Box(null, 0, 366, 16, null)}`;
    return html`<div>
      ${TabHeader()}
      ${L(18, 68, 240, 32, 'Analysis', { s: 17 })}
      ${Flow(0, 104, 390, 662, kids)}
      ${NavBar(3)}
    </div>`;
  }
};

/* ───────────── Connect (first time on a device) ───────────── */
export const connect = {
  onVisible(l) { const c = CONN.v || {}; l.url = c.url || ''; l.key = c.key || ''; },
  view(l) {
    const go = async () => {
      const conn = { url: (l.url || '').trim(), key: (l.key || '').trim() };
      if (!/^https?:\/\//i.test(conn.url)) return Notify('The Web app URL should start with https://', 'error');
      if (!conn.key) return Notify('Paste your API key.', 'error');
      try {
        await api('ping', {}, conn);
        CONN.v = conn; store.set('ew_conn', conn); CONN.authError = '';
        await loadAll();
        NAV.stack = [];
        Navigate(stStart() ? 'scrHome' : 'scrSetup');
      } catch (e) { Notify(e.message, 'error'); }
    };
    return html`<div class="scroll" style="position:absolute;inset:0"><div style="position:relative;height:844px">
      ${Brand(0, 70, 390, 52, true, true)}
      ${L(12, 150, 366, 30, 'Connect your Google Sheet', { s: 18, a: 'c' })}
      ${L(32, 184, 326, 34, 'Paste the Web app URL and API key from your Apps Script setup. They are kept on this device only.', { s: 8.5, c: K.sub, a: 'c', wrap: true })}
      ${CONN.authError ? L(32, 222, 326, 20, CONN.authError + ' Please reconnect.', { s: 8.5, c: K.red, a: 'c' }) : null}
      ${Card(12, 250, 366, 200, html`
        ${L(16, 16, 334, 14, 'WEB APP URL', { s: 7.5, w: 6, c: K.sub })}
        ${TI(16, 34, 334, 44, l.url, v => { l.url = v; rerender(); }, { hint: 'https://script.google.com/macros/s/…/exec', id: 'connUrl' })}
        ${L(16, 96, 334, 14, 'API KEY', { s: 7.5, w: 6, c: K.sub })}
        ${TI(16, 114, 334, 44, l.key, v => { l.key = v; rerender(); }, { hint: 'ew_…', id: 'connKey' })}
        ${L(16, 166, 334, 20, 'Find both in the setup guide (README).', { s: 8, c: K.mute })}`)}
      ${B(12, { b: 30 }, 366, 48, 'Connect', { fill: K.or, c: '#FFFFFF', r: 24, s: 11, onClick: go, id: 'connect' })}
    </div></div>`;
  }
};
