// src/core/GameState.ts
import type { ICharacter, ICardData, IMapData } from '../types';

// 💡 기본 시작 덱의 단일 정의(Single Source of Truth).
// 호출할 때마다 새 객체를 만들어 반환해야 카드별 강화가 서로 간섭하지 않는다.
export const getStartingDeck = (): ICardData[] => {
    return [
        { id: 'strike_1', name: '타격', cost: 1, desc: '피해를 6 줍니다.', type: 'ATTACK', damage: 6 },
        { id: 'strike_2', name: '타격', cost: 1, desc: '피해를 6 줍니다.', type: 'ATTACK', damage: 6 },
        { id: 'strike_3', name: '타격', cost: 1, desc: '피해를 6 줍니다.', type: 'ATTACK', damage: 6 },
        { id: 'strike_4', name: '타격', cost: 1, desc: '피해를 6 줍니다.', type: 'ATTACK', damage: 6 },
        { id: 'defend_1', name: '수비', cost: 1, desc: '방어도를 5 얻습니다.', type: 'DEFEND', block: 5 },
        { id: 'defend_2', name: '수비', cost: 1, desc: '방어도를 5 얻습니다.', type: 'DEFEND', block: 5 },
        { id: 'defend_3', name: '수비', cost: 1, desc: '방어도를 5 얻습니다.', type: 'DEFEND', block: 5 },
        { id: 'defend_4', name: '수비', cost: 1, desc: '방어도를 5 얻습니다.', type: 'DEFEND', block: 5 },
    ];
};

export const GameState = {
    player: { hp: 30, maxHp: 30, block: 0, mana: 3, maxMana: 3, gold: 0 } as ICharacter,
    enemy: { hp: 25, maxHp: 25, block: 0, intent: { type: 'attack', value: 8 } } as ICharacter,
    
    // 💡 텅 비어있던 영구 덱에 시작 카드 8장을 채워 넣습니다!
    masterDeck: getStartingDeck(), 
    
    deck: [] as ICardData[],
    hand: [] as ICardData[],
    discard: [] as ICardData[],
    
    turn: 'player' as 'player' | 'enemy' | 'animating',
    floor: 1,
    
    currentMap: null as IMapData | null,     
    currentNodeId: null as string | null,    
    visitedNodeIds: [] as string[],          
    playableNodeIds: [] as string[]          
};