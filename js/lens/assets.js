// MansWell · Lens · Savings & assets — opening balances confirmed once, then a roll-forward:
// Opening + In (Pocket savings categories, Balance Sweep, or a monthly estimate) + Growth (dividends, prices) = Now.
import { html } from '../vendor/preact-htm.js';
import { K, DB, rerender, Today, n0, fmtD, addDays, Notify } from '../core.js';
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
const TYPES = [['asset', 'Savings'], ['tabung', 'Tabung']];
const seg = (opts, cur, set, id) => html`<div style="display:flex;gap:8px">${opts.map(([k, t]) => html`<button class=${'lbtn' + (cur === k ? ' o on' : '')} style="flex:1;padding:10px 6px" onClick=${() => set(k)} data-t=${id + '-' + k}>${t}</button>`)}</div>`;
/** Renaming a linked Pocket category, the way Pocket does it: the category, its transactions, payees and recurring. */
function pocketRename(old, nm) {
  const c = DB.categories.find(x => x.CatName === old); if (!c || old === nm) return {};
  return { EW_Categories: [{ ...c, CatName: nm }], EW_Transactions: DB.txns.filter(t => t.TxCat === old).map(t => ({ ...t, TxCat: nm })),
    EW_Payees: (DB.payees || []).filter(p => p.PyCat === old).map(p => ({ ...p, PyCat: nm })), EW_Recurring: (DB.recurring || []).filter(r => r.RcCat === old).map(r => ({ ...r, RcCat: nm })) };
}
const renameInList = (key, old, nm) => { const v = E.lget(key, null); return Array.isArray(v) && v.includes(old) ? [E.lrow(key, v.map(x => (x === old ? nm : x)))] : []; };
function newCategory(name) {
  const sq = DB.categories.reduce((m, c) => Math.max(m, Number(c.CatSeq) || 0), 0) + 1;
  return { CatId: 'CAT-' + String(sq).padStart(3, '0'), CatSeq: sq, CatName: name, CatType: 'Savings/Asset', CatPL: '', CatFixed: '', CatEss: '', CatBudget: false, CatColor: '#FF6A00', CatActive: true };
}
const nextSeq = () => DB.lnAssets.reduce((m, x) => Math.max(m, Number(x.AsSeq) || 0), 0) + 1;

/** Add or edit an Asset or a Tabung. "Through Pocket" items are linked to (or create) a Pocket Savings/Asset category. */
export function editAsset(l, a, preset) {
  const tab0 = a ? E.isTabung(a) : !!(preset && preset.tabung);
  const fixedType = !a && preset && (preset.tabung || preset.savings);
  const f = a ? { name: a.AsName, type: tab0 ? 'tabung' : 'asset', liq: E.liqOf(a), monthly: a.AsMonthly ? String(a.AsMonthly) : '', open: String(a.AsOpen || 0), how: a.AsKind === 'manual' ? 'manual' : 'pocket' }
    : { name: (preset && preset.cat) || '', type: tab0 ? 'tabung' : 'asset', liq: 1, monthly: '', open: '', how: 'pocket' };
  const fromPocket = !!(preset && preset.cat);
  const isAcc = a && a.AsKind === 'account';
  openSheet(l, {
    title: a ? a.AsName : fromPocket ? 'New in Pocket: ' + preset.cat : tab0 ? 'Add Tabung' : 'Add savings',
    body: () => html`
      ${fromPocket ? html`<div class="lnote">You made this Savings/Asset category in Pocket. Add it to Lens once and it moves with Pocket from now on.</div>` : null}
      ${!isAcc && !fixedType ? html`<div class="llab">This is</div>${seg(TYPES, f.type, k => { f.type = k; if (k === 'tabung') f.how = 'pocket'; rerender(); }, 'asType')}` : null}
      ${!fromPocket ? html`<div class="llab">Name</div><input class="lin" value=${f.name} onInput=${e => { f.name = e.target.value; }} data-t="asName" disabled=${isAcc} />` : null}
      ${!a && !fromPocket ? html`<div class="llab">How does the money move?</div>
        <div style="display:flex;flex-direction:column;gap:8px">${[['pocket', 'Through Pocket', 'You record deposits and withdrawals in Pocket. Lens makes the Pocket category for you.'], ['manual', 'Value I update', 'Pocket never sees it: FD, shares, Tabung Haji.']].filter(([k]) => f.type !== 'tabung' || k === 'pocket').map(([k, t, d]) => html`<div class=${'lbtn' + (f.how === k ? ' o on' : '')} style="display:block;text-align:left;white-space:normal;padding:10px 12px" onClick=${() => { f.how = k; rerender(); }} data-t=${'asHow-' + k}><b style="display:block;font-size:13.5px">${t}</b><span style=${`font-size:11.5px;font-weight:500;color:${K.sub}`}>${d}</span></div>`)}</div>` : null}
      ${a && !isAcc ? html`<div class="lnote" style="margin-top:8px">${a.AsKind === 'category' ? (E.payslipFed(a) ? psSplit(a) : 'Moves with Pocket category “' + a.AsCat + '”. Renaming it here renames it in Pocket too.') : 'Value you update' + (a.AsMonthly ? ', plus an estimated monthly contribution.' : '.')}</div>` : isAcc ? html`<div class="lnote" style="margin-top:8px">Value comes straight from Pocket.</div>` : null}
      ${true ? html`<div class="llab">Access</div><select class="lin" onChange=${e => { f.liq = Number(e.target.value); }} data-t="asLiq">${LIQ.map((t, i) => html`<option value=${i} selected=${f.liq === i}>${t} · ${LIQ_S[i]}</option>`)}</select>` : null}
      ${(f.how === 'manual' && !isAcc) || (a && E.payslipFed(a)) ? html`<div class="llab">${a && E.payslipFed(a) ? 'Monthly estimate · only for months without a payslip' : 'Monthly contribution · optional estimate'}</div><input class="lin r" inputmode="decimal" value=${f.monthly} placeholder="0.00" onInput=${e => { f.monthly = e.target.value; }} data-t="asMonthly" />` : null}
      ${!isAcc ? html`<div class="llab">Opening value on ${dmy(E.openDate())}</div><input class="lin r" inputmode="decimal" value=${f.open} placeholder="0.00" onInput=${e => { f.open = e.target.value; }} data-t="asOpen" />` : null}
      ${fromPocket ? html`<div style=${`margin-top:14px;text-align:center;color:${K.sub};font-size:12.5px;cursor:pointer`} onClick=${() => { lsave({ up: { LN_Settings: [E.lrow('ignoreCats', [...E.ignoredCats(), preset.cat])] } }, 'Not tracked in Lens', preset.cat); closeSheet(l); }} data-t="asIgnore">Don't track this in Lens</div>` : null}
      ${a && !isAcc ? html`<div class="llab">History</div>${E.valuesOf(a.AsId).length ? E.valuesOf(a.AsId).slice().reverse().map(v => html`<div class="lr" style="grid-template-columns:1fr auto auto"><div><div class="t" style="font-size:13.5px">${v.VaKind === 'value' ? 'Value set' : 'Added'} · ${dmy(v.VaDate)}</div>${v.VaNote ? html`<div class="s">${v.VaNote}</div>` : null}</div><div class="r">${W2(v.VaAmt)}</div>
          <span style="cursor:pointer;color:${K.red};padding:4px" onClick=${() => { lsave({ del: { LN_Values: [v.VaId] } }, 'Value removed', a.AsName); rerender(); }}>${iconHtml('trash', K.red, 16)}</span></div>`) : html`<div class="lnote">No updates yet.</div>`}` : null}
      ${a && !isAcc ? html`<div style="margin-top:16px"><button class="lbtnd" data-t="asDelete" onClick=${() => askPassword(l, 'remove ' + a.AsName + ' from Lens', () => { lsave({ del: { LN_Assets: [a.AsId], LN_Values: E.valuesOf(a.AsId).map(v => v.VaId) }, up: a.AsKind === 'category' ? { LN_Settings: [E.lrow('ignoreCats', [...E.ignoredCats().filter(c => c !== a.AsCat), a.AsCat])] } : {} }, 'Removed from Lens', a.AsName); closeSheet(l); })}>Remove from Lens</button><div class="lnote" style="margin-top:6px;text-align:center">${a.AsKind === 'category' ? 'The Pocket category and its transactions stay.' : ''}</div></div>` : null}`,
    onSave: () => {
      const name = fromPocket ? preset.cat : String(f.name || '').trim(); if (!name) { Notify('Give it a name.', 'info'); return; }
      const liq = f.liq, note = f.type === 'tabung' ? 'tabung' : '', up = {}, settings = [];
      if (!a) {
        let cat = '';
        if (f.how === 'pocket') {
          const ex = DB.categories.find(c => c.CatName.toLowerCase() === name.toLowerCase());
          if (ex && (ex.CatType !== 'Savings/Asset' || E.linkedCats().has(ex.CatName))) { Notify(ex.CatType !== 'Savings/Asset' ? 'Pocket already has a ' + ex.CatType + ' category with this name.' : name + ' is already in Lens.', 'error'); return; }
          if (ex) cat = ex.CatName; else { const c = newCategory(name); up.EW_Categories = [c]; cat = name; }
          if (E.ignoredCats().includes(cat)) settings.push(E.lrow('ignoreCats', E.ignoredCats().filter(x => x !== cat)));
        } else if (E.assets().some(x => x.AsName.toLowerCase() === name.toLowerCase())) { Notify(name + ' is already in Lens.', 'error'); return; }
        up.LN_Assets = [{ AsId: newId('AS'), AsSeq: nextSeq(), AsKind: f.how === 'pocket' ? 'category' : 'manual', AsCat: cat, AsAcc: '', AsNote: note, AsActive: true, AsName: f.how === 'pocket' ? cat : name, AsLiq: liq, AsMonthly: num(f.monthly), AsOpen: num(f.open) }];
        if (settings.length) up.LN_Settings = settings;
        lsave({ up }, f.type === 'tabung' ? 'Tabung added' : 'Savings added', name + (up.EW_Categories ? ' · Pocket category created' : '')); closeSheet(l); return;
      }
      let row = { ...a, AsName: isAcc ? a.AsName : name, AsLiq: liq, AsNote: isAcc ? a.AsNote || '' : note, AsMonthly: num(f.monthly), AsOpen: isAcc ? 0 : num(f.open) };
      if (a.AsKind === 'category' && name !== a.AsCat) {
        if (DB.categories.some(c => c.CatName.toLowerCase() === name.toLowerCase() && c.CatName !== a.AsCat)) { Notify('Pocket already has a category called ' + name + '.', 'error'); return; }
        Object.assign(up, pocketRename(a.AsCat, name)); row.AsCat = name;
        settings.push(...renameInList('sinking', a.AsCat, name), ...renameInList('essential', a.AsCat, name));
      }
      up.LN_Assets = [row]; if (settings.length) up.LN_Settings = settings;
      const doIt = () => { lsave({ up }, 'Asset updated', name + (a.AsKind === 'category' && name !== a.AsCat ? ' · renamed in Pocket' : '')); closeSheet(l); };
      if (num(f.open) !== Number(a.AsOpen || 0) && !isAcc) askPassword(l, 'change an opening balance', doIt); else doIt();
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
  const opts = [{ id: 'total', name: 'Total', vals: S.total }, ...(S.hasTab ? [{ id: 'sav', name: 'Savings', vals: S.savTotal }, { id: 'tabung', name: 'Tabung', vals: S.tabTotal }] : []), ...S.rows.filter(r => r.vals.some(v => Math.abs(v) >= 0.5)).map(r => ({ id: r.a.AsId, name: r.a.AsName, vals: r.vals }))];
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
    const RF = E.rollForward(), S = E.assetSeries(), nc = E.newCats();
    const fresh = RF.list.filter(r => r.a.AsKind !== 'account');
    const amt = v => (Math.round(v) ? (v < 0 ? '(' + n0(-v) + ')' : n0(v)) : html`<span class="lmu">–</span>`);
    const gTot = g => RF.list.filter(r => r.liq === g).reduce((s2, r) => s2 + r.now, 0);
    const sub = (L, g) => L.filter(r => r.liq === g).reduce((s2, r) => s2 + r.now, 0);
    const COLS = html`<colgroup><col style="width:37%" /><col style="width:16%" /><col style="width:15%" /><col style="width:15%" /><col style="width:17%" /></colgroup>`;
    const kids = html`
      ${UpdateNote()}
      ${nc.length ? html`<div class="lc" style="box-shadow:inset 0 0 0 1px rgba(255,106,0,.45);background:rgba(255,106,0,.06)" data-t="asNew"><span class="lcap" style=${`color:${K.or}`}>New in Pocket</span>
        ${nc.map(c => html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">${c}</div><div class="s">Savings/Asset category · not in Lens yet</div></div><button class="lbtn o" style="padding:6px 12px" onClick=${() => editAsset(l, null, { cat: c })} data-t=${'nc-' + c}>Add to Lens</button></div>`)}</div>` : null}
      <div class="lc lh" data-t="asHero">
        <span class="lcap">Total · savings + Tabung</span>
        <div class="lbig" data-t="asNow">${W2(RF.all.now)}</div>
        <div class="lsub"><span class=${RF.all.now - RF.all.open >= 0 ? 'lup' : 'ldn'}>${RF.all.now - RF.all.open >= 0 ? '▲' : '▼'} ${W2(Math.abs(RF.all.now - RF.all.open))}</span> since opening</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px" data-t="asGroups">${LIQ.map((t, g) => html`<div style=${`background:rgba(255,255,255,.03);border-radius:11px;padding:9px 10px;box-shadow:inset 0 0 0 1px ${K.line}`}><span class="lcap" style="font-size:8.5px">${t}</span><b style="display:block;font-size:13.5px;margin-top:3px">${W0(gTot(g))}</b></div>`)}</div>
        <div class="lhr"></div>
        <div class="lg2 r2"><div><span class="lcap">Savings</span><div class="lv" data-t="asSav">${W2(RF.now)}</div></div><div><span class="lcap">Tabung</span><div class="lv" data-t="asTabTot">${W2(RF.tab.now)}</div></div>
          <div><span class="lcap">Put in</span><div class="lv" data-t="asIn">${W2(RF.all.inn)}</div></div><div><span class="lcap">Growth</span><div class=${'lv ' + (RF.all.grow >= 0 ? 'lup' : 'ldn')} data-t="asGrow">${RF.all.grow >= 0 ? '+' : '−'}${W2(Math.abs(RF.all.grow))}</div></div></div>
      </div>
      <style>.lrf{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;color:${K.text}}.lrf td,.lrf th{padding:9px 2px;text-align:right;border-top:1px solid ${K.sep};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lrf th{border-top:0;font-size:9px;font-weight:600;letter-spacing:.3px;color:${K.sub};text-transform:uppercase;padding-top:0;text-overflow:clip}.lrf td:first-child,.lrf th:first-child{text-align:left;padding-left:16px}.lrf td:last-child,.lrf th:last-child{padding-right:16px;font-weight:700}.lrf .nm{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lrf .tot td{font-weight:700;border-top:1px solid #2E333B;font-size:12px}.lrf tr.tap{cursor:pointer}.lrf tr.grp td{border-top:0;padding-top:13px;font-size:9.5px;font-weight:700;letter-spacing:1.2px;color:${K.or};text-transform:uppercase}</style>
      ${Sect('Savings', '+ Add', () => editAsset(l, null, { savings: true }), 'asAdd')}
      <div class="lc" style="padding:14px 0 12px">
        <table class="lrf" data-t="rollForward">${COLS}
          <tr><th>Savings</th><th>Opening</th><th>In</th><th>Growth</th><th>Now</th></tr>
          ${[0, 1, 2].filter(g => RF.assets.some(r => r.liq === g)).map(g => html`<tr class="grp" data-t=${'grp-' + g}><td colspan="4">${LIQ[g]}</td><td>${n0(sub(RF.assets, g))}</td></tr>
          ${RF.assets.filter(r => r.liq === g).map(r => html`<tr class="tap" onClick=${() => editAsset(l, r.a)} data-t=${'rf-' + r.a.AsName}><td><div class="nm">${r.a.AsName}</div></td>
            <td>${n0(r.open)}</td><td>${amt(r.inn)}${r.est ? html`<span class="lgd" style="font-size:9px"> est</span>` : null}</td>
            <td class=${r.grow > 0.5 ? 'lup' : r.grow < -0.5 ? 'ldn' : ''}>${Math.round(r.grow) ? (r.grow > 0 ? '+' : '−') + n0(Math.abs(r.grow)) : html`<span class="lmu">–</span>`}</td><td>${n0(r.now)}</td></tr>`)}`)}
          <tr class="tot"><td>Total</td><td>${n0(RF.open)}</td><td>${n0(RF.inn)}</td><td class=${RF.grow >= 0 ? 'lup' : 'ldn'}>${RF.grow >= 0 ? '+' : '−'}${n0(Math.abs(RF.grow))}</td><td data-t="rfTotal">${n0(RF.now)}</td></tr>
        </table>
      </div>
      ${Sect('Tabung', '+ Add', () => editAsset(l, null, { tabung: true }), 'tbAdd')}
      <div class="lc" style=${RF.tabung.length ? 'padding:14px 0 12px' : ''} data-t="tabung">${RF.tabung.length ? html`
        <table class="lrf" data-t="tabTable">${COLS}
          <tr><th>Tabung</th><th>Opening</th><th>In</th><th>Out</th><th>Balance</th></tr>
          ${[0, 1, 2].filter(g => RF.tabung.some(r => r.liq === g)).map(g => html`<tr class="grp" data-t=${'tgrp-' + g}><td colspan="4">${LIQ[g]}</td><td>${n0(sub(RF.tabung, g))}</td></tr>
          ${RF.tabung.filter(r => r.liq === g).map(r => html`<tr class="tap" onClick=${() => editAsset(l, r.a)} data-t=${'tb-' + r.a.AsName}><td><div class="nm">${r.a.AsName}</div></td><td>${n0(r.open)}</td><td>${amt(r.tin)}</td><td>${Math.round(r.used) ? '(' + n0(r.used) + ')' : html`<span class="lmu">–</span>`}</td><td>${n0(r.now)}</td></tr>`)}`)}
          <tr class="tot"><td>Total</td><td>${n0(RF.tab.open)}</td><td>${n0(RF.tab.inn)}</td><td>${Math.round(RF.tab.used) ? '(' + n0(RF.tab.used) + ')' : '–'}</td><td>${n0(RF.tab.now)}</td></tr>
        </table>` : html`<div class="lnote">A Tabung is money set aside for a purpose, like an emergency fund, a house or travel. Tap <b>+ Add</b>, or switch a savings item to a Tabung by tapping it. Plan tracks every Tabung you give a target.</div>`}</div>
      ${S.dates.length >= 2 ? Growth(l, S) : null}
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
