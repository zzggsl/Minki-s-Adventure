import Phaser from 'phaser';

// 💡 유저가 커스텀할 수 있는 '설정' 데이터
export interface UserSettings {
    masterVolume: number;
    animationSpeed: number;
    forceUIMode: 'auto' | 'pc' | 'mobile'; // 기기 UI 강제 변경 옵션
}

export class SettingsManager {
    public static settings: UserSettings = {
        masterVolume: 1.0,
        animationSpeed: 1.0,
        forceUIMode: 'auto'
    };

    /**
     * 로컬 스토리지에서 설정을 불러옵니다. (게임 시작 시 호출)
     */
    public static loadSettings() {
        const saved = localStorage.getItem('minki_settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error("설정 불러오기 실패", e);
            }
        }
    }

    /**
     * 현재 설정을 로컬 스토리지에 저장합니다.
     */
    public static saveSettings() {
        localStorage.setItem('minki_settings', JSON.stringify(this.settings));
    }

    /**
     * 💡 환경 감지 로직 (상태 저장 X, 동적 판별 O)
     * 현재 모바일용 UI를 렌더링해야 하는지 여부를 반환합니다.
     */
    public static isMobileUI(scene: Phaser.Scene): boolean {
        // 1. 유저가 설정에서 강제로 모바일/PC 모드를 고정했다면 그것을 따름
        if (this.settings.forceUIMode === 'mobile') return true;
        if (this.settings.forceUIMode === 'pc') return false;

        // 2. 'auto' 상태라면 Phaser 엔진을 통해 터치 기기인지 동적으로 감지
        return scene.sys.game.device.input.touch;
    }

    // --- 설정 변경 유틸리티 함수들 ---

    public static setVolume(volume: number) {
        this.settings.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.saveSettings();
    }

    public static setAnimationSpeed(speed: number) {
        this.settings.animationSpeed = speed;
        this.saveSettings();
    }

    public static setForceUIMode(mode: 'auto' | 'pc' | 'mobile') {
        this.settings.forceUIMode = mode;
        this.saveSettings();
    }
}
