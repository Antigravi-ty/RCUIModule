import React, { useState } from 'react';
import { useLayer3DevActiveTunersStoreBinding } from './hooks/useDevRecipesStoreBindings';
import {
  Box,
  Car,
  Crosshair,
  Film,
  PencilRuler,
  Keyboard,
  Disc3,
  Sliders,
  Activity,
  Target,
  Camera,
  Info,
  Router,
  Database,
  Zap,
  Scan,
  Volume2,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { PhaseVariationMatrix } from '../compounds/PhaseVariationMatrix';
import { useMenuLayoutStore, DEFAULT_PANEL_SIZING } from '../stores/menuLayoutStore';
import type { PanelSizingConfig } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import {
  DIAGNOSTIC_DUMP_PRESET,
  STATIC_TRAINING_BALL_CAM_TUNER_PRESET,
  VEHICLE_MODEL_OFFSET_TUNER_PRESET,
  GOAL_VOLUME_TUNER_PRESET,
  REACHABILITY_TUNER_PRESET,
  REPLAY_DIRECTOR_TUNER_PRESET,
  KICKOFF_TRAINING_PRESET,
  EVENT_STREAM_OB_PRESET,
  DUAL_ARENA_DETERMINISM_HARNESS_PRESET,
  CAMERA_DETERMINISM_PRESET,
  CLOCK_PACING_TUNER_PRESET,
  NETWORK_STRESS_INJECTION_PRESET,
  SPATIAL_AUDIO_TUNER_PRESET,
} from '../stores/floatingPresets';
import { FloatingWindowCard } from './settings/components/FloatingWindowCard';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';

export interface BoostPhaseSelectionState {
  start: string;
  loop: string;
  end: string;
}

export interface Layer3DevActiveTunersRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateAdvancedAudio?: () => void;
  onNavigateEventAndTriggerer?: () => void;
  onNavigateEventTriggerer?: () => void;
  wsVerticalOffsetPct?: number;
  onWsVerticalOffsetPctChange?: (val: number) => void;
  carBallMode?: string;
  onCarBallModeChange?: (mode: string) => void;
  carCarMode?: string;
  onCarCarModeChange?: (mode: string) => void;
  boostSelection?: BoostPhaseSelectionState;
  onSelectBoostPhase?: (variationId: string, phase: 'start' | 'loop' | 'end') => void;
  onSelectAllBoostPhases?: (variationId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddPresetWindow?: (preset: any, e: React.MouseEvent<HTMLButtonElement>) => void;
  activeWindows?: unknown[];
  onClosePresetWindow?: (id: string) => void;
  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 3 Active Tuners (Developer Tier)
 * Unified compact borderless setting rows + FloatingWindowCard launchers + PhaseVariationMatrix.
 */
export const Layer3DevActiveTunersRecipe: React.FC<Layer3DevActiveTunersRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  onBack,
  onNavigateAdvancedAudio,
  onNavigateEventAndTriggerer,
  onNavigateEventTriggerer,
  wsVerticalOffsetPct: propWsOffset,
  onWsVerticalOffsetPctChange,
  carBallMode: propCarBallMode,
  onCarBallModeChange,
  carCarMode: propCarCarMode,
  onCarCarModeChange,
  boostSelection,
  onSelectBoostPhase,
  onSelectAllBoostPhases,
  sizing: propSizing,
} = useLayer3DevActiveTunersStoreBinding(rawProps);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [localWsOffset, setLocalWsOffset] = useState<number>(10);
  const [localCarBallMode, setLocalCarBallMode] = useState<string>('vehicle_body');
  const [localCarCarMode, setLocalCarCarMode] = useState<string>('vehicle_detail');

  const wsVerticalOffsetPct = propWsOffset ?? localWsOffset;
  const setWsVerticalOffsetPct = onWsVerticalOffsetPctChange ?? setLocalWsOffset;
  const carBallMode = propCarBallMode ?? localCarBallMode;
  const handleCarBallModeChange = onCarBallModeChange ?? setLocalCarBallMode;
  const carCarMode = propCarCarMode ?? localCarCarMode;
  const handleCarCarModeChange = onCarCarModeChange ?? setLocalCarCarMode;

  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-dev-active-tuners'] ?? DEFAULT_PANEL_SIZING['layer3-dev-active-tuners']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap, underDevelopmentTopMargin, setToken } = useSettingActionRowStore();

  const ballSoundOptions = [
    { value: 'vehicle_body', label: 'Vehicle Body (Random 1 of 4)' },
    { value: 'vehicle_accent', label: 'Vehicle Accent (Single File)' },
  ];

  const carCarSoundOptions = [
    { value: 'vehicle_detail', label: 'Vehicle Detail (Default)' },
    { value: 'sfx_collision', label: 'SoundFX Collision' },
  ];

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="ACTIVE TUNERS" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="active-tuners-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {/* Top-Most Item: Export Diagnostic Dump Floating Window */}
          <FloatingWindowCard
            preset={DIAGNOSTIC_DUMP_PRESET}
            icon={Database}
            iconColor="text-sky-400"
            badge="Live Buffers · Anytime ZIP"
            badgeClass="bg-sky-500/15 border-sky-500/30 text-sky-400"
            bordered={false}
            showDescription={false}
            description="Live Client Replay, Reconcile & Pacing Telemetry, and Authoritative Server Replay gauges + anytime mid-match dump"
            hoverTooltip="Export Diagnostic Dump: Real-time buffer usage monitor with configurable capacity and one-click unified .zip export anytime via ESC."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* Spatial Audio & Anthem Active Tuner */}
          <FloatingWindowCard
            preset={SPATIAL_AUDIO_TUNER_PRESET}
            icon={Volume2}
            iconColor="text-amber-400"
            badge="2.0s Curve · Stadium Reverb"
            badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
            bordered={false}
            showDescription={false}
            description="Stadium spatial acoustics (HPF 425Hz, LPF 3500Hz, Wet 69%, 3.0s Decay) & 2.0s directional non-linear transition curve"
            hoverTooltip="Spatial Audio & Anthem Tuner: Live calibration for Player Anthem and Realistic Background Music stadium acoustics and 2.0s directional non-linear transitions."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 0. Training Ball Camera & Opacity Tuner */}
          <FloatingWindowCard
            preset={STATIC_TRAINING_BALL_CAM_TUNER_PRESET}
            icon={Camera}
            iconColor="text-sky-400"
            badge="Ball Cam · Opacity Override"
            badgeClass="bg-sky-500/15 border-sky-500/30 text-sky-400"
            bordered={false}
            showDescription={false}
            description="Relative ball camera (Distance, Height, Angle, Lateral Offset), Edit-Mode 70% Opacity Override & JSON Export"
            hoverTooltip="Training Ball Camera & Opacity Tuner: Live slider + text input tuner for Static Training Pack relative ball camera and temporary Edit-Mode ball opacity override."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 1. Vehicle Model & Offset Tuner */}
          <FloatingWindowCard
            preset={VEHICLE_MODEL_OFFSET_TUNER_PRESET}
            icon={Car}
            iconColor="text-amber-400"
            badge="Per-Model Offsets"
            badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
            bordered={false}
            showDescription={false}
            description="Hitbox & Align, Per-Vehicle Wheel Hub Anchors & Dual Boost Exhaust Nozzle Offsets"
            hoverTooltip="Vehicle Model & Offset Tuner: Per-vehicle spatial calibration for Fennec & Insidio (Hitbox archetype, Chassis Center Offset, Wheel Hub Anchors & Boost Nozzle Offsets)."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. Goal Volume Hitbox Active Tuner */}
          <FloatingWindowCard
            preset={GOAL_VOLUME_TUNER_PRESET}
            icon={Box}
            iconColor="text-emerald-400"
            badge="3D AABB · JSON Export"
            badgeClass="bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            bordered={false}
            showDescription={false}
            description="Goal Volume Hitbox 3D wireframe overlay (default off), Standard & Throwback AABB calibration & JSON export"
            hoverTooltip="Goal Volume Hitbox Active Tuner: Toggle the 3D Goal Volume & Ball-Center Trigger wireframe overlay, tune Standard & Throwback goal bounds, and export/import JSON."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. Reachability & Intercept Tuner */}
          <FloatingWindowCard
            preset={REACHABILITY_TUNER_PRESET}
            icon={Crosshair}
            iconColor="text-emerald-400"
            badge="LUT · 3D Horn · Cross"
            badgeClass="bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
            bordered={false}
            showDescription={false}
            description="Ground 1s/2s/3s Isochrone LUT (Boost=0), Boost-Driven 3D Horn & Optimal Intercept 3D Cross"
            hoverTooltip="Reachability & Intercept Tuner: Real-time 1.4µs WASM LUT ground reachability, boost-driven 3D spacetime interception horn, and 3D orthogonal intercept cross."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Replay Director Camera & Slow-Mo Tuner */}
          <FloatingWindowCard
            preset={REPLAY_DIRECTOR_TUNER_PRESET}
            icon={Film}
            iconColor="text-amber-400"
            badge=".rcgr.gz · Preview · AutoCam"
            badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
            bordered={false}
            showDescription={false}
            description="Export & import .rcgr.gz Goal Replay containers, 3D Arena preview, anomaly peak seek chips & ±15f window diagnostics"
            hoverTooltip="Replay Director Camera & Slow-Mo Tuner: Export and import compressed .rcgr.gz Goal Replay containers, jump to anomaly peaks, and copy ±15-frame diagnostic windows."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Kickoff Training (PPO) Floating Window */}
          <FloatingWindowCard
            preset={KICKOFF_TRAINING_PRESET}
            icon={PencilRuler}
            iconColor="text-sky-400"
            badge="PPO AI"
            badgeClass="bg-sky-500/15 border-sky-500/30 text-sky-400"
            bordered={false}
            showDescription={false}
            description="Kickoff sub-modes, realistic wait (0.25s steps), N/120 speed & W/S offset"
            hoverTooltip="Kickoff Training Config: Floating tuner for PPO AI kickoff training parameters."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Kickoff Rhythm Overlay W / S Vertical Offset */}
          <SettingSliderRow
            icon={Keyboard}
            iconColor="text-sky-400"
            title="W / S Vertical Offset"
            label="W / S Vertical Offset"
            description="W (upward) & S (downward) vertical container offset (0% – 50%, default 10%)"
            value={wsVerticalOffsetPct}
            min={0}
            max={50}
            step={1}
            unit="%"
            developerMode={true}
            bordered={false}
            showDescription={false}
            onChange={setWsVerticalOffsetPct}
            hoverDescription="Kickoff Rhythm Overlay Key Stagger: Adjusts the vertical stagger of W (upward) and S (downward) key receptors in the Kickoff Training rhythm overlay."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6b. Under Development Top Spacing Option */}
          <SettingSliderRow
            icon={Scan}
            iconColor="text-rose-400"
            title="Under Development Top Margin"
            label="Under Development Top Margin"
            description="Extra top spacing above Under Development in Developer Tab to avoid hover overlap"
            value={underDevelopmentTopMargin}
            min={0}
            max={24}
            step={1}
            unit="px"
            developerMode={true}
            bordered={false}
            showDescription={false}
            onChange={(val) => setToken('underDevelopmentTopMargin', val)}
            hoverDescription="Under Development Top Margin: Adjusts the extra vertical space between Observe Safe Area Boundary and the bordered Under Development row in Developer Tab."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 7. Boost Audio Variation Tuner using UIStorybook's clean L3 PhaseVariationMatrix */}
          <div className="my-1">
            <PhaseVariationMatrix
              selection={boostSelection}
              onSelectPhase={onSelectBoostPhase}
              onSelectAllPhases={onSelectAllBoostPhases}
              isLight={isLight}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
            />
          </div>

          {/* 8. Audio Variant Sound Sets */}
          <SettingSegmentedRow
            icon={Disc3}
            iconColor="text-amber-500"
            title="Car-Ball Hit Audio"
            label="Car-Ball Hit Audio"
            subtitle="Vehicle Body (Random 1 of 4) vs Vehicle Accent"
            value={carBallMode}
            onChange={handleCarBallModeChange}
            options={ballSoundOptions}
            bordered={false}
            showDescription={false}
            hoverDescription="Car-Ball impact audio scheme: Vehicle Body (random 01-04) or Vehicle Accent (single asset)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          <SettingSegmentedRow
            icon={Disc3}
            iconColor="text-amber-500"
            title="Car-Car Bump Audio"
            label="Car-Car Bump Audio"
            subtitle="Vehicle Detail default (Random 1 of 6) vs SoundFX Collision"
            value={carCarMode}
            onChange={handleCarCarModeChange}
            options={carCarSoundOptions}
            bordered={false}
            showDescription={false}
            hoverDescription="Car-Car collision audio scheme: Vehicle Detail (Random 1 of 6, default) or SoundFX Collision."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 9. Advanced Audio Settings (Navigates to Layer 4) */}
          <SettingActionRow
            icon={Sliders}
            iconColor="text-amber-500"
            title="Advanced Audio Settings"
            actionLabel="Configure"
            bordered={false}
            showDescription={false}
            onAction={() => onNavigateAdvancedAudio?.()}
            hoverDescription="Open Layer 4 Advanced Audio Settings: Multi-bus audio calibration (0% - 500%), direct numeric inputs, and JSON export."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 9b. Event and Triggerer (Navigates to Layer 4) */}
          <SettingActionRow
            icon={Zap}
            iconColor="text-sky-400"
            title="Event and Triggerer"
            actionLabel="Configure"
            bordered={false}
            showDescription={false}
            onAction={() => (onNavigateEventAndTriggerer ?? onNavigateEventTriggerer)?.()}
            hoverDescription="Open Layer 4 Event and Triggerer: Configure collision impulse thresholds, audio/VFX event bindings, and trigger rules."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 10. Event Stream OB */}
          <FloatingWindowCard
            preset={EVENT_STREAM_OB_PRESET}
            icon={Activity}
            iconColor="text-sky-400"
            bordered={false}
            showDescription={false}
            description="Physics collision observer, impulse curves & threshold visualizer"
            hoverTooltip="Event Stream OB: Real-time collision dynamics observer, impulse curves & audio threshold calibration."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 11. Dual-Arena Determinism Harness */}
          <FloatingWindowCard
            preset={DUAL_ARENA_DETERMINISM_HARNESS_PRESET}
            icon={Target}
            iconColor="text-emerald-400"
            bordered={false}
            showDescription={false}
            description="Bit-exact physics rollback verification & desync delta monitoring"
            hoverTooltip="Dual-Arena Determinism Harness: Parallel RocketSim physics verification with live rollback desync checking."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 12. Camera Deterministic Harness */}
          <FloatingWindowCard
            preset={CAMERA_DETERMINISM_PRESET}
            icon={Camera}
            iconColor="text-sky-400"
            badge="WASM vs Clean JS · 600+600f"
            badgeClass="bg-sky-500/15 border-sky-500/30 text-sky-400"
            bordered={false}
            showDescription={false}
            description="Live toggle between Legacy WASM & Clean JS camera with 600+600f CSV auto-capture"
            hoverTooltip="Camera Deterministic Harness: Side-by-side comparison between legacy camera.wasm and clean-room Clean JS camera."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 13. Input Buffer & Clock Pacing Tuner */}
          <FloatingWindowCard
            preset={CLOCK_PACING_TUNER_PRESET}
            icon={Sliders}
            iconColor="text-amber-400"
            badge="What-If Sim · Trace JSON"
            badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
            bordered={false}
            showDescription={false}
            description="Low-level STS/CSTS hysteresis, PD gains, RTT bias compensation, trace import & counterfactual What-If simulator"
            hoverTooltip="Input Buffer & Clock Pacing Tuner: Tune all low-level pacing parameters, import recorded telemetry traces (.json), and inspect simulated Starvations, Hard Snaps, Rate Switches/min, and 50/50 Lead Cost."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 14. Network Stress Injection */}
          <FloatingWindowCard
            preset={NETWORK_STRESS_INJECTION_PRESET}
            icon={Router}
            iconColor="text-rose-400"
            badge="Asymmetric ↑/↓ · 2-Car Probes"
            badgeClass="bg-rose-500/15 border-rose-500/30 text-rose-400"
            bordered={false}
            showDescription={false}
            description="Asymmetric uplink/downlink delay, jitter, packet loss & burst drop injection + In-Arena 2-Car prediction probe lab"
            hoverTooltip="Network Stress Injection: Inject asymmetric uplink/downlink latency, jitter, packet loss, and burst drops, or spawn 2-car 0G prediction probes."
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Active tuners under calibration (Atmosphere, Vehicle, Kickoff, Audio & Diagnostics)."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
