import Phaser from 'phaser';

export interface TooltipItem {
    title: string;
    desc: string;
    iconKey?: string; 
}

export class Tooltip extends Phaser.GameObjects.Container {
    // 💡 bg를 optional로 설정하여, show() 호출 시마다 파괴하고 새로 생성할 수 있게 함
    private bg?: Phaser.GameObjects.Rectangle; 
    private contentContainer: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // 1. 콘텐츠를 담을 내부 그릇을 먼저 생성 (배경보다 위에 렌더링)
        this.contentContainer = scene.add.container(0, 0);
        this.add(this.contentContainer);

        // 2. 초기 로딩 시 임시 배경 생성 (테두리 렌더링 확인용)
        this.redrawBackground(100); 

        // 3. 조립 및 초기화
        this.setVisible(false);
        this.setDepth(2000); // 무조건 최상단
        scene.add.existing(this);
    }

    /**
     * 💡 핵심 수정: 기존 배경 사각형을 완전히 파괴하고,
     * 테두리와 함께 새로운 높이에 맞는 사각형을 다시 그려서 '침투' 현상을 원천 봉쇄합니다.
     */
    private redrawBackground(height: number) {
        // 기존 배경이 있다면 파괴
        if (this.bg) {
             this.bg.destroy();
             this.bg = undefined;
        }

        // 💡 너비는 480으로 살짝 넓혀서 글자가 덜 겹치게 수정
        this.bg = this.scene.add.rectangle(0, 0, 480, height, 0x111111, 0.95);
        this.bg.setStrokeStyle(4, 0x555555);
        this.bg.setOrigin(0, 0); 

        // 💡 테두리가 콘텐츠 뒤로 가도록(즉, 인덱스 0번으로) 배치
        this.addAt(this.bg, 0); 
    }

    /**
     * 여러 개의 툴팁 아이템을 받아서 화면에 렌더링합니다.
     */
    public show(x: number, y: number, items: TooltipItem[]) {
        if (items.length === 0) return;

        // 1. 기존 콘텐츠 청소
        this.contentContainer.removeAll(true);

        let totalContentHeight = 20; // 전체 툴팁의 시작 Y좌표

        // 2. 다중 툴팁을 순회하며 콘텐츠 생성 및 배치
        items.forEach((item, index) => {
            // 각 툴팁 항목(방어도, 상태 등)을 위한 서브 컨테이너 생성
            const subContainer = this.scene.add.container(0, 0);

            let currentSubY = 0; // 서브 컨테이너 내부의 Y좌표
            const subElements: Phaser.GameObjects.GameObject[] = [];

            // 아이콘 생성
            if (item.iconKey) {
                const icon = this.scene.add.sprite(40, currentSubY + 25, item.iconKey).setScale(0.1).setOrigin(0.5);
                subElements.push(icon);
            }

            // 제목 텍스트
            const titleText = this.scene.add.text(item.iconKey ? 70 : 25, currentSubY, item.title, {
                fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                stroke: '#000000', strokeThickness: 4,
                padding: { top: 5, bottom: 5 }
            });
            titleText.setOrigin(0);
            titleText.updateText(); // 줄바꿈 적용 전 높이 계산
            currentSubY += titleText.height;
            subElements.push(titleText);

            // 설명 텍스트
            const descText = this.scene.add.text(25, currentSubY, item.desc, {
                fontSize: '26px', color: '#ffffff', 
                wordWrap: { width: 420 }, // 설명 글자 랩핑 너비
                lineSpacing: 10,
                padding: { top: 5, bottom: 5 }
            });
            descText.setOrigin(0);
            descText.updateText(); // 💡 강제 갱신: 줄바꿈 된 실제 높이를 즉시 계산
            currentSubY += descText.height;
            subElements.push(descText);

            subContainer.add(subElements);

            // 💡 서브 컨테이너를 전체 툴팁의 accumulated height 위치에 배치
            subContainer.setPosition(0, totalContentHeight); 
            totalContentHeight += currentSubY; // 현재 항목의 높이를 전체 높이에 누적

            // 💡 항목 간 간격 추가 (마지막 항목 제외)
            if (index < items.length - 1) {
                totalContentHeight += 30; // 간격
            }

            this.contentContainer.add(subContainer);
        });

        // 3. 💡 핵심 수정: 최종적으로 계산된 전체 높이 + 여백에 맞춰 배경을 새로 그립니다.
        const finalBgHeight = totalContentHeight + 10;
        this.redrawBackground(finalBgHeight);

        // 4. 화면 위치 보정 및 표시 (마우스 좌표 사용 X, 고정 위치는 BattleScene에서 제어)
        let targetX = x;
        let targetY = y;
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;

        const margin = 20;
        // background가 optional이므로 bg!로 명시적 접근
        if (targetX + this.bg!.width > screenW) targetX = screenW - this.bg!.width - margin;
        if (targetY + this.bg!.height > screenH) targetY = screenH - this.bg!.height - margin;

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    public hide() {
        this.setVisible(false);
    }
}
