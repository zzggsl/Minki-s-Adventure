// src/types/index.ts

export type CardType = 'ATTACK' | 'DEFEND' | 'SKILL' | 'POWER' | string;

export interface ICardData {
    id: string;
    name: string;
    cost: number;
    desc: string;
    type: CardType;
    value?: number;
    damage?: number;
    block?: number;
    upgraded?: boolean; // 💡 모닥불에서 강화된 카드 여부 (중복 강화 방지)
}

export interface ICharacter {
    id?: string;          // 💡 적 식별용 (예: 'snail')
    name?: string;        // 💡 UI에 표시될 이름
    spriteKey?: string;   // 💡 렌더링할 이미지 에셋 키
    hp: number;
    maxHp: number;
    mana?: number;
    maxMana?: number;
    intent?: { type: string; value: number };
    block?: number;  
    gold?: number; // 💡 골드 속성 추가!
}

// enum 대신 유니온 타입으로 선언하여 에러 원천 차단
export type NodeType = 'START' | 'BATTLE' | 'ELITE' | 'EVENT' | 'SHOP' | 'REST' | 'TREASURE' | 'BOSS';

export interface IMapEdge {
    from: string; 
    to: string;   
}

export interface IMapNode {
    id: string;
    type: NodeType;
    floor: number;  // Y축 단계 (0부터 시작)
    xRatio: number; // X축 비율 (0.0 ~ 1.0)
}

export interface IMapTheme {
    backgroundKey: string;
    nodeColors: Record<NodeType, number>;
    lineColor: number;
    activeLineColor: number;
}

export interface IMapData {
    act: number;
    theme: IMapTheme;
    nodes: IMapNode[];
    edges: IMapEdge[];
}

// ===== 미지의 이벤트(EVENT 노드) =====

/**
 * 이벤트 선택지가 일으키는 효과.
 * UPGRADE_CARD / REMOVE_CARD는 플레이어가 카드를 골라야 하므로 씬에서 별도 처리한다.
 */
export type EventEffectType =
    | 'HEAL'            // 체력 회복
    | 'DAMAGE'          // 체력 감소
    | 'MAX_HP'          // 최대 체력 증감
    | 'GOLD'            // 골드 증감
    | 'ADD_RANDOM_CARD' // 무작위 카드 1장 획득
    | 'UPGRADE_CARD'    // 카드 1장 강화 (선택 필요)
    | 'REMOVE_CARD';    // 카드 1장 제거 (선택 필요)

export interface IEventEffect {
    type: EventEffectType;
    value?: number;
}

export interface IEventChoice {
    text: string;
    effects: IEventEffect[];
    /** 선택 후 보여줄 결과 문구 */
    resultText: string;
    /** 이 선택지를 고르는 데 필요한 최소 골드 (없으면 조건 없음) */
    requiresGold?: number;
}

export interface IEventData {
    id: string;
    title: string;
    desc: string;
    choices: IEventChoice[];
}

// ===== 상점(SHOP 노드) =====

export interface IShopItem {
    card: ICardData;
    price: number;
    soldOut: boolean;
}