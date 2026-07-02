import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { SaveSystem } from '../systems/SaveSystem';
import { BattleManager } from '../managers/BattleManager';
import { TopBar } from '../ui/TopBar';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';  
import type { TooltipItem } from '../ui/Tooltip'; 
import { SettingsManager } from '../managers/SettingsManager';
import { KEYWORD_DICT } from '../data/keywords'; 
import { DeckModal } from '../ui/modals/DeckModal'; 
import { SettingsModal } from '../ui/modals/SettingsModal'; 
import type { ICardData } from '../types';

interface ICardStartPos { x: number; y: number; angle: number; }

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

    private selectedCard: { container: Phaser.GameObjects.Container, data: ICardData, index: number, startPos: ICardStartPos } | null = null;

    constructor() {
        super({ key: 'BattleScene' });
    }

    create() {
        this.turnCount = 1; 

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.tooltip = new Tooltip(this); 

        this.topBar = new TopBar({
            scene: this,
            onDeckClick: () => { new DeckModal(this, `마스터 덱 (총 ${GameState.masterDeck.length}장)`, GameState.masterDeck); },
            onSettingsClick: () => { new SettingsModal(this); }
        });

        this.createActors();
        
        // 💡 하단 UI 잘림 방지를 위해 Y축을 0.85/0.94 -> 0.82/0.88로 전체 상향
        this.endTurnButton = new Button({
            scene: this, x: width * 0.88, y: height * 0.82, text: `${this.turnCount}턴 종료`, variant: 'secondary', width: 260, height: 80,
            onClick: () => { if (GameState.turn === 'player') this.endPlayerTurn(); }
        });

        this.drawPileBtn = new Button({
            scene: this, x: width * 0.12, y: height * 0.88, text: '덱: -', variant: 'primary', width: 200, height: 60, fontSize: '32px',
            onClick: () => { new DeckModal(this, '뽑을 카드 더미', GameState.deck || []); }
        });

        this.discardPileBtn = new Button({
            scene: this, x: width * 0.88, y: height * 0.88, text: '버림: -', variant: 'secondary', width: 200, height: 60, fontSize: '32px',
            onClick: () => { new DeckModal(this, '버린 카드 더미', GameState.discard || []); }
        });
        
        this.turnText = this.add.text(width * 0.5, height * 0.15, '', { fontSize: '50px', color: '#ffffff', fontStyle: 'bold', padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
            if (GameState.turn !== 'player' || !SettingsManager.isMobileUI(this)) return;

            const clickedCard = currentlyOver.find(obj => this.cardContainers.includes(obj as Phaser.GameObjects.Container));
            
            if (!clickedCard && this.selectedCard) {
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

        this.playerSprite = this.add.sprite(width * 0.25, height * 0.45, 'player').setScale(0.32).setInteractive(); 
        this.playerSprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if ((GameState.player.block || 0) > 0) items.push({ title: '방어도', desc: `현재 ${GameState.player.block}의 피해를 막을 수 있습니다.`, iconKey: 'shieldicon' });
            items.push({ title: '상태', desc: '현재 걸려있는 버프/디버프가 없습니다.' });
            this.tooltip.show(this.playerSprite.x + 150, this.playerSprite.y - 100, items);
        });
        this.playerSprite.on('pointerout', () => this.tooltip.hide());

        this.add.rectangle(width * 0.25, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0x333333); 
        this.playerHpBarFill = this.add.rectangle(width * 0.25 - hpBarWidth / 2, height * 0.45 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5); 
        this.playerHpText = this.add.text(width * 0.25, height * 0.45 + 230, '', { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 10, bottom: 10 } }).setOrigin(0.5);

        // src/scenes/BattleScene.ts의 createActors() 내부

        // 💡 2. 에너지 보석 스케일을 2.5 -> 1.8로 줄이고 폰트 크기도 44px로 조절
        const manaBg = this.add.sprite(0, 0, 'energy').setScale(1.8);
        this.manaText = this.add.text(0, 0, '', { fontSize: '44px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        
        // 💡 컨테이너의 Y 위치를 height * 0.8 -> height * 0.82 로 아주 살짝 내림
        this.manaContainer = this.add.container(width * 0.15, height * 0.82, [manaBg, this.manaText]);

        const blockBg = this.add.sprite(0, 0, 'shield').setScale(0.08);
        this.blockText = this.add.text(0, 0, '', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        this.blockContainer = this.add.container(width * 0.25 - 150, height * 0.45 + 230, [blockBg, this.blockText]);
        this.blockContainer.setVisible(false);

        this.enemySprite = this.add.sprite(width * 0.75, height * 0.45, 'enemy_gunha').setScale(0.45).setInteractive();
        this.enemySprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if (GameState.enemy?.intent) items.push({ title: '공격', desc: `플레이어에게 ${GameState.enemy.intent.value}의 피해를 입힐 예정입니다.`, iconKey: 'swordicon' });
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
        const handSize = GameState.hand?.length || 0;
        
        const cardSpacing = Math.min(220, (width * 0.6) / Math.max(1, handSize)); 
        const startX = (width * 0.5) - ((handSize - 1) * cardSpacing) / 2;

        if (GameState.hand) {
            GameState.hand.forEach((cardData, index) => {
                const offsetFromCenter = index - (handSize - 1) / 2;
                const targetX = startX + (index * cardSpacing);
                // 💡 카드 렌더링 기준 Y 좌표 상향 (0.85 -> 0.82)
                const targetY = height * 0.82 + Math.abs(offsetFromCenter) * 20; 
                const targetAngle = offsetFromCenter * 5; 

                this.createCardView(targetX, targetY, targetAngle, cardData, index, animate, index);
            });
        }
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
            cardContainer.setPosition(width * 0.12, height * 0.9);
            cardContainer.setAngle(0);
            cardContainer.setScale(0.1);
            this.tweens.add({ targets: cardContainer, x: x, y: y, angle: angle, scale: 1, delay: delayIndex * 150, duration: 400, ease: 'Back.easeOut', onStart: () => { this.sound.play(`shuffle${Phaser.Math.Between(1, 7)}`); } });
        }

        // src/scenes/BattleScene.ts의 createCardView() 내부 하단

        cardContainer.setInteractive();
        this.input.setDraggable(cardContainer);
        const startPos: ICardStartPos = { x, y, angle }; 

        // 💡 1. 터치(클릭) 시 선택 로직
        cardContainer.on('pointerdown', () => {
            if (GameState.turn !== 'player') return;
            if (SettingsManager.isMobileUI(this)) {
                // 모바일: 이 카드가 아직 선택되지 않았다면 팝업 및 툴팁 표시
                if (this.selectedCard?.container !== cardContainer) {
                    this.selectCard(cardContainer, cardData, handIndex, startPos);
                }
            }
        });

        // 💡 2. 마우스 오버 (PC 환경 전용)
        cardContainer.on('pointerover', () => {
            if (GameState.turn !== 'player' || SettingsManager.isMobileUI(this)) return; 
            this.children.bringToTop(cardContainer);
            bg.setStrokeStyle(8, 0xffff00);
            this.sound.play('click'); 
            this.tweens.add({ targets: cardContainer, y: y - 100, scale: 1.2, angle: 0, duration: 100 });
            this.showCardTooltip(cardContainer, cardData);
        });

        // 💡 3. 마우스 아웃 (PC 환경 전용)
        cardContainer.on('pointerout', () => {
            if (GameState.turn !== 'player' || SettingsManager.isMobileUI(this)) return; 
            bg.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: cardContainer, y: startPos.y, scale: 1, angle: startPos.angle, duration: 100 });
            this.tooltip.hide();
        });

        // 💡 4. 드래그 시작 (모바일 미세 터치 방어 핵심)
        cardContainer.on('dragstart', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer); 

            if (SettingsManager.isMobileUI(this)) {
                if (this.selectedCard?.container !== cardContainer) {
                    // 모바일: 선택 안 된 카드를 드래그하려 하면 툴팁 안 끄고 '선택 상태'로만 만듦!
                    this.selectCard(cardContainer, cardData, handIndex, startPos);
                } else {
                    // 모바일: '이미 선택된' 카드를 본격적으로 드래그할 때 비로소 툴팁을 끔
                    this.tooltip.hide(); 
                }
            } else {
                this.tooltip.hide(); // PC 모드
            }
        });

        // 💡 5. 드래그 이동 중
        cardContainer.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
            if (GameState.turn !== 'player') return;
            
            // 모바일: 현재 선택된 카드가 아니면 드래그를 원천 차단 (자물쇠 채움)
            if (SettingsManager.isMobileUI(this) && this.selectedCard?.container !== cardContainer) {
                return; 
            }

            cardContainer.x = dragX;
            cardContainer.y = dragY;
            cardContainer.setAngle(0); 
        });

        // 💡 6. 드래그 종료
        cardContainer.on('dragend', () => {
            if (GameState.turn !== 'player') return;

            // 모바일: 드래그가 끝났는데 사용 영역(화면 위쪽)에 도달하지 못했다면, 
            // 원래 덱으로 넣지 말고 '선택된 팝업 상태'를 유지시킴!
            if (SettingsManager.isMobileUI(this) && this.selectedCard?.container === cardContainer) {
                if (cardContainer.y < height * 0.6) {
                    bg.setStrokeStyle(6, 0xffffff);
                    this.playCard(cardData, handIndex, cardContainer); 
                    this.selectedCard = null; 
                    this.tooltip.hide();
                } else {
                    // 제자리로 돌아오면서 선택 상태 유지 (툴팁도 다시 보여줌)
                    this.tweens.add({ targets: cardContainer, x: startPos.x, y: startPos.y - 150, angle: 0, scale: 1.2, duration: 150 });
                    this.showCardTooltip(cardContainer, cardData);
                }
                return;
            }

            // PC 드래그 종료 로직
            bg.setStrokeStyle(6, 0xffffff);

            if (cardContainer.y < height * 0.6) {
                this.playCard(cardData, handIndex, cardContainer); 
                this.selectedCard = null; 
                this.tooltip.hide();
            } else {
                this.tweens.add({ targets: cardContainer, x: startPos.x, y: startPos.y, angle: startPos.angle, scale: 1, duration: 200, ease: 'Back.easeOut' });
                if (SettingsManager.isMobileUI(this)) this.selectedCard = null; 
            }
        });

        this.cardContainers.push(cardContainer);
    }

    private selectCard(container: Phaser.GameObjects.Container, cardData: ICardData, index: number, startPos: ICardStartPos) {
        // 💡 자기 자신이 아닌 '다른 카드'가 켜져 있을 때만 기존 카드를 집어넣음
        if (this.selectedCard && this.selectedCard.container !== container) {
            this.deselectCard(true); 
        }
        
        this.selectedCard = { container, data: cardData, index, startPos };
        this.children.bringToTop(container);
        this.sound.play('click');
        
        const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
        bg.setStrokeStyle(8, 0xffff00);
        
        // 💡 카드가 똑바로 서면서 위로 튀어나오게(y - 150) 연출
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
                tooltipItems.push({ title: keyword, desc: description as string, iconKey }); 
            }
        }
        if (tooltipItems.length > 0) this.tooltip.show(cardContainer.x + 160, cardContainer.y - 300, tooltipItems); 
    }

    private discardCardAnim(container: Phaser.GameObjects.Container, delay: number = 0) {
        const discardX = this.cameras.main.width * 0.88; 
        const discardY = this.cameras.main.height * 0.88; // 💡 버림 위치 상향 조절

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
            this.time.delayedCall(1000, () => { GameState.floor += 1; if(GameState.enemy) GameState.enemy.hp = GameState.enemy.maxHp; this.scene.start('RewardScene'); });
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
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor || 1 });
        this.drawPileBtn.setText(`덱: ${GameState.deck?.length || 0}장`);
        this.discardPileBtn.setText(`버림: ${GameState.discard?.length || 0}장`);

        const hpBarWidth = 240;
        const pMaxHp = GameState.player.maxHp || 1;
        this.playerHpText.setText(`${GameState.player.hp}/${pMaxHp}`);
        this.playerHpBarFill.width = hpBarWidth * Math.max(0, GameState.player.hp / pMaxHp);
        this.playerHpBarFill.fillColor = (GameState.player.block || 0) > 0 ? 0x00aaff : 0xff0000;

        const eMaxHp = GameState.enemy?.maxHp || 1;
        const eHp = GameState.enemy?.hp || 0;
        this.enemyHpText.setText(`${eHp}/${eMaxHp}`);
        this.enemyHpBarFill.width = hpBarWidth * Math.max(0, eHp / eMaxHp);
        this.enemyHpBarFill.fillColor = (GameState.enemy?.block || 0) > 0 ? 0x00aaff : 0xff0000;
        
        this.manaText.setText(`${GameState.player.mana || 0}/${GameState.player.maxMana || 3}`);
        
        if ((GameState.player.block || 0) > 0) {
            this.blockContainer.setVisible(true);
            this.blockText.setText(GameState.player.block!.toString());
        } else {
            this.blockContainer.setVisible(false);
        }
        
        if (GameState.enemy?.intent) {
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
}