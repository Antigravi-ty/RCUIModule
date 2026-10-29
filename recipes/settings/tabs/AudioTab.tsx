import React, { useState } from 'react';
import { AppWindowMac, Volume2, Engine } from 'lucide-react';
import { SettingSliderRow } from '../../../compounds/SettingSliderRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { JetThrustSvg } from '../../../primitives/packagedSvgIcons';
import { useSettingActionRowStore } from '../../../tokens/settingRowStore';

export interface AudioConfig {
  masterVolume: number;      // 0..100
  engineVolume: number;      // 0..100
  boostVolume: number;       // 0..100
  muteWhenUnfocused?: boolean; // Positive boolean semantics for "Mute When Unfocused"
  bassGain: number;          // -12..12 dB
  midGain: number;           // -12..12 dB
  trebleGain: number;        // -12..12 dB
  hrtfEnabled: boolean;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  masterVolume: 100,
  engineVolume: 100,
  boostVolume: 80,
  muteWhenUnfocused: true,
  bassGain: 0,
  midGain: 0,
  trebleGain: 0,
  hrtfEnabled: true,
};

export interface AudioTabProps {
  isLight?: boolean;
  developerMode?: boolean;
  /** Aggregated AudioConfig (controlled) */
  audioConfig?: Partial<AudioConfig>;
  /** Alias for audioConfig */
  config?: Partial<AudioConfig>;
  /** Initial AudioConfig (uncontrolled) */
  defaultAudioConfig?: Partial<AudioConfig>;
  /** Callback when any field of AudioConfig changes */
  onAudioConfigChange?: (next: AudioConfig, patch: Partial<AudioConfig>) => void;
  /** Alias for onAudioConfigChange */
  onChange?: (next: AudioConfig, patch: Partial<AudioConfig>) => void;
  /** Individual controlled fields & callbacks */
  muteWhenUnfocused?: boolean;
  defaultMuteWhenUnfocused?: boolean;
  onMuteWhenUnfocusedChange?: (muted: boolean) => void;
  masterVolume?: number;
  defaultMasterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
  engineVolume?: number;
  defaultEngineVolume?: number;
  onEngineVolumeChange?: (volume: number) => void;
  boostVolume?: number;
  defaultBoostVolume?: number;
  onBoostVolumeChange?: (volume: number) => void;
  onNavigateAudioDetail?: () => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

/**
 * [Layer 2 Settings -> Audio Tab]
 * Streamlined User & Developer unified Audio settings:
 * 1. `Mute When Unfocused` (`app-window-mac`, default active = true)
 * 2. `Master Volume` (`volume-2`, read-only value badge + draggable slider)
 * 3. `Engine Volume` (`engine`, read-only value badge + draggable slider)
 * 4. `Boost Volume` (Noun Project `4873540` Jet Thrust SVG, read-only value badge + draggable slider)
 * Note: Equalizer entry is removed, and Audio Debug suite is relocated to `AdvancedTab`.
 */
export const AudioTab: React.FC<AudioTabProps> = ({
  isLight = false,
  developerMode = false,
  audioConfig: propAudioConfig,
  config: propAliasConfig,
  defaultAudioConfig,
  onAudioConfigChange,
  onChange,
  muteWhenUnfocused: propMuteWhenUnfocused,
  defaultMuteWhenUnfocused,
  onMuteWhenUnfocusedChange,
  masterVolume: propMasterVolume,
  defaultMasterVolume,
  onMasterVolumeChange,
  engineVolume: propEngineVolume,
  defaultEngineVolume,
  onEngineVolumeChange,
  boostVolume: propBoostVolume,
  defaultBoostVolume,
  onBoostVolumeChange,
  onHover,
  onLeave,
}) => {
  const controlledCfg = propAudioConfig ?? propAliasConfig;
  const [internalConfig, setInternalConfig] = useState<AudioConfig>(() => ({
    ...DEFAULT_AUDIO_CONFIG,
    ...defaultAudioConfig,
    ...(defaultMuteWhenUnfocused !== undefined ? { muteWhenUnfocused: defaultMuteWhenUnfocused } : {}),
    ...(defaultMasterVolume !== undefined ? { masterVolume: defaultMasterVolume } : {}),
    ...(defaultEngineVolume !== undefined ? { engineVolume: defaultEngineVolume } : {}),
    ...(defaultBoostVolume !== undefined ? { boostVolume: defaultBoostVolume } : {}),
  }));

  const resolvedConfig: AudioConfig = {
    ...internalConfig,
    ...controlledCfg,
    ...(propMuteWhenUnfocused !== undefined ? { muteWhenUnfocused: propMuteWhenUnfocused } : {}),
    ...(propMasterVolume !== undefined ? { masterVolume: propMasterVolume } : {}),
    ...(propEngineVolume !== undefined ? { engineVolume: propEngineVolume } : {}),
    ...(propBoostVolume !== undefined ? { boostVolume: propBoostVolume } : {}),
  };

  const muteWhenUnfocused = resolvedConfig.muteWhenUnfocused ?? true;
  const masterVolume = resolvedConfig.masterVolume;
  const engineVolume = resolvedConfig.engineVolume;
  const boostVolume = resolvedConfig.boostVolume;

  const updateAudioField = <K extends keyof AudioConfig>(key: K, value: AudioConfig[K]) => {
    const patch: Partial<AudioConfig> = { [key]: value };
    const nextConfig: AudioConfig = { ...resolvedConfig, ...patch };
    setInternalConfig(nextConfig);
    onAudioConfigChange?.(nextConfig, patch);
    onChange?.(nextConfig, patch);
  };

  const { rowGap } = useSettingActionRowStore();

  return (
    <div
      data-layout="audio-settings-list"
      className="flex flex-col w-full"
      style={{ gap: `${rowGap}px` }}
    >
      <SettingToggleRow
        icon={AppWindowMac}
        label="Mute When Unfocused"
        subtitle="Automatically mute engine synthesis and game audio when the window or tab loses focus"
        checked={muteWhenUnfocused}
        onChange={(next) => {
          onMuteWhenUnfocusedChange?.(next);
          updateAudioField('muteWhenUnfocused', next);
        }}
        hoverDescription="Automatically mute game sound and engine synthesis when the application window or tab is unfocused."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      <SettingSliderRow
        icon={Volume2}
        label="Master Volume"
        description="Global audio output ceiling across all spatial audio and powertrain sound channels"
        value={masterVolume}
        min={0}
        max={100}
        step={1}
        unit="%"
        developerMode={developerMode}
        onChange={(next) => {
          onMasterVolumeChange?.(next);
          updateAudioField('masterVolume', next);
        }}
        hoverDescription="Global audio output ceiling across all spatial audio and powertrain sound channels."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      <SettingSliderRow
        icon={Engine}
        label="Engine Volume"
        description="Dynamic electric motor synthesis (EMotorSynth) powertrain continuous audio"
        value={engineVolume}
        min={0}
        max={100}
        step={1}
        unit="%"
        developerMode={developerMode}
        onChange={(next) => {
          onEngineVolumeChange?.(next);
          updateAudioField('engineVolume', next);
        }}
        hoverDescription="Dynamic electric motor synthesis (EMotorSynth) powertrain continuous audio."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      <SettingSliderRow
        icon={JetThrustSvg}
        iconName="jet-thrust"
        iconColor={
          isLight
            ? 'text-neutral-400 group-hover:text-neutral-600'
            : 'text-neutral-500 group-hover:text-neutral-300'
        }
        label="Boost Volume"
        description="Rocket thruster discharge loop and supersonic acceleration sound"
        value={boostVolume}
        min={0}
        max={100}
        step={1}
        unit="%"
        developerMode={developerMode}
        onChange={(next) => {
          onBoostVolumeChange?.(next);
          updateAudioField('boostVolume', next);
        }}
        hoverDescription="Rocket thruster discharge loop and supersonic acceleration sound."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />
    </div>
  );
};
