// scrHome — net worth, alerts, accounts, monthly overview, spending, recent activity, insights.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Gal, Svg, Flow, heroBg, Navigate, rerender,
  bal, psum, catSpend, acc, byTxDesc, dueCount, lowBal, stStart, fmtD, Today, PLABEL, Year, Month, diffDays, minD,
  RM, sRM, n0, pct, PALETTE, esc, monthLabel, resetTxPeriodToMonth, round2
} from '../core.js';
import { TabHeader, NavBar, Fab, PeriodCard, FlowCard, SectionHead } from '../shared.js';
import { addDays as addD, addMonths as addM, PSTART as PST, Day as DayOf, D as mkD, perKey } from '../core.js';

export function netWorth() {
  const open = DB.accounts.filter(a => a.AccStatus !== 'Closed');
  const assets = round2(open.filter(a => a.AccClass === 'Asset').reduce((s, a) => s + bal(a.AccId), 0));
  const liab = round2(open.filter(a => a.AccClass === 'Liability').reduce((s, a) => s + bal(a.AccId), 0));
  return { assets, liab, nw: round2(assets + liab) };
}

/** One transaction row (Home recent list + Transactions list), 54 px high. */
export function txnRow(t) {
  const isT = t.TxType === 'Transfer';
  const ini = isT ? '⇄' : t.TxType === 'Opening Balance' ? '+' : (t.TxCat || '').slice(0, 1).toUpperCase();
  const iniC = t.TxType === 'Income' ? K.grn : isT ? K.sub : t.TxType === 'Opening Balance' ? K.mute : K.or;
  let sub;
  if (isT) {
    const o = DB.txns.find(x => x.TxTrf === t.TxTrf && x.TxDir === 'Out');
    const i = DB.txns.find(x => x.TxTrf === t.TxTrf && x.TxDir === 'In');
    sub = ((o && acc(o.TxAcc)) || {}).AccName + '  →  ' + ((i && acc(i.TxAcc)) || {}).AccName;
  } else sub = t.TxCat + '  ·  ' + ((acc(t.TxAcc) || {}).AccName || '');
  return html`
    ${C(14, 11, 32, K.field)}
    ${L(14, 11, 32, 32, ini, { s: 10, w: 7, a: 'c', c: iniC })}
    ${L(56, 9, 194, 18, t.TxPayee || t.TxDesc || t.TxType, { s: 10, w: 6 })}
    ${L(56, 28, 194, 16, sub, { s: 8, c: K.sub })}
    ${L(242, 9, 110, 18, (t.TxDir === 'In' ? '+' : '−') + RM(t.TxAmt), { s: 10, w: 6, a: 'r', c: isT ? K.sub : t.TxDir === 'In' ? K.grn : K.text })}
    ${L(242, 28, 110, 16, (t.TxIsSplit ? 'Split · ' : '') + fmtD(t.TxDate, 'dd mmm'), { s: 8, c: K.sub, a: 'r' })}
    ${R(56, 53, 296, 1, K.sep)}`;
}
export function openTxn(t) { G.gblTxnId = t.TxnId; Navigate('scrTxnDetail'); }

export function monthsSpan(start, cd) {
  if (!start) return null;
  const a = PLABEL(start, cd), b = PLABEL(Today(), cd);
  return (Year(b) - Year(a)) * 12 + Month(b) - Month(a) + 1;
}

export function donutSvg(top, label = 'SPENT') {
  const tot = top.reduce((s, x) => s + x.Amt, 0);
  const c = 2 * Math.PI * 54;
  let o = 0, arcs = '';
  top.forEach((r, i) => {
    arcs += `<circle cx='80' cy='80' r='54' fill='none' stroke='${PALETTE[i]}' stroke-width='22' stroke-dasharray='${(r.Amt / tot * c).toFixed(2)} ${c.toFixed(2)}' stroke-dashoffset='${(-o / tot * c).toFixed(2)}' transform='rotate(-90 80 80)'/>`;
    o += r.Amt;
  });
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='54' fill='none' stroke='#2A2E35' stroke-width='22'/>${arcs}<text x='80' y='74' text-anchor='middle' font-family='Segoe UI,Arial' font-size='10' letter-spacing='2' fill='#A0A6AE'>${label}</text><text x='80' y='95' text-anchor='middle' font-family='Segoe UI,Arial' font-size='17' font-weight='700' fill='#FFFFFF'>RM ${esc(n0(tot))}</text></svg>`;
}

export const scrHome = {
  onVisible(l) { l.locPick = false; l.locPickYear = G.gblYear; },
  view(l) {
    const hasAcc = DB.accounts.length > 0;
    const { assets, liab, nw } = netWorth();
    const grown = round2(nw - DB.accounts.reduce((s, a) => s + (a.AccClass === 'Liability' ? -a.AccOB : a.AccOB), 0));
    const span = monthsSpan(stStart(), G.gblCycleDay);
    const spanTxt = span === null ? 'NOT SET' : span >= 12 ? Math.floor(span / 12) + ' YR' + (span % 12 > 0 ? '  ' + (span % 12) + ' MO' : '') : span + (span === 1 ? ' MONTH' : ' MONTHS');
    const dueN = dueCount();
    const lowN = DB.accounts.filter(a => a.AccStatus === 'Active' && a.AccClass === 'Asset' && bal(a.AccId) < lowBal()).length;
    const alerts = [[dueN + ' bill(s) due', dueN], [lowN + ' account(s) below RM ' + n0(lowBal()), lowN]].filter(x => x[1] > 0).map(x => x[0]).join('   ·   ');
    const openAcc = DB.accounts.filter(a => a.AccStatus !== 'Closed').map(a => ({ ...a, Bal: bal(a.AccId) })).sort((a, b) => b.Bal - a.Bal).slice(0, 7);

    const inc = psum('Income'), out = round2(psum('Expense') - psum('Refund'));
    const spend = catSpend();
    const top5 = spend.slice(0, 5);
    const spendTot = spend.reduce((s, x) => s + x.Amt, 0);
    const recent = DB.txns.filter(t => !t.TxParent && !(t.TxType === 'Transfer' && t.TxDir === 'In') && t.TxType !== 'Opening Balance' && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo).sort(byTxDesc).slice(0, 10);

    // insights
    const exps = DB.txns.filter(t => !t.TxIsSplit && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo && t.TxType === 'Expense').sort((a, b) => b.TxAmt - a.TxAmt);
    const big = exps[0];
    const topCat = spend[0];
    const daysSoFar = G.gblFrom > Today() ? 0 : Math.max(diffDays(G.gblFrom, minD(G.gblTo, Today())) + 1, 1);
    let noSpend = 0;
    if (G.gblFrom <= Today()) {
      const spentDays = new Set(exps.map(t => t.TxDate));
      for (let i = 0; i < daysSoFar; i++) { const [y, m, d] = G.gblFrom.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10); if (!spentDays.has(dt)) noSpend++; }
    }
    const used = DB.accounts.filter(a => a.AccStatus !== 'Closed').map(a => ({ ...a, Cnt: DB.txns.filter(t => t.TxAcc === a.AccId && !t.TxIsSplit && t.TxDate >= G.gblFrom && t.TxDate <= G.gblTo && t.TxType !== 'Opening Balance').length })).sort((a, b) => b.Cnt - a.Cnt)[0];
    const tile = (x, y, ic, icC, cap, val, sub, id) => Card(x, y, 178, 92, html`
      ${C(12, 12, 28, K.field)}${I(17, 17, 18, 18, ic, icC, { pad: 1 })}
      ${L(48, 19, 122, 14, cap, { s: 7.5, w: 6, c: K.sub })}
      ${L(12, 46, 154, 20, val, { s: 11, w: 6 })}
      ${L(12, 66, 154, 16, sub, { s: 8, c: K.sub })}`, { id });

    const kids = html`
      ${!hasAcc ? Card(null, 0, 366, 146, html`
        ${L(18, 14, 330, 28, 'Welcome to Everwell.', { s: 15 })}
        ${L(18, 44, 330, 34, stStart() ? 'Tracking from ' + fmtD(stStart(), 'dd mmm yyyy') + '. Add your first account with its balance on that date.' : 'Add your first account to get started.', { s: 8.5, c: K.sub, wrap: true })}
        ${B(18, 86, 330, 42, '＋   Add your first account', { fill: K.or, c: '#FFFFFF', r: 21, s: 10, onClick: () => { G.gblEditMode = 'new'; Navigate('scrAccountEdit'); }, id: 'addFirst' })}`, { b: K.or }) : null}
      ${hasAcc ? Box(null, 0, 366, 172, html`
        ${Svg(0, 0, 366, 172, heroBg(172), { stretch: true })}
        ${L(18, 18, 150, 14, 'NET WORTH', { s: 7.5, w: 6, c: K.sub })}
        ${B(244, 14, 104, 22, spanTxt, { fill: K.orSoft, b: K.orBorder, c: K.or, r: 11, s: 7.5 })}
        ${L(18, 36, 330, 36, sRM(nw), { s: 21, w: 6, id: 'nw' })}
        ${L(18, 72, 330, 16, fmtD(stStart(), 'dd mmm yyyy') + '   —   ' + fmtD(Today(), 'dd mmm yyyy'), { s: 8, c: K.sub })}
        ${L(18, 90, 330, 16, (grown >= 0 ? '▲  ' : '▼  ') + RM(Math.abs(grown)) + (grown >= 0 ? '  grown' : '  down') + ' since you started', { s: 8, w: 6, c: grown >= 0 ? K.grn : K.red })}
        ${R(18, 116, 330, 1, 'rgba(255,255,255,0.07)')}
        ${L(18, 126, 150, 14, 'ASSETS', { s: 7.5, w: 6, c: K.sub })}
        ${L(18, 140, 160, 20, RM(assets), { s: 11, w: 6 })}
        ${L(189, 126, 150, 14, 'LIABILITIES', { s: 7.5, w: 6, c: K.sub })}
        ${L(189, 140, 160, 20, RM(-liab), { s: 11, w: 6, c: K.red })}`, { r: 16, id: 'hero' }) : null}
      ${(dueN + lowN) > 0 ? Card(null, 0, 366, 50, html`
        ${C(16, 21, 8, K.gold)}
        ${L(34, 0, 316, 50, alerts, { s: 8.5, onClick: () => Navigate('scrRecurring') })}
        ${I(332, 13, 24, 24, 'ChevronRight', K.sub, { pad: 2, onClick: () => Navigate('scrRecurring') })}`) : null}
      ${hasAcc ? Card(null, 0, 366, 64 + openAcc.length * 44 + 6, html`
        ${L(16, 14, 246, 22, 'Accounts', { s: 11.5, w: 6 })}
        ${L(250, 14, 100, 22, 'See all  ›', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => Navigate('scrAccounts') })}
        ${L(16, 36, 200, 14, 'CURRENT BALANCE', { s: 7.5, w: 6, c: K.mute })}
        ${Gal(0, 58, 366, openAcc.length * 44, openAcc, 44, a => html`
          ${C(16, 9, 26, a.AccColor)}${L(16, 9, 26, 26, a.AccShort, { s: 7, w: 7, a: 'c', c: '#FFFFFF' })}
          ${L(54, 0, 162, 44, a.AccName, { s: 10 })}
          ${L(220, 0, 130, 44, sRM(a.Bal), { s: 10, w: 6, a: 'r', c: a.Bal < 0 ? K.red : K.text })}
          ${R(54, 43, 296, 1, K.sep)}`, { onSelect: a => { G.gblAccId = a.AccId; Navigate('scrAccountDetail'); }, key: a => a.AccId })}`, { id: 'homeAccounts' }) : null}
      ${hasAcc ? Upcoming() : null}
      ${hasAcc ? SectionHead('Monthly overview', 'overviewHead') : null}
      ${PeriodCard(l)}
      ${FlowCard(inc, out, '', { id: 'homeFlow' })}
      ${hasAcc ? Forecast(inc, out) : null}
      ${Card(null, 0, 366, 206, html`
        ${L(16, 14, 246, 22, 'Spending', { s: 11.5, w: 6 })}
        ${L(250, 14, 100, 22, 'Analysis  ›', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => Navigate('scrAnalysis') })}
        ${Svg(10, 46, 150, 150, donutSvg(top5))}
        ${Gal(172, 54, 180, 140, top5.map((c, i) => ({ Idx: i + 1, Nm: c.CatName, Amt: c.Amt })), 28, it => html`
          ${C(0, 10, 8, PALETTE[Math.max(1, Math.min(6, it.Idx)) - 1])}
          ${L(16, 0, 100, 28, it.Nm, { s: 8.5 })}
          ${L(126, 0, 54, 28, pct(it.Amt / Math.max(spendTot, 1)), { s: 8.5, w: 6, c: K.sub, a: 'r' })}`)}
        ${!spend.length ? L(172, 100, 180, 30, 'No spending in this month', { s: 8.5, c: K.mute }) : null}`)}
      ${Card(null, 0, 366, 52 + Math.max(recent.length, 1) * 54 + 4, html`
        ${L(16, 14, 246, 22, 'Recent activity', { s: 11.5, w: 6 })}
        ${L(250, 14, 100, 22, 'See all  ›', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => { resetTxPeriodToMonth(); Navigate('scrTransactions'); } })}
        ${Gal(0, 48, 366, recent.length * 54, recent, 54, txnRow, { onSelect: openTxn, key: t => t.TxnId })}
        ${!recent.length ? L(16, 50, 334, 50, 'No activity in this month yet.', { s: 8.5, c: K.mute }) : null}`, { id: 'recent' })}
      ${Box(null, 0, 366, 224, html`
        ${L(4, 0, 200, 22, 'Insights', { s: 11.5, w: 6 })}
        ${tile(0, 28, 'ShoppingCart', K.or, 'BIGGEST SPEND', big ? RM(big.TxAmt) : '—', big ? (big.TxPayee || big.TxDesc || '') : '', 'insBig')}
        ${tile(188, 28, 'Tag', K.gold, 'TOP CATEGORY', topCat ? topCat.CatName : '—', topCat ? RM(topCat.Amt) : '', 'insCat')}
        ${tile(0, 128, 'CalendarBlank', K.grn, 'NO-SPEND DAYS', noSpend + (noSpend === 1 ? ' day' : ' days'), 'of ' + Math.max(G.gblFrom > Today() ? 0 : daysSoFar, 0) + ' days so far', 'insNoSpend')}
        ${tile(188, 128, 'Money', K.or, 'MOST USED', !used || used.Cnt === 0 ? '—' : used.AccName, (used ? used.Cnt : 0) + ' transactions', 'insUsed')}`)}
      ${Box(null, 0, 366, 60, null)}`;

    return html`<div>
      ${TabHeader()}
      ${Flow(0, 66, 390, 700, kids)}
      ${Fab(() => { G.gblEditMode = 'new'; G.gblTxnId = ''; Navigate('scrTxnEdit'); })}
      ${NavBar(0)}
    </div>`;
  }
};

/* ── Month-end forecast: pace of spending in the selected month, projected to its last day ── */
function Forecast(inc, out) {
  const from = G.gblFrom, to = G.gblTo, today = Today();
  const days = diffDays(from, to) + 1;
  const past = today > to, future = today < from;
  const elapsed = past ? days : future ? 0 : diffDays(from, today) + 1;
  const daily = elapsed ? out / elapsed : 0;
  const projected = past ? out : round2(daily * days);
  const pFrom = addM(from, -1), pTo = addD(from, -1);
  const last = round2(psum('Expense', pFrom, pTo) - psum('Refund', pFrom, pTo));
  const delta = last > 0 ? (projected - last) / last : null;
  const projNet = round2(inc - projected);
  const share = days ? elapsed / days : 0;
  const head = past ? 'Month result' : 'Month-end forecast';
  const big = future ? '—' : RM(projected);
  const cap = past ? 'TOTAL SPENT' : 'PROJECTED SPENDING BY ' + fmtD(to, 'dd mmm').toUpperCase();
  const dTxt = delta === null ? 'No spending last month' : (delta > 0 ? '▲ ' : '▼ ') + pct(Math.abs(delta)) + (delta > 0 ? ' more' : ' less') + ' than last month';
  return Card(null, 0, 366, 178, html`
    ${C(16, 16, 30, K.field)}${I(22, 22, 18, 18, 'Gauge', K.or, { pad: 1 })}
    ${L(56, 14, 200, 18, head, { s: 11.5, w: 6 })}
    ${L(56, 32, 200, 14, future ? 'This month has not started yet' : elapsed + ' of ' + days + ' days', { s: 7.5, c: K.sub })}
    ${L(16, 60, 220, 14, cap, { s: 7, w: 6, c: K.sub })}
    ${L(16, 76, 220, 30, big, { s: 18, w: 6, id: 'forecast' })}
    ${L(16, 106, 220, 16, future ? '' : dTxt, { s: 8, w: 6, c: delta === null ? K.mute : delta > 0 ? K.red : K.grn })}
    ${R(250, 62, 1, 58, 'rgba(255,255,255,0.07)')}
    ${L(264, 60, 90, 14, 'DAILY AVG', { s: 7, w: 6, c: K.sub })}
    ${L(264, 74, 90, 18, future ? '—' : RM(daily), { s: 9.5, w: 6 })}
    ${L(264, 96, 90, 14, past ? 'NET' : 'PROJ. NET', { s: 7, w: 6, c: K.sub })}
    ${L(264, 110, 90, 18, future ? '—' : sRM(projNet), { s: 9.5, w: 6, c: projNet < 0 ? K.red : K.grn })}
    ${R(16, 142, 334, 4, K.field, { r: 2 })}
    ${R(16, 142, Math.max(4, 334 * share), 4, 'linear-gradient(90deg, rgba(255,106,0,0.5), #FF6A00)', { r: 2 })}
    ${L(16, 152, 167, 14, fmtD(from, 'dd mmm'), { s: 7.5, c: K.mute })}
    ${L(183, 152, 167, 14, fmtD(to, 'dd mmm'), { s: 7.5, c: K.mute, a: 'r' })}`, { id: 'forecastCard' });
}

/* ── Next 14 days: bills from Recurring + credit card due dates, and what is safe to spend ── */
function Upcoming() {
  const today = Today(), until = addD(today, 14);
  const items = [];
  DB.recurring.filter(r => r.RcActive && r.RcNext <= until).forEach(r => items.push({ nm: r.RcName, d: r.RcNext, amt: r.RcAmt, inc: r.RcType === 'Income', tag: r.RcNext < today ? 'OVERDUE' : '' }));
  DB.accounts.filter(a => a.AccStatus !== 'Closed' && a.AccClass === 'Liability' && a.AccDueDay > 0).forEach(a => {
    const owed = -bal(a.AccId);
    if (owed <= 0.004) return;
    const [y, m] = today.split('-').map(Number);
    let due = mkD(y, m, a.AccDueDay);
    if (due < today) due = mkD(y, m + 1, a.AccDueDay);
    if (due <= until) items.push({ nm: a.AccName + ' payment', d: due, amt: owed, inc: false, tag: 'CARD' });
  });
  items.sort((a, b) => (a.d < b.d ? -1 : 1));
  const shown = items.slice(0, 4);
  const committed = round2(items.filter(i => !i.inc).reduce((s, i) => s + i.amt, 0));
  const cash = round2(DB.accounts.filter(a => a.AccStatus !== 'Closed' && a.AccClass === 'Asset').reduce((s, a) => s + bal(a.AccId), 0));
  const safe = round2(cash - committed);
  const listH = shown.length ? shown.length * 46 : 40;
  return Card(null, 0, 366, 58 + listH + 70, html`
    ${C(16, 16, 30, K.field)}${I(22, 22, 18, 18, 'Clock', K.or, { pad: 1 })}
    ${L(56, 14, 200, 18, 'Next 14 days', { s: 11.5, w: 6 })}
    ${L(56, 32, 200, 14, 'Bills and card payments coming up', { s: 7.5, c: K.sub })}
    ${L(250, 14, 100, 22, 'Manage  ›', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => Navigate('scrRecurring') })}
    ${shown.length ? Gal(0, 56, 366, listH, shown, 46, it => html`
      ${Box(16, 8, 40, 30, html`
        ${L(0, 0, 40, 16, fmtD(it.d, 'dd'), { s: 11, w: 6, a: 'c', c: it.tag === 'OVERDUE' ? K.red : K.text })}
        ${L(0, 16, 40, 12, fmtD(it.d, 'mmm').toUpperCase(), { s: 6.5, w: 7, a: 'c', c: K.or })}`)}
      ${L(66, 6, 180, 18, it.nm, { s: 10, w: 6 })}
      ${L(66, 24, 180, 14, it.tag === 'OVERDUE' ? 'Overdue' : it.tag === 'CARD' ? 'Card due date' : 'Recurring', { s: 7.5, c: it.tag === 'OVERDUE' ? K.red : K.sub })}
      ${L(226, 0, 124, 46, (it.inc ? '+' : '−') + RM(it.amt), { s: 10, w: 6, a: 'r', c: it.inc ? K.grn : K.text })}
      ${R(66, 45, 284, 1, K.sep)}`) : L(16, 56, 334, 40, 'Nothing due in the next 14 days.', { s: 8.5, c: K.mute })}
    ${Box(12, 58 + listH + 8, 342, 52, html`
      ${L(14, 8, 150, 14, 'COMMITTED', { s: 7, w: 6, c: K.sub })}
      ${L(14, 22, 150, 22, RM(committed), { s: 11, w: 6, id: 'committed' })}
      ${R(171, 10, 1, 32, 'rgba(255,255,255,0.07)')}
      ${L(186, 8, 142, 14, 'SAFE TO SPEND', { s: 7, w: 6, c: K.sub, a: 'r' })}
      ${L(186, 22, 142, 22, sRM(safe), { s: 11, w: 6, a: 'r', c: safe < 0 ? K.red : K.grn, id: 'safe' })}`, { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}`, { id: 'upcoming' });
}
