import Phaser from 'phaser';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    text: string;
    variant?: ButtonVariant;
    width?: number;
    height?: number;
    fontSize?: string;
    onClick: () => void;
}

export class Button extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;
    private variant: ButtonVariant;
    
    // Variant 별 색상 테마 정의
    private colors = {
        primary: { default: 0x3a7bd5, hover: 0x5a9be5, down: 0x2a5ba5, text: '#ffffff' }, // 파란색 기본
        secondary: { default: 0x555555, hover: 0x777777, down: 0x333333, text: '#ffffff' }, // 회색 (턴 종료 등)
        danger: { default: 0xd53a3a, hover: 0xe55a5a, down: 0xa52a2a, text: '#ffffff' }     // 빨간색 (포기, 삭제 등)
    };

    constructor(config: ButtonConfig) {
        super(config.scene, config.x, config.y);
        
        this.variant = config.variant || 'secondary';
        const width = config.width || 240;
        const height = config.height || 80;
        const theme = this.colors[this.variant];

        // 1. 배경 사각형 생성
        this.bg = config.scene.add.rectangle(0, 0, width, height, theme.default);
        this.bg.setStrokeStyle(4, 0xffffff);

        // 2. 텍스트 생성
        this.label = config.scene.add.text(0, 0, config.text, {
            fontSize: config.fontSize || '36px',
            color: theme.text,
            fontStyle: 'bold',
            padding: { left: 10, right: 10, top: 15, bottom: 15 } // 💡 추가: 텍스트 잘림 방지 패딩
        }).setOrigin(0.5);

        // 3. 컨테이너에 추가 및 Scene에 등록
        this.add([this.bg, this.label]);
        this.setSize(width, height);
        config.scene.add.existing(this);

        // 4. 인터랙션 설정
        this.setInteractive();
        this.setupEvents(config.onClick);
    }

    private setupEvents(onClick: () => void) {
        const theme = this.colors[this.variant];

        this.on('pointerover', () => {
            this.bg.fillColor = theme.hover;
            this.scene.tweens.add({ targets: this, scale: 1.05, duration: 100 }); // 살짝 확대
        });

        this.on('pointerout', () => {
            this.bg.fillColor = theme.default;
            this.scene.tweens.add({ targets: this, scale: 1, duration: 100 }); // 원상복구
        });

        this.on('pointerdown', () => {
            this.bg.fillColor = theme.down;
            this.scene.tweens.add({ targets: this, scale: 0.95, duration: 50 }); // 눌리는 연출
        });

        this.on('pointerup', () => {
            this.bg.fillColor = theme.hover;
            this.scene.tweens.add({ targets: this, scale: 1.05, duration: 50 });
            this.scene.sound.play('click'); // 💡 공통 클릭음 통합
            onClick();
        });
    }

    // 💡 동적으로 텍스트를 바꿀 수 있는 기능 (예: '1턴 종료' -> '2턴 종료')
    public setText(newText: string) {
        this.label.setText(newText);
    }
}
