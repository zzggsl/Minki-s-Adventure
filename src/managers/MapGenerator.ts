// src/managers/MapGenerator.ts
import type { IMapData, IMapNode, IMapEdge, NodeType } from '../types';

export class MapGenerator {
    static generateTestMap(): IMapData {
        return { act: 1, theme: { backgroundKey: '', nodeColors: {} as any, lineColor: 0, activeLineColor: 0 }, nodes: [], edges: [] };
    }

    static generateProceduralMap(act: number): IMapData {
        const WIDTH = 7;
        const HEIGHT = 15; // 0층(START) ~ 14층(BOSS)
        const nodesMap: Map<string, IMapNode> = new Map();
        const edges: IMapEdge[] = [];

        const getNodeId = (x: number, y: number) => `n_${y}_${x}`;

        // 1. 0층(START) 단일 노드 생성 (정중앙)
        const startX = 3;
        const startId = getNodeId(startX, 0);
        nodesMap.set(startId, { id: startId, type: 'START', floor: 0, xRatio: (startX + 1) / (WIDTH + 1) });

        // 2. 1층(첫 전투) 단일 노드 생성 - 항상 '일반 배틀' 고정!
        const firstBattleId = getNodeId(startX, 1);
        nodesMap.set(firstBattleId, { id: firstBattleId, type: 'BATTLE', floor: 1, xRatio: (startX + 1) / (WIDTH + 1) });
        edges.push({ from: startId, to: firstBattleId });

        // 3. 2층 분기 지점 생성 (쏠림 방지를 위해 중앙부에서 안정적으로 넓게 뻗어나가도록 세팅)
        const startingXCoords = [1, 2, 4, 5]; 
        startingXCoords.forEach(x => {
            const toId = getNodeId(x, 2);
            nodesMap.set(toId, { id: toId, type: 'BATTLE', floor: 2, xRatio: (x + 1) / (WIDTH + 1) });
            edges.push({ from: firstBattleId, to: toId });
        });

        let paths = [...startingXCoords];

        // 4. 2층부터 13층까지 전진하며 무작위 길 생성 (쏠림 방지 및 교차 검증)
        for (let y = 2; y < HEIGHT - 2; y++) {
            let nextPaths: number[] = [];
            
            for (let i = 0; i < paths.length; i++) {
                let currentX = paths[i];
                
                // 좌, 우, 직진 옵션 계산
                let minX = Math.max(0, currentX - 1);
                let maxX = Math.min(WIDTH - 1, currentX + 1);

                // 경로 교차(선 꼬임) 방지
                if (i > 0) minX = Math.max(minX, nextPaths[i - 1]);
                if (i < paths.length - 1) maxX = Math.min(maxX, paths[i + 1]);

                const validOptions = [];
                for (let nx = minX; nx <= maxX; nx++) validOptions.push(nx);
                
                // 안정적인 중앙 집중 유지를 위한 가중치 부여
                const nextX = validOptions.length > 0 
                    ? validOptions[Math.floor(Math.random() * validOptions.length)] 
                    : currentX;
                
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

        // 5. 14층(보스) 노드 생성 및 마지막 층 선 합치기
        const bossId = getNodeId(startX, 14);
        nodesMap.set(bossId, { id: bossId, type: 'BOSS', floor: 14, xRatio: (startX + 1) / (WIDTH + 1) });
        paths.forEach(x => {
            const fromId = getNodeId(x, HEIGHT - 2);
            if (!edges.some(e => e.from === fromId && e.to === bossId)) {
                edges.push({ from: fromId, to: bossId });
            }
        });

        // 6. 확률 및 제약 조건에 기반한 룸 타입 할당 (3층 이후 등장)
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
        // 등장 확률 비율 조정
        const weights = [
            { type: 'BATTLE' as NodeType, w: 40 },
            { type: 'EVENT' as NodeType, w: 25 },
            { type: 'ELITE' as NodeType, w: 18 },
            { type: 'REST' as NodeType, w: 12 },
            { type: 'SHOP' as NodeType, w: 5 }
        ];

        // 2층까지는 무조건 일반 배틀 고정, 3층부터 13층까지 종류 할당
        for (let y = 3; y < height - 1; y++) {
            const floorNodes = Array.from(nodesMap.values()).filter(n => n.floor === y);
            
            floorNodes.forEach(node => {
                const parents = edges.filter(e => e.to === node.id).map(e => nodesMap.get(e.from)!);
                const siblings = edges.filter(e => parents.some(p => p.id === e.from) && e.to !== node.id).map(e => nodesMap.get(e.to)!);

                // 💡 [문제 해결 3, 5] 보물상자가 겹치는 합류 분기점에 빈번히 등장하도록 판정 수정
                // 두 경로 이상이 한곳으로 모이는 곳 검사 (단 보스 바로 전 13층 제외)
                if (parents.length >= 2 && y < height - 2) {
                    node.type = 'TREASURE';
                    return; 
                }

                let available = [...weights];

                // 💡 [문제 해결 4] 상점, 휴식, 엘리트는 3층(floor 3) 이후부터 서서히 등장 처리
                if (y < 4) {
                    available = available.filter(w => w.type !== 'ELITE' && w.type !== 'REST' && w.type !== 'SHOP');
                }

                // 보스 직전 층(13층)은 로그라이크 컨벤션에 맞춰 무조건 휴식(모닥불) 노드로 강제 지정
                if (y === height - 2) {
                    node.type = 'REST';
                    return;
                }

                // 특수 노드들 연속 생성 제한 제약
                const banConsecutive = ['ELITE', 'SHOP', 'REST'];
                parents.forEach(p => {
                    if (banConsecutive.includes(p.type)) {
                        available = available.filter(w => w.type !== p.type);
                    }
                });

                // 형제 분기 노드 중복 배제 규칙
                siblings.forEach(s => {
                    if (s.type !== 'BATTLE' && s.type !== 'REST') { 
                        available = available.filter(w => w.type !== s.type);
                    }
                });

                if (available.length === 0) available = [{ type: 'BATTLE', w: 100 }];

                // 가중치 룰렛 연산
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