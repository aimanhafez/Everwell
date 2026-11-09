/**
 * MANSWELL — Google Apps Script backend (Pocket + Lens). Formerly Everwell / Dreamer.
 * "Live well today. Build well for tomorrow."
 *
 * Each tab in your Google Sheet plays the part of one SharePoint list:
 *   EW_Settings, EW_Accounts, EW_Categories, EW_Payees, EW_Recurring,
 *   EW_Transactions, EW_ActivityLog
 *
 * ONE-TIME SETUP
 *   1. Open your Everwell Google Sheet > Extensions > Apps Script.
 *   2. Replace everything in Code.gs with this file and press Save.
 *   3. Choose "setupEverwell" in the toolbar and press Run (approve the permissions).
 *   4. Copy the API key shown in the Execution log.
 *   5. Deploy > New deployment > Web app.  Execute as: Me.  Who has access: Anyone.
 *      Copy the Web app URL (it ends with /exec).
 *
 * Helpers you can run from the editor: showApiKey(), resetApiKey()
 */

var EW_VERSION = '3.1.0';

// Column layout of each tab. The first column is the unique key.
var TABLES = {
  EW_Settings: { key: 'Title', cols: { Title: 's', StStart: 'd', StCycleDay: 'n', StLowBal: 'n', StCurrency: 's', StSweepAuto: 'b', StSweepFrom: 'n', StSweepLog: 's' } },
  EW_Accounts: { key: 'AccId', cols: { AccId: 's', AccSeq: 'n', AccName: 's', AccShort: 's', AccColor: 's', AccType: 's', AccClass: 's', AccOpenDate: 'd', AccOB: 'n', AccLimit: 'n', AccDueDay: 'n', AccStatus: 's', AccRemarks: 's', AccSweep: 's' } },
  EW_Categories: { key: 'CatId', cols: { CatId: 's', CatSeq: 'n', CatName: 's', CatType: 's', CatPL: 's', CatFixed: 's', CatEss: 's', CatBudget: 'b', CatColor: 's', CatActive: 'b' } },
  EW_Payees: { key: 'PyName', cols: { PyName: 's', PyCat: 's' } },
  EW_Recurring: { key: 'RcId', cols: { RcId: 's', RcSeq: 'n', RcName: 's', RcAcc: 's', RcType: 's', RcAmt: 'n', RcCat: 's', RcPayee: 's', RcFreq: 's', RcNext: 'd', RcMode: 's', RcActive: 'b' } },
  EW_Transactions: { key: 'TxnId', cols: { TxnId: 's', TxSeq: 'n', TxAcc: 's', TxDate: 'd', TxType: 's', TxDir: 's', TxAmt: 'n', TxCat: 's', TxPayee: 's', TxDesc: 's', TxNote: 's', TxTrf: 's', TxRef: 's', TxParent: 's', TxIsSplit: 'b', TxRule: 's' } },
  EW_ActivityLog: { key: 'AuId', cols: { AuId: 's', AuWhen: 't', AuAction: 's', AuRef: 's', AuDetail: 's' } },
  // Dreamer: what Import remembers, shared by every device
  SYS_ImportMap: { key: 'MapKey', cols: { MapKey: 's', MapKind: 's', MapFrom: 's', MapTo: 's', MapWhen: 't' } },
  SYS_Imports: { key: 'ImpId', cols: { ImpId: 's', ImpFile: 's', ImpAcc: 's', ImpRows: 'n', ImpFrom: 'd', ImpTo: 'd', ImpWhen: 't', ImpStatus: 's' } },
  // Pocket · Payslip: one row per payslip line (month|item). Net pay is linked to the Salary transaction.
  EW_Payslips: { key: 'PsKey', cols: { PsKey: 's', PsMonth: 's', PsItem: 's', PsName: 's', PsGroup: 's', PsAmt: 'n', PsSeq: 'n', PsTxn: 's' } },
  // MansWell Lens: its own tabs. Lens only reads Pocket's tabs; it writes here and nowhere else.
  LN_Settings: { key: 'LsKey', cols: { LsKey: 's', LsVal: 's' } },
  LN_Assets: { key: 'AsId', cols: { AsId: 's', AsSeq: 'n', AsName: 's', AsKind: 's', AsCat: 's', AsAcc: 's', AsOpen: 'n', AsLiq: 'n', AsMonthly: 'n', AsNote: 's', AsActive: 'b' } },
  LN_Values: { key: 'VaId', cols: { VaId: 's', VaAsset: 's', VaDate: 'd', VaKind: 's', VaAmt: 'n', VaNote: 's' } },
  LN_Goals: { key: 'GoId', cols: { GoId: 's', GoSeq: 'n', GoName: 's', GoKind: 's', GoTarget: 'n', GoBy: 's', GoAsset: 's', GoHave: 'n', GoActive: 'b' } },
  LN_Budget: { key: 'BuKey', cols: { BuKey: 's', BuYear: 'n', BuItem: 's', BuAmt: 'n', BuType: 's' } }
};
var WRITE_ACTIONS = ['commit', 'startFresh'];

// Starter categories (the same idea as your SharePoint EW_Categories list). Edit them in the app.
var SEED_CATEGORIES = [
  ['F&B', 'Expense', '#FF6A00'], ['Groceries', 'Expense', '#34C77B'], ['Transport', 'Expense', '#1E6BD6'],
  ['Fuel', 'Expense', '#E9B949'], ['Sports', 'Expense', '#7B3FE4'], ['Shopping', 'Expense', '#A3236F'],
  ['Bills & Utilities', 'Expense', '#E5484D'], ['Housing', 'Expense', '#626872'], ['Health', 'Expense', '#34C77B'],
  ['Entertainment', 'Expense', '#7B3FE4'], ['Travel', 'Expense', '#1E6BD6'], ['Education', 'Expense', '#E9B949'],
  ['Personal Care', 'Expense', '#A3236F'], ['Gifts & Donations', 'Expense', '#E5484D'], ['Insurance', 'Expense', '#626872'],
  ['Bank Charges', 'Expense', '#626872'], ['Others', 'Expense', '#626872'],
  ['Savings', 'Savings/Asset', '#34C77B'], ['Investment', 'Savings/Asset', '#1E6BD6'],
  ['Salary', 'Income', '#34C77B'], ['Bonus', 'Income', '#E9B949'], ['Side Income', 'Income', '#FF6A00'],
  ['Interest & Dividends', 'Income', '#1E6BD6'], ['Other Income', 'Income', '#626872'],
  ['Transfer', 'Transfer', '#808B96'], ['Opening Balance', 'System', '#808B96']
];

/* ───────────────────────── Editor helpers ───────────────────────── */

function setupEverwell() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from Extensions > Apps Script inside your Everwell Google Sheet.');
  var props = PropertiesService.getScriptProperties();
  props.setProperty('SHEET_ID', ss.getId());
  var key = props.getProperty('API_KEY');
  if (!key) { key = makeKey_(); props.setProperty('API_KEY', key); }
  ensureTables_(ss);
  if (readTable_(ss, 'EW_Categories').length === 0) {
    var rows = SEED_CATEGORIES.map(function (c, i) {
      return { CatId: 'CAT-' + pad_(i + 1, 3), CatSeq: i + 1, CatName: c[0], CatType: c[1], CatPL: '', CatFixed: 'Variable', CatEss: 'Essential', CatBudget: c[1] === 'Expense', CatColor: c[2], CatActive: true };
    });
    upsertRows_(ss, 'EW_Categories', rows);
  }
  var blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1 && blank.getLastRow() === 0) ss.deleteSheet(blank);
  Logger.log('Everwell is set up. Your API key is:  ' + key);
  return key;
}

function showApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  Logger.log(key ? 'Your API key is:  ' + key : 'No key yet. Run setupEverwell first.');
  return key;
}

function resetApiKey() {
  var key = makeKey_();
  PropertiesService.getScriptProperties().setProperty('API_KEY', key);
  Logger.log('New API key:  ' + key + '   (enter it again in Everwell)');
  return key;
}

/* ───────────────────────── Web app ───────────────────────── */

function doGet() {
  return json_({ ok: true, app: 'Everwell', version: EW_VERSION, message: 'Everwell API is running. Connect from the app.' });
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'Invalid request.' }); }
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!key) return json_({ ok: false, error: 'Server not set up yet. Run setupEverwell in Apps Script.' });
  if (!req.key || String(req.key) !== key) return json_({ ok: false, code: 'AUTH', error: 'Wrong API key.' });
  var fn = ACTIONS[req.action];
  if (!fn) return json_({ ok: false, error: 'Unknown action: ' + req.action });
  var lock = WRITE_ACTIONS.indexOf(req.action) >= 0 ? LockService.getScriptLock() : null;
  try {
    if (lock) lock.waitLock(25000);
    var ss = getSs_();
    if (req.action === 'bootstrap' || req.action === 'startFresh') ensureTables_(ss);
    return json_({ ok: true, data: fn(ss, req.payload || {}) });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  } finally {
    if (lock) lock.releaseLock();
  }
}

var ACTIONS = {
  ping: function () { return { version: EW_VERSION }; },

  /** Everything the app needs, in one call (the app's OnStart). */
  bootstrap: function (ss) {
    var log = readTable_(ss, 'EW_ActivityLog');
    log.sort(function (a, b) { return a.AuWhen < b.AuWhen ? 1 : -1; });
    var st = readTable_(ss, 'EW_Settings')[0] || null;
    return {
      version: EW_VERSION,
      settings: st,
      accounts: readTable_(ss, 'EW_Accounts'),
      categories: readTable_(ss, 'EW_Categories'),
      payees: readTable_(ss, 'EW_Payees'),
      recurring: readTable_(ss, 'EW_Recurring'),
      transactions: readTable_(ss, 'EW_Transactions'),
      activity: log.slice(0, 30),
      importMap: readTable_(ss, 'SYS_ImportMap'),
      imports: readTable_(ss, 'SYS_Imports'),
      payslips: readTable_(ss, 'EW_Payslips'),
      lens: { settings: readTable_(ss, 'LN_Settings'), assets: readTable_(ss, 'LN_Assets'), values: readTable_(ss, 'LN_Values'), goals: readTable_(ss, 'LN_Goals'), budget: readTable_(ss, 'LN_Budget') },
      serverTime: new Date().toISOString()
    };
  },

  /** Every activity-log entry, newest first (Settings → Activity log). */
  activityAll: function (ss) {
    var log = readTable_(ss, 'EW_ActivityLog');
    log.sort(function (a, b) { return a.AuWhen < b.AuWhen ? 1 : -1; });
    return log.slice(0, 2000);
  },

  /** History entries for given references (transaction detail screen). */
  activityFor: function (ss, p) {
    var refs = p.refs || [];
    return readTable_(ss, 'EW_ActivityLog').filter(function (r) { return refs.indexOf(r.AuRef) >= 0; });
  },

  /**
   * Apply a batch of changes: { upserts: {Table: [rows]}, deletes: {Table: [keys]}, log: [{AuAction, AuRef, AuDetail}] }
   */
  commit: function (ss, p) {
    var del = p.deletes || {}, ups = p.upserts || {};
    var touched = Object.keys(del).concat(Object.keys(ups));
    if (touched.some(function (t) { return !ss.getSheetByName(t); })) ensureTables_(ss);
    Object.keys(del).forEach(function (t) { checkTable_(t); deleteRows_(ss, t, del[t]); });
    Object.keys(ups).forEach(function (t) { checkTable_(t); upsertRows_(ss, t, ups[t]); });
    var logged = (p.log || []).map(function (l) {
      return { AuId: String(l.AuId || ('AU-' + Utilities.getUuid().replace(/-/g, '').slice(0, 12))), AuWhen: String(l.AuWhen || new Date().toISOString()), AuAction: String(l.AuAction || ''), AuRef: String(l.AuRef || ''), AuDetail: String(l.AuDetail || '') };
    });
    if (logged.length) upsertRows_(ss, 'EW_ActivityLog', logged);
    return { logged: logged };
  },

  /** Settings → Start fresh: removes accounts, transactions, recurring and the log. Keeps categories and payees. */
  startFresh: function (ss) {
    ['EW_Transactions', 'EW_Accounts', 'EW_Recurring', 'EW_ActivityLog', 'SYS_Imports'].forEach(function (t) {
      var sh = ss.getSheetByName(t);
      if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
    });
    var st = readTable_(ss, 'EW_Settings')[0];
    if (st) { st.StStart = ''; upsertRows_(ss, 'EW_Settings', [st]); }
    return { done: true };
  }
};

/* ───────────────────────── Sheet helpers ───────────────────────── */

function getSs_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // fastest: the sheet this script is attached to
  if (ss) return ss;
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  throw new Error('Sheet not linked. Run setupEverwell in Apps Script.');
}

function checkTable_(t) { if (!TABLES[t]) throw new Error('Unknown table ' + t); }

function ensureTables_(ss) {
  Object.keys(TABLES).forEach(function (name) {
    var headers = Object.keys(TABLES[name].cols);
    var sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
      sh.setFrozenRows(1);
      return;
    }
    var cur = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
    headers.forEach(function (h) {
      if (cur.indexOf(h) < 0) { sh.getRange(1, cur.length + 1).setValue(h); cur.push(h); }
    });
  });
}

function headers_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
}

function readTable_(ss, name) {
  var def = TABLES[name];
  var sh = ss.getSheetByName(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var hdr = values[0].map(String);
  var tz = ss.getSpreadsheetTimeZone ? ss.getSpreadsheetTimeZone() : Session.getScriptTimeZone();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!String(r[0] === undefined ? '' : r[0]).trim()) continue;
    var o = {};
    hdr.forEach(function (h, c) {
      var t = def.cols[h];
      if (!t) return;
      o[h] = fromCell_(r[c], t, tz);
    });
    out.push(o);
  }
  return out;
}

function fromCell_(v, t, tz) {
  var isDate = Object.prototype.toString.call(v) === '[object Date]';
  if (t === 'n') return v === '' || v === null ? 0 : (Number(v) || 0);
  if (t === 'b') return v === true || String(v).toUpperCase() === 'TRUE';
  if (t === 'd') return isDate ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v || '').slice(0, 10);
  if (t === 't') return isDate ? v.toISOString() : String(v || '');
  if (v === null || v === undefined) return '';
  return isDate ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v);
}

function toCell_(v, t) {
  if (t === 'n') return Number(v) || 0;
  if (t === 'b') return !!v;
  if (v === null || v === undefined || v === '') return '';
  return "'" + String(v); // keep text, dates and IDs exactly as typed (never auto-converted, never formulas)
}

function upsertRows_(ss, name, rows) {
  if (!rows || !rows.length) return;
  var def = TABLES[name];
  var sh = ss.getSheetByName(name);
  var hdr = headers_(sh);
  var keyCol = hdr.indexOf(def.key);
  var index = {};
  var last = sh.getLastRow();
  if (last >= 2) {
    sh.getRange(2, keyCol + 1, last - 1, 1).getValues().forEach(function (r, i) { index[String(r[0])] = i + 2; });
  }
  var appends = [];
  rows.forEach(function (row) {
    var k = String(row[def.key] || '');
    if (!k) throw new Error(name + ': missing ' + def.key);
    var arr = hdr.map(function (h) { return def.cols[h] ? toCell_(row[h], def.cols[h]) : ''; });
    if (index[k]) {
      sh.getRange(index[k], 1, 1, arr.length).setValues([arr]);
    } else {
      appends.push(arr);
      index[k] = -1;
    }
  });
  if (appends.length) sh.getRange(sh.getLastRow() + 1, 1, appends.length, hdr.length).setValues(appends);
}

function deleteRows_(ss, name, keys) {
  if (!keys || !keys.length) return;
  var def = TABLES[name];
  var sh = ss.getSheetByName(name);
  var last = sh.getLastRow();
  if (last < 2) return;
  var keyCol = headers_(sh).indexOf(def.key);
  var want = {};
  keys.forEach(function (k) { want[String(k)] = true; });
  var rowsToDelete = [];
  sh.getRange(2, keyCol + 1, last - 1, 1).getValues().forEach(function (r, i) { if (want[String(r[0])]) rowsToDelete.push(i + 2); });
  rowsToDelete.sort(function (a, b) { return b - a; }).forEach(function (n) { sh.deleteRow(n); });
}

/* ───────────────────────── Utilities ───────────────────────── */

function makeKey_() { return 'ew_' + (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }
function pad_(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
