// Monthly Balance Sweep — moves each eligible account's month-end balance into the "Balance Sweep" system account
// using real internal transfers dated on the last day of the month. Nothing is overwritten: history stays intact.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Tog, Notify, rerender, guard, save, Today, PSTART, PEND, perKey, fmtD, fmtTime,
  RM, round2, mkTxn, nextTxSeq, settingsRow, stStart, HAIR, SURFACE, acc
} from './core.js';

export const SWEEP_ID = 'ACC-SWEEP';
export const isSystem = a => a && a.AccType === 'System';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ── Period keys (yyyymm of the financial month) ── */
export const keyY = k => Math.floor(k / 100), keyM = k => k % 100;
export function keyAdd(k, n) { const i = keyY(k) * 12 + keyM(k) - 1 + n; return Math.floor(i / 12) * 100 + (i % 12) + 1; }
export const keyStart = k => PSTART(keyY(k), keyM(k));
export const keyEnd = k => PEND(keyY(k), keyM(k));
export const keyLabel = (k, long) => (long ? MONTH : MON)[keyM(k) - 1] + ' ' + keyY(k);
export const refOf = k => 'SWEEP-' + k;

/* ── Settings stored in EW_Settings (StSweepAuto, StSweepFrom, StSweepLog) ── */
export function sweepLog() { try { return JSON.parse((DB.settings && DB.settings.StSweepLog) || '{}') || {}; } catch (e) { return {}; } }
export const autoOn = () => !!(DB.settings && (DB.settings.StSweepAuto === true || DB.settings.StSweepAuto === 'TRUE'));
export const sweepFrom = () => Number(DB.settings && DB.settings.StSweepFrom) || 0;

/** Accounts that take part: active, money you hold (not cards), not the sweep itself. Debit cards are in by default. */
export function sweepEnabled(a) {
  if (!a || isSystem(a) || a.AccClass !== 'Asset') return false;
  if (a.AccSweep === 'Yes') return true;
  if (a.AccSweep === 'No') return false;
  return a.AccType === 'Debit Card';
}
export const sweepAccount = () => DB.accounts.find(a => a.AccId === SWEEP_ID);

function balAsOf(accId, date) {
  let b = 0;
  for (const t of DB.txns) if (t.TxAcc === accId && !t.TxParent && t.TxDate <= date) b += t.TxDir === 'In' ? t.TxAmt : -t.TxAmt;
  return round2(b);
}
const sweptLeg = (k, accId) => DB.txns.find(t => t.TxRef === refOf(k) && t.TxAcc === accId && t.TxDir === 'Out');
export const isSwept = k => !!sweepLog()[k] || DB.txns.some(t => t.TxRef === refOf(k));
export const latestClosed = () => keyAdd(perKey(Today()), -1);
/** Latest month that has been swept (sweeps must go forward in time, never back). */
export function lastSwept() {
  let m = 0;
  Object.keys(sweepLog()).forEach(k => { m = Math.max(m, Number(k)); });
  DB.txns.forEach(t => { if (t.TxRef && t.TxRef.startsWith('SWEEP-')) m = Math.max(m, Number(t.TxRef.slice(6))); });
  return m;
}
/** The month a sweep can run for now: the latest finished month, if it is after the last sweep. */
export function sweepTarget() {
  const lc = latestClosed();
  return stStart() && lc >= perKey(stStart()) && lc > lastSwept() ? lc : null;
}

/** What a sweep of month k would do (also used for the confirmation). */
export function planSweep(k) {
  const E = keyEnd(k);
  const plan = { k, E, rows: [], flagged: [], zero: [], done: [] };
  DB.accounts.filter(a => a.AccStatus === 'Active' && sweepEnabled(a) && (!a.AccOpenDate || a.AccOpenDate <= E)).forEach(a => {
    if (sweptLeg(k, a.AccId)) { plan.done.push(a); return; }
    const b = balAsOf(a.AccId, E);
    if (b < -0.004) plan.flagged.push({ a, amt: b });
    else if (b < 0.005) plan.zero.push({ a, amt: 0 });
    else plan.rows.push({ a, amt: b });
  });
  plan.total = round2(plan.rows.reduce((s, r) => s + r.amt, 0));
  return plan;
}

/** Runs the sweep for month k. Safe to call again: accounts already swept for k are skipped. */
export async function runSweep(k, mode) {
  const p = planSweep(k);
  const up = { EW_Transactions: [] };
  if (!sweepAccount()) {
    up.EW_Accounts = [{ AccId: SWEEP_ID, AccSeq: 0, AccName: 'Balance Sweep', AccShort: 'BS', AccColor: '#FF6A00', AccType: 'System', AccClass: 'Asset',
      AccOpenDate: stStart() || p.E, AccOB: 0, AccLimit: 0, AccDueDay: 0, AccStatus: 'Active', AccRemarks: 'Collects month-end balances', AccSweep: 'No' }];
  }
  let seq = nextTxSeq();
  const desc = 'Monthly balance sweep · ' + keyLabel(k);
  p.rows.forEach(({ a, amt }) => {
    const trf = 'SWP-' + k + '-' + a.AccId;
    up.EW_Transactions.push(mkTxn({ TxnId: 'TXN-' + keyY(k) + '-' + String(seq).padStart(6, '0'), TxSeq: seq, TxAcc: a.AccId, TxDate: p.E, TxType: 'Transfer', TxDir: 'Out', TxAmt: amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf, TxRef: refOf(k) }));
    up.EW_Transactions.push(mkTxn({ TxnId: 'TXN-' + keyY(k) + '-' + String(seq + 1).padStart(6, '0'), TxSeq: seq + 1, TxAcc: SWEEP_ID, TxDate: p.E, TxType: 'Transfer', TxDir: 'In', TxAmt: amt, TxCat: 'Transfer', TxDesc: desc, TxTrf: trf, TxRef: refOf(k) }));
    seq += 2;
  });
  const log = sweepLog();
  const prev = log[k];
  const prevAmt = prev ? prev.amt : 0;
  log[k] = { at: new Date().toISOString(), mode, amt: round2(prevAmt + p.total), n: (prev ? prev.n : 0) + p.rows.length,
    flagged: p.flagged.map(f => ({ id: f.a.AccId, nm: f.a.AccName, amt: f.amt })) };
  up.EW_Settings = [settingsRow({ StSweepLog: JSON.stringify(log) })];
  const detail = keyLabel(k) + ': ' + RM(p.total) + ' from ' + p.rows.length + ' account(s)' + (p.flagged.length ? ' · ' + p.flagged.length + ' flagged for review' : '');
  await save({ up, log: [{ AuAction: mode === 'Auto' ? 'Monthly sweep (auto)' : prev ? 'Monthly sweep retry' : 'Monthly sweep', AuRef: refOf(k), AuDetail: detail }] });
  return p;
}

/** On app start: sweeps every finished month since automatic sweeping was switched on. */
export async function autoSweep() {
  if (!autoOn() || !stStart()) return;
  const last = latestClosed();
  let k = Math.max(sweepFrom() || last, perKey(stStart()), lastSwept() + 1);
  let moved = 0, months = 0;
  for (; k <= last; k = keyAdd(k, 1)) {
    if (isSwept(k)) continue;
    const p = await runSweep(k, 'Auto');
    moved += p.total; months++;
  }
  if (months) Notify(moved > 0 ? 'Monthly sweep done: ' + RM(moved) + ' moved to Balance Sweep.' : 'Monthly sweep done: no balances to move.', 'success');
}

/** History rows, newest first. */
export function sweepHistory() {
  const log = sweepLog();
  const keys = new Set(Object.keys(log).map(Number));
  DB.txns.forEach(t => { if (t.TxRef && t.TxRef.startsWith('SWEEP-')) keys.add(Number(t.TxRef.slice(6))); });
  return [...keys].sort((a, b) => b - a).map(k => {
    const legs = DB.txns.filter(t => t.TxRef === refOf(k) && t.TxDir === 'Out');
    const e = log[k] || {};
    const flagged = e.flagged || [];
    return { k, amt: round2(legs.reduce((s, t) => s + t.TxAmt, 0)), legs, flagged, at: e.at, mode: e.mode || 'Manual', status: flagged.length ? 'Review' : 'Completed' };
  });
}

/* ─────────────────────────── UI (inside the Accounts page) ─────────────────────────── */
const pill = (x, y, txt, c, bg, bd, w = 78) => B(x, y, w, 22, txt, { fill: bg, b: bd, c, r: 11, s: 6.5, flat: true });
const STATUS = {
  Active: [K.grn, 'rgba(52,199,123,0.1)', 'rgba(52,199,123,0.35)'],
  Completed: [K.grn, 'rgba(52,199,123,0.1)', 'rgba(52,199,123,0.35)'],
  Due: [K.or, 'rgba(255,106,0,0.1)', 'rgba(255,106,0,0.4)'],
  Review: [K.gold, 'rgba(233,185,73,0.1)', 'rgba(233,185,73,0.4)'],
  Manual: [K.sub, 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.12)']
};
export function statusPill(x, y, s, w) { const [c, bg, bd] = STATUS[s] || STATUS.Manual; return pill(x, y, s.toUpperCase(), c, bg, bd, w); }

function currentStatus(hist) {
  const lc = latestClosed();
  if (hist[0] && hist[0].status === 'Review') return 'Review';
  if (sweepTarget() && DB.accounts.some(sweepEnabled)) return autoOn() ? 'Active' : 'Due';
  return autoOn() ? 'Active' : 'Manual';
}

export function SweepSection(l) {
  const sa = sweepAccount();
  const hist = sweepHistory();
  const status = currentStatus(hist);
  const balance = sa ? round2(DB.txns.filter(t => t.TxAcc === SWEEP_ID && !t.TxParent).reduce((s, t) => s + (t.TxDir === 'In' ? t.TxAmt : -t.TxAmt), 0)) : 0;
  const lc = latestClosed();
  const thisMonth = hist.find(h => h.k === lc);
  const last = hist[0];
  const curKey = perKey(Today());
  const target = sweepTarget();
  const eligible = DB.accounts.filter(a => a.AccStatus === 'Active' && sweepEnabled(a));

  const toggleAuto = on => guard(async () => {
    await save({ up: { EW_Settings: [settingsRow({ StSweepAuto: on, StSweepFrom: on ? (sweepFrom() || curKey) : sweepFrom() })] },
      log: [{ AuAction: on ? 'Sweep automatic on' : 'Sweep automatic off', AuRef: 'SWEEP', AuDetail: on ? 'Runs at the end of every month' : 'Manual only' }] });
    Notify(on ? 'Automatic monthly sweep is on.' : 'Automatic monthly sweep is off.', 'success');
  });
  const askSweep = () => {
    if (!target) return Notify('Nothing to sweep yet. The next sweep is on ' + fmtD(keyEnd(curKey), 'dd mmm yyyy') + '.', 'info');
    l.sweepConfirm = planSweep(target); rerender();
  };
  const lastBody = last ? html`
    ${L(16, 8, 334, 16, 'Run ' + (last.at ? fmtTime(last.at, 'dd/mm/yyyy hh:mm') : fmtD(keyEnd(last.k), 'dd mmm yyyy')) + '  ·  ' + last.mode + '  ·  ' + keyLabel(last.k, true), { s: 7.5, c: K.sub })}
    ${last.legs.map((t, i) => html`${L(16, 28 + i * 24, 220, 20, (acc(t.TxAcc) || {}).AccName, { s: 9 })}${L(230, 28 + i * 24, 120, 20, RM(t.TxAmt), { s: 9, w: 6, a: 'r' })}`)}
    ${last.flagged.map((f, i) => html`${L(16, 28 + (last.legs.length + i) * 24, 220, 20, f.nm + '  ·  negative, skipped', { s: 9, c: K.gold })}${L(230, 28 + (last.legs.length + i) * 24, 120, 20, '−' + RM(Math.abs(f.amt)), { s: 9, w: 6, a: 'r', c: K.gold })}`)}
    ${!last.legs.length && !last.flagged.length ? L(16, 28, 334, 20, 'No balances to move that month.', { s: 9, c: K.mute }) : null}` : null;
  const lastH = last ? 40 + Math.max(1, last.legs.length + last.flagged.length) * 24 : 0;

  const card = Card(null, 0, 366, 214 + (l.sweepOpen && last ? lastH + 8 : 0), html`
    ${C(16, 16, 38, 'rgba(255,106,0,0.12)', { b: 'rgba(255,106,0,0.3)' })}
    ${I(26, 26, 18, 18, 'Sync', K.or, { pad: 0 })}
    ${L(66, 15, 200, 20, 'Balance Sweep', { s: 10.5, w: 6 })}
    ${L(66, 35, 200, 16, 'System account  ·  ' + eligible.length + ' linked', { s: 8, c: K.sub })}
    ${statusPill(272, 22, status, 78)}
    ${L(16, 66, 220, 14, 'ACCUMULATED BALANCE', { s: 7, w: 6, c: K.sub })}
    ${L(16, 80, 334, 28, RM(balance), { s: 16, w: 6, id: 'sweepBal', onClick: sa ? () => { G.gblAccId = SWEEP_ID; l.goDetail && l.goDetail(); } : undefined })}
    ${Box(12, 116, 342, 52, html`
      ${L(12, 9, 104, 12, 'SWEPT THIS MONTH', { s: 6.5, w: 6, c: K.sub })}
      ${L(12, 23, 104, 20, thisMonth ? RM(thisMonth.amt) : '—', { s: 9.5, w: 6, id: 'sweptThis' })}
      ${R(118, 10, 1, 32, 'rgba(255,255,255,0.07)')}
      ${L(128, 9, 96, 12, 'LAST SWEEP', { s: 6.5, w: 6, c: K.sub })}
      ${L(128, 23, 96, 20, last ? fmtD(keyEnd(last.k), 'dd mmm yyyy') : 'Not yet', { s: 9.5, w: 6 })}
      ${R(228, 10, 1, 32, 'rgba(255,255,255,0.07)')}
      ${L(238, 9, 96, 12, 'NEXT SWEEP', { s: 6.5, w: 6, c: K.sub })}
      ${L(238, 23, 96, 20, target && !autoOn() ? 'Due now' : fmtD(keyEnd(curKey), 'dd mmm yyyy'), { s: 9.5, w: 6, c: target && !autoOn() ? K.or : K.text })}`,
    { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}
    ${Tog(16, 178, 56, 28, autoOn(), toggleAuto)}
    ${L(80, 176, 120, 16, 'Automatic', { s: 9, w: 6 })}
    ${L(80, 192, 120, 14, 'at month end', { s: 7.5, c: K.sub })}
    ${B(176, 176, 82, 30, l.sweepOpen ? 'Hide' : 'Last run', { fill: K.field, b: HAIR, r: 15, s: 8.5, onClick: () => { l.sweepOpen = !l.sweepOpen; rerender(); }, id: 'sweepLast', disabled: !last })}
    ${B(266, 176, 84, 30, 'Sweep now', { fill: K.or, c: '#FFFFFF', r: 15, s: 8.5, onClick: askSweep, id: 'sweepNow' })}
    ${l.sweepOpen && last ? Box(0, 214, 366, lastH + 8, html`${R(16, 0, 334, 1, K.sep)}<div class="abs" style="left:0;top:4px;width:366px">${lastBody}</div>`) : null}`, { id: 'sweepCard' });

  const showAll = l.histAll;
  const rows = showAll ? hist : hist.slice(0, 4);
  const rowH = h => 44 + (l.histOpen === h.k ? (Math.max(1, h.legs.length + h.flagged.length) * 24 + 12 + (h.status === 'Review' ? 40 : 0)) : 0);
  const histH = 58 + (rows.length ? rows.reduce((s, h) => s + rowH(h), 0) : 44) + (hist.length > 4 ? 36 : 0) + 6;
  const retry = h => guard(async () => {
    if (h.k !== lastSwept()) return Notify('Only the latest sweep can be retried. A later month has already been swept.', 'info');
    const p = planSweep(h.k);
    if (!p.rows.length) return Notify(p.flagged.length ? 'These balances are still negative on ' + fmtD(p.E, 'dd mmm yyyy') + '. Fix them, then retry.' : 'Nothing left to sweep for ' + keyLabel(h.k) + '.', 'info');
    await runSweep(h.k, 'Manual');
    Notify('Retried: ' + RM(p.total) + ' moved to Balance Sweep.', 'success');
  });
  let y = 58;
  const histBody = rows.map(h => {
    const open = l.histOpen === h.k, top = y;
    y += rowH(h);
    return html`<div class="abs" style=${`left:0;top:${top}px;width:366px;height:${rowH(h)}px`}>
      <div class="abs tap" style="left:0;top:0;width:366px;height:44px" onClick=${() => { l.histOpen = open ? null : h.k; rerender(); }} data-t=${'hist-' + h.k}>
        ${L(16, 0, 130, 44, keyLabel(h.k, true), { s: 9.5, w: 6 })}
        ${L(146, 0, 104, 44, RM(h.amt), { s: 9.5, a: 'r' })}
        ${statusPill(262, 11, h.status, 70)}
        ${I(336, 16, 12, 12, open ? 'ChevronDown' : 'ChevronRight', K.mute, { pad: 0 })}
      </div>
      ${open ? html`
        ${h.legs.map((t, i) => html`${L(28, 44 + i * 24, 200, 20, (acc(t.TxAcc) || {}).AccName + '  →  Balance Sweep', { s: 8.5, c: K.sub })}${L(230, 44 + i * 24, 104, 20, RM(t.TxAmt), { s: 8.5, a: 'r' })}`)}
        ${h.flagged.map((f, i) => html`${L(28, 44 + (h.legs.length + i) * 24, 200, 20, f.nm + '  ·  negative, needs review', { s: 8.5, c: K.gold })}${L(230, 44 + (h.legs.length + i) * 24, 104, 20, '−' + RM(Math.abs(f.amt)), { s: 8.5, a: 'r', c: K.gold })}`)}
        ${!h.legs.length && !h.flagged.length ? L(28, 44, 300, 20, 'No balances to move that month.', { s: 8.5, c: K.mute }) : null}
        ${h.status === 'Review' ? B(28, 44 + (h.legs.length + h.flagged.length) * 24 + 6, 120, 30, 'Retry sweep', { fill: K.field, b: 'rgba(233,185,73,0.4)', c: K.gold, r: 15, s: 8.5, onClick: () => retry(h), id: 'retry-' + h.k }) : null}` : null}
      ${R(16, rowH(h) - 1, 334, 1, K.sep)}
    </div>`;
  });
  const history = Card(null, 0, 366, histH, html`
    ${L(16, 12, 200, 22, 'Sweep history', { s: 10.5, w: 6 })}
    ${L(16, 40, 120, 14, 'MONTH', { s: 6.5, w: 6, c: K.mute })}
    ${L(146, 40, 104, 14, 'AMOUNT SWEPT', { s: 6.5, w: 6, c: K.mute, a: 'r' })}
    ${L(262, 40, 70, 14, 'STATUS', { s: 6.5, w: 6, c: K.mute, a: 'c' })}
    ${R(16, 57, 334, 1, K.sep)}
    ${rows.length ? histBody : L(16, 58, 334, 44, 'No sweeps yet. Your first one runs at the end of this month.', { s: 8.5, c: K.mute })}
    ${hist.length > 4 ? L(16, histH - 40, 334, 32, showAll ? 'Show fewer' : 'View all ' + hist.length + ' months  ›', { s: 8.5, w: 6, c: K.or, a: 'c', onClick: () => { l.histAll = !showAll; rerender(); } }) : null}`, { id: 'sweepHistory' });

  return html`${card}${history}`;
}

export function SweepConfirm(l) {
  const p = l.sweepConfirm;
  if (!p) return null;
  const close = () => { l.sweepConfirm = null; rerender(); };
  const go = () => guard(async () => {
    l.sweepConfirm = null;
    const r = await runSweep(p.k, 'Manual');
    Notify(RM(r.total) + ' moved to Balance Sweep' + (r.flagged.length ? '. ' + r.flagged.length + ' account(s) need review.' : '.'), r.flagged.length ? 'warning' : 'success');
  });
  const lines = [...p.rows.map(r => ({ nm: r.a.AccName, amt: RM(r.amt), c: K.text })), ...p.flagged.map(f => ({ nm: f.a.AccName + ' · negative, skipped', amt: '−' + RM(Math.abs(f.amt)), c: K.gold })), ...p.zero.map(z => ({ nm: z.a.AccName + ' · zero, skipped', amt: RM(0), c: K.mute }))];
  const h = 186 + Math.max(1, lines.length) * 26;
  return html`<div class="abs" style="inset:0;z-index:40">
    <div class="abs dim" style="inset:0" onClick=${close}></div>
    ${Card(33, Math.max(90, 420 - h / 2), 324, h, html`
      ${L(20, 18, 284, 22, 'Sweep ' + keyLabel(p.k, true) + '?', { s: 13, w: 6 })}
      ${L(20, 42, 284, 32, 'Balances on ' + fmtD(p.E, 'dd mmm yyyy') + ' move into Balance Sweep. Your history is kept.', { s: 8.5, c: K.sub, wrap: true })}
      ${R(20, 82, 284, 1, K.sep)}
      ${lines.length ? lines.map((x, i) => html`${L(20, 90 + i * 26, 190, 22, x.nm, { s: 9, c: x.c })}${L(200, 90 + i * 26, 104, 22, x.amt, { s: 9, w: 6, a: 'r', c: x.c })}`) : L(20, 90, 284, 22, 'No linked accounts to sweep.', { s: 9, c: K.mute })}
      ${R(20, 94 + Math.max(1, lines.length) * 26, 284, 1, K.sep)}
      ${L(20, 100 + Math.max(1, lines.length) * 26, 150, 22, 'Total to move', { s: 9.5, w: 6 })}
      ${L(170, 100 + Math.max(1, lines.length) * 26, 134, 22, RM(p.total), { s: 10.5, w: 6, a: 'r', c: K.or, id: 'sweepTotal' })}
      ${B(20, h - 50, 136, 36, 'Cancel', { fill: K.field, b: HAIR, s: 9.5, onClick: close, id: 'sweepCancel' })}
      ${B(168, h - 50, 136, 36, 'Confirm sweep', { fill: K.or, c: '#FFFFFF', s: 9.5, onClick: go, disabled: !p.rows.length, id: 'sweepConfirm' })}`, { b: 'rgba(255,106,0,0.35)' })}
  </div>`;
}
