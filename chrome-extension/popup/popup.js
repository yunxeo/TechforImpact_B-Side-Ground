"use strict";

const STORAGE_KEYS = {
  SETTINGS: "chatpool.settings",
  EVENTS: "chatpool.events",
  DAILY: "chatpool.daily"
};

const DEFAULT_SETTINGS = {
  enabled: true,
  designVariant: "tree-status-badge",
  nudgeTextScale: 90,
  floatingLogoScale: 90,
  floatingLogoPlacement: "chat-left",
  dragEnabled: false,
  customPosition: null,
  thresholds: { lowMax: 100, mediumMax: 400 }
};

const $ = (selector) => document.querySelector(selector);
const nodes = {
  enabled: $("#enabled"),
  floatingLogoPlacement: $("#floatingLogoPlacement"),
  dragEnabled: $("#dragEnabled"),
  resetCustomPosition: $("#resetCustomPosition"),
  submitCount: $("#submitCount"),
  totalTokens: $("#totalTokens"),
  maxTokens: $("#maxTokens"),
  highCount: $("#highCount"),
  events: $("#events"),
  openChatGPT: $("#openChatGPT"),
  openGemini: $("#openGemini"),
  clearLogs: $("#clearLogs")
};

boot();

async function boot() {
  const state = await getState();
  render(state);
  bindEvents(state.settings);
}

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}
function storageSet(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}
async function getState() {
  const result = await storageGet([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.EVENTS, STORAGE_KEYS.DAILY]);
  return {
    settings: sanitizeSettings(merge(DEFAULT_SETTINGS, result[STORAGE_KEYS.SETTINGS] || {})),
    events: Array.isArray(result[STORAGE_KEYS.EVENTS]) ? result[STORAGE_KEYS.EVENTS] : [],
    daily: result[STORAGE_KEYS.DAILY] || {}
  };
}
function sanitizeSettings(value) {
  const next = merge(DEFAULT_SETTINGS, value || {});
  next.enabled = Boolean(next.enabled);
  next.designVariant = "tree-status-badge";
  next.nudgeTextScale = 90;
  next.floatingLogoScale = 90;
  if (!["chat-left", "top-left", "top-center", "top-right", "chat-right"].includes(next.floatingLogoPlacement)) next.floatingLogoPlacement = DEFAULT_SETTINGS.floatingLogoPlacement;
  next.dragEnabled = Boolean(next.dragEnabled);
  next.customPosition = sanitizeCustomPosition(next.customPosition);
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
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && base[key]) result[key] = merge(base[key], patch[key]);
    else result[key] = patch[key];
  });
  return result;
}
function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function render(state) {
  nodes.enabled.checked = Boolean(state.settings.enabled);
  nodes.floatingLogoPlacement.value = state.settings.floatingLogoPlacement || DEFAULT_SETTINGS.floatingLogoPlacement;
  nodes.dragEnabled.checked = Boolean(state.settings.dragEnabled);
  const today = state.daily[todayKey()] || {};
  nodes.submitCount.textContent = `${today.submitCount || 0}회`;
  nodes.totalTokens.textContent = `${(today.totalSubmittedTokens || 0).toLocaleString()} tokens`;
  nodes.maxTokens.textContent = `${(today.maxTokens || 0).toLocaleString()} tokens`;
  nodes.highCount.textContent = `${today.highCount || 0}회`;
  nodes.events.innerHTML = "";
  const recent = state.events.slice(-7).reverse();
  if (recent.length === 0) {
    const li = document.createElement("li");
    li.textContent = "아직 로그가 없습니다.";
    nodes.events.append(li);
    return;
  }
  for (const event of recent) {
    const li = document.createElement("li");
    li.textContent = `${formatTime(event.timestamp)} · ${labelType(event.type)} · ${event.estimatedTokens.toLocaleString()} tokens · ${labelLevel(event.level)}`;
    nodes.events.append(li);
  }
}
function bindEvents(settings) {
  nodes.enabled.addEventListener("change", () => updateSetting({ enabled: nodes.enabled.checked }));
  nodes.floatingLogoPlacement.addEventListener("change", () => updateSetting({ floatingLogoPlacement: nodes.floatingLogoPlacement.value, customPosition: null }));
  nodes.dragEnabled.addEventListener("change", () => updateSetting({ dragEnabled: nodes.dragEnabled.checked }));
  nodes.resetCustomPosition.addEventListener("click", () => updateSetting({ customPosition: null }));
  nodes.openChatGPT.addEventListener("click", () => chrome.tabs.create({ url: "https://chatgpt.com/" }));
  nodes.openGemini.addEventListener("click", () => chrome.tabs.create({ url: "https://gemini.google.com/" }));
  nodes.clearLogs.addEventListener("click", async () => {
    await storageSet({ [STORAGE_KEYS.EVENTS]: [], [STORAGE_KEYS.DAILY]: {} });
    render(await getState());
  });
  async function updateSetting(patch) {
    const next = sanitizeSettings(merge(settings, patch));
    Object.assign(settings, next);
    await storageSet({ [STORAGE_KEYS.SETTINGS]: next });
    render(await getState());
  }
}
function formatTime(timestamp) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}
function labelType(type) {
  return { submit: "전송", level_change: "레벨 변경", hover: "hover" }[type] || type;
}
function labelLevel(level) {
  return { idle: "대기", low: "낮음", medium: "중간", high: "높음" }[level] || level;
}
