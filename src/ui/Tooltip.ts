import Phaser from 'phaser';

// 💡 다중 툴팁을 받기 위한 인터페이스
export interface TooltipItem {
    title: string;
    desc: string;
}

export class Tooltip extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private contentContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // 1. 툴팁 배경
        this.bg = scene.add.rectangle(0, 0, 450, 200, 0x111111, 0.95);
        this.bg.setStrokeStyle(4, 0x555555);
        this.bg.setOrigin(0, 0); 

        // 2. 텍스트들을 담을 내부 그릇
        this.contentContainer = scene.add.container(0, 0);

        // 3. 조립 및 초기화
        this.add([this.bg, this.contentContainer]);
        this.setVisible(false);
        this.setDepth(2000); // 💡 다른 어떤 UI보다 무조건 최상단
        scene.add.existing(this);
    }

    /**
     * 여러 개의 툴팁 아이템을 받아서 화면에 렌더링합니다.
     */
    public show(x: number, y: number, items: TooltipItem[]) {
        if (items.length === 0) return;

        this.contentContainer.removeAll(true);
        let currentY = 20;

        items.forEach(item => {
            const titleText = this.scene.add.text(25, currentY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 }
            });
            // 💡 수정됨: titleText의 패딩이 이미 있으므로 추가 높이를 뺌
            currentY += titleText.height; 

            const descText = this.scene.add.text(25, currentY, item.desc, {
                fontSize: '26px', color: '#ffffff', wordWrap: { width: 400 },
                lineSpacing: 8,
                padding: { top: 5, bottom: 5 }
            });
            // 💡 수정됨: 아이템 간 간격을 15px로 타이트하게 조절
            currentY += descText.height + 15; 

            this.contentContainer.add([titleText, descText]);
        });

        // 💡 수정됨: 배경 사각형의 불필요한 아래 여백 완벽 제거
        this.bg.height = currentY + 5;

        // 💡 수정됨: 고정 위치를 사용할 것이므로 마우스 오프셋(+20) 제거
        let targetX = x;
        let targetY = y;
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;

        if (targetX + this.bg.width > screenW) targetX = screenW - this.bg.width - 20;
        if (targetY + this.bg.height > screenH) targetY = screenH - this.bg.height - 20;

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}