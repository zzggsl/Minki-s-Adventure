// src/ui/theme.ts
// 게임 전체가 공유하는 시각 요소(폰트 등)를 한 곳에서 관리한다.
import Phaser from 'phaser';

/** 게임 기본 폰트. Phaser 기본 폰트는 한글을 제대로 렌더링하지 못한다. */
export const FONT_FAMILY = 'Galmuri11';

/** Galmuri11은 11px 배수에서 픽셀이 또렷하게 찍힌다. */
export const PIXEL_BASE = 11;

/**
 * `scene.add.text()`가 항상 기본 폰트를 쓰도록 Phaser의 text 팩토리를 교체한다.
 * 호출 지점이 50곳이 넘어 개별 지정 시 누락되기 쉬우므로 생성 시점에 한 번에 주입한다.
 * 개별 텍스트에서 `fontFamily`를 넘기면 그 값이 우선한다.
 *
 * 반드시 `new Phaser.Game()` 이전에 호출해야 한다.
 */
export function registerDefaultFont() {
    // ⚠️ GameObjectFactory.register()는 이미 등록된 타입을 덮어쓰지 않으므로
    //    (내부에서 hasOwnProperty로 걸러낸다) 프로토타입에 직접 할당해야 한다.
    Phaser.GameObjects.GameObjectFactory.prototype.text = function (
        this: Phaser.GameObjects.GameObjectFactory,
        x: number,
        y: number,
        text: string | string[],
        style?: Phaser.Types.GameObjects.Text.TextStyle
    ): Phaser.GameObjects.Text {
        const styleWithFont = { fontFamily: FONT_FAMILY, ...style };
        return this.displayList.add(
            new Phaser.GameObjects.Text(this.scene, x, y, text, styleWithFont)
        ) as Phaser.GameObjects.Text;
    };
}

/**
 * 폰트 파일이 실제로 준비될 때까지 기다린다.
 * Phaser는 캔버스에 텍스트를 즉시 그리기 때문에, 로드 전에 씬이 시작되면
 * 기본 글꼴로 그려진 뒤 갱신되지 않는다.
 */
export async function waitForFonts(): Promise<void> {
    if (!document.fonts) return;

    try {
        await Promise.all([
            document.fonts.load(`400 ${PIXEL_BASE}px ${FONT_FAMILY}`),
            document.fonts.load(`700 ${PIXEL_BASE}px ${FONT_FAMILY}`)
        ]);
    } catch {
        // 폰트 로드에 실패해도 기본 글꼴로 게임은 진행되어야 한다
    }
}
