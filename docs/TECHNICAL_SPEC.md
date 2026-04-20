# Technical Specification — Expense Tracker

## 1. Platform & Runtime

| Attribute | Value |
|-----------|-------|
| Framework | Expo SDK 52 (React Native) |
| Language | TypeScript 5.x (strict mode) |
| Min Android | API 24 (Android 7.0) |
| Min iOS | iOS 15 |
| Target install | Android APK (sideload via ADB or direct file install) |
| Network requirement | None — fully offline |
| Data persistence | SQLite on-device via `expo-sqlite` v14 |

---

## 2. Dependency Manifest

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-sqlite": "~15.0.0",
    "expo-document-picker": "~12.0.0",
    "expo-crypto": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.2",
    "react-native": "0.76.x",
    "react-native-paper": "^5.12.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/bottom-tabs": "^6.6.1",
    "@react-navigation/native-stack": "^6.11.0",
    "zustand": "^5.0.0",
    "date-fns": "^3.6.0",
    "@expo/vector-icons": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 3. Project Directory Structure

```
expense-tracker/
├── app.json                     # Expo config
├── App.tsx                      # Entry point — DB init + Navigation mount
├── tsconfig.json
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── pdfjs/                   # Bundled PDF.js assets for WebView
│       ├── pdf.min.js
│       ├── pdf.worker.min.js
│       └── viewer.html          # HTML shell used by the WebView
├── src/
│   ├── db/
│   │   ├── database.ts          # SQLite singleton — opens DB, runs migrations
│   │   ├── migrations/
│   │   │   ├── migrate.ts       # Migration runner
│   │   │   └── v1_initial.ts   # Full schema DDL + seed data
│   │   └── repositories/
│   │       ├── transactions.ts
│   │       ├── categories.ts
│   │       └── people.ts
│   ├── stores/
│   │   ├── transactionStore.ts
│   │   ├── categoryStore.ts
│   │   └── peopleStore.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── TransactionListScreen.tsx
│   │   ├── AddEditTransactionScreen.tsx
│   │   ├── PdfImportScreen.tsx
│   │   ├── ImportReviewScreen.tsx
│   │   ├── CategoriesScreen.tsx
│   │   └── PeopleScreen.tsx
│   ├── components/
│   │   ├── TransactionCard.tsx
│   │   ├── SummaryBar.tsx
│   │   ├── MonthNavigator.tsx
│   │   ├── AmountInput.tsx
│   │   ├── CategoryPicker.tsx
│   │   ├── PeoplePicker.tsx
│   │   └── DatePickerField.tsx
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── services/
│   │   └── pdfParser.ts
│   ├── constants/
│   │   ├── categories.ts        # Default category seed data
│   │   └── theme.ts             # React Native Paper theme config
│   └── utils/
│       ├── currency.ts          # formatINR(), parseAmount()
│       ├── dateHelpers.ts       # toUnixMs(), fromUnixMs(), monthRange()
│       └── uuid.ts              # generateId() using expo-crypto
```

---

## 4. Database Layer

### 4.1 Singleton Connection

```typescript
// src/db/database.ts
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('expense_tracker.db');
    await _db.execAsync('PRAGMA foreign_keys = ON;');
    await _db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return _db;
}
```

### 4.2 Migration Runner

```typescript
// src/db/migrations/migrate.ts
import { getDb } from '../database';
import { v1_initial } from './v1_initial';

const MIGRATIONS = [
  { version: 1, up: v1_initial },
];

export async function runMigrations() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);
  for (const migration of MIGRATIONS) {
    const row = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [migration.version]
    );
    if (!row) {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        [migration.version, Date.now()]
      );
    }
  }
}
```

### 4.3 TypeScript Interfaces

```typescript
// All entities share this base
interface BaseEntity {
  id: string;           // UUID v4
  created_at: number;   // Unix ms
}

interface Category extends BaseEntity {
  name: string;
  type: 'income' | 'expense' | 'both';
  color: string;        // hex
  icon: string;         // MaterialCommunityIcons name
  parent_id: string | null;
  is_system: 0 | 1;
}

interface Person extends BaseEntity {
  name: string;
  phone: string | null;
  email: string | null;
}

type TransactionType = 'income' | 'expense';
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type TransactionSource = 'manual' | 'pdf_import' | 'recurring';

interface Transaction extends BaseEntity {
  type: TransactionType;
  amount: number;           // stored as REAL (rupees)
  date: number;             // Unix ms
  description: string | null;
  category_id: string | null;
  event_id: string | null;
  is_planned: 0 | 1;
  planned_due_date: number | null;
  recurrence_type: RecurrenceType;
  recurrence_end: number | null;
  source: TransactionSource;
  raw_description: string | null;
  updated_at: number;
  // Joined fields (not in DB column)
  category?: Category;
  people?: Person[];
}
```

### 4.4 Repository API

```typescript
// src/db/repositories/transactions.ts

listByMonth(year: number, month: number): Promise<Transaction[]>
// Returns all transactions where date falls within the month, ordered by date DESC
// Joins category and people via transaction_people

getById(id: string): Promise<Transaction | null>

insert(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'category' | 'people'> & { peopleIds?: string[] }): Promise<Transaction>

update(id: string, data: Partial<...> & { peopleIds?: string[] }): Promise<Transaction>

remove(id: string): Promise<void>

sumByMonth(year: number, month: number): Promise<{ income: number; expense: number; net: number }>
```

---

## 5. State Management

### 5.1 Transaction Store

```typescript
interface TransactionState {
  transactions: Transaction[];
  selectedYear: number;
  selectedMonth: number;          // 1-12
  summary: { income: number; expense: number; net: number };
  isLoading: boolean;

  loadMonth: (year: number, month: number) => Promise<void>;
  addTransaction: (data: ...) => Promise<void>;
  updateTransaction: (id: string, data: ...) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkInsert: (transactions: ...[]) => Promise<void>;  // for PDF import
}
```

### 5.2 Category Store

```typescript
interface CategoryState {
  categories: Category[];
  load: () => Promise<void>;
  add: (data: ...) => Promise<void>;
  update: (id: string, data: ...) => Promise<void>;
  remove: (id: string) => Promise<void>;
  byType: (type: 'income' | 'expense') => Category[];
}
```

### 5.3 People Store

```typescript
interface PeopleState {
  people: Person[];
  load: () => Promise<void>;
  add: (data: ...) => Promise<void>;
  update: (id: string, data: ...) => Promise<void>;
  remove: (id: string) => Promise<void>;
}
```

---

## 6. Navigation

```
AppNavigator (NavigationContainer)
└── BottomTabNavigator
    ├── HomeTab
    │   └── Stack
    │       ├── HomeScreen
    │       └── AddEditTransactionScreen (modal)
    ├── TransactionsTab
    │   └── Stack
    │       ├── TransactionListScreen
    │       └── AddEditTransactionScreen (modal)
    ├── ImportTab
    │   └── Stack
    │       ├── PdfImportScreen
    │       └── ImportReviewScreen
    └── SettingsTab
        └── Stack
            ├── SettingsHomeScreen (list of settings options)
            ├── CategoriesScreen
            └── PeopleScreen
```

**Navigation params:**

```typescript
type RootStackParamList = {
  AddEditTransaction: { transactionId?: string } | undefined;
  ImportReview: { parsedRows: ParsedRow[] };
};
```

---

## 7. PDF Import Pipeline

### 7.1 Extraction (WebView + PDF.js)

```
User picks PDF
    ↓
expo-document-picker → returns file URI
    ↓
WebView loads viewer.html (bundled asset)
    ↓
React Native injects file URI via injectedJavaScript
    ↓
PDF.js fetches file, extracts text per page
    ↓
window.ReactNativeWebView.postMessage(JSON.stringify({ pages: [...] }))
    ↓
onMessage handler in PdfImportScreen receives text
    ↓
pdfParser.parse(rawText) called
```

### 7.2 Parser Logic (`services/pdfParser.ts`)

```typescript
interface ParsedRow {
  date: Date | null;
  description: string;
  amount: number;
  suggestedType: 'income' | 'expense';
  suggestedCategoryId: string | null;
  raw: string;
}

function parse(text: string): ParsedRow[]
```

**Pattern strategies (tried in order):**
1. **Tabular format** — detect header row with Date/Narration/Debit/Credit columns, parse fixed-width or tab-separated rows
2. **Narrative format** — match lines like `DD/MM/YYYY  Description  DR 1,234.56` or `CR 5,000.00`
3. **Amount detection** — regex `[\d,]+\.\d{2}` with context words (Dr/Cr/Debit/Credit/Withdrawal/Deposit)

**Category keyword mapping:**
```
swiggy, zomato, restaurant, hotel, dining → Food & Dining
uber, ola, petrol, fuel, metro → Transportation
amazon, flipkart, myntra, shopping → Shopping
salary, credit from employer → Salary
emi, loan, rent → Rent / EMI
medical, pharmacy, hospital, apollo → Healthcare
```

### 7.3 Import Review Screen

- Shows parsed rows as a scrollable list
- Each row: checkbox (selected by default), date, description (truncated), amount, type badge (Income/Expense), category chip (tappable to change)
- "Deselect All" / "Select All" buttons
- "Import X transactions" button at bottom
- On confirm → `transactionStore.bulkInsert(selectedRows)`

---

## 8. UI Component Specs

### TransactionCard
```
┌─────────────────────────────────────────────────────┐
│  [icon]  Food & Dining          Apr 15    -₹450.00  │
│          Swiggy order                               │
│          👤 Amma                                    │
└─────────────────────────────────────────────────────┘
```
- Left: category color dot + icon
- Center: category name, description (if any), people tags
- Right: date (day month), amount (red for expense, green for income)
- Tap → opens AddEditTransactionScreen with transaction pre-filled
- Long press → "Delete transaction?" confirmation dialog

### SummaryBar
```
┌─────────────────────────────────────────────────────┐
│  Income          Expense          Balance            │
│  ₹45,000         ₹18,230          ₹26,770           │
│  [green]         [red]            [blue]             │
└─────────────────────────────────────────────────────┘
```

### MonthNavigator
```
  ← April 2026 →
```
- Left/right arrows change month
- Tapping month name opens a month/year picker

### AmountInput
- Large numeric keyboard
- Shows formatted value as user types (e.g. `1,234.56`)
- Currency symbol (₹) prefix
- No negative input allowed (type toggle handles income/expense)

---

## 9. Error Handling

| Scenario | Handling |
|----------|----------|
| DB open failure | Alert on app launch, show retry button |
| Insert/update failure | Snackbar error, transaction not added |
| PDF password protected | Show error message in PdfImportScreen |
| PDF parse yields 0 rows | Show "No transactions detected" with manual entry option |
| Delete category with linked transactions | Block delete, show count of linked transactions |
| Invalid amount (0 or empty) | Inline validation error on save |

---

## 10. Build Commands

```bash
# Install dependencies
npm install

# Run on Android emulator / connected device
npx expo run:android

# Run on iOS simulator
npx expo run:ios

# Build APK for sideloading (requires EAS CLI + Expo account)
npm install -g eas-cli
eas login
eas build --platform android --profile preview

# Build without EAS (local build, requires Android Studio)
npx expo run:android --variant release
```

### app.json key fields
```json
{
  "expo": {
    "name": "Expense Tracker",
    "slug": "expense-tracker",
    "version": "1.0.0",
    "android": {
      "package": "com.sreyung.expensetracker",
      "permissions": ["READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-sqlite",
      "expo-document-picker"
    ]
  }
}
```
