import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleManager } from '../managers/BattleManager';
import { TopBar } from '../ui/TopBar';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip'; 
import type { TooltipItem } from '../ui/Tooltip'; 
import { SettingsManager } from '../managers/SettingsManager';
import type { ICardData } from '../types';

// 💡 규칙 1 준수: any를 대체할 명확한 인터페이스 정의
interface ICardStartPos {
    x: number;
    y: number;
    angle: number;
}

const KEYWORD_DICT: Record<string, string> = {
    '방어도': '다음 턴까지 적의 공격 피해를 막아줍니다.',
    '독': '매 턴 시작 시 수치만큼 피해를 입고, 중첩이 1 감소합니다.',
    '취약': '받는 공격 피해가 50% 증가합니다.',
    '약화': '가하는 공격 피해가 25% 감소합니다.',
    '힘': '공격 카드의 피해량이 수치만큼 증가합니다.'
};

export default class BattleScene extends Phaser.Scene {
    private topBar!: TopBar;
    private endTurnButton!: Button;
    private tooltip!: Tooltip; 

    private drawPileBtn!: Button;
    private discardPileBtn!: Button;
    private turnCount: number = 1;

    playerSprite!: Phaser.GameObjects.Sprite;
    playerHpText!: Phaser.GameObjects.Text;
    playerHpBarFill!: Phaser.GameObjects.Rectangle; 
    manaContainer!: Phaser.GameObjects.Container;
    manaText!: Phaser.GameObjects.Text;
    blockContainer!: Phaser.GameObjects.Container;
    blockText!: Phaser.GameObjects.Text;
    
    enemySprite!: Phaser.GameObjects.Sprite;
    enemyHpText!: Phaser.GameObjects.Text;
    enemyHpBarFill!: Phaser.GameObjects.Rectangle; 
    enemyIntentText!: Phaser.GameObjects.Text;
    enemyIntentIcon!: Phaser.GameObjects.Sprite; 
    
    turnText!: Phaser.GameObjects.Text;
    cardContainers: Phaser.GameObjects.Container[] = [];

    // 💡 규칙 1 준수: any 제거
    private selectedCard: { container: Phaser.GameObjects.Container, data: ICardData, index: number, startPos: ICardStartPos } | null = null;

    constructor() {
        super({ key: 'BattleScene' });
    }

    private get isMobileMode(): boolean {
        if (SettingsManager.settings.forceUIMode === 'mobile') return true;
        if (SettingsManager.settings.forceUIMode === 'pc') return false;
        return this.sys.game.device.os.android || this.sys.game.device.os.iOS || this.sys.game.device.os.iPad;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.tooltip = new Tooltip(this); 

        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => this.openPileModal(`마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck),
            onSettingsClick: () => this.openSettingsModal()
        });

        this.createActors();
        
        // 💡 규칙 2 준수: 고정 픽셀 대신 width/height 비율(%) 배치로 전면 교체
        this.endTurnButton = new Button({
            scene: this, x: width * 0.88, y: height * 0.85, text: `${this.turnCount}턴 종료`, variant: 'secondary', width: 260, height: 80,
            onClick: () => { if (GameState.turn === 'player') this.endPlayerTurn(); }
        });

        this.drawPileBtn = new Button({
            scene: this, x: width * 0.12, y: height * 0.9, text: '덱: -', variant: 'primary', width: 200, height: 60, fontSize: '32px',
            onClick: () => this.openPileModal('뽑을 카드 더미', GameState.deck || [])
        });

        this.discardPileBtn = new Button({
            scene: this, x: width * 0.88, y: height * 0.94, text: '버림: -', variant: 'secondary', width: 200, height: 60, fontSize: '32px',
            onClick: () => this.openPileModal('버린 카드 더미', GameState.discard || [])
        });
        
        this.turnText = this.add.text(width * 0.5, height * 0.15, '', { fontSize: '50px', color: '#ffffff', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            if (GameState.turn !== 'player' || !this.isMobileMode) return;

            const clickedCard = currentlyOver.find(obj => this.cardContainers.includes(obj as Phaser.GameObjects.Container));
            
            if (!clickedCard && this.selectedCard) {
                // 화면 상단을 누르면 카드 사용, 하단을 누르면 선택 취소
                if (pointer.y < height * 0.6) {
                    this.playCard(this.selectedCard.data, this.selectedCard.index, this.selectedCard.container);
                    this.selectedCard = null;
                    this.tooltip.hide();
                } else {
                    this.deselectCard(true);
                }
            }
        });

        EventBus.on('hand-updated', () => this.renderHand(false), this);
        BattleManager.startBattle();
        this.updateUI();
        this.turnText.setText('플레이어 턴');
        this.renderHand(true); 
    }

    createActors() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const hpBarWidth = 240;
        const hpBarHeight = 30;

        // 플레이어 배치
        this.playerSprite = this.add.sprite(width * 0.25, height * 0.45, 'player').setScale(0.32).setInteractive(); 
        this.playerSprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if (GameState.player.block > 0) items.push({ title: '방어도', desc: `현재 ${GameState.player.block}의 피해를 막을 수 있습니다.`, iconKey: 'shieldicon' });
            items.push({ title: '상태', desc: '현재 걸려있는 버프/디버프가 없습니다.' });
            this.tooltip.show(this.playerSprite.x + 150, this.playerSprite.y - 100, items);
        });
        this.playerSprite.on('pointerout', () => this.tooltip.hide());

        this.add.rectangle(width * 0.25, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0x333333); 
        this.playerHpBarFill = this.add.rectangle(width * 0.25 - hpBarWidth / 2, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5); 
        this.playerHpText = this.add.text(width * 0.25, height * 0.45 + 230, '', { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 10, bottom: 10 } }).setOrigin(0.5);

        const manaBg = this.add.sprite(0, 0, 'energy').setScale(2.5);
        this.manaText = this.add.text(0, 0, '', { fontSize: '52px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        this.manaContainer = this.add.container(width * 0.15, height * 0.8, [manaBg, this.manaText]);

        const blockBg = this.add.sprite(0, 0, 'shield').setScale(0.08);
        this.blockText = this.add.text(0, 0, '', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        this.blockContainer = this.add.container(width * 0.25 - 150, height * 0.45 + 230, [blockBg, this.blockText]);
        this.blockContainer.setVisible(false);

        // 적 배치
        this.enemySprite = this.add.sprite(width * 0.75, height * 0.45, 'enemy_gunha').setScale(0.45).setInteractive();
        this.enemySprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if (GameState.enemy.intent) items.push({ title: '공격', desc: `플레이어에게 ${GameState.enemy.intent.value}의 피해를 입힐 예정입니다.`, iconKey: 'swordicon' });
            this.tooltip.show(this.enemySprite.x - 530, this.enemySprite.y - 100, items);
        });
        this.enemySprite.on('pointerout', () => this.tooltip.hide());

        this.add.rectangle(width * 0.75, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0x333333);
        this.enemyHpBarFill = this.add.rectangle(width * 0.75 - hpBarWidth / 2, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5);
        this.enemyHpText = this.add.text(width * 0.75, height * 0.45 + 230, '', { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 10, bottom: 10 } }).setOrigin(0.5);
        
        this.enemyIntentIcon = this.add.sprite(width * 0.75 - 20, height * 0.45 - 250, 'swordicon').setScale(0.1).setOrigin(1, 0.5);
        this.enemyIntentText = this.add.text(width * 0.75, height * 0.45 - 250, '', { fontSize: '44px', color: '#ffaaaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 15, bottom: 15 } }).setOrigin(0, 0.5);
    }

    renderHand(animate: boolean = false) {
        this.cardContainers.forEach(container => container.destroy());
        this.cardContainers = [];
        this.selectedCard = null; 

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const handSize = GameState.hand.length;
        
        const cardSpacing = Math.min(220, (width * 0.6) / Math.max(1, handSize)); // 💡 덱이 늘어나도 안전하도록 조절
        const startX = (width * 0.5) - ((handSize - 1) * cardSpacing) / 2;

        GameState.hand.forEach((cardData, index) => {
            const offsetFromCenter = index - (handSize - 1) / 2;
            const targetX = startX + (index * cardSpacing);
            const targetY = height * 0.85 + Math.abs(offsetFromCenter) * 20; 
            const targetAngle = offsetFromCenter * 5; 

            this.createCardView(targetX, targetY, targetAngle, cardData, index, animate, index);
        });
    }

    createCardView(x: number, y: number, angle: number, cardData: ICardData, handIndex: number, animate: boolean, delayIndex: number) {
        const cardWidth = 260;
        const cardHeight = 380;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);
        
        const nameText = this.add.text(0, -130, cardData.name, { fontSize: '38px', color: '#000', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        const costBg = this.add.sprite(-90, -145, 'energy').setScale(0.7);
        const costText = this.add.text(-90, -145, cardData.cost.toString(), { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15, left: 10, right: 10 } }).setOrigin(0.5);
        const descText = this.add.text(0, 20, cardData.desc, { fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);

        const cardContainer = this.add.container(x, y, [bg, nameText, costBg, costText, descText]);
        cardContainer.setSize(cardWidth, cardHeight);
        cardContainer.setAngle(angle); 
        
        if (animate) {
            // 💡 비율 기반 드로우 애니메이션 시작 좌표
            cardContainer.setPosition(width * 0.12, height * 0.9);
            cardContainer.setAngle(0);
            cardContainer.setScale(0.1);
            this.tweens.add({ targets: cardContainer, x: x, y: y, angle: angle, scale: 1, delay: delayIndex * 150, duration: 400, ease: 'Back.easeOut', onStart: () => { this.sound.play(`shuffle${Phaser.Math.Between(1, 7)}`); } });
        }

        cardContainer.setInteractive();
        this.input.setDraggable(cardContainer);
        const startPos: ICardStartPos = { x, y, angle }; // 💡 명확한 타입 사용

        cardContainer.on('pointerdown', () => {
            if (GameState.turn !== 'player') return;
            if (this.isMobileMode) {
                if (this.selectedCard?.container === cardContainer) {
                    this.deselectCard(true); 
                } else {
                    this.selectCard(cardContainer, cardData, handIndex, startPos);
                }
            }
        });

        cardContainer.on('pointerover', () => {
            if (GameState.turn !== 'player' || this.isMobileMode) return; 
            this.children.bringToTop(cardContainer);
            bg.setStrokeStyle(8, 0xffff00);
            this.sound.play('click'); 
            this.tweens.add({ targets: cardContainer, y: y - 100, scale: 1.2, angle: 0, duration: 100 });
            this.showCardTooltip(cardContainer, cardData);
        });

        cardContainer.on('pointerout', () => {
            if (GameState.turn !== 'player' || this.isMobileMode) return; 
            bg.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: cardContainer, y: startPos.y, scale: 1, angle: startPos.angle, duration: 100 });
            this.tooltip.hide();
        });

        cardContainer.on('dragstart', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer); 
            this.tooltip.hide(); 

            if (this.isMobileMode && this.selectedCard?.container !== cardContainer) {
                this.selectCard(cardContainer, cardData, handIndex, startPos);
                this.tooltip.hide(); 
            }
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

            // 사용 판정 기준 (화면 높이의 60% 이상 위로 올렸을 때)
            if (cardContainer.y < height * 0.6) {
                this.playCard(cardData, handIndex, cardContainer); 
                this.selectedCard = null; 
                this.tooltip.hide();
            } else {
                this.tweens.add({ targets: cardContainer, x: startPos.x, y: startPos.y, angle: startPos.angle, scale: 1, duration: 200, ease: 'Back.easeOut' });
                if (this.isMobileMode) this.selectedCard = null; 
            }
        });

        this.cardContainers.push(cardContainer);
    }

    private selectCard(container: Phaser.GameObjects.Container, cardData: ICardData, index: number, startPos: ICardStartPos) {
        if (this.selectedCard) this.deselectCard(true); 
        
        this.selectedCard = { container, data: cardData, index, startPos };
        this.children.bringToTop(container);
        this.sound.play('click');
        
        const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setStrokeStyle(8, 0xffff00);
        
        this.tweens.add({ targets: container, y: startPos.y - 150, scale: 1.2, angle: 0, duration: 150 });
        this.showCardTooltip(container, cardData);
    }

    private deselectCard(animateBack: boolean) {
        if (!this.selectedCard) return;
        
        const { container, startPos } = this.selectedCard;
        const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setStrokeStyle(6, 0xffffff);
        
        if (animateBack) {
            this.tweens.add({ targets: container, x: startPos.x, y: startPos.y, scale: 1, angle: startPos.angle, duration: 150 });
        }
        
        this.selectedCard = null;
        this.tooltip.hide();
    }

    private showCardTooltip(cardContainer: Phaser.GameObjects.Container, cardData: ICardData) {
        const tooltipItems: TooltipItem[] = [];
        for (const [keyword, description] of Object.entries(KEYWORD_DICT)) {
            if (cardData.desc.includes(keyword) || cardData.name.includes(keyword)) {
                let iconKey = undefined;
                if (keyword === '방어도') iconKey = 'shieldicon';
                if (keyword === '독' || keyword === '힘' || keyword === '취약' || keyword === '약화') iconKey = 'swordicon'; 
                tooltipItems.push({ title: keyword, desc: description, iconKey });
            }
        }
        if (tooltipItems.length > 0) this.tooltip.show(cardContainer.x + 160, cardContainer.y - 300, tooltipItems); 
    }

    private discardCardAnim(container: Phaser.GameObjects.Container, delay: number = 0) {
        // 💡 비율 기반 버림 좌표
        const discardX = this.cameras.main.width * 0.88; 
        const discardY = this.cameras.main.height * 0.94; 

        container.disableInteractive(); 
        this.children.bringToTop(container);
        this.tooltip.hide();

        this.tweens.add({ targets: container, x: discardX, scale: 0.1, angle: 180 + Phaser.Math.Between(-90, 90), alpha: 0, delay: delay, duration: 500, ease: 'Sine.easeInOut', onComplete: () => container.destroy() });
        this.tweens.add({ targets: container, y: container.y - 300, delay: delay, duration: 250, ease: 'Quad.easeOut', onComplete: () => { this.tweens.add({ targets: container, y: discardY, duration: 250, ease: 'Quad.easeIn' }); } });
    }

    playCard(cardData: ICardData, handIndex: number, cardContainer: Phaser.GameObjects.Container) {
        this.cardContainers = this.cardContainers.filter(c => c !== cardContainer);
        const result = BattleManager.playCard(cardData, handIndex);

        if (!result.success) {
            this.sound.play('error'); 
            this.showFloatingText(this.cameras.main.width * 0.5, this.cameras.main.height * 0.5, result.reason || "사용 불가", 0xff0000);
            this.cardContainers.push(cardContainer); 
            this.renderHand(false); 
            return;
        }

        this.discardCardAnim(cardContainer);

        if (result.damageDealt > 0 || cardData.type === 'ATTACK') {
            this.shootProjectile(this.playerSprite.x, this.playerSprite.y, this.enemySprite.x, this.enemySprite.y, () => {
                if (result.blockedDamage > 0) this.sound.play('shieldblock');
                if (result.damageDealt > 0) {
                    this.sound.play('hit'); 
                    this.showFloatingText(this.enemySprite.x, this.enemySprite.y - 100, `-${result.damageDealt}`, 0xff0000);
                    this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 30, yoyo: true, duration: 100 });
                }
                this.updateUI(); 
                this.handleWinLose(); 
            });
        } else {
            if (result.blockGained > 0) {
                this.sound.play('shieldappear');
                this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 100, `+${result.blockGained}`, 0x00aaff);
            }
            this.updateUI();
            this.handleWinLose(); 
        }

        this.renderHand(false); 
    }

    private shootProjectile(startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        const spit = this.add.circle(startX, startY, 15, 0xffffff).setDepth(50); 
        this.tweens.add({ targets: spit, x: endX, y: endY, duration: 200, ease: 'Power1', onComplete: () => { spit.destroy(); onComplete(); } });
    }

    endPlayerTurn() {
        this.cardContainers.forEach((container, idx) => { this.discardCardAnim(container, idx * 80); });
        this.cardContainers = []; 
        BattleManager.endPlayerTurn(); 
        this.turnText.setText('적 턴...');
        this.endTurnButton.setText('적 턴...');
        this.time.delayedCall(1000, () => this.processEnemyTurn());
    }

    processEnemyTurn() {
        const result = BattleManager.processEnemyTurn();
        this.tweens.add({ targets: this.enemySprite, x: this.enemySprite.x - 30, yoyo: true, duration: 100 });
        if (result.blockedDamage > 0) this.sound.play('shieldblock');
        if (result.damageDealt > 0) {
            this.sound.play('hit'); 
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 100, `-${result.damageDealt}`, 0xff0000);
        }

        this.updateUI();

        if (!this.handleWinLose()) {
            this.time.delayedCall(1000, () => {
                this.turnCount++;
                BattleManager.startNextTurn();
                this.turnText.setText('플레이어 턴');
                this.endTurnButton.setText(`${this.turnCount}턴 종료`); 
                this.updateUI();
                this.renderHand(true); 
            });
        }
    }

    handleWinLose(): boolean {
        const status = BattleManager.checkWinLose();
        if (status === 'win') {
            GameState.turn = 'animating';
            this.turnText.setText('전투 승리!');
            this.enemySprite.setAlpha(0.2);
            this.time.delayedCall(1000, () => { GameState.floor += 1; GameState.enemy.hp = GameState.enemy.maxHp; this.scene.start('RewardScene'); });
            return true;
        }
        if (status === 'lose') {
            GameState.turn = 'animating';
            this.turnText.setText('게임 오버');
            this.playerSprite.setAlpha(0.2);
            SaveSystem.clearSave(); 
            this.time.delayedCall(2000, () => { GameState.masterDeck = []; this.scene.start('MenuScene'); });
            return true;
        }
        return false;
    }

    updateUI() {
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor });
        this.drawPileBtn.setText(`덱: ${GameState.deck?.length || 0}장`);
        this.discardPileBtn.setText(`버림: ${GameState.discard?.length || 0}장`);

        const hpBarWidth = 240;
        this.playerHpText.setText(`${GameState.player.hp}/${GameState.player.maxHp}`);
        this.playerHpBarFill.width = hpBarWidth * Math.max(0, GameState.player.hp / GameState.player.maxHp);
        this.playerHpBarFill.fillColor = GameState.player.block > 0 ? 0x00aaff : 0xff0000;

        this.enemyHpText.setText(`${GameState.enemy.hp}/${GameState.enemy.maxHp}`);
        this.enemyHpBarFill.width = hpBarWidth * Math.max(0, GameState.enemy.hp / GameState.enemy.maxHp);
        this.enemyHpBarFill.fillColor = GameState.enemy.block > 0 ? 0x00aaff : 0xff0000;
        
        this.manaText.setText(`${GameState.player.mana}/${GameState.player.maxMana}`);
        
        if (GameState.player.block > 0) {
            this.blockContainer.setVisible(true);
            this.blockText.setText(GameState.player.block.toString());
        } else {
            this.blockContainer.setVisible(false);
        }
        
        if (GameState.enemy.intent) {
            this.enemyIntentText.setText(`${GameState.enemy.intent.value}`);
            this.enemyIntentIcon.setVisible(true);
        } else {
            this.enemyIntentText.setText('');
            this.enemyIntentIcon.setVisible(false);
        }
    }

    showFloatingText(x: number, y: number, message: string, color: number) {
        const text = this.add.text(x, y, message, { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 6, padding: { top: 12, bottom: 12 } }).setOrigin(0.5);
        text.setTint(color);
        this.tweens.add({ targets: text, y: y - 100, alpha: 0, duration: 1000, ease: 'Power1', onComplete: () => text.destroy() });
    }

    private openPileModal(title: string, cards: ICardData[]) {
        const modal = new Modal({ scene: this, title: title, width: 1800, height: 1200 });
        const content = modal.contentContainer;
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
            const cardWrapper = this.add.container(startX + (col * cellW), startY + (row * cellH), [cardView]);
            content.add(cardWrapper);
        });
    }

    private createVisualCardHelper(x: number, y: number, cardData: ICardData): Phaser.GameObjects.Container {
        const cardWidth = 260;
        const cardHeight = 380;
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xe0e0e0);
        bg.setStrokeStyle(6, 0xffffff);
        const nameText = this.add.text(0, -130, cardData.name, { fontSize: '38px', color: '#000', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        const costBg = this.add.sprite(-90, -145, 'energy').setScale(0.7);
        const costText = this.add.text(-90, -145, cardData.cost.toString(), { fontSize: '40px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15, left: 10, right: 10 } }).setOrigin(0.5);
        const descText = this.add.text(0, 20, cardData.desc, { fontSize: '28px', color: '#333', align: 'center', wordWrap: { width: 220 }, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        return this.add.container(x, y, [bg, nameText, costBg, costText, descText]);
    }

    private openSettingsModal() {
        const modal = new Modal({ scene: this, title: '환경 설정', width: 800, height: 600 });
        const content = modal.contentContainer;
        const modeText = this.add.text(0, -50, `현재 UI 모드: ${SettingsManager.settings.forceUIMode}`, { fontSize: '40px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        content.add(modeText);

        const autoBtn = new Button({ scene: this, x: -220, y: 50, text: '자동 감지', variant: 'secondary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('auto'); modeText.setText(`현재 UI 모드: auto`); } });
        const pcBtn = new Button({ scene: this, x: 0, y: 50, text: 'PC 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('pc'); modeText.setText(`현재 UI 모드: pc`); } });
        const mobileBtn = new Button({ scene: this, x: 220, y: 50, text: '모바일 모드', variant: 'primary', width: 180, height: 60, fontSize: '28px', onClick: () => { SettingsManager.setForceUIMode('mobile'); modeText.setText(`현재 UI 모드: mobile`); } });
        content.add([autoBtn, pcBtn, mobileBtn]);
    }
}