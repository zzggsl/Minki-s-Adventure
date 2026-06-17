import Phaser from 'phaser';

// 💡 다중 툴팁을 받기 위한 인터페이스
export interface TooltipItem {
    title: string;
    desc: string;
    iconKey?: string; // 💡 추가: 아이콘 스프라이트 키
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
            const elements: Phaser.GameObjects.GameObject[] = []; // 💡 컨테이너에 담을 요소들

            // 💡 1. 아이콘이 있다면 생성해서 elements 배열에 담기
            if (item.iconKey) {
                const icon = this.scene.add.sprite(40, currentY + 20, item.iconKey).setScale(0.1).setOrigin(0.5);
                elements.push(icon);
            }

            // 💡 2. 타이틀 텍스트 담기
            const titleText = this.scene.add.text(item.iconKey ? 70 : 25, currentY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 }
            });
            currentY += titleText.height;
            elements.push(titleText);

            // 💡 3. 설명 텍스트 담기
            const descText = this.scene.add.text(25, currentY, item.desc, {
                fontSize: '26px', color: '#ffffff', wordWrap: { width: 400 },
                lineSpacing: 8,
                padding: { top: 5, bottom: 5 }
            });
            currentY += descText.height + 15;
            elements.push(descText);

            // 💡 4. 생성된 모든 요소(아이콘 포함)를 컨테이너에 쏙 넣기! (이제 유령 안 남음)
            this.contentContainer.add(elements);
        });

        this.bg.height = currentY + 5;

        let targetX = x;
        let targetY = y;
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;

        const margin = 20;
        if (targetX + this.bg.width > screenW) targetX = screenW - this.bg.width - margin;
        if (targetY + this.bg.height > screenH) targetY = screenH - this.bg.height - margin;

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}