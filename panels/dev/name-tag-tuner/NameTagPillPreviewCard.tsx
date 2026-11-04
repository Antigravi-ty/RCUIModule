import React from 'react';
import { Tag } from 'lucide-react';
import {
  computeAdaptiveNameTagWidthPx,
  formatNameTagDisplayText,
  resolveNameTagCornerRadiusPx,
  resolveNameTagFontFamilyCss,
} from '../../../config/nameTagConfig';
import {
  hexToRgba,
  resolveActiveBoostFillColor,
  resolveUnfilledBaseHexColor,
} from '../../../config/nameTagPillRenderer';
import { useNameTagTunerStore } from '../../../stores/nameTagTunerStore';
import { useAppStore } from '../../../stores/appStore';

export interface NameTagPillPreviewCardProps {
  isLight?: boolean;
}

export const NameTagPillPreviewCard: React.FC<NameTagPillPreviewCardProps> = ({
  isLight = false,
}) => {
  const { config } = useNameTagTunerStore();
  const sceneRenderScale = useAppStore((state) => state.graphics?.renderScale ?? 50);

  const cardBackground = isLight
    ? 'bg-neutral-50/95 border-neutral-200/90 text-neutral-800 shadow-2xs'
    : 'bg-neutral-850/60 border-neutral-700/60 text-neutral-200';
  const mutedText = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const truncatePreview = (rawName: string) =>
    formatNameTagDisplayText(rawName, config.maxChars);

  return (
    <div className={`p-2.5 rounded-xl border flex flex-col gap-2 ${cardBackground}`}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-[11px] flex items-center gap-1.5">
          <Tag
            className={`h-3.5 w-3.5 ${isLight ? 'text-sky-600' : 'text-sky-400'}`}
          />
          <span>Horizontal Pill Preview (Blue vs Orange · {config.boostIndicatorMode})</span>
        </span>
        <span className={`text-[10px] font-mono ${mutedText}`}>
          {config.pillMinWidth}-{config.pillMaxWidth}x{config.pillHeight}px · R
          {config.cornerRadius}px · Font {config.fontSize}px ({config.fontWeight})
        </span>
      </div>

      <div
        className={`grid grid-cols-2 gap-2 py-1 items-center justify-items-center rounded-lg p-2 border ${
          isLight
            ? 'bg-neutral-200/70 border-neutral-300'
            : 'bg-neutral-950/60 border-neutral-800'
        }`}
      >
        {[0, 1].map((team) => {
          const isOrange = team === 1;
          const backgroundHex = isOrange ? config.orangeBgColor : config.blueBgColor;
          const borderHex = isOrange ? config.orangeBorderColor : config.blueBorderColor;
          const boostBorderHex =
            config.boostBorderColorMode === 'shared'
              ? config.sharedBoostBorderColor
              : isOrange
                ? config.orangeBoostBorderColor
                : config.blueBoostBorderColor;
          const sampleBoostPct = Math.max(
            0,
            Math.min(100, config.previewBoostAmounts[isOrange ? 3 : 0] ?? 100)
          );
          const textHex = isOrange ? config.orangeTextColor : config.blueTextColor;
          const sampleName = truncatePreview(
            config.previewNames[isOrange ? 3 : 0] ||
              (isOrange ? 'K' : 'AlphaStriker')
          );
          const adaptiveWidthPx = computeAdaptiveNameTagWidthPx(sampleName, config);
          const effectiveRadiusPx = resolveNameTagCornerRadiusPx(
            adaptiveWidthPx,
            config.pillHeight,
            config.cornerRadius
          );
          const previewScale = 0.52;
          const scaledWidthPx = Math.max(24, Math.round(adaptiveWidthPx * previewScale));
          const scaledHeightPx = Math.min(
            64,
            Math.round(config.pillHeight * previewScale)
          );
          const scaledBorderPx = Math.max(0, config.borderWidth * previewScale);
          const scaledRadiusPx = Math.round(effectiveRadiusPx * previewScale);
          const mode = config.boostIndicatorMode;
          const isFillMode =
            config.boostBorderEnabled &&
            (mode === 'bottom-up-fill' || mode === 'left-right-fill');
          const unfilledHex = resolveUnfilledBaseHexColor(backgroundHex);
          const activeFillHex = resolveActiveBoostFillColor(
            backgroundHex,
            boostBorderHex
          );
          const baseBgCss = isFillMode
            ? hexToRgba(unfilledHex, config.boostUnfilledBgOpacity)
            : hexToRgba(backgroundHex, config.bgOpacity);
          const circleDiaPx = Math.max(
            10,
            Math.round(Math.min(scaledHeightPx * 0.62, scaledWidthPx * 0.28))
          );

          return (
            <div
              key={team}
              style={{
                width: `${scaledWidthPx}px`,
                height: `${scaledHeightPx}px`,
                backgroundColor: baseBgCss,
                borderColor: borderHex,
                borderWidth: `${scaledBorderPx}px`,
                borderStyle: 'solid',
                borderRadius: `${scaledRadiusPx}px`,
                opacity: config.opacity,
                color: textHex,
                fontSize: `${Math.max(9, Math.round(config.fontSize * previewScale))}px`,
                fontWeight: config.fontWeight,
                fontFamily: resolveNameTagFontFamilyCss(config.fontFamily),
              }}
              className="relative flex items-center justify-center px-1.5 shadow-sm transition-all"
            >
              {isFillMode && sampleBoostPct > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    borderRadius: `${Math.max(0, scaledRadiusPx - scaledBorderPx)}px`,
                  }}
                >
                  {mode === 'bottom-up-fill' ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: `${sampleBoostPct}%`,
                        backgroundColor: hexToRgba(
                          activeFillHex,
                          config.boostFillOpacity
                        ),
                        borderTop:
                          config.boostShowHorizonLine &&
                          sampleBoostPct > 2 &&
                          sampleBoostPct < 98
                            ? `1.5px solid ${boostBorderHex}`
                            : undefined,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${sampleBoostPct}%`,
                        backgroundColor: hexToRgba(
                          activeFillHex,
                          config.boostFillOpacity
                        ),
                        borderRight:
                          config.boostShowHorizonLine &&
                          sampleBoostPct > 2 &&
                          sampleBoostPct < 98
                            ? `1.5px solid ${boostBorderHex}`
                            : undefined,
                      }}
                    />
                  )}
                </div>
              )}

              {config.boostBorderEnabled &&
                scaledBorderPx > 0 &&
                sampleBoostPct > 0 &&
                (mode === 'border-only' || mode === 'left-right-fill') && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: `-${scaledBorderPx}px`,
                      borderRadius: `${scaledRadiusPx}px`,
                      borderWidth: `${scaledBorderPx}px`,
                      borderStyle: 'solid',
                      borderColor: boostBorderHex,
                      clipPath: `inset(0 ${100 - sampleBoostPct}% 0 0)`,
                      pointerEvents: 'none',
                    }}
                  />
                )}

              <div className="relative z-10 flex items-center justify-center gap-1 min-w-0 w-full">
                {config.boostBorderEnabled && mode === 'sunset-circle' && (
                  <span
                    style={{
                      width: `${circleDiaPx}px`,
                      height: `${circleDiaPx}px`,
                      borderColor:
                        sampleBoostPct > 2 ? boostBorderHex : borderHex,
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                    }}
                    className="relative rounded-full overflow-hidden shrink-0 bg-slate-950/75"
                  >
                    {sampleBoostPct > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: `${sampleBoostPct}%`,
                          background: `linear-gradient(to top, ${activeFillHex}, ${boostBorderHex})`,
                          borderTop:
                            config.boostShowHorizonLine &&
                            sampleBoostPct > 3 &&
                            sampleBoostPct < 97
                              ? '1px solid #ffffff'
                              : undefined,
                        }}
                      />
                    )}
                  </span>
                )}
                <span className="whitespace-nowrap truncate">{sampleName}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={`flex items-center justify-between gap-2 text-[10px] font-mono px-2 py-1 rounded border ${
          isLight
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <span>
          Card Render Scale: <b>{config.cardRenderScale}%</b> (Native Retina Overlay)
        </span>
        <span className={mutedText}>
          Ball Occlusion:{' '}
          {config.ballOcclusionEnabled
            ? `ON (${Math.round(config.ballOcclusionOpacity * 100)}%)`
            : 'OFF'}{' '}
          · 3D Scale: {sceneRenderScale}%
        </span>
      </div>
    </div>
  );
};
