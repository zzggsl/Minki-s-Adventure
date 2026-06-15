# 작업 진행 상황 (TODO List)

## ✅ 완료된 작업 (Done)
- [x] 기본 게임 루프 (메인 -> 맵 -> 전투 -> 보상) 구축
- [x] LocalStorage 기반 자동 저장/불러오기 기능
- [x] 아이패드(고해상도) 기준 반응형 UI 기초 및 폰트 렌더링 개선
- [x] 프로젝트 코딩 룰 및 문서화 (AI 협업 규칙 포함)
- [x] **BattleManager 분리 (리팩토링)**: `BattleScene`에서 순수 전투 연산 로직을 완벽히 분리하고, Result 객체 기반 구조로 전환하여 Phaser 의존성 제거 완료.

## 🚀 다음 목표 (To Do - High Priority)
- [ ] **효과음(SFX) 적용**: 사운드 에셋을 메모리에 선행 로드 후 게임에 적용하기.

## ⏳ 향후 과제 (To Do - Medium/Low Priority)
- [ ] Card 클래스 도입 및 효과(Effect) 시스템 고도화
- [ ] 적 AI (Intent Generator) 시스템 분리
- [ ] 맵 노드(모닥불, 엘리트) 및 유물(Relic) 시스템 추가
- [ ] 논리적 해상도(Logical Resolution) 도입을 통한 완벽한 모바일 반응형 스케일링 구현