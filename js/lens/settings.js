// MansWell · Lens · Settings — sources, rules, data. Reset clears Lens-only data; Pocket and the P&L are never touched.
import { html } from '../vendor/preact-htm.js';
import { K, DB, rerender, fmtD, Today, Notify, guard, save } from '../core.js';
import { askPassword } from '../shared.js';
import { loadXlsx, shareOrDownload } from '../backup.js';
import * as E from './engine.js';
import { Page, Sect, W0, W2, UpdateNote, openSheet, closeSheet, lsave, num, Check, Switch, pIcon, iconHtml, canWrite } from './ui.js';
import { editAsset } from './assets.js';

const sRow = (ic, t, s, right, onClick, id) => html`<div class=${'lr' + (onClick ? ' tap' : '')} style=${onClick ? 'cursor:pointer' : ''} onClick=${onClick} data-t=${id}><div class="lib">${pIcon(ic, K.or, 18)}</div><div><div class="t">${t}</div><div class="s">${s}</div></div>${right === undefined ? html`<span style=${`color:${K.sub}`}>${iconHtml('right', K.sub, 16)}</span>` : right}</div>`;

function sheetOpening(l) {
  const RF = E.rollForward();
  const f = Object.fromEntries(RF.list.filter(r => r.a.AsKind !== 'account').map(r => [r.a.AsId, String(r.a.AsOpen || 0)]));
  openSheet(l, {
    title: 'Opening balances',
    body: () => html`<div class="lnote">As at <b>${fmtD(E.openDate(), 'dd mmm yyyy')}</b>, the day before Pocket starts. Changing one changes every figure after it, so it asks for your password.</div>
      ${RF.list.map(r => html`<div class="lr" style="grid-template-columns:1fr 128px;margin-top:6px"><div><div class="t" style="font-size:14px">${r.a.AsName}</div><div class="s">${r.a.AsKind === 'account' ? 'From Pocket' : r.a.AsKind === 'category' ? (r.ps ? 'Pocket category + payslips' : 'Pocket category') : 'You update'}</div></div>
        ${r.a.AsKind === 'account' ? html`<div class="lfx" style="padding:9px 10px;text-align:right;font-weight:600;opacity:.6">${W2(r.open)}</div>` : html`<input class="lin r" inputmode="decimal" value=${f[r.a.AsId]} onInput=${e => { f[r.a.AsId] = e.target.value; }} data-t=${'ob-' + r.a.AsName} />`}</div>`)}`,
    onSave: () => {
      const ch = RF.list.filter(r => r.a.AsKind !== 'account' && num(f[r.a.AsId]) !== Number(r.a.AsOpen || 0)).map(r => ({ ...r.a, AsOpen: num(f[r.a.AsId]) }));
      if (!ch.length) { closeSheet(l); return; }
      askPassword(l, 'change opening balances', () => { lsave({ up: { LN_Assets: ch } }, 'Opening balances changed', ch.map(a => a.AsName + ' ' + a.AsOpen).join(', ')); closeSheet(l); });
    }, saveLabel: 'Save changes'
  });
}
function sheetAssets(l) {
  openSheet(l, {
    title: 'Assets, Tabung & links',
    body: () => html`${E.assets().map(a => html`<div class="lr tap" style="grid-template-columns:1fr auto;cursor:pointer" onClick=${() => editAsset(l, a)}><div><div class="t" style="font-size:14px">${a.AsName}</div><div class="s">${a.AsKind === 'account' ? 'Pocket account · Balance Sweep' : a.AsKind === 'category' ? 'Linked to Pocket category “' + a.AsCat + '”' + (E.payslipFed(a) ? ' + payslips' : '') : 'You update' + (a.AsMonthly ? ' · ' + W0(a.AsMonthly) + '/mo estimate' : '')} · ${['Ready now', 'Within days', 'Retirement', 'Tabung'][Number(a.AsLiq) || 0]}</div></div>${iconHtml('right', K.sub, 16)}</div>`)}
      <div style="margin-top:12px"><button class="lbtn o" style="width:100%;padding:11px" onClick=${() => editAsset(l, null)}>+ Add asset</button></div>`
  });
}
function sheetRule(l) {
  const f = { sink: new Set(E.sinking()) }, cats = E.savCats().filter(c => E.used().has(c) || f.sink.has(c));
  openSheet(l, {
    title: 'Savings rate rule',
    body: () => html`<div class="lnote">Total savings = the savings categories that count + the leftover that Balance Sweep moves each month. Turn a category off if it's money set aside to spend later (a sinking fund, like Travel Funds).</div>
      ${cats.length ? cats.map(c => html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t" style="font-size:14px">${c}</div><div class="s">${f.sink.has(c) ? 'Sinking fund · not counted as savings' : 'Counts as savings'}</div></div>${Switch(!f.sink.has(c), () => { f.sink.has(c) ? f.sink.delete(c) : f.sink.add(c); rerender(); }, 'sink-' + c)}</div>`) : html`<div class="lnote" style="margin-top:10px">No Savings/Asset categories in Pocket yet.</div>`}`,
    onSave: () => { lsave({ up: { LN_Settings: [E.lrow('sinking', [...f.sink])] } }, 'Savings rate rule', [...f.sink].join(', ') || 'all count'); closeSheet(l); }
  });
}
function sheetStatus(l) {
  const t = E.thresholds(), f = { strong: String(t.strong), healthy: String(t.healthy) };
  openSheet(l, {
    title: 'Month status',
    body: () => html`<div class="lnote">Each month is rated by its savings rate. 20% is the usual minimum planners recommend.</div>
      <div class="llab">Strong from (%)</div><input class="lin r" inputmode="decimal" value=${f.strong} onInput=${e => { f.strong = e.target.value; }} data-t="stStrong" />
      <div class="llab">Healthy from (%)</div><input class="lin r" inputmode="decimal" value=${f.healthy} onInput=${e => { f.healthy = e.target.value; }} data-t="stHealthy" />
      <div class="lnote" style="margin-top:10px">Below that it's Watch, and below 0% it's Deficit.</div>`,
    onSave: () => { const s = num(f.strong), h = num(f.healthy); if (!(s > h && h >= 0)) { Notify('Strong must be higher than Healthy.', 'error'); return; } lsave({ up: { LN_Settings: [E.lrow('strong', s), E.lrow('healthy', h)] } }, 'Month status', s + ' / ' + h); closeSheet(l); }
  });
}
function sheetEssential(l) {
  const f = new Set(E.essential());
  openSheet(l, {
    title: 'Essential spending',
    body: () => html`<div class="lnote">The spending you'd still have if your income stopped. It sizes your emergency fund and counts as “needs” in Budget.</div>
      ${E.expCats().filter(c => E.used().has(c) || f.has(c)).map(c => html`<div class="lr tap" style="grid-template-columns:auto 1fr;cursor:pointer" onClick=${() => { f.has(c) ? f.delete(c) : f.add(c); rerender(); }} data-t=${'ess-' + c}>${Check(f.has(c))}<div class="t" style="font-size:14px;font-weight:500">${c}</div></div>`)}`,
    onSave: () => { lsave({ up: { LN_Settings: [E.lrow('essential', [...f])] } }, 'Essential spending', f.size + ' categories'); closeSheet(l); }
  });
}
function sheetAssume(l) {
  const a = E.assumptions(), f = { growth: String(a.growth), infl: String(a.infl), side: String(a.sideShare) };
  openSheet(l, {
    title: 'Plan assumptions',
    body: () => html`<div class="lnote">These are assumptions, not results. Lens labels anything that uses them.</div>
      <div class="llab">Goal money grows (% a year)</div><input class="lin r" inputmode="decimal" value=${f.growth} onInput=${e => { f.growth = e.target.value; }} data-t="asGrowth" />
      <div class="llab">Inflation for budgets (% a year)</div><input class="lin r" inputmode="decimal" value=${f.infl} onInput=${e => { f.infl = e.target.value; }} data-t="asInfl" />
      <div class="llab">Side income counted in budgets (%)</div><input class="lin r" inputmode="decimal" value=${f.side} onInput=${e => { f.side = e.target.value; }} data-t="asSide" />`,
    onSave: () => { lsave({ up: { LN_Settings: [E.lrow('growth', num(f.growth)), E.lrow('infl', num(f.infl)), E.lrow('sideShare', Math.min(100, Math.max(0, num(f.side))))] } }, 'Plan assumptions', f.growth + '% / ' + f.infl + '% / ' + f.side + '%'); closeSheet(l); }
  });
}
async function exportLens() {
  try {
    const X = await loadXlsx(), wb = X.utils.book_new();
    const add = (name, rows) => { const ws = rows.length ? X.utils.json_to_sheet(rows) : X.utils.aoa_to_sheet([['(empty)']]); X.utils.book_append_sheet(wb, ws, name); };
    const nm = id => (DB.lnAssets.find(a => a.AsId === id) || {}).AsName || id;
    const RF = E.rollForward();
    add('Assets', RF.list.map(r => ({ Asset: r.a.AsName, TrackedBy: r.a.AsKind, PocketCategory: r.a.AsCat, Opening: r.open, In: r.inn, Growth: r.grow, Now: r.now, Access: ['Ready now', 'Within days', 'Retirement'][r.liq], MonthlyEstimate: Number(r.a.AsMonthly) || 0 })));
    add('Value updates', DB.lnValues.map(v => ({ Asset: nm(v.VaAsset), Date: v.VaDate, Kind: v.VaKind === 'value' ? 'Set value' : 'Added', Amount: v.VaAmt, Note: v.VaNote })));
    add('Goals', DB.lnGoals.map(g => ({ Goal: g.GoName, Target: g.GoTarget, By: g.GoBy, CountsAsset: nm(g.GoAsset) || '', AlreadySaved: g.GoHave, Priority: g.GoSeq })));
    add('Budgets', DB.lnBudget.map(b => ({ Year: b.BuYear, Item: String(b.BuItem).replace('_inc:', 'Income: ').replace('_rate', 'Savings rate %').replace('_locked', 'Locked'), MonthlyAmount: b.BuAmt, Type: b.BuType })));
    add('Settings', DB.lnSettings.map(s => ({ Setting: s.LsKey, Value: s.LsVal })));
    const data = X.write(wb, { bookType: 'xlsx', type: 'array' });
    await shareOrDownload('MansWell-Lens-' + Today() + '.xlsx', new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  } catch (e) { Notify("Couldn't export: " + e.message, 'error'); }
}
function resetLens(l) {
  const pick = l.reset || (l.reset = { assets: false, goals: false, budget: false });
  if (!pick.assets && !pick.goals && !pick.budget) { Notify('Choose what to reset first.', 'info'); return; }
  if (!canWrite()) return;
  askPassword(l, 'reset the chosen Lens data', () => guard(async () => {
    const del = {}, up = [];
    if (pick.assets) { del.LN_Assets = DB.lnAssets.map(a => a.AsId); del.LN_Values = DB.lnValues.map(v => v.VaId); up.push(E.lrow('openOk', false)); }
    if (pick.goals) { del.LN_Goals = DB.lnGoals.map(g => g.GoId); ['efBy', 'protect', 'age', 'retAge', 'retTarget'].forEach(k => { if (DB.lnSettings.some(s => s.LsKey === k)) up.push(E.lrow(k, '')); }); }
    if (pick.budget) del.LN_Budget = DB.lnBudget.map(b => b.BuKey);
    await save({ del, up: up.length ? { LN_Settings: up } : {}, log: [{ AuAction: 'Lens · Reset', AuRef: 'LENS', AuDetail: Object.keys(pick).filter(k => pick[k]).join(', ') }] });
    l.reset = { assets: false, goals: false, budget: false };
    Notify('Lens data reset. Pocket was not touched.', 'info');
  }));
}

export const scrLensSettings = {
  onVisible(l) { l.reset = { assets: false, goals: false, budget: false }; },
  view(l) {
    const pick = l.reset || (l.reset = { assets: false, goals: false, budget: false });
    const opened = E.lget('openOk', false), t = E.thresholds(), a = E.assumptions(), sink = E.sinking();
    const kids = html`
      ${UpdateNote()}
      <div style="padding:4px 18px 0;font-size:22.67px;color:${K.text}">Settings</div>
      ${Sect('Sources')}
      <div class="lc">
        ${sRow('flag', 'Opening balances', opened ? 'As at ' + fmtD(E.openDate(), 'dd mmm yyyy') + ' · ' + E.assets().length + ' items · confirmed' : 'Not confirmed yet · set them up in Assets', opened ? html`<span class="lchip c-grn">Locked</span>` : html`<span class="lchip c-gold">To do</span>`, opened ? () => sheetOpening(l) : null, 'setOpening')}
        ${sRow('link', 'Assets & links', E.assets().length ? E.assets().map(x => x.AsName).slice(0, 4).join(', ') + (E.assets().length > 4 ? '…' : '') : 'None yet', undefined, () => sheetAssets(l), 'setAssets')}
        ${sRow('percent', 'Savings rate rule', E.savCatsUsed().filter(c => !sink.includes(c)).concat(['leftover']).join(' + ') + (sink.filter(c => E.used().has(c)).length ? ' · ' + sink.filter(c => E.used().has(c)).join(', ') + ' left out' : ''), undefined, () => sheetRule(l), 'setRule')}
      </div>
      ${Sect('Rules')}
      <div class="lc">
        ${sRow('signal', 'Month status', `Strong ${t.strong}% · Healthy ${t.healthy}% · Watch 0% · Deficit below 0`, undefined, () => sheetStatus(l), 'setStatus')}
        ${sRow('shield', 'Essential spending', `${E.essential().length} categories · ${W0(E.essentialMonthly())} a month`, undefined, () => sheetEssential(l), 'setEssential')}
        ${sRow('calendar', 'Financial year', 'January – December · months follow Pocket (day ' + ((DB.settings && DB.settings.StCycleDay) || 28) + ')', null, null, 'setYear')}
        ${sRow('compass', 'Plan assumptions', `Goal money grows ${a.growth}% · inflation ${a.infl}% · side income counted at ${a.sideShare}%`, undefined, () => sheetAssume(l), 'setAssume')}
      </div>
      ${Sect('Data')}
      <div class="lc">
        ${sRow('excel', 'Export Lens data', 'Assets, value updates, goals, budgets and settings · Excel', undefined, exportLens, 'setExport')}
        ${sRow('table', 'Lens tabs in your Google Sheet', DB.lnOk ? 'LN_Assets · LN_Values · LN_Goals · LN_Budget · LN_Settings' : 'Not created yet · update the Apps Script to MansWell 3.0', null, null, 'setTabs')}
      </div>
      <div class="lc" style="box-shadow:inset 0 0 0 1px rgba(229,72,77,.35)" data-t="resetCard">
        <div style="display:flex;align-items:center;gap:10px">${pIcon('trash', K.red, 20)}<b style="font-size:16px">Reset Lens</b></div>
        <div class="lnote" style="margin-top:8px">Start Lens fresh. Choose what to clear:</div>
        ${[['assets', 'Opening balances & asset values'], ['goals', 'Goals & plan'], ['budget', 'Budgets']].map(([k, t2], i) => html`<div style=${`display:flex;align-items:center;gap:10px;padding:11px 0;border-top:1px solid ${K.sep};margin-top:${i ? 0 : 10}px;cursor:pointer`} onClick=${() => { pick[k] = !pick[k]; rerender(); }} data-t=${'rs-' + k}>${Check(pick[k], true)}<span style="font-size:14px">${t2}</span></div>`)}
        <div style="margin-top:12px"><button class="lbtnd" onClick=${() => resetLens(l)} data-t="resetGo">Reset selected</button></div>
        <div class="lnote" style="margin-top:10px">Never touched: Pocket's accounts, transactions and categories, and the P&L, which always comes straight from Pocket. Asks for your password.</div>
      </div>`;
    return Page(l, 4, kids, 'lensSettings');
  }
};
