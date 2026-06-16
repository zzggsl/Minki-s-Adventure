import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { TopBar } from '../ui/TopBar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SettingsManager } from '../managers/SettingsManager';

export default class MapScene extends Phaser.Scene {
    private topBar!: TopBar;

    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 💡 1. TopBar 공통 컴포넌트 생성 및 이벤트 연결
        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => this.openDeckModal(),
            onSettingsClick: () => this.openSettingsModal()
        });

        // 💡 2. TopBar에 현재 게임 상태 주입 (데이터 주도 렌더링)
        this.topBar.refresh({
            hp: GameState.player.hp,
            maxHp: GameState.player.maxHp,
            floor: GameState.floor
        });

        // 배경 타이틀 텍스트
        this.add.text(width / 2, 200, '다음 목적지를 선택하세요', { 
            fontSize: '48px', color: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 💡 3. 맵 노드 생성 (현재는 임시로 일반 전투 노드 1개만 배치)
        this.createNode(width / 2, height / 2, '⚔️ 일반 전투', 0x882222, () => {
            this.scene.start('BattleScene');
        });
    }

    // 맵 노드를 그리는 함수 (추후 아이콘/스프라이트로 교체 가능)
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
            this.sound.play('map_node'); // 맵 이동 효과음
            onClick();
        });
    }

    // 💡 4. 덱 확인 모달 창 띄우기
    private openDeckModal() {
        const modal = new Modal({
            scene: this,
            title: `내 덱 (총 ${GameState.masterDeck.length}장)`,
            width: 1000,
            height: 800
        });

        // 현재 덱의 카드 이름을 리스트 형태로 나열
        let yOffset = -200;
        GameState.masterDeck.forEach((card, index) => {
            const cardText = this.add.text(0, yOffset, `${index + 1}. ${card.name} (비용: ${card.cost}) - ${card.desc}`, {
                fontSize: '32px', color: '#ffffff'
            }).setOrigin(0.5);
            modal.contentContainer.add(cardText);
            yOffset += 50;
        });
    }

    // 💡 5. 설정 모달 창 띄우기 (MenuScene과 동일)
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
