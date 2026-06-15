import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleManager } from '../managers/BattleManager';
import type { ICardData } from '../types';

export default class BattleScene extends Phaser.Scene {
    playerSprite!: Phaser.GameObjects.Sprite;
    playerHpText!: Phaser.GameObjects.Text;
    
    manaContainer!: Phaser.GameObjects.Container;
    manaText!: Phaser.GameObjects.Text;
    blockContainer!: Phaser.GameObjects.Container;
    blockText!: Phaser.GameObjects.Text;
    
    enemySprite!: Phaser.GameObjects.Sprite;
    enemyHpText!: Phaser.GameObjects.Text;
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

        // 💡 1. 플레이어 스프라이트 배치 및 크기 축소 (임의 조정: 0.4배)
        this.playerSprite = this.add.sprite(width * 0.2, height * 0.5, 'player');
        this.playerSprite.setScale(0.4); 
        
        this.playerHpText = this.add.text(width * 0.2, height * 0.5 + 250, '', { 
            fontSize: '36px', color: '#fff', fontStyle: 'bold', padding: { top: 8, bottom: 8 } 
        }).setOrigin(0.5);

        // 💡 2. 에너지 보석 UI 생성 및 크기 확대 (임의 조정: 2.5배)
        const manaBg = this.add.sprite(0, 0, 'energy');
        manaBg.setScale(2.5);
        
        // 💡 3. 에너지 글자가 잘 보이도록 검은색 두꺼운 테두리(stroke) 추가
        this.manaText = this.add.text(0, 0, '', { 
            fontSize: '52px', 
            color: '#ffffff', 
            fontStyle: 'bold',
            stroke: '#000000',      // 검은색 테두리
            strokeThickness: 8,     // 테두리 두께 8px
            padding: { top: 5, bottom: 5 } 
        }).setOrigin(0.5);
        
        // 좌측 하단 여백 비율 기반으로 배치
        this.manaContainer = this.add.container(width * 0.12, height * 0.82, [manaBg, this.manaText]);

        // 플레이어 방어도 UI (체력바 옆에 배치)
        const blockBg = this.add.rectangle(0, 0, 50, 50, 0x00aaff).setAngle(45);
        this.blockText = this.add.text(0, 0, '', { 
            fontSize: '28px', color: '#fff', fontStyle: 'bold', padding: { top: 5, bottom: 5 } 
        }).setOrigin(0.5);
        this.blockContainer = this.add.container(width * 0.2 - 120, height * 0.5 + 250, [blockBg, this.blockText]);
        this.blockContainer.setVisible(false);

        // 💡 4. 적 건하 스프라이트 배치 및 크기 축소 (임의 조정: 0.45배)
        this.enemySprite = this.add.sprite(width * 0.8, height * 0.5, 'enemy_gunha');
        this.enemySprite.setScale(0.45);
        
        this.enemyHpText = this.add.text(width * 0.8, height * 0.5 + 250, '', { 
            fontSize: '36px', color: '#fff', fontStyle: 'bold', padding: { top: 8, bottom: 8 } 
        }).setOrigin(0.5);
        
        this.enemyIntentText = this.add.text(width * 0.8, height * 0.5 - 250, '', { 
            fontSize: '38px', color: '#ffaaaa', fontStyle: 'bold', padding: { top: 8, bottom: 8 } 
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
            fontSize: '36px', color: '#fff', fontStyle: 'bold', padding: { top: 8, bottom: 8 } 
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
        this.playerHpText.setText(`${GameState.player.hp} / ${GameState.player.maxHp}`);
        this.enemyHpText.setText(`${GameState.enemy.hp} / ${GameState.enemy.maxHp}`);
        
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