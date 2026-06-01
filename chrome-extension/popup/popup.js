"use strict";

const STORAGE_KEYS = {
  SETTINGS: "chatpool.settings",
  DAILY: "chatpool.daily",
  ONBOARDED: "chatpool.onboarded",
  CUSTOM_CHARACTER: "chatpool.customCharacter"
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
  prevDay: $("#prevDay"),
  nextDay: $("#nextDay"),
  reportDate: $("#reportDate"),
  refreshReport: $("#refreshReport"),
  reportStatus: $("#reportStatus"),
  puriReportImg: $("#puriReportImg"),
  puriImgWrap: $("#puriImgWrap"),
  puriUploadInput: $("#puriUploadInput"),
  puriCustomBadge: $("#puriCustomBadge"),
  puriResetBtn: $("#puriResetBtn"),
  puriReportMsg: $("#puriReportMsg"),
  reportInsights: $("#reportInsights"),
  lowRatio: $("#lowRatio"),
  mediumRatio: $("#mediumRatio"),
  highRatio: $("#highRatio"),
  levelMixNote: $("#levelMixNote"),
  weekBars: $("#weekBars"),
  weekDaysLabel: $("#weekDaysLabel"),
  openGuide: $("#openGuide"),
  tipTotal: $("#tipTotal"),
  openTips: $("#openTips"),
  tipLibrary: $("#tipLibrary"),
  categoryTabs: $("#categoryTabs"),
  activeCategoryName: $("#activeCategoryName"),
  activeCategoryCount: $("#activeCategoryCount"),
  tipList: $("#tipList")
};

let customCharacterUrl = null;
let reportOffset = 0;

boot();

async function boot() {
  const state = await getState();
  const stored = await storageGet([STORAGE_KEYS.CUSTOM_CHARACTER]);
  customCharacterUrl = stored[STORAGE_KEYS.CUSTOM_CHARACTER] || null;
  render(state);
  bindEvents(state.settings);
  bindCharacterUpload();
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

function getDateKey(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function getDateLabel(offset) {
  if (offset === 0) return "오늘";
  if (offset === -1) return "어제";
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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

  nodes.prevDay.addEventListener("click", () => {
    reportOffset--;
    nodes.nextDay.disabled = false;
    nodes.reportDate.textContent = getDateLabel(reportOffset);
    loadAndRenderReportForOffset(reportOffset);
  });

  nodes.nextDay.addEventListener("click", () => {
    if (reportOffset >= 0) return;
    reportOffset++;
    if (reportOffset === 0) nodes.nextDay.disabled = true;
    nodes.reportDate.textContent = getDateLabel(reportOffset);
    loadAndRenderReportForOffset(reportOffset);
  });

  async function updateSetting(patch) {
    const next = sanitizeSettings(merge(settings, patch));
    Object.assign(settings, next);
    await storageSet({ [STORAGE_KEYS.SETTINGS]: next });
    render(await getState());
  }
}

function bindCharacterUpload() {
  nodes.puriImgWrap.addEventListener("click", () => nodes.puriUploadInput.click());

  nodes.puriUploadInput.addEventListener("change", async () => {
    const file = nodes.puriUploadInput.files?.[0];
    if (!file) return;
    nodes.puriUploadInput.value = "";
    try {
      const dataUrl = await resizeImageToDataUrl(file, 200);
      customCharacterUrl = dataUrl;
      await storageSet({ [STORAGE_KEYS.CUSTOM_CHARACTER]: dataUrl });
      nodes.puriReportImg.src = dataUrl;
      nodes.puriCustomBadge.hidden = false;
    } catch {
      // 업로드 실패 시 무시
    }
  });

  nodes.puriResetBtn.addEventListener("click", async () => {
    customCharacterUrl = null;
    await storageSet({ [STORAGE_KEYS.CUSTOM_CHARACTER]: null });
    nodes.puriCustomBadge.hidden = true;
    await loadAndRenderReport();
  });
}

function resizeImageToDataUrl(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function openOnboardingOnActiveTab() {
  await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDED]: false });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "CHATPOOL_SHOW_ONBOARDING" });
    } catch {
      // content script may not be loaded on this tab — 새로고침 후 다시 시도
      await chrome.tabs.reload(tab.id);
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

async function loadAndRenderReportForOffset(offset) {
  try {
    const reportResponse = await sendRuntimeMessage({
      type: "CHATPOOL_GET_DAILY_REPORT",
      dateKey: getDateKey(offset)
    });
    if (!reportResponse?.ok) throw new Error(reportResponse?.error || "리포트를 불러오지 못했습니다.");
    renderReport(reportResponse.report || null);
    nodes.reportStatus.hidden = true;
  } catch (error) {
    setReportStatus(`리포트를 불러오지 못했어요. ${String(error?.message || error)}`);
    renderReport(null);
  }
}

async function loadAndRenderReport() {
  setReportStatus("리포트를 불러오는 중이에요…");
  reportOffset = 0;
  nodes.nextDay.disabled = true;
  nodes.reportDate.textContent = "오늘";
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
  const stat = {
    submitCount: report?.totalSent || 0,
    highCount: report?.highCount || 0,
    lowCount: report?.lowCount || 0,
    mediumCount: report?.mediumCount || 0,
    avgFinalChars: Math.round(Number(report?.avgFinalChars) || 0),
    avgReducedChars: Math.round(Number(report?.avgReducedChars) || 0),
    lowRatioPct: report?.lowRatioPct || 0,
    mediumRatioPct: report?.mediumRatioPct || 0,
    highRatioPct: report?.highRatioPct || 0,
    platformCounts: report?.platformCounts || {}
  };

  const puri = getPuriComment(stat);
  nodes.puriReportImg.src = customCharacterUrl || PURI_ASSETS[puri.imgKey] || PURI_ASSETS.idle;
  nodes.puriReportImg.alt = "푸리";
  nodes.puriCustomBadge.hidden = !customCharacterUrl;
  nodes.puriReportMsg.textContent = getDailyReportNudge(stat) || puri.msg;

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
      insightHtml("아직 오늘 AI를 사용하지 않았어요."),
      insightHtml("평균 글자 수와 다듬은 양은 전송 후에 볼 수 있어요.")
    ];
  }

  const pc = stat.platformCounts || {};
  const chatgptCount = pc.chatgpt || 0;
  const geminiCount = pc.gemini || 0;
  const claudeCount = pc.claude || 0;

  const platforms = [];
  if (chatgptCount > 0) platforms.push(`ChatGPT에 <strong class="text-display">${formatNumber(chatgptCount)}번</strong>`);
  if (claudeCount > 0) platforms.push(`Claude에 <strong class="text-display">${formatNumber(claudeCount)}번</strong>`);
  if (geminiCount > 0) platforms.push(`Gemini에 <strong class="text-display">${formatNumber(geminiCount)}번</strong>`);

  const platformLine = platforms.length > 0
    ? `오늘 ${platforms.join(", ")} 보냈어요.`
    : `오늘 <strong class="text-display">${formatNumber(stat.submitCount)}번</strong> AI에 보냈어요.`;

  const items = [
    insightHtml(platformLine),
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

function getDailyReportNudge(stat) {
  if (!stat || stat.submitCount === 0) return null;

  const highRatio = stat.highCount / stat.submitCount;
  const messages = [];

  if (highRatio > 0.5) {
    messages.push(`오늘 ${stat.submitCount}번 중 ${stat.highCount}번이 길었어요. 리포트 확인해볼까요?`);
    messages.push("긴 입력이 많았던 하루예요. 팝업에서 자세히 볼 수 있어요 📊");
  } else if (highRatio > 0.2) {
    messages.push(`오늘 ${stat.submitCount}번 전송했어요. 오늘 프롬프트 패턴 확인해볼까요?`);
    messages.push("조금씩 나아지고 있어요! 오늘 리포트 확인해봐요 🌿");
  } else {
    messages.push("오늘도 간결하게 잘 쓰고 있어요! 리포트에서 확인해봐요 🌱");
    messages.push(`오늘 ${stat.submitCount}번 전송했는데 대부분 짧았어요. 최고예요 ✨`);
  }

  return messages[Math.floor(Math.random() * messages.length)];
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
  if (!nodes.weekBars || !nodes.weekDaysLabel) return;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = formatDateKey(date);
    const count = (daily[key] || {}).submitCount || 0;
    days.push({
      key,
      count,
      isToday: i === 0,
      dayLabel: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  nodes.weekBars.innerHTML = days.map((day) => {
    const heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 10) : 0;
    const todayClass = day.isToday ? " today" : "";
    return `
      <div class="week-bar-wrap">
        <div class="week-bar-bg">
          <div class="week-bar-fill${todayClass}" style="height:${heightPct}%"></div>
        </div>
        <div class="week-bar-count">${day.count}</div>
      </div>
    `;
  }).join("");

  nodes.weekDaysLabel.innerHTML = days.map((day) => {
    const todayClass = day.isToday ? " today" : "";
    return `<div class="week-day-label${todayClass}">${escapeHtml(day.dayLabel)}</div>`;
  }).join("");
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
