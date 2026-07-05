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
}

export interface ICharacter {
    hp: number;
    maxHp: number;
    mana?: number;
    maxMana?: number;
    intent?: { type: string; value: number };
    block?: number;  
}

// 💡 enum 대신 유니온 타입으로 선언하여 erasableSyntaxOnly 에러 원천 차단
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