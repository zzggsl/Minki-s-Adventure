// src/ui/CardView.ts
// 카드 한 장의 외형을 담당하는 공용 컴포넌트.
// BattleScene / RewardScene / DeckModal이 각자 그리던 것을 하나로 합쳤다.
import Phaser from 'phaser';
import { FONT_FAMILY } from './theme';
import type { CardType, ICardData } from '../types';

export const CARD_WIDTH = 260;
export const CARD_HEIGHT = 380;

/** 카드 타입별 색과 일러스트 아이콘 */
interface CardTheme {
    frame: number;
    banner: number;
    icon?: string;
}

const CARD_THEMES: Record<string, CardTheme> = {
    ATTACK: { frame: 0xa93226, banner: 0xc0392b, icon: 'swordicon' },
    DEFEND: { frame: 0x1f618d, banner: 0x2874a6, icon: 'shieldicon' },
    SKILL: { frame: 0x1f618d, banner: 0x2874a6, icon: 'shieldicon' },
    POWER: { frame: 0x6c3483, banner: 0x7d3c98 }
};

const DEFAULT_THEME: CardTheme = { frame: 0x4d4d4d, banner: 0x5d5d5d };
/** 강화된 카드는 타입과 무관하게 금색 테두리로 구분한다 */
const UPGRADED_FRAME = 0xd4a017;
/** 본문 종이 색 — 지도 배경과 결을 맞춘다 */
const BODY_COLOR = 0xf0e6d2;
const HIGHLIGHT_COLOR = 0xffe066;

export interface CardViewConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    card: ICardData;
}

export class CardView extends Phaser.GameObjects.Container {
    public readonly cardData: ICardData;

    private frameGfx: Phaser.GameObjects.Graphics;
    private theme: CardTheme;
    private highlighted = false;

    constructor(config: CardViewConfig) {
        super(config.scene, config.x, config.y);

        this.cardData = config.card;
        this.theme = CARD_THEMES[config.card.type as CardType] ?? DEFAULT_THEME;

        this.frameGfx = config.scene.add.graphics();
        this.add(this.frameGfx);
        this.drawFrame();

        this.buildContents(config.scene, config.card);

        this.setSize(CARD_WIDTH, CARD_HEIGHT);
        config.scene.add.existing(this);
    }

    /** 그림자 + 테두리 + 본문을 둥근 사각형으로 그린다 */
    private drawFrame() {
        const halfW = CARD_WIDTH / 2;
        const halfH = CARD_HEIGHT / 2;
        const frameColor = this.highlighted
            ? HIGHLIGHT_COLOR
            : (this.cardData.upgraded ? UPGRADED_FRAME : this.theme.frame);

        this.frameGfx.clear();

        // 그림자 — 카드가 바닥에서 떠 있는 느낌
        this.frameGfx.fillStyle(0x000000, 0.35);
        this.frameGfx.fillRoundedRect(-halfW + 6, -halfH + 10, CARD_WIDTH, CARD_HEIGHT, 18);

        // 바깥 테두리
        this.frameGfx.fillStyle(frameColor, 1);
        this.frameGfx.fillRoundedRect(-halfW, -halfH, CARD_WIDTH, CARD_HEIGHT, 18);

        // 안쪽 본문
        this.frameGfx.fillStyle(BODY_COLOR, 1);
        this.frameGfx.fillRoundedRect(-halfW + 12, -halfH + 12, CARD_WIDTH - 24, CARD_HEIGHT - 24, 12);

        // 이름 띠
        this.frameGfx.fillStyle(this.theme.banner, 1);
        this.frameGfx.fillRoundedRect(-halfW + 12, -halfH + 12, CARD_WIDTH - 24, 76, { tl: 12, tr: 12, bl: 0, br: 0 });
    }

    private buildContents(scene: Phaser.Scene, card: ICardData) {
        const halfH = CARD_HEIGHT / 2;

        const nameText = scene.add.text(0, -halfH + 50, card.name, {
            fontFamily: FONT_FAMILY,
            fontSize: '33px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: CARD_WIDTH - 60 },
            padding: { top: 8, bottom: 8 }
        }).setOrigin(0.5);
        this.add(nameText);

        // 일러스트 자리 — 전용 아트가 생기기 전까지 타입 아이콘으로 대체
        if (this.theme.icon && scene.textures.exists(this.theme.icon)) {
            const icon = scene.add.image(0, -30, this.theme.icon);
            icon.setDisplaySize(96, 96);
            icon.setAlpha(0.85);
            this.add(icon);
        }

        const descText = scene.add.text(0, 95, card.desc, {
            fontFamily: FONT_FAMILY,
            fontSize: '22px',
            color: '#3b2f2f',
            align: 'center',
            lineSpacing: 8,
            wordWrap: { width: CARD_WIDTH - 56 },
            padding: { top: 8, bottom: 8 }
        }).setOrigin(0.5);
        this.add(descText);

        // 마나 비용 구슬 — 카드 좌상단에 걸치도록 배치
        const costX = -CARD_WIDTH / 2 + 26;
        const costY = -halfH + 24;
        if (scene.textures.exists('energy')) {
            const costOrb = scene.add.image(costX, costY, 'energy').setScale(0.75);
            this.add(costOrb);
        }
        const costText = scene.add.text(costX, costY, String(card.cost), {
            fontFamily: FONT_FAMILY,
            fontSize: '33px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            padding: { top: 8, bottom: 8, left: 6, right: 6 }
        }).setOrigin(0.5);
        this.add(costText);
    }

    /** 호버·선택 시 테두리를 강조한다 */
    public setHighlight(on: boolean): this {
        if (this.highlighted === on) return this;
        this.highlighted = on;
        this.drawFrame();
        return this;
    }
}
