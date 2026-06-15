import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.text(width / 2, height / 2, '로딩 중...', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);

        this.load.setPath('assets/sprites/');
        this.load.image('player', 'player.png');
        this.load.image('enemy_gunha', 'gunha.png');
        this.load.image('energy', 'energy.png');
        this.load.image('shield', 'shield.png'); // 💡 방패 이미지 추가!
    }

    create() {
        this.scene.start('MenuScene');
    }
}