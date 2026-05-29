# v2.0.1 변경 사항

## 변경 목적

`오늘의 유형`은 현재 기준이 임시적이고 팀 내부 합의가 필요한 항목이므로, 리포트 UI와 DailyReport 응답에서 제거했습니다.

## 반영 내용

- popup 리포트 카드에서 `오늘의 유형` 항목 제거
- background DailyReport에서 `promptingType` 계산 및 반환 제거
- `getPromptingType()` / `getPromptingTypeLabel()` 제거
- manifest version을 `2.0.1`로 변경

## 유지되는 리포트 데이터

- 오늘 전송 횟수
- 작성 후 삭제 횟수
- draft update 횟수
- 최근 입력 글자 수 / 예상 토큰 수 / 단계
- 평균 initial / max / final 글자 수 및 토큰 수
- low / medium / high 개수와 비율
- Efficient Flow 비율
- 평균/전체 reduced chars/tokens
- high → medium, medium → low 전환 횟수
- 평균 작성 시간
- ChatGPT / Gemini / unknown 플랫폼별 집계
- 어제 대비 평균 글자 수 / 평균 토큰 수 / high 비율 변화
- 한 줄 리포트 메시지

## 추후 재도입 기준

`오늘의 유형`은 팀에서 유형명, 계산 기준, 사용자에게 전달할 의미를 합의한 뒤 다시 추가하는 것을 권장합니다.
