import type { IMapData, IMapNode, IMapEdge, NodeType } from '../types';

export class MapGenerator {
    // 💡 1단계에서 만들었던 고정 맵 (혹시 모를 UI 테스트용으로 보존)
    static generateTestMap(): IMapData { 
        /* 기존 코드 생략 가능하지만 놔두셔도 무방합니다. */ 
        return { act: 1, theme: { backgroundKey: '', nodeColors: {} as any, lineColor: 0, activeLineColor: 0 }, nodes: [], edges: [] };
    }

    // 💡 2단계: 스팀 가이드 기반 절차적 랜덤 맵 생성 알고리즘
    static generateProceduralMap(act: number): IMapData {
        const WIDTH = 7;
        const HEIGHT = 15; // 0층(START) ~ 14층(BOSS)
        const nodesMap: Map<string, IMapNode> = new Map();
        const edges: IMapEdge[] = [];

        // 1. 길잡이(Walker) 6개 출발 지점(X좌표) 세팅
        let paths: number[] = [];
        for (let i = 0; i < 6; i++) paths.push(Math.floor(Math.random() * WIDTH));
        
        // 최소 2개 이상의 다른 출발점을 갖도록 보정
        while (paths[0] === paths[1]) paths[1] = Math.floor(Math.random() * WIDTH);
        paths.sort((a, b) => a - b); // 경로 교차를 막기 위해 X좌표 순으로 정렬

        const getNodeId = (x: number, y: number) => `n_${y}_${x}`;

        // 0층(START) 노드 생성
        paths.forEach(x => {
            const id = getNodeId(x, 0);
            if (!nodesMap.has(id)) {
                nodesMap.set(id, { id, type: 'START', floor: 0, xRatio: (x + 1) / (WIDTH + 1) });
            }
        });

        // 2. 길잡이들을 13층까지 한 칸씩 위로 전진시키며 선 긋기
        for (let y = 0; y < HEIGHT - 2; y++) {
            let nextPaths: number[] = [];
            for (let i = 0; i < 6; i++) {
                let currentX = paths[i];
                
                // 위로 올라갈 때 갈 수 있는 X좌표 (왼쪽 대각선, 직진, 오른쪽 대각선)
                let minX = Math.max(0, currentX - 1);
                let maxX = Math.min(WIDTH - 1, currentX + 1);

                // 💡 핵심: 경로 교차(선 꼬임) 방지 로직
                if (i > 0) minX = Math.max(minX, nextPaths[i - 1]);
                if (i < 5) maxX = Math.min(maxX, paths[i + 1] + 1);

                const validOptions = [];
                for (let nx = minX; nx <= maxX; nx++) validOptions.push(nx);
                const nextX = validOptions[Math.floor(Math.random() * validOptions.length)];
                nextPaths.push(nextX);

                const fromId = getNodeId(currentX, y);
                const toId = getNodeId(nextX, y + 1);

                // 노드 추가 (일단 모두 BATTLE로 임시 지정)
                if (!nodesMap.has(toId)) {
                    nodesMap.set(toId, { id: toId, type: 'BATTLE', floor: y + 1, xRatio: (nextX + 1) / (WIDTH + 1) });
                }

                // 선(Edge) 긋기
                if (!edges.some(e => e.from === fromId && e.to === toId)) {
                    edges.push({ from: fromId, to: toId });
                }
            }
            paths = nextPaths; // 다음 층으로 업데이트
        }

        // 3. 14층(보스) 노드 생성 및 마지막 층 선 합치기
        const bossId = 'n_14_3'; // 정중앙
        nodesMap.set(bossId, { id: bossId, type: 'BOSS', floor: 14, xRatio: 0.5 });
        paths.forEach(x => {
            const fromId = getNodeId(x, HEIGHT - 2);
            if (!edges.some(e => e.from === fromId && e.to === bossId)) {
                edges.push({ from: fromId, to: bossId });
            }
        });

        // 4. 스팀 가이드 룰에 따라 방 종류(Type) 할당
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
        // 스팀 가이드 확률 (Monster 45%, Event 22%, Elite 16%, Rest 12%, Shop 5%)
        const weights = [
            { type: 'BATTLE' as NodeType, w: 45 },
            { type: 'EVENT' as NodeType, w: 22 },
            { type: 'ELITE' as NodeType, w: 16 },
            { type: 'REST' as NodeType, w: 12 },
            { type: 'SHOP' as NodeType, w: 5 }
        ];

        // 1층부터 13층까지만 종류를 바꿈 (0층은 START, 14층은 BOSS)
        for (let y = 1; y < height - 1; y++) {
            const floorNodes = Array.from(nodesMap.values()).filter(n => n.floor === y);
            
            floorNodes.forEach(node => {
                const parents = edges.filter(e => e.to === node.id).map(e => nodesMap.get(e.from)!);
                // 부모를 공유하는 형제 노드들 (갈림길)
                const siblings = edges.filter(e => parents.some(p => p.id === e.from) && e.to !== node.id).map(e => nodesMap.get(e.to)!);

                let available = [...weights];

                // 💡 제약 1: 5층 이하에서는 엘리트와 모닥불 등장 불가
                if (y < 5) {
                    available = available.filter(w => w.type !== 'ELITE' && w.type !== 'REST');
                }

                // 💡 제약 2: 보스 직전 층(13층)에서는 모닥불 등장 불가 (보통 14층이 보스면, 그 전 고정 모닥불 룰이 있으나 현재는 범용 룰 적용)
                if (y === height - 2) {
                    available = available.filter(w => w.type !== 'REST');
                }

                // 💡 제약 3: 엘리트, 상점, 모닥불은 2번 연속 등장 불가
                const banConsecutive = ['ELITE', 'SHOP', 'REST'];
                parents.forEach(p => {
                    if (banConsecutive.includes(p.type)) {
                        available = available.filter(w => w.type !== p.type);
                    }
                });

                // 💡 제약 4: 갈림길(형제 노드)끼리는 서로 같은 노드가 나올 수 없음
                siblings.forEach(s => {
                    if (s.type !== 'BATTLE') { // 일반 전투는 중복 허용
                        available = available.filter(w => w.type !== s.type);
                    }
                });

                // 만약 모든 조건 때문에 넣을 노드가 없다면 강제로 전투 노드 배정
                if (available.length === 0) available = [{ type: 'BATTLE', w: 100 }];

                // 가중치(확률)에 기반한 랜덤 뽑기
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