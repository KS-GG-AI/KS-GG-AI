# 공개 로드맵 TODO

| 상태 | ID | 무엇을 | 어디를 | 완료 판정 기준 | 선행 작업 | 근거 |
| --- | --- | --- | --- | --- | --- |
| [x] | TODO-01 | TypeScript 로드맵 빌드 기반을 추가한다. | `profile/automation/roadmaps/package.json`, `profile/automation/roadmaps/tsconfig.json`, `.gitignore` | Node 22에서 TypeScript 컴파일이 성공한다. | 없음 | REQ-01, REQ-07 |
| [x] | TODO-02 | 공개 API 수집·정규화·SVG·JSON 생성기를 작성한다. | `profile/automation/roadmaps/src/update-roadmaps.ts` | 공개 이슈 라벨에서 두 SVG와 상태 JSON을 생성한다. | TODO-01 | REQ-01~REQ-04, REQ-06, REQ-07 |
| [x] | TODO-03 | 생성기 계약과 트랜잭션을 검증하는 테스트를 작성한다. | `profile/automation/roadmaps/src/test-roadmaps.ts` | 분류·재시도·빈 상태·README·출력 보존 테스트가 통과한다. | TODO-02 | REQ-02~REQ-08 |
| [x] | TODO-04 | 두 로드맵 자산과 10개 언어 접기 패널을 연결한다. | `profile/assets/maps/`, `profile/data/`, `README.md`, `profile/content/locales/*.md` | 두 SVG가 로컬에 있고 모든 README가 같은 정보 구조를 가진다. | TODO-02 | REQ-04~REQ-06 |
| [x] | TODO-05 | 정기·수동 자동화와 공통 경쟁 제어를 추가한다. | `.github/workflows/refresh-roadmaps.yml`, `.github/workflows/refresh-project-map.yml` | 변경 시에만 allowlist 파일을 커밋하고 동시 README 갱신이 직렬화된다. | TODO-02, TODO-03, TODO-04 | REQ-07, REQ-08 |
| [x] | TODO-06 | 공개 라벨·릴리스·태그를 발행한다. | GitHub repository state | 기준과 로드맵 릴리스가 각각 태그·설명을 가진다. | TODO-05 | REQ-03, REQ-09 |
| [x] | TODO-07 | 로컬·원격·프로필 렌더링 QA를 수행한다. | 생성물, GitHub Actions, GitHub profile | 컴파일, 테스트, 무변경 재실행, 원격 워크플로, 접기 UI가 확인된다. | TODO-03~TODO-06 | REQ-01~REQ-09 |

## 검증 기록

- `npm ci --prefix profile/automation/roadmaps --ignore-scripts`, `npm run --prefix profile/automation/roadmaps roadmaps:test`, `node profile/automation/project-map/test.mjs`, `npm audit --prefix profile/automation/roadmaps --omit=dev --audit-level=high`를 통과했다.
- 같은 공개 입력으로 로드맵 생성기를 다시 실행했을 때 변경이 없음을 확인했다.
- `Refresh public roadmaps` 수동 실행이 원격에서 생성·테스트·allowlist 커밋 단계를 모두 통과했다.
- GitHub 프로필에서 로드맵 접기 패널을 열어 두 SVG와 공개 이슈 안내 문구가 실제로 렌더링되는 것을 확인했다.
- `v0.1.0 · Profile foundation`과 `v0.2.0 · Public roadmaps` 태그·릴리스를 발행했다.
