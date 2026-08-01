// src/scenes/MapScene.ts
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { MapGenerator } from '../managers/MapGenerator';
import { TopBar } from '../ui/TopBar';
import { DeckModal } from '../ui/modals/DeckModal';
import { SettingsModal } from '../ui/modals/SettingsModal';
import { EnemyFactory } from '../managers/EnemyFactory'; // 💡 import 문은 반드시 맨 위에!
import { SaveSystem } from '../systems/SaveSystem';
import type { IMapNode } from '../types';

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

        // 💡 맵으로 돌아올 때마다(전투 승리 후, 노드 이동 후 등) 자동 저장
        SaveSystem.saveGame();

        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => new DeckModal(this, `마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck),
            onSettingsClick: () => new SettingsModal(this)
        });
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor, gold: GameState.player.gold });
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

        if (this.textures.exists('map_paper')) {
            const bg = this.add.tileSprite(
                screenWidth / 2, 
                startY - (totalMapHeight / 2) + 100, 
                screenWidth, 
                totalMapHeight + 300, 
                'map_paper' 
            );
            bg.setDepth(0); 
            this.mapContainer.add(bg);
        }

        const edgeGraphics = this.add.graphics();
        edgeGraphics.setDepth(1); 
        this.mapContainer.add(edgeGraphics);

        const getPos = (node: IMapNode) => ({
            x: screenWidth * node.xRatio,
            y: startY - (node.floor * floorHeight)
        });

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

        mapData.nodes.forEach(node => {
            const pos = getPos(node);
            const isPlayable = GameState.playableNodeIds.includes(node.id);
            const isVisited = GameState.visitedNodeIds.includes(node.id);
            const isCurrent = GameState.currentNodeId === node.id;
            
            const clickArea = this.add.circle(pos.x, pos.y, 45, 0x000000, 0); 
            clickArea.setDepth(3); 

            if (isCurrent) {
                clickArea.setStrokeStyle(6, 0xffffff); 
            } else if (isPlayable) {
                clickArea.setStrokeStyle(6, 0xffff00); 
            }
            this.mapContainer.add(clickArea);

            if (node.type !== 'START' && node.type !== 'BOSS') {
                const textureKey = `node_${node.type.toLowerCase()}`;
                
                if (this.textures.exists(textureKey)) {
                    const icon = this.add.sprite(pos.x, pos.y, textureKey);
                    icon.setDisplaySize(115, 115); 
                    icon.setDepth(2); 

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
                label.setDepth(2);
                if (isVisited) label.setAlpha(0.3);
                this.mapContainer.add(label);
            }

            if (isPlayable) {
                clickArea.setInteractive();
                clickArea.on('pointerdown', () => {
                    if (this.isDragging && Math.abs(this.input.activePointer.y - this.dragStartY) > 10) return; 
                    this.handleNodeClick(node);
                });
            }
        });
    }

    private handleNodeClick(node: IMapNode) {
        this.sound.play('click');
        
        if (GameState.currentNodeId && !GameState.visitedNodeIds.includes(GameState.currentNodeId)) {
            GameState.visitedNodeIds.push(GameState.currentNodeId);
        }
        GameState.currentNodeId = node.id;
        GameState.floor = node.floor; 
        
        const nextEdges = GameState.currentMap!.edges.filter(e => e.from === node.id);
        GameState.playableNodeIds = nextEdges.map(e => e.to);

        switch (node.type) {
            // 💡 팩토리 연동: 전투 노드 진입 시 적을 생성하여 GameState에 주입!
            case 'BATTLE':
            case 'ELITE':
            case 'BOSS':
                GameState.enemy = EnemyFactory.generateBattleEnemy({
                    floor: GameState.floor,
                    type: node.type
                });
                this.scene.start('BattleScene');
                break;

            case 'REST':
                this.scene.start('RestScene');
                break;

            case 'TREASURE':
                this.scene.start('TreasureScene');
                break;

            case 'EVENT':
                this.scene.start('EventScene');
                break;

            case 'SHOP':
                this.scene.start('ShopScene');
                break;

            // START 등 별도 화면이 없는 노드는 맵에 머무른다
            default:
                this.scene.restart();
                break;
        }
    }
}