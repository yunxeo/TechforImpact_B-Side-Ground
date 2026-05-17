# Chatpull Green v1.2.13

ChatGPT와 Gemini 입력창 위에서 예상 토큰량과 low / medium / high 상태를 표시하는 Chrome Extension 프로토타입입니다.

## 현재 고정값

- 디자인: 02 Tree Status Badge 고정
- 위치: 왼쪽 rail 우선 고정
- 왼쪽 공간이 부족하면 composer 위쪽 중앙 정렬로 자동 전환
- 플로팅 로고 크기: 90%
- hover/넛지 문구 크기: 90%
- 모델 인식 없음
- 모델 수동 지정 없음
- 배치 방식 선택 없음
- 디자인 선택 없음

## 수정 사항

- 높음 단계 진입 시 entry 넛지가 뜨도록 threshold crossing 감지를 강화했습니다.
- 높음 단계 hover 문구가 뜨도록 hover 이벤트를 유지하고 high.hover fallback을 보강했습니다.
- entry 넛지와 hover 문구 모두 플로팅 로고 바로 위 또는 옆에 우선 표시됩니다.
- 입력창과 겹치는 위치는 사용하지 않습니다.

## 설치

1. ZIP 압축 해제
2. Chrome 주소창에서 `chrome://extensions` 열기
3. 개발자 모드 켜기
4. `압축해제된 확장 프로그램을 로드합니다` 클릭
5. `chatpull-extension-variants` 폴더 선택
6. `https://chatgpt.com/` 또는 `https://gemini.google.com/` 접속


## v1.2.7 변경

- 낮음에서 중간으로 넘어갈 때 entry 넛지가 다시 안정적으로 뜨도록 수정했습니다.
- 낮음/중간/높음 모든 단계에서 hover 문구가 뜨도록 bubble 배치 fallback을 보강했습니다.
- hover/entry 문구가 입력창과 겹치지 않는 위치를 우선 탐색하도록 조정했습니다.

## v1.2.8 변경

- ChatGPT 사이드 패널이 닫힌 상태에서도 플로팅 로고가 화면 밖으로 밀리지 않도록 중앙/상단 fallback을 강화했습니다.
- bubble이 안전 위치를 찾지 못해 숨겨지는 문제를 줄이기 위해 top-center fallback을 추가했습니다.
- 카드 자체 hover 이벤트가 누락되는 경우를 대비해 document-level mousemove hit-test를 추가했습니다.
- 낮음/중간/높음 hover와 중간/높음 진입 넛지가 사이드 패널 열림/닫힘 상태 모두에서 작동하도록 보강했습니다.


## v1.2.9 변경

- 확장 프로그램 업데이트/재로드 후 이전 overlay DOM이 남아 `Cannot read properties of undefined (reading 'host')` 오류가 발생하던 문제를 수정했습니다.
- stale root를 감지하면 제거하고 새 overlay를 생성하도록 변경했습니다.


## v1.2.10 변경

- 플로팅 로고 위에 마우스를 올린 동안 hover 문구가 하나로 고정됩니다.
- 마우스를 플로팅 로고에서 뗀 뒤 다시 올리면 새 랜덤 hover 문구가 표시됩니다.
- mousemove 기반 hover 보강 로직은 유지하되, 같은 hover session에서는 문구를 다시 뽑지 않도록 수정했습니다.


## v1.2.11 변경

- 플로팅 위치 선택 추가: 채팅창 왼쪽 옆, 왼쪽 위, 중앙 위, 오른쪽 위, 오른쪽 옆.
- 선택 위치가 화면에서 안전하지 않으면 중앙 위로 자동 fallback합니다.
- 드래그해서 위치 옮기기 toggle을 추가했습니다.
- 드래그 위치 초기화 버튼을 추가했습니다.
- hover/넛지 bubble은 항상 플로팅 창 바로 위 또는 옆에 붙어다니도록 수정했습니다.


## v1.2.12 변경

- `content/prompt-tips.js`를 추가해 입력 내용 기반 프롬프팅 팁 뱅크를 분리했습니다.
- hover 시 기존 토큰 길이 넛지만 보여주던 방식에서, 입력 유형을 로컬 규칙으로 분류해 관련 프롬프팅 팁을 우선 노출하도록 변경했습니다.
- 코드/오류, 리서치/출처, 요약/정리, 글쓰기, 발표문, 의사결정, 아이디어 기획, 긴 입력 구조화 등 35개 이상 케이스를 감지합니다.
- 약 100개 이상의 팁 문구를 추가했습니다. 같은 문구와 같은 케이스가 연속 반복되지 않도록 최근 노출 이력을 세션 단위로 회전합니다.
- LLM API는 사용하지 않습니다. 입력문은 외부 서버로 보내지 않고 content script 안에서 정규식과 휴리스틱으로만 분류합니다.


## v1.2.13 변경

- `https://gemini.google.com/*`와 구 Bard 경로인 `https://bard.google.com/*`를 content script 주입 대상으로 추가했습니다.
- Gemini의 contenteditable / rich-textarea 계열 입력창을 찾을 수 있도록 입력창 selector와 후보 점수화 로직을 보강했습니다.
- Gemini처럼 form submit 이벤트가 안정적으로 잡히지 않는 화면을 대비해 Enter 전송, send/submit 버튼 click fallback을 추가했습니다.
- popup에 Gemini 열기 버튼을 추가했습니다.
- ChatGPT 전용 문구 일부를 AI 채팅/Gemini 호환 문구로 일반화했습니다.
