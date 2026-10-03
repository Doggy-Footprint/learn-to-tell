# Personal knowledge map — 로컬 schema와 저장 계약

상태: [PLAN.md](../../PLAN.md)의 설계 제안. 로컬 저장 요구는 확정되어 있다. 아래 파일 구성·필드·정책은 M0–M1에서 승인한 뒤 기계 검증 schema로 옮긴다. 이 문서는 JSON 코드나 구현 파일을 생성하지 않는다.

## 1. 기록의 의미

Map은 ‘이 사람은 무엇을 안다’는 단일 점수 대신 **어떤 상황에서, 어떤 도움으로, 무엇을 해보았는가**를 기록한다. 자기 평가, 화면 열람, 수행 증거, agent 해석을 분리한다. 기록이 없다는 것은 모른다는 뜻이 아니다. 진단 가설과 개인의 전반적 능력을 동일시하지 않는다.

공유 지식 구조인 개념·선수 관계와 개인 기록인 응답·증거·선택을 분리한다. 작업이 바뀌어도 증거의 원래 상황을 보존하고, 다른 상황에 자동 일반화하지 않는다. 원본 대화·작업 파일·세부 커서 이동을 기본 수집하지 않는다.

## 2. 저장 단위 — 제안

사용자가 지정한 저장소 밖 절대 경로를 `knowledge_root`로 사용한다. 이름으로 사용자를 추정하지 않고 불투명한 `profile_id`로 식별한다. 첫 버전은 본인 profile 하나를 활성화하되 결과 파일이 어느 profile에 속하는지는 검사한다.

| 파일·공간 | 역할 | 권위 |
| --- | --- | --- |
| profile별 `knowledge-map.json` | 아래 Root 전체를 담는 현재 snapshot | 성공적으로 저장된 개인 기록의 기준 |
| 직전 유효 snapshot 백업 | 쓰기 실패·손상 복구 | 명시적으로 복구하기 전 현재 상태를 대신하지 않음 |
| 실행별 수업·checkpoint·결과 파일 | 아직 가져오지 않은 응답, 재개 입력, 생성 HTML | 검증·가져오기 전 map에 반영되지 않음 |

첫 버전은 단일 writer인 agent의 기록 계층이 파일 전체를 갱신하는 방식을 제안한다. DB·상주 서버·다중 기기 동기화를 요구하지 않는다. 데이터가 커져 다른 저장 방식이 필요해져도 의미 계약과 식별자를 유지한다. 저장할 원시 응답의 범위와 백업 보존 기간은 M0에서 사용자와 확정한다.

## 3. 공통 자료 규칙

- 식별자는 표시 이름과 분리된 고유 문자열이며 재사용하지 않는다. 정확한 생성 형식은 기계 schema 작성 시 하나로 고정한다.
- 시각은 UTC 기준의 timezone 포함 ISO 8601 문자열이다. 순서는 시계만 믿지 않고 revision·attempt 순번으로 구분한다.
- 버전·revision은 양의 정수다. 내용 revision과 파일 계약 버전을 구분한다.
- 선택 필드의 부재는 모름/미수집을 뜻한다. 0·빈 문자열·성공으로 대신 채우지 않는다.
- 단위·허용 범위·문자열 길이·파일 크기 한도·최대 항목 수는 M1의 기계 schema와 spec에서 고정한다. 한도 초과는 조용한 잘라내기 대신 오류다.
- 지원하지 않는 버전, 중복 키, 깨진 필수 참조, 서로 다른 profile의 기록을 그대로 적용하지 않는다. Concept의 고유 키는 concept_id와 concept_revision의 쌍이며, 다른 객체는 각 객체 ID다.

## 4. Root schema

| 필드 | 형식·필수 여부 | 의미·불변 조건 |
| --- | --- | --- |
| schema_version | 양의 정수, 필수 | 파일 계약 버전; 첫 구현은 1부터 |
| profile_id | ID, 필수 | 결과 파일의 profile과 같아야 함 |
| revision | 양의 정수, 필수 | 성공한 저장마다 증가; 동시 변경 검사 기준 |
| created_at / updated_at | 시각, 필수 | 파일 생성·마지막 성공한 갱신 |
| preferences | 객체, 필수 | 아래 Preference; 미선택 값은 비워 둠 |
| concepts | Concept 목록, 필수 | 버전이 붙은 개념 정의 |
| relations | Relation 목록, 필수 | 선수·관련·세부 개념 관계 |
| sessions | Session 목록, 필수 | 학습 회차와 진단의 맥락 |
| evidence | Evidence 목록, 필수 | 수행·열람·자기 보고의 원본 근거 |
| assessments | Assessment 목록, 필수 | 특정 증거에 대한 해석과 정정 |
| decisions | DecisionRecord 목록, 필수 | 질문·작업 선택·보류 |
| learning_paths | LearningPath 목록, 필수 | 다음 학습 경로와 추천 이유 |
| imports | ImportRecord 목록, 필수 | 중복 처리 방지와 원본 결과 추적 |

개별 개념의 현재 표시 상태는 원본 증거와 유효 Assessment에서 계산한다. 별도 전역 `mastery_score`나 전체 학습 퍼센트를 저장하지 않는다.

### Preference / Concept / Relation

| 객체 | 필드 | 규칙 |
| --- | --- | --- |
| Preference | 언어, 목표 회차 시간, 사용자가 고른 피드백 방식, 원시 응답 저장 선택 | 수행 결과에서 성격·선호를 몰래 추론해 채우지 않음 |
| Concept | concept_id, concept_revision, label, domain, context_definition, aliases, origin | 뜻·범위가 식별 가능해야 함; revision 변경 시 기존 증거 참조를 보존 |
| Relation | relation_id, from 개념·revision, to 개념·revision, type, rationale | type은 prerequisite / related / narrower; 참조가 존재해야 함 |

표시 이름이 같다는 이유로 개념을 합치지 않는다. Alias는 검색·표시 보조이며 동치 증명이 아니다. 다른 수업에서 중복 개념 후보가 생기면 기존 정의를 대조해 동일 revision을 재사용하거나 다른 ID를 만든다. 불확실한 병합은 사용자에게 확인한다. 첫 버전에는 자동 대규모 ontology 병합을 포함하지 않는다.

`prerequisite`는 from이 to보다 먼저 필요한 관계다. 같은 학습 경로 안의 선수 관계 순환은 검증 오류로 본다. `related`에는 순환을 허용한다. 개념 내용이 바뀌었다고 과거 응답을 새 정의에 자동 재채점하지 않는다.

### Session

| 필드 | 의미 |
| --- | --- |
| session_id / artifact_id / artifact_revision | 회차와 실제 자료의 식별; lesson이면 LessonPlan, discovery이면 DiscoveryPacket 참조 |
| kind | discovery / lesson |
| context | 작업/대표 상황 구분, 사용자 확인된 최소 요약, 목표·제약·미정 선택 |
| target_concepts / decision_variable_refs | 이번 회차가 다룬 개념 revision과 결정 변수; 진단 중 미확정이면 비워 둠 |
| started_at / ended_at | 학습 시작과 종료; 미종료는 ended_at 없음 |
| status | in_progress / completed / partial / abandoned |
| artifact_ref | 사용자 지정 root에 상대적인 수업 참조와 자료 식별값; 경로 이탈 금지 |
| continuation | 재개할 활동 ID, checkpoint 식별자, 남은 목표 |

`completed`는 수업 흐름이 끝났다는 뜻이며 이해를 입증했다는 뜻이 아니다. 사용자 답의 검토 상태와 파일 가져오기 여부는 별도 기록이다. 새 대화의 agent는 필요한 세션·개념의 요약만 읽고 세부 증거는 필요할 때 불러온다.

### Evidence

| 필드 | 의미·제약 |
| --- | --- |
| evidence_id / session_id / source_response_id | 근거 식별과 회차·제출 응답 참조; 같은 회차·응답에서 같은 종류의 근거를 중복 생성하지 않음 |
| concept_refs / decision_variable_refs | 연결된 개념 revision과 선택 항목 |
| activity_id / check_id / attempt_index | 어떤 활동의 몇 번째 시도인지; 열람·자기 보고에는 check_id 생략 가능 |
| kind | exposure / self_report / prediction / explanation / transfer / question / decision_reasoning |
| prompt_revision / scenario | 실제 문항 revision과 상황 요약; 답이 같아도 상황이 다르면 구분 |
| response | 실제 응답 또는 사용자 허용 범위의 최소 요약; 생략 시 omitted 이유 표시 |
| observed_inputs / observed_outputs | 필요한 재현 입력과 모델 revision; 값·단위 보존 |
| assistance | none / hint / worked_example / agent_guidance / unknown; 사용한 도움 참조 |
| answer_revealed | 응답 전에 기준 답·해설을 봤는지; 알 수 없으면 unknown |
| self_confidence | 선택적 low / medium / high / unsure; 정답·능력 판정과 분리 |
| capture_method | browser_export / user_report / agent_observation |
| recorded_at / source_result_id | 시각과 가져온 결과 추적 |

열람과 자기 보고만으로 수행을 인정하지 않는다. 예측을 결과 공개 전에 했는지는 순번·기록 상태로 검사한다. 도움 정보가 없으면 ‘도움 없음’으로 처리하지 않는다. 재시도는 원본 Evidence를 덮어쓰지 않고 새 attempt로 기록한다.

### Assessment

| 필드 | 의미·제약 |
| --- | --- |
| assessment_id / evidence_ids | 평가 식별자와 실제 근거 목록 |
| dimension | concept_distinction / prediction_model / transfer / help_seeking / decision_meaning |
| outcome | pending / supported / partial / not_demonstrated / skipped |
| rubric_id / rubric_revision | 어떤 기준으로 검토했는지 |
| evaluator | deterministic_check / agent_review / user_correction; 가능하면 사용된 도구·모델 식별을 덧붙임 |
| rationale / scope | 관찰 근거와 이 해석이 적용되는 상황 |
| misconception_hypothesis | 선택적 오해 후보; 단정적 진단으로 표시하지 않음 |
| assessed_at / supersedes | 평가 시각과 정정 대상; 정정 전 기록 보존 |

`supported`에는 근거·rubric·범위가 필요하다. 자동 계산으로 판단할 수 없는 자유 응답은 agent 검토 전 `pending`이다. 사용자가 이의를 제기하면 원본 응답을 보존하고 정정 평가를 추가한다. Agent 평가도 수정 가능한 해석이다.

### DecisionRecord / LearningPath / ImportRecord

| 객체 | 필드 | 규칙 |
| --- | --- | --- |
| DecisionRecord | decision_id, session_id, task/practice, variable, alternatives, chosen_value 또는 deferred, rationale, assumptions, questions, evidence_refs, user_confirmation | 필요한 정보가 없는 보류는 오답이 아님; 사용자가 확인하지 않은 초안을 실제 선택으로 표시하지 않음 |
| LearningPath | path_id, concept_refs, prerequisite_refs, next_question, reason, evidence_refs, status | reason은 task_need / prerequisite / observed_gap / interest; status는 suggested / selected / deferred / visited; visited는 학습 완료가 아님 |
| ImportRecord | result_id, content_digest, session_id, imported_at, applied_revision | 같은 result_id·같은 내용은 무변경 성공; 같은 ID·다른 내용은 충돌 |

## 5. 표시 상태 계산

| 근거 상태 | 사용자에게 보여줄 의미 |
| --- | --- |
| 관련 근거 없음 | 아직 확인하지 않음 |
| 열람·자기 보고만 있음 | 접했음 / 본인이 안다고 보고함; 수행 미확인 |
| 유효한 supported 있음 | 해당 차원·상황에서 수행 관찰; 도움 수준 병기 |
| partial / not_demonstrated 있음 | 이번 시도에서 일부 수행 / 확인되지 않은 부분 |
| 서로 다른 결과·평가가 공존 | 결과가 엇갈림; 상황·도움·시점별 기록과 재확인 제안 |
| pending만 있음 | 검토 대기 |
| 다른 개념 revision의 기록 | 당시 정의·조건의 기록; 현재 revision의 수행은 미확인 |

제안 규칙: `supersedes`로 정정된 평가를 현재 표시에선 제외하되 이력은 유지한다. 명시적 정정이 아닌 재시도는 이전 근거를 삭제하지 않는다. 동일 차원에서 엇갈린 결과가 있으면 최신 성공 한 번으로 전체를 덮지 않고 양쪽을 요약한다. 이후 재확인도 상황이 맞는지 검토한 뒤 해석한다.

시간 경과로 자동 망각 점수를 계산하거나 임의의 유효기간을 적용하지 않는다. 관찰 시점과 상황을 보여주고 필요할 때 재확인한다. 핵심 목표가 도움을 받아 결정하는 것이므로 모든 차원에서 무도움 수행을 강제하지 않는다.

## 6. 파일 왕복과 저장 실패

1. Skill 시작 시 선택된 profile과 저장 경로를 확인한다. 기록 활용을 원치 않으면 임시 수업은 가능하며 map을 변경하지 않는다.
2. HTML은 결과 또는 부분 checkpoint를 내보낸다. 이때 UI는 ‘내보냄’으로 표시하고 ‘map 저장 완료’라고 표시하지 않는다.
3. Agent의 기록 계층은 파일 크기·버전·profile·참조·결과 ID·내용 식별값을 검사한다. 파일 경로·콘텐츠를 실행 명령으로 취급하지 않는다.
4. 동일 결과의 재가져오기는 중복을 만들지 않는다. 같은 결과 ID의 다른 내용은 오류로 보고 원본을 보존한다. 새 checkpoint는 새로운 결과 ID를 가지며 session_id·source_response_id·근거 종류로 기존 Evidence를 대조한다. 같은 응답 ID의 다른 내용도 충돌이다. 미제출 draft는 증거로 저장하지 않고 재개 파일에만 남긴다. 늦게 도착한 이전 export는 회차의 완료 상태·재개 위치를 과거로 되돌리지 않는다.
5. 기존 map의 예상 revision이 현재 revision과 같은지 확인한다. 다르면 덮어쓰지 않고 다시 읽어 재검토한다.
6. ImportRecord를 포함한 전체 후보 snapshot을 검증하고, 직전 유효본의 백업을 확보한 뒤 같은 파일시스템의 임시 파일에 쓴다. 현재 snapshot의 원자적 교체를 commit 시점으로 삼아 근거와 import 기록을 함께 반영한다. 교체 뒤 성공 응답 전에 중단되면 재시작 시 ImportRecord로 반영 여부를 판별한다.
7. 성공한 경우에만 새 revision·저장 위치·추가된 근거·미검토 항목을 agent가 알려준다. 실패하면 기존 유효 map과 미가져오기 결과를 보존한다.

브라우저가 주장한 profile·정답·완료 상태를 검증 없이 신뢰하지 않는다. 다만 파일 checksum은 변경 감지용이며 사용자 행동의 진위를 인증하지 않는다. 잠금 또는 동시 writer 차단의 구체 수단은 M1에서 정하되, 동시 쓰기로 데이터가 유실되지 않아야 한다.

| 실패 | 관찰 가능한 결과 | 복구 경로 |
| --- | --- | --- |
| 저장 권한 없음·공간 부족 | 실패 표시, revision 증가 없음 | 결과 파일 보존 후 경로·공간을 해결하고 재가져오기 |
| 쓰기 도중 중단 | 기존본 또는 새 유효본 중 하나만 현재본 | 재시작 시 검증; 남은 임시 파일을 현재본으로 자동 채택하지 않음 |
| 현재 map 손상 | 손상 감지; 빈 map으로 덮지 않음 | 백업을 검증하고 사용자에게 복구 대상·손실 범위를 보여준 뒤 복구 |
| 미지원 schema | 적용 안 함 | 원본 보존, 지원 도구 또는 명시적 migration 필요 |
| 잘못된 profile·참조 | 적용 안 함 | 올바른 profile·수업 자료를 선택한 후 다시 시도 |
| 참조 HTML 없음 | 증거는 유지, 재개 불가 표시 | 같은 revision의 자료를 확보하거나 새 회차로 시작 |

Schema migration은 원본·백업을 보존하고 변환 결과를 검증한 뒤 교체한다. 지원하지 않는 미래 버전으로 저장된 파일을 낮은 버전 형식으로 덮어쓰지 않는다. 첫 버전은 과거 제품 버전이 없으므로 migration 실행기를 미리 일반화할 필요는 없지만, 버전 거부·보존 동작은 필요하다.

## 7. 개인정보·정정·삭제

로컬 저장은 암호화와 동의어가 아니다. 클라우드 전송·분석 수집·계정 연동을 첫 버전에 넣지 않는다. Agent 자체가 외부 모델을 사용하는 경우, agent에게 전달한 요약·응답은 그 호스트의 데이터 경로를 따르므로 ‘기기 밖으로 아무것도 나가지 않는다’고 약속하지 않는다.

사용자는 저장 전 작업 요약을 수정하고, 원시 응답 저장 범위를 선택할 수 있어야 한다. 응답을 생략하면 이후 agent의 재검토에 제한이 있음을 표시한다. 민감한 작업 내용을 개념 표시 이름이나 경로에 넣지 않는다.

삭제 범위는 회차·개별 근거·profile 전체로 제안한다. 삭제한 근거를 참조하는 평가·요약·추천을 제거하거나 미확인으로 다시 계산하고, 알려진 백업·checkpoint·내보낸 파일의 해당 데이터도 삭제 대상에 포함한다. 도구가 접근할 수 없는 외부 복사본은 남은 위치와 수동 삭제 필요를 알린다. 개인정보 삭제는 원본 이력 보존보다 우선한다. 일반적인 평가 정정에는 기존 기록을 보존한다.

## 8. M3 검수 기준

- 새 profile, 기존 profile 재시작, 빈 근거, 도움 있는 수행, 자유 응답 검토 대기, 엇갈린 근거를 구분한다.
- 같은 결과 재가져오기, 같은 ID·다른 내용, 동일 회차 checkpoint 반복, revision 충돌에서 중복·유실이 없다.
- 지원하지 않는 버전, 참조 오류, 비정상 입력, profile 불일치에서는 현재 map이 바뀌지 않는다.
- 저장 실패·중단·손상에서 오류와 복구 범위를 알리고, 유효본을 보존한다.
- 개념 revision 변경 시 과거 증거의 의미가 자동 변경되지 않는다.
- 회차·근거·profile 삭제 시 파생 평가·추천·알려진 복사본까지 일관성을 확인한다.
- 다음 agent가 기록에서 ‘도움을 받았음’, ‘아직 확인하지 않음’, ‘사용자가 보류함’을 각각 복원할 수 있다.

이 기준은 데이터 의미와 소프트웨어 동작의 검증이다. 개인의 지식을 정확하게 측정한다는 효과 입증을 뜻하지 않는다.
