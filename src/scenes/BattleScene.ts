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
    
    turnText!: Phaser.GameObjects.Text;
    cardContainers: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'BattleScene' });
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
        
        this.endTurnButton = new Button({
            scene: this, x: width - 200, y: height / 1.2,
            text: `${this.turnCount}턴 종료`, variant: 'secondary', width: 260, height: 80,
            onClick: () => { if (GameState.turn === 'player') this.endPlayerTurn(); }
        });

        this.drawPileBtn = new Button({
            scene: this, x: 150, y: height - 80,
            text: '덱: -', variant: 'primary', width: 200, height: 60, fontSize: '32px',
            onClick: () => this.openPileModal('뽑을 카드 더미', GameState.deck || [])
        });

        this.discardPileBtn = new Button({
            scene: this, x: width - 150, y: height - 80,
            text: '버림: -', variant: 'secondary', width: 200, height: 60, fontSize: '32px',
            onClick: () => this.openPileModal('버린 카드 더미', GameState.discard || [])
        });
        
        this.turnText = this.add.text(width / 2, 120, '', { 
            fontSize: '50px', color: '#ffffff', fontStyle: 'bold', padding: { top: 15, bottom: 15 } 
        }).setOrigin(0.5);
        
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

        // 💡 요건 2: 플레이어 크기를 기존 0.4에서 20% 축소한 0.32로 설정
        this.playerSprite = this.add.sprite(width * 0.2, height * 0.5, 'player').setScale(0.32).setInteractive(); 
        
        this.playerSprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if (GameState.player.block > 0) items.push({ title: '방어도', desc: `현재 ${GameState.player.block}의 피해를 막을 수 있습니다.` });
            items.push({ title: '상태', desc: '현재 걸려있는 버프/디버프가 없습니다.' });
            // 💡 요건 1-1: 플레이어 기준 오른쪽 띄우기
            this.tooltip.show(this.playerSprite.x + 100, this.playerSprite.y - 100, items);
        });
        this.playerSprite.on('pointerout', () => this.tooltip.hide());

        this.add.rectangle(width * 0.2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0x333333); 
        this.playerHpBarFill = this.add.rectangle(width * 0.2 - hpBarWidth / 2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5); 
        this.playerHpText = this.add.text(width * 0.2, height * 0.5 + 230, '', { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 10, bottom: 10 } }).setOrigin(0.5);

        const manaBg = this.add.sprite(0, 0, 'energy').setScale(2.5);
        this.manaText = this.add.text(0, 0, '', { fontSize: '52px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 8, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        this.manaContainer = this.add.container(width * 0.12, height * 0.82, [manaBg, this.manaText]);

        const blockBg = this.add.sprite(0, 0, 'shield').setScale(0.08);
        this.blockText = this.add.text(0, 0, '', { fontSize: '36px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
        this.blockContainer = this.add.container(width * 0.2 - 150, height * 0.5 + 230, [blockBg, this.blockText]);
        this.blockContainer.setVisible(false);

        this.enemySprite = this.add.sprite(width * 0.8, height * 0.5, 'enemy_gunha').setScale(0.45).setInteractive();
        
        this.enemySprite.on('pointerover', () => {
            const items: TooltipItem[] = [];
            if (GameState.enemy.intent) items.push({ title: '의도: 공격', desc: `플레이어에게 ${GameState.enemy.intent.value}의 피해를 입힐 예정입니다.` });
            // 💡 요건 1-2: 적 기준 왼쪽 띄우기 (툴팁 너비를 고려하여 넉넉히 -480)
            this.tooltip.show(this.enemySprite.x - 480, this.enemySprite.y - 100, items);
        });
        this.enemySprite.on('pointerout', () => this.tooltip.hide());

        this.add.rectangle(width * 0.8, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0x333333);
        this.enemyHpBarFill = this.add.rectangle(width * 0.8 - hpBarWidth / 2, height * 0.5 + 230, hpBarWidth, hpBarHeight, 0xff0000).setOrigin(0, 0.5);
        this.enemyHpText = this.add.text(width * 0.8, height * 0.5 + 230, '', { fontSize: '24px', color: '#fff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 10, bottom: 10 } }).setOrigin(0.5);
        this.enemyIntentText = this.add.text(width * 0.8, height * 0.5 - 250, '', { fontSize: '38px', color: '#ffaaaa', fontStyle: 'bold', stroke: '#000000', strokeThickness: 6, padding: { top: 15, bottom: 15 } }).setOrigin(0.5);
    }

    renderHand(animate: boolean = false) {
        this.cardContainers.forEach(container => container.destroy());
        this.cardContainers = [];

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const handSize = GameState.hand.length;
        
        const cardSpacing = 220; 
        const startX = (width / 2) - ((handSize - 1) * cardSpacing) / 2;

        GameState.hand.forEach((cardData, index) => {
            const offsetFromCenter = index - (handSize - 1) / 2;
            const targetX = startX + (index * cardSpacing);
            const targetY = height - 150 + Math.abs(offsetFromCenter) * 30; 
            const targetAngle = offsetFromCenter * 5; 

            this.createCardView(targetX, targetY, targetAngle, cardData, index, animate, index);
        });
    }

    createCardView(x: number, y: number, angle: number, cardData: ICardData, handIndex: number, animate: boolean, delayIndex: number) {
        const cardWidth = 260;
        const cardHeight = 380;
        
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
            // 💡 요건 3: 카드가 드로우될 때 왼쪽 하단(덱 버튼 위치)에서 작게 시작하여 원래 자리로 날아옴
            cardContainer.setPosition(150, this.cameras.main.height - 80);
            cardContainer.setAngle(0);
            cardContainer.setScale(0.1);

            this.tweens.add({
                targets: cardContainer,
                x: x, y: y, angle: angle, scale: 1, delay: delayIndex * 150, duration: 400, ease: 'Back.easeOut',
                onStart: () => { this.sound.play(`shuffle${Phaser.Math.Between(1, 7)}`); }
            });
        }

        cardContainer.setInteractive();
        this.input.setDraggable(cardContainer);
        const startPos = { x, y, angle };

        cardContainer.on('pointerover', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer);
            bg.setStrokeStyle(8, 0xffff00);
            this.sound.play('click'); 
            this.tweens.add({ targets: cardContainer, y: y - 100, scale: 1.2, angle: 0, duration: 100 });

            const tooltipItems: TooltipItem[] = [];
            for (const [keyword, description] of Object.entries(KEYWORD_DICT)) {
                if (cardData.desc.includes(keyword) || cardData.name.includes(keyword)) {
                    tooltipItems.push({ title: keyword, desc: description });
                }
            }
            // 💡 요건 1-3: 카드 기준 오른쪽 위로 띄우기
            if (tooltipItems.length > 0) this.tooltip.show(cardContainer.x + 180, cardContainer.y - 270, tooltipItems);
        });

        cardContainer.on('pointerout', () => {
            if (GameState.turn !== 'player') return;
            bg.setStrokeStyle(6, 0xffffff);
            this.tweens.add({ targets: cardContainer, y: startPos.y, scale: 1, angle: startPos.angle, duration: 100 });
            this.tooltip.hide();
        });

        cardContainer.on('dragstart', () => {
            if (GameState.turn !== 'player') return;
            this.children.bringToTop(cardContainer); 
            this.tooltip.hide(); 
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
                this.playCard(cardData, handIndex, cardContainer); // 💡 컨테이너도 함께 전달
            } else {
                this.tweens.add({ targets: cardContainer, x: startPos.x, y: startPos.y, angle: startPos.angle, scale: 1, duration: 200, ease: 'Back.easeOut' });
            }
        });

        this.cardContainers.push(cardContainer);
    }

    // 💡 요건 4: 카드를 버림더미로 날려보내는 포물선 연출 전용 함수
    private discardCardAnim(container: Phaser.GameObjects.Container, delay: number = 0) {
        const discardX = this.cameras.main.width - 150; // 우측 하단 버림 버튼 X
        const discardY = this.cameras.main.height - 80; // 우측 하단 버림 버튼 Y

        container.disableInteractive(); // 클릭/드래그 방지
        this.children.bringToTop(container);
        this.tooltip.hide();

        // 1. 카드가 작아지면서, 회전하며, 우측 하단으로 이동
        this.tweens.add({
            targets: container,
            x: discardX,
            scale: 0.1,
            angle: 180 + Phaser.Math.Between(-90, 90), // 랜덤하게 핑그르르 돎
            alpha: 0, // 점점 투명해짐
            delay: delay,
            duration: 500,
            ease: 'Sine.easeInOut',
            onComplete: () => container.destroy() // 도달 시 파괴
        });

        // 2. Y축을 제어하여 포물선(솟구쳤다 떨어짐) 만들기
        this.tweens.add({
            targets: container,
            y: container.y - 300, // 위로 솟구침
            delay: delay,
            duration: 250,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: container,
                    y: discardY, // 다시 떨어짐
                    duration: 250,
                    ease: 'Quad.easeIn'
                });
            }
        });
    }

    playCard(cardData: ICardData, handIndex: number, cardContainer: Phaser.GameObjects.Container) {
        // 💡 드로우 더미가 파괴되지 않도록 관리 배열에서 제외
        this.cardContainers = this.cardContainers.filter(c => c !== cardContainer);

        const result = BattleManager.playCard(cardData, handIndex);

        if (!result.success) {
            this.sound.play('error'); 
            this.showFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, result.reason || "사용 불가", 0xff0000);
            this.cardContainers.push(cardContainer); // 실패했으므로 다시 배열에 복구
            this.renderHand(false); 
            return;
        }

        // 💡 성공적으로 사용했다면 포물선 버림 연출 실행!
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

        this.renderHand(false); // 남은 패 재정렬
    }

    private shootProjectile(startX: number, startY: number, endX: number, endY: number, onComplete: () => void) {
        const spit = this.add.circle(startX, startY, 15, 0xffffff);
        spit.setDepth(50); 
        this.tweens.add({ targets: spit, x: endX, y: endY, duration: 200, ease: 'Power1', onComplete: () => { spit.destroy(); onComplete(); } });
    }

    endPlayerTurn() {
        // 💡 요건 4: 턴이 끝날 때 남은 손패를 순차적으로 우측 하단으로 날림
        this.cardContainers.forEach((container, idx) => {
            this.discardCardAnim(container, idx * 80); // 80ms 간격으로 촤라락 날아감
        });
        this.cardContainers = []; // 화면 상에서 정리되었으므로 배열 초기화

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
                this.renderHand(true); // 💡 새 턴 시작 시 다시 좌측에서 드로우됨
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
        this.topBar.refresh({ hp: GameState.player.hp, maxHp: GameState.player.maxHp, floor: GameState.floor });

        this.drawPileBtn.setText(`덱: ${GameState.deck?.length || 0}장`);
        this.discardPileBtn.setText(`버림: ${GameState.discard?.length || 0}장`);

        const hpBarWidth = 240;
        this.playerHpText.setText(`${GameState.player.hp}/${GameState.player.maxHp}`);
        const playerHpPercent = Math.max(0, GameState.player.hp / GameState.player.maxHp);
        this.playerHpBarFill.width = hpBarWidth * playerHpPercent;
        this.playerHpBarFill.fillColor = GameState.player.block > 0 ? 0x00aaff : 0xff0000;

        this.enemyHpText.setText(`${GameState.enemy.hp}/${GameState.enemy.maxHp}`);
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
        this.enemyIntentText.setText(`의도:공격(${GameState.enemy.intent?.value})`);
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