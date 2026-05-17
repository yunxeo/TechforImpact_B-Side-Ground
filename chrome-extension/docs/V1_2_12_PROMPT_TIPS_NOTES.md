# Chatpull Green v1.2.12 Prompt Tips Notes

## 추가된 기능

- LLM API 없이 입력 내용을 로컬에서 분류하는 프롬프팅 팁 hover 기능을 추가했습니다.
- 기존 low / medium / high 토큰 상태, entry 넛지, 전송 후 제안, 위치 선택, 드래그 이동 기능은 유지했습니다.

## 주요 파일

- `content/prompt-tips.js`: 프롬프팅 팁 문구 뱅크
- `content/content.js`: 입력 특징 추출, 케이스 분류, 중복 회피, hover 메시지 선택 로직
- `manifest.json`: `content/prompt-tips.js`를 content script 로드 순서에 추가

## 케이스 예시

- 코드/오류: 에러 전문, 실행환경, 기대 동작 요청
- 리서치: 출처 기준, 날짜 기준, 조사 범위 요청
- 요약: 목적, 깊이, 액션아이템 분리 요청
- 글쓰기: 수신자, 톤, 분량, 발표 시간 요청
- 분석/의사결정: 판단 기준, 제약조건, 우선순위 축 요청
- 구조화: 긴 입력을 제목, 번호, 조건, 자료, 요청으로 분리하도록 안내

## 개인정보/외부 API

- 입력 텍스트를 외부 서버로 보내지 않습니다.
- OpenAI/Gemini API를 호출하지 않습니다.
- 문구 추천은 브라우저 안에서 정규식 기반으로만 처리합니다.
