// src/scenes/ShopScene.ts
// 상점 노드. 재고/가격/구매 판정은 ShopManager가 하고 씬은 표시와 입력 전달만 한다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { ShopManager } from '../managers/ShopManager';
import { Button } from '../ui/Button';
import { DeckModal } from '../ui/modals/DeckModal';
import type { IShopItem } from '../types';

export default class ShopScene extends Phaser.Scene {
    private stock: IShopItem[] = [];
    private goldText!: Phaser.GameObjects.Text;
    private statusText!: Phaser.GameObjects.Text;
    private buyButton!: Button;
    private removalButton!: Button;

    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.stock = ShopManager.generateStock();

        this.add.text(width / 2, height * 0.16, '🏪 상점', {
            fontSize: '90px', color: '#66ddff', fontStyle: 'bold',
            padding: { top: 25, bottom: 25 }
        }).setOrigin(0.5);

        this.goldText = this.add.text(width / 2, height * 0.28, '', {
            fontSize: '44px', color: '#ffdd00', fontStyle: 'bold',
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5);

        this.statusText = this.add.text(width / 2, height * 0.72, '무엇을 도와드릴까요?', {
            fontSize: '36px', color: '#dddddd', align: 'center',
            wordWrap: { width: width * 0.8 },
            padding: { top: 15, bottom: 15 }
        }).setOrigin(0.5);

        this.buyButton = new Button({
            scene: this,
            x: width * 0.32, y: height * 0.48,
            text: '🃏 카드 구매',
            variant: 'primary', width: 520, height: 140, fontSize: '42px',
            onClick: () => this.openBuyModal()
        });

        this.removalButton = new Button({
            scene: this,
            x: width * 0.68, y: height * 0.48,
            text: `🗑️ 카드 제거 (${ShopManager.getRemovalPrice()}G)`,
            variant: 'secondary', width: 520, height: 140, fontSize: '38px',
            onClick: () => this.openRemovalModal()
        });

        new Button({
            scene: this,
            x: width / 2, y: height * 0.87,
            text: '상점을 나선다 ⏭️',
            variant: 'danger', width: 420, height: 90, fontSize: '34px',
            onClick: () => this.scene.start('MapScene')
        });

        this.refreshUI();
    }

    /** 골드와 버튼 활성화 상태를 현재 상황에 맞춰 갱신 */
    private refreshUI() {
        this.goldText.setText(`보유 골드: 💰 ${GameState.player.gold || 0}`);

        const hasStock = this.stock.some(item => !item.soldOut);
        this.setButtonEnabled(this.buyButton, hasStock);
        this.setButtonEnabled(this.removalButton, ShopManager.canUseRemoval());
    }

    private setButtonEnabled(button: Button, enabled: boolean) {
        if (enabled) {
            button.setInteractive();
            button.setAlpha(1);
        } else {
            button.disableInteractive();
            button.setAlpha(0.4);
        }
    }

    private openBuyModal() {
        const available = this.stock.filter(item => !item.soldOut);
        const cards = available.map(item => item.card);

        new DeckModal(this, '구매할 카드를 선택하세요', cards, {
            getBadge: (_card, index) => `💰 ${available[index].price}`,
            // 골드가 모자란 카드는 흐리게 표시되어 선택할 수 없다
            isSelectable: (_card, index) => ShopManager.canAfford(available[index].price),
            onSelect: (card, index) => {
                const item = available[index];
                if (ShopManager.buyCard(item)) {
                    this.statusText.setText(`'${card.name}' 카드를 ${item.price}G에 구매했습니다.`);
                    this.statusText.setColor('#88ff88');
                }
                this.refreshUI();
            }
        });
    }

    private openRemovalModal() {
        new DeckModal(this, `제거할 카드를 선택하세요 (${ShopManager.getRemovalPrice()}G)`, GameState.masterDeck, {
            onSelect: card => {
                if (ShopManager.buyRemoval(card)) {
                    this.statusText.setText(`'${card.name}' 카드를 덱에서 제거했습니다.`);
                    this.statusText.setColor('#88ff88');
                }
                this.refreshUI();
            }
        });
    }
}
