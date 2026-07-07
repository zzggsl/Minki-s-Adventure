import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { Button } from '../ui/Button';
import { GameState } from '../core/GameState'; 
import { SettingsModal } from '../ui/modals/SettingsModal'; // 💡 분리된 모달 임포트

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    // 💡 게임 시작 전 필요한 이미지를 모두 메모리에 올려두는 함수
    preload() {
        // public 폴더 바로 아래에 이미지가 있을 경우의 경로입니다.
        // 만약 public/assets/ 폴더에 넣으셨다면 'assets/battle.png'로 적어주세요.
        this.load.image('node_battle', 'battle.png');
        this.load.image('node_elite', 'elite.png');
        this.load.image('node_event', 'event.png');
        this.load.image('node_shop', 'shop.png');
        this.load.image('node_rest', 'rest.png');
        this.load.image('node_treasure', 'treasure.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, '민기의 모험', { 
            fontSize: '120px', color: '#ffffff', fontStyle: 'bold',
            padding: { top: 30, bottom: 30 } 
        }).setOrigin(0.5);
        
        new Button({
            scene: this, x: width / 2, y: height * 0.6, text: '모험 시작', variant: 'primary', width: 300, height: 100, fontSize: '40px',
            onClick: () => {
                // 💡 Apple 기기(iOS, iPadOS) 판별: 최근 iPadOS는 데스크탑 Mac으로 인식되므로 터치 여부도 함께 확인
                const isAppleDevice = this.sys.game.device.os.iOS || 
                                      this.sys.game.device.os.iPad || 
                                      (this.sys.game.device.os.macOS && navigator.maxTouchPoints > 0);

                // 💡 Apple 기기가 아닐 때(안드로이드, 일반 PC)만 전체화면 진입
                if (!this.scale.isFullscreen && !isAppleDevice) {
                    this.scale.startFullscreen();
                }
                
                this.sound.play('click');

                if (!GameState.masterDeck || GameState.masterDeck.length === 0) {
                    this.initNewGame();
                }

                this.scene.start('MapScene');
            }
        });

        if (SaveSystem.hasSave()) {
            new Button({
                scene: this, x: width / 2, y: height / 2 + 180, text: '이어하기', variant: 'secondary',
                onClick: () => { SaveSystem.loadGame(); this.scene.start('MapScene'); }
            });
        }

        new Button({
            scene: this, x: width - 150, y: 100, text: '⚙️ 설정', variant: 'secondary', width: 200, height: 60, fontSize: '32px',
            onClick: () => { new SettingsModal(this); } // 💡 분리된 모달 객체 생성!
        });
    }

    private initNewGame() {
        GameState.floor = 1;
        GameState.player.hp = GameState.player.maxHp; 
        GameState.masterDeck = [
            { id: `strike_${Date.now()}_1`, name: '타격', type: 'ATTACK', cost: 1, desc: '적에게 6의 피해를 줍니다.', damage: 6, value: 6 },
            { id: `strike_${Date.now()}_2`, name: '타격', type: 'ATTACK', cost: 1, desc: '적에게 6의 피해를 줍니다.', damage: 6, value: 6 },
            { id: `strike_${Date.now()}_3`, name: '타격', type: 'ATTACK', cost: 1, desc: '적에게 6의 피해를 줍니다.', damage: 6, value: 6 },
            { id: `strike_${Date.now()}_4`, name: '타격', type: 'ATTACK', cost: 1, desc: '적에게 6의 피해를 줍니다.', damage: 6, value: 6 },
            { id: `defend_${Date.now()}_1`, name: '수비', type: 'SKILL', cost: 1, desc: '방어도를 5 얻습니다.', block: 5, value: 5 },
            { id: `defend_${Date.now()}_2`, name: '수비', type: 'SKILL', cost: 1, desc: '방어도를 5 얻습니다.', block: 5, value: 5 },
            { id: `defend_${Date.now()}_3`, name: '수비', type: 'SKILL', cost: 1, desc: '방어도를 5 얻습니다.', block: 5, value: 5 },
            { id: `defend_${Date.now()}_4`, name: '수비', type: 'SKILL', cost: 1, desc: '방어도를 5 얻습니다.', block: 5, value: 5 }
        ];
    }
}