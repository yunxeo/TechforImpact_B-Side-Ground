# v2.0 Report Popup UI Notes

## 변경 목적

팝업 하단에 접이식 프롬프팅 리포트 영역을 추가했습니다.
프론트 최종 디자인이 확정되기 전까지 백로직 데이터가 정상적으로 내려오는지 확인하는 임시 UI입니다.

## 변경 파일

- `popup/popup.html`
- `popup/popup.css`
- `popup/popup.js`
- `manifest.json`

## 동작

1. 팝업 하단의 `오늘의 프롬프팅 리포트` 카드에서 `리포트 열기`를 클릭합니다.
2. `popup.js`가 background service worker에 `CHATPOOL_GET_DAILY_REPORT` 메시지를 보냅니다.
3. background는 `DailyReport` JSON을 반환합니다.
4. popup은 전송 횟수, 평균 글자 수, 평균 예상 토큰, Efficient Flow, low/medium/high 비율, 줄인 글자 수, high→medium 전환 수, 작성 후 삭제 수, 플랫폼 사용량을 표시합니다. `오늘의 유형`은 v2.0.1에서 임시 제거되었습니다.

## 프론트 전달 데이터

프론트는 아래 메시지로 현재 날짜 리포트를 받을 수 있습니다.

```js
chrome.runtime.sendMessage(
  { type: "CHATPOOL_GET_DAILY_REPORT" },
  (response) => {
    if (!response?.ok) return;
    renderReport(response.report);
  }
);
```

주요 필드:

- `totalSent`
- `avgFinalChars`
- `avgFinalTokens`
- `lowRatioPct`
- `mediumRatioPct`
- `highRatioPct`
- `efficientFlowPct`
- `avgReducedChars`
- `totalReducedChars`
- `highToMediumCount`
- `discardCount`
- `platformCounts`
- `message`
