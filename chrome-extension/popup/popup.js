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

  const maxCount = Math.max(...days.map((d) => d.count), 10); // 최소 10 기준으로 스케일

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
