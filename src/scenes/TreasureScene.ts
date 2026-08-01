// src/scenes/TreasureScene.ts
// 보물 노드. 골드를 받고, 원하면 카드 1장을 추가로 챙길 수 있다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { NodeEventManager } from '../managers/NodeEventManager';
import { getRandomRewardCards } from '../data/cards';
import { Button } from '../ui/Button';
import { DeckModal } from '../ui/modals/DeckModal';

export default class TreasureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TreasureScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const goldReward = NodeEventManager.rollTreasureGold();
        let isCardClaimed = false;

        this.add.text(width / 2, height * 0.18, '💎 보물 상자', {
            fontSize: '90px', color: '#ffdd00', fontStyle: 'bold',
            padding: { top: 25, bottom: 25 }
        }).setOrigin(0.5);

        // 골드는 상자를 여는 즉시 지급된다
        NodeEventManager.gainGold(goldReward);
        this.add.text(width / 2, height * 0.34, `💰 ${goldReward} 골드를 획득했습니다!  (보유 ${GameState.player.gold})`, {
            fontSize: '44px', color: '#ffffff', fontStyle: 'bold',
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5);

        const cardStatusText = this.add.text(width / 2, height * 0.62, '상자 안에 카드도 한 장 들어 있습니다.', {
            fontSize: '36px', color: '#dddddd',
            padding: { top: 15, bottom: 15 }
        }).setOrigin(0.5);

        const cardButton = new Button({
            scene: this,
            x: width / 2, y: height * 0.48,
            text: '🃏 카드 한 장 챙기기',
            variant: 'primary', width: 560, height: 130, fontSize: '42px',
            onClick: () => {
                if (isCardClaimed) return;

                new DeckModal(this, '가져갈 카드를 선택하세요 (1장)', getRandomRewardCards(3), {
                    onSelect: card => {
                        NodeEventManager.addCardToMasterDeck(card);
                        isCardClaimed = true;
                        cardStatusText.setText(`'${card.name}' 카드를 덱에 넣었습니다.`);
                        cardStatusText.setColor('#88ff88');
                        cardButton.disableInteractive();
                        cardButton.setAlpha(0.4);
                    }
                });
            }
        });

        new Button({
            scene: this,
            x: width / 2, y: height * 0.85,
            text: '지도로 돌아가기 ⏭️',
            variant: 'secondary', width: 420, height: 90, fontSize: '34px',
            onClick: () => this.scene.start('MapScene')
        });
    }
}
