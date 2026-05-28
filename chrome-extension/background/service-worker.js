"use strict";

const STORAGE_KEYS = {
  SETTINGS: "chatpool.settings",
  EVENTS: "chatpool.events",
  DAILY: "chatpool.daily"
};

const DEFAULT_SETTINGS = {
  enabled: true,
  designVariant: "tree-status-badge",
  nudgeTextScale: 80,
  floatingLogoScale: 80,
  floatingLogoPlacement: "top-right",
  dragEnabled: false,
  customPosition: null,
  thresholds: {
    lowMax: 100,
    mediumMax: 400
  }
};

const MAX_EVENTS = 400;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await storageGet([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.EVENTS, STORAGE_KEYS.DAILY]);
  const patch = {};
  patch[STORAGE_KEYS.SETTINGS] = sanitizeSettings(existing[STORAGE_KEYS.SETTINGS]);
  if (!existing[STORAGE_KEYS.EVENTS]) patch[STORAGE_KEYS.EVENTS] = [];
  if (!existing[STORAGE_KEYS.DAILY]) patch[STORAGE_KEYS.DAILY] = {};
  await chrome.storage.local.set(patch);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "CHATPOOL_LOG_EVENT") return false;
  appendEvent(message.event)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function sanitizeSettings(value) {
  const next = merge(DEFAULT_SETTINGS, value || {});
  next.enabled = Boolean(next.enabled);
  next.designVariant = "tree-status-badge";
  next.nudgeTextScale = 80;
  next.floatingLogoScale = 80;
  next.floatingLogoPlacement = "top-right";
  next.dragEnabled = false;
  next.customPosition = null;
  next.thresholds.lowMax = Math.max(20, Math.round(Number(next.thresholds.lowMax) || DEFAULT_SETTINGS.thresholds.lowMax));
  next.thresholds.mediumMax = Math.max(next.thresholds.lowMax + 50, Math.round(Number(next.thresholds.mediumMax) || DEFAULT_SETTINGS.thresholds.mediumMax));
  return next;
}

function sanitizeCustomPosition(value) {
  if (!value || typeof value !== "object") return null;
  const xRatio = Number(value.xRatio);
  const yRatio = Number(value.yRatio);
  if (!Number.isFinite(xRatio) || !Number.isFinite(yRatio)) return null;
  return { xRatio: clamp(xRatio, 0, 1), yRatio: clamp(yRatio, 0, 1) };
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function merge(base, patch) {
  const result = { ...base };
  Object.keys(patch || {}).forEach((key) => {
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      result[key] = merge(base[key], patch[key]);
    } else {
      result[key] = patch[key];
    }
  });
  return result;
}

async function appendEvent(event) {
  if (!isValidEvent(event)) return;

  const result = await storageGet([STORAGE_KEYS.EVENTS, STORAGE_KEYS.DAILY]);
  const events = Array.isArray(result[STORAGE_KEYS.EVENTS]) ? result[STORAGE_KEYS.EVENTS] : [];
  const daily = result[STORAGE_KEYS.DAILY] || {};
  const safeEvent = sanitizeEvent(event);
  events.push(safeEvent);
  const trimmedEvents = events.slice(-MAX_EVENTS);

  const day = getLocalDateKey(safeEvent.timestamp);
  const stat = daily[day] || {
    date: day,
    submitCount: 0,
    levelChangeCount: 0,
    hoverCount: 0,
    totalSubmittedTokens: 0,
    maxTokens: 0,
    highCount: 0
  };

  if (safeEvent.type === "submit") {
    stat.submitCount += 1;
    stat.totalSubmittedTokens += safeEvent.estimatedTokens;
    stat.maxTokens = Math.max(stat.maxTokens, safeEvent.estimatedTokens);
    if (safeEvent.level === "high") stat.highCount += 1;
  } else if (safeEvent.type === "level_change") {
    stat.levelChangeCount += 1;
  } else if (safeEvent.type === "hover") {
    stat.hoverCount += 1;
  }

  daily[day] = stat;
  await chrome.storage.local.set({
    [STORAGE_KEYS.EVENTS]: trimmedEvents,
    [STORAGE_KEYS.DAILY]: daily
  });
}

function isValidEvent(event) {
  return event && typeof event.timestamp === "number" && ["level_change", "hover", "submit"].includes(event.type) && typeof event.estimatedTokens === "number";
}

function sanitizeEvent(event) {
  return {
    id: String(event.id || `${Date.now()}`),
    timestamp: Number(event.timestamp),
    designVariant: "tree-status-badge",
    type: event.type,
    estimatedTokens: Math.max(0, Math.round(Number(event.estimatedTokens) || 0)),
    charCount: Math.max(0, Math.round(Number(event.charCount) || 0)),
    level: ["idle", "low", "medium", "high"].includes(event.level) ? event.level : "idle",
    languageMix: {
      hangul: Math.max(0, Math.round(Number(event.languageMix?.hangul) || 0)),
      cjk: Math.max(0, Math.round(Number(event.languageMix?.cjk) || 0)),
      other: Math.max(0, Math.round(Number(event.languageMix?.other) || 0))
    }
  };
}

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
