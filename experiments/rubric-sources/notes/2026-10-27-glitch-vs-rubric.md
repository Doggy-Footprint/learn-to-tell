# glitch 목록과 기준표 후보 대조 (main agent, 2026-10-27)

요청: "이게 다른 서브 에이전트에서 조사한 web HTML에서 생길 수 있는 애니메이션 글리치야. 우리가 조사한 자료와 대조해서 넣어야 할 것들은 넣어줘."

- 대조 대상: `notes/2026-10-27-motion-glitch-list.md`의 장면 결함 77개.
- 비교한 기준표: `drafts/merged.json` 73개와 `drafts/revised.json`의 비판 추가 10개(`origin: critic`).
- 결과: 새 항목 20개를 `drafts/glitch-additions.json`에 썼다. `merged.json`과 같은 필드에 `origin: "glitch-list"`, `glitches`, `evidence_quotes`를 붙였다.
- `merged.json`·`revised.json`·`evidence/items.json`은 바꾸지 않았다.
- 근거 연결은 main agent가 `verified-quotes.md`를 grep한 것이다. `evidence.py`의 propose·verify를 거치지 않았다. 나이 규칙은 수동으로 적용했다(`chang-ungar1993`은 보조 근거만, `heer2007`은 예외).
- glitch 목록의 "측정 자체의 함정" 6개는 장면 결함이 아니라서 기준표에 넣지 않았다. 이것들은 측정 도구 쪽 과제다.

## 대응표

표기: 기존 = 이미 있는 항목이 다룬다. 새 = `glitch-additions.json`에 추가했다. 제외 = 넣지 않았다.

| glitch | 대응 | 항목 |
| --- | --- | --- |
| 단계 간 그림 frame 크기 변화 | 기존 | stable-frame |
| 다시 그릴 때 순간 붕괴 | 새 | no-blank-redraw-frame |
| 조작 요소 위치 이동 | 새 | control-position-stable |
| 스크롤바 출현 폭 변화 | 기존 | stable-frame |
| SVG 비율·잘림 오류 | 기존 | no-overflow-clipping, diagram-dominance |
| 그림이 너무 작음 | 기존 | diagram-dominance |
| 컨테이너 밖 잘림 | 기존 | no-overflow-clipping |
| 겹침 | 기존 | no-text-overlap |
| transform-origin 오류 | 새 | transform-about-own-center |
| 크기 변경에 반응 안 함 | 새 | responsive-reflow |
| 서브픽셀 떨림 | 기존 | element-no-jitter |
| 순간 이동 | 기존 | continuous-motion, object-constancy, entrance-from-origin |
| 중단 후 점프 | 새 | one-action-one-effect |
| 시작 전 역행 깜빡임 | 새 | transition-boundary-continuity |
| 시작 전 끝 상태 깜빡임 | 새 | transition-boundary-continuity |
| 끝에서 튐 | 새 | transition-boundary-continuity |
| 페이드 없는 등장·퇴장 | 기존(등장) + 새(퇴장) | entrance-from-origin, visible-exit |
| 잔상·누적 | 새 | no-stale-duplicates |
| 보간 경로 이상 | 새 | valid-intermediate-states |
| 글자와 그림 비동기 | 새 | label-mark-sync (temporal-contiguity는 설명 글만 다룬다) |
| 의도하지 않은 전환 | 기존 | congruent-motion |
| 부자연스러운 easing | 기존 | eased-motion(revised에서 semantically-appropriate-easing에 합침), no-dead-time-or-filler |
| 너무 빠름 | 기존 | trackable-duration |
| 너무 느림 | 기존 | trackable-duration, no-dead-time-or-filler |
| 애니메이션이 거의 없음 | 기존 | has-mechanism-animation |
| 입력 반응 지연 | 새 | input-response-latency |
| 동시다발 움직임 | 기존 | motion-concurrency |
| 끝없는 반복 | 기존 | learner-pause-replay, loop-reset-distinct |
| 순서 경합 | 기존 | result-hold, read-observe-opportunity |
| 프레임률 의존 속도 | 새 | time-based-animation |
| 백그라운드 정지 후 몰아치기 | 새 | time-based-animation |
| 조작 후 화면 깨짐 | 기존 | no-runtime-errors, control-values-correct |
| 다시 실행 안 됨 | 기존 | control-change-reruns |
| 경로 의존 상태 | 기존 | step-backward-restores-state |
| 빠른 연속 클릭 경합 | 새 | one-action-one-effect |
| 리스너 중복 등록 | 새 | one-action-one-effect |
| 슬라이더 드래그 지연·깜빡임 | 새 | one-action-one-effect |
| transitionend 대기 교착 | 새 | one-action-one-effect |
| 활성 상태 표시 오류 | 기존 | control-names-states, playback-state-coherence |
| 포커스 소실 | 새 | focus-preserved-on-update |
| 조작 요소 가려짐 | 새 | controls-not-covered |
| 다시 시작 시 잔여 | 기존 | step-backward-restores-state, loop-reset-distinct, playback-state-coherence |
| 예측 선택 피드백 누락 | 기존 | predict-feedback-explains |
| 단계 표시와 내용 불일치 | 기존 | playback-state-coherence |
| 화면 밖에서 이미 끝남 | 기존 | animation-starts-when-visible |
| 첫 화면에 그림 없음 | 기존 | diagram-first-screen |
| 조작 결과가 화면 밖 | 기존 | control-diagram-co-visible |
| 스크롤 점프 | 새 | no-unrequested-scroll |
| 숨은 쪽에서 미리 재생 | 기존 + 새 | animation-starts-when-visible, inactive-page-stopped |
| 숨은 상태에서 측정해 크기 0 | 기존 | must-show-present(0 크기), no-text-overlap(원점에 몰림) |
| 쪽 전환 중 두 쪽 공존 | 새 | inactive-page-stopped |
| 불투명도 0 잔류 | 기존 | must-show-present |
| 겹쳐 쌓임 | 기존 + 새 | unobscured-action, controls-not-covered |
| 내부 스크롤 갇힘 | 제외 | glitch 목록 확신 낮음. 결과(카드 스크롤에 가린 내용)는 diagram-first-screen, control-diagram-co-visible이 다룬다 |
| 낮은 대비 | 기존 | text-contrast, graphical-contrast |
| 프레임 드랍(jank) | 새 | smooth-frame-rate |
| 레이아웃 속성 애니메이션 | 새 | smooth-frame-rate |
| 경쟁하는 갱신 루프 | 기존 | element-no-jitter |
| CSS transition과 d3의 이중 적용 | 새 | smooth-frame-rate |
| 타이머·애니메이션 누적 | 기존 + 새 | control-change-reruns, no-stale-duplicates |
| 스타일 늦은 적용(FOUC) | 기존 | self-contained, stable-frame |
| 텍스트·선 흐림 | 제외 | `round-hsh` 장면 264개 중 canvas 사용 0개. SVG 장면에서는 해당이 드물다 |
| 무거운 SVG filter | 새 | smooth-frame-rate |
| 폰트 로딩 reflow | 기존 | self-contained(시스템 폰트), stable-frame |
| 글자 넘침·잘림 | 기존 | no-overflow-clipping |
| 글자 너무 작음 | 기존 | text-size |
| 숫자 폭 떨림 | 새 | stable-numeral-width |
| 텍스트 교체 깜빡임 | 새 | no-blank-redraw-frame |
| 읽기 시간 부족 | 기존 | text-reading-pace |
| 수식·이스케이프 깨짐 | 새 | no-raw-markup |
| reduced-motion 무시 | 기존 | reduced-motion-suppresses-motion |
| 광과민 깜빡임 | 기존 | no-flashing |
| 멈춤 수단 없는 자동 움직임 | 기존 | learner-pause-replay |
| 키보드 조작 불가 | 기존 | keyboard-operable-controls |
| 변화 미고지 | 새 | state-change-announced |
| 색만으로 구분 | 기존 | color-not-sole-cue |
| 확대 시 깨짐 | 새 | responsive-reflow |

집계(77개):
- 기존 항목만으로 다룸: 40개
- 새 항목만으로 다룸: 31개(새 항목 20개)
- 기존 항목과 새 항목이 함께 다룸: 4개
- 제외: 2개

## 새 항목의 근거

| 항목 | 근거 인용 | 수동 근거 수준 | 기준값 |
| --- | --- | --- | --- |
| responsive-reflow | wcag22#3, #5, #6, #8 | strong | 인용 값(200%, 320 CSS px) |
| input-response-latency | nng-usability#7, #8 | strong | 인용 값(0.1초) |
| valid-intermediate-states | heer2007#18 | strong | 없음(정성) |
| visible-exit | carbon-motion#8, heer2007#35, chang-ungar1993#36·#37(보조) | moderate | 후보 |
| label-mark-sync | heer2007#35(부분) | weak | 후보 |
| smooth-frame-rate | apple-hig-motion#18(게임 대상 30–60fps), chang-ungar1993#17·#18(보조) | weak | 후보 |
| no-blank-redraw-frame | chang-ungar1993#19(보조만) | none | 후보 |
| 나머지 13개 | 없음 | none | 후보 |

## 관찰

- input-response-latency의 0.1초는 기존 control-change-reruns의 "200–300ms 안에 다시 실행 시작"과 다르다. 새 항목은 첫 변화가 보이는 시점, 기존 항목은 다시 실행이 시작되는 시점으로 나눠 두었다.
- 새 항목 대부분은 측정에 지금 `measure.mjs`에 없는 표본이 필요하다:
  - `scrollTop`
  - `document.activeElement`
  - `elementFromPoint`
  - rAF 간격과 Long Tasks
  - 반복 조작·빠른 연속 클릭 시나리오
  - CPU throttle 실행
  - viewport 축소 실행
- `round-hsh` 장면 264개 중 10개가 이미 `aria-live`를 쓴다.
