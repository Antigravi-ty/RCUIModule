import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import {
  audioConfig,
  DEFAULT_BOOST_VARIATION,
  exportAudioSettingsJson,
  setBoostStartVariation,
  setBoostLoopVariation,
  setBoostEndVariation,
  setAllBoostAudioVariations,
  previewBoostAudioVariation,
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
import {
  AUDIO_VOLUME_GROUPS,
  type Layer4AdvancedAudioRecipeProps,
} from '../Layer4AdvancedAudioRecipe';
import type {
  PhaseVariationSelection,
  VariationPhaseId,
} from '../../compounds/PhaseVariationMatrix';
import type {
  Layer4ControllerSettingsRecipeProps,
  ControllerAxesConfig,
} from '../Layer4ControllerSettingsRecipe';
import type { Layer4EventTriggerRulesRecipeProps } from '../Layer4EventTriggerRulesRecipe';
import type { EventCatalogEntry } from '../../compounds/tuner/EventFilterMatrix';

const GROUP_VOLUME_CONFIG_KEYS: Record<string, string[]> = {
  'vehicle-boost': [
    'engineVolume',
    'boostVolume',
    'vehicleSelfVolume',
    'jumpVolume',
    'doubleJumpVolume',
    'dodgeVolume',
    'supersonicVolume',
    'flipResetVolume',
    'boostCollectVolume',
  ],
  'ball-arena': [
    'ballCollisionVolume',
    'carBallHitVolume',
    'ballWorldHitVolume',
    'goalpostHitVolume',
    'ballRollingVolume',
    'ballFlyingVolume',
    'carCarCollisionVolume',
  ],
  'stingers-fanfare': [
    'goalScoredVolume',
    'endgameVolume',
    'countdown10sVolume',
  ],
  'ui-ambient': ['masterVolume'],
};

const EVENT_CATALOG_ITEMS: EventCatalogEntry[] = CONSOLE_LOG_EVENT_CATALOG.map(
  (item) => ({
    hex: item.hex,
    id: item.id,
    name: item.name,
  })
);

export function useLayer4AdvancedAudioStoreBinding(
  props: Layer4AdvancedAudioRecipeProps
): Layer4AdvancedAudioRecipeProps {
  const goBack = useAppStore((s) => s.goBack);
  const [boostSelection, setBoostSelection] = useState<PhaseVariationSelection>(
    () =>
      props.defaultBoostSelection ?? {
        start: String(
          audioConfig.get('boostStartVariation') || DEFAULT_BOOST_VARIATION
        ),
        loop: String(
          audioConfig.get('boostLoopVariation') || DEFAULT_BOOST_VARIATION
        ),
        end: String(
          audioConfig.get('boostEndVariation') || DEFAULT_BOOST_VARIATION
        ),
      }
  );

  const [groupVolumes, setGroupVolumes] = useState<Record<string, number>>(
    () => ({
      'vehicle-boost': Math.round(
        Number(audioConfig.get('boostVolume') ?? 1) * 100
      ),
      'ball-arena': Math.round(
        Number(audioConfig.get('ballCollisionVolume') ?? 1) * 100
      ),
      'stingers-fanfare': Math.round(
        Number(audioConfig.get('goalScoredVolume') ?? 1) * 100
      ),
      'ui-ambient': Math.round(
        Number(audioConfig.get('masterVolume') ?? 1) * 100
      ),
    })
  );

  useEffect(() => {
    const sync = () => {
      setBoostSelection({
        start: String(
          audioConfig.get('boostStartVariation') || DEFAULT_BOOST_VARIATION
        ),
        loop: String(
          audioConfig.get('boostLoopVariation') || DEFAULT_BOOST_VARIATION
        ),
        end: String(
          audioConfig.get('boostEndVariation') || DEFAULT_BOOST_VARIATION
        ),
      });
      setGroupVolumes({
        'vehicle-boost': Math.round(
          Number(audioConfig.get('boostVolume') ?? 1) * 100
        ),
        'ball-arena': Math.round(
          Number(audioConfig.get('ballCollisionVolume') ?? 1) * 100
        ),
        'stingers-fanfare': Math.round(
          Number(audioConfig.get('goalScoredVolume') ?? 1) * 100
        ),
        'ui-ambient': Math.round(
          Number(audioConfig.get('masterVolume') ?? 1) * 100
        ),
      });
    };
    const unsub = audioConfig.subscribe(sync);
    return () => {
      unsub();
    };
  }, []);

  const handleBoostPhaseChange = (
    variationId: string,
    phase: VariationPhaseId
  ) => {
    setBoostSelection((prev) => {
      const next = { ...prev, [phase]: variationId };
      if (next.start === next.loop && next.loop === next.end) {
        useAppStore
          .getState()
          .updateMaterials({
            boostAudio: variationId as
              | 'rush'
              | 'standard'
              | 'flamethrower'
              | 'plasma',
          });
      }
      return next;
    });
    if (phase === 'start') {
      setBoostStartVariation(variationId);
    } else if (phase === 'loop') {
      setBoostLoopVariation(variationId);
    } else {
      setBoostEndVariation(variationId);
    }
    previewBoostAudioVariation(variationId, phase);
  };

  const handleBoostAllChange = (variationId: string) => {
    setBoostSelection({
      start: variationId,
      loop: variationId,
      end: variationId,
    });
    setAllBoostAudioVariations(variationId);
    useAppStore
      .getState()
      .updateMaterials({
        boostAudio: variationId as
          | 'rush'
          | 'standard'
          | 'flamethrower'
          | 'plasma',
      });
    previewBoostAudioVariation(variationId, 'start');
  };

  const handleGroupVolumeChange = (groupId: string, percentVal: number) => {
    setGroupVolumes((prev) => ({ ...prev, [groupId]: percentVal }));
    const floatVal = percentVal / 100;
    const keys = GROUP_VOLUME_CONFIG_KEYS[groupId] || [];
    for (const k of keys) {
      audioConfig.set(k, floatVal);
    }
  };

  const handleResetGroupVolumes = () => {
    for (const grp of AUDIO_VOLUME_GROUPS) {
      handleGroupVolumeChange(grp.id, 100);
    }
  };

  const handleExportJson = () => {
    try {
      const json = exportAudioSettingsJson();
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
    } catch {
      // ignore export errors in headless environments
    }
  };

  return {
    ...props,
    onBack: props.onBack ?? goBack,
    boostSelection:
      props.boostSelection ??
      (props.defaultBoostSelection ? undefined : boostSelection),
    onBoostPhaseChange: props.onBoostPhaseChange ?? handleBoostPhaseChange,
    onBoostAllChange: props.onBoostAllChange ?? handleBoostAllChange,
    groupVolumes:
      props.groupVolumes ??
      (props.defaultGroupVolumes ? undefined : groupVolumes),
    onGroupVolumeChange: props.onGroupVolumeChange ?? handleGroupVolumeChange,
    onResetGroupVolumes: props.onResetGroupVolumes ?? handleResetGroupVolumes,
    onExportJson: props.onExportJson ?? handleExportJson,
  };
}

export function useLayer4ControllerSettingsStoreBinding(
  props: Layer4ControllerSettingsRecipeProps
): Layer4ControllerSettingsRecipeProps {
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
    ...props,
    onBack: props.onBack ?? goBack,
    config:
      props.config ??
      props.settings ??
      (props.defaultConfig ? undefined : bindings.axes),
    onChange: props.onChange ?? handleConfigChange,
    onReset: props.onReset ?? handleReset,
    inputDevice: props.inputDevice ?? inputDevice,
    onInputDeviceChange: props.onInputDeviceChange ?? handleInputDeviceChange,
  };
}

export function useLayer4EventTriggerRulesStoreBinding(
  props: Layer4EventTriggerRulesRecipeProps
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
    ...props,
    onBack: props.onBack ?? goBack,
    eventCatalogItems: props.eventCatalogItems ?? EVENT_CATALOG_ITEMS,
    hitCooldownMs: props.hitCooldownMs ?? hitCooldownMs,
    onHitCooldownMsChange:
      props.onHitCooldownMsChange ??
      ((val) => {
        setHitCooldownMs(val);
        audioConfig.set('carBallHitCooldownMs', val);
      }),
    scrapeCooldownMs: props.scrapeCooldownMs ?? scrapeCooldownMs,
    onScrapeCooldownMsChange:
      props.onScrapeCooldownMsChange ??
      ((val) => {
        setScrapeCooldownMs(val);
        audioConfig.set('goalpostHitCooldownMs', val);
      }),
    supersonicHoldMs: props.supersonicHoldMs ?? supersonicHoldMs,
    onSupersonicHoldMsChange:
      props.onSupersonicHoldMsChange ??
      ((val) => {
        setSupersonicHoldMs(val);
        audioConfig.set('incidentCooldownMs', val);
      }),
    lightTouchImpulse: props.lightTouchImpulse ?? lightTouchImpulse,
    onLightTouchImpulseChange:
      props.onLightTouchImpulseChange ??
      ((val) => {
        setLightTouchImpulse(val);
        audioConfig.set('carBallHitImpulseThreshold', val);
      }),
    mediumHitImpulse: props.mediumHitImpulse ?? mediumHitImpulse,
    onMediumHitImpulseChange:
      props.onMediumHitImpulseChange ??
      ((val) => {
        setMediumHitImpulse(val);
        audioConfig.set('ballGroundHitThreshold', val);
      }),
    heavyBoomImpulse: props.heavyBoomImpulse ?? heavyBoomImpulse,
    onHeavyBoomImpulseChange:
      props.onHeavyBoomImpulseChange ??
      ((val) => {
        setHeavyBoomImpulse(val);
        audioConfig.set('ballWallHitThreshold', val);
      }),
    rimClankGate: props.rimClankGate ?? rimClankGate,
    onRimClankGateChange:
      props.onRimClankGateChange ??
      ((val) => {
        setRimClankGate(val);
        audioConfig.set('goalpostHitThreshold', val);
      }),
    carBumpGate: props.carBumpGate ?? carBumpGate,
    onCarBumpGateChange:
      props.onCarBumpGateChange ??
      ((val) => {
        setCarBumpGate(val);
        audioConfig.set('netDualTriggerAngleDeg', val);
      }),
    enableConsoleLog: props.enableConsoleLog ?? enableConsoleLog,
    onEnableConsoleLogChange:
      props.onEnableConsoleLogChange ??
      ((val) => {
        setEnableConsoleLog(val);
        audioConfig.set('logAllEvents', val);
      }),
    logHitStructsOnly: props.logHitStructsOnly ?? logHitStructsOnly,
    onLogHitStructsOnlyChange:
      props.onLogHitStructsOnlyChange ??
      ((val) => {
        setLogHitStructsOnly(val);
        audioConfig.set('logCarBallHitEvents', val);
      }),
    selectedEvents: props.selectedEvents ?? selectedEvents,
    onToggleEventHex: props.onToggleEventHex ?? handleToggleEventHex,
    onSelectAllEvents: props.onSelectAllEvents ?? handleSelectAllEvents,
    onDeselectAllEvents: props.onDeselectAllEvents ?? handleDeselectAllEvents,
  };
}
