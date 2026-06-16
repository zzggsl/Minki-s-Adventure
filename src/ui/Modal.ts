import Phaser from 'phaser';
import { Button } from './Button'; // 💡 방금 만든 버튼 컴포넌트 재사용!

export interface ModalConfig {
    scene: Phaser.Scene;
    title: string;
    width?: number;
    height?: number;
    onClose?: () => void;
}

export class Modal extends Phaser.GameObjects.Container {
    private overlay: Phaser.GameObjects.Rectangle;
    private panel: Phaser.GameObjects.Rectangle;
    private titleText: Phaser.GameObjects.Text;
    private closeButton: Button;
    
    // 💡 핵심: 앞으로 덱 목록이나 설정 UI 등 내용물이 들어갈 빈 공간입니다.
    public contentContainer: Phaser.GameObjects.Container; 

    constructor(config: ModalConfig) {
        // 모달은 항상 화면 중앙에 배치합니다.
        const screenW = config.scene.cameras.main.width;
        const screenH = config.scene.cameras.main.height;
        super(config.scene, screenW / 2, screenH / 2);

        const width = config.width || 1400;
        const height = config.height || 1000;

        // 1. 화면 전체를 덮는 반투명 검은색 배경 (클릭 방어막 역할)
        this.overlay = config.scene.add.rectangle(0, 0, screenW * 2, screenH * 2, 0x000000, 0.85);
        this.overlay.setInteractive(); // 뒷배경 클릭 차단

        // 2. 중앙 메인 패널
        this.panel = config.scene.add.rectangle(0, 0, width, height, 0x222222);
        this.panel.setStrokeStyle(8, 0x555555);

        // 3. 타이틀 텍스트 (상단 배치)
        this.titleText = config.scene.add.text(0, -height / 2 + 70, config.title, {
            fontSize: '60px',
            color: '#ffdd00',
            fontStyle: 'bold',
            padding: { top: 20, bottom: 20 } // 💡 추가: 텍스트 윗부분 잘림 방지
        }).setOrigin(0.5);

        // 4. 내용물을 담을 빈 컨테이너
        this.contentContainer = config.scene.add.container(0, 0);

        // 5. 하단 닫기 버튼 (방금 만든 Button 클래스 사용)
        this.closeButton = new Button({
            scene: config.scene,
            x: 0,
            y: height / 2 - 90,
            text: '닫기',
            variant: 'primary',
            width: 240,
            height: 80,
            fontSize: '40px',
            onClick: () => {
                if (config.onClose) config.onClose();
                this.closeModal();
            }
        });

        // 6. 생성한 부품들을 모달 컨테이너에 조립 (순서대로 뒤->앞)
        this.add([this.overlay, this.panel, this.titleText, this.contentContainer, this.closeButton]);

        // 7. 씬에 등록하고 최상단으로 끌어올림
        config.scene.add.existing(this);
        config.scene.children.bringToTop(this);

        // 8. 팝업 등장 애니메이션 (작았다가 커지며 나타남)
        this.setScale(0.8);
        this.setAlpha(0);
        config.scene.tweens.add({
            targets: this,
            scale: 1,
            alpha: 1,
            duration: 250,
            ease: 'Back.easeOut'
        });
    }

    // 팝업 닫기 애니메이션 및 파괴
    public closeModal() {
        this.scene.tweens.add({
            targets: this,
            scale: 0.9,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                this.destroy(); // 씬에서 완전히 제거
            }
        });
    }
}
