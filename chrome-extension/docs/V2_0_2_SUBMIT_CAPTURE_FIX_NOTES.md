# v2.0.2 Submit Capture Reliability Patch

## 목적

빠르게 프롬프트를 복붙한 뒤 곧바로 Enter 또는 전송 버튼으로 보내는 경우에도 글자 수·예상 토큰 수·최고 글자 수가 누락되지 않도록 측정 로직을 보강했습니다.

## 변경 요약

- 입력 중 측정과 storage 저장을 분리했습니다.
  - 측정: input/key/mutation 이벤트마다 즉시 메모리 갱신
  - 저장: 기본 500ms throttle
  - 전송 직전: throttle 무시 후 강제 저장
- `paste` 직후 draft snapshot을 강제 저장합니다.
- `Enter keydown`, `send button pointerdown/mousedown/click`, `form submit`에서 전송 직전 snapshot을 캡처합니다.
- 입력창이 이미 비워진 경우 최근 non-empty snapshot을 fallback으로 사용합니다.
- `maxChars`는 input 이벤트마다 전고점 방식으로 갱신합니다.
- 작성 중 큰 글자 수 감소를 trim event로 집계합니다.

## 새 세션 필드

```json
{
  "trimEventCount": 2,
  "totalTrimmedDuringDraft": 150,
  "largestDropChars": 90
}
```

## DailyReport 추가 필드

```json
{
  "trimEventCount": 2,
  "totalTrimmedDuringDraft": 150,
  "avgTrimmedDuringDraft": 50,
  "largestDropChars": 90
}
```

## 핵심 원칙

```txt
측정은 실시간
저장은 절약
전송 직전은 무조건 강제 저장
```
