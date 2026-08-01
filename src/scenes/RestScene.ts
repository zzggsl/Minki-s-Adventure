// src/scenes/RestScene.ts
// 모닥불 노드. 화면 구성과 입력 전달만 담당하고 규칙 판정은 NodeEventManager가 한다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { NodeEventManager } from '../managers/NodeEventManager';
import { Button } from '../ui/Button';
import { DeckModal } from '../ui/modals/DeckModal';

export default class RestScene extends Phaser.Scene {
    private resultText!: Phaser.GameObjects.Text;
    private choiceButtons: Button[] = [];

    constructor() {
        super({ key: 'RestScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.choiceButtons = [];

        this.add.text(width / 2, height * 0.18, '🔥 모닥불', {
            fontSize: '90px', color: '#ffaa33', fontStyle: 'bold',
            padding: { top: 25, bottom: 25 }
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.3, '잠시 쉬어갈 시간입니다. 하나만 선택할 수 있습니다.', {
            fontSize: '36px', color: '#dddddd',
            padding: { top: 15, bottom: 15 }
        }).setOrigin(0.5);

        // 선택 결과를 안내하는 자리 (처음엔 비어 있음)
        this.resultText = this.add.text(width / 2, height * 0.68, '', {
            fontSize: '42px', color: '#88ff88', fontStyle: 'bold', align: 'center',
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5);

        const healAmount = NodeEventManager.getRestHealAmount();
        const isFullHp = GameState.player.hp >= GameState.player.maxHp;
        const canUpgrade = NodeEventManager.hasUpgradableCard();

        const restButton = new Button({
            scene: this,
            x: width * 0.32, y: height * 0.5,
            text: isFullHp ? '휴식 (체력 가득)' : `🛌 휴식  +${healAmount} HP`,
            variant: 'primary', width: 520, height: 140, fontSize: '42px',
            onClick: () => this.handleRest()
        });

        const upgradeButton = new Button({
            scene: this,
            x: width * 0.68, y: height * 0.5,
            text: canUpgrade ? '⚒️ 카드 강화' : '강화 (대상 없음)',
            variant: 'secondary', width: 520, height: 140, fontSize: '42px',
            onClick: () => this.handleUpgradeSelect()
        });

        // 효과가 없는 선택지는 눌러도 의미가 없으므로 비활성화한다
        if (isFullHp) this.disableButton(restButton);
        if (!canUpgrade) this.disableButton(upgradeButton);

        this.choiceButtons.push(restButton, upgradeButton);

        new Button({
            scene: this,
            x: width / 2, y: height * 0.85,
            text: '그냥 지나가기 ⏭️',
            variant: 'danger', width: 380, height: 90, fontSize: '34px',
            onClick: () => this.returnToMap()
        });
    }

    private handleRest() {
        const healed = NodeEventManager.rest();
        this.resultText.setText(`체력을 ${healed} 회복했습니다.  (${GameState.player.hp} / ${GameState.player.maxHp})`);
        this.lockChoices();
        this.returnToMap(1200);
    }

    private handleUpgradeSelect() {
        new DeckModal(this, '강화할 카드를 선택하세요', GameState.masterDeck, {
            isSelectable: card => NodeEventManager.canUpgrade(card),
            onSelect: card => {
                const originalName = card.name;
                if (NodeEventManager.upgradeCard(card)) {
                    this.resultText.setText(`'${originalName}' 카드를 강화했습니다!`);
                    this.lockChoices();
                    this.returnToMap(1200);
                }
            }
        });
    }

    /** 선택을 한 번 하고 나면 남은 선택지를 잠근다 */
    private lockChoices() {
        this.choiceButtons.forEach(button => this.disableButton(button));
    }

    private disableButton(button: Button) {
        button.disableInteractive();
        button.setAlpha(0.4);
    }

    private returnToMap(delay: number = 0) {
        this.time.delayedCall(delay, () => this.scene.start('MapScene'));
    }
}
