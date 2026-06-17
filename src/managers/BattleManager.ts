import { GameState } from '../core/GameState';
import { DeckSystem } from '../systems/DeckSystem';
import type { ICardData, ICharacter } from '../types';

export interface PlayCardResult {
    success: boolean;
    reason?: string;
    damageDealt: number;
    blockedDamage: number;
    blockGained: number;
}

export interface EnemyTurnResult {
    damageDealt: number;
    blockedDamage: number; 
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
            // 💡 수정된 타입 인터페이스 반영 (damage 우선 확인)
            const dmg = cardData.damage || cardData.value || 0;
            const result = this.applyDamage(GameState.enemy, dmg);
            damageDealt = result.damageDealt;
            blockedDamage = result.blockedDamage;
        } else if (cardData.type === 'SKILL' || cardData.type === 'DEFEND') {
            // 💡 방어도 부여 처리 (block 우선 확인)
            blockGained = cardData.block || cardData.value || 0;
            GameState.player.block += blockGained;
        }

        DeckSystem.discardCard(handIndex);
        return { success: true, damageDealt, blockedDamage, blockGained };
    }

    static endPlayerTurn() {
        DeckSystem.discardHand();
        GameState.turn = 'enemy';
    }

    static processEnemyTurn(): EnemyTurnResult {
        let damageDealt = 0;
        let blockedDamage = 0;

        const intent = GameState.enemy.intent;
        if (intent && intent.type === 'attack') {
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
        // 임시 의도 생성 로직
        GameState.enemy.intent = { type: 'attack', value: Phaser.Math.Between(5, 15) };
    }
}