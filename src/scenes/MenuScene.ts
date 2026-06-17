import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SettingsManager } from '../managers/SettingsManager';
import { GameState } from '../core/GameState'; 

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        console.log("현재 모바일 UI 모드인가?", SettingsManager.isMobileUI(this));

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, '민기의 모험', { 
            fontSize: '120px', color: '#ffffff', fontStyle: 'bold',
            padding: { top: 30, bottom: 30 } 
        }).setOrigin(0.5);
        
        new Button({
            scene: this, x: width / 2, y: height * 0.6, text: '모험 시작', variant: 'primary',
            width: 300, height: 100, fontSize: '40px',
            onClick: () => {
                if (!this.scale.isFullscreen) {
                    this.scale.startFullscreen();
                }
                this.sound.play('click');

                // 💡 덱이 비어있다면 새 게임으로 간주하고 기본 덱/체력 세팅
                if (!GameState.masterDeck || GameState.masterDeck.length === 0) {
                    this.initNewGame();
                }

                this.scene.start('MapScene');
            }
        });

        if (SaveSystem.hasSave()) {
            new Button({
                scene: this, x: width / 2, y: height / 2 + 180, text: '이어하기', variant: 'secondary',
                onClick: () => {
                    SaveSystem.loadGame();
                    this.scene.start('MapScene');
                }
            });
        }

        new Button({
            scene: this, x: width - 150, y: 100, text: '⚙️ 설정', variant: 'secondary',
            width: 200, height: 60, fontSize: '32px',
            onClick: () => this.openSettingsModal() 
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

    private openSettingsModal() {
        const modal = new Modal({ scene: this, title: '환경 설정', width: 800, height: 600 });
        const content = modal.contentContainer;
        
        const modeText = this.add.text(0, -50, `현재 UI 모드: ${SettingsManager.settings.forceUIMode}`, {
            fontSize: '40px', color: '#ffffff', fontStyle: 'bold', padding: { left: 10, right: 10, top: 15, bottom: 15 }
        }).setOrigin(0.5);
        content.add(modeText);

        const autoBtn = new Button({ scene: this, x: -220, y: 50, text: '자동 감지', variant: 'secondary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('auto'); modeText.setText(`현재 UI 모드: auto`); } });
        const pcBtn = new Button({ scene: this, x: 0, y: 50, text: 'PC 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('pc'); modeText.setText(`현재 UI 모드: pc`); } });
        const mobileBtn = new Button({ scene: this, x: 220, y: 50, text: '모바일 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('mobile'); modeText.setText(`현재 UI 모드: mobile`); } });

        content.add([autoBtn, pcBtn, mobileBtn]);
    }
}