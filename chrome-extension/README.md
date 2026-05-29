# 챗풀 Chatpull v2.0.2

ChatGPT와 Gemini 입력창에서 예상 토큰량을 표시하고, 사용자의 프롬프트 작성 습관을 리포트용 데이터로 로컬 저장하는 Chrome Extension 프로토타입입니다.

현재 v2.0.2의 핵심은 **빠른 복붙·즉시 전송 상황에서도 리포트 데이터가 누락되지 않도록 측정 로직을 보강**한 것입니다. 프롬프트 원문은 저장하지 않고, 글자 수·예상 토큰 수·low/medium/high 단계·작성 중 변화량만 저장합니다.

---

## 현재 버전

```txt
manifest version: 2.0.2
version_name: 2.0.2 Submit capture reliability patch
```

## v2.0.2 변경 사항

- 입력 중 측정과 저장을 분리했습니다.
  - 글자 수·토큰 수·최고점은 입력 이벤트마다 즉시 메모리에서 갱신합니다.
  - `chrome.storage.local` 저장은 기본 500ms throttle을 적용합니다.
- 빠른 복붙 후 즉시 전송해도 누락되지 않도록 보강했습니다.
  - `paste` 직후 draft를 강제 저장합니다.
  - Enter 전송과 send button pointerdown/click 시점에 전송 직전 snapshot을 강제 저장합니다.
  - 입력창이 전송 직후 비워진 경우 최근 non-empty snapshot을 fallback으로 사용합니다.
- 최고 글자 수 측정 방식을 전고점 방식으로 정리했습니다.
  - 작성 중 `currentChars > maxChars`이면 즉시 `maxChars`를 갱신합니다.
- 작성 중 큰 삭제 이벤트를 세션 데이터에 추가했습니다.
  - `trimEventCount`, `totalTrimmedDuringDraft`, `largestDropChars`를 저장합니다.
- `manifest.json` 버전을 `2.0.2`로 올렸습니다.

---

## v2.0.1 변경 사항

- `오늘의 유형` 항목을 제거했습니다.
  - 이유: 유형명과 판단 기준이 아직 팀 내부에서 합의되지 않았기 때문입니다.
  - 제거 대상: popup 리포트 UI, `DailyReport.promptingType`, `getPromptingType()` 관련 로직.
- 리포트 데이터 수집 로직은 유지했습니다.
- `manifest.json` 버전을 `2.0.1`로 정리했습니다.
- 팝업 하단의 리포트 섹션은 임시 확인용 UI로 유지했습니다.

---

## 주요 기능

### 1. 입력창 토큰 추정

- ChatGPT / Gemini 입력창의 텍스트를 감지합니다.
- 입력 내용의 글자 수와 예상 토큰 수를 계산합니다.
- 예상 토큰 수 기준으로 `low / medium / high` 단계를 분류합니다.

### 2. 플로팅 배지와 넛지

- ChatGPT / Gemini 입력창 주변에 챗풀 배지를 표시합니다.
- 나무 배지 hover 시 환경 넛지를 표시합니다.
- 프롬프팅 팁은 기존 로컬 규칙 기반 모듈을 유지합니다.
- 프롬프트 팁 고도화는 이번 v2.0.2 작업 범위에 포함하지 않았습니다.

### 3. 리포트용 데이터 수집

리포트에 사용할 수 있도록 아래 이벤트를 로컬에 저장합니다.

| 이벤트 | 의미 |
|---|---|
| `draft_update` | 사용자가 입력 중인 상태를 저장. 기본 throttle은 500ms이며 paste/submit 직전에는 강제 저장 |
| `submit` | 사용자가 실제로 프롬프트를 전송한 상태 저장 |
| `discard` | 사용자가 20자 이상 입력 후 전부 삭제한 상태 저장 |
| `level_change` | low/medium/high 단계 변화 저장 |
| `hover` | 배지 hover 반응 저장 |

### 4. 임시 리포트 UI

팝업 맨 아래에 접었다 펼 수 있는 임시 리포트 영역이 있습니다.

```txt
처음 사용 팁
프롬프트 조언 모음
오늘의 프롬프팅 리포트
```

현재 리포트 UI는 최종 디자인이 아니라, 백로직으로 수집되는 데이터를 확인하기 위한 임시 화면입니다.

---

## 설치 방법

1. ZIP 파일 압축 해제
2. Chrome 주소창에서 `chrome://extensions` 접속
3. 우측 상단 `개발자 모드` 활성화
4. `압축해제된 확장 프로그램을 로드합니다` 클릭
5. 압축 해제한 폴더 선택
6. `https://chatgpt.com/` 또는 `https://gemini.google.com/` 접속

---

## 파일 구조

```txt
assets/
  icon16.png
  icon48.png
  icon128.png

background/
  service-worker.js

content/
  content.js
  nudge-texts.js
  prompt-tips.js

popup/
  popup.html
  popup.css
  popup.js

docs/
  V2_0_REPORT_BACKLOGIC_NOTES.md
  V2_0_REPORT_POPUP_UI_NOTES.md
  V2_0_REPORT_MEASUREMENT_FIX_NOTES.md
  V2_0_1_REPORT_TYPE_REMOVAL_NOTES.md

manifest.json
README.md
```

---

## 백로직 개요

### `content/content.js`

사용자가 실제 ChatGPT/Gemini 페이지에서 입력하는 동안 데이터를 관찰합니다.

담당 역할:

```txt
- 입력창 감지
- 현재 텍스트 추출
- 예상 토큰 계산
- low / medium / high 단계 분류
- draft_update / submit / discard 이벤트 생성
- background service worker로 이벤트 전송
```

### `background/service-worker.js`

수집된 이벤트를 저장하고, 프론트가 바로 사용할 수 있는 리포트 JSON으로 가공합니다.

담당 역할:

```txt
- CHATPOOL_LOG_EVENT 수신
- chatpool.events에 원천 이벤트 저장
- chatpool.daily에 날짜별 집계 저장
- CHATPOOL_GET_DAILY_REPORT 요청 처리
- CHATPOOL_GET_REPORT_DATASETS 요청 처리
```

### `popup/popup.js`

팝업 화면에서 리포트 데이터를 요청하고 임시 UI로 표시합니다.

담당 역할:

```txt
- 사용 팁 accordion 제어
- 프롬프트 팁 모음 표시
- 리포트 accordion 제어
- DailyReport JSON 요청 및 표시
```

---

## 저장 정책

```txt
저장함:
- 글자 수
- 예상 토큰 수
- low / medium / high 단계
- 전송 시각
- 플랫폼: ChatGPT / Gemini / unknown
- 입력 중 최대 길이
- 최종 전송 길이
- 전송 전 줄인 글자 수
- 작성 후 삭제 여부

저장하지 않음:
- 프롬프트 원문
- 답변 원문
- 사용자 계정 정보
- 외부 서버 전송 데이터
```

모든 데이터는 `chrome.storage.local`에 저장됩니다.

---

## 저장소 key

```txt
chatpool.settings
- 확장 프로그램 설정값

chatpool.events
- draft_update / submit / discard / level_change / hover 원천 이벤트

chatpool.daily
- 날짜별 집계 데이터
```

---

## 리포트 데이터 API

### 1. 오늘의 일간 리포트 요청

프론트는 아래 메시지를 보내면 됩니다.

```js
chrome.runtime.sendMessage(
  { type: "CHATPOOL_GET_DAILY_REPORT" },
  (response) => {
    if (!response?.ok) return;
    const report = response.report;
    renderReport(report);
  }
);
```

특정 날짜를 요청할 수도 있습니다.

```js
chrome.runtime.sendMessage(
  {
    type: "CHATPOOL_GET_DAILY_REPORT",
    dateKey: "2026-05-29"
  },
  (response) => {
    if (!response?.ok) return;
    const report = response.report;
    renderReport(report);
  }
);
```

### 2. 기간 데이터셋 요청

주간 리포트나 다운로드 기능을 만들 때 사용합니다.

```js
chrome.runtime.sendMessage(
  {
    type: "CHATPOOL_GET_REPORT_DATASETS",
    fromDateKey: "2026-05-23",
    toDateKey: "2026-05-29"
  },
  (response) => {
    if (!response?.ok) return;
    const datasets = response.datasets;
    renderWeeklyReport(datasets);
  }
);
```

---

## DailyReport 응답 필드

`CHATPOOL_GET_DAILY_REPORT` 요청 시 프론트가 받는 주요 필드입니다.

```json
{
  "dateKey": "2026-05-29",
  "generatedAt": 1770000000000,

  "totalSent": 3,
  "discardCount": 1,
  "draftUpdateCount": 8,
  "levelChangeCount": 4,
  "hoverCount": 2,

  "latestDraftAt": 1770000000000,
  "latestDraftChars": 147,
  "latestDraftTokens": 96,
  "latestDraftLevel": "medium",
  "maxDraftChars": 284,
  "maxDraftTokens": 173,

  "avgInitialChars": 80,
  "avgInitialTokens": 52,
  "avgMaxChars": 170,
  "avgMaxTokens": 108,
  "avgFinalChars": 147,
  "avgFinalTokens": 96,

  "maxChars": 284,
  "maxTokens": 173,

  "lowCount": 2,
  "mediumCount": 1,
  "highCount": 0,

  "lowRatioPct": 67,
  "mediumRatioPct": 33,
  "highRatioPct": 0,
  "efficientFlowPct": 100,
  "highAvoidancePct": 33,

  "avgReducedChars": 23,
  "avgReducedTokens": 12,
  "totalReducedChars": 69,
  "totalReducedTokens": 36,
  "maxReducedChars": 60,
  "maxReducedTokens": 30,
  "trimEventCount": 2,
  "totalTrimmedDuringDraft": 150,
  "avgTrimmedDuringDraft": 50,
  "largestDropChars": 90,

  "highToMediumCount": 1,
  "mediumToLowCount": 0,

  "avgWritingDurationMs": 5000,
  "avgWritingDurationSec": 5,

  "avgDiscardedMaxChars": 120,
  "avgDiscardedMaxTokens": 84,

  "platformCounts": {
    "chatgpt": 2,
    "gemini": 1,
    "unknown": 0
  },
  "discardPlatformCounts": {
    "chatgpt": 1,
    "gemini": 0,
    "unknown": 0
  },
  "draftPlatformCounts": {
    "chatgpt": 6,
    "gemini": 2,
    "unknown": 0
  },

  "diffAvgChars": -23,
  "diffAvgTokens": -12,
  "diffHighRatioPct": -10,

  "message": "어제보다 평균 23자 줄었어요."
}
```

### 프론트에서 우선 사용하면 되는 필드

```txt
totalSent
오늘 전송 횟수

latestDraftTokens
최근 입력 예상 토큰

maxDraftTokens
오늘 작성 중 관측된 최대 예상 토큰

avgFinalChars
전송된 프롬프트의 평균 글자 수

avgFinalTokens
전송된 프롬프트의 평균 예상 토큰

lowRatioPct / mediumRatioPct / highRatioPct
low / medium / high 전송 비율

efficientFlowPct
low + medium 비율

avgReducedChars
전송 전 평균 줄인 글자 수

totalReducedChars
오늘 전체 줄인 글자 수

highToMediumCount
작성 중 high였다가 전송 시 medium으로 줄인 횟수

trimEventCount / totalTrimmedDuringDraft / largestDropChars
작성 중 글자 수가 크게 감소한 이벤트 수, 총 감소량, 가장 큰 감소량

discardCount
작성하다가 전부 지운 횟수

platformCounts
ChatGPT / Gemini별 전송 횟수

message
리포트 한 줄 문구
```

---

## 화면 출력 예시

```txt
오늘 3회 전송했어요.
최근 입력 예상 토큰은 96 tokens예요.
작성 중 최대 토큰은 173 tokens였어요.

평균 입력 길이는 147자, 평균 예상 토큰은 96 tokens예요.

Efficient Flow 100%
Low 67% · Medium 33% · High 0%

전송 전 평균 23자를 줄였고,
high에서 medium으로 줄인 프롬프트가 1개 있었어요.

어제보다 평균 23자 줄었어요.
```

`오늘의 유형`은 v2.0.1에서 제거했습니다.

---

## 기간 데이터셋 응답 구조

`CHATPOOL_GET_REPORT_DATASETS`는 아래 구조를 반환합니다.

```txt
datasets.generatedAt
데이터셋 생성 시각

datasets.range
요청 기간

datasets.dateKeys
기간 내 날짜 목록

datasets.dailyStats
날짜별 원천 집계 데이터

datasets.dailyReports
날짜별 가공 리포트 데이터

datasets.promptEvents
기간 내 전체 원천 이벤트

datasets.submitEvents
전송 이벤트만 필터링한 목록

datasets.discardEvents
작성 후 삭제 이벤트만 필터링한 목록

datasets.draftEvents
입력 중 관측 이벤트만 필터링한 목록

datasets.summary
기간 전체 요약
```

---

## 현재 제외한 항목

아래 항목은 아직 기준이 명확하지 않아 제외했습니다.

```txt
- 오늘의 프롬프팅 유형
- 프롬프트 품질 점수
- 프롬프트 팁 추천 성과 분석
- 주간/월간 Wrapped UI
```

추후 팀 합의 후 다시 추가할 수 있습니다.

---

## 개발 확인 방법

1. 압축 해제 후 Chrome Extension으로 로드
2. ChatGPT 또는 Gemini 접속
3. 입력창에 20자 이상 입력
4. 빠르게 복붙한 뒤 바로 Enter 또는 전송 버튼으로 보내기
5. 팝업 하단 `오늘의 프롬프팅 리포트` 열기
6. `최근 입력 예상 토큰`, `작성 중 최대 토큰` 값 확인
7. 프롬프트 전송
8. `오늘 전송`, `평균 예상 토큰`, `Low/Medium/High 비율` 값 확인

---

## 변경 이력

### v2.0.2

- 빠른 복붙 후 즉시 전송 시 측정 누락 방지
- draft 저장 throttle을 500ms로 조정
- Enter keydown / send button pointerdown 시 전송 직전 snapshot 강제 저장
- 작성 중 최고 글자 수를 입력 이벤트마다 전고점 방식으로 갱신
- 작성 중 큰 삭제 이벤트 데이터 추가
- manifest version을 `2.0.2`로 정리

### v2.0.1

- `오늘의 유형` 제거
- `promptingType` 응답 필드 제거
- 리포트 데이터 수집 로직 유지
- manifest version을 `2.0.1`로 정리
- README를 v2.0.1 기준으로 갱신

### v2.0.0

- 리포트 백로직 최초 도입
- `draft_update`, `submit`, `discard` 기반 데이터 수집 추가
- 일간 리포트 JSON 생성 API 추가
- 팝업 하단 임시 리포트 accordion 추가

### v1.2.x

- ChatGPT/Gemini 입력창 감지
- 예상 토큰 계산
- low / medium / high 상태 표시
- 나무 배지 hover 넛지
- 프롬프트 조언 모음 UI
- 입력 상황 기반 프롬프팅 팁 모듈
