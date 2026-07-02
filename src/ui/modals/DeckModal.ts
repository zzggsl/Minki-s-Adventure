// src/ui/modals/DeckModal.ts
import Phaser from 'phaser';
import { Modal } from '../Modal';
import type { ICardData } from '../../types';

export class DeckModal extends Modal {
    constructor(scene: Phaser.Scene, title: string, cards: ICardData[]) {
        super({ scene, title, width: 1800, height: 1200 });
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
        });
    }

    private createVisualCardHelper(x: number, y: number, cardData: ICardData): Phaser.GameObjects.Container {
        const cardWidth = 260;
        const cardHeight = 380;
        const bg = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);
        const nameText = this.scene.add.text(0, -130, cardData.name, { fontSize: '38px', color: '#000', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        const costBg = this.scene.add.sprite(-90, -145, 'energy').setScale(0.7);
        const costText = this.scene.add.text(-90, -145, cardData.cost.toString(), { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15, left: 10, right: 10 } }).setOrigin(0.5);
        const descText = this.scene.add.text(0, 20, cardData.desc, { fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        return this.scene.add.container(x, y, [bg, nameText, costBg, costText, descText]);
    }
}