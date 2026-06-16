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
  tipBarScale: 100,
  floatingLogoScale: 80,
  floatingLogoPlacement: "top-right",
  dragEnabled: false,
  customPosition: null,
  onboardingGuideShown: false,
  focusMode: false,
  badgeSize: "md",
  thresholds: { lowMax: 100, mediumMax: 400 }
};

const CUSTOM_PROMPTS = {
  "공통": {
    icon: "🌐",
    presets: [
      { label: "공통 압축형 기본 설정", prompt: `너는 토큰 사용량을 줄이고 불필요한 반복 대화를 최소화하는 압축형 AI 어시스턴트다. 답변의 목표는 사용자가 필요한 정보를 빠르게 얻도록 하면서, 입력 토큰과 출력 토큰을 모두 줄이는 것이다. 모든 답변은 짧고 명확하게 작성하며, 중복 설명, 장황한 배경, 과도한 예시, 불필요한 선택지 나열은 생략한다.\n\n항상 결론이나 결과물을 먼저 제시한다. 필요한 경우에만 핵심 근거, 실행 단계, 주의점을 짧게 덧붙인다. 사용자가 요청하지 않은 부가 설명이나 심화 내용은 제공하지 않는다. 여러 가능성이 있을 때는 가장 가능성 높은 답이나 가장 추천하는 방향을 먼저 제시하고, 대안은 1~2개로 제한한다.\n\n사용자의 요청이 충분히 명확하면 추가 질문 없이 바로 답변한다. 정보가 부족해 답변 품질이 크게 떨어질 경우에만 가장 중요한 확인 질문 1개를 한다. 전체적으로 최소한의 토큰으로 최대한의 정보를 전달한다.` }
    ]
  },
  "과제 중심 대학생": {
    icon: "📚",
    presets: [
      { label: "과제 중심 대학생", prompt: `너는 대학생의 과제 수행을 돕는 압축형 학습 보조자다. 답변의 목표는 과제에 필요한 내용을 한 번에 충분히 제공하고, 불필요한 설명과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다. 보고서, 발표, 요약, 자료조사, 팀플 문서, 교수님 메일 등 대학 과제 상황에 맞게 답변한다.\n\n항상 결론이나 완성본을 먼저 제시한다. 필요한 경우에만 짧은 근거를 덧붙인다. 장황한 배경 설명, 과도한 예시, 비슷한 표현의 반복은 생략한다. 과제에 바로 활용할 수 있도록 핵심 주장, 근거, 예시, 정리 순서로 구성한다.\n\n요청이 충분히 명확하면 추가 질문 없이 바로 결과물을 제공한다. 정보가 부족해 답변 품질이 크게 떨어질 때만 확인 질문 1개를 한다.` }
    ]
  },
  "시험공부형 학생": {
    icon: "📝",
    presets: [
      { label: "시험공부형 학생", prompt: `너는 시험공부를 돕는 압축형 튜터다. 답변의 목표는 사용자가 개념을 빠르게 이해하고 문제에 적용하게 하며, 불필요한 설명과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n개념 설명은 정의, 핵심 원리, 적용 상황, 시험 포인트 순서로 정리한다. 헷갈리는 개념은 비교표나 짧은 항목으로 차이만 정리한다. 문제 풀이는 풀이 방향을 먼저 제시하고, 핵심 식과 판단 근거만 보여준다. 시험 직전 정리는 핵심 개념, 자주 나오는 유형, 실수 포인트 순서로 구성한다.` }
    ]
  },
  "코딩 중심 사용자": {
    icon: "💻",
    presets: [
      { label: "코딩 중심 사용자", prompt: `너는 개발을 돕는 압축형 코딩 어시스턴트다. 오류 해결과 구현에 필요한 정보를 바로 제공하고, 불필요한 설명과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n오류 해결은 가장 가능성 높은 원인과 수정 방법을 먼저 제시한다. 어느 파일의 어느 부분을 어떻게 바꿔야 하는지 우선 알려준다. 전체 코드를 반복하지 않고 바뀌는 부분 중심으로 보여준다. 기능 구현은 파일명, 함수명, 수정 위치, 코드 순서로 답한다.` }
    ]
  },
  "기획 / PM형": {
    icon: "📋",
    presets: [
      { label: "기획 / PM형 사용자", prompt: `너는 서비스 기획과 프로젝트 관리를 돕는 압축형 PM 어시스턴트다. 기획 의사결정에 필요한 구조를 빠르게 제공하고, 불필요한 설명과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n서비스 아이디어는 문제, 사용자, 해결 방식, 핵심 기능, 사용자 가치, 리스크 순서로 정리한다. 유저리서치는 목적, 대상, 절차, 질문, 관찰 항목, 지표, 분석 방식으로 정리한다. 발표 구성은 문제 제기, 조사, 인사이트, 솔루션, 구현, 테스트, 기대효과 흐름으로 정리한다.` }
    ]
  },
  "글쓰기 / 커뮤니케이션형": {
    icon: "✍️",
    presets: [
      { label: "글쓰기 / 커뮤니케이션형", prompt: `너는 글쓰기와 커뮤니케이션을 돕는 압축형 문장 편집자다. 바로 사용할 수 있는 문장을 제공하고, 수정 요청과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n항상 완성본을 먼저 제시한다. 문장은 자연스럽고 사람이 쓴 것처럼 작성한다. AI가 쓴 것처럼 보이는 장식적인 표현은 피한다. 메일은 제목과 본문을 구분한다. 문장 다듬기는 원래 의미를 유지하면서 더 간결하고 자연스럽게 고친다.` }
    ]
  },
  "리서치 / 자료조사형": {
    icon: "🔍",
    presets: [
      { label: "리서치 / 자료조사형", prompt: `너는 자료조사와 정보 정리를 돕는 압축형 리서치 어시스턴트다. 신뢰할 수 있는 핵심 정보를 구조화해 제공하고, 불필요한 탐색과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n조사는 핵심 결론을 먼저 제시하고, 그다음 근거와 활용 방향을 짧게 정리한다. 확실하지 않은 내용은 단정하지 않고 불확실하다고 표시한다. 비교 분석은 비교 기준을 먼저 세우고 핵심 차이를 표나 짧은 항목으로 정리한다.` }
    ]
  },
  "창업 / 비즈니스형": {
    icon: "🚀",
    presets: [
      { label: "창업 / 비즈니스형", prompt: `너는 창업과 비즈니스 실행을 돕는 압축형 전략 어시스턴트다. 실행 가능한 판단을 빠르게 제공하고, 불필요한 아이디어 확장과 반복 질문을 줄여 전체 토큰 사용량을 절감하는 것이다.\n\n아이디어 검토는 문제의 강도, 고객, 지불 의사, 검증 가능성, 수익성, 리스크를 기준으로 판단한다. 장점만 말하지 않고 실패 가능성과 현실적인 수정 방향도 함께 제시한다. MVP는 필수 기능과 후순위 기능을 구분한다.` }
    ]
  },
  "초압축 효율형": {
    icon: "⚡",
    presets: [
      { label: "초압축 효율형", prompt: `너는 답변을 최대한 짧고 효율적으로 제공하는 압축형 어시스턴트다. 항상 결론을 먼저 말한다. 배경, 역사, 원리, 예시는 생략한다. 여러 선택지가 있을 때는 가장 추천하는 선택지를 먼저 말하고, 대안은 1~2개만 제시한다. 단, 중요한 리스크나 사용자가 놓치면 큰 문제가 생길 수 있는 부분은 짧게라도 반드시 알려준다.` }
    ]
  }
};

const PURI_ASSETS = {
  idle: "../assets/puri_idle.svg",
  low: "../assets/puri_low.svg",
  medium: "../assets/puri_medium.svg",
  high: "../assets/puri_high.svg"
};

const $ = (selector) => document.querySelector(selector);
let latestDaily = {};

const nodes = {
  enabled:        $("#enabled"),
  focusMode:      $("#focusMode"),
  prevDay:        $("#prevDay"),
  nextDay:        $("#nextDay"),
  reportDate:     $("#reportDate"),
  refreshReport:  $("#refreshReport"),
  reportStatus:   $("#reportStatus"),
  puriReportImg:  $("#puriReportImg"),
  puriReportTitle:$("#puriReportTitle"),
  puriReportMsg:  $("#puriReportMsg"),
  puriImgWrap:    $("#puriImgWrap"),
  puriUploadInput:$("#puriUploadInput"),
  puriCustomBadge:$("#puriCustomBadge"),
  puriResetBtn:   $("#puriResetBtn"),
  avgCharsText:   $("#avgCharsText"),
  lowRatio:       $("#lowRatio"),
  mediumRatio:    $("#mediumRatio"),
  highRatio:      $("#highRatio"),
  levelMixNote:   $("#levelMixNote"),
  weekBars:       $("#weekBars"),
  weekDaysLabel:  $("#weekDaysLabel"),
  statTotal:      $("#statTotal"),
  statAvg:        $("#statAvg"),
  statPlatform:   $("#statPlatform"),
  statPeak:       $("#statPeak"),
  shareImageBtn:  $("#shareImageBtn"),
  downloadLogBtn: $("#downloadLogBtn"),
  openGuide:      $("#openGuide"),
  resetStatsBtn:  $("#resetStatsBtn"),
  openCustomSheet:$("#openCustomSheet"),
  customSheet:    $("#customSheet"),
  sheetBackdrop:  $("#sheetBackdrop"),
  closeSheet:     $("#closeSheet"),
  sheetPersonaTabs: $("#sheetPersonaTabs"),
  sheetPresets:   $("#sheetPresets"),
  sheetCopyBtn:   $("#sheetCopyBtn"),
};

let customCharacterUrl    = null;
let reportOffset          = 0;
let selectedPersona       = Object.keys(CUSTOM_PROMPTS)[0];
let lastRenderedStat      = null;
let lastRenderedPuri      = null;
let sheetSelectedPersona  = Object.keys(CUSTOM_PROMPTS)[0];
let sheetSelectedPreset   = 0;

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
  next.focusMode = Boolean(next.focusMode);
  next.badgeSize = ["sm", "md", "lg"].includes(next.badgeSize) ? next.badgeSize : "md";
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

function getDayLabel() {
  return reportOffset === 0 ? "오늘" : "이날";
}

function render(state) {
  nodes.enabled.checked = Boolean(state.settings.enabled);
  if (nodes.focusMode) nodes.focusMode.checked = Boolean(state.settings.focusMode);
}

function renderCustomPrompts() {
  // legacy stub – sheet rendering handled by renderCustomSheet
  const personaKeys = Object.keys(CUSTOM_PROMPTS);

}

// ── Custom instructions sheet ─────────────────────────────
function renderCustomSheet() {
  const personaKeys = Object.keys(CUSTOM_PROMPTS);

  // Persona pills
  nodes.sheetPersonaTabs.innerHTML = personaKeys.map((key) => {
    const p = CUSTOM_PROMPTS[key];
    return `<button class="persona-pill${key === sheetSelectedPersona ? " active" : ""}" data-persona="${escapeHtml(key)}" type="button">${p.icon} ${escapeHtml(key)}</button>`;
  }).join("");

  nodes.sheetPersonaTabs.querySelectorAll(".persona-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      sheetSelectedPersona = btn.dataset.persona;
      sheetSelectedPreset  = 0;
      renderCustomSheet();
      // 해당 프리셋으로 스크롤
      const target = nodes.sheetPresets.querySelector(`[data-persona="${btn.dataset.persona}"]`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  // 모든 페르소나의 프리셋을 플랫 리스트로 표시
  nodes.sheetPresets.innerHTML = personaKeys.flatMap((personaKey) => {
    const p = CUSTOM_PROMPTS[personaKey];
    return p.presets.map((preset, idx) => {
      const isActive = personaKey === sheetSelectedPersona && idx === sheetSelectedPreset;
      const preview = isActive
        ? `<p class="preset-preview-label">지침 미리보기</p><p class="preset-preview-text">${escapeHtml(preset.prompt)}</p>`
        : "";
      return `<button class="preset-item${isActive ? " active" : ""}" data-persona="${escapeHtml(personaKey)}" data-idx="${idx}" type="button">
        <p class="preset-label">${escapeHtml(preset.label)}</p>
        ${preview}
      </button>`;
    });
  }).join("");

  nodes.sheetPresets.querySelectorAll(".preset-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      sheetSelectedPersona = btn.dataset.persona;
      sheetSelectedPreset  = Number(btn.dataset.idx);
      renderCustomSheet();
    });
  });
}

function openCustomSheet() {
  sheetSelectedPreset = 0;
  nodes.customSheet.hidden = false;
  renderCustomSheet();
}

function closeCustomSheet() {
  nodes.customSheet.hidden = true;
}

function bindEvents(settings) {
  async function updateSetting(patch) {
    const next = sanitizeSettings(merge(settings, patch));
    Object.assign(settings, next);
    await storageSet({ [STORAGE_KEYS.SETTINGS]: next });
    render(await getState());
  }

  // Enable toggle
  nodes.enabled.addEventListener("change", () => updateSetting({ enabled: nodes.enabled.checked }));

  // Focus mode toggle (settings tab)
  if (nodes.focusMode) nodes.focusMode.addEventListener("change", () => updateSetting({ focusMode: nodes.focusMode.checked }));

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("tabReport").hidden   = tab !== "report";
      document.getElementById("tabSettings").hidden = tab !== "settings";
    });
  });

  // Date nav
  nodes.refreshReport.addEventListener("click", loadAndRenderReport);
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

  // Share image
  nodes.shareImageBtn.addEventListener("click", downloadShareImage);

  // Custom sheet open/close
  nodes.openCustomSheet.addEventListener("click", openCustomSheet);
  nodes.closeSheet.addEventListener("click", closeCustomSheet);
  nodes.sheetBackdrop.addEventListener("click", closeCustomSheet);

  // Sheet copy button
  nodes.sheetCopyBtn.addEventListener("click", async () => {
    const presets = CUSTOM_PROMPTS[sheetSelectedPersona]?.presets || [];
    const prompt  = presets[sheetSelectedPreset]?.prompt || "";
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      nodes.sheetCopyBtn.textContent = "복사됐어요! ✓";
      nodes.sheetCopyBtn.classList.add("copied");
      setTimeout(() => {
        nodes.sheetCopyBtn.textContent = "지침 복사하기";
        nodes.sheetCopyBtn.classList.remove("copied");
      }, 2000);
    } catch {
      nodes.sheetCopyBtn.textContent = "복사 실패";
      setTimeout(() => { nodes.sheetCopyBtn.textContent = "지침 복사하기"; }, 2000);
    }
  });

  // Settings actions
  nodes.openGuide.addEventListener("click", openOnboardingOnActiveTab);
  nodes.downloadLogBtn.addEventListener("click", downloadLog);
  nodes.resetStatsBtn.addEventListener("click", resetStats);
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
    submitCount:    report?.totalSent    || 0,
    highCount:      report?.highCount    || 0,
    lowCount:       report?.lowCount     || 0,
    mediumCount:    report?.mediumCount  || 0,
    avgFinalChars:  Math.round(Number(report?.avgFinalChars)  || 0),
    avgReducedChars:Math.round(Number(report?.avgReducedChars)|| 0),
    lowRatioPct:    report?.lowRatioPct    || 0,
    mediumRatioPct: report?.mediumRatioPct || 0,
    highRatioPct:   report?.highRatioPct   || 0,
    platformCounts: report?.platformCounts || {}
  };

  const puri = getPuriComment(stat);
  lastRenderedStat = stat;
  lastRenderedPuri = puri;

  // Puri image
  nodes.puriReportImg.src = customCharacterUrl || PURI_ASSETS[puri.imgKey] || PURI_ASSETS.idle;
  nodes.puriReportImg.alt = "푸리";
  nodes.puriCustomBadge.hidden = !customCharacterUrl;

  // Split msg into title (first sentence) + subtitle (rest)
  const splitIdx = puri.msg.search(/[.!]\s/);
  if (splitIdx !== -1) {
    nodes.puriReportTitle.textContent = puri.msg.slice(0, splitIdx + 1);
    nodes.puriReportMsg.textContent   = puri.msg.slice(splitIdx + 2);
  } else {
    nodes.puriReportTitle.textContent = stat.submitCount > 0 ? "오늘도 수고했어요!" : "아직 기록이 없어요!";
    nodes.puriReportMsg.textContent   = puri.msg;
  }

  // Avg chars card
  if (stat.submitCount > 0 && stat.avgFinalChars > 0) {
    nodes.avgCharsText.textContent = `${formatNumber(stat.avgFinalChars)}자 정도 작성하셨네요.`;
  } else {
    nodes.avgCharsText.textContent = "사용을 시작하면 평균 작성 글자 수를 알려드려요.";
  }

  // Share btn: activate when there's data
  nodes.shareImageBtn.classList.toggle("has-data", stat.submitCount > 0);

  // Level bar
  nodes.lowRatio.style.width    = `${stat.lowRatioPct}%`;
  nodes.mediumRatio.style.width = `${stat.mediumRatioPct}%`;
  nodes.highRatio.style.width   = `${stat.highRatioPct}%`;
  nodes.levelMixNote.innerHTML  = buildLevelMixNote(stat);

  // Stats grid
  renderStatsGrid(stat);

  renderWeekCalendar(latestDaily);
}

function renderStatsGrid(stat) {
  // 총 대화 수
  nodes.statTotal.textContent = stat.submitCount > 0 ? `${formatNumber(stat.submitCount)}건` : "—";

  // 평균 프롬프트 (weekly avg per day)
  const weekCounts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const entry = latestDaily[formatDateKey(d)] || {};
    weekCounts.push(entry.submitCount || 0);
  }
  const weekTotal = weekCounts.reduce((s, n) => s + n, 0);
  const activeDays = weekCounts.filter(n => n > 0).length;
  const avgPerDay  = activeDays > 0 ? Math.round(weekTotal / activeDays * 10) / 10 : 0;
  nodes.statAvg.textContent = avgPerDay > 0 ? `${avgPerDay}개/일` : "—";

  // 가장 많이 사용
  const pc = stat.platformCounts || {};
  const platforms = { chatgpt: "ChatGPT", claude: "Claude", gemini: "Gemini" };
  let topName = "—"; let topCount = 0;
  for (const [key, label] of Object.entries(platforms)) {
    if ((pc[key] || 0) > topCount) { topCount = pc[key]; topName = label; }
  }
  nodes.statPlatform.textContent = topCount > 0 ? topName : "—";

  // 최고 사용 시간대 (데이터 없음)
  nodes.statPeak.textContent = "—";
}

async function resetStats() {
  if (!confirm("통계 데이터를 모두 초기화할까요?\n되돌릴 수 없어요.")) return;
  await storageSet({ [STORAGE_KEYS.DAILY]: {} });
  latestDaily = {};
  await loadAndRenderReport();
}

function buildInsightItems(stat) {
  const day = getDayLabel();
  const isPast = reportOffset < 0;
  if (!stat.submitCount) {
    return [
      insightHtml(isPast ? "이날 AI 사용 기록이 없어요." : `아직 ${day} AI를 사용하지 않았어요.`),
      insightHtml("평균 글자 수와 다듬은 양은 채팅 전송 후에 볼 수 있어요.")
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
    ? `${platforms.join(", ")} 보냈어요.`
    : `<strong class="text-display">${formatNumber(stat.submitCount)}번</strong> AI에 보냈어요.`;

  const items = [
    insightHtml(platformLine),
    insightHtml(`한 번 보낼 때 평균 <strong class="text-display">${formatNumber(stat.avgFinalChars)}자</strong> 정도 썼어요.`)
  ];

  if (stat.avgReducedChars > 0) {
    items.push(
      insightHtml(`처음 쓴 글보다 평균 <strong class="text-display">${formatNumber(stat.avgReducedChars)}자</strong> 정도 줄이고 보냈어요.`)
    );
  } else {
    items.push(insightHtml("거의 다듬지 않고 그대로 보냈어요."));
  }

  return items;
}

function insightHtml(text) {
  return `<article class="insight-item"><p class="text-body-m">${text}</p></article>`;
}

function buildLevelMixNote(stat) {
  if (!stat.submitCount) return "데이터 없음";
  const items = [
    { label: "낮음", pct: stat.lowRatioPct,    cls: "low" },
    { label: "중간", pct: stat.mediumRatioPct,  cls: "medium" },
    { label: "높음", pct: stat.highRatioPct,    cls: "high" }
  ].filter(i => i.pct > 0);
  if (!items.length) return "데이터 없음";
  return items.map(i => `<span><span class="level-dot ${i.cls}"></span>${i.label} ${i.pct}%</span>`).join("");
}

function getDailyReportNudge(stat) {
  if (!stat || stat.submitCount === 0) return null;

  const highRatio = stat.highCount / stat.submitCount;
  const isPast = reportOffset < 0;
  const messages = [];

  if (highRatio > 0.5) {
    messages.push(`${stat.submitCount}번 중 ${stat.highCount}번이 길었어요.`);
    if (!isPast) messages.push("긴 입력이 많았던 하루예요. 팝업에서 자세히 볼 수 있어요 📊");
  } else if (highRatio > 0.2) {
    messages.push(`${stat.submitCount}번 전송했어요.`);
    if (!isPast) messages.push("조금씩 나아지고 있어요! 🌿");
  } else {
    messages.push(`${stat.submitCount}번 전송했는데 대부분 짧았어요.`);
    if (!isPast) messages.push("간결하게 잘 쓰고 있어요! 🌱");
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

function getPuriComment(stat) {
  const isPast = reportOffset < 0;
  const n = stat?.submitCount || 0;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (!stat || n === 0) {
    return {
      imgKey: "idle",
      msg: isPast
        ? "이날은 전송 기록이 없어요."
        : pick([
            "아직 오늘 전송 기록이 없어요. 첫 질문을 간결하게 시작해보세요!",
            "오늘의 첫 채팅을 기다리고 있어요. 짧고 명확하게 질문해봐요!",
            "아직 아무것도 없어요. AI에게 간결하게 물어보는 하루를 만들어봐요!"
          ])
    };
  }

  const lo = stat.lowCount || 0;
  const md = stat.mediumCount || 0;
  const hi = stat.highCount || 0;
  const highRatio = hi / n;
  const allHigh = hi === n;
  const allLow = lo === n;
  const noLow = lo === 0;

  if (highRatio > 0.5) {
    if (allHigh) {
      return {
        imgKey: "high",
        msg: isPast
          ? pick([
              `총 ${n}번 전부 높음이었어요. 긴 작업들로 가득 찬 하루였군요!`,
              `${n}번 모두 높음으로 AI를 적극 활용한 날이었네요.`,
              `${n}번 채팅했는데 전부 높음이었어요. 내용이 많았던 만큼 열심히 한 하루였어요.`
            ])
          : pick([
              `오늘 총 ${n}번 전부 높음이에요. 주제를 나눠서 물어보면 답이 훨씬 또렷해질 거예요!`,
              `오늘 ${n}번 모두 높음이에요. 나눠서 질문하면 훨씬 또렷한 답을 받을 수 있어요!`,
              `오늘 ${n}번 채팅했는데 전부 높음이에요. 조금씩 나눠서 물어봐요!`
            ])
      };
    }
    return {
      imgKey: "high",
      msg: isPast
        ? pick([
            `총 ${n}번 중 높음이 ${hi}번이었어요. 긴 작업들로 AI를 적극 활용한 날이었네요.`,
            `${n}번 보냈는데 높음이 ${hi}번이나 됐어요. 열심히 한 하루였네요.`,
            `${n}번 채팅 중 높음이 ${hi}번이었어요. 내용이 많았던 만큼 열심히 한 하루였어요.`
          ])
        : pick([
            `오늘 총 ${n}번 중 높음이 ${hi}번이에요. 긴 것들은 나눠서 물어보면 더 정확한 답을 받을 수 있어요.`,
            `오늘 ${n}번 보냈는데 높음이 ${hi}번! 나눠서 질문하면 더 또렷한 답변을 받을 수 있어요.`,
            `오늘 ${n}번 채팅 중 높음이 ${hi}번이에요. 주제를 나눠서 물어봐요!`
          ])
    };
  }

  if (highRatio > 0.2) {
    if (noLow) {
      return {
        imgKey: "medium",
        msg: isPast
          ? pick([
              `총 ${n}번 중 높음이 ${hi}번이었어요. 전반적으로 잘 활용한 하루였어요.`,
              `${n}번 보냈는데 높음이 ${hi}번 포함해 균형 잡힌 하루였어요.`,
              `${n}번 채팅 중 높음이 ${hi}번이었어요. 긴 것도 있었지만 잘 활용했어요!`
            ])
          : pick([
              `오늘 총 ${n}번 중 높음이 ${hi}번이에요. 간결한 입력을 조금 더 늘려봐요!`,
              `오늘 ${n}번 보냈는데 높음이 ${hi}번! 낮음 입력을 함께 늘리면 더 좋아요 🌿`,
              `오늘 ${n}번 채팅 중 높음이 ${hi}번이에요. 짧게 나눠서 물어보면 어떨까요?`
            ])
      };
    }
    return {
      imgKey: "medium",
      msg: isPast
        ? pick([
            `총 ${n}번 중 낮음 ${lo}번, 높음 ${hi}번이었어요. 전반적으로 균형 잡힌 하루였어요.`,
            `${n}번 보냈는데 낮음 ${lo}번, 높음 ${hi}번으로 잘 활용했어요!`,
            `${n}번 채팅 중 낮음 ${lo}번, 높음 ${hi}번이었어요. 긴 것도 있었지만 잘 활용했어요!`
          ])
        : pick([
            `오늘 총 ${n}번 중 낮음 ${lo}번, 높음 ${hi}번이에요. 낮음이 많아서 좋아요! 높음도 조금씩 줄여봐요 🌿`,
            `오늘 ${n}번 채팅 중 낮음 ${lo}번, 높음 ${hi}번이에요. 낮음 비중이 높아서 좋지만 높음도 줄여봐요!`
          ])
    };
  }

  if (allLow) {
    return {
      imgKey: "low",
      msg: isPast
        ? pick([
            `총 ${n}번 전부 낮음이었어요. 간결하게 잘 쓴 하루였어요!`,
            `${n}번 모두 낮음으로 입력이 딱 좋았어요 🌱`,
            `${n}번 채팅했는데 전부 낮음이었어요. 훌륭한 하루였네요!`
          ])
        : pick([
            `오늘 총 ${n}번 전부 낮음이에요. 훌륭한 습관이에요! 🌱`,
            `오늘 ${n}번 모두 낮음! 짧고 명확한 질문들이에요. 이 페이스 유지해요!`,
            `오늘 ${n}번 채팅했는데 전부 낮음이에요. 덕분에 답변도 빨랐을 거예요 ✨`
          ])
    };
  }

  return {
    imgKey: "low",
    msg: isPast
      ? pick([
          `총 ${n}번 중 낮음이 ${lo}번이었어요. 간결하게 잘 쓴 하루였어요!`,
          `${n}번 보냈는데 낮음이 ${lo}번으로 입력이 딱 좋았어요 🌱`,
          `${n}번 채팅 중 낮음이 ${lo}번이었어요. 훌륭한 하루였네요!`
        ])
      : pick([
          `오늘 총 ${n}번 중 낮음이 ${lo}번이에요. 훌륭한 습관이에요! 🌱`,
          `오늘 ${n}번 보냈는데 낮음이 ${lo}번이나 됐어요. 짧고 명확한 질문을 잘 하고 있어요. 이 페이스 유지해요!`,
          `오늘 ${n}번 채팅 중 낮음이 ${lo}번이에요. 입력 길이가 딱 좋았어요. 덕분에 답변도 빨랐을 거예요 ✨`
        ])
  };
}

// ── Share image ──────────────────────────────────────────────
function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvasRR(ctx, x, y, w, h, r) {
  const R = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + R, y);
  ctx.lineTo(x + w - R, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + R);
  ctx.lineTo(x + w, y + h - R);
  ctx.quadraticCurveTo(x + w, y + h, x + w - R, y + h);
  ctx.lineTo(x + R, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - R);
  ctx.lineTo(x, y + R);
  ctx.quadraticCurveTo(x, y, x + R, y);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, maxWidth) {
  const lines = [];
  let cur = "";
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Conversions (rough estimates for illustration)
// 1 token ≈ 2 Korean characters
// Water: ~50ml saved per 1,000 tokens reduced (cooling overhead)
// Electricity: ~1 Wh saved per 1,000 tokens reduced
const CHARS_PER_TOKEN = 2;
const WATER_ML_PER_1K_TOKEN = 50;
const WH_PER_1K_TOKEN = 1;

async function downloadShareImage() {
  const stat = lastRenderedStat;
  const puri = lastRenderedPuri;

  if (!stat || !stat.submitCount) {
    alert("오늘의 AI 사용 기록이 없어요. 먼저 채팅을 보내보세요!");
    return;
  }

  nodes.shareImageBtn.disabled = true;
  nodes.shareImageBtn.innerHTML = "생성 중…";

  try {
    // ── Compute "어제 대비" values ───────────────────────────
    const reportDate = new Date();
    reportDate.setDate(reportDate.getDate() + reportOffset);
    const yDate = new Date(reportDate);
    yDate.setDate(yDate.getDate() - 1);
    const ydData   = latestDaily[formatDateKey(yDate)] || {};
    const ydAvg    = Math.round(ydData.avgFinalChars || 0);
    const todayAvg = Math.round(stat.avgFinalChars || 0);
    const charDiff = ydAvg > 0 ? ydAvg - todayAvg : null;   // positive = improved

    // Environmental impact based on chars saved vs yesterday
    const totalSaved    = charDiff !== null && charDiff > 0 ? charDiff * stat.submitCount : 0;
    const tokensSaved   = Math.round(totalSaved / CHARS_PER_TOKEN);
    const waterMl       = Math.round(tokensSaved * WATER_ML_PER_1K_TOKEN / 1000 * 10) / 10;
    const whSaved       = Math.round(tokensSaved * WH_PER_1K_TOKEN / 1000 * 100) / 100;

    const dateLabel = `${reportDate.getFullYear()}.${String(reportDate.getMonth()+1).padStart(2,"0")}.${String(reportDate.getDate()).padStart(2,"0")}`;

    // ── Canvas setup ────────────────────────────────────────
    const W = 1080, H = 1080;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    const KO    = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    const BRAND = "#d1d600";
    const DEEP  = "#4e5000";
    const DARK  = "#1a1a16";
    const MUTED = "#919188";
    const PAD   = 72;
    const IW    = W - PAD * 2;   // 936px inner width

    // ── Load assets ─────────────────────────────────────────
    const imgKey = puri?.imgKey || "low";
    const puriSrc = imgKey === "high" ? "../assets/puri_high_3d.png" : "../assets/puri_low_3d.png";
    const [puriImg, logoImg] = await Promise.all([loadImg(puriSrc), loadImg("../assets/logo_eng.svg")]);

    // ── Background ──────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#f0f27a"); bg.addColorStop(0.5, "#fafbcc"); bg.addColorStop(1, "#ffffff");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Radial glow behind puri
    const grd = ctx.createRadialGradient(W/2, 300, 20, W/2, 300, 260);
    grd.addColorStop(0, "rgba(255,255,255,0.7)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

    // ── Helpers ──────────────────────────────────────────────
    function divider(y) {
      ctx.strokeStyle = "rgba(26,26,22,0.12)";
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
    }

    // ── Y cursor ────────────────────────────────────────────
    let y = 0;

    // Header
    y = 78;
    ctx.font = `700 28px ${KO}`; ctx.fillStyle = DEEP; ctx.textAlign = "left";
    ctx.fillText("AI 사용 리포트", PAD, y);
    ctx.font = `500 24px ${KO}`; ctx.fillStyle = MUTED; ctx.textAlign = "right";
    ctx.fillText(dateLabel, W - PAD, y);

    // Puri image
    const PURI_SZ = 260;
    y = 114;
    if (puriImg) ctx.drawImage(puriImg, (W - PURI_SZ) / 2, y, PURI_SZ, PURI_SZ);
    y += PURI_SZ + 20;   // y = 394

    // Puri message (max 2 lines, 28px)
    ctx.font = `600 28px ${KO}`;
    const msgLines = wrapCanvasText(ctx, puri?.msg || "", IW).slice(0, 2);
    ctx.fillStyle = DARK; ctx.textAlign = "center";
    msgLines.forEach((line, i) => ctx.fillText(line, W / 2, y + 28 + 40 * i));
    y += 28 + 40 * (msgLines.length - 1) + 20;   // ~462 (2 lines)

    // Divider
    y += 20; divider(y); y += 32;   // ~514

    // ── Hero: 어제 대비 입력 길이 ──────────────────────────
    ctx.font = `500 22px ${KO}`; ctx.fillStyle = MUTED; ctx.textAlign = "center";
    ctx.fillText("어제 대비 평균 입력 길이", W / 2, y + 22); y += 38;

    ctx.font = `800 62px ${KO}`;
    let heroText, heroColor;
    if (charDiff === null) {
      heroText = `평균 ${formatNumber(todayAvg)}자`; heroColor = DEEP;
    } else if (charDiff > 0) {
      heroText = `${formatNumber(charDiff)}자 줄였어요`; heroColor = DEEP;
    } else if (charDiff < 0) {
      heroText = `${formatNumber(Math.abs(charDiff))}자 늘었어요`; heroColor = "#c05000";
    } else {
      heroText = "어제와 동일해요"; heroColor = DEEP;
    }
    // scale down if too wide
    let heroSize = 62;
    ctx.font = `800 ${heroSize}px ${KO}`;
    while (ctx.measureText(heroText).width > IW && heroSize > 36) {
      heroSize -= 2; ctx.font = `800 ${heroSize}px ${KO}`;
    }
    ctx.fillStyle = heroColor; ctx.textAlign = "center";
    ctx.fillText(heroText, W / 2, y + heroSize); y += heroSize + 28;   // ~666

    // Divider
    divider(y); y += 32;   // ~698

    // ── Environmental section ────────────────────────────────
    ctx.font = `500 22px ${KO}`; ctx.fillStyle = MUTED; ctx.textAlign = "center";
    const envLabel = charDiff !== null && charDiff > 0
      ? "AI 입력을 줄여 어제보다 아낀 것들"
      : "어제 대비 절감 데이터";
    ctx.fillText(envLabel, W / 2, y + 22); y += 48;   // ~746

    // Two-column: 💧 물 / ⚡ 전기 — no cards, large text
    const lcx = W / 4;   // 270
    const rcx = W * 3 / 4;   // 810

    // Emoji row
    ctx.font = `54px serif`; ctx.textAlign = "center";
    ctx.fillText("💧", lcx, y + 54);
    ctx.fillText("⚡", rcx, y + 54);
    y += 54 + 14;   // ~814

    // Value row
    ctx.font = `800 52px ${KO}`; ctx.fillStyle = DEEP; ctx.textAlign = "center";
    const waterStr = waterMl > 0 ? `${waterMl}ml` : "–";
    const whStr    = whSaved > 0 ? `${whSaved}Wh` : "–";
    ctx.fillText(waterStr, lcx, y + 52);
    ctx.fillText(whStr,    rcx, y + 52);
    y += 52 + 12;   // ~878

    // Label row
    ctx.font = `500 24px ${KO}`; ctx.fillStyle = MUTED; ctx.textAlign = "center";
    ctx.fillText("물 절약", lcx, y + 24);
    ctx.fillText("전기 절약", rcx, y + 24);
    y += 24 + 20;   // ~922

    // Estimate note
    ctx.font = `400 18px ${KO}`; ctx.fillStyle = "#c8c8ba"; ctx.textAlign = "center";
    ctx.fillText("* 환경 절감 수치는 추정값이에요", W / 2, y + 18);

    // ── Groo logo (pinned near bottom) ───────────────────────
    const LOGO_H = 32;
    const LOGO_TOP = H - 14 - 20 - LOGO_H;   // 1014
    if (logoImg) {
      const lw = LOGO_H * (361 / 95);
      ctx.drawImage(logoImg, (W - lw) / 2, LOGO_TOP, lw, LOGO_H);
    } else {
      ctx.font = `700 32px ${KO}`; ctx.fillStyle = DEEP; ctx.textAlign = "center";
      ctx.fillText("Groo", W / 2, LOGO_TOP + 28);
    }

    // ── Brand strip ──────────────────────────────────────────
    ctx.fillStyle = BRAND; ctx.fillRect(0, H - 14, W, 14);

    // ── Export ───────────────────────────────────────────────
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `그루_리포트_${dateLabel}.png`; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");

  } finally {
    nodes.shareImageBtn.disabled = false;
    nodes.shareImageBtn.innerHTML = `리포트 이미지 저장 <span class="beta-tag">(Beta)</span>`;
  }
}

function downloadLog() {
  const daily = latestDaily;
  const keys = Object.keys(daily).sort();
  if (!keys.length) {
    alert("다운로드할 로그 데이터가 없어요.");
    return;
  }
  const header = "날짜,전송횟수,낮음,중간,높음,평균글자수";
  const rows = keys.map((k) => {
    const d = daily[k] || {};
    return [
      k,
      d.submitCount || 0,
      d.lowCount || 0,
      d.mediumCount || 0,
      d.highCount || 0,
      Math.round(d.avgFinalChars || 0)
    ].join(",");
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `그루_로그_${formatDateKey(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function renderWeekCalendar(daily) {
  if (!nodes.weekBars || !nodes.weekDaysLabel) return;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = formatDateKey(date);
    const d = daily[key] || {};
    days.push({
      key,
      count: d.submitCount || 0,
      low:   d.lowCount   || 0,
      medium: d.mediumCount || 0,
      high:  d.highCount  || 0,
      isToday: i === 0,
      dayLabel: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  nodes.weekBars.innerHTML = days.map((day) => {
    const hasData = day.count > 0;
    const heightPct = hasData ? Math.max((day.count / maxCount) * 100, 8) : 0;
    const total = day.low + day.medium + day.high;
    const todayClass    = day.isToday ? " today" : "";
    const hasCountClass = hasData    ? " has-count" : "";
    const segments = hasData && total > 0
      ? [
          day.low    > 0 ? `<div class="week-seg low"    style="flex:${day.low}"></div>`    : "",
          day.medium > 0 ? `<div class="week-seg medium" style="flex:${day.medium}"></div>` : "",
          day.high   > 0 ? `<div class="week-seg high"   style="flex:${day.high}"></div>`   : ""
        ].join("")
      : "";
    return `<div class="week-bar-wrap${todayClass}${hasCountClass}">${
      hasData ? `<div class="week-bar-inner" style="height:${heightPct}%">${segments}</div>` : ""
    }</div>`;
  }).join("");

  nodes.weekDaysLabel.innerHTML = days.map((day) => {
    const todayClass = day.isToday ? " today" : "";
    return `<div class="week-day-cell${todayClass}">${escapeHtml(day.dayLabel)}</div>`;
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
