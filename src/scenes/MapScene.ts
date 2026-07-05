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
            // 💡 고정 맵에서 -> 절차적 랜덤 맵 생성기로 단 한 줄 교체!
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
        
        // 💡 중요: 카메라는 스크롤되더라도 TopBar는 화면에 고정되게 만듦
        this.topBar.setScrollFactor(0);

        // 3. 맵 그리기
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
                // 손가락을 움직인 만큼 카메라를 반대로 이동시킴
                const deltaY = pointer.y - this.dragStartY;
                this.cameras.main.scrollY = this.cameraStartY - deltaY;
            }
        });
    }

    private drawMap(screenWidth: number, screenHeight: number) {
        const mapData = GameState.currentMap!;
        const edgeGraphics = this.add.graphics(); // 선을 그릴 객체
        this.mapContainer.add(edgeGraphics);

        const floorHeight = 250; // 층간 간격
        const startY = screenHeight * 0.8; // START 노드의 화면 하단 Y 위치

        // 노드의 (X, Y) 픽셀 좌표를 계산하는 헬퍼 함수
        const getPos = (node: any) => ({
            x: screenWidth * node.xRatio,
            y: startY - (node.floor * floorHeight)
        });

        // 1. 선(Edge) 먼저 그리기 (노드 밑에 깔리도록)
        mapData.edges.forEach(edge => {
            const fromNode = mapData.nodes.find(n => n.id === edge.from);
            const toNode = mapData.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return;

            const fromPos = getPos(fromNode);
            const toPos = getPos(toNode);

            // 지나온 길인지, 혹은 지금 갈 수 있는 길인지 판단
            const isPassed = GameState.visitedNodeIds.includes(edge.from) && GameState.visitedNodeIds.includes(edge.to);
            const isPlayablePath = GameState.currentNodeId === edge.from && GameState.playableNodeIds.includes(edge.to);
            const color = (isPassed || isPlayablePath) ? mapData.theme.activeLineColor : mapData.theme.lineColor;
            
            edgeGraphics.lineStyle(8, color, 1);
            edgeGraphics.beginPath();
            edgeGraphics.moveTo(fromPos.x, fromPos.y);
            edgeGraphics.lineTo(toPos.x, toPos.y);
            edgeGraphics.strokePath();
        });

        // src/scenes/MapScene.ts 내부 drawMap() 함수의 '2. 노드 그리기' 구간 수정

        // 2. 노드 그리기
        mapData.nodes.forEach(node => {
            const pos = getPos(node);
            const isPlayable = GameState.playableNodeIds.includes(node.id);
            const isVisited = GameState.visitedNodeIds.includes(node.id);
            const isCurrent = GameState.currentNodeId === node.id;
            const baseColor = mapData.theme.nodeColors[node.type];
            
            // 노드 기본 원형 베이스 배경 그림
            const circle = this.add.circle(pos.x, pos.y, 45, baseColor);
            
            // 상태에 따른 외곽선 하이라이트
            if (isCurrent) {
                circle.setStrokeStyle(8, 0xffffff); // 현재 밟고 있는 곳
            } else if (isPlayable) {
                circle.setStrokeStyle(6, 0xffff00); // 갈 수 있는 활성화 구역
            } else if (isVisited) {
                circle.setAlpha(0.4); // 이미 지나온 구역은 반투명화
            }

            this.mapContainer.add(circle);

            // 💡 텍스트를 제거하고 준비된 아이콘 이미지로 대체 렌더링
            // START와 BOSS는 연출용으로 텍스트를 남기거나 별도 처리할 수 있도록 분기 예외 처리
            if (node.type !== 'START' && node.type !== 'BOSS') {
                const textureKey = `node_${node.type.toLowerCase()}`; // 예: node_battle, node_treasure 등
                
                // 에셋이 정상 로드되었는지 확인 후 스프라이트 배치
                if (this.textures.exists(textureKey)) {
                    const icon = this.add.sprite(pos.x, pos.y, textureKey).setScale(0.8);
                    if (isVisited) icon.setAlpha(0.4); // 방문한 노드는 아이콘도 같이 흐리게
                    this.mapContainer.add(icon);
                }
            } else {
                // START, BOSS 노드는 기존처럼 텍스트 유지
                const label = this.add.text(pos.x, pos.y, node.type, {
                    fontSize: '20px', color: '#fff', fontStyle: 'bold'
                }).setOrigin(0.5);
                if (isVisited) label.setAlpha(0.4);
                this.mapContainer.add(label);
            }

            // 클릭 이벤트 및 드래그 보정 (기존 유지)
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
        
        // 방문 처리
        if (GameState.currentNodeId && !GameState.visitedNodeIds.includes(GameState.currentNodeId)) {
            GameState.visitedNodeIds.push(GameState.currentNodeId);
        }
        GameState.currentNodeId = node.id;
        
        // 💡 다음으로 갈 수 있는 노드 계산
        const nextEdges = GameState.currentMap!.edges.filter(e => e.from === node.id);
        GameState.playableNodeIds = nextEdges.map(e => e.to);

        // 노드 타입별 씬 이동
        if (node.type === 'START' || node.type === 'REST' || node.type === 'EVENT') {
            // 아직 구현 안 된 노드들은 단순히 맵을 리프레시하여 이동만 처리
            this.scene.restart(); 
        } else {
            // 전투(BATTLE), 엘리트, 보스는 전투 씬으로
            this.scene.start('BattleScene');
        }
    }
}