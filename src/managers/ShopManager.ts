// src/managers/ShopManager.ts
// 상점(SHOP 노드)의 재고 구성, 가격 산정, 구매 판정을 담당한다.
import Phaser from 'phaser';
import { GameState } from '../core/GameState';
import { NodeEventManager } from './NodeEventManager';
import { getRandomRewardCards } from '../data/cards';
import type { ICardData, IShopItem } from '../types';

/** 카드 기본 가격과 마나 비용당 추가 가격 */
const BASE_CARD_PRICE = 40;
const PRICE_PER_COST = 15;
/** 같은 카드라도 상점마다 가격이 조금씩 흔들리도록 하는 폭 */
const PRICE_VARIANCE = 8;
/** 한 상점에 진열되는 카드 수 */
const SHOP_STOCK_SIZE = 4;
/** 카드 제거 서비스 가격 */
const REMOVAL_PRICE = 75;

export class ShopManager {
    /** 상점에 진열할 카드와 가격을 만든다 */
    static generateStock(): IShopItem[] {
        return getRandomRewardCards(SHOP_STOCK_SIZE).map(card => ({
            card,
            price: this.calculatePrice(card),
            soldOut: false
        }));
    }

    static calculatePrice(card: ICardData): number {
        const base = BASE_CARD_PRICE + card.cost * PRICE_PER_COST;
        return base + Phaser.Math.Between(-PRICE_VARIANCE, PRICE_VARIANCE);
    }

    static getRemovalPrice(): number {
        return REMOVAL_PRICE;
    }

    static canAfford(price: number): boolean {
        return (GameState.player.gold || 0) >= price;
    }

    /** 카드 구매: 골드를 차감하고 덱에 넣는다. 성공하면 true */
    static buyCard(item: IShopItem): boolean {
        if (item.soldOut || !NodeEventManager.spendGold(item.price)) return false;

        NodeEventManager.addCardToMasterDeck(item.card);
        item.soldOut = true;
        return true;
    }

    /** 카드 제거 서비스를 이용할 수 있는 상태인지 */
    static canUseRemoval(): boolean {
        return this.canAfford(REMOVAL_PRICE) && NodeEventManager.canRemoveCard();
    }

    /** 카드 제거 구매: 골드를 차감하고 해당 카드를 덱에서 뺀다 */
    static buyRemoval(card: ICardData): boolean {
        if (!this.canUseRemoval()) return false;
        if (!NodeEventManager.spendGold(REMOVAL_PRICE)) return false;

        if (!NodeEventManager.removeCardFromMasterDeck(card)) {
            // 제거에 실패하면 지불한 골드를 되돌려 준다
            NodeEventManager.gainGold(REMOVAL_PRICE);
            return false;
        }
        return true;
    }
}
