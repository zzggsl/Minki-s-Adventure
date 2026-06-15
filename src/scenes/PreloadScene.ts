import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // 로딩 텍스트 (선택 사항)
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.add.text(width / 2, height / 2, '로딩 중...', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);

        // 💡 1단계에서 만든 폴더 경로를 설정하고 3개의 이미지를 메모리에 올립니다.
        this.load.setPath('assets/sprites/');
        this.load.image('player', 'player.png');
        this.load.image('enemy_gunha', 'gunha.png');
        this.load.image('energy', 'energy.png');
    }

    create() {
        // 로딩이 끝나면 곧바로 타이틀 화면으로 넘어갑니다.
        this.scene.start('MenuScene');
    }
}