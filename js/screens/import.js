// Pocket Dreamer — Import past transactions (Settings → Import).
// Reads a CSV file, checks every row, shows a preview, then saves in batches.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Flow, TI, DD, Tog, Back, Notify, rerender, guard, save, SURFACE, HAIR,
  fmtD, Today, parseDMY, RM, round2, mkTxn, txnId, nextTxSeq, stStart, Year, PALETTE
} from '../core.js';
import { DetailHeader, SaveBar } from '../shared.js';
import { isLocked, lockDate } from '../sweep.js';

export const TEMPLATE_HEAD = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Payee', 'Description', 'To account'];
const TEMPLATE = TEMPLATE_HEAD.join(',') + '\n' +
  '05/01/2026,Expense,30.00,Maybank,Sports,Decathlon,Badminton court,\n' +
  '25/01/2026,Income,3975.91,Maybank,Salary,,January salary,\n' +
  '26/01/2026,Transfer,500.00,Maybank,,,To ASB,ASB\n';
const CAT_TYPES = ['Expense', 'Savings/Asset', 'Income'];
const BATCH = 250;

/* ── Reading ── */
function splitRows(text) {
  const lines = String(text || '').replace(/^﻿/, '').split(/\r?\n/).filter(x => x.trim());
  if (!lines.length) return [];
  const f = lines[0];
  const delim = f.includes('\t') ? '\t' : (f.split(';').length > f.split(',').length ? ';' : ',');
  return lines.map(line => {
    const out = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === delim) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
  });
}
const COLS = {
  date: ['date', 'tarikh', 'txn date', 'transaction date'],
  type: ['type', 'jenis'],
  amount: ['amount', 'amt', 'jumlah', 'rm'],
  account: ['account', 'from', 'from account', 'akaun', 'bank'],
  category: ['category', 'kategori', 'cat'],
  payee: ['payee', 'merchant', 'shop'],
  desc: ['description', 'desc', 'details', 'note', 'notes', 'remarks'],
  to: ['to account', 'to', 'transfer to']
};
function mapHeader(row) {
  const low = row.map(c => c.toLowerCase());
  if (!low.includes('date') && !low.includes('tarikh')) return null;
  const m = {};
  Object.entries(COLS).forEach(([k, names]) => { m[k] = low.findIndex(c => names.includes(c)); });
  return m;
}
function parseDate(s) {
  const t = String(s || '').trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return parseDMY(iso[3] + '/' + iso[2] + '/' + iso[1]);
  return parseDMY(t);
}
function parseAmount(s) {
  const t = String(s || '').replace(/RM/i, '').replace(/[,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  if (!t) return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
}
function normType(s, amt) {
  const t = String(s || '').trim().toLowerCase();
  if (['expense', 'expenses', 'exp', 'out', 'debit', 'dr', 'belanja'].includes(t)) return 'Expense';
  if (['income', 'in', 'credit', 'cr', 'pendapatan'].includes(t)) return 'Income';
  if (['transfer', 'trf', 'pindahan'].includes(t)) return 'Transfer';
  if (!t && amt !== null) return amt < 0 ? 'Expense' : 'Income';
  return null;
}
const key = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
/** An existing payee that is probably the same as name ("Lotus" ≈ "Lotus's") */
function nearPayee(name) {
  const k = key(name);
  if (k.length < 3) return null;
  return DB.payees.find(p => { const q = key(p.PyName); return q && (q.startsWith(k) || k.startsWith(q) || lev(q, k) <= 2); }) || null;
}

/** Turns raw text into checked rows + the new payees/categories it needs. */
export function analyse(text) {
  const raw = splitRows(text);
  if (!raw.length) return null;
  const hm = mapHeader(raw[0]);
  const m = hm || { date: 0, type: 1, amount: 2, account: 3, category: 4, payee: 5, desc: 6, to: 7 };
  const body = hm ? raw.slice(1) : raw;
  const get = (r, k) => (m[k] >= 0 ? (r[m[k]] || '') : '');
  const accN = n => DB.accounts.find(a => a.AccName.toLowerCase() === String(n).trim().toLowerCase());
  const catN = n => DB.categories.find(c => c.CatName.toLowerCase() === String(n).trim().toLowerCase());
  const payN = n => DB.payees.find(p => p.PyName.toLowerCase() === String(n).trim().toLowerCase());
  const newCats = {}, newPayees = {};
  const rows = body.map((r, i) => {
    const amt0 = parseAmount(get(r, 'amount'));
    const type = normType(get(r, 'type'), amt0);
    const x = { n: i + (hm ? 2 : 1), date: parseDate(get(r, 'date')), type, amt: amt0 === null ? null : round2(Math.abs(amt0)),
      accName: get(r, 'account'), cat: get(r, 'category'), payee: get(r, 'payee'), desc: get(r, 'desc'), toName: get(r, 'to'), errs: [] };
    const a = accN(x.accName), ta = accN(x.toName);
    x.acc = a; x.to = ta;
    if (!x.date) x.errs.push('Date "' + get(r, 'date') + '" is not a date (use dd/mm/yyyy)');
    if (x.amt === null || x.amt === 0) x.errs.push('Amount "' + get(r, 'amount') + '" is not a number');
    if (!type) x.errs.push('Type "' + get(r, 'type') + '" should be Expense, Income or Transfer');
    if (!x.accName) x.errs.push('Account is empty');
    else if (!a) x.errs.push('Account "' + x.accName + '" is not in the app. Add it in Accounts first');
    else if (a.AccType === 'System') x.errs.push('Balance Sweep can\'t be used here');
    if (type === 'Transfer') {
      if (!x.toName) x.errs.push('Transfer needs a "To account"');
      else if (!ta) x.errs.push('To account "' + x.toName + '" is not in the app');
      else if (a && ta.AccId === a.AccId) x.errs.push('From and To are the same account');
    } else if (type) {
      if (!x.cat) x.errs.push('Category is empty');
    }
    if (x.date && stStart() && x.date < stStart()) x.errs.push('Before your tracking start (' + fmtD(stStart(), 'dd mmm yyyy') + ')');
    if (x.date && isLocked(x.date)) x.errs.push('In a closed month (closed until ' + fmtD(lockDate(), 'dd mmm yyyy') + ')');
    if (x.date && x.date > Today()) x.errs.push('Date is in the future');
    if (!x.errs.length && type !== 'Transfer') {
      const c = catN(x.cat);
      if (c) x.cat = c.CatName;
      else {
        const k = x.cat.toLowerCase();
        const nc = Object.values(newCats).find(v => v.name.toLowerCase() === k);
        if (nc) { nc.count++; x.cat = nc.name; }
        else newCats[x.cat] = { name: x.cat, type: type === 'Income' ? 'Income' : 'Expense', count: 1 };
      }
      if (x.payee) {
        const p = payN(x.payee);
        if (p) x.payee = p.PyName;
        else {
          const np = Object.values(newPayees).find(v => v.name.toLowerCase() === x.payee.toLowerCase());
          if (np) { np.count++; x.payee = np.name; }
          else { const near = nearPayee(x.payee); newPayees[x.payee] = { name: x.payee, cat: x.cat, count: 1, near: near ? near.PyName : '' }; }
        }
      }
    }
    if (!x.errs.length) {
      x.dup = DB.txns.some(t => !t.TxParent && t.TxDate === x.date && t.TxAcc === a.AccId && Math.abs(t.TxAmt - x.amt) < 0.005 &&
        (type === 'Transfer' ? t.TxType === 'Transfer' && t.TxDir === 'Out' : t.TxType === type) &&
        (type === 'Transfer' || key(t.TxPayee) === key(x.payee) || key(t.TxDesc) === key(x.desc)));
    }
    return x;
  });
  return { rows, newCats, newPayees };
}

/* ── Screen ── */
export const scrImport = {
  onVisible(l) { if (!l.keep) { l.res = null; l.file = ''; l.payOn = {}; l.paySame = {}; l.catType = {}; l.skipDup = true; } l.keep = false; },
  view(l) {
    const load = (text, name) => {
      const r = analyse(text);
      if (!r || !r.rows.length) return Notify('No rows found. Use the template columns: ' + TEMPLATE_HEAD.join(', ') + '.', 'error');
      l.res = r; l.file = name;
      l.payOn = {}; l.paySame = {}; l.catType = {};
      Object.values(r.newPayees).forEach(p => { l.payOn[p.name] = true; l.paySame[p.name] = !!p.near; });
      Object.values(r.newCats).forEach(c => { l.catType[c.name] = c.type; });
      rerender();
    };
    const pick = () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.csv,.txt,text/csv,text/plain';
      inp.onchange = async () => { const f = inp.files && inp.files[0]; if (f) load(await f.text(), f.name); };
      inp.click();
    };
    const template = async () => {
      const name = 'PocketDreamer-import-template.csv';
      const file = typeof File === 'function' ? new File([TEMPLATE], name, { type: 'text/csv' }) : null;
      try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } }
      catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' })); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    };

    if (!l.res) {
      const step = (y, n, t, s) => html`
        ${C(16, y, 24, 'rgba(255,106,0,0.12)', { b: 'rgba(255,106,0,0.35)' })}${L(16, y, 24, 24, String(n), { s: 8, w: 7, a: 'c', c: K.or })}
        ${L(52, y - 2, 290, 16, t, { s: 9, w: 6 })}${L(52, y + 14, 290, 14, s, { s: 7.5, c: K.sub })}`;
      const kids = html`
        ${Card(null, 0, 366, 254, html`
          ${L(16, 14, 334, 22, 'Bring in past transactions', { s: 11.5, w: 6 })}
          ${L(16, 38, 334, 30, 'Fill the template in Excel, save it as CSV and upload it here. Every row is checked before anything is saved.', { s: 8, c: K.sub, wrap: true })}
          ${step(84, 1, 'Download the template', '8 columns, with 3 example rows to copy')}
          ${step(124, 2, 'Fill one row per transaction', 'Type is Expense, Income or Transfer. Dates as dd/mm/yyyy.')}
          ${step(164, 3, 'Save as CSV and upload', 'Excel: File → Save As → CSV (Comma delimited).')}
          ${B(16, 202, 162, 40, 'Download template', { fill: K.field, b: HAIR, r: 20, s: 9.5, onClick: template, id: 'impTemplate' })}
          ${B(188, 202, 162, 40, 'Choose CSV file', { fill: K.or, c: '#FFFFFF', r: 20, s: 9.5, onClick: pick, id: 'impPick' })}`)}
        ${Box(null, 0, 366, 30, null)}`;
      return html`<div>${DetailHeader('Import transactions')}${Flow(0, 66, 390, 778, kids, { pad: [12, 12, 16, 12], gap: 10 })}</div>`;
    }

    /* ── Preview ── */
    const { rows, newCats, newPayees } = l.res;
    const bad = rows.filter(r => r.errs.length);
    const dups = rows.filter(r => !r.errs.length && r.dup);
    const ok = rows.filter(r => !r.errs.length && !(r.dup && l.skipDup));
    const usedCats = new Set(ok.filter(r => r.type !== 'Transfer').map(r => r.cat));
    const usedPay = new Set(ok.map(r => r.payee));
    const cats = Object.values(newCats).filter(c => usedCats.has(c.name));
    const pays = Object.values(newPayees).filter(p => usedPay.has(p.name));
    const sum = t => round2(ok.filter(r => r.type === t).reduce((s, r) => s + r.amt, 0));
    const dates = ok.map(r => r.date).sort();

    const doImport = () => guard(async () => {
      if (!ok.length) return Notify('Nothing to import. Fix the rows marked in red first.', 'error');
      let seq = nextTxSeq();
      const txs = [];
      const payName = r => {
        if (!r.payee) return { p: '', d: r.desc };
        const np = newPayees[r.payee];
        if (!np) return { p: r.payee, d: r.desc };
        if (np.near && l.paySame[np.name]) return { p: np.near, d: r.desc };
        if (l.payOn[np.name]) return { p: np.name, d: r.desc };
        return { p: '', d: r.desc ? r.desc + ' · ' + r.payee : r.payee };
      };
      ok.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.n - b.n)).forEach(r => {
        if (r.type === 'Transfer') {
          const trf = 'TRF-' + Year(r.date) + '-' + String(seq).padStart(6, '0');
          const desc = r.desc || 'Transfer';
          txs.push(mkTxn({ TxnId: txnId(r.date, seq), TxSeq: seq, TxAcc: r.acc.AccId, TxDate: r.date, TxType: 'Transfer', TxDir: 'Out', TxAmt: r.amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf }));
          txs.push(mkTxn({ TxnId: txnId(r.date, seq + 1), TxSeq: seq + 1, TxAcc: r.to.AccId, TxDate: r.date, TxType: 'Transfer', TxDir: 'In', TxAmt: r.amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf }));
          seq += 2;
        } else {
          const { p, d } = payName(r);
          txs.push(mkTxn({ TxnId: txnId(r.date, seq), TxSeq: seq, TxAcc: r.acc.AccId, TxDate: r.date, TxType: r.type, TxDir: r.type === 'Income' ? 'In' : 'Out', TxAmt: r.amt, TxCat: r.cat, TxPayee: p, TxDesc: d }));
          seq += 1;
        }
      });
      let cs = DB.categories.reduce((m, c) => Math.max(m, c.CatSeq || 0), 0);
      const catRows = cats.map((c, i) => { cs++; const t = l.catType[c.name] || c.type; return { CatId: 'CAT-' + String(cs).padStart(3, '0'), CatSeq: cs, CatName: c.name, CatType: t, CatPL: '', CatFixed: '', CatEss: '', CatBudget: t === 'Expense', CatColor: PALETTE[i % PALETTE.length], CatActive: true }; });
      const payRows = pays.filter(p => !(p.near && l.paySame[p.name]) && l.payOn[p.name]).map(p => ({ PyName: p.name, PyCat: p.cat }));
      const parts = Math.ceil(txs.length / BATCH);
      for (let i = 0; i < parts; i++) {
        const up = { EW_Transactions: txs.slice(i * BATCH, (i + 1) * BATCH) };
        if (i === 0) { if (catRows.length) up.EW_Categories = catRows; if (payRows.length) up.EW_Payees = payRows; }
        await save({ up, log: i === 0 ? [{ AuAction: 'Import', AuRef: 'IMPORT', AuDetail: ok.length + ' transaction(s) from ' + (l.file || 'file') + (catRows.length ? ' · ' + catRows.length + ' new categories' : '') + (payRows.length ? ' · ' + payRows.length + ' new payees' : '') }] : [] });
      }
      Notify('Imported ' + ok.length + ' transaction(s). They are saving to your Google Sheet now.', 'info');
      l.res = null; Back();
    });

    const sumCard = Card(null, 0, 366, 168, html`
      ${L(16, 14, 250, 20, l.file || 'Import', { s: 9, w: 6, c: K.sub })}
      ${L(260, 14, 90, 20, 'Start over', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => { l.res = null; rerender(); }, id: 'impReset' })}
      ${L(16, 36, 334, 32, ok.length + ' ready to import', { s: 17, w: 6, id: 'impReady' })}
      ${L(16, 70, 334, 16, rows.length + ' rows' + (bad.length ? '  ·  ' + bad.length + ' need fixing' : '') + (dups.length ? '  ·  ' + dups.length + ' duplicate' + (dups.length > 1 ? 's' : '') + (l.skipDup ? ' skipped' : ' included') : '') + (dates.length ? '  ·  ' + fmtD(dates[0], 'dd mmm yyyy') + ' – ' + fmtD(dates[dates.length - 1], 'dd mmm yyyy') : ''), { s: 7.5, c: K.sub, id: 'impSummary' })}
      ${Box(16, 96, 334, 58, html`
        ${L(14, 10, 100, 12, 'INCOME', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(14, 25, 104, 20, RM(sum('Income')), { s: 9.5, w: 6, c: K.grn })}
        ${R(117, 12, 1, 34, 'rgba(255,255,255,0.07)')}
        ${L(126, 10, 100, 12, 'EXPENSES', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(126, 25, 104, 20, RM(sum('Expense')), { s: 9.5, w: 6 })}
        ${R(228, 12, 1, 34, 'rgba(255,255,255,0.07)')}
        ${L(236, 10, 90, 12, 'TRANSFERS', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(236, 25, 90, 20, String(ok.filter(r => r.type === 'Transfer').length), { s: 9.5, w: 6 })}`,
        { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}`, { id: 'impSumCard' });

    const PH = p => p.near ? 72 : 52;
    const payCard = pays.length ? Card(null, 0, 366, 50 + pays.reduce((s, p) => s + PH(p), 0), html`
      ${L(16, 14, 250, 20, 'New payees  ·  ' + pays.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 334, 14, 'Ticked payees are added to your list with their category.', { s: 7.5, c: K.sub })}
      ${(() => { let y = 50; return pays.map(p => { const top = y; y += PH(p); const same = p.near && l.paySame[p.name]; return html`
        ${R(16, top, 334, 1, K.sep)}
        ${L(16, top + 8, 230, 18, p.name, { s: 9.5, w: 6, c: same ? K.sub : K.text })}
        ${L(16, top + 26, 230, 14, (same ? 'Will use ' + p.near : 'Category: ' + p.cat) + '  ·  ' + p.count + ' row' + (p.count > 1 ? 's' : ''), { s: 7.5, c: K.mute })}
        ${same ? null : Tog(294, top + 12, 56, 28, !!l.payOn[p.name], v => { l.payOn[p.name] = v; rerender(); })}
        ${p.near ? html`
          ${L(16, top + 44, 130, 22, 'Looks like ' + p.near + '?', { s: 7.5, c: K.gold })}
          ${B(176, top + 42, 84, 24, 'Same', { fill: same ? 'rgba(233,185,73,0.14)' : K.field, b: same ? 'rgba(233,185,73,0.5)' : HAIR, c: same ? K.gold : K.sub, r: 12, s: 7.5, flat: true, onClick: () => { l.paySame[p.name] = true; rerender(); }, id: 'same-' + p.name })}
          ${B(266, top + 42, 84, 24, 'New payee', { fill: !same ? 'rgba(233,185,73,0.14)' : K.field, b: !same ? 'rgba(233,185,73,0.5)' : HAIR, c: !same ? K.gold : K.sub, r: 12, s: 7.5, flat: true, onClick: () => { l.paySame[p.name] = false; rerender(); }, id: 'new-' + p.name })}` : null}`; }); })()}`, { id: 'impPayees' }) : null;

    const catCard = cats.length ? Card(null, 0, 366, 50 + cats.length * 54, html`
      ${L(16, 14, 250, 20, 'New categories  ·  ' + cats.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 334, 14, 'Pick the type. Savings/Asset counts as Savings on Home.', { s: 7.5, c: K.sub })}
      ${cats.map((c, i) => html`
        ${R(16, 50 + i * 54, 334, 1, K.sep)}
        ${L(16, 58 + i * 54, 180, 18, c.name, { s: 9.5, w: 6 })}
        ${L(16, 76 + i * 54, 180, 14, c.count + ' row' + (c.count > 1 ? 's' : ''), { s: 7.5, c: K.mute })}
        ${DD(206, 60 + i * 54, 144, 32, CAT_TYPES, l.catType[c.name] || c.type, v => { l.catType[c.name] = v; rerender(); }, { s: 9, id: 'ctype-' + c.name })}`)}`, { id: 'impCats' }) : null;

    const showBad = bad.slice(0, 8);
    const badCard = bad.length ? Card(null, 0, 366, 50 + showBad.length * 44 + (bad.length > 8 ? 26 : 0), html`
      ${L(16, 14, 250, 20, 'Needs fixing  ·  ' + bad.length, { s: 10.5, w: 6, c: K.red })}
      ${L(16, 32, 334, 14, 'These rows are skipped. Fix them in the file and upload again.', { s: 7.5, c: K.sub })}
      ${showBad.map((r, i) => html`
        ${R(16, 50 + i * 44, 334, 1, K.sep)}
        ${L(16, 56 + i * 44, 60, 16, 'Row ' + r.n, { s: 8, w: 6, c: K.red })}
        ${L(76, 56 + i * 44, 274, 16, r.errs[0], { s: 8, c: K.text })}
        ${L(76, 72 + i * 44, 274, 14, [r.date ? fmtD(r.date, 'dd/mm/yyyy') : '', r.type || '', r.amt !== null ? RM(r.amt) : '', r.accName, r.cat].filter(Boolean).join('  ·  '), { s: 7, c: K.mute })}`)}
      ${bad.length > 8 ? L(16, 50 + showBad.length * 44 + 4, 334, 18, '+ ' + (bad.length - 8) + ' more', { s: 7.5, c: K.mute }) : null}`, { id: 'impBad', b: 'rgba(229,72,77,0.3)' }) : null;

    const dupCard = dups.length ? Card(null, 0, 366, 64, html`
      ${L(16, 12, 250, 20, dups.length + ' already in the app', { s: 10, w: 6 })}
      ${L(16, 32, 260, 16, 'Same date, account, amount and payee', { s: 7.5, c: K.sub })}
      ${L(212, 20, 74, 24, 'Skip', { s: 8, c: K.sub, a: 'r' })}
      ${Tog(294, 18, 56, 28, l.skipDup, v => { l.skipDup = v; rerender(); })}`, { id: 'impDups' }) : null;

    const list = ok.slice(0, 40);
    const rowsCard = Card(null, 0, 366, 50 + Math.max(list.length, 1) * 48 + (ok.length > 40 ? 26 : 0), html`
      ${L(16, 14, 250, 20, 'Rows to import', { s: 10.5, w: 6 })}
      ${list.map((r, i) => html`
        ${R(16, 44 + i * 48, 334, 1, K.sep)}
        ${C(16, 56 + i * 48, 6, r.type === 'Income' ? K.grn : r.type === 'Transfer' ? K.sub : K.red)}
        ${L(30, 50 + i * 48, 200, 18, (r.payee && newPayees[r.payee] && newPayees[r.payee].near && l.paySame[r.payee] ? newPayees[r.payee].near : r.payee) || r.desc || r.cat || r.type, { s: 9, w: 6 })}
        ${L(30, 68 + i * 48, 210, 14, r.type === 'Transfer' ? r.acc.AccName + '  →  ' + r.to.AccName : r.cat + '  ·  ' + r.acc.AccName, { s: 7.5, c: K.sub })}
        ${L(230, 50 + i * 48, 120, 18, (r.type === 'Income' ? '+' : r.type === 'Transfer' ? '' : '−') + RM(r.amt), { s: 9, w: 6, a: 'r', c: r.type === 'Income' ? K.grn : r.type === 'Transfer' ? K.sub : K.text })}
        ${L(230, 68 + i * 48, 120, 14, fmtD(r.date, 'dd mmm yyyy') + (r.dup ? '  ·  dup' : ''), { s: 7.5, c: K.mute, a: 'r' })}`)}
      ${!list.length ? L(16, 50, 334, 30, 'No rows are ready yet.', { s: 8.5, c: K.mute }) : null}
      ${ok.length > 40 ? L(16, 50 + list.length * 48 + 2, 334, 18, '+ ' + (ok.length - 40) + ' more rows', { s: 7.5, c: K.mute }) : null}`, { id: 'impRows' });

    const kids = html`${sumCard}${badCard}${payCard}${catCard}${dupCard}${rowsCard}${Box(null, 0, 366, 90, null)}`;
    return html`<div>
      ${DetailHeader('Import transactions')}
      ${Flow(0, 66, 390, 700, kids, { pad: [12, 12, 16, 12], gap: 10 })}
      ${SaveBar(ok.length ? 'Import ' + ok.length + ' transaction' + (ok.length > 1 ? 's' : '') : 'Nothing to import', doImport, 'impGo')}
    </div>`;
  }
};
