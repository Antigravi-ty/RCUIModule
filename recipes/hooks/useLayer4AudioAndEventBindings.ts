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
} from '../../config/audioConfig';
import type { EventCatalogEntry } from '../../compounds/tuner/EventFilterMatrix';

export interface Layer4AdvancedAudioRecipeProps {
  isLight?: boolean;
  detailVolumes?: Record<string, number>;
  defaultDetailVolumes?: Record<string, number>;
  onDetailVolumeChange?: (key: string, volumePct: number) => void;
  onResetDetailVolumes?: () => void;
  onPreviewDetail?: (key: string) => void;
  onStopPreview?: () => void;
  onCopyJson?: () => { ok: boolean; bytes: number; count: number } | void;
  onExportJson?: () => { ok: boolean; bytes: number; count: number } | void;
  onBack?: () => void;
  className?: string;
}

export interface EventTriggerRule {
  id: string;
  name: string;
  conditionType: 'ball-speed' | 'boost-below' | 'car-air-time' | 'touch-count';
  range: [number, number];
  unit: string;
  minLimit: number;
  maxLimit: number;
  actionType: 'reset-shot' | 'award-goal' | 'slow-motion' | 'flash-hud';
  enabled: boolean;
}

export interface Layer4EventTriggerRulesRecipeProps {
  isLight?: boolean;
  defaultRules?: EventTriggerRule[];
  onChange?: (rules: EventTriggerRule[]) => void;
  eventCatalogItems?: EventCatalogEntry[];
  hitCooldownMs?: number;
  onHitCooldownMsChange?: (val: number) => void;
  scrapeCooldownMs?: number;
  onScrapeCooldownMsChange?: (val: number) => void;
  supersonicHoldMs?: number;
  onSupersonicHoldMsChange?: (val: number) => void;
  lightTouchImpulse?: number;
  onLightTouchImpulseChange?: (val: number) => void;
  mediumHitImpulse?: number;
  onMediumHitImpulseChange?: (val: number) => void;
  heavyBoomImpulse?: number;
  onHeavyBoomImpulseChange?: (val: number) => void;
  rimClankGate?: number;
  onRimClankGateChange?: (val: number) => void;
  carBumpGate?: number;
  onCarBumpGateChange?: (val: number) => void;
  enableConsoleLog?: boolean;
  onEnableConsoleLogChange?: (val: boolean) => void;
  logHitStructsOnly?: boolean;
  onLogHitStructsOnlyChange?: (val: boolean) => void;
  selectedEvents?: Record<string, boolean>;
  onToggleEventHex?: (hex: string) => void;
  onSelectAllEvents?: () => void;
  onDeselectAllEvents?: () => void;
  onBack?: () => void;
  className?: string;
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

export function useLayer4AdvancedAudioStoreBinding(
  rawProps: Layer4AdvancedAudioRecipeProps
): Layer4AdvancedAudioRecipeProps {
  const goBack = useAppStore((s) => s.goBack);

  const [detailVolumes, setDetailVolumes] = useState<Record<string, number>>(
    () => rawProps.defaultDetailVolumes ?? readDetailVolumesFromConfig()
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
    onBack: rawProps.onBack ?? goBack,
    detailVolumes:
      rawProps.detailVolumes ??
      (rawProps.defaultDetailVolumes ? undefined : detailVolumes),
    onDetailVolumeChange: rawProps.onDetailVolumeChange ?? handleDetailVolumeChange,
    onResetDetailVolumes: rawProps.onResetDetailVolumes ?? handleResetDetailVolumes,
    onPreviewDetail: rawProps.onPreviewDetail ?? handlePreviewDetail,
    onStopPreview: rawProps.onStopPreview ?? handleStopPreview,
    onCopyJson: rawProps.onCopyJson ?? handleCopyJson,
    onExportJson: rawProps.onExportJson ?? handleExportJson,
  };
}

export function useLayer4EventTriggerRulesStoreBinding(
  rawProps: Layer4EventTriggerRulesRecipeProps
): Layer4EventTriggerRulesRecipeProps {
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
    onBack: rawProps.onBack ?? goBack,
    eventCatalogItems: rawProps.eventCatalogItems ?? EVENT_CATALOG_ITEMS,
    hitCooldownMs: rawProps.hitCooldownMs ?? hitCooldownMs,
    onHitCooldownMsChange:
      rawProps.onHitCooldownMsChange ??
      ((val: number) => {
        setHitCooldownMs(val);
        audioConfig.set('carBallHitCooldownMs', val);
      }),
    scrapeCooldownMs: rawProps.scrapeCooldownMs ?? scrapeCooldownMs,
    onScrapeCooldownMsChange:
      rawProps.onScrapeCooldownMsChange ??
      ((val: number) => {
        setScrapeCooldownMs(val);
        audioConfig.set('goalpostHitCooldownMs', val);
      }),
    supersonicHoldMs: rawProps.supersonicHoldMs ?? supersonicHoldMs,
    onSupersonicHoldMsChange:
      rawProps.onSupersonicHoldMsChange ??
      ((val: number) => {
        setSupersonicHoldMs(val);
        audioConfig.set('incidentCooldownMs', val);
      }),
    lightTouchImpulse: rawProps.lightTouchImpulse ?? lightTouchImpulse,
    onLightTouchImpulseChange:
      rawProps.onLightTouchImpulseChange ??
      ((val: number) => {
        setLightTouchImpulse(val);
        audioConfig.set('carBallHitImpulseThreshold', val);
      }),
    mediumHitImpulse: rawProps.mediumHitImpulse ?? mediumHitImpulse,
    onMediumHitImpulseChange:
      rawProps.onMediumHitImpulseChange ??
      ((val: number) => {
        setMediumHitImpulse(val);
        audioConfig.set('ballGroundHitThreshold', val);
      }),
    heavyBoomImpulse: rawProps.heavyBoomImpulse ?? heavyBoomImpulse,
    onHeavyBoomImpulseChange:
      rawProps.onHeavyBoomImpulseChange ??
      ((val: number) => {
        setHeavyBoomImpulse(val);
        audioConfig.set('ballWallHitThreshold', val);
      }),
    rimClankGate: rawProps.rimClankGate ?? rimClankGate,
    onRimClankGateChange:
      rawProps.onRimClankGateChange ??
      ((val: number) => {
        setRimClankGate(val);
        audioConfig.set('goalpostHitThreshold', val);
      }),
    carBumpGate: rawProps.carBumpGate ?? carBumpGate,
    onCarBumpGateChange:
      rawProps.onCarBumpGateChange ??
      ((val: number) => {
        setCarBumpGate(val);
        audioConfig.set('netDualTriggerAngleDeg', val);
      }),
    enableConsoleLog: rawProps.enableConsoleLog ?? enableConsoleLog,
    onEnableConsoleLogChange:
      rawProps.onEnableConsoleLogChange ??
      ((val: boolean) => {
        setEnableConsoleLog(val);
        audioConfig.set('logAllEvents', val);
      }),
    logHitStructsOnly: rawProps.logHitStructsOnly ?? logHitStructsOnly,
    onLogHitStructsOnlyChange:
      rawProps.onLogHitStructsOnlyChange ??
      ((val: boolean) => {
        setLogHitStructsOnly(val);
        audioConfig.set('logCarBallHitEvents', val);
      }),
    selectedEvents: rawProps.selectedEvents ?? selectedEvents,
    onToggleEventHex: rawProps.onToggleEventHex ?? handleToggleEventHex,
    onSelectAllEvents: rawProps.onSelectAllEvents ?? handleSelectAllEvents,
    onDeselectAllEvents: rawProps.onDeselectAllEvents ?? handleDeselectAllEvents,
  };
}
