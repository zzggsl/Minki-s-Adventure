# 작업 진행 상황 (TODO List)

## ✅ 완료된 작업 (Done)
- [x] 기본 게임 루프 (메인 -> 맵 -> 전투 -> 보상) 구축
- [x] LocalStorage 기반 자동 저장/불러오기 기능
- [x] 프로젝트 코딩 룰 및 문서화 (AI 협업 규칙 포함)
- [x] BattleManager 분리 (리팩토링) : BattleScene에서 순수 전투 연산 로직 완벽 분리
- [x] UI 아키텍처 재설계 및 `UI_GUIDE.md` 작성
- [x] UI 공통 컴포넌트 프레임워크 구축 (`TopBar`, `Button`, `Modal`, `Tooltip` 분리)
- [x] SettingsManager 도입 (기기 감지 및 모바일/PC 크로스 플랫폼 조작 대응)
- [x] 시각적 덱 뷰어 구현 (모달 내부에 Grid 형태로 카드 렌더링)
- [x] 통합 Tooltip 시스템 연동 및 데이터 분리 (`keywords.ts`)
- [x] 모바일 브라우저 주소창(100dvh) 및 하단 잘림(iOS Safari) 완벽 대응
- [x] 거대해진 `BattleScene` 리팩토링 (모달 및 데이터 분리를 통한 책임 분리)
- [x] **Slay the Spire 스타일 분기형 맵 시스템 도입 (Option C 완료)**
  - [x] **노드(Node) 타입 정의**: `NodeType`(START/BATTLE/ELITE/EVENT/SHOP/REST/TREASURE/BOSS) 및 `IMapNode`/`IMapEdge`/`IMapData` 구조를 `types/index.ts`에 설계.
  - [x] **맵 생성 알고리즘**: `MapGenerator`가 15층 규모의 분기/합류 경로를 생성. 층별 가중치 룰렛으로 노드 타입 결정 + 연속 배치 금지 규칙 적용.
  - [x] **시각적 렌더링 및 스크롤**: `MapScene`에서 드래그로 상하 스크롤 지원.
  - [x] **경로 검증 로직**: `playableNodeIds` 기반으로 연결된 다음 노드만 클릭 가능.
- [x] 맵 진행 상황(현재 위치, 생성된 노드 연결망) Save/Load 시스템 연동
- [x] `EnemyFactory` 도입 (노드 타입/층에 따라 `data/enemies.ts` 풀에서 몬스터 스폰)
- [x] 골드 보상 기초 (`ICharacter.gold`, 전투 승리 시 골드 획득)

- [x] **비전투 노드 1차 구현 (REST / TREASURE)**
  - [x] **REST(모닥불)**: `RestScene` + `NodeEventManager`. 휴식(최대 체력 30% 회복) / 카드 강화 중 택 1.
  - [x] **카드 강화 시스템**: `ICardData.upgraded` 도입, 피해·방어도 +3 및 이름에 `+` 표시. `DeckModal`을 카드 선택 모달로 재사용.
  - [x] **TREASURE(보물)**: `TreasureScene`. 골드 25~50 획득 + 카드 3장 중 1장 선택.
  - [x] **골드 UI/저장 연동**: `TopBar`에 보유 골드 표시, `SaveSystem`에 골드 저장·복원.
  - [x] **마스터 덱 객체 참조 버그 수정**: `DeckSystem.initMasterDeck`이 `CARD_DB` 원본을 공유 참조하던 문제 해결(강화 시 카드 풀 오염). 시작 덱 정의를 `GameState.getStartingDeck()` 한 곳으로 통일.

- [x] **비전투 노드 2차 구현 (EVENT / SHOP)** — 이로써 8종 노드 타입이 모두 동작
  - [x] **EVENT(미지의 이벤트)**: `data/events.ts` 이벤트 풀 5종 + `IEventEffect` 효과 타입 설계. `EventManager`가 효과 적용과 선택지 조건(골드/덱 장수)을 판정하고 `EventScene`이 표시.
  - [x] **SHOP(상점)**: `ShopManager`(재고 4장, 마나 비용 기반 가격 산정, 구매/제거 판정) + `ShopScene`. 카드 구매 및 카드 제거 서비스(75G) 제공.
  - [x] **카드 제거 기능**: `NodeEventManager.removeCardFromMasterDeck`, 최소 덱 4장 보장.

- [x] **비주얼 1차 개선 (폰트 + 카드)**
  - [x] **픽셀 폰트 도입**: 갈무리(`Galmuri11`, OFL-1.1) self-host. `theme.ts`가 Phaser `add.text` 팩토리를 교체해 전 화면에 자동 적용.
  - [x] **`CardView` 컴포넌트 통합**: `BattleScene`/`RewardScene`/`DeckModal`에 3벌로 중복돼 있던 카드 렌더링을 하나로 합침.
  - [x] **카드 디자인 개선**: 둥근 모서리, 그림자, 타입별 색(공격 붉은색/방어 푸른색), 이름 띠, 타입 아이콘 일러스트, 강화 시 금색 테두리.
  - [x] `PreloadScene`의 잘못된 경로 중복 로드 6줄 제거.

## 🚀 다음 목표 (To Do - High Priority)
- [ ] 카드 효과 시스템 고도화 (독, 취약, 힘, 약화, 카드 뽑기 등 상태 이상 및 특수 로직 엔진 추가).
- [ ] 적 AI 고도화 (현재 `BattleManager.generateEnemyIntent`가 5~15 랜덤 공격 고정 — 몬스터별 행동 패턴 도입).

## 🎨 비주얼 2차 (To Do)
- [ ] **전투 타격감**: 피격 시 카메라 셰이크·붉은 틴트, 데미지 숫자 팝업, 방어도 획득 연출.
- [ ] **비전투 씬 배경**: 모닥불/보물/이벤트/상점이 아직 검은 배경 + 버튼뿐.
- [ ] **씬 전환 페이드** 및 `theme.ts`로 색상 팔레트 통합(현재 색상값이 파일마다 하드코딩).
- [ ] **텍스트 크기 11px 배수 정리**: 픽셀 폰트가 배수에서 가장 또렷한데 기존 크기(24/28/38/50…)가 배수가 아님.
- [ ] **카드 전용 일러스트**: 현재는 타입 아이콘(`swordicon`/`shieldicon`)으로 대체 중.
- [ ] `map_bg.png`가 로드만 되고 사용되지 않음 — 활용하거나 제거.

## ⚠️ 알려진 제약 (Known Issues)
- **강화 설명문 처리**: `NodeEventManager.buildDesc`가 수치 기준으로 설명을 재생성하므로 '회전베기'의 "모든 적에게" 같은 고유 문구가 사라짐. 카드 데이터에 설명 템플릿을 두는 방식 검토 필요.
- **덱 모달 표시 한계**: `DeckModal`이 6열 그리드로 고정되어 카드가 12장을 넘으면 패널 밖으로 넘칠 수 있음. 스크롤/페이지네이션 필요.
- **이벤트/상점 재진입**: 노드를 떠난 뒤 다시 들어오면 이벤트와 상점 재고가 새로 굴려짐(현재 맵 구조상 재진입은 불가하지만 추후 주의).

## ⏳ 향후 과제 (To Do - Medium Priority)
- [ ] 유물(Relics) 시스템 기초 구조 설계.
- [ ] 카드 풀 확장 (현재 `CARD_DB` 5종 — 상점/보상 다양성 확보에 필요).