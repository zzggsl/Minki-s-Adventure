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

        if (!GameState.currentMap) {
            GameState.currentMap = MapGenerator.generateProceduralMap(1); 
            
            const startNodes = GameState.currentMap.nodes.filter(n => n.type === 'START');
            GameState.playableNodeIds = startNodes.map(n => n.id);
        }

        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => new DeckModal(this, `마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck),
            onSettingsClick: () => new SettingsModal(this)
        });
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor });
        this.topBar.setScrollFactor(0); 

        this.mapContainer = this.add.container(0, 0);
        this.drawMap(width, height);

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
        const floorHeight = 180; 
        const totalMapHeight = floorHeight * 16; 
        const startY = screenHeight * 0.8; 

        // 💡 [문제 해결 3 적용] 화질 저하가 없는 무한 타일링(도배) 방식!
        // 가운데 종이 조각(map_paper)을 가져와서 가로세로로 계속 이어 붙여 4000px짜리 거대한 고화질 배경을 만듭니다.
        if (this.textures.exists('map_paper')) {
            const bg = this.add.tileSprite(
                screenWidth / 2, 
                startY - (totalMapHeight / 2) + 100, 
                screenWidth, 
                totalMapHeight + 300, 
                'map_paper' 
            );
            this.mapContainer.add(bg);
        }

        const edgeGraphics = this.add.graphics();
        this.mapContainer.add(edgeGraphics);

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
            
            const circle = this.add.circle(pos.x, pos.y, 45, 0x000000, 1); 
            
            if (isCurrent) {
                circle.setStrokeStyle(6, 0xffffff);
            } else if (isPlayable) {
                circle.setStrokeStyle(6, 0xffff00);
            }

            if (isVisited) circle.setAlpha(0.3);
            this.mapContainer.add(circle);

            if (node.type !== 'START' && node.type !== 'BOSS') {
                const textureKey = `node_${node.type.toLowerCase()}`;
                
                if (this.textures.exists(textureKey)) {
                    const icon = this.add.sprite(pos.x, pos.y, textureKey);
                    icon.setDisplaySize(110, 110); 

                    if (isVisited) {
                        icon.setAlpha(0.3); 
                    } else if (!isPlayable && !isCurrent) {
                        icon.setAlpha(0.6); 
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