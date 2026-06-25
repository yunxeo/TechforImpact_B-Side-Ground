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
};

let customCharacterUrl    = null;
let reportOffset          = 0;
let lastRenderedStat      = null;
let lastRenderedPuri      = null;

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
  if (nodes.shareImageBtn) nodes.shareImageBtn.addEventListener("click", downloadShareImage);

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
    platformCounts: report?.platformCounts || {},
    peakHour:       report?.peakHour ?? null
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
    nodes.avgCharsText.innerHTML = `<span class="avg-num">${formatNumber(stat.avgFinalChars)}자</span> 정도 작성하셨네요.`;
  } else {
    nodes.avgCharsText.textContent = "사용을 시작하면 평균 작성 글자 수를 알려드려요.";
  }

  // Share btn: activate when there's data
  if (nodes.shareImageBtn) nodes.shareImageBtn.classList.toggle("has-data", stat.submitCount > 0);

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

  // 플랫폼별 전송 횟수
  const pc = stat.platformCounts || {};
  const platParts = [];
  if (pc.chatgpt > 0) platParts.push(`ChatGPT ${formatNumber(pc.chatgpt)}번`);
  if (pc.claude  > 0) platParts.push(`Claude ${formatNumber(pc.claude)}번`);
  if (pc.gemini  > 0) platParts.push(`Gemini ${formatNumber(pc.gemini)}번`);
  nodes.statPlatform.textContent = platParts.length > 0 ? platParts.join(" · ") : "—";

  // 최고 사용 시간대
  if (stat.peakHour !== null && stat.peakHour !== undefined) {
    const h = stat.peakHour;
    const period = h < 12 ? "오전" : "오후";
    const display = h % 12 === 0 ? 12 : h % 12;
    nodes.statPeak.textContent = `${period} ${display}시`;
  } else {
    nodes.statPeak.textContent = "—";
  }
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

  // lo=0: 전부 중간 (높음 없음) — 낮음 횟수 언급 없이 중립 메시지
  if (lo === 0) {
    return {
      imgKey: "low",
      msg: isPast
        ? pick([
            `총 ${n}번 전부 중간 길이였어요. 전반적으로 잘 활용한 하루예요!`,
            `${n}번 보냈는데 전부 중간 길이였어요. 조금 더 줄이면 더 좋아요 🌿`,
            `${n}번 채팅했는데 모두 중간 길이였어요. 핵심만 남기면 더 빠른 답변을 받을 수 있어요.`
          ])
        : pick([
            `오늘 ${n}번 전부 중간 길이예요. 조금 더 줄이면 더 좋아요 🌿`,
            `오늘 ${n}번 보냈는데 전부 중간 길이예요. 핵심만 남겨보세요!`,
            `오늘 ${n}번 채팅했어요. 중간 길이가 많아요 — 간결하게 줄이면 더 빠른 답변을 받을 수 있어요.`
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
          `오늘 ${n}번 보냈어요. 낮음이 ${lo}번으로 짧고 명확한 질문을 잘 하고 있어요. 이 페이스 유지해요!`,
          `오늘 ${n}번 채팅 중 낮음이 ${lo}번이에요. 간결함이 빠른 답변의 비결이에요 ✨`
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

  if (nodes.shareImageBtn) { nodes.shareImageBtn.disabled = true; nodes.shareImageBtn.innerHTML = "생성 중…"; }

  try {
    // 4× scale → 1360 × 1840px for crisp output
    const S = 4;
    const CW = 340 * S, CH = 460 * S;
    const canvas = document.createElement("canvas");
    canvas.width = CW; canvas.height = CH;
    const ctx = canvas.getContext("2d");

    const KO = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
    const C = {
      brand:     "#d1d600",
      brandDeep: "#4e5000",
      brandLight:"#f9fac0",
      brandPill: "#f1f47a",
      brandSub:  "#6b6e00",
      dark:      "#1a1a16",
      muted:     "#929288",
      sub:       "#5e5e57",
      white:     "#ffffff",
      orange:    "#f97316",
      red:       "#ef4444",
      border:    "rgba(209,214,0,0.5)",
    };

    // Scale-aware helpers using existing canvasRR
    function fillRR(x, y, w, h, r, color) {
      ctx.fillStyle = color;
      canvasRR(ctx, x * S, y * S, w * S, h * S, r * S);
      ctx.fill();
    }
    function strokeRR(x, y, w, h, r, color, lw) {
      ctx.strokeStyle = color;
      ctx.lineWidth = lw * S;
      canvasRR(ctx, x * S, y * S, w * S, h * S, r * S);
      ctx.stroke();
    }
    function txt(str, x, y, size, weight, color, align = "left", baseline = "top") {
      ctx.font = `${weight} ${size * S}px ${KO}`;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      ctx.fillText(str, x * S, y * S);
    }

    // Clip entire canvas to card rounded rect
    canvasRR(ctx, 0, 0, CW, CH, 10 * S);
    ctx.clip();

    // ── WHITE HEADER (y 0–135) ────────────────────────────────
    ctx.fillStyle = C.white;
    ctx.fillRect(0, 0, CW, 135 * S);

    // Date badge
    const reportDate = new Date();
    reportDate.setDate(reportDate.getDate() + reportOffset);
    const mon = reportDate.getMonth() + 1;
    const wk = Math.ceil(reportDate.getDate() / 7);
    const dateLabel = `${reportDate.getFullYear()}.${String(mon).padStart(2,"0")}.${String(reportDate.getDate()).padStart(2,"0")}`;

    fillRR(258, 15, 62, 20, 10, C.brand);
    // Center badge text using actual glyph metrics (not em-box estimates)
    {
      const badgeTxt = `${mon}월 ${wk}주차`;
      ctx.font = `500 ${8 * S}px ${KO}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      const bm = ctx.measureText(badgeTxt);
      const cy = (15 + 10) * S;  // badge vertical center in canvas px
      ctx.fillStyle = C.brandDeep;
      ctx.fillText(badgeTxt, 289 * S, cy + (bm.actualBoundingBoxAscent - bm.actualBoundingBoxDescent) / 2);
    }

    // Load assets: English logo + 2D low mascot
    const mascotSrc = customCharacterUrl || "../assets/puri_low.svg";
    const [logoImg, mascotImg] = await Promise.all([
      loadImg("../assets/logo_eng.svg"),
      loadImg(mascotSrc),
    ]);

    // Logo at (23, 19), natural height 12px
    if (logoImg) {
      const lh = 12 * S;
      const ar = logoImg.naturalWidth && logoImg.naturalHeight
        ? logoImg.naturalWidth / logoImg.naturalHeight : 3.83;
      ctx.drawImage(logoImg, 23 * S, 19 * S, ar * lh, lh);
    }

    // Mascot at (22, 44) 80×75px
    if (mascotImg) ctx.drawImage(mascotImg, 22 * S, 44 * S, 80 * S, 75 * S);

    // Headline: "오늘도" / "{N}개 프롬프트!"
    const hl1 = reportOffset === 0 ? "오늘도" : getDateLabel(reportOffset) + "도";
    const hl2 = `${formatNumber(stat.submitCount)}개 프롬프트!`;
    txt(hl1, 114, 48, 22, "700", C.brandDeep);
    txt(hl2, 114, 74, 22, "700", C.brandDeep);

    // Subtitle: comparison vs yesterday
    const ydDate = new Date(reportDate); ydDate.setDate(ydDate.getDate() - 1);
    const ydRaw = latestDaily[formatDateKey(ydDate)] || {};
    const ydCount = ydRaw.submitCount || 0;
    const ydAvgChars = ydCount > 0 ? Math.round((ydRaw.totalSubmittedChars || 0) / ydCount) : 0;
    let subtitle;
    if (ydCount > 0) {
      const diff = stat.submitCount - ydCount;
      const pct = Math.round(Math.abs(diff) / ydCount * 100);
      subtitle = diff > 0 ? `어제보다 ${pct}% 더 많이 사용했어요`
               : diff < 0 ? `어제보다 ${pct}% 적게 사용했어요`
               : "어제와 동일하게 사용했어요";
    } else {
      subtitle = `총 ${formatNumber(stat.submitCount)}개의 프롬프트를 보냈어요`;
    }
    txt(subtitle, 114, 103, 10, "500", C.brandSub);

    // ── YELLOW SECTION (y 135–460) ────────────────────────────
    ctx.fillStyle = C.brandLight;
    ctx.fillRect(0, 135 * S, CW, 325 * S);

    // Stat card: draws a white bordered card and its content
    function drawStatCard(cardX, label, value, unit, chip) {
      fillRR(cardX, 153, 146, 80, 12, C.white);
      strokeRR(cardX, 153, 146, 80, 12, C.border, 1);
      txt(label, cardX + 13, 163, 8, "500", C.muted);
      // Number at Figma position (top=176, 22px)
      const NUM_TOP = 176, NUM_SIZE = 22, UNIT_SIZE = 11;
      txt(value, cardX + 13, NUM_TOP, NUM_SIZE, "700", C.dark, "left", "top");
      ctx.font = `700 ${NUM_SIZE * S}px ${KO}`;
      const valPx = ctx.measureText(value).width;
      // Unit vertically centered on the number (avoids "1" appearing to float above "개")
      const unitTop = NUM_TOP + (NUM_SIZE - UNIT_SIZE) / 2;  // = 181.5
      txt(unit, cardX + 13 + valPx / S + 3, unitTop, UNIT_SIZE, "500", C.sub, "left", "top");
      if (chip) {
        fillRR(cardX + 13, 207, 84, 16, 8, C.brandPill);
        ctx.font = `500 ${8 * S}px ${KO}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const cm = ctx.measureText(chip);
        const chipCY = (207 + 8) * S;
        ctx.fillStyle = C.brandDeep;
        ctx.fillText(chip, (cardX + 13 + 42) * S, chipCY + (cm.actualBoundingBoxAscent - cm.actualBoundingBoxDescent) / 2);
      }
    }

    // Card 1: 총 프롬프트
    const chip1 = ydCount > 0
      ? (stat.submitCount >= ydCount
          ? `+${Math.round((stat.submitCount - ydCount) / ydCount * 100)}% 어제 대비`
          : `-${Math.round((ydCount - stat.submitCount) / ydCount * 100)}% 어제 대비`)
      : null;
    drawStatCard(20, "총 프롬프트", formatNumber(stat.submitCount), "개", chip1);

    // Card 2: 평균 프롬프트 (chip = 전날 대비)
    const todayAvg = stat.avgFinalChars || 0;
    const chip2 = ydAvgChars > 0 && todayAvg > 0
      ? (todayAvg >= ydAvgChars
          ? `+${Math.round((todayAvg - ydAvgChars) / ydAvgChars * 100)}% 전날 대비`
          : `-${Math.round((ydAvgChars - todayAvg) / ydAvgChars * 100)}% 전날 대비`)
      : null;
    drawStatCard(174, "평균 프롬프트", formatNumber(todayAvg), "자", chip2);

    // Bar chart label
    txt("평균 프롬프트 길이", 20, 241, 8, "500", C.muted);

    // Bar chart (total 300px wide)
    const bx = 20, by = 255, bw = 300, bh = 8;
    const lW = Math.round(bw * stat.lowRatioPct / 100);
    const mW = Math.round(bw * stat.mediumRatioPct / 100);
    const hW = bw - lW - mW;
    const totalPct = stat.lowRatioPct + stat.mediumRatioPct + stat.highRatioPct;
    if (totalPct > 0) {
      if (lW > 0) fillRR(bx, by, lW, bh, 4, C.brand);
      if (mW > 0) fillRR(bx + lW, by, mW, bh, 4, C.orange);
      if (hW > 0) fillRR(bx + lW + mW, by, hW, bh, 4, C.red);
    } else {
      fillRR(bx, by, bw, bh, 4, "#e5e5d8");
    }

    // Legend
    fillRR(20, 274, 6, 6, 3, C.brand);
    txt(`낮음 ${Math.round(stat.lowRatioPct)}%`, 30, 271, 10, "500", C.sub);
    fillRR(81, 274, 6, 6, 3, C.orange);
    txt(`중간 ${Math.round(stat.mediumRatioPct)}%`, 91, 271, 10, "500", C.sub);
    fillRR(142, 274, 6, 6, 3, C.red);
    txt(`높음 ${Math.round(stat.highRatioPct)}%`, 152, 271, 10, "500", C.sub);

    // Divider
    ctx.strokeStyle = C.border;
    ctx.lineWidth = S;
    ctx.beginPath();
    ctx.moveTo(20 * S, 292 * S); ctx.lineTo(320 * S, 292 * S);
    ctx.stroke();

    // Streak card
    fillRR(20, 303, 300, 60, 12, C.white);
    strokeRR(20, 303, 300, 60, 12, C.border, 1);

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(reportDate); d.setDate(d.getDate() - i);
      if ((latestDaily[formatDateKey(d)]?.submitCount || 0) > 0) streak++;
      else break;
    }
    const streakTitle = streak >= 2 ? `${streak}일 연속 Groo 사용 중!` : "오늘도 Groo 사용 중!";

    let peakStr = "사용 패턴을 분석 중이에요";
    if (stat.peakHour !== null && stat.peakHour !== undefined) {
      const h = stat.peakHour;
      peakStr = `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시에 가장 활발해요`;
    }

    // Precisely center two-line text block in streak card (y=303, h=60)
    {
      // textBaseline MUST be set before measureText so actualBoundingBoxAscent/Descent are relative to the alphabetic baseline
      ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${12 * S}px ${KO}`;
      const m1 = ctx.measureText(streakTitle);
      ctx.font = `500 ${10 * S}px ${KO}`;
      const m2 = ctx.measureText(peakStr);
      const gap = 5 * S;
      const blockH = m1.actualBoundingBoxAscent + m1.actualBoundingBoxDescent + gap + m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent;
      const cardCY = (303 + 30) * S;
      const l1base = cardCY - blockH / 2 + m1.actualBoundingBoxAscent;
      const l2base = l1base + m1.actualBoundingBoxDescent + gap + m2.actualBoundingBoxAscent;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.dark;
      ctx.font = `700 ${12 * S}px ${KO}`;
      ctx.fillText(streakTitle, 37 * S, l1base);
      ctx.fillStyle = C.muted;
      ctx.font = `500 ${10 * S}px ${KO}`;
      ctx.fillText(peakStr, 37 * S, l2base);
    }

    // Footer
    txt("© 2026 Groo. B개발구역.", 170, 447, 8, "500", C.sub, "center", "middle");

    // ── Export ────────────────────────────────────────────────
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `그루_리포트_${dateLabel}.png`; a.click();
      URL.revokeObjectURL(url);
    }, "image/png");

  } finally {
    if (nodes.shareImageBtn) { nodes.shareImageBtn.disabled = false; nodes.shareImageBtn.innerHTML = `리포트 이미지 저장 <span class="beta-tag">(Beta)</span>`; }
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

  const maxCount = Math.max(...days.map((d) => d.count), 20); // 최소 20 기준으로 스케일

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
