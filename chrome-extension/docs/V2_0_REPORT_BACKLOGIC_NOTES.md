# V2.0 Report Back Logic Notes

## 변경 목적

리포트 UI가 아직 확정되지 않은 상태에서도 이후 분석과 시각화에 필요한 프롬프트 사용 데이터셋을 로컬에 수집할 수 있도록 백로직을 추가했습니다.

## 수정 파일

- `content/content.js`
- `background/service-worker.js`
- `manifest.json`

## 새로 수집되는 원천 데이터

### submit event

사용자가 실제로 프롬프트를 전송했을 때 저장됩니다.

```json
{
  "type": "submit",
  "platform": "chatgpt",
  "estimatedTokens": 96,
  "charCount": 147,
  "level": "medium",
  "session": {
    "initialChars": 80,
    "initialTokens": 52,
    "maxChars": 170,
    "maxTokens": 108,
    "finalChars": 147,
    "finalTokens": 96,
    "levelAtMax": "medium",
    "levelAtSend": "medium",
    "reducedChars": 23,
    "reducedTokens": 12,
    "durationMs": 5000,
    "wasSent": true,
    "wasDiscarded": false
  }
}
```

### discard event

사용자가 20자 이상 입력했다가 전부 지운 경우 저장됩니다.

```json
{
  "type": "discard",
  "platform": "chatgpt",
  "level": "idle",
  "session": {
    "maxChars": 170,
    "maxTokens": 108,
    "finalChars": 0,
    "finalTokens": 0,
    "wasSent": false,
    "wasDiscarded": true
  }
}
```

## 프론트 호출 API

### 1. 일간 리포트

```js
chrome.runtime.sendMessage(
  { type: "CHATPOOL_GET_DAILY_REPORT" },
  (response) => {
    if (!response?.ok) return;
    console.log(response.report);
  }
);
```

특정 날짜:

```js
chrome.runtime.sendMessage(
  {
    type: "CHATPOOL_GET_DAILY_REPORT",
    dateKey: "2026-05-29"
  },
  (response) => {
    if (!response?.ok) return;
    console.log(response.report);
  }
);
```

### 2. 기간 데이터셋

```js
chrome.runtime.sendMessage(
  {
    type: "CHATPOOL_GET_REPORT_DATASETS",
    fromDateKey: "2026-05-23",
    toDateKey: "2026-05-29"
  },
  (response) => {
    if (!response?.ok) return;
    console.log(response.datasets);
  }
);
```

## DailyReport 주요 필드

- `totalSent`: 오늘 전송 횟수
- `discardCount`: 입력 후 전부 지운 세션 수
- `avgInitialChars`: 최초 의미 있는 입력 평균 글자 수
- `avgMaxChars`: 작성 중 최대 입력 평균 글자 수
- `avgFinalChars`: 최종 전송 평균 글자 수
- `avgFinalTokens`: 최종 전송 평균 예상 토큰 수
- `lowRatioPct`: low 전송 비율
- `mediumRatioPct`: medium 전송 비율
- `highRatioPct`: high 전송 비율
- `efficientFlowPct`: low + medium 비율
- `avgReducedChars`: 전송 전 평균 줄인 글자 수
- `totalReducedChars`: 전송 전 총 줄인 글자 수
- `highToMediumCount`: 작성 중 high였다가 전송 시 medium으로 줄인 횟수
- `platformCounts`: ChatGPT / Gemini별 전송 횟수
- `message`: 리포트 한 줄 문구

## 저장 위치

- 원천 이벤트: `chrome.storage.local`의 `chatpool.events`
- 일간 집계: `chrome.storage.local`의 `chatpool.daily`

## 주의

- 토큰은 실제 tokenizer가 아니라 현재 Chatpull의 문자군 기반 예상값입니다.
- 프롬프트 본문 원문은 저장하지 않습니다.
- 리포트 UI는 아직 추가하지 않았습니다.
