import type { ICharacter, ICardData } from '../types';

export const GameState = {
    player: { hp: 30, maxHp: 30, block: 0, mana: 3, maxMana: 3 } as ICharacter,
    enemy: { hp: 25, maxHp: 25, block: 0, intent: { type: 'attack', value: 8 } } as ICharacter,
    
    // 💡 바로 이 '영구 덱(masterDeck)' 변수가 누락되어서 검은 화면이 떴던 것입니다!
    masterDeck: [] as ICardData[], 
    
    deck: [] as ICardData[],
    hand: [] as ICardData[],
    discard: [] as ICardData[],
    
    turn: 'player' as 'player' | 'enemy' | 'animating',
    floor: 1 
};