import React, { useState, useRef } from 'react';
import {
  AppWindowMac,
  Volume2,
  Engine,
  EighthNotes,
  ChevronDown,
  Gamepad2,
  Target,
  Users,
  Trophy,
  Timer,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { SettingSliderRow } from '../../../compounds/SettingSliderRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { Checkbox } from '../../../primitives/Checkbox';
import { JetThrustSvg } from '../../../primitives/packagedSvgIcons';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import { useSpatialAudioStore } from '../../../stores/spatialAudioStore';
import type { BgmSceneConfig } from '../../../config/spatialAudioConfig';

export interface AudioConfig {
  masterVolume: number;      // 0..100
  engineVolume: number;      // 0..100
  boostVolume: number;       // 0..100
  bgmVolume?: number;        // 0..100
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
  bgmVolume: 80,
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
  bgmVolume?: number;
  defaultBgmVolume?: number;
  onBgmVolumeChange?: (volume: number) => void;
  bgmEnabled?: boolean;
  onBgmEnabledChange?: (enabled: boolean) => void;
  onUploadBgmFiles?: (files: FileList) => void;
  onNavigateAudioDetail?: () => void;
  onHover: (desc: string) => void;
  onLeave: () => void;
}

const BGM_SCENE_ITEMS: readonly {
  key: keyof BgmSceneConfig;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}[] = [
  {
    key: 'freePlay',
    label: 'Free Play',
    description: 'Play background music during Free Play driving and menu navigation',
    icon: Gamepad2,
  },
  {
    key: 'singlePlayerTraining',
    label: 'Single Player Training',
    description: 'Play background music during Kickoff Training and Custom Training Packs',
    icon: Target,
  },
  {
    key: 'multiplayerTraining',
    label: 'Multiplayer Training',
    description: 'Play background music during Online Warmup and multiplayer training sessions',
    icon: Users,
  },
  {
    key: 'match',
    label: 'Match',
    description: 'Play background music during Exhibition, Bot Matches, and Online Matches',
    icon: Trophy,
  },
];

/**
 * [Layer 2 Settings -> Audio Tab]
 * Streamlined User & Developer unified Audio settings:
 * 1. `Mute When Unfocused` (`app-window-mac`, default active = true)
 * 2. `Background Music` (`eighth-notes`, `More` disclosure + `Upload Folder` button + toggle switch on the right)
 * 3. `Master Volume` (`volume-2`, read-only value readout + draggable slider)
 * 4. `Engine Volume` (`engine`, read-only value readout + draggable slider)
 * 5. `Boost Volume` (Noun Project `4873540` Jet Thrust SVG, read-only value readout + draggable slider)
 * 6. `Background Music Volume` (`eighth-notes`, adjustable when Background Music is enabled, locked when disabled)
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
  bgmVolume: propBgmVolume,
  defaultBgmVolume,
  onBgmVolumeChange,
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
    ...(defaultBgmVolume !== undefined ? { bgmVolume: defaultBgmVolume } : {}),
  }));

  const resolvedConfig: AudioConfig = {
    ...internalConfig,
    ...controlledCfg,
    ...(propMuteWhenUnfocused !== undefined ? { muteWhenUnfocused: propMuteWhenUnfocused } : {}),
    ...(propMasterVolume !== undefined ? { masterVolume: propMasterVolume } : {}),
    ...(propEngineVolume !== undefined ? { engineVolume: propEngineVolume } : {}),
    ...(propBoostVolume !== undefined ? { boostVolume: propBoostVolume } : {}),
    ...(propBgmVolume !== undefined ? { bgmVolume: propBgmVolume } : {}),
  };

  const muteWhenUnfocused = resolvedConfig.muteWhenUnfocused ?? true;
  const masterVolume = resolvedConfig.masterVolume;
  const engineVolume = resolvedConfig.engineVolume;
  const boostVolume = resolvedConfig.boostVolume;

  const storeBgmEnabled = useSpatialAudioStore((s) => s.bgmEnabled);
  const setStoreBgmEnabled = useSpatialAudioStore((s) => s.setBgmEnabled);
  const storeBgmVolume = useSpatialAudioStore((s) => s.bgmVolume);
  const setStoreBgmVolume = useSpatialAudioStore((s) => s.setBgmVolume);
  const bgmScenes = useSpatialAudioStore((s) => s.bgmScenes);
  const setBgmSceneEnabled = useSpatialAudioStore((s) => s.setBgmSceneEnabled);
  const uploadStoreBgmFiles = useSpatialAudioStore((s) => s.uploadBgmFiles);
  const bgmTracksCount = useSpatialAudioStore((s) => s.bgmTracks.length);
  const bgmCurrentTrackTitle = useSpatialAudioStore((s) => s.bgmCurrentTrackTitle);
  const bgmFadeDurationSec = useSpatialAudioStore(
    (s) => s.tunerConfig?.bgmFadeDurationSec ?? 2.0
  );
  const updateTunerConfig = useSpatialAudioStore((s) => s.updateTunerConfig);

  const bgmEnabled = propBgmEnabled ?? storeBgmEnabled;
  const bgmVolume = propBgmVolume ?? storeBgmVolume ?? resolvedConfig.bgmVolume ?? 80;

  const [isBgmMoreExpanded, setIsBgmMoreExpanded] = useState(false);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleBgm = (next: boolean) => {
    setStoreBgmEnabled(next);
    onBgmEnabledChange?.(next);
  };

  const handleBgmVolumeChange = (next: number) => {
    setStoreBgmVolume(next);
    onBgmVolumeChange?.(next);
    updateAudioField('bgmVolume', next);
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

  const {
    rowGap,
    borderRadius,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
  } = useSettingActionRowStore();

  const moreDisclosureButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setIsBgmMoreExpanded((prev) => !prev);
      }}
      className={`inline-flex items-center gap-0.5 text-xs font-medium cursor-pointer transition-colors select-none py-0.5 px-1 rounded ${
        isLight
          ? 'text-neutral-500 hover:text-neutral-900'
          : 'text-neutral-400 hover:text-neutral-100'
      }`}
      title={
        isBgmMoreExpanded
          ? 'Collapse background music playback scenes & fade settings'
          : 'Expand background music playback scenes & fade settings'
      }
    >
      <span className="underline underline-offset-3 decoration-current/60">
        More
      </span>
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform duration-200 ${
          isBgmMoreExpanded ? 'rotate-180' : ''
        }`}
      />
    </button>
  );

  const uploadFolderButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        folderInputRef.current?.click();
      }}
      style={{
        fontSize: `${buttonFontSize}px`,
        padding: `${buttonPaddingY}px ${buttonPaddingX}px`,
        borderRadius: `${buttonRadius}px`,
      }}
      className={`font-semibold transition-all duration-150 shrink-0 cursor-pointer border active:scale-[0.98] ${
        isLight
          ? 'bg-neutral-200/60 group-hover:bg-neutral-200/95 hover:!bg-neutral-300/90 border-neutral-300/80 text-neutral-800'
          : 'bg-white/[0.06] group-hover:bg-white/[0.11] hover:!bg-white/[0.16] border-white/[0.10] group-hover:border-white/[0.16] text-neutral-200'
      }`}
      title="Upload a folder of audio files for Background Music"
    >
      {bgmTracksCount > 0 ? 'Change Folder' : 'Upload Folder'}
    </button>
  );

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

      <div
        data-ui-element="compound-bgm-config-card"
        className="flex flex-col w-full"
        style={{ gap: `${rowGap}px` }}
      >
        <SettingToggleRow
          icon={EighthNotes}
          iconName="eighth-notes"
          label="Background Music"
          subtitle={
            bgmTracksCount > 0
              ? bgmCurrentTrackTitle
                ? `${bgmTracksCount} tracks loaded · Playing: ${bgmCurrentTrackTitle}`
                : `${bgmTracksCount} tracks loaded in current session`
              : 'Upload a local audio folder for soundtrack playback (supports hardware media keys)'
          }
          checked={bgmEnabled}
          onChange={handleToggleBgm}
          extraRightSlot={
            <div className="flex items-center gap-2.5">
              {moreDisclosureButton}
              {uploadFolderButton}
            </div>
          }
          hoverDescription="Background Music: Enable custom background soundtrack playback with smooth fade-in/fade-out and MediaSession shortcut support. Click More to choose active scenes and adjust fade-in/fade-out duration (up to 3.0s), or Upload Folder to load local audio files."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
        />

        {isBgmMoreExpanded && (
          <div
            style={{
              borderRadius: `${Math.max(6, borderRadius)}px`,
              gap: `${rowGap}px`,
            }}
            className={`mt-1 p-1.5 border flex flex-col w-full transition-all ${
              isLight
                ? 'bg-neutral-100/75 border-neutral-200/90'
                : 'bg-neutral-900/55 border-neutral-800/90'
            }`}
          >
            {BGM_SCENE_ITEMS.map((item) => {
              const isSceneChecked = Boolean(bgmScenes[item.key]);
              return (
                <SettingActionRow
                  key={item.key}
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                  bordered={false}
                  onAction={() => setBgmSceneEnabled(item.key, !isSceneChecked)}
                  hoverDescription={`${item.label}: ${item.description}.`}
                  onHover={(desc) => desc && onHover(desc)}
                  onLeave={onLeave}
                  isLight={isLight}
                  rightSlot={
                    <Checkbox
                      checked={isSceneChecked}
                      onCheckedChange={(checked) => setBgmSceneEnabled(item.key, checked)}
                      variant="neutral"
                      isLight={isLight}
                    />
                  }
                />
              );
            })}

            <SettingSliderRow
              icon={Timer}
              label="Fade-In / Fade-Out Duration"
              description="Smooth volume ramp duration when enabling, disabling, playing, or pausing Background Music (0.1s – 3.0s)"
              value={bgmFadeDurationSec}
              min={0.1}
              max={3.0}
              step={0.1}
              unit="s"
              bordered={false}
              developerMode={developerMode}
              onChange={(next) =>
                updateTunerConfig({
                  bgmFadeDurationSec: Math.max(0.1, Math.min(3.0, Number(next) || 2.0)),
                })
              }
              hoverDescription="Adjust the smooth fade-in and fade-out duration (0.1s to 3.0s, synced with Spatial Audio & Anthem Tuner) when playing, pausing, or toggling Background Music."
              onHover={(desc) => desc && onHover(desc)}
              onLeave={onLeave}
              isLight={isLight}
            />
          </div>
        )}
      </div>

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

      <SettingSliderRow
        icon={EighthNotes}
        iconName="eighth-notes"
        label="Background Music Volume"
        description="Soundtrack playback volume level (locked while Background Music is disabled)"
        value={bgmVolume}
        min={0}
        max={100}
        step={1}
        unit="%"
        disabled={!bgmEnabled}
        developerMode={developerMode}
        onChange={handleBgmVolumeChange}
        hoverDescription="Adjust Background Music volume level. Available when Background Music is enabled; temporarily locked when disabled."
        onHover={(desc) => desc && onHover(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />
    </div>
  );
};
