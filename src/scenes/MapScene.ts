import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { SaveSystem } from '../systems/SaveSystem';

export default class MapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MapScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 💡 메인 메뉴에서 덱 로딩 및 초기화를 담당하므로, 여기서는 맵 진입 시 무조건 자동 저장만 합니다.
        SaveSystem.saveGame();

        // 배경 텍스트 (아이패드 해상도에 맞춘 큼직한 폰트)
        this.add.text(width / 2, 150, `현재 층: ${GameState.floor}층`, { 
            fontSize: '60px', 
            color: '#ffffff', 
            fontStyle: 'bold',
            padding: { top: 20, bottom: 20 } 
        }).setOrigin(0.5);

        this.add.text(width / 2, 250, '다음 노드를 선택하세요', { 
            fontSize: '40px', 
            color: '#aaaaaa',
            padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);

        // 전투 노드 생성
        this.createNode(width / 2, height / 2, '일반 전투', 0x8b0000, () => {
            this.scene.start('BattleScene');
        });
    }

    // MapScene.ts 내부의 createNode 함수 교체
    createNode(x: number, y: number, label: string, color: number, onClick: () => void) {
        const circle = this.add.circle(x, y, 150, color).setInteractive();
        circle.setStrokeStyle(8, 0xffffff);
        
        this.add.text(x, y, label, { 
            fontSize: '45px', color: '#ffffff', fontStyle: 'bold', padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);

        circle.on('pointerdown', () => {
            circle.fillColor = 0x550000; 
        });

        circle.on('pointerup', () => {
            circle.fillColor = color;
            this.sound.play('map_node'); // 💡 노드 클릭음 재생
            onClick();
        });
    }
}