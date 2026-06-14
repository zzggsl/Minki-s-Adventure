# 아키텍처 원칙
- **GameState 단일 객체**: 모든 게임 상태는 하나의 객체에서 관리하여 저장/불러오기(Save/Load)를 단순화함.
- **책임 분리 (Separation of Concerns)**:
    - 데이터 조작은 `System` (DeckSystem, SaveSystem) 및 `Manager` (BattleManager)가 담당.
    - `Scene`은 오직 렌더링과 이벤트 수신만을 담당.
- **비율 기반 UI**: 하드코딩된 좌표 대신 `width`, `height`의 비율을 사용함.

- Scene는 가능한 한 비즈니스 로직을 직접 구현하지 않는다.

- 전투 규칙은 BattleManager

- 덱 조작은 DeckSystem

- 저장은 SaveSystem