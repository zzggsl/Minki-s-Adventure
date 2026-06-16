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
    width: 2360,
    height: 1640,
    parent: document.body,
    
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1
    } as any,
    
    // 💡 scene 배열의 맨 앞(가장 먼저 실행됨)에 MenuScene을 배치합니다!
    scene: [PreloadScene, MenuScene, MapScene, BattleScene, RewardScene] 
};

new Phaser.Game(config);