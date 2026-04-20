# Expense Tracker — Architecture & Project Specifications

## 1. Product Vision

A personal finance tracker installable on a mobile phone (no hosting required, fully offline). Data lives entirely on-device. Designed for one user.

---

## 2. Iteration Roadmap

| Iteration | Scope |
|-----------|-------|
| **Iteration 1** (current) | Add / Edit / Delete income & expenses. Date, category, people tags. Monthly list view. |
| **Iteration 1b** | PDF bank statement import — extract and bulk-add transactions |
| **Iteration 2** | Planned / future expenses. Allocations. Savings goals. |
| **Iteration 3** | Event budgets (marriage, medical, travel). Projections. Availability dashboard. |

---

## 3. Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Expo SDK 52 (React Native)** | Cross-platform APK/IPA without a server; single JS codebase |
| Local DB | **expo-sqlite (SQLite)** | Relational, on-device, no sync needed, survives app restarts |
| State | **Zustand** | Minimal boilerplate, easy async slices |
| Navigation | **React Navigation 6** | De-facto standard for Expo |
| UI | **React Native Paper** | Material 3, accessible, consistent |
| Date utils | **date-fns** | Tree-shakeable, no moment.js bloat |
| ID generation | **uuid v4 (via expo-crypto)** | Collision-safe local IDs |
| PDF picking | **expo-document-picker** | Native file picker, no permissions drama |
| PDF parsing | **WebView + PDF.js** | Extracts text client-side with zero backend |
| Icons | **@expo/vector-icons** | Bundled with Expo |

### Why no backend?
All data stored in SQLite on device. PDF parsing runs in an embedded WebView. No network calls required for core functionality.

---

## 4. Database Schema (Full Vision — built incrementally)

```sql
-- ─────────────────────────────────────────────────────────
-- SCHEMA VERSION TABLE
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schema_migrations (
  version   INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- CATEGORIES  (Iteration 1)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('income','expense','both')),
  color       TEXT,           -- hex e.g. #FF6B6B
  icon        TEXT,           -- icon name from vector-icons
  parent_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  is_system   INTEGER DEFAULT 0,  -- 1 = seeded default, cannot be deleted
  created_at  INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- PEOPLE / TAGS  (Iteration 1)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  created_at  INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- TRANSACTIONS  (Iteration 1)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               TEXT PRIMARY KEY,
  type             TEXT NOT NULL CHECK(type IN ('income','expense')),
  amount           REAL NOT NULL CHECK(amount > 0),
  date             INTEGER NOT NULL,   -- Unix ms timestamp
  description      TEXT,
  category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
  -- Iteration 2+ fields (nullable now, used later)
  event_id         TEXT,               -- REFERENCES events(id)
  is_planned       INTEGER DEFAULT 0,  -- 0=actual, 1=planned/to-do expense
  planned_due_date INTEGER,            -- for planned entries
  recurrence_type  TEXT CHECK(recurrence_type IN ('none','daily','weekly','monthly','yearly')) DEFAULT 'none',
  recurrence_end   INTEGER,
  -- Import metadata
  source           TEXT DEFAULT 'manual' CHECK(source IN ('manual','pdf_import','recurring')),
  raw_description  TEXT,               -- original text from PDF
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- TRANSACTION ↔ PEOPLE  (Iteration 1)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_people (
  transaction_id  TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, person_id)
);

-- ─────────────────────────────────────────────────────────
-- EVENTS  (Iteration 3)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,   -- 'marriage','medical','travel','other'
  start_date   INTEGER,
  end_date     INTEGER,
  budget       REAL,
  description  TEXT,
  created_at   INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- ALLOCATIONS  (Iteration 2)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  amount       REAL NOT NULL,
  period       TEXT NOT NULL CHECK(period IN ('monthly','yearly')),
  category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- SAVINGS GOALS  (Iteration 2)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  target_amount  REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date    INTEGER,
  created_at     INTEGER NOT NULL
);

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
```

### Seeded Default Categories

| Name | Type | Icon |
|------|------|------|
| Salary | income | briefcase |
| Freelance | income | laptop |
| Investment | income | trending-up |
| Other Income | income | plus-circle |
| Food & Dining | expense | restaurant |
| Transportation | expense | car |
| Shopping | expense | shopping-bag |
| Healthcare | expense | medical-bag |
| Utilities | expense | flash |
| Rent / EMI | expense | home |
| Entertainment | expense | movie |
| Education | expense | school |
| Travel | expense | airplane |
| Personal Care | expense | person |
| Other Expense | expense | dots-horizontal |

---

## 5. Application Architecture

```
src/
├── db/
│   ├── database.ts          # SQLite connection singleton
│   ├── migrations/
│   │   ├── v1_initial.ts    # All Iteration 1 tables + seeds
│   │   └── migrate.ts       # Migration runner
│   └── repositories/
│       ├── transactions.ts  # CRUD + query helpers
│       ├── categories.ts
│       └── people.ts
├── stores/
│   ├── transactionStore.ts  # Zustand slice
│   ├── categoryStore.ts
│   └── peopleStore.ts
├── screens/
│   ├── HomeScreen.tsx        # Monthly summary + recent list
│   ├── TransactionListScreen.tsx
│   ├── AddEditTransactionScreen.tsx
│   ├── PdfImportScreen.tsx
│   ├── CategoryScreen.tsx
│   └── PeopleScreen.tsx
├── components/
│   ├── TransactionCard.tsx
│   ├── AmountInput.tsx
│   ├── CategoryPicker.tsx
│   ├── PeoplePicker.tsx
│   ├── DatePicker.tsx
│   ├── MonthNavigator.tsx
│   └── SummaryBar.tsx
├── navigation/
│   └── AppNavigator.tsx     # Stack + Tab navigation
├── services/
│   └── pdfParser.ts         # PDF text extraction + pattern matching
└── utils/
    ├── currency.ts
    └── dateHelpers.ts
```

---

## 6. Navigation Structure

```
Tab Navigator
├── Home          → HomeScreen (monthly summary + quick add FAB)
├── Transactions  → TransactionListScreen (filterable list)
├── Import        → PdfImportScreen
└── Settings      → Categories / People management
```

---

## 7. Workflow Specs — Iteration 1

### 7.1 Add Transaction
1. User taps FAB on Home or "+" on Transactions screen
2. `AddEditTransactionScreen` opens (full screen modal)
3. Fields: Type toggle (Income/Expense), Amount, Date (date picker), Category (bottom sheet picker), Description (optional), People tags (multi-select)
4. Validation: amount > 0, date required, category required
5. On save → insert into SQLite → Zustand store updated → screen pops

### 7.2 Edit Transaction
1. User taps a `TransactionCard`
2. Same `AddEditTransactionScreen` pre-populated
3. On save → UPDATE in SQLite → store updated

### 7.3 Delete Transaction
1. Long-press card → confirmation dialog → DELETE from SQLite → store updated
2. Also accessible from edit screen via "Delete" button

### 7.4 Filter / Browse Transactions
- Month navigator (← April 2026 →) on list screen
- Filter chips: All / Income / Expense
- Category filter (optional, Iteration 1b)

### 7.5 PDF Import (Iteration 1b)
1. User opens Import tab, taps "Pick PDF"
2. `expo-document-picker` opens native file picker (PDF only)
3. File loaded into hidden WebView running PDF.js
4. JS bridge sends extracted text back to React Native
5. `pdfParser.ts` runs regex patterns to extract rows: date, description, amount, debit/credit
6. User sees a preview list of detected transactions with checkbox selection
7. Category auto-suggestion based on description keywords
8. User reviews, corrects, confirms → bulk insert into SQLite

---

## 8. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local-only storage | SQLite on-device | No hosting cost, works offline, personal data stays private |
| Schema-forward design | Full schema created in v1 migration with nullable future columns | Avoid painful migrations later; future columns are NULL until features land |
| Soft-delete | No (hard delete) | Personal app, simplicity wins |
| Currency | Store as REAL (float), display formatted | Sufficient for personal use; avoid integer-pence complexity |
| Date storage | Unix ms integer | Timezone-safe, easily sortable, no string parsing |
| IDs | UUID v4 strings | No auto-increment collision risk if data is ever merged |
| PDF parsing | Client-side WebView + PDF.js | No backend, no API keys needed; works offline |
| State management | Zustand over Redux | Simpler for solo-dev app; no boilerplate |
| UI library | React Native Paper | Material 3, well-maintained, good accessibility |

---

## 9. Build & Install

```bash
# Development
npx expo start

# Build APK for Android sideload
eas build --platform android --profile preview

# Install APK on device
adb install expense-tracker.apk
```

For iOS (without App Store): requires Apple Developer account for TestFlight or direct device install.

---

## 10. Future Iteration Sketches

### Iteration 2 — Planning & Allocations
- "To-do expenses" (planned transactions, `is_planned=1`)
- Monthly allocations per category
- Salary / income schedule
- Savings goals with progress bars
- Available balance = Income − Actual Expenses − Allocations

### Iteration 3 — Events & Projections
- Event budgets (marriage, medical, travel)
- Link any transaction to an event
- Projected monthly spend (based on recurring + planned)
- Month-end forecast dashboard
