# Chatpull Green v1.2.18 Feedback Notes

## 반영 사항

- 프롬프팅 팁 펼침 애니메이션 시간을 `1500ms`로 조정했습니다.
- 프롬프팅 팁은 기존 Chatpull 로고/상태 뱃지 위치를 유지한 채, 뱃지의 왼쪽 방향으로 펼쳐지도록 변경했습니다.
- 입력 중 토큰 수와 상태는 기존처럼 패치 방식으로 갱신하되, 팁 DOM은 같은 팁이 떠 있는 동안 재생성하지 않도록 유지했습니다.
- 왼쪽 가용 공간을 계산해 프롬프팅 팁 탭 폭을 `260px ~ 560px` 범위에서 자동 조정하도록 했습니다.

## 검증

- `content.js` 문법 검사 통과
- `popup.js` 문법 검사 통과
- `prompt-tips.js` 문법 검사 통과
- `nudge-texts.js` 문법 검사 통과
- `service-worker.js` 문법 검사 통과
- `manifest.json` JSON 파싱 통과
