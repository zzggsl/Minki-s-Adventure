// src/core/GameState.ts

// 💡 IMapData 타입을 불러오도록 수정
import type { ICharacter, ICardData, IMapData } from '../types';

export const GameState = {
    player: { hp: 30, maxHp: 30, block: 0, mana: 3, maxMana: 3 } as ICharacter,
    enemy: { hp: 25, maxHp: 25, block: 0, intent: { type: 'attack', value: 8 } } as ICharacter,
    
    masterDeck: [] as ICardData[], 
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