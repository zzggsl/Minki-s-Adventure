import PreloadScene from './scenes/PreloadScene'; // 💡 추가
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene'; // 💡 메인 메뉴 추가
import BattleScene from './scenes/BattleScene';
import MapScene from './scenes/MapScene';
import RewardScene from './scenes/RewardScene';
import { SettingsManager } from './managers/SettingsManager'; // 💡 추가

// 게임 설정 불러오기
SettingsManager.loadSettings(); // 💡 추가

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'app',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 💡 핵심: 고정된 숫자를 지우고, 접속한 기기의 화면 크기에 맞게 동적 할당
        width: 2360,
        height: 1640
    },

    
    // 💡 scene 배열의 맨 앞(가장 먼저 실행됨)에 MenuScene을 배치합니다!
    scene: [PreloadScene, MenuScene, MapScene, BattleScene, RewardScene] 
};

export default new Phaser.Game(config);