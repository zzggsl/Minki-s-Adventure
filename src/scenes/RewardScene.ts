import Phaser from 'phaser';
import { DeckSystem } from '../systems/DeckSystem';
import { CardDatabase } from '../data/cards';
import type { ICardData } from '../types';

export default class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RewardScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, 200, '전투 승리!', { 
            fontSize: '80px', color: '#ffdd00', fontStyle: 'bold', padding: { top: 20, bottom: 20 } 
        }).setOrigin(0.5);

        this.add.text(width / 2, 350, '전리품을 선택하세요 (1장)', { 
            fontSize: '50px', color: '#ffffff', padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);

        // 선택지로 제시할 카드 3장 (강타, 철벽을 섞어서 제시)
        const rewardOptions = [
            CardDatabase['strike'], 
            CardDatabase['heavy_strike'], 
            CardDatabase['iron_wall']
        ];

        const cardSpacing = 350;
        const startX = (width / 2) - cardSpacing;

        rewardOptions.forEach((cardData, index) => {
            this.createRewardCard(startX + (index * cardSpacing), height / 2 + 150, cardData);
        });

        // 건너뛰기 버튼
        const skipBtn = this.add.rectangle(width / 2, height - 200, 250, 80, 0x555555).setInteractive();
        this.add.text(width / 2, height - 200, '건너뛰기', { 
            fontSize: '36px', color: '#fff', fontStyle: 'bold', padding: { top: 10, bottom: 10 } 
        }).setOrigin(0.5);

        skipBtn.on('pointerup', () => {
            this.scene.start('MapScene');
        });
    }

    createRewardCard(x: number, y: number, cardData: ICardData) {
        const cardWidth = 260;
        const cardHeight = 380;

        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);

        const nameText = this.add.text(0, -130, cardData.name, { 
            fontSize: '40px', color: '#000', fontStyle: 'bold', padding: { top: 8, bottom: 8 } 
        }).setOrigin(0.5);

        const costText = this.add.text(-90, -145, cardData.cost.toString(), { 
            fontSize: '36px', color: '#fff', backgroundColor: '#000', padding: { top: 10, bottom: 10, left: 14, right: 14 } 
        }).setOrigin(0.5);

        const descText = this.add.text(0, 20, cardData.desc, { 
            fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }, padding: { top: 8, bottom: 8 } 
        }).setOrigin(0.5);

        const cardContainer = this.add.container(x, y, [bg, nameText, costText, descText]);
        cardContainer.setSize(cardWidth, cardHeight);
        cardContainer.setInteractive();

        // 마우스 오버(터치) 시 카드 강조 연출
        cardContainer.on('pointerover', () => {
            bg.setStrokeStyle(8, 0xffff00);
            this.tweens.add({ targets: cardContainer, y: y - 40, duration: 100 });
        });
        cardContainer.on('pointerout', () => {
            bg.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: cardContainer, y: y, duration: 100 });
        });

        // 💡 클릭 시 내 영구 덱에 카드를 추가하고 MapScene으로 복귀!
        cardContainer.on('pointerup', () => {
            DeckSystem.addCardToMasterDeck(cardData.id);
            this.scene.start('MapScene');
        });
    }
}