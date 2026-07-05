// src/managers/MapGenerator.ts
import type { IMapData, IMapNode, IMapEdge } from '../types';

export class MapGenerator {
    static generateTestMap(): IMapData {
        // 테스트용 고정 노드 배치 (Y자 분기 후 보스로 합류)
        const nodes: IMapNode[] = [
            { id: 'n_0_0', type: 'START', floor: 0, xRatio: 0.5 },
            
            { id: 'n_1_0', type: 'BATTLE', floor: 1, xRatio: 0.3 },
            { id: 'n_1_1', type: 'EVENT', floor: 1, xRatio: 0.7 },
            
            { id: 'n_2_0', type: 'ELITE', floor: 2, xRatio: 0.3 },
            { id: 'n_2_1', type: 'REST', floor: 2, xRatio: 0.7 },
            
            { id: 'n_3_0', type: 'BOSS', floor: 3, xRatio: 0.5 },
        ];

        // 노드들을 잇는 연결선 (Edge)
        const edges: IMapEdge[] = [
            { from: 'n_0_0', to: 'n_1_0' },
            { from: 'n_0_0', to: 'n_1_1' },
            
            { from: 'n_1_0', to: 'n_2_0' },
            { from: 'n_1_1', to: 'n_2_1' },
            
            { from: 'n_2_0', to: 'n_3_0' },
            { from: 'n_2_1', to: 'n_3_0' },
        ];

        return {
            act: 1,
            theme: {
                backgroundKey: '', // 추후 맵 배경 이미지 추가
                nodeColors: {
                    'START': 0x888888,
                    'BATTLE': 0x4444ff,
                    'ELITE': 0xff4444,
                    'EVENT': 0xaaaaaa,
                    'SHOP': 0xffff44,
                    'REST': 0x44ff44,
                    'TREASURE': 0xffffaa,
                    'BOSS': 0xff0000
                },
                lineColor: 0x444444,
                activeLineColor: 0x00ffff // 갈 수 있는 경로나 지나온 경로 색상
            },
            nodes,
            edges
        };
    }
}