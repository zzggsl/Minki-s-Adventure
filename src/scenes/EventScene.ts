// src/scenes/EventScene.ts
// 미지의 이벤트 노드. 선택지를 보여주고 판정은 EventManager에 맡긴다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { EventManager } from '../managers/EventManager';
import { NodeEventManager } from '../managers/NodeEventManager';
import { getRandomEvent } from '../data/events';
import { Button } from '../ui/Button';
import { DeckModal } from '../ui/modals/DeckModal';
import type { ICardData, IEventChoice } from '../types';

export default class EventScene extends Phaser.Scene {
    private choiceButtons: Button[] = [];
    private resultText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'EventScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.choiceButtons = [];
        const eventData = getRandomEvent();

        this.add.text(width / 2, height * 0.14, `❓ ${eventData.title}`, {
            fontSize: '80px', color: '#cc99ff', fontStyle: 'bold',
            padding: { top: 25, bottom: 25 }
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.3, eventData.desc, {
            fontSize: '38px', color: '#dddddd', align: 'center', lineSpacing: 16,
            padding: { top: 15, bottom: 15 }
        }).setOrigin(0.5);

        this.resultText = this.add.text(width / 2, height * 0.72, '', {
            fontSize: '40px', color: '#88ff88', fontStyle: 'bold', align: 'center',
            wordWrap: { width: width * 0.8 },
            padding: { top: 20, bottom: 20 }
        }).setOrigin(0.5);

        // 선택지를 세로로 배치
        const firstChoiceY = height * 0.46;
        const choiceGap = height * 0.12;

        eventData.choices.forEach((choice, index) => {
            const selectable = EventManager.canChoose(choice);
            const button = new Button({
                scene: this,
                x: width / 2,
                y: firstChoiceY + index * choiceGap,
                text: selectable ? choice.text : `${choice.text} (조건 미충족)`,
                variant: index === 0 ? 'primary' : 'secondary',
                width: width * 0.66, height: 120, fontSize: '36px',
                onClick: () => this.handleChoice(choice)
            });

            if (!selectable) {
                button.disableInteractive();
                button.setAlpha(0.4);
            }
            this.choiceButtons.push(button);
        });

        // 모든 선택지가 막힌 경우를 대비한 탈출구
        new Button({
            scene: this,
            x: width / 2, y: height * 0.88,
            text: '자리를 뜬다 ⏭️',
            variant: 'danger', width: 360, height: 84, fontSize: '32px',
            onClick: () => this.returnToMap()
        });
    }

    private handleChoice(choice: IEventChoice) {
        // 골드 증감 등 즉시 적용 가능한 효과 먼저 처리
        EventManager.applyChoice(choice);
        this.lockChoices();

        if (EventManager.needsCardUpgrade(choice)) {
            this.openCardPicker('강화할 카드를 선택하세요',
                card => NodeEventManager.canUpgrade(card),
                card => { NodeEventManager.upgradeCard(card); this.showResult(choice.resultText); });
            return;
        }

        if (EventManager.needsCardRemoval(choice)) {
            this.openCardPicker('봉납할 카드를 선택하세요',
                () => true,
                card => { NodeEventManager.removeCardFromMasterDeck(card); this.showResult(choice.resultText); });
            return;
        }

        this.showResult(choice.resultText);
    }

    private openCardPicker(
        title: string,
        isSelectable: (card: ICardData) => boolean,
        onSelect: (card: ICardData) => void
    ) {
        new DeckModal(this, title, GameState.masterDeck, { isSelectable, onSelect });
    }

    private showResult(text: string) {
        this.resultText.setText(text);
        this.returnToMap(1500);
    }

    private lockChoices() {
        this.choiceButtons.forEach(button => {
            button.disableInteractive();
            button.setAlpha(0.4);
        });
    }

    private returnToMap(delay: number = 0) {
        this.time.delayedCall(delay, () => this.scene.start('MapScene'));
    }
}
