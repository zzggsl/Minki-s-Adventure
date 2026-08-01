// src/scenes/PreloadScene.ts
import Phaser from 'phaser';
import { waitForFonts } from '../ui/theme';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 로딩 텍스트 연출
        this.add.text(width / 2, height / 2, '로딩 중...', { 
            fontSize: '40px', 
            color: '#ffffff', 
            padding: { top: 10, bottom: 10 } 
        }).setOrigin(0.5);

        // --------------------------------------------------
        // 🎨 1. 이미지 및 스프라이트 에셋 로드
        // --------------------------------------------------
        this.load.setPath('assets/sprites/');
        
        // 기존 전투 및 캐릭터 에셋
        this.load.setPath('assets/sprites/');
        this.load.image('player', 'player.png');
        this.load.image('enemy_gunha', 'gunha.png');
        this.load.image('energy', 'energy.png');
        this.load.image('shield', 'shield.png');
        this.load.image('swordicon', 'swordicon.png');
        this.load.image('shieldicon', 'shieldicon.png');

        // 💡 [기억각인] 새로 추가된 지도 시스템 관련 스프라이트 에셋 전체 등록
        this.load.image('node_battle', 'battle.png');
        this.load.image('node_elite', 'elite.png');
        this.load.image('node_event', 'event.png');
        this.load.image('node_shop', 'shop.png');
        this.load.image('node_rest', 'rest.png');
        this.load.image('node_treasure', 'treasure.png');
        this.load.image('map_bg', 'map_bg.png'); // 나인 슬라이스용 고화질 지도 배경 종이
        this.load.image('map_paper', 'map_paper.png'); 

        // --------------------------------------------------
        // 🎵 2. 효과음 및 오디오 에셋 로드
        // --------------------------------------------------
        this.load.setPath('assets/sounds/');
        this.load.audio('click', 'click.mp3');
        this.load.audio('error', 'error.mp3');
        this.load.audio('map_node', 'map_node.mp3');
        this.load.audio('hit', 'hit.wav');
        this.load.audio('shieldappear', 'shieldappear.mp3');
        this.load.audio('shieldblock', 'shieldblock.wav');

        // shuffle 1~7 연속 로드
        for (let i = 1; i <= 7; i++) {
            this.load.audio(`shuffle${i}`, `shuffle${i}.m4a`);
        }
    }

    create() {
        // 💡 폰트는 Phaser 로더가 아닌 브라우저가 받으므로 별도로 기다린다.
        // 로드 전에 씬이 시작되면 텍스트가 기본 글꼴로 그려진 채 갱신되지 않는다.
        waitForFonts().then(() => this.scene.start('MenuScene'));
    }
}