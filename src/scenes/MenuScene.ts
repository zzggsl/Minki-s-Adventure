import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. 게임 타이틀
        this.add.text(width / 2, height / 3, '민기의 모험', { 
            fontSize: '150px', color: '#ffdd00', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 2. 새 게임 버튼 (위쪽으로 이동)
        this.createButton(width / 2, height / 2 + 150, '새 게임', () => {
            SaveSystem.clearSave(); // 기존 세이브 삭제
            SaveSystem.resetGame(); // 덱과 층수 1층으로 초기화
            this.scene.start('MapScene');
        });

        // 3. 계속하기 버튼 (아래쪽으로 이동 및 세이브 데이터 확인)
        const saveString = localStorage.getItem('my_deckbuilder_save');
        let hasSave = false;
        let savedFloor = 1;

        if (saveString) {
            hasSave = true;
            // 저장된 데이터에서 현재 층수를 빼옵니다.
            const saveData = JSON.parse(saveString);
            savedFloor = saveData.floor || 1;
        }

        if (hasSave) {
            this.createButton(width / 2, height / 2 + 350, '계속하기', () => {
                // 바로 MapScene으로 넘어가지 않고 팝업 창을 띄웁니다.
                this.showContinuePopup(width, height, savedFloor);
            });
        } else {
            // 세이브가 없으면 어두운 회색으로 표시 (터치 불가)
            this.add.text(width / 2, height / 2 + 350, '계속하기 (저장 파일 없음)', { 
                fontSize: '70px', color: '#555555', fontStyle: 'bold',
                backgroundColor: '#222222', // 배경도 어둡게
                padding: { left: 50, right: 50, top: 25, bottom: 25 }
            }).setOrigin(0.5);
        }
    }

    // 기본 버튼 생성 로직
    createButton(x: number, y: number, text: string, onClick: () => void) {
        const button = this.add.text(x, y, text, { 
            fontSize: '70px', 
            color: '#ffffff', 
            fontStyle: 'bold',
            backgroundColor: '#333333',
            padding: { left: 50, right: 50, top: 25, bottom: 25 }
        }).setOrigin(0.5).setInteractive();

        // 터치/마우스 오버 시 색상 변화 효과
        button.on('pointerover', () => button.setStyle({ color: '#ffdd00' }));
        button.on('pointerout', () => button.setStyle({ color: '#ffffff' }));
        button.on('pointerdown', () => button.setStyle({ color: '#aaaaaa' }));
        button.on('pointerup', () => {
            button.setStyle({ color: '#ffdd00' });
            onClick();
        });
    }

    // 💡 팝업(모달) 창 생성 로직
    showContinuePopup(width: number, height: number, floor: number) {
        // 1. 화면 전체를 덮는 반투명 검은색 배경 (클릭 방어용)
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7).setInteractive();

        // 2. 중앙 팝업 박스
        const box = this.add.rectangle(width / 2, height / 2, 1000, 500, 0x222222);
        box.setStrokeStyle(8, 0xffffff);

        // 3. 안내 텍스트
        const text = this.add.text(width / 2, height / 2 - 80, `마지막 기록(${floor}층)부터\n진행하시겠습니까?`, {
            fontSize: '60px', color: '#ffffff', fontStyle: 'bold', align: 'center', padding: { top: 20, bottom: 20, left: 20, right: 20 }
        }).setOrigin(0.5);

        // 4. '예' 버튼 (초록색)
        const yesBtn = this.add.text(width / 2 - 200, height / 2 + 100, '예', {
            fontSize: '60px', color: '#ffffff', backgroundColor: '#44aa44', fontStyle: 'bold',
            padding: { left: 60, right: 60, top: 20, bottom: 20 }
        }).setOrigin(0.5).setInteractive();

        yesBtn.on('pointerover', () => yesBtn.setStyle({ color: '#ffdd00' }));
        yesBtn.on('pointerout', () => yesBtn.setStyle({ color: '#ffffff' }));
        yesBtn.on('pointerup', () => {
            SaveSystem.loadGame();
            this.scene.start('MapScene');
        });

        // 5. '아니오' 버튼 (빨간색)
        const noBtn = this.add.text(width / 2 + 200, height / 2 + 100, '아니오', {
            fontSize: '60px', color: '#ffffff', backgroundColor: '#aa4444', fontStyle: 'bold',
            padding: { left: 40, right: 40, top: 20, bottom: 20 }
        }).setOrigin(0.5).setInteractive();

        noBtn.on('pointerover', () => noBtn.setStyle({ color: '#ffdd00' }));
        noBtn.on('pointerout', () => noBtn.setStyle({ color: '#ffffff' }));
        noBtn.on('pointerup', () => {
            // '아니오'를 누르면 팝업창 구성 요소들을 모두 파괴(제거)하여 원래 화면으로 돌아갑니다.
            overlay.destroy();
            box.destroy();
            text.destroy();
            yesBtn.destroy();
            noBtn.destroy();
        });
    }
}