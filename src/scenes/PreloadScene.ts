import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.text(width / 2, height / 2, '로딩 중...', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);

        // 이미지 로드
        this.load.setPath('assets/sprites/');
        this.load.image('player', 'player.png');
        this.load.image('enemy_gunha', 'gunha.png');
        this.load.image('energy', 'energy.png');
        this.load.image('shield', 'shield.png');

        // 💡 사운드 로드
        this.load.setPath('assets/sounds/');
        this.load.audio('click', 'click.mp3');
        this.load.audio('error', 'error.mp3');
        this.load.audio('map_node', 'map_node.mp3');
        this.load.audio('hit', 'hit.wav');
        
        // shuffle 1~7 연속 로드
        for (let i = 1; i <= 7; i++) {
            this.load.audio(`shuffle${i}`, `shuffle${i}.m4a`);
        }
    }

    create() {
        this.scene.start('MenuScene');
    }
}