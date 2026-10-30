import React, { useState, useRef } from 'react';
import { AppWindowMac, Volume2, Engine, EighthNotes, FolderUp } from 'lucide-react';
import { SettingSliderRow } from '../../../compounds/SettingSliderRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { JetThrustSvg } from '../../../primitives/packagedSvgIcons';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import { useSpatialAudioStore } from '../../../stores/spatialAudioStore';

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
  bgmEnabled?: boolean;
  onBgmEnabledChange?: (enabled: boolean) => void;
  onUploadBgmFiles?: (files: FileList) => void;
  onNavigateAudioDetail?: () => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

/**
 * [Layer 2 Settings -> Audio Tab]
 * Streamlined User & Developer unified Audio settings:
 * 1. `Mute When Unfocused` (`app-window-mac`, default active = true)
 * 2. `Background Music` (`eighth-notes`, toggle switch on the right + `Upload Folder` button on the left when active)
 * 3. `Master Volume` (`volume-2`, read-only value badge + draggable slider)
 * 4. `Engine Volume` (`engine`, read-only value badge + draggable slider)
 * 5. `Boost Volume` (Noun Project `4873540` Jet Thrust SVG, read-only value badge + draggable slider)
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
  bgmEnabled: propBgmEnabled,
  onBgmEnabledChange,
  onUploadBgmFiles,
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

  const storeBgmEnabled = useSpatialAudioStore((s) => s.bgmEnabled);
  const setStoreBgmEnabled = useSpatialAudioStore((s) => s.setBgmEnabled);
  const uploadStoreBgmFiles = useSpatialAudioStore((s) => s.uploadBgmFiles);
  const bgmTracksCount = useSpatialAudioStore((s) => s.bgmTracks.length);
  const bgmCurrentTrackTitle = useSpatialAudioStore((s) => s.bgmCurrentTrackTitle);

  const bgmEnabled = propBgmEnabled ?? storeBgmEnabled;
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleBgm = (next: boolean) => {
    setStoreBgmEnabled(next);
    onBgmEnabledChange?.(next);
  };

  const handleFolderSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadStoreBgmFiles(files);
      onUploadBgmFiles?.(files);
    }
    e.target.value = '';
  };

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

      {/* Hidden directory file input for Background Music folder upload */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard across Chromium/WebKit/Firefox browsers
        webkitdirectory=""
        directory=""
        multiple
        accept="audio/*"
        className="hidden"
        onChange={handleFolderSelected}
      />

      <SettingToggleRow
        icon={EighthNotes}
        iconName="eighth-notes"
        label="Background Music"
        subtitle={
          bgmTracksCount > 0
            ? bgmCurrentTrackTitle
              ? `${bgmTracksCount} tracks loaded · Playing: ${bgmCurrentTrackTitle}`
              : `${bgmTracksCount} tracks loaded in current session`
            : 'Upload a local audio folder for Free Play & menu soundtrack playback (supports hardware media keys)'
        }
        badge={
          bgmEnabled && bgmTracksCount > 0 ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-amber-500/15 border-amber-500/30 text-amber-400">
              {bgmTracksCount} Tracks
            </span>
          ) : undefined
        }
        checked={bgmEnabled}
        onChange={handleToggleBgm}
        extraRightSlot={
          bgmEnabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer select-none ${
                isLight
                  ? 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 shadow-2xs'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border-neutral-600 shadow-2xs'
              }`}
              title="Upload a folder of audio files for Background Music"
            >
              <FolderUp className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{bgmTracksCount > 0 ? 'Change Folder' : 'Upload Folder'}</span>
            </button>
          ) : undefined
        }
        hoverDescription="Background Music: Enable custom background soundtrack playback with MediaSession shortcut support. When enabled, use Upload Folder on the left of the switch to load local audio tracks."
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
