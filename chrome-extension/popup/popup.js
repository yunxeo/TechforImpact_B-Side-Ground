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
  focusMode: false,
  badgeSize: "md",
  thresholds: { lowMax: 100, mediumMax: 400 }
};

const CUSTOM_PROMPTS = {
  "과제 중심 대학생": {
    icon: "📚",
    presets: [
      { label: "공통 기본 설정", prompt: "과제에 바로 쓸 수 있게 핵심만 정리해줘.\n불필요한 배경 설명, 반복, 과한 예시는 줄여줘.\n질문이 명확하면 추가 질문 없이 바로 결과물을 보여줘." },
      { label: "보고서 / 리포트용", prompt: "보고서에 넣을 수 있게 서론, 본론, 결론 흐름으로 정리해줘.\n주장과 근거 중심으로 작성하고, 불필요한 설명은 줄여줘." },
      { label: "발표 준비용", prompt: "발표에 활용할 핵심 메시지부터 정리해줘.\n슬라이드 내용과 말로 설명할 내용을 구분해줘.\n청중이 이해하기 쉬운 흐름으로 구성해줘." },
      { label: "요약 / 정리용", prompt: "핵심 내용만 남기고 중복은 제거해줘.\n원문에 없는 해석은 추가하지 마.\n중요도 순서로 짧게 정리해줘." },
      { label: "교수님 메일용", prompt: "교수님께 보낼 수 있는 메일 완성본을 작성해줘.\n제목과 본문만 보여줘.\n정중하지만 과하게 딱딱하지 않게 써줘." },
      { label: "자료 조사용", prompt: "과제에 쓸 핵심 자료만 정리해줘.\n결론, 근거, 활용 가능성 순서로 답해줘.\n확실하지 않은 정보는 단정하지 마." },
      { label: "글쓰기 / 문장 다듬기용", prompt: "의미는 유지하고 자연스럽고 간결하게 다듬어줘.\nAI가 쓴 것처럼 보이는 표현은 줄여줘.\n수정 문장부터 보여줘." },
      { label: "비교 / 선택용", prompt: "비교 기준을 먼저 잡고 핵심 차이만 정리해줘.\n마지막에는 과제에 쓰기 좋은 방향을 추천해줘." },
      { label: "피드백 반영용", prompt: "피드백을 문제점과 개선 방향으로 나눠 정리해줘.\n우선순위와 실제 수정안을 짧게 제안해줘." },
      { label: "최종 제출용 정리", prompt: "최종 제출물처럼 깔끔하게 다듬어줘.\n반복과 장식 문구는 제거해줘.\n바로 복사해서 쓸 수 있게 완성본으로 보여줘." }
    ]
  },
  "시험공부형 학생": {
    icon: "📝",
    presets: [
      { label: "공통 기본 설정", prompt: "시험에 필요한 핵심 위주로 짧게 설명해줘.\n개념은 정의, 핵심 원리, 적용법 순서로 정리해줘.\n심화 설명은 요청할 때만 추가해줘." },
      { label: "개념 이해용", prompt: "처음 공부하는 학생도 이해할 수 있게 설명해줘.\n정의, 핵심 원리, 짧은 예시 순서로 정리해줘." },
      { label: "문제 풀이용", prompt: "풀이 흐름과 핵심 계산만 보여줘.\n당연한 계산 과정은 생략해줘.\n마지막에 최종 답을 표시해줘." },
      { label: "시험 직전 정리용", prompt: "시험 직전에 볼 수 있게 핵심만 압축해줘.\n중요 개념, 자주 나오는 유형, 실수 포인트만 정리해줘." },
      { label: "오답 정리용", prompt: "내가 틀린 이유를 짧게 분석해줘.\n실수 포인트와 다시 풀 때 주의할 점을 중심으로 정리해줘." },
      { label: "공식 정리용", prompt: "공식의 의미, 사용 조건, 적용 방법을 정리해줘.\n외워야 할 부분과 이해할 부분을 구분해줘." },
      { label: "암기용 정리", prompt: "암기할 내용을 키워드 중심으로 짧게 정리해줘.\n헷갈리는 개념은 비교해서 보여줘." },
      { label: "비교 개념 정리용", prompt: "비슷한 개념의 차이를 짧게 비교해줘.\n정의, 핵심 차이, 적용 상황 중심으로 정리해줘." },
      { label: "예제 요청용", prompt: "개념 이해용 짧은 예제를 만들어줘.\n풀이도 핵심만 보여줘.\n시험에 나올 법한 방식으로 구성해줘." },
      { label: "복습 체크용", prompt: "이해 확인용 짧은 체크 질문을 만들어줘.\n정답도 함께 짧게 제공해줘." }
    ]
  },
  "코딩 중심 사용자": {
    icon: "💻",
    presets: [
      { label: "공통 기본 설정", prompt: "수정 위치와 코드부터 보여줘.\n긴 개념 설명은 생략하고 이유만 짧게 설명해줘.\n전체 코드보다 바뀐 부분 중심으로 알려줘." },
      { label: "오류 해결용", prompt: "오류 원인을 먼저 짧게 말해줘.\n수정 코드와 위치를 보여줘.\n마지막에 확인 방법만 알려줘." },
      { label: "기능 구현용", prompt: "필요한 코드부터 보여줘.\n어느 파일의 어느 부분에 넣어야 하는지 명확히 알려줘.\n충돌 가능성만 짧게 설명해줘." },
      { label: "코드 수정용", prompt: "바꿔야 할 부분만 알려줘.\n수정 전후를 구분해줘.\n수정 이유는 짧게 설명해줘." },
      { label: "리팩토링용", prompt: "바뀐 구조와 수정 코드를 먼저 보여줘.\n가독성, 유지보수성, 중복 제거 기준으로 제안해줘." },
      { label: "코드 리뷰용", prompt: "문제가 되는 부분을 우선순위대로 지적해줘.\n이유와 수정 방향을 짧게 붙여줘." },
      { label: "파일 구조 설명용", prompt: "어디를 수정해야 하는지 먼저 알려줘.\n각 파일의 역할은 짧게 설명해줘." },
      { label: "디버깅 절차용", prompt: "가장 가능성 높은 원인부터 점검 순서를 알려줘.\n각 단계에서 확인할 값이나 로그를 제시해줘." },
      { label: "붙여넣기용 코드 생성", prompt: "바로 복사해서 붙여넣을 수 있는 코드로 작성해줘.\n필요하면 파일명과 위치를 함께 표시해줘." },
      { label: "성능 / 최적화용", prompt: "성능 병목을 먼저 찾아줘.\n바로 적용 가능한 수정 방법과 기대 효과를 짧게 설명해줘." }
    ]
  },
  "글쓰기 / 커뮤니케이션형": {
    icon: "✍️",
    presets: [
      { label: "공통 기본 설정", prompt: "바로 사용할 수 있는 완성본부터 보여줘.\n작성 의도나 문체 분석은 생략해줘.\n문장은 자연스럽고 간결하게 써줘." },
      { label: "메일 작성용", prompt: "메일은 제목과 본문만 작성해줘.\n정중하지만 너무 길거나 딱딱하지 않게 써줘.\n바로 복사해서 보낼 수 있게 완성본으로 보여줘." },
      { label: "카톡 / DM 작성용", prompt: "자연스러운 말투로 작성해줘.\n부담스럽거나 과하게 진지한 표현은 피하고 짧게 써줘." },
      { label: "문장 다듬기용", prompt: "의미는 유지하고 자연스럽게 다듬어줘.\nAI처럼 보이는 표현은 줄여줘.\n다듬은 문장만 먼저 보여줘." },
      { label: "사과 / 부탁 / 거절용", prompt: "부드럽고 정중하게 작성해줘.\n변명처럼 들리는 표현은 줄이고 핵심 입장을 명확히 전달해줘." },
      { label: "공지 / 안내문용", prompt: "공지문으로 바로 쓸 수 있게 작성해줘.\n일정, 대상, 행동 요청이 잘 보이게 정리해줘." },
      { label: "자기소개 / 소개글용", prompt: "자연스럽고 간결한 소개글로 작성해줘.\n과장된 표현은 줄이고 목적에 맞는 정보만 담아줘." },
      { label: "번역 / 톤 조정용", prompt: "직역보다 자연스러운 표현으로 번역해줘.\n의미는 유지하고 어색한 표현은 다듬어줘." },
      { label: "홍보 문구용", prompt: "짧고 직관적인 홍보 문구로 작성해줘.\n과장된 표현은 피하고 장점을 먼저 보여줘." },
      { label: "표현 확인용", prompt: "문장이 어색한지 판단하고 자연스럽게 고쳐줘.\n어색한 이유는 한 줄로만 설명해줘." }
    ]
  },
  "리서치 / 자료조사형": {
    icon: "🔍",
    presets: [
      { label: "공통 기본 설정", prompt: "결론, 근거, 활용 가능성 순서로 정리해줘.\n바로 쓸 수 있는 정보 위주로 답해줘.\n확실하지 않은 정보는 단정하지 마." },
      { label: "시장 조사용", prompt: "시장 규모, 타깃, 경쟁 서비스, 진입 가능성 중심으로 정리해줘.\n중요한 리스크도 짧게 포함해줘." },
      { label: "사례 조사용", prompt: "관련 사례를 핵심 특징과 시사점 중심으로 정리해줘.\n각 사례가 왜 참고할 만한지 짧게 말해줘." },
      { label: "논문 / 자료 정리용", prompt: "핵심 주장, 근거, 한계, 활용 가능성을 정리해줘.\n원문에 없는 해석은 구분해서 표시해줘." },
      { label: "최신 정보 확인용", prompt: "최신성이 중요한 내용은 기준일을 표시해줘.\n오래된 정보와 최신 정보를 구분해줘." },
      { label: "비교 조사용", prompt: "비교 기준을 먼저 잡고 핵심 차이만 비교해줘.\n마지막에 활용하기 좋은 결론을 제시해줘." },
      { label: "근거 정리용", prompt: "주장에 사용할 근거를 핵심만 정리해줘.\n근거의 신뢰도와 한계도 짧게 표시해줘." },
      { label: "트렌드 분석용", prompt: "핵심 변화, 원인, 영향 순서로 정리해줘.\n현실적인 해석과 활용 기회를 제안해줘." },
      { label: "정책 / 제도 조사용", prompt: "정책의 핵심 내용, 대상, 효과, 한계를 정리해줘.\n기준일과 확인 필요 여부를 표시해줘." },
      { label: "자료 활용 정리용", prompt: "자료를 보고서, 발표, 기획서에 어떻게 활용할지 정리해줘.\n중요도 순서로 압축해줘." }
    ]
  },
  "창업 / 비즈니스형": {
    icon: "🚀",
    presets: [
      { label: "공통 기본 설정", prompt: "실행 가능성과 수익 가능성을 먼저 판단해줘.\n타깃 고객, 문제, 해결 방식, 수익모델 중심으로 정리해줘.\n리스크도 함께 말해줘." },
      { label: "사업 아이디어 검토용", prompt: "수요, 실행 난이도, 수익 가능성, 리스크를 기준으로 판단해줘.\n가장 먼저 검증할 가설을 제안해줘." },
      { label: "수익모델 설계용", prompt: "현실적인 수익모델부터 제안해줘.\n장점, 한계, 초기 실행 방법을 짧게 정리해줘." },
      { label: "마케팅 전략용", prompt: "타깃 고객, 유입 채널, 핵심 메시지, 첫 실행 방법 중심으로 정리해줘.\n바로 테스트 가능한 방법을 우선 제안해줘." },
      { label: "MVP 검증용", prompt: "가장 작게 만들 수 있는 MVP를 제안해줘.\n검증 지표와 실패 기준을 짧게 정리해줘." },
      { label: "고객 분석용", prompt: "고객의 문제, 욕구, 지불 의사, 접근 채널을 정리해줘.\n초기 타깃은 좁혀서 제안해줘." },
      { label: "경쟁 서비스 분석용", prompt: "경쟁 서비스를 강점, 약점, 가격, 차별화 가능성 중심으로 비교해줘.\n진입하기 어려운 이유도 말해줘." },
      { label: "랜딩페이지 / 세일즈 문구용", prompt: "문제, 해결책, 혜택, 행동 유도 순서로 작성해줘.\n과장된 표현은 줄이고 전환에 필요한 말만 써줘." },
      { label: "실행 로드맵용", prompt: "먼저 해야 할 일부터 순서대로 정리해줘.\n단기 실행, 검증, 개선 단계로 나눠줘." },
      { label: "리스크 점검용", prompt: "시장, 고객, 운영, 수익성 리스크를 점검해줘.\n심각도와 대응 방법을 짧게 정리해줘." }
    ]
  },
  "초압축 효율형": {
    icon: "⚡",
    presets: [
      { label: "공통 기본 설정", prompt: "답변은 최대한 짧게 해줘.\n핵심 결론과 실행할 내용만 말해줘.\n추가 설명은 요청할 때만 해줘." },
      { label: "빠른 판단용", prompt: "결론부터 말해줘.\n추천안 하나와 이유 한 줄만 제시해줘." },
      { label: "짧은 정리용", prompt: "핵심만 짧은 항목으로 정리해줘.\n중복 표현은 제거하고 중요도 순서로 보여줘." },
      { label: "즉시 실행용", prompt: "바로 해야 할 일만 순서대로 알려줘.\n첫 번째 행동을 명확히 말해줘." },
      { label: "비교 / 선택용", prompt: "가장 좋은 선택지 하나만 추천해줘.\n대안은 꼭 필요할 때만 하나 제시해줘." },
      { label: "요약용", prompt: "핵심 내용만 남기고 압축해줘.\n중요하지 않은 세부사항은 생략해줘." },
      { label: "메일 / 문장 작성용", prompt: "바로 보낼 수 있는 완성 문장만 보여줘.\n짧고 자연스럽게 써줘." },
      { label: "코드 도움용", prompt: "수정 코드부터 보여줘.\n설명은 한두 줄로만 해줘." },
      { label: "아이디어 선택용", prompt: "가장 현실적인 아이디어만 골라줘.\n첫 실행 방법만 알려줘." },
      { label: "피드백용", prompt: "가장 중요한 문제부터 말해줘.\n바로 고칠 수 있는 수정 방향을 제시해줘." }
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
  presetList: $("#presetList"),
  copyPromptBtn: $("#copyPromptBtn")
};

let customCharacterUrl = null;
let reportOffset = 0;
let selectedPersona = Object.keys(CUSTOM_PROMPTS)[0];
let selectedPresetIdx = -1;

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

function render(state) {
  nodes.enabled.checked = Boolean(state.settings.enabled);
  if (nodes.focusMode) nodes.focusMode.checked = Boolean(state.settings.focusMode);
  renderCustomPrompts();
}

function renderCustomPrompts() {
  if (!nodes.personaTabs || !nodes.presetList) return;

  const personaKeys = Object.keys(CUSTOM_PROMPTS);

  nodes.personaTabs.innerHTML = personaKeys.map((key) => {
    const p = CUSTOM_PROMPTS[key];
    const active = key === selectedPersona;
    return `<button class="persona-tab${active ? " active" : ""}" data-persona="${escapeHtml(key)}">${p.icon} ${escapeHtml(key)}</button>`;
  }).join("");

  nodes.personaTabs.querySelectorAll(".persona-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPersona = btn.dataset.persona;
      selectedPresetIdx = -1;
      if (nodes.copyPromptBtn) {
        nodes.copyPromptBtn.disabled = true;
        nodes.copyPromptBtn.textContent = "지침 복사하기";
        nodes.copyPromptBtn.classList.remove("copied");
      }
      renderCustomPrompts();
    });
  });

  const presets = CUSTOM_PROMPTS[selectedPersona]?.presets || [];
  nodes.presetList.innerHTML = presets.map((preset, idx) => {
    const selected = idx === selectedPresetIdx;
    return `<div class="preset-item${selected ? " selected" : ""}" data-idx="${idx}">${escapeHtml(preset.label)}</div>`;
  }).join("");

  nodes.presetList.querySelectorAll(".preset-item").forEach((item) => {
    item.addEventListener("click", () => {
      selectedPresetIdx = Number(item.dataset.idx);
      if (nodes.copyPromptBtn) {
        nodes.copyPromptBtn.disabled = false;
        nodes.copyPromptBtn.textContent = "지침 복사하기";
        nodes.copyPromptBtn.classList.remove("copied");
      }
      renderCustomPrompts();
    });
  });
}

function bindCopyBtn() {
  if (!nodes.copyPromptBtn) return;
  nodes.copyPromptBtn.addEventListener("click", async () => {
    if (selectedPresetIdx < 0) return;
    const preset = CUSTOM_PROMPTS[selectedPersona]?.presets?.[selectedPresetIdx];
    if (!preset) return;
    try {
      await navigator.clipboard.writeText(preset.prompt);
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
