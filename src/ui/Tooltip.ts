import Phaser from 'phaser';

export interface TooltipItem {
    title: string;
    desc: string;
    iconKey?: string; 
}

export class Tooltip extends Phaser.GameObjects.Container {
    private bgGraphics: Phaser.GameObjects.Graphics; // 💡 파괴 없이 재사용할 그래픽 객체
    private contentContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        this.bgGraphics = scene.add.graphics();
        this.contentContainer = scene.add.container(0, 0);

        this.add([this.bgGraphics, this.contentContainer]);
        this.setVisible(false);
        this.setDepth(2000); 
        scene.add.existing(this);
    }

    public show(x: number, y: number, items: TooltipItem[]) {
        if (items.length === 0) return;

        this.contentContainer.removeAll(true);
        let currentY = 20;

        items.forEach((item, index) => {
            const elements: Phaser.GameObjects.GameObject[] = []; 

            if (item.iconKey) {
                const icon = this.scene.add.sprite(40, currentY + 25, item.iconKey).setScale(0.1).setOrigin(0.5);
                elements.push(icon);
            }

            const titleText = this.scene.add.text(item.iconKey ? 70 : 25, currentY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 }
            });
            titleText.updateText();
            currentY += titleText.height;
            elements.push(titleText);

            const descText = this.scene.add.text(25, currentY, item.desc, {
                fontSize: '26px', color: '#ffffff', wordWrap: { width: 420 }, lineSpacing: 10,
                padding: { top: 5, bottom: 5 }
            });
            descText.updateText();
            currentY += descText.height;
            elements.push(descText);

            if (index < items.length - 1) currentY += 30; // 💡 툴팁 간 간격

            this.contentContainer.add(elements);
        });

        const finalHeight = currentY + 15;
        const bgWidth = 480;

        // 💡 Graphics를 사용하여 파괴 없이 사각형과 테두리를 매번 다시 그림 (성능 최고)
        this.bgGraphics.clear();
        this.bgGraphics.fillStyle(0x111111, 0.95);
        this.bgGraphics.fillRect(0, 0, bgWidth, finalHeight);
        this.bgGraphics.lineStyle(4, 0x555555, 1);
        this.bgGraphics.strokeRect(0, 0, bgWidth, finalHeight);

        // 화면 밖으로 벗어나지 않도록 좌표 보정
        let targetX = x;
        let targetY = y;
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;
        const margin = 20;

        if (targetX + bgWidth > screenW) targetX = screenW - bgWidth - margin;
        if (targetY + finalHeight > screenH) targetY = screenH - finalHeight - margin;

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}