// Pieces used on many screens: headers, bottom bar, save bar, month picker, cash-flow card, date box + calendar.
import {
  html, K, G, DB, NAV, L, R, C, I, B, Box, Card, Gal, TI, Brand, fs, Navigate, Back, Notify, loadAll, rerender, dueCount, HAIR, SURFACE,
  fmtD, parseDMY, D, Year, Month, Day, addDays, addMonths, weekday, Today, setMonth, PSTART, RM, sRM, pct, round2, monthLabel, guard, fromBottom
} from './core.js';

/* Top of the five main tabs: brand, refresh and bell. */
/** Header inside a module: tap the name or the grid to go back to the MansWell main page */
export function TabHeader(name = 'Pocket') {
  const home = () => { NAV.stack = []; Navigate('scrDreamer'); };
  return html`
    ${Brand(18, 18, 276, 44, false, false, name, home)}
    ${I(258, 20, 36, 36, 'Grid', K.sub, { pad: 9, onClick: home, label: 'MansWell' })}
    ${I(298, 20, 36, 36, 'Reset', K.sub, { pad: 9, onClick: () => syncNow(), label: 'Refresh' })}
    ${I(338, 20, 36, 36, 'Bell', K.text, { pad: 7, onClick: () => Navigate('scrRecurring'), label: 'Recurring' })}
    ${dueCount() > 0 ? C(362, 24, 8, K.or) : null}`;
}
export function syncNow() {
  guard(async () => { await loadAll(); Notify('Up to date.', 'success'); });
}

const TABS = [['Home', 'Home', 'scrHome'], ['Money', 'Accounts', 'scrAccounts'], ['DetailList', 'Transactions', 'scrTransactions'], ['Trending', 'Analysis', 'scrAnalysis'], ['Settings', 'Settings', 'scrMore']];
/* Bottom navigation (active = index 0..4) */
export function NavBar(active) {
  return html`
    <div class="navbar-glass"></div>
    ${R(28 + active * 78, { b: 75 }, 22, 3, K.or, { r: 2, st: 'box-shadow:0 0 12px rgba(255,106,0,0.55);' })}
    ${TABS.map(([ic, lb, scr], i) => html`
      ${I(26 + i * 78, { b: 41 }, 26, 26, ic, i === active ? K.or : K.mute, { pad: 4, onClick: () => Navigate(scr), label: lb })}
      ${L(i * 78, { b: 25 }, 78, 14, lb, { s: 7.5, c: i === active ? K.or : K.mute, w: i === active ? 6 : 4, a: 'c', ls: 0.3, onClick: () => Navigate(scr) })}`)}`;
}

/* Detail screens: back arrow, centred title and a line. */
export function DetailHeader(title, right) {
  return html`
    ${I(6, 20, 36, 36, 'ChevronLeft', K.text, { pad: 6, onClick: () => Back(), label: 'Back' })}
    ${L(50, 16, 290, 44, title, { s: 12, w: 6, a: 'c' })}
    ${R(0, 65, 390, 1, K.sep)}
    ${right || null}`;
}

/* Bottom bar with one big orange button. */
export function SaveBar(text, onClick, id) {
  return html`
    ${R(0, { b: 0 }, 390, 78, K.bg)}
    ${R(0, { b: 77 }, 390, 1, K.sep)}
    ${B(12, { b: 22 }, 366, 46, text, { fill: K.or, c: '#FFFFFF', r: 23, s: 11, w: 6, onClick, id })}`;
}

/* Orange round + button */
export function Fab(onClick, y = 698) {
  return html`
    ${C(320, fromBottom(y, 52), 52, K.or, { onClick })}
    ${I(333, fromBottom(y + 13, 26), 26, 26, 'Add', '#FFFFFF', { pad: 3, onClick, label: 'Add' })}`;
}

/* Month switcher card (Home + Analysis) and its month picker. */
export function PeriodCard(l, after) {
  const go = n => {
    const idx = G.gblYear * 12 + (G.gblMonth - 1) + n;
    setMonth(Math.floor(idx / 12), idx % 12 + 1);
    l.locPick = false;
    if (after) after();
    rerender();
  };
  const toggle = () => { l.locPick = !l.locPick; l.locPickYear = G.gblYear; rerender(); };
  return html`${Card(null, 0, 366, 70, html`
      ${C(14, 17, 36, K.field, { b: HAIR, onClick: () => go(-1) })}
      ${I(14, 17, 36, 36, 'ChevronLeft', K.text, { pad: 10, onClick: () => go(-1), label: 'Previous month' })}
      ${L(60, 13, 246, 26, monthLabel('mmmm yyyy'), { s: 15, a: 'c', onClick: toggle, id: 'periodName' })}
      ${L(60, 39, 246, 16, fmtD(G.gblFrom, 'dd mmm') + '  –  ' + fmtD(G.gblTo, 'dd mmm yyyy'), { s: 8, a: 'c', c: l.locPick ? K.or : K.sub, onClick: toggle })}
      ${C(316, 17, 36, K.field, { b: HAIR, onClick: () => go(1) })}
      ${I(316, 17, 36, 36, 'ChevronRight', K.text, { pad: 10, onClick: () => go(1), label: 'Next month' })}`, { id: 'period' })}
    ${l.locPick ? MonthGrid(l.locPickYear ?? G.gblYear, y => { l.locPickYear = y; rerender(); },
      no => no === G.gblMonth && (l.locPickYear ?? G.gblYear) === G.gblYear,
      no => { setMonth(l.locPickYear ?? G.gblYear, no); l.locPick = false; if (after) after(); rerender(); }) : null}`;
}

/* 12-month grid with a year switcher (366 x 268 card). */
export function MonthGrid(year, setYear, isOn, pick, o = {}) {
  const items = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((Nm, i) => ({ No: i + 1, Nm }));
  const body = html`
    ${I(16, 10, 30, 30, 'ChevronLeft', K.sub, { pad: 5, onClick: () => setYear(year - 1), label: 'Previous year' })}
    ${L(50, 10, 266, 30, String(year), { s: 13, a: 'c' })}
    ${I(320, 10, 30, 30, 'ChevronRight', K.sub, { pad: 5, onClick: () => setYear(year + 1), label: 'Next year' })}
    ${Gal(16, 48, 334, 208, items, 52, it => {
      const on = isOn(it.No);
      return html`${B(3, 3, 105, 46, '', { fill: on ? K.or : K.field, b: on ? K.or : K.line, r: 12 })}
        ${L(3, 3, 105, 46, it.Nm, { s: 10, w: 6, a: 'c', c: on ? '#FFFFFF' : K.text })}`;
    }, { wrap: 3, onSelect: it => pick(it.No) })}`;
  if (o.x !== undefined) return Box(o.x, o.y, 366, 268, body, { fill: o.fill || 'transparent', r: 14 });
  return Card(null, 0, 366, 268, body);
}

/* Cash-flow card: in, out, net, bar and a one-line summary. */
export function FlowCard(inV, outV, label, o = {}) {
  const net = round2(inV - outV);
  // one quiet badge instead of bars: how much of the income was kept (or overspent)
  const badge = inV === 0 && outV === 0 ? ['NO ACTIVITY', K.mute, 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)']
    : inV === 0 ? ['NO INCOME YET', K.sub, 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)']
      : net >= 0 ? ['KEPT ' + pct(net / inV), K.grn, 'rgba(52,199,123,0.08)', 'rgba(52,199,123,0.28)']
        : ['SPENT ' + pct(outV / inV), K.red, 'rgba(229,72,77,0.08)', 'rgba(229,72,77,0.3)'];
  const empty = inV === 0 && outV === 0;
  const netC = o.netColor ? o.netColor(net) : empty ? K.sub : (net < 0 ? K.red : K.grn);
  const sp = o.split;
  const base = Math.max(inV, outV, 0.01);
  const cell3 = (x, dot, cap, v, sub, id) => html`
    ${C(x, 15, 5, dot)}
    ${L(x + 10, 10, 96, 13, cap, { s: 6, w: 6, c: K.mute, ls: 1.3 })}
    ${L(x, 25, 104, 20, RM(v), { s: 9.5, w: 6, id })}
    ${L(x, 45, 104, 13, sub, { s: 6.5, c: id === 'flowInc' && inV > 0 ? (net >= 0 ? K.grn : K.red) : K.mute, id: id + 'Sub' })}`;
  const share = v => inV > 0 ? pct(v / inV) + ' of income' : '—';
  const cell = (x, cap, v, id) => html`
    ${L(x, 11, 140, 13, cap, { s: 6.5, w: 6, c: K.mute, st: 'letter-spacing:1.4px' })}
    ${L(x, 26, 150, 20, RM(v), { s: 11, w: 6, id })}`;
  const body = html`
    ${L(16, 14, 200, 22, 'Cash flow', { s: 11.5, w: 6 })}
    ${label ? L(16, 34, 200, 14, label.toUpperCase(), { s: 7, w: 6, c: K.or }) : null}
    ${o.split ? null : B(350 - 92, 14, 92, 22, badge[0], { fill: badge[2], b: badge[3], c: badge[1], r: 11, s: 6.5, flat: true, id: 'flowBadge' })}
    ${L(16, label ? 56 : 50, 200, 13, 'NET', { s: 6.5, w: 6, c: K.mute, st: 'letter-spacing:1.6px' })}
    ${L(16, label ? 70 : 64, sp && o.side ? 184 : 334, 34, empty ? RM(0) : sRM(net), { s: 19, w: 6, c: netC, st: 'letter-spacing:-0.3px' })}
    ${sp ? html`
      ${(o.side || []).length ? html`
        ${R(206, 18, 1, 100, 'rgba(255,255,255,0.07)')}
        ${o.side.map((x, i) => html`
          ${L(214, 16 + i * 58, 136, 13, x.cap, { s: 6.5, w: 6, c: K.mute, a: 'r', ls: 1.3 })}
          ${L(190, 30 + i * 58, 160, 20, x.val, { s: x.big === false ? 8.5 : 10, w: 6, a: 'r', c: x.c || K.text, id: x.id })}`)}` : null}
      ${empty ? L(16, 98, 180, 14, 'No transactions in this month yet', { s: 7.5, c: K.mute, id: 'flowEmpty' }) : null}
      ${R(16, 132, 334, 3, 'rgba(255,255,255,0.06)', { r: 2 })}
      ${empty ? null : (() => {
        // the whole line is your income: green = savings, light green = still in the bank, red = expenses (right)
        const ex = Math.min(sp.Exp / base, 1), sv = Math.min(sp.Sav / base, 1 - ex), kp = inV > 0 ? Math.max(0, 1 - ex - sv) : 0;
        const LIGHT = '#A8EBC7';
        const raw = [[sv, K.grn], [kp, LIGHT], [ex, K.red]].filter(x => x[0] > 0.0005);
        const px = raw.map(([f]) => Math.max(334 * f, 6)); const k = 334 / px.reduce((t, v) => t + v, 0);
        let x0 = 16;
        const bar = raw.map(([f, col], i) => { const w = px[i] * k, el = R(x0 + (i ? 1.5 : 0), 132, Math.max(0, w - (i ? 1.5 : 0) - (i < raw.length - 1 ? 1.5 : 0)), 4, col, { r: 2 }); x0 += w; return el; });
        const leg = [['Savings', sv, K.grn], ['In bank', kp, LIGHT], ['Expenses', ex, K.red]];
        return html`${bar}${leg.map(([nm, f, col], i) => html`
          ${R(16 + i * 112, 145, 8, 8, col, { r: 2 })}
          ${L(29 + i * 112, 142, 98, 14, nm + '  ' + (inV > 0 ? pct(f) : '—'), { s: 6.5, c: K.sub, id: 'leg' + i })}`)}`;
      })()}
      ${Box(16, 166, 334, 66, html`
        ${cell3(14, K.grn, 'INCOME', inV, inV <= 0 ? '—' : net >= 0 ? 'kept ' + pct(net / inV) : 'over by ' + pct(-net / inV), 'flowInc')}
        ${R(117, 12, 1, 42, 'rgba(255,255,255,0.07)')}
        ${cell3(126, K.red, 'EXPENSES', sp.Exp, share(sp.Exp), 'flowExp')}
        ${R(228, 12, 1, 42, 'rgba(255,255,255,0.07)')}
        ${cell3(236, K.grn, 'SAVINGS', sp.Sav, share(sp.Sav), 'flowSav')}`, { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}` : html`
    ${Box(16, label ? 112 : 106, 334, 56, html`
      ${cell(16, 'MONEY IN', inV)}
      ${R(167, 12, 1, 32, 'rgba(255,255,255,0.07)')}
      ${cell(184, 'MONEY OUT', outV)}`, { fill: 'rgba(255,255,255,0.025)', r: 12, b: 'rgba(255,255,255,0.05)' })}`}`;
  return Card(o.x ?? null, o.y ?? 0, 366, sp ? 248 : label ? 184 : 178, body, { id: o.id });
}

/* ── Date box (dd/mm/yyyy text + calendar icon) and its calendar overlay ── */
export function DateBox(l, key, x, y, w, h, o = {}) {
  const v = l['locD_' + key];
  const draft = l['txt_' + key];
  const commit = t => {
    l['txt_' + key] = undefined;
    const tt = String(t || '').trim();
    if (!tt) { rerender(); return; }
    const d = parseDMY(tt);
    if (!d) Notify('Type the date as dd/mm/yyyy, e.g. 28/12/2025.', 'error');
    else l['locD_' + key] = d;
    rerender();
  };
  const open = () => { l['locCalOpen_' + key] = true; const b = v || Today(); l['locCalM_' + key] = D(Year(b), Month(b), 1); rerender(); };
  const iw = 28, icx = w - (o.icoRight ?? 6) - iw;
  return Box(x, y, w, h, html`
    ${TI(0, 0, icx - 2, h, draft ?? fmtD(v, 'dd/mm/yyyy'), t => { l['txt_' + key] = t; }, { hint: 'dd/mm/yyyy', s: o.s || 12, w: o.w, fill: o.fill || K.field, bt: 0, pad: o.pad ?? 12, onChange: commit, id: key })}
    ${I(icx, (h - iw) / 2, iw, iw, 'CalendarBlank', K.or, { pad: 4, onClick: open, label: 'Open calendar' })}`,
  { fill: o.fill || K.field, r: 8, b: o.border === false ? undefined : K.line });
}

export function Calendar(l, key, onPick) {
  if (!l['locCalOpen_' + key]) return null;
  const m = l['locCalM_' + key];
  const sel = l['locD_' + key];
  const gs = addDays(m, -((weekday(m) + 5) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gs, i));
  const close = () => { l['locCalOpen_' + key] = false; rerender(); };
  const choose = d => { l['locD_' + key] = d; l['txt_' + key] = undefined; l['locCalOpen_' + key] = false; if (onPick) onPick(d); rerender(); };
  const move = n => { l['locCalM_' + key] = addMonths(m, n); rerender(); };
  return html`<div class="abs" style="left:0;top:0;right:0;bottom:0;z-index:30">
    <div class="abs dim" style="inset:0" onClick=${close}></div>
    ${Box(45, 250, 300, 344, html`
      ${C(16, 14, 32, K.field, { b: HAIR, onClick: () => move(-1) })}
      ${I(16, 14, 32, 32, 'ChevronLeft', K.text, { pad: 8, onClick: () => move(-1), label: 'Previous month' })}
      ${L(56, 14, 188, 32, fmtD(m, 'mmmm yyyy'), { s: 14, a: 'c' })}
      ${C(252, 14, 32, K.field, { b: HAIR, onClick: () => move(1) })}
      ${I(252, 14, 32, 32, 'ChevronRight', K.text, { pad: 8, onClick: () => move(1), label: 'Next month' })}
      ${R(20, 54, 260, 1, 'rgba(255,106,0,0.35)')}
      ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => L(17 + i * 38, 60, 38, 18, d, { s: 7.5, w: 6, a: 'c', c: i >= 5 ? K.or : K.mute }))}
      ${Gal(17, 84, 266, 216, days, 36, d => {
        const isSel = d === sel, isToday = d === Today();
        return B(4, 3, 30, 30, String(Day(d)), { fill: isSel ? K.or : 'transparent', c: isSel ? '#FFFFFF' : Month(d) !== Month(m) ? K.mute : K.text, b: !isSel && isToday ? K.or : undefined, r: 15, s: 9.5, w: isSel ? 7 : 4, onClick: () => choose(d) });
      }, { wrap: 7 })}
      ${R(20, 302, 260, 1, K.sep)}
      ${B(12, 306, 100, 32, 'Today', { fill: 'transparent', c: K.or, r: 10, s: 9.5, onClick: () => choose(Today()) })}
      ${B(188, 306, 100, 32, 'Close', { fill: 'transparent', c: K.sub, r: 10, s: 9.5, w: 4, st: 'justify-content:flex-end;padding-right:12px;', onClick: close })}`,
    { fill: K.card, r: 18, b: K.orBorder })}
  </div>`;
}

/* Activity rows used by Settings + Transaction detail */
export function AuditRows(list, whenFmt, whenX = 230, whenW = 120) {
  return list.map(a => html`<div class="row" style="position:relative;height:44px;width:366px">
    ${L(16, 4, 200, 18, a.AuAction, { s: 10, w: 6 })}
    ${L(whenX, 4, whenW, 18, whenFmt(a.AuWhen), { s: 8, c: K.sub, a: 'r' })}
    ${L(16, 22, 334, 16, a.AuDetail, { s: 8, c: K.sub })}
    ${R(16, 43, 334, 1, K.sep)}
  </div>`);
}

/* Section title used on Home: serif title with an orange full stop and a fading hairline. */
export function SectionHead(title, id) {
  return html`<div class="box" data-t=${id} style="position:relative;flex:none;width:366px;height:44px;display:flex;align-items:flex-end;gap:14px;padding:0 2px 6px">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1;color:#F4F2EE;letter-spacing:.3px;white-space:nowrap">${title}<span style="color:#FF6A00">.</span></div>
    <div style="flex:1;height:1px;margin-bottom:5px;background:linear-gradient(90deg, rgba(255,106,0,0.55), rgba(255,255,255,0.08) 35%, rgba(255,255,255,0))"></div>
  </div>`;
}

/* Password guard for sensitive actions (stops mis-taps; it is not account security). */
export const GUARD_PASSWORD = 'aiman00.';
export function askPassword(l, label, run) { l.pwd = { label, run, val: '', err: '' }; rerender(); }
export function PasswordDialog(l) {
  const p = l.pwd;
  if (!p) return null;
  const close = () => { l.pwd = null; rerender(); };
  const ok = () => {
    if (p.val !== GUARD_PASSWORD) { p.err = 'Wrong password. Try again.'; p.val = ''; rerender(); return; }
    const run = p.run; l.pwd = null; rerender(); run();
  };
  return html`<div class="abs" style="inset:0;z-index:40">
    <div class="abs dim" style="inset:0" onClick=${close}></div>
    ${Card(33, 226, 324, 250, html`
      ${C(138, 20, 48, 'rgba(255,106,0,0.12)', { b: 'rgba(255,106,0,0.35)' })}
      ${I(150, 32, 24, 24, 'Lock', K.or, { pad: 1 })}
      ${L(16, 80, 292, 24, 'Enter password', { s: 13, w: 6, a: 'c' })}
      ${L(24, 104, 276, 18, 'Required to ' + p.label + '.', { s: 8.5, c: K.sub, a: 'c' })}
      <input class="inp" type="password" data-t="pwd" placeholder="Password" value=${p.val} autocomplete="off"
        style=${'left:20px;top:130px;width:284px;height:44px;border-radius:10px;padding:0 14px;background:#1E2228;color:#F4F2EE;font-size:16px;box-shadow:inset 0 0 0 1px ' + (p.err ? K.red : 'rgba(255,255,255,0.07)')}
        onInput=${e => { p.val = e.target.value; p.err = ''; }} onKeyDown=${e => { if (e.key === 'Enter') ok(); }} />
      ${p.err ? L(20, 178, 284, 14, p.err, { s: 7.5, c: K.red, a: 'c' }) : null}
      ${B(20, 200, 136, 36, 'Cancel', { fill: K.field, b: HAIR, s: 9.5, onClick: close, id: 'pwdCancel' })}
      ${B(168, 200, 136, 36, 'Unlock', { fill: K.or, c: '#FFFFFF', s: 9.5, onClick: ok, id: 'pwdOk' })}`, { b: 'rgba(255,106,0,0.35)' })}
  </div>`;
}
