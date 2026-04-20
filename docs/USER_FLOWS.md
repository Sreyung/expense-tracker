# User Flow Specifications — Expense Tracker

## Flow Conventions

- **Screen** → named screen
- **[Action]** → user action (tap, type, swipe)
- **{Condition}** → branching condition
- **→** → navigates to
- **✓** → success / happy path
- **✗** → error / edge case

---

## Flow 1: First App Launch

```
App opens
  ↓
DB initialises (schema_migrations runs v1)
  ↓
Default categories seeded (15 categories)
  ↓
→ HomeScreen

HomeScreen (empty state)
  ┌─────────────────────────────┐
  │  April 2026                 │
  │  Income   Expense  Balance  │
  │  ₹0       ₹0       ₹0      │
  │                             │
  │  No transactions yet        │
  │  Tap + to add your first    │
  │                             │
  │           [+]               │ ← FAB
  └─────────────────────────────┘
```

---

## Flow 2: Add an Expense

```
HomeScreen or TransactionListScreen
  ↓
[Tap FAB (+)] or [Tap + in header]
  ↓
→ AddEditTransactionScreen (modal, slides up)

Step 1 — Type
  [Toggle: INCOME | EXPENSE]
  User selects EXPENSE (default)

Step 2 — Amount
  Large number pad appears
  User types: 4 5 0
  Display shows: ₹450.00

Step 3 — Date
  Default: today's date shown
  [Tap date field]
    → DatePicker opens (calendar)
    User picks April 15
    [Tap OK]
  Date field shows: April 15, 2026

Step 4 — Category
  [Tap category field]
    → Bottom sheet slides up with category list
    Filtered to EXPENSE categories
    User scrolls, taps "Food & Dining"
    Bottom sheet closes
  Category field shows: 🍽 Food & Dining

Step 5 — Description (optional)
  User types: "Swiggy order"

Step 6 — People Tags (optional)
  [Tap "Tag people" field]
    → Multi-select list of saved people
    User taps "Amma"
    Chip appears: 👤 Amma
    [Tap Done]

Step 7 — Save
  [Tap SAVE button]
    {amount = 0} → "Amount must be greater than 0" error shown inline
    {no category} → "Please select a category" error shown inline
    {valid} → insert into SQLite → store updated
      ↓
    Modal closes
    HomeScreen refreshes, shows new transaction in list
    Snackbar: "Expense added ✓"
```

---

## Flow 3: Add an Income

```
[Tap FAB (+)]
  ↓
→ AddEditTransactionScreen

[Toggle: tap INCOME]
  Screen tint changes to green accent

Amount: 45000
Date: April 1, 2026
Category: (bottom sheet shows INCOME categories)
  User taps: "Salary"
Description: "April salary"
People: (optional, skip)

[Tap SAVE]
  ↓
HomeScreen: Income shows ₹45,000, Balance updates
```

---

## Flow 4: Edit a Transaction

```
HomeScreen or TransactionListScreen
  ↓
[Tap a TransactionCard]
  ↓
→ AddEditTransactionScreen
  Pre-populated with existing values:
  - Type: EXPENSE
  - Amount: ₹450.00
  - Date: April 15
  - Category: Food & Dining
  - Description: "Swiggy order"
  - People: Amma

User changes amount to 480
  ↓
[Tap SAVE]
  ↓
UPDATE in SQLite
Store updated
List refreshes with new amount
Snackbar: "Transaction updated ✓"
```

---

## Flow 5: Delete a Transaction

### Via long-press (from list)
```
TransactionListScreen
  ↓
[Long-press TransactionCard]
  ↓
Confirmation dialog:
  "Delete this transaction?"
  "₹450 · Food & Dining · Apr 15"
  [CANCEL]  [DELETE]
  ↓
[Tap DELETE]
  ↓
DELETE from SQLite
Store updated
Card animates out of list
Snackbar: "Transaction deleted"
```

### Via edit screen
```
[Tap TransactionCard] → AddEditTransactionScreen
  ↓
[Tap DELETE (red button at bottom)]
  ↓
Same confirmation dialog
  ↓
[Tap DELETE]
  ↓
DELETE from SQLite, modal closes, list refreshes
```

---

## Flow 6: Browse Transactions by Month

```
TransactionListScreen (default: current month)

  ← April 2026 →
  [All]  [Income]  [Expense]    ← filter chips

  April 17  Groceries         -₹320
  April 15  Swiggy order      -₹450
  April 01  April salary    +₹45,000

[Tap ←]
  → Shows March 2026 transactions

[Tap →]
  → Shows May 2026 (future, likely empty)

[Tap "Expense" chip]
  → List filters to show only expenses for that month

[Tap "Income" chip]
  → List shows only income entries

[Tap "All" chip]
  → Resets filter
```

---

## Flow 7: PDF Bank Statement Import

```
[Tap Import tab]
  ↓
→ PdfImportScreen

  ┌─────────────────────────────┐
  │  Import Bank Statement      │
  │                             │
  │  Supported: HDFC, SBI,      │
  │  ICICI, Axis                │
  │                             │
  │  [📄 Pick PDF File]         │
  └─────────────────────────────┘

[Tap Pick PDF File]
  ↓
Native file picker opens (filtered to PDF)
  ↓
{User cancels} → back to PdfImportScreen, no change

{User selects file}
  ↓
Loading spinner: "Extracting transactions..."
  ↓
Hidden WebView loads PDF.js, extracts text
  ↓
pdfParser.parse() runs on extracted text
  ↓
{0 rows detected}
  → "Could not detect transactions in this PDF"
  → "Try a different file or add transactions manually"

{rows detected}
  → ImportReviewScreen

→ ImportReviewScreen

  ┌─────────────────────────────────────────┐
  │  Review Import (23 transactions found)  │
  │  [Select All]  [Deselect All]           │
  │                                         │
  │  ☑ Apr 15  Swiggy Instamart  ₹320  [Food & Dining ▼]   │
  │  ☑ Apr 14  UBER TRIP         ₹180  [Transport ▼]       │
  │  ☑ Apr 01  SALARY CREDIT   ₹45000  [Salary ▼]         │
  │  ☐ Apr 01  UPI-REFUND        ₹50  [Other ▼]           │
  │  ...                                    │
  │                                         │
  │  [Import 22 transactions]               │
  └─────────────────────────────────────────┘

Each row:
  - Checkbox (checked by default)
  - Date
  - Description (truncated to 30 chars)
  - Amount (red = debit, green = credit)
  - Category chip (tappable to change)

[Tap category chip]
  → Bottom sheet with category list
  User changes, sheet closes, chip updates

[Tap Import 22 transactions]
  ↓
bulkInsert into SQLite
  ↓
→ TransactionListScreen for current month
Snackbar: "22 transactions imported ✓"
```

---

## Flow 8: Manage Categories

```
[Tap Settings tab]
  ↓
→ SettingsScreen

  Categories →
  People →

[Tap Categories]
  ↓
→ CategoriesScreen

  INCOME (4)
  ─────────
  💼 Salary         [system]
  💻 Freelance       [system]
  📈 Investment      [system]
  ➕ Other Income    [system]

  EXPENSE (11)
  ────────────
  🍽 Food & Dining   [system]
  🚗 Transportation  [system]
  ...
  🎨 Art Supplies    [custom]  [edit] [delete]

[Tap + Add Category]
  → Bottom sheet:
    Name: [text input]
    Type: [Income | Expense | Both] toggle
    Color: [color grid picker]
    Icon: [icon grid picker]
  [Tap SAVE]
    → Category added to list

[Tap edit on custom category]
  → Same bottom sheet pre-filled

[Tap delete on custom category]
  {has transactions} → "Cannot delete — X transactions use this category. Reassign first."
  {no transactions} → Confirmation → deleted

[Tap system category]
  → No delete button shown, only edit (name/color/icon can be changed)
```

---

## Flow 9: Manage People

```
Settings → People
  ↓
→ PeopleScreen

  Amma          [edit] [delete]
  Dad           [edit] [delete]

[Tap + Add Person]
  → Bottom sheet:
    Name: [required]
    Phone: [optional]
    Email: [optional]
  [Tap SAVE]

[Tap edit]
  → Pre-filled bottom sheet

[Tap delete]
  {person is tagged on transactions}
    → Confirmation: "Amma is tagged in 5 transactions. Remove tags and delete?"
    [CANCEL | DELETE ANYWAY]
  {no transactions}
    → Simple confirmation → deleted
```

---

## Flow 10: Navigation Between Screens

```
Bottom Tab Bar (always visible):
  [🏠 Home]  [📋 Transactions]  [📄 Import]  [⚙️ Settings]

Home → Transactions:
  [Tap Transactions tab] — shows current month list

Transactions → AddEdit:
  [Tap any card] — opens edit modal
  [Tap +] — opens new transaction modal

AddEdit → back:
  [Tap ✕ or swipe down] — closes modal without saving
  [Tap SAVE] — saves and closes

Import → Review:
  After PDF parsed — auto-navigates to ImportReview

Review → back:
  [Tap ← Back] — back to PdfImportScreen (parsed data lost)
  [Tap Import] — inserts data, navigates to Transactions tab
```

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Add transaction with no internet | Works normally — fully offline |
| Pick a non-PDF file in import | expo-document-picker filtered to PDF, so this shouldn't happen; if it does, WebView shows error |
| Same category used in PDF auto-suggest and user changes it | User's change takes precedence |
| Two transactions on same date, same amount | Both created independently — no deduplication in v1 |
| Month with no transactions | Empty state illustration + message shown |
| Amount with more than 2 decimal places typed | Truncated to 2 decimal places on input |
| Very long description | Truncated in card view with ellipsis; full text shown in edit screen |
