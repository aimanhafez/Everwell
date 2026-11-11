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
    <div class="intro">What you own (<b>assets</b>) and money set aside for a purpose (<b>Tabung</b>), from the opening balance you confirmed for <b>${dmy(od)}</b> to today.</div>
    ${H(1, 'Top card')}
    <ul><li><b>Savings & assets:</b> everything you own now, and the change since opening. Your Tabung total is shown next to it.</li>
      <li><b>Ready now, Within days, Retirement:</b> how quickly you can reach the money. Plan counts Ready now toward your emergency fund and Retirement toward retirement.</li>
      <li><b>Put in</b> is money that went in through Pocket, payslips (KWSP) or an estimate. <b>Growth</b> is dividends and price changes you record.</li></ul>
    ${H(2, 'Asset')}
    <p>Grouped by Ready now, Within days and Retirement, each with its subtotal. Every row follows one rule:</p><span class="eq">Opening + In + Growth = Now</span>
    <ul><li><b>Balance Sweep:</b> your sweep account balance in Pocket.</li>
      <li><b>Through Pocket</b> (ASB, Gold…): what you put in minus what you took out in its Pocket category.</li>
      <li><b>KWSP:</b> the KWSP on your payslips (you + employer), plus any KWSP movement in Pocket. Months without a payslip use your monthly estimate, if set.</li>
      <li><b>Value I update</b> (FD, shares…): your monthly estimate, if set. Estimated amounts are marked <b>est</b>.</li></ul>
    ${H(3, 'Tabung')}
    <p>Money set aside for a purpose, like a house or a wedding. Each Tabung has its own Pocket category.</p><span class="eq">Opening + In − Used = Now</span>
    <p><b>Used</b> is money taken out of the Tabung in Pocket to spend. A Tabung can fund one goal in Plan.</p>
    ${H(4, 'Adding and syncing')}
    <ul><li><b>+ Add</b> in Lens: choose Asset or Tabung. <b>Through Pocket</b> creates the Pocket category for you. <b>Value I update</b> stays in Lens only.</li>
      <li>Make a Savings/Asset category in Pocket, and once it has its first transaction it appears here under <b>New in Pocket</b>. Add it once, as an Asset or a Tabung.</li>
      <li>Renaming on either side renames the other. Tap an item to switch it between Asset and Tabung.</li>
      <li><b>Remove from Lens</b> keeps the Pocket category and its transactions.</li></ul>
    ${H(5, 'Growth chart')}
    <p>One line from the opening balance to today, a point at each month-end. Pick Total, one asset or Tabung. <b>Tap or drag</b> to read any month.</p>
    ${H(6, 'Keep values fresh')}
    <ul><li><b>Set current value</b> from a statement or today's price. Lens works out the growth.</li>
      <li><b>Add dividend / bonus</b> for money added outside Pocket, like an ASB dividend.</li>
      <li>A value you update turns <b style=${`color:${K.gold}`}>gold</b> after about 4 months without an update.</li></ul>
    ${H(7, 'Opening balances')}
    <p>Change them by tapping the item or in <b>Lens → Settings</b>. Both ask for your password.</p>
  </div>`;
}

function planGuide() {
  const a = E.assumptions(), ef = E.efMonths(), ess = E.essentialMonthly(), W = v => 'RM ' + Math.round(v).toLocaleString('en-US');
  return html`<div class="gd" data-t="guidePlan"><style>${GD_CSS}</style>
    <div class="intro">Plan works the way a financial planner does: measure what you really save, build the foundations, then fund your goals in order of priority.</div>
    ${H(1, 'Saving power')}
    <p>Your average <b>Total savings</b> from the P&L over your last 6 finished months. It's what you really saved, not what you hoped to. Every goal is paid from this amount.</p>
    <ul><li><b>Emergency cover:</b> your Ready-now money ÷ one month of essential spending.</li>
      <li><b>Goals on track:</b> how many goals finish by their date.</li></ul>
    ${H(2, 'Foundations')}
    <p>Planners build these before any goal.</p>
    <ul><li><b>Emergency fund:</b> ${ef} months of essentials${ess > 0 ? html`, about <b>${W(ef * ess)}</b> (${W(ess)} a month)` : ''}, kept in assets set to <b>Ready now</b>. Tap it to choose 3, 6 or 12 months and a date to build it by. Pick the essential categories in Lens → Settings.</li>
      <li><b>No card debt carried:</b> checked from your credit cards in Pocket. <b>Due soon</b> means last month's statement isn't paid yet but isn't late. <b>Carried</b> means it went past the due date.</li>
      <li><b>Protection:</b> tap it once your medical card and life cover are in place.</li>
      <li><b>Retirement:</b> your <b>Retirement</b> assets (like KWSP) and what goes in each month, from your payslips for KWSP. Tap it and enter your age, retirement age and target. Lens projects the total at retirement and shows <b>On track</b>, or how much more a month you'd need.</li></ul>
    ${H(3, 'Goals')}
    <p><b>+ New goal</b>: a name, a target and a date, then <b>Funded by</b>: one item from your Assets page, usually a Tabung. The goal's progress is that item's balance, and each item funds only one goal.</p>
    <ul><li>The <b>emergency fund is always first</b>. Your goals follow in the order you set; tap a goal and use Higher or Lower to change it.</li>
      <li>Each goal shows what you have, the target, and what it <b>needs a month</b>: the gap ÷ the months left.</li>
      <li><b>On track</b> finishes by its date. <b>Late 3 mo</b> finishes 3 months after it. <b>Not reached</b> means it doesn't finish within 30 years at this pace.</li></ul>
    ${H(4, 'Fix the late goal')}
    <p>For the first goal that's late, Lens works out three exact fixes. Pick one:</p>
    <ul><li><b>Save more:</b> the extra a month that makes it on time. Tap it to see the effect in What if.</li>
      <li><b>Move the date:</b> the earliest date that works with your current saving.</li>
      <li><b>Lower the target:</b> the most you can reach by the original date.</li></ul>
    ${H(5, 'What if')}
    <p>Slide to add up to RM 2,000 a month and see how much sooner each goal finishes. Nothing is saved.</p>
    ${H(6, 'Assumptions')}
    <p>Goal money grows <b>${a.growth}% a year</b>${a.growth ? '' : ' (cautious: dividends are a bonus)'}. Retirement uses the same rate. Change it in <b>Lens → Settings → Plan assumptions</b>.</p>
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

export const GUIDES = { pnl: ['P&L guide', pnlGuide], assets: ['Assets guide', assetsGuide], plan: ['Plan guide', planGuide], budget: ['Budget guide', budgetGuide] };
export function openGuide(l, which) {
  const [title, body] = GUIDES[which];
  openSheet(l, { title, body, onSave: () => closeSheet(l), saveLabel: 'Got it' });
}
