"use strict";

const STORAGE_KEYS = {
  SETTINGS: "chatpool.settings",
  DAILY: "chatpool.daily",
  ONBOARDED: "chatpool.onboarded"
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

const PURI_ASSETS = {
  idle: "../assets/puri_idle.svg",
  low: "../assets/puri_low.svg",
  medium: "../assets/puri_medium.svg",
  high: "../assets/puri_high.svg"
};

const $ = (selector) => document.querySelector(selector);
const tips = Array.isArray(window.CHATPULL_PROMPT_TIPS) ? window.CHATPULL_PROMPT_TIPS : [];
let activeCategory = "all";
let libraryOpen = false;
let latestDaily = {};

const nodes = {
  enabled: $("#enabled"),
  reportDate: $("#reportDate"),
  refreshReport: $("#refreshReport"),
  reportStatus: $("#reportStatus"),
  puriReportImg: $("#puriReportImg"),
  puriReportMsg: $("#puriReportMsg"),
  reportInsights: $("#reportInsights"),
  lowRatio: $("#lowRatio"),
  mediumRatio: $("#mediumRatio"),
  highRatio: $("#highRatio"),
  levelMixNote: $("#levelMixNote"),
  weekDays: $("#weekDays"),
  openGuide: $("#openGuide"),
  tipTotal: $("#tipTotal"),
  openTips: $("#openTips"),
  tipLibrary: $("#tipLibrary"),
  categoryTabs: $("#categoryTabs"),
  activeCategoryName: $("#activeCategoryName"),
  activeCategoryCount: $("#activeCategoryCount"),
  tipList: $("#tipList"),
  openChatGPT: $("#openChatGPT"),
  openGemini: $("#openGemini")
};

boot();

async function boot() {
  const state = await getState();
  render(state);
  bindEvents(state.settings);
  await loadAndRenderReport();
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
  return next;
}

function merge(base, patch) {
  const result = { ...base };
  Object.keys(patch || {}).forEach((key) => {
    if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && base[key]) {
      result[key] = merge(base[key], patch[key]);
    } else {
      result[key] = patch[key];
    }
  });
  return result;
}

function todayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function render(state) {
  nodes.enabled.checked = Boolean(state.settings.enabled);
  nodes.tipTotal.textContent = `${tips.length}`;
  if (libraryOpen) renderTipLibrary();
}

function bindEvents(settings) {
  nodes.enabled.addEventListener("change", () => updateSetting({ enabled: nodes.enabled.checked }));
  nodes.refreshReport.addEventListener("click", loadAndRenderReport);
  nodes.openGuide.addEventListener("click", openOnboardingOnActiveTab);
  nodes.openTips.addEventListener("click", toggleTipLibrary);
  nodes.openChatGPT.addEventListener("click", () => chrome.tabs.create({ url: "https://chatgpt.com/" }));
  nodes.openGemini.addEventListener("click", () => chrome.tabs.create({ url: "https://gemini.google.com/" }));

  async function updateSetting(patch) {
    const next = sanitizeSettings(merge(settings, patch));
    Object.assign(settings, next);
    await storageSet({ [STORAGE_KEYS.SETTINGS]: next });
    render(await getState());
  }
}

async function openOnboardingOnActiveTab() {
  await chrome.storage.local.remove(STORAGE_KEYS.ONBOARDED);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "CHATPOOL_SHOW_ONBOARDING" });
    } catch {
      // content script may not be loaded on this tab
    }
  }
  window.close();
}

function toggleTipLibrary() {
  libraryOpen = !libraryOpen;
  nodes.tipLibrary.hidden = !libraryOpen;
  nodes.openTips.textContent = libraryOpen ? "팁 모음 접기" : "팁 모음 열기";
  if (libraryOpen) renderTipLibrary();
}

function renderTipLibrary() {
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
    return `<button class="category-tab text-body-s" type="button" role="tab" data-category="${escapeHtml(category)}" aria-selected="${selected}">${escapeHtml(CATEGORY_LABELS[category] || category)} ${counts[category] || 0}</button>`;
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
        <p class="text-body-l">${escapeHtml(tip.text || "")}</p>
        <small class="text-body-s">${escapeHtml(category)} · ${escapeHtml(levels)}</small>
      </article>
    `;
  }).join("") || '<article class="tip-item"><p>표시할 팁이 없습니다.</p></article>';
}

async function loadAndRenderReport() {
  setReportStatus("리포트를 불러오는 중이에요…");
  try {
    const [reportResponse, dailyResult] = await Promise.all([
      sendRuntimeMessage({ type: "CHATPOOL_GET_DAILY_REPORT" }),
      storageGet([STORAGE_KEYS.DAILY])
    ]);
    if (!reportResponse?.ok) throw new Error(reportResponse?.error || "리포트를 불러오지 못했습니다.");
    latestDaily = dailyResult[STORAGE_KEYS.DAILY] || {};
    renderReport(reportResponse.report || null);
    nodes.reportStatus.hidden = true;
  } catch (error) {
    setReportStatus(`리포트를 불러오지 못했어요. ${String(error?.message || error)}`);
    renderReport(null);
  }
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

function renderReport(report) {
  const today = report?.dateKey || todayKey();
  nodes.reportDate.textContent = `${today} 기준`;

  const stat = {
    submitCount: report?.totalSent || 0,
    highCount: report?.highCount || 0,
    lowCount: report?.lowCount || 0,
    mediumCount: report?.mediumCount || 0,
    avgFinalChars: Math.round(Number(report?.avgFinalChars) || 0),
    avgReducedChars: Math.round(Number(report?.avgReducedChars) || 0),
    lowRatioPct: report?.lowRatioPct || 0,
    mediumRatioPct: report?.mediumRatioPct || 0,
    highRatioPct: report?.highRatioPct || 0
  };

  const puri = getPuriComment(stat);
  nodes.puriReportImg.src = PURI_ASSETS[puri.imgKey] || PURI_ASSETS.idle;
  nodes.puriReportImg.alt = "푸리";
  nodes.puriReportMsg.textContent = puri.msg;

  nodes.reportInsights.innerHTML = buildInsightItems(stat).join("");

  nodes.lowRatio.style.width = `${stat.lowRatioPct}%`;
  nodes.mediumRatio.style.width = `${stat.mediumRatioPct}%`;
  nodes.highRatio.style.width = `${stat.highRatioPct}%`;
  nodes.levelMixNote.textContent = buildLevelMixNote(stat);

  renderWeekCalendar(latestDaily);
}

function buildInsightItems(stat) {
  if (!stat.submitCount) {
    return [
      insightHtml("오늘은 아직 전송 기록이 없어요. 첫 프롬프트를 내면 여기에 요약이 쌓여요."),
      insightHtml("평균 글자 수와 다듬은 양은 전송 후에 볼 수 있어요.")
    ];
  }

  const items = [
    insightHtml(`오늘 <strong class="text-display">${formatNumber(stat.submitCount)}번</strong> ChatGPT/Gemini에 보냈어요.`),
    insightHtml(`한 번 보낼 때 평균 <strong class="text-display">${formatNumber(stat.avgFinalChars)}자</strong> 정도 썼어요.`)
  ];

  if (stat.avgReducedChars > 0) {
    items.push(
      insightHtml(`처음 쓴 글보다 평균 <strong class="text-display">${formatNumber(stat.avgReducedChars)}자</strong> 정도 줄이고 보냈어요.`)
    );
  } else {
    items.push(insightHtml("오늘은 거의 다듬지 않고 그대로 보내셨네요."));
  }

  return items;
}

function insightHtml(text) {
  return `<article class="insight-item"><p class="text-body-m">${text}</p></article>`;
}

function buildLevelMixNote(stat) {
  if (!stat.submitCount) {
    return "전송 기록이 생기면 낮음·중간·높음 비율을 보여드릴게요.";
  }

  const parts = [];
  if (stat.lowRatioPct > 0) parts.push(`낮음 ${stat.lowRatioPct}%`);
  if (stat.mediumRatioPct > 0) parts.push(`중간 ${stat.mediumRatioPct}%`);
  if (stat.highRatioPct > 0) parts.push(`높음 ${stat.highRatioPct}%`);

  if (!parts.length) {
    return "오늘 보낸 프롬프트 길이 비율을 정리하는 중이에요.";
  }

  const lead = stat.highRatioPct >= 50
    ? "긴 프롬프트가 조금 많았어요."
    : stat.lowRatioPct >= 60
      ? "대체로 짧고 간결하게 잘 쓰셨어요."
      : "짧은 것과 긴 것이 섞여 있었어요.";

  return `${lead} (${parts.join(" · ")})`;
}

function getPuriComment(stat) {
  if (!stat || stat.submitCount === 0) {
    return {
      imgKey: "idle",
      msg: "아직 오늘 전송 기록이 없어요. 오늘도 간결하게 써봐요!"
    };
  }
  const highRatio = stat.highCount / stat.submitCount;
  if (highRatio > 0.5) {
    return {
      imgKey: "high",
      msg: `오늘 ${stat.submitCount}번 중 ${stat.highCount}번은 길었어요. 나눠 물어보면 답이 더 또렷해질 수 있어요.`
    };
  }
  if (highRatio > 0.2) {
    return {
      imgKey: "medium",
      msg: `오늘 ${stat.submitCount}번 보냈어요. 조금만 더 줄이면 더 빠른 답을 받기 쉬워요.`
    };
  }
  return {
    imgKey: "low",
    msg: `오늘 ${stat.submitCount}번 보냈는데, 대부분 간결했어요. 잘하고 있어요!`
  };
}

function renderWeekCalendar(daily) {
  const days = buildWeekDays(daily);
  nodes.weekDays.innerHTML = days.map((day) => {
    const level = getWeekDotLevel(day.stat.submitCount || 0);
    const todayClass = day.isToday ? " today" : "";
    return `
      <div class="week-day">
        <div class="week-dot level-${level}${todayClass}" title="${escapeHtml(day.key)} · ${day.stat.submitCount || 0}회"></div>
        <span class="week-day-label text-body-s">${escapeHtml(day.dayLabel)}</span>
      </div>
    `;
  }).join("");
}

function buildWeekDays(daily) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = formatDateKey(date);
    const stat = daily[key] || { submitCount: 0 };
    days.push({
      key,
      stat,
      isToday: i === 0,
      dayLabel: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    });
  }
  return days;
}

function getWeekDotLevel(submitCount) {
  if (submitCount <= 0) return 0;
  if (submitCount <= 3) return 1;
  if (submitCount <= 7) return 2;
  return 3;
}

function setReportStatus(message) {
  nodes.reportStatus.hidden = false;
  nodes.reportStatus.textContent = message;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
