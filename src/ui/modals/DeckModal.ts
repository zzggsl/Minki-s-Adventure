// src/ui/modals/DeckModal.ts
import Phaser from 'phaser';
import { Modal } from '../Modal';
import type { ICardData } from '../../types';

/** 카드를 고를 수 있는 모달로 쓸 때 전달하는 옵션 */
export interface DeckModalSelectConfig {
    /** 카드를 선택했을 때 호출된다. 선택 후 모달은 자동으로 닫힌다. */
    onSelect: (card: ICardData, index: number) => void;
    /** 선택 가능한 카드인지 판별. 없으면 모든 카드를 선택할 수 있다. */
    isSelectable?: (card: ICardData, index: number) => boolean;
    /** 카드 아래에 덧붙일 문구 (상점 가격 등). 빈 문자열이면 표시하지 않는다. */
    getBadge?: (card: ICardData, index: number) => string;
}

export class DeckModal extends Modal {
    private selectConfig?: DeckModalSelectConfig;

    constructor(scene: Phaser.Scene, title: string, cards: ICardData[], selectConfig?: DeckModalSelectConfig) {
        super({ scene, title, width: 1800, height: 1200 });
        this.selectConfig = selectConfig;
        this.buildContent(cards);
    }

    private buildContent(cards: ICardData[]) {
        const content = this.contentContainer;
        const cols = 6;
        const cardScale = 0.8;
        const cellW = 270 * cardScale + 30;
        const cellH = 390 * cardScale + 40;
        const startX = -((cols - 1) * cellW) / 2;
        const startY = -250;

        cards.forEach((cardData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const cardView = this.createVisualCardHelper(0, 0, cardData);
            cardView.setScale(cardScale);
            const cardWrapper = this.scene.add.container(startX + (col * cellW), startY + (row * cellH), [cardView]);
            content.add(cardWrapper);

            if (this.selectConfig) {
                const badge = this.selectConfig.getBadge?.(cardData, index);
                if (badge) {
                    const badgeText = this.scene.add.text(0, 175, badge, {
                        fontSize: '32px', color: '#ffdd00', fontStyle: 'bold',
                        padding: { top: 10, bottom: 10 }
                    }).setOrigin(0.5);
                    cardWrapper.add(badgeText);
                }
                this.setupSelection(cardWrapper, cardView, cardData, index, cardScale);
            }
        });
    }

    /** 선택 모드일 때 카드에 클릭/호버 반응을 붙인다 */
    private setupSelection(
        wrapper: Phaser.GameObjects.Container,
        cardView: Phaser.GameObjects.Container,
        cardData: ICardData,
        index: number,
        cardScale: number
    ) {
        const config = this.selectConfig!;
        const selectable = config.isSelectable ? config.isSelectable(cardData, index) : true;

        if (!selectable) {
            cardView.setAlpha(0.35); // 선택 불가 카드는 흐리게 표시
            return;
        }

        wrapper.setSize(260 * cardScale, 380 * cardScale);
        wrapper.setInteractive();

        wrapper.on('pointerover', () => {
            this.scene.tweens.add({ targets: cardView, scale: cardScale * 1.1, duration: 100 });
        });
        wrapper.on('pointerout', () => {
            this.scene.tweens.add({ targets: cardView, scale: cardScale, duration: 100 });
        });
        wrapper.on('pointerup', () => {
            this.scene.sound.play('click');
            config.onSelect(cardData, index);
            this.closeModal();
        });
    }

    private createVisualCardHelper(x: number, y: number, cardData: ICardData): Phaser.GameObjects.Container {
        const cardWidth = 260;
        const cardHeight = 380;
        const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        // 💡 강화된 카드는 금색 테두리로 구분한다
        bg.setStrokeStyle(6, cardData.upgraded ? 0xffdd00 : 0xffffff);
        const nameText = this.scene.add.text(0, -130, cardData.name, { fontSize: '38px', color: cardData.upgraded ? '#a07000' : '#000', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        const costBg = this.scene.add.sprite(-90, -145, 'energy').setScale(0.7);
        const costText = this.scene.add.text(-90, -145, cardData.cost.toString(), { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15, left: 10, right: 10 } }).setOrigin(0.5);
        const descText = this.scene.add.text(0, 20, cardData.desc, { fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        return this.scene.add.container(x, y, [bg, nameText, costBg, costText, descText]);
    }
}
