// src/data/enemies.ts

export interface IEnemyTemplate {
    id: string;
    name: string;
    spriteKey: string;
    minHp: number;
    maxHp: number;
    // 추후 공격력, 패턴 등을 여기에 추가합니다.
}

export const ENEMY_DB = {
    // 1막 일반 몬스터 풀
    act1_normal: [
        { id: 'slime', name: '산성 슬라임', spriteKey: 'enemy_gunha', minHp: 20, maxHp: 28 }, // 임시로 모두 gunha 이미지 사용
        { id: 'snail', name: '껍질 달팽이', spriteKey: 'enemy_gunha', minHp: 22, maxHp: 30 },
        { id: 'bug', name: '돌연변이 벌레', spriteKey: 'enemy_gunha', minHp: 18, maxHp: 25 },
    ],
    // 1막 엘리트 몬스터 풀
    act1_elite: [
        { id: 'elite_gunha', name: '타락한 건하', spriteKey: 'enemy_gunha', minHp: 65, maxHp: 75 },
    ],
    // 1막 보스 풀
    act1_boss: [
        { id: 'boss_guardian', name: '수호자', spriteKey: 'enemy_gunha', minHp: 200, maxHp: 220 },
    ]
};