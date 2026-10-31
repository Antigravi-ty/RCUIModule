import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  audioConfig,
  ADVANCED_AUDIO_DETAIL_CATALOG,
  exportAudioSettingsJson,
  resetAllAudioDetailVolumes,
  previewAudioDetailItem,
  stopAudioDetailPreview,
  CONSOLE_LOG_EVENT_CATALOG,
  selectAllEventLogs,
  deselectAllEventLogs,
  setEventLogFilterItem,
  createDefaultLogEventFilter,
} from '../../config/audioConfig.js';
import {
  loadInputBindings,
  saveInputBindings,
  resetAxisBindings,
  getSelectedController,
  setSelectedController,
  getConnectedGamepads,
} from '../../config/InputBindings.js';
import type { EventCatalogEntry } from '../../compounds/tuner/EventFilterMatrix';

export interface ControllerAxesConfig {
  steer: { axis: number; invert: boolean };
  pitch: { axis: number; invert: boolean };
  deadzone: number;
  triggerThreshold: number;
}

const EVENT_CATALOG_ITEMS: EventCatalogEntry[] = CONSOLE_LOG_EVENT_CATALOG.map(
  (item) => ({
    hex: item.hex,
    id: item.id,
    name: item.name,
  })
);

function readDetailVolumesFromConfig(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of ADVANCED_AUDIO_DETAIL_CATALOG) {
    const raw = audioConfig.get(item.key);
    const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : 1.0;
    map[item.key] = Math.max(0, Math.min(500, Math.round(val * 100)));
  }
  return map;
}

export function useLayer4AdvancedAudioStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);

  const [detailVolumes, setDetailVolumes] = useState<Record<string, number>>(
    () => props.defaultDetailVolumes ?? readDetailVolumesFromConfig()
  );

  useEffect(() => {
    const sync = () => {
      setDetailVolumes(readDetailVolumesFromConfig());
    };
    const unsub = audioConfig.subscribe(sync);
    return () => {
      unsub();
    };
  }, []);

  const handleDetailVolumeChange = (key: string, percentVal: number) => {
    const clampedPct = Math.max(0, Math.min(500, Math.round(Number(percentVal) || 0)));
    setDetailVolumes((prev) => ({ ...prev, [key]: clampedPct }));
    audioConfig.set(key, clampedPct / 100);
  };

  const handleResetDetailVolumes = () => {
    resetAllAudioDetailVolumes();
    setDetailVolumes(readDetailVolumesFromConfig());
  };

  const handlePreviewDetail = (key: string) => {
    previewAudioDetailItem(key);
  };

  const handleStopPreview = () => {
    stopAudioDetailPreview();
  };

  const handleCopyJson = (): { ok: boolean; bytes: number; count: number } => {
    try {
      const json = exportAudioSettingsJson();
      const bytes = typeof Blob !== 'undefined' ? new Blob([json]).size : json.length;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
      return {
        ok: true,
        bytes,
        count: ADVANCED_AUDIO_DETAIL_CATALOG.length,
      };
    } catch {
      return { ok: false, bytes: 0, count: ADVANCED_AUDIO_DETAIL_CATALOG.length };
    }
  };

  const handleExportJson = (): { ok: boolean; bytes: number; count: number } => {
    try {
      const json = exportAudioSettingsJson();
      const bytes = typeof Blob !== 'undefined' ? new Blob([json]).size : json.length;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(json).catch(() => {});
      }
      if (typeof document !== 'undefined' && typeof URL !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audioConfig.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      return {
        ok: true,
        bytes,
        count: ADVANCED_AUDIO_DETAIL_CATALOG.length,
      };
    } catch {
      return { ok: false, bytes: 0, count: ADVANCED_AUDIO_DETAIL_CATALOG.length };
    }
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    detailVolumes:
      props.detailVolumes ??
      (props.defaultDetailVolumes ? undefined : detailVolumes),
    onDetailVolumeChange: props.onDetailVolumeChange ?? handleDetailVolumeChange,
    onResetDetailVolumes: props.onResetDetailVolumes ?? handleResetDetailVolumes,
    onPreviewDetail: props.onPreviewDetail ?? handlePreviewDetail,
    onStopPreview: props.onStopPreview ?? handleStopPreview,
    onCopyJson: props.onCopyJson ?? handleCopyJson,
    onExportJson: props.onExportJson ?? handleExportJson,
  } as TProps;
}

export function useLayer4ControllerSettingsStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const bridge = useAppStore((s) => s.bridge);
  const [bindings, setBindings] = useState(() => {
    try {
      return loadInputBindings();
    } catch {
      return {
        axes: {
          steer: { axis: 0, invert: false },
          pitch: { axis: 1, invert: false },
          deadzone: 0.12,
          triggerThreshold: 0.15,
        },
      };
    }
  });

  const [inputDevice, setInputDevice] = useState<string>(() => {
    try {
      const sel = getSelectedController();
      if (sel && sel.index !== null && sel.index !== undefined) {
        return `pad-${sel.index}`;
      }
    } catch {
      // ignore
    }
    return 'none';
  });

  const handleConfigChange = (nextConfig: ControllerAxesConfig) => {
    const nextBindings = {
      ...bindings,
      axes: {
        ...bindings.axes,
        steer: { ...nextConfig.steer },
        pitch: { ...nextConfig.pitch },
        deadzone: nextConfig.deadzone,
        triggerThreshold: nextConfig.triggerThreshold,
      },
    };
    setBindings(nextBindings);
    saveInputBindings(nextBindings);
    bridge.onBindingsChange?.(nextBindings);
  };

  const handleReset = () => {
    const nextBindings = { ...bindings };
    resetAxisBindings(nextBindings);
    setBindings(nextBindings);
    saveInputBindings(nextBindings);
    bridge.onBindingsChange?.(nextBindings);
  };

  const handleInputDeviceChange = (deviceId: string) => {
    setInputDevice(deviceId);
    if (deviceId === 'none' || !deviceId.startsWith('pad-')) {
      setSelectedController(null);
      return;
    }
    const padIdx = parseInt(deviceId.replace('pad-', ''), 10);
    const pads = getConnectedGamepads().filter((p) => p && p.connected);
    const pad = pads.find((p) => p && p.index === padIdx);
    if (pad) {
      setSelectedController({ id: pad.id, index: pad.index });
    }
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    config:
      props.config ??
      props.settings ??
      (props.defaultConfig ? undefined : bindings.axes),
    onChange: props.onChange ?? handleConfigChange,
    onReset: props.onReset ?? handleReset,
    inputDevice: props.inputDevice ?? inputDevice,
    onInputDeviceChange: props.onInputDeviceChange ?? handleInputDeviceChange,
  } as TProps;
}

export function useLayer4EventTriggerRulesStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const [hitCooldownMs, setHitCooldownMs] = useState<number>(
    () => Number(audioConfig.get('carBallHitCooldownMs') ?? 40)
  );
  const [scrapeCooldownMs, setScrapeCooldownMs] = useState<number>(
    () => Number(audioConfig.get('goalpostHitCooldownMs') ?? 60)
  );
  const [supersonicHoldMs, setSupersonicHoldMs] = useState<number>(
    () => Number(audioConfig.get('incidentCooldownMs') ?? 40)
  );
  const [lightTouchImpulse, setLightTouchImpulse] = useState<number>(
    () => Number(audioConfig.get('carBallHitImpulseThreshold') ?? 120)
  );
  const [mediumHitImpulse, setMediumHitImpulse] = useState<number>(
    () => Number(audioConfig.get('ballGroundHitThreshold') ?? 140)
  );
  const [heavyBoomImpulse, setHeavyBoomImpulse] = useState<number>(
    () => Number(audioConfig.get('ballWallHitThreshold') ?? 160)
  );
  const [rimClankGate, setRimClankGate] = useState<number>(
    () => Number(audioConfig.get('goalpostHitThreshold') ?? 120)
  );
  const [carBumpGate, setCarBumpGate] = useState<number>(
    () => Number(audioConfig.get('netDualTriggerAngleDeg') ?? 60)
  );
  const [enableConsoleLog, setEnableConsoleLog] = useState<boolean>(
    () => Boolean(audioConfig.get('logAllEvents'))
  );
  const [logHitStructsOnly, setLogHitStructsOnly] = useState<boolean>(
    () => Boolean(audioConfig.get('logCarBallHitEvents'))
  );
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>(
    () => ({
      ...(audioConfig.config?.logEventFilter || createDefaultLogEventFilter()),
    })
  );

  useEffect(() => {
    const handleSync = () => {
      setHitCooldownMs(Number(audioConfig.get('carBallHitCooldownMs') ?? 40));
      setScrapeCooldownMs(
        Number(audioConfig.get('goalpostHitCooldownMs') ?? 60)
      );
      setSupersonicHoldMs(Number(audioConfig.get('incidentCooldownMs') ?? 40));
      setLightTouchImpulse(
        Number(audioConfig.get('carBallHitImpulseThreshold') ?? 120)
      );
      setMediumHitImpulse(
        Number(audioConfig.get('ballGroundHitThreshold') ?? 140)
      );
      setHeavyBoomImpulse(
        Number(audioConfig.get('ballWallHitThreshold') ?? 160)
      );
      setRimClankGate(Number(audioConfig.get('goalpostHitThreshold') ?? 120));
      setCarBumpGate(Number(audioConfig.get('netDualTriggerAngleDeg') ?? 60));
      setEnableConsoleLog(Boolean(audioConfig.get('logAllEvents')));
      setLogHitStructsOnly(Boolean(audioConfig.get('logCarBallHitEvents')));
      setSelectedEvents({
        ...(audioConfig.config?.logEventFilter ||
          createDefaultLogEventFilter()),
      });
    };
    const unsub = audioConfig.subscribe(handleSync);
    return () => {
      unsub();
    };
  }, []);

  const handleToggleEventHex = (hex: string) => {
    const key = hex.toLowerCase();
    const nextVal = !Boolean(selectedEvents[key]);
    setEventLogFilterItem(key, nextVal);
    setSelectedEvents((prev) => ({ ...prev, [key]: nextVal }));
  };

  const handleSelectAllEvents = () => {
    selectAllEventLogs();
    const next: Record<string, boolean> = {};
    EVENT_CATALOG_ITEMS.forEach((i) => {
      next[i.hex.toLowerCase()] = true;
    });
    setEnableConsoleLog(true);
    setSelectedEvents(next);
  };

  const handleDeselectAllEvents = () => {
    deselectAllEventLogs();
    setEnableConsoleLog(false);
    setSelectedEvents({});
  };

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    eventCatalogItems: props.eventCatalogItems ?? EVENT_CATALOG_ITEMS,
    hitCooldownMs: props.hitCooldownMs ?? hitCooldownMs,
    onHitCooldownMsChange:
      props.onHitCooldownMsChange ??
      ((val: number) => {
        setHitCooldownMs(val);
        audioConfig.set('carBallHitCooldownMs', val);
      }),
    scrapeCooldownMs: props.scrapeCooldownMs ?? scrapeCooldownMs,
    onScrapeCooldownMsChange:
      props.onScrapeCooldownMsChange ??
      ((val: number) => {
        setScrapeCooldownMs(val);
        audioConfig.set('goalpostHitCooldownMs', val);
      }),
    supersonicHoldMs: props.supersonicHoldMs ?? supersonicHoldMs,
    onSupersonicHoldMsChange:
      props.onSupersonicHoldMsChange ??
      ((val: number) => {
        setSupersonicHoldMs(val);
        audioConfig.set('incidentCooldownMs', val);
      }),
    lightTouchImpulse: props.lightTouchImpulse ?? lightTouchImpulse,
    onLightTouchImpulseChange:
      props.onLightTouchImpulseChange ??
      ((val: number) => {
        setLightTouchImpulse(val);
        audioConfig.set('carBallHitImpulseThreshold', val);
      }),
    mediumHitImpulse: props.mediumHitImpulse ?? mediumHitImpulse,
    onMediumHitImpulseChange:
      props.onMediumHitImpulseChange ??
      ((val: number) => {
        setMediumHitImpulse(val);
        audioConfig.set('ballGroundHitThreshold', val);
      }),
    heavyBoomImpulse: props.heavyBoomImpulse ?? heavyBoomImpulse,
    onHeavyBoomImpulseChange:
      props.onHeavyBoomImpulseChange ??
      ((val: number) => {
        setHeavyBoomImpulse(val);
        audioConfig.set('ballWallHitThreshold', val);
      }),
    rimClankGate: props.rimClankGate ?? rimClankGate,
    onRimClankGateChange:
      props.onRimClankGateChange ??
      ((val: number) => {
        setRimClankGate(val);
        audioConfig.set('goalpostHitThreshold', val);
      }),
    carBumpGate: props.carBumpGate ?? carBumpGate,
    onCarBumpGateChange:
      props.onCarBumpGateChange ??
      ((val: number) => {
        setCarBumpGate(val);
        audioConfig.set('netDualTriggerAngleDeg', val);
      }),
    enableConsoleLog: props.enableConsoleLog ?? enableConsoleLog,
    onEnableConsoleLogChange:
      props.onEnableConsoleLogChange ??
      ((val: boolean) => {
        setEnableConsoleLog(val);
        audioConfig.set('logAllEvents', val);
      }),
    logHitStructsOnly: props.logHitStructsOnly ?? logHitStructsOnly,
    onLogHitStructsOnlyChange:
      props.onLogHitStructsOnlyChange ??
      ((val: boolean) => {
        setLogHitStructsOnly(val);
        audioConfig.set('logCarBallHitEvents', val);
      }),
    selectedEvents: props.selectedEvents ?? selectedEvents,
    onToggleEventHex: props.onToggleEventHex ?? handleToggleEventHex,
    onSelectAllEvents: props.onSelectAllEvents ?? handleSelectAllEvents,
    onDeselectAllEvents: props.onDeselectAllEvents ?? handleDeselectAllEvents,
  } as TProps;
}
