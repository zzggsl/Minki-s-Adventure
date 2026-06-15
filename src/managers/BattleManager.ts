// 💡 주의: 파일 어디에도 'import Phaser'가 없습니다! 순수 로직만 존재합니다.
import { GameState } from '../core/GameState';
import { DeckSystem } from '../systems/DeckSystem';
import type { ICardData, ICharacter } from '../types';

// BattleScene과 소통하기 위한 Result 타입 정의
export interface PlayCardResult {
    success: boolean;
    reason?: string;
    damageDealt: number;
    blockGained: number;
}

export interface EnemyTurnResult {
    damageDealt: number;
}

export class BattleManager {
    // 전투 시작
    static startBattle() {
        // 💡 누락되었던 핵심 코드 추가! (영구 덱을 복사해 전투 덱을 만듭니다)
        DeckSystem.initializeBattleDeck(); 
        
        GameState.player.mana = GameState.player.maxMana;
        GameState.player.block = 0;
        GameState.enemy.block = 0;
        this.generateEnemyIntent();
        
        DeckSystem.drawCards(5);
        GameState.turn = 'player';
    }

    // 카드 사용 (Result 객체 반환)
    static playCard(cardData: ICardData, handIndex: number): PlayCardResult {
        // 1. 마나 검증
        if (GameState.player.mana! < cardData.cost) {
            return { success: false, reason: '마나 부족!', damageDealt: 0, blockGained: 0 };
        }

        // 2. 자원 소모 및 처리
        GameState.player.mana! -= cardData.cost;
        let damageDealt = 0;
        let blockGained = 0;

        if (cardData.type === 'ATTACK') {
            damageDealt = this.applyDamage(GameState.enemy, cardData.value);
        } else if (cardData.type === 'DEFEND') {
            blockGained = cardData.value;
            GameState.player.block += blockGained;
        }

        // 3. 카드 버리기
        DeckSystem.discardCard(handIndex);

        return { success: true, damageDealt, blockGained };
    }

    // 플레이어 턴 종료 선언
    static endPlayerTurn() {
        GameState.turn = 'animating';
        DeckSystem.discardHand();
    }

    // 적 턴 진행 (Result 객체 반환)
    static processEnemyTurn(): EnemyTurnResult {
        const intent = GameState.enemy.intent!;
        let damageDealt = 0;

        if (intent.type === 'attack') {
            damageDealt = this.applyDamage(GameState.player, intent.value);
        }

        this.generateEnemyIntent(); // 다음 턴 의도 생성
        return { damageDealt };
    }

    // 다음 턴 시작 처리
    static startNextTurn() {
        GameState.player.mana = GameState.player.maxMana;
        GameState.player.block = 0;
        GameState.enemy.block = 0;
        
        DeckSystem.drawCards(5);
        GameState.turn = 'player';
    }

    // 승패 판정
    static checkWinLose(): 'win' | 'lose' | 'continue' {
        if (GameState.enemy.hp <= 0) return 'win';
        if (GameState.player.hp <= 0) return 'lose';
        return 'continue';
    }

    // 내부 유틸리티: 데미지 계산 (방어도 먼저 차감)
    private static applyDamage(target: ICharacter, amount: number): number {
        let actualDamage = amount;
        if (target.block > 0) {
            const blockDamage = Math.min(target.block, actualDamage);
            target.block -= blockDamage;
            actualDamage -= blockDamage;
        }
        if (actualDamage > 0) {
            target.hp -= actualDamage;
        }
        if (target.hp < 0) target.hp = 0;
        
        return actualDamage; // 실제로 준 데미지 반환
    }

    // 내부 유틸리티: 적 의도 생성
    private static generateEnemyIntent() {
        GameState.enemy.intent = { type: 'attack', value: Math.floor(Math.random() * 5) + 5 };
    }
}