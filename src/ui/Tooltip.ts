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

        // 기존에 그려진 텍스트 청소
        this.contentContainer.removeAll(true);

        let currentY = 20; // 텍스트를 그릴 시작 높이

        // 💡 아이템 개수만큼 반복하며 텍스트를 생성하여 아래로 쌓음
        items.forEach(item => {
            const titleText = this.scene.add.text(25, currentY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 } // 글자 잘림 방지
            });
            currentY += titleText.height + 5;

            const descText = this.scene.add.text(25, currentY, item.desc, {
                fontSize: '26px', color: '#ffffff', wordWrap: { width: 400 },
                lineSpacing: 8,
                padding: { top: 5, bottom: 15 } // 글자 잘림 방지
            });
            currentY += descText.height + 15;

            this.contentContainer.add([titleText, descText]);
        });

        // 생성된 텍스트들의 총 높이에 맞춰 배경 사각형 크기 조절
        this.bg.height = currentY + 10;

        // 화면 밖으로 툴팁이 잘리지 않도록 위치 보정 로직
        let targetX = x + 20;
        let targetY = y + 20;
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;

        if (targetX + this.bg.width > screenW) targetX = x - this.bg.width - 20;
        if (targetY + this.bg.height > screenH) targetY = y - this.bg.height - 20;

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}