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

const MAX_EVENTS = 5000;
const MAX_DATASET_DAYS = 120;

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await storageGet([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.EVENTS, STORAGE_KEYS.DAILY]);
  const patch = {};
  patch[STORAGE_KEYS.SETTINGS] = sanitizeSettings(existing[STORAGE_KEYS.SETTINGS]);
  if (!existing[STORAGE_KEYS.EVENTS]) patch[STORAGE_KEYS.EVENTS] = [];
  if (!existing[STORAGE_KEYS.DAILY]) patch[STORAGE_KEYS.DAILY] = {};
  await chrome.storage.local.set(patch);
});

async function openExtensionPopup() {
  try {
    if (chrome.action?.openPopup) {
      await chrome.action.openPopup();
    }
  } catch {
    // Chrome 127 미만 또는 사용자 제스처 없음 등 — 무시
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return false;

  if (message.type === "CHATPOOL_OPEN_POPUP") {
    openExtensionPopup()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "CHATPOOL_LOG_EVENT") {
    appendEvent(message.event)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "CHATPOOL_GET_DAILY_REPORT") {
    getDailyReport(message.dateKey)
      .then((report) => sendResponse({ ok: true, report }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "CHATPOOL_GET_REPORT_DATASETS") {
    getReportDatasets({
      fromDateKey: message.fromDateKey,
      toDateKey: message.toDateKey
    })
      .then((datasets) => sendResponse({ ok: true, datasets }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
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
  const stat = normalizeDailyStat(daily[day], day);

  if (safeEvent.type === "submit") {
    applySubmitToDailyStat(stat, safeEvent);
  } else if (safeEvent.type === "discard") {
    applyDiscardToDailyStat(stat, safeEvent);
  } else if (safeEvent.type === "draft_update") {
    applyDraftUpdateToDailyStat(stat, safeEvent);
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

function applySubmitToDailyStat(stat, safeEvent) {
  const session = safeEvent.session;

  stat.submitCount += 1;
  stat.totalSubmittedChars += safeEvent.charCount;
  stat.totalSubmittedTokens += safeEvent.estimatedTokens;
  stat.maxChars = Math.max(stat.maxChars || 0, safeEvent.charCount);
  stat.maxTokens = Math.max(stat.maxTokens || 0, safeEvent.estimatedTokens);

  if (safeEvent.level === "low") stat.lowCount += 1;
  if (safeEvent.level === "medium") stat.mediumCount += 1;
  if (safeEvent.level === "high") stat.highCount += 1;

  if (session) {
    stat.totalInitialChars += session.initialChars;
    stat.totalInitialTokens += session.initialTokens;
    stat.totalSessionMaxChars += session.maxChars;
    stat.totalSessionMaxTokens += session.maxTokens;
    stat.totalReducedChars += session.reducedChars;
    stat.totalReducedTokens += session.reducedTokens;
    stat.totalWritingDurationMs += session.durationMs;
    stat.maxReducedChars = Math.max(stat.maxReducedChars || 0, session.reducedChars);
    stat.maxReducedTokens = Math.max(stat.maxReducedTokens || 0, session.reducedTokens);
    stat.trimEventCount += session.trimEventCount || 0;
    stat.totalTrimmedDuringDraft += session.totalTrimmedDuringDraft || 0;
    stat.largestDropChars = Math.max(stat.largestDropChars || 0, session.largestDropChars || 0);

    if (session.levelAtMax === "high" && session.levelAtSend === "medium") {
      stat.highToMediumCount += 1;
    }
    if (session.levelAtMax === "medium" && session.levelAtSend === "low") {
      stat.mediumToLowCount += 1;
    }
  }

  const platform = safeEvent.platform || "unknown";
  stat.platformCounts[platform] = (stat.platformCounts[platform] || 0) + 1;
}

function applyDiscardToDailyStat(stat, safeEvent) {
  const session = safeEvent.session;
  stat.discardCount += 1;
  if (session) {
    stat.totalDiscardedMaxChars += session.maxChars;
    stat.totalDiscardedMaxTokens += session.maxTokens;
    stat.totalDiscardedDurationMs += session.durationMs;
  }

  const platform = safeEvent.platform || "unknown";
  stat.discardPlatformCounts[platform] = (stat.discardPlatformCounts[platform] || 0) + 1;
}

function applyDraftUpdateToDailyStat(stat, safeEvent) {
  const session = safeEvent.session;

  stat.draftUpdateCount += 1;
  stat.latestDraftAt = safeEvent.timestamp;
  stat.latestDraftChars = safeEvent.charCount;
  stat.latestDraftTokens = safeEvent.estimatedTokens;
  stat.latestDraftLevel = sanitizeLevel(safeEvent.level);
  stat.maxDraftChars = Math.max(stat.maxDraftChars || 0, safeEvent.charCount);
  stat.maxDraftTokens = Math.max(stat.maxDraftTokens || 0, safeEvent.estimatedTokens);
  stat.totalDraftObservedChars += safeEvent.charCount;
  stat.totalDraftObservedTokens += safeEvent.estimatedTokens;

  if (session) {
    stat.latestSessionMaxChars = Math.max(stat.latestSessionMaxChars || 0, session.maxChars || 0);
    stat.latestSessionMaxTokens = Math.max(stat.latestSessionMaxTokens || 0, session.maxTokens || 0);
  }

  const platform = safeEvent.platform || "unknown";
  stat.draftPlatformCounts[platform] = (stat.draftPlatformCounts[platform] || 0) + 1;
}

function isValidEvent(event) {
  return (
    event &&
    typeof event.timestamp === "number" &&
    ["level_change", "hover", "submit", "discard", "draft_update"].includes(event.type) &&
    typeof event.estimatedTokens === "number"
  );
}

function sanitizeEvent(event) {
  return {
    id: String(event.id || `${Date.now()}`),
    timestamp: Number(event.timestamp),
    designVariant: "tree-status-badge",
    platform: sanitizePlatform(event.platform),
    type: event.type,
    draftReason: event.draftReason ? String(event.draftReason).slice(0, 80) : "",
    submitSource: event.submitSource ? String(event.submitSource).slice(0, 80) : "",
    estimatedTokens: Math.max(0, Math.round(Number(event.estimatedTokens) || 0)),
    charCount: Math.max(0, Math.round(Number(event.charCount) || 0)),
    level: sanitizeLevel(event.level),
    languageMix: {
      hangul: Math.max(0, Math.round(Number(event.languageMix?.hangul) || 0)),
      cjk: Math.max(0, Math.round(Number(event.languageMix?.cjk) || 0)),
      other: Math.max(0, Math.round(Number(event.languageMix?.other) || 0))
    },
    session: sanitizeSession(event.session)
  };
}

function sanitizePlatform(platform) {
  return ["chatgpt", "gemini", "claude", "unknown"].includes(platform) ? platform : "unknown";
}

function sanitizeLevel(level) {
  return ["idle", "low", "medium", "high"].includes(level) ? level : "idle";
}

function sanitizeSession(session) {
  if (!session || typeof session !== "object") return null;

  const startedAt = Math.max(0, Number(session.startedAt) || 0);
  const sentAt = Math.max(0, Number(session.sentAt) || 0);
  const durationMs = Math.max(0, Math.round(Number(session.durationMs) || (sentAt && startedAt ? sentAt - startedAt : 0)));

  return {
    id: String(session.id || ""),
    platform: sanitizePlatform(session.platform),
    startedAt,
    sentAt,
    durationMs,

    initialChars: Math.max(0, Math.round(Number(session.initialChars) || 0)),
    initialTokens: Math.max(0, Math.round(Number(session.initialTokens) || 0)),

    maxChars: Math.max(0, Math.round(Number(session.maxChars) || 0)),
    maxTokens: Math.max(0, Math.round(Number(session.maxTokens) || 0)),

    finalChars: Math.max(0, Math.round(Number(session.finalChars) || 0)),
    finalTokens: Math.max(0, Math.round(Number(session.finalTokens) || 0)),

    levelAtMax: sanitizeLevel(session.levelAtMax),
    levelAtSend: sanitizeLevel(session.levelAtSend),

    reducedChars: Math.max(0, Math.round(Number(session.reducedChars) || 0)),
    reducedTokens: Math.max(0, Math.round(Number(session.reducedTokens) || 0)),

    trimEventCount: Math.max(0, Math.round(Number(session.trimEventCount) || 0)),
    totalTrimmedDuringDraft: Math.max(0, Math.round(Number(session.totalTrimmedDuringDraft) || 0)),
    largestDropChars: Math.max(0, Math.round(Number(session.largestDropChars) || 0)),

    wasDraft: Boolean(session.wasDraft),
    wasSent: Boolean(session.wasSent),
    wasDiscarded: Boolean(session.wasDiscarded)
  };
}

function normalizeDailyStat(value, dateKey) {
  const base = createEmptyDailyStat(dateKey);
  const stat = value && typeof value === "object" ? { ...base, ...value } : base;

  stat.date = stat.date || dateKey;
  stat.submitCount = toNonNegativeInt(stat.submitCount);
  stat.levelChangeCount = toNonNegativeInt(stat.levelChangeCount);
  stat.hoverCount = toNonNegativeInt(stat.hoverCount);
  stat.discardCount = toNonNegativeInt(stat.discardCount);
  stat.draftUpdateCount = toNonNegativeInt(stat.draftUpdateCount);

  stat.totalSubmittedChars = toNonNegativeInt(stat.totalSubmittedChars);
  stat.totalSubmittedTokens = toNonNegativeInt(stat.totalSubmittedTokens);
  stat.totalInitialChars = toNonNegativeInt(stat.totalInitialChars);
  stat.totalInitialTokens = toNonNegativeInt(stat.totalInitialTokens);
  stat.totalSessionMaxChars = toNonNegativeInt(stat.totalSessionMaxChars);
  stat.totalSessionMaxTokens = toNonNegativeInt(stat.totalSessionMaxTokens);

  stat.maxChars = toNonNegativeInt(stat.maxChars);
  stat.maxTokens = toNonNegativeInt(stat.maxTokens);

  stat.lowCount = toNonNegativeInt(stat.lowCount);
  stat.mediumCount = toNonNegativeInt(stat.mediumCount);
  stat.highCount = toNonNegativeInt(stat.highCount);

  stat.totalReducedChars = toNonNegativeInt(stat.totalReducedChars);
  stat.totalReducedTokens = toNonNegativeInt(stat.totalReducedTokens);
  stat.maxReducedChars = toNonNegativeInt(stat.maxReducedChars);
  stat.maxReducedTokens = toNonNegativeInt(stat.maxReducedTokens);
  stat.trimEventCount = toNonNegativeInt(stat.trimEventCount);
  stat.totalTrimmedDuringDraft = toNonNegativeInt(stat.totalTrimmedDuringDraft);
  stat.largestDropChars = toNonNegativeInt(stat.largestDropChars);

  stat.highToMediumCount = toNonNegativeInt(stat.highToMediumCount);
  stat.mediumToLowCount = toNonNegativeInt(stat.mediumToLowCount);

  stat.totalWritingDurationMs = toNonNegativeInt(stat.totalWritingDurationMs);
  stat.totalDiscardedMaxChars = toNonNegativeInt(stat.totalDiscardedMaxChars);
  stat.totalDiscardedMaxTokens = toNonNegativeInt(stat.totalDiscardedMaxTokens);
  stat.totalDiscardedDurationMs = toNonNegativeInt(stat.totalDiscardedDurationMs);

  stat.latestDraftAt = toNonNegativeInt(stat.latestDraftAt);
  stat.latestDraftChars = toNonNegativeInt(stat.latestDraftChars);
  stat.latestDraftTokens = toNonNegativeInt(stat.latestDraftTokens);
  stat.latestDraftLevel = sanitizeLevel(stat.latestDraftLevel);
  stat.maxDraftChars = toNonNegativeInt(stat.maxDraftChars);
  stat.maxDraftTokens = toNonNegativeInt(stat.maxDraftTokens);
  stat.totalDraftObservedChars = toNonNegativeInt(stat.totalDraftObservedChars);
  stat.totalDraftObservedTokens = toNonNegativeInt(stat.totalDraftObservedTokens);
  stat.latestSessionMaxChars = toNonNegativeInt(stat.latestSessionMaxChars);
  stat.latestSessionMaxTokens = toNonNegativeInt(stat.latestSessionMaxTokens);

  stat.platformCounts = normalizePlatformCounts(stat.platformCounts);
  stat.discardPlatformCounts = normalizePlatformCounts(stat.discardPlatformCounts);
  stat.draftPlatformCounts = normalizePlatformCounts(stat.draftPlatformCounts);

  return stat;
}

function createEmptyDailyStat(dateKey) {
  return {
    date: dateKey,

    submitCount: 0,
    levelChangeCount: 0,
    hoverCount: 0,
    discardCount: 0,
    draftUpdateCount: 0,

    totalSubmittedChars: 0,
    totalSubmittedTokens: 0,
    totalInitialChars: 0,
    totalInitialTokens: 0,
    totalSessionMaxChars: 0,
    totalSessionMaxTokens: 0,

    maxChars: 0,
    maxTokens: 0,

    lowCount: 0,
    mediumCount: 0,
    highCount: 0,

    totalReducedChars: 0,
    totalReducedTokens: 0,
    maxReducedChars: 0,
    maxReducedTokens: 0,
    trimEventCount: 0,
    totalTrimmedDuringDraft: 0,
    largestDropChars: 0,

    highToMediumCount: 0,
    mediumToLowCount: 0,

    totalWritingDurationMs: 0,
    totalDiscardedMaxChars: 0,
    totalDiscardedMaxTokens: 0,
    totalDiscardedDurationMs: 0,

    latestDraftAt: 0,
    latestDraftChars: 0,
    latestDraftTokens: 0,
    latestDraftLevel: "idle",
    maxDraftChars: 0,
    maxDraftTokens: 0,
    totalDraftObservedChars: 0,
    totalDraftObservedTokens: 0,
    latestSessionMaxChars: 0,
    latestSessionMaxTokens: 0,

    platformCounts: {
      chatgpt: 0,
      gemini: 0,
      claude: 0,
      unknown: 0
    },
    discardPlatformCounts: {
      chatgpt: 0,
      gemini: 0,
      claude: 0,
      unknown: 0
    },
    draftPlatformCounts: {
      chatgpt: 0,
      gemini: 0,
      claude: 0,
      unknown: 0
    }
  };
}

async function getDailyReport(dateKey) {
  const result = await storageGet([STORAGE_KEYS.DAILY]);
  const daily = result[STORAGE_KEYS.DAILY] || {};
  const targetDateKey = sanitizeDateKey(dateKey) || getLocalDateKey(Date.now());
  return buildDailyReport(daily, targetDateKey);
}

function buildDailyReport(daily, dateKey) {
  const today = normalizeDailyStat(daily[dateKey], dateKey);
  const yesterdayKey = getRelativeDateKey(dateKey, -1);
  const yesterday = normalizeDailyStat(daily[yesterdayKey], yesterdayKey);

  const totalSent = today.submitCount || 0;
  const yesterdayTotalSent = yesterday.submitCount || 0;

  const avgFinalChars = safeAverage(today.totalSubmittedChars, totalSent);
  const avgFinalTokens = safeAverage(today.totalSubmittedTokens, totalSent);
  const avgInitialChars = safeAverage(today.totalInitialChars, totalSent);
  const avgInitialTokens = safeAverage(today.totalInitialTokens, totalSent);
  const avgMaxChars = safeAverage(today.totalSessionMaxChars, totalSent);
  const avgMaxTokens = safeAverage(today.totalSessionMaxTokens, totalSent);
  const avgReducedChars = safeAverage(today.totalReducedChars, totalSent);
  const avgReducedTokens = safeAverage(today.totalReducedTokens, totalSent);
  const avgWritingDurationMs = safeAverage(today.totalWritingDurationMs, totalSent);

  const yesterdayAvgFinalChars = safeAverage(yesterday.totalSubmittedChars, yesterdayTotalSent);
  const yesterdayAvgFinalTokens = safeAverage(yesterday.totalSubmittedTokens, yesterdayTotalSent);

  const lowRatioPct = safePercent(today.lowCount, totalSent);
  const mediumRatioPct = safePercent(today.mediumCount, totalSent);
  const highRatioPct = safePercent(today.highCount, totalSent);
  const efficientFlowPct = safePercent((today.lowCount || 0) + (today.mediumCount || 0), totalSent);
  const highAvoidancePct = safePercent(today.highToMediumCount + today.mediumToLowCount, totalSent);
  const yesterdayHighRatioPct = safePercent(yesterday.highCount, yesterdayTotalSent);

  const report = {
    dateKey,
    generatedAt: Date.now(),

    totalSent,
    discardCount: today.discardCount || 0,
    draftUpdateCount: today.draftUpdateCount || 0,
    levelChangeCount: today.levelChangeCount || 0,
    hoverCount: today.hoverCount || 0,

    latestDraftAt: today.latestDraftAt || 0,
    latestDraftChars: today.latestDraftChars || 0,
    latestDraftTokens: today.latestDraftTokens || 0,
    latestDraftLevel: today.latestDraftLevel || "idle",
    maxDraftChars: today.maxDraftChars || 0,
    maxDraftTokens: today.maxDraftTokens || 0,
    avgDraftObservedChars: safeAverage(today.totalDraftObservedChars, today.draftUpdateCount || 0),
    avgDraftObservedTokens: safeAverage(today.totalDraftObservedTokens, today.draftUpdateCount || 0),

    avgInitialChars,
    avgInitialTokens,
    avgMaxChars,
    avgMaxTokens,
    avgFinalChars,
    avgFinalTokens,

    maxChars: today.maxChars || 0,
    maxTokens: today.maxTokens || 0,

    lowCount: today.lowCount || 0,
    mediumCount: today.mediumCount || 0,
    highCount: today.highCount || 0,

    lowRatioPct,
    mediumRatioPct,
    highRatioPct,
    efficientFlowPct,
    highAvoidancePct,

    avgReducedChars,
    avgReducedTokens,
    totalReducedChars: today.totalReducedChars || 0,
    totalReducedTokens: today.totalReducedTokens || 0,
    maxReducedChars: today.maxReducedChars || 0,
    maxReducedTokens: today.maxReducedTokens || 0,
    trimEventCount: today.trimEventCount || 0,
    totalTrimmedDuringDraft: today.totalTrimmedDuringDraft || 0,
    avgTrimmedDuringDraft: safeAverage(today.totalTrimmedDuringDraft, today.submitCount || 0),
    largestDropChars: today.largestDropChars || 0,

    highToMediumCount: today.highToMediumCount || 0,
    mediumToLowCount: today.mediumToLowCount || 0,

    avgWritingDurationMs,
    avgWritingDurationSec: Math.round(avgWritingDurationMs / 1000),

    avgDiscardedMaxChars: safeAverage(today.totalDiscardedMaxChars, today.discardCount || 0),
    avgDiscardedMaxTokens: safeAverage(today.totalDiscardedMaxTokens, today.discardCount || 0),

    platformCounts: normalizePlatformCounts(today.platformCounts),
    discardPlatformCounts: normalizePlatformCounts(today.discardPlatformCounts),
    draftPlatformCounts: normalizePlatformCounts(today.draftPlatformCounts),

    diffAvgChars: avgFinalChars - yesterdayAvgFinalChars,
    diffAvgTokens: avgFinalTokens - yesterdayAvgFinalTokens,
    diffHighRatioPct: highRatioPct - yesterdayHighRatioPct
  };

  report.message = buildReportMessage(report);
  return report;
}

async function getReportDatasets(options = {}) {
  const result = await storageGet([STORAGE_KEYS.EVENTS, STORAGE_KEYS.DAILY]);
  const events = Array.isArray(result[STORAGE_KEYS.EVENTS]) ? result[STORAGE_KEYS.EVENTS] : [];
  const daily = result[STORAGE_KEYS.DAILY] || {};

  const toDateKey = sanitizeDateKey(options.toDateKey) || getLocalDateKey(Date.now());
  const fromDateKey = sanitizeDateKey(options.fromDateKey) || getRelativeDateKey(toDateKey, -6);
  const dateKeys = getDateKeyRange(fromDateKey, toDateKey, MAX_DATASET_DAYS);
  const dateKeySet = new Set(dateKeys);

  const dailyStats = dateKeys.map((dateKey) => normalizeDailyStat(daily[dateKey], dateKey));
  const dailyReports = dateKeys.map((dateKey) => buildDailyReport(daily, dateKey));
  const promptEvents = events
    .map(sanitizeEvent)
    .filter((event) => dateKeySet.has(getLocalDateKey(event.timestamp)));

  const submitEvents = promptEvents.filter((event) => event.type === "submit");
  const discardEvents = promptEvents.filter((event) => event.type === "discard");
  const draftEvents = promptEvents.filter((event) => event.type === "draft_update");

  return {
    generatedAt: Date.now(),
    range: { fromDateKey, toDateKey },
    dateKeys,
    dailyStats,
    dailyReports,
    promptEvents,
    submitEvents,
    discardEvents,
    draftEvents,
    summary: buildDatasetSummary(dailyReports)
  };
}

function buildDatasetSummary(dailyReports) {
  const totalSent = sum(dailyReports.map((report) => report.totalSent));
  const totalDiscarded = sum(dailyReports.map((report) => report.discardCount));
  const totalReducedChars = sum(dailyReports.map((report) => report.totalReducedChars));
  const totalReducedTokens = sum(dailyReports.map((report) => report.totalReducedTokens));
  const totalHigh = sum(dailyReports.map((report) => report.highCount));
  const totalDraftUpdates = sum(dailyReports.map((report) => report.draftUpdateCount));
  const totalTrimEvents = sum(dailyReports.map((report) => report.trimEventCount));
  const totalTrimmedDuringDraft = sum(dailyReports.map((report) => report.totalTrimmedDuringDraft));
  const largestDropChars = Math.max(0, ...dailyReports.map((report) => Number(report.largestDropChars) || 0));
  const maxDraftTokens = Math.max(0, ...dailyReports.map((report) => Number(report.maxDraftTokens) || 0));
  const totalLow = sum(dailyReports.map((report) => report.lowCount));
  const totalMedium = sum(dailyReports.map((report) => report.mediumCount));

  return {
    totalSent,
    totalDiscarded,
    totalReducedChars,
    totalReducedTokens,
    totalDraftUpdates,
    totalTrimEvents,
    totalTrimmedDuringDraft,
    largestDropChars,
    maxDraftTokens,
    lowRatioPct: safePercent(totalLow, totalSent),
    mediumRatioPct: safePercent(totalMedium, totalSent),
    highRatioPct: safePercent(totalHigh, totalSent),
    efficientFlowPct: safePercent(totalLow + totalMedium, totalSent),
    avgReducedChars: safeAverage(totalReducedChars, totalSent),
    avgReducedTokens: safeAverage(totalReducedTokens, totalSent)
  };
}


function buildReportMessage(report) {
  if (report.totalSent === 0 && report.latestDraftTokens > 0) return "현재 작성 중인 입력이 감지됐어요. 전송하면 일간 리포트에 반영됩니다.";
  if (report.totalSent === 0) return "아직 오늘 전송한 프롬프트가 없어요.";
  if (report.diffAvgChars < 0) return `어제보다 평균 ${Math.abs(report.diffAvgChars)}자 줄었어요.`;
  if (report.diffAvgChars > 0) return `어제보다 평균 ${report.diffAvgChars}자 길어졌어요.`;
  if (report.highToMediumCount > 0) return `high에서 medium으로 줄인 프롬프트가 ${report.highToMediumCount}개 있었어요.`;
  if (report.efficientFlowPct >= 80) return "대부분 적정 길이 안에서 프롬프트를 작성했어요.";
  return "오늘의 프롬프팅 기록이 저장되었어요.";
}

function safeAverage(total, count) {
  if (!count) return 0;
  return Math.round((Number(total) || 0) / count);
}

function safePercent(value, total) {
  if (!total) return 0;
  return Math.round(((Number(value) || 0) / total) * 100);
}

function sum(values) {
  return values.reduce((acc, value) => acc + (Number(value) || 0), 0);
}

function toNonNegativeInt(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function normalizePlatformCounts(value) {
  return {
    chatgpt: toNonNegativeInt(value?.chatgpt),
    gemini: toNonNegativeInt(value?.gemini),
    claude: toNonNegativeInt(value?.claude),
    unknown: toNonNegativeInt(value?.unknown)
  };
}

function sanitizeDateKey(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function getDateKeyRange(fromDateKey, toDateKey, maxDays) {
  const result = [];
  let cursor = sanitizeDateKey(fromDateKey) || getLocalDateKey(Date.now());
  const end = sanitizeDateKey(toDateKey) || cursor;

  for (let i = 0; i < maxDays; i += 1) {
    result.push(cursor);
    if (cursor === end) break;
    cursor = getRelativeDateKey(cursor, 1);
    if (cursor > end) break;
  }

  return result;
}

function getRelativeDateKey(dateKey, offsetDays) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return getLocalDateKey(date.getTime());
}

function getLocalDateKey(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
