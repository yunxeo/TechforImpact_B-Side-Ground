"use strict";

window.CHATPULL_PROMPT_TIPS = [
  {
    id: "too_short_01", caseId: "too_short", category: "input_quality", level: ["low", "medium"],
    text: "목적을 한 줄만 더 적으면 AI가 덜 추측해서 답변을 다시 받을 가능성을 줄일 수 있어요."
  },
  { id: "too_short_02", caseId: "too_short", category: "input_quality", level: ["low", "medium"], text: "지금 질문에 배경을 조금 붙이면 더 정확한 답을 한 번에 받을 수 있어요." },
  { id: "too_short_03", caseId: "too_short", category: "input_quality", level: ["low", "medium"], text: "짧은 질문은 편하지만, 원하는 결과를 함께 쓰면 불필요한 왕복을 줄이는 데 도움이 돼요." },
  { id: "too_short_04", caseId: "too_short", category: "input_quality", level: ["low"], text: "질문이 짧을수록 AI가 빈칸을 추측해요. 상황을 한 문장만 더 붙여보세요." },

  { id: "too_vague_01", caseId: "too_vague", category: "input_quality", level: ["low", "medium", "high"], text: "‘좋게’보다 ‘친근하게’, ‘전문적으로’, ‘짧게’처럼 기준을 주면 답변이 더 바로 맞춰져요." },
  { id: "too_vague_02", caseId: "too_vague", category: "input_quality", level: ["low", "medium", "high"], text: "모호한 표현을 줄이면 AI가 여러 방향으로 추측하지 않아 토큰 낭비를 줄일 수 있어요." },
  { id: "too_vague_03", caseId: "too_vague", category: "input_quality", level: ["low", "medium", "high"], text: "원하는 스타일을 구체화하면 다시 고쳐달라고 할 가능성이 줄어들어요." },
  { id: "too_vague_04", caseId: "too_vague", category: "input_quality", level: ["medium", "high"], text: "‘알아서’ 대신 판단 기준을 넣으면 AI가 덜 헤매고 답변도 짧아질 수 있어요." },

  { id: "no_goal_01", caseId: "no_goal", category: "input_quality", level: ["low", "medium", "high"], text: "이 답변을 어디에 쓸지 적으면 AI가 필요한 정보만 골라낼 수 있어요." },
  { id: "no_goal_02", caseId: "no_goal", category: "input_quality", level: ["low", "medium", "high"], text: "목적을 알려주면 불필요한 설명이 줄고 답변이 더 짧고 정확해질 수 있어요." },
  { id: "no_goal_03", caseId: "no_goal", category: "input_quality", level: ["low", "medium", "high"], text: "과제용인지, 발표용인지, 개발용인지 적으면 결과물이 더 바로 쓸 수 있게 나와요." },

  { id: "missing_context_01", caseId: "missing_context", category: "input_quality", level: ["low", "medium", "high"], text: "‘이거’가 무엇을 가리키는지 한 번 더 써주면 AI가 덜 헷갈려요." },
  { id: "missing_context_02", caseId: "missing_context", category: "input_quality", level: ["low", "medium", "high"], text: "맥락을 짧게 붙이면 잘못 이해한 답변을 다시 생성할 가능성을 줄일 수 있어요." },
  { id: "missing_context_03", caseId: "missing_context", category: "input_quality", level: ["medium", "high"], text: "앞선 대화에 의존하는 표현을 줄이면 한 번에 맞는 답을 받을 확률이 올라가요." },

  { id: "no_format_01", caseId: "no_format", category: "format", level: ["low", "medium", "high"], text: "표, 목록, 문단 중 원하는 형식을 정하면 다시 정리해달라고 할 가능성을 줄일 수 있어요." },
  { id: "no_format_02", caseId: "no_format", category: "format", level: ["low", "medium", "high"], text: "출력 형식을 먼저 쓰면 AI가 덜 장황해지고 필요한 정보만 정리하기 쉬워요." },
  { id: "no_format_03", caseId: "no_format", category: "format", level: ["medium", "high"], text: "원하는 형태를 지정하면 답변 재생성을 줄여 토큰 사용을 아낄 수 있어요." },
  { id: "no_format_04", caseId: "no_format", category: "format", level: ["low", "medium"], text: "예: ‘표로’, ‘3단계로’, ‘핵심 bullet 5개로’처럼 쓰면 결과가 더 안정돼요." },

  { id: "no_length_01", caseId: "no_length", category: "format", level: ["low", "medium", "high"], text: "분량을 정하면 너무 길거나 짧은 답변을 다시 고칠 가능성이 줄어들어요." },
  { id: "no_length_02", caseId: "no_length", category: "format", level: ["low", "medium", "high"], text: "예: ‘500자’, ‘3문단’, ‘표 5행’처럼 적으면 결과물이 더 안정적이에요." },
  { id: "no_length_03", caseId: "no_length", category: "format", level: ["medium", "high"], text: "길이를 지정하면 불필요한 출력이 줄어 환경 부담을 낮추는 데 도움이 될 수 있어요." },

  { id: "no_tone_01", caseId: "no_tone", category: "writing", level: ["low", "medium", "high"], text: "톤을 먼저 정하면 같은 답변을 여러 번 고쳐달라고 할 가능성이 줄어들어요." },
  { id: "no_tone_02", caseId: "no_tone", category: "writing", level: ["low", "medium", "high"], text: "예: ‘친근하지만 가볍지 않게’처럼 쓰면 문장 방향이 더 정확해져요." },
  { id: "no_tone_03", caseId: "no_tone", category: "writing", level: ["medium", "high"], text: "말투 기준을 주면 AI가 덜 추측해서 더 적은 왕복으로 결과를 만들 수 있어요." },

  { id: "no_audience_01", caseId: "no_audience", category: "writing", level: ["low", "medium", "high"], text: "누가 읽는지 알려주면 설명 난이도와 표현이 더 잘 맞춰져요." },
  { id: "no_audience_02", caseId: "no_audience", category: "writing", level: ["low", "medium", "high"], text: "대상을 지정하면 불필요한 배경 설명을 줄일 수 있어요." },
  { id: "no_audience_03", caseId: "no_audience", category: "writing", level: ["low", "medium"], text: "교수님, 팀원, 일반 사용자처럼 독자를 쓰면 답변 품질이 안정돼요." },

  { id: "research_no_scope_01", caseId: "research_no_scope", category: "research", level: ["low", "medium", "high"], text: "조사 범위를 정하면 너무 넓은 답변을 줄이고 필요한 정보만 받을 수 있어요." },
  { id: "research_no_scope_02", caseId: "research_no_scope", category: "research", level: ["low", "medium", "high"], text: "국가, 기간, 산업, 사용자군 중 하나만 추가해도 답변이 훨씬 선명해져요." },
  { id: "research_no_scope_03", caseId: "research_no_scope", category: "research", level: ["medium", "high"], text: "범위를 좁히면 재검색과 재질문을 줄이는 데 도움이 돼요." },

  { id: "research_no_source_01", caseId: "research_no_source", category: "research", level: ["low", "medium", "high"], text: "공식 자료, 논문, 뉴스 중 어떤 출처를 우선할지 적으면 신뢰도가 올라가요." },
  { id: "research_no_source_02", caseId: "research_no_source", category: "research", level: ["low", "medium", "high"], text: "출처 기준을 먼저 정하면 나중에 ‘근거 더 줘’라고 다시 묻는 일을 줄일 수 있어요." },
  { id: "research_no_source_03", caseId: "research_no_source", category: "research", level: ["medium", "high"], text: "정부·학술·기업 자료처럼 우선순위를 지정하면 답변이 더 탄탄해져요." },
  { id: "research_no_source_04", caseId: "research_no_source", category: "research", level: ["low", "medium"], text: "블로그보다 1차 자료를 우선해달라고 쓰면 답변의 근거가 더 단단해져요." },

  { id: "research_no_date_01", caseId: "research_no_date", category: "research", level: ["low", "medium", "high"], text: "‘최신’은 기준일이 중요해요. 오늘 기준인지, 최근 1년인지 적어보세요." },
  { id: "research_no_date_02", caseId: "research_no_date", category: "research", level: ["low", "medium", "high"], text: "기간을 지정하면 오래된 자료와 최신 자료가 섞이는 문제를 줄일 수 있어요." },
  { id: "research_no_date_03", caseId: "research_no_date", category: "research", level: ["medium", "high"], text: "날짜 범위를 쓰면 AI가 더 정확한 자료를 찾도록 유도할 수 있어요." },

  { id: "compare_no_criteria_01", caseId: "compare_no_criteria", category: "analysis", level: ["low", "medium", "high"], text: "비교 기준을 정하면 단순 나열보다 바로 판단 가능한 답변을 받을 수 있어요." },
  { id: "compare_no_criteria_02", caseId: "compare_no_criteria", category: "analysis", level: ["low", "medium", "high"], text: "가격, 난이도, 효과, 구현성처럼 비교 축을 주면 답변이 덜 흐려져요." },
  { id: "compare_no_criteria_03", caseId: "compare_no_criteria", category: "analysis", level: ["medium", "high"], text: "판단 기준을 먼저 쓰면 추가 질문 없이 선택에 가까운 답을 받을 수 있어요." },

  { id: "citation_needed_01", caseId: "citation_needed", category: "research", level: ["low", "medium", "high"], text: "과제나 발표용이면 인용 형식을 미리 말하면 나중에 정리 시간을 줄일 수 있어요." },
  { id: "citation_needed_02", caseId: "citation_needed", category: "research", level: ["low", "medium", "high"], text: "APA, MLA, 링크 중심 등 원하는 출처 표시 방식을 지정해보세요." },
  { id: "citation_needed_03", caseId: "citation_needed", category: "research", level: ["medium", "high"], text: "출처 형식을 정하면 다시 편집하는 데 드는 토큰과 시간을 줄일 수 있어요." },

  { id: "summary_no_depth_01", caseId: "summary_no_depth", category: "summary", level: ["low", "medium", "high"], text: "짧은 요약인지, 시험공부용 자세한 요약인지 먼저 정하면 좋아요." },
  { id: "summary_no_depth_02", caseId: "summary_no_depth", category: "summary", level: ["low", "medium", "high"], text: "요약 깊이를 지정하면 너무 얕거나 긴 답변을 다시 받을 가능성이 줄어들어요." },
  { id: "summary_no_depth_03", caseId: "summary_no_depth", category: "summary", level: ["low", "medium"], text: "한 줄 요약, 핵심 bullet, 상세 정리 중 원하는 레벨을 골라보세요." },

  { id: "summary_no_purpose_01", caseId: "summary_no_purpose", category: "summary", level: ["low", "medium", "high"], text: "요약을 어디에 쓸지 적으면 필요한 내용만 남길 수 있어요." },
  { id: "summary_no_purpose_02", caseId: "summary_no_purpose", category: "summary", level: ["low", "medium", "high"], text: "회의 공유용, 시험 대비용, 발표 대본용인지에 따라 요약 방식이 달라져요." },
  { id: "summary_no_purpose_03", caseId: "summary_no_purpose", category: "summary", level: ["medium", "high"], text: "사용 목적을 주면 불필요한 설명을 줄여 답변이 더 압축돼요." },

  { id: "summary_need_action_01", caseId: "summary_need_action", category: "summary", level: ["low", "medium", "high"], text: "회의 내용은 ‘결정사항’과 ‘할 일’을 나눠달라고 하면 바로 쓰기 좋아요." },
  { id: "summary_need_action_02", caseId: "summary_need_action", category: "summary", level: ["low", "medium", "high"], text: "액션아이템 담당자와 마감일을 따로 뽑아달라고 하면 정리 왕복이 줄어요." },
  { id: "summary_need_action_03", caseId: "summary_need_action", category: "summary", level: ["medium", "high"], text: "회의록은 요약보다 다음 행동이 중요하니, 할 일 중심으로 요청해보세요." },

  { id: "summary_exam_01", caseId: "summary_exam", category: "study", level: ["low", "medium", "high"], text: "시험 대비라면 ‘정의, 비교, 예시, 암기 포인트’로 나눠달라고 해보세요." },
  { id: "summary_exam_02", caseId: "summary_exam", category: "study", level: ["low", "medium", "high"], text: "개념 공부용이면 흐름도와 핵심 용어를 함께 요청하면 좋아요." },
  { id: "summary_exam_03", caseId: "summary_exam", category: "study", level: ["medium", "high"], text: "암기용인지 이해용인지 구분하면 답변이 더 정확해져요." },

  { id: "code_error_only_01", caseId: "code_error_only", category: "code", level: ["low", "medium", "high"], text: "에러만 붙이면 원인 추측이 많아져요. 기대 동작도 함께 적어보세요." },
  { id: "code_error_only_02", caseId: "code_error_only", category: "code", level: ["low", "medium", "high"], text: "실행환경과 에러 전문을 함께 주면 디버깅 왕복을 줄일 수 있어요." },
  { id: "code_error_only_03", caseId: "code_error_only", category: "code", level: ["low", "medium", "high"], text: "어떤 버튼을 눌렀을 때 문제가 생기는지 쓰면 원인 파악이 빨라져요." },

  { id: "code_version_missing_01", caseId: "code_version_missing", category: "code", level: ["low", "medium", "high"], text: "프레임워크 버전을 쓰면 잘못된 문법을 받을 가능성이 줄어들어요." },
  { id: "code_version_missing_02", caseId: "code_version_missing", category: "code", level: ["low", "medium", "high"], text: "React, Vite, Android, Chrome Extension은 버전에 따라 답이 달라질 수 있어요." },
  { id: "code_version_missing_03", caseId: "code_version_missing", category: "code", level: ["medium", "high"], text: "버전을 적으면 재수정 요청을 줄여 토큰 사용을 줄이는 데 도움이 돼요." },

  { id: "code_no_file_context_01", caseId: "code_no_file_context", category: "code", level: ["low", "medium", "high"], text: "파일 구조를 함께 주면 어디를 고쳐야 할지 더 정확해져요." },
  { id: "code_no_file_context_02", caseId: "code_no_file_context", category: "code", level: ["low", "medium", "high"], text: "관련 파일명을 적으면 AI가 새 파일을 과하게 만들 가능성을 줄일 수 있어요." },
  { id: "code_no_file_context_03", caseId: "code_no_file_context", category: "code", level: ["medium", "high"], text: "수정 범위를 정하면 기존 코드를 덜 망가뜨리는 답변을 받을 수 있어요." },

  { id: "code_ui_request_01", caseId: "code_ui_request", category: "code", level: ["low", "medium", "high"], text: "UI 요청은 위치, 상태, hover, 클릭 동작을 함께 쓰면 구현이 안정돼요." },
  { id: "code_ui_request_02", caseId: "code_ui_request", category: "code", level: ["low", "medium", "high"], text: "보이는 모습뿐 아니라 사용자가 무엇을 하면 바뀌는지도 적어보세요." },
  { id: "code_ui_request_03", caseId: "code_ui_request", category: "code", level: ["medium", "high"], text: "상호작용 조건을 명확히 하면 다시 수정하는 횟수를 줄일 수 있어요." },

  { id: "code_refactor_01", caseId: "code_refactor", category: "code", level: ["low", "medium", "high"], text: "리팩토링할 때는 ‘기능은 유지’라고 명시하면 안전해요." },
  { id: "code_refactor_02", caseId: "code_refactor", category: "code", level: ["low", "medium", "high"], text: "변경 금지 파일과 수정 가능 파일을 나누면 코드가 덜 흔들려요." },
  { id: "code_refactor_03", caseId: "code_refactor", category: "code", level: ["medium", "high"], text: "DRY 원칙을 요청할 땐 공통 CSS, 공통 컴포넌트 분리 기준도 함께 적어보세요." },

  { id: "code_large_task_01", caseId: "code_large_task", category: "code", level: ["medium", "high"], text: "앱 전체 구현은 한 번에 시키기보다 1단계부터 나누면 실패 확률이 줄어요." },
  { id: "code_large_task_02", caseId: "code_large_task", category: "code", level: ["medium", "high"], text: "큰 개발 요청은 화면, 데이터, 로직, 테스트 순서로 나누면 좋아요." },
  { id: "code_large_task_03", caseId: "code_large_task", category: "code", level: ["medium", "high"], text: "단계별 구현을 요청하면 불필요한 재생성과 코드 충돌을 줄일 수 있어요." },

  { id: "writing_no_recipient_01", caseId: "writing_no_recipient", category: "writing", level: ["low", "medium", "high"], text: "받는 사람이 누구인지 쓰면 문장 톤이 훨씬 자연스러워져요." },
  { id: "writing_no_recipient_02", caseId: "writing_no_recipient", category: "writing", level: ["low", "medium", "high"], text: "교수님, 팀원, 친구, 고객 중 누구에게 보내는지 먼저 적어보세요." },
  { id: "writing_no_recipient_03", caseId: "writing_no_recipient", category: "writing", level: ["medium", "high"], text: "수신자를 지정하면 다시 말투를 고치는 시간을 줄일 수 있어요." },

  { id: "writing_sensitive_01", caseId: "writing_sensitive", category: "writing", level: ["low", "medium", "high"], text: "부탁이나 거절 문장은 관계와 목적을 알려주면 더 안전하게 나와요." },
  { id: "writing_sensitive_02", caseId: "writing_sensitive", category: "writing", level: ["low", "medium", "high"], text: "상대와의 친밀도를 적으면 과하거나 차가운 표현을 줄일 수 있어요." },
  { id: "writing_sensitive_03", caseId: "writing_sensitive", category: "writing", level: ["medium", "high"], text: "민감한 메시지는 원하는 인상까지 적으면 수정 횟수가 줄어들어요." },

  { id: "writing_presentation_01", caseId: "writing_presentation", category: "writing", level: ["low", "medium", "high"], text: "발표문은 발표 시간을 쓰면 말 속도에 맞는 분량으로 조절하기 쉬워요." },
  { id: "writing_presentation_02", caseId: "writing_presentation", category: "writing", level: ["low", "medium", "high"], text: "1분 발표인지 5분 발표인지 적으면 답변 길이가 더 정확해져요." },
  { id: "writing_presentation_03", caseId: "writing_presentation", category: "writing", level: ["medium", "high"], text: "청중 수준을 지정하면 어려운 설명과 쉬운 설명 사이에서 덜 흔들려요." },

  { id: "writing_academic_01", caseId: "writing_academic", category: "writing", level: ["low", "medium", "high"], text: "과제 글은 문체, 분량, 인용 필요 여부를 함께 쓰면 좋아요." },
  { id: "writing_academic_02", caseId: "writing_academic", category: "writing", level: ["low", "medium", "high"], text: "학술적이되 너무 딱딱하지 않게 같은 조건을 주면 문장 톤이 안정돼요." },
  { id: "writing_academic_03", caseId: "writing_academic", category: "writing", level: ["medium", "high"], text: "평가 기준을 알려주면 AI가 더 중요한 부분에 토큰을 쓰게 할 수 있어요." },

  { id: "writing_marketing_01", caseId: "writing_marketing", category: "writing", level: ["low", "medium", "high"], text: "홍보 문구는 타깃과 행동 유도를 적어야 덜 평범하게 나와요." },
  { id: "writing_marketing_02", caseId: "writing_marketing", category: "writing", level: ["low", "medium", "high"], text: "카피를 만들 땐 짧은지, 설득적인지, 브랜드다운지 기준을 먼저 주세요." },
  { id: "writing_marketing_03", caseId: "writing_marketing", category: "writing", level: ["medium", "high"], text: "타깃을 쓰면 비슷한 문구 반복을 줄이고 더 쓸 만한 후보를 받을 수 있어요." },

  { id: "writing_variants_01", caseId: "writing_variants", category: "writing", level: ["low", "medium", "high"], text: "시안을 원할 땐 개수와 평가 기준을 함께 적으면 고르기 쉬워져요." },
  { id: "writing_variants_02", caseId: "writing_variants", category: "writing", level: ["low", "medium", "high"], text: "예: ‘20개, 짧고 세련된 톤, 대학생 대상’처럼 요청해보세요." },
  { id: "writing_variants_03", caseId: "writing_variants", category: "writing", level: ["medium", "high"], text: "후보 생성은 기준을 먼저 주면 비슷한 문구 반복을 줄일 수 있어요." },

  { id: "decision_no_criteria_01", caseId: "decision_no_criteria", category: "analysis", level: ["low", "medium", "high"], text: "선택을 맡길 땐 판단 기준을 주면 답이 덜 뭉개져요." },
  { id: "decision_no_criteria_02", caseId: "decision_no_criteria", category: "analysis", level: ["low", "medium", "high"], text: "실사용성, 구현 난이도, 발표 임팩트처럼 기준을 정해보세요." },
  { id: "decision_no_criteria_03", caseId: "decision_no_criteria", category: "analysis", level: ["medium", "high"], text: "기준 없이 고르면 취향 답변이 되기 쉬워요. 우선순위를 같이 적어보세요." },

  { id: "strategy_no_constraint_01", caseId: "strategy_no_constraint", category: "analysis", level: ["low", "medium", "high"], text: "계획 요청에는 기간, 예산, 인원, 실력 수준을 넣으면 현실성이 올라가요." },
  { id: "strategy_no_constraint_02", caseId: "strategy_no_constraint", category: "analysis", level: ["low", "medium", "high"], text: "제약조건을 쓰면 실행 불가능한 조언을 줄일 수 있어요." },
  { id: "strategy_no_constraint_03", caseId: "strategy_no_constraint", category: "analysis", level: ["medium", "high"], text: "팀 역량과 마감일을 적으면 더 바로 실행 가능한 계획이 나와요." },

  { id: "idea_no_user_01", caseId: "idea_no_user", category: "analysis", level: ["low", "medium", "high"], text: "아이디어를 구체화할 땐 사용자가 누구인지 먼저 정하면 좋아요." },
  { id: "idea_no_user_02", caseId: "idea_no_user", category: "analysis", level: ["low", "medium", "high"], text: "문제 상황, 사용자, 사용 순간을 쓰면 솔루션이 더 선명해져요." },
  { id: "idea_no_user_03", caseId: "idea_no_user", category: "analysis", level: ["medium", "high"], text: "사용자 맥락을 넣으면 뜬구름 잡는 답변을 줄일 수 있어요." },

  { id: "problem_weak_01", caseId: "problem_weak", category: "analysis", level: ["low", "medium", "high"], text: "문제정의는 ‘누가, 언제, 왜 불편한가’를 쓰면 강해져요." },
  { id: "problem_weak_02", caseId: "problem_weak", category: "analysis", level: ["low", "medium", "high"], text: "실제 관찰이나 인터뷰 근거를 붙이면 설득력이 올라가요." },
  { id: "problem_weak_03", caseId: "problem_weak", category: "analysis", level: ["medium", "high"], text: "문제가 약해 보이면 빈도, 강도, 대체재의 한계를 함께 적어보세요." },

  { id: "priority_request_01", caseId: "priority_request", category: "analysis", level: ["low", "medium", "high"], text: "우선순위는 영향도와 난이도를 함께 비교하면 더 잘 정해져요." },
  { id: "priority_request_02", caseId: "priority_request", category: "analysis", level: ["low", "medium", "high"], text: "먼저 할 일을 고를 땐 ‘효과 큼 + 구현 쉬움’부터 보라고 요청해보세요." },
  { id: "priority_request_03", caseId: "priority_request", category: "analysis", level: ["medium", "high"], text: "기준 없는 우선순위 요청은 답이 흐려질 수 있어요. 축을 정해보세요." },

  { id: "ask_for_template_01", caseId: "ask_for_template", category: "meta_prompt", level: ["low", "medium", "high"], text: "반복해서 쓸 일이라면 이번엔 답변보다 프롬프트 템플릿을 요청해보세요." },
  { id: "ask_for_template_02", caseId: "ask_for_template", category: "meta_prompt", level: ["low", "medium", "high"], text: "자주 하는 작업은 템플릿으로 만들면 매번 긴 설명을 줄일 수 있어요." },
  { id: "ask_for_template_03", caseId: "ask_for_template", category: "meta_prompt", level: ["medium", "high"], text: "좋은 프롬프트 하나를 저장해두면 재질문과 토큰 사용을 줄이는 데 도움이 돼요." },

  { id: "ask_for_questions_first_01", caseId: "ask_for_questions_first", category: "meta_prompt", level: ["low", "medium", "high"], text: "조건이 많다면 ‘부족한 정보부터 질문해줘’라고 쓰면 정확도가 올라가요." },
  { id: "ask_for_questions_first_02", caseId: "ask_for_questions_first", category: "meta_prompt", level: ["low", "medium", "high"], text: "애매한 요청은 바로 답변보다 확인 질문을 먼저 받는 게 효율적일 수 있어요." },
  { id: "ask_for_questions_first_03", caseId: "ask_for_questions_first", category: "meta_prompt", level: ["medium", "high"], text: "처음부터 필요한 정보를 묻게 하면 잘못된 답변 재생성을 줄일 수 있어요." },

  { id: "ask_for_checklist_01", caseId: "ask_for_checklist", category: "meta_prompt", level: ["low", "medium", "high"], text: "검토 요청은 체크리스트 형식으로 받으면 빠진 부분을 찾기 쉬워요." },
  { id: "ask_for_checklist_02", caseId: "ask_for_checklist", category: "meta_prompt", level: ["low", "medium", "high"], text: "평가 기준표를 요청하면 주관적인 피드백을 줄일 수 있어요." },
  { id: "ask_for_checklist_03", caseId: "ask_for_checklist", category: "meta_prompt", level: ["medium", "high"], text: "체크리스트를 쓰면 같은 내용을 다시 물어보는 일을 줄일 수 있어요." },

  { id: "split_complex_prompt_01", caseId: "split_complex_prompt", category: "structure", level: ["medium", "high"], text: "요청이 여러 개 섞이면 답변이 흐려질 수 있어요. 작업을 순서대로 나눠보세요." },
  { id: "split_complex_prompt_02", caseId: "split_complex_prompt", category: "structure", level: ["medium", "high"], text: "긴 요청은 ‘1단계, 2단계, 최종 산출물’로 나누면 재생성을 줄일 수 있어요." },
  { id: "split_complex_prompt_03", caseId: "split_complex_prompt", category: "structure", level: ["medium", "high"], text: "여러 질문을 한 번에 던질 땐 우선순위를 적으면 답변이 더 안정돼요." },

  { id: "long_unstructured_01", caseId: "long_unstructured", category: "structure", level: ["medium", "high"], text: "긴 입력은 제목과 번호를 붙이면 AI가 구조를 더 잘 따라가요." },
  { id: "long_unstructured_02", caseId: "long_unstructured", category: "structure", level: ["medium", "high"], text: "문단을 나누면 AI가 핵심을 놓칠 가능성을 줄일 수 있어요." },
  { id: "long_unstructured_03", caseId: "long_unstructured", category: "structure", level: ["high"], text: "입력이 길수록 구조가 중요해요. 조건, 자료, 요청을 분리해보세요." },

  { id: "general_good_01", caseId: "general_good", category: "general", level: ["low"], text: "지금 길이는 부담이 적어요. 필요한 조건만 살짝 더하면 답변 품질이 더 좋아질 수 있어요." },
  { id: "general_good_02", caseId: "general_good", category: "general", level: ["low"], text: "짧고 명확한 요청은 AI가 핵심을 잡기 좋아요. 출력 형식만 붙이면 더 안정적이에요." },
  { id: "general_medium_01", caseId: "general_medium", category: "general", level: ["medium"], text: "지금 입력은 충분히 구체적일 수 있어요. 핵심 조건만 위쪽에 모아두면 더 읽기 쉬워요." },
  { id: "general_high_01", caseId: "general_high", category: "general", level: ["high"], text: "긴 입력은 먼저 요약 목표를 적어두면 AI가 중요한 부분을 덜 놓쳐요." }
];
