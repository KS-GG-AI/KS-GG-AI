# 프로젝트 지도 TODO

| 상태 | ID | 무엇을 | 어디를 | 완료 판정 기준 | 선행 작업 | 근거 |
| --- | --- | --- | --- | --- | --- | --- |
| [x] | TODO-01 | 안전한 마스킹과 자동 갱신 구조를 설계한다. | `profile/docs/project-map/` | 요구사항·계획·설계 문서에 범위·보안·흐름이 기록된다. | 없음 | REQ-01, REQ-02, REQ-05, REQ-06 |
| [x] | TODO-02 | 공개 프로젝트와 익명 비공개 노드를 생성하는 스크립트를 작성한다. | `profile/automation/project-map/update.mjs` | SVG와 안전한 JSON이 생성된다. | TODO-01 | REQ-01, REQ-02, REQ-04, REQ-06 |
| [x] | TODO-03 | 생성기 안전성 테스트를 작성한다. | `profile/automation/project-map/test.mjs` | 원본 비공개 문자열이 산출물에 없음을 검사한다. | TODO-02 | REQ-02, REQ-04 |
| [x] | TODO-04 | SVG를 각 언어 README의 접기 UI에 연결한다. | `README.md`, `profile/content/locales/*.md` | 10개 README의 링크·태그 검사가 통과한다. | TODO-02 | REQ-03 |
| [x] | TODO-05 | 정기·수동 워크플로를 추가한다. | `.github/workflows/refresh-project-map.yml` | 변경 시에만 명시적 파일을 커밋한다. | TODO-02, TODO-03, TODO-04 | REQ-05, REQ-06 |
| [x] | TODO-06 | 로컬·원격 워크플로·프로필 화면 QA를 수행한다. | 생성 파일과 GitHub 프로필 | 생성, 테스트, 워크플로, 접기 UI가 확인된다. | TODO-03, TODO-04, TODO-05 | REQ-01~REQ-06 |
| [x] | TODO-07 | API 재시도·시간 제한과 출력 선검증을 보강하고, 활성 공개 저장소만 지도에 반영한다. | `profile/automation/project-map/update.mjs`, `profile/automation/project-map/test.mjs`, `.github/workflows/refresh-project-map.yml` | 재시도·4xx 즉시 실패·README 동기화·포크/보관 제외 테스트가 통과하고 job 시간 제한이 설정된다. | TODO-02~TODO-05 | REQ-04, REQ-05, REQ-07, REQ-08 |
