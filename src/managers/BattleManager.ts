import Phaser from 'phaser'; // 💡 반드시 명시적으로 임포트
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
        GameState.player.mana = GameState.player.maxMana || 3;
        GameState.player.block = 0;
        if (GameState.enemy) GameState.enemy.block = 0; // 안전 장치
        
        this.generateEnemyIntent();
        DeckSystem.drawCards(5);
        GameState.turn = 'player';
    }

    static playCard(cardData: ICardData, handIndex: number): PlayCardResult {
        const currentMana = GameState.player.mana || 0;
        if (currentMana < cardData.cost) {
            return { success: false, reason: '마나 부족!', damageDealt: 0, blockedDamage: 0, blockGained: 0 };
        }

        GameState.player.mana = currentMana - cardData.cost;
        let damageDealt = 0;
        let blockedDamage = 0;
        let blockGained = 0;

        if (cardData.type === 'ATTACK') {
            const dmg = cardData.damage || cardData.value || 0;
            const result = this.applyDamage(GameState.enemy, dmg);
            damageDealt = result.damageDealt;
            blockedDamage = result.blockedDamage;
        } else if (cardData.type === 'SKILL' || cardData.type === 'DEFEND') {
            blockGained = cardData.block || cardData.value || 0;
            GameState.player.block = (GameState.player.block || 0) + blockGained;
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
        GameState.player.mana = GameState.player.maxMana || 3;
        GameState.player.block = 0;
        if (GameState.enemy) GameState.enemy.block = 0;
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
        const currentBlock = target.block || 0;

        if (currentBlock > 0) {
            blockedDamage = Math.min(currentBlock, actualDamage);
            target.block = currentBlock - blockedDamage;
            actualDamage -= blockedDamage;
        }
        if (actualDamage > 0) {
            target.hp -= actualDamage;
        }
        if (target.hp < 0) target.hp = 0;

        return { damageDealt: actualDamage, blockedDamage };
    }

    private static generateEnemyIntent() {
        if (GameState.enemy) {
            // 💡 전역 Phaser 참조가 아닌 임포트된 Phaser 모듈 사용
            GameState.enemy.intent = { type: 'attack', value: Phaser.Math.Between(5, 15) };
        }
    }
}