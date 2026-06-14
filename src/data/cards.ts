import type { ICardData } from '../types';

export const CardDatabase: Record<string, ICardData> = {
    'strike': { id: 'strike', name: '공격', cost: 1, desc: '적에게 6 피해', type: 'ATTACK', value: 6 },
    'defend': { id: 'defend', name: '방어', cost: 1, desc: '방어도 5 획득', type: 'DEFEND', value: 5 },
    
    // 💡 새로운 카드 2종 추가
    'heavy_strike': { id: 'heavy_strike', name: '강타', cost: 2, desc: '적에게 14 피해', type: 'ATTACK', value: 14 },
    'iron_wall': { id: 'iron_wall', name: '철벽', cost: 2, desc: '방어도 12 획득', type: 'DEFEND', value: 12 }
};