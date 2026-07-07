// src/managers/MapGenerator.ts
import type { IMapData, IMapNode, IMapEdge, NodeType } from '../types';

export class MapGenerator {
    static generateTestMap(): IMapData {
        return { act: 1, theme: { backgroundKey: '', nodeColors: {} as any, lineColor: 0, activeLineColor: 0 }, nodes: [], edges: [] };
    }

    // 💡 슬더슬 2 스타일 절차적 랜덤 맵 생성 알고리즘
    static generateProceduralMap(act: number): IMapData {
        const WIDTH = 7;
        const HEIGHT = 15; // 0층(START) ~ 14층(BOSS)
        const nodesMap: Map<string, IMapNode> = new Map();
        const edges: IMapEdge[] = [];

        const getNodeId = (x: number, y: number) => `n_${y}_${x}`;

        // 💡 1. 0층(START) 단일 노드 생성 (정중앙)
        const startX = 3;
        const startId = getNodeId(startX, 0);
        nodesMap.set(startId, { id: startId, type: 'START', floor: 0, xRatio: (startX + 1) / (WIDTH + 1) });

        // 💡 2. 1층(첫 전투) 단일 노드 생성 - 항상 '일반 배틀' 고정!
        const firstBattleId = getNodeId(startX, 1);
        nodesMap.set(firstBattleId, { id: firstBattleId, type: 'BATTLE', floor: 1, xRatio: (startX + 1) / (WIDTH + 1) });
        edges.push({ from: startId, to: firstBattleId });

        // 💡 3. 2층에서 갈라질 3~4갈래 길(Walker) 출발 지점 무작위 세팅
        const numPaths = 4; // 4갈래 분기
        let paths: number[] = [];
        
        // 💡 [문제 해결 4] 경로 중간 빈 공간 해결: 출발 지점을 중앙 근처 범위로 제한합니다.
        const center = Math.floor(WIDTH / 2); // WIDTH 7일 경우 3
        paths = [center - 1, center, center + 1, center + 2].sort((a, b) => a - b); // 💡 경로를 촘촘하게 중앙 근처 X좌표로 고정

        // 1층(첫 전투)에서 2층의 각 갈래로 퍼져나가는 선 긋기
        paths.forEach(x => {
            const toId = getNodeId(x, 2);
            nodesMap.set(toId, { id: toId, type: 'BATTLE', floor: 2, xRatio: (x + 1) / (WIDTH + 1) }); // 일단 배틀로 임시 배정
            edges.push({ from: firstBattleId, to: toId });
        });

        // 💡 4. 2층부터 13층까지 위로 전진하며 길 뚫기 (경로 교차 방지)
        for (let y = 2; y < HEIGHT - 2; y++) {
            let nextPaths: number[] = [];
            for (let i = 0; i < numPaths; i++) {
                let currentX = paths[i];
                
                let minX = Math.max(0, currentX - 1);
                let maxX = Math.min(WIDTH - 1, currentX + 1);

                if (i > 0) minX = Math.max(minX, nextPaths[i - 1]);
                if (i < numPaths - 1) maxX = Math.min(maxX, paths[i + 1] + 1);

                const validOptions = [];
                for (let nx = minX; nx <= maxX; nx++) validOptions.push(nx);
                
                const nextX = validOptions.length > 0 
                    ? validOptions[Math.floor(Math.random() * validOptions.length)] 
                    : nextPaths[i - 1];
                
                nextPaths.push(nextX);

                const fromId = getNodeId(currentX, y);
                const toId = getNodeId(nextX, y + 1);

                if (!nodesMap.has(toId)) {
                    nodesMap.set(toId, { id: toId, type: 'BATTLE', floor: y + 1, xRatio: (nextX + 1) / (WIDTH + 1) });
                }

                if (!edges.some(e => e.from === fromId && e.to === toId)) {
                    edges.push({ from: fromId, to: toId });
                }
            }
            paths = nextPaths;
        }

        // 💡 5. 14층(보스) 노드 생성 및 마지막 층 선 합치기
        const bossId = getNodeId(startX, 14);
        nodesMap.set(bossId, { id: bossId, type: 'BOSS', floor: 14, xRatio: (startX + 1) / (WIDTH + 1) });
        paths.forEach(x => {
            const fromId = getNodeId(x, HEIGHT - 2);
            if (!edges.some(e => e.from === fromId && e.to === bossId)) {
                edges.push({ from: fromId, to: bossId });
            }
        });

        // 💡 6. 알고리즘에 따라 방 종류(Type) 할당
        this.assignRoomTypes(nodesMap, edges, HEIGHT);

        return {
            act,
            theme: {
                backgroundKey: '',
                nodeColors: {
                    'START': 0x888888, 'BATTLE': 0x4444ff, 'ELITE': 0xff4444,
                    'EVENT': 0xaaaaaa, 'SHOP': 0xffff44, 'REST': 0x44ff44,
                    'TREASURE': 0xffffaa, 'BOSS': 0xff0000
                },
                lineColor: 0x444444,
                activeLineColor: 0xffff00
            },
            nodes: Array.from(nodesMap.values()),
            edges
        };
    }

    private static assignRoomTypes(nodesMap: Map<string, IMapNode>, edges: IMapEdge[], height: number) {
        const weights = [
            { type: 'BATTLE' as NodeType, w: 45 },
            { type: 'EVENT' as NodeType, w: 22 },
            { type: 'ELITE' as NodeType, w: 16 },
            { type: 'REST' as NodeType, w: 12 },
            { type: 'SHOP' as NodeType, w: 5 }
        ];

        for (let y = 2; y < height - 1; y++) {
            const floorNodes = Array.from(nodesMap.values()).filter(n => n.floor === y);
            
            floorNodes.forEach(node => {
                const parents = edges.filter(e => e.to === node.id).map(e => nodesMap.get(e.from)!);
                const siblings = edges.filter(e => parents.some(p => p.id === e.from) && e.to !== node.id).map(e => nodesMap.get(e.to)!);

                let available = [...weights];

                if (y < 5) {
                    available = available.filter(w => w.type !== 'ELITE' && w.type !== 'REST');
                }

                if (y === height - 2) {
                    available = [{ type: 'REST', w: 100 }];
                }

                const banConsecutive = ['ELITE', 'SHOP', 'REST'];
                parents.forEach(p => {
                    if (banConsecutive.includes(p.type)) {
                        available = available.filter(w => w.type !== p.type);
                    }
                });

                siblings.forEach(s => {
                    if (s.type !== 'BATTLE' && s.type !== 'REST') { 
                        available = available.filter(w => w.type !== s.type);
                    }
                });

                if (available.length === 0) available = [{ type: 'BATTLE', w: 100 }];

                const totalW = available.reduce((acc, curr) => acc + curr.w, 0);
                let roll = Math.random() * totalW;
                for (const option of available) {
                    roll -= option.w;
                    if (roll <= 0) {
                        node.type = option.type;
                        break;
                    }
                }
            });
        }
    }
}