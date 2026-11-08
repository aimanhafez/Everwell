// Monthly Balance Sweep — moves each eligible account's month-end balance into the "Balance Sweep" system account
// using real internal transfers dated on the last day of the month. Nothing is overwritten: history stays intact.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Tog, Notify, rerender, guard, save, Today, PSTART, PEND, perKey, fmtD, fmtTime,
  RM, round2, mkTxn, nextTxSeq, settingsRow, stStart, HAIR, SURFACE, acc
} from './core.js';
import { askPassword } from './shared.js';

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

/* ── Closing: a swept month is closed. Nothing dated on or before its last day can be added, changed or deleted. ── */
export const closedThrough = () => lastSwept();
export const lockDate = () => (lastSwept() ? keyEnd(lastSwept()) : '');
export const isLocked = d => !!d && !!lockDate() && d <= lockDate();
export const lockMsg = () => 'That date is in a closed month. Months are closed up to ' + fmtD(lockDate(), 'dd mmm yyyy') + '. Reopen it in Accounts → Balance Sweep first.';
/** The oldest month that is still open. */
export const firstOpen = () => (lastSwept() ? keyAdd(lastSwept(), 1) : (stStart() ? perKey(stStart()) : 0));
/** Finished months you can close now, oldest first. */
export function closableMonths() {
  const out = [], last = latestClosed();
  for (let k = firstOpen(); k && k <= last; k = keyAdd(k, 1)) out.push(k);
  return out;
}
/** Months before the latest swept one that were never swept (from older versions that swept the latest month only). */
export function skippedMonths() {
  const ls = lastSwept(); if (!ls || !stStart()) return [];
  const out = [];
  for (let k = perKey(stStart()); k < ls; k = keyAdd(k, 1)) if (!isSwept(k)) out.push(k);
  return out;
}
/** What closing every open month up to k would do, month by month (each sweep sees the ones before it). */
export function planThrough(k) {
  const taken = {}, months = [];
  for (const m of closableMonths().filter(x => x <= k)) {
    const E = keyEnd(m), rows = [], flagged = [];
    DB.accounts.filter(a => a.AccStatus === 'Active' && sweepEnabled(a) && (!a.AccOpenDate || a.AccOpenDate <= E)).forEach(a => {
      const b = round2(balAsOf(a.AccId, E) - (taken[a.AccId] || 0));
      if (b < -0.004) flagged.push({ a, amt: b });
      else if (b >= 0.005) { rows.push({ a, amt: b }); taken[a.AccId] = round2((taken[a.AccId] || 0) + b); }
    });
    months.push({ k: m, E, rows, flagged, total: round2(rows.reduce((t, r) => t + r.amt, 0)) });
  }
  return { k, months, total: round2(months.reduce((t, m) => t + m.total, 0)), flagged: months.reduce((t, m) => t + m.flagged.length, 0) };
}
/** Reopen the latest closed month: removes its sweep transfers and its log entry. */
export async function reopenMonth(k) {
  if (k !== lastSwept()) throw new Error('Only the latest closed month can be reopened.');
  const ids = DB.txns.filter(t => t.TxRef === refOf(k)).map(t => t.TxnId);
  const log = sweepLog(); delete log[k];
  await save({ del: { EW_Transactions: ids }, up: { EW_Settings: [settingsRow({ StSweepLog: JSON.stringify(log) })] },
    log: [{ AuAction: 'Reopen month', AuRef: refOf(k), AuDetail: keyLabel(k) + ' reopened · ' + ids.length / 2 + ' sweep transfer(s) removed' }] });
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
  if (closableMonths().length && DB.accounts.some(sweepEnabled)) return autoOn() ? 'Active' : 'Due';
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
  const open = closableMonths();
  const askSweep = () => {
    if (!open.length) return Notify('Nothing to close yet. ' + keyLabel(curKey, true) + ' ends on ' + fmtD(keyEnd(curKey), 'dd mmm yyyy') + '.', 'info');
    l.sweepConfirm = { k: open[0] }; rerender();
  };
  const skipped = skippedMonths();
  const lastBody = last ? html`
    ${L(16, 8, 334, 16, 'Run ' + (last.at ? fmtTime(last.at, 'dd/mm/yyyy hh:mm') : fmtD(keyEnd(last.k), 'dd mmm yyyy')) + '  ·  ' + last.mode + '  ·  ' + keyLabel(last.k, true), { s: 7.5, c: K.sub })}
    ${last.legs.map((t, i) => html`${L(16, 28 + i * 24, 220, 20, (acc(t.TxAcc) || {}).AccName, { s: 9 })}${L(230, 28 + i * 24, 120, 20, RM(t.TxAmt), { s: 9, w: 6, a: 'r' })}`)}
    ${last.flagged.map((f, i) => html`${L(16, 28 + (last.legs.length + i) * 24, 220, 20, f.nm + '  ·  negative, skipped', { s: 9, c: K.gold })}${L(230, 28 + (last.legs.length + i) * 24, 120, 20, '−' + RM(Math.abs(f.amt)), { s: 9, w: 6, a: 'r', c: K.gold })}`)}
    ${!last.legs.length && !last.flagged.length ? L(16, 28, 334, 20, 'No balances to move that month.', { s: 9, c: K.mute }) : null}` : null;
  const lastH = last ? 40 + Math.max(1, last.legs.length + last.flagged.length) * 24 : 0;

  const noteH = skipped.length ? 58 : 0;
  const card = Card(null, 0, 366, 214 + noteH + (l.sweepOpen && last ? lastH + 8 : 0), html`
    ${L(16, 18, 240, 24, 'Balance Sweep', { s: 11.5, w: 6 })}
    ${statusPill(272, 19, status, 78)}
    ${L(16, 66, 220, 14, 'ACCUMULATED BALANCE', { s: 7, w: 6, c: K.sub })}
    ${L(16, 80, 334, 28, RM(balance), { s: 16, w: 6, id: 'sweepBal', onClick: sa ? () => { G.gblAccId = SWEEP_ID; l.goDetail && l.goDetail(); } : undefined })}
    ${Box(12, 116, 342, 52, html`
      ${L(12, 9, 104, 12, 'SWEPT THIS MONTH', { s: 6.5, w: 6, c: K.sub })}
      ${L(12, 23, 104, 20, thisMonth ? RM(thisMonth.amt) : '—', { s: 9.5, w: 6, id: 'sweptThis' })}
      ${R(118, 10, 1, 32, 'rgba(255,255,255,0.07)')}
      ${L(128, 9, 96, 12, 'CLOSED UNTIL', { s: 6.5, w: 6, c: K.sub })}
      ${L(128, 23, 96, 20, lastSwept() ? fmtD(lockDate(), 'dd mmm yyyy') : 'Nothing yet', { s: 9.5, w: 6, id: 'closedUntil' })}
      ${R(228, 10, 1, 32, 'rgba(255,255,255,0.07)')}
      ${L(238, 9, 96, 12, open.length ? 'OPEN MONTHS' : 'NEXT SWEEP', { s: 6.5, w: 6, c: K.sub })}
      ${L(238, 23, 96, 20, open.length ? open.length + (open.length === 1 ? ' to close' : ' to close') : fmtD(keyEnd(curKey), 'dd mmm yyyy'), { s: 9.5, w: 6, c: open.length ? K.or : K.text, id: 'openMonths' })}`,
    { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}
    ${Tog(16, 178, 56, 28, autoOn(), toggleAuto)}
    ${L(80, 176, 120, 16, 'Automatic', { s: 9, w: 6 })}
    ${L(80, 192, 120, 14, 'at month end', { s: 7.5, c: K.sub })}
    ${B(176, 176, 82, 30, l.sweepOpen ? 'Hide' : 'Last run', { fill: K.field, b: HAIR, r: 15, s: 8.5, onClick: () => { l.sweepOpen = !l.sweepOpen; rerender(); }, id: 'sweepLast', disabled: !last })}
    ${B(266, 176, 84, 30, 'Sweep now', { fill: K.or, c: '#FFFFFF', r: 15, s: 8.5, onClick: askSweep, id: 'sweepNow' })}
    ${l.sweepOpen && last ? Box(0, 214, 366, lastH + 8, html`${R(16, 0, 334, 1, K.sep)}<div class="abs" style="left:0;top:4px;width:366px">${lastBody}</div>`) : null}
    ${skipped.length ? Box(12, 214 + (l.sweepOpen && last ? lastH + 8 : 0), 342, 48, html`
      ${I(12, 15, 16, 16, 'Clock', K.gold, { pad: 0 })}
      ${L(38, 6, 296, 36, keyLabel(skipped[0]) + (skipped.length > 1 ? ' – ' + keyLabel(skipped[skipped.length - 1]) : '') + ' were never swept. Reopen ' + keyLabel(lastSwept(), true) + ' in the history below to close them in order.', { s: 7.5, c: K.gold, wrap: true })}`,
      { fill: 'rgba(233,185,73,0.06)', r: 12, b: 'rgba(233,185,73,0.25)', id: 'skippedNote' }) : null}`, { id: 'sweepCard' });

  const showAll = l.histAll;
  const rows = showAll ? hist : hist.slice(0, 4);
  const latest = lastSwept();
  const rowH = h => 44 + (l.histOpen === h.k ? (Math.max(1, h.legs.length + h.flagged.length) * 24 + 12 + (h.k === latest ? 44 : 0)) : 0);
  const histH = 58 + (rows.length ? rows.reduce((s, h) => s + rowH(h), 0) : 44) + (hist.length > 4 ? 36 : 0) + 6;
  const reopen = h => askPassword(l, 'reopen ' + keyLabel(h.k, true), () => guard(async () => {
    await reopenMonth(h.k);
    l.histOpen = null;
    Notify(keyLabel(h.k, true) + ' is open again. You can add and change its transactions.', 'info');
  }));
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
        ${h.k === latest ? html`
          ${B(28, 44 + Math.max(1, h.legs.length + h.flagged.length) * 24 + 8, 132, 30, 'Reopen month', { fill: K.field, b: HAIR, c: K.text, r: 15, s: 8.5, onClick: () => reopen(h), id: 'reopen-' + h.k })}
          ${L(170, 44 + Math.max(1, h.legs.length + h.flagged.length) * 24 + 8, 170, 30, h.status === 'Review' ? 'Reopen to fix the negative balance' : 'Removes this sweep and unlocks it', { s: 7, c: h.status === 'Review' ? K.gold : K.mute, wrap: true })}` : null}` : null}
      ${R(16, rowH(h) - 1, 334, 1, K.sep)}
    </div>`;
  });
  const history = Card(null, 0, 366, histH, html`
    ${L(16, 12, 200, 22, 'Sweep history', { s: 10.5, w: 6 })}
    ${L(16, 40, 120, 14, 'MONTH', { s: 6.5, w: 6, c: K.mute })}
    ${L(146, 40, 104, 14, 'AMOUNT SWEPT', { s: 6.5, w: 6, c: K.mute, a: 'r' })}
    ${L(262, 40, 70, 14, 'STATUS', { s: 6.5, w: 6, c: K.mute, a: 'c' })}
    ${R(16, 57, 334, 1, K.sep)}
    ${rows.length ? histBody : L(16, 58, 334, 44, 'No months closed yet. Tap Sweep now to start.', { s: 8.5, c: K.mute })}
    ${hist.length > 4 ? L(16, histH - 40, 334, 32, showAll ? 'Show fewer' : 'View all ' + hist.length + ' months  ›', { s: 8.5, w: 6, c: K.or, a: 'c', onClick: () => { l.histAll = !showAll; rerender(); } }) : null}`, { id: 'sweepHistory' });

  return html`${card}${history}`;
}

export function SweepConfirm(l) {
  const sc = l.sweepConfirm;
  if (!sc) return null;
  const open = closableMonths();
  if (!open.length) return null;
  const k = open.includes(sc.k) ? sc.k : open[0];
  const p = planThrough(k);
  const n = p.months.length;
  const close = () => { l.sweepConfirm = null; rerender(); };
  const step = d => { const i = open.indexOf(k) + d; if (i >= 0 && i < open.length) { l.sweepConfirm = { k: open[i] }; rerender(); } };
  const go = () => guard(async () => {
    l.sweepConfirm = null;
    for (const m of p.months) await runSweep(m.k, 'Manual');
    Notify(keyLabel(k, true) + ' closed · ' + RM(p.total) + ' moved to Balance Sweep' + (p.flagged ? '. ' + p.flagged + ' negative balance(s) need review.' : '.'), p.flagged ? 'warning' : 'success');
  });
  const shown = p.months.slice(-6);
  const hidden = p.months.slice(0, n - shown.length);
  const lines = shown.map(m => ({ nm: keyLabel(m.k, true), sub: m.rows.length + ' account(s)' + (m.flagged.length ? ' · ' + m.flagged.length + ' negative' : ''), amt: RM(m.total), c: m.flagged.length ? K.gold : K.text }));
  const hiddenAmt = round2(hidden.reduce((t, m) => t + m.total, 0));
  const nl = lines.length + (hidden.length ? 1 : 0);
  const top = 196;
  const h = top + nl * 34 + 150;
  const range = keyLabel(p.months[0].k) + (n > 1 ? ' – ' + keyLabel(k) : '');
  return html`<div class="abs" style="inset:0;z-index:40">
    <div class="abs dim" style="inset:0" onClick=${close}></div>
    ${Card(25, Math.max(70, 420 - h / 2), 340, h, html`
      ${L(20, 18, 300, 22, 'Close a month', { s: 13, w: 6 })}
      ${L(20, 42, 300, 30, 'Balances at each month end move into Balance Sweep, then the month is locked.', { s: 8, c: K.sub, wrap: true })}
      ${Box(20, 82, 300, 64, html`
        ${C(10, 14, 36, K.field, { onClick: () => step(-1) })}${I(19, 23, 18, 18, 'ChevronLeft', open.indexOf(k) > 0 ? K.text : K.mute, { pad: 1, onClick: () => step(-1) })}
        ${L(52, 10, 196, 12, 'CLOSE UP TO', { s: 6, w: 6, c: K.mute, a: 'c', ls: 1.4 })}
        ${L(52, 24, 196, 22, keyLabel(k, true), { s: 12, w: 6, a: 'c', id: 'sweepMonth' })}
        ${L(52, 46, 196, 12, 'ends ' + fmtD(keyEnd(k), 'dd mmm yyyy'), { s: 6.5, c: K.sub, a: 'c' })}
        ${C(254, 14, 36, K.field, { onClick: () => step(1) })}${I(263, 23, 18, 18, 'ChevronRight', open.indexOf(k) < open.length - 1 ? K.text : K.mute, { pad: 1, onClick: () => step(1) })}
        <div class="abs tap" style="left:0;top:0;width:50px;height:64px" onClick=${() => step(-1)} data-t="sweepPrev"></div>
        <div class="abs tap" style="left:250px;top:0;width:50px;height:64px" onClick=${() => step(1)} data-t="sweepNext"></div>`,
        { fill: 'rgba(255,255,255,0.025)', r: 14, b: 'rgba(255,106,0,0.35)' })}
      ${L(20, 158, 300, 14, n === 1 ? '1 MONTH TO CLOSE' : n + ' MONTHS TO CLOSE  ·  ' + range.toUpperCase(), { s: 6.5, w: 6, c: K.mute, ls: 1.2 })}
      ${R(20, 178, 300, 1, K.sep)}
      ${hidden.length ? html`${L(20, top - 12, 200, 30, hidden.length + ' earlier month(s)', { s: 9, c: K.sub })}${L(200, top - 12, 120, 30, RM(hiddenAmt), { s: 9, w: 6, a: 'r', c: K.sub })}` : null}
      ${lines.map((x, i) => { const y = top - 12 + (i + (hidden.length ? 1 : 0)) * 34; return html`
        ${L(20, y, 190, 18, x.nm, { s: 9, w: 6, c: x.c })}${L(20, y + 17, 190, 13, x.sub, { s: 6.5, c: K.mute })}
        ${L(200, y, 120, 18, x.amt, { s: 9, w: 6, a: 'r', c: x.c })}`; })}
      ${R(20, top - 6 + nl * 34, 300, 1, K.sep)}
      ${L(20, top + nl * 34, 150, 22, 'Total to move', { s: 9.5, w: 6 })}
      ${L(170, top + nl * 34, 150, 22, RM(p.total), { s: 10.5, w: 6, a: 'r', c: K.or, id: 'sweepTotal' })}
      ${Box(20, top + 30 + nl * 34, 300, 50, html`
        ${I(12, 16, 16, 16, 'Lock', K.or, { pad: 0 })}
        ${L(38, 5, 254, 40, 'After this, transactions up to ' + fmtD(keyEnd(k), 'dd mmm yyyy') + " can't be added, changed or deleted.", { s: 7.5, c: K.sub, wrap: true })}`,
        { fill: 'rgba(255,106,0,0.05)', r: 12, b: 'rgba(255,106,0,0.2)' })}
      ${B(20, h - 52, 144, 38, 'Cancel', { fill: K.field, b: HAIR, s: 9.5, r: 19, onClick: close, id: 'sweepCancel' })}
      ${B(176, h - 52, 144, 38, n > 1 ? 'Close ' + n + ' months' : 'Close month', { fill: K.or, c: '#FFFFFF', s: 9.5, r: 19, onClick: go, id: 'sweepConfirm' })}`, { b: 'rgba(255,106,0,0.35)' })}
  </div>`;
}
