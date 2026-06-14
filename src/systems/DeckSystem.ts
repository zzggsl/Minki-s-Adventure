import { GameState } from '../core/GameState';
import { EventBus } from '../core/EventBus';
import { CardDatabase } from '../data/cards';

export class DeckSystem {
    // 💡 게임 최초 1회 실행: 기본 덱 10장 지급
    static initMasterDeck() {
        GameState.masterDeck = [
            ...Array(5).fill(CardDatabase['strike']),
            ...Array(5).fill(CardDatabase['defend'])
        ];
    }

    // 💡 전투 시작: 영구 덱을 복사하여 이번 전투용 덱 생성
    static initializeBattleDeck() {
        GameState.deck = [...GameState.masterDeck];
        GameState.hand = [];
        GameState.discard = [];
        this.shuffleDeck();
    }

    static shuffleDeck() {
        for (let i = GameState.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [GameState.deck[i], GameState.deck[j]] = [GameState.deck[j], GameState.deck[i]];
        }
    }

    static drawCards(amount: number) {
        for (let i = 0; i < amount; i++) {
            if (GameState.deck.length === 0) {
                if (GameState.discard.length === 0) break; 
                GameState.deck = [...GameState.discard];
                GameState.discard = [];
                this.shuffleDeck();
            }
            const card = GameState.deck.pop();
            if (card) GameState.hand.push(card);
        }
        EventBus.emit('hand-updated');
    }

    static discardCard(index: number) {
        const card = GameState.hand.splice(index, 1)[0];
        GameState.discard.push(card);
        EventBus.emit('hand-updated');
    }

    static discardHand() {
        GameState.discard.push(...GameState.hand);
        GameState.hand = [];
        EventBus.emit('hand-updated');
    }

    // 💡 전투 승리 후, 선택한 전리품 카드를 영구 덱에 추가
    static addCardToMasterDeck(cardId: string) {
        const card = CardDatabase[cardId];
        if (card) {
            GameState.masterDeck.push(card);
        }
    }
}