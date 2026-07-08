// src/data/cards.ts
import type { ICardData } from '../types';

// 게임 내 등장하는 모든 카드의 풀(Pool)
export const CARD_DB: ICardData[] = [
    { id: 'strike', name: '타격', cost: 1, desc: '피해를 6 줍니다.', type: 'ATTACK', damage: 6 },
    { id: 'defend', name: '수비', cost: 1, desc: '방어도를 5 얻습니다.', type: 'DEFEND', block: 5 },
    { id: 'bash', name: '강타', cost: 2, desc: '피해를 8 줍니다.', type: 'ATTACK', damage: 8 },
    { id: 'iron_wave', name: '철격', cost: 1, desc: '방어도를 5 얻고 피해를 5 줍니다.', type: 'ATTACK', damage: 5, block: 5 },
    { id: 'cleave', name: '회전베기', cost: 1, desc: '모든 적에게 피해를 8 줍니다.', type: 'ATTACK', damage: 8 },
];

// 보상용 무작위 카드 3장을 뽑는 헬퍼 함수
export const getRandomRewardCards = (count: number = 3): ICardData[] => {
    const shuffled = [...CARD_DB].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(card => ({
        ...card, 
        id: `${card.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}` // 고유 ID 부여
    }));
};