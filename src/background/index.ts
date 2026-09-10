import { TrackingEngine } from '../tracking/engine';
import { StorageService } from '../services/storage';

const engine = TrackingEngine.getInstance();

// 1. Initialize engine on service worker startup
engine.init().catch(console.error);

// 2. Set up heartbeat alarm (every 1 minute or periodic check)
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('focustrack_heartbeat', { periodInMinutes: 0.1 });
  chrome.alarms.create('focustrack_daily_alarm', { periodInMinutes: 5 });
}

// 3. Register Chrome API listeners
if (typeof chrome !== 'undefined') {
  // Installation event
  chrome.runtime?.onInstalled?.addListener(async (details) => {
    if (details.reason === 'install') {
      const settings = await StorageService.getSettings();
      await StorageService.saveSettings({ onboardingCompleted: false });
      // Open dashboard onboarding tab automatically
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html?onboarding=true') });
    }
  });

  // Tab activation change
  chrome.tabs?.onActivated?.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      await engine.onTabChanged(tab.id || null, tab.url || null);
    } catch (e) {
      await engine.onTabChanged(null, null);
    }
  });

  // Tab URL update
  chrome.tabs?.onUpdated?.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' || changeInfo.url) {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab && activeTab.id === tabId) {
        await engine.onTabChanged(tabId, tab.url || null);
      }
    }
  });

  // Window focus change
  chrome.windows?.onFocusChanged?.addListener(async (windowId) => {
    await engine.onWindowFocusChanged(windowId);
  });

  // Idle state change
  chrome.idle?.onStateChanged?.addListener(async (newState) => {
    await engine.onIdleStateChanged(newState);
  });

  // Alarm event
  chrome.alarms?.onAlarm?.addListener(async (alarm) => {
    if (alarm.name === 'focustrack_heartbeat') {
      await engine.flushCurrentSession();
    }
  });

  // Message passing handler
  chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case 'PAUSE_TRACKING':
            await engine.setPauseStatus(message.minutes ?? 30);
            sendResponse({ success: true });
            break;
          case 'RESUME_TRACKING':
            await engine.setPauseStatus(null);
            sendResponse({ success: true });
            break;
          case 'FLUSH_TRACKING':
            await engine.flushCurrentSession();
            sendResponse({ success: true });
            break;
          case 'GET_CURRENT_STATE':
            await engine.flushCurrentSession();
            const state = await StorageService.getCurrentState();
            const today = await StorageService.getTodayActivity();
            sendResponse({ state, today });
            break;
          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (err: any) {
        sendResponse({ error: err.message || 'Error processing message' });
      }
    })();
    return true; // Keep message channel open for async response
  });
}

// 4. Live periodic interval while service worker is active
setInterval(() => {
  engine.flushCurrentSession().catch(console.error);
}, 5000);
