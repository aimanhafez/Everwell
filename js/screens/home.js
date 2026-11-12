// scrHome — net worth, alerts, accounts, monthly overview, spending, recent activity, insights.
import {
  html, K, G, DB, L, R, C, I, B, Box, Card, Gal, Svg, Flow, heroBg, Navigate, rerender,
  bal, psum, flowSum, flowSplit, catSpend, acc, byTxDesc, dueCount, lowBal, stStart, fmtD, Today, PLABEL, Year, Month, diffDays, minD,
  RM, sRM, n0, pct, PALETTE, esc, monthLabel, resetTxPeriodToMonth, round2, fs, ta } from '../core.js';
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
  const iniC = t.TxType === 'Income' || t.TxType === 'Refund' ? K.grn : isT ? K.sub : t.TxType === 'Opening Balance' ? K.mute : K.or;
  let sub;
  if (isT) {
    const o = DB.txns.find(x => x.TxTrf === t.TxTrf && x.TxDir === 'Out');
    const i = DB.txns.find(x => x.TxTrf === t.TxTrf && x.TxDir === 'In');
    sub = ((o && acc(o.TxAcc)) || {}).AccName + '  →  ' + ((i && acc(i.TxAcc)) || {}).AccName;
  } else sub = (t.TxType === 'Refund' || (t.TxType === 'Income' && t.TxRef) ? 'Payback · ' : '') + t.TxCat + '  ·  ' + ((acc(t.TxAcc) || {}).AccName || '');
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
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><circle cx='80' cy='80' r='54' fill='none' stroke='${K.line2}' stroke-width='22'/>${arcs}<text x='80' y='74' text-anchor='middle' font-family='Segoe UI,Arial' font-size='10' letter-spacing='2' fill='${K.sub}'>${label}</text><text x='80' y='95' text-anchor='middle' font-family='Segoe UI,Arial' font-size='17' font-weight='700' fill='${K.onAcc}'>RM ${esc(n0(tot))}</text></svg>`;
}

/** Thin ring with small gaps between segments (Home). Text is drawn in HTML on top, in the app font. */
export function ringSvg(parts, total) {
  const R0 = 60, c = 2 * Math.PI * R0, gap = parts.length > 1 ? 3 : 0;
  let o = 0, arcs = '';
  parts.forEach(p => {
    const len = Math.max(p.Amt / total * c - gap, 0.5);
    arcs += `<circle cx='80' cy='80' r='${R0}' fill='none' stroke='${p.Col}' stroke-width='15' stroke-linecap='butt' stroke-dasharray='${len.toFixed(2)} ${c.toFixed(2)}' stroke-dashoffset='${(-o / total * c).toFixed(2)}' transform='rotate(-90 80 80)'/>`;
    o += p.Amt;
  });
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><defs><filter id='glow' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='2.2' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><circle cx='80' cy='80' r='${R0}' fill='none' stroke='${ta(0.05)}' stroke-width='15'/><g filter='url(#glow)'>${arcs}</g></svg>`;
}
/** Warm orange → red palette for the spending ring (biggest first) */
const SPEND_PAL = ['#FF7A00', '#FF2A1F', '#FFB800', '#FF5A4E', '#FFDA3A'];
/** Top 5 categories; their shares are of the whole month, so the ring shows the rest as empty track */
function spendParts(spend) {
  const tot = spend.reduce((s, x) => s + x.Amt, 0);
  const top = spend.slice(0, 5).map((c, i) => ({ Nm: c.CatName, Amt: c.Amt, Col: SPEND_PAL[i] }));
  return { tot: round2(tot), parts: top, rest: round2(tot - top.reduce((s, x) => s + x.Amt, 0)), more: Math.max(0, spend.length - 5) };
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

    const { In: inc, Out: out } = flowSum();
    const spend = catSpend();
    const SP = spendParts(spend);
    const SPL = flowSplit();
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
        ${L(18, 14, 330, 28, 'Welcome to Pocket.', { s: 15 })}
        ${L(18, 44, 330, 34, stStart() ? 'Tracking from ' + fmtD(stStart(), 'dd mmm yyyy') + '. Add your first account with its balance on that date.' : 'Add your first account to get started.', { s: 8.5, c: K.sub, wrap: true })}
        ${B(18, 86, 330, 42, '＋   Add your first account', { fill: K.or, c: K.onAcc, r: 21, s: 10, onClick: () => { G.gblEditMode = 'new'; Navigate('scrAccountEdit'); }, id: 'addFirst' })}`, { b: K.or }) : null}
      ${hasAcc ? Box(null, 0, 366, 172, html`
        ${Svg(0, 0, 366, 172, heroBg(172), { stretch: true })}
        ${L(18, 18, 150, 14, 'NET WORTH', { s: 7.5, w: 6, c: K.sub })}
        ${B(244, 14, 104, 22, spanTxt, { fill: K.orSoft, b: K.orBorder, c: K.or, r: 11, s: 7.5 })}
        ${L(18, 36, 330, 36, sRM(nw), { s: 21, w: 6, id: 'nw' })}
        ${L(18, 72, 330, 16, fmtD(stStart(), 'dd mmm yyyy') + '   —   ' + fmtD(Today(), 'dd mmm yyyy'), { s: 8, c: K.sub })}
        ${L(18, 90, 330, 16, (grown >= 0 ? '▲  ' : '▼  ') + RM(Math.abs(grown)) + (grown >= 0 ? '  grown' : '  down') + ' since you started', { s: 8, w: 6, c: grown >= 0 ? K.grn : K.red })}
        ${R(18, 116, 330, 1, ta(0.07))}
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
          ${C(16, 9, 26, a.AccColor)}${L(16, 9, 26, 26, a.AccShort, { s: 7, w: 7, a: 'c', c: K.onAcc })}
          ${L(54, 0, 162, 44, a.AccName, { s: 10 })}
          ${L(220, 0, 130, 44, sRM(a.Bal), { s: 10, w: 6, a: 'r', c: a.Bal < 0 ? K.red : K.text })}
          ${R(54, 43, 296, 1, K.sep)}`, { onSelect: a => { G.gblAccId = a.AccId; Navigate('scrAccountDetail'); }, key: a => a.AccId })}`, { id: 'homeAccounts' }) : null}
      ${hasAcc ? Upcoming() : null}
      ${hasAcc ? SectionHead('Monthly overview', 'overviewHead') : null}
      ${PeriodCard(l)}
      ${FlowCard(inc, out, '', { id: 'homeFlow', split: SPL, side: flowSide(SPL) })}
      ${Card(null, 0, 366, 218, html`
        ${L(16, 14, 246, 22, 'Spending', { s: 11.5, w: 6 })}
        ${L(250, 14, 100, 22, 'Analysis  ›', { s: 8.5, w: 6, c: K.or, a: 'r', onClick: () => Navigate('scrAnalysis') })}
        ${Svg(12, 50, 150, 150, ringSvg(SP.parts.length ? SP.parts : [{ Amt: 1, Col: ta(0.05) }], SP.tot || 1))}
        ${L(12, 106, 150, 12, 'TOTAL SPENT', { s: 5, w: 6, c: K.mute, a: 'c', ls: 1.4 })}
        <div class="abs" style="left:12px;top:117px;width:150px;height:22px;display:flex;align-items:center;justify-content:center;white-space:nowrap;color:${K.text}" data-t="spendTotal">
          <span><span style=${`font-size:${fs(6)};font-weight:600;color:${K.sub};margin-right:2px;vertical-align:4px`}>RM</span><span style=${`font-size:${fs(11.5)};font-weight:600;letter-spacing:-0.3px`}>${n0(Math.round(SP.tot))}</span></span>
        </div>
        ${Gal(178, 50, 172, 160, SP.parts, 32, it => html`
          ${R(0, 6, 3, 20, it.Col, { r: 2 })}
          ${L(12, 2, 104, 15, it.Nm, { s: 8.5, w: 6 })}
          ${L(12, 17, 104, 12, pct(it.Amt / Math.max(SP.tot, 1)) + ' of spending', { s: 6.5, c: K.mute })}
          ${L(112, 2, 60, 15, 'RM ' + n0(Math.round(it.Amt)), { s: 8.5, w: 6, a: 'r' })}
          ${it === SP.parts[SP.parts.length - 1] ? null : R(12, 31, 160, 1, ta(0.04))}`, { id: 'spendList' })}
        ${!spend.length ? L(178, 110, 172, 30, 'No spending in this month', { s: 8.5, c: K.mute }) : null}`, { id: 'spendCard' })}
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

/* ── Beside NET on the cash flow card: change vs last month and average daily spending ── */
function flowSide(sp) {
  const from = G.gblFrom;
  const net = round2(sp.In - sp.Out);
  const cmp = (f, t, cap, id) => {
    const o = flowSplit(f, t);
    const had = o.In > 0 || o.Out > 0;
    const d = round2(net - (o.In - o.Out));
    if (!had) return { cap, val: 'No records yet', c: K.mute, big: false, id };
    if (sp.In === 0 && sp.Out === 0) return { cap, val: 'Was ' + sRM(round2(o.In - o.Out)), c: K.sub, big: false, id }; // nothing to compare yet
    return { cap, val: (d >= 0 ? '▲ ' : '▼ ') + RM(Math.abs(d)), c: d >= 0 ? K.grn : K.red, id };
  };
  return [
    cmp(addM(from, -1), addD(from, -1), 'VS LAST MONTH', 'flowVs'),
    cmp(addM(from, -12), addD(addM(from, -11), -1), 'VS ' + monthLabel('mmm').toUpperCase() + ' ' + (G.gblYear - 1), 'flowVsYear')
  ];
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
      ${R(171, 10, 1, 32, ta(0.07))}
      ${L(186, 8, 142, 14, 'SAFE TO SPEND', { s: 7, w: 6, c: K.sub, a: 'r' })}
      ${L(186, 22, 142, 22, sRM(safe), { s: 11, w: 6, a: 'r', c: safe < 0 ? K.red : K.grn, id: 'safe' })}`, { fill: ta(0.025), r: 12, b: ta(0.05) })}`, { id: 'upcoming' });
}
