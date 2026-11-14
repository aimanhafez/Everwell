# MansWell · v3.5.1 (Pocket + Payslip + Lens + Atlas + Voyage)

## 3.5.1 · fix: elevation missing on some days
Long days sent Google's elevation service a route that was too long, and the heights came back empty without a message. Code.gs now sends a shorter version of the route (120 points spread along it), tries point by point if that fails, and tells you if heights still can't be read. Days without heights show a note.
To update: upload Step 1, replace Code.gs, Deploy › New version, then tap **Make track again** on the days without elevation.

## 3.5.0 · Voyage (Logbook renamed)
- **Itinerary**: type a place and pick it from Google Maps; the city, country and pin fill in by themselves. Travel time is worked out from your times (arrived − left the last place); no km or time to type. Km always come from the GPX track (no road/typed choice). Today · On the road · Highest sit above the start. Legs show just transport and km; a leg that can't be right (too fast, too far) shows "⚠ check pins". Every stop pinned → Make GPX track runs straight away. Google's daily limit shows a clear message.
- **Discovery** (was Results): five journey badges (Roads, Scenery, Riding comfort, Food & hospitality, Value for money; a word each, no scores, no overall), what you found (best cafe, stay, meal, street food, viewpoint, road or pass, hidden gem, photo spot, must buy, kindest people, tip for next time, skip next time), verdict, would you go back, GPX file.
- Moved out for Atlas later: route map, elevation meter, the numbers.
- New tab LB_Finds (made by itself), new column RsBadges in LB_Results.

### Updating to 3.5.0
1. Upload everything inside "Step 1" to GitHub (same names overwrite).
2. Apps Script: replace all of Code.gs, save, then Deploy › Manage deployments › edit › New version › Deploy. Nothing new to approve if you already ran setupLogbook (otherwise run setupVoyage once).


## 3.4.0 · Logbook (fourth room)
Every Atlas journey in full. Journeys are made in Atlas only; every Logbook row carries the journey ID (TrId). Logbook never reads or writes Pocket or Lens.
- **Itinerary**: day by day (days come from the Atlas dates). Each stop: place, city, country, arrived, stayed, transport, km, travel time, note.
- **Make GPX track**: Google Maps (in your Apps Script) finds each stop (you check the pins once), follows the roads per leg by transport, and reads the heights. Gives road km (next to your typed km, you choose which counts), climb, descent, highest and steepest, the day on a map and an elevation profile.
- **Expenses**: six categories. Cash in the country's currency at the journey rate (set once, or "Get today's rate" from Google Finance). Card in the RM your bank charged; type the bill amount too to see the card cost %. Budget vs actual per category (from a total split by the usual mix, or from your Wanderlist tier).
- **Results**: five ratings (Roads, Scenery, Riding comfort, Food & hospitality, Value for money), verdict, "Would you go back?", the numbers, an elevation meter against Everest, a route map (full map with zoom and colour per day), and the .gpx file (download or save to Drive › MansWell Passport › journey name).
- New tabs (made by themselves): LB_Stops, LB_Tracks, LB_Expenses, LB_Budget, LB_Rates, LB_Results, and a small helper tab LB_FX for today's rate.
- Map data: Natural Earth (public domain), in js/logbook/geo, loaded only when a map is first opened.

### Updating to 3.4.0
1. Upload everything inside "Step 1" to GitHub (53 files, keep the folders). Same names overwrite the old ones. The flags are unchanged.
2. Apps Script: replace all of Code.gs with the new one and save.
3. In the editor choose **setupLogbook** and press **Run**. Approve when Google asks (it needs Google Maps and external access). The log says "Logbook is ready".
4. Deploy › Manage deployments › edit › **New version** › Deploy (same URL).
5. Open the app and pull to refresh.


## 3.3.0 · Atlas (Passport renamed)
- Three pages: **Odyssey · Journeys · Wanderlist**. Overview, World and Memories are folded into Odyssey.
- **Odyssey**: the card follows your theme. Search a country → the map flies to it and fills it in full; mark it Visited or add it to your Wanderlist from the card. Facts (most returned, longest journey, newest stamp), Journeys, Wanderlist (only places you're going), **Borderless** stamps with flags, and Milestones: First Light · Wayfarer · Nomad Soul · Cartographer · Seven Horizons · Atlas Bearer.
- **Journeys**: slim Days / With / Countries strip; places per country in numbered boxes; **Memories** shows 9 photos (See all for the rest); Moments as headline cards.
- **Wanderlist**: two steps, Dreaming → **Going** (year + planned days). Each place has a **Tier** (S1–S3, A1–D4) set by budget then length. Sort by My order, Priority, Tier or Continent.
- Also: every page now opens at the top.

### Updating to 3.3.0
1. GitHub: upload Step 1 (the app files). Flags are unchanged.
2. Apps Script: paste the new Code.gs, Save, then **Deploy › Manage deployments › Edit › New version**. New columns (PlTier, PlGo, PlGoYear, PlGoDays, StRoute) are added to your Sheet by themselves. Until you do this, Atlas shows a reminder and can't save tiers, "going" or route places.
3. Your journeys, photos and wishes carry over. Older wishes start in Dreaming with no tier; an older journey's route shows under its first country.

# MansWell · v3.2.0 (Pocket + Payslip + Lens + Passport)

## 3.2.0 · Passport (travel)
A third room on the main page. Travel only: it never reads or changes Pocket or Lens.
- **Overview**: countries visited, % of the world's 195, continents, trips, days away, wishlist; your map; latest trips, recently visited, next dreams, newly wished, your flag collection, milestones.
- **World**: an interactive map (pinch, drag, + / −, tap a country) and all 195 countries plus 7 places people count (Taiwan, Hong Kong, Macau, Kosovo, Greenland, Puerto Rico, Antarctica). Search, filter by status and continent, list or grid. Each country: flag, ISO codes, capital, continent, currency, status, your trips there.
- **Journeys**: trips with one or many countries (days per country optional), dates (length worked out for you), who with, route, story, moments, notes, photos. Filter by year, country, who with. Delete needs the password.
- **Wishlist**: priority, year, why, places to see, notes, inspiration photo; ▲ ▼ to order; "I went" opens a trip with the country filled in.
- **Memories**: every photo, a passport stamp per country (first-visit order) and milestones.
- **One status rule**: Visited = a trip includes it (or you marked "visited before"). Wishlist = wished and not visited. A country is never both. Home country (Malaysia by default, change it in Passport settings) shows on the map but isn't counted.
- **Photos**: resized on the phone, saved privately to Google Drive › *MansWell Passport* › one folder per trip. A small preview of each is kept in `PP_Thumbs`. Adding photos needs the internet.

### Updating to 3.2.0
1. GitHub: upload everything in this zip. New: the `js/passport/` folder and the `flags/` folder.
2. Apps Script: replace Code.gs with this one, Save, then **Deploy › Manage deployments › Edit › Version: New version › Deploy** (the URL stays the same).
3. Open MansWell. New tabs `PP_Settings, PP_Places, PP_Trips, PP_Stops, PP_Photos, PP_Thumbs` are added to your Sheet by themselves. Nothing else in the Sheet changes.

Flags: flag-icons (MIT). Countries: world-countries (ODbL). Map: Natural Earth via world-atlas (public domain).

## 3.1.7 · fix
- Lens P&L now updates straight away when you change a transaction's category, date or type, or rename a category (it used to keep the old name until the app was reopened).
- Only the GitHub files changed. The Apps Script stays at 3.1.6, no need to redeploy it.


*Live well today. Build well for tomorrow.*

MansWell is the new name for Dreamer (and, before that, Pocket Dreamer and Everwell). It now has two rooms:

- **Pocket** is where money is recorded: accounts, transactions, Balance Sweep, import and backup, plus **Payslip** (new in 3.1).
- **Lens** is where money is understood. It has five pages: P&L, Assets, Plan, Budget and Settings.

## Updating to 3.1.3

Upload everything to GitHub. There's no Apps Script change and no data change. **Plan** and **Budget** now have a guide too: tap the book icon at the top of the page.

## Updating to 3.1.6

This version needs **both** steps.

1. **Google Sheet:**
   - Open Apps Script, replace everything in `Code.gs` with `apps-script/Code.gs`, and save.
   - Go to **Deploy → Manage deployments → ✏️ → New version → Deploy**.
   - Google asks for permission to use **Drive** and **triggers** (for the weekly backup). Approve it.
   - A new column, `StYears`, appears in `EW_Settings`. Nothing else changes.
2. **GitHub:** upload everything in this folder, including the new `js/theme.js` and `js/screens/yearclose.js`, and commit.

What's new:

- **Close the year:** once December is swept, Pocket → Accounts → Balance Sweep shows **Close 2026**.
  1. A quick check: categories, payslips, cards and values.
  2. **Allocate** all of the Balance Sweep into Savings or Tabung (never a bank account). The P&L doesn't change.
  3. **Pick the day 2027's months start**, from the 24th to the 2nd. 2026 stays as it is (it ends on 27 Dec), and January 2027 stretches or shrinks once to meet the new day.
  4. **Lock** with your password. 2026 can no longer change in the app, its months can't be reopened, and the Apps Script refuses changes too. Only editing the Google Sheet by hand can change it. A copy of the Sheet is saved to Drive.
- **Weekly backup:** turn it on in Pocket → Settings → Backup. Every Sunday at about 3 am, a full copy of your Google Sheet goes to Drive › **MansWell Backups**. The newest 12 are kept, and year-end copies are kept forever.
- **Themes for the whole app:** on the MansWell main page, tap the gear → Settings → Appearance. Choose Ember Noir, Ivory Ledger, Midnight Sapphire, Rosé or Graphite. The main page, Pocket and Lens all change. The same panel leads to Pocket settings and Lens settings.

## Updating to 3.1.5

- **GitHub only:** upload everything and commit. No Apps Script change.
- **Fixed:** the Savings and Tabung tables cut off the Total ("62,1…"). The Now and Balance column is wider now.
- **Removed:** the amount on the Ready now, Within days and Retirement rows inside the tables. The top card still shows those totals.

## 3.1.4

- **GitHub only:** upload everything from this folder and click **Commit changes**. No Apps Script change.
- **Your data stays.** A Tabung you made in 3.1.3 moves to Within days; tap it to pick its group.

What changed:

- **Savings page** (was Assets):
  - **Total = savings + Tabung**, split into Ready now, Within days and Retirement.
  - **Savings** table: Savings · Opening · In · Growth · Now.
  - **Tabung** table: Tabung · Opening · In · Out · Balance.
  - Both are grouped the same way, and each has its own **+ Add** (no type to pick). Every name stays on one line.
  - "through Pocket & payslips" and "dividends & price" are gone.
- **Plan** tracks your Tabung only:
  - Every Tabung with a target is a goal. Tap one to set its target and date.
  - Turn on **Emergency fund** for one Tabung; its target is months × essential spending, and it always comes first.
  - Foundations are removed. Goals from before that aren't on a Tabung show under **Goals to link**.

## Earlier: 3.2 / 3.1.3 (Tabung first version)

- **GitHub only:** upload everything from this folder and click **Commit changes**.
- **No Apps Script change.**
- **Your data stays as it is.** Everything you already have starts as an Asset.

What changed:

- **Assets page:**
  - The **Asset** roll-forward is grouped into Ready now, Within days and Retirement, each with a subtotal. The top card shows the three totals.
  - New **Tabung** roll-forward for money set aside for a purpose: Opening + In − Used = Now.
  - The Access section and the opening-date badge are gone.
- **Lens and Pocket stay in sync:**
  - **+ Add** in Lens: choose Asset or Tabung. **Through Pocket** creates the Pocket Savings/Asset category for you. **Value I update** stays in Lens only.
  - A Savings/Asset category made in Pocket shows under **New in Pocket** once it has a transaction. Add it once, as an Asset or a Tabung, or choose "Don't track this in Lens".
  - Renaming on either side renames the other. Tap an item to switch it between Asset and Tabung.
  - **Remove from Lens** keeps the Pocket category and its transactions.
- **Plan:**
  - Each goal is **Funded by** one item from the Assets page (Tabung first). Its progress is that item's balance, and an item funds one goal only.
  - The Plan timeline section is removed.
- **Fixed:** + Add showed an empty "Choose…" list.

## Updating to 3.1.2

- **GitHub only:** upload everything from this folder (including the new `js/lens/guide.js`) and click **Commit changes**.
- **No Apps Script change:** keep the 3.1 `Code.gs` you already deployed.
- **No data changes:** nothing in your Sheet changes.

What changed:

- **KWSP follows your payslips** even when it's linked to a Pocket category. KWSP's "+ In" = KWSP on your payslips (you + employer) + any KWSP movement in Pocket, such as a withdrawal. Tap KWSP to see the split.
- **P&L, Gross view:** one **Income** group. Gross pay, then your own KWSP, PCB tax, zakat, PERKESO + SIP and other deductions, then **Net salary** (your Salary credits in Pocket), then other income such as interest, then Total income. The "Incl. KWSP" row is gone. The savings rate is Total savings ÷ Total income. Export follows the same layout.
- **Assets:**
  - The roll-forward headers fit.
  - The sub-lines under each name and the note under the table are gone.
  - **Growth** is now a line from your opening balance to today, with a point at each month-end. Pick Total or one asset, and tap or drag to read any month.
- **Guides:** the book icon at the top of P&L and Assets opens a guide to that page.
- **Fixed:** a value of nothing showed as "-0". It now shows 0.

## Updating to 3.1.1 (from 3.1)

3.1.1 lets a month hold **more than one payslip**: two employers, or your old and new company in the month you change jobs.

- **GitHub only:** upload everything from this folder and click **Commit changes**.
- **No Apps Script change:** keep the 3.1 `Code.gs` you already deployed.
- **Your saved payslips stay as they are.**

What changed:

- **Payslip → + Add a payslip from another employer.** Each payslip has its employer's name and links to its own Salary credit. A credit already linked to one payslip isn't offered to another.
- **Month view:** the top card adds every payslip in the month together. Tap a company to see its own gross to net, its bank match and what that employer paid.
- **Copy:** when last month had two or more payslips, you pick which to copy.
- **Lens:** KWSP, the P&L gross view and retirement planning include every employer's amounts.
- **Fixed:** the password box opened behind the panel when you removed a payslip, removed a Lens asset or changed an opening balance. It now opens on top.

## Updating to 3.1

3.1 adds **Payslip** to Pocket (tab 4). If you're coming from 2.0.1, follow all three steps below. If you already run 3.0 or later, steps 1 and 2 are enough.

Do all three parts.

1. **Google Sheet:** open Apps Script and replace everything in `Code.gs` with the new `apps-script/Code.gs`, then **Save**. Then go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The web address stays the same. The next time the app opens, six new tabs appear in your Sheet: `EW_Payslips`, `LN_Settings`, `LN_Assets`, `LN_Values`, `LN_Goals` and `LN_Budget`. No existing tab is changed.
2. **GitHub:** **Add file → Upload files**, then drag in everything from this folder, **including the `js` folder (with the new `js/lens` folder, `js/screens/payslip.js` and `js/payslip-data.js`), `icons` and `apps-script`**. Click **Commit changes**.
   - You can delete the old `fonts` and `icons/apps` folders from GitHub. They're no longer used.
3. **iPhone:** to get the new **MansWell** name and logo on your Home Screen:
   1. Open your GitHub link in Safari.
   2. Tap **Share → Add to Home Screen**.
   3. Remove the old Dreamer icon.
   It asks for your web address and key once. Your data is all in the Sheet, so nothing is lost.

If you skip step 1, Pocket and the Lens P&L still work, but Payslip and Lens can't save their own data. They show a note asking for the update.

## What's new in 3.1 · Payslip

Your bank book only sees net pay. **Pocket → Payslip** (tab 4) records the whole payslip.

- **Gross to net:**
  - **Earnings:** basic salary, allowances, overtime and any you add.
  - **Deductions:** KWSP (EPF), PCB tax, zakat, PERKESO (SOCSO), SIP (EIS) and any you add, such as a loan, koperasi or insurance.
  - **Net pay:** what reaches your bank.
- **Matched to your bank book:**
  - Net pay is linked to the Salary credit already in Pocket. Pocket picks it by amount when it can.
  - If the payslip and the bank book disagree, it shows by how much.
  - Payslips never add or change transactions, so nothing is counted twice.
- **Paid by your employer:** KWSP, PERKESO and SIP from your employer, how much goes into KWSP each month, and your real package (gross + employer contributions).
- **KWSP check:** confirms your 11%, and your employer's 13% (wages up to RM 5,000) or 12%, based on basic pay plus allowances. Overtime is left out. PCB, PERKESO and SIP are typed from your payslip.
- **Copy last month:** payslips barely change. Copy, then edit only what's different.
- **This year:** gross, net, PCB, zakat, KWSP (you + employer) and PERKESO + SIP for the year, ready to check against your EA form. Export to Excel.
- **Connected to Lens:**
  - **Assets:** KWSP grows by the real you + employer amounts from your payslips. The monthly estimate is used only for months without a payslip.
  - **P&L:** a **Gross view** switch adds the payroll lines and a "savings rate incl. KWSP on gross". The net figures don't change.
  - **Plan:** retirement uses the real KWSP amount from your payslips.
- **Analysis:** it left the bottom bar, since Lens does analysis now. Open it from **Analysis ›** on Home.

## First time in Lens

1. Open **Lens** from the main page. The **P&L** is ready straight away. It is built entirely from Pocket.
2. Go to **Assets** and confirm your **opening balances**: what ASB, KWSP, gold and your other savings held on the day before Pocket starts. Lens lists your Savings/Asset categories and Balance Sweep for you. Add KWSP, fixed deposits or anything else that isn't in Pocket.
   - For KWSP, you can enter your monthly payslip contribution. Lens adds it each month as an estimate, then corrects itself when you enter a statement value.
3. In **Plan**, add your goals. In **Budget**, start next year's budget from the suggestions.
4. Check **Lens Settings → Savings rate rule**. By default, Travel Funds is left out because it's money set aside to spend, which matches your sheet. Turn categories on or off there.

## What's new in 3.0

- **MansWell:**
  - The main page shows the rooms as full-width cards: Pocket, Lens, and two Soon apps, blurred (3.0.2).
  - The new name and your logo, traced in HD from your file (same outline, same orange) for the Home Screen, the main page and the headers.
  - The main page shows Pocket (Balance Sweep, spent this month), Lens (last month's savings rate) and "4 more on the way". The "Synced" pill refreshes your data.
- **Lens · P&L:** built entirely from Pocket and laid out like your own sheet: Income, Savings & assets, Expenses, Leftover (swept), Total savings and Savings rate.
  - **Monthly status:** every month shows its savings rate and a rating of Strong (30%+), Healthy (20–30%), Watch (0–20%) or Deficit. You can change these levels.
  - **Statement:** swipe through the months. Spending more than double a category's usual month is highlighted. Tap **Full year**, or turn the phone sideways, to see the whole year, and **Export** it to Excel.
  - **Month, explained:** shows what pushed the month up or down compared with earlier months, and spending vs budget once you have a budget for that year.
- **Lens · Assets:**
  - Opening balances are confirmed once.
  - Each asset rolls forward: Opening + In (from Pocket, or a monthly estimate) + Growth (the dividends and prices you record) = Now.
  - Also: a growth chart, an Access view (Ready now / Within days / Retirement), and reminders when a value needs updating.
  - Bank accounts stay in Pocket. Only Balance Sweep is brought in.
- **Lens · Plan:**
  - **Saving power:** your real average saved per month.
  - **Foundations:** emergency fund, card debt, protection and retirement.
  - **Goals:** funded in priority order on a timeline. A late goal gets three exact fixes (save more, move the date or lower the target), each checked to be on time. There is also a what-if slider.
- **Lens · Budget:** next year's budget, built from this year's P&L.
  - **Income:** income you can count on.
  - **Save first:** your savings target comes off the top.
  - **Categories:** suggestions by type (fixed, day-to-day or annual), with lumpy annual costs turned into a monthly set-aside, and a 50/30/20 check.
  - **Lock:** you can only lock a budget once it balances.
- **Lens · Settings:**
  - Opening balances (password), assets and links, the savings rate rule, month status levels, essential spending, plan assumptions, and Excel export.
  - **Reset Lens** clears only Lens data and asks for your password.
- **Backup** now includes the Lens tabs too (14 sheets). The file is called `MansWell-backup-yyyy-mm-dd.xlsx`.

## How Lens counts (and what it never does)

- Lens **only reads** Pocket. It never adds, changes or deletes a Pocket account, transaction or category.
- **Income and expenses:** each category's type decides the side, exactly as in Pocket. A payback nets off inside its own category. Split purchases count by their lines.
- **Left out:** transfers between your own accounts, credit-card repayments and Balance Sweep moves are not income or expenses.
- **Savings/Asset categories** (ASB, gold) count as **invested**, not spent.
- **Total savings** = the savings categories that count + the leftover. **Savings rate** = Total savings ÷ Income.
- **No double counting:** when you buy ASB from Maybank, cash goes down in Pocket and the ASB asset goes up by the same amount.
- Months follow Pocket's financial months (your cycle day).

## Updating to 2.0.1 (from 2.0)

Only the main page changes. **No Apps Script update is needed.**

1. **GitHub:** **Add file → Upload files**, then drag in everything from this folder, **including the `js`, `icons` and `fonts` folders**. There are two new folders: `fonts` (the main page's fonts) and `icons/apps` (the Dreamer logo). Click **Commit changes**.
2. **iPhone:** close Dreamer fully and open it again. If you still see the old main page, close and reopen it once more. The new files load on the second open.

## What's new in 2.0.1

- **New "one door" main page.** It is clean and dark, with an orange grid glow, the headline "All your dreams, one door." and an **Open Pocket** button.
- **One card per app**, in two groups:
  - **Pennywise:** **Pocket** (open), **Lens** (budget, P&L, forecast and goals; coming soon), and one more app, still hidden.
  - **Roaming Dreamer:** three apps, still hidden.
- Apps that haven't launched yet are blurred and say only "Soon".
- The **gear** at the top right opens Settings.
- Pocket itself didn't change: the same screens, data, Google Sheet, import, sweep and backup.
- **Credits:**
  - Fonts: Space Grotesk and IBM Plex Mono, under the SIL Open Font License.
  - Icons: Phosphor Icons, under the MIT license.

## Updating to Pocket 2.0

This update has **two parts**. Do both.

1. **Google Sheet:** open Apps Script and replace everything in `Code.gs` with the new `apps-script/Code.gs`, then **Save**. Then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The web address stays the same. The next time the app opens, two new tabs appear in your Sheet: `SYS_ImportMap` and `SYS_Imports`.
2. **GitHub:** upload the whole folder, including `js` and `icons`, and commit. There are new files: `js/screens/dreamer.js` and `js/backup.js`.
3. **iPhone:** to get the new **D.** icon and the name **Dreamer**, add the app to the Home Screen again (Safari → your GitHub link → Share → Add to Home Screen), then remove the old icon. It asks for your web address and key once. Your data is all in the Sheet, so nothing is lost.

If you skip step 1, the app still works, but Import keeps its memory on each phone instead of in the Sheet.

## What's new in Pocket 2.0 · Dreamer

- **Dreamer main page.** The app now opens on it. You see the greeting, your Pocket card (net worth, 6-month trend, this month's spending, kept, accounts) and tiles for **Financial** and **Roaming** (coming soon). Tap the Pocket card to go in. Inside Pocket, tap **▦** or the name **Pocket Dreamer** to come back.
- **New logo and name:** the **D.** monogram, called "Dreamer" on the Home Screen.
- **Balance Sweep card:** cleaner, without the icon and the "System account · N linked" line.
- **Import memory is saved in your Google Sheet.** Your code links (SPT → Sports), transfer accounts (MAE → MAE), the last account you used, and **Recent imports** with Undo now work on every device: your phone, laptop or a new phone.
- **Backup:** Settings → **Download backup (Excel)** saves every tab in one `.xlsx` file, with account names instead of IDs. On iPhone it opens the share sheet, so you can save it to Files, Google Drive or Mail.
- Spending keeps both Expense and Savings/Asset categories (ASB, gold), as before.

## Updating to v1.9

Only **GitHub** changes; `Code.gs` stays the same. Upload the whole folder (it has a new file, `js/screens/import.js`) and commit, then close and reopen the app.

## What's new in v1.9 · Import past transactions

**Settings → Import transactions** reads your own bank sheet, either **Excel (.xlsx)** or CSV.

- **Columns:** Date · Payee / Payer · Description · Account Code · Debit · Credit · Balance. The header row can be anywhere near the top, extra columns like "No." are ignored, and dates like 28/02/26 work.
- **One file is one account.** Choose it under **This file is for**. If the workbook has several sheets, pick the sheet too.
- **Debit is money out and Credit is money in.** A Credit under an expense code (for example a friend paying back snooker) lowers that category's spending; it isn't counted as income.
- **Your codes:** link each Account Code once to a category, to **⇄ Transfer**, or to **＋ New category** (with its type). Your choices are remembered for next time.
- **Transfer accounts:** for transfer codes, the Payee is the other account (MAE, Maybank Shopee (CC)…). It's matched automatically. Debit means money went to that account and Credit means it came from it.
- **Balance check:** your Balance column is checked row by row, and the app's balance after the import is compared with your file's last balance.
- **Other checks:**
  - New payees can be added, with an **All** switch and near-match questions.
  - Rows already in the app are skipped.
  - Rows in closed months, before your tracking start, or in the future need attention and are skipped.
- **Recent imports → Undo** (password) removes every transaction from that import. This is useful for testing.

The older Type/Amount/Account template layout is still accepted.

**Fix:** on the Transactions page, the cash flow skipped split transactions, so a filtered account could show a net that didn't match its balance. Split lines are now counted.

## Updating to v1.8

Version numbers restart under the new name: **v1.8 comes after Everwell/Pocket Dreamer 4.8**. Only **GitHub** changes; `Code.gs` stays the same. Upload the whole folder and commit, then close and reopen the app. Settings shows "Pocket Dreamer · v1.8" at the bottom.

## What's new in v1.8

- **Home · Spending:**
  - Shows your **top 5** categories, with no "Others". The total in the middle is still everything you spent, and the small dark gap in the ring is the part outside the top 5.
  - Bright orange–red palette with a soft glow.
  - Thicker ring with a smaller centre, and no month label.
- **Accounts:** the Total cash / Cards owed panel is removed.

## Updating to v4.8.0

Only **GitHub** changes; `Code.gs` stays the same. Upload the whole folder and commit, then close and reopen the app.

## What's new in v4.8.0 · Cash flow

- **Home · Cash flow** now shows **Income · Expenses · Savings**:
  - Expenses are your Expense categories and Savings are your Savings/Asset categories (for example ASB).
  - Income shows how much you kept ("kept 2%").
- **The line is your whole income.** Green on the left is savings, light green is what's still in the bank, and red on the right is expenses. A small legend gives each share.
- **Beside NET:** "vs last month" and "vs the same month last year" (▲ green = better, ▼ red = worse).
- **An empty month** shows RM 0.00 in grey. The comparisons show what the other month was ("Was RM 70.44") or "No records yet".
- **Month result / forecast** has been removed from Home.

## Updating to v4.7.0

Only **GitHub** changes; `Code.gs` stays the same. Upload the whole folder and commit, then close and reopen the app.

## What's new in v4.7.0 · Close a month

- **Sweep now lets you choose the month.** It opens on the oldest month that is still open. Use ‹ › to pick how far to close. Any earlier open months are closed with it, in order, and each one is swept at its own month end (27 Jan, 27 Feb…).
- **A closed month is locked.** Transactions dated on or before its last day can't be added, edited, split or deleted, including transfers, recurring posts and opening balances. The tracking period can't be changed while months are closed.
- **Reopen month** (password) appears on the latest closed month in Sweep history. It removes that month's sweep and unlocks it, so you can fix something and close it again. Reopen one month at a time, newest first.
- **Older data:** if October was swept before January–September (as older versions did), a gold note tells you to reopen October first, then close the months from January.
- Start fresh also clears the sweep history.

## Updating to v4.6.0

Only **GitHub** changes; `Code.gs` stays the same. Upload the whole folder (including `js` and `icons`) and commit.

The new name and icon only show on the iPhone once you add the app to the Home Screen again. In Safari, open your GitHub link, tap **Share → Add to Home Screen**, then delete the old Everwell icon. The new copy will ask for your Web App URL and key once. Your data is safe because it lives in the Google Sheet.

## What's new in v4.6.0

- **New name: Pocket Dreamer**, with a new "P." icon in the same style.
- **Home · Cash flow:** calmer design. The net is the main number, a small badge shows how much you kept (or overspent), and Money in / Money out sit in one quiet panel. There are no more thick bars.
- **Home · Month result / forecast:** the date labels are gone. "vs last month" is now a small badge that only shows when last month has data. The progress line only shows while the month is running.
- **Home · Spending:** a thin ring with small gaps, and the total in the middle in the app font. The total now covers **all** categories (before, it only added up the top 5). The top 4 are listed with amounts and the rest are grouped as **Others**.
- **Transactions:** the filters are one compact row (Period · Account · Category). The year button in the period sheet just says **2026**.
- **Settings:** **Download CSV** opens the iPhone share sheet, so you can Save to Files, WhatsApp or Mail it; **Copy as text** copies it. The Google Sheet card no longer overlaps the CONNECTED badge.

## Updating to v4.5.0 from v4.4.x

Only **GitHub** changes. `Code.gs` is the same, so you don't need to redeploy Apps Script. Upload the whole folder (including `js`) and commit, then close and reopen Everwell on the iPhone.

## What's new in v4.5.0

- **Income and Expense can use any category.** The category decides where the money counts, so you can do paybacks and refunds yourself:
  - An **Income** in an expense category (for example Sports) **lowers that category's spending** and is not counted as income. RM 30 Sports + RM 15 Income to Sports = Sports RM 15, money out RM 15, and your account goes up by RM 15.
  - An **Expense** in an income category (for example Salary) **reduces that income** and is not counted as spending.
  - A green or orange line under the amount tells you when this applies.
  - Shortcut: open an expense and tap **Payback received**. Income, the same category and account, and a link to the expense are filled in, so you only type the amount. The expense then shows **Paid back RM 15 · your share RM 15**.
  - Split lines can use any category too.
- Fix: closing the app right after a save now always keeps the latest data on the phone.

## What's new in v4.4.1

- **No green messages anywhere.** Saving payees, categories, recurring items, settings and sweeps no longer shows a green banner. Red error messages still appear. Copy in Settings → Export shows "Copied ✓" on the button instead.

## What's new in v4.4.0

- **Instant saving:** saving an account or transaction finishes in about 0.1 s. The app updates on the phone straight away and sends the change to Google Sheets in the background, usually within 1–2 s.
- **Nothing gets lost:**
  - Changes wait on the phone until Google confirms them, even if you close the app or go offline.
  - A small yellow note shows while something is still waiting, and it is sent automatically when you are back online.
  - Sending the same change twice never creates a duplicate.
- **Fast start:** Everwell opens with the copy kept on your phone, then refreshes from Google in the background.
- **No green messages** after saving a transaction, transfer, split or account.
- **Faster Google script:** each save skips the tab checks, which now run once when the app opens.

## What was new in v4.3.0

- **Home:** a new month heading, the date range under the month, the cash flow card without the month label, and up to 10 recent transactions. Two new cards: **Next 14 days** (bills, card payments, committed amount and safe to spend) and **Month-end forecast**.
- **Transactions:** clearer Period, Account and Category filters, and the whole page scrolls as one. The Notes row is removed from Add transaction.
- **Analysis:** shows "Deploying soon." for now.
- **Settings:** Fund transfer and Alerts are removed. **Activity log** now has its own page with every entry. **Data** and **Data Connection** actions ask for the password first. This only stops mis-taps: the password sits in the app's code, which is public on GitHub.
- **Accounts:** a **Monthly Balance Sweep** section. On the last day of each financial month, each linked account's balance moves into the **Balance Sweep** system account with a real transfer.
  - Debit cards are linked by default. You can switch e-wallets and cash on in the account's settings. Credit cards are never swept.
  - Zero balances are skipped, and negative balances are flagged for review, then retried.
  - A month is never swept twice, and sweeps never go backwards in time.
  - Automatic sweeps run when you open the app after month end.
- **Design:** refined cards, labels, inputs and buttons, and a frosted bottom bar, all in the same colours and fonts.

---

## Part A: Google Sheet + Apps Script (about 10 minutes)

1. Open **sheets.new** and name the sheet **Everwell**.
2. Go to **Extensions → Apps Script**. Replace everything in `Code.gs` with the file `apps-script/Code.gs`, then click **Save**.
3. Pick **setupEverwell** in the toolbar and press **Run**. Approve the permissions: **Advanced → Go to … (unsafe) → Allow**. This warning is normal because the script is your own.
4. The **Execution log** shows `Your API key is: ew_…`. Copy the key and keep it private.
   - Your sheet now has these tabs: `EW_Settings`, `EW_Accounts`, `EW_Categories` (already filled with starter categories), `EW_Payees`, `EW_Recurring`, `EW_Transactions` and `EW_ActivityLog`.
5. Go to **Deploy → New deployment → ⚙ → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).

> The URL alone shows nobody your data, because every request must include your API key. If you need to see the key again, run `showApiKey`. To make a new one, run `resetApiKey`.
> If you change Code.gs later, go to **Deploy → Manage deployments → ✏️ → New version → Deploy**. The URL stays the same.

## Part B: GitHub Pages (about 5 minutes)

1. On **github.com**, create a new repository called `everwell` and set it to **Public**. Only app code goes in it. Your data and key are never stored there.
2. Click **uploading an existing file** and drag in **everything inside this folder**, including the `js` and `icons` folders. Then click **Commit changes**.
3. Go to **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
4. After 1–2 minutes, the app is live at `https://YOUR-USERNAME.github.io/everwell/`.

## Part C: iPhone

1. Open the link in **Safari**. Paste the **Web app URL** and the **API key**, then tap **Connect**.
2. On **Set your starting point**, choose the start date (28/12/2025) and the day each month starts (28). Then tap **Begin with my own accounts**.
3. Tap **Share → Add to Home Screen**.

---

## Moving your SharePoint data across (optional)

Each SharePoint list has a tab with the same name, and the columns are the same too. The one difference is SharePoint's **Title** column, which gets a clearer name in each tab:

| Tab | SharePoint "Title" becomes |
|---|---|
| EW_Accounts | `AccName` |
| EW_Categories | `CatName` |
| EW_Payees | `PyName` |
| EW_Recurring | `RcName` |
| EW_Transactions | `TxnId` |

Steps:

1. Export each list from SharePoint to Excel.
2. Paste the rows under the matching headers.
3. Type dates as `yyyy-mm-dd`, for example `2026-01-05`.
4. If you paste in categories, delete the starter categories first.
5. In the app, tap the ↻ refresh icon.

You don't need **EW_Summary**. The web app works out monthly totals straight from your transactions.

## How it differs from the Power App

- **All transactions load at once.** This is quick, at around 2,000 a year. The account history shows the latest 60, so there's no **Earlier ›** button.
- **No EW_Summary list.** Totals are always live. **Recalculate monthly totals** simply reloads from the Sheet.
- **Additions:** a one-time **Connect** screen, a **Google Sheet connection** card in Settings with **Disconnect this device**, and starter categories in a new Sheet.
- **Small fixes:**
  - Typing a payee's full name also fills in its default category.
  - After you save an edit, Back takes you where you were.
  - The back arrow on Recurring and Categories closes the edit panel first.

## Updating the app later

1. Upload the changed files to GitHub.
2. In `sw.js`, change `CACHE = 'manswell-3.1.6-1'` to a new value, for example `-2`.
3. On your iPhone, close the app fully and open it again.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Wrong API key" | Run `showApiKey` and paste the key again. |
| "Unexpected reply…" | Check that the URL ends in `/exec` and that access is set to **Anyone**. |
| "Server not set up yet" | Run `setupEverwell` once. |
| Code.gs changes don't apply | **Manage deployments → New version**. |
| The app shows an old version | Bump `CACHE` in `sw.js`, then close and reopen the app. |
