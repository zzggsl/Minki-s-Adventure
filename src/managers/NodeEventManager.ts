// src/managers/NodeEventManager.ts
// 비전투 노드(모닥불, 보물 등)의 규칙을 담당한다. 씬은 이 결과를 표시만 한다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import type { ICardData } from '../types';

/** 모닥불 휴식으로 회복하는 최대 체력 비율 */
const REST_HEAL_RATIO = 0.3;
/** 카드 강화 시 피해/방어도 증가량 */
const UPGRADE_BONUS = 3;
/** 보물 노드에서 획득하는 골드 범위 */
const TREASURE_GOLD_MIN = 25;
const TREASURE_GOLD_MAX = 50;
/** 카드를 제거해도 덱에 남아 있어야 하는 최소 장수 */
const MIN_DECK_SIZE = 4;

export class NodeEventManager {
    /** 휴식으로 회복될 체력량 (실제 회복 전 UI 표시에 사용) */
    static getRestHealAmount(): number {
        return Math.floor(GameState.player.maxHp * REST_HEAL_RATIO);
    }

    /** 모닥불 휴식: 체력을 회복하고 실제로 회복된 양을 반환 */
    static rest(): number {
        const player = GameState.player;
        const before = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + this.getRestHealAmount());
        return player.hp - before;
    }

    /** 이미 강화된 카드는 다시 강화할 수 없다 */
    static canUpgrade(card: ICardData): boolean {
        return !card.upgraded;
    }

    /** 마스터 덱에 강화 가능한 카드가 하나라도 있는지 */
    static hasUpgradableCard(): boolean {
        return GameState.masterDeck.some(card => this.canUpgrade(card));
    }

    /**
     * 카드 강화: 피해/방어도를 올리고 이름 뒤에 '+'를 붙인다.
     * 강화에 성공하면 true, 이미 강화된 카드면 false.
     */
    static upgradeCard(card: ICardData): boolean {
        if (!this.canUpgrade(card)) return false;

        if (card.damage !== undefined) card.damage += UPGRADE_BONUS;
        if (card.block !== undefined) card.block += UPGRADE_BONUS;
        if (card.value !== undefined) card.value += UPGRADE_BONUS;

        card.upgraded = true;
        card.name = `${card.name}+`;
        card.desc = this.buildDesc(card);
        return true;
    }

    /** 보물 노드에서 획득할 골드량을 굴린다 */
    static rollTreasureGold(): number {
        return Phaser.Math.Between(TREASURE_GOLD_MIN, TREASURE_GOLD_MAX);
    }

    static gainGold(amount: number) {
        GameState.player.gold = (GameState.player.gold || 0) + amount;
    }

    /** 획득한 카드는 복사본으로 넣어 원본 카드 풀이 오염되지 않게 한다 */
    static addCardToMasterDeck(card: ICardData) {
        GameState.masterDeck.push({ ...card });
    }

    /** 덱이 너무 얇아지지 않도록 최소 장수를 지킨다 */
    static canRemoveCard(): boolean {
        return GameState.masterDeck.length > MIN_DECK_SIZE;
    }

    /** 마스터 덱에서 카드 1장을 영구 제거 */
    static removeCardFromMasterDeck(card: ICardData): boolean {
        if (!this.canRemoveCard()) return false;

        const index = GameState.masterDeck.indexOf(card);
        if (index === -1) return false;

        GameState.masterDeck.splice(index, 1);
        return true;
    }

    /** 골드가 부족하면 차감하지 않고 false 반환 */
    static spendGold(amount: number): boolean {
        const current = GameState.player.gold || 0;
        if (current < amount) return false;

        GameState.player.gold = current - amount;
        return true;
    }

    /** 강화된 수치에 맞춰 설명문을 다시 만든다 */
    private static buildDesc(card: ICardData): string {
        const parts: string[] = [];
        if (card.block !== undefined) parts.push(`방어도를 ${card.block} 얻습니다.`);
        if (card.damage !== undefined) parts.push(`피해를 ${card.damage} 줍니다.`);
        return parts.length > 0 ? parts.join(' ') : card.desc;
    }
}
