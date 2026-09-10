# FocusTrack

**Privacy-first, local-first browser activity & productivity tracker — no account, no login, 100% on-device.**

> "Where is my browser time going?" — FocusTrack answers this extremely well.

---

## Features

- **Zero login** — Install and start immediately. No account, no email, no Google authentication.
- **Automatic active time tracking** — Tracks domain-level time only when tab and window are active and you're not idle.
- **Smart domain categorization** — 100+ domains pre-mapped to 12 categories (Development, Education, Social Media, Entertainment, etc.) with custom override support.
- **Productivity score** — Transparent 0–100 estimate based on your own category settings. Not pseudo-scientific.
- **Goals** — Create daily min/max goals by category or domain with real-time progress.
- **Focus Mode** — Warning or block mode for selected domains/categories. Completely optional.
- **7-Day & 30-Day Analytics** — Activity trend charts, category distribution, site rankings.
- **Daily Summary & Weekly Insights** — Generated from actual stored data. No fake stats.
- **Data Export** — JSON and CSV export, local-only import. No servers.
- **Beautiful dark-mode dashboard** — Premium, minimal design inspired by modern productivity tools.

---

## Architecture

```
src/
├── background/       # Chrome MV3 Service Worker (event registration)
├── tracking/         # TrackingEngine – core tab/window/idle logic
├── services/         # StorageService – chrome.storage.local wrapper
├── analytics/        # productivity, goals, insights, export modules
├── types/            # TypeScript interfaces and types
├── utils/            # domain normalization, category defaults
├── components/       # Reusable React components (charts, modals, badges)
├── popup/            # Toolbar popup React app
├── dashboard/        # Full dashboard React app
└── __tests__/        # Vitest unit tests
```

### Privacy Architecture

FocusTrack collects **only**:
- Active domain name (e.g. `github.com`)
- Time spent, visit count
- Category (user-defined or default)

FocusTrack **never** collects:
- Full URLs, page content, text, passwords, keystrokes, form inputs, screenshots, or any personal data

**All data is stored exclusively in `chrome.storage.local`. No external server. No telemetry.**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Chrome Manifest V3 |
| Language | TypeScript 5 |
| Frontend | React 18 |
| Bundler | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Testing | Vitest |
| Storage | chrome.storage.local |
| APIs | chrome.tabs, chrome.windows, chrome.idle, chrome.alarms, chrome.runtime |

---

## Chrome Permissions

| Permission | Why Required |
|-----------|-------------|
| `tabs` | Required to read `tab.url` to extract tracked domain |
| `storage` | Persists tracking data and user settings locally |
| `idle` | Detects when user becomes idle to stop time counting |
| `alarms` | Periodic heartbeat to flush in-memory time to storage |
| `notifications` | Optional break reminders (user can disable) |

No `<all_urls>` host permission required. No content scripts injected.

---

## Installation (Development)

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build extension
npm run build

# Load in Chrome:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" → select the dist/ folder
```

---

## Building for Chrome Web Store

```bash
# Production build
npm run build

# Create submission ZIP (Windows PowerShell)
Compress-Archive -Path dist\* -DestinationPath focustrack-v1.0.0.zip -Force
```

Exclude from ZIP: `.git/`, `node_modules/`, `src/`, `*.config.*`, `.env`

---

## Testing

```
npm run test
```

Tests cover:
- Domain extraction and normalization (11 tests)
- Productivity score calculation (8 tests)
- Goal evaluation engine (6 tests)

---

## Local-First Principle

FocusTrack is local-first and does not require an account. The architecture is built to support optional cloud sync in the future without breaking the local-first core.

---

## Future Roadmap (not implemented)

- Optional cloud sync / cross-device analytics
- AI-generated weekly productivity insights
- Custom website rules & advanced filters
- Team workspace analytics
- Chrome Web Store public release

---

## License

MIT
