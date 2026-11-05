import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStore';
import { audioConfig, type DynamicRangeProfileId } from '../config/audioConfig';
import {
  Activity,
  Compass,
  Gauge,
  Maximize2,
  Radio,
  RotateCcw,
  Sliders,
  Sparkles,
  Speaker,
  Volume2,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

export interface Layer3AcousticsEqualizerStateOverride {
  dynamicRangeProfile?: DynamicRangeProfileId;
  spatialAudio?: boolean;
  spatialPanningModel?: 'equalpower' | 'HRTF';
  distanceModel?: 'smoothstep' | 'inverse' | 'linear' | 'exponential';
  audibilityFloor?: number;
  arenaAcousticScale?: number;
  bassGain?: number;
  midGain?: number;
  trebleGain?: number;
  farFieldHighShelfDb?: number;
}

export interface Layer3AcousticsEqualizerRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  onBack?: () => void;
  hasError?: boolean;
  onCheckNotification?: () => void;
  stateOverride?: Layer3AcousticsEqualizerStateOverride;
}

/**
 * [Recipe] Layer 3 Acoustics & Equalizer
 * Streamlined single-column vertical layout sharing unified Settings row typography & spacing,
 * wired directly to `useAppStore` and `audioConfig` -> `MasterAcousticProcessor`.
 */
export const Layer3AcousticsEqualizerRecipe: React.FC<Layer3AcousticsEqualizerRecipeProps> = ({
  isLight = false,
  developerMode: propDevMode,
  onBack: propOnBack,
  hasError: propHasError,
  onCheckNotification,
  stateOverride,
}) => {
  const storeGoBack = useAppStore((s) => s.goBack);
  const storeDevMode = useAppStore((s) => s.developerMode);
  const storeAudio = useAppStore((s) => s.audio);
  const updateAudio = useAppStore((s) => s.updateAudio);

  const onBack = propOnBack ?? storeGoBack;
  const developerMode = propDevMode ?? storeDevMode ?? true;
  const { panels, simulateLayer3Error } = useMenuLayoutStore();
  const sizing = panels['layer3-acoustics-equalizer'];
  const showError = propHasError ?? simulateLayer3Error;
  const { rowGap } = useSettingActionRowStore();

  useEffect(() => {
    const unsub = audioConfig.subscribe((cfg) => {
      const nextDyn: DynamicRangeProfileId =
        cfg.dynamicRangeProfile === 'compressed' ||
        cfg.dynamicRangeProfile === 'monitor' ||
        cfg.dynamicRangeProfile === 'dynamic'
          ? cfg.dynamicRangeProfile
          : 'dynamic';
      const nextPan: 'equalpower' | 'HRTF' =
        cfg.spatialPanningModel === 'HRTF' ? 'HRTF' : 'equalpower';
      const nextDist: 'smoothstep' | 'inverse' | 'linear' | 'exponential' =
        cfg.distanceModel === 'inverse' ||
        cfg.distanceModel === 'linear' ||
        cfg.distanceModel === 'exponential' ||
        cfg.distanceModel === 'smoothstep'
          ? cfg.distanceModel
          : 'smoothstep';
      const nextFloor = Number.isFinite(Number(cfg.minAudibleGainFloor))
        ? Math.round(Math.max(0, Math.min(0.5, Number(cfg.minAudibleGainFloor))) * 100)
        : 15;
      const nextScale = Number.isFinite(Number(cfg.arenaAcousticScale))
        ? Number(cfg.arenaAcousticScale)
        : 1.0;
      const nextBass = Number.isFinite(Number(cfg.eqBass)) ? Number(cfg.eqBass) : 0;
      const nextMid = Number.isFinite(Number(cfg.eqMid)) ? Number(cfg.eqMid) : 0;
      const nextTreble = Number.isFinite(Number(cfg.eqTreble)) ? Number(cfg.eqTreble) : 0;
      const nextShelf = Number.isFinite(Number(cfg.farFieldHighShelfDb))
        ? Number(cfg.farFieldHighShelfDb)
        : 0;
      const nextSpatial = cfg.spatialAudio !== undefined ? Boolean(cfg.spatialAudio) : true;

      const cur = useAppStore.getState().audio;
      if (
        cur.dynamicRangeProfile !== nextDyn ||
        cur.spatialPanningModel !== nextPan ||
        cur.distanceModel !== nextDist ||
        cur.audibilityFloor !== nextFloor ||
        cur.arenaAcousticScale !== nextScale ||
        cur.bassGain !== nextBass ||
        cur.midGain !== nextMid ||
        cur.trebleGain !== nextTreble ||
        cur.farFieldHighShelfDb !== nextShelf ||
        cur.hrtfEnabled !== nextSpatial
      ) {
        useAppStore.setState((s) => ({
          audio: {
            ...s.audio,
            dynamicRangeProfile: nextDyn,
            spatialPanningModel: nextPan,
            distanceModel: nextDist,
            audibilityFloor: nextFloor,
            arenaAcousticScale: nextScale,
            bassGain: nextBass,
            midGain: nextMid,
            trebleGain: nextTreble,
            farFieldHighShelfDb: nextShelf,
            hrtfEnabled: nextSpatial,
          },
        }));
      }
    });
    return () => {
      unsub();
    };
  }, []);

  const compressionMode: DynamicRangeProfileId =
    stateOverride?.dynamicRangeProfile ?? storeAudio.dynamicRangeProfile ?? 'dynamic';
  const spatialAudio: boolean =
    stateOverride?.spatialAudio ?? storeAudio.hrtfEnabled ?? true;
  const panningModel: 'equalpower' | 'HRTF' =
    stateOverride?.spatialPanningModel ?? storeAudio.spatialPanningModel ?? 'equalpower';
  const rolloffCurve: 'smoothstep' | 'inverse' | 'linear' | 'exponential' =
    stateOverride?.distanceModel ?? storeAudio.distanceModel ?? 'smoothstep';
  const audibilityFloor: number =
    stateOverride?.audibilityFloor ?? storeAudio.audibilityFloor ?? 15;
  const acousticScale: number =
    stateOverride?.arenaAcousticScale ?? storeAudio.arenaAcousticScale ?? 1.0;
  const bassGain: number = stateOverride?.bassGain ?? storeAudio.bassGain ?? 0;
  const midGain: number = stateOverride?.midGain ?? storeAudio.midGain ?? 0;
  const trebleGain: number = stateOverride?.trebleGain ?? storeAudio.trebleGain ?? 0;
  const farFieldHighShelfDb: number =
    stateOverride?.farFieldHighShelfDb ?? storeAudio.farFieldHighShelfDb ?? 0;

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const handleResetDefaults = () => {
    updateAudio({
      dynamicRangeProfile: 'dynamic',
      hrtfEnabled: true,
      spatialPanningModel: 'equalpower',
      distanceModel: 'smoothstep',
      audibilityFloor: 15,
      arenaAcousticScale: 1.0,
      bassGain: 0,
      midGain: 0,
      trebleGain: 0,
      farFieldHighShelfDb: 0,
    });
  };

  const resetActionSlot = (
    <button
      type="button"
      onClick={handleResetDefaults}
      onMouseEnter={() =>
        setHoveredDesc(
          'Reset 3-Band EQ (0 dB), Dynamic Range (Dynamic), Spatial Panning, and Acoustic Scale back to calibrated defaults.'
        )
      }
      onMouseLeave={() => setHoveredDesc(null)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
        isLight
          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
          : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-neutral-300'
      }`}
    >
      <RotateCcw className="h-3 w-3 text-amber-500" />
      <span>Reset Defaults</span>
    </button>
  );

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title="ACOUSTICS & EQUALIZER"
        onBack={onBack}
        isLight={isLight}
        rightElement={resetActionSlot}
      />

      <PanelContent scrollable={true}>
        <div
          data-layout="audio-detail-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          <InlineErrorNotice
            visible={showError}
            isLight={isLight}
            onCheckNotification={onCheckNotification}
          />

          {/* 1. Dynamic Range Profile */}
          <SettingSegmentedRow
            icon={Volume2}
            iconColor="text-amber-500"
            title="Dynamic Range Profile"
            value={compressionMode}
            onChange={(v) =>
              updateAudio({ dynamicRangeProfile: v as DynamicRangeProfileId })
            }
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'compressed', label: 'Night' },
              { value: 'dynamic', label: 'Dynamic' },
              { value: 'monitor', label: 'Studio' },
            ]}
            hoverDescription="Dynamic range compression profile: Night (high-ratio peak control + detail lift), Dynamic (competitive limiter against multi-impact clipping), or Studio (uncompressed reference)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. 3D Spatial Audio */}
          <SettingToggleRow
            icon={Radio}
            iconColor="text-sky-400"
            title="3D Spatial Audio"
            checked={spatialAudio}
            onChange={(checked) => updateAudio({ hrtfEnabled: checked })}
            bordered={false}
            showDescription={false}
            hoverDescription="Enable 3D spatial azimuth/elevation positioning for ball, boost, and opponent vehicle emitters."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. 3D Spatial Panning Model */}
          <SettingSegmentedRow
            icon={Compass}
            iconColor="text-sky-400"
            title="3D Spatial Panning Model"
            value={panningModel}
            onChange={(v) =>
              updateAudio({ spatialPanningModel: v as 'equalpower' | 'HRTF' })
            }
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'equalpower', label: 'Equal Power' },
              { value: 'HRTF', label: 'HRTF Binaural' },
            ]}
            hoverDescription="Select WebAudio PannerNode spatialization algorithm (Equal Power stereo panning vs HRTF binaural head model)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Distance Rolloff Curve */}
          <SettingSegmentedRow
            icon={Activity}
            iconColor="text-emerald-400"
            title="Distance Rolloff Curve"
            value={rolloffCurve}
            onChange={(v) =>
              updateAudio({
                distanceModel: v as 'smoothstep' | 'inverse' | 'linear' | 'exponential',
              })
            }
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'smoothstep', label: 'Smoothstep' },
              { value: 'inverse', label: 'Inverse' },
              { value: 'linear', label: 'Linear' },
              { value: 'exponential', label: 'Exponential' },
            ]}
            hoverDescription="Baseline distance attenuation curve model applied across 3D spatial audio emitters."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Distant Audibility Floor */}
          <SettingSliderRow
            icon={Gauge}
            iconColor="text-amber-400"
            label="Distant Audibility Floor"
            title="Distant Audibility Floor"
            value={audibilityFloor}
            min={0}
            max={50}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(val) => updateAudio({ audibilityFloor: val })}
            hoverDescription="Minimum volume floor for non-culled far-field 3D audio sources (0% to 50%, default 15%)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Arena Acoustic Scale */}
          <SettingSliderRow
            icon={Maximize2}
            iconColor="text-emerald-400"
            label="Arena Acoustic Scale"
            title="Arena Acoustic Scale"
            value={acousticScale}
            min={0.5}
            max={2.0}
            step={0.05}
            unit="x"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={(val) => updateAudio({ arenaAcousticScale: val })}
            hoverDescription="Spatial distance scale multiplier for arena attenuation radii (0.50x to 2.00x, default 1.00x)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 7. Bass (100Hz Low-Shelf) */}
          <SettingSliderRow
            icon={Speaker}
            iconColor="text-amber-500"
            label="Bass (100Hz)"
            title="Bass (100Hz)"
            value={bassGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            colorScheme={bassGain !== 0 ? 'amber' : 'neutral'}
            onChange={(val) => updateAudio({ bassGain: val })}
            hoverDescription="Master low-frequency bass shelf (100Hz, -12dB to +12dB) for engine roar, demolish sub-bass, and goal impact weight."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 8. Midrange (1kHz Peaking) */}
          <SettingSliderRow
            icon={Sliders}
            iconColor="text-amber-500"
            label="Midrange (1kHz)"
            title="Midrange (1kHz)"
            value={midGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            colorScheme={midGain !== 0 ? 'amber' : 'neutral'}
            onChange={(val) => updateAudio({ midGain: val })}
            hoverDescription="Master midrange peaking band (1000Hz, Q=0.85, -12dB to +12dB) for ball impact snap and mechanical clarity."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 9. Treble (10kHz High-Shelf) */}
          <SettingSliderRow
            icon={Sliders}
            iconColor="text-amber-500"
            label="Treble (10kHz)"
            title="Treble (10kHz)"
            value={trebleGain}
            min={-12}
            max={12}
            step={0.5}
            unit=" dB"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            colorScheme={trebleGain !== 0 ? 'amber' : 'neutral'}
            onChange={(val) => updateAudio({ trebleGain: val })}
            hoverDescription="Master high-frequency shelf (10kHz, -12dB to +12dB) for boost discharge hiss, crossbar ping, and air presence."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 10. Far-Field High-Shelf Roll-Off */}
          <SettingSliderRow
            icon={Sparkles}
            iconColor="text-sky-400"
            label="Far-Field High-Shelf Softening"
            title="Far-Field High-Shelf Softening"
            value={farFieldHighShelfDb}
            min={-12}
            max={0}
            step={0.5}
            unit=" dB"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            colorScheme={farFieldHighShelfDb !== 0 ? 'sky' : 'neutral'}
            onChange={(val) => updateAudio({ farFieldHighShelfDb: val })}
            hoverDescription="Optional high-shelf roll-off (5.5kHz, 0dB to -12dB, default 0dB uncolored) to gently tame harshness without muffling transient snap."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure Master 3-Band Parametric EQ (100Hz / 1kHz / 10kHz), Dynamic Range Compressor (Night / Dynamic / Studio), and 3D spatial acoustics."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
};

