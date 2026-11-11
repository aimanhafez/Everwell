// MansWell · Lens · page guides (P&L, Assets, Plan and Budget). Opened from the book icon in the Lens header.
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
    <div class="intro"><b>Savings</b> is what you own (ASB, KWSP, Gold). A <b>Tabung</b> is money set aside for a purpose (emergency fund, house, travel). Both run from the opening balance you confirmed for <b>${dmy(od)}</b> to today.</div>
    ${H(1, 'Top card')}
    <ul><li><b>Total:</b> savings + Tabung now, and the change since opening.</li>
      <li><b>Ready now, Within days, Retirement:</b> how quickly you can reach the money, across both.</li>
      <li><b>Savings</b> and <b>Tabung:</b> each part on its own. <b>Put in</b> is money that went in. <b>Growth</b> is dividends and price changes you record.</li></ul>
    ${H(2, 'Savings')}
    <p>Grouped by Ready now, Within days and Retirement, each with a subtotal.</p><span class="eq">Opening + In + Growth = Now</span>
    <ul><li><b>Balance Sweep:</b> your sweep account in Pocket.</li>
      <li><b>Linked to Pocket</b> (ASB, Gold…): what you put in minus what you took out in its Pocket category.</li>
      <li><b>KWSP:</b> the KWSP on your payslips (you + employer), plus any KWSP movement in Pocket.</li>
      <li><b>Value I update</b> (FD, shares…): your monthly estimate, if set. Estimates are marked <b>est</b>.</li></ul>
    ${H(3, 'Tabung')}
    <p>Grouped the same way, each with its own Pocket category.</p><span class="eq">Opening + In − Out = Balance</span>
    <p><b>Out</b> is money taken out of the Tabung in Pocket. Give a Tabung a target in Plan, and Plan tracks it.</p>
    ${H(4, 'Adding and syncing')}
    <ul><li>Each section has its own <b>+ Add</b>. Linked to Pocket creates the Pocket category for you. <b>Value I update</b> stays in Lens only.</li>
      <li>A Savings/Asset category you make in Pocket appears under <b>New in Pocket</b> once it has its first transaction. Add it once, as Savings or a Tabung.</li>
      <li>Renaming on either side renames the other. Tap an item to switch it between Savings and Tabung.</li>
      <li><b>Remove from Lens</b> keeps the Pocket category and its transactions.</li></ul>
    ${H(5, 'Growth chart')}
    <p>One line from the opening balance to today. Pick Total, Savings, Tabung or one item. <b>Tap or drag</b> to read any month.</p>
    ${H(6, 'Keep values fresh')}
    <ul><li><b>Set current value</b> from a statement. Lens works out the growth.</li>
      <li><b>Add dividend / bonus</b> for money added outside Pocket.</li>
      <li>A value you update turns <b style=${`color:${K.gold}`}>gold</b> after about 4 months without an update.</li></ul>
    ${H(7, 'Opening balances')}
    <p>Change them by tapping the item or in <b>Lens → Settings</b>. Both ask for your password.</p>
  </div>`;
}

function planGuide() {
  const a = E.assumptions(), ef = E.efMonths(), ess = E.essentialMonthly(), W = v => 'RM ' + Math.round(v).toLocaleString('en-US');
  return html`<div class="gd" data-t="guidePlan"><style>${GD_CSS}</style>
    <div class="intro">Plan tracks your <b>Tabung</b>. Every Tabung with a target is a goal, filled from what you really save each month.</div>
    ${H(1, 'Saving power')}
    <p>Your average <b>Total savings</b> from the P&L over your last 6 months. It's what you really saved. Your Tabung goals are filled from this amount, top goal first.</p>
    ${H(2, 'Tabung goals')}
    <ul><li>Tap a Tabung and set its <b>target</b> and <b>date</b>. A Tabung with no target is listed under <b>No target yet</b>.</li>
      <li>Turn on <b>Emergency fund</b> for one Tabung. Its target is ${ef} months of essential spending${ess > 0 ? html`, about <b>${W(ef * ess)}</b>` : ''}, and it always comes first.</li>
      <li>The rest follow in your order. Tap a goal and use <b>Higher</b> or <b>Lower</b>.</li>
      <li>Progress is the Tabung's balance. <b>Needs a month</b> = the gap ÷ the months left.</li>
      <li><b>On track</b> finishes by its date. <b>Late 3 mo</b> finishes 3 months after. <b>Not reached</b> means not within 30 years.</li></ul>
    ${H(3, 'Fix the late goal')}
    <ul><li><b>Save more:</b> the extra a month that makes it on time.</li>
      <li><b>Move the date:</b> the earliest date that works.</li>
      <li><b>Lower the target:</b> the most you can reach on time.</li></ul>
    ${H(4, 'What if')}
    <p>Slide to add up to RM 2,000 a month and see how much sooner each Tabung reaches its target. Nothing is saved.</p>
    ${H(5, 'Assumptions')}
    <p>Tabung money grows <b>${a.growth}% a year</b>${a.growth ? '' : ' (cautious)'}. Change it in <b>Lens → Settings → Plan assumptions</b>.</p>
  </div>`;
}

function budgetGuide() {
  const a = E.assumptions(), y = E.defaultYear();
  return html`<div class="gd" data-t="guideBudget"><style>${GD_CSS}</style>
    <div class="intro">Budget plans a whole year (January to December) from what you actually spent. From October, it opens on next year, so ${y} is ready before it starts.</div>
    ${H(1, 'Built from your history')}
    <p>Lens uses the closed months of the year before. If there are fewer than 3, it uses your last 12 months. The steps at the top show where you are: Review, Income, Save first, Categories, Lock.</p>
    ${H(2, 'Top card')}
    <ul><li><b>Planned income</b> a month.</li><li><b>Save first</b> comes off the top.</li><li><b>Spending budget</b> is all your categories together.</li>
      <li><b>Buffer</b> is what's left. If it's red, it shows <b>To find</b>: the budget is over by that much.</li></ul>
    <p>Until you tap <b>Start from these suggestions</b> or change a figure, nothing is saved.</p>
    ${H(3, 'Income plan')}
    <ul><li>Your main income is your average plus a ${a.infl + 1}% increment. It's only an estimate, so change it to your real figure.</li>
      <li>Other income is counted at <b>${a.sideShare}%</b> because it varies. Anything extra becomes a bonus that goes to savings.</li></ul>
    ${H(4, 'Pay yourself first')}
    <p>Choose 20%, 25%, 30% or 35% of income to save before spending. Lens shows what you really saved last time. 20% is the usual minimum.</p>
    ${H(5, 'Category budgets')}
    <p>Each category has a type, and Lens suggests a monthly figure from it:</p>
    <ul><li><b>Fixed</b> (loan, subscriptions, bills): your latest amount.</li>
      <li><b>Day-to-day</b> (food, transport): your typical month (the median) + ${a.infl}% inflation.</li>
      <li><b>Annual</b> (travel, gadgets, events): the yearly total ÷ 12.</li></ul>
    <p>Tap a tag to change the type. Type over any figure. <b>Use suggestions</b>, <b>+${a.infl}% inflation</b> and <b>Copy</b> fill all the categories at once. <b>AVG</b> is what you spent before.</p>
    ${H(6, 'Annual costs')}
    <p>Lumpy costs, like trips and gadgets. Set aside the monthly amount into a sinking fund so they never cause a deficit month.</p>
    ${H(7, 'Balance check')}
    <p>Needs (your essential categories), wants (the rest) and savings, against the 50/30/20 guide. It's only a reference. If you're over, it tells you how much to trim, or what savings rate would balance.</p>
    ${H(8, 'Lock')}
    <p><b>Lock</b> once the buffer isn't red. A locked budget can't be changed by accident; unlocking asks for your password. During the year, the P&L shows spending against this budget each month in <b>Month, explained</b>.</p>
    ${H(9, 'Settings')}
    <p>Inflation (${a.infl}%) and how much side income counts (${a.sideShare}%) are in <b>Lens → Settings → Plan assumptions</b>. Essential categories are in <b>Essential spending</b>.</p>
  </div>`;
}

export const GUIDES = { pnl: ['P&L guide', pnlGuide], assets: ['Savings guide', assetsGuide], plan: ['Plan guide', planGuide], budget: ['Budget guide', budgetGuide] };
export function openGuide(l, which) {
  const [title, body] = GUIDES[which];
  openSheet(l, { title, body, onSave: () => closeSheet(l), saveLabel: 'Got it' });
}
