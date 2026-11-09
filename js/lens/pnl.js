// MansWell · Lens · P&L — built 100% from Pocket. Laid out like a personal P&L sheet:
// Income · Savings & assets · Expenses · Leftover (swept) · Total savings · Savings rate · Status.
import { html, render } from '../vendor/preact-htm.js';
import { K, DB, rerender, Today, n0, current, store } from '../core.js';
import { loadXlsx, shareOrDownload } from '../backup.js';
import * as E from './engine.js';
import * as PS from '../payslip-data.js';
import { openGuide } from './guide.js';
import { Page, Sect, STC, chipCls, iconHtml, W0, W2, acc, pctTxt, UpdateNote, CSS } from './ui.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function defaultSel(y) {
  const c = E.curKey();
  if (E.kY(c) !== y) { const ks = E.yearKeys(y).filter(k => E.month(k).active); return ks.length ? ks[ks.length - 1] : y * 100 + 12; }
  const prev = E.kAdd(c, -1);
  return E.kY(prev) === y && E.month(prev).active ? prev : c;
}

/* the statement table (used in the page and in the full-year view) */
export function Statement(P, o = {}) {
  const doneIdx = P.months.map((m, i) => (m.closed && m.active ? i : -1)).filter(i => i >= 0);
  const cols = o.cols || P.months.map((m, i) => i);
  const sink = E.sinking();
  const head = html`<tr><th></th>${cols.map(i => { const m = P.months[i], s = E.status(m); return html`<th class=${m.k === o.sel ? 'cur' : ''}>${MON[i]}${s && m.closed ? html`<span class="ldot" style=${`background:${STC[s[1]]};opacity:${s[1] === 'grn2' ? 0.55 : 1}`}></span>` : null}</th>`; })}<th class="ytd">YTD</th><th>Avg</th></tr>`;
  const cell = (row, i, out, hl) => { const m = P.months[i]; if (!m.active) return html`<td class="lmu">–</td>`; return html`<td class=${(hl && m.closed && E.unusual(row, i, doneIdx) ? 'hi ' : '') + (m.k === o.sel ? 'cur' : '')}>${acc(row.vals[i], out)}</td>`; };
  const line = (row, out, hl, label, cls) => html`<tr class=${cls || ''}><td title=${row.n}>${label || row.n}</td>${cols.map(i => cell(row, i, out, hl))}<td class="ytd">${acc(row.ytd, out)}</td><td class="lmu">${acc(row.avg, out)}</td></tr>`;
  const totRow = (name, f, out, cls) => { const vals = P.months.map(m => m[f]); const r = { n: name, vals, ytd: P.ytd[f], avg: P.done.length ? P.ytd[f] / P.done.length : 0 };
    return html`<tr class=${cls}><td>${name}</td>${cols.map(i => P.months[i].active ? html`<td class=${P.months[i].k === o.sel ? 'cur' : ''}>${acc(vals[i], out)}</td>` : html`<td class="lmu">–</td>`)}<td class="ytd">${acc(r.ytd, out)}</td><td class="lmu">${acc(r.avg, out)}</td></tr>`; };
  const sec = t => html`<tr class="sec"><td>${t}</td>${cols.map(() => html`<td></td>`)}<td class="ytd" style="border-left-color:transparent"></td><td></td></tr>`;
  const expShown = o.all ? P.exp : P.exp.slice(0, 8), hidden = P.exp.slice(expShown.length);
  const moreRow = hidden.length ? (() => { const vals = P.months.map((m, i) => hidden.reduce((s, r) => s + r.vals[i], 0)); const ytd = hidden.reduce((s, r) => s + r.ytd, 0);
    return html`<tr class="more" onClick=${o.onMore} data-t="pnlMore"><td>+ ${hidden.length} more</td>${cols.map(i => P.months[i].active ? html`<td>${acc(vals[i], true)}</td>` : html`<td class="lmu">–</td>`)}<td class="ytd">${acc(ytd, true)}</td><td>${acc(P.done.length ? ytd / P.done.length : 0, true)}</td></tr>`; })() : null;
  const PR = o.gross ? P.months.map(m => E.payroll(m.k)) : null;
  const prDone = PR ? P.months.map((m, i) => (m.closed && m.active && PR[i] ? i : -1)).filter(i => i >= 0) : [];
  const prRow = (name, f, out, cls) => { if (!PR || !PR.some(Boolean)) return null; const ytd = prDone.reduce((s, i) => s + PR[i][f], 0);
    if (!PR.some(p => p && Math.round(p[f]))) return null;
    return html`<tr class=${cls || ''}><td>${name}</td>${cols.map(i => PR[i] ? html`<td class=${P.months[i].k === o.sel ? 'cur' : ''}>${acc(PR[i][f], out)}</td>` : html`<td class="lmu">–</td>`)}<td class="ytd">${acc(ytd, out)}</td><td class="lmu">${acc(prDone.length ? ytd / prDone.length : 0, out)}</td></tr>`; };
  const PRV = PR ? P.months.map((m, i) => (PR[i] ? { ...PR[i], socsoEis: PR[i].socso + PR[i].eis } : null)) : null;
  if (PR) PR.forEach((p, i) => { if (p) PR[i] = PRV[i]; });
  // gross view: salary goes gross → deductions (your side only) → net salary, inside Income; other income follows
  const PRon = !!(PR && PR.some(Boolean)), salSet = PRon ? PS.salaryCats() : new Set();
  const salRows = P.inc.filter(r => salSet.has(r.n)), othRows = PRon ? P.inc.filter(r => !salSet.has(r.n)) : P.inc;
  const netSal = PRon && salRows.length ? (() => { const vals = P.months.map((m, i) => salRows.reduce((s, r) => s + r.vals[i], 0)), ytd = salRows.reduce((s, r) => s + r.ytd, 0); return { n: salRows.map(r => r.n).join(' + '), vals, ytd, avg: P.done.length ? ytd / P.done.length : 0 }; })() : null;
  const ind = t => html`<span style="padding-left:10px">${t}</span>`;
  return html`<table class="ltbl" data-t="pnlTable">
    ${head}
    ${sec('Income')}${PRon ? html`${prRow('Gross pay', 'gross', false, 'gp')}${prRow(ind('KWSP · you'), 'kwspYou', true)}${prRow(ind('PCB tax'), 'pcb', true)}${prRow(ind('Zakat'), 'zakat', true)}${prRow(ind('PERKESO + SIP'), 'socsoEis', true)}${prRow(ind('Other deductions'), 'otherDed', true)}${netSal ? line(netSal, false, false, 'Net salary', 'tot') : null}` : null}${othRows.map(r => line(r, false))}${totRow('Total income', 'totIn', false, 'tot')}
    ${P.sav.length ? html`${sec('Savings & assets')}${P.sav.map(r => line(r, true, false, sink.includes(r.n) ? html`${r.n} <span class="lmu" style="font-size:9.5px;font-weight:500">sinking</span>` : null))}` : null}
    ${sec('Expenses')}${expShown.map(r => line(r, true, true))}${moreRow}${totRow('Total expenses', 'totExp', true, 'tot')}
    ${totRow(html`Leftover <span class="lmu" style="font-weight:500">· swept</span>`, 'left', false, 'tot')}
    ${totRow('Total savings', 'saved', false, 'key')}
    <tr class="key"><td>Savings rate</td>${cols.map(i => { const m = P.months[i], s = E.status(m); return html`<td class=${m.k === o.sel ? 'cur' : ''} style=${s ? `color:${STC[s[1]]}` : ''}>${m.active ? pctTxt(m.rate) : html`<span class="lmu">–</span>`}</td>`; })}<td class="ytd lup">${pctTxt(P.ytd.rate)}</td><td></td></tr>
    <tr><td style="font-weight:700">Status</td>${cols.map(i => { const m = P.months[i], s = E.status(m); return html`<td>${!m.active ? html`<span class="lmu">–</span>` : !m.closed ? html`<span class="lmu" style="font-size:10.5px">Running</span>` : s ? html`<span class=${'lchip ' + chipCls(s[1])} style="font-size:8.5px;padding:2px 6px">${s[0]}</span>` : '–'}</td>`; })}<td class="ytd"><span class="lchip c-grn" style="font-size:8.5px;padding:2px 6px">${P.healthy}/${P.done.length}</span></td><td></td></tr>
  </table>`;
}

/* full-year view: a layer above the app (not scaled), fits a phone held sideways */
let fullEl = null;
function fullView(l, P) {
  if (!fullEl) { fullEl = document.createElement('div'); fullEl.id = 'lensFull'; document.body.appendChild(fullEl); }
  if (!l.full) { render(null, fullEl); fullEl.style.display = 'none'; return; }
  fullEl.style.cssText = 'position:fixed;inset:0;z-index:60;background:#0D0F12;color:#F4F2EE;font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,"SF Pro Text",Roboto,"Helvetica Neue",Arial,sans-serif;display:block;font-variant-numeric:tabular-nums;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  const close = () => { l.full = false; rerender(); };
  render(html`<div style="height:100%;display:flex;flex-direction:column">
    <style>${CSS} .ltbl{font-size:11px}.ltbl td,.ltbl th{padding:5px 6px}.ltbl td:first-child,.ltbl th:first-child{max-width:170px;min-width:150px}</style>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px 8px;gap:10px">
      <div style="display:flex;align-items:baseline;gap:10px;min-width:0"><span style="font:25px Georgia,serif">Lens<i style="color:#FF6A00;font-style:normal">.</i></span><span class="lcap">P&L statement · ${P.y} · RM</span></div>
      <div style="display:flex;gap:8px"><button class="lbtn" onClick=${() => exportPnl(P, l.gross)} data-t="fullExport">${iconHtml('excel', K.grn, 15)}Export</button><button class="lbtn" onClick=${close} data-t="fullClose">Close</button></div>
    </div>
    <div class="ltw" style="margin:0;flex:1;overflow:auto;padding:0 0 20px">${Statement(P, { all: true, sel: l.sel, gross: l.gross })}</div>
  </div>`, fullEl);
}
// held sideways on the P&L page: open the full year automatically
let rotBound = false;
function bindRotate(l) {
  if (rotBound) return; rotBound = true;
  const chk = () => { if (current() === 'scrLensPnl' && window.innerWidth > window.innerHeight && window.innerWidth >= 560 && 'ontouchstart' in window) { l.full = true; rerender(); } };
  window.addEventListener('orientationchange', () => setTimeout(chk, 250));
}

/* Excel: the same statement, numbers as numbers */
export async function exportPnl(P, gross) {
  try {
    const X = await loadXlsx();
    const H = ['', ...MON, 'YTD', 'Avg'];
    const aoa = [['MansWell · Lens · P&L ' + P.y + ' (RM)'], [], H];
    const row = (n, vals, ytd, avg, out) => aoa.push([n, ...vals.map((v, i) => (P.months[i].active ? (out ? -v : v) : null)), out ? -ytd : ytd, out ? -avg : avg]);
    const sec = t => aoa.push([t.toUpperCase()]);
    sec('Income');
    const PR = gross ? P.months.map(m => E.payroll(m.k)) : null, sal = PR && PR.some(Boolean) ? PS.salaryCats() : new Set();
    if (PR && PR.some(Boolean)) {
      const pr = (n, f, out) => { const vals = PR.map(p => (p ? (f === 'socsoEis' ? p.socso + p.eis : p[f]) : 0)); if (!vals.some(v => Math.round(v))) return; const dn = P.months.map((m, i) => (m.closed && m.active && PR[i] ? i : -1)).filter(i => i >= 0), ytd = dn.reduce((s, i) => s + vals[i], 0); row(n, vals, ytd, dn.length ? ytd / dn.length : 0, out); };
      pr('Gross pay', 'gross'); pr('  KWSP (you)', 'kwspYou', true); pr('  PCB tax', 'pcb', true); pr('  Zakat', 'zakat', true); pr('  PERKESO + SIP', 'socsoEis', true); pr('  Other deductions', 'otherDed', true);
      const sr = P.inc.filter(r => sal.has(r.n)); if (sr.length) { const ytd = sr.reduce((s, r) => s + r.ytd, 0); row('Net salary', P.months.map((m, i) => sr.reduce((s, r) => s + r.vals[i], 0)), ytd, P.done.length ? ytd / P.done.length : 0); }
    }
    P.inc.filter(r => !sal.has(r.n)).forEach(r => row(r.n, r.vals, r.ytd, r.avg)); row('Total income', P.months.map(m => m.totIn), P.ytd.totIn, P.done.length ? P.ytd.totIn / P.done.length : 0);
    if (P.sav.length) { sec('Savings & assets'); P.sav.forEach(r => row(r.n + (E.sinking().includes(r.n) ? ' (sinking)' : ''), r.vals, r.ytd, r.avg, true)); }
    sec('Expenses'); P.exp.forEach(r => row(r.n, r.vals, r.ytd, r.avg, true)); row('Total expenses', P.months.map(m => m.totExp), P.ytd.totExp, P.done.length ? P.ytd.totExp / P.done.length : 0, true);
    row('Leftover (swept)', P.months.map(m => m.left), P.ytd.left, P.done.length ? P.ytd.left / P.done.length : 0);
    row('Total savings', P.months.map(m => m.saved), P.ytd.saved, P.done.length ? P.ytd.saved / P.done.length : 0);
    aoa.push(['Savings rate', ...P.months.map(m => (m.active && m.rate !== null ? m.rate / 100 : null)), P.ytd.rate === null ? null : P.ytd.rate / 100, null]);
    aoa.push(['Status', ...P.months.map(m => { const s = E.status(m); return !m.active ? '' : !m.closed ? 'Running' : s ? s[0] : ''; }), P.healthy + '/' + P.done.length, '']);
    const ws = X.utils.aoa_to_sheet(aoa);
    const rateRow = aoa.length - 2;
    Object.keys(ws).forEach(a => { if (a[0] === '!') return; const c = ws[a]; if (typeof c.v !== 'number') return; const r = X.utils.decode_cell(a).r; c.z = r === rateRow ? '0.0%' : '#,##0;(#,##0);-'; });
    ws['!cols'] = [{ wch: 30 }, ...H.slice(1).map(() => ({ wch: 10 }))];
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, 'P&L ' + P.y);
    const data = X.write(wb, { bookType: 'xlsx', type: 'array' });
    await shareOrDownload('MansWell-PnL-' + P.y + '.xlsx', new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  } catch (e) { (await import('../core.js')).Notify("Couldn't export: " + e.message, 'error'); }
}

const tile = (l, m, i) => {
  const s = E.status(m), on = m.k === l.sel;
  if (!m.closed && m.k === E.curKey()) return html`<div class=${'lmt' + (on ? ' on' : '')} onClick=${() => { l.sel = m.k; rerender(); }} data-t=${'mt-' + MON[i]}><span>${MON[i]}</span><b class="lmu">Running</b><em class="lmu">${m.rate !== null ? pctTxt(m.rate) + ' so far' : 'Closes ' + E.kEnd(m.k).slice(8) + ' ' + MON[E.kM(E.kAdd(m.k, 0)) - 1]}</em><div class="lbar"><i style="width:30%;background:#626872"></i></div></div>`;
  if (!m.active) return html`<div class="lmt off"><span>${MON[i]}</span><b class="lmu">—</b><em class="lmu">${m.k > E.curKey() ? 'Not started' : 'No activity'}</em><div class="lbar"></div></div>`;
  const c = s ? STC[s[1]] : K.sub;
  return html`<div class=${'lmt' + (on ? ' on' : '')} onClick=${() => { l.sel = m.k; rerender(); }} data-t=${'mt-' + MON[i]}><span>${MON[i]}</span><b style=${`color:${c}`}>${pctTxt(m.rate)}</b><em style=${`color:${c}`}>${s ? s[0] : ''}</em><div class="lbar"><i style=${`width:${Math.max(4, Math.min(100, Math.abs(m.rate || 0) / 50 * 100))}%;background:${c};opacity:${s && s[1] === 'grn2' ? 0.55 : 1}`}></i></div></div>`;
};
const TILE_CSS = `.lmts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.lmt{background:#1A1E24;box-shadow:inset 0 0 0 1px ${K.line};border-radius:12px;padding:10px 10px 11px;cursor:pointer}
.lmt.on{box-shadow:inset 0 0 0 1.5px rgba(255,106,0,.75)}.lmt span{font-size:10px;font-weight:600;letter-spacing:1.2px;color:${K.sub};text-transform:uppercase}
.lmt b{display:block;margin-top:6px;font-size:15px;font-weight:700}.lmt em{display:block;font-style:normal;font-size:10.5px;font-weight:600;margin:2px 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lmt .lbar{height:3px}.lmt.off{opacity:.65;cursor:default}`;

export const scrLensPnl = {
  onVisible(l) { if (!l.y) l.y = E.kY(E.curKey()); if (!l.sel || E.kY(l.sel) !== l.y) l.sel = defaultSel(l.y); l.scrolled = false; bindRotate(l); },
  view(l) {
    if (!l.y) this.onVisible(l);
    const P = E.pnlYear(l.y), th = E.thresholds();
    if (l.gross === undefined) l.gross = !!store.get('lens_gross', false);
    const hasPs = P.months.some(m => E.payroll(m.k));
    const sel = E.month(l.sel), mv = E.movers(l.sel), vb = E.vsBudget(l.sel), st = E.status(sel);
    const go = n => { l.y += n; l.sel = defaultSel(l.y); l.scrolled = false; rerender(); };
    const span = P.done.length ? MON[E.kM(P.done[0].k) - 1] + ' – ' + MON[E.kM(P.done[P.done.length - 1].k) - 1] + ' ' + l.y : '';
    fullView(l, P);
    // start the statement scrolled to the selected month
    requestAnimationFrame(() => { const w = document.querySelector('#lensPnl .ltw'); if (w && !l.scrolled) { const th2 = w.querySelector('th.cur'); w.scrollLeft = th2 ? Math.max(0, th2.offsetLeft - w.clientWidth + th2.offsetWidth * 1.6) : w.scrollWidth; l.scrolled = true; } });
    const anyData = P.months.some(m => m.active);
    const kids = html`
      <style>${TILE_CSS}</style>
      ${UpdateNote()}
      <div class="lc lsel" data-t="pnlYear"><span class="lcb" onClick=${() => go(-1)} aria-label="Previous year" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4 7 12l8 8"/></svg>' }}></span>
        <div class="t"><b>${l.y}</b><span>Jan – Dec ${l.y} · ${P.done.length} month${P.done.length === 1 ? '' : 's'} closed</span></div>
        <span class="lcb" onClick=${() => go(1)} aria-label="Next year" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 4 8 8-8 8"/></svg>' }}></span></div>
      ${!anyData ? html`<div class="lc"><div class="lempty">No transactions in ${l.y} yet.<br/>Lens reads everything from Pocket, so add transactions there and they show up here.</div></div>` : html`
      <div class="lc lh" data-t="pnlHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">Saved · ${l.y} so far</span><span class="lpill" data-t="pnlHealthy">${P.healthy} OF ${P.done.length} MONTHS HEALTHY</span></div>
        <div class="lbig" data-t="pnlSaved">${W2(P.ytd.saved)}</div>
        <div class="lsub">${P.ytd.rate !== null ? html`<span class=${P.ytd.rate >= 0 ? 'lup' : 'ldn'}>${P.ytd.rate >= 0 ? '▲' : '▼'} ${pctTxt(P.ytd.rate)} of income saved</span>` : 'No income yet'}${span ? ' · ' + span : ''}</div>
        <div class="lhr"></div>
        <div class="lg2 r2">
          <div><span class="lcap">Income</span><div class="lv" data-t="pnlInc">${W2(P.ytd.totIn)}</div></div>
          <div><span class="lcap">Expenses</span><div class="lv" data-t="pnlExp">${W2(P.ytd.totExp)}</div></div>
          <div><span class="lcap">Into savings</span><div class="lv" data-t="pnlInto">${W2(P.counted)}</div></div>
          <div><span class="lcap">Leftover · swept</span><div class="lv" data-t="pnlLeft">${W2(P.ytd.left)}</div></div>
        </div>
      </div>
      ${Sect('Monthly status')}
      <div class="lc" style="padding:14px">
        <div class="lmts">${P.months.map((m, i) => tile(l, m, i))}</div>
        <div class="lnote" style="margin-top:12px;display:flex;gap:6px 12px;flex-wrap:wrap"><span><b style=${`color:${K.grn}`}>Strong</b> ${th.strong}%+</span><span><b style=${`color:${K.grn};opacity:.75`}>Healthy</b> ${th.healthy}–${th.strong}%</span><span><b style=${`color:${K.gold}`}>Watch</b> 0–${th.healthy}%</span><span><b style=${`color:${K.red}`}>Deficit</b> below 0</span></div>
      </div>
      ${Sect('Statement', html`Full year ${iconHtml('expand', K.or, 13)}`, () => { l.full = true; rerender(); }, 'pnlFull')}
      <div class="lc" style="padding:14px 16px 10px">
        ${hasPs ? html`<div style=${`display:flex;justify-content:space-between;align-items:center;padding:0 0 12px;margin-bottom:10px;border-bottom:1px solid ${K.sep}`}><div><div style="font-size:13.5px;font-weight:600">Gross view</div><div class="lsub" style="margin-top:2px;font-size:11px">Income starts from gross pay: KWSP, tax and zakat, then net salary</div></div>
          <span class=${'lsw' + (l.gross ? ' on' : '')} onClick=${() => { l.gross = !l.gross; store.set('lens_gross', l.gross); rerender(); }} data-t="pnlGross" role="switch" aria-checked=${l.gross}><i></i></span></div>` : null}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span class="lcap">RM · swipe for other months</span><button class="lbtn" style="padding:6px 10px" onClick=${() => exportPnl(P, l.gross)} data-t="pnlExport">${iconHtml('excel', K.grn, 15)}Export</button></div>
        <div class="ltw">${Statement(P, { sel: l.sel, all: l.allExp, gross: l.gross, onMore: () => { l.allExp = true; rerender(); } })}</div>
        <div class="lnote" style="margin-top:10px;display:flex;align-items:center;gap:8px"><span style="width:14px;height:10px;border-radius:3px;background:rgba(255,106,0,.3);display:inline-block;flex:none"></span>Unusually high: more than double that category's usual month.</div>
      </div>
      ${sel.active ? html`
      ${Sect(E.kLabel(sel.k, true).split(' ')[0] + ', explained')}
      <div class="lc" data-t="pnlExplain">
        <div class="lg2"><div><span class="lcap">Savings rate</span><div class="lv" style=${st ? `color:${STC[st[1]]}` : ''}>${pctTxt(sel.rate)} ${mv.avgRate !== null && mv.prev ? html`<small>avg ${pctTxt(mv.avgRate)}</small>` : null}</div></div>
          <div><span class="lcap">Saved</span><div class="lv">${W2(sel.saved)} ${mv.prev ? html`<small class=${sel.saved - mv.avgSaved >= 0 ? 'lup' : 'ldn'}>${sel.saved - mv.avgSaved >= 0 ? '+' : '−'}${n0(Math.abs(sel.saved - mv.avgSaved))} vs avg</small>` : null}</div></div></div>
        ${!sel.closed ? html`<div class="lnote" style="margin-top:10px">This month is still running. It closes on ${E.kEnd(sel.k).slice(8)} ${MON[E.kM(sel.k) - 1]}.</div>` : null}
        ${mv.prev ? html`<div class="lhr"></div><span class="lcap">Biggest moves vs your previous ${mv.prev} month${mv.prev === 1 ? '' : 's'}</span>
        <div style="margin-top:8px">${mv.list.map(x => html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t" style="font-size:14px">${x.n}</div><div class="s">${x.grp === 'inc' ? 'Income' : 'Expense'} · usually ${W0(x.avg)} a month</div></div><div class=${'r ' + (x.good ? 'lup' : 'ldn')}>${x.d > 0 ? '+' : '−'}${W0(Math.abs(x.d))}<small class="lmu">${x.good ? 'helped' : 'hurt'}</small></div></div>`)}</div>` : html`<div class="lnote" style="margin-top:10px">Comparisons start once there's an earlier month to compare with.</div>`}
        ${vb ? html`<div class="lhr"></div><span class="lcap">Spending vs budget</span>
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:14px"><b>${W0(vb.act)} <span class="lmu" style="font-weight:500">of ${W0(vb.plan)}</span></b><span class=${vb.act <= vb.plan ? 'lup' : 'ldn'} style="font-weight:600">${vb.act <= vb.plan ? W0(vb.plan - vb.act) + ' under' : W0(vb.act - vb.plan) + ' over'}</span></div>
          ${vb.over.slice(0, 3).map(r => html`<div class="lnote" style="margin-top:6px">${r.n}: <b>${W0(r.act)}</b> vs ${W0(r.plan)} budget</div>`)}` : null}
      </div>` : null}`}`;
    return Page(l, 0, kids, 'lensPnl', () => openGuide(l, 'pnl'));
  }
};
