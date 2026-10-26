# 수업 화면을 데스크톱 전용으로 두기

## Goal
수업 화면의 지원 기기 범위와, 그 범위에 맞는 레이아웃 분기·화면 점검 크기를 정한다.

## Attempts
| attempt | failure evidence | cause |
| --- | --- | --- |
| 폭 720px 이상 데스크톱 전용. 720px 이하 휴대폰 분기(미디어 쿼리, `fit`의 스크롤 분기, before/after 세로 쌓기, `auditScene`의 `narrow`)와 390×844 점검을 지움(3216f70, 2026-10-15) | 510f4b9(2026-10-17)가 claude.ai artifact로 수업을 만드는 `standalone.md`를 넣어 로컬 서버 없이 폰에서 여는 경로가 생김. b73f059(2026-10-17)가 폰 배치 코드(`data-ltt-mobile`, `LTT.mobile()`, `mobileFit`)를 다시 넣었고, 2026-10-18 사용자 결정으로 폰은 열람만 보장하도록 바뀜 | verified: "수업 서버가 loopback에만 열려 있어 폰에서 열 경로가 없다"는 전제가 standalone 경로로 깨졌다 |

## Revisit Condition
claude.ai 모바일 앱이 standalone 수업의 열람 경로에서 빠질 때(`standalone.md`).
