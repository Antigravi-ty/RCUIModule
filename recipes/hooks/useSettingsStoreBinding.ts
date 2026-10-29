import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useUIStore } from '../../stores/uiStore';
import { calculateSettingsSafeScale } from '../../config/uiConfig';
import {
  getBallVisualConfig,
  updateBallVisualConfig,
} from '../../config/ballVisualConfig.js';
import type {
  Layer2SettingsRecipeProps,
  BallOpacityMode,
} from '../Layer2SettingsRecipe';

export function useLayer2SettingsStoreBinding(
  props: Layer2SettingsRecipeProps
): Layer2SettingsRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);

  const developerMode = useAppStore((s) => s.developerMode);
  const setDeveloperMode = useAppStore((s) => s.setDeveloperMode);

  const storeTheme = useAppStore((s) => s.theme);
  const setStoreTheme = useAppStore((s) => s.setTheme);

  const gameplay = useAppStore((s) => s.gameplay);
  const updateGameplay = useAppStore((s) => s.updateGameplay);

  const storeTrajectory = useAppStore((s) => s.trajectory);
  const updateStoreTrajectory = useAppStore((s) => s.updateTrajectory);

  const audio = useAppStore((s) => s.audio);
  const updateAudio = useAppStore((s) => s.updateAudio);

  const storeGraphics = useAppStore((s) => s.graphics);
  const updateStoreGraphics = useAppStore((s) => s.updateGraphics);
  const renderScale = useAppStore((s) => s.renderScale);
  const setRenderScale = useAppStore((s) => s.setRenderScale);

  const storeTelemetry = useAppStore((s) => s.telemetry);
  const updateStoreTelemetry = useAppStore((s) => s.updateTelemetry);

  const clockPacingPriority = useAppStore((s) => s.clockPacingPriority);
  const setClockPacingPriority = useAppStore((s) => s.setClockPacingPriority);
  const inputBufferTarget = useAppStore((s) => s.inputBufferTarget);
  const setInputBufferTarget = useAppStore((s) => s.setInputBufferTarget);
  const inputBufferThreshold = useAppStore((s) => s.inputBufferThreshold);
  const setInputBufferThreshold = useAppStore((s) => s.setInputBufferThreshold);

  const storeHighlightSetting = useAppStore((s) => s.highlightSetting);
  const clearHighlightSetting = useAppStore((s) => s.clearHighlightSetting);

  const uiScale = useUIStore((s) => s.uiScale ?? 100);
  const setUiScale = useUIStore((s) => s.setUiScale);
  const safeAreaMargin = useUIStore((s) => s.safeAreaMargin ?? 0);
  const setSafeAreaMargin = useUIStore((s) => s.setSafeAreaMargin);
  const showSafeAreaHud = useUIStore((s) => s.showSafeAreaHud);
  const setShowSafeAreaHud = useUIStore((s) => s.setShowSafeAreaHud);

  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxSafeScale = calculateSettingsSafeScale(
    windowDimensions.width,
    windowDimensions.height,
    safeAreaMargin
  );

  const menuPowerSaveForTab =
    storeGraphics.menuPowerSave === 'freeze'
      ? 'extreme'
      : storeGraphics.menuPowerSave === 'match'
      ? 'disable'
      : storeGraphics.menuPowerSave;

  const [ballOpacityMode, setBallOpacityMode] = useState<BallOpacityMode>(() => {
    const op = getBallVisualConfig()?.opacity ?? 1.0;
    const pct = Math.round(op * 100);
    return pct === 100 ? '100' : pct === 70 ? '70' : 'custom';
  });

  const handleBallOpacityModeChange = (next: BallOpacityMode) => {
    setBallOpacityMode(next);
    if (next === '100' || next === 'solid') {
      updateBallVisualConfig({ opacity: 1.0 });
    } else if (next === '70' || next === 'ghost') {
      updateBallVisualConfig({ opacity: 0.7 });
    } else if (next === 'hidden') {
      updateBallVisualConfig({ opacity: 0.05 });
    }
  };

  return {
    ...props,
    onBack: props.onBack ?? goBack,
    developerMode: props.developerMode ?? developerMode,
    onDeveloperModeChange: props.onDeveloperModeChange ?? setDeveloperMode,
    highlightSetting: props.highlightSetting ?? storeHighlightSetting,
    onClearHighlight: props.onClearHighlight ?? clearHighlightSetting,
    gameplayConfig: props.gameplayConfig ?? gameplay,
    onGameplayConfigChange:
      props.onGameplayConfigChange ?? ((_next, patch) => updateGameplay(patch)),
    ballCamIndicator: props.ballCamIndicator ?? gameplay.ballCamIndicator,
    onBallCamIndicatorChange:
      props.onBallCamIndicatorChange ??
      ((enabled) => updateGameplay({ ballCamIndicator: enabled })),
    trajectoryEnabled: props.trajectoryEnabled ?? storeTrajectory.enabled,
    onTrajectoryEnabledChange:
      props.onTrajectoryEnabledChange ??
      ((enabled) => updateStoreTrajectory({ enabled })),
    clockPacingPriority:
      props.clockPacingPriority ?? (clockPacingPriority as any),
    onClockPacingPriorityChange:
      props.onClockPacingPriorityChange ??
      ((prio) => setClockPacingPriority(prio as any)),
    onNavigateTrainingDetail:
      props.onNavigateTrainingDetail ?? (() => navigate('training')),
    onNavigateKeybindingsDetail:
      props.onNavigateKeybindingsDetail ?? (() => navigate('keybindings')),
    onNavigateTrajectoryDetail:
      props.onNavigateTrajectoryDetail ?? (() => navigate('trajectory')),
    onNavigateCameraDetail:
      props.onNavigateCameraDetail ?? (() => navigate('camera')),
    audioConfig: props.audioConfig ?? {
      masterVolume: audio.masterVolume,
      engineVolume: audio.engineVolume,
      boostVolume: audio.boostVolume,
      muteWhenUnfocused: !audio.continueAudioOnLostFocus,
      bassGain: audio.bassGain,
      midGain: audio.midGain,
      trebleGain: audio.trebleGain,
      hrtfEnabled: audio.hrtfEnabled,
    },
    onAudioConfigChange:
      props.onAudioConfigChange ??
      ((_next, patch) => {
        const mapped: Record<string, unknown> = { ...patch };
        if (patch.muteWhenUnfocused !== undefined) {
          mapped.continueAudioOnLostFocus = !patch.muteWhenUnfocused;
          delete mapped.muteWhenUnfocused;
        }
        updateAudio(mapped as any);
      }),
    muteWhenUnfocused: props.muteWhenUnfocused ?? !audio.continueAudioOnLostFocus,
    onMuteWhenUnfocusedChange:
      props.onMuteWhenUnfocusedChange ??
      ((muted) => updateAudio({ continueAudioOnLostFocus: !muted })),
    masterVolume: props.masterVolume ?? audio.masterVolume,
    onMasterVolumeChange:
      props.onMasterVolumeChange ??
      ((masterVolume) => updateAudio({ masterVolume })),
    engineVolume: props.engineVolume ?? audio.engineVolume,
    onEngineVolumeChange:
      props.onEngineVolumeChange ??
      ((engineVolume) => updateAudio({ engineVolume })),
    boostVolume: props.boostVolume ?? audio.boostVolume,
    onBoostVolumeChange:
      props.onBoostVolumeChange ??
      ((boostVolume) => updateAudio({ boostVolume })),
    onNavigateAudioDetail:
      props.onNavigateAudioDetail ?? (() => navigate('audio-eq')),
    theme: props.theme ?? storeTheme,
    onThemeChange: props.onThemeChange ?? setStoreTheme,
    uiScale: props.uiScale ?? uiScale,
    onUiScaleChange: props.onUiScaleChange ?? setUiScale,
    maxSafeScale: props.maxSafeScale ?? maxSafeScale,
    safeAreaMargin: props.safeAreaMargin ?? safeAreaMargin,
    onSafeAreaMarginChange: props.onSafeAreaMarginChange ?? setSafeAreaMargin,
    limitFps: props.limitFps ?? storeGraphics.limitFps,
    onLimitFpsChange:
      props.onLimitFpsChange ??
      ((limitFps) => updateStoreGraphics({ limitFps })),
    maxFps: props.maxFps ?? storeGraphics.maxFps,
    onMaxFpsChange:
      props.onMaxFpsChange ?? ((maxFps) => updateStoreGraphics({ maxFps })),
    renderScale: props.renderScale ?? renderScale,
    onRenderScaleChange:
      props.onRenderScaleChange ??
      ((scale) => {
        setRenderScale(scale);
        updateStoreGraphics({ renderScale: scale });
      }),
    menuPowerSave: props.menuPowerSave ?? menuPowerSaveForTab,
    onMenuPowerSaveChange:
      props.onMenuPowerSaveChange ??
      ((mode) => {
        const mapped =
          mode === 'extreme' || mode === 'freeze'
            ? 'freeze'
            : mode === 'disable' || mode === 'match'
            ? 'match'
            : mode;
        updateStoreGraphics({ menuPowerSave: mapped });
      }),
    inputBufferTarget: props.inputBufferTarget ?? inputBufferTarget,
    onInputBufferTargetChange:
      props.onInputBufferTargetChange ?? setInputBufferTarget,
    inputBufferThreshold: props.inputBufferThreshold ?? inputBufferThreshold,
    onInputBufferThresholdChange:
      props.onInputBufferThresholdChange ?? setInputBufferThreshold,
    telemetryConfig: props.telemetryConfig ?? (storeTelemetry as any),
    onTelemetryConfigChange:
      props.onTelemetryConfigChange ??
      ((_next, patch) => updateStoreTelemetry(patch as any)),
    ballOpacityMode: props.ballOpacityMode ?? ballOpacityMode,
    onBallOpacityModeChange:
      props.onBallOpacityModeChange ?? handleBallOpacityModeChange,
    observeSafeAreaBoundary: props.observeSafeAreaBoundary ?? showSafeAreaHud,
    onObserveSafeAreaBoundaryChange:
      props.onObserveSafeAreaBoundaryChange ?? setShowSafeAreaHud,
    onNavigateAdvancedAudio:
      props.onNavigateAdvancedAudio ?? (() => navigate('advanced-audio')),
    onNavigateEventAndTriggerer:
      props.onNavigateEventAndTriggerer ??
      (() => navigate('event-and-triggerer')),
    onNavigateExpMultiBots:
      props.onNavigateExpMultiBots ??
      (() => navigate('exp-multi-bots-config')),
    onNavigateDevSandboxes:
      props.onNavigateDevSandboxes ?? (() => navigate('dev-sandboxes')),
    onNavigateDevActiveTuners:
      props.onNavigateDevActiveTuners ?? (() => navigate('dev-active-tuners')),
    onNavigateDevCalibratedPresets:
      props.onNavigateDevCalibratedPresets ??
      (() => navigate('dev-calibrated-presets')),
    onNavigateDevUnderDevelopment:
      props.onNavigateDevUnderDevelopment ??
      (() => navigate('dev-under-development')),
  };
}
