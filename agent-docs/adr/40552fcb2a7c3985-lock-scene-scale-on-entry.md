# 장면 배율을 진입 시 모든 상태를 미리 그려 정한다

Status: Accepted

## Context
장면 배율은 `fit`이 내용 높이로 정한다. predict 정답 공개, stepper 단계 전환, summary 답 보기는 장면 높이를 바꾼다. 상태가 바뀔 때마다 fit하면 공개·전환 순간에 배율과 자막 칸 위치가 바뀐다(c217c45 이전 동작).

## Decision
- 장면 진입 시와 창 크기 키(`innerWidth x innerHeight + fonts.status`)가 바뀔 때, 가능한 상태를 화면 밖에서 모두 그려 최소 배율을 고정한다.
  - predict: 선택지마다 정답 상태를 그려 `ctx.zmax`를 정한다.
  - stepper: 모든 단계 `enter`를 돌려 그림 최대 높이와 자막 위치(옆/아래)를 정한다.
- 미리 그리기는 `LTT.measure` 안에서 돌아 kit `send` 연출을 생략하고, `.dk-still`로 CSS transition을 꺼 끝 크기로 잰다. 끝나면 현재 상태를 다시 그린다.
- summary recall 답은 `visibility:hidden`으로 자리를 유지한다.
- 작가 계약: `enter`·`answerVisual`은 멱등, 크기를 바꾸는 그리기는 동기(API.md).

## Alternatives
- 상태 변화마다 다시 fit하고 커지는 쪽으로만 갱신(ratchet): 처음 커질 때 한 번은 배율이 바뀐다. 비동기 그리기 보조 경로로만 남김.
- 단계별 프레임을 한 grid 칸에 겹쳐 CSS가 최대 높이를 정함(안 B): 새 단계 API, SVG id 충돌, 단계 사이 모핑 상실. 보류(handoff e72bbfb2418e2e6d).

## Consequences
- 긍정: 갤러리 11개 페이지 × 폭 1400/1000/760에서 predict 공개 30건, stepper 전환 18건, recall 공개 30건의 배율이 바뀌지 않는다.
- 부정: 해설·답이 긴 장면은 공개 전에도 작게 보인다. `setTimeout`·d3 transition으로 크기를 바꾸는 그리기는 측정에서 빠진다.
