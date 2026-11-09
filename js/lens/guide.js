// MansWell · Lens · page guides (P&L and Assets). Opened from the book icon in the Lens header.
// Figures in the text (thresholds, dates, sinking funds) are read live, so the guide always matches your settings.
import { html } from '../vendor/preact-htm.js';
import { K, fmtD, addDays } from '../core.js';
import * as E from './engine.js';
import { openSheet, closeSheet } from './ui.js';

const GD_CSS = `.gd{padding-bottom:6px}.gd .intro{font-size:13.5px;line-height:1.5;color:${K.sub};margin:2px 0 4px}
.gd h3{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${K.or};margin:18px 0 6px}
.gd h3 i{font-style:normal;display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:rgba(255,106,0,.12);font-size:10px;letter-spacing:0}
.gd p{font-size:13.5px;line-height:1.5;margin:0 0 6px;color:${K.text}}
.gd ul{margin:0 0 6px;padding:0;list-style:none}.gd li{position:relative;font-size:13.5px;line-height:1.5;padding:7px 0 7px 14px;border-top:1px solid ${K.sep}}
.gd li:before{content:'';position:absolute;left:0;top:15px;width:5px;height:5px;border-radius:2px;background:${K.or}}
.gd li b,.gd p b{font-weight:600}.gd .eq{display:block;margin:4px 0 8px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.03);box-shadow:inset 0 0 0 1px ${K.line};font-size:13px;font-weight:600}`;
const dm = d => fmtD(d, 'dd mmm'), dmy = d => fmtD(d, 'dd mmm yyyy');
const H = (n, t) => html`<h3><i>${n}</i>${t}</h3>`;

function pnlGuide() {
  const c = E.curKey(), from = addDays(E.kEnd(E.kAdd(c, -1)), 1), to = E.kEnd(c), th = E.thresholds(), sink = E.sinking();
  return html`<div class="gd" data-t="guidePnl"><style>${GD_CSS}</style>
    <div class="intro">Lens reads this page from Pocket. Nothing is typed here, so it always agrees with your bank book. To fix a number, fix the transaction in Pocket.</div>
    ${H(1, 'Months')}
    <p>Each month is your Pocket financial month. This one runs <b>${dm(from)} – ${dm(to)}</b>. A month is <b>closed</b> once it ends. The current month shows as <b>Running</b> and isn't counted in YTD until it closes.</p>
    ${H(2, 'Saved this year')}
    <ul><li><b>Saved:</b> total savings of the closed months, and the share of income that is.</li>
      <li><b>Income</b> and <b>Expenses:</b> the year so far.</li>
      <li><b>Into savings:</b> what went into your savings categories${sink.length ? html`, not counting sinking funds (${sink.join(', ')})` : ''}.</li>
      <li><b>Leftover · swept:</b> what stayed in your account at month-end, for Balance Sweep.</li></ul>
    ${H(3, 'Monthly status')}
    <p>Each tile is that month's savings rate:</p>
    <ul><li><b style=${`color:${K.grn}`}>Strong</b> ${th.strong}% and above</li><li><b style=${`color:${K.grn};opacity:.8`}>Healthy</b> ${th.healthy}% to ${th.strong}%</li><li><b style=${`color:${K.gold}`}>Watch</b> 0% to ${th.healthy}%</li><li><b style=${`color:${K.red}`}>Deficit</b> below 0%: you spent more than you earned</li></ul>
    <p>Tap a tile to explain that month further down.</p>
    ${H(4, 'Statement, top to bottom')}
    <ul>
      <li><b>Income.</b> With <b>Gross view</b> on, your salary starts from <b>Gross pay</b> on your payslips. Your own KWSP, PCB tax, zakat, PERKESO + SIP and other deductions come off, which leaves <b>Net salary</b>, the Salary credits in Pocket. Other income, such as interest, comes after. With Gross view off, income is shown as it reached the bank. The switch appears once you have payslips.</li>
      <li><b>Savings & assets.</b> Money moved into savings categories in Pocket.${sink.length ? html` Sinking funds (${sink.join(', ')}) are shown, but they don't count as savings because that money will be spent.` : ''}</li>
      <li><b>Expenses.</b> Spending by category. An <b>orange cell</b> means that category was more than double its usual month (and over RM 150).</li>
      <li><b>Leftover · swept.</b><span class="eq">Total income − Savings & assets − Expenses</span></li>
      <li><b>Total savings.</b><span class="eq">Savings categories${sink.length ? ' (not sinking funds)' : ''} + Leftover</span></li>
      <li><b>Savings rate.</b><span class="eq">Total savings ÷ Total income</span></li>
      <li><b>YTD</b> adds the closed months only. <b>Avg</b> is YTD ÷ closed months.</li>
    </ul>
    ${H(5, 'Month, explained')}
    <p>For the tile you picked: its savings rate and amount saved against your average, the categories that moved most compared with earlier months (<b>helped</b> or <b>hurt</b>), and spending against your budget once you've set one in Budget.</p>
    ${H(6, 'Handy')}
    <ul><li><b>Full year</b> opens the whole statement. Turning your phone sideways opens it too.</li>
      <li><b>Export</b> saves the statement to Excel, with the gross view if it's on.</li>
      <li>Sinking funds and the status levels are in <b>Lens → Settings</b>.</li></ul>
  </div>`;
}

function assetsGuide() {
  const od = E.openDate();
  return html`<div class="gd" data-t="guideAssets"><style>${GD_CSS}</style>
    <div class="intro">Where your savings and assets stand, from the opening balance you confirmed for <b>${dmy(od)}</b> (the day before Pocket starts) to today.</div>
    ${H(1, 'Top card')}
    <ul><li><b>Savings & assets:</b> everything together now, and the change since opening.</li>
      <li><b>Put in:</b> money that went in, through Pocket, your payslips (KWSP) or a monthly estimate.</li>
      <li><b>Growth:</b> dividends and price changes you record.</li></ul>
    ${H(2, 'Roll-forward')}
    <p>Every row follows one rule:</p><span class="eq">Opening + In + Growth = Now</span>
    <p>Brackets mean money came out. Where <b>In</b> comes from depends on the asset:</p>
    <ul><li><b>Balance Sweep:</b> your sweep account balance in Pocket.</li>
      <li><b>Pocket category</b> (ASB, Gold, Travel Funds…): what you put in minus what you took out, as recorded in Pocket.</li>
      <li><b>KWSP:</b> the KWSP on your payslips (you + employer), plus any KWSP movement in Pocket such as a withdrawal. Months without a payslip use your monthly estimate, if you set one.</li>
      <li><b>Values you update</b> (FD, stocks…): your monthly estimate, if you set one. Estimated amounts are marked <b>est</b>.</li></ul>
    <p>Tap a row to rename it, set its Access or monthly estimate, change its opening, see its history or remove it. <b>+ Add</b> adds another asset.</p>
    ${H(3, 'Growth chart')}
    <p>One line from the opening balance to today, with a point at each month-end. Pick <b>Total</b> or one asset above the chart. <b>Tap or drag</b> on the chart to read any month.</p>
    <ul><li><b>Added / month:</b> the average change per month since opening.</li><li><b>Best month:</b> the biggest rise in one month.</li></ul>
    ${H(4, 'Access')}
    <ul><li><b>Ready now:</b> cash you can use today. Plan counts it toward your emergency fund.</li>
      <li><b>Within days:</b> a few days to withdraw or sell.</li>
      <li><b>Retirement:</b> mostly locked. Plan uses it for your retirement.</li></ul>
    <p>Set it by tapping the asset.</p>
    ${H(5, 'Keep values fresh')}
    <ul><li><b>Set current value</b> from a statement or today's price. Lens works out the growth.</li>
      <li><b>Add dividend / bonus</b> for money added outside Pocket, like a dividend credited into the account.</li>
      <li>A value you update turns <b style=${`color:${K.gold}`}>gold</b> after about 4 months without an update.</li></ul>
    ${H(6, 'Opening balances')}
    <p>Change them in <b>Lens → Settings</b> or by tapping the asset. Both ask for your password, because every figure after the opening changes with it.</p>
  </div>`;
}

export const GUIDES = { pnl: ['P&L guide', pnlGuide], assets: ['Assets guide', assetsGuide] };
export function openGuide(l, which) {
  const [title, body] = GUIDES[which];
  openSheet(l, { title, body, onSave: () => closeSheet(l), saveLabel: 'Got it' });
}
