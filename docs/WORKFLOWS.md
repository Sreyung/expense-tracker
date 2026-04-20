# Development Workflows — Expense Tracker

## 1. Development Environment Setup

### Prerequisites
```bash
# Required
node >= 20.x
npm >= 10.x
java >= 17 (for Android builds)
Android Studio (for emulator) OR physical Android device

# Install Expo CLI globally
npm install -g expo-cli eas-cli

# Verify
node -v && npm -v && expo --version
```

### Initial Project Setup
```bash
# From the repo root
cd /Users/sreyungkumard/SreyungPersonal/expense-tracker

# Scaffold Expo project (run once)
npx create-expo-app . --template blank-typescript

# Install all dependencies
npm install \
  expo-sqlite \
  expo-document-picker \
  expo-crypto \
  zustand \
  date-fns \
  react-native-paper \
  react-native-safe-area-context \
  react-native-screens \
  @react-navigation/native \
  @react-navigation/bottom-tabs \
  @react-navigation/native-stack \
  @expo/vector-icons
```

---

## 2. Running the App

### On Android (emulator or device)
```bash
# Start Metro bundler
npx expo start

# Then press 'a' to open on Android, or scan QR with Expo Go app

# Direct run on connected device (USB debugging enabled)
npx expo run:android
```

### On iOS Simulator (Mac only)
```bash
npx expo run:ios
```

### Useful Metro flags
```bash
npx expo start --clear          # Clear Metro cache
npx expo start --reset-cache    # Full reset
```

---

## 3. Feature Development Workflow

Every feature follows this sequence. Do not skip steps.

```
1. Check available work
   bd ready

2. Claim the issue
   bd update <id> --claim

3. Implement the feature
   - Write TypeScript code
   - No console.log left in final code
   - No unused imports
   - All new screens added to AppNavigator

4. Test manually on device/emulator
   - Golden path works
   - Empty state looks correct
   - Error states handled
   - Back navigation works as expected

5. Close the issue
   bd close <id>

6. Check what's unblocked
   bd close <id> --suggest-next
```

---

## 4. Database Migration Workflow

When you need to change the schema:

```bash
# 1. Create a new migration file
touch src/db/migrations/v2_add_events.ts

# 2. Write the migration
export async function v2_add_events(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS events ( ... );
  `);
}

# 3. Register it in migrate.ts
import { v2_add_events } from './v2_add_events';

const MIGRATIONS = [
  { version: 1, up: v1_initial },
  { version: 2, up: v2_add_events },  // add here
];

# 4. Test: uninstall and reinstall the app to verify fresh migration
#    OR clear app data on device to simulate fresh install
```

**Rules:**
- Never modify an existing migration file that has been applied
- Always create a new version for schema changes
- Migrations must be idempotent (use `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE IF NOT EXISTS ...` pattern)

---

## 5. Adding a New Screen

```
1. Create: src/screens/MyNewScreen.tsx
   - Use React Native Paper components
   - Wrap content in SafeAreaView
   - Handle empty state

2. Register in AppNavigator:
   - Add to appropriate Stack or Tab

3. Add navigation types in AppNavigator.tsx:
   type RootStackParamList = {
     ...existing,
     MyNewScreen: { param?: string } | undefined;
   };

4. Link from wherever it's triggered
```

---

## 6. Adding a New Repository Method

```
1. Add method to src/db/repositories/transactions.ts (or categories/people)

2. Define return type with TypeScript interface

3. Add corresponding action to the Zustand store

4. Use the store action in the screen — never call repository directly from UI
```

**Pattern:**
```
Screen → Store action → Repository method → SQLite
```

---

## 7. PDF Parser: Adding a New Bank Format

Bank statements vary in format. To add support for a new bank:

```typescript
// src/services/pdfParser.ts

// 1. Write a detector function
function isHDFCFormat(text: string): boolean {
  return text.includes('HDFC BANK') || text.includes('HDFC Bank Ltd');
}

// 2. Write a bank-specific parser
function parseHDFC(text: string): ParsedRow[] {
  // Match HDFC column pattern: Date  Narration  Chq  Debit  Credit  Balance
  const pattern = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?/gm;
  // ... parse rows ...
}

// 3. Register in the main parse() dispatcher
export function parse(text: string): ParsedRow[] {
  if (isHDFCFormat(text)) return parseHDFC(text);
  if (isSBIFormat(text))  return parseSBI(text);
  // ... fallback to generic parser
  return parseGeneric(text);
}
```

**Testing a new parser:**
- Get a sample PDF statement (anonymise it first)
- Place it in `assets/test_pdfs/` (git-ignored)
- Import via the app and verify rows match expected values

---

## 8. Build & Release Workflow

### Debug APK (for personal testing)
```bash
# Build locally (no EAS account needed)
npx expo run:android --variant debug

# APK location after build:
android/app/build/outputs/apk/debug/app-debug.apk

# Install on device via ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Preview APK (optimised, no dev server needed)
```bash
# Requires EAS account (free tier works)
eas login
eas build --platform android --profile preview

# Download APK from build dashboard or EAS CLI output
# Transfer to phone and install (allow "install unknown apps" in Android settings)
```

### Release APK (production)
```bash
eas build --platform android --profile production
# Signs with keystore — keep keystore file safe
```

### eas.json (build profiles)
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 9. Git Workflow

```bash
# Feature branch naming
git checkout -b feat/expense-tracker-bam-expo-init
git checkout -b feat/expense-tracker-6av-sqlite-schema
git checkout -b fix/expense-tracker-xxx-description

# Commit message format
git commit -m "feat(db): add SQLite migration runner and v1 schema"
git commit -m "feat(screen): implement AddEditTransaction screen"
git commit -m "fix(parser): handle HDFC multi-line narrations"

# After closing all issues for an iteration
git tag v1.0-iteration1
```

---

## 10. Beads Issue Workflow Quick Reference

```bash
# Start of session
bd ready                          # see what's available
bd show <id>                      # review details

# During work
bd update <id> --claim            # mark in progress

# Completing
bd close <id>                     # done
bd close <id1> <id2>              # close multiple at once

# Session end
bd list --status=in_progress      # make sure nothing left dangling
bd stats                          # overall health check
```

---

## 11. Code Style & Conventions

| Rule | Detail |
|------|--------|
| No `any` | Use proper TypeScript types everywhere |
| No `console.log` | Remove before closing an issue |
| Component naming | PascalCase for components and screens |
| File naming | PascalCase for components, camelCase for utils/services |
| Imports | Absolute imports via tsconfig `paths` (e.g. `@/db/database`) |
| Currency | Always format with `formatINR()` from `utils/currency.ts` — never do it inline |
| Dates | Always store as Unix ms; always display via `dateHelpers.ts` — never raw `new Date()` in UI |
| IDs | Always use `generateId()` from `utils/uuid.ts` |
| Store access | Use Zustand hooks in screens; never import repositories directly in screens |
