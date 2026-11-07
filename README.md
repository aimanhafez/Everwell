# Everwell v4.3.0 (web version)

*Live well today. Build well for tomorrow.*

This is your Power Apps Everwell, rebuilt as a web app. It keeps the same 14 screens, layout, colours and rules. Two things change:

| Before | Now |
|---|---|
| Power Apps | A web app on **GitHub Pages**, added to your iPhone Home Screen |
| SharePoint lists (EW_…) | Tabs with the same names in a **Google Sheet** in your Google Drive |

The screens are Setup, Home, Accounts, Account detail, New/Edit account, Transactions, Transaction detail, New/Edit/Duplicate transaction, Fund transfer, Split, Recurring, Categories & Payees, Analysis and Settings.

## What's in the folder

| File | What it is |
|---|---|
| `index.html`, `styles.css`, `js/` | The app |
| `manifest.webmanifest`, `sw.js`, `icons/` | Makes it behave like an app on your iPhone |
| `apps-script/Code.gs` | Goes into your Google Sheet (it replaces SharePoint) |

## Updating from v4.2.5 to v4.3.0 (your data stays)

1. **Google Sheet:** open Apps Script. Replace everything in `Code.gs` with the new `apps-script/Code.gs`, then **Save**. Go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same, and the Sheet gets new columns (`StSweepAuto`, `StSweepFrom`, `StSweepLog`, `AccSweep`) the next time the app connects.
2. **GitHub:** **Add file → Upload files**, then drag in everything from this folder, **including the `js`, `icons` and `apps-script` folders**. Files with the same name are replaced. Click **Commit changes**.
3. **iPhone:** close Everwell fully and open it again. You won't need to reconnect.

## What's new in v4.3.0

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
2. In `sw.js`, change `CACHE = 'everwell-4.3.0-1'` to a new value, for example `-2`.
3. On your iPhone, close the app fully and open it again.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Wrong API key" | Run `showApiKey` and paste the key again. |
| "Unexpected reply…" | Check that the URL ends in `/exec` and that access is set to **Anyone**. |
| "Server not set up yet" | Run `setupEverwell` once. |
| Code.gs changes don't apply | **Manage deployments → New version**. |
| The app shows an old version | Bump `CACHE` in `sw.js`, then close and reopen the app. |
