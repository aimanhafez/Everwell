// MansWell · Lens · Savings & assets — opening balances confirmed once, then a roll-forward:
// Opening + In (Pocket savings categories, Balance Sweep, or a monthly estimate) + Growth (dividends, prices) = Now.
import { html } from '../vendor/preact-htm.js';
import { K, DB, rerender, Today, n0, fmtD, addDays } from '../core.js';
import { askPassword } from '../shared.js';
import { SWEEP_ID, sweepAccount } from '../sweep.js';
import * as E from './engine.js';
import { openGuide } from './guide.js';
import { Page, Sect, iconHtml, W0, W2, UpdateNote, openSheet, closeSheet, lsave, canWrite, num, newId, Check } from './ui.js';

const PAL = ['#FF6A00', '#FF9A4D', '#E9B949', '#6B7178', '#A3236F', '#FFB27A', '#8A6FD1', '#C4C9CE'];
const LIQ = ['Ready now', 'Within days', 'Retirement'];
const LIQ_S = ['Cash you can use today', 'A few days to withdraw or sell', 'Mostly locked until retirement'];
const dmy = d => fmtD(d, 'dd mmm yyyy');

/* first time: what did each one hold the day before Pocket starts? */
function proposals() {
  const list = [], od = E.openDate();
  if (sweepAccount()) list.push({ key: 'sweep', name: 'Balance Sweep', kind: 'account', acc: SWEEP_ID, open: String(E.acctBal(SWEEP_ID, od)), on: true, liq: 0, locked: true, sub: 'From Pocket' });
  for (const c of E.savCats()) { const kw = /kwsp|epf/i.test(c); list.push({ key: 'cat:' + c, name: c, kind: 'category', cat: c, open: '', on: DB.txns.some(t => t.TxCat === c), liq: kw ? 2 : E.sinking().includes(c) ? 0 : 1, sub: 'Linked to category “' + c + '”' + (kw ? ' · also grows from your payslips' : '') }); }
  if (!list.some(x => /kwsp|epf/i.test(x.name))) list.push({ key: 'kwsp', name: 'KWSP', kind: 'manual', cat: 'payslip:kwsp', open: '', monthly: '', on: false, liq: 2, sub: 'Opening from your i-Akaun statement · grows from your payslips' });
  return list;
}
function Setup(l) {
  if (!l.setup) l.setup = proposals();
  const od = E.openDate();
  const row = x => html`<div class="lr" style="grid-template-columns:24px 1fr 124px;align-items:start" data-t=${'open-' + x.name}>
    <span onClick=${() => { if (!x.locked) { x.on = !x.on; rerender(); } }} style="padding-top:8px;cursor:pointer">${Check(x.on)}</span>
    <div>${x.kind === 'manual' && x.custom ? html`<input class="lin" style="height:36px;font-size:14px" placeholder="Name" value=${x.name} onInput=${e => { x.name = e.target.value; }} />` : html`<div class="t" style="font-size:14px">${x.name}</div>`}
      <div class="s">${x.sub || ''}</div>
      ${x.kind === 'manual' && x.on ? html`<div class="llab" style="margin-top:8px">${x.cat === 'payslip:kwsp' ? 'Monthly estimate · only for months without a payslip' : 'Monthly contribution (optional)'}</div><input class="lin r" inputmode="decimal" placeholder="e.g. payslip KWSP" value=${x.monthly} onInput=${e => { x.monthly = e.target.value; }} style="height:36px" />` : null}</div>
    <input class="lin r" inputmode="decimal" placeholder="0.00" disabled=${x.locked} value=${x.locked ? Number(x.open).toFixed(2) : x.open} onInput=${e => { x.open = e.target.value; if (!x.on && e.target.value) { x.on = true; rerender(); } }} data-t=${'openAmt-' + x.name} />
  </div>`;
  const confirm = () => {
    if (!canWrite()) return;
    const rows = l.setup.filter(x => x.on && String(x.name).trim()).map((x, i) => ({ AsId: newId('AS'), AsSeq: i + 1, AsName: String(x.name).trim(), AsKind: x.kind, AsCat: x.cat || '', AsAcc: x.acc || '', AsOpen: x.kind === 'account' ? 0 : num(x.open), AsLiq: x.liq, AsMonthly: num(x.monthly), AsNote: '', AsActive: true }));
    if (!rows.length) return;
    lsave({ up: { LN_Assets: rows, LN_Settings: [E.lrow('openOk', true), E.lrow('openDate', od)] } }, 'Opening balances confirmed', rows.map(r => r.AsName + ' ' + r.AsOpen).join(', '));
    l.setup = null;
  };
  return html`
    <div class="lc lh"><span class="lcap">Step 1 of Lens · once only</span>
      <div style="font-size:19px;font-weight:600;margin-top:8px;line-height:1.35">What did each one hold on <span class="lor">${dmy(od)}</span>?</div>
      <div class="lsub" style="margin-top:8px">That's the day before Pocket starts. Lens adds Pocket's movements on top of these figures, so the two always line up.</div></div>
    <div class="lc" style="padding:6px 16px">${l.setup.map(row)}
      <div style="padding:12px 0 10px;color:${K.or};font-size:13.5px;font-weight:600;cursor:pointer" data-t="openAdd" onClick=${() => { l.setup.push({ key: 'm' + Date.now(), name: '', kind: 'manual', custom: true, open: '', monthly: '', on: true, liq: 1, sub: 'Fixed deposit, Tabung Haji, stocks…' }); rerender(); }}>+ Add another · fixed deposit, Tabung Haji, stocks…</div></div>
    <div style="margin:6px 12px 0"><button class="lbtnf" onClick=${confirm} data-t="openConfirm">Confirm & lock</button></div>
    <div class="lnote" style="margin:10px 16px 6px;text-align:center">Only savings and assets. Your bank accounts stay in Pocket. You can change these later in Lens Settings with your password.</div>`;
}

/* KWSP linked to a Pocket category: where "+ In" comes from */
function psSplit(a) {
  const r = E.rollForward().list.find(x => x.a.AsId === a.AsId); if (!r) return '';
  const p = v => (v < 0 ? '(' + n0(-v) + ')' : n0(v));
  return html`Grows from your payslips (you + employer${r.est ? ', estimate for months without one' : ''}) and moves with Pocket category “${a.AsCat}”. Since ${dmy(E.openDate())}: payslips <b>${p(r.psIn)}</b> + Pocket <b>${p(r.pocket)}</b> = <b>${p(r.inn)}</b>.`;
}

/* sheets */
export function editAsset(l, a) {
  const f = a ? { name: a.AsName, liq: Number(a.AsLiq) || 0, monthly: a.AsMonthly ? String(a.AsMonthly) : '', open: String(a.AsOpen || 0), kind: a.AsKind, cat: a.AsCat } : { name: '', liq: 1, monthly: '', open: '', kind: 'manual', cat: '' };
  const linked = new Set(E.assets().filter(x => x.AsKind === 'category').map(x => x.AsCat));
  openSheet(l, {
    title: a ? a.AsName : 'Add asset',
    body: () => html`
      <div class="llab">Name</div><input class="lin" value=${f.name} onInput=${e => { f.name = e.target.value; }} data-t="asName" disabled=${a && a.AsKind === 'account'} />
      ${!a ? html`<div class="llab">Tracked by</div><select class="lin" onChange=${e => { f.kind = e.target.value; rerender(); }} data-t="asKind">
          <option value="manual" selected=${f.kind === 'manual'}>Value you update (KWSP, FD, stocks…)</option>
          <option value="category" selected=${f.kind === 'category'}>A Pocket savings category</option></select>
        ${f.kind === 'category' ? html`<div class="llab">Pocket category</div><select class="lin" onChange=${e => { f.cat = e.target.value; if (!f.name) f.name = f.cat; rerender(); }} data-t="asCat"><option value="">Choose…</option>${E.savCats().filter(c => !linked.has(c)).map(c => html`<option value=${c} selected=${f.cat === c}>${c}</option>`)}</select>` : null}` : html`<div class="lnote" style="margin-top:8px">${a.AsKind === 'account' ? 'Value comes straight from Pocket.' : a.AsKind === 'category' ? (E.payslipFed(a) ? psSplit(a) : 'Moves with Pocket category “' + a.AsCat + '”, plus the values you add.') : 'Value you update' + (a.AsMonthly ? ', plus an estimated monthly contribution.' : '.')}</div>`}
      <div class="llab">Access</div><select class="lin" onChange=${e => { f.liq = Number(e.target.value); }} data-t="asLiq">${LIQ.map((t, i) => html`<option value=${i} selected=${f.liq === i}>${t} · ${LIQ_S[i]}</option>`)}</select>
      ${f.kind === 'manual' || (a && E.payslipFed(a)) ? html`<div class="llab">${a && E.payslipFed(a) ? 'Monthly estimate · only for months without a payslip' : 'Monthly contribution · optional estimate'}</div><input class="lin r" inputmode="decimal" value=${f.monthly} placeholder="0.00" onInput=${e => { f.monthly = e.target.value; }} data-t="asMonthly" />` : null}
      ${f.kind !== 'account' ? html`<div class="llab">Opening value on ${dmy(E.openDate())}</div><input class="lin r" inputmode="decimal" value=${f.open} placeholder="0.00" onInput=${e => { f.open = e.target.value; }} data-t="asOpen" />` : null}
      ${a && a.AsKind !== 'account' ? html`<div class="llab">History</div>${E.valuesOf(a.AsId).length ? E.valuesOf(a.AsId).slice().reverse().map(v => html`<div class="lr" style="grid-template-columns:1fr auto auto"><div><div class="t" style="font-size:13.5px">${v.VaKind === 'value' ? 'Value set' : 'Added'} · ${dmy(v.VaDate)}</div>${v.VaNote ? html`<div class="s">${v.VaNote}</div>` : null}</div><div class="r">${W2(v.VaAmt)}</div>
          <span style="cursor:pointer;color:${K.red};padding:4px" onClick=${() => { lsave({ del: { LN_Values: [v.VaId] } }, 'Value removed', a.AsName); rerender(); }}>${iconHtml('trash', K.red, 16)}</span></div>`) : html`<div class="lnote">No updates yet.</div>`}` : null}
      ${a && a.AsKind !== 'account' ? html`<div style="margin-top:16px"><button class="lbtnd" data-t="asDelete" onClick=${() => askPassword(l, 'remove ' + a.AsName + ' from Lens', () => { lsave({ del: { LN_Assets: [a.AsId], LN_Values: E.valuesOf(a.AsId).map(v => v.VaId) } }, 'Asset removed', a.AsName); closeSheet(l); })}>Remove from Lens</button></div>` : null}`,
    onSave: () => {
      const name = String(f.name || '').trim(); if (!name) return;
      if (!a && f.kind === 'category' && !f.cat) return;
      const row = { ...(a || { AsId: newId('AS'), AsSeq: E.assets().length + 1, AsKind: f.kind, AsCat: f.kind === 'category' ? f.cat : '', AsAcc: '', AsNote: '', AsActive: true }), AsName: name, AsLiq: f.liq, AsMonthly: num(f.monthly), AsOpen: f.kind === 'account' ? 0 : num(f.open) };
      const doIt = () => { lsave({ up: { LN_Assets: [row] } }, a ? 'Asset updated' : 'Asset added', name); closeSheet(l); };
      if (a && num(f.open) !== Number(a.AsOpen || 0) && a.AsKind !== 'account') askPassword(l, 'change an opening balance', doIt); else doIt();
    }
  });
}
export function updateValue(l, a, kind) {
  const f = { kind: kind || 'value', date: Today(), amt: '', note: '' };
  openSheet(l, {
    title: a.AsName,
    body: () => html`
      <div style="display:flex;gap:8px;margin-top:4px">${[['value', 'Set current value'], ['add', 'Add dividend / bonus']].map(([k, t]) => html`<button class=${'lbtn' + (f.kind === k ? ' o on' : '')} style="flex:1" onClick=${() => { f.kind = k; rerender(); }} data-t=${'vk-' + k}>${t}</button>`)}</div>
      <div class="lnote" style="margin-top:10px">${f.kind === 'value' ? 'The full value on that date, from a statement or today\'s price. Lens works out the growth.' : 'Money added that didn\'t go through Pocket, like a dividend credited into the account.'}</div>
      <div class="llab">Date</div><input class="lin" type="date" value=${f.date} max=${Today()} onInput=${e => { f.date = e.target.value; }} data-t="vaDate" />
      <div class="llab">${f.kind === 'value' ? 'Value (RM)' : 'Amount (RM)'}</div><input class="lin r" inputmode="decimal" placeholder="0.00" value=${f.amt} onInput=${e => { f.amt = e.target.value; }} data-t="vaAmt" />
      <div class="llab">Note · optional</div><input class="lin" value=${f.note} placeholder=${f.kind === 'value' ? 'e.g. i-Akaun statement' : 'e.g. 2026 dividend'} onInput=${e => { f.note = e.target.value; }} />
      <div class="lnote" style="margin-top:10px">Now: <b>${W2(E.valueAt(a, Today()))}</b></div>`,
    onSave: () => {
      if (!f.date || f.date < E.openDate() || String(f.amt).trim() === '') return;
      lsave({ up: { LN_Values: [{ VaId: newId('VA'), VaAsset: a.AsId, VaDate: f.date, VaKind: f.kind, VaAmt: num(f.amt), VaNote: f.note }] } }, f.kind === 'value' ? 'Value updated' : 'Dividend added', a.AsName + ' ' + f.amt);
      closeSheet(l);
    }
  });
}

/* growth chart: stacked month-end values */
/* growth: one line from the opening balance to today, a point per month-end. Total, or one asset. Tap or drag to read a month. */
const MONL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const G_CSS = `.gchips{display:flex;gap:6px;overflow-x:auto;padding:0 0 12px;scrollbar-width:none}.gchips::-webkit-scrollbar{display:none}
.gchip{flex:none;font-size:12px;font-weight:600;padding:6px 11px;border-radius:99px;box-shadow:inset 0 0 0 1px #2C3038;color:${K.sub};cursor:pointer;white-space:nowrap}
.gchip.on{color:${K.or};box-shadow:inset 0 0 0 1px rgba(255,106,0,.55);background:rgba(255,106,0,.1)}
.gread{margin-bottom:6px}.gread .row{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-top:3px}.gread b{font-size:20px;font-weight:700}.gread small{font-size:11.5px;font-weight:600;white-space:nowrap}`;
const niceStep = r => { const e = Math.pow(10, Math.floor(Math.log10(r))), f = r / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; };
const kfmt = (v, st) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(st < 1000 ? 1 : 0).replace(/\.0$/, '') + 'K' : String(Math.round(v)));
function Growth(l, S) {
  const opts = [{ id: 'total', name: 'Total', vals: S.total }, ...S.rows.filter(r => r.vals.some(v => Math.abs(v) >= 0.5)).map(r => ({ id: r.a.AsId, name: r.a.AsName, vals: r.vals }))];
  const cur = opts.find(o => o.id === l.gSel) || opts[0], v = cur.vals, n = v.length;
  const gi = l.gI != null && l.gI < n ? l.gI : n - 1;
  const W = 334, H = 172, pl = 8, pr = 42, top = 10, bot = 24, ch = H - top - bot;
  let lo = Math.min(...v), hi = Math.max(...v); if (hi - lo < 1) { lo -= 50; hi += 50; }
  const st = niceStep((hi - lo) / 3), y0 = Math.floor(lo / st) * st, y1 = Math.ceil(hi / st) * st;
  const X = i => pl + i * (W - pl - pr) / (n - 1), Y = x => top + ch - (x - y0) / (y1 - y0) * ch;
  const ticks = []; for (let t = y0; t <= y1 + st / 2; t += st) ticks.push(t);
  const every = Math.ceil(n / 7), shown = new Set(); for (let i = 0; i < n; i += every) shown.add(i);
  if ([...shown].some(i => i !== n - 1 && n - 1 - i < every * 0.6)) shown.delete([...shown].pop()); shown.add(n - 1);
  const lab = i => (i === 0 ? 'Open' : MONL[E.kM(S.ks[i]) - 1]);
  const pick = e => { const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width; const i = Math.max(0, Math.min(n - 1, Math.round((x - pl) / ((W - pl - pr) / (n - 1))))); if (i !== l.gI) { l.gI = i; rerender(); } };
  const when = gi === 0 ? 'Opening · ' + dmy(S.dates[0]) : gi === n - 1 ? 'Now · ' + dmy(S.dates[gi]) : 'End of ' + E.kLabel(S.ks[gi]) + ' · ' + dmy(S.dates[gi]);
  const d = v[gi] - v[0], steps = n - 1;
  let best = null; for (let i = 1; i < n; i++) { const x = v[i] - v[i - 1]; if (!best || x > best.d) best = { i, d: x }; }
  return html`${Sect('Growth')}
    <div class="lc" data-t="asGrowth"><style>${G_CSS}</style>
      ${opts.length > 2 ? html`<div class="gchips">${opts.map(o => html`<span class=${'gchip' + (o === cur ? ' on' : '')} onClick=${() => { l.gSel = o.id; l.gI = null; rerender(); }} data-t=${'gc-' + o.name}>${o.name}</span>`)}</div>` : null}
      <div class="gread" data-t="gRead"><span class="lcap">${when}</span><div class="row"><b>${W0(v[gi])}</b>${gi > 0 ? html`<small class=${d >= 0 ? 'lup' : 'ldn'}>${d >= 0 ? '▲' : '▼'} ${W0(Math.abs(d))} since opening</small>` : html`<small class="lmu">Starting balance</small>`}</div></div>
      <svg width="100%" viewBox=${`0 0 ${W} ${H}`} style="display:block;touch-action:pan-y;cursor:crosshair" onPointerDown=${pick} onPointerMove=${pick} data-t="gSvg" role="img" aria-label=${cur.name + ' from ' + W0(v[0]) + ' to ' + W0(v[n - 1])}>
        ${ticks.map(t => html`<line x1="0" x2=${W - pr + 6} y1=${Y(t)} y2=${Y(t)} stroke=${K.sep} stroke-width="1" /><text x=${W} y=${Y(t) + 3} text-anchor="end" font-size="9" fill=${K.mute}>${kfmt(t, st)}</text>`)}
        <line x1=${X(gi)} x2=${X(gi)} y1=${top} y2=${top + ch} stroke=${K.sub} stroke-width="1" stroke-dasharray="2 3" opacity=".7" />
        <polyline points=${v.map((x, i) => X(i) + ',' + Y(x)).join(' ')} fill="none" stroke=${K.or} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        ${gi !== 0 ? html`<circle cx=${X(0)} cy=${Y(v[0])} r="3.5" fill="#171A1F" stroke=${K.or} stroke-width="2" />` : null}
        <circle cx=${X(gi)} cy=${Y(v[gi])} r="4.5" fill=${K.or} stroke="#171A1F" stroke-width="2" />
        ${[...shown].map(i => html`<text x=${X(i)} y=${H - 6} text-anchor=${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} font-size="9.5" fill=${i === gi ? K.text : K.mute} font-weight=${i === gi ? 600 : 400}>${lab(i)}</text>`)}
        <rect x="0" y="0" width=${W} height=${H} fill="transparent" />
      </svg>
      <div class="lhr"></div>
      <div class="lg2"><div><span class="lcap">Added / month</span><div class="lv" data-t="gAvg">${W0(steps ? (v[n - 1] - v[0]) / steps : 0)}</div></div><div><span class="lcap">Best month</span><div class="lv" data-t="gBest">${best ? lab(best.i) : '–'} ${best ? html`<small>${best.d >= 0 ? '+' : '−'}${W0(Math.abs(best.d))}</small>` : null}</div></div></div>
    </div>`;
}

export const scrLensAssets = {
  onVisible(l) { l.setup = null; },
  view(l) {
    if (!E.lget('openOk', false)) return Page(l, 1, html`${UpdateNote()}${Setup(l)}`, 'lensAssets');
    const RF = E.rollForward(), S = E.assetSeries();
    const fresh = RF.list.filter(r => r.a.AsKind !== 'account');
    const kids = html`
      ${UpdateNote()}
      <div class="lc lh" data-t="asHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">Savings & assets</span><span class="lpill">OPENING CONFIRMED · ${fmtD(E.openDate(), 'dd mmm yyyy').toUpperCase()}</span></div>
        <div class="lbig" data-t="asNow">${W2(RF.now)}</div>
        <div class="lsub"><span class=${RF.now - RF.open >= 0 ? 'lup' : 'ldn'}>${RF.now - RF.open >= 0 ? '▲' : '▼'} ${W2(Math.abs(RF.now - RF.open))}</span> since ${dmy(E.openDate())}</div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Put in</span><div class="lv" data-t="asIn">${W2(RF.inn)}</div><div class="lsub" style="font-size:11px">through Pocket${RF.list.some(r => r.ps) ? ' & payslips' : ''}${RF.list.some(r => r.est) ? ' & estimates' : ''}</div></div>
          <div><span class="lcap">Growth</span><div class=${'lv ' + (RF.grow >= 0 ? 'lup' : 'ldn')} data-t="asGrow">${RF.grow >= 0 ? '+' : '−'}${W2(Math.abs(RF.grow))}</div><div class="lsub" style="font-size:11px">dividends & price</div></div></div>
      </div>
      ${Sect('Roll-forward', '+ Add', () => editAsset(l, null), 'asAdd')}
      <div class="lc" style="padding:14px 0 12px">
        <style>.lrf{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;color:${K.text}}.lrf td,.lrf th{padding:9px 3px;text-align:right;border-top:1px solid ${K.sep};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lrf th{border-top:0;font-size:9.5px;font-weight:600;letter-spacing:.4px;color:${K.sub};text-transform:uppercase;padding-top:0;text-overflow:clip}.lrf td:first-child,.lrf th:first-child{text-align:left;padding-left:16px}.lrf td:last-child,.lrf th:last-child{padding-right:16px;font-weight:700}.lrf .nm{font-size:12.5px;font-weight:600;white-space:normal;line-height:1.25}.lrf .tot td{font-weight:700;border-top:1px solid #2E333B;font-size:12px}.lrf tr.tap{cursor:pointer}</style>
        <table class="lrf" data-t="rollForward"><colgroup><col style="width:29%" /><col style="width:17%" /><col style="width:17%" /><col style="width:18%" /><col style="width:19%" /></colgroup>
          <tr><th>Asset</th><th>Opening</th><th>+ In</th><th>+ Growth</th><th>= Now</th></tr>
          ${RF.list.map((r, i) => html`<tr class="tap" onClick=${() => editAsset(l, r.a)} data-t=${'rf-' + r.a.AsName}><td><div class="nm"><span style=${`display:inline-block;width:7px;height:7px;border-radius:2px;background:${PAL[i % PAL.length]};margin-right:6px`}></span>${r.a.AsName}</div></td>
            <td>${n0(r.open)}</td><td>${Math.round(r.inn) ? (r.inn < 0 ? '(' + n0(-r.inn) + ')' : n0(r.inn)) : html`<span class="lmu">–</span>`}${r.est ? html`<span class="lgd" style="font-size:9px"> est</span>` : null}</td>
            <td class=${r.grow > 0.5 ? 'lup' : r.grow < -0.5 ? 'ldn' : ''}>${Math.round(r.grow) ? (r.grow > 0 ? '+' : '−') + n0(Math.abs(r.grow)) : html`<span class="lmu">–</span>`}</td><td>${n0(r.now)}</td></tr>`)}
          <tr class="tot"><td>Total</td><td>${n0(RF.open)}</td><td>${n0(RF.inn)}</td><td class=${RF.grow >= 0 ? 'lup' : 'ldn'}>${RF.grow >= 0 ? '+' : '−'}${n0(Math.abs(RF.grow))}</td><td data-t="rfTotal">${n0(RF.now)}</td></tr>
        </table>
      </div>
      ${S.dates.length >= 2 ? Growth(l, S) : null}
      ${Sect('Access')}
      <div class="lc" data-t="asAccess">${LIQ.map((t, g) => { const list = RF.list.filter(r => r.liq === g), v = list.reduce((s, r) => s + r.now, 0); return html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">${t}</div><div class="s">${list.length ? list.map(r => r.a.AsName).join(', ') : LIQ_S[g]}</div><div class="lbar" style="margin-top:8px"><i style=${`width:${RF.now > 0 ? Math.max(0, v / RF.now * 100) : 0}%;background:${K.or}`}></i></div></div><div class="r">${W0(v)}<small class="lmu">${RF.now > 0 ? Math.round(v / RF.now * 100) : 0}%</small></div></div>`; })}
        <div class="lnote" style="margin-top:8px">Only “Ready now” counts toward your emergency fund in Plan.</div></div>
      ${fresh.length ? html`${Sect('Keep values fresh')}
      <div class="lc">${fresh.map(r => { const vals = E.valuesOf(r.a.AsId), lastSet = [...vals].reverse().find(v => v.VaKind === 'value'), lastAdd = [...vals].reverse().find(v => v.VaKind === 'add');
        const age = lastSet ? Math.round((new Date(Today()) - new Date(lastSet.VaDate)) / 864e5) : null;
        const s = r.a.AsKind === 'manual' ? (lastSet ? 'Last value ' + dmy(lastSet.VaDate) + (r.ps ? ' · payslips since' : r.est ? ' · estimated since' : '') : 'Opening value' + (r.ps ? ' · grows from payslips' : r.est ? ' · estimated since' : ' only')) : lastSet ? 'Value updated ' + dmy(lastSet.VaDate) : lastAdd ? 'Last dividend ' + dmy(lastAdd.VaDate) : r.ps ? 'Grows from payslips and Pocket · add dividends when credited' : 'Moves with Pocket · add dividends when credited';
        const stale = r.a.AsKind === 'manual' && (age === null || age > 120);
        return html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">${r.a.AsName}</div><div class=${'s' + (stale ? ' lgd' : '')}>${s}</div></div>
          <button class="lbtn o" style="padding:6px 12px" onClick=${() => updateValue(l, r.a, r.a.AsKind === 'category' && !lastSet ? 'add' : 'value')} data-t=${'upd-' + r.a.AsName}>${r.a.AsKind === 'category' && !lastSet ? 'Add' : 'Update'}</button></div>`; })}</div>` : null}`;
    return Page(l, 1, kids, 'lensAssets', () => openGuide(l, 'assets'));
  }
};
