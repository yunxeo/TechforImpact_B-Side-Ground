(() => {
  "use strict";

  const APP = "챗풀Chatpull";
  const ROOT_ID = "chatpull-green-root";
  const ONBOARDING_ROOT_ID = "chatpull-onboarding-root";
  const ONBOARDING_KEY = "chatpool.onboarded";
  const STORAGE_KEYS = {
    SETTINGS: "chatpool.settings"
  };

  const FIXED_DESIGN_VARIANT = "tree-status-badge";
  const LOGO_PLACEMENTS = new Set(["top-right"]);
  const DEFAULT_SETTINGS = {
    enabled: true,
    designVariant: FIXED_DESIGN_VARIANT,
    nudgeTextScale: 80,
    floatingLogoScale: 80,
    floatingLogoPlacement: "top-right",
    dragEnabled: false,
    customPosition: null,
    onboardingGuideShown: false,
    thresholds: {
      lowMax: 100,
      mediumMax: 400
    }
  };

  const PROMPT_TIP_AUTO_DURATION_MS = 5000;
  const PROMPT_TIP_INLINE_REPEAT_GUARD_MS = 45000;
  const PROMPT_TIP_INLINE_COOLDOWN_MS = 5000;
  const PROMPT_TIP_INLINE_ANIMATION_MS = 1500;

  const REPORT_MIN_MEANINGFUL_CHARS = 20;
  const DRAFT_UPDATE_MIN_INTERVAL_MS = 500;
  const DRAFT_UPDATE_MIN_CHAR_DELTA = 12;
  const SUBMIT_FALLBACK_WINDOW_MS = 10000;

  const SELECTORS = {
    editor: [
      "#prompt-textarea",
      "[contenteditable='true'][id='prompt-textarea']",
      "textarea[data-id='root']",
      "textarea[placeholder]",
      "textarea[aria-label*='prompt' i]",
      "textarea[aria-label*='message' i]",
      "textarea[aria-label*='질문' i]",
      "textarea[aria-label*='메시지' i]",
      "rich-textarea textarea",
      "rich-textarea [contenteditable='true']",
      "[data-test-id*='input' i] [contenteditable='true']",
      "[data-testid*='input' i] [contenteditable='true']",
      "[contenteditable='true'][aria-label*='Gemini' i]",
      "[contenteditable='true'][aria-label*='prompt' i]",
      "[contenteditable='true'][aria-label*='message' i]",
      "[contenteditable='true'][aria-label*='질문' i]",
      "[contenteditable='true'][aria-label*='메시지' i]",
      "[contenteditable='true'][role='textbox']",
      "form textarea",
      "form [contenteditable='true']",
      "[role='textbox']"
    ],
    sendButton: [
      "button[data-testid='send-button']",
      "button[data-test-id*='send' i]",
      "button[data-testid*='send' i]",
      "button[aria-label*='Send' i]",
      "button[aria-label*='Submit' i]",
      "button[aria-label*='전송' i]",
      "button[aria-label*='보내기' i]",
      "button[aria-label*='제출' i]",
      "button[type='submit']",
      "form button[type='submit']"
    ]
  };

  const PLATFORM = detectPlatform();

  const NUDGE_TEXTS = window.CHATPULL_NUDGE_TEXTS || {
    low: { hover: ["딱 좋은 길이예요. AI가 핵심에 집중할 수 있어요"] },
    medium: {
      entry: ["핵심만 남기면 더 빠르고 정확한 답변을 받을 수 있어요"],
      hover: ["군더더기를 빼면 AI가 더 잘 파악해요. 처리해야 할 토큰도 줄어들 수 있어요"]
    },
    high: {
      entry: ["나눠서 물어보면 각각 더 정확한 답변을 받을 수 있어요"],
      hover: ["긴 입력은 AI가 앞 맥락을 놓칠 수 있어요. 나누면 답변이 더 선명해질 수 있어요"],
      on_send: ["새 채팅을 열면 AI가 더 집중할 수 있어요"],
      on_send_hover: ["방금처럼 긴 입력은 다음번에 주제별로 나누면 처리 부담을 줄일 수 있어요"]
    }
  };

  const PROMPT_TIP_BANK = Array.isArray(window.CHATPULL_PROMPT_TIPS) ? window.CHATPULL_PROMPT_TIPS : [];
  const ENVIRONMENT_NUDGE_TEXTS = {
    idle: [
      "마우스를 올리면 입력 길이에 따른 환경 넛지를 볼 수 있어요.",
      "배지는 답변 품질 팁과 환경 넛지를 분리해서 보여줍니다."
    ],
    low: [
      "짧고 명확한 입력은 불필요한 연산을 줄이는 데 도움이 돼요.",
      "핵심만 담긴 입력은 AI가 더 적은 맥락으로도 답하기 쉬워요."
    ],
    medium: [
      "조금 줄이면 처리해야 할 토큰이 줄어 환경 부담도 낮아질 수 있어요.",
      "중간 길이 입력입니다. 반복 표현을 덜어내면 연산량을 줄이는 데 도움이 돼요."
    ],
    high: [
      "긴 입력은 처리 토큰이 많아져 연산량과 에너지 사용이 커질 수 있어요.",
      "질문을 나누면 답변 품질을 높이면서 한 번에 처리되는 토큰 부담을 줄일 수 있어요."
    ],
    postSendHigh: [
      "방금처럼 긴 입력은 다음번에 주제별로 나누면 처리 부담을 줄일 수 있어요.",
      "긴 입력을 보낸 뒤에는 새 채팅이나 단계별 질문으로 맥락 비용을 줄일 수 있어요."
    ]
  };
  const PROMPT_TIP_RULES = [
    { caseId: "code_error_only", category: "code", priority: 120 },
    { caseId: "code_version_missing", category: "code", priority: 116 },
    { caseId: "code_no_file_context", category: "code", priority: 114 },
    { caseId: "code_ui_request", category: "code", priority: 112 },
    { caseId: "code_refactor", category: "code", priority: 110 },
    { caseId: "code_large_task", category: "code", priority: 108 },
    { caseId: "research_no_source", category: "research", priority: 104 },
    { caseId: "research_no_date", category: "research", priority: 102 },
    { caseId: "research_no_scope", category: "research", priority: 100 },
    { caseId: "citation_needed", category: "research", priority: 98 },
    { caseId: "compare_no_criteria", category: "analysis", priority: 94 },
    { caseId: "decision_no_criteria", category: "analysis", priority: 92 },
    { caseId: "strategy_no_constraint", category: "analysis", priority: 90 },
    { caseId: "problem_weak", category: "analysis", priority: 88 },
    { caseId: "idea_no_user", category: "analysis", priority: 86 },
    { caseId: "priority_request", category: "analysis", priority: 84 },
    { caseId: "summary_need_action", category: "summary", priority: 80 },
    { caseId: "summary_exam", category: "study", priority: 78 },
    { caseId: "summary_no_purpose", category: "summary", priority: 76 },
    { caseId: "summary_no_depth", category: "summary", priority: 74 },
    { caseId: "writing_sensitive", category: "writing", priority: 72 },
    { caseId: "writing_presentation", category: "writing", priority: 70 },
    { caseId: "writing_academic", category: "writing", priority: 68 },
    { caseId: "writing_marketing", category: "writing", priority: 66 },
    { caseId: "writing_variants", category: "writing", priority: 64 },
    { caseId: "writing_no_recipient", category: "writing", priority: 62 },
    { caseId: "no_audience", category: "writing", priority: 60 },
    { caseId: "no_tone", category: "writing", priority: 58 },
    { caseId: "no_length", category: "format", priority: 56 },
    { caseId: "no_format", category: "format", priority: 54 },
    { caseId: "split_complex_prompt", category: "structure", priority: 50 },
    { caseId: "long_unstructured", category: "structure", priority: 48 },
    { caseId: "ask_for_questions_first", category: "meta_prompt", priority: 44 },
    { caseId: "ask_for_template", category: "meta_prompt", priority: 42 },
    { caseId: "ask_for_checklist", category: "meta_prompt", priority: 40 },
    { caseId: "too_vague", category: "input_quality", priority: 34 },
    { caseId: "missing_context", category: "input_quality", priority: 32 },
    { caseId: "no_goal", category: "input_quality", priority: 30 },
    { caseId: "too_short", category: "input_quality", priority: 28 },
    { caseId: "general_good", category: "general", priority: 10 },
    { caseId: "general_medium", category: "general", priority: 10 },
    { caseId: "general_high", category: "general", priority: 10 }
  ];

  let settings = { ...DEFAULT_SETTINGS };
  let currentEditor = null;
  let currentComposer = null;
  let editorObserver = null;
  let pageObserver = null;
  let overlay = null;
  let overlayTimer = null;
  let lastText = "";
  let lastLevel = "idle";
  let lastTokenCount = 0;
  let lastLoggedLevel = "idle";
  let lastSubmitAt = 0;
  let lastHighSubmitAt = 0;
  let lastHoverAt = 0;
  let hoverSession = { active: false, key: "", title: "", message: "" };
  let promptTipState = { recentIds: [], recentCaseIds: [], recentCategories: [] };
  let dragState = { active: false, pointerId: null, offsetX: 0, offsetY: 0, moved: false };
  let entryShown = { medium: false, high: false };
  let lastAutoPromptTipAt = 0;
  let lastAutoPromptTipKey = "";
  let lastInlinePromptTipHiddenAt = 0;
  let inlinePromptTip = { visible: false, closing: false, title: "", message: "", key: "" };
  let inlinePromptTipTimer = null;
  let inlinePromptTipCloseTimer = null;
  let badgeHoverActive = false;
  let onboardingGuideActive = false;
  let lastOverlayRenderMode = "";
  let lastOverlayPromptTipKey = "";
  let promptSession = null;
  let lastNonEmptyText = "";
  let lastNonEmptySnapshot = null;
  let lastNonEmptyAt = 0;
  let lastDraftLogAt = 0;
  let lastDraftLogChars = -1;
  let lastDraftLogLevel = "idle";

  function storageGet(key) {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) return resolve(undefined);
      chrome.storage.local.get(key, (result) => resolve(result?.[key]));
    });
  }

  function storageSet(data) {
    return new Promise((resolve) => {
      if (!chrome?.storage?.local) return resolve();
      chrome.storage.local.set(data, resolve);
    });
  }

  function sendLog(event) {
    if (!chrome?.runtime?.sendMessage) return;
    chrome.runtime.sendMessage({ type: "CHATPOOL_LOG_EVENT", event }, () => {
      void chrome.runtime.lastError;
    });
  }

  async function loadSettings() {
    const saved = await storageGet(STORAGE_KEYS.SETTINGS);
    settings = sanitizeSettings(deepMerge(DEFAULT_SETTINGS, saved || {}));
    await storageSet({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  function sanitizeSettings(input) {
    const next = deepMerge(DEFAULT_SETTINGS, input || {});
    next.enabled = Boolean(next.enabled);
    next.designVariant = FIXED_DESIGN_VARIANT;
    next.nudgeTextScale = 80;
    next.floatingLogoScale = 80;
    next.floatingLogoPlacement = "top-right";
    next.dragEnabled = Boolean(next.dragEnabled);
    next.customPosition = sanitizeCustomPosition(next.customPosition);
    next.onboardingGuideShown = Boolean(next.onboardingGuideShown);
    next.thresholds.lowMax = Math.max(20, Math.round(Number(next.thresholds.lowMax) || DEFAULT_SETTINGS.thresholds.lowMax));
    next.thresholds.mediumMax = Math.max(next.thresholds.lowMax + 50, Math.round(Number(next.thresholds.mediumMax) || DEFAULT_SETTINGS.thresholds.mediumMax));
    return next;
  }

  function sanitizeCustomPosition(value) {
    if (!value || typeof value !== "object") return null;
    const xRatio = Number(value.xRatio);
    const yRatio = Number(value.yRatio);
    if (!Number.isFinite(xRatio) || !Number.isFinite(yRatio)) return null;
    return {
      xRatio: clamp(xRatio, 0, 1),
      yRatio: clamp(yRatio, 0, 1)
    };
  }

  function deepMerge(base, patch) {
    const result = { ...base };
    Object.keys(patch || {}).forEach((key) => {
      if (
        patch[key] &&
        typeof patch[key] === "object" &&
        !Array.isArray(patch[key]) &&
        base[key] &&
        typeof base[key] === "object" &&
        !Array.isArray(base[key])
      ) {
        result[key] = deepMerge(base[key], patch[key]);
      } else {
        result[key] = patch[key];
      }
    });
    return result;
  }

  function detectPlatform() {
    const host = String(location.hostname || "").toLowerCase();
    if (host.includes("gemini.google.com") || host.includes("bard.google.com")) {
      return { id: "gemini", label: "Gemini", homeUrl: "https://gemini.google.com/" };
    }
    if (host.includes("chatgpt.com") || host.includes("chat.openai.com")) {
      return { id: "chatgpt", label: "ChatGPT", homeUrl: "https://chatgpt.com/" };
    }
    return { id: "ai-chat", label: "AI 채팅", homeUrl: "https://chatgpt.com/" };
  }

  function querySelectorAllDeep(selector, root = document) {
    const results = [];
    const visited = new Set();

    function visit(scope) {
      if (!scope || visited.has(scope)) return;
      visited.add(scope);
      try {
        results.push(...scope.querySelectorAll(selector));
      } catch {
        return;
      }

      // Gemini 같은 Google 계열 웹앱은 Web Component를 실험적으로 쓰는 경우가 있어
      // open shadowRoot 안쪽 후보도 같이 탐색한다. closed shadowRoot는 브라우저 정책상 접근할 수 없다.
      for (const element of scope.querySelectorAll("*")) {
        if (element.shadowRoot) visit(element.shadowRoot);
      }
    }

    visit(root);
    return results;
  }

  function isEditableNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = node.tagName?.toLowerCase();
    return tag === "textarea" || tag === "input" || node.isContentEditable || node.getAttribute("role") === "textbox";
  }

  function scoreEditorCandidate(node) {
    if (!isEditableNode(node)) return -1000;
    const rect = node.getBoundingClientRect();
    if (!isUsefulRect(rect)) return -1000;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || node.closest("[aria-hidden='true']")) return -1000;

    const text = [
      node.id,
      node.getAttribute("aria-label"),
      node.getAttribute("placeholder"),
      node.getAttribute("data-placeholder"),
      node.getAttribute("data-testid"),
      node.getAttribute("data-test-id"),
      node.closest("form")?.getAttribute("aria-label"),
      node.closest("rich-textarea") ? "rich-textarea" : ""
    ].filter(Boolean).join(" ").toLowerCase();

    let score = 0;
    if (node === document.activeElement || node.contains(document.activeElement)) score += 1000;
    if (text.includes("prompt-textarea")) score += 500;
    if (/gemini|bard|prompt|message|질문|메시지|입력|프롬프트|rich-textarea/.test(text)) score += 260;
    if (node.isContentEditable) score += 60;
    if (node.tagName?.toLowerCase() === "textarea") score += 80;
    if (node.closest("form")) score += 120;
    if (findComposer(node)) score += 80;
    if (rect.top > window.innerHeight * 0.45) score += 140;
    score += Math.min(120, Math.max(0, rect.width / 8));
    return score;
  }

  function findEditor() {
    const candidates = [];
    for (const selector of SELECTORS.editor) {
      candidates.push(...querySelectorAllDeep(selector));
    }

    const active = document.activeElement;
    if (isEditableNode(active)) candidates.push(active);

    const unique = [...new Set(candidates)].filter(isEditableNode);
    const ranked = unique
      .map((node) => ({ node, score: scoreEditorCandidate(node) }))
      .filter((item) => item.score > -1000)
      .sort((a, b) => a.score - b.score);

    return ranked.at(-1)?.node || null;
  }

  function findComposer(editor = currentEditor) {
    if (!editor) return null;
    const direct = editor.closest("form");
    if (direct && isUsefulRect(direct.getBoundingClientRect())) return direct;

    const named = editor.closest("[data-testid*='composer' i], [class*='composer' i], [role='form']");
    if (named && isUsefulRect(named.getBoundingClientRect())) return named;

    let node = editor.parentElement;
    const editorRect = editor.getBoundingClientRect();
    while (node && node !== document.body && node !== document.documentElement) {
      const rect = node.getBoundingClientRect();
      if (rect.width >= Math.max(280, editorRect.width) && rect.height >= editorRect.height) {
        const hasAction = node.querySelector?.("button, [role='button']");
        if (hasAction) return node;
      }
      node = node.parentElement;
    }

    return direct || editor.parentElement || editor;
  }

  function isUsefulRect(rect) {
    return rect && rect.width > 120 && rect.height > 20 && rect.bottom > 0 && rect.top < window.innerHeight;
  }

  function getEditorText(editor) {
    if (!editor) return "";
    if ("value" in editor) return editor.value || "";
    return (editor.innerText || editor.textContent || "").replace(/\u00a0/g, " ");
  }

  function estimateTokens(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      return { estimatedTokens: 0, charCount: 0, hangulCount: 0, cjkCount: 0, otherCount: 0, level: "idle", progress: 0 };
    }

    const normalized = trimmed.replace(/\s+/g, " ");
    const hangulMatches = normalized.match(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g) || [];
    const cjkMatches = normalized.match(/[\u3040-\u30ff\u4e00-\u9fff]/g) || [];
    const emojiMatches = normalized.match(/[\p{Extended_Pictographic}]/gu) || [];

    const hangulCount = hangulMatches.length;
    const cjkCount = cjkMatches.length;
    const emojiCount = emojiMatches.length;
    const charCount = Array.from(normalized).length;
    const otherCount = Math.max(0, charCount - hangulCount - cjkCount - emojiCount);

    const estimatedTokens = Math.max(1, Math.round(hangulCount / 2 + cjkCount / 1.6 + otherCount / 4 + emojiCount * 2));
    const level = classifyLevel(estimatedTokens);
    const progress = Math.min(100, Math.round((estimatedTokens / settings.thresholds.mediumMax) * 100));

    return { estimatedTokens, charCount, hangulCount, cjkCount, otherCount, level, progress };
  }

  function classifyLevel(tokens) {
    if (tokens <= 0) return "idle";
    if (tokens <= settings.thresholds.lowMax) return "low";
    if (tokens <= settings.thresholds.mediumMax) return "medium";
    return "high";
  }

  function getLevelLabel(level) {
    return { idle: "대기", low: "낮음", medium: "중간", high: "높음" }[level] || "대기";
  }

  function getImpactLabel(level) {
    return { idle: "도움말 준비", low: "좋은 길이", medium: "조금 다듬기", high: "나눠 묻기" }[level] || "도움말 준비";
  }

  function getBadgeHint(level) {
    return {
      idle: "프롬프팅 팁 준비됨",
      low: "핵심이 잘 보이는 길이",
      medium: "조금 줄이면 더 선명함",
      high: "나눠 물으면 더 정확함"
    }[level] || "프롬프팅 팁 준비됨";
  }

  function pickEnvironmentNudge(level) {
    const highPostSend = level === "high" && Date.now() - lastHighSubmitAt < 180000;
    if (highPostSend) return randomOf(ENVIRONMENT_NUDGE_TEXTS.postSendHigh);
    return randomOf(ENVIRONMENT_NUDGE_TEXTS[level] || ENVIRONMENT_NUDGE_TEXTS.idle);
  }

  function randomOf(list) {
    const values = Array.isArray(list) ? list.filter(Boolean) : [];
    if (values.length === 0) return "";
    return values[Math.floor(Math.random() * values.length)];
  }

  function pickNudge(kind, level) {
    if (kind === "entry") return randomOf(NUDGE_TEXTS[level]?.entry);
    if (kind === "on_send") return randomOf(NUDGE_TEXTS.high?.on_send);
    if (kind === "hover") {
      if (level === "high" && Date.now() - lastHighSubmitAt < 180000) return randomOf(NUDGE_TEXTS.high?.on_send_hover);
      return randomOf(NUDGE_TEXTS[level]?.hover);
    }
    return "";
  }

  function triggerHoverBubble() {
    if (onboardingGuideActive || document.getElementById(ONBOARDING_ROOT_ID)) return;
    const snapshot = buildSnapshot();
    if (!snapshot) return;

    const hoverKey = getHoverSessionKey(snapshot);
    let isNewHoverSession = false;

    if (!hoverSession.active || hoverSession.key !== hoverKey) {
      const hoverContent = pickHoverContent(snapshot);
      hoverSession = {
        active: true,
        key: hoverKey,
        title: hoverContent.title,
        message: hoverContent.message
      };
      isNewHoverSession = true;
    }

    showBubble(snapshot, {
      title: hoverSession.title,
      message: hoverSession.message,
      manual: true,
      kind: "hover"
    });

    if (isNewHoverSession) sendLog(toLogEvent("hover", snapshot));
  }

  function handleBadgePointerLeave() {
    badgeHoverActive = false;
    if (overlay?.bubble?.dataset.visible === "true" && overlay.bubble.dataset.kind === "hover") {
      scheduleHideBubble(120);
    }
  }

  function handleBadgePointerEnter() {
    badgeHoverActive = true;
    triggerHoverBubble();
  }

  function pickHoverContent(snapshot) {
    return {
      title: snapshot.level === "idle" ? "환경 넛지" : `${getLevelLabel(snapshot.level)} 환경 넛지`,
      message: pickEnvironmentNudge(snapshot.level)
    };
  }

  function getHoverSessionKey(snapshot) {
    const highPostSend = snapshot.level === "high" && Date.now() - lastHighSubmitAt < 180000;
    return `${snapshot.level}:${highPostSend ? "post-send" : "environment"}`;
  }

  function pickContextualPromptTip(text, snapshot) {
    if (!PROMPT_TIP_BANK.length) return null;
    const cases = detectPromptCases(text, snapshot);
    if (!cases.length) return null;

    for (const item of cases) {
      const tips = PROMPT_TIP_BANK.filter((tip) => {
        const levels = Array.isArray(tip.level) ? tip.level : [];
        return tip.caseId === item.caseId && (!levels.length || levels.includes(snapshot.level));
      });
      const selected = pickLeastRecentTip(tips, item.caseId, item.category);
      if (selected) return selected;
    }
    return null;
  }

  function pickLeastRecentTip(tips, caseId, category) {
    const values = Array.isArray(tips) ? tips.filter((tip) => tip && tip.text) : [];
    if (!values.length) return null;

    let pool = values.filter((tip) => !promptTipState.recentIds.includes(tip.id));
    if (!pool.length) pool = values.slice();

    const notSameCase = pool.filter((tip) => !promptTipState.recentCaseIds.slice(-2).includes(tip.caseId || caseId));
    if (notSameCase.length) pool = notSameCase;

    const notSameCategory = pool.filter((tip) => !promptTipState.recentCategories.slice(-3).includes(tip.category || category));
    if (notSameCategory.length) pool = notSameCategory;

    return randomOf(pool);
  }

  function rememberPromptTip(tip) {
    if (!tip) return;
    promptTipState.recentIds = [...promptTipState.recentIds, tip.id].filter(Boolean).slice(-18);
    promptTipState.recentCaseIds = [...promptTipState.recentCaseIds, tip.caseId].filter(Boolean).slice(-8);
    promptTipState.recentCategories = [...promptTipState.recentCategories, tip.category].filter(Boolean).slice(-8);
  }

  function getPromptTipTitle(tip) {
    const label = {
      code: "개발 질문 팁",
      research: "리서치 팁",
      summary: "요약 팁",
      study: "공부 프롬프트 팁",
      writing: "글쓰기 팁",
      analysis: "판단 기준 팁",
      format: "출력 형식 팁",
      structure: "구조화 팁",
      meta_prompt: "프롬프트 개선 팁",
      input_quality: "입력 개선 팁",
      general: "프롬프팅 팁"
    };
    return label[tip?.category] || "프롬프팅 팁";
  }

  function getTopPromptCaseId(text, snapshot) {
    return detectPromptCases(text, snapshot)[0]?.caseId || "";
  }

  function detectPromptCases(text, snapshot) {
    const features = extractPromptFeatures(text || "", snapshot);
    const matched = PROMPT_TIP_RULES.filter((rule) => matchesPromptRule(rule.caseId, features))
      .map((rule) => ({ ...rule, priority: rule.priority + getRuleBoost(rule.caseId, features) }))
      .sort((a, b) => b.priority - a.priority);
    return matched.slice(0, 5);
  }

  function extractPromptFeatures(text, snapshot) {
    const normalized = normalizePromptText(text);
    const charLength = Array.from(normalized).length;
    const lineCount = normalized ? normalized.split("\n").length : 0;
    const bulletCount = countMatches(normalized, /(^|\n)\s*(?:[-*•]|\d+[.)]|#{1,4}\s+)/g);
    const questionCount = countMatches(normalized, /[?？]|어떻게|왜|뭐|무엇|가능|되나|되나요|차이|how|why|what/gi);
    const taskCount = countMatches(normalized, /해줘|해주세요|만들어|작성|정리|요약|조사|분석|비교|수정|고쳐|구현|설명|추천/g);
    const hasUrl = /https?:\/\//i.test(normalized);
    const hasCode = /```|\b(function|const|let|class|import|export|return|Traceback|Exception|Error|TypeError|ReferenceError|SyntaxError|gradle|npm|vite|react|kotlin|compose|manifest\.json|content\.js)\b/i.test(normalized);
    const hasFormat = /표|테이블|목차|bullet|불릿|번호|단계|JSON|마크다운|markdown|html|형식|양식|템플릿|체크리스트|리스트/i.test(normalized);
    const hasLength = /\d+\s*(자|글자|문장|문단|분|초|페이지|장|개|줄)|짧게|길게|간단히|상세히|자세히/i.test(normalized);
    const hasTone = /톤|말투|문체|친근|전문|공손|캐주얼|딱딱|자연스럽|학술적|세련|진지|가볍/i.test(normalized);
    const hasAudience = /교수|팀원|친구|고객|사용자|독자|청중|대학생|학부생|초보|전문가|조원|상대|받는 사람|대상/i.test(normalized);
    const hasGoal = /목적|용도|위해|하려고|하려는|쓸 거|사용|제출|발표|과제|시험|회의|개발|수익|프로젝트/i.test(normalized);
    const hasSource = /출처|공식|논문|정부|학술|보고서|citation|cite|링크|1차|primary|뉴스|법령|특허|저널|학회|통계청|공공데이터/i.test(normalized);
    const hasDate = /\d{4}|오늘|어제|내일|기준일|기준 날짜|최근\s*\d+\s*(일|주|개월|년)|지난\s*\d+\s*(일|주|개월|년)|\d+\s*(일|주|개월|년)|분기|Q[1-4]|since|after|before|week|month|year/i.test(normalized);
    const hasRegion = /한국|국내|미국|중국|일본|유럽|글로벌|서울|지역|국가|시장|해외|Korea|US|China|Japan|Europe/i.test(normalized);
    const hasCriteria = /기준|평가|우선순위|장단점|난이도|가격|비용|효과|임팩트|실사용|구현성|리스크|비교축|조건/i.test(normalized);
    return {
      text: normalized,
      charLength,
      lineCount,
      bulletCount,
      questionCount,
      taskCount,
      tokenLevel: snapshot?.level || "idle",
      hasUrl,
      hasCode,
      hasFormat,
      hasLength,
      hasTone,
      hasAudience,
      hasGoal,
      hasSource,
      hasDate,
      hasRegion,
      hasCriteria
    };
  }

  function matchesPromptRule(caseId, f) {
    switch (caseId) {
      case "code_error_only":
        return f.hasCode && /오류|에러|안됨|안 돼|왜남|왜 남|Error|Exception|Traceback|failed|Explain with AI/i.test(f.text);
      case "code_version_missing":
        return f.hasCode && /react|vite|android|compose|kotlin|chrome extension|extension|gradle|node|npm|typescript|javascript|python|flutter/i.test(f.text) && !/\b\d+\.\d+|버전|version|SDK|BOM/i.test(f.text);
      case "code_no_file_context":
        return f.hasCode && /수정|고쳐|추가|바꿔|리팩|구현|파일|코드/i.test(f.text) && !/content\.js|manifest\.json|popup|background|파일 구조|tree|src\//i.test(f.text);
      case "code_ui_request":
        return /UI|화면|버튼|호버|hover|플로팅|floating|드래그|drag|팝업|popup|위치|인터랙션|클릭/i.test(f.text) && /구현|추가|수정|만들|바꿔/i.test(f.text);
      case "code_refactor":
        return /리팩토링|refactor|DRY|공통|스파게티|구조 개선|컴포넌트 분리/i.test(f.text);
      case "code_large_task":
        return f.hasCode && f.charLength > 450 && /앱|전체|구현|만들|프로젝트|완성|테스트/i.test(f.text);
      case "research_no_source":
        return /조사|리서치|최신|자료|근거|시장|논문|사례|법령|특허/i.test(f.text) && !f.hasSource;
      case "research_no_date":
        return /최신|최근|요즘|현재|트렌드|시장|뉴스/i.test(f.text) && !f.hasDate;
      case "research_no_scope":
        return /조사|리서치|시장|사례|현황|동향|분석/i.test(f.text) && !f.hasRegion && f.charLength < 600;
      case "citation_needed":
        return /과제|보고서|논문|발표|PPT|피피티|레포트|리포트|저널|학술/i.test(f.text) && !/APA|MLA|각주|인용|citation|cite/i.test(f.text);
      case "compare_no_criteria":
        return /비교|차이|vs|versus|뭐가 더|어느 쪽|장단점/i.test(f.text) && !f.hasCriteria;
      case "decision_no_criteria":
        return /골라|선택|뭐가 좋아|추천|결정|고르|pick|choose/i.test(f.text) && !f.hasCriteria;
      case "strategy_no_constraint":
        return /전략|계획|로드맵|일정|기획|실행|운영|사업|창업/i.test(f.text) && !/기간|예산|인원|마감|팀|역량|제약|deadline|budget/i.test(f.text);
      case "problem_weak":
        return /문제정의|문제 정의|페인포인트|pain point|불편함|수요|니즈/i.test(f.text) && !/누가|언제|빈도|강도|대체재|관찰|인터뷰/i.test(f.text);
      case "idea_no_user":
        return /아이디어|서비스|솔루션|제품|기획|MVP|앱|확장프로그램/i.test(f.text) && !/사용자|고객|타깃|대상|persona|페르소나/i.test(f.text);
      case "priority_request":
        return /우선순위|뭐부터|먼저|순서|roadmap|로드맵/i.test(f.text) && !/영향도|난이도|효과|비용|긴급|중요/i.test(f.text);
      case "summary_need_action":
        return /회의|미팅|논의|피드백|요약/i.test(f.text) && !/할 일|액션|담당|마감|결정사항|action item/i.test(f.text);
      case "summary_exam":
        return /시험|공부|암기|개념|강의|수업|중간|기말|퀴즈/i.test(f.text) && /요약|정리|설명|알려/i.test(f.text);
      case "summary_no_purpose":
        return /요약|정리|summarize/i.test(f.text) && !f.hasGoal;
      case "summary_no_depth":
        return /요약|정리/i.test(f.text) && !/한 줄|짧게|상세|자세|핵심|개념|시험|발표|회의/i.test(f.text);
      case "writing_sensitive":
        return /사과|부탁|거절|양해|죄송|미안|연락|문자|카톡|메일/i.test(f.text) && /자연스럽|정중|좋게|부드럽|예의/i.test(f.text);
      case "writing_presentation":
        return /발표문|대본|스크립트|발표|speech|presentation/i.test(f.text) && !/\d+\s*분|\d+\s*초|청중|대상/i.test(f.text);
      case "writing_academic":
        return /보고서|과제|레포트|리포트|논문|학술|에세이|감상문/i.test(f.text) && (!f.hasLength || !f.hasTone);
      case "writing_marketing":
        return /문구|카피|홍보|마케팅|광고|랜딩|슬로건|브랜딩|네이밍/i.test(f.text) && !/타깃|고객|전환|CTA|행동|브랜드/i.test(f.text);
      case "writing_variants":
        return /시안|후보|아이디어|문구|네이밍|로고|제안/i.test(f.text) && /여러|몇 개|개|많이|늘려|다양/i.test(f.text) && !f.hasCriteria;
      case "writing_no_recipient":
        return /카톡|문자|메일|공지|안내|DM|메시지|보낼/i.test(f.text) && !/교수|팀원|친구|고객|상대|선배|후배|받는 사람|수신자/i.test(f.text);
      case "no_audience":
        return /설명|발표|글|문장|소개|요약|정리/i.test(f.text) && !f.hasAudience && f.charLength > 60;
      case "no_tone":
        return /문장|글|메일|카톡|공지|소개|대본|문구|감상문/i.test(f.text) && !f.hasTone;
      case "no_length":
        return /글|문장|메일|카톡|공지|소개|대본|감상문|요약|정리/i.test(f.text) && !f.hasLength;
      case "no_format":
        return /요약|정리|분석|조사|설명|비교|리스트|계획/i.test(f.text) && !f.hasFormat;
      case "split_complex_prompt":
        return f.taskCount >= 3 || f.questionCount >= 3 || (f.charLength > 900 && f.bulletCount >= 4);
      case "long_unstructured":
        return f.charLength > 650 && f.bulletCount < 2 && f.lineCount < 4;
      case "ask_for_questions_first":
        return /애매|모호|모르겠|어떻게 해야|가능한지|검증|판단/i.test(f.text) && !/질문.*먼저|확인.*질문|물어봐/i.test(f.text);
      case "ask_for_template":
        return /반복|자주|계속|매번|프롬프트|템플릿|양식/i.test(f.text) && !/템플릿|양식/i.test(f.text.replace(/프롬프트/g, ""));
      case "ask_for_checklist":
        return /검토|점검|평가|리뷰|확인|체크/i.test(f.text) && !/체크리스트|표|기준표/i.test(f.text);
      case "too_vague":
        return /좋게|잘|대충|알아서|괜찮게|자연스럽게|깔끔하게|있어 보이게|짜치지 않게/i.test(f.text);
      case "missing_context":
        return /이거|저거|아까|그거|위에|아래|첨부|앞서|방금/i.test(f.text) && f.charLength < 220;
      case "no_goal":
        return /해줘|해주세요|알려줘|정리|요약|조사|분석|설명|만들어/i.test(f.text) && !f.hasGoal && f.charLength > 35;
      case "too_short":
        return f.charLength > 0 && f.charLength <= 36;
      case "general_good":
        return f.tokenLevel === "low";
      case "general_medium":
        return f.tokenLevel === "medium";
      case "general_high":
        return f.tokenLevel === "high";
      default:
        return false;
    }
  }

  function getRuleBoost(caseId, f) {
    if (caseId.startsWith("code") && f.hasCode) return 12;
    if (caseId.startsWith("research") && f.hasUrl) return 4;
    if (caseId === "no_format" && f.charLength > 300) return 6;
    if (caseId === "long_unstructured" && f.tokenLevel === "high") return 8;
    return 0;
  }

  function normalizePromptText(text) {
    return String(text || "").replace(/ /g, " ").trim();
  }

  function countMatches(text, pattern) {
    return (String(text || "").match(pattern) || []).length;
  }

  function resetHoverSession() {
    hoverSession = { active: false, key: "", title: "", message: "" };
  }

  function ensureOverlay() {
    const existing = document.getElementById(ROOT_ID);
    if (existing) {
      const storedOverlay = existing.__chatpullOverlay;
      if (
        storedOverlay &&
        storedOverlay.host &&
        storedOverlay.card &&
        storedOverlay.bubble &&
        storedOverlay.host.isConnected
      ) {
        return storedOverlay;
      }

      // 확장 프로그램을 업데이트하거나 reload하면 이전 content script가 만든 DOM은 남아 있지만
      // 새 isolated world에서는 __chatpullOverlay expando가 사라질 수 있다.
      // 그 상태에서 overlay.host를 읽으면 TypeError가 발생하므로 stale root를 제거하고 새로 만든다.
      existing.remove();
    }

    const host = document.createElement("div");
    host.id = ROOT_ID;
    host.setAttribute("data-chatpull", "root");
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = getStyleText();

    const card = document.createElement("div");
    card.className = "cp-widget variant-tree-status-badge";
    card.dataset.visible = "false";
    card.dataset.level = "idle";
    card.setAttribute("role", "status");
    card.setAttribute("aria-live", "polite");

    const bubble = document.createElement("div");
    bubble.className = "cp-bubble";
    bubble.dataset.visible = "false";
    bubble.innerHTML = `<strong class="text-status">대기</strong><span class="text-body-m">${esc(PLATFORM.label)} 입력창에 글을 쓰면 예상 토큰량을 보여드립니다.</span>`;

    shadow.append(style, card, bubble);
    const result = { host, shadow, card, bubble };
    host.__chatpullOverlay = result;

    card.addEventListener("mouseenter", handleBadgePointerEnter);
    card.addEventListener("pointerenter", handleBadgePointerEnter);
    card.addEventListener("focus", handleBadgePointerEnter);
    card.addEventListener("mouseleave", handleBadgePointerLeave);
    card.addEventListener("pointerleave", handleBadgePointerLeave);
    bubble.addEventListener("mouseenter", () => clearTimeout(overlayTimer));
    bubble.addEventListener("mouseleave", () => scheduleHideBubble(800));
    card.addEventListener("pointerdown", handleDragStart);
    card.addEventListener("pointermove", handleDragMove);
    card.addEventListener("pointerup", handleDragEnd);
    card.addEventListener("pointercancel", handleDragCancel);

    return result;
  }

  function buildSnapshot() {
    return buildSnapshotFromText(lastText);
  }

  function buildSnapshotFromText(text) {
    return { ...estimateTokens(text || "") };
  }

  function rememberNonEmptySnapshot(text, snapshot) {
    if (!String(text || "").trim() || !snapshot || snapshot.charCount <= 0) return;
    lastNonEmptyText = text;
    lastNonEmptySnapshot = { ...snapshot };
    lastNonEmptyAt = Date.now();
  }

  function clearLastNonEmptySnapshot() {
    lastNonEmptyText = "";
    lastNonEmptySnapshot = null;
    lastNonEmptyAt = 0;
  }

  function updateOverlay(snapshot) {
    overlay = ensureOverlay();
    overlay.host.style.setProperty("--cp-nudge-scale", `${settings.nudgeTextScale / 100}`);
    overlay.host.style.setProperty("--cp-logo-scale", `${settings.floatingLogoScale / 100}`);
    const card = overlay.card;
    const promptTipVisible = (inlinePromptTip.visible || inlinePromptTip.closing) && Boolean(inlinePromptTip.message);
    const renderMode = promptTipVisible ? (inlinePromptTip.closing ? "tip-closing" : "tip") : "status";
    const promptTipKey = promptTipVisible ? inlinePromptTip.key : "";

    card.className = "cp-widget variant-tree-status-badge";
    card.dataset.visible = settings.enabled && currentEditor ? "true" : "false";
    card.dataset.level = snapshot.level;
    card.dataset.promptTipVisible = promptTipVisible ? "true" : "false";
    card.dataset.dragEnabled = settings.dragEnabled ? "true" : "false";
    card.style.setProperty("--progress", `${snapshot.progress}%`);

    const canPatch =
      card.querySelector(".cp-status-segment") &&
      lastOverlayRenderMode === renderMode &&
      lastOverlayPromptTipKey === promptTipKey;

    if (canPatch) {
      patchStatusSegment(card, snapshot);
    } else {
      card.innerHTML = renderTreeStatusBadge(snapshot);
      lastOverlayRenderMode = renderMode;
      lastOverlayPromptTipKey = promptTipKey;
      patchStatusSegment(card, snapshot);
    }

    updateOverlayPosition();
  }

  function patchStatusSegment(card, snapshot) {
    const level = snapshot.level;
    const levelLabel = getLevelLabel(level);
    const count = `${snapshot.estimatedTokens.toLocaleString()} tokens`;
    const treeWrap = card.querySelector(".cp-tree-wrap");
    const strong = card.querySelector(".cp-badge-copy strong");
    const hint = card.querySelector(".cp-badge-copy span");

    if (treeWrap && card.dataset.iconLevel !== level) {
      treeWrap.innerHTML = characterIcon(level);
      card.dataset.iconLevel = level;
    }
    if (strong) strong.textContent = `${levelLabel} · ${count}`;
    if (hint) hint.textContent = getBadgeHint(level);
  }

  function renderTreeStatusBadge(snapshot) {
    const level = snapshot.level;
    const levelLabel = getLevelLabel(level);
    const count = `${snapshot.estimatedTokens.toLocaleString()} tokens`;
    const tree = characterIcon(level);
    const status = `
      <div class="cp-status-segment" aria-label="현재 입력 상태">
        <div class="cp-tree-wrap">${tree}</div>
        <div class="cp-badge-copy">
          <strong class="text-status">${esc(levelLabel)} · ${esc(count)}</strong>
          <span class="text-body-m">${esc(getBadgeHint(level))}</span>
        </div>
      </div>
    `;

    if ((!inlinePromptTip.visible && !inlinePromptTip.closing) || !inlinePromptTip.message) return status;

    return `
      <div class="cp-prompt-tip-inline" data-state="${inlinePromptTip.closing ? "closing" : "opening"}" aria-live="polite">
        <strong class="text-status">${esc(inlinePromptTip.title || "프롬프트 팁")}</strong>
        <span class="text-body-l">${esc(inlinePromptTip.message)}</span>
      </div>
      <div class="cp-inline-divider" aria-hidden="true"></div>
      ${status}
    `;
  }

  function updateOverlayPosition() {
    if (!overlay || !currentEditor) return;
    const card = overlay.card;
    const bubble = overlay.bubble;

    const cardPlacement = chooseCardPlacement(card);
    applyPlacement(card, cardPlacement);
    card.dataset.placement = cardPlacement.name;
    card.style.setProperty("--cp-tip-width", `${getPromptTipDrawerWidth(cardPlacement)}px`);

    if (bubble.dataset.visible === "true") {
      const bubblePlacement = chooseBubblePlacementNearLogo(bubble);
      applyPlacement(bubble, bubblePlacement);
      bubble.dataset.placement = bubblePlacement.name;
    }
  }

  function chooseCardPlacement(element) {
    const margin = 12;
    const anchor = getComposerRect() || currentEditor?.getBoundingClientRect();
    const scale = settings.floatingLogoScale / 100;
    const width = Math.ceil((element.offsetWidth || 188) * scale);
    const height = Math.ceil((element.offsetHeight || 64) * scale);

    if (settings.dragEnabled && settings.customPosition) {
      const left = clamp(settings.customPosition.xRatio * window.innerWidth, margin, window.innerWidth - width - margin);
      const top = clamp(settings.customPosition.yRatio * window.innerHeight, margin, window.innerHeight - height - margin);
      return { name: "custom-drag", left, top };
    }

    if (!anchor || !isUsefulRect(anchor)) {
      const fallback = centeredAboveWindowRect(width, height, margin);
      return { name: "center-no-anchor", left: fallback.left, top: fallback.top };
    }

    const forbidden = getForbiddenRects("card");
    const primary = calculateLogoPlacementRect(settings.floatingLogoPlacement, anchor, width, height, margin);
    if (primary && isSafeRect(primary, forbidden, margin)) return { name: settings.floatingLogoPlacement, left: primary.left, top: primary.top };

    // 기본 위치는 채팅창 오른쪽 위다. 공간이 부족한 경우에만 중앙 위로 자동 전환한다.
    const centerFallback = calculateLogoPlacementRect("top-center", anchor, width, height, margin);
    if (centerFallback && isSafeRect(centerFallback, forbidden, margin)) {
      return { name: "top-center-auto", left: centerFallback.left, top: centerFallback.top };
    }

    const windowFallback = centeredAboveWindowRect(width, height, margin);
    if (isSafeRect(windowFallback, forbidden, margin)) return { name: "top-center-window", left: windowFallback.left, top: windowFallback.top };

    return { name: "top-center-forced", left: windowFallback.left, top: windowFallback.top };
  }

  function getPromptTipDrawerWidth(cardPlacement) {
    const margin = 12;
    const leftSpace = Math.max(0, Math.floor((cardPlacement?.left || margin) - margin));
    const viewportFallback = Math.max(260, Math.floor(window.innerWidth - 240));
    const available = leftSpace || viewportFallback;
    return clamp(available, 260, 560);
  }

  function calculateLogoPlacementRect(placement, anchor, width, height, margin) {
    const aboveY = anchor.top - height - 12;
    switch (placement) {
      case "chat-left":
        return makeRect(
          anchor.left - width - 16,
          clamp(anchor.bottom - height, margin, window.innerHeight - height - margin),
          width,
          height
        );
      case "top-left":
        return makeRect(
          clamp(anchor.left, margin, window.innerWidth - width - margin),
          aboveY,
          width,
          height
        );
      case "top-center":
        return makeRect(
          clamp(anchor.left + anchor.width / 2 - width / 2, margin, window.innerWidth - width - margin),
          aboveY,
          width,
          height
        );
      case "top-right":
        return makeRect(
          clamp(anchor.right - width, margin, window.innerWidth - width - margin),
          aboveY,
          width,
          height
        );
      case "chat-right":
        return makeRect(
          anchor.right + 16,
          clamp(anchor.bottom - height, margin, window.innerHeight - height - margin),
          width,
          height
        );
      default:
        return null;
    }
  }

  function centeredAboveWindowRect(width, height, margin) {
    const anchor = getComposerRect() || currentEditor?.getBoundingClientRect();
    const preferredTop = anchor ? anchor.top - height - 12 : window.innerHeight - height - 120;
    return makeRect(
      clamp(window.innerWidth / 2 - width / 2, margin, window.innerWidth - width - margin),
      clamp(preferredTop, margin, window.innerHeight - height - margin),
      width,
      height
    );
  }

  function chooseBubblePlacementNearLogo(element) {
    const margin = 12;
    const cardRect = overlay?.card?.getBoundingClientRect();
    const width = Math.ceil(Math.min(Math.max(element.offsetWidth || 150, 132), 168));
    const height = Math.ceil(Math.max(element.offsetHeight || 62, 48));

    if (!cardRect || !isUsefulRect(cardRect)) {
      const fallback = centeredAboveWindowRect(width, height, margin);
      return { name: "near-logo-fallback", left: fallback.left, top: fallback.top };
    }

    const forbidden = getForbiddenRects("bubble");
    const candidates = getBubbleCandidateRects(cardRect, width, height, margin);

    for (const item of candidates) {
      if (isSafeRect(item.rect, forbidden, margin)) return { name: item.name, left: item.rect.left, top: item.rect.top };
    }

    // 항상 플로팅 창 옆에 붙어다녀야 하므로, 멀리 떨어진 top-center로 보내지 않는다.
    // 입력창과의 충돌이 모두 막히면, 인접 후보 중 viewport 안에 들어오는 첫 후보를 사용한다.
    for (const item of candidates) {
      if (isInsideViewport(item.rect, margin)) return { name: `${item.name}-attached-forced`, left: item.rect.left, top: item.rect.top };
    }

    const clamped = candidates[0]?.rect || makeRect(cardRect.right + 10, cardRect.top, width, height);
    return {
      name: "attached-clamped",
      left: clamp(clamped.left, margin, window.innerWidth - width - margin),
      top: clamp(clamped.top, margin, window.innerHeight - height - margin)
    };
  }

  function getBubbleCandidateRects(cardRect, width, height, margin) {
    const gap = 10;
    const aboveLogo = makeRect(
      clamp(cardRect.left + cardRect.width / 2 - width / 2, margin, window.innerWidth - width - margin),
      cardRect.top - height - gap,
      width,
      height
    );
    const rightOfLogo = makeRect(
      cardRect.right + gap,
      clamp(cardRect.top + cardRect.height / 2 - height / 2, margin, window.innerHeight - height - margin),
      width,
      height
    );
    const leftOfLogo = makeRect(
      cardRect.left - width - gap,
      clamp(cardRect.top + cardRect.height / 2 - height / 2, margin, window.innerHeight - height - margin),
      width,
      height
    );
    const belowLogo = makeRect(
      clamp(cardRect.left + cardRect.width / 2 - width / 2, margin, window.innerWidth - width - margin),
      cardRect.bottom + gap,
      width,
      height
    );

    const placement = overlay?.card?.dataset.placement || settings.floatingLogoPlacement;
    if (placement.includes("left") || placement === "chat-left" || placement === "custom-drag") {
      return [
        { name: "right-of-logo", rect: rightOfLogo },
        { name: "above-logo", rect: aboveLogo },
        { name: "below-logo", rect: belowLogo },
        { name: "left-of-logo", rect: leftOfLogo }
      ];
    }
    if (placement.includes("right") || placement === "chat-right") {
      return [
        { name: "left-of-logo", rect: leftOfLogo },
        { name: "above-logo", rect: aboveLogo },
        { name: "below-logo", rect: belowLogo },
        { name: "right-of-logo", rect: rightOfLogo }
      ];
    }
    return [
      { name: "above-logo", rect: aboveLogo },
      { name: "right-of-logo", rect: rightOfLogo },
      { name: "left-of-logo", rect: leftOfLogo },
      { name: "below-logo", rect: belowLogo }
    ];
  }

  function getComposerRect() {
    const composer = findComposer();
    if (!composer) return null;
    currentComposer = composer;
    const rect = composer.getBoundingClientRect();
    if (!isUsefulRect(rect)) return null;
    return rect;
  }

  function getForbiddenRects(kind) {
    const rects = [];
    const editorRect = currentEditor?.getBoundingClientRect();
    if (editorRect && isUsefulRect(editorRect)) rects.push(expandRect(editorRect, kind === "card" ? 4 : 10));
    if (kind === "bubble") {
      const composer = getComposerRect();
      if (composer) rects.push(expandRect(composer, 8));
    }
    return rects;
  }

  function isSafeRect(rect, forbiddenRects, margin) {
    if (!isInsideViewport(rect, margin)) return false;
    return !forbiddenRects.some((blocked) => intersects(rect, blocked, 10));
  }

  function pointInRect(x, y, rect) {
    return rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function makeRect(left, top, width, height) {
    return { left, top, right: left + width, bottom: top + height, width, height };
  }

  function expandRect(rect, padding) {
    return makeRect(rect.left - padding, rect.top - padding, rect.width + padding * 2, rect.height + padding * 2);
  }

  function intersects(a, b, padding = 0) {
    return !(a.right + padding < b.left || a.left - padding > b.right || a.bottom + padding < b.top || a.top - padding > b.bottom);
  }

  function isInsideViewport(rect, margin = 0) {
    return rect.left >= margin && rect.top >= margin && rect.right <= window.innerWidth - margin && rect.bottom <= window.innerHeight - margin;
  }

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.max(min, Math.min(max, value));
  }

  function applyPlacement(element, placement) {
    element.style.left = `${Math.round(placement.left)}px`;
    element.style.top = `${Math.round(placement.top)}px`;
    if (placement.hidden) element.dataset.visible = "false";
  }

  function handleDragStart(event) {
    if (!settings.dragEnabled || event.button !== 0 || !overlay?.card) return;
    const rect = overlay.card.getBoundingClientRect();
    dragState = {
      active: true,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false
    };
    overlay.card.dataset.dragging = "true";
    overlay.card.setPointerCapture?.(event.pointerId);
    clearTimeout(overlayTimer);
    event.preventDefault();
  }

  function handleDragMove(event) {
    if (!dragState.active || dragState.pointerId !== event.pointerId || !overlay?.card) return;
    const width = overlay.card.getBoundingClientRect().width;
    const height = overlay.card.getBoundingClientRect().height;
    const left = clamp(event.clientX - dragState.offsetX, 12, window.innerWidth - width - 12);
    const top = clamp(event.clientY - dragState.offsetY, 12, window.innerHeight - height - 12);
    dragState.moved = true;
    applyPlacement(overlay.card, { name: "custom-drag-live", left, top });
    overlay.card.dataset.placement = "custom-drag-live";
    if (overlay.bubble?.dataset.visible === "true") {
      const bubblePlacement = chooseBubblePlacementNearLogo(overlay.bubble);
      applyPlacement(overlay.bubble, bubblePlacement);
      overlay.bubble.dataset.placement = bubblePlacement.name;
    }
    event.preventDefault();
  }

  function handleDragEnd(event) {
    if (!dragState.active || dragState.pointerId !== event.pointerId || !overlay?.card) return;
    const rect = overlay.card.getBoundingClientRect();
    const nextSettings = {
      ...settings,
      customPosition: {
        xRatio: clamp(rect.left / window.innerWidth, 0, 1),
        yRatio: clamp(rect.top / window.innerHeight, 0, 1)
      }
    };
    settings = sanitizeSettings(nextSettings);
    storageSet({ [STORAGE_KEYS.SETTINGS]: settings });
    overlay.card.dataset.dragging = "false";
    overlay.card.releasePointerCapture?.(event.pointerId);
    dragState = { active: false, pointerId: null, offsetX: 0, offsetY: 0, moved: false };
    event.preventDefault();
  }

  function handleDragCancel(event) {
    if (!dragState.active || dragState.pointerId !== event.pointerId || !overlay?.card) return;
    overlay.card.dataset.dragging = "false";
    dragState = { active: false, pointerId: null, offsetX: 0, offsetY: 0, moved: false };
  }


  function showBubble(snapshot, options = {}) {
    if (!overlay) overlay = ensureOverlay();
    if (!overlay) return;
    const title = overlay.bubble.querySelector("strong");
    const body = overlay.bubble.querySelector("span");
    title.textContent = options.title || `${getLevelLabel(snapshot.level)} 구간`;
    body.textContent = options.message || "";
    overlay.bubble.dataset.visible = "true";
    overlay.bubble.dataset.kind = options.kind || "default";
    updateOverlayPosition();

    clearTimeout(overlayTimer);
    if (!options.manual) overlayTimer = window.setTimeout(hideBubble, options.duration || 5200);
  }

  function hideBubble() {
    if (!overlay) return;
    overlay.bubble.dataset.visible = "false";
    resetHoverSession();
  }

  function scheduleHideBubble(delay = 900) {
    if (onboardingGuideActive && overlay?.bubble?.dataset.kind === "guide") return;
    clearTimeout(overlayTimer);
    overlayTimer = window.setTimeout(hideBubble, delay);
  }

  function maybeShowAutoPromptTip(snapshot, text) {
    const trimmed = String(text || "").trim();
    if (!trimmed || !PROMPT_TIP_BANK.length) return false;

    const now = Date.now();
    if (inlinePromptTip.visible || inlinePromptTip.closing) return false;
    if (now - lastInlinePromptTipHiddenAt < PROMPT_TIP_INLINE_COOLDOWN_MS) return false;

    const contextual = pickContextualPromptTip(trimmed, snapshot);
    if (!contextual) return false;

    const key = `${contextual.id || contextual.caseId}:${snapshot.level}`;
    if (key === lastAutoPromptTipKey && now - lastAutoPromptTipAt < PROMPT_TIP_INLINE_REPEAT_GUARD_MS) return false;
    if (now - lastAutoPromptTipAt < PROMPT_TIP_AUTO_DURATION_MS) return false;
    if (badgeHoverActive) return false;

    rememberPromptTip(contextual);
    lastAutoPromptTipKey = key;
    lastAutoPromptTipAt = now;
    showInlinePromptTip(snapshot, contextual, key);
    return true;
  }

  function showInlinePromptTip(snapshot, tip, key, options = {}) {
    const title = tip?.title || getPromptTipTitle(tip);
    const message = tip?.text || "";
    if (!message) return;

    inlinePromptTip = {
      visible: true,
      closing: false,
      title,
      message,
      key: key || tip?.id || ""
    };
    clearTimeout(inlinePromptTipTimer);
    clearTimeout(inlinePromptTipCloseTimer);
    updateOverlay(snapshot);
    inlinePromptTipTimer = window.setTimeout(
      () => hideInlinePromptTip(),
      Number(options.duration) || PROMPT_TIP_AUTO_DURATION_MS
    );
  }

  function hideInlinePromptTip() {
    if (!inlinePromptTip.visible && !inlinePromptTip.closing) return;
    if (inlinePromptTip.visible) {
      inlinePromptTip = { ...inlinePromptTip, visible: false, closing: true };
      lastInlinePromptTipHiddenAt = Date.now();
      clearTimeout(inlinePromptTipTimer);
      if (settings.enabled && currentEditor) updateOverlay(buildSnapshot());
      clearTimeout(inlinePromptTipCloseTimer);
      inlinePromptTipCloseTimer = window.setTimeout(() => {
        inlinePromptTip = { visible: false, closing: false, title: "", message: "", key: "" };
        if (settings.enabled && currentEditor) updateOverlay(buildSnapshot());
      }, PROMPT_TIP_INLINE_ANIMATION_MS);
      return;
    }
    inlinePromptTip = { visible: false, closing: false, title: "", message: "", key: "" };
    clearTimeout(inlinePromptTipTimer);
    clearTimeout(inlinePromptTipCloseTimer);
    if (settings.enabled && currentEditor) updateOverlay(buildSnapshot());
  }

  function showOnboardingGuide() {
    if (document.getElementById(ONBOARDING_ROOT_ID)) return;
    if (!settings.enabled || !currentEditor || settings.onboardingGuideShown || onboardingGuideActive) return;
    const snapshot = buildSnapshot();
    onboardingGuideActive = true;
    showBubble(snapshot, {
      title: "사용 가이드",
      message: "오른쪽 위 배지는 입력 길이를 보여줍니다. 프롬프팅 팁은 자동으로 뜨고, 환경 넛지는 나무 배지에 마우스를 올렸을 때만 작게 표시됩니다.",
      manual: true,
      forceVisible: true,
      kind: "guide"
    });
  }

  function dismissOnboardingGuide() {
    if (!onboardingGuideActive) return;
    onboardingGuideActive = false;
    hideBubble();
    settings = sanitizeSettings({ ...settings, onboardingGuideShown: true });
    storageSet({ [STORAGE_KEYS.SETTINGS]: settings });
  }

  function createPromptSession() {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: PLATFORM.id || "unknown",
      startedAt: Date.now(),
      initialChars: 0,
      initialTokens: 0,
      maxChars: 0,
      maxTokens: 0,
      maxUpdatedAt: 0,
      levelAtMax: "idle",
      currentChars: 0,
      currentTokens: 0,
      currentLevel: "idle",
      trimEventCount: 0,
      totalTrimmedDuringDraft: 0,
      largestDropChars: 0
    };
  }

  function levelRank(level) {
    return { idle: 0, low: 1, medium: 2, high: 3 }[level] || 0;
  }

  function updatePromptSession(snapshot) {
    if (!snapshot || snapshot.charCount <= 0) return;
    if (!promptSession) promptSession = createPromptSession();

    const previousChars = Math.max(0, Number(promptSession.currentChars) || 0);
    const currentChars = Math.max(0, Math.round(Number(snapshot.charCount) || 0));
    const currentTokens = Math.max(0, Math.round(Number(snapshot.estimatedTokens) || 0));

    if (
      promptSession.initialChars === 0 &&
      currentChars >= REPORT_MIN_MEANINGFUL_CHARS
    ) {
      promptSession.initialChars = currentChars;
      promptSession.initialTokens = currentTokens;
    }

    if (previousChars > currentChars) {
      const droppedChars = previousChars - currentChars;
      if (droppedChars >= REPORT_MIN_MEANINGFUL_CHARS) {
        promptSession.trimEventCount += 1;
        promptSession.totalTrimmedDuringDraft += droppedChars;
        promptSession.largestDropChars = Math.max(promptSession.largestDropChars || 0, droppedChars);
      }
    }

    if (currentChars > (promptSession.maxChars || 0)) {
      promptSession.maxChars = currentChars;
      promptSession.maxUpdatedAt = Date.now();
    }

    if (currentTokens > (promptSession.maxTokens || 0)) {
      promptSession.maxTokens = currentTokens;
    }

    if (levelRank(snapshot.level) > levelRank(promptSession.levelAtMax)) {
      promptSession.levelAtMax = snapshot.level;
    }

    promptSession.currentChars = currentChars;
    promptSession.currentTokens = currentTokens;
    promptSession.currentLevel = snapshot.level;
  }

  function buildPromptSessionPayload(snapshot, flags = {}) {
    const session = promptSession || createPromptSession();
    const finalChars = Math.max(0, Math.round(Number(snapshot?.charCount) || 0));
    const finalTokens = Math.max(0, Math.round(Number(snapshot?.estimatedTokens) || 0));
    const maxChars = Math.max(session.maxChars || 0, finalChars);
    const maxTokens = Math.max(session.maxTokens || 0, finalTokens);
    const initialChars = session.initialChars || finalChars;
    const initialTokens = session.initialTokens || finalTokens;
    const sentAt = Date.now();

    return {
      id: session.id,
      platform: session.platform || PLATFORM.id || "unknown",
      startedAt: session.startedAt || sentAt,
      sentAt,
      durationMs: Math.max(0, sentAt - (session.startedAt || sentAt)),
      initialChars,
      initialTokens,
      maxChars,
      maxTokens,
      finalChars,
      finalTokens,
      levelAtMax: session.levelAtMax || snapshot?.level || "idle",
      levelAtSend: flags.wasDiscarded ? "idle" : (snapshot?.level || "idle"),
      reducedChars: Math.max(0, maxChars - finalChars),
      reducedTokens: Math.max(0, maxTokens - finalTokens),
      trimEventCount: Math.max(0, Math.round(Number(session.trimEventCount) || 0)),
      totalTrimmedDuringDraft: Math.max(0, Math.round(Number(session.totalTrimmedDuringDraft) || 0)),
      largestDropChars: Math.max(0, Math.round(Number(session.largestDropChars) || 0)),
      wasDraft: Boolean(flags.wasDraft),
      wasSent: Boolean(flags.wasSent),
      wasDiscarded: Boolean(flags.wasDiscarded)
    };
  }

  function resetPromptSession() {
    promptSession = null;
    resetDraftLogGuard();
  }

  function discardPromptSessionIfNeeded(snapshot) {
    if (!promptSession) return;
    if ((promptSession.maxChars || 0) < REPORT_MIN_MEANINGFUL_CHARS) {
      resetPromptSession();
      clearLastNonEmptySnapshot();
      return;
    }

    sendLog(toLogEvent("discard", snapshot, {
      session: buildPromptSessionPayload(snapshot, { wasDiscarded: true })
    }));
    resetPromptSession();
    clearLastNonEmptySnapshot();
  }

  function maybeLogDraftUpdate(snapshot, reason = "typing") {
    logDraftUpdate(snapshot, reason, false);
  }

  function forceLogDraftUpdate(snapshot, reason = "force") {
    logDraftUpdate(snapshot, reason, true);
  }

  function logDraftUpdate(snapshot, reason = "typing", force = false) {
    if (!snapshot || snapshot.charCount <= 0 || !promptSession) return;

    const now = Date.now();
    const charDelta = Math.abs(snapshot.charCount - lastDraftLogChars);
    const levelChanged = snapshot.level !== lastDraftLogLevel;
    const enoughTimePassed = now - lastDraftLogAt >= DRAFT_UPDATE_MIN_INTERVAL_MS;
    const enoughChange = lastDraftLogChars < 0 || charDelta >= DRAFT_UPDATE_MIN_CHAR_DELTA || levelChanged;

    if (!force && (!enoughTimePassed || !enoughChange)) return;

    sendLog(toLogEvent("draft_update", snapshot, {
      draftReason: reason,
      session: buildPromptSessionPayload(snapshot, { wasDraft: true })
    }));

    lastDraftLogAt = now;
    lastDraftLogChars = snapshot.charCount;
    lastDraftLogLevel = snapshot.level;
  }

  function forceLogCurrentDraft(reason = "force") {
    if (!settings.enabled || !currentEditor) return;
    const liveText = getEditorText(currentEditor);
    const now = Date.now();
    const canUseFallback = lastNonEmptyText && now - lastNonEmptyAt <= SUBMIT_FALLBACK_WINDOW_MS;
    const text = String(liveText || "").trim() ? liveText : (canUseFallback ? lastNonEmptyText : "");
    if (!String(text || "").trim()) return;

    lastText = text;
    const snapshot = buildSnapshotFromText(text);
    updatePromptSession(snapshot);
    rememberNonEmptySnapshot(text, snapshot);
    forceLogDraftUpdate(snapshot, reason);
  }

  function resetDraftLogGuard() {
    lastDraftLogAt = 0;
    lastDraftLogChars = -1;
    lastDraftLogLevel = "idle";
  }

  function toLogEvent(type, snapshot, extra = {}) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      designVariant: FIXED_DESIGN_VARIANT,
      platform: PLATFORM.id || "unknown",
      type,
      estimatedTokens: Math.max(0, Math.round(Number(snapshot?.estimatedTokens) || 0)),
      charCount: Math.max(0, Math.round(Number(snapshot?.charCount) || 0)),
      level: snapshot?.level || "idle",
      languageMix: {
        hangul: Math.max(0, Math.round(Number(snapshot?.hangulCount) || 0)),
        cjk: Math.max(0, Math.round(Number(snapshot?.cjkCount) || 0)),
        other: Math.max(0, Math.round(Number(snapshot?.otherCount) || 0))
      },
      ...extra
    };
  }

  function handleTextChange() {
    if (!settings.enabled || !currentEditor) {
      if (overlay) overlay.card.dataset.visible = "false";
      return;
    }

    const text = getEditorText(currentEditor);
    if (String(text || "").trim()) dismissOnboardingGuide();
    lastText = text;
    const snapshot = buildSnapshot();
    const previousTokens = lastTokenCount;
    const levelChanged = snapshot.level !== lastLevel;
    const crossedMedium = snapshot.level === "medium" && previousTokens <= settings.thresholds.lowMax && snapshot.estimatedTokens > settings.thresholds.lowMax;
    const crossedHigh = snapshot.level === "high" && previousTokens <= settings.thresholds.mediumMax && snapshot.estimatedTokens > settings.thresholds.mediumMax;

    updateOverlay(snapshot);

    if (!text.trim()) {
      discardPromptSessionIfNeeded(snapshot);
      entryShown = { medium: false, high: false };
      lastLevel = "idle";
      lastTokenCount = 0;
      lastLoggedLevel = "idle";
      if (overlay?.bubble?.dataset.kind !== "guide") hideBubble();
      hideInlinePromptTip();
      return;
    }

    updatePromptSession(snapshot);
    rememberNonEmptySnapshot(text, snapshot);
    maybeLogDraftUpdate(snapshot);

    if (levelChanged && snapshot.level !== "idle" && snapshot.level !== lastLoggedLevel) {
      sendLog(toLogEvent("level_change", snapshot));
      lastLoggedLevel = snapshot.level;
    }

    // 테스트와 실제 사용 모두에서 threshold를 다시 넘으면 넛지가 다시 뜨도록
    // 낮음으로 내려가면 medium/high entry 상태를 초기화하고,
    // 중간으로 내려가면 high entry 상태를 초기화한다.
    if (snapshot.level === "low") {
      entryShown.medium = false;
      entryShown.high = false;
    } else if (snapshot.level === "medium") {
      entryShown.high = false;
    }

    if (snapshot.level === "high" && !entryShown.high) {
      entryShown.high = true;
      const message = pickNudge("entry", "high") || "나눠서 물어보면 각각 더 정확한 답변을 받을 수 있어요";
      showInlinePromptTip(snapshot, { title: "높음 구간 진입", text: message }, "entry:high", { duration: PROMPT_TIP_AUTO_DURATION_MS });
    } else if (snapshot.level === "medium" && !entryShown.medium) {
      entryShown.medium = true;
      const message = pickNudge("entry", "medium") || "핵심만 남기면 더 빠르고 정확한 답변을 받을 수 있어요";
      showInlinePromptTip(snapshot, { title: "중간 구간 진입", text: message }, "entry:medium", { duration: PROMPT_TIP_AUTO_DURATION_MS });
    } else if (maybeShowAutoPromptTip(snapshot, text)) {
      // 프롬프팅 팁은 hover가 아니라 입력 맥락에 따라 자동 노출한다.
    } else if (snapshot.level === "low" && levelChanged) {
      hideBubble();
    }

    lastLevel = snapshot.level;
    lastTokenCount = snapshot.estimatedTokens;
  }

  function getBestSubmitCapture(options = {}) {
    const liveText = typeof options.text === "string"
      ? options.text
      : (currentEditor ? getEditorText(currentEditor) : lastText);

    const now = Date.now();
    const canUseFallback = lastNonEmptyText && now - lastNonEmptyAt <= SUBMIT_FALLBACK_WINDOW_MS;
    const text = String(liveText || "").trim() ? liveText : (canUseFallback ? lastNonEmptyText : "");
    if (!String(text || "").trim()) return null;

    const snapshot = String(liveText || "").trim() && options.snapshot?.charCount > 0
      ? options.snapshot
      : buildSnapshotFromText(text);

    return { text, snapshot };
  }

  function handleSubmitSignal(options = {}) {
    if (options && options.target) options = {};

    const now = Date.now();
    if (now - lastSubmitAt < 900) return;

    const capture = getBestSubmitCapture(options);
    if (!capture || !capture.snapshot || capture.snapshot.charCount <= 0) return;

    const { text, snapshot } = capture;
    lastText = text;
    lastSubmitAt = now;

    updatePromptSession(snapshot);
    rememberNonEmptySnapshot(text, snapshot);
    forceLogDraftUpdate(snapshot, `submit_flush:${options.source || "unknown"}`);

    const sessionPayload = buildPromptSessionPayload(snapshot, { wasSent: true });
    sendLog(toLogEvent("submit", snapshot, {
      submitSource: options.source || "unknown",
      session: sessionPayload
    }));
    resetPromptSession();
    clearLastNonEmptySnapshot();

    if (snapshot.level === "high") {
      lastHighSubmitAt = now;
      const message = pickNudge("on_send", "high");
      if (message) showBubble(snapshot, { title: "전송 후 제안", message, duration: 5200 });
    }

    window.setTimeout(() => {
      const nextText = currentEditor ? getEditorText(currentEditor) : "";
      if (!nextText.trim()) entryShown = { medium: false, high: false };
    }, 700);
  }

  function captureSubmitFromCurrentEditor(source = "button") {
    const text = currentEditor ? getEditorText(currentEditor) : lastText;
    const snapshot = String(text || "").trim() ? buildSnapshotFromText(text) : null;
    handleSubmitSignal({ text, snapshot, source });
  }

  function isSendButtonLike(button) {
    if (!button) return false;
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return false;
    const text = `${button.getAttribute("aria-label") || ""} ${button.getAttribute("data-testid") || ""} ${button.getAttribute("data-test-id") || ""} ${button.textContent || ""}`;
    return /send|submit|전송|보내기|제출/i.test(text);
  }

  function handleEditorKeydown(event) {
    if (event.defaultPrevented || event.isComposing) return;
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    captureSubmitFromCurrentEditor("enter");
  }

  function bindEditor(editor) {
    if (!editor || editor === currentEditor) return;

    if (editorObserver) editorObserver.disconnect();
    if (currentEditor) {
      currentEditor.removeEventListener("input", handleTextChange, true);
      currentEditor.removeEventListener("keyup", handleTextChange, true);
      currentEditor.removeEventListener("keydown", handleEditorKeydown, true);
      currentEditor.removeEventListener("paste", delayedHandleTextChange, true);
      currentEditor.removeEventListener("compositionend", handleTextChange, true);
    }

    currentEditor = editor;
    currentComposer = findComposer(editor);
    lastText = getEditorText(currentEditor);

    editor.addEventListener("input", handleTextChange, true);
    editor.addEventListener("keyup", handleTextChange, true);
    editor.addEventListener("keydown", handleEditorKeydown, true);
    editor.addEventListener("paste", delayedHandleTextChange, true);
    editor.addEventListener("compositionend", handleTextChange, true);

    if (currentComposer) {
      currentComposer.addEventListener("submit", handleSubmitSignal, true);
      for (const selector of SELECTORS.sendButton) {
        try {
          for (const button of querySelectorAllDeep(selector, currentComposer)) {
            button.addEventListener("pointerdown", () => captureSubmitFromCurrentEditor("button_pointerdown"), true);
            button.addEventListener("mousedown", () => captureSubmitFromCurrentEditor("button_mousedown"), true);
            button.addEventListener("click", () => captureSubmitFromCurrentEditor("button_click"), true);
          }
        } catch {
          // 서비스별 DOM 실험으로 selector가 실패해도 전역 click fallback이 처리한다.
        }
      }
    }

    editorObserver = new MutationObserver(() => handleTextChange());
    editorObserver.observe(editor, { childList: true, characterData: true, subtree: true });
    handleTextChange();
    window.setTimeout(showOnboardingGuide, 500);
  }

  function delayedHandleTextChange() {
    window.setTimeout(() => {
      handleTextChange();
      forceLogCurrentDraft("paste");
    }, 0);
  }

  function scanAndBind() {
    const editor = findEditor();
    if (editor) bindEditor(editor);
  }

  function handleGlobalPointerDown(event) {
    dismissOnboardingGuide();
    if (!overlay) return;
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const insideCard = path.includes(overlay.card);

    if (!insideCard) {
      if (overlay.bubble?.dataset.visible === "true") hideBubble();
      // 프롬프팅 팁 바는 외부 클릭으로 즉시 닫지 않는다.
      // 노출 시간이 끝날 때 hideInlinePromptTip()의 접힘 애니메이션으로만 사라지게 한다.
    }
  }

  function observePage() {
    pageObserver = new MutationObserver(() => {
      window.clearTimeout(observePage._timer);
      observePage._timer = window.setTimeout(scanAndBind, 150);
    });
    pageObserver.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", () => updateOverlayPosition(), { passive: true });
    window.addEventListener("scroll", () => updateOverlayPosition(), { passive: true });
    const handleGlobalSendButtonSignal = (event) => {
      const button = event.target?.closest?.("button, [role='button']");
      if (!button || !currentComposer || !currentComposer.contains(button)) return;
      if (isSendButtonLike(button)) captureSubmitFromCurrentEditor(`global_${event.type}`);
    };
    const handleGlobalSubmitKeydown = (event) => {
      dismissOnboardingGuide();
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
      const path = typeof event.composedPath === "function" ? event.composedPath() : [];
      const targetInsideEditor = currentEditor && (event.target === currentEditor || currentEditor.contains?.(event.target) || path.includes(currentEditor));
      const targetInsideComposer = currentComposer && (event.target === currentComposer || currentComposer.contains?.(event.target) || path.includes(currentComposer));
      if (!targetInsideEditor && !targetInsideComposer) return;
      captureSubmitFromCurrentEditor("enter_global");
    };
    document.addEventListener("pointerdown", handleGlobalSendButtonSignal, true);
    document.addEventListener("click", handleGlobalSendButtonSignal, true);
    document.addEventListener("pointerdown", handleGlobalPointerDown, true);
    document.addEventListener("keydown", handleGlobalSubmitKeydown, true);
    window.addEventListener("blur", () => forceLogCurrentDraft("blur"), { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") forceLogCurrentDraft("visibility_hidden");
    }, true);

    document.addEventListener("mousemove", (event) => {
      if (!overlay || !settings.enabled || !currentEditor) return;
      const cardRect = overlay.card?.getBoundingClientRect();
      const insideCard = pointInRect(event.clientX, event.clientY, cardRect);

      if (insideCard) {
        if (!badgeHoverActive) {
          badgeHoverActive = true;
          triggerHoverBubble();
        }
      } else if (badgeHoverActive) {
        handleBadgePointerLeave();
      }
    }, true);
  }

  function showOnboarding() {
    if (document.getElementById(ONBOARDING_ROOT_ID)) return;

    const puzzleUrl = chrome.runtime.getURL("assets/extension-puzzle-outline.svg");
    const puzzleImg = (size) => `<img src="${puzzleUrl}" width="${size}" height="${size}" style="vertical-align:middle;margin:0 2px;" alt="🧩" />`;

    const puriLowUrl = chrome.runtime.getURL("assets/푸리_낮음.svg");
    const puriMedUrl = chrome.runtime.getURL("assets/푸리_중간.svg");
    const puriHighUrl = chrome.runtime.getURL("assets/푸리_높음.svg");

    const SLIDES = [
      {
        imgUrl: puriLowUrl,
        imgSize: 80,
        title: "챗풀에 오신 걸 환영해요",
        body: "ChatGPT에 입력할 때마다\n푸리가 입력 길이를 알려드려요\n\n길게 쓸수록 푸리가 힘들어하고\n간결하게 쓸수록 푸리가 건강해져요",
        note: null
      },
      {
        imgLevel: "low",
        title: "푸리 상태로 입력 길이를 확인해요",
        htmlBody: `<div class="level-row"><img src="${puriLowUrl}" width="32" height="32" alt="낮음" /><span class="text-body-l"><strong class="text-status">낮음</strong> — 딱 좋은 길이예요</span></div><div class="level-row"><img src="${puriMedUrl}" width="32" height="32" alt="중간" /><span class="text-body-l"><strong class="text-status">중간</strong> — 핵심만 남기면 더 빠른 답변을 받을 수 있어요</span></div><div class="level-row"><img src="${puriHighUrl}" width="32" height="32" alt="높음" /><span class="text-body-l"><strong class="text-status">높음</strong> — 나눠서 물어보면 더 정확한 답변을 얻을 수 있어요</span></div>`,
        note: "채팅을 입력하면 푸리가 프롬프트를 더 잘 쓰는 팁을 알려줘요"
      },
      {
        imgUrl: puzzleUrl,
        title: "설정은 여기서 바꿀 수 있어요",
        htmlBody: `<span class="text-body-l">브라우저 주소창 오른쪽</span><span class="text-body-l">${puzzleImg(16)} 아이콘을 클릭하고</span><span class="text-body-l">챗풀을 선택하면 설정을 바꿀 수 있어요</span>`,
        steps: `<span class="text-body-m">① ${puzzleImg(14)} 클릭 &nbsp;→&nbsp; ② 챗풀 선택</span>`,
        note: null
      }
    ];

    const host = document.createElement("div");
    host.id = ONBOARDING_ROOT_ID;
    document.documentElement.appendChild(host);
    host.style.pointerEvents = "auto"; // backdrop과 card가 클릭 이벤트를 받을 수 있도록

    const shadow = host.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = getOnboardingStyleText();

    // backdrop and card are siblings — both position:fixed
    const backdrop = document.createElement("div");
    backdrop.className = "cp-ob-backdrop";

    const card = document.createElement("div");
    card.className = "cp-ob-card";

    const skipBtn = document.createElement("button");
    skipBtn.className = "cp-ob-skip text-body-s";
    skipBtn.textContent = "건너뛰기";

    const slideArea = document.createElement("div");
    slideArea.className = "cp-ob-slide-area";

    const emojiEl = document.createElement("div");
    emojiEl.className = "cp-ob-emoji";

    const titleEl = document.createElement("div");
    titleEl.className = "cp-ob-title text-h2";

    const bodyEl = document.createElement("div");
    bodyEl.className = "cp-ob-body";

    const noteEl = document.createElement("div");
    noteEl.className = "cp-ob-note text-body-m";

    slideArea.append(emojiEl, titleEl, bodyEl, noteEl);

    const nav = document.createElement("div");
    nav.className = "cp-ob-nav";

    const dotsEl = document.createElement("div");
    dotsEl.className = "cp-ob-dots";

    const dots = SLIDES.map((_, i) => {
      const dot = document.createElement("span");
      dot.className = "cp-ob-dot" + (i === 0 ? " active" : "");
      dotsEl.appendChild(dot);
      return dot;
    });

    const prevBtn = document.createElement("button");
    prevBtn.className = "cp-ob-prev text-body-l";
    prevBtn.textContent = "← 이전";

    const nextBtn = document.createElement("button");
    nextBtn.className = "cp-ob-next text-body-l";
    nextBtn.textContent = "다음";

    nav.append(prevBtn, dotsEl, nextBtn);
    card.append(skipBtn, slideArea, nav);
    shadow.append(styleEl, backdrop, card);

    let currentSlide = 0;

    // --- Badge helpers ---
    function getBadgeCard() {
      return overlay?.card || document.getElementById(ROOT_ID)?.__chatpullOverlay?.card || null;
    }

    function applyBadgeHighlight() {
      const bc = getBadgeCard();
      if (!bc) return;
      bc.dataset.visible = "true";
      if (bc.dataset.level === "idle") bc.dataset.level = "low";
      bc.style.boxShadow = "0 0 0 3px rgba(209, 214, 0, 0.45), 0 0 12px rgba(209, 214, 0, 0.25)";
      bc.style.transition = "box-shadow 300ms ease, opacity 160ms ease, transform 160ms ease";
    }

    function removeBadgeHighlight() {
      const bc = getBadgeCard();
      if (!bc) return;
      bc.style.boxShadow = "";
      bc.style.transition = "";
      bc.dataset.visible = String(!!(settings.enabled && currentEditor));
    }

    // --- Card positioning ---
    // All slides use pixel-based left/top so transitions between them are smooth.

    function calcBadgePos() {
      const bc = getBadgeCard();
      if (!bc) return null;
      const r = bc.getBoundingClientRect();
      if (!r || r.width === 0 || (r.left === 0 && r.top === 0)) return null;
      return r;
    }

    function applyCardPos(pos, skipTransition) {
      if (skipTransition) {
        card.style.transition = "none";
        void card.offsetHeight;
      }
      card.style.top = `${pos.top}px`;
      card.style.left = `${pos.left}px`;
      card.style.maxWidth = `${pos.maxWidth}px`;
      if (pos.tail) {
        card.setAttribute("data-tail", pos.tail);
      } else {
        card.removeAttribute("data-tail");
      }
      if (skipTransition) {
        void card.offsetHeight;
        card.style.removeProperty("transition");
      }
    }

    function posSlide0(skipTransition) {
      const CARD_W = Math.min(400, window.innerWidth - 32);
      const CARD_H_EST = 380;
      applyCardPos({
        left: (window.innerWidth - CARD_W) / 2,
        top: Math.max(20, (window.innerHeight - CARD_H_EST) / 2),
        maxWidth: CARD_W,
        tail: null
      }, skipTransition);
    }

    function posSlide1(skipTransition, badgeRect) {
      const CARD_W = 280;
      const GAP = 12;
      const MARGIN = 8;

      // 1단계: transition 없이 off-screen invisible 위치로 이동 → 실제 높이 확보
      card.style.transition = "none";
      card.style.visibility = "hidden";
      card.style.maxWidth = `${CARD_W}px`;
      card.style.top = "-9999px";
      card.style.left = "0px";
      card.removeAttribute("data-tail");
      void card.getBoundingClientRect(); // force reflow

      function measureAndApply(r) {
        requestAnimationFrame(() => {
          if (currentSlide !== 1) return;

          const measured = card.getBoundingClientRect();
          const cardH = measured.height || 280;
          const cardW = measured.width || CARD_W;
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          // 가로: 뱃지 오른쪽 끝 기준 정렬, 화면 밖 clamp
          let left = r.right - cardW;
          left = Math.max(MARGIN, Math.min(left, vw - cardW - MARGIN));

          // 말풍선 하단 = 뱃지 상단 - gap (기본: 위)
          let top = r.top - cardH - GAP;
          let tail = "down";

          // 위 공간 부족 → 뱃지 아래로 fallback
          if (top < MARGIN) {
            top = r.bottom + GAP;
            tail = "up";
          }

          top = Math.max(MARGIN, Math.min(top, vh - cardH - MARGIN));

          // 2단계: transition 복원 후 최종 위치 적용
          card.style.removeProperty("transition");
          card.style.top = `${Math.round(top)}px`;
          card.style.left = `${Math.round(left)}px`;
          card.setAttribute("data-tail", tail);
          card.style.visibility = "visible";
        });
      }

      if (badgeRect) {
        measureAndApply(badgeRect);
      } else {
        // 뱃지 rect가 없으면 등장 대기 후 재시도
        let tries = 0;
        const retry = () => {
          if (currentSlide !== 1) return;
          tries++;
          const r = calcBadgePos();
          if (r) {
            measureAndApply(r);
            updateBackdrop(1);
          } else if (tries < 6) {
            setTimeout(retry, 300);
          }
        };
        setTimeout(retry, 200);
      }
    }

    function posSlide2(skipTransition) {
      const CARD_W = Math.min(400, window.innerWidth - 32);
      const CARD_H_EST = 320;
      applyCardPos({
        left: (window.innerWidth - CARD_W) / 2,
        top: Math.max(20, (window.innerHeight - CARD_H_EST) / 2),
        maxWidth: CARD_W,
        tail: null
      }, skipTransition);
    }

    // --- Backdrop / spotlight ---
    function updateBackdrop(slideIndex) {
      backdrop.classList.add("visible");
      if (slideIndex === 1) {
        const r = calcBadgePos();
        if (r) {
          applySpotlight(r);
        } else {
          backdrop.style.background = "rgba(0,0,0,0.5)";
          let tries = 0;
          const retry = () => {
            if (currentSlide !== 1) return;
            tries++;
            const rect = calcBadgePos();
            if (rect) {
              applySpotlight(rect);
            } else if (tries < 6) {
              setTimeout(retry, 300);
            }
          };
          setTimeout(retry, 200);
        }
      } else {
        backdrop.style.background = "rgba(0,0,0,0.5)";
      }
    }

    function applySpotlight(r) {
      const cx = Math.round(r.left + r.width / 2);
      const cy = Math.round(r.top + r.height / 2);
      const radius = Math.round(Math.max(r.width, r.height) / 2 + 14);
      backdrop.style.background =
        `radial-gradient(circle ${radius}px at ${cx}px ${cy}px, transparent 0%, rgba(0,0,0,0.6) 100%)`;
    }

    // --- Slide rendering ---
    function renderSlide(index) {
      const slide = SLIDES[index];
      const isLast = index === SLIDES.length - 1;

      if (slide.imgLevel) {
        emojiEl.innerHTML = characterIcon(slide.imgLevel);
        emojiEl.classList.add("cp-ob-emoji-img");
      } else if (slide.imgUrl) {
        const s = slide.imgSize || 48;
        emojiEl.innerHTML = `<img src="${slide.imgUrl}" width="${s}" height="${s}" style="width:${s}px;height:${s}px" alt="" draggable="false" />`;
        emojiEl.classList.add("cp-ob-emoji-img");
      } else {
        emojiEl.textContent = slide.emoji || "";
        emojiEl.classList.remove("cp-ob-emoji-img");
      }
      titleEl.textContent = slide.title;
      if (slide.htmlBody) {
        bodyEl.innerHTML = slide.htmlBody;
      } else {
        bodyEl.innerHTML = (slide.body || "").split("\n").map((line) =>
          line
            ? `<span class="text-body-l">${esc(line)}</span>`
            : `<span class="spacer"></span>`
        ).join("");
      }

      if (slide.steps) {
        noteEl.innerHTML = slide.steps;
        noteEl.style.display = "block";
      } else if (slide.note) {
        noteEl.textContent = slide.note;
        noteEl.style.display = "block";
      } else {
        noteEl.style.display = "none";
      }

      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      nextBtn.textContent = isLast ? "시작하기" : "다음";
      prevBtn.style.visibility = index === 0 ? "hidden" : "visible";
      skipBtn.style.visibility = isLast ? "hidden" : "visible";
    }

    // --- Lifecycle ---
    function hideBubbleForOnboarding() {
      if (overlay?.bubble) overlay.bubble.dataset.visible = "false";
      hideInlinePromptTip();
    }

    function restoreBubbleFromOnboarding() {
      handleTextChange();
    }

    function closeOnboarding() {
      if (currentSlide === 1) restoreBubbleFromOnboarding();
      removeBadgeHighlight();
      host.remove();
      storageSet({ [ONBOARDING_KEY]: true });
    }

    function goNext() {
      if (currentSlide >= SLIDES.length - 1) {
        closeOnboarding();
        return;
      }

      const nextIndex = currentSlide + 1;
      const badgeRect = nextIndex === 1 ? calcBadgePos() : null;

      if (nextIndex === 1) {
        applyBadgeHighlight();
        hideBubbleForOnboarding();
      } else {
        if (currentSlide === 1) restoreBubbleFromOnboarding();
        removeBadgeHighlight();
      }

      slideArea.classList.remove("cp-ob-exit-rev");
      slideArea.classList.add("cp-ob-exit");

      setTimeout(() => {
        currentSlide = nextIndex;
        renderSlide(currentSlide);
        updateBackdrop(currentSlide);

        if (nextIndex === 0) posSlide0(false);
        else if (nextIndex === 1) posSlide1(false, badgeRect);
        else posSlide2(false);

        slideArea.classList.remove("cp-ob-exit");
        slideArea.classList.add("cp-ob-enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => slideArea.classList.remove("cp-ob-enter"));
        });
      }, 150);
    }

    function goPrev() {
      if (currentSlide <= 0) return;

      const prevIndex = currentSlide - 1;
      const badgeRect = prevIndex === 1 ? calcBadgePos() : null;

      if (currentSlide === 1) {
        restoreBubbleFromOnboarding();
        removeBadgeHighlight();
      } else if (prevIndex === 1) {
        applyBadgeHighlight();
        hideBubbleForOnboarding();
      }

      slideArea.classList.remove("cp-ob-enter-rev");
      slideArea.classList.add("cp-ob-exit-rev");

      setTimeout(() => {
        currentSlide = prevIndex;
        renderSlide(currentSlide);
        updateBackdrop(currentSlide);

        if (prevIndex === 0) posSlide0(false);
        else if (prevIndex === 1) posSlide1(false, badgeRect);
        else posSlide2(false);

        slideArea.classList.remove("cp-ob-exit-rev");
        slideArea.classList.add("cp-ob-enter-rev");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => slideArea.classList.remove("cp-ob-enter-rev"));
        });
      }, 150);
    }

    // Initial setup — no transition, then fade in
    hideBubbleForOnboarding();
    renderSlide(0);
    posSlide0(true);
    updateBackdrop(0);
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("visible")));

    backdrop.addEventListener("click", closeOnboarding);
    skipBtn.addEventListener("click", closeOnboarding);
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);
  }
  function getOnboardingStyleText() {
    return `
      :host {
        all: initial;
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: block !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        overflow: visible !important;
      }
      * { box-sizing: border-box; }
      .cp-ob-backdrop,
      .cp-ob-card {
        --green-50: #f9fac0;
        --green-100: #f2f47a;
        --green-200: #e8eb3e;
        --green-400: #d1d600;
        --green-600: #a8ac00;
        --green-800: #7a7d00;
        --green-900: #4e5000;
        --gray-50: #f7f7f0;
        --gray-100: #e5e5d8;
        --gray-200: #c8c8ba;
        --gray-400: #919188;
        --gray-600: #5e5e57;
        --gray-800: #383833;
        --gray-900: #1a1a16;
        --danger: #ef4444;
        --warning: #f97316;
        font-family: "SUIT", "Pretendard", "Apple SD Gothic Neo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: -0.018em;
      }
      .text-display { font-size: 24px; font-weight: 700; line-height: 130%; }
      .text-h1 { font-size: 20px; font-weight: 700; line-height: 130%; }
      .text-h2 { font-size: 17px; font-weight: 600; line-height: 130%; }
      .text-h3 { font-size: 15px; font-weight: 600; line-height: 130%; }
      .text-status { font-size: 14px; font-weight: 700; line-height: 130%; }
      .text-body-l { font-size: 12px; font-weight: 500; line-height: 130%; }
      .text-body-m { font-size: 11px; font-weight: 400; line-height: 130%; }
      .text-body-s { font-size: 10px; font-weight: 500; line-height: 130%; }
      .cp-ob-backdrop {
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(26, 26, 22, 0.5);
        z-index: 2147483645;
        pointer-events: none;
        opacity: 0;
        transition: opacity 300ms ease;
      }
      .cp-ob-backdrop.visible {
        opacity: 1;
        pointer-events: auto;
      }
      .cp-ob-card {
        position: fixed;
        z-index: 2147483646;
        background: #ffffff;
        border: 1px solid rgba(26, 26, 22, 0.08);
        border-radius: 20px;
        padding: 28px 28px 24px;
        width: calc(100vw - 32px);
        box-shadow: 0 12px 40px rgba(78, 80, 0, 0.12);
        color: var(--gray-900);
        pointer-events: auto;
        opacity: 0;
        transition: top 300ms ease, left 300ms ease, max-width 300ms ease, opacity 240ms ease;
      }
      .cp-ob-card.visible { opacity: 1; }
      .cp-ob-card[data-tail="right"]::after {
        content: "";
        position: absolute;
        right: -10px;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-left: 10px solid #ffffff;
        filter: drop-shadow(2px 0 1px rgba(0,0,0,0.06));
      }
      .cp-ob-card[data-tail="up"]::after {
        content: "";
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 10px solid #ffffff;
        filter: drop-shadow(0 -2px 1px rgba(0,0,0,0.06));
      }
      .cp-ob-card[data-tail="down"]::after {
        content: "";
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid #ffffff;
        filter: drop-shadow(0 2px 1px rgba(0,0,0,0.06));
      }
      .cp-ob-skip {
        position: absolute;
        top: 16px;
        right: 20px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--gray-400);
        font-family: inherit;
        letter-spacing: inherit;
        padding: 4px 0;
      }
      .cp-ob-skip:hover { color: var(--gray-600); }
      .cp-ob-slide-area {
        transition: opacity 150ms ease, transform 150ms ease;
      }
      .cp-ob-exit {
        opacity: 0;
        transform: translateX(-12px);
      }
      .cp-ob-enter {
        opacity: 0;
        transform: translateX(12px);
      }
      .cp-ob-exit-rev {
        opacity: 0;
        transform: translateX(12px);
      }
      .cp-ob-enter-rev {
        opacity: 0;
        transform: translateX(-12px);
      }
      .cp-ob-emoji {
        font-size: 40px;
        margin-bottom: 14px;
        line-height: 1;
      }
      .cp-ob-emoji-img { font-size: 0; }
      .cp-ob-emoji-img .cp-character { width: 48px; height: 48px; }
      .cp-ob-title {
        color: var(--gray-900);
        margin-bottom: 12px;
      }
      .cp-ob-body {
        color: var(--gray-800);
        margin-bottom: 12px;
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .cp-ob-body .spacer { display: block; height: 8px; }
      .cp-ob-body .level-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 5px 0;
      }
      .cp-ob-body .level-row img { flex-shrink: 0; width: 32px; height: 32px; }
      .cp-ob-body .level-row .text-status { color: var(--green-900); }
      .cp-ob-note {
        color: var(--gray-600);
        background: var(--green-50);
        border: 1px solid rgba(209, 214, 0, 0.35);
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 0;
      }
      .cp-ob-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20px;
      }
      .cp-ob-dots {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .cp-ob-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--gray-200);
        transition: background 200ms ease, width 200ms ease, border-radius 200ms ease;
      }
      .cp-ob-dot.active {
        background: var(--green-400);
        width: 18px;
        border-radius: 3px;
      }
      .cp-ob-next {
        background: var(--green-900);
        color: #ffffff;
        border: none;
        border-radius: 10px;
        padding: 10px 20px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        letter-spacing: inherit;
        transition: background 160ms ease, filter 160ms ease;
      }
      .cp-ob-next:hover { filter: brightness(1.08); }
      .cp-ob-prev {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--gray-400);
        font-family: inherit;
        letter-spacing: inherit;
        padding: 10px 4px;
        transition: color 160ms ease;
      }
      .cp-ob-prev:hover { color: var(--gray-800); }
    `;
  }

  function characterIcon(level) {
    const map = {
      idle: chrome.runtime.getURL("assets/푸리_대기.svg"),
      low: chrome.runtime.getURL("assets/푸리_낮음.svg"),
      medium: chrome.runtime.getURL("assets/푸리_중간.svg"),
      high: chrome.runtime.getURL("assets/푸리_높음.svg")
    };
    const src = map[level] || map.idle;
    return `<img src="${src}" class="cp-character" alt="${esc(level)}" draggable="false" />`;
  }
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "CHATPOOL_SHOW_ONBOARDING") {
      showOnboarding();
    }
  });

  async function boot() {
    await loadSettings();
    const onboarded = await storageGet(ONBOARDING_KEY);
    if (onboarded !== true) showOnboarding();
    observePage();
    scanAndBind();
    window.setInterval(scanAndBind, 1500);
    chrome?.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (changes[STORAGE_KEYS.SETTINGS]) {
        settings = sanitizeSettings(deepMerge(settings, changes[STORAGE_KEYS.SETTINGS].newValue || {}));
        handleTextChange();
      }
      if (changes[ONBOARDING_KEY]?.newValue === false) {
        showOnboarding();
      }
    });
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function leafIcon() {
    return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 4C12.5 4.4 7 8.5 6.3 15.4C10.7 14.9 15.5 12.4 20 4Z" fill="currentColor" opacity="0.82"/><path d="M4 20C7.5 14.2 11.2 10.4 17 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  }

  function treeIcon(level, state = "current") {
    const className = `cp-tree cp-tree-${esc(state)}`;
    if (level === "idle") return `<span class="${className}">${leafIcon()}</span>`;
    if (level === "high") {
      return `<svg class="${className}" viewBox="0 0 72 72" fill="none" aria-hidden="true"><ellipse cx="36" cy="64" rx="15" ry="6" fill="#D7CABA"/><path d="M36 63V42M36 42L18 25M36 42L54 24M36 51L20 50M36 51L54 50M36 34L25 18M36 34L47 17" stroke="#76523A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    if (level === "medium") {
      return `<svg class="${className}" viewBox="0 0 72 72" fill="none" aria-hidden="true"><ellipse cx="36" cy="64" rx="15" ry="6" fill="#D7CABA"/><rect x="31" y="38" width="10" height="26" rx="5" fill="#76523A"/><circle cx="36" cy="33" r="23" fill="#82A456"/><ellipse cx="36" cy="22" rx="19" ry="14" fill="#B2D371"/></svg>`;
    }
    return `<svg class="${className}" viewBox="0 0 72 72" fill="none" aria-hidden="true"><ellipse cx="36" cy="64" rx="15" ry="6" fill="#D7CABA"/><rect x="31" y="38" width="10" height="26" rx="5" fill="#76523A"/><circle cx="36" cy="33" r="23" fill="#58A27E"/><ellipse cx="36" cy="23" rx="19" ry="15" fill="#9EE3C9"/></svg>`;
  }

  function getStyleText() {
    return `
      :host {
        all: initial;
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: block !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        overflow: visible !important;
      }
      * { box-sizing: border-box; }
      .cp-widget, .cp-bubble {
        --green-50: #f9fac0;
        --green-100: #f2f47a;
        --green-200: #e8eb3e;
        --green-400: #d1d600;
        --green-600: #a8ac00;
        --green-800: #7a7d00;
        --green-900: #4e5000;
        --gray-50: #f7f7f0;
        --gray-100: #e5e5d8;
        --gray-200: #c8c8ba;
        --gray-400: #919188;
        --gray-600: #5e5e57;
        --gray-800: #383833;
        --gray-900: #1a1a16;
        --danger: #ef4444;
        --warning: #f97316;
        --black: #000000;
        font-family: "SUIT", "Pretendard", "Apple SD Gothic Neo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: -0.018em;
      }
      .text-display { font-size: 24px; font-weight: 700; line-height: 130%; }
      .text-h1 { font-size: 20px; font-weight: 700; line-height: 130%; }
      .text-h2 { font-size: 17px; font-weight: 600; line-height: 130%; }
      .text-h3 { font-size: 15px; font-weight: 600; line-height: 130%; }
      .text-status { font-size: 14px; font-weight: 700; line-height: 130%; }
      .text-body-l { font-size: 12px; font-weight: 500; line-height: 130%; }
      .text-body-m { font-size: 11px; font-weight: 400; line-height: 130%; }
      .text-body-s { font-size: 10px; font-weight: 500; line-height: 130%; }
      .cp-widget {
        position: fixed;
        z-index: 2147483647;
        color: var(--gray-900);
        background: #ffffff;
        border: 1px solid rgba(26, 26, 22, 0.08);
        box-shadow: none;
        filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.12));
        backdrop-filter: none;
        pointer-events: auto;
        opacity: 0;
        transform: scale(var(--cp-logo-scale, 0.8)) translateY(8px);
        transform-origin: top left;
        transition: opacity 160ms ease, transform 160ms ease, filter 160ms ease;
        user-select: none;
      }
      .cp-widget[data-visible="true"] { opacity: 1; transform: scale(var(--cp-logo-scale, 0.8)) translateY(0); }
      .cp-widget:hover { filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.12)); }
      .cp-widget[data-drag-enabled="true"] { cursor: grab; }
      .cp-widget[data-dragging="true"] { cursor: grabbing; transition: none; }
      .cp-widget[data-level="low"] { --level-color: var(--green-400); --level-deep: var(--green-900); }
      .cp-widget[data-level="medium"] { --level-color: var(--warning); --level-deep: var(--gray-800); }
      .cp-widget[data-level="high"] { --level-color: var(--danger); --level-deep: var(--gray-900); }
      .cp-widget[data-level="idle"] { --level-color: var(--gray-200); --level-deep: var(--gray-600); }
      .cp-tree { display: block; width: 40px; height: 40px; }
      .cp-bubble {
        position: fixed;
        z-index: 2147483647;
        width: max-content;
        max-width: 158px;
        padding: 5px 7px 6px 7px;
        border-radius: 10px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #000000;
        box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
        opacity: 0;
        transform: translateY(5px);
        pointer-events: none;
        transition: opacity 160ms ease, transform 160ms ease;
      }
      .cp-bubble[data-visible="true"] { opacity: 1; transform: translateY(0); pointer-events: auto; }
      .cp-bubble strong {
        display: block;
        margin: 0 0 2px;
        color: var(--level-deep, var(--green-900));
      }
      .cp-bubble strong.text-status {
        font-size: calc(14px * var(--cp-nudge-scale, 0.8));
        font-weight: 700;
        line-height: 130%;
      }
      .cp-bubble span {
        display: block;
        color: var(--gray-800);
        font-size: calc(11px * var(--cp-nudge-scale, 0.8));
        font-weight: 400;
        line-height: 130%;
      }
      .variant-tree-status-badge {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        min-width: 170px;
        max-width: 188px;
        padding: 8px 11px 8px 10px;
        border-radius: 999px;
        overflow: visible;
      }
      .variant-tree-status-badge[data-prompt-tip-visible="true"] {
        border-radius: 999px;
      }
      .cp-status-segment {
        position: relative;
        z-index: 2;
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 152px;
      }
      .cp-tree-wrap { flex: 0 0 auto; display: grid; place-items: center; width: 42px; height: 42px; }
      .cp-character {
        width: 36px;
        height: 36px;
        display: block;
        transition: all 300ms ease;
        pointer-events: none;
      }
      .cp-widget[data-level="idle"] .cp-character { animation: puri-idle 3s ease-in-out infinite; }
      .cp-widget[data-level="low"] .cp-character { animation: puri-bounce 1.5s ease-in-out infinite; }
      .cp-widget[data-level="medium"] .cp-character { animation: puri-shake 0.8s ease-in-out infinite; }
      .cp-widget[data-level="high"] .cp-character { animation: puri-panic 0.4s ease-in-out infinite; }
      @keyframes puri-idle {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }
      @keyframes puri-bounce {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-6px) scale(1.05); }
      }
      @keyframes puri-shake {
        0%, 100% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
      }
      @keyframes puri-panic {
        0%, 100% { transform: translateX(-2px) rotate(-3deg); }
        50% { transform: translateX(2px) rotate(3deg); }
      }
      .cp-badge-copy { min-width: 0; display: grid; gap: 3px; }
      .cp-badge-copy strong.text-status { white-space: nowrap; color: var(--level-deep, var(--green-900)); }
      .cp-badge-copy span.text-body-m { white-space: nowrap; color: var(--gray-600); }
      .cp-prompt-tip-inline {
        position: absolute;
        right: calc(100% - 28px);
        top: -1px;
        bottom: -1px;
        width: var(--cp-tip-width, 480px);
        min-height: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        column-gap: 10px;
        row-gap: 2px;
        padding: 0 42px 0 16px;
        border-radius: 999px 0 0 999px;
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-right: 0;
        box-shadow: none;
        backdrop-filter: none;
        white-space: normal;
        overflow: hidden;
        transform: none;
        transform-origin: right center;
        z-index: 1;
        animation: cp-tip-unfold-left 1500ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      .cp-prompt-tip-inline[data-state="closing"] {
        animation: cp-tip-fold-left 1500ms cubic-bezier(0.7, 0, 0.84, 0) both;
      }
      .cp-prompt-tip-inline strong.text-status {
        white-space: nowrap;
        color: var(--level-deep, var(--green-900));
      }
      .cp-prompt-tip-inline span.text-body-l {
        min-width: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        white-space: normal;
        text-overflow: ellipsis;
        color: var(--gray-800);
      }
      @keyframes cp-tip-unfold-left {
        from {
          opacity: 1;
          width: 28px;
          padding-left: 0;
          padding-right: 0;
        }
        to {
          opacity: 1;
          width: var(--cp-tip-width, 480px);
          padding-left: 16px;
          padding-right: 42px;
        }
      }
      @keyframes cp-tip-fold-left {
        from {
          opacity: 1;
          width: var(--cp-tip-width, 480px);
          padding-left: 16px;
          padding-right: 42px;
        }
        to {
          opacity: 1;
          width: 28px;
          padding-left: 0;
          padding-right: 0;
        }
      }
      .cp-inline-divider { display: none; }
    `;
  }

  boot().catch((error) => console.warn(`[${APP}] failed to boot`, error));
})();
