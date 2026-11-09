// MansWell · Lens · Plan — the way a financial planner works: real saving power first, foundations before goals,
// goals funded in priority order, and an exact fix for any goal that would be late.
import { html } from '../vendor/preact-htm.js';
import { K, DB, rerender, Today, n0 } from '../core.js';
import * as E from './engine.js';
import { Page, Sect, W0, W2, UpdateNote, openSheet, closeSheet, lsave, num, newId, pIcon, Switch, iconHtml } from './ui.js';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const kl = k => MON[E.kM(k) - 1] + ' ' + E.kY(k);
const ymOf = k => E.kY(k) + '-' + String(E.kM(k)).padStart(2, '0');

function editGoal(l, g) {
  const f = g ? { name: g.GoName, target: String(g.GoTarget || ''), by: g.GoBy || '', asset: g.GoAsset || '', have: g.GoHave ? String(g.GoHave) : '' } : { name: '', target: '', by: ymOf(E.kAdd(E.curKey(), 24)), asset: '', have: '' };
  const list = E.goals(), idx = g ? list.findIndex(x => x.GoId === g.GoId) : -1;
  const move = d => { const j = idx + d; if (j < 0 || j >= list.length) return; const a = list[idx], b = list[j]; lsave({ up: { LN_Goals: [{ ...a, GoSeq: b.GoSeq || j + 1 }, { ...b, GoSeq: a.GoSeq || idx + 1 }] } }, 'Goal priority', a.GoName); closeSheet(l); };
  openSheet(l, {
    title: g ? g.GoName : 'New goal',
    body: () => html`
      <div class="llab">Goal</div><input class="lin" value=${f.name} placeholder="e.g. House down payment" onInput=${e => { f.name = e.target.value; }} data-t="goName" />
      <div class="llab">Target (RM)</div><input class="lin r" inputmode="decimal" value=${f.target} placeholder="0" onInput=${e => { f.target = e.target.value; }} data-t="goTarget" />
      <div class="llab">By</div><input class="lin" type="month" value=${f.by} min=${ymOf(E.curKey())} onInput=${e => { f.by = e.target.value; }} data-t="goBy" />
      <div class="llab">Money already set aside for it · optional</div>
      <select class="lin" onChange=${e => { f.asset = e.target.value; }} data-t="goAsset"><option value="">None, start from zero</option>${E.assets().map(a => html`<option value=${a.AsId} selected=${f.asset === a.AsId}>${a.AsName} · ${W0(E.valueAt(a, Today()))}</option>`)}</select>
      <div class="lnote" style="margin-top:6px">The asset's whole value counts toward this goal.</div>
      <div class="llab">Plus an amount saved elsewhere · optional</div><input class="lin r" inputmode="decimal" value=${f.have} placeholder="0" onInput=${e => { f.have = e.target.value; }} data-t="goHave" />
      ${g && list.length > 1 ? html`<div class="llab">Priority · ${idx + 1} of ${list.length} (after the emergency fund)</div><div style="display:flex;gap:8px"><button class="lbtn" style="flex:1" disabled=${idx === 0} onClick=${() => move(-1)}>${iconHtml('up', K.text, 15)}Higher</button><button class="lbtn" style="flex:1" disabled=${idx === list.length - 1} onClick=${() => move(1)}>${iconHtml('down', K.text, 15)}Lower</button></div>` : null}
      ${g ? html`<div style="margin-top:16px"><button class="lbtnd" data-t="goDelete" onClick=${() => { lsave({ del: { LN_Goals: [g.GoId] } }, 'Goal removed', g.GoName); closeSheet(l); }}>Remove goal</button></div>` : null}`,
    onSave: () => {
      const name = String(f.name || '').trim(), t = num(f.target); if (!name || t <= 0 || !/^\d{4}-\d{2}$/.test(f.by)) return;
      const row = { ...(g || { GoId: newId('GO'), GoSeq: (list.reduce((m, x) => Math.max(m, x.GoSeq || 0), 0)) + 1, GoKind: 'goal', GoActive: true }), GoName: name, GoTarget: t, GoBy: f.by, GoAsset: f.asset, GoHave: num(f.have) };
      lsave({ up: { LN_Goals: [row] } }, g ? 'Goal updated' : 'Goal added', name + ' ' + t + ' by ' + f.by); closeSheet(l);
    }
  });
}
function editEF(l) {
  const f = { months: E.efMonths(), by: E.lget('efBy', '') || ymOf(E.kAdd(E.curKey(), 8)) };
  openSheet(l, {
    title: 'Emergency fund',
    body: () => html`
      <div class="lnote">Planners keep 3 to 6 months of essential spending in cash you can reach today. Pick 12 months if your income is irregular.</div>
      <div class="llab">Months of essentials</div><div style="display:flex;gap:8px">${[3, 6, 12].map(m => html`<button class=${'lbtn' + (f.months === m ? ' o on' : '')} style="flex:1" onClick=${() => { f.months = m; rerender(); }} data-t=${'efm-' + m}>${m} months</button>`)}</div>
      <div class="lnote" style="margin-top:8px">Essentials average <b>${W0(E.essentialMonthly())}</b> a month · target <b>${W0(f.months * E.essentialMonthly())}</b>. Choose which categories count in Lens Settings.</div>
      <div class="llab">Build it by</div><input class="lin" type="month" value=${f.by} onInput=${e => { f.by = e.target.value; }} data-t="efBy" />`,
    onSave: () => { lsave({ up: { LN_Settings: [E.lrow('efMonths', f.months), E.lrow('efBy', f.by)] } }, 'Emergency fund', f.months + ' months by ' + f.by); closeSheet(l); }
  });
}
function editRetire(l) {
  const f = { age: String(E.lget('age', '') || ''), retAge: String(E.lget('retAge', 55)), target: String(E.lget('retTarget', '') || '') };
  openSheet(l, {
    title: 'Retirement',
    body: () => html`
      <div class="lnote">Lens adds up your “Retirement” assets (like KWSP) and their monthly contributions, then checks them against your target.</div>
      <div class="llab">Your age now</div><input class="lin r" inputmode="numeric" value=${f.age} onInput=${e => { f.age = e.target.value; }} data-t="rtAge" />
      <div class="llab">Retire at</div><input class="lin r" inputmode="numeric" value=${f.retAge} onInput=${e => { f.retAge = e.target.value; }} data-t="rtRetAge" />
      <div class="llab">Target amount (RM)</div><input class="lin r" inputmode="decimal" value=${f.target} onInput=${e => { f.target = e.target.value; }} data-t="rtTarget" />`,
    onSave: () => { lsave({ up: { LN_Settings: [E.lrow('age', num(f.age)), E.lrow('retAge', num(f.retAge) || 55), E.lrow('retTarget', num(f.target))] } }, 'Retirement target', f.target); closeSheet(l); }
  });
}
function retirement() {
  const RF = E.rollForward(), list = RF.list.filter(r => r.liq === 2), have = list.reduce((s, r) => s + r.now, 0), monthly = list.reduce((s, r) => s + (Number(r.a.AsMonthly) || 0), 0);
  const age = Number(E.lget('age', 0)), retAge = Number(E.lget('retAge', 55)), target = Number(E.lget('retTarget', 0));
  if (!age || !target) return { have, monthly, set: false };
  const months = Math.max(0, (retAge - age) * 12), g = Math.max(0, E.assumptions().growth) / 100 / 12;
  const fv = g ? have * Math.pow(1 + g, months) + monthly * (Math.pow(1 + g, months) - 1) / g : have + monthly * months;
  const need = months > 0 ? Math.max(0, (target - (g ? have * Math.pow(1 + g, months) : have)) / (g ? (Math.pow(1 + g, months) - 1) / g : months)) : 0;
  return { have, monthly, set: true, fv, target, need, ok: fv >= target, retAge };
}
function gantt(list, sim) {
  const W = 334, last = Math.max(12, ...sim.done.map((d, i) => (d === null ? 60 : Math.max(d, sim.due[i]))) ) + 3, months = Math.min(last, 96);
  const X = m => 96 + m / months * (W - 104), rowH = 46, H = 28 + list.length * rowH, c0 = E.curKey();
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  for (let m = 1; m <= months; m++) { const k = E.kAdd(c0, m); if (E.kM(k) === 1) { const x = X(m); if (x > W - 26) continue; s += `<line x1="${x}" x2="${x}" y1="14" y2="${H}" stroke="${K.sep}"/><text x="${x + 3}" y="10" font-size="9.5" fill="${K.mute}">${E.kY(k)}</text>`; } }
  list.forEach((g, i) => {
    const y = 22 + i * rowH, d = sim.done[i], late = d !== null && d > sim.due[i];
    const nm = g.n.length > 15 ? g.n.slice(0, 14) + '…' : g.n;
    s += `<text x="0" y="${y + 12}" font-size="11.5" font-weight="600" fill="${K.text}">${nm.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text><text x="0" y="${y + 27}" font-size="9.5" fill="${late ? K.red : K.sub}">${d === -1 ? 'Done' : d === null ? 'Not reached' : kl(E.kAdd(c0, d))}</text>`;
    (sim.alloc[i] || []).slice(0, months).forEach((a, m) => { if (a > 0.5) s += `<rect x="${X(m)}" y="${y + 3}" width="${(W - 104) / months + .4}" height="16" fill="${late && m > sim.due[i] ? K.red : K.or}" opacity="${0.25 + 0.75 * Math.min(1, a / 700)}"/>`; });
    if (sim.due[i] <= months) { const tx = X(Math.min(months, sim.due[i] + 1)); s += `<line x1="${tx}" x2="${tx}" y1="${y - 1}" y2="${y + 23}" stroke="#fff" stroke-width="1.5"/><text x="${tx}" y="${y + 34}" text-anchor="middle" font-size="8.5" fill="${K.sub}">target</text>`; }
  });
  return s + '</svg>';
}

export const scrLensPlan = {
  onVisible(l) { l.extra = l.extra || 0; },
  view(l) {
    const SP = E.savingPower(), list = E.planGoals(), sim = E.simulate(list, SP.v), simX = l.extra ? E.simulate(list, SP.v + l.extra) : null;
    const ess = E.essentialMonthly(), ready = E.readyNow(), efM = E.efMonths(), cover = ess > 0 ? ready / ess : 0, cards = E.cardStatus(), rt = retirement(), protect = !!E.lget('protect', false);
    const onTrack = list.filter((g, i) => sim.done[i] !== null && sim.done[i] <= sim.due[i]).length;
    const lateI = list.findIndex((g, i) => sim.done[i] === null || sim.done[i] > sim.due[i]);
    const fix = lateI >= 0 ? E.planFixes(list, SP.v, lateI) : null;
    const goalRow = (g, i) => { const d = sim.done[i], late = d === null || d > sim.due[i], prog = g.target > 0 ? Math.min(100, g.have / g.target * 100) : 0;
      return html`<div style=${`padding:12px 0;border-top:${i ? '1px solid ' + K.sep : '0'};cursor:pointer`} onClick=${() => (g.kind === 'emergency' ? editEF(l) : editGoal(l, g.g))} data-t=${'goal-' + g.n}>
        <div style="display:flex;align-items:center;gap:10px"><span style=${`font:600 14px Georgia,serif;color:${K.or}`}>${i + 1}</span><span style="font-size:14.5px;font-weight:600;flex:1">${g.n}</span><span class=${'lchip ' + (d === -1 ? 'c-grn' : late ? 'c-red' : 'c-grn')}>${d === -1 ? 'Done' : d === null ? 'Not reached' : late ? 'Late ' + (d - sim.due[i]) + ' mo' : 'On track'}</span></div>
        <div style=${`margin:4px 0 0 20px;font-size:11.5px;color:${K.sub}`}>${W0(g.target)} by ${kl(g.by)} · ${g.src}</div>
        <div style="margin:9px 0 0 20px"><div class="lbar"><i style=${`width:${prog}%;background:${K.or}`}></i></div>
          <div style=${`display:flex;justify-content:space-between;font-size:11.5px;color:${K.sub};margin-top:6px`}><span>${W0(g.have)} of ${W0(g.target)}</span><span>${d === -1 ? 'reached' : html`needs <b style=${`color:${K.text}`}>${W0(sim.pace[i])}</b> / month`}</span></div></div></div>`; };
    const found = [
      ['shield', 'Emergency fund', ess > 0 ? `${cover.toFixed(1)} of ${efM} months · ${W0(ready)} of ${W0(efM * ess)}` : 'Needs a month of spending in Pocket first', cover >= efM ? ['c-grn', 'Done'] : ['c-gold', 'Building'], () => editEF(l)],
      ['card', 'No card debt carried', cards.none ? 'No credit cards in Pocket' : cards.carried > 0 ? `${W0(cards.carried)} carried past the due date` : cards.due ? 'Statement balance due ' + cards.due.slice(8) + ' ' + MON[Number(cards.due.slice(5, 7)) - 1] : 'Cards paid in full · from Pocket', cards.none ? ['c-mu', 'No cards'] : cards.carried > 0 ? ['c-red', 'Carried'] : cards.due ? ['c-gold', 'Due soon'] : ['c-grn', 'Done'], null],
      ['heart', 'Protection', protect ? 'Medical card and life cover in place' : 'Medical card and life cover · tap when in place', protect ? ['c-grn', 'Done'] : ['c-mu', 'Not set'], () => lsave({ up: { LN_Settings: [E.lrow('protect', !protect)] } }, 'Protection', protect ? 'not set' : 'in place')],
      ['umbrella', 'Retirement', rt.set ? `${W0(rt.have)} now · projected ${W0(rt.fv)} at ${rt.retAge}` : `${W0(rt.have)} in retirement assets · set your target`, !rt.set ? ['c-mu', 'Not set'] : rt.ok ? ['c-grn', 'On track'] : ['c-red', 'Short ' + W0(rt.need - rt.monthly) + '/mo'], () => editRetire(l)]
    ];
    const kids = html`
      ${UpdateNote()}
      <div class="lc lh" data-t="planHero">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="lcap">Saving power</span>${SP.n ? html`<span class="lpill">${SP.n === 1 ? kl(SP.to).split(' ')[0].toUpperCase() + ' ONLY' : (MON[E.kM(SP.from) - 1] + ' – ' + MON[E.kM(SP.to) - 1]).toUpperCase() + ' AVERAGE'}</span>` : null}</div>
        <div class="lbig" data-t="planPower">${W0(SP.v)}<small> / month</small></div>
        <div class="lsub">${SP.n ? 'What you actually saved per month, from your P&L. Every goal is paid from this.' : 'Lens needs at least one closed month in Pocket to measure this.'}</div>
        <div class="lhr"></div>
        <div class="lg2"><div><span class="lcap">Emergency cover</span><div class=${'lv ' + (cover >= efM ? 'lup' : 'lgd')}>${cover.toFixed(1)} <small>of ${efM} months</small></div></div><div><span class="lcap">Goals on track</span><div class="lv">${onTrack} <small>of ${list.length}</small></div></div></div>
      </div>
      ${Sect('Foundations')}
      <div class="lc"><div class="lnote" style="margin-bottom:10px">Planners build these before any goal. Lens checks the first two from your data.</div>
        ${found.map(([ic, t, s, [c, st], on]) => html`<div class=${'lr' + (on ? ' tap' : '')} onClick=${on} style=${on ? 'cursor:pointer' : ''} data-t=${'fd-' + t}><div class="lib">${pIcon(ic, K.or, 18)}</div><div><div class="t">${t}</div><div class="s">${s}</div></div><span class=${'lchip ' + c}>${st}</span></div>`)}</div>
      ${Sect('Goals', '+ New goal', () => editGoal(l, null), 'goalNew')}
      <div class="lc">${list.length ? list.map(goalRow) : html`<div class="lempty">Add a goal to see when you'll reach it.</div>`}</div>
      ${list.length && SP.v > 0 ? html`${Sect('The plan')}
      <div class="lc"><div class="lnote" style="margin-bottom:12px">${W0(SP.v)} a month is shared in priority order. When a goal is done, its share moves down to the next one.</div>
        <div dangerouslySetInnerHTML=${{ __html: gantt(list, sim) }}></div>
        <div class="lnote" style="margin-top:6px;display:flex;gap:14px"><span><span style=${`display:inline-block;width:10px;height:8px;background:${K.or};border-radius:2px;margin-right:5px`}></span>Funding (darker = more)</span><span><span style=${`display:inline-block;width:10px;height:8px;background:${K.red};border-radius:2px;margin-right:5px`}></span>After target</span></div></div>` : null}
      ${fix ? html`${Sect('Fix the late goal')}
      <div class="lc" data-t="planFix"><div class="lnote" style="margin-bottom:6px">${list[lateI].n} finishes ${sim.done[lateI] === null ? 'too far away to show' : html`in <b>${kl(E.kAdd(E.curKey(), sim.done[lateI]))}</b>`}, after its ${kl(list[lateI].by)} target. Pick one:</div>
        <div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Save more</div><div class="s">Reaches it on time, nothing else moves</div></div><button class="lbtn o" onClick=${() => { l.extra = Math.min(2000, Math.ceil(fix.extra / 50) * 50); rerender(); }} data-t="fixMore">+${W0(fix.extra)} a month</button></div>
        ${fix.moveTo && list[lateI].kind === 'goal' ? html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Move the date</div><div class="s">Same monthly plan</div></div><button class="lbtn o" onClick=${() => lsave({ up: { LN_Goals: [{ ...list[lateI].g, GoBy: ymOf(fix.moveTo) }] } }, 'Goal date moved', list[lateI].n + ' to ' + kl(fix.moveTo))} data-t="fixMove">to ${kl(fix.moveTo)}</button></div>` : null}
        ${list[lateI].kind === 'goal' ? html`<div class="lr" style="grid-template-columns:1fr auto"><div><div class="t">Lower the target</div><div class="s">What the plan reaches on time</div></div><button class="lbtn o" onClick=${() => lsave({ up: { LN_Goals: [{ ...list[lateI].g, GoTarget: fix.lower }] } }, 'Goal target lowered', list[lateI].n + ' to ' + fix.lower)} data-t="fixLower">${W0(fix.lower)} by ${kl(list[lateI].by).split(' ')[0]}</button></div>` : null}
      </div>` : null}
      ${list.length && SP.v > 0 ? html`${Sect('What if')}
      <div class="lc"><div class="lfx"><div style="display:flex;justify-content:space-between"><span class="lcap">What if I save</span><b data-t="wiAmt">+${W0(l.extra || 0)} / month</b></div>
        <input type="range" min="0" max="2000" step="50" value=${l.extra || 0} onInput=${e => { l.extra = Number(e.target.value); rerender(); }} style=${`width:100%;margin-top:12px;accent-color:${K.or}`} data-t="wiRange" />
        <div class="lsub" style="margin-top:8px" data-t="wiResult">${!l.extra ? 'Slide to see how much sooner each goal finishes.' : list.map((g, i) => { const a = sim.done[i], b = simX.done[i]; if (a === -1) return null; const diff = a === null ? null : (b === null ? null : a - b); return html`<div>${g.n}: <b style=${`color:${K.text}`}>${b === null ? 'not reached' : kl(E.kAdd(E.curKey(), b))}</b>${diff ? html` <span class="lup">(${diff} month${diff === 1 ? '' : 's'} sooner)</span>` : ''}</div>`; })}</div></div>
        <div class="lnote" style="margin-top:10px">Assumes goal money grows ${E.assumptions().growth}% a year${E.assumptions().growth ? '' : ' (cautious)'}. Dividends are a bonus on top. Change this in Lens Settings.</div></div>` : null}`;
    return Page(l, 2, kids, 'lensPlan');
  }
};
