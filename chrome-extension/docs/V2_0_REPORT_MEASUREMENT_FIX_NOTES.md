# v2.0 Report Measurement Fix Notes

## 문제

리포트가 전송된 프롬프트 중심으로만 집계되어, 사용자가 입력 중인 프롬프트의 토큰 변화가 팝업 리포트에 바로 보이지 않았다. 또한 ChatGPT/Gemini에서 Enter 전송 또는 send 버튼 클릭 직후 입력창이 빠르게 비워지면 submit 이벤트가 빈 입력으로 판단되어 저장되지 않을 수 있었다.

## 수정

- `draft_update` 이벤트 추가
  - 입력 중 1.5초 간격, 12자 이상 변화 또는 level 변화 시 저장
  - 원문은 저장하지 않고 글자 수, 예상 토큰, level, session max만 저장
- submit 감지 보강
  - Enter keydown 시 비워지기 전 즉시 저장
  - send 버튼 pointerdown/mousedown/click capture에서 즉시 저장
  - 입력창이 이미 비워진 경우 최근 6초 내 non-empty snapshot으로 fallback
- background 집계 확장
  - `draftUpdateCount`, `latestDraftTokens`, `latestDraftChars`, `maxDraftTokens`, `maxDraftChars` 추가
- popup 임시 리포트에 최근 입력 예상 토큰과 작성 중 최대 토큰 표시

## 프론트에서 확인할 필드

- `report.latestDraftTokens`
- `report.latestDraftChars`
- `report.maxDraftTokens`
- `report.maxDraftChars`
- `report.draftUpdateCount`
- `report.avgFinalTokens`
- `report.totalSent`

## 저장 정책

프롬프트 원문은 저장하지 않는다.
리포트용 정량 데이터만 `chatpool.events`, `chatpool.daily`에 저장한다.
