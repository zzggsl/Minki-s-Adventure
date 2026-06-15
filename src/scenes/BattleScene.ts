import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleManager } from '../managers/BattleManager';
import type { ICardData } from '../types';

export default class BattleScene extends Phaser.Scene {
    playerSprite!: Phaser.GameObjects.Sprite;
    playerHpText!: Phaser.GameObjects.Text;
    playerHpBarFill!: Phaser.GameObjects.Rectangle; // 💡 플레이어 체력바 게이지
    
    manaContainer!: Phaser.GameObjects.Container;
    manaText!: Phaser.GameObjects.Text;
    blockContainer!: Phaser.GameObjects.Container;
    blockText!: Phaser.GameObjects.Text;
    
    enemySprite!: Phaser.GameObjects.Sprite;
    enemyHpText!: Phaser.GameObjects.Text;
    enemyHpBarFill!: Phaser.GameObjects.Rectangle; // 💡 적 체력바 게이지
    enemyIntentText!: Phaser.GameObjects.Text;
    
    turnText!: Phaser.GameObjects.Text;
    cardContainers: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'BattleScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.createActors();
        this.createEndTurnButton(width - 200, height / 1.2);
        
        this.turnText = this.add.text(width / 2, 100, '', { 
            fontSize: '50px', color: '#ffffff', fontStyle: 'bold', padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);
        
        EventBus.on('hand-updated', this.renderHand, this);

        BattleManager.startBattle();
        this.updateUI();
        this.turnText.setText('플레이어 턴');
    }

    createActors() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hpBarWidth = 240;
        const hpBarHeight = 30;

        // ---------- [플레이어 영역] ----------
        this.playerSprite = this.add.sprite(width * 0.2, height * 0.5, 'player').setScale(0.4); 
        
        // 💡 1. 플레이어 체력바 & 텍스트 세팅
        this.add.rectangle(width * 0.2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0x333333); // 배경
        this.playerHpBarFill = this.add.rectangle(width * 0.2 - hpBarWidth / 2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5); // 게이지
        
        this.playerHpText = this.add.text(width * 0.2, height * 0.5 + 230, '', { 
            fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 
        }).setOrigin(0.5);

        // 💡 2. 마나 UI
        const manaBg = this.add.sprite(0, 0, 'energy').setScale(2.5);
        this.manaText = this.add.text(0, 0, '', { 
            fontSize: '52px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8 
        }).setOrigin(0.5);
        this.manaContainer = this.add.container(width * 0.12, height * 0.82, [manaBg, this.manaText]);

        // 💡 3. 플레이어 방어 UI (마름모 -> 방패 스프라이트)
        const blockBg = this.add.sprite(0, 0, 'shield').setScale(1.2);
        this.blockText = this.add.text(0, 0, '', { 
            fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);
        // 체력바 바로 왼쪽에 배치
        this.blockContainer = this.add.container(width * 0.2 - 160, height * 0.5 + 230, [blockBg, this.blockText]);
        this.blockContainer.setVisible(false);

        // ---------- [적 영역] ----------
        this.enemySprite = this.add.sprite(width * 0.8, height * 0.5, 'enemy_gunha').setScale(0.45);
        
        // 💡 4. 적 체력바 & 텍스트 세팅
        this.add.rectangle(width * 0.8, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0x333333);
        this.enemyHpBarFill = this.add.rectangle(width * 0.8 - hpBarWidth / 2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5);
        
        this.enemyHpText = this.add.text(width * 0.8, height * 0.5 + 230, '', { 
            fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6 
        }).setOrigin(0.5);
        
        this.enemyIntentText = this.add.text(width * 0.8, height * 0.5 - 250, '', { 
            fontSize: '38px', color: '#ffaaaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5);
    }

    renderHand() {
        this.cardContainers.forEach(container => container.destroy());
        this.cardContainers = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const handSize = GameState.hand.length;
        
        const cardSpacing = 220; 
        const startX = (width / 2) - ((handSize - 1) * cardSpacing) / 2;

        GameState.hand.forEach((cardData, index) => {
            const offsetFromCenter = index - (handSize - 1) / 2;
            const x = startX + (index * cardSpacing);
            const y = height - 150 + Math.abs(offsetFromCenter) * 30; 
            const angle = offsetFromCenter * 5; 

            this.createCardView(x, y, angle, cardData, index);
        });
    }

    createCardView(x: number, y: number, angle: number, cardData: ICardData, handIndex: number) {
        const cardWidth = 260;
        const cardHeight = 380;
        
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);
        
        const nameText = this.add.text(0, -130, cardData.name, { 
            fontSize: '40px', color: '#000', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        // 💡 5. 카드 비용(에너지) UI를 검은 사각형에서 보석 스프라이트로 변경
        const costBg = this.add.sprite(-90, -145, 'energy').setScale(0.8);
        const costText = this.add.text(-90, -145, cardData.cost.toString(), { 
            fontSize: '42px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5);
        
        const descText = this.add.text(0, 20, cardData.desc, { 
            fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }
        }).setOrigin(0.5);

        const cardContainer = this.add.container(x, y, [bg, nameText, costBg, costText, descText]);
        cardContainer.setSize(cardWidth, cardHeight);
        cardContainer.setAngle(angle); 
        
        cardContainer.setInteractive();
        this.input.setDraggable(cardContainer);

        const startPos = { x, y, angle };

        cardContainer.on('pointerover', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer);
            bg.setStrokeStyle(8, 0xffff00);
            this.tweens.add({ targets: cardContainer, y: y - 100, scale: 1.2, angle: 0, duration: 100 });
        });

        cardContainer.on('pointerout', () => {
            if (GameState.turn !== 'player') return;
            bg.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: cardContainer, y: startPos.y, scale: 1, angle: startPos.angle, duration: 100 });
        });

        cardContainer.on('dragstart', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer); 
        });

        cardContainer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (GameState.turn !== 'player') return;
            cardContainer.x = dragX;
            cardContainer.y = dragY;
            cardContainer.setAngle(0); 
        });

        cardContainer.on('dragend', () => {
            if (GameState.turn !== 'player') return;
            bg.setStrokeStyle(6, 0xffffff);

            if (cardContainer.y < this.cameras.main.height - 450) {
                this.playCard(cardData, handIndex);
            } else {
                this.tweens.add({ targets: cardContainer, x: startPos.x, y: startPos.y, angle: startPos.angle, scale: 1, duration: 200, ease: 'Back.easeOut' });
            }
        });

        this.cardContainers.push(cardContainer);
    }

    createEndTurnButton(x: number, y: number) {
        const btnBg = this.add.rectangle(x, y, 220, 80, 0x555555).setInteractive();
        this.add.text(x, y, '턴 종료', { 
            fontSize: '36px', color: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        btnBg.on('pointerdown', () => {
            if (GameState.turn === 'player') {
                btnBg.fillColor = 0x333333;
                this.endPlayerTurn();
            }
        });
        btnBg.on('pointerup', () => btnBg.fillColor = 0x555555);
    }
    
    playCard(cardData: ICardData, handIndex: number) {
        const result = BattleManager.playCard(cardData, handIndex);

        if (!result.success) {
            this.showFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, result.reason || "사용 불가", 0xff0000);
            EventBus.emit('hand-updated'); 
            return;
        }

        if (result.damageDealt > 0) {
            this.showFloatingText(this.enemySprite.x, this.enemySprite.y - 100, `-${result.damageDealt}`, 0xff0000);
            this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 30, yoyo: true, duration: 100 });
        }
        if (result.blockGained > 0) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 100, `+${result.blockGained} 방어도`, 0x00aaff);
        }

        this.updateUI();
        this.handleWinLose(); 
    }

    endPlayerTurn() {
        BattleManager.endPlayerTurn(); 
        this.turnText.setText('적 턴...');
        
        this.time.delayedCall(1000, () => {
            this.processEnemyTurn();
        });
    }

    processEnemyTurn() {
        const result = BattleManager.processEnemyTurn();
        
        this.tweens.add({ targets: this.enemySprite, x: this.enemySprite.x - 30, yoyo: true, duration: 100 });
        
        if (result.damageDealt > 0) {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 100, `-${result.damageDealt}`, 0xff0000);
        }

        this.updateUI();

        if (!this.handleWinLose()) {
            this.time.delayedCall(1000, () => {
                BattleManager.startNextTurn();
                this.turnText.setText('플레이어 턴');
                this.updateUI();
            });
        }
    }

    handleWinLose(): boolean {
        const status = BattleManager.checkWinLose();

        if (status === 'win') {
            GameState.turn = 'animating';
            this.turnText.setText('전투 승리!');
            this.enemySprite.setAlpha(0.2);
            
            this.time.delayedCall(1000, () => {
                GameState.floor += 1; 
                GameState.enemy.hp = GameState.enemy.maxHp; 
                this.scene.start('RewardScene'); 
            });
            return true;
        }
        
        if (status === 'lose') {
            GameState.turn = 'animating';
            this.turnText.setText('게임 오버');
            this.playerSprite.setAlpha(0.2);
            
            SaveSystem.clearSave(); 
            this.time.delayedCall(2000, () => {
                GameState.masterDeck = []; 
                this.scene.start('MenuScene'); 
            });
            return true;
        }

        return false;
    }

    updateUI() {
        const hpBarWidth = 240;

        // 💡 6. 플레이어 체력바 너비 및 색상(하늘색/빨간색) 업데이트
        this.playerHpText.setText(`${GameState.player.hp} / ${GameState.player.maxHp}`);
        const playerHpPercent = Math.max(0, GameState.player.hp / GameState.player.maxHp);
        this.playerHpBarFill.width = hpBarWidth * playerHpPercent;
        this.playerHpBarFill.fillColor = GameState.player.block > 0 ? 0x00aaff : 0xff0000;

        // 💡 7. 적 체력바 너비 및 색상 업데이트
        this.enemyHpText.setText(`${GameState.enemy.hp} / ${GameState.enemy.maxHp}`);
        const enemyHpPercent = Math.max(0, GameState.enemy.hp / GameState.enemy.maxHp);
        this.enemyHpBarFill.width = hpBarWidth * enemyHpPercent;
        this.enemyHpBarFill.fillColor = GameState.enemy.block > 0 ? 0x00aaff : 0xff0000;
        
        this.manaText.setText(`${GameState.player.mana}/${GameState.player.maxMana}`);
        
        if (GameState.player.block > 0) {
            this.blockContainer.setVisible(true);
            this.blockText.setText(GameState.player.block.toString());
        } else {
            this.blockContainer.setVisible(false);
        }

        this.enemyIntentText.setText(`의도: 공격(${GameState.enemy.intent?.value})`);
    }

    showFloatingText(x: number, y: number, message: string, color: number) {
        const text = this.add.text(x, y, message, { 
            fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, padding: { top: 12, bottom: 12 } 
        }).setOrigin(0.5);
        text.setTint(color);
        
        this.tweens.add({ targets: text, y: y - 100, alpha: 0, duration: 1000, ease: 'Power1', onComplete: () => text.destroy() });
    }
}