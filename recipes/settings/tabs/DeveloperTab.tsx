import React, { useState } from 'react';
import {
  Sliders,
  ArrowRight,
  PackageOpen,
  BookCheck,
  CircleDot,
  AlertTriangle,
  Scan,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../../../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { useSettingActionRowStore } from '../../../tokens/settingRowStore';
import type { BallOpacityMode } from './GameplayTab';

export type { BallOpacityMode } from './GameplayTab';

export interface DeveloperTabProps {
  isLight?: boolean;
  ballOpacityMode?: BallOpacityMode;
  defaultBallOpacityMode?: BallOpacityMode;
  onBallOpacityModeChange?: (mode: BallOpacityMode) => void;
  observeSafeAreaBoundary?: boolean;
  defaultObserveSafeAreaBoundary?: boolean;
  onObserveSafeAreaBoundaryChange?: (enabled: boolean) => void;
  onNavigateAdvancedAudio?: () => void;
  onNavigateEventAndTriggerer?: () => void;
  onNavigateExpMultiBots?: () => void;
  onNavigateDevSandboxes?: () => void;
  onNavigateDevSubsystemIsolation?: () => void;
  onNavigateDevActiveTuners?: () => void;
  onNavigateDevCalibratedPresets?: () => void;
  onNavigateDevUnderDevelopment?: () => void;
  onHover?: (desc: string) => void;
  onLeave?: () => void;
}

/**
 * [Layer 2] Developer Settings Tab
 * Streamlined single-line rows matching UIStorybook a4 visual rhythm:
 * 1. `Sandboxes` (`package-open` icon, `Browse →`) — directly opens the isolated subsystem selection list (01–07 including Experimental Multiple Bots)
 * 2. `Active Tuners` (`sliders` icon, `Browse →`) — active calibration tools, floating tuners, Advanced Audio & Event and Triggerer
 * 3. `Calibrated Presets` (`book-check` icon, `Browse →`) — tuners whose baseline parameters have been calibrated and solidified
 * 4. `Ball Opacity` (`circle-dot` icon) — single-line 70% / 100% / Custom segmented switch
 * 5. `Observe Safe Area Boundary` (`scan` icon) — single-line toggle switch
 * 6. `Under Development` (`alert-triangle` icon, `Browse →`, placed at the very bottom in red/rose with extra top spacing `underDevelopmentTopMargin`)
 */
export const DeveloperTab: React.FC<DeveloperTabProps> = ({
  isLight = false,
  ballOpacityMode: propBallOpacityMode,
  defaultBallOpacityMode = '100',
  onBallOpacityModeChange,
  observeSafeAreaBoundary: propObserveSafeAreaBoundary,
  defaultObserveSafeAreaBoundary = false,
  onObserveSafeAreaBoundaryChange,
  onNavigateDevSandboxes,
  onNavigateDevSubsystemIsolation,
  onNavigateDevActiveTuners,
  onNavigateDevCalibratedPresets,
  onNavigateDevUnderDevelopment,
  onHover,
  onLeave,
}) => {
  const [internalBallOpacityMode, setInternalBallOpacityMode] =
    useState<BallOpacityMode>(defaultBallOpacityMode);
  const ballOpacityMode = propBallOpacityMode ?? internalBallOpacityMode;

  const [internalSafeAreaHud, setInternalSafeAreaHud] = useState<boolean>(
    defaultObserveSafeAreaBoundary
  );
  const showSafeAreaHud = propObserveSafeAreaBoundary ?? internalSafeAreaHud;

  const handleBallOpacityChange = (next: BallOpacityMode) => {
    setInternalBallOpacityMode(next);
    onBallOpacityModeChange?.(next);
  };

  const handleObserveSafeAreaChange = (checked: boolean) => {
    setInternalSafeAreaHud(checked);
    onObserveSafeAreaBoundaryChange?.(checked);
  };

  const {
    rowGap,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
    showButtonArrow,
    underDevelopmentTopMargin,
  } = useSettingActionRowStore();

  const handleOpenSandboxes = () => {
    (onNavigateDevSubsystemIsolation ?? onNavigateDevSandboxes)?.();
  };

  return (
    <div
      data-layout="developer-settings-list"
      className="flex flex-col w-full"
      style={{ gap: `${rowGap}px` }}
    >
      {/* 1. Sandboxes (Directly opens Subsystem Isolation & Multi-Bots Selection) */}
      <SettingActionRow
        icon={PackageOpen}
        iconName="package-open"
        iconColor="text-amber-400"
        title="Sandboxes"
        actionLabel="Browse"
        description="Subsystem Isolation & MVP Lab (01–07) and Experimental Multiple Bots Mode"
        hoverDescription="Sandboxes: Choose which isolated subsystem or sandbox scene (Probes, Multi-World Ghost, State Replay, 90s Match, Goal Replay, Kickoff Duel, Demolish Respawn, or Experimental Multiple Bots) you want to test."
        onAction={handleOpenSandboxes}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2. Active Tuners */}
      <SettingActionRow
        icon={Sliders}
        iconName="sliders"
        iconColor="text-sky-400"
        title="Active Tuners"
        actionLabel="Browse"
        description="Vehicle Offsets, Goal Volume, Reachability, Kickoff PPO, Audio & Event and Triggerer"
        hoverDescription="Active Tuners: Frequently accessed live calibration tools, floating window spawners, vehicle offsets, reachability, kickoff PPO, advanced audio, and event & trigger rules."
        onAction={() => onNavigateDevActiveTuners?.()}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3. Calibrated Presets */}
      <SettingActionRow
        icon={BookCheck}
        iconName="book-check"
        iconColor="text-emerald-400"
        title="Calibrated Presets"
        actionLabel="Browse"
        description="Atmosphere & FX, Vehicle Global Surfaces, Driftwoods, Boost Pad & Name Tag"
        hoverDescription="Calibrated Presets: Archive of completed tuners whose parameters have already been calibrated and solidified (Atmosphere & FX, Vehicle Global Surfaces, Driftwoods, Boost Pad & Name Tag)."
        onAction={() => onNavigateDevCalibratedPresets?.()}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 4. Ball Opacity (70% / 100% / Custom) */}
      <SettingSegmentedRow
        icon={CircleDot}
        iconName="circle-dot"
        title="Ball Opacity"
        description="70% translucent · 100% opaque (default) · Custom (via Active Tuners)"
        value={ballOpacityMode}
        onChange={(v) => handleBallOpacityChange(v as BallOpacityMode)}
        options={[
          { value: '70', label: '70%' },
          { value: '100', label: '100%' },
          { value: 'custom', label: 'Custom' },
        ]}
        hoverDescription="Ball Opacity: Quickly toggle ball opacity between 70% translucent, 100% opaque (default), or Custom (custom values are calibrated inside Active Tuners)."
        onHover={(desc) => desc && onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 5. Observe Safe Area Boundary */}
      <SettingToggleRow
        icon={Scan}
        iconName="scan"
        title="Observe Safe Area Boundary"
        description="Display green safe area outline, 18:9 canonical zone, and floating telemetry calibration pill"
        checked={showSafeAreaHud}
        onChange={handleObserveSafeAreaChange}
        hoverDescription="Observe Safe Area Boundary: Displays boundary guides and bottom telemetry pill to observe and calibrate UI scaling and bezel margins in real-time."
        onHover={(desc) => desc && onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 6. Under Development (Moved to the very bottom, styled in red/rose with configurable top spacing) */}
      <SettingActionRow
        icon={AlertTriangle}
        iconColor={isLight ? 'text-rose-600' : 'text-rose-400'}
        title={
          <span className={isLight ? 'text-rose-700' : 'text-rose-400'}>
            Under Development
          </span>
        }
        description="Unstable staging workspace: Three-Wheeler (Tricycle / Psyclops), Throwback Stadium & Per-Car Boost"
        hoverDescription="Under Development: Unstable staging workspace for early experimental prototypes (Three-Wheeler Tricycle physics, Throwback Stadium 36 CMF & GLB, and Per-Car Boost mechanics)."
        onAction={() => onNavigateDevUnderDevelopment?.()}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
        style={{
          marginTop: `${Math.max(0, underDevelopmentTopMargin)}px`,
        }}
        className={
          isLight
            ? '!bg-rose-500/[0.06] hover:!bg-rose-500/[0.12] !border-rose-500/25'
            : '!bg-rose-500/[0.08] hover:!bg-rose-500/[0.14] !border-rose-500/25'
        }
        rightSlot={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateDevUnderDevelopment?.();
            }}
            style={{
              fontSize: `${buttonFontSize}px`,
              paddingLeft: `${buttonPaddingX}px`,
              paddingRight: `${buttonPaddingX}px`,
              paddingTop: `${buttonPaddingY}px`,
              paddingBottom: `${buttonPaddingY}px`,
              borderRadius: `${Math.max(0, buttonRadius)}px`,
            }}
            className={`shrink-0 font-semibold border transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 leading-tight active:scale-95 whitespace-nowrap ${
              isLight
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-700'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300'
            }`}
          >
            <span>Browse</span>
            {showButtonArrow && (
              <ArrowRight
                style={{
                  width: `${Math.max(12, buttonFontSize + 1)}px`,
                  height: `${Math.max(12, buttonFontSize + 1)}px`,
                }}
                className="opacity-80 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            )}
          </button>
        }
      />
    </div>
  );
};
