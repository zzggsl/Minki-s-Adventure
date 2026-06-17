// 게임 전체에서 쓰이는 타입들을 정의합니다.
export type CardType = 'ATTACK' | 'DEFEND' | 'SKILL' | 'POWER' | string;

export interface ICardData {
    id: string;
    name: string;
    cost: number;
    desc: string;
    type: CardType;
    value?: number;  // 기존의 범용 수치
    damage?: number; // 💡 카드의 공격력
    block?: number;  // 💡 카드의 방어도
}

export interface ICharacter {
    hp: number;
    maxHp: number;
    mana?: number;
    maxMana?: number;
    intent?: { type: string; value: number };
    block: number; // 💡 캐릭터는 현재 쌓인 방어도 수치가 필수입니다.
}