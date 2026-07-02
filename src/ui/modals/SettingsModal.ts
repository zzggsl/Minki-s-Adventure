// src/ui/modals/SettingsModal.ts
import Phaser from 'phaser';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { SettingsManager } from '../../managers/SettingsManager';

export class SettingsModal extends Modal {
    constructor(scene: Phaser.Scene) {
        super({ scene, title: '환경 설정', width: 800, height: 600 });
        this.buildContent();
    }

    private buildContent() {
        const content = this.contentContainer;
        
        const modeText = this.scene.add.text(0, -50, `현재 UI 모드: ${SettingsManager.settings.forceUIMode}`, {
            fontSize: '40px', color: '#ffffff', fontStyle: 'bold', padding: { left: 10, right: 10, top: 15, bottom: 15 }
        }).setOrigin(0.5);
        content.add(modeText);

        const autoBtn = new Button({ scene: this.scene, x: -220, y: 50, text: '자동 감지', variant: 'secondary', width: 180, height: 60, fontSize: '28px', 
            onClick: () => { SettingsManager.setForceUIMode('auto'); modeText.setText(`현재 UI 모드: auto`); } 
        });

        const pcBtn = new Button({ scene: this.scene, x: 0, y: 50, text: 'PC 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', 
            onClick: () => { SettingsManager.setForceUIMode('pc'); modeText.setText(`현재 UI 모드: pc`); } 
        });

        const mobileBtn = new Button({ scene: this.scene, x: 220, y: 50, text: '모바일 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', 
            onClick: () => { SettingsManager.setForceUIMode('mobile'); modeText.setText(`현재 UI 모드: mobile`); } 
        });

        content.add([autoBtn, pcBtn, mobileBtn]);
    }
}