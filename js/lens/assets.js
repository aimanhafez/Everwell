// MansWell · Lens · Savings & assets — opening balances confirmed once, then a roll-forward:
// Opening + In (Pocket savings categories, Balance Sweep, or a monthly estimate) + Growth (dividends, prices) = Now.
import { html } from '../vendor/preact-htm.js';
import { K, DB, rerender, Today, n0, fmtD, addDays } from '../core.js';
import { askPassword } from '../shared.js';
import { SWEEP_ID, sweepAccount } from '../sweep.js';
import * as E from './engine.js';
import { Page, Sect, iconHtml, W0, W2, UpdateNote, openSheet, closeSheet, lsave, canWrite, num, newId, Check } from './ui.js';

const PAL = ['#FF6A00', '#FF9A4D', '#E9B949', '#6B7178', '#A3236F', '#FFB27A', '#8A6FD1', '#C4C9CE'];
const LIQ = ['Ready now', 'Within days', 'Retirement'];
const LIQ_S = ['Cash you can use today', 'A few days to withdraw or sell', 'Mostly locked until retirement'];
const dmy = d => fmtD(d, 'dd mmm yyyy');

/* first time: what did each one hold the day before Pocket starts? */
function proposals() {
  const list = [], od = E.openDate();
  if (sweepAccount()) list.push({ key: 'sweep', name: 'Balance Sweep', kind: 'account', acc: SWEEP_ID, open: String(E.acctBal(SWEEP_ID, od)), on: true, liq: 0, locked: true, sub: 'From Pocket' });
  for (const c of E.savCats()) list.push({ key: 'cat:' + c, name: c, kind: 'category', cat: c, open: '', on: DB.txns.some(t => t.TxCat === c), liq: E.sinking().includes(c) ? 0 : 1, sub: 'Linked to category “' + c + '”' });
  if (!list.some(x => /kwsp|epf/i.test(x.name))) list.push({ key: 'kwsp', name: 'KWSP', kind: 'manual', open: '', monthly: '', on: false, liq: 2, sub: 'From your i-Akaun statement' });
  return list;
}
function Setup(l) {
  if (!l.setup) l.setup = proposals();
  const od = E.openDate();
  const row = x => html`<div class="lr" style="grid-template-columns:24px 1fr 124px;align-items:start" data-t=${'open-' + x.name}>
    <span onClick=${() => { if (!x.locked) { x.on = !x.on; rerender(); } }} style="padding-top:8px;cursor:pointer">${Check(x.on)}</span>
    <div>${x.kind === 'manual' && x.custom ? html`<input class="lin" style="height:36px;font-size:14px" placeholder="Name" value=${x.name} onInput=${e => { x.name = e.target.value; }} />` : html`<div class="t" style="font-size:14px">${x.name}</div>`}
      <div class="s">${x.sub || ''}</div>
      ${x.kind === 'manual' && x.on ? html`<div class="llab" style="margin-top:8px">Monthly contribution (optional)</div><input class="lin r" inputmode="decimal" placeholder="e.g. payslip KWSP" value=${x.monthly} onInput=${e => { x.monthly = e.target.value; }} style="height:36px" />` : null}</div>
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
        ${f.kind === 'category' ? html`<div class="llab">Pocket category</div><select class="lin" onChange=${e => { f.cat = e.target.value; if (!f.name) f.name = f.cat; rerender(); }} data-t="asCat"><option value="">Choose…</option>${E.savCats().filter(c => !linked.has(c)).map(c => html`<option value=${c} selected=${f.cat === c}>${c}</option>`)}</select>` : null}` : html`<div class="lnote" style="margin-top:8px">${a.AsKind === 'account' ? 'Value comes straight from Pocket.' : a.AsKind === 'category' ? 'Moves with Pocket category “' + a.AsCat + '”, plus the values you add.' : 'Value you update' + (a.AsMonthly ? ', plus an estimated monthly contribution.' : '.')}</div>`}
      <div class="llab">Access</div><select class="lin" onChange=${e => { f.liq = Number(e.target.value); }} data-t="asLiq">${LIQ.map((t, i) => html`<option value=${i} selected=${f.liq === i}>${t} · ${LIQ_S[i]}</option>`)}</select>
      ${f.kind === 'manual' ? html`<div class="llab">Monthly contribution · optional estimate</div><input class="lin r" inputmode="decimal" value=${f.monthly} placeholder="0.00" onInput=${e => { f.monthly = e.target.value; }} data-t="asMonthly" />` : null}
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
function stackSvg(S, W = 334, H = 176) {
  const n = S.ks.length; if (n < 2 || !S.rows.length) return '';
  const top = 10, bot = 22, ch = H - top - bot, tots = S.dates.map((d, i) => S.rows.reduce((s, r) => s + Math.max(0, r.vals[i]), 0));
  const mx = Math.max(...tots, 1), step = Math.pow(10, Math.floor(Math.log10(mx))), hi = Math.ceil(mx / step) * step;
  const X = i => 12 + i * (W - 50) / (n - 1), y = v => top + ch - v / hi * ch;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  [0.25, 0.5, 0.75, 1].forEach(f => { const v = hi * f; s += `<line x1="0" x2="${W - 34}" y1="${y(v)}" y2="${y(v)}" stroke="${K.sep}" stroke-dasharray="2 4"/><text x="${W}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="${K.mute}">${v >= 1000 ? Math.round(v / 1000) + 'K' : Math.round(v)}</text>`; });
  let base = Array(n).fill(0);
  const order = S.rows.map((r, i) => i).sort((a, b) => S.rows[b].vals[n - 1] - S.rows[a].vals[n - 1]);
  order.forEach(k => { const r = S.rows[k], topv = r.vals.map((v, i) => base[i] + Math.max(0, v));
    s += `<polygon points="${topv.map((v, i) => `${X(i)},${y(v)}`).join(' ')} ${base.map((v, i) => `${X(i)},${y(v)}`).reverse().join(' ')}" fill="${PAL[S.rows.indexOf(r) % PAL.length]}" opacity=".85"/>`; base = topv; });
  s += `<polyline points="${base.map((v, i) => `${X(i)},${y(v)}`).join(' ')}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
  const lab = S.ks.map(k => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][E.kM(k) - 1]);
  const every = Math.ceil(n / 10);
  lab.forEach((m, i) => { if (i % every === 0 || i === n - 1) s += `<text x="${X(i)}" y="${H - 5}" text-anchor="middle" font-size="9.5" fill="${i === n - 1 ? K.text : K.mute}">${m}</text>`; });
  return s + '</svg>';
}

export const scrLensAssets = {
  onVisible(l) { l.setup = null; },
  view(l) {
    if (!E.lget('openOk', false)) return Page(l, 1, html`${UpdateNote()}${Setup(l)}`, 'lensAssets');
    const RF = E.rollForward(), S = E.assetSeries();
    const fresh = RF.list.filter(r => r.a.AsKind !== 'account');
    const best = (() => { if (S.ks.length < 2) return null; let b = null; for (let i = 1; i < S.ks.length; i++) { const d = S.rows.reduce((s, r) => s + r.vals[i] - r.vals[i - 1], 0); if (!b || d > b.d) b = { i, d }; } return b; })();
    const months = Math.max(1, E.kDiff(E.startKey(), E.curKey()) + 1);
    const kids = html`
      ${UpdateNote()}
      <div class="lc lh" data-t="asHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">Savings & assets</span><span class="lpill">OPENING CONFIRMED · ${fmtD(E.openDate(), 'dd mmm yyyy').toUpperCase()}</span></div>
        <div class="lbig" data-t="asNow">${W2(RF.now)}</div>
        <div class="lsub"><span class=${RF.now - RF.open >= 0 ? 'lup' : 'ldn'}>${RF.now - RF.open >= 0 ? '▲' : '▼'} ${W2(Math.abs(RF.now - RF.open))}</span> since ${dmy(E.openDate())}</div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Put in</span><div class="lv" data-t="asIn">${W2(RF.inn)}</div><div class="lsub" style="font-size:11px">through Pocket${RF.list.some(r => r.est) ? ' & estimates' : ''}</div></div>
          <div><span class="lcap">Growth</span><div class=${'lv ' + (RF.grow >= 0 ? 'lup' : 'ldn')} data-t="asGrow">${RF.grow >= 0 ? '+' : '−'}${W2(Math.abs(RF.grow))}</div><div class="lsub" style="font-size:11px">dividends & price</div></div></div>
      </div>
      ${Sect('Roll-forward', '+ Add', () => editAsset(l, null), 'asAdd')}
      <div class="lc" style="padding:14px 0 12px">
        <style>.lrf{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;color:${K.text}}.lrf td,.lrf th{padding:9px 3px;text-align:right;border-top:1px solid ${K.sep};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lrf th{border-top:0;font-size:9.5px;font-weight:600;letter-spacing:1px;color:${K.sub};text-transform:uppercase;padding-top:0}.lrf td:first-child,.lrf th:first-child{text-align:left;padding-left:16px}.lrf td:last-child,.lrf th:last-child{padding-right:16px;font-weight:700}.lrf .nm{font-size:12.5px;font-weight:600;white-space:normal;line-height:1.25}.lrf .src{font-size:10px;color:${K.mute};margin-top:2px;overflow:hidden;text-overflow:ellipsis}.lrf .tot td{font-weight:700;border-top:1px solid #2E333B;font-size:12px}.lrf tr.tap{cursor:pointer}</style>
        <table class="lrf" data-t="rollForward"><colgroup><col style="width:33%" /><col /><col /><col /><col style="width:19%" /></colgroup>
          <tr><th>Asset</th><th>Opening</th><th>+ In</th><th>+ Growth</th><th>= Now</th></tr>
          ${RF.list.map((r, i) => html`<tr class="tap" onClick=${() => editAsset(l, r.a)} data-t=${'rf-' + r.a.AsName}><td><div class="nm"><span style=${`display:inline-block;width:7px;height:7px;border-radius:2px;background:${PAL[i % PAL.length]};margin-right:6px`}></span>${r.a.AsName}</div><div class="src">${r.a.AsKind === 'account' ? 'Pocket' : r.a.AsKind === 'category' ? 'Pocket category' : r.est ? 'Statement + est.' : 'You update'}</div></td>
            <td>${n0(r.open)}</td><td>${Math.round(r.inn) ? (r.inn < 0 ? '(' + n0(-r.inn) + ')' : n0(r.inn)) : html`<span class="lmu">–</span>`}${r.est ? html`<span class="lgd" style="font-size:9px"> est</span>` : null}</td>
            <td class=${r.grow > 0.5 ? 'lup' : r.grow < -0.5 ? 'ldn' : ''}>${Math.round(r.grow) ? (r.grow > 0 ? '+' : '−') + n0(Math.abs(r.grow)) : html`<span class="lmu">–</span>`}</td><td>${n0(r.now)}</td></tr>`)}
          <tr class="tot"><td>Total</td><td>${n0(RF.open)}</td><td>${n0(RF.inn)}</td><td class=${RF.grow >= 0 ? 'lup' : 'ldn'}>${RF.grow >= 0 ? '+' : '−'}${n0(Math.abs(RF.grow))}</td><td data-t="rfTotal">${n0(RF.now)}</td></tr>
        </table>
        <div class="lnote" style="padding:10px 16px 0">Opening is what you confirmed for ${dmy(E.openDate())}. In is money moved through Pocket (or your monthly estimate). Growth is dividends and price changes you record. Tap an asset to edit it.</div>
      </div>
      ${S.ks.length >= 2 ? html`${Sect('Growth')}
      <div class="lc">
        <div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:11px;color:${K.sub};margin-bottom:10px">${S.rows.map((r, i) => html`<span><span style=${`display:inline-block;width:8px;height:8px;border-radius:2px;background:${PAL[i % PAL.length]};margin-right:5px`}></span>${r.a.AsName}</span>`)}</div>
        <div dangerouslySetInnerHTML=${{ __html: stackSvg(S) }}></div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Added / month</span><div class="lv">${W0((RF.now - RF.open) / months)}</div></div><div><span class="lcap">Best month</span><div class="lv">${best ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][E.kM(S.ks[best.i]) - 1] : '–'} ${best ? html`<small>+${W0(best.d)}</small>` : null}</div></div></div>
      </div>` : null}
      ${Sect('Access')}
      <div class="lc" data-t="asAccess">${LIQ.map((t, g) => { const list = RF.list.filter(r => r.liq === g), v = list.reduce((s, r) => s + r.now, 0); return html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">${t}</div><div class="s">${list.length ? list.map(r => r.a.AsName).join(', ') : LIQ_S[g]}</div><div class="lbar" style="margin-top:8px"><i style=${`width:${RF.now > 0 ? Math.max(0, v / RF.now * 100) : 0}%;background:${K.or}`}></i></div></div><div class="r">${W0(v)}<small class="lmu">${RF.now > 0 ? Math.round(v / RF.now * 100) : 0}%</small></div></div>`; })}
        <div class="lnote" style="margin-top:8px">Only “Ready now” counts toward your emergency fund in Plan.</div></div>
      ${fresh.length ? html`${Sect('Keep values fresh')}
      <div class="lc">${fresh.map(r => { const vals = E.valuesOf(r.a.AsId), lastSet = [...vals].reverse().find(v => v.VaKind === 'value'), lastAdd = [...vals].reverse().find(v => v.VaKind === 'add');
        const age = lastSet ? Math.round((new Date(Today()) - new Date(lastSet.VaDate)) / 864e5) : null;
        const s = r.a.AsKind === 'manual' ? (lastSet ? 'Last value ' + dmy(lastSet.VaDate) + (r.est ? ' · estimated since' : '') : 'Opening value only' + (r.est ? ' · estimated since' : '')) : lastSet ? 'Value updated ' + dmy(lastSet.VaDate) : lastAdd ? 'Last dividend ' + dmy(lastAdd.VaDate) : 'Moves with Pocket · add dividends when credited';
        const stale = r.a.AsKind === 'manual' && (age === null || age > 120);
        return html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">${r.a.AsName}</div><div class=${'s' + (stale ? ' lgd' : '')}>${s}</div></div>
          <button class="lbtn o" style="padding:6px 12px" onClick=${() => updateValue(l, r.a, r.a.AsKind === 'category' && !lastSet ? 'add' : 'value')} data-t=${'upd-' + r.a.AsName}>${r.a.AsKind === 'category' && !lastSet ? 'Add' : 'Update'}</button></div>`; })}</div>` : null}`;
    return Page(l, 1, kids, 'lensAssets');
  }
};
