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
  enabled: $("#enabled"),
  focusMode: $("#focusMode"),
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
  personaTabs: $("#personaTabs"),
  promptFulltext: $("#promptFulltext"),
  copyPromptBtn: $("#copyPromptBtn"),
  tipBarScale: $("#tipBarScale"),
  tipBarScaleValue: $("#tipBarScaleValue"),
  tipScaleReset: $("#tipScaleReset"),
  tipPreviewBadge: $("#tipPreviewBadge"),
  tipPreviewPuri: $("#tipPreviewPuri")
};

let customCharacterUrl = null;
let reportOffset = 0;
let selectedPersona = Object.keys(CUSTOM_PROMPTS)[0];

boot();

async function boot() {
  const state = await getState();
  const stored = await storageGet([STORAGE_KEYS.CUSTOM_CHARACTER]);
  customCharacterUrl = stored[STORAGE_KEYS.CUSTOM_CHARACTER] || null;
  render(state);
  bindEvents(state.settings);
  bindCharacterUpload();
  bindCopyBtn();
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
  renderCustomPrompts();
}

function renderCustomPrompts() {
  if (!nodes.personaTabs) return;

  const personaKeys = Object.keys(CUSTOM_PROMPTS);

  nodes.personaTabs.innerHTML = personaKeys.map((key) => {
    const p = CUSTOM_PROMPTS[key];
    const active = key === selectedPersona;
    return `<button class="persona-tab${active ? " active" : ""}" data-persona="${escapeHtml(key)}">${p.icon} ${escapeHtml(key)}</button>`;
  }).join("");

  nodes.personaTabs.querySelectorAll(".persona-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPersona = btn.dataset.persona;
      if (nodes.copyPromptBtn) {
        nodes.copyPromptBtn.textContent = "지침 복사하기";
        nodes.copyPromptBtn.classList.remove("copied");
      }
      updatePromptFulltext();
      renderCustomPrompts();
    });
  });

  updatePromptFulltext();

  if (nodes.copyPromptBtn) {
    nodes.copyPromptBtn.disabled = false;
  }
}

function updatePromptFulltext() {
  if (!nodes.promptFulltext) return;
  const presets = CUSTOM_PROMPTS[selectedPersona]?.presets || [];
  const prompt = presets[0]?.prompt || "";
  nodes.promptFulltext.textContent = prompt;
  const HOW_DEMO_IDS = { "chatgpt-path": "popupChatgptTyping", "claude-path": "popupClaudeTyping", "gemini-path": "popupGeminiTyping" };
  Object.values(HOW_DEMO_IDS).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = prompt;
  });
}

function bindCopyBtn() {
  if (!nodes.copyPromptBtn) return;
  nodes.copyPromptBtn.addEventListener("click", async () => {
    if (!nodes.promptFulltext?.textContent) return;
    try {
      await navigator.clipboard.writeText(nodes.promptFulltext.textContent);
      nodes.copyPromptBtn.textContent = "복사됐어요! ✓";
      nodes.copyPromptBtn.classList.add("copied");
      setTimeout(() => {
        nodes.copyPromptBtn.textContent = "지침 복사하기";
        nodes.copyPromptBtn.classList.remove("copied");
      }, 2000);
    } catch {
      nodes.copyPromptBtn.textContent = "복사 실패";
      setTimeout(() => { nodes.copyPromptBtn.textContent = "지침 복사하기"; }, 2000);
    }
  });
}

function bindEvents(settings) {
  nodes.enabled.addEventListener("change", () => updateSetting({ enabled: nodes.enabled.checked }));
  if (nodes.focusMode) nodes.focusMode.addEventListener("change", () => updateSetting({ focusMode: nodes.focusMode.checked }));
  function updateTipPreview(scale) {
    if (nodes.tipBarScaleValue) nodes.tipBarScaleValue.textContent = `${scale}%`;
    if (nodes.tipPreviewBadge) {
      const s = scale / 100;
      nodes.tipPreviewBadge.style.transform = `scale(${s})`;
      nodes.tipPreviewBadge.style.transformOrigin = "left center";
      nodes.tipPreviewBadge.style.marginBottom = `${(s - 1) * 40}px`;
    }
  }

  if (nodes.tipBarScale) {
    const savedScale = settings.tipBarScale ?? 80;
    nodes.tipBarScale.value = String(savedScale);
    updateTipPreview(savedScale);
    nodes.tipBarScale.addEventListener("input", () => {
      const v = Number(nodes.tipBarScale.value);
      updateTipPreview(v);
      updateSetting({ tipBarScale: v });
    });
  }
  if (nodes.tipScaleReset) {
    nodes.tipScaleReset.addEventListener("click", () => {
      if (nodes.tipBarScale) nodes.tipBarScale.value = "80";
      updateTipPreview(80);
      updateSetting({ tipBarScale: 80 });
    });
  }
  if (nodes.tipPreviewPuri) {
    storageGet([STORAGE_KEYS.SETTINGS]).then((data) => {
      const s = data[STORAGE_KEYS.SETTINGS] || {};
      nodes.tipPreviewPuri.src = s.customLogoUrl ||
        (typeof chrome !== "undefined" ? chrome.runtime.getURL("assets/puri_low.svg") : "");
    });
  }

  let howDemoTimer = null;
  const HOW_DEMO_IDS = { "chatgpt-path": "popupChatgptTyping", "claude-path": "popupClaudeTyping", "gemini-path": "popupGeminiTyping" };

  function startHowDemoTyping(pathId) {
    const el = document.getElementById(HOW_DEMO_IDS[pathId]);
    if (!el) return;
    const text = CUSTOM_PROMPTS[selectedPersona]?.presets?.[0]?.prompt || "";
    el.textContent = "";
    if (howDemoTimer) clearInterval(howDemoTimer);
    let i = 0;
    howDemoTimer = setInterval(() => {
      if (i < text.length) { el.textContent += text[i++]; } else { clearInterval(howDemoTimer); }
    }, 18);
  }

  function initHowDemoAll() {
    Object.keys(HOW_DEMO_IDS).forEach((pathId) => {
      const el = document.getElementById(HOW_DEMO_IDS[pathId]);
      if (el) el.textContent = CUSTOM_PROMPTS[selectedPersona]?.presets?.[0]?.prompt || "";
    });
  }

  document.querySelectorAll(".popup-how-tab, .how-tab-sm").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.tab || btn.dataset.target;
      if (btn.classList.contains("popup-how-tab")) {
        document.querySelectorAll(".popup-how-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === key));
        document.querySelectorAll(".popup-how-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === key));
      } else {
        const section = btn.closest(".how-to-inline");
        section.querySelectorAll(".how-tab-sm").forEach((t) => t.classList.toggle("active", t.dataset.target === key));
        section.querySelectorAll(".how-path").forEach((p) => p.classList.toggle("active", p.id === key));
        startHowDemoTyping(key);
      }
    });
  });

  initHowDemoAll();
  startHowDemoTyping("chatgpt-path");
  nodes.refreshReport.addEventListener("click", loadAndRenderReport);
  nodes.openGuide.addEventListener("click", openOnboardingOnActiveTab);

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
  if (!stat.submitCount) {
    return "전송 기록이 생기면 입력 채팅 길이의 낮음·중간·높음 비율을 보여드릴게요.";
  }

  const parts = [];
  if (stat.lowRatioPct > 0) parts.push(`낮음 ${stat.lowRatioPct}%`);
  if (stat.mediumRatioPct > 0) parts.push(`중간 ${stat.mediumRatioPct}%`);
  if (stat.highRatioPct > 0) parts.push(`높음 ${stat.highRatioPct}%`);

  if (!parts.length) {
    return `${getDayLabel()} 보낸 프롬프트 길이 비율을 정리하는 중이에요.`;
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
  if (!stat || stat.submitCount === 0) {
    return {
      imgKey: "idle",
      msg: isPast ? "전송 기록이 없어요." : "아직 오늘 전송 기록이 없어요. 간결하게 써봐요!"
    };
  }
  const highRatio = stat.highCount / stat.submitCount;
  if (highRatio > 0.5) {
    return {
      imgKey: "high",
      msg: `${stat.submitCount}번 중 ${stat.highCount}번은 길었어요.${isPast ? "" : " 나눠 물어보면 답이 더 또렷해질 수 있어요."}`
    };
  }
  if (highRatio > 0.2) {
    return {
      imgKey: "medium",
      msg: `${stat.submitCount}번 보냈어요.${isPast ? "" : " 조금만 더 줄이면 더 빠른 답을 받기 쉬워요."}`
    };
  }
  return {
    imgKey: "low",
    msg: `${stat.submitCount}번 보냈는데, 대부분 간결했어요.${isPast ? "" : " 잘하고 있어요!"}`
  };
}

function buildLineChart(days, values) {
  const w = 220, h = 60, pad = 8;
  const max = Math.max(...values, 1);
  const n = days.length;
  const points = values.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const circles = values.map((v, i) => {
    const x = pad + (i / (n - 1)) * (w - pad * 2);
    const y = h - pad - (v / max) * (h - pad * 2);
    const isTodayDay = days[i]?.isToday;
    return `<circle cx="${x}" cy="${y}" r="${isTodayDay ? 4 : 3}" fill="${isTodayDay ? "#a8ac00" : "#d1d600"}"/>`;
  }).join("");
  return `<svg width="100%" viewBox="0 0 ${w} ${h}">
    <polyline points="${points}" fill="none" stroke="#d1d600" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${circles}
  </svg>`;
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

  const values = days.map((d) => d.count);
  nodes.weekBars.innerHTML = buildLineChart(days, values);

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
