import { GameState } from '../core/GameState';
import { DeckSystem } from '../systems/DeckSystem';
import type { ICardData, ICharacter } from '../types';

export interface PlayCardResult {
    success: boolean;
    reason?: string;
    damageDealt: number;
    blockedDamage: number; // 💡 추가됨
    blockGained: number;
}

export interface EnemyTurnResult {
    damageDealt: number;
    blockedDamage: number; // 💡 추가됨
}

export class BattleManager {
    static startBattle() {
        DeckSystem.initializeBattleDeck(); 
        GameState.player.mana = GameState.player.maxMana;
        GameState.player.block = 0;
        GameState.enemy.block = 0;
        this.generateEnemyIntent();
        DeckSystem.drawCards(5);
        GameState.turn = 'player';
    }

    static playCard(cardData: ICardData, handIndex: number): PlayCardResult {
        if (GameState.player.mana! < cardData.cost) {
            return { success: false, reason: '마나 부족!', damageDealt: 0, blockedDamage: 0, blockGained: 0 };
        }

        GameState.player.mana! -= cardData.cost;
        let damageDealt = 0;
        let blockedDamage = 0;
        let blockGained = 0;

        if (cardData.type === 'ATTACK') {
            const result = this.applyDamage(GameState.enemy, cardData.value);
            damageDealt = result.damageDealt;
            blockedDamage = result.blockedDamage;
        } else if (cardData.type === 'DEFEND') {
            blockGained = cardData.value;
            GameState.player.block += blockGained;
        }

        DeckSystem.discardCard(handIndex);
        return { success: true, damageDealt, blockedDamage, blockGained };
    }

    static endPlayerTurn() {
        GameState.turn = 'animating';
        DeckSystem.discardHand();
    }

    static processEnemyTurn(): EnemyTurnResult {
        const intent = GameState.enemy.intent!;
        let damageDealt = 0;
        let blockedDamage = 0;

        if (intent.type === 'attack') {
            const result = this.applyDamage(GameState.player, intent.value);
            damageDealt = result.damageDealt;
            blockedDamage = result.blockedDamage;
        }

        this.generateEnemyIntent(); 
        return { damageDealt, blockedDamage };
    }

    static startNextTurn() {
        GameState.player.mana = GameState.player.maxMana;
        GameState.player.block = 0;
        GameState.enemy.block = 0;
        DeckSystem.drawCards(5);
        GameState.turn = 'player';
    }

    static checkWinLose(): 'win' | 'lose' | 'continue' {
        if (GameState.enemy.hp <= 0) return 'win';
        if (GameState.player.hp <= 0) return 'lose';
        return 'continue';
    }

    // 💡 방어도로 막아낸 수치(blockedDamage)도 함께 반환하도록 수정
    private static applyDamage(target: ICharacter, amount: number): { damageDealt: number, blockedDamage: number } {
        let actualDamage = amount;
        let blockedDamage = 0;

        if (target.block > 0) {
            blockedDamage = Math.min(target.block, actualDamage);
            target.block -= blockedDamage;
            actualDamage -= blockedDamage;
        }
        if (actualDamage > 0) {
            target.hp -= actualDamage;
        }
        if (target.hp < 0) target.hp = 0;
        
        return { damageDealt: actualDamage, blockedDamage }; 
    }

    private static generateEnemyIntent() {
        GameState.enemy.intent = { type: 'attack', value: Math.floor(Math.random() * 5) + 5 };
    }
}