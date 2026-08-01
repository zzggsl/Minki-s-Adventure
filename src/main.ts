import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import MenuScene from './scenes/MenuScene';
import MapScene from './scenes/MapScene';
import BattleScene from './scenes/BattleScene';
import RewardScene from './scenes/RewardScene';
import RestScene from './scenes/RestScene';
import TreasureScene from './scenes/TreasureScene';
import EventScene from './scenes/EventScene';
import ShopScene from './scenes/ShopScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, // 💡 화면 비율 유지하며 꽉 채움
        parent: 'app',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 2360, // 💡 디자인 기준 논리적 가로 해상도
        height: 1640 // 💡 디자인 기준 논리적 세로 해상도
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [PreloadScene, MenuScene, MapScene, BattleScene, RewardScene, RestScene, TreasureScene, EventScene, ShopScene]
};

export default new Phaser.Game(config);