import React, { useState } from 'react';
import { useLayer4EventTriggerRulesStoreBinding } from './hooks/useLayer4StoreBindings';
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
import { Card } from '../layout/Card';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { DualGrabberSlider } from '../primitives/DualGrabberSlider';
import { DropdownMenu } from '../compounds/DropdownMenu';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { ToggleSwitch } from '../primitives/ToggleSwitch';
import {
  EventFilterMatrix,
  EventCatalogEntry,
} from '../compounds/tuner/EventFilterMatrix';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';

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

const DEFAULT_EVENT_CATALOG_ITEMS: EventCatalogEntry[] = [
  { hex: '0x01', id: 'CAR_BALL_TOUCH', name: 'Car-Ball Impact Impulse' },
  { hex: '0x02', id: 'WORLD_BOUNCE', name: 'Arena Wall / Rim Bounce' },
  { hex: '0x03', id: 'BOOST_PICKUP', name: 'Boost Orb Collect / Respawn' },
  { hex: '0x04', id: 'SUPERSONIC_STATE', name: 'Supersonic Threshold Cross' },
  { hex: '0x05', id: 'GOAL_EXPLOSION', name: 'Goal Line Plane Crossing' },
  { hex: '0x06', id: 'CAR_DEMOLITION', name: 'Car-Car Bump & Demolition' },
  { hex: '0x07', id: 'FLIP_RESET_CONTACT', name: '4-Wheel Undercarriage Reset' },
  { hex: '0x08', id: 'KICKOFF_COUNTDOWN', name: 'Kickoff Phase State Transition' },
];

export const Layer4EventTriggerRulesRecipe: React.FC<Layer4EventTriggerRulesRecipeProps> = React.memo((rawProps) => {
  const {
  isLight = true,
  defaultRules = DEFAULT_TRIGGER_RULES,
  onChange,
  eventCatalogItems = DEFAULT_EVENT_CATALOG_ITEMS,
  hitCooldownMs: controlledHitCooldownMs,
  onHitCooldownMsChange,
  scrapeCooldownMs: controlledScrapeCooldownMs,
  onScrapeCooldownMsChange,
  supersonicHoldMs: controlledSupersonicHoldMs,
  onSupersonicHoldMsChange,
  lightTouchImpulse: controlledLightTouchImpulse,
  onLightTouchImpulseChange,
  mediumHitImpulse: controlledMediumHitImpulse,
  onMediumHitImpulseChange,
  heavyBoomImpulse: controlledHeavyBoomImpulse,
  onHeavyBoomImpulseChange,
  rimClankGate: controlledRimClankGate,
  onRimClankGateChange,
  carBumpGate: controlledCarBumpGate,
  onCarBumpGateChange,
  enableConsoleLog: controlledEnableConsoleLog,
  onEnableConsoleLogChange,
  logHitStructsOnly: controlledLogHitStructsOnly,
  onLogHitStructsOnlyChange,
  selectedEvents: controlledSelectedEvents,
  onToggleEventHex,
  onSelectAllEvents,
  onDeselectAllEvents,
  onBack = () => {},
  className = '',
} = useLayer4EventTriggerRulesStoreBinding(rawProps);
  const { rowGap } = useSettingActionRowStore();
  const [rules, setRules] = useState<EventTriggerRule[]>(defaultRules);
  // Audio Debounce & Shielding (3 sliders)
  const [internalHitCooldownMs, setInternalHitCooldownMs] = useState(45);
  const [internalScrapeCooldownMs, setInternalScrapeCooldownMs] = useState(80);
  const [internalSupersonicHoldMs, setInternalSupersonicHoldMs] = useState(220);
  // Collision Impulse Thresholds (5 sliders)
  const [internalLightTouchImpulse, setInternalLightTouchImpulse] = useState(120);
  const [internalMediumHitImpulse, setInternalMediumHitImpulse] = useState(650);
  const [internalHeavyBoomImpulse, setInternalHeavyBoomImpulse] = useState(1450);
  const [internalRimClankGate, setInternalRimClankGate] = useState(420);
  const [internalCarBumpGate, setInternalCarBumpGate] = useState(550);
  // Event Stream & Console Logging
  const [internalEnableConsoleLog, setInternalEnableConsoleLog] = useState(true);
  const [internalLogHitStructsOnly, setInternalLogHitStructsOnly] = useState(false);
  const [internalSelectedEvents, setInternalSelectedEvents] = useState<Record<string, boolean>>({
    '0x01': true,
    '0x02': true,
    '0x03': false,
    '0x04': true,
    '0x05': true,
    '0x06': true,
    '0x07': true,
    '0x08': false,
  });
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const sizing = useMenuLayoutStore((s) => s.panels['layer4-event-trigger-rules']);

  const hitCooldownMs = controlledHitCooldownMs ?? internalHitCooldownMs;
  const scrapeCooldownMs = controlledScrapeCooldownMs ?? internalScrapeCooldownMs;
  const supersonicHoldMs = controlledSupersonicHoldMs ?? internalSupersonicHoldMs;
  const lightTouchImpulse = controlledLightTouchImpulse ?? internalLightTouchImpulse;
  const mediumHitImpulse = controlledMediumHitImpulse ?? internalMediumHitImpulse;
  const heavyBoomImpulse = controlledHeavyBoomImpulse ?? internalHeavyBoomImpulse;
  const rimClankGate = controlledRimClankGate ?? internalRimClankGate;
  const carBumpGate = controlledCarBumpGate ?? internalCarBumpGate;
  const enableConsoleLog = controlledEnableConsoleLog ?? internalEnableConsoleLog;
  const logHitStructsOnly = controlledLogHitStructsOnly ?? internalLogHitStructsOnly;
  const selectedEvents = controlledSelectedEvents ?? internalSelectedEvents;

  const updateRule = (id: string, patch: Partial<EventTriggerRule>) => {
    const next = rules.map((r) => (r.id === id ? { ...r, ...patch } : r));
    setRules(next);
    onChange?.(next);
  };

  const handleToggleEventHex = (hex: string) => {
    if (onToggleEventHex) {
      onToggleEventHex(hex);
      return;
    }
    const key = hex.toLowerCase();
    setInternalSelectedEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllEvents = () => {
    if (onSelectAllEvents) {
      onSelectAllEvents();
      return;
    }
    const next: Record<string, boolean> = {};
    eventCatalogItems.forEach((i) => {
      next[i.hex.toLowerCase()] = true;
    });
    setInternalSelectedEvents(next);
  };

  const handleDeselectAllEvents = () => {
    if (onDeselectAllEvents) {
      onDeselectAllEvents();
      return;
    }
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
        onBack={onBack}
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
              if (onHitCooldownMsChange) onHitCooldownMsChange(val);
              else setInternalHitCooldownMs(val);
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
              if (onScrapeCooldownMsChange) onScrapeCooldownMsChange(val);
              else setInternalScrapeCooldownMs(val);
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
              if (onSupersonicHoldMsChange) onSupersonicHoldMsChange(val);
              else setInternalSupersonicHoldMs(val);
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
              if (onLightTouchImpulseChange) onLightTouchImpulseChange(val);
              else setInternalLightTouchImpulse(val);
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
              if (onMediumHitImpulseChange) onMediumHitImpulseChange(val);
              else setInternalMediumHitImpulse(val);
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
              if (onHeavyBoomImpulseChange) onHeavyBoomImpulseChange(val);
              else setInternalHeavyBoomImpulse(val);
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
              if (onRimClankGateChange) onRimClankGateChange(val);
              else setInternalRimClankGate(val);
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
              if (onCarBumpGateChange) onCarBumpGateChange(val);
              else setInternalCarBumpGate(val);
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
              if (onEnableConsoleLogChange) onEnableConsoleLogChange(val);
              else setInternalEnableConsoleLog(val);
            }}
            isLight={isLight}
          />
          <SettingToggleRow
            icon={Filter}
            iconColor="text-sky-400"
            title="Log Car-Ball Hit Structs Only"
            checked={logHitStructsOnly}
            onCheckedChange={(val) => {
              if (onLogHitStructsOnlyChange) onLogHitStructsOnlyChange(val);
              else setInternalLogHitStructsOnly(val);
            }}
            isLight={isLight}
          />
        </div>

        {/* Event Stream Filter Matrix */}
        <Card isLight={isLight} variant="outlined" className="p-3.5 flex flex-col gap-2">
          <EventFilterMatrix
            items={eventCatalogItems}
            selectedMap={selectedEvents}
            onToggleItem={handleToggleEventHex}
            onSelectAll={handleSelectAllEvents}
            onDeselectAll={handleDeselectAllEvents}
            isLight={isLight}
          />
        </Card>

        {rules.map((rule) => (
          <Card
            key={rule.id}
            isLight={isLight}
            variant="outlined"
            onMouseEnter={() =>
              setHoveredDesc(
                `${rule.name}: Evaluated every physics tick (120Hz) — [${rule.range[0]}${rule.unit} .. ${rule.range[1]}${rule.unit}].`
              )
            }
            onMouseLeave={() => setHoveredDesc(null)}
            className="p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {rule.name}
              </h3>
              <ToggleSwitch
                label="Enabled"
                checked={rule.enabled}
                onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                isLight={isLight}
              />
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t ${
                isLight ? 'border-neutral-200' : 'border-neutral-800'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Telemetry Condition
                </span>
                <DropdownMenu
                  isLight={isLight}
                  options={[
                    { label: 'Ball Speed On Goal (kph)', value: 'ball-speed' },
                    { label: 'Remaining Boost Tank (%)', value: 'boost-below' },
                    { label: 'Continuous Car Air Time (s)', value: 'car-air-time' },
                    { label: 'Aerial Ball Touches', value: 'touch-count' },
                  ]}
                  value={rule.conditionType}
                  onChange={(v) =>
                    updateRule(rule.id, {
                      conditionType: v as EventTriggerRule['conditionType'],
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Triggered Action
                </span>
                <DropdownMenu
                  isLight={isLight}
                  options={[
                    { label: 'Award Valid Goal', value: 'award-goal' },
                    { label: 'Reset Shot Immediately', value: 'reset-shot' },
                    { label: 'Engage 25% Slow Motion', value: 'slow-motion' },
                    { label: 'Flash HUD Telemetry Alert', value: 'flash-hud' },
                  ]}
                  value={rule.actionType}
                  onChange={(v) =>
                    updateRule(rule.id, {
                      actionType: v as EventTriggerRule['actionType'],
                    })
                  }
                />
              </div>
            </div>

            <DualGrabberSlider
              label="Acceptance Threshold Band"
              min={rule.minLimit}
              max={rule.maxLimit}
              step={1}
              value={rule.range}
              onChange={(range) => updateRule(rule.id, { range })}
              unit={rule.unit}
              isLight={isLight}
            />
          </Card>
        ))}
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
