import Phaser from 'phaser';

export interface TooltipItem {
    title: string;
    desc: string;
    iconKey?: string; 
}

export class Tooltip extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private contentContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // 💡 툴팁 너비를 450 -> 480으로 살짝 넓혀서 글자가 더 편하게 보이도록 수정
        this.bg = scene.add.rectangle(0, 0, 480, 200, 0x111111, 0.95);
        this.bg.setStrokeStyle(4, 0x555555);
        this.bg.setOrigin(0, 0); 

        this.contentContainer = scene.add.container(0, 0);

        this.add([this.bg, this.contentContainer]);
        this.setVisible(false);
        this.setDepth(2000); 
        scene.add.existing(this);
    }

    public show(x: number, y: number, items: TooltipItem[]) {
        if (items.length === 0) return;

        this.contentContainer.removeAll(true);
        let currentY = 20;

        items.forEach(item => {
            const elements: Phaser.GameObjects.GameObject[] = []; 

            if (item.iconKey) {
                const icon = this.scene.add.sprite(40, currentY + 25, item.iconKey).setScale(0.1).setOrigin(0.5);
                elements.push(icon);
            }

            const titleText = this.scene.add.text(item.iconKey ? 70 : 25, currentY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 }
            });
            
            // 💡 핵심 수정: 강제로 렌더링을 업데이트하여 정확한 높이를 즉시 가져옴
            titleText.updateText();
            currentY += titleText.height;
            elements.push(titleText);

            const descText = this.scene.add.text(25, currentY, item.desc, {
                fontSize: '26px', color: '#ffffff', 
                wordWrap: { width: 420 }, // 💡 넓어진 배경에 맞춰 랩핑 너비 증가
                lineSpacing: 10,
                padding: { top: 5, bottom: 5 }
            });
            
            // 💡 핵심 수정: 줄바꿈이 적용된 실제 높이를 강제로 다시 계산
            descText.updateText();
            currentY += descText.height + 30; // 💡 다음 툴팁과의 간격을 30으로 넉넉하게 추가
            elements.push(descText);

            this.contentContainer.add(elements);
        });

        this.bg.height = currentY + 10;

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
