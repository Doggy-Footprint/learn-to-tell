# 장면 한 장 쓰기 — 최소 규칙

`examples/`의 본보기 두 장이 이 문서의 본문이다. 본보기의 파일 짜임(head의 script 태그, `ltt-meta`, SVG 헬퍼 `mk`/`tx`, 재생 루프, `LTT.deck` 호출)을 그대로 따른다. kit API 문서는 없으니 본보기에 나온 `LTT.*` 호출과 필드만 쓴다.

## 옮기는 것 / 옮기지 않는 것
- 옮긴다: 파일 뼈대, 그림을 그리는 기법(헬퍼, 좌표계, 재생 루프와 비트 나눔, reduced-motion 처리), 장면 type의 필드 모양.
- 옮기지 않는다: 본보기의 주제, 문구, 수치, 배치. 그림은 내 주제의 메커니즘을 보여야 한다.

## 색과 글자
- 색은 토큰만 쓴다: `--ltt-ink` `--ltt-ink-2` `--ltt-muted` `--ltt-line` `--ltt-line-2` `--ltt-bg` `--ltt-card` `--ltt-card-2` `--ltt-accent` `--ltt-accent-soft` `--ltt-good` `--ltt-warn` `--ltt-bad`(+ `-soft`), 계열 구분은 `--ltt-c1`…`--ltt-c6`. 테마가 값을 정하므로 hex를 쓰지 않는다.
- SVG 글자는 14px 이상. 라벨은 그림 위, 해당 대상 옆에 둔다.

## 숫자
- 그림의 수치는 파일 안 모델 함수에서 계산하고, 핵심 결과 하나 이상을 `LTT.expect(label, actual, expected, {tol})`로 대조한다. expected는 손으로 따로 계산한 값이다.
- 근거는 장면의 `basis`에 출처와 함께 적고, 가정한 계수는 가정이라고 밝힌다.
