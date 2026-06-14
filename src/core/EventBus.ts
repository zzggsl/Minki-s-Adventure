import Phaser from 'phaser';

// 시스템과 UI가 직접 연결되지 않고 통신할 수 있게 해주는 이벤트 버스입니다.
export const EventBus = new Phaser.Events.EventEmitter();