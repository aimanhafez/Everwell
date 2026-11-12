// Pocket · Close the year. After December is swept: a quick check, move the Balance Sweep money into Savings or Tabung,
// choose the day 2027's months start (24th – 2nd), then lock the year. A locked year can only be changed in the Google Sheet.
import { html } from '../vendor/preact-htm.js';
import { K, DB, L, I, rerender, save, guard, Notify, Back as back, fmtD, addDays, PSTART, PEND, D, settingsRow, yearRules, cdOf, round2, api } from '../core.js';
import { TabHeader, PasswordDialog, askPassword } from '../shared.js';
import { SWEEP_ID, yearToClose, isSwept } from '../sweep.js';
import { css, Sect, num, W2, Check } from '../lens/ui.js';
import * as E from '../lens/engine.js';
import { payslipYear } from '../payslip-data.js';

const DAYS = [24, 25, 26, 27, 28, 29, 30, 31, 1, 2];
const ord = d => d + (d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th');
const dm = d => fmtD(d, 'dd mmm yyyy');
const YC_CSS = () => `
.yc-row{display:grid;grid-template-columns:1fr 118px;gap:10px;align-items:center;padding:9px 0;border-top:1px solid ${K.sep}}
.yc-row:first-child{border-top:0}.yc-row .t{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yc-row .s{font-size:11px;color:${K.sub};margin-top:2px}
.yc-chk{display:grid;grid-template-columns:20px 1fr;gap:10px;padding:8px 0;border-top:1px solid ${K.sep};font-size:13px;line-height:1.4}.yc-chk:first-child{border-top:0}
.yc-days{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:8px}
.yc-days span{text-align:center;padding:10px 0;border-radius:10px;font-size:13px;font-weight:700;color:${K.sub};box-shadow:inset 0 0 0 1px ${K.line2 || K.line2};cursor:pointer}
.yc-days span.on{color:${K.or};box-shadow:inset 0 0 0 1.5px ${K.or};background:${K.orTint}}
.yc-tot{display:flex;justify-content:space-between;padding:11px 0 2px;border-top:1px solid ${K.line2 || K.line2};font-weight:700;font-size:14px}`;

const sweepBalance = () => round2(DB.txns.filter(t => t.TxAcc === SWEEP_ID && !t.TxParent).reduce((s, t) => s + (t.TxDir === 'In' ? t.TxAmt : -t.TxAmt), 0));
/** Where the Balance Sweep can go: Lens Savings and Tabung (not Balance Sweep itself), or Pocket Savings/Asset categories if Lens isn't set up. */
function targets() {
  const lens = DB.lnOk && E.lget('openOk', false) ? E.assets().filter(a => a.AsKind !== 'account') : [];
  if (lens.length) return lens.map(a => ({ id: a.AsId, a, name: a.AsName, sub: (E.isTabung(a) ? 'Tabung' : 'Savings') + (a.AsKind === 'category' ? '' : ' · value you update'), cat: a.AsKind === 'category' ? a.AsCat : '' }));
  return E.savCats().map(c => ({ id: 'cat:' + c, a: null, name: c, sub: 'Pocket Savings/Asset category', cat: c }));
}
/** The year's loose ends, so nothing is locked by mistake. Only reminders: closing is still allowed. */
function checks(y) {
  const from = PSTART(y, 1), to = PEND(y, 12), tx = DB.txns.filter(t => t.TxDate >= from && t.TxDate <= to && !t.TxParent);
  const uncat = tx.filter(t => (t.TxType === 'Expense' || t.TxType === 'Income') && !t.TxCat).length;
  const ps = payslipYear(y), cards = E.cardStatus();
  const stale = E.lget('openOk', false) ? E.assets().filter(a => a.AsKind === 'manual' && !E.valuesOf(a.AsId).some(v => v.VaDate >= addDays(to, -120))).map(a => a.AsName) : [];
  return [
    [!uncat, uncat ? uncat + ' transaction' + (uncat === 1 ? '' : 's') + ' without a category' : 'Every transaction has a category'],
    [!ps.n || ps.matched === ps.n, ps.n ? ps.matched + ' of ' + ps.n + ' payslips matched to their salary' : 'No payslips this year'],
    [cards.none || !cards.carried, cards.none ? 'No credit cards' : cards.carried ? W2(cards.carried) + ' card balance carried past the due date' : 'Cards paid on time'],
    [!stale.length, stale.length ? 'Not updated lately: ' + stale.join(', ') : 'Values you update are fresh']
  ];
}

export const scrYearClose = {
  onVisible(l) { l.y = yearToClose(); l.alloc = {}; l.day = l.y ? cdOf(l.y) : 28; l.done = null; if (!DAYS.includes(l.day)) l.day = 28; },
  view(l) {
    if (l.y === undefined) this.onVisible(l);
    const y = l.y;
    const head = html`<style>${css()}${YC_CSS()}</style>${TabHeader()}${L(18, 68, 300, 32, y ? 'Close ' + y : 'Close the year', { s: 17 })}${I(334, 70, 30, 30, 'Cancel', K.sub, { pad: 6, onClick: () => back(), label: 'Back' })}`;
    if (l.done) return html`<div>${head}<div class="lz" style="top:104px;bottom:20px" id="yearClose">
      <div class="lc lh" data-t="ycDone"><span class="lcap">${l.done.y} closed</span><div class="lbig">Locked</div>
        <div class="lsub">Everything up to ${dm(l.done.through)} is final. Only the Google Sheet itself can change it.</div><div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Moved from Balance Sweep</span><div class="lv">${W2(l.done.amt)}</div></div><div><span class="lcap">${l.done.y + 1} months start</span><div class="lv">${ord(l.done.day)}</div></div></div>
        <div class="lnote" style="margin-top:12px">January ${l.done.y + 1} runs ${dm(l.done.janS)} – ${dm(l.done.janE)}. ${l.done.backup || ''}</div></div>
      <div style="margin:0 12px"><button class="lbtnf" onClick=${() => back()} data-t="ycBack">Done</button></div></div></div>`;
    if (!y) return html`<div>${head}<div class="lz" style="top:104px;bottom:20px"><div class="lc"><div class="lempty">There's no year ready to close. Sweep December first, then come back here.</div></div></div></div>`;
    const bal = sweepBalance(), T = targets(), sum = round2(T.reduce((s, t) => s + num(l.alloc[t.id]), 0)), left = round2(bal - sum);
    const ct = PEND(y, 12), janS = addDays(ct, 1), feb = l.day <= 2 ? D(y + 1, 2, l.day) : D(y + 1, 1, l.day), janE = addDays(feb, -1);
    const days = Math.round((new Date(janE) - new Date(janS)) / 864e5) + 1;
    const ok = Math.abs(left) < 0.005 && bal >= 0;
    const confirm = () => askPassword(l, 'close ' + y + ' for good', () => guard(async () => {
      const ref = 'ALLOC-' + y, rows = [], vals = [];
      T.forEach(t => { const v = round2(num(l.alloc[t.id])); if (!v) return;
        rows.push({ TxnId: 'TX-' + ref + '-' + rows.length, TxSeq: 0, TxAcc: SWEEP_ID, TxDate: ct, TxType: 'Transfer', TxDir: v > 0 ? 'Out' : 'In', TxAmt: Math.abs(v), TxCat: t.cat || '', TxPayee: '', TxDesc: 'Year-end allocation ' + y + ' → ' + t.name, TxNote: '', TxTrf: '', TxRef: ref, TxParent: '', TxIsSplit: false, TxRule: '' });
        if (t.a && t.a.AsKind === 'manual') vals.push({ VaId: 'VA-' + ref + '-' + vals.length, VaAsset: t.a.AsId, VaDate: ct, VaKind: 'add', VaAmt: v, VaNote: 'Balance Sweep ' + y });
      });
      const seq0 = DB.txns.reduce((m, t) => Math.max(m, Number(t.TxSeq) || 0), 0); rows.forEach((r, i) => { r.TxSeq = seq0 + i + 1; });
      const R = yearRules(), cycle = { ...(R.cycle || {}) };
      if (!Object.keys(cycle).length) cycle[y] = cdOf(y); // pin the closed year to the day it used
      cycle[y + 1] = l.day;
      const rules = { ...R, cycle, closedThrough: ct, closed: [...new Set([...(R.closed || []).map(Number), y])].sort() };
      const up = { EW_Transactions: rows, EW_Settings: [settingsRow({ StYears: JSON.stringify(rules) })] };
      if (vals.length) up.LN_Values = vals;
      await save({ up, log: [{ AuAction: 'Year closed', AuRef: 'YEAR-' + y, AuDetail: y + ' locked up to ' + ct + ' · ' + W2(bal) + ' allocated · ' + (y + 1) + ' months start on the ' + ord(l.day) }] });
      l.done = { y, through: ct, amt: bal, day: l.day, janS: PSTART(y + 1, 1), janE: PEND(y + 1, 1), backup: '' };
      try { await api('backupNow', { label: 'year ' + y + ' closed' }); l.done.backup = 'A copy of your Sheet was saved to Drive › MansWell Backups.'; } catch (e) { l.done.backup = ''; }
      rerender();
    }));
    return html`<div>${head}
      <div class="lz" style="top:104px;bottom:20px" id="yearClose">
        <div class="lc" data-t="ycChecks"><span class="lcap">Before you lock ${y}</span>
          <div style="margin-top:8px">${checks(y).map(([good, t]) => html`<div class="yc-chk"><span style=${`color:${good ? K.grn : K.gold};font-weight:700`}>${good ? '✓' : '!'}</span><span style=${good ? '' : `color:${K.gold}`}>${t}</span></div>`)}</div>
          <div class="lnote" style="margin-top:6px">Only reminders. You can still close.</div></div>
        ${Sect('1 · Allocate Balance Sweep')}
        <div class="lc" data-t="ycAlloc">
          <span class="lcap">${y} Balance Sweep</span><div class="lbig" style="font-size:26px" data-t="ycBal">${W2(bal)}</div>
          <div class="lnote" style="margin:4px 0 8px">Decide where all of it goes. Only Savings and Tabung, never a bank account. It was already counted as savings when it was swept, so the ${y} P&L doesn't change.</div>
          ${T.length ? T.map(t => html`<div class="yc-row"><div style="min-width:0"><div class="t">${t.name}</div><div class="s">${t.sub}</div></div>
            <input class="lin r" inputmode="decimal" placeholder="0.00" value=${l.alloc[t.id] || ''} onInput=${e => { l.alloc[t.id] = e.target.value; rerender(); }} data-t=${'al-' + t.name} /></div>`)
            : html`<div class="lnote">No Savings or Tabung yet. Add one on the Lens Savings page first.</div>`}
          <div class="yc-tot"><span>Left to allocate</span><span style=${`color:${Math.abs(left) < 0.005 ? K.grn : K.gold}`} data-t="ycLeft">${W2(left)}</span></div>
          ${T.length && Math.abs(left) >= 0.005 ? html`<div style=${`margin-top:8px;color:${K.or};font-size:12.5px;font-weight:600;cursor:pointer`} onClick=${() => { const t = T[0]; l.alloc[t.id] = String(round2(num(l.alloc[t.id]) + left)); rerender(); }} data-t="ycRest">Put the rest into ${T[0].name}</div>` : null}
        </div>
        ${Sect('2 · ' + (y + 1) + ' months start on')}
        <div class="lc" data-t="ycDay">
          <div class="yc-days">${DAYS.map(d => html`<span class=${d === l.day ? 'on' : ''} onClick=${() => { l.day = d; rerender(); }} data-t=${'day-' + d}>${ord(d)}</span>`)}</div>
          <div class="lnote" style="margin-top:12px" data-t="ycPreview">${y} ends on <b>${dm(ct)}</b> and stays as it is. <b>January ${y + 1}</b> runs ${dm(janS)} – ${dm(janE)} (${days} days)${days !== 31 && days !== 30 ? ', a one-time ' + (days > 31 ? 'longer' : 'shorter') + ' month' : ''}. Then ${l.day <= 2 ? 'the ' + ord(l.day) + ' of each month to the day before the next ' + ord(l.day) : 'the ' + ord(l.day) + ' to the ' + ord(l.day - 1)}.</div>
          <div class="lnote" style="margin-top:8px">Tip: start months on your payday, so each month opens with its salary.</div>
        </div>
        ${Sect('3 · Lock ' + y)}
        <div class="lc"><div class="lnote">Once closed, ${y}'s transactions, payslips and Balance Sweep can't be changed in the app, and its months can't be reopened. A copy of your Sheet is saved to Drive.</div>
          <button class="lbtnf" style=${`margin-top:12px;${ok ? '' : 'opacity:.45'}`} onClick=${() => (ok ? confirm() : Notify('Allocate all of the Balance Sweep first: ' + W2(left) + ' left.', 'info'))} data-t="ycConfirm">Close ${y} and lock it</button></div>
        <div style="height:10px"></div>
      </div>
      ${PasswordDialog(l)}
    </div>`;
  }
};
