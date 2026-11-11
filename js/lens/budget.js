// MansWell · Lens · Budget — next year's budget built from this year's P&L:
// review → income you can count on → pay yourself first → category budgets (fixed / day-to-day / annual) → lock.
import { html } from '../vendor/preact-htm.js';
import { K, rerender, n0, Notify } from '../core.js';
import { askPassword } from '../shared.js';
import * as E from './engine.js';
import { openGuide } from './guide.js';
import { Page, Sect, W0, UpdateNote, lsave, num } from './ui.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TYPES = ['Fixed', 'Day-to-day', 'Annual'];
const tagCls = t => (t === 'Fixed' ? 'c-mu' : t === 'Annual' ? 'c-gold' : 'c-or');
const r5 = v => Math.max(0, Math.round(v / 5) * 5);
const row = (y, item, amt, type) => ({ BuKey: E.budKey(y, item), BuYear: y, BuItem: item, BuAmt: amt, BuType: type || '' });

/** Every row the budget needs, from the current plan (suggestions until the first save). */
function allRows(B, over = {}) {
  const y = B.y, out = [];
  B.inc.forEach(r => out.push(row(y, '_inc:' + r.n, over['_inc:' + r.n] ?? r.plan)));
  out.push(row(y, '_rate', over._rate ?? B.rate));
  B.exp.forEach(r => out.push(row(y, r.n, over[r.n] ?? r.plan, over['type:' + r.n] || r.t)));
  return out;
}
function setItem(B, item, amt, type) {
  if (B.locked) return;
  const up = B.has ? [row(B.y, item, amt, type)] : allRows(B, { [item]: amt, ...(type ? { ['type:' + item]: type } : {}) });
  lsave({ up: { LN_Budget: up } }, 'Budget ' + B.y, item.replace('_inc:', 'Income: ') + ' ' + amt);
}

export const scrLensBudget = {
  onVisible(l) { if (!l.y) l.y = E.defaultYear(); },
  view(l) {
    if (!l.y) l.y = E.defaultYear();
    const B = E.budget(l.y), base = B.base, ks = base.ks;
    const baseLbl = ks.length ? (E.kY(ks[0]) === E.kY(ks[ks.length - 1]) && ks.length >= 3 && E.kY(ks[0]) === l.y - 1 ? String(l.y - 1) : MON[E.kM(ks[0]) - 1] + ' ' + String(E.kY(ks[0])).slice(2) + ' – ' + MON[E.kM(ks[ks.length - 1]) - 1] + ' ' + String(E.kY(ks[ks.length - 1])).slice(2)) : '';
    const steps = [['Review ' + (baseLbl.length <= 4 ? baseLbl : 'history'), ks.length > 0], ['Income', B.has && B.inc.some(r => E.budGet(l.y, '_inc:' + r.n))], ['Save first', !!E.budGet(l.y, '_rate')], ['Categories', B.has && B.exp.some(r => E.budGet(l.y, r.n))], ['Lock', B.locked]];
    const nextStep = steps.findIndex(s => !s[1]);
    const shown = l.allCats ? B.exp : B.exp.slice(0, 10);
    const dis = B.locked;
    const useSug = () => { if (B.locked) return; lsave({ up: { LN_Budget: allRows({ ...B, inc: B.base.inc.map(r => ({ ...r, plan: r.sug })), exp: B.base.exp.map(r => ({ ...r, plan: r.sug })) }) } }, 'Budget ' + l.y, 'Used suggestions'); };
    const bump = () => { if (B.locked || !B.has) return; const f = 1 + E.assumptions().infl / 100; lsave({ up: { LN_Budget: B.exp.map(r => row(l.y, r.n, r5(r.plan * f), r.t)) } }, 'Budget ' + l.y, '+' + E.assumptions().infl + '% inflation'); };
    const copy = () => { if (B.locked) return; lsave({ up: { LN_Budget: allRows({ ...B, exp: B.base.exp.map(r => ({ ...r, plan: r5(r.avg) })) }) } }, 'Budget ' + l.y, 'Copied averages'); };
    const lock = () => { if (B.buffer < -0.5) { Notify('Balance the budget first: it is over by ' + W0(-B.buffer) + ' a month.', 'error'); return; } lsave({ up: { LN_Budget: [...(B.has ? [] : allRows(B)), row(l.y, '_locked', 1)] } }, 'Budget ' + l.y, 'Locked'); };
    const unlock = () => askPassword(l, 'unlock the ' + l.y + ' budget', () => lsave({ up: { LN_Budget: [row(l.y, '_locked', 0)] } }, 'Budget ' + l.y, 'Unlocked'));
    const kids = html`
      ${UpdateNote()}
      <div class="lc lsel"><span class="lcb" onClick=${() => { l.y--; rerender(); }} aria-label="Previous year" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 4 7 12l8 8"/></svg>' }}></span>
        <div class="t"><b data-t="budYear">Budget ${l.y}</b><span>Jan – Dec ${l.y}${baseLbl ? ' · built from ' + baseLbl : ''}</span></div>
        <span class="lcb" onClick=${() => { l.y++; rerender(); }} aria-label="Next year" dangerouslySetInnerHTML=${{ __html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 4 8 8-8 8"/></svg>' }}></span></div>
      ${!ks.length && !B.has ? html`<div class="lc"><div class="lempty">Lens builds a budget from your closed months in Pocket. Come back after your first full month.</div></div>` : html`
      <div class="lc" style="padding:12px 14px"><div style=${`display:flex;justify-content:space-between;font-size:10.5px;font-weight:600;color:${K.sub}`}>${steps.map(([s, ok], i) => html`<div style="text-align:center;flex:1"><div style=${`width:22px;height:22px;border-radius:50%;margin:0 auto 5px;display:grid;place-items:center;font-size:11px;${ok ? `background:${K.or};color:#fff` : i === nextStep ? `box-shadow:inset 0 0 0 1.5px ${K.or};color:${K.or}` : 'box-shadow:inset 0 0 0 1px #2C3038'}`}>${ok ? '✓' : i + 1}</div><span style=${i === nextStep ? `color:${K.or}` : ''}>${s}</span></div>`)}</div></div>
      <div class="lc lh" data-t="budHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">${l.y} · per month${B.has ? '' : ' · suggested'}</span><span class=${'lpill' + (B.buffer < -0.5 ? ' red' : '')} data-t="budStatus">${B.locked ? 'LOCKED' : B.buffer < -0.5 ? 'OVER BY ' + W0(-B.buffer) : 'BALANCED'}</span></div>
        <div class="lbig" data-t="budInc">${W0(B.incT)}<small> planned income</small></div>
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;gap:2px;margin-top:14px">${B.incT > 0 ? html`<i style=${`width:${B.save / B.incT * 100}%;background:${K.grn}`}></i><i style=${`width:${Math.min(B.spend, Math.max(0, B.incT - B.save)) / B.incT * 100}%;background:${K.or}`}></i>${B.buffer < 0 ? html`<i style=${`width:${Math.min(30, -B.buffer / B.incT * 100)}%;background:${K.red}`}></i>` : html`<i style="flex:1;background:#3A3F47"></i>`}` : null}</div>
        <div class="lg2 r2" style="margin-top:14px">
          <div><span class="lcap">Save first · ${B.rate}%</span><div class="lv lup" data-t="budSave">${W0(B.save)}</div></div><div><span class="lcap">Spending budget</span><div class="lv" data-t="budSpend">${W0(B.spend)}</div></div>
          <div><span class="lcap">${baseLbl || 'History'} actual</span><div class="lv">${W0(base.avgExp)} <small>spent / mo</small></div></div><div><span class="lcap">${B.buffer < -0.5 ? 'To find' : 'Buffer'}</span><div class=${'lv ' + (B.buffer < -0.5 ? 'ldn' : 'lup')} data-t="budBuffer">${W0(Math.abs(B.buffer))}</div></div></div>
      </div>
      ${!B.has ? html`<div style="margin:0 12px 12px"><button class="lbtnf" onClick=${useSug} data-t="budStart">Start ${l.y} from these suggestions</button><div class="lnote" style="margin-top:8px;text-align:center">Nothing is saved until you start or change a figure.</div></div>` : null}
      ${Sect('Income plan')}
      <div class="lc">${B.inc.length ? B.inc.map(r => html`<div class="lr" style="grid-template-columns:1fr 112px"><div><div class="t">${r.n}</div><div class="s">${baseLbl} avg ${W0(r.avg)} · ${r.main ? '+' + (E.assumptions().infl + 1) + '% increment, your estimate' : 'count ' + E.assumptions().sideShare + '%, it varies'}</div></div>
          <input class="lin r" inputmode="decimal" value=${String(Math.round(r.plan))} disabled=${dis} onChange=${e => setItem(B, '_inc:' + r.n, num(e.target.value))} data-t=${'bi-' + r.n} /></div>`) : html`<div class="lnote">No income in Pocket yet for this period.</div>`}
        <div class="lnote" style="margin-top:6px">Planners budget on income you can count on. Extra side income becomes a bonus that goes straight to savings.</div></div>
      ${Sect('Pay yourself first')}
      <div class="lc"><div style="display:flex;gap:8px">${[20, 25, 30, 35].map(p => html`<button class=${'lbtn' + (p === B.rate ? ' o on' : '')} style="flex:1" disabled=${dis} onClick=${() => setItem(B, '_rate', p)} data-t=${'rate-' + p}>${p}%</button>`)}</div>
        <div class="lnote" style="margin-top:10px">${base.savedRate !== null ? html`You saved <b class=${base.savedRate >= 20 ? 'lup' : 'lgd'}>${base.savedRate.toFixed(1)}%</b> over ${baseLbl}. ` : ''}20% is the usual minimum. Savings comes off the top, and the categories share what's left.</div></div>
      ${Sect('Category budgets')}
      <div class="lc" style="padding:12px 16px">
        ${!dis ? html`<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap"><button class="lbtn o" style="padding:6px 10px;font-size:11.5px" onClick=${useSug} data-t="budSug">Use suggestions</button><button class="lbtn" style="padding:6px 10px;font-size:11.5px" disabled=${!B.has} onClick=${bump} data-t="budInfl">+${E.assumptions().infl}% inflation</button><button class="lbtn" style="padding:6px 10px;font-size:11.5px" onClick=${copy} data-t="budCopy">Copy ${baseLbl.length <= 4 ? baseLbl : 'averages'}</button></div>` : null}
        <div style=${`display:grid;grid-template-columns:1fr 62px 84px;gap:8px;font-size:9.5px;font-weight:600;letter-spacing:1px;color:${K.sub};padding:4px 0 6px`}><span>CATEGORY</span><span style="text-align:right">AVG</span><span style="text-align:right">${l.y} / MO</span></div>
        ${shown.map(r => html`<div style=${`display:grid;grid-template-columns:1fr 62px 84px;gap:8px;align-items:center;padding:9px 0;border-top:1px solid ${K.sep}`} data-t=${'bc-' + r.n}>
          <div style="min-width:0"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.n}</div><div style="margin-top:4px"><span class=${'lchip ' + tagCls(r.t)} style=${`font-size:8.5px;padding:2px 6px;cursor:${dis ? 'default' : 'pointer'}`} onClick=${() => { if (!dis) setItem(B, r.n, r.plan, TYPES[(TYPES.indexOf(r.t) + 1) % 3]); }}>${r.t}</span></div></div>
          <div style=${`text-align:right;font-size:12.5px;color:${K.sub}`}>${n0(r.avg)}</div>
          <input class="lin r" style="height:34px;font-size:13.5px;padding:0 8px" inputmode="decimal" value=${String(Math.round(r.plan))} disabled=${dis} onChange=${e => setItem(B, r.n, num(e.target.value), r.t)} /></div>`)}
        ${B.exp.length > shown.length ? html`<div style=${`padding:10px 0;border-top:1px solid ${K.sep};color:${K.or};font-size:12.5px;font-weight:600;cursor:pointer`} onClick=${() => { l.allCats = true; rerender(); }} data-t="budAll">Show all ${B.exp.length} categories</div>` : null}
        <div style=${`display:grid;grid-template-columns:1fr 62px 84px;gap:8px;padding:10px 0 2px;border-top:1px solid #2E333B;font-weight:700;font-size:13.5px`}><span>Total</span><span style="text-align:right">${n0(base.avgExp)}</span><span style="text-align:right" data-t="budTotal">${n0(B.spend)}</span></div>
        <div class="lnote" style="margin-top:10px">Suggestions: <b>fixed</b> = latest amount · <b>day-to-day</b> = your typical month (median) +${E.assumptions().infl}% · <b>annual</b> = the yearly total spread over 12 months. Tap a tag to change it.</div>
      </div>
      ${B.annual.length ? html`${Sect('Annual costs')}
      <div class="lc"><div class="lnote" style="margin-bottom:6px">These come in lumps. Set a little aside every month so they never cause a deficit month.</div>
        ${B.annual.slice(0, 5).map(r => html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t" style="font-size:13.5px">${r.n}</div><div class="s">${W0(r.yearTotal)} a year</div></div><div class="r">${W0(r.plan)}<small class="lmu">a month</small></div></div>`)}
        <div class="lr" style="grid-template-columns:1fr auto"><div><div class="t lor" style="font-size:13.5px">Set aside in total</div><div class="s">all ${B.annual.length} annual categories · into a sinking fund</div></div><div class="r lor" data-t="budAnnual">${W0(B.annual.reduce((s, r) => s + r.plan, 0))}<small class="lmu">a month</small></div></div></div>` : null}
      ${Sect('Balance check')}
      <div class="lc">${[['Needs', B.needs, 50, K.or], ['Wants', B.wants, 30, K.gold], ['Savings', B.save, 20, K.grn]].map(([t, v, g, c]) => { const p = B.incT > 0 ? v / B.incT * 100 : 0; return html`<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:13px"><b>${t}</b><span><b>${p.toFixed(0)}%</b> <span class="lmu">· guide ${g}%</span></span></div><div class="lbar" style="margin-top:7px"><i style=${`width:${Math.min(100, p)}%;background:${c}`}></i></div></div>`; })}
        <div class="lnote" style="margin-top:12px">The 50/30/20 guide, as a reference only. Needs are your essential categories (set in Lens Settings).${B.buffer < -0.5 ? html` To balance, trim <b>${W0(-B.buffer)}</b> a month from wants, or save ${Math.max(0, B.rate - Math.ceil(-B.buffer / Math.max(1, B.incT) * 100))}% instead of ${B.rate}%.` : ''} During ${l.y}, the P&L shows budget vs actual each month.</div></div>
      <div style="margin:4px 12px 8px">${B.locked ? html`<button class="lbtn" style="width:100%;padding:12px" onClick=${unlock} data-t="budUnlock">Unlock budget ${l.y}</button>` : html`<button class="lbtnf" onClick=${lock} data-t="budLock">Lock budget ${l.y}</button>`}</div>`}`;
    return Page(l, 3, kids, 'lensBudget', () => openGuide(l, 'budget'));
  }
};
