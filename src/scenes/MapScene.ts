import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { TopBar } from '../ui/TopBar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SettingsManager } from '../managers/SettingsManager';
import type { ICardData } from '../types';

export default class MapScene extends Phaser.Scene {
    private topBar!: TopBar;

    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // TopBar 공통 컴포넌트 생성 및 이벤트 연결
        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => this.openDeckModal(),
            onSettingsClick: () => this.openSettingsModal()
        });

        // TopBar에 현재 게임 상태 주입
        this.topBar.refresh({
            hp: GameState.player.hp,
            maxHp: GameState.player.maxHp,
            floor: GameState.floor
        });

        this.add.text(width / 2, 200, '다음 목적지를 선택하세요', { 
            fontSize: '48px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 맵 노드 생성
        this.createNode(width / 2, height / 2, '⚔️ 일반 전투', 0x882222, () => {
            this.scene.start('BattleScene');
        });
    }

    // 맵 노드를 그리는 함수
    private createNode(x: number, y: number, label: string, color: number, onClick: () => void) {
        const circle = this.add.circle(x, y, 100, color).setInteractive();
        circle.setStrokeStyle(6, 0xffffff);
        
        this.add.text(x, y, label, { 
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        circle.on('pointerover', () => {
            circle.setStrokeStyle(10, 0xffdd00);
            this.tweens.add({ targets: circle, scale: 1.1, duration: 100 });
        });

        circle.on('pointerout', () => {
            circle.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: circle, scale: 1, duration: 100 });
        });

        circle.on('pointerdown', () => circle.fillColor = 0x550000);
        
        circle.on('pointerup', () => {
            circle.fillColor = color;
            this.sound.play('map_node'); 
            onClick();
        });
    }

    // 시각적 덱 확인 모달 창 띄우기
    private openDeckModal() {
        const modal = new Modal({
            scene: this,
            title: `내 덱 (총 ${GameState.masterDeck.length}장)`,
            width: 1800, 
            height: 1200
        });

        const content = modal.contentContainer;
        const cols = 6;              
        const cardScale = 0.8;      
        const cellW = 270 * cardScale + 30; 
        const cellH = 390 * cardScale + 40; 
        const startX = -((cols - 1) * cellW) / 2; 
        const startY = -250;         

        GameState.masterDeck.forEach((cardData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            const x = startX + (col * cellW);
            const y = startY + (row * cellH);

            const cardView = this.createVisualCard(0, 0, cardData);
            cardView.setScale(cardScale);
            
            const cardWrapper = this.add.container(x, y, [cardView]);
            content.add(cardWrapper);
        });
    }

    // 시각적 카드 뷰 생성 (모달 전용)
    private createVisualCard(x: number, y: number, cardData: ICardData): Phaser.GameObjects.Container {
        const cardWidth = 260;
        const cardHeight = 380;
        
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);
        
        const nameText = this.add.text(0, -130, cardData.name, { 
            fontSize: '38px', color: '#000', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        const costBg = this.add.sprite(-90, -145, 'energy').setScale(0.7);
        const costText = this.add.text(-90, -145, cardData.cost.toString(), { 
            fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);
        
        const descText = this.add.text(0, 20, cardData.desc, { 
            fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }
        }).setOrigin(0.5);

        return this.add.container(x, y, [bg, nameText, costBg, costText, descText]);
    }

    // 설정 모달 창 띄우기
    private openSettingsModal() {
        const modal = new Modal({
            scene: this, title: '환경 설정', width: 800, height: 600
        });

        const content = modal.contentContainer;
        const modeText = this.add.text(0, -50, `현재 UI 모드: ${SettingsManager.settings.forceUIMode}`, {
            fontSize: '40px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        content.add(modeText);

        const autoBtn = new Button({
            scene: this, x: -220, y: 50, text: '자동 감지', variant: 'secondary', width: 180, height: 60, fontSize: '28px',
            onClick: () => { SettingsManager.setForceUIMode('auto'); modeText.setText(`현재 UI 모드: auto`); }
        });
        const pcBtn = new Button({
            scene: this, x: 0, y: 50, text: 'PC 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px',
            onClick: () => { SettingsManager.setForceUIMode('pc'); modeText.setText(`현재 UI 모드: pc`); }
        });
        const mobileBtn = new Button({
            scene: this, x: 220, y: 50, text: '모바일 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px',
            onClick: () => { SettingsManager.setForceUIMode('mobile'); modeText.setText(`현재 UI 모드: mobile`); }
        });

        content.add([autoBtn, pcBtn, mobileBtn]);
    }
}
