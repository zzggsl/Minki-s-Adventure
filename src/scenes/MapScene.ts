// src/scenes/MapScene.ts
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { MapGenerator } from '../managers/MapGenerator';
import { TopBar } from '../ui/TopBar';
import { DeckModal } from '../ui/modals/DeckModal';
import { SettingsModal } from '../ui/modals/SettingsModal';

export default class MapScene extends Phaser.Scene {
    private topBar!: TopBar;
    private mapContainer!: Phaser.GameObjects.Container;
    
    // 스크롤 제어용 변수
    private isDragging = false;
    private dragStartY = 0;
    private cameraStartY = 0;

    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. 맵 데이터가 없다면 생성 (새 게임 진입 시)
        if (!GameState.currentMap) {
            GameState.currentMap = MapGenerator.generateProceduralMap(1); 
            
            // 첫 진입 시 START 노드 모두 활성화
            const startNodes = GameState.currentMap.nodes.filter(n => n.type === 'START');
            GameState.playableNodeIds = startNodes.map(n => n.id);
        }

        // 2. 상단 고정 UI 렌더링
        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => new DeckModal(this, `마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck),
            onSettingsClick: () => new SettingsModal(this)
        });
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor });
        this.topBar.setScrollFactor(0); // 상단바 화면 고정

        // 3. 맵 컨테이너 생성
        this.mapContainer = this.add.container(0, 0);
        this.drawMap(width, height);

        // 4. 모바일 터치 드래그(스크롤) 로직 구현
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.isDragging = true;
            this.dragStartY = pointer.y;
            this.cameraStartY = this.cameras.main.scrollY;
        });

        this.input.on('pointerup', () => { this.isDragging = false; });
        this.input.on('pointerout', () => { this.isDragging = false; });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging) {
                const deltaY = pointer.y - this.dragStartY;
                this.cameras.main.scrollY = this.cameraStartY - deltaY;
            }
        });
    }

    private drawMap(screenWidth: number, screenHeight: number) {
        const mapData = GameState.currentMap!;
        const floorHeight = 250; // 층간 간격
        const totalMapHeight = floorHeight * 16; // 전체 지도 총 높이 계산 (약 4000px)
        const startY = screenHeight * 0.8; // START 노드의 화면 하단 Y 위치

        // 💡 [핵심: 나인 슬라이스 배경 추가] 
        // 에셋(`map_bg`)이 메모리에 로드되어 있다면, 늘려도 모서리가 깨지지 않는 두루마리 지도를 생성합니다.
        if (this.textures.exists('map_bg')) {
            const bg = this.add.nineslice(
                screenWidth / 2, 
                startY - (totalMapHeight / 2) + 100, // 지도의 정중앙 Y축 좌표 계산
                'map_bg', 
                undefined, // 프레임 지정을 사용하지 않으므로 undefined
                screenWidth, 
                totalMapHeight + 300, // 위아래 여백을 위해 전체 높이보다 살짝 더 길게 주축 조정
                60, 60, 60, 60 // 💡 중요: 이미지 모서리에서 안쪽으로 몇 픽셀(나무 테두리 두께)을 보호할 것인가 (Left, Right, Top, Bottom)
            );
            // 맵 컨테이너에 가장 먼저 추가하여 선과 노드 밑에 깔리도록 책임 분리
            this.mapContainer.add(bg);
        }

        const edgeGraphics = this.add.graphics(); // 선을 그릴 객체
        this.mapContainer.add(edgeGraphics);

        // 노드의 (X, Y) 픽셀 좌표를 계산하는 헬퍼 함수
        const getPos = (node: any) => ({
            x: screenWidth * node.xRatio,
            y: startY - (node.floor * floorHeight)
        });

        // 1. 선(Edge) 그리기
        mapData.edges.forEach(edge => {
            const fromNode = mapData.nodes.find(n => n.id === edge.from);
            const toNode = mapData.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return;

            const fromPos = getPos(fromNode);
            const toPos = getPos(toNode);

            const isPassed = GameState.visitedNodeIds.includes(edge.from) && GameState.visitedNodeIds.includes(edge.to);
            const isPlayablePath = GameState.currentNodeId === edge.from && GameState.playableNodeIds.includes(edge.to);
            const color = (isPassed || isPlayablePath) ? mapData.theme.activeLineColor : mapData.theme.lineColor;
            
            edgeGraphics.lineStyle(6, color, 0.6); 
            edgeGraphics.beginPath();
            edgeGraphics.moveTo(fromPos.x, fromPos.y);
            edgeGraphics.lineTo(toPos.x, toPos.y);
            edgeGraphics.strokePath();
        });

        // 2. 노드 그리기
        mapData.nodes.forEach(node => {
            const pos = getPos(node);
            const isPlayable = GameState.playableNodeIds.includes(node.id);
            const isVisited = GameState.visitedNodeIds.includes(node.id);
            const isCurrent = GameState.currentNodeId === node.id;
            
            // 유색 배경 원형을 투명화(Alpha: 0)하여 영역만 잡고, 테두리용 링 연출만 남겨둡니다.
            const circle = this.add.circle(pos.x, pos.y, 45, 0x000000, 0); 
            
            if (isCurrent) {
                circle.setStrokeStyle(6, 0xffffff); // 현재 위치 링
            } else if (isPlayable) {
                circle.setStrokeStyle(6, 0xffff00); // 갈 수 있는 곳 활성화 노란 링
            }

            if (isVisited) circle.setAlpha(0.3);
            this.mapContainer.add(circle);

            // 아이콘 이미지 배치
            if (node.type !== 'START' && node.type !== 'BOSS') {
                const textureKey = `node_${node.type.toLowerCase()}`;
                
                if (this.textures.exists(textureKey)) {
                    const icon = this.add.sprite(pos.x, pos.y, textureKey);
                    icon.setDisplaySize(85, 85); // 아이콘 크기 시원하게 확대

                    if (isVisited) {
                        icon.setAlpha(0.3); 
                    } else if (!isPlayable && !isCurrent) {
                        icon.setAlpha(0.6); // 아직 갈 수 없는 먼 미래 노드는 살짝 어둡게
                    }
                    this.mapContainer.add(icon);
                }
            } else {
                const label = this.add.text(pos.x, pos.y, node.type, {
                    fontSize: '24px', color: '#fff', fontStyle: 'bold'
                }).setOrigin(0.5);
                if (isVisited) label.setAlpha(0.3);
                this.mapContainer.add(label);
            }

            // 클릭 이벤트 및 모바일 드래그 판정 보정
            if (isPlayable) {
                circle.setInteractive();
                circle.on('pointerdown', () => {
                    if (this.isDragging && Math.abs(this.input.activePointer.y - this.dragStartY) > 10) return; 
                    this.handleNodeClick(node);
                });
            }
        });
    }

    private handleNodeClick(node: any) {
        this.sound.play('click');
        
        if (GameState.currentNodeId && !GameState.visitedNodeIds.includes(GameState.currentNodeId)) {
            GameState.visitedNodeIds.push(GameState.currentNodeId);
        }
        GameState.currentNodeId = node.id;
        
        const nextEdges = GameState.currentMap!.edges.filter(e => e.from === node.id);
        GameState.playableNodeIds = nextEdges.map(e => e.to);

        if (node.type === 'START' || node.type === 'REST' || node.type === 'EVENT' || node.type === 'TREASURE') {
            this.scene.restart(); 
        } else {
            this.scene.start('BattleScene');
        }
    }
}