import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpFromLine, Flame, Rotate3d } from 'lucide-react';
import { SlideWaveIcon } from '../../../primitives/svg/SlideWaveIcon';
import { useKeyboardInputOverlayStore } from '../../../stores/keyboardInputOverlayStore';
import { Beveled3DArrowSvg } from './Beveled3DArrowSvg';
import { RetroTrapezoidKeycap } from './RetroTrapezoidKeycap';
import { useKeyboardOverlayLiveInputs } from './useKeyboardOverlayLiveInputs';

export interface KeyboardInputOverlayMatrixStageProps {
  isLight?: boolean;
}

export const KeyboardInputOverlayMatrixStage: React.FC<
  KeyboardInputOverlayMatrixStageProps
> = ({ isLight = false }) => {
  const cfg = useKeyboardInputOverlayStore();
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [stageDims, setStageDims] = useState<{ w: number; h: number }>({
    w: 270,
    h: 270,
  });
  const { telemetry, isKeyPressed, setPointerHeld } = useKeyboardOverlayLiveInputs();

  // Measure adaptive available width & height so the 3x3 square keys scale dynamically as the user resizes the floating window
  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const floatingRoot = el.closest('[data-floating-window-id]') as HTMLElement | null;

    const measure = () => {
      const w = el.clientWidth || 260;
      let availH = w;
      if (floatingRoot) {
        const rootH = floatingRoot.clientHeight;
        // Reserve space for header (~39px), top toolbar (~44px), footer (~29px), and padding (~24px)
        const reservedVerticalPx = 136;
        if (rootH > reservedVerticalPx + 96) {
          availH = rootH - reservedVerticalPx;
        }
      }
      setStageDims((prev) =>
        Math.abs(prev.w - w) <= 1 && Math.abs(prev.h - availH) <= 1
          ? prev
          : { w, h: availH }
      );
    };

    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      if (floatingRoot) ro.observe(floatingRoot);
      window.addEventListener('resize', measure);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', measure);
      };
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const gap = Math.max(0, cfg.keyGapPx);
  const availSide = Math.max(120, Math.min(stageDims.w, stageDims.h));
  const keySizePx = Math.max(36, Math.floor((availSide - gap * 2 - 4) / 3));
  const gridTotalPx = keySizePx * 3 + gap * 2;

  const actionIdleBg = isLight ? cfg.actionIdleBgLight : cfg.actionIdleBgDark;
  const actionPressedBg = isLight ? cfg.actionPressedBgLight : cfg.actionPressedBgDark;
  const actionIconColor = isLight ? cfg.actionIconColorLight : cfg.actionIconColorDark;
  const actionLabelColor = isLight ? 'rgba(23,23,23,0.68)' : 'rgba(245,245,245,0.68)';

  const rotOffset = cfg.overlayArrowRotationOffsetDeg || 0;
  const wAngle =
    (cfg.overlayArrowFollowsCarAttitude ? telemetry.wAngleDeg : 0) + rotOffset;
  const sAngle =
    (cfg.overlayArrowFollowsCarAttitude ? telemetry.sAngleDeg : 180) + rotOffset;
  const aAngle =
    (cfg.overlayArrowFollowsCarAttitude ? telemetry.aAngleDeg : -90) + rotOffset;
  const dAngle =
    (cfg.overlayArrowFollowsCarAttitude ? telemetry.dAngleDeg : 90) + rotOffset;

  const wArrowCol = cfg.overlayArrowUseDistinctColors
    ? cfg.wArrowColor
    : cfg.overlayArrowUnifiedColor;
  const aArrowCol = cfg.overlayArrowUseDistinctColors
    ? cfg.aArrowColor
    : cfg.overlayArrowUnifiedColor;
  const sArrowCol = cfg.overlayArrowUseDistinctColors
    ? cfg.sArrowColor
    : cfg.overlayArrowUnifiedColor;
  const dArrowCol = cfg.overlayArrowUseDistinctColors
    ? cfg.dArrowColor
    : cfg.overlayArrowUnifiedColor;

  const commonKeycapProps = {
    sizePx: keySizePx,
    borderRadiusPx: cfg.keyBorderRadiusPx,
    trapezoidInsetXPct: cfg.trapezoidInsetXPct,
    trapezoidInsetYPct: cfg.trapezoidInsetYPct,
    pressShrinkXPct: cfg.pressShrinkXPct,
    pressShrinkYPct: cfg.pressShrinkYPct,
    bevelContrast: cfg.bevelContrast,
    showCornerLabel: cfg.showKeyCornerLabels,
  };

  const iconStrokeWidth = 2.2;

  return (
    <div
      ref={stageContainerRef}
      data-stage="keyboard-overlay-3x3-matrix"
      className="w-full flex items-center justify-center py-1 select-none"
    >
      <div
        className="grid grid-cols-3"
        style={{
          width: `${gridTotalPx}px`,
          height: `${gridTotalPx}px`,
          gap: `${gap}px`,
        }}
      >
        {/* ROW 1: Q (rotate-3d), W (3D Arrow Nose->Bottom), E (rotate-3d Horizontal mirror) */}
        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="q"
          label="Q"
          isPressed={isKeyPressed('q')}
          idleBgColor={actionIdleBg}
          pressedBgColor={actionPressedBg}
          labelColor={actionLabelColor}
          onMouseDown={() => setPointerHeld('q', true)}
          onMouseUp={() => setPointerHeld('q', false)}
          onMouseLeave={() => setPointerHeld('q', false)}
        >
          <Rotate3d
            className="w-[78%] h-[78%]"
            strokeWidth={iconStrokeWidth}
            style={{ color: actionIconColor }}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="w"
          label="W"
          isPressed={isKeyPressed('w')}
          idleBgColor={cfg.wIdleBgColor}
          pressedBgColor={cfg.wPressedBgColor}
          onMouseDown={() => setPointerHeld('w', true)}
          onMouseUp={() => setPointerHeld('w', false)}
          onMouseLeave={() => setPointerHeld('w', false)}
        >
          <Beveled3DArrowSvg
            angleDeg={wAngle}
            color={wArrowCol}
            scale={cfg.overlayArrowScale}
            extrudeDepth={cfg.overlayArrowExtrudeDepth}
            shadowIntensity={cfg.overlayArrowShadowIntensity}
            isPressed={isKeyPressed('w')}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="e"
          label="E"
          isPressed={isKeyPressed('e')}
          idleBgColor={actionIdleBg}
          pressedBgColor={actionPressedBg}
          labelColor={actionLabelColor}
          onMouseDown={() => setPointerHeld('e', true)}
          onMouseUp={() => setPointerHeld('e', false)}
          onMouseLeave={() => setPointerHeld('e', false)}
        >
          <Rotate3d
            className="w-[78%] h-[78%]"
            strokeWidth={iconStrokeWidth}
            style={{
              color: actionIconColor,
              transform: 'scaleX(-1)',
            }}
          />
        </RetroTrapezoidKeycap>

        {/* ROW 2: A (3D Arrow Nose->Left), S (3D Arrow Nose->Top), D (3D Arrow Nose->Right) */}
        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="a"
          label="A"
          isPressed={isKeyPressed('a')}
          idleBgColor={cfg.aIdleBgColor}
          pressedBgColor={cfg.aPressedBgColor}
          onMouseDown={() => setPointerHeld('a', true)}
          onMouseUp={() => setPointerHeld('a', false)}
          onMouseLeave={() => setPointerHeld('a', false)}
        >
          <Beveled3DArrowSvg
            angleDeg={aAngle}
            color={aArrowCol}
            scale={cfg.overlayArrowScale}
            extrudeDepth={cfg.overlayArrowExtrudeDepth}
            shadowIntensity={cfg.overlayArrowShadowIntensity}
            isPressed={isKeyPressed('a')}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="s"
          label="S"
          isPressed={isKeyPressed('s')}
          idleBgColor={cfg.sIdleBgColor}
          pressedBgColor={cfg.sPressedBgColor}
          onMouseDown={() => setPointerHeld('s', true)}
          onMouseUp={() => setPointerHeld('s', false)}
          onMouseLeave={() => setPointerHeld('s', false)}
        >
          <Beveled3DArrowSvg
            angleDeg={sAngle}
            color={sArrowCol}
            scale={cfg.overlayArrowScale}
            extrudeDepth={cfg.overlayArrowExtrudeDepth}
            shadowIntensity={cfg.overlayArrowShadowIntensity}
            isPressed={isKeyPressed('s')}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="d"
          label="D"
          isPressed={isKeyPressed('d')}
          idleBgColor={cfg.dIdleBgColor}
          pressedBgColor={cfg.dPressedBgColor}
          onMouseDown={() => setPointerHeld('d', true)}
          onMouseUp={() => setPointerHeld('d', false)}
          onMouseLeave={() => setPointerHeld('d', false)}
        >
          <Beveled3DArrowSvg
            angleDeg={dAngle}
            color={dArrowCol}
            scale={cfg.overlayArrowScale}
            extrudeDepth={cfg.overlayArrowExtrudeDepth}
            shadowIntensity={cfg.overlayArrowShadowIntensity}
            isPressed={isKeyPressed('d')}
          />
        </RetroTrapezoidKeycap>

        {/* ROW 3: Slide (private SVG waves without arrow), Boost (flame rotated 90deg CW), Jump (arrow-up-from-line) */}
        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="slide"
          label="SLIDE"
          isPressed={isKeyPressed('slide')}
          idleBgColor={actionIdleBg}
          pressedBgColor={actionPressedBg}
          labelColor={actionLabelColor}
          onMouseDown={() => setPointerHeld('slide', true)}
          onMouseUp={() => setPointerHeld('slide', false)}
          onMouseLeave={() => setPointerHeld('slide', false)}
        >
          <SlideWaveIcon
            size="78%"
            strokeWidth={iconStrokeWidth}
            color={actionIconColor}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="boost"
          label="BOOST"
          isPressed={isKeyPressed('boost')}
          idleBgColor={actionIdleBg}
          pressedBgColor={actionPressedBg}
          labelColor={actionLabelColor}
          onMouseDown={() => setPointerHeld('boost', true)}
          onMouseUp={() => setPointerHeld('boost', false)}
          onMouseLeave={() => setPointerHeld('boost', false)}
        >
          <Flame
            className="w-[78%] h-[78%]"
            strokeWidth={iconStrokeWidth}
            style={{
              color: actionIconColor,
              transform: 'rotate(90deg)',
            }}
          />
        </RetroTrapezoidKeycap>

        <RetroTrapezoidKeycap
          {...commonKeycapProps}
          keyId="jump"
          label="JUMP"
          isPressed={isKeyPressed('jump')}
          idleBgColor={actionIdleBg}
          pressedBgColor={actionPressedBg}
          labelColor={actionLabelColor}
          onMouseDown={() => setPointerHeld('jump', true)}
          onMouseUp={() => setPointerHeld('jump', false)}
          onMouseLeave={() => setPointerHeld('jump', false)}
        >
          <ArrowUpFromLine
            className="w-[78%] h-[78%]"
            strokeWidth={iconStrokeWidth}
            style={{ color: actionIconColor }}
          />
        </RetroTrapezoidKeycap>
      </div>
    </div>
  );
};

KeyboardInputOverlayMatrixStage.displayName = 'KeyboardInputOverlayMatrixStage';
export default KeyboardInputOverlayMatrixStage;
