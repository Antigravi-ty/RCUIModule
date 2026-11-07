import React, { useState, useEffect } from 'react';
import {
  Timer,
  Waves,
  Zap,
  Feather,
  Activity,
  Flame,
  ShieldAlert,
  Car,
  Terminal,
  Filter,
} from 'lucide-react';
import { audioConfig, selectAllEventLogs, deselectAllEventLogs, setEventLogFilterItem } from '../config/audioConfig';
import { CONSOLE_LOG_EVENT_CATALOG, createDefaultLogEventFilter } from '../config/audioConstants';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import type { EventCatalogEntry } from '../compounds/tuner/EventFilterMatrix';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';
import { resolveCalibratedSurfaceSizing } from '../manifest/surfaceCalibration';
import { useAppStore } from '../stores/appStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useStoreSnapshotOverride } from '../stores/storeSnapshotScope';
import {
  EventTriggerRulesSection,
  type EventTriggerRule,
} from './dev/EventTriggerRulesSection';

export type { EventTriggerRule } from './dev/EventTriggerRulesSection';

export const SURFACE_META: SurfaceMeta = {
  id: 'recipe:Layer4EventTriggerRulesRecipe',
  title: 'Event & Trigger Rules Engine',
  subtitle:
    'Audio debounce shielding, collision impulse thresholds, event filter catalog, and telemetry rules',
  icon: 'filter',
  layer: 'layer4',
  menuGroup: 'menu-layer',
  defaultSizing: {
    mode: 'adaptive',
    width: 580,
    height: 560,
    minHeight: 240,
    maxHeight: 1120,
  },
};

export interface Layer4EventTriggerRulesStateOverride {
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
  defaultRules?: EventTriggerRule[];
  onChange?: (rules: EventTriggerRule[]) => void;
  eventCatalogItems?: EventCatalogEntry[];
}

export interface Layer4EventTriggerRulesRecipeProps extends StandardSurfaceProps {
  stateOverride?: Layer4EventTriggerRulesStateOverride;
  className?: string;
}

const DEFAULT_TRIGGER_RULES: EventTriggerRule[] = [
  {
    id: 'rule-speed-gate',
    name: 'Minimum Shot Velocity Gate',
    conditionType: 'ball-speed',
    range: [95, 145],
    unit: ' kph',
    minLimit: 0,
    maxLimit: 180,
    actionType: 'award-goal',
    enabled: true,
  },
  {
    id: 'rule-boost-budget',
    name: 'Boost Consumption Window',
    conditionType: 'boost-below',
    range: [12, 65],
    unit: '%',
    minLimit: 0,
    maxLimit: 100,
    actionType: 'flash-hud',
    enabled: true,
  },
];

const EVENT_CATALOG_ITEMS: EventCatalogEntry[] = CONSOLE_LOG_EVENT_CATALOG.map(
  (item) => ({
    hex: item.hex,
    id: item.id,
    name: item.name,
  })
);

export const Layer4EventTriggerRulesRecipe: React.FC<Layer4EventTriggerRulesRecipeProps> =
  React.memo(({ isLight = true, onBack, stateOverride, className = '' }) => {
    const goBack = useAppStore((s) => s.goBack);
    const { rowGap } = useSettingActionRowStore();
    const scopeOverride =
      useStoreSnapshotOverride<Layer4EventTriggerRulesStateOverride>('eventTriggerRules');
    const ov = { ...scopeOverride, ...stateOverride };

    const [rules, setRules] = useState<EventTriggerRule[]>(
      () => ov.defaultRules ?? DEFAULT_TRIGGER_RULES
    );
    const [internalHitCooldownMs, setInternalHitCooldownMs] = useState<number>(() =>
      Number(audioConfig.get('carBallHitCooldownMs') ?? 40)
    );
    const [internalScrapeCooldownMs, setInternalScrapeCooldownMs] = useState<number>(() =>
      Number(audioConfig.get('goalpostHitCooldownMs') ?? 60)
    );
    const [internalSupersonicHoldMs, setInternalSupersonicHoldMs] = useState<number>(() =>
      Number(audioConfig.get('incidentCooldownMs') ?? 40)
    );
    const [internalLightTouchImpulse, setInternalLightTouchImpulse] = useState<number>(() =>
      Number(audioConfig.get('carBallHitImpulseThreshold') ?? 120)
    );
    const [internalMediumHitImpulse, setInternalMediumHitImpulse] = useState<number>(() =>
      Number(audioConfig.get('ballGroundHitThreshold') ?? 140)
    );
    const [internalHeavyBoomImpulse, setInternalHeavyBoomImpulse] = useState<number>(() =>
      Number(audioConfig.get('ballWallHitThreshold') ?? 160)
    );
    const [internalRimClankGate, setInternalRimClankGate] = useState<number>(() =>
      Number(audioConfig.get('goalpostHitThreshold') ?? 120)
    );
    const [internalCarBumpGate, setInternalCarBumpGate] = useState<number>(() =>
      Number(audioConfig.get('netDualTriggerAngleDeg') ?? 60)
    );
    const [internalEnableConsoleLog, setInternalEnableConsoleLog] = useState<boolean>(() =>
      Boolean(audioConfig.get('logAllEvents'))
    );
    const [internalLogHitStructsOnly, setInternalLogHitStructsOnly] = useState<boolean>(() =>
      Boolean(audioConfig.get('logCarBallHitEvents'))
    );
    const [internalSelectedEvents, setInternalSelectedEvents] = useState<
      Record<string, boolean>
    >(() => ({
      ...(audioConfig.config?.logEventFilter || createDefaultLogEventFilter()),
    }));
    const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

    const storeSizing = useMenuLayoutStore((s) => s.panels['layer4-event-trigger-rules']);
    const calibratedSizing = resolveCalibratedSurfaceSizing(
      SURFACE_META.id,
      SURFACE_META.defaultSizing
    );
    const sizing = storeSizing ?? {
      mode: calibratedSizing.mode === 'fixed' ? ('fixed' as const) : ('auto' as const),
      width: calibratedSizing.width,
      targetHeight:
        typeof calibratedSizing.height === 'number' ? calibratedSizing.height : 560,
      minHeight: calibratedSizing.minHeight ?? 240,
      maxHeight: calibratedSizing.maxHeight ?? 1120,
    };

    useEffect(() => {
      const handleSync = () => {
        setInternalHitCooldownMs(Number(audioConfig.get('carBallHitCooldownMs') ?? 40));
        setInternalScrapeCooldownMs(Number(audioConfig.get('goalpostHitCooldownMs') ?? 60));
        setInternalSupersonicHoldMs(Number(audioConfig.get('incidentCooldownMs') ?? 40));
        setInternalLightTouchImpulse(
          Number(audioConfig.get('carBallHitImpulseThreshold') ?? 120)
        );
        setInternalMediumHitImpulse(Number(audioConfig.get('ballGroundHitThreshold') ?? 140));
        setInternalHeavyBoomImpulse(Number(audioConfig.get('ballWallHitThreshold') ?? 160));
        setInternalRimClankGate(Number(audioConfig.get('goalpostHitThreshold') ?? 120));
        setInternalCarBumpGate(Number(audioConfig.get('netDualTriggerAngleDeg') ?? 60));
        setInternalEnableConsoleLog(Boolean(audioConfig.get('logAllEvents')));
        setInternalLogHitStructsOnly(Boolean(audioConfig.get('logCarBallHitEvents')));
        setInternalSelectedEvents({
          ...(audioConfig.config?.logEventFilter || createDefaultLogEventFilter()),
        });
      };
      const unsub = audioConfig.subscribe(handleSync);
      return () => {
        unsub();
      };
    }, []);

    const eventCatalogItems = ov.eventCatalogItems ?? EVENT_CATALOG_ITEMS;
    const hitCooldownMs = ov.hitCooldownMs ?? internalHitCooldownMs;
    const scrapeCooldownMs = ov.scrapeCooldownMs ?? internalScrapeCooldownMs;
    const supersonicHoldMs = ov.supersonicHoldMs ?? internalSupersonicHoldMs;
    const lightTouchImpulse = ov.lightTouchImpulse ?? internalLightTouchImpulse;
    const mediumHitImpulse = ov.mediumHitImpulse ?? internalMediumHitImpulse;
    const heavyBoomImpulse = ov.heavyBoomImpulse ?? internalHeavyBoomImpulse;
    const rimClankGate = ov.rimClankGate ?? internalRimClankGate;
    const carBumpGate = ov.carBumpGate ?? internalCarBumpGate;
    const enableConsoleLog = ov.enableConsoleLog ?? internalEnableConsoleLog;
    const logHitStructsOnly = ov.logHitStructsOnly ?? internalLogHitStructsOnly;
    const selectedEvents = ov.selectedEvents ?? internalSelectedEvents;

    const updateRule = (id: string, patch: Partial<EventTriggerRule>) => {
      const next = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
      setRules(next);
      ov.onChange?.(next);
    };

    const handleToggleEventHex = (hex: string) => {
      if (ov.onToggleEventHex) {
        ov.onToggleEventHex(hex);
        return;
      }
      const key = hex.toLowerCase();
      const nextVal = !Boolean(selectedEvents[key]);
      setEventLogFilterItem(key, nextVal);
      setInternalSelectedEvents((prev) => ({ ...prev, [key]: nextVal }));
    };

    const handleSelectAllEvents = () => {
      if (ov.onSelectAllEvents) {
        ov.onSelectAllEvents();
        return;
      }
      selectAllEventLogs();
      const next: Record<string, boolean> = {};
      eventCatalogItems.forEach((i) => {
        next[i.hex.toLowerCase()] = true;
      });
      setInternalEnableConsoleLog(true);
      setInternalSelectedEvents(next);
    };

    const handleDeselectAllEvents = () => {
      if (ov.onDeselectAllEvents) {
        ov.onDeselectAllEvents();
        return;
      }
      deselectAllEventLogs();
      setInternalEnableConsoleLog(false);
      setInternalSelectedEvents({});
    };

    return (
      <PanelContainer
        isLight={isLight}
        sizing={sizing}
        className={`w-full select-none ${className}`}
      >
        <PanelHeader
          isLight={isLight}
          title="EVENT & TRIGGER RULES ENGINE"
          onBack={onBack ?? goBack}
        />

        <PanelContent scrollable={true} className="flex flex-col gap-3">
          {/* Audio Debounce & Collision Impulse Thresholds (Unified Slider Rows) */}
          <div className="flex flex-col" style={{ gap: `${rowGap}px` }}>
            <SettingSliderRow
              icon={Timer}
              iconColor="text-amber-400"
              title="Car-Ball Hit Cooldown"
              min={0}
              max={250}
              step={5}
              value={hitCooldownMs}
              onChange={(val) => {
                setInternalHitCooldownMs(val);
                if (ov.onHitCooldownMsChange) ov.onHitCooldownMsChange(val);
                else audioConfig.set('carBallHitCooldownMs', val);
              }}
              unit=" ms"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Waves}
              iconColor="text-sky-400"
              title="Surface Scrape Cooldown"
              min={0}
              max={500}
              step={5}
              value={scrapeCooldownMs}
              onChange={(val) => {
                setInternalScrapeCooldownMs(val);
                if (ov.onScrapeCooldownMsChange) ov.onScrapeCooldownMsChange(val);
                else audioConfig.set('goalpostHitCooldownMs', val);
              }}
              unit=" ms"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Zap}
              iconColor="text-purple-400"
              title="Supersonic Transition Hold"
              min={0}
              max={600}
              step={10}
              value={supersonicHoldMs}
              onChange={(val) => {
                setInternalSupersonicHoldMs(val);
                if (ov.onSupersonicHoldMsChange) ov.onSupersonicHoldMsChange(val);
                else audioConfig.set('incidentCooldownMs', val);
              }}
              unit=" ms"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Feather}
              iconColor="text-emerald-400"
              title="Light Touch Min Impulse"
              min={0}
              max={1000}
              step={10}
              value={lightTouchImpulse}
              onChange={(val) => {
                setInternalLightTouchImpulse(val);
                if (ov.onLightTouchImpulseChange) ov.onLightTouchImpulseChange(val);
                else audioConfig.set('carBallHitImpulseThreshold', val);
              }}
              unit=" UU/s"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Activity}
              iconColor="text-cyan-400"
              title="Medium Hit Impulse"
              min={0}
              max={1200}
              step={25}
              value={mediumHitImpulse}
              onChange={(val) => {
                setInternalMediumHitImpulse(val);
                if (ov.onMediumHitImpulseChange) ov.onMediumHitImpulseChange(val);
                else audioConfig.set('ballGroundHitThreshold', val);
              }}
              unit=" UU/s"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Flame}
              iconColor="text-rose-400"
              title="Heavy Boom Impulse"
              min={0}
              max={2500}
              step={50}
              value={heavyBoomImpulse}
              onChange={(val) => {
                setInternalHeavyBoomImpulse(val);
                if (ov.onHeavyBoomImpulseChange) ov.onHeavyBoomImpulseChange(val);
                else audioConfig.set('ballWallHitThreshold', val);
              }}
              unit=" UU/s"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={ShieldAlert}
              iconColor="text-orange-400"
              title="Rim / Post Clank Gate"
              min={0}
              max={1200}
              step={20}
              value={rimClankGate}
              onChange={(val) => {
                setInternalRimClankGate(val);
                if (ov.onRimClankGateChange) ov.onRimClankGateChange(val);
                else audioConfig.set('goalpostHitThreshold', val);
              }}
              unit=" UU/s"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingSliderRow
              icon={Car}
              iconColor="text-indigo-400"
              title="Car-Car Bump Gate"
              min={0}
              max={1500}
              step={5}
              value={carBumpGate}
              onChange={(val) => {
                setInternalCarBumpGate(val);
                if (ov.onCarBumpGateChange) ov.onCarBumpGateChange(val);
                else audioConfig.set('netDualTriggerAngleDeg', val);
              }}
              unit=" UU/s"
              layout="inline"
              developerMode={true}
              editable={true}
              isLight={isLight}
            />
            <SettingToggleRow
              icon={Terminal}
              iconColor="text-emerald-400"
              title="Enable Event Console Log"
              checked={enableConsoleLog}
              onCheckedChange={(val) => {
                setInternalEnableConsoleLog(val);
                if (ov.onEnableConsoleLogChange) ov.onEnableConsoleLogChange(val);
                else audioConfig.set('logAllEvents', val);
              }}
              isLight={isLight}
            />
            <SettingToggleRow
              icon={Filter}
              iconColor="text-sky-400"
              title="Log Car-Ball Hit Structs Only"
              checked={logHitStructsOnly}
              onCheckedChange={(val) => {
                setInternalLogHitStructsOnly(val);
                if (ov.onLogHitStructsOnlyChange) ov.onLogHitStructsOnlyChange(val);
                else audioConfig.set('logCarBallHitEvents', val);
              }}
              isLight={isLight}
            />
          </div>

          <EventTriggerRulesSection
            isLight={isLight}
            eventCatalogItems={eventCatalogItems}
            selectedEvents={selectedEvents}
            onToggleEventHex={handleToggleEventHex}
            onSelectAllEvents={handleSelectAllEvents}
            onDeselectAllEvents={handleDeselectAllEvents}
            rules={rules}
            onUpdateRule={updateRule}
            onHoverDesc={setHoveredDesc}
          />
        </PanelContent>

        <PanelFooter
          isLight={isLight}
          defaultDescription="Configure audio debounce shielding, collision impulse thresholds, event filter catalog, and telemetry rules."
          hoveredDescription={hoveredDesc}
        />
      </PanelContainer>
    );
  });

Layer4EventTriggerRulesRecipe.displayName = 'Layer4EventTriggerRulesRecipe';
export default Layer4EventTriggerRulesRecipe;
