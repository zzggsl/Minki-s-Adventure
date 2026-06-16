import Phaser from 'phaser';

export class Tooltip extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private descText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);

        // 1. 툴팁 배경 (어두운 반투명 패널)
        this.bg = scene.add.rectangle(0, 0, 450, 200, 0x111111, 0.95);
        this.bg.setStrokeStyle(4, 0x555555);
        this.bg.setOrigin(0, 0); // 좌측 상단(0,0)을 기준으로 배치

        // 2. 타이틀 텍스트 (요청하신 노란색 + 검은 테두리 강조)
        this.titleText = scene.add.text(25, 25, '', {
            fontSize: '36px',
            color: '#ffdd00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        });

        // 3. 설명 텍스트 (흰색, 자동 줄바꿈)
        this.descText = scene.add.text(25, 80, '', {
            fontSize: '28px',
            color: '#ffffff',
            wordWrap: { width: 400 }, // 배경 너비에 맞춰 자동 줄바꿈
            lineSpacing: 10
        });

        // 컨테이너에 조립
        this.add([this.bg, this.titleText, this.descText]);
        
        // 4. 초기 설정
        this.setVisible(false); // 처음엔 숨겨둠
        this.setDepth(1000); // 💡 다른 모든 UI(카드, 모달 등)보다 무조건 위에 보이도록 깊이 설정
        scene.add.existing(this);
    }

    /**
     * 툴팁을 특정 위치에 표시합니다.
     * @param x 마우스/터치 X 좌표
     * @param y 마우스/터치 Y 좌표
     * @param title 툴팁 제목 (예: '방어도')
     * @param desc 툴팁 내용
     */
    public show(x: number, y: number, title: string, desc: string) {
        this.titleText.setText(title);
        this.descText.setText(desc);

        // 내용의 길이에 맞춰 배경 박스의 높이를 자동 조절
        const textHeight = this.descText.height;
        this.bg.height = 80 + textHeight + 30;

        // 마우스 커서에 가려지지 않도록 약간 우측 하단으로 오프셋 부여
        let targetX = x + 20;
        let targetY = y + 20;

        // 💡 화면 밖으로 잘려 나가는 것을 방지 (우측 및 하단 경계 검사)
        const screenW = this.scene.cameras.main.width;
        const screenH = this.scene.cameras.main.height;

        if (targetX + this.bg.width > screenW) {
            targetX = x - this.bg.width - 20; // 화면 우측을 넘어가면 마우스 좌측으로 띄움
        }
        if (targetY + this.bg.height > screenH) {
            targetY = y - this.bg.height - 20; // 화면 하단을 넘어가면 마우스 위쪽으로 띄움
        }

        this.setPosition(targetX, targetY);
        this.setVisible(true);
    }

    /**
     * 툴팁을 숨깁니다.
     */
    public hide() {
        this.setVisible(false);
    }
}
