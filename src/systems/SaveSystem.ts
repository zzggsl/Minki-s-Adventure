import { GameState } from '../core/GameState';
import { DeckSystem } from './DeckSystem';

const SAVE_KEY = 'my_deckbuilder_save';

export class SaveSystem {
    // 💡 1. 현재 상태 저장하기
    static saveGame() {
        // 맵 화면에서 저장할 것이므로, 전투용 변수(hand, discard 등)는 제외하고 핵심 데이터만 저장합니다.
        const saveData = {
            playerHp: GameState.player.hp,
            playerMaxHp: GameState.player.maxHp,
            masterDeck: GameState.masterDeck,
            floor: GameState.floor
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('게임이 저장되었습니다.', saveData);
    }

    // 💡 2. 저장된 게임 불러오기
    static loadGame(): boolean {
        const saveString = localStorage.getItem(SAVE_KEY);
        if (saveString) {
            const saveData = JSON.parse(saveString);
            GameState.player.hp = saveData.playerHp;
            GameState.player.maxHp = saveData.playerMaxHp;
            GameState.masterDeck = saveData.masterDeck;
            GameState.floor = saveData.floor;
            console.log('저장된 게임을 불러왔습니다.', saveData);
            return true;
        }
        return false;
    }

    // 💡 3. 세이브 데이터 삭제 (게임 오버 시)
    static clearSave() {
        localStorage.removeItem(SAVE_KEY);
        console.log('저장 데이터가 삭제되었습니다.');
    }

    // 💡 4. 게임 완전 초기화 (새 게임 시작 시)
    static resetGame() {
        GameState.player.hp = GameState.player.maxHp;
        GameState.floor = 1;
        GameState.masterDeck = [];
        DeckSystem.initMasterDeck(); // 기본 덱 다시 지급
    }
}