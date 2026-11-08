// Pocket Dreamer — Import past transactions (Settings → Import).
// Two layouts are understood:
//  • Statement:  Date · Payee / Payer · Description · Account Code · Debit · Credit · Balance   (one file = one bank account)
//  • Template:   Date · Type · Amount · Account · Category · Payee · Description · To account
// Excel (.xlsx) and CSV both work. Every row is checked and previewed before anything is saved.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Flow, TI, DD, Tog, Back, Notify, rerender, guard, save, HAIR,
  fmtD, Today, parseDMY, RM, round2, mkTxn, txnId, nextTxSeq, stStart, Year, PALETTE
} from '../core.js';
import { DetailHeader, SaveBar, askPassword, PasswordDialog } from '../shared.js';
import { isLocked, lockDate } from '../sweep.js';

export const TEMPLATE_HEAD = ['Date', 'Payee / Payer', 'Description', 'Account Code', 'Debit', 'Credit', 'Balance'];
const TEMPLATE = TEMPLATE_HEAD.join(',') + '\n' +
  '28/02/26,ANAIKA COLLECTIONS SDN BHD,JAN SALARY,INC,,3548.15,3548.15\n' +
  '28/02/26,MAYBANK SHOPEE (CC),FUND TRANSFER,FTI,188.33,,3359.82\n' +
  '07/03/26,VOODO SNOOKER,SNOOKER,SPT,57.00,,3302.82\n' +
  '07/03/26,AKMAL SAUFI,SNOOKER,SPT,,19.00,3321.82\n';
const CAT_TYPES = ['Expense', 'Savings/Asset', 'Income'];
const TRF = '⇄ Transfer';
const NEWCAT = '＋ New category';
const BATCH = 250;
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } } };

/* ── Reading files ── */
function splitCsv(text) {
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
let xlsxLoading = null;
function loadXlsx() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) xlsxLoading = new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = 'js/vendor/xlsx.mini.min.js';
    s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxLoading = null; bad(new Error('Could not load the Excel reader. Check your connection and try again.')); };
    document.head.appendChild(s);
  });
  return xlsxLoading;
}
/** → [{ name, rows: string[][] }] using the text as shown in Excel (dates like 28/02/26, amounts like 3,548.15) */
export async function readFile(file) {
  if (/\.(xlsx|xlsm|xlsb|xls)$/i.test(file.name)) {
    const X = await loadXlsx();
    const wb = X.read(await file.arrayBuffer(), { type: 'array', cellDates: false });
    return wb.SheetNames.map(n => ({ name: n, rows: X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '', blankrows: false }).map(r => r.map(c => String(c ?? '').trim())) }));
  }
  return [{ name: file.name.replace(/\.[^.]+$/, ''), rows: splitCsv(await file.text()) }];
}

/* ── Columns ── */
const NAMES = {
  date: ['date', 'tarikh', 'txn date', 'transaction date'],
  type: ['type', 'jenis'],
  amount: ['amount', 'amt', 'jumlah'],
  account: ['account', 'from', 'from account', 'akaun', 'bank'],
  category: ['category', 'kategori', 'cat'],
  payee: ['payee', 'payee / payer', 'payee/payer', 'payer', 'merchant', 'shop', 'payee / payor'],
  desc: ['description', 'desc', 'details', 'note', 'notes', 'remarks'],
  to: ['to account', 'to', 'transfer to'],
  code: ['account code', 'code', 'acc code', 'account co', 'kod'],
  debit: ['debit', 'dr', 'money out', 'withdrawal'],
  credit: ['credit', 'cr', 'money in', 'deposit'],
  balance: ['balance', 'baki']
};
const clean = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Finds the header row (it does not have to be the first row) and which layout the file uses. */
export function findHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const low = rows[i].map(clean);
    if (!low.some(c => NAMES.date.includes(c))) continue;
    const m = {};
    Object.entries(NAMES).forEach(([k, names]) => { m[k] = low.findIndex(c => names.includes(c)); });
    if (m.debit >= 0 || m.credit >= 0) return { idx: i, m, mode: 'statement' };
    if (m.amount >= 0) return { idx: i, m, mode: 'template' };
  }
  return null;
}
function parseDate(s) {
  const t = String(s || '').trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return parseDMY(iso[3] + '/' + iso[2] + '/' + iso[1]);
  return parseDMY(t);
}
function parseAmount(s) {
  const t = String(s || '').replace(/RM/i, '').replace(/[,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  if (!t || t === '-') return null;
  const n = Number(t);
  return isFinite(n) ? n : NaN;
}
function normType(s, amt) {
  const t = clean(s);
  if (['expense', 'expenses', 'exp', 'out', 'debit', 'dr', 'belanja'].includes(t)) return 'Expense';
  if (['income', 'in', 'credit', 'cr', 'pendapatan'].includes(t)) return 'Income';
  if (['transfer', 'trf', 'pindahan'].includes(t)) return 'Transfer';
  if (!t && amt !== null && !isNaN(amt)) return amt < 0 ? 'Expense' : 'Income';
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
const similar = (a, b) => { const x = key(a), y = key(b); return !!x && !!y && (x === y || (x.length >= 3 && y.length >= 3 && (x.startsWith(y) || y.startsWith(x) || lev(x, y) <= 2))); };
function nearPayee(name) { return key(name).length < 3 ? null : DB.payees.find(p => similar(p.PyName, name)) || null; }
const accN = n => DB.accounts.find(a => a.AccName.toLowerCase() === String(n).trim().toLowerCase());
const catN = n => DB.categories.find(c => c.CatName.toLowerCase() === String(n).trim().toLowerCase());
const payN = n => DB.payees.find(p => p.PyName.toLowerCase() === String(n).trim().toLowerCase());
const catChoices = () => DB.categories.filter(c => c.CatActive && CAT_TYPES.includes(c.CatType)).map(c => c.CatName).sort((a, b) => a.localeCompare(b));
/** Best guess for a short code such as SPT → Sports (its letters appear in order in the name) */
function guessCode(code) {
  const c = key(code); if (!c) return '';
  const names = catChoices();
  const exact = names.find(n => key(n) === c); if (exact) return exact;
  const fits = names.filter(n => { const k = key(n); if (k[0] !== c[0]) return false; let i = 0; for (const ch of k) if (ch === c[i]) i++; return i === c.length; });
  return fits.sort((a, b) => a.length - b.length)[0] || '';
}
/** Account named in Payee: exact name first, then the closest similar one (never the file's own account) */
function guessAccount(name, skip) {
  const pool = DB.accounts.filter(a => a.AccType !== 'System' && a.AccId !== skip);
  const k = key(name);
  const hit = pool.find(a => key(a.AccName) === k) || pool.filter(a => similar(a.AccName, name)).sort((a, b) => Math.abs(key(a.AccName).length - k.length) - Math.abs(key(b.AccName).length - k.length))[0];
  return hit ? hit.AccId : '';
}

/** Turns the chosen sheet into checked rows (+ the payees/categories/codes it needs). */
export function analyse(sheet, opt = {}) {
  const h = findHeader(sheet.rows);
  if (!h) return null;
  const { m, mode } = h;
  const body = sheet.rows.slice(h.idx + 1).filter(r => r.some(c => c));
  const get = (r, k) => (m[k] >= 0 ? (r[m[k]] || '') : '');
  const newCats = {}, newPayees = {}, codes = {}, trfNames = {};
  const fileAcc = mode === 'statement' ? DB.accounts.find(a => a.AccId === opt.accId) : null;
  const codeMap = opt.codeMap || {}, codeNew = opt.codeNew || {}, trfMap = opt.trfMap || {};
  const rows = [];
  body.forEach((r, i) => {
    const n = h.idx + i + 2;
    const x = { n, date: parseDate(get(r, 'date')), payee: get(r, 'payee'), desc: get(r, 'desc'), errs: [], warns: [] };
    if (!get(r, 'date') && !get(r, 'debit') && !get(r, 'credit') && !get(r, 'amount')) return; // empty / total lines
    if (mode === 'statement') {
      const dr = parseAmount(get(r, 'debit')), cr = parseAmount(get(r, 'credit'));
      x.code = get(r, 'code').toUpperCase();
      x.bal = m.balance >= 0 ? parseAmount(get(r, 'balance')) : null;
      x.dr = dr && dr > 0 ? round2(dr) : 0; x.cr = cr && cr > 0 ? round2(cr) : 0;
      if (Number.isNaN(dr) || Number.isNaN(cr)) x.errs.push('Debit / Credit is not a number');
      else if (x.dr && x.cr) x.errs.push('Both Debit and Credit have an amount');
      else if (!x.dr && !x.cr) x.errs.push('No amount in Debit or Credit');
      x.amt = x.dr || x.cr;
      if (x.code) { const c = codes[x.code] || (codes[x.code] = { code: x.code, count: 0, sample: x.desc || x.payee }); c.count++; }
      const map = codeMap[x.code];
      if (!fileAcc) x.errs.push('Choose which account this file is for');
      else if (!x.code) x.errs.push('Account Code is empty');
      else if (!map) x.errs.push('Code ' + x.code + ' is not linked to a category yet');
      else if (map === TRF) {
        x.type = 'Transfer';
        trfNames[x.payee] = (trfNames[x.payee] || 0) + 1;
        const other = DB.accounts.find(a => a.AccId === trfMap[x.payee]);
        if (!x.payee) x.errs.push('Transfer needs the other account in Payee');
        else if (!other) x.errs.push('"' + x.payee + '" is not linked to an account yet');
        else if (other.AccId === fileAcc.AccId) x.errs.push('Transfer to the same account');
        else if (x.dr) { x.acc = fileAcc; x.to = other; } else { x.acc = other; x.to = fileAcc; }
      } else {
        x.type = x.dr ? 'Expense' : 'Income';
        x.acc = fileAcc;
        if (map === NEWCAT) {
          const nc = codeNew[x.code] || { name: x.code, type: x.dr ? 'Expense' : 'Income' };
          x.cat = nc.name.trim();
          if (!x.cat) x.errs.push('Give the new category for ' + x.code + ' a name');
          else if (!catN(x.cat)) { const e = newCats[x.cat] || (newCats[x.cat] = { name: x.cat, type: nc.type, count: 0, fromCode: x.code }); e.count++; }
        } else x.cat = map;
      }
    } else {
      const amt0 = parseAmount(get(r, 'amount'));
      x.type = normType(get(r, 'type'), amt0);
      x.amt = amt0 === null || Number.isNaN(amt0) ? null : round2(Math.abs(amt0));
      x.accName = get(r, 'account'); x.cat = get(r, 'category'); x.toName = get(r, 'to');
      x.acc = accN(x.accName); x.to = accN(x.toName);
      if (x.amt === null || x.amt === 0) x.errs.push('Amount "' + get(r, 'amount') + '" is not a number');
      if (!x.type) x.errs.push('Type "' + get(r, 'type') + '" should be Expense, Income or Transfer');
      if (!x.accName) x.errs.push('Account is empty');
      else if (!x.acc) x.errs.push('Account "' + x.accName + '" is not in the app. Add it in Accounts first');
      if (x.type === 'Transfer') {
        if (!x.toName) x.errs.push('Transfer needs a "To account"');
        else if (!x.to) x.errs.push('To account "' + x.toName + '" is not in the app');
        else if (x.acc && x.to.AccId === x.acc.AccId) x.errs.push('From and To are the same account');
      } else if (x.type && !x.cat) x.errs.push('Category is empty');
      if (x.type && x.type !== 'Transfer' && x.cat && !catN(x.cat)) {
        const k = x.cat.toLowerCase();
        const nc = Object.values(newCats).find(v => v.name.toLowerCase() === k);
        if (nc) { nc.count++; x.cat = nc.name; } else newCats[x.cat] = { name: x.cat, type: x.type === 'Income' ? 'Income' : 'Expense', count: 1 };
      }
    }
    if (!x.date) x.errs.push('Date "' + get(r, 'date') + '" is not a date (use dd/mm/yyyy)');
    if (x.acc && x.acc.AccType === 'System') x.errs.push('Balance Sweep can\'t be used here');
    if (x.date && stStart() && x.date < stStart()) x.errs.push('Before your tracking start (' + fmtD(stStart(), 'dd mmm yyyy') + ')');
    if (x.date && isLocked(x.date)) x.errs.push('In a closed month (closed until ' + fmtD(lockDate(), 'dd mmm yyyy') + ')');
    if (x.date && x.date > Today()) x.errs.push('Date is in the future');
    if (!x.errs.length && x.type !== 'Transfer') {
      const c = catN(x.cat); if (c) x.cat = c.CatName;
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
      x.dup = DB.txns.some(t => !t.TxParent && t.TxDate === x.date && t.TxAcc === x.acc.AccId && Math.abs(t.TxAmt - x.amt) < 0.005 &&
        (x.type === 'Transfer' ? t.TxType === 'Transfer' && t.TxDir === 'Out' : t.TxType === x.type) &&
        (x.type === 'Transfer' || key(t.TxPayee) === key(x.payee) || key(t.TxDesc) === key(x.desc)));
    }
    rows.push(x);
  });
  // statement: each Balance should equal the one before − Debit + Credit
  if (mode === 'statement' && m.balance >= 0) {
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i];
      if (a.bal == null || b.bal == null || Number.isNaN(a.bal) || Number.isNaN(b.bal)) continue;
      const exp = round2(a.bal - (b.dr || 0) + (b.cr || 0));
      if (Math.abs(exp - b.bal) > 0.009) b.warns.push('Balance should be ' + RM(exp) + ' (file says ' + RM(b.bal) + ')');
    }
  }
  return { mode, rows, newCats, newPayees, codes, trfNames, fileAcc, hasBal: mode === 'statement' && m.balance >= 0 };
}

/* ── Screen ── */
export const scrImport = {
  onVisible(l) {
    if (l.keep) { l.keep = false; return; }
    Object.assign(l, { book: null, sheet: 0, file: '', accId: '', codeMap: {}, codeNew: {}, trfMap: {}, payOn: {}, paySame: {}, catType: {}, skipDup: true, allPay: true });
  },
  view(l) {
    const fileName = 'PocketDreamer-statement-template.csv';
    const open = async f => {
      try {
        const book = await readFile(f);
        const si = book.findIndex(s => findHeader(s.rows));
        if (si < 0) return Notify('No header row found. The file needs columns like ' + TEMPLATE_HEAD.join(', ') + '.', 'error');
        Object.assign(l, { book, sheet: si, file: f.name, codeNew: {}, payOn: {}, paySame: {}, catType: {} });
        // remembered choices from earlier imports, then best guesses
        const mem = store.get('pd_imp_codes', {}), tmem = store.get('pd_imp_trf', {});
        const acc0 = DB.accounts.find(a => a.AccType !== 'System' && (similar(a.AccName, book[si].name) || key(f.name).includes(key(a.AccName))));
        l.accId = (acc0 || {}).AccId || store.get('pd_imp_acc', '') || '';
        const probe = analyse(book[si], { accId: l.accId });
        l.codeMap = {}; l.guessed = {};
        Object.keys(probe.codes).forEach(c => { if (mem[c]) l.codeMap[c] = mem[c]; else { const g = guessCode(c); if (g) { l.codeMap[c] = g; l.guessed[c] = true; } } });
        l.trfMap = {};
        rerender();
      } catch (e) { Notify(e.message || String(e), 'error'); }
    };
    const pick = () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.xlsx,.xlsm,.xls,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
      inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) open(f); };
      inp.click();
    };
    const template = async () => {
      const file = typeof File === 'function' ? new File([TEMPLATE], fileName, { type: 'text/csv' }) : null;
      try { if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: fileName }); return; } }
      catch (e) { if (e && e.name === 'AbortError') return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' })); a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
    };

    if (!l.book) {
      // imports are tagged with their id, so one import can be taken back out
      const meta = store.get('pd_imports', {});
      const groups = {};
      DB.txns.forEach(t => { if (t.TxRule && t.TxRule.startsWith('IMP-')) { const g = groups[t.TxRule] || (groups[t.TxRule] = { id: t.TxRule, ids: [], n: 0, from: t.TxDate, to: t.TxDate }); g.ids.push(t.TxnId); if (!(t.TxType === 'Transfer' && t.TxDir === 'In')) g.n++; if (t.TxDate < g.from) g.from = t.TxDate; if (t.TxDate > g.to) g.to = t.TxDate; } });
      const recent = Object.values(groups).map(g => ({ ...g, file: (meta[g.id] || {}).file || 'Import ' + g.id.slice(4), at: (meta[g.id] || {}).at || '' })).sort((a, b) => (a.id < b.id ? 1 : -1)).slice(0, 3);
      const undo = g => {
        if (DB.txns.some(t => g.ids.includes(t.TxnId) && isLocked(t.TxDate))) return Notify('Part of this import is in a closed month. Reopen it in Accounts → Balance Sweep first.', 'error');
        askPassword(l, 'undo the import of ' + g.n + ' transactions', () => guard(async () => {
          const all = g.ids.concat(DB.txns.filter(t => t.TxParent && g.ids.includes(t.TxParent)).map(t => t.TxnId)); // split lines made later
          await save({ del: { EW_Transactions: all }, log: [{ AuAction: 'Undo import', AuRef: g.id, AuDetail: g.n + ' transaction(s) from ' + g.file + ' removed' }] });
          Notify('Import undone: ' + g.n + ' transaction(s) removed.', 'info');
        }));
      };
      const step = (y, n, t, s) => html`
        ${C(16, y, 24, 'rgba(255,106,0,0.12)', { b: 'rgba(255,106,0,0.35)' })}${L(16, y, 24, 24, String(n), { s: 8, w: 7, a: 'c', c: K.or })}
        ${L(52, y - 2, 290, 16, t, { s: 9, w: 6 })}${L(52, y + 14, 290, 14, s, { s: 7.5, c: K.sub })}`;
      const col = (x, y, w, t, c) => html`${R(x, y, w, 24, 'rgba(255,255,255,0.04)', { r: 6, b: 'rgba(255,255,255,0.06)' })}${L(x, y, w, 24, t, { s: 6.5, w: 6, a: 'c', c: c || K.sub })}`;
      const kids = html`
        ${Card(null, 0, 366, 272, html`
          ${L(16, 14, 334, 22, 'Bring in past transactions', { s: 11.5, w: 6 })}
          ${L(16, 38, 334, 30, 'Upload your Excel or CSV bank sheet. One file is one account. Every row is checked before anything is saved.', { s: 8, c: K.sub, wrap: true })}
          ${L(16, 78, 334, 12, 'COLUMNS', { s: 6, w: 6, c: K.mute, ls: 1.4 })}
          ${col(16, 94, 46, 'Date')}${col(66, 94, 74, 'Payee / Payer')}${col(144, 94, 62, 'Description')}${col(210, 94, 44, 'Code')}${col(258, 94, 44, 'Debit', K.red)}${col(306, 94, 44, 'Credit', K.grn)}
          ${L(16, 122, 334, 14, 'Balance is optional. If it is there, every row is checked against it.', { s: 7, c: K.mute })}
          ${step(152, 1, 'Debit = money out, Credit = money in', 'A Credit under Sports lowers your Sports spending.')}
          ${step(192, 2, 'Link each code once', 'SPT → Sports, FTI → Transfer… remembered next time.')}
          ${step(232, 3, 'Check the preview, then import', 'Rows already in the app are skipped.')}`)}
        ${Box(null, 0, 366, 46, html`
          ${B(0, 0, 150, 46, 'Get template', { fill: 'transparent', b: HAIR, c: K.text, r: 23, s: 9.5, onClick: template, id: 'impTemplate' })}
          ${B(158, 0, 208, 46, 'Choose Excel or CSV', { fill: K.or, c: '#FFFFFF', r: 23, s: 10, onClick: pick, id: 'impPick' })}`)}
        ${recent.length ? Card(null, 0, 366, 50 + recent.length * 56, html`
          ${L(16, 14, 250, 20, 'Recent imports', { s: 10.5, w: 6 })}
          ${L(16, 32, 334, 14, 'Undo removes every transaction from that import.', { s: 7.5, c: K.sub })}
          ${recent.map((g, i) => html`
            ${R(16, 50 + i * 56, 334, 1, K.sep)}
            ${L(16, 58 + i * 56, 230, 18, g.file, { s: 9, w: 6 })}
            ${L(16, 76 + i * 56, 230, 14, g.n + ' transaction' + (g.n > 1 ? 's' : '') + '  ·  ' + fmtD(g.from, 'dd mmm yyyy') + ' – ' + fmtD(g.to, 'dd mmm yyyy'), { s: 7, c: K.mute })}
            ${B(262, 61 + i * 56, 88, 30, 'Undo', { fill: K.field, b: 'rgba(229,72,77,0.45)', c: K.red, r: 15, s: 8.5, onClick: () => undo(g), id: 'undo-' + g.id })}`)}`, { id: 'impRecent' }) : null}
        ${Box(null, 0, 366, 30, null)}`;
      return html`<div>${DetailHeader('Import transactions')}${Flow(0, 66, 390, 778, kids, { pad: [12, 12, 16, 12], gap: 12 })}${PasswordDialog(l)}</div>`;
    }

    /* ── Preview ── */
    const sheet = l.book[l.sheet];
    let res = analyse(sheet, { accId: l.accId, codeMap: l.codeMap, codeNew: l.codeNew, trfMap: l.trfMap });
    // payees used for transfers: fill in remembered or matching accounts the first time they appear
    const tmem = store.get('pd_imp_trf', {});
    const fresh = Object.keys(res.trfNames).filter(nm => !(nm in l.trfMap));
    if (fresh.length) {
      fresh.forEach(nm => { const g = tmem[nm] || guessAccount(nm, l.accId); l.trfMap[nm] = g && g !== l.accId ? g : ''; });
      res = analyse(sheet, { accId: l.accId, codeMap: l.codeMap, codeNew: l.codeNew, trfMap: l.trfMap });
    }
    const { rows, newCats, newPayees, mode } = res;
    const bad = rows.filter(r => r.errs.length);
    const dups = rows.filter(r => !r.errs.length && r.dup);
    const ok = rows.filter(r => !r.errs.length && !(r.dup && l.skipDup));
    const usedCats = new Set(ok.filter(r => r.type !== 'Transfer').map(r => r.cat));
    const usedPay = new Set(ok.map(r => r.payee));
    const cats = Object.values(newCats).filter(c => usedCats.has(c.name) && !c.fromCode);
    const pays = Object.values(newPayees).filter(p => usedPay.has(p.name));
    Object.values(newPayees).forEach(p => { if (l.payOn[p.name] === undefined) l.payOn[p.name] = l.allPay; if (l.paySame[p.name] === undefined) l.paySame[p.name] = !!p.near; });
    const sum = t => round2(ok.filter(r => r.type === t).reduce((s, r) => s + r.amt, 0));
    const dates = ok.map(r => r.date).sort();
    const accs = DB.accounts.filter(a => a.AccStatus !== 'Closed' && a.AccType !== 'System');
    const accName = id => (DB.accounts.find(a => a.AccId === id) || {}).AccName || '';
    const set = (k, v) => { l[k] = v; rerender(); };

    const doImport = () => guard(async () => {
      if (!ok.length) return Notify('Nothing to import yet. Fix the rows marked in red first.', 'error');
      let seq = nextTxSeq();
      const txs = [];
      const impId = 'IMP-' + Date.now().toString(36).toUpperCase();
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
          txs.push(mkTxn({ TxnId: txnId(r.date, seq), TxSeq: seq, TxAcc: r.acc.AccId, TxDate: r.date, TxType: 'Transfer', TxDir: 'Out', TxAmt: r.amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf, TxRule: impId }));
          txs.push(mkTxn({ TxnId: txnId(r.date, seq + 1), TxSeq: seq + 1, TxAcc: r.to.AccId, TxDate: r.date, TxType: 'Transfer', TxDir: 'In', TxAmt: r.amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf, TxRule: impId }));
          seq += 2;
        } else {
          const { p, d } = payName(r);
          txs.push(mkTxn({ TxnId: txnId(r.date, seq), TxSeq: seq, TxAcc: r.acc.AccId, TxDate: r.date, TxType: r.type, TxDir: r.type === 'Income' ? 'In' : 'Out', TxAmt: r.amt, TxCat: r.cat, TxPayee: p, TxDesc: d, TxRule: impId }));
          seq += 1;
        }
      });
      let cs = DB.categories.reduce((mx, c) => Math.max(mx, c.CatSeq || 0), 0);
      const allNew = Object.values(newCats).filter(c => usedCats.has(c.name));
      const catRows = allNew.map((c, i) => { cs++; const t = c.fromCode ? c.type : (l.catType[c.name] || c.type); return { CatId: 'CAT-' + String(cs).padStart(3, '0'), CatSeq: cs, CatName: c.name, CatType: t, CatPL: '', CatFixed: '', CatEss: '', CatBudget: t === 'Expense', CatColor: PALETTE[i % PALETTE.length], CatActive: true }; });
      const payRows = pays.filter(p => !(p.near && l.paySame[p.name]) && l.payOn[p.name]).map(p => ({ PyName: p.name, PyCat: p.cat }));
      const parts = Math.ceil(txs.length / BATCH);
      for (let i = 0; i < parts; i++) {
        const up = { EW_Transactions: txs.slice(i * BATCH, (i + 1) * BATCH) };
        if (i === 0) { if (catRows.length) up.EW_Categories = catRows; if (payRows.length) up.EW_Payees = payRows; }
        await save({ up, log: i === 0 ? [{ AuAction: 'Import', AuRef: impId, AuDetail: ok.length + ' transaction(s) from ' + (l.file || 'file') + (mode === 'statement' ? ' into ' + accName(l.accId) : '') + (catRows.length ? ' · ' + catRows.length + ' new categories' : '') + (payRows.length ? ' · ' + payRows.length + ' new payees' : '') }] : [] });
      }
      if (mode === 'statement') {
        const mem = store.get('pd_imp_codes', {}); Object.entries(l.codeMap).forEach(([c, v]) => { if (v && v !== NEWCAT) mem[c] = v; });
        allNew.forEach(c => { if (c.fromCode) mem[c.fromCode] = c.name; });
        store.set('pd_imp_codes', mem);
        const tm = store.get('pd_imp_trf', {}); Object.entries(l.trfMap).forEach(([p, a]) => { if (a) tm[p] = a; }); store.set('pd_imp_trf', tm);
        store.set('pd_imp_acc', l.accId);
      }
      const meta = store.get('pd_imports', {}); meta[impId] = { file: l.file, at: new Date().toISOString(), n: ok.length }; store.set('pd_imports', meta);
      Notify('Imported ' + ok.length + ' transaction(s). They are saving to your Google Sheet now.', 'info');
      l.book = null; Back();
    });

    // 1. summary
    const sumCard = Card(null, 0, 366, mode === 'statement' ? 236 : 168, html`
      ${L(16, 14, 250, 20, l.file, { s: 9, w: 6, c: K.sub })}
      ${L(260, 14, 90, 20, 'Start over', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => set('book', null), id: 'impReset' })}
      ${L(16, 36, 334, 32, ok.length + ' ready to import', { s: 17, w: 6, id: 'impReady' })}
      ${L(16, 70, 334, 16, rows.length + ' rows' + (bad.length ? '  ·  ' + bad.length + ' need attention' : '') + (dups.length ? '  ·  ' + dups.length + ' already in app' : '') + (dates.length ? '  ·  ' + fmtD(dates[0], 'dd mmm yyyy') + ' – ' + fmtD(dates[dates.length - 1], 'dd mmm yyyy') : ''), { s: 7.5, c: K.sub, id: 'impSummary' })}
      ${Box(16, 96, 334, 58, html`
        ${L(14, 10, 100, 12, mode === 'statement' ? 'CREDIT · IN' : 'INCOME', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(14, 25, 104, 20, RM(mode === 'statement' ? round2(ok.reduce((s, r) => s + (r.cr || 0), 0)) : sum('Income')), { s: 9.5, w: 6, c: K.grn, id: 'impIn' })}
        ${R(117, 12, 1, 34, 'rgba(255,255,255,0.07)')}
        ${L(126, 10, 100, 12, mode === 'statement' ? 'DEBIT · OUT' : 'EXPENSES', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(126, 25, 104, 20, RM(mode === 'statement' ? round2(ok.reduce((s, r) => s + (r.dr || 0), 0)) : sum('Expense')), { s: 9.5, w: 6, c: mode === 'statement' ? K.red : K.text, id: 'impOut' })}
        ${R(228, 12, 1, 34, 'rgba(255,255,255,0.07)')}
        ${L(236, 10, 90, 12, 'TRANSFERS', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(236, 25, 90, 20, String(ok.filter(r => r.type === 'Transfer').length), { s: 9.5, w: 6 })}`,
        { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}
      ${mode === 'statement' ? html`
        ${L(16, 166, 160, 12, 'THIS FILE IS FOR', { s: 6, w: 6, c: K.mute, ls: 1.3 })}
        ${DD(16, 182, l.book.length > 1 ? 160 : 334, 38, ['', ...accs.map(a => a.AccName)], accName(l.accId), v => { l.accId = (accs.find(a => a.AccName === v) || {}).AccId || ''; Object.keys(l.trfMap).forEach(nm => { if (l.trfMap[nm] === l.accId) delete l.trfMap[nm]; }); rerender(); }, { s: 9.5, id: 'impAcc' })}
        ${l.book.length > 1 ? html`${L(184, 166, 160, 12, 'SHEET', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${DD(184, 182, 166, 38, l.book.map(s => s.name), sheet.name, v => set('sheet', l.book.findIndex(s => s.name === v)), { s: 9.5, id: 'impSheet' })}` : null}` : null}`, { id: 'impSumCard' });

    // 2. codes → categories (statement)
    const codeList = Object.values(res.codes).sort((a, b) => b.count - a.count);
    const CH = c => 58 + (l.codeMap[c.code] === NEWCAT ? 46 : 0);
    const codeCard = mode === 'statement' && codeList.length ? Card(null, 0, 366, 52 + codeList.reduce((s, c) => s + CH(c), 0), html`
      ${L(16, 14, 250, 20, 'Your codes  ·  ' + codeList.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 334, 14, 'Link each code to a category or Transfer. Remembered next time.', { s: 7.5, c: K.sub })}
      ${(() => { let y = 52; return codeList.map(c => { const top = y; y += CH(c); const v = l.codeMap[c.code] || ''; const nc = l.codeNew[c.code] || { name: c.code, type: 'Expense' }; return html`
        ${R(16, top, 334, 1, K.sep)}
        ${R(16, top + 13, 46, 24, v ? 'rgba(255,106,0,0.1)' : 'rgba(229,72,77,0.1)', { r: 6, b: v ? 'rgba(255,106,0,0.35)' : 'rgba(229,72,77,0.4)' })}
        ${L(16, top + 13, 46, 24, c.code, { s: 7.5, w: 7, a: 'c', c: v ? K.or : K.red })}
        ${L(70, top + 9, 104, 16, c.count + ' row' + (c.count > 1 ? 's' : ''), { s: 8.5, w: 6 })}
        ${L(70, top + 26, 104, 14, (l.guessed && l.guessed[c.code] && v === l.codeMap[c.code] ? 'guessed · ' : '') + (c.sample || ''), { s: 6.5, c: l.guessed && l.guessed[c.code] ? K.gold : K.mute })}
        ${DD(180, top + 9, 170, 34, ['', TRF, NEWCAT, ...catChoices()], v, val => { l.codeMap[c.code] = val; if (l.guessed) delete l.guessed[c.code]; rerender(); }, { s: 8.5, id: 'code-' + c.code })}
        ${v === NEWCAT ? html`
          ${TI(70, top + 50, 168, 32, nc.name, val => { l.codeNew[c.code] = { ...(l.codeNew[c.code] || nc), name: val }; }, { s: 9, hint: 'Category name', id: 'codeName-' + c.code, onChange: () => rerender() })}
          ${DD(244, top + 50, 106, 32, CAT_TYPES, nc.type, val => { l.codeNew[c.code] = { ...(l.codeNew[c.code] || nc), type: val }; rerender(); }, { s: 8, id: 'codeType-' + c.code })}` : null}`; }); })()}`, { id: 'impCodes' }) : null;

    // 3. transfer payees → accounts (statement)
    const tnames = Object.keys(res.trfNames).sort();
    const trfCard = mode === 'statement' && tnames.length ? Card(null, 0, 366, 52 + tnames.length * 52, html`
      ${L(16, 14, 250, 20, 'Transfer accounts  ·  ' + tnames.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 334, 14, 'Which account is each Payee? Debit = to it, Credit = from it.', { s: 7.5, c: K.sub })}
      ${tnames.map((nm, i) => html`
        ${R(16, 52 + i * 52, 334, 1, K.sep)}
        ${L(16, 58 + i * 52, 160, 18, nm, { s: 9, w: 6, c: l.trfMap[nm] ? K.text : K.red })}
        ${L(16, 76 + i * 52, 160, 14, res.trfNames[nm] + ' row' + (res.trfNames[nm] > 1 ? 's' : ''), { s: 7, c: K.mute })}
        ${DD(180, 60 + i * 52, 170, 34, ['', ...accs.filter(a => a.AccId !== l.accId).map(a => a.AccName)], accName(l.trfMap[nm]), v => { l.trfMap[nm] = (accs.find(a => a.AccName === v) || {}).AccId || ''; rerender(); }, { s: 8.5, id: 'trf-' + nm })}`)}`, { id: 'impTrf' }) : null;

    // 4. balance check (statement with a Balance column)
    let balCard = null;
    if (res.hasBal && l.accId) {
      const wr = rows.filter(r => r.warns.length);
      const last = [...rows].reverse().find(r => r.bal != null && !Number.isNaN(r.bal));
      let after = null;
      if (last && last.date) {
        let b = 0;
        for (const t of DB.txns) if (t.TxAcc === l.accId && !t.TxParent && t.TxDate <= last.date) b += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt;
        ok.forEach(r => { if (r.date <= last.date) { if (r.type === 'Transfer') b += r.to.AccId === l.accId ? r.amt : r.acc.AccId === l.accId ? -r.amt : 0; else b += r.type === 'Income' ? r.amt : -r.amt; } });
        after = round2(b);
      }
      const match = after != null && Math.abs(after - last.bal) < 0.01;
      const H = 108 + Math.min(wr.length, 4) * 22;
      balCard = Card(null, 0, 366, H, html`
        ${C(16, 16, 30, match ? 'rgba(52,199,123,0.12)' : 'rgba(233,185,73,0.12)')}${I(22, 22, 18, 18, match ? 'Check' : 'Clock', match ? K.grn : K.gold, { pad: 1 })}
        ${L(56, 14, 290, 18, match ? 'Balance matches your file' : 'Balance check', { s: 10.5, w: 6 })}
        ${L(56, 32, 290, 14, last ? 'On ' + fmtD(last.date, 'dd mmm yyyy') + ' after import' : 'No balance found', { s: 7.5, c: K.sub })}
        ${Box(16, 56, 334, 42, html`
          ${L(14, 4, 150, 12, 'YOUR FILE', { s: 6, w: 6, c: K.mute, ls: 1.3 })}${L(14, 18, 150, 18, last ? RM(last.bal) : '—', { s: 9.5, w: 6 })}
          ${L(170, 4, 150, 12, 'APP (' + accName(l.accId).toUpperCase() + ')', { s: 6, w: 6, c: K.mute, ls: 1.3, a: 'r' })}${L(170, 18, 150, 18, after != null ? RM(after) : '—', { s: 9.5, w: 6, a: 'r', c: match ? K.grn : K.gold, id: 'impBalApp' })}`,
          { fill: 'rgba(255,255,255,0.025)', r: 10, b: 'rgba(255,255,255,0.05)' })}
        ${wr.slice(0, 4).map((r, i) => L(16, 104 + i * 22, 334, 18, 'Row ' + r.n + ' · ' + r.warns[0], { s: 7.5, c: K.gold }))}
        ${!match && after != null && !wr.length ? L(16, 102, 334, 16, 'Differs by ' + RM(Math.abs(after - last.bal)) + '. Check the opening balance or rows that need attention.', { s: 7, c: K.gold }) : null}`, { id: 'impBal' });
    }

    // 5. rows that need attention
    const showBad = bad.slice(0, 8);
    const badCard = bad.length ? Card(null, 0, 366, 50 + showBad.length * 44 + (bad.length > 8 ? 26 : 0), html`
      ${L(16, 14, 250, 20, 'Needs attention  ·  ' + bad.length, { s: 10.5, w: 6, c: K.red })}
      ${L(16, 32, 334, 14, 'Skipped until fixed. Linking a code or account above fixes many at once.', { s: 7.5, c: K.sub })}
      ${showBad.map((r, i) => html`
        ${R(16, 50 + i * 44, 334, 1, K.sep)}
        ${L(16, 56 + i * 44, 60, 16, 'Row ' + r.n, { s: 8, w: 6, c: K.red })}
        ${L(76, 56 + i * 44, 274, 16, r.errs[0], { s: 8, c: K.text })}
        ${L(76, 72 + i * 44, 274, 14, [r.date ? fmtD(r.date, 'dd/mm/yyyy') : '', r.payee, r.code, r.amt ? RM(r.amt) : ''].filter(Boolean).join('  ·  '), { s: 7, c: K.mute })}`)}
      ${bad.length > 8 ? L(16, 50 + showBad.length * 44 + 4, 334, 18, '+ ' + (bad.length - 8) + ' more', { s: 7.5, c: K.mute }) : null}`, { id: 'impBad', b: 'rgba(229,72,77,0.3)' }) : null;

    // 6. new payees
    const PH = p => p.near ? 72 : 48;
    const payCard = pays.length ? Card(null, 0, 366, 60 + pays.reduce((s, p) => s + PH(p), 0), html`
      ${L(16, 14, 220, 20, 'New payees  ·  ' + pays.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 260, 14, 'Ticked ones are added to your payee list.', { s: 7.5, c: K.sub })}
      ${L(226, 18, 64, 24, 'All', { s: 8, c: K.sub, a: 'r' })}
      ${Tog(294, 16, 56, 28, l.allPay, v => { l.allPay = v; pays.forEach(p => { l.payOn[p.name] = v; }); rerender(); })}
      ${(() => { let y = 56; return pays.map(p => { const top = y; y += PH(p); const same = p.near && l.paySame[p.name]; return html`
        ${R(16, top, 334, 1, K.sep)}
        ${L(16, top + 7, 260, 18, p.name, { s: 9, w: 6, c: same ? K.sub : K.text })}
        ${L(16, top + 25, 260, 14, (same ? 'Will use ' + p.near : p.cat) + '  ·  ' + p.count + ' row' + (p.count > 1 ? 's' : ''), { s: 7, c: K.mute })}
        ${same ? null : Tog(294, top + 10, 56, 28, !!l.payOn[p.name], v => { l.payOn[p.name] = v; rerender(); })}
        ${p.near ? html`
          ${L(16, top + 44, 150, 22, 'Looks like ' + p.near + '?', { s: 7.5, c: K.gold })}
          ${B(176, top + 42, 84, 24, 'Same', { fill: same ? 'rgba(233,185,73,0.14)' : K.field, b: same ? 'rgba(233,185,73,0.5)' : HAIR, c: same ? K.gold : K.sub, r: 12, s: 7.5, flat: true, onClick: () => { l.paySame[p.name] = true; rerender(); }, id: 'same-' + p.name })}
          ${B(266, top + 42, 84, 24, 'New payee', { fill: !same ? 'rgba(233,185,73,0.14)' : K.field, b: !same ? 'rgba(233,185,73,0.5)' : HAIR, c: !same ? K.gold : K.sub, r: 12, s: 7.5, flat: true, onClick: () => { l.paySame[p.name] = false; rerender(); }, id: 'new-' + p.name })}` : null}`; }); })()}`, { id: 'impPayees' }) : null;

    // 7. new categories (template layout)
    const catCard = cats.length ? Card(null, 0, 366, 50 + cats.length * 54, html`
      ${L(16, 14, 250, 20, 'New categories  ·  ' + cats.length, { s: 10.5, w: 6 })}
      ${L(16, 32, 334, 14, 'Pick the type. Savings/Asset counts as Savings on Home.', { s: 7.5, c: K.sub })}
      ${cats.map((c, i) => html`
        ${R(16, 50 + i * 54, 334, 1, K.sep)}
        ${L(16, 58 + i * 54, 180, 18, c.name, { s: 9.5, w: 6 })}
        ${L(16, 76 + i * 54, 180, 14, c.count + ' row' + (c.count > 1 ? 's' : ''), { s: 7.5, c: K.mute })}
        ${DD(206, 60 + i * 54, 144, 32, CAT_TYPES, l.catType[c.name] || c.type, v => { l.catType[c.name] = v; rerender(); }, { s: 9, id: 'ctype-' + c.name })}`)}`, { id: 'impCats' }) : null;

    const dupCard = dups.length ? Card(null, 0, 366, 64, html`
      ${L(16, 12, 250, 20, dups.length + ' already in the app', { s: 10, w: 6 })}
      ${L(16, 32, 260, 16, 'Same date, account, amount and payee', { s: 7.5, c: K.sub })}
      ${L(212, 20, 74, 24, 'Skip', { s: 8, c: K.sub, a: 'r' })}
      ${Tog(294, 18, 56, 28, l.skipDup, v => set('skipDup', v))}`, { id: 'impDups' }) : null;

    // 8. rows
    const list = ok.slice(0, 40);
    const sign = r => r.type === 'Transfer' ? (mode === 'statement' ? (r.dr ? '−' : '+') : '') : r.type === 'Income' ? '+' : '−';
    const tone = r => (mode === 'statement' ? (r.cr ? K.grn : K.text) : r.type === 'Income' ? K.grn : r.type === 'Transfer' ? K.sub : K.text);
    const rowsCard = Card(null, 0, 366, 50 + Math.max(list.length, 1) * 48 + (ok.length > 40 ? 26 : 0), html`
      ${L(16, 14, 250, 20, 'Rows to import', { s: 10.5, w: 6 })}
      ${list.map((r, i) => html`
        ${R(16, 44 + i * 48, 334, 1, K.sep)}
        ${C(16, 56 + i * 48, 6, r.type === 'Transfer' ? K.sub : (mode === 'statement' ? (r.cr ? K.grn : K.red) : r.type === 'Income' ? K.grn : K.red))}
        ${L(30, 50 + i * 48, 200, 18, (r.payee && newPayees[r.payee] && newPayees[r.payee].near && l.paySame[r.payee] ? newPayees[r.payee].near : r.payee) || r.desc || r.cat || r.type, { s: 9, w: 6 })}
        ${L(30, 68 + i * 48, 210, 14, r.type === 'Transfer' ? r.acc.AccName + '  →  ' + r.to.AccName : r.cat + (mode === 'statement' ? (r.desc ? '  ·  ' + r.desc : '') : '  ·  ' + r.acc.AccName), { s: 7.5, c: K.sub })}
        ${L(230, 50 + i * 48, 120, 18, sign(r) + RM(r.amt), { s: 9, w: 6, a: 'r', c: tone(r) })}
        ${L(230, 68 + i * 48, 120, 14, fmtD(r.date, 'dd mmm yyyy') + (r.dup ? '  ·  dup' : ''), { s: 7.5, c: K.mute, a: 'r' })}`)}
      ${!list.length ? L(16, 50, 334, 30, 'No rows are ready yet.', { s: 8.5, c: K.mute }) : null}
      ${ok.length > 40 ? L(16, 50 + list.length * 48 + 2, 334, 18, '+ ' + (ok.length - 40) + ' more rows', { s: 7.5, c: K.mute }) : null}`, { id: 'impRows' });

    const kids = html`${sumCard}${codeCard}${trfCard}${balCard}${badCard}${payCard}${catCard}${dupCard}${rowsCard}${Box(null, 0, 366, 90, null)}`;
    return html`<div>
      ${DetailHeader('Import transactions')}
      ${Flow(0, 66, 390, 700, kids, { pad: [12, 12, 16, 12], gap: 10 })}
      ${SaveBar(ok.length ? 'Import ' + ok.length + ' transaction' + (ok.length > 1 ? 's' : '') : 'Nothing to import yet', doImport, 'impGo')}
    </div>`;
  }
};
