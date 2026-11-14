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
 * Helpers you can run from the editor: showApiKey(), resetApiKey(), backupNow(), turnOnWeeklyBackup(), setupPassport(), setupVoyage()
 *
 * 3.5.3 · Voyage place search also looks up named places (viewpoints, homestays, cafes) from OpenStreetMap, searches near
 *   your last stop, and never replaces the name you typed. Run setupVoyage() once (it now needs "connect to an external service").
 *
 * 3.5.1 · fix: Voyage heights were missing on long days (the route sent to Google's elevation service was too long).
 *   Make track again on those days to get the elevation.
 *
 * 3.5.0 · VOYAGE (Logbook renamed): places found as you type (Google Maps), travel time from your arrival times,
 *   km always from the GPX track, Discovery page (journey badges + what you found). New tab LB_Finds.
 *   If you already ran setupLogbook() for 3.4.0 there is nothing new to approve: paste, save, deploy a new version.
 *
 * 3.4.0 · LOGBOOK (fourth room): itinerary, expenses (cash in local currency, card in MYR), budget,
 *   results, and a GPX track made from your stops with Google Maps (route + elevation).
 *   Run setupLogbook() once from this editor so Google can ask for Maps permission, then deploy a new version.
 *
 * 3.3.0 · ATLAS (Passport renamed): Wanderlist tiers and "I'm going", route places per country.
 *   New columns only (PP_Places, PP_Stops); they are added to your Sheet by themselves.
 *
 * 3.2.1 · PASSPORT PHOTOS: run setupPassport() once from this editor and approve Google Drive.
 *   Google only asks for Drive permission when you run something here yourself, never from the app.
 *
 * 3.2.0 · PASSPORT (travel)
 *   - New tabs PP_Settings, PP_Places, PP_Trips, PP_Stops, PP_Photos, PP_Thumbs. Travel only: nothing here
 *     reads or changes Pocket or Lens tabs.
 *   - Photos: the full photo is saved in Drive › "MansWell Passport" (one folder per trip), private to you.
 *     PP_Thumbs keeps a small preview of each photo so lists open fast.
 *
 * 3.1.6 · YEAR LOCK + WEEKLY BACKUP
 *   - A closed year is locked here too: commit refuses any transaction or payslip on or before
 *     EW_Settings.StYears.closedThrough. Edit the Sheet by hand if you ever need to change it.
 *   - Weekly backup: a full copy of this Google Sheet goes to Drive › "MansWell Backups" every Sunday
 *     around 3 am, newest 12 kept. Turn it on from the app (Pocket › Settings) or run turnOnWeeklyBackup().
 *     Deploying this version asks Google for permission to use your Drive and triggers: approve it.
 */

var EW_VERSION = '3.5.3';

// Column layout of each tab. The first column is the unique key.
var TABLES = {
  EW_Settings: { key: 'Title', cols: { Title: 's', StStart: 'd', StCycleDay: 'n', StLowBal: 'n', StCurrency: 's', StSweepAuto: 'b', StSweepFrom: 'n', StSweepLog: 's', StYears: 's' } },
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
  LN_Budget: { key: 'BuKey', cols: { BuKey: 's', BuYear: 'n', BuItem: 's', BuAmt: 'n', BuType: 's' } },
  // MansWell Passport (travel): its own tabs, never linked to money.
  PP_Settings: { key: 'PsetKey', cols: { PsetKey: 's', PsetVal: 's' } },
  PP_Places: { key: 'PlIso', cols: { PlIso: 's', PlStatus: 's', PlPri: 's', PlYear: 'n', PlWhy: 's', PlSee: 's', PlNote: 's', PlSeq: 'n', PlPhoto: 's', PlAdded: 'd', PlFirst: 's', PlTier: 's', PlGo: 's', PlGoYear: 'n', PlGoDays: 'n' } },
  PP_Trips: { key: 'TrId', cols: { TrId: 's', TrName: 's', TrStart: 'd', TrEnd: 'd', TrWith: 's', TrDesc: 's', TrMoments: 's', TrNotes: 's', TrRoute: 's', TrCover: 's', TrAdded: 't' } },
  PP_Stops: { key: 'StKey', cols: { StKey: 's', StTrip: 's', StIso: 's', StDays: 'n', StSeq: 'n', StRoute: 's' } },
  PP_Photos: { key: 'PhId', cols: { PhId: 's', PhTrip: 's', PhFile: 's', PhW: 'n', PhH: 'n', PhTaken: 'd', PhCap: 's', PhSeq: 'n' } },
  PP_Thumbs: { key: 'ThId', cols: { ThId: 's', ThData: 's' } },
  // MansWell Voyage (was Logbook): the detail of each Atlas journey (linked by its TrId). Travel only.
  LB_Stops: { key: 'LpId', cols: { LpId: 's', LpTrip: 's', LpDay: 'n', LpSeq: 'n', LpPlace: 's', LpCity: 's', LpCountry: 's', LpArr: 's', LpStay: 'n', LpMode: 's', LpKm: 'n', LpMin: 'n', LpNote: 's', LpLat: 'n', LpLng: 'n', LpAddr: 's' } },
  LB_Tracks: { key: 'TkKey', cols: { TkKey: 's', TkTrip: 's', TkDay: 'n', TkPoly: 's', TkEle: 's', TkKm: 'n', TkMin: 'n', TkUp: 'n', TkDown: 'n', TkMax: 'n', TkLegs: 's', TkSrc: 's', TkWhen: 't' } },
  LB_Expenses: { key: 'ExId', cols: { ExId: 's', ExTrip: 's', ExDay: 'n', ExCat: 's', ExWhat: 's', ExPay: 's', ExAmt: 'n', ExCur: 's', ExRate: 'n', ExMyr: 'n', ExBill: 'n', ExBillCur: 's', ExSeq: 'n' } },
  LB_Budget: { key: 'BgKey', cols: { BgKey: 's', BgTrip: 's', BgCat: 's', BgAmt: 'n' } },
  LB_Rates: { key: 'RtKey', cols: { RtKey: 's', RtTrip: 's', RtCur: 's', RtRate: 'n', RtDate: 'd' } },
  LB_Results: { key: 'RsTrip', cols: { RsTrip: 's', RsRoads: 'n', RsScenery: 'n', RsComfort: 'n', RsFood: 'n', RsValue: 'n', RsVerdict: 's', RsBack: 's', RsKmMode: 's', RsBadges: 's' } },
  LB_Finds: { key: 'FdId', cols: { FdId: 's', FdTrip: 's', FdKind: 's', FdName: 's', FdWhere: 's', FdDay: 'n', FdNote: 's', FdLat: 'n', FdLng: 'n', FdSeq: 'n' } }
};
var WRITE_ACTIONS = ['commit', 'startFresh', 'ppPhotoUp', 'ppPhotoDel', 'lbRoute', 'lbGpxSave'];

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
      logbook: { stops: readTable_(ss, 'LB_Stops'), tracks: readTable_(ss, 'LB_Tracks'), expenses: readTable_(ss, 'LB_Expenses'), budget: readTable_(ss, 'LB_Budget'), rates: readTable_(ss, 'LB_Rates'), results: readTable_(ss, 'LB_Results'), finds: readTable_(ss, 'LB_Finds') },
      passport: { settings: readTable_(ss, 'PP_Settings'), places: readTable_(ss, 'PP_Places'), trips: readTable_(ss, 'PP_Trips'), stops: readTable_(ss, 'PP_Stops'), photos: readTable_(ss, 'PP_Photos') },
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
    var lockMsg = closedYearBlock_(ss, ups, del);
    if (lockMsg) throw new Error(lockMsg);
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

  /** Passport · save one photo: the full photo goes to Drive, a small preview to PP_Thumbs, its row to PP_Photos. */
  ppPhotoUp: function (ss, p) {
    if (!p.id || !p.data) throw new Error('No photo to save.');
    ensureTables_(ss);
    var blob = Utilities.newBlob(Utilities.base64Decode(String(p.data)), 'image/jpeg', String(p.id) + '.jpg');
    var file;
    try { file = ppFolder_(String(p.folder || 'Photos')).createFile(blob); } catch (e) { throw driveErr_(e); }
    var row = { PhId: String(p.id), PhTrip: String(p.trip || ''), PhFile: file.getId(), PhW: Number(p.w) || 0, PhH: Number(p.h) || 0, PhTaken: String(p.taken || ''), PhCap: String(p.cap || ''), PhSeq: Number(p.seq) || 0 };
    upsertRows_(ss, 'PP_Photos', [row]);
    if (p.thumb) upsertRows_(ss, 'PP_Thumbs', [{ ThId: row.PhId, ThData: String(p.thumb) }]);
    return row;
  },
  /** Passport · small previews for a list of photos. */
  ppThumbs: function (ss, p) {
    var want = {}, out = {}; (p.ids || []).forEach(function (i) { want[String(i)] = true; });
    if (!ss.getSheetByName('PP_Thumbs')) return out;
    readTable_(ss, 'PP_Thumbs').forEach(function (r) { if (want[r.ThId]) out[r.ThId] = r.ThData; });
    return out;
  },
  /** Passport · one full photo from Drive. */
  ppPhoto: function (ss, p) {
    var row = readTable_(ss, 'PP_Photos').filter(function (r) { return r.PhId === String(p.id); })[0];
    if (!row || !row.PhFile) throw new Error('Photo not found.');
    var bytes; try { bytes = DriveApp.getFileById(row.PhFile).getBlob().getBytes(); } catch (e) { throw driveErr_(e); }
    return { id: row.PhId, data: 'data:image/jpeg;base64,' + Utilities.base64Encode(bytes) };
  },
  /** Passport · delete photos: their Drive files go to the bin, their rows are removed. */
  ppPhotoDel: function (ss, p) {
    var ids = (p.ids || []).map(String), want = {}; ids.forEach(function (i) { want[i] = true; });
    readTable_(ss, 'PP_Photos').forEach(function (r) { if (want[r.PhId] && r.PhFile) { try { DriveApp.getFileById(r.PhFile).setTrashed(true); } catch (e) { /* already gone */ } } });
    deleteRows_(ss, 'PP_Photos', ids); deleteRows_(ss, 'PP_Thumbs', ids);
    return { deleted: ids.length };
  },

  /** Voyage · find a place (Google Maps). Up to 3 matches. */
  lbGeocode: function (ss, p) {
    var q = String(p.q || '').trim(), cn = String(p.country || ''), region = String(p.region || '').toUpperCase(), n = Number(p.n) || 3, near = p.near || null, out = [];
    if (!q) return out;
    // 1 · named places (viewpoints, homestays, cafes, passes) from OpenStreetMap via Photon. Google's geocoder only knows addresses
    //     and areas, so a small place like a viewpoint came back as its district.
    try {
      var url = 'https://photon.komoot.io/api/?limit=8&q=' + encodeURIComponent(q) + (near && near.lat ? '&lat=' + Number(near.lat).toFixed(3) + '&lon=' + Number(near.lng).toFixed(3) : '');
      var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': 'MansWell-Voyage/3.5 (personal travel log)' } });
      if (res.getResponseCode() === 200) (JSON.parse(res.getContentText()).features || []).forEach(function (f) {
        var pr = f.properties || {}, cc = String(pr.countrycode || '').toUpperCase();
        if (!pr.name || (region && cc && cc !== region)) return;
        var city = pr.city || pr.county || pr.district || pr.state || '';
        out.push({ name: pr.name, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], addr: [pr.name, city, pr.state !== city ? pr.state : '', pr.country].filter(function (x) { return x; }).join(', '),
          city: city, cc: cc, area: ['city', 'town', 'village', 'county', 'state', 'district', 'country', 'suburb'].indexOf(String(pr.type || '')) >= 0, src: 'osm' });
      });
    } catch (e) { /* not approved yet or Photon unreachable: Google alone below */ }
    // 2 · Google Maps (addresses, towns, well-known places), near the last stop when known
    var g = Maps.newGeocoder().setLanguage('en'), r;
    if (region) g.setRegion(region.toLowerCase());
    if (near && near.lat) g.setBounds(near.lat - 0.75, near.lng - 0.75, near.lat + 0.75, near.lng + 0.75);
    try { r = g.geocode(q + (cn && q.toLowerCase().indexOf(cn.toLowerCase()) < 0 ? ', ' + cn : '')); } catch (e) { if (!out.length) throw mapsErr_(e); r = { results: [] }; }
    var AREA = ['locality', 'political', 'administrative_area_level_1', 'administrative_area_level_2', 'administrative_area_level_3', 'sublocality', 'country', 'route', 'postal_code'];
    var EXACT = ['point_of_interest', 'establishment', 'natural_feature', 'tourist_attraction', 'premise', 'lodging', 'park'];
    (r.results || []).forEach(function (x) {
      var c = x.address_components || [], t = x.types || [], pick = function (k) { for (var i = 0; i < c.length; i++) if ((c[i].types || []).indexOf(k) >= 0) return c[i]; return null; };
      var city = pick('locality') || pick('administrative_area_level_2') || pick('administrative_area_level_1'), cc = pick('country');
      var exact = t.some(function (k) { return EXACT.indexOf(k) >= 0; }), area = !!x.partial_match || (!exact && t.some(function (k) { return AREA.indexOf(k) >= 0; }));
      out.push({ lat: x.geometry.location.lat, lng: x.geometry.location.lng, addr: x.formatted_address, name: String(x.formatted_address || '').split(',')[0].trim(),
        city: city ? city.long_name : '', cc: cc ? cc.short_name : '', area: area, src: 'google' });
    });
    // exact places first, areas last; drop near-duplicates
    var seen = [], list = out.filter(function (x) { return !x.area; }).concat(out.filter(function (x) { return x.area; })).filter(function (x) {
      if (seen.some(function (y) { return Math.abs(y.lat - x.lat) < 0.002 && Math.abs(y.lng - x.lng) < 0.002; })) return false; seen.push(x); return true; });
    return list.slice(0, n);
  },
  /** Voyage · make the track for one day from its stops: road route per leg (by its transport), then heights along it. Saved to LB_Tracks. */
  lbRoute: function (ss, p) {
    var pts = p.pts || []; if (pts.length < 2) throw new Error('A day needs at least two stops with a pin to make a track.');
    var legs = [], all = [];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], mode = String(b.mode || 'bike'), leg = null;
      if (mode !== 'flight' && mode !== 'boat') {
        try {
          var f = Maps.newDirectionFinder().setOrigin(a.lat, a.lng).setDestination(b.lat, b.lng)
            .setMode(mode === 'walk' ? Maps.DirectionFinder.Mode.WALKING : mode === 'train' || mode === 'bus' ? Maps.DirectionFinder.Mode.TRANSIT : Maps.DirectionFinder.Mode.DRIVING);
          var d = f.getDirections();
          if ((!d.routes || !d.routes.length) && (mode === 'train' || mode === 'bus')) d = f.setMode(Maps.DirectionFinder.Mode.DRIVING).getDirections();
          if (d.routes && d.routes.length) {
            var rt = d.routes[0], km = 0, sec = 0; rt.legs.forEach(function (l) { km += l.distance.value; sec += l.duration.value; });
            leg = { km: Math.round(km / 100) / 10, min: Math.round(sec / 60), pts: Maps.decodePolyline(rt.overview_polyline.points), road: true };
          }
        } catch (e) { throw mapsErr_(e); }
      }
      if (!leg) leg = { km: Math.round(hav_(a, b) * 10) / 10, min: 0, pts: [a.lat, a.lng, b.lat, b.lng], road: false };
      legs.push({ km: leg.km, min: leg.min, road: leg.road });
      for (var k = (all.length ? 2 : 0); k < leg.pts.length; k += 2) all.push(leg.pts[k], leg.pts[k + 1]);
    }
    if (all.length > 6000) { var st = Math.ceil(all.length / 6000), th = []; for (var q = 0; q < all.length; q += 2) if ((q / 2) % st === 0 || q === all.length - 2) th.push(all[q], all[q + 1]); all = th; } // stays inside one cell
    var poly = Maps.encodePolyline(all), ele = [];
    var eh = heights_(all); ele = eh.ele;
    var up = 0, down = 0, last = ele.length ? ele[0] : 0, max = ele.length ? ele[0] : 0;
    ele.forEach(function (v) { if (v > max) max = v; var dlt = v - last; if (Math.abs(dlt) >= 5) { if (dlt > 0) up += dlt; else down -= dlt; last = v; } });
    var row = { TkKey: p.trip + '|' + p.day, TkTrip: String(p.trip), TkDay: Number(p.day), TkPoly: poly, TkEle: ele.join(','), TkKm: Math.round(legs.reduce(function (s, l) { return s + l.km; }, 0) * 10) / 10,
      TkMin: legs.reduce(function (s, l) { return s + l.min; }, 0), TkUp: up, TkDown: down, TkMax: max, TkLegs: JSON.stringify(legs), TkSrc: 'made' + (p.sig ? ':' + String(p.sig).slice(0, 40) : ''), TkWhen: new Date().toISOString() };
    ensureTables_(ss); upsertRows_(ss, 'LB_Tracks', [row]);
    if (eh.err) { var out = {}; for (var k in row) out[k] = row[k]; out.eleErr = eh.err; return out; }
    return row;
  },
  /** Voyage · today's rate (how much of a currency 1 MYR buys), from Google Finance in a helper tab. */
  lbFx: function (ss, p) {
    var cur = String(p.cur || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3); if (!cur) throw new Error('Choose a currency.');
    var sh = ss.getSheetByName('LB_FX') || ss.insertSheet('LB_FX');
    sh.getRange('A1').setFormula('=GOOGLEFINANCE("CURRENCY:MYR' + cur + '")'); SpreadsheetApp.flush();
    var v = Number(sh.getRange('A1').getValue()); if (!v) throw new Error('No rate found for ' + cur + '. Type it yourself.');
    return { cur: cur, rate: v };
  },
  /** Voyage · save a .gpx file to Drive, in the journey's folder next to its photos. */
  lbGpxSave: function (ss, p) {
    var f; try { f = ppFolder_(String(p.folder || 'Journeys')).createFile(Utilities.newBlob(String(p.xml || ''), 'application/gpx+xml', String(p.name || 'journey') + '.gpx')); } catch (e) { throw driveErr_(e); }
    return { id: f.getId(), url: f.getUrl ? f.getUrl() : '' };
  },

  /** Weekly backup: status, turn on/off, back up now. */
  backupStatus: function () { return backupInfo_(); },
  backupOn: function () { turnOnWeeklyBackup(); return backupInfo_(); },
  backupOff: function () { turnOffWeeklyBackup_(); return backupInfo_(); },
  backupNow: function (ss, p) { backupNow((p && p.label) || ''); return backupInfo_(); },

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

/* ───────── 3.1.6 · closed-year lock ───────── */
function closedYearBlock_(ss, ups, del) {
  if (!ss.getSheetByName('EW_Settings')) return '';
  var st = readTable_(ss, 'EW_Settings')[0] || {}, rules = {};
  try { rules = JSON.parse(st.StYears || '{}') || {}; } catch (e) { rules = {}; }
  var ct = String(rules.closedThrough || ''); if (!ct) return '';
  var msg = 'This year is closed (everything up to ' + ct + ' is locked). Change it in the Google Sheet if you really need to.';
  var tx = ups.EW_Transactions || [], txDel = del.EW_Transactions || [];
  if (tx.length || txDel.length) {
    var old = {}; readTable_(ss, 'EW_Transactions').forEach(function (t) { old[t.TxnId] = t.TxDate; });
    for (var i = 0; i < tx.length; i++) { var d = String(tx[i].TxDate || '').slice(0, 10), o = old[tx[i].TxnId]; if ((d && d <= ct) || (o && o <= ct)) return msg; }
    for (var j = 0; j < txDel.length; j++) { var od = old[txDel[j]]; if (od && od <= ct) return msg; }
  }
  var lastMonth = ct.slice(0, 7), cd = Number(ct.slice(8, 10));
  // the closed period's last financial month: ct is its last day (e.g. 2026-12-27 → 2026-12)
  var ps = ups.EW_Payslips || [], psDel = del.EW_Payslips || [];
  for (var k = 0; k < ps.length; k++) if (String(ps[k].PsMonth || '') <= lastMonth) return msg;
  for (var m = 0; m < psDel.length; m++) if (String(psDel[m]).slice(0, 7) <= lastMonth) return msg;
  return '';
}

/* ───────── 3.2.0 · Passport photos in Google Drive ───────── */
var PP_FOLDER = 'MansWell Passport';
/** Run this once from the Apps Script editor (choose setupPassport, press Run) and approve Google Drive. */
function setupPassport() {
  var root = ppRoot_();
  Logger.log('Passport is ready. Photos go to Google Drive › ' + PP_FOLDER + ' (' + root.getUrl() + ')');
  return root.getName();
}
function ppRoot_() { var it = DriveApp.getFoldersByName(PP_FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(PP_FOLDER); }
function driveErr_(e) {
  var m = String((e && e.message) || e);
  if (/permission|authoriz|scope/i.test(m)) return new Error('Google Drive is not approved yet. Open Apps Script, choose setupPassport and press Run, approve Drive, then try again.');
  return e;
}
function ppFolder_(name) {
  var root = ppRoot_();
  var clean = String(name || 'Photos').replace(/[\\/:*?"<>|]/g, ' ').slice(0, 80);
  var sub = root.getFoldersByName(clean);
  return sub.hasNext() ? sub.next() : root.createFolder(clean);
}

/* ───────── 3.4.0 · Logbook: Google Maps ───────── */
/** Run once from this editor (choose setupLogbook, press Run) so Google asks for Maps permission. */
function setupLogbook() {
  var r = Maps.newGeocoder().geocode('Kuala Lumpur');
  Logger.log('Voyage is ready. Google Maps answered: ' + ((r.results && r.results[0] && r.results[0].formatted_address) || r.status));
  return r.status;
}
/** Same as setupLogbook (the module is called Voyage since 3.5.0). */
function setupVoyage() {
  var st = setupLogbook();
  var r = UrlFetchApp.fetch('https://photon.komoot.io/api/?limit=1&q=Kuala%20Lumpur', { muteHttpExceptions: true });
  Logger.log('Place search (OpenStreetMap) answered: ' + r.getResponseCode());
  return st;
}
function mapsErr_(e) {
  var m = String((e && e.message) || e);
  if (/permission|authoriz|scope/i.test(m)) return new Error('Google Maps is not approved yet. Open Apps Script, choose setupVoyage and press Run, approve, then try again.');
  if (/too many times|quota|limit/i.test(m)) return new Error("DAILY LIMIT: Google Maps' free daily limit is used up. Try again tomorrow; tracks already made are kept.");
  return e;
}
/**
 * 3.5.1 · heights along a day's route. A long day has thousands of points; sent as one path it was too long for
 * Google's elevation service, so the heights were silently empty. Now: thin the line to 120 points spread by distance,
 * ask for 256 samples along it; if that fails, ask point by point in small batches. Returns { ele, err }.
 */
function heights_(all) {
  var pts = [], cum = [0];
  for (var i = 0; i < all.length; i += 2) pts.push({ lat: all[i], lng: all[i + 1] });
  if (pts.length < 2) return { ele: [], err: '' };
  for (var j = 1; j < pts.length; j++) cum.push(cum[j - 1] + hav_(pts[j - 1], pts[j]));
  var tot = cum[cum.length - 1] || 1, N = Math.min(120, pts.length), th = [], k = 0;
  for (var n = 0; n < N; n++) { var want = tot * n / (N - 1); while (k < pts.length - 1 && cum[k] < want) k++; th.push(pts[k].lat, pts[k].lng); }
  var err = '';
  try {
    var r = Maps.newElevationSampler().samplePath(th, 256);
    if (r && r.status === 'OK' && r.results && r.results.length) return { ele: r.results.map(function (x) { return Math.round(x.elevation); }), err: '' };
    err = (r && (r.error_message || r.status)) || 'no answer';
  } catch (e) { err = String((e && e.message) || e); }
  try {
    var ele = [];
    for (var b = 0; b < th.length; b += 80) {
      var r2 = Maps.newElevationSampler().samplePoints(th.slice(b, b + 80));
      if (!r2 || r2.status !== 'OK') throw new Error((r2 && (r2.error_message || r2.status)) || 'no answer');
      r2.results.forEach(function (x) { ele.push(Math.round(x.elevation)); });
      Utilities.sleep(150);
    }
    return { ele: ele, err: '' };
  } catch (e2) { err = String((e2 && e2.message) || e2) || err; }
  return { ele: [], err: /too many times|quota|limit/i.test(err) ? "Google Maps' daily limit for heights is used up. Make the track again tomorrow." : 'Google could not read the heights (' + err + ').' };
}
function hav_(a, b) { var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r, x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2); return 2 * R * Math.asin(Math.sqrt(x)); }

/* ───────── 3.1.6 · weekly backup to Google Drive ───────── */
var BACKUP_FOLDER = 'MansWell Backups', BACKUP_KEEP = 12;
function backupFolder_() {
  var it = DriveApp.getFoldersByName(BACKUP_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(BACKUP_FOLDER);
}
/** Saves a full copy of this Google Sheet into Drive › MansWell Backups. Weekly copies keep the newest 12; labelled ones are kept forever. */
function backupNow(label) {
  var ss = getSs_();
  var tz = Session.getScriptTimeZone(), stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HHmm');
  var name = 'MansWell-backup-' + stamp + (label ? ' · ' + label : '');
  var folder = backupFolder_();
  var copy = DriveApp.getFileById(ss.getId()).makeCopy(name, folder);
  if (!label) {
    var files = [], fi = folder.getFiles();
    while (fi.hasNext()) { var f = fi.next(); if (/^MansWell-backup-/.test(f.getName()) && f.getName().indexOf(' · ') < 0) files.push(f); }
    files.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
    files.slice(BACKUP_KEEP).forEach(function (f) { f.setTrashed(true); });
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty('BACKUP_LAST', new Date().toISOString()); props.setProperty('BACKUP_LAST_NAME', name); props.setProperty('BACKUP_LAST_URL', copy.getUrl());
  props.deleteProperty('BACKUP_ERROR');
  return name;
}
function weeklyBackup_() { try { backupNow(''); } catch (e) { PropertiesService.getScriptProperties().setProperty('BACKUP_ERROR', String(e && e.message || e)); } }
function turnOnWeeklyBackup() {
  var ss = getSs_(); if (ss) PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  turnOffWeeklyBackup_();
  ScriptApp.newTrigger('weeklyBackup_').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create();
  PropertiesService.getScriptProperties().setProperty('BACKUP_ON', '1');
}
function turnOffWeeklyBackup_() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'weeklyBackup_') ScriptApp.deleteTrigger(t); });
  PropertiesService.getScriptProperties().deleteProperty('BACKUP_ON');
}
function backupInfo_() {
  var p = PropertiesService.getScriptProperties();
  var on = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'weeklyBackup_'; });
  return { on: on, last: p.getProperty('BACKUP_LAST') || '', name: p.getProperty('BACKUP_LAST_NAME') || '', url: p.getProperty('BACKUP_LAST_URL') || '', error: p.getProperty('BACKUP_ERROR') || '', folder: BACKUP_FOLDER, keep: BACKUP_KEEP };
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
