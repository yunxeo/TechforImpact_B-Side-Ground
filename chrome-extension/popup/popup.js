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
let reportOpen = false;
let latestReport = null;

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
  tipList: $("#tipList"),

  toggleReport: $("#toggleReport"),
  reportPanel: $("#reportPanel"),
  reportUpdatedAt: $("#reportUpdatedAt"),
  reportStatus: $("#reportStatus"),
  reportSummary: $("#reportSummary"),
  efficientFlowText: $("#efficientFlowText"),
  reportLevelBars: $("#reportLevelBars"),
  reportMetrics: $("#reportMetrics"),
  reportMessage: $("#reportMessage"),
  refreshReport: $("#refreshReport")
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
  nodes.toggleReport?.addEventListener("click", toggleReportPanel);
  nodes.refreshReport?.addEventListener("click", loadAndRenderReport);

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


async function toggleReportPanel() {
  reportOpen = !reportOpen;
  nodes.reportPanel.hidden = !reportOpen;
  nodes.toggleReport.setAttribute("aria-expanded", String(reportOpen));
  nodes.toggleReport.textContent = reportOpen ? "리포트 접기" : "리포트 열기";
  if (reportOpen) await loadAndRenderReport();
}

async function loadAndRenderReport() {
  setReportStatus("리포트 데이터를 불러오는 중입니다.");
  try {
    const response = await sendRuntimeMessage({ type: "CHATPOOL_GET_DAILY_REPORT" });
    if (!response?.ok) throw new Error(response?.error || "리포트 데이터를 불러오지 못했습니다.");
    latestReport = response.report || null;
    renderReport(latestReport);
  } catch (error) {
    latestReport = null;
    setReportStatus(`리포트 데이터를 불러오지 못했습니다. ${String(error?.message || error)}`);
    renderEmptyReport();
  }
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

function renderReport(report) {
  if (!report) {
    renderEmptyReport();
    return;
  }

  nodes.reportStatus.hidden = true;
  nodes.reportUpdatedAt.textContent = `${report.dateKey || "오늘"} 기준`;

  nodes.reportSummary.innerHTML = [
    reportSummaryCard(`${formatNumber(report.totalSent)}회`, "오늘 전송"),
    reportSummaryCard(`${formatNumber(report.avgFinalChars)}자`, "평균 입력"),
    reportSummaryCard(`${formatNumber(report.avgFinalTokens)} tokens`, "평균 예상 토큰"),
    reportSummaryCard(`${formatNumber(report.efficientFlowPct)}%`, "Efficient Flow")
  ].join("");

  nodes.efficientFlowText.textContent = `Efficient Flow ${formatNumber(report.efficientFlowPct)}%`;
  nodes.reportLevelBars.innerHTML = [
    levelBar("Low", report.lowRatioPct, "low"),
    levelBar("Medium", report.mediumRatioPct, "medium"),
    levelBar("High", report.highRatioPct, "high")
  ].join("");

  nodes.reportMetrics.innerHTML = [
    metricItem("최근 입력 예상 토큰", `${formatNumber(report.latestDraftTokens)} tokens`),
    metricItem("작성 중 최대 토큰", `${formatNumber(report.maxDraftTokens)} tokens`),
    metricItem("전송 전 평균 줄인 글자", `${formatNumber(report.avgReducedChars)}자`),
    metricItem("오늘 전체 줄인 글자", `${formatNumber(report.totalReducedChars)}자`),
    metricItem("high → medium 전환", `${formatNumber(report.highToMediumCount)}회`),
    metricItem("작성 후 삭제", `${formatNumber(report.discardCount)}회`),
    metricItem("플랫폼", formatPlatformCounts(report.platformCounts))
  ].join("");

  nodes.reportMessage.textContent = report.message || "오늘의 프롬프팅 기록이 저장되었어요.";
}

function renderEmptyReport() {
  nodes.reportUpdatedAt.textContent = "오늘 데이터 기준";
  nodes.reportSummary.innerHTML = [
    reportSummaryCard("0회", "오늘 전송"),
    reportSummaryCard("0자", "평균 입력"),
    reportSummaryCard("0 tokens", "평균 예상 토큰"),
    reportSummaryCard("0%", "Efficient Flow")
  ].join("");
  nodes.efficientFlowText.textContent = "Efficient Flow 0%";
  nodes.reportLevelBars.innerHTML = [
    levelBar("Low", 0, "low"),
    levelBar("Medium", 0, "medium"),
    levelBar("High", 0, "high")
  ].join("");
  nodes.reportMetrics.innerHTML = [
    metricItem("최근 입력 예상 토큰", "0 tokens"),
    metricItem("작성 중 최대 토큰", "0 tokens"),
    metricItem("전송 전 평균 줄인 글자", "0자"),
    metricItem("오늘 전체 줄인 글자", "0자"),
    metricItem("high → medium 전환", "0회"),
    metricItem("작성 후 삭제", "0회"),
    metricItem("플랫폼", "ChatGPT 0 · Gemini 0")
  ].join("");
  nodes.reportMessage.textContent = "아직 오늘 전송한 프롬프트가 없어요.";
}

function setReportStatus(message) {
  nodes.reportStatus.hidden = false;
  nodes.reportStatus.textContent = message;
}

function reportSummaryCard(value, label) {
  return `
    <article class="report-summary-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function levelBar(label, value, level) {
  const pct = clampPercent(value);
  return `
    <div class="report-level-row">
      <span>${escapeHtml(label)}</span>
      <div class="report-level-track" aria-label="${escapeHtml(label)} ${pct}%">
        <span class="report-level-fill ${escapeHtml(level)}" style="width: ${pct}%"></span>
      </div>
      <strong>${pct}%</strong>
    </div>
  `;
}

function metricItem(label, value) {
  return `
    <div class="report-metric-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function formatPlatformCounts(platformCounts = {}) {
  const chatgpt = formatNumber(platformCounts.chatgpt || 0);
  const gemini = formatNumber(platformCounts.gemini || 0);
  return `ChatGPT ${chatgpt} · Gemini ${gemini}`;
}


function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
