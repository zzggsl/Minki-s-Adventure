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
    
    private isDragging = false;
    private dragStartY = 0;
    private cameraStartY = 0;

    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 맵 데이터가 없다면 슬더슬 2 절차적 맵 생성
        if (!GameState.currentMap) {
            GameState.currentMap = MapGenerator.generateProceduralMap(1); 
            
            // 첫 진입 시 START 노드 활성화 및 추적 동기화
            const startNodes = GameState.currentMap.nodes.filter(n => n.type === 'START');
            GameState.playableNodeIds = startNodes.map(n => n.id);
        }

        // 상단바 고정 렌더링
        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => new DeckModal(this, `마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck),
            onSettingsClick: () => new SettingsModal(this)
        });
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor });
        this.topBar.setScrollFactor(0); 

        this.mapContainer = this.add.container(0, 0);
        this.drawMap(width, height);

        // 드래그 제어 스크롤 바인딩
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
        
        // 💡 [문제 해결 2] 경로 간격 단축: 노드 간 Y축 스페이스 배치를 180으로 단축하여 촘촘하게 설계
        const floorHeight = 180; 
        const totalMapHeight = floorHeight * 16; 
        const startY = screenHeight * 0.8; 

        // 무한 타일링 배경 적재
        if (this.textures.exists('map_paper')) {
            const bg = this.add.tileSprite(
                screenWidth / 2, 
                startY - (totalMapHeight / 2) + 100, 
                screenWidth, 
                totalMapHeight + 300, 
                'map_paper' 
            );
            bg.setDepth(0); // 가장 아래 레이어 배치
            this.mapContainer.add(bg);
        }

        const edgeGraphics = this.add.graphics();
        edgeGraphics.setDepth(1); // 💡 [문제 해결 1] 선을 노드 아이콘 그룹보다 한 단계 낮게 레이어 배치
        this.mapContainer.add(edgeGraphics);

        const getPos = (node: any) => ({
            x: screenWidth * node.xRatio,
            y: startY - (node.floor * floorHeight)
        });

        // 1. 연결선 그리기
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
            
            // 💡 [문제 해결 1] 검은색 원형 도형을 완전히 삭제했습니다.
            // 대신 터치 타겟 역할을 할 투명한 감지 영역 인터랙티브용 원형만 가볍게 생성합니다.
            const clickArea = this.add.circle(pos.x, pos.y, 45, 0x000000, 0); 
            clickArea.setDepth(3); // 터치 레이어는 최상단으로

            if (isCurrent) {
                clickArea.setStrokeStyle(6, 0xffffff); // 현재 위치 링 테두리 유지
            } else if (isPlayable) {
                clickArea.setStrokeStyle(6, 0xffff00); // 갈 수 있는 경로 테두리 유니온
            }
            this.mapContainer.add(clickArea);

            // 아이콘 이미지 배치 및 스케일 제어
            if (node.type !== 'START' && node.type !== 'BOSS') {
                const textureKey = `node_${node.type.toLowerCase()}`;
                
                if (this.textures.exists(textureKey)) {
                    const icon = this.add.sprite(pos.x, pos.y, textureKey);
                    // 💡 [문제 해결 1] 아이콘 크기를 가로세로 115x115 픽셀로 대폭 확대
                    icon.setDisplaySize(115, 115); 
                    icon.setDepth(2); // 연결선(Depth 1) 보다 위층에 오게 만듦으로써 선 가림 자동 처리!

                    if (isVisited) {
                        icon.setAlpha(0.3); 
                    } else if (!isPlayable && !isCurrent) {
                        icon.setAlpha(0.6); // 먼 미래 구역은 반투명 처리
                    }
                    this.mapContainer.add(icon);
                }
            } else {
                const label = this.add.text(pos.x, pos.y, node.type, {
                    fontSize: '24px', color: '#fff', fontStyle: 'bold'
                }).setOrigin(0.5);
                label.setDepth(2);
                if (isVisited) label.setAlpha(0.3);
                this.mapContainer.add(label);
            }

            // 클릭 이벤트 핸들링 바인딩
            if (isPlayable) {
                clickArea.setInteractive();
                clickArea.on('pointerdown', () => {
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

        // 💡 [문제 해결 3] 1층 일반 배틀 클릭 시 정상 구동 검증 연동
        if (node.type === 'BATTLE' || node.type === 'ELITE' || node.type === 'BOSS') {
            this.scene.start('BattleScene');
        } else {
            // 아직 미구현인 이벤트, 상점, 휴식, 보물상자는 우선 씬 리스타트로 위치 이동 처리
            this.scene.restart(); 
        }
    }
}