"use strict";

const STORAGE_KEYS = {
  SETTINGS: "chatpool.settings"
};

const DEFAULT_SETTINGS = {
  enabled: true,
  designVariant: "tree-status-badge",
  nudgeTextScale: 80,
  floatingLogoScale: 80,
  floatingLogoPlacement: "top-right",
  dragEnabled: false,
  customPosition: null,
  onboardingGuideShown: false,
  thresholds: { lowMax: 100, mediumMax: 400 }
};

const CATEGORY_LABELS = {
  all: "전체",
  input_quality: "입력 품질",
  format: "형식",
  writing: "글쓰기",
  research: "조사",
  analysis: "분석·기획",
  summary: "요약",
  study: "공부",
  code: "개발",
  structure: "구조화",
  meta_prompt: "메타 프롬프트",
  general: "일반"
};

const CATEGORY_ORDER = [
  "all",
  "input_quality",
  "format",
  "writing",
  "research",
  "analysis",
  "summary",
  "study",
  "code",
  "structure",
  "meta_prompt",
  "general"
];

const $ = (selector) => document.querySelector(selector);
const tips = Array.isArray(window.CHATPULL_PROMPT_TIPS) ? window.CHATPULL_PROMPT_TIPS : [];
let activeCategory = "all";
let libraryOpen = false;
let usageOpen = false;

const nodes = {
  enabled: $("#enabled"),
  toggleTips: $("#toggleTips"),
  tipLibrary: $("#tipLibrary"),
  toggleUsage: $("#toggleUsage"),
  usageGuide: $("#usageGuide"),
  tipTotal: $("#tipTotal"),
  categoryTabs: $("#categoryTabs"),
  activeCategoryName: $("#activeCategoryName"),
  activeCategoryCount: $("#activeCategoryCount"),
  tipList: $("#tipList")
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
  const result = await storageGet([STORAGE_KEYS.SETTINGS]);
  return {
    settings: sanitizeSettings(merge(DEFAULT_SETTINGS, result[STORAGE_KEYS.SETTINGS] || {}))
  };
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
  next.onboardingGuideShown = Boolean(next.onboardingGuideShown);
  return next;
}
function merge(base, patch) {
  const result = { ...base };
  Object.keys(patch || {}).forEach((key) => {
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && base[key]) result[key] = merge(base[key], patch[key]);
    else result[key] = patch[key];
  });
  return result;
}
function render(state) {
  nodes.enabled.checked = Boolean(state.settings.enabled);
  renderTipLibrary();
}
function bindEvents(settings) {
  nodes.enabled.addEventListener("change", () => updateSetting({ enabled: nodes.enabled.checked }));
  nodes.toggleUsage?.addEventListener("click", toggleUsageGuide);
  nodes.toggleTips.addEventListener("click", toggleTipLibrary);

  async function updateSetting(patch) {
    const next = sanitizeSettings(merge(settings, patch));
    Object.assign(settings, next);
    await storageSet({ [STORAGE_KEYS.SETTINGS]: next });
    render(await getState());
  }
}

function toggleUsageGuide() {
  usageOpen = !usageOpen;
  nodes.usageGuide.hidden = !usageOpen;
  nodes.toggleUsage.setAttribute("aria-expanded", String(usageOpen));
  nodes.toggleUsage.textContent = usageOpen ? "사용 팁 접기" : "사용 팁 열기";
}

function toggleTipLibrary() {
  libraryOpen = !libraryOpen;
  nodes.tipLibrary.hidden = !libraryOpen;
  nodes.toggleTips.setAttribute("aria-expanded", String(libraryOpen));
  nodes.toggleTips.textContent = libraryOpen ? "프롬프트 팁 모음 접기" : "프롬프트 팁 모음 열기";
  if (libraryOpen) renderTipLibrary();
}

function renderTipLibrary() {
  nodes.tipTotal.textContent = `${tips.length}개`;
  renderCategoryTabs();
  renderActiveTips();
}

function renderCategoryTabs() {
  const counts = tips.reduce((acc, tip) => {
    const category = tip.category || "general";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, { all: tips.length });

  const categories = CATEGORY_ORDER.filter((category) => category === "all" || counts[category]);
  nodes.categoryTabs.innerHTML = categories.map((category) => {
    const selected = category === activeCategory;
    return `<button class="category-tab" type="button" role="tab" data-category="${escapeHtml(category)}" aria-selected="${selected}">${escapeHtml(CATEGORY_LABELS[category] || category)} ${counts[category] || 0}</button>`;
  }).join("");

  nodes.categoryTabs.querySelectorAll(".category-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";
      renderTipLibrary();
    });
  });
}

function renderActiveTips() {
  const selectedTips = activeCategory === "all" ? tips : tips.filter((tip) => tip.category === activeCategory);
  nodes.activeCategoryName.textContent = CATEGORY_LABELS[activeCategory] || activeCategory;
  nodes.activeCategoryCount.textContent = `${selectedTips.length}개`;
  nodes.tipList.innerHTML = selectedTips.map((tip) => {
    const levels = Array.isArray(tip.level) ? tip.level.join(" · ") : "전체";
    const category = CATEGORY_LABELS[tip.category] || tip.category || "일반";
    return `
      <article class="tip-item">
        <p>${escapeHtml(tip.text || "")}</p>
        <small>${escapeHtml(category)} · ${escapeHtml(levels)}</small>
      </article>
    `;
  }).join("") || '<article class="tip-item"><p>표시할 팁이 없습니다.</p></article>';
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
