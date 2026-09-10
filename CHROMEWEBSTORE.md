# FocusTrack — Chrome Web Store Listing

## Extension Metadata

| Field | Value |
|-------|-------|
| Name | FocusTrack — Privacy Activity & Productivity Tracker |
| Short Name | FocusTrack |
| Version | 1.0.0 |
| Category | Productivity |
| Language | English |

---

## Store Description (Short — 132 chars max)

> Privacy-first browser time tracker. No login, no servers. See exactly where your focus goes, locally.

## Store Description (Full)

**FocusTrack — Know where your browser time really goes.**

FocusTrack is a privacy-first, local-only browser activity tracker that automatically measures how much active time you spend on websites — without requiring any account, login, or internet connection.

**What FocusTrack does:**

✅ Automatically tracks active browser time on websites
✅ Measures time only when you're actively using the tab (not idle, not hidden)
✅ Categorizes 100+ popular sites into 12 categories (Development, Education, Social Media, etc.)
✅ Shows a transparent Productivity Score (0–100) based on your own settings
✅ Lets you set daily goals (e.g. "2 hours coding, max 30 min social media")
✅ Optional Focus Mode with warning or block options for distracting sites
✅ 7-day and 30-day analytics with activity trends and category breakdowns
✅ Export all your data as JSON or CSV — locally, no servers

**Privacy first, always:**

❌ No account or email required
❌ No passwords or Google login
❌ No data ever leaves your device
❌ No page content, text input, or keystrokes collected
❌ Tracks only domain names, not full URLs

All data is stored using Chrome's built-in local storage. FocusTrack answers one question extremely well: **"Where is my browser time going?"**

---

## Permissions Justifications

| Permission | Justification |
|-----------|--------------|
| `tabs` | Required to read the current tab's URL to identify which website the user is actively browsing. Without this, no tracking is possible. |
| `storage` | Stores all tracking data (domain activity, goals, settings) locally on the user's device using `chrome.storage.local`. No remote database is used. |
| `idle` | Detects when the user stops interacting with their computer. This ensures time is not counted while the user is idle or away — preventing inflated statistics. |
| `alarms` | Creates a periodic heartbeat alarm (every 6 seconds) to flush in-memory tracking data to local storage, even if the service worker is restarted. |
| `notifications` | Used only for optional break reminders (e.g., "You've been on YouTube for 45 minutes"). Users can disable all notifications in settings. |

---

## Privacy Policy

FocusTrack does not collect, transmit, or store any user data on external servers.

- **Data collected:** Active domain names (e.g. `github.com`), time spent, visit count, and user-configured settings and goals.
- **Data NOT collected:** Full URLs, page content, text input, passwords, keystrokes, screenshots, form data, or browsing history outside of what is necessary for the core tracking feature.
- **Data storage:** All data is stored exclusively in `chrome.storage.local` — a sandboxed, on-device browser storage API.
- **Data sharing:** No data is shared with any third party. No analytics, no telemetry, no remote logging.
- **Account:** No account, email address, or personal information is required to use FocusTrack.

---

## Assets Required for Submission

- [ ] Icon 16×16 — `icons/icon-16.png` ✅
- [ ] Icon 48×48 — `icons/icon-48.png` ✅
- [ ] Icon 128×128 — `icons/icon-128.png` ✅
- [ ] Screenshot 1280×800 or 640×400 — Dashboard overview (TODO: capture from built extension)
- [ ] Small tile 440×280 (optional)
- [ ] Privacy policy URL (required) — publish and link

---

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-09-10 | Initial release — full tracking engine, dashboard, analytics, goals, focus mode, export |

---

## Pre-Publish Checklist

- [x] manifest_version: 3
- [x] All icon files exist at correct dimensions
- [x] No `eval()` or unsafe inline scripts
- [x] `tabs` permission required for `tab.url` access
- [x] Service worker stores no global in-memory state
- [x] No content scripts injected
- [x] No `<all_urls>` host_permissions
- [x] Privacy policy prepared
- [x] All permissions have specific plain-English justifications
- [ ] At least 1 screenshot at 1280×800 (need to capture from live extension)
- [ ] Privacy policy hosted at public URL
