// src/managers/EventManager.ts
// 미지의 이벤트(EVENT 노드)의 선택지 판정과 효과 적용을 담당한다.
import { GameState } from '../core/GameState';
import { NodeEventManager } from './NodeEventManager';
import { getRandomRewardCards } from '../data/cards';
import type { IEventChoice, IEventEffect } from '../types';

/** 카드 선택 UI가 필요해 씬에서 따로 처리해야 하는 효과 */
const INTERACTIVE_EFFECTS = ['UPGRADE_CARD', 'REMOVE_CARD'] as const;

export class EventManager {
    /** 골드 조건 등을 만족해 선택할 수 있는 선택지인지 */
    static canChoose(choice: IEventChoice): boolean {
        if (choice.requiresGold !== undefined && (GameState.player.gold || 0) < choice.requiresGold) {
            return false;
        }
        // 제거할 카드가 없으면 봉납 같은 선택지도 고를 수 없다
        if (this.needsCardRemoval(choice) && !NodeEventManager.canRemoveCard()) {
            return false;
        }
        if (this.needsCardUpgrade(choice) && !NodeEventManager.hasUpgradableCard()) {
            return false;
        }
        return true;
    }

    static needsCardUpgrade(choice: IEventChoice): boolean {
        return choice.effects.some(e => e.type === 'UPGRADE_CARD');
    }

    static needsCardRemoval(choice: IEventChoice): boolean {
        return choice.effects.some(e => e.type === 'REMOVE_CARD');
    }

    /**
     * 카드 선택이 필요 없는 효과들을 즉시 적용한다.
     * 카드 선택이 필요한 효과는 씬이 모달을 띄운 뒤 NodeEventManager를 직접 호출한다.
     */
    static applyChoice(choice: IEventChoice) {
        choice.effects
            .filter(effect => !INTERACTIVE_EFFECTS.includes(effect.type as typeof INTERACTIVE_EFFECTS[number]))
            .forEach(effect => this.applyEffect(effect));
    }

    private static applyEffect(effect: IEventEffect) {
        const player = GameState.player;
        const value = effect.value ?? 0;

        switch (effect.type) {
            case 'HEAL':
                player.hp = Math.min(player.maxHp, player.hp + value);
                break;

            case 'DAMAGE':
                // 이벤트로 사망하지 않도록 최소 1은 남긴다
                player.hp = Math.max(1, player.hp - value);
                break;

            case 'MAX_HP':
                player.maxHp = Math.max(1, player.maxHp + value);
                player.hp = Math.min(player.hp, player.maxHp);
                break;

            case 'GOLD':
                player.gold = Math.max(0, (player.gold || 0) + value);
                break;

            case 'ADD_RANDOM_CARD':
                NodeEventManager.addCardToMasterDeck(getRandomRewardCards(1)[0]);
                break;

            // 카드 선택이 필요한 효과는 씬에서 처리한다
            case 'UPGRADE_CARD':
            case 'REMOVE_CARD':
                break;
        }
    }
}
