import { GameState } from '../core/GameState';
import { DeckSystem } from './DeckSystem';

const SAVE_KEY = 'my_deckbuilder_save';

export class SaveSystem {
    // 💡 1. 현재 상태 저장하기
    static saveGame() {
        // 맵 화면에서 저장할 것이므로, 전투용 변수(hand, discard 등)는 제외하고 핵심 데이터 + 맵 진행 상황을 저장합니다.
        const saveData = {
            playerHp: GameState.player.hp,
            playerMaxHp: GameState.player.maxHp,
            playerGold: GameState.player.gold ?? 0,
            masterDeck: GameState.masterDeck,
            floor: GameState.floor,
            currentMap: GameState.currentMap,
            currentNodeId: GameState.currentNodeId,
            visitedNodeIds: GameState.visitedNodeIds,
            playableNodeIds: GameState.playableNodeIds
        };
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        console.log('게임이 저장되었습니다.', saveData);
    }

    public static hasSave(): boolean {
        // 로컬 스토리지에 저장된 데이터가 있으면 true, 없으면 false 반환
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    // 💡 2. 저장된 게임 불러오기
    static loadGame(): boolean {
        const saveString = localStorage.getItem(SAVE_KEY);
        if (saveString) {
            const saveData = JSON.parse(saveString);
            GameState.player.hp = saveData.playerHp;
            GameState.player.maxHp = saveData.playerMaxHp;
            GameState.player.gold = saveData.playerGold ?? 0;
            GameState.masterDeck = saveData.masterDeck;
            GameState.floor = saveData.floor;
            GameState.currentMap = saveData.currentMap ?? null;
            GameState.currentNodeId = saveData.currentNodeId ?? null;
            GameState.visitedNodeIds = saveData.visitedNodeIds ?? [];
            GameState.playableNodeIds = saveData.playableNodeIds ?? [];
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
        GameState.player.gold = 0;
        GameState.floor = 1;
        GameState.masterDeck = [];
        GameState.currentMap = null;
        GameState.currentNodeId = null;
        GameState.visitedNodeIds = [];
        GameState.playableNodeIds = [];
        DeckSystem.initMasterDeck(); // 기본 덱 다시 지급
    }
}