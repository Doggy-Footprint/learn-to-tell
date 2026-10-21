# 측정 모드에서 동기로 도는 지연 그리기 API `LTT.later`

## Context
장면 배율은 진입 때 측정 모드에서 상태를 미리 그려 정한다(ADR 40552). `setTimeout`이나 d3 transition으로 나중에 크기를 바꾸는 그리기는 측정에서 빠진다. CSS transition은 측정 중 `.dk-still`로 꺼 두었고, `kit/api/deck-contracts.md`는 지연 애니메이션을 "크기를 바꾸지 않을 때만" 허용한다. 갤러리 5편(projectile-drag, single-gpu-dataflow, cache-ttl, diversification, retrieval-practice)이 `setTimeout`을 쓴다.

## Rejected Alternative
측정 모드에서는 즉시(동기로) 실행되는 `LTT.later(ms, fn)`를 작가 API로 열고 갤러리의 `setTimeout`을 그것으로 옮긴다.

## Reason
사용자가 기각했다. 모든 수업에 작가 규칙이 하나 더해져 생성 비용이 늘지만, 그 경우는 이미 `.dk-still`과 "크기를 바꾸지 않을 때만" 문구가 다룬다. 사용자는 전에도 생성 비용을 늘리는 작가 장치를 기각했다.

## Revisit Condition
갤러리가 아닌 실제 수업의 `events.jsonl` `layout-audit`에서 `setTimeout`·d3 transition 그리기가 측정 뒤 크기를 바꾼 사례가 나올 때.

## Chosen Instead
skills/learn-to-tell/kit/api/deck-contracts.md
