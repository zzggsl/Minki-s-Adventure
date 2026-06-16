import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SettingsManager } from '../managers/SettingsManager';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 💡 접속 기기 환경 감지 테스트 (개발자 콘솔 F12에서 확인 가능)
        console.log("현재 모바일 UI 모드인가?", SettingsManager.isMobileUI(this));

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 타이틀 텍스트
        this.add.text(width / 2, height / 3, '민기의 모험', { 
            fontSize: '120px', color: '#ffffff', fontStyle: 'bold',
            padding: { top: 30, bottom: 30 } // 💡 추가: 거대 폰트 잘림 방지
        }).setOrigin(0.5);
        
        // 💡 1. 새 게임 버튼 (Primary Variant 사용)
        new Button({
            scene: this,
            x: width / 2,
            y: height / 2 + 50,
            text: '새 게임',
            variant: 'primary',
            onClick: () => {
                SaveSystem.clearSave(); // 기존 세이브 삭제
                SaveSystem.resetGame(); // 💡 누락되었던 핵심 코드: 체력과 기본 덱을 다시 채워줍니다!
                this.scene.start('MapScene');
            }
        });

        // 💡 2. 이어하기 버튼 (Secondary Variant 사용, 세이브가 있을 때만 렌더링)
        if (SaveSystem.hasSave()) {
            new Button({
                scene: this,
                x: width / 2,
                y: height / 2 + 180,
                text: '이어하기',
                variant: 'secondary',
                onClick: () => {
                    SaveSystem.loadGame();
                    this.scene.start('MapScene');
                }
            });
        }

        // 💡 3. 설정 버튼 (우측 상단 배치)
        new Button({
            scene: this,
            x: width - 150,
            y: 100,
            text: '⚙️ 설정',
            variant: 'secondary',
            width: 200,
            height: 60,
            fontSize: '32px',
            onClick: () => this.openSettingsModal() // 모달 열기 호출
        });
    }

    // 💡 4. 설정 모달 창 생성 함수
    private openSettingsModal() {
        const modal = new Modal({
            scene: this,
            title: '환경 설정',
            width: 800,
            height: 600
        });

        const content = modal.contentContainer;
        
        // 현재 적용된 모드 표시 텍스트
        const modeText = this.add.text(0, -50, `현재 UI 모드: ${SettingsManager.settings.forceUIMode}`, {
            fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
            padding: { left: 10, right: 10, top: 15, bottom: 15 }
        }).setOrigin(0.5);
        content.add(modeText);

        // 자동 감지 버튼
        const autoBtn = new Button({
            scene: this, x: -220, y: 50,
            text: '자동 감지', variant: 'secondary',
            width: 180, height: 60, fontSize: '28px',
            onClick: () => {
                SettingsManager.setForceUIMode('auto');
                modeText.setText(`현재 UI 모드: auto`);
                console.log("UI 감지 상태:", SettingsManager.isMobileUI(this));
            }
        });

        // PC 강제 모드 버튼
        const pcBtn = new Button({
            scene: this, x: 0, y: 50,
            text: 'PC 모드', variant: 'primary',
            width: 180, height: 60, fontSize: '28px',
            onClick: () => {
                SettingsManager.setForceUIMode('pc');
                modeText.setText(`현재 UI 모드: pc`);
                console.log("UI 감지 상태:", SettingsManager.isMobileUI(this));
            }
        });

        // 모바일 강제 모드 버튼
        const mobileBtn = new Button({
            scene: this, x: 220, y: 50,
            text: '모바일 모드', variant: 'primary',
            width: 180, height: 60, fontSize: '28px',
            onClick: () => {
                SettingsManager.setForceUIMode('mobile');
                modeText.setText(`현재 UI 모드: mobile`);
                console.log("UI 감지 상태:", SettingsManager.isMobileUI(this));
            }
        });

        // 모달의 내용물 그릇(contentContainer)에 텍스트와 버튼들 담기
        content.add([autoBtn, pcBtn, mobileBtn]);
    }
}
