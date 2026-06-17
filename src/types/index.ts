// 게임 전체에서 쓰이는 타입들을 정의합니다.
export type CardType = 'ATTACK' | 'DEFEND' | 'SKILL';

export interface ICardData {
    id: string;
    name: string;
    cost: number;
    desc: string;
    type: CardType;
    value: number; // 데미지 또는 방어도 수치
}

export interface ICharacter {
    hp: number;
    maxHp: number;
    mana?: number;
    maxMana?: number;
    intent?: { type: string; value: number };
    damage?: number; 
    block?: number; 
}