import Phaser from 'phaser';
import { Button } from './Button';

// 💡 씬에서 TopBar를 생성할 때 전달해야 할 버튼 클릭 이벤트들
export interface TopBarConfig {
    scene: Phaser.Scene;
    onDeckClick: () => void;
    onSettingsClick: () => void;
}

// 💡 TopBar가 화면을 갱신하기 위해 외부에서 주입받아야 할 데이터
export interface TopBarData {
    hp: number;
    maxHp: number;
    floor: number;
    gold?: number;
}

export class TopBar extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private hpText: Phaser.GameObjects.Text;
    private floorText: Phaser.GameObjects.Text;
    private goldText: Phaser.GameObjects.Text;
    
    private deckButton: Button;
    private settingsButton: Button;

    constructor(config: TopBarConfig) {
        super(config.scene, 0, 0); // 기준점 (0,0)

        const screenW = config.scene.cameras.main.width;
        const barHeight = 80;

        // 1. 상단 배경 바
        this.bg = config.scene.add.rectangle(screenW / 2, barHeight / 2, screenW, barHeight, 0x222222);
        this.bg.setStrokeStyle(4, 0x555555);

        // 2. 왼쪽 정보 텍스트 (층수, 체력)
        this.floorText = config.scene.add.text(40, barHeight / 2, '층수: -', {
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            padding: { top: 15, bottom: 15 } // 💡 추가
        }).setOrigin(0, 0.5);

        this.hpText = config.scene.add.text(250, barHeight / 2, 'HP: - / -', {
            fontSize: '32px', color: '#ffaaaa', fontStyle: 'bold',
            padding: { top: 15, bottom: 15 } // 💡 추가
        }).setOrigin(0, 0.5);

        this.goldText = config.scene.add.text(600, barHeight / 2, '💰 0', {
            fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
            padding: { top: 15, bottom: 15 }
        }).setOrigin(0, 0.5);

        // 3. 오른쪽 버튼들 (미리 만들어둔 Button 클래스 재사용!)
        this.settingsButton = new Button({
            scene: config.scene,
            x: screenW - 100,
            y: barHeight / 2,
            text: '⚙️ 설정',
            variant: 'secondary',
            width: 140,
            height: 50,
            fontSize: '28px',
            onClick: config.onSettingsClick
        });

        this.deckButton = new Button({
            scene: config.scene,
            x: screenW - 270,
            y: barHeight / 2,
            text: '🃏 덱 보기',
            variant: 'primary',
            width: 160,
            height: 50,
            fontSize: '28px',
            onClick: config.onDeckClick
        });

        // 4. 컴포넌트 조립
        this.add([this.bg, this.floorText, this.hpText, this.goldText, this.settingsButton, this.deckButton]);

        // 5. 씬에 등록하고 항상 맨 위에 보이도록 심도(Depth) 설정
        config.scene.add.existing(this);
        this.setDepth(1000); 
    }

    /**
     * 외부(Scene)에서 게임의 최신 상태 데이터를 던져주면 화면을 갱신합니다.
     */
    public refresh(data: TopBarData) {
        this.floorText.setText(`층수: ${data.floor}`);
        this.hpText.setText(`HP: ${data.hp} / ${data.maxHp}`);
        this.goldText.setText(`💰 ${data.gold ?? 0}`);
    }
}
