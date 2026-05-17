# Chatpull Green v1.2.13 Gemini Support Notes

## 추가된 기능

- ChatGPT뿐 아니라 Gemini 웹앱에서도 content script가 실행되도록 manifest 권한과 matches를 확장했습니다.
- Gemini 입력창 후보를 잡기 위해 `rich-textarea`, contenteditable textbox, aria-label 기반 selector를 추가했습니다.
- send 버튼 click, form submit, Enter 전송 감지를 함께 사용하도록 보강했습니다.

## 지원 범위

- 지원 URL: `https://chatgpt.com/*`, `https://chat.openai.com/*`, `https://gemini.google.com/*`, `https://bard.google.com/*`
- 외부 API 호출 없음
- 입력 텍스트 외부 전송 없음
- 토큰 추정과 프롬프트 팁 분류는 기존처럼 브라우저 로컬에서만 수행

## 한계

- Gemini 웹앱의 DOM은 Google 실험에 따라 바뀔 수 있습니다.
- 입력창이 closed shadow DOM 내부로 이동하면 content script가 직접 접근하지 못할 수 있습니다. 이 경우 selector 추가가 아니라 별도 접근 전략이 필요합니다.
