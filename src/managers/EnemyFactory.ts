// src/managers/EnemyFactory.ts
import { ENEMY_DB } from '../data/enemies';
import type { ICharacter } from '../types';

interface SpawnParams {
    floor: number;
    type: 'BATTLE' | 'ELITE' | 'BOSS' | string;
}

export class EnemyFactory {
    static generateBattleEnemy(params: SpawnParams): ICharacter {
        let pool;

        // 1. 노드 타입에 따라 몬스터 풀 선택
        if (params.type === 'BOSS') {
            pool = ENEMY_DB.act1_boss;
        } else if (params.type === 'ELITE') {
            pool = ENEMY_DB.act1_elite;
        } else {
            pool = ENEMY_DB.act1_normal;
        }

        // 2. 풀에서 무작위 몬스터 1종 선택
        const template = pool[Math.floor(Math.random() * pool.length)];
        
        // 3. 체력은 minHp와 maxHp 사이에서 랜덤 결정
        const hp = Math.floor(Math.random() * (template.maxHp - template.minHp + 1)) + template.minHp;

        // 4. 완성된 적 객체 반환
        return {
            id: template.id,
            name: template.name,
            spriteKey: template.spriteKey,
            hp: hp,
            maxHp: hp,
            block: 0,
            intent: { type: 'attack', value: Math.floor(Math.random() * 5) + 5 } // 임시 의도(패턴)
        } as ICharacter;
    }
}