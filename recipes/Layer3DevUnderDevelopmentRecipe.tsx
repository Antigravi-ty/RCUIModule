import React, { useState } from 'react';
import { useLayer3DevUnderDevelopmentStoreBinding } from './hooks/useDevRecipesStoreBindings';
import {
  AlertTriangle,
  Play,
  RotateCcw,
  Triangle,
  FlagTriangleRight,
  Info,
  Eye,
  Zap,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { ToggleSwitch } from '../primitives/ToggleSwitch';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export interface PerCarBoostConfig {
  unlimitedBoost: boolean;
  boostCollectable: boolean;
  rechargeBoostEnabled: boolean;
  rechargeBoostPerSecond: number;
  rechargeBoostDelay: number;
}

export const DEFAULT_CAR_BOOST_CFG: PerCarBoostConfig = {
  unlimitedBoost: true,
  boostCollectable: true,
  rechargeBoostEnabled: false,
  rechargeBoostPerSecond: 10.0,
  rechargeBoostDelay: 0.25,
};

export interface Layer3DevUnderDevelopmentRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  threeWheelsEnabled?: boolean;
  onThreeWheelsChange?: (enabled: boolean) => void;
  onEnableAndDriveThreeWheels?: () => void;
  stadiumPreset?: 'standard' | 'throwback';
  onStadiumPresetChange?: (preset: 'standard' | 'throwback') => void;
  onLoadAndInspectThrowback?: () => void;
  showCollisionOverlay?: boolean;
  onShowCollisionOverlayChange?: (visible: boolean) => void;
  selectedCarIdx?: number;
  onSelectedCarIdxChange?: (idx: number) => void;
  perCarBoostConfigs?: Record<number, PerCarBoostConfig>;
  onPerCarBoostConfigsChange?: (next: Record<number, PerCarBoostConfig>) => void;
  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 3 Developer — 4. Under Development (Unstable / WIP Workspace)
 * Streamlined single-line rows and unified Per-Car Boost controls sharing SettingActionRowStore tokens.
 */
export const Layer3DevUnderDevelopmentRecipe: React.FC<Layer3DevUnderDevelopmentRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  onBack,
  threeWheelsEnabled: propThreeWheels,
  onThreeWheelsChange,
  onEnableAndDriveThreeWheels,
  stadiumPreset: propStadiumPreset,
  onStadiumPresetChange,
  onLoadAndInspectThrowback,
  showCollisionOverlay: propShowOverlay,
  onShowCollisionOverlayChange,
  selectedCarIdx: propSelectedCarIdx,
  onSelectedCarIdxChange,
  perCarBoostConfigs: propBoostConfigs,
  onPerCarBoostConfigsChange,
  sizing: propSizing,
} = useLayer3DevUnderDevelopmentStoreBinding(rawProps);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [localThreeWheels, setLocalThreeWheels] = useState<boolean>(false);
  const [localStadiumPreset, setLocalStadiumPreset] = useState<'standard' | 'throwback'>(
    'standard'
  );
  const [localShowOverlay, setLocalShowOverlay] = useState<boolean>(false);
  const [localSelectedCarIdx, setLocalSelectedCarIdx] = useState<number>(0);
  const [localBoostConfigs, setLocalBoostConfigs] = useState<
    Record<number, PerCarBoostConfig>
  >({});

  const threeWheelsEnabled = propThreeWheels ?? localThreeWheels;
  const setThreeWheelsEnabled = onThreeWheelsChange ?? setLocalThreeWheels;
  const stadiumPreset = propStadiumPreset ?? localStadiumPreset;
  const setStadiumPreset = onStadiumPresetChange ?? setLocalStadiumPreset;
  const showCollisionOverlay = propShowOverlay ?? localShowOverlay;
  const setShowCollisionOverlay = onShowCollisionOverlayChange ?? setLocalShowOverlay;
  const selectedCarIdx = propSelectedCarIdx ?? localSelectedCarIdx;
  const setSelectedCarIdx = onSelectedCarIdxChange ?? setLocalSelectedCarIdx;
  const perCarBoostConfigs = propBoostConfigs ?? localBoostConfigs;

  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-under-development'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-under-development']
  );
  const sizing = propSizing ?? storeSizing;

  const {
    rowGap,
    iconSize,
    iconGap,
    titleFontSize,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
  } = useSettingActionRowStore();

  const currentCarBoostCfg = perCarBoostConfigs[selectedCarIdx] || DEFAULT_CAR_BOOST_CFG;

  const handleUpdateCarBoostCfg = (
    patch: Partial<PerCarBoostConfig>,
    applyAll = false
  ) => {
    const next = { ...perCarBoostConfigs };
    if (applyAll) {
      for (let i = 0; i < 8; i++) {
        next[i] = { ...(next[i] || DEFAULT_CAR_BOOST_CFG), ...patch };
      }
    } else {
      next[selectedCarIdx] = { ...currentCarBoostCfg, ...patch };
    }
    if (onPerCarBoostConfigsChange) {
      onPerCarBoostConfigsChange(next);
    } else {
      setLocalBoostConfigs(next);
    }
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="UNDER DEVELOPMENT" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="under-development-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* 1. Unstable / In-Development Warning Banner */}
          <div
            className={`flex items-start gap-3 w-full p-3.5 mb-1.5 rounded-xl border select-none ${
              isLight
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-950'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}
            onMouseEnter={() =>
              setHoveredDesc(
                'Purely in-development staging area: Features here are intentionally uncalibrated and unstable until core main-branch workflows are finalized.'
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex flex-col text-left leading-snug min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Unstable Staging Area · Purely In Development
                </span>
              </div>
              <span className={`text-[11px] mt-1 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>
                This workspace holds raw asset and WASM bridge integrations (Three-Wheeler Tricycle mode and Throwback Stadium) for quick inspection only.
              </span>
            </div>
          </div>

          {/* 2. Three-Wheeler Mode: Single row with Triangle icon, ToggleSwitch + Enable & Drive on the right */}
          <SettingActionRow
            icon={Triangle}
            iconName="triangle"
            iconColor="text-purple-400"
            title="Three-Wheeler Mode"
            bordered={false}
            showDescription={false}
            hoverDescription="Three-Wheeler Mode (Tricycle / Psyclops): Collapses the two front wheels into a single center-mounted steerable wheel (Y=0) in Bullet btVehicleRL with modified steering and handbrake curves."
            onAction={() => setThreeWheelsEnabled(!threeWheelsEnabled)}
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
            rightSlot={
              <div className="flex items-center gap-2.5">
                <ToggleSwitch
                  checked={threeWheelsEnabled}
                  onCheckedChange={setThreeWheelsEnabled}
                  isLight={isLight}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setThreeWheelsEnabled(true);
                    onEnableAndDriveThreeWheels?.();
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
                      ? 'bg-neutral-200/60 group-hover:bg-neutral-200/95 hover:!bg-neutral-300/90 border-neutral-300/80 text-neutral-800'
                      : 'bg-white/[0.06] group-hover:bg-white/[0.11] hover:!bg-white/[0.16] border-white/[0.10] group-hover:border-white/[0.16] text-neutral-200'
                  }`}
                >
                  <Play
                    style={{
                      width: `${Math.max(11, buttonFontSize)}px`,
                      height: `${Math.max(11, buttonFontSize)}px`,
                    }}
                    className="fill-current shrink-0"
                  />
                  <span>Enable &amp; Drive</span>
                </button>
              </div>
            }
          />

          {/* 3a. Throwback Stadium: Single row with FlagTriangleRight icon and Load & Inspect button */}
          <SettingActionRow
            icon={FlagTriangleRight}
            iconName="flag-triangle-right"
            iconColor="text-rose-400"
            title="Throwback Stadium"
            bordered={false}
            showDescription={false}
            hoverDescription="Throwback Stadium: Loads 36 .cmf collision meshes, ThrowbackHockey_Field.glb visual arena, 3D GoalVolume box (Y: 4922..5460) with open back-pass space, and Throwback boost pad layout."
            onAction={() => setStadiumPreset('throwback')}
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
            rightSlot={
              <div className="flex items-center gap-2">
                {stadiumPreset === 'throwback' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStadiumPreset('standard');
                    }}
                    style={{
                      fontSize: `${buttonFontSize}px`,
                      paddingLeft: `${buttonPaddingX}px`,
                      paddingRight: `${buttonPaddingX}px`,
                      paddingTop: `${buttonPaddingY}px`,
                      paddingBottom: `${buttonPaddingY}px`,
                      borderRadius: `${Math.max(0, buttonRadius)}px`,
                    }}
                    className={`shrink-0 font-semibold border transition-all duration-150 cursor-pointer inline-flex items-center gap-1 leading-tight active:scale-95 whitespace-nowrap ${
                      isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                        : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                    }`}
                  >
                    <RotateCcw
                      style={{
                        width: `${Math.max(11, buttonFontSize)}px`,
                        height: `${Math.max(11, buttonFontSize)}px`,
                      }}
                      className="shrink-0"
                    />
                    <span>Restore Standard</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStadiumPreset('throwback');
                    onLoadAndInspectThrowback?.();
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
                      ? 'bg-neutral-200/60 group-hover:bg-neutral-200/95 hover:!bg-neutral-300/90 border-neutral-300/80 text-neutral-800'
                      : 'bg-white/[0.06] group-hover:bg-white/[0.11] hover:!bg-white/[0.16] border-white/[0.10] group-hover:border-white/[0.16] text-neutral-200'
                  }`}
                >
                  <Play
                    style={{
                      width: `${Math.max(11, buttonFontSize)}px`,
                      height: `${Math.max(11, buttonFontSize)}px`,
                    }}
                    className="fill-current shrink-0"
                  />
                  <span>Load &amp; Inspect</span>
                </button>
              </div>
            }
          />

          {/* 3b. Show Wireframe Overlay: Extra single row below Throwback Stadium */}
          <SettingToggleRow
            icon={Eye}
            iconName="eye"
            iconColor="text-sky-400"
            title="Show Wireframe Overlay"
            checked={showCollisionOverlay}
            onChange={setShowCollisionOverlay}
            bordered={false}
            showDescription={false}
            hoverDescription="Renders ThrowbackStadium_Collision.glb 3D collision mesh wireframe overlay in the arena."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Per-Car Boost Adjustment: Clean tinted Zap icon without badge/description, unified toggle font size without descriptions, and developer-editable SettingSliderRows */}
          <div
            className={`flex flex-col gap-2.5 w-full p-3.5 mt-1.5 rounded-xl border transition-colors select-none ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 text-neutral-900'
                : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
            }`}
            onMouseEnter={() =>
              setHoveredDesc(
                'Per-Car Boost Adjustment: Configure unlimited boost (locked at 100, pad collection active, HUD "--"), pad collectability toggle, and RocketSim built-in auto-recharge delay & rate per car (0..7).'
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
          >
            {/* Header with clean tinted icon matching outer rows (no badge, no description, no icon box) */}
            <div
              className="flex items-center min-w-0"
              style={{ gap: `${iconGap}px` }}
            >
              <Zap
                className="shrink-0 text-amber-400"
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
              />
              <span
                style={{ fontSize: `${titleFontSize}px` }}
                className={`font-semibold truncate ${
                  isLight ? 'text-neutral-800' : 'text-neutral-200'
                }`}
              >
                Per-Car Boost Adjustment
              </span>
            </div>

            {/* Car Slot Selector (0..7) */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-500/15">
              <span
                style={{ fontSize: `${titleFontSize}px` }}
                className={`font-semibold ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}
              >
                Target Vehicle Slot (0..7)
              </span>
              <div className="w-72 shrink-0">
                <SegmentedSwitch
                  value={String(selectedCarIdx)}
                  onValueChange={(v) => setSelectedCarIdx(Math.max(0, Math.min(7, Number(v) || 0)))}
                  options={[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => ({
                    value: String(idx),
                    label: `#${idx}`,
                  }))}
                  size="sm"
                  fullWidth
                  isLight={isLight}
                />
              </div>
            </div>

            {/* Per-Car Unlimited Boost & Boost Collectable Toggles (Unified font size, no descriptions) */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-500/15">
              <div
                onClick={() =>
                  handleUpdateCarBoostCfg({
                    unlimitedBoost: !currentCarBoostCfg.unlimitedBoost,
                  })
                }
                onMouseEnter={() =>
                  setHoveredDesc(
                    `Unlimited Boost (Car #${selectedCarIdx}): Locks boost tank at 100 while keeping pad collection active; HUD displays "--".`
                  )
                }
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-neutral-500/15 cursor-pointer hover:bg-white/[0.04]"
              >
                <span
                  style={{ fontSize: `${titleFontSize}px` }}
                  className={`font-semibold truncate ${
                    isLight ? 'text-neutral-800' : 'text-neutral-200'
                  }`}
                >
                  Unlimited Boost (Car #{selectedCarIdx})
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={Boolean(currentCarBoostCfg.unlimitedBoost)}
                    onCheckedChange={(v) => handleUpdateCarBoostCfg({ unlimitedBoost: v })}
                    isLight={isLight}
                  />
                </div>
              </div>

              <div
                onClick={() =>
                  handleUpdateCarBoostCfg({
                    boostCollectable: !currentCarBoostCfg.boostCollectable,
                  })
                }
                onMouseEnter={() =>
                  setHoveredDesc(
                    `Boost Collectable (Car #${selectedCarIdx}): Controls whether Car #${selectedCarIdx} can pick up field boost pads.`
                  )
                }
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-neutral-500/15 cursor-pointer hover:bg-white/[0.04]"
              >
                <span
                  style={{ fontSize: `${titleFontSize}px` }}
                  className={`font-semibold truncate ${
                    isLight ? 'text-neutral-800' : 'text-neutral-200'
                  }`}
                >
                  Boost Collectable (Car #{selectedCarIdx})
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={Boolean(currentCarBoostCfg.boostCollectable)}
                    onCheckedChange={(v) => handleUpdateCarBoostCfg({ boostCollectable: v })}
                    isLight={isLight}
                  />
                </div>
              </div>
            </div>

            {/* Per-Car Auto-Recharge Toggle & Developer-Editable Sliders */}
            <div className="flex flex-col gap-1 pt-2 border-t border-neutral-500/15">
              <div
                onClick={() =>
                  handleUpdateCarBoostCfg({
                    rechargeBoostEnabled: !currentCarBoostCfg.rechargeBoostEnabled,
                  })
                }
                onMouseEnter={() =>
                  setHoveredDesc(
                    `Auto-Recharge Boost (Car #${selectedCarIdx}): Automatically refills boost in Limited mode after non-boosting delay.`
                  )
                }
                className="flex items-center justify-between py-1.5 cursor-pointer"
              >
                <span
                  style={{ fontSize: `${titleFontSize}px` }}
                  className={`font-semibold ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}
                >
                  Auto-Recharge Boost (Car #{selectedCarIdx})
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={Boolean(currentCarBoostCfg.rechargeBoostEnabled)}
                    onCheckedChange={(v) => handleUpdateCarBoostCfg({ rechargeBoostEnabled: v })}
                    isLight={isLight}
                  />
                </div>
              </div>

              <SettingSliderRow
                label="Recharge Per Second"
                title="Recharge Per Second"
                value={currentCarBoostCfg.rechargeBoostPerSecond}
                min={1}
                max={100}
                step={1}
                unit=" /s"
                developerMode={true}
                editable={true}
                layout="inline"
                bordered={false}
                showDescription={false}
                paddingX={0}
                onChange={(val) => handleUpdateCarBoostCfg({ rechargeBoostPerSecond: val })}
                hoverDescription="Boost auto-recharge rate per second (1 to 100 /s). Type a number and press Enter to confirm."
                onHover={(desc) => desc && setHoveredDesc(desc)}
                onLeave={() => setHoveredDesc(null)}
                isLight={isLight}
              />

              <SettingSliderRow
                label="Recharge Delay"
                title="Recharge Delay"
                value={currentCarBoostCfg.rechargeBoostDelay}
                min={0}
                max={5}
                step={0.05}
                unit=" s"
                developerMode={true}
                editable={true}
                layout="inline"
                bordered={false}
                showDescription={false}
                paddingX={0}
                onChange={(val) => handleUpdateCarBoostCfg({ rechargeBoostDelay: val })}
                hoverDescription="Non-boosting cooldown delay before auto-recharge begins (0.00 to 5.00 s). Type a number and press Enter to confirm."
                onHover={(desc) => desc && setHoveredDesc(desc)}
                onLeave={() => setHoveredDesc(null)}
                isLight={isLight}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-500/15 text-[11px]">
              <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>
                Rate: {Number(currentCarBoostCfg.rechargeBoostPerSecond).toFixed(1)}/s · Delay: {Number(currentCarBoostCfg.rechargeBoostDelay).toFixed(2)}s · Collectable: {currentCarBoostCfg.boostCollectable ? 'ON' : 'OFF'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateCarBoostCfg(DEFAULT_CAR_BOOST_CFG, false)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                    isLight
                      ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                      : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                  }`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Car #{selectedCarIdx}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateCarBoostCfg(currentCarBoostCfg, true)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isLight
                      ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Apply to All Cars (0..7)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Unstable / Under Development workspace for Three-Wheeler mode, Throwback Stadium, and Per-Car Boost."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
