// src/scenes/RewardScene.ts
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { getRandomRewardCards } from '../data/cards'; // 💡 새로 만든 카드 뽑기 함수

export default class RewardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'RewardScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 💡 10G ~ 20G 사이의 유동적인 골드 보상 생성
        const goldReward = Phaser.Math.Between(10, 20); 
        let isGoldClaimed = false;

        // ==========================================
        // 1. 보상 목록 화면 (기본 노출)
        // ==========================================
        const rewardListContainer = this.add.container(0, 0);

        const title = this.add.text(width / 2, height * 0.2, '전투 승리!', { 
            fontSize: '80px', color: '#ffdd00', fontStyle: 'bold', padding: { top: 20, bottom: 20 } 
        }).setOrigin(0.5);
        rewardListContainer.add(title);

        // 💰 골드 획득 버튼
        const goldBtnBg = this.add.rectangle(width / 2, height * 0.45, 500, 90, 0x333333).setInteractive();
        goldBtnBg.setStrokeStyle(4, 0xaaaaaa);
        const goldText = this.add.text(width / 2, height * 0.45, `💰 ${goldReward} 골드 획득`, {
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        rewardListContainer.add([goldBtnBg, goldText]);

        // 골드 획득 클릭 이벤트
        goldBtnBg.on('pointerdown', () => {
            if (isGoldClaimed) return;
            this.sound.play('click');
            
            // GameState에 골드 추가 (안전장치 포함)
            GameState.player.gold = (GameState.player.gold || 0) + goldReward;
            isGoldClaimed = true;
            
            // 획득 후 시각적 비활성화 처리
            goldBtnBg.setFillStyle(0x1a1a1a);
            goldBtnBg.setStrokeStyle(4, 0x555555);
            goldText.setText('✔️ 골드 획득 완료');
            goldText.setColor('#888888');
        });

        // 🃏 카드 보상 버튼
        const cardBtnBg = this.add.rectangle(width / 2, height * 0.6, 500, 90, 0x333333).setInteractive();
        cardBtnBg.setStrokeStyle(4, 0xaaaaaa);
        const cardText = this.add.text(width / 2, height * 0.6, `🃏 카드 보상 추가`, {
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        rewardListContainer.add([cardBtnBg, cardText]);

        // ⏭️ 넘어가기 (지도 복귀) 버튼
        const skipBtnBg = this.add.rectangle(width / 2, height * 0.85, 300, 70, 0x552222).setInteractive();
        skipBtnBg.setStrokeStyle(3, 0xaaaaaa);
        const skipText = this.add.text(width / 2, height * 0.85, `넘어가기 ⏭️`, {
            fontSize: '30px', color: '#ffffff'
        }).setOrigin(0.5);
        rewardListContainer.add([skipBtnBg, skipText]);

        skipBtnBg.on('pointerdown', () => {
            this.sound.play('click');
            this.scene.start('MapScene'); // 보상을 스킵하거나 다 챙긴 후 맵으로 이동
        });


        // ==========================================
        // 2. 카드 선택 화면 (초기엔 숨겨짐)
        // ==========================================
        const cardSelectionContainer = this.add.container(0, 0);
        cardSelectionContainer.setVisible(false); // 처음엔 보이지 않게 처리

        const selectTitle = this.add.text(width / 2, height * 0.2, '전리품을 선택하세요 (1장)', { 
            fontSize: '50px', color: '#ffffff', padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);
        cardSelectionContainer.add(selectTitle);

        // 무작위 카드 3장 뽑기
        const rewardOptions = getRandomRewardCards(3);
        const cardSpacing = 320;
        const startX = (width / 2) - cardSpacing;

        rewardOptions.forEach((cardData, index) => {
            const x = startX + (index * cardSpacing);
            const y = height / 2 + 50;
            const cardWidth = 260;
            const cardHeight = 380;

            const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x222222);
            bg.setStrokeStyle(6, 0xffffff);

            const nameText = this.add.text(0, -130, cardData.name, { 
                fontSize: '36px', color: '#000', fontStyle: 'bold', backgroundColor: '#fff', padding: { top: 8, bottom: 8, left: 10, right: 10 } 
            }).setOrigin(0.5);

            const costText = this.add.text(-90, -145, cardData.cost.toString(), { 
                fontSize: '32px', color: '#fff', backgroundColor: '#000', padding: { top: 10, bottom: 10, left: 14, right: 14 } 
            }).setOrigin(0.5);

            const descText = this.add.text(0, 20, cardData.desc, { 
                fontSize: '24px', color: '#fff', align: 'center', wordWrap: { width: 220 }, padding: { top: 8, bottom: 8 } 
            }).setOrigin(0.5);

            const cardContainer = this.add.container(x, y, [bg, nameText, costText, descText]);
            cardContainer.setSize(cardWidth, cardHeight);
            cardContainer.setInteractive();

            // 개발자님의 기존 디자인 - 마우스 오버(터치) 시 카드 강조 연출
            cardContainer.on('pointerover', () => {
                bg.setStrokeStyle(8, 0xffff00);
                this.tweens.add({ targets: cardContainer, y: y - 20, duration: 100 });
            });
            cardContainer.on('pointerout', () => {
                bg.setStrokeStyle(6, 0xffffff);
                this.tweens.add({ targets: cardContainer, y: y, duration: 100 });
            });

            // 카드 클릭 시 덱에 추가하고 맵으로 복귀
            cardContainer.on('pointerdown', () => {
                this.sound.play('click');
                GameState.masterDeck.push(cardData);
                this.scene.start('MapScene');
            });

            cardSelectionContainer.add(cardContainer);
        });

        // 카드 선택 스킵 (다시 보상 목록으로 돌아가기)
        const backBtnBg = this.add.rectangle(width / 2, height * 0.85, 250, 60, 0x444444).setInteractive();
        backBtnBg.setStrokeStyle(3, 0xaaaaaa);
        const backText = this.add.text(width / 2, height * 0.85, `돌아가기`, { fontSize: '28px', color: '#ffffff' }).setOrigin(0.5);
        cardSelectionContainer.add([backBtnBg, backText]);

        backBtnBg.on('pointerdown', () => {
            this.sound.play('click');
            cardSelectionContainer.setVisible(false);
            rewardListContainer.setVisible(true);
        });

        // ==========================================
        // 3. 버튼 클릭 화면 전환 로직
        // ==========================================
        cardBtnBg.on('pointerdown', () => {
            this.sound.play('click');
            rewardListContainer.setVisible(false); // 보상 목록 숨기기
            cardSelectionContainer.setVisible(true); // 카드 3장 보여주기
        });
    }
}