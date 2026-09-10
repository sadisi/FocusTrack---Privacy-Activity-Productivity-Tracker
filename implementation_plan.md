# FocusTrack - Implementation Plan

FocusTrack is a privacy-first, local-first Chrome Extension for automatic browser activity tracking, productivity analytics, goals, focus mode, and smart insights with zero login or remote servers.

## Key Features & Architecture

1. **Privacy & Zero-Login**: 100% on-device local storage (`chrome.storage.local`). No account required.
2. **Robust Background Tracking Engine**:
   - Manifest V3 Service Worker listening to `chrome.tabs`, `chrome.windows`, `chrome.idle`, `chrome.alarms`, and `chrome.runtime`.
   - In-memory state tracking active domain, start timestamp, active window status, idle state, and pause state.
   - Periodic flush to `chrome.storage.local` (every 5 seconds + on tab/window/idle changes) to prevent data loss on Service Worker termination.
   - Domain extraction and normalization (`www.youtube.com` -> `youtube.com`).
3. **Data Model**:
   - `DailyActivity`: Record of domains, sessions, total active time per day (`YYYY-MM-DD`).
   - `DomainCategory`: Intelligent default mapping for top domains + custom user category overrides.
   - `UserSettings`: Theme, idle threshold (default 60s), notifications, goals, productivity category classifications, pause status, focus mode settings.
   - `FocusMode`: Warning or blocking options for specified domains/categories.
4. **User Experience (React + TypeScript + Vite + Tailwind CSS)**:
   - **Popup (`popup.html`)**: Compact live session tracker, today summary, productivity %, pause tracking options, button to open full dashboard.
   - **Full Dashboard (`dashboard.html`)**:
     - Onboarding overlay (first run only, 3 key benefits, zero login).
     - Overview cards (Today time, productive vs entertaining/social/other).
     - Daily/7-Day/30-Day Analytics & SVG charts (activity trends, category distribution, top sites).
     - Website Ranking & Search/Filter table.
     - Website Detail Modal (session metrics, category override, goal links).
     - Productivity Score Breakdown & Goal Progress tracker.
     - Focus Mode controller & Smart Break reminder manager.
     - Daily Summary & Weekly Insights generator (computed from real data).
     - Settings (Tracking toggle, Idle threshold, Categories, Goals, Themes, Data Export/Import as JSON/CSV, Data Reset with modal).
5. **Testing Suite (Vitest)**:
   - Unit tests for domain normalization, time tracking accumulation logic, idle state switches, productivity score calculation, goal evaluation, and export formatting.
6. **Chrome Web Store Readiness**:
   - `manifest.json` (V3), icons (16, 48, 128 generated programmatically), `CHROMEWEBSTORE.md`, privacy policy, detailed `README.md`.

---

## User Review Required

> [!NOTE]
> All core tracking, analytics, settings, goals, focus mode, and data export functions operate completely locally within your browser using `chrome.storage.local`. No external APIs or authentication servers are used.

---

## Proposed Changes

### Configuration & Infrastructure
#### [NEW] `package.json`
- Configure Vite, React 18, TypeScript, TailwindCSS/PostCSS, Lucide icons, Vitest.
#### [NEW] `vite.config.ts`
- Build multi-page entrypoints: `popup.html`, `dashboard.html`, `background.ts` (service worker bundle).
#### [NEW] `tsconfig.json`
#### [NEW] `manifest.json`
- Manifest V3 declaration with `permissions`: `["tabs", "storage", "idle", "alarms", "notifications"]`.

### Core Logic & Engine (`src/`)
#### [NEW] `src/types/index.ts`
- Interfaces for `TrackingState`, `DomainActivity`, `DailyActivity`, `Session`, `Category`, `Goal`, `UserSettings`, `FocusModeConfig`.
#### [NEW] `src/utils/domain.ts`
- Domain extraction and normalization logic.
#### [NEW] `src/utils/categories.ts`
- Pre-defined domain-to-category dictionary and default productivity weights.
#### [NEW] `src/services/storage.ts`
- Wrapper for `chrome.storage.local` with fallback for local development/testing in standard browser environment.
#### [NEW] `src/tracking/engine.ts`
- Event handler engine for tab activation, tab updates, window focus, idle state changes, alarms, and data flushing.
#### [NEW] `src/background/index.ts`
- Manifest V3 Service Worker entry point registering background listeners.

### Analytics & Business Logic (`src/analytics/`)
#### [NEW] `src/analytics/productivity.ts`
- Productivity score algorithm (0-100) based on category settings.
#### [NEW] `src/analytics/goals.ts`
- Goal evaluator for daily/weekly thresholds.
#### [NEW] `src/analytics/insights.ts`
- Rule-based generator for weekly insight cards from actual historical daily activity records.
#### [NEW] `src/analytics/export.ts`
- Data exporter and importer for JSON & CSV formats.

### React Application (`src/popup/` & `src/dashboard/`)
#### [NEW] `src/popup/Popup.tsx`
- Compact popup view with active tab tracker, live ticker, quick pause, productivity score gauge.
#### [NEW] `src/dashboard/Dashboard.tsx`
- Full-page dashboard with sidebar navigation, header metrics, onboarding workflow, and tab views:
  - **Overview**: Today's metrics, site ranking, goal progress.
  - **Analytics**: 7-day / 30-day breakdown, category distribution, SVG trends.
  - **Goals & Focus**: Goal manager and Focus Mode settings.
  - **Insights & Summary**: Daily summary & Weekly insights.
  - **Settings**: Privacy, Theme, Tracking, Export/Import, Data Reset.
#### [NEW] `src/components/*`
- Reusable UI components (Cards, Charts, Modals, Progress bars, Badge, Toggle, CategoryPicker).

### Testing (`src/__tests__/`)
#### [NEW] `src/__tests__/domain.test.ts`
#### [NEW] `src/__tests__/tracking.test.ts`
#### [NEW] `src/__tests__/productivity.test.ts`
#### [NEW] `src/__tests__/goals.test.ts`
#### [NEW] `src/__tests__/export.test.ts`

### Web Store & Documentation
#### [NEW] `README.md`
#### [NEW] `CHROMEWEBSTORE.md`

---

## Verification Plan

### Automated Tests
- Run `npm run test` (Vitest) to verify domain normalization, tracking duration computations, idle switches, productivity metrics, and goal evaluation.
- Run `npm run build` (TypeScript compilation + Vite build) to verify clean MV3 extension bundle output without syntax/type errors.

### Manual Verification
- Build unpacked extension in `dist/` directory.
- Test tab switching, window switching, idle detection, pause timer, goal progress update, dark/light theme toggle, and export/import functionality.
