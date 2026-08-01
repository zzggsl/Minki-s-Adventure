# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
- **민기의 모험** — 친구들과 모바일 브라우저로 가볍게 즐기는 2D 덱빌딩 로그라이크.
- 기술 스택: TypeScript, Phaser 4, Vite, HTML5 Canvas.
- 상세 배경은 `docs/PROJECT.md`, `docs/GAME_DESIGN.md` 참고.

## 명령어
```bash
npm install
npm run dev       # Vite 개발 서버
npm run build      # tsc(타입체크) && vite build
npm run preview    # 빌드 결과 미리보기
```
- 별도의 lint/test 스크립트는 없음. 타입 검증은 `npm run build`의 `tsc` 단계가 담당하며, `tsconfig.json`이 `noUnusedLocals`/`noUnusedParameters`/`noFallthroughCasesInSwitch` 등 비교적 엄격한 설정을 사용함.
- 단일 테스트를 실행하는 별도 명령은 없음(테스트 프레임워크 미구성).

## 아키텍처

### 게임 루프
`MenuScene` → `MapScene`(경로 선택) → `BattleScene`(전투) → `RewardScene`(전리품 선택) → `MapScene` 복귀

### 계층 구조 (핵심 원칙 — docs/ARCHITECTURE.md)
- **`GameState`**(`src/core/GameState.ts`) — 모든 게임 상태(player, enemy, deck/hand/discard, turn, map 등)를 관리하는 단일 객체. Save/Load 단순화를 위해 상태를 분산시키지 않는다.
- **`Scene`**(`src/scenes/`) — 렌더링과 입력 이벤트 수신만 담당하고 비즈니스 로직을 직접 구현하지 않는다.
- **`Manager`/`System`**(`src/managers/`, `src/systems/`) — 실제 규칙과 상태 변경을 담당.
  - `BattleManager` — 전투 규칙(카드 사용, 데미지/방어 연산, 턴 처리)
  - `DeckSystem` — 덱/핸드/버림 더미 조작, `EventBus`로 `hand-updated` 발행
  - `SaveSystem` — localStorage 저장/불러오기 (`my_deckbuilder_save` 키)
  - `MapGenerator` — 절차적 분기 맵 생성(층별 가중치 룰렛으로 노드 타입 결정)
  - `EnemyFactory` — `data/enemies.ts` 풀에서 몬스터 스폰
  - `SettingsManager` — 볼륨/애니메이션 속도/PC·모바일 UI 강제 전환 (localStorage `minki_settings`)
- **`EventBus`**(`src/core/EventBus.ts`) — Phaser `EventEmitter` 기반. 시스템과 UI 컴포넌트 간 느슨한 결합에 사용.
- **UI 컴포넌트**(`src/ui/`, `src/ui/modals/`) — `Button`, `Modal`, `Tooltip`, `TopBar`, `CardView` 등은 상태를 소유하지 않고(stateless), 외부에서 `refresh(data)`로 전달받은 데이터만 표시한다. `GameState`를 직접 수정하지 않고, 사용자 입력을 Manager/System에 위임한다.
  - `CardView`(`src/ui/CardView.ts`) — 카드 한 장의 외형을 담당하는 **유일한** 구현. 전투/보상/덱 모달이 모두 이걸 쓴다. 카드 비주얼을 바꿀 일이 있으면 여기만 고친다.

### 폰트 (`src/ui/theme.ts`)
- 게임 폰트는 갈무리(`Galmuri11`, OFL-1.1). npm 패키지 `galmuri`에서 self-host 하며 `src/fonts.css`가 `@font-face`를 선언한다.
- ⚠️ `registerDefaultFont()`가 **Phaser의 `add.text` 팩토리를 프로토타입 수준에서 교체**해 모든 텍스트에 기본 폰트를 주입한다. 따라서 각 `add.text` 호출에 `fontFamily`를 적지 않아도 된다(적으면 그 값이 우선). `main.ts`에서 `new Phaser.Game()` **이전에** 호출해야 한다.
- `Phaser.GameObjects.GameObjectFactory.register()`는 이미 등록된 타입을 덮어쓰지 않으므로(내부 `hasOwnProperty` 검사) 반드시 프로토타입에 직접 할당해야 한다.
- 폰트는 Phaser 로더가 아닌 브라우저가 받으므로 `PreloadScene`이 `waitForFonts()`로 로드 완료를 기다린 뒤 `MenuScene`을 시작한다.
- 픽셀 폰트라 **11px 배수(22/33/44/55…)에서 가장 또렷**하다. 새 텍스트 크기는 되도록 배수로 맞춘다.

### 데이터 (`src/data/`)
- `cards.ts` — `CARD_DB`(카드 풀), `getRandomRewardCards()`
- `enemies.ts` — `ENEMY_DB`(`act1_normal`/`act1_elite`/`act1_boss`)
- `keywords.ts` — 툴팁용 키워드 사전(`KEYWORD_DICT`)
- `src/types/index.ts` — `ICardData`, `ICharacter`, `IMapData` 등 공용 타입. 새로운 복잡한 데이터 구조는 반드시 여기에 정의한다.

### UI 배치 규칙 (docs/UI_GUIDE.md)
- 하드코딩된 좌표 금지 — `width`/`height` 비율 기반 배치만 사용 (예: `width * 0.88`).
- PC: 호버 확대 + 드래그&드롭 / Mobile: 터치 팝업 후 재터치·스와이프. `SettingsManager.isMobileUI()`로 분기.

## 코딩 컨벤션 (docs/CODING_RULES.md)
- `any` 사용 금지. 복잡한 데이터 구조는 반드시 `src/types/index.ts`에 `interface`/`type`으로 정의.
- 모듈만 가져올 때는 `import type` 사용.
- 기본 체력/마나/드로우 수 등 중요 수치는 곳곳에 하드코딩하지 않고 `GameState` 초기화 로직이나 상수로 관리.
- 카드 데이터: 10장 이하는 `cards.ts` 단일 파일 유지, 30장부터 분리 고민, 100장 이상이면 `basic.ts`/`common.ts`/`rare.ts`로 분리 (docs/CARD_GUIDE.md).

## AI 협업 규칙 (docs/AI_RULES.md)
- 기존 기능 삭제나 동작 변경 시 이유와 영향 범위를 먼저 설명하고 사용자 승인 후 진행.
- 파일 이동·구조 변경 시 이유와 기대 효과를 사전에 설명.
- 작업 후 수정된 파일 목록과 핵심 변경 사항을 요약 보고.
- 복잡한 기능을 추가하기 전에는 변경 계획을 먼저 제시하고 동의를 얻는다.
- 작업 완료 후 `docs/TODO.md`를 함께 갱신(완료 항목/다음 작업 반영).

## 참고 문서
`docs/ARCHITECTURE.md`, `docs/CODING_RULES.md`, `docs/UI_GUIDE.md`, `docs/CARD_GUIDE.md`, `docs/GAME_DESIGN.md`, `docs/TODO.md`
