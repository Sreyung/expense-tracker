# Expense Tracker

A personal finance tracker that runs entirely on your mobile phone — no internet, no server, no subscriptions. Built with React Native (Expo) and SQLite.

---

## What it does

- **Track income and expenses** — add, edit, delete entries with dates and categories
- **Tag people** to transactions (useful for shared or family expenses)
- **Browse by month** — see exactly what you spent and earned each month
- **Import from bank statements** — pick a PDF from your bank and it extracts transactions automatically
- **Works offline** — all data stays on your phone

---

## Planned Features (future iterations)

- Planned / to-do expenses
- Monthly allocations and budget tracking
- Savings goals
- Event budgets (weddings, medical, travel)
- Projected monthly spend
- Available balance dashboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App framework | Expo (React Native) |
| Local database | SQLite via expo-sqlite |
| State management | Zustand |
| UI components | React Native Paper |
| Navigation | React Navigation 6 |
| PDF parsing | PDF.js (via WebView) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Android Studio (for emulator) or a physical Android device

### Install and run

```bash
# Clone and enter the project
cd expense-tracker

# Install dependencies
npm install

# Start the development server
npx expo start

# Press 'a' to open on Android emulator
# Or scan the QR code with the Expo Go app on your phone
```

### Install on your phone (Android APK)

```bash
# Build a standalone APK
npx expo run:android --variant release

# Install via USB
adb install android/app/build/outputs/apk/release/app-release.apk
```

Or use EAS Build (free Expo account required):

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# Download APK from the link provided, transfer to phone, and install
```

> On Android: go to Settings → Install unknown apps → allow your file manager or browser

---

## Project Structure

```
expense-tracker/
├── App.tsx                  # Entry point
├── src/
│   ├── db/                  # SQLite layer (migrations, repositories)
│   ├── stores/              # Zustand state management
│   ├── screens/             # All app screens
│   ├── components/          # Reusable UI components
│   ├── navigation/          # React Navigation config
│   ├── services/            # PDF parser
│   └── utils/               # Currency, date, UUID helpers
├── docs/
│   ├── ARCHITECTURE.md      # Full architecture and schema
│   ├── TECHNICAL_SPEC.md    # Detailed technical specification
│   ├── USER_FLOWS.md        # Complete user flow documentation
│   └── WORKFLOWS.md         # Development workflows
└── assets/                  # Icons, splash, bundled PDF.js
```

---

## Documentation

| Document | Contents |
|----------|----------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full database schema, tech stack decisions, navigation map, iteration roadmap |
| [TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md) | TypeScript interfaces, repository API, component specs, build commands |
| [USER_FLOWS.md](docs/USER_FLOWS.md) | Step-by-step user flows for every feature with edge cases |
| [WORKFLOWS.md](docs/WORKFLOWS.md) | Developer setup, feature workflow, migration guide, release process |

---

## Issue Tracking

This project uses **beads (bd)** for issue tracking.

```bash
bd ready              # See what's available to work on
bd show <id>          # View issue details
bd update <id> --claim  # Start working on an issue
bd close <id>         # Mark complete
```

Current iteration: **Iteration 1** — Core transaction CRUD + PDF import

---

## Data Privacy

All data is stored in SQLite on your device at:
- Android: `/data/data/com.sreyung.expensetracker/databases/expense_tracker.db`

No data is ever sent anywhere. No analytics. No cloud sync.

---

## License

Personal use only.
