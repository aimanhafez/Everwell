// MansWell · Lens · Plan — monitors your Tabung. Each Tabung with a target is a goal; the emergency-fund Tabung comes
// first, the rest follow in your order. Saving power (what you really save) funds them, with an exact fix for a late one.
import { html } from '../vendor/preact-htm.js';
import { K, rerender, Notify } from '../core.js';
import { askPassword } from '../shared.js';
import * as E from './engine.js';
import { openGuide } from './guide.js';
import { editAsset } from './assets.js';
import { Page, Sect, W0, UpdateNote, openSheet, closeSheet, lsave, num, newId, Switch, iconHtml } from './ui.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const kl = k => MON[E.kM(k) - 1] + ' ' + E.kY(k);
const ymOf = k => E.kY(k) + '-' + String(E.kM(k)).padStart(2, '0');

/** Target for one Tabung: amount and date, or "this is my emergency fund" (target = months × essentials). */
function editTarget(l, a) {
  const g = E.goalOf(a), ess = E.essentialMonthly(), other = E.efTabung();
  const f = { em: !!(g && g.GoKind === 'emergency'), months: E.efMonths(), target: g && g.GoKind !== 'emergency' ? String(g.GoTarget || '') : '', by: (g && g.GoBy) || ymOf(E.kAdd(E.curKey(), 24)) };
  const list = E.planGoals().filter(x => x.kind === 'goal'), idx = g ? list.findIndex(x => x.id === g.GoId) : -1;
  const move = d => { const j = idx + d; if (j < 0 || j >= list.length) return; const x = list[idx].g, y = list[j].g; lsave({ up: { LN_Goals: [{ ...x, GoSeq: y.GoSeq || j + 1 }, { ...y, GoSeq: x.GoSeq || idx + 1 }] } }, 'Goal priority', a.AsName); closeSheet(l); };
  openSheet(l, {
    title: a.AsName,
    body: () => html`
      <div class="lnote">Balance now <b>${W0((E.rollForward().list.find(r => r.a.AsId === a.AsId) || { now: 0 }).now)}</b>. Set what this Tabung is for, and Plan tracks it.</div>
      <div class="lr" style="grid-template-columns:1fr auto;margin-top:10px"><div><div class="t">Emergency fund</div><div class="s">${other && other.AsId !== a.AsId ? other.AsName + ' is your emergency fund now. Turning this on moves it here.' : 'Target = months of essential spending. Always first in Plan.'}</div></div>${Switch(f.em, () => { f.em = !f.em; rerender(); }, 'tgEm')}</div>
      ${f.em ? html`<div class="llab">Months of essentials</div><div style="display:flex;gap:8px">${[3, 6, 12].map(m => html`<button class=${'lbtn' + (f.months === m ? ' o on' : '')} style="flex:1" onClick=${() => { f.months = m; rerender(); }} data-t=${'efm-' + m}>${m} months</button>`)}</div>
        <div class="lnote" style="margin-top:8px">Essentials average <b>${W0(ess)}</b> a month · target <b>${W0(f.months * ess)}</b>. Pick the essential categories in Lens Settings.</div>`
        : html`<div class="llab">Target (RM)</div><input class="lin r" inputmode="decimal" value=${f.target} placeholder="0" onInput=${e => { f.target = e.target.value; }} data-t="tgTarget" />`}
      <div class="llab">By</div><input class="lin" type="month" value=${f.by} min=${ymOf(E.curKey())} onInput=${e => { f.by = e.target.value; }} data-t="tgBy" />
      ${g && !f.em && list.length > 1 && idx >= 0 ? html`<div class="llab">Priority · ${idx + 1} of ${list.length} (after the emergency fund)</div><div style="display:flex;gap:8px"><button class="lbtn" style="flex:1" disabled=${idx === 0} onClick=${() => move(-1)}>${iconHtml('up', K.text, 15)}Higher</button><button class="lbtn" style="flex:1" disabled=${idx === list.length - 1} onClick=${() => move(1)}>${iconHtml('down', K.text, 15)}Lower</button></div>` : null}
      ${g ? html`<div style="margin-top:16px"><button class="lbtnd" data-t="tgRemove" onClick=${() => { lsave({ del: { LN_Goals: [g.GoId] } }, 'Target removed', a.AsName); closeSheet(l); }}>Remove target</button><div class="lnote" style="margin-top:6px;text-align:center">The Tabung and its money stay.</div></div>` : null}`,
    onSave: () => {
      if (!/^\d{4}-\d{2}$/.test(f.by)) { Notify('Pick a month.', 'info'); return; }
      const t = num(f.target); if (!f.em && t <= 0) { Notify('Enter a target amount.', 'info'); return; }
      const seq = (E.goals().reduce((m, x) => Math.max(m, Number(x.GoSeq) || 0), 0)) + 1;
      const row = { ...(g || { GoId: newId('GO'), GoSeq: seq, GoActive: true, GoHave: 0 }), GoName: a.AsName, GoAsset: a.AsId, GoKind: f.em ? 'emergency' : 'goal', GoTarget: f.em ? 0 : t, GoBy: f.by };
      const up = { LN_Goals: [row] };
      if (f.em) {
        up.LN_Settings = [E.lrow('efMonths', f.months)];
        const prev = E.goals().find(x => x.GoKind === 'emergency' && x.GoId !== row.GoId);
        if (prev) up.LN_Goals.push({ ...prev, GoKind: 'goal', GoTarget: Number(prev.GoTarget) || round0(E.efMonths() * ess) });
      }
      lsave({ up }, g ? 'Target updated' : 'Target set', a.AsName + (f.em ? ' · emergency fund' : ' ' + t + ' by ' + f.by)); closeSheet(l);
    },
    saveLabel: 'Save target'
  });
}
const round0 = v => Math.round(v);
/** A goal from before Tabung (3.1.x) that isn't linked to one: link it, or remove it. */
function linkOld(l, g) {
  const f = { tab: '' }, tabs = E.assets().filter(E.isTabung).filter(a => !E.goalOf(a));
  openSheet(l, {
    title: g.GoName,
    body: () => html`<div class="lnote">Plan now follows your Tabung. Pick the Tabung this goal is for, and its target (${W0(g.GoTarget)} by ${g.GoBy}) moves there.</div>
      <div class="llab">Tabung</div><select class="lin" onChange=${e => { f.tab = e.target.value; }} data-t="olTab"><option value="">Choose a Tabung…</option>${tabs.map(a => html`<option value=${a.AsId}>${a.AsName}</option>`)}</select>
      ${!tabs.length ? html`<div class="lnote" style="margin-top:8px">No free Tabung yet. Add one on the Savings page first.</div>` : null}
      <div style="margin-top:16px"><button class="lbtnd" onClick=${() => askPassword(l, 'remove the goal ' + g.GoName, () => { lsave({ del: { LN_Goals: [g.GoId] } }, 'Goal removed', g.GoName); closeSheet(l); })}>Remove this goal</button></div>`,
    onSave: () => { if (!f.tab) return; const a = E.assets().find(x => x.AsId === f.tab); lsave({ up: { LN_Goals: [{ ...g, GoAsset: f.tab, GoKind: 'goal', GoName: a ? a.AsName : g.GoName }] } }, 'Goal linked to Tabung', g.GoName); closeSheet(l); },
    saveLabel: 'Link'
  });
}

export const scrLensPlan = {
  onVisible(l) { l.extra = l.extra || 0; },
  view(l) {
    const SP = E.savingPower(), list = E.planGoals(), sim = E.simulate(list, SP.v), simX = l.extra ? E.simulate(list, SP.v + l.extra) : null;
    const RF = E.rollForward(), tabs = RF.tabung, noTarget = tabs.filter(r => !E.goalOf(r.a));
    const old = E.goals().filter(g => !g.GoAsset || !tabs.some(r => r.a.AsId === g.GoAsset));
    const onTrack = list.filter((g, i) => sim.done[i] !== null && sim.done[i] <= sim.due[i]).length;
    const lateI = list.findIndex((g, i) => sim.done[i] === null || sim.done[i] > sim.due[i]);
    const fix = lateI >= 0 ? E.planFixes(list, SP.v, lateI) : null;
    const goalRow = (g, i) => { const d = sim.done[i], late = d === null || d > sim.due[i], prog = g.target > 0 ? Math.min(100, g.have / g.target * 100) : 0;
      return html`<div style=${`padding:12px 0;border-top:${i ? '1px solid ' + K.sep : '0'};cursor:pointer`} onClick=${() => editTarget(l, g.a)} data-t=${'goal-' + g.n}>
        <div style="display:flex;align-items:center;gap:10px"><span style=${`font:600 14px Georgia,serif;color:${K.or}`}>${i + 1}</span><span style="font-size:14.5px;font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.n}</span><span class=${'lchip ' + (d === -1 ? 'c-grn' : late ? 'c-red' : 'c-grn')}>${d === -1 ? 'Done' : d === null ? 'Not reached' : late ? 'Late ' + (d - sim.due[i]) + ' mo' : 'On track'}</span></div>
        <div style=${`margin:4px 0 0 20px;font-size:11.5px;color:${K.sub}`}>${g.kind === 'emergency' ? 'Emergency fund · ' + g.src + ' · ' : ''}${W0(g.target)} by ${kl(g.by)}</div>
        <div style="margin:9px 0 0 20px"><div class="lbar"><i style=${`width:${prog}%;background:${K.or}`}></i></div>
          <div style=${`display:flex;justify-content:space-between;font-size:11.5px;color:${K.sub};margin-top:6px`}><span>${W0(g.have)} of ${W0(g.target)}</span><span>${d === -1 ? 'reached' : html`needs <b style=${`color:${K.text}`}>${W0(sim.pace[i])}</b> / month`}</span></div></div></div>`; };
    const kids = html`
      ${UpdateNote()}
      <div class="lc lh" data-t="planHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">Saving power</span>${SP.n ? html`<span class="lpill">${SP.n === 1 ? kl(SP.to).split(' ')[0].toUpperCase() + ' ONLY' : (MON[E.kM(SP.from) - 1] + ' – ' + MON[E.kM(SP.to) - 1]).toUpperCase() + ' AVERAGE'}</span>` : null}</div>
        <div class="lbig" data-t="planPower">${W0(SP.v)}<small> / month</small></div>
        <div class="lsub">${SP.n ? 'What you actually saved per month, from your P&L. Your Tabung goals are filled from this.' : 'Lens needs at least one closed month in Pocket to measure this.'}</div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">In your Tabung</span><div class="lv" data-t="planTab">${W0(RF.tab.now)}</div></div><div><span class="lcap">Goals on track</span><div class="lv" data-t="planOnTrack">${onTrack} <small>of ${list.length}</small></div></div></div>
      </div>
      ${Sect('Tabung goals', '+ Tabung', () => editAsset(l, null, { tabung: true }), 'planAddTab')}
      <div class="lc" data-t="planGoals">${list.length ? list.map(goalRow) : html`<div class="lempty">${tabs.length ? 'Set a target on a Tabung below to track it here.' : 'Plan tracks your Tabung. Add one, like an emergency fund or a house fund, then set its target.'}</div>`}
        ${noTarget.length ? html`<div style=${`margin-top:${list.length ? 6 : 0}px;padding-top:6px;${list.length ? 'border-top:1px solid ' + K.sep : ''}`}><span class="lcap">No target yet</span>
          ${noTarget.map(r => html`<div class="lr tap" style="grid-template-columns:1fr auto;cursor:pointer" onClick=${() => editTarget(l, r.a)} data-t=${'nt-' + r.a.AsName}><div style="min-width:0"><div class="t" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.a.AsName}</div><div class="s">${W0(r.now)} · tap to set a target</div></div><span class="lbtn o" style="padding:6px 12px">Set target</span></div>`)}</div>` : null}</div>
      ${old.length ? html`${Sect('Goals to link')}
      <div class="lc">${old.map(g => html`<div class="lr tap" style="grid-template-columns:1fr auto;cursor:pointer" onClick=${() => linkOld(l, g)} data-t=${'ol-' + g.GoName}><div><div class="t">${g.GoName}</div><div class="s">${W0(g.GoTarget)} by ${g.GoBy} · not linked to a Tabung</div></div><span class="lbtn o" style="padding:6px 12px">Link</span></div>`)}</div>` : null}
      ${fix ? html`${Sect('Fix the late goal')}
      <div class="lc" data-t="planFix"><div class="lnote" style="margin-bottom:6px">${list[lateI].n} finishes ${sim.done[lateI] === null ? 'too far away to show' : html`in <b>${kl(E.kAdd(E.curKey(), sim.done[lateI]))}</b>`}, after its ${kl(list[lateI].by)} target. Pick one:</div>
        <div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Save more</div><div class="s">Reaches it on time, nothing else moves</div></div><button class="lbtn o" onClick=${() => { l.extra = Math.min(2000, Math.ceil(fix.extra / 50) * 50); rerender(); }} data-t="fixMore">+${W0(fix.extra)} a month</button></div>
        ${fix.moveTo ? html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Move the date</div><div class="s">Same monthly plan</div></div><button class="lbtn o" onClick=${() => lsave({ up: { LN_Goals: [{ ...list[lateI].g, GoBy: ymOf(fix.moveTo) }] } }, 'Goal date moved', list[lateI].n + ' to ' + kl(fix.moveTo))} data-t="fixMove">to ${kl(fix.moveTo)}</button></div>` : null}
        ${list[lateI].kind === 'goal' ? html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Lower the target</div><div class="s">What the plan reaches on time</div></div><button class="lbtn o" onClick=${() => lsave({ up: { LN_Goals: [{ ...list[lateI].g, GoTarget: fix.lower }] } }, 'Goal target lowered', list[lateI].n + ' to ' + fix.lower)} data-t="fixLower">${W0(fix.lower)} by ${kl(list[lateI].by).split(' ')[0]}</button></div>` : null}
      </div>` : null}
      ${list.length && SP.v > 0 ? html`${Sect('What if')}
      <div class="lc"><div class="lfx"><div style="display:flex;justify-content:space-between"><span class="lcap">What if I save</span><b data-t="wiAmt">+${W0(l.extra || 0)} / month</b></div>
        <input type="range" min="0" max="2000" step="50" value=${l.extra || 0} onInput=${e => { l.extra = Number(e.target.value); rerender(); }} style=${`width:100%;margin-top:12px;accent-color:${K.or}`} data-t="wiRange" />
        <div class="lsub" style="margin-top:8px" data-t="wiResult">${!l.extra ? 'Slide to see how much sooner each Tabung reaches its target.' : list.map((g, i) => { const a = sim.done[i], b = simX.done[i]; if (a === -1) return null; const diff = a === null ? null : (b === null ? null : a - b); return html`<div>${g.n}: <b style=${`color:${K.text}`}>${b === null ? 'not reached' : kl(E.kAdd(E.curKey(), b))}</b>${diff ? html` <span class="lup">(${diff} month${diff === 1 ? '' : 's'} sooner)</span>` : ''}</div>`; })}</div></div>
        <div class="lnote" style="margin-top:10px">Assumes Tabung money grows ${E.assumptions().growth}% a year${E.assumptions().growth ? '' : ' (cautious)'}. Dividends are a bonus on top. Change this in Lens Settings.</div></div>` : null}`;
    return Page(l, 2, kids, 'lensPlan', () => openGuide(l, 'plan'));
  }
};
