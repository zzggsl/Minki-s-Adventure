# 아키텍처 원칙

- **GameState 단일 객체**: 모든 게임 상태는 하나의 객체에서 관리하여 저장/불러오기(Save/Load)를 단순화함.
- **책임 분리 (Separation of Concerns)**:
    - 데이터 조작은 `System` (DeckSystem, SaveSystem) 및 `Manager` (BattleManager)가 담당.
    - `Scene`은 오직 렌더링과 이벤트 수신만을 담당.
- **비율 기반 UI**: 하드코딩된 좌표 대신 `width`, `height`의 비율을 사용함.
- **Scene는 가능한 한 비즈니스 로직을 직접 구현하지 않는다.**
    - 전투 규칙은 `BattleManager`
    - 덱 조작은 `DeckSystem`
    - 저장은 `SaveSystem`

## 🎨 UI 아키텍처 원칙 (NEW)
- **상태의 비소유 (Stateless UI)**: `TopBar`, `Modal` 등 UI 컴포넌트는 내부적으로 게임의 상태를 소유하거나 직접 계산하지 않는다. 외부에서 전달받은 데이터(`refresh(data)`)를 화면에 표시하는 역할만 수행한다.
- **단방향 데이터 흐름**: UI 컴포넌트는 `GameState`를 절대 직접 수정하지 않는다. UI는 오직 사용자 입력(클릭, 터치)을 받아 Manager/System에 이벤트를 전달하고, 상태 변경은 온전히 Manager가 담당한다.
- **공통 컴포넌트 재사용**: 모든 버튼과 팝업은 개별 Scene에서 하드코딩하지 않고, `src/ui/` 하위의 공통 클래스(`Button`, `Tooltip`, `Modal` 등)를 재사용한다.
