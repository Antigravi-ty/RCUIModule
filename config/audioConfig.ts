import { safeStorage } from './storageHelpers';
import {
  CONSOLE_LOG_EVENT_CATALOG,
  BOOST_AUDIO_VARIATIONS,
  DEFAULT_BOOST_VARIATION,
  ADVANCED_AUDIO_CATEGORIES,
  ADVANCED_AUDIO_DETAIL_CATALOG,
  createDefaultLogEventFilter,
  clamp01,
  clampVolume,
  dbToLinear,
  AUDIO_SETTINGS_KEY,
  AUDIO_SETTINGS_CHANGED_EVENT,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_AUDIO_SETTINGS,
  type AudioConfigSettings,
  type DynamicRangeProfileId,
} from './audioConstants';

export {
  CONSOLE_LOG_EVENT_CATALOG,
  BOOST_AUDIO_VARIATIONS,
  DEFAULT_BOOST_VARIATION,
  ADVANCED_AUDIO_CATEGORIES,
  ADVANCED_AUDIO_DETAIL_CATALOG,
  createDefaultLogEventFilter,
  clamp01,
  clampVolume,
  dbToLinear,
  AUDIO_SETTINGS_KEY,
  AUDIO_SETTINGS_CHANGED_EVENT,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_AUDIO_SETTINGS,
  type AudioConfigSettings,
  type DynamicRangeProfileId,
};

export type AudioConfigSubscriber = (config: AudioConfigSettings) => void;

export class AudioConfigManager {
  config: AudioConfigSettings;
  subscribers: AudioConfigSubscriber[];

  constructor() {
    this.config = { ...DEFAULT_AUDIO_CONFIG };
    this.subscribers = [];
    this.load();
  }

  load(): void {
    try {
      const validBoostIds = new Set(BOOST_AUDIO_VARIATIONS.map((v) => v.id));
      const normalizeBoostVar = (val: unknown): string =>
        typeof val === 'string' && validBoostIds.has(val) ? val : DEFAULT_BOOST_VARIATION;
      const raw = safeStorage.getItem(AUDIO_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.version || parsed.version < 4) {
          for (const item of ADVANCED_AUDIO_DETAIL_CATALOG) {
            if (parsed[item.key] === undefined) {
              parsed[item.key] = 1.0;
            }
          }
          if (parsed.boostCollectVolume === 2.0) parsed.boostCollectVolume = 1.0;
          if (parsed.endgameVolume === 2.0) parsed.endgameVolume = 1.0;
          if (parsed.goalpostHitVolume === 2.0) parsed.goalpostHitVolume = 1.0;
          if (parsed.goalScoredVolume === 1.5) parsed.goalScoredVolume = 1.0;
          if (parsed.engineVolume === 0.8) parsed.engineVolume = 1.0;
          if (parsed.boostVolume === 0.8) parsed.boostVolume = 1.0;
          if (parsed.boostLoopVolume === 0.8) parsed.boostLoopVolume = 1.0;
          if (parsed.ballRollingVolume === 0.8) parsed.ballRollingVolume = 1.0;
          if (parsed.ballFlyingVolume === 0.8) parsed.ballFlyingVolume = 1.0;
        }
        this.config = {
          ...DEFAULT_AUDIO_CONFIG,
          ...parsed,
          boostStartVariation: normalizeBoostVar(parsed.boostStartVariation),
          boostLoopVariation: normalizeBoostVar(parsed.boostLoopVariation),
          boostEndVariation: normalizeBoostVar(parsed.boostEndVariation),
          version: DEFAULT_AUDIO_CONFIG.version,
          logEventFilter: {
            ...createDefaultLogEventFilter(),
            ...(parsed.logEventFilter || {}),
          },
        };
      }
    } catch (e) {
      console.warn('[AudioConfigManager] Failed to load audio config from storage:', e);
    }
  }

  save(): void {
    safeStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(this.config));
    this.notify();
  }

  get(key: string): any {
    return this.config[key];
  }

  set(key: string, value: any): void {
    if (typeof value === 'number') {
      this.config[key] = key.endsWith('Volume') ? clampVolume(value) : value;
    } else {
      this.config[key] = value;
    }
    this.save();
  }

  subscribe(callback: AudioConfigSubscriber): () => boolean {
    if (!this.subscribers.includes(callback)) {
      this.subscribers.push(callback);
    }
    return () => {
      const idx = this.subscribers.indexOf(callback);
      if (idx === -1) return false;
      this.subscribers.splice(idx, 1);
      return true;
    };
  }

  notify(): void {
    for (const sub of this.subscribers) {
      try {
        sub(this.config);
      } catch (e) {
        console.error('[AudioConfigManager] Subscriber error:', e);
      }
    }
  }

  exportJson(): string {
    return JSON.stringify(this.config, null, 2);
  }

  importJson(jsonOrObj: string | Record<string, any>): boolean {
    try {
      const parsed = typeof jsonOrObj === 'string' ? JSON.parse(jsonOrObj) : jsonOrObj;
      if (typeof parsed !== 'object' || !parsed) return false;
      this.config = {
        ...DEFAULT_AUDIO_CONFIG,
        ...parsed,
        logEventFilter: {
          ...createDefaultLogEventFilter(),
          ...(parsed.logEventFilter || {}),
        },
      };
      this.save();
      return true;
    } catch (e) {
      console.error('[AudioConfigManager] Failed to import audio config:', e);
      return false;
    }
  }

  reset(): void {
    this.config = { ...DEFAULT_AUDIO_CONFIG };
    this.save();
  }
}

export const audioConfig = new AudioConfigManager();

export function getAudioSettings(): AudioConfigSettings {
  return audioConfig.config;
}

export function resetAllAudioDetailVolumes(): void {
  for (const item of ADVANCED_AUDIO_DETAIL_CATALOG) {
    audioConfig.config[item.key] = 1.0;
  }
  audioConfig.config.boostStartStopVolume = 1.0;
  audioConfig.config.supersonicVolume = 1.0;
  audioConfig.config.ballWorldHitVolume = 1.0;
  audioConfig.save();
}

export function setCarBallSoundMode(mode: string): void {
  audioConfig.set('carBallSoundMode', mode);
}
export function setCarCarSoundMode(mode: string): void {
  audioConfig.set('carCarSoundMode', mode);
}
export function setBoostStartVariation(variationId: string): void {
  audioConfig.set('boostStartVariation', variationId);
}
export function setBoostLoopVariation(variationId: string): void {
  audioConfig.set('boostLoopVariation', variationId);
}
export function setBoostEndVariation(variationId: string): void {
  audioConfig.set('boostEndVariation', variationId);
}
export function setAllBoostAudioVariations(variationId: string): void {
  audioConfig.config.boostStartVariation = variationId;
  audioConfig.config.boostLoopVariation = variationId;
  audioConfig.config.boostEndVariation = variationId;
  audioConfig.save();
}
export function setCarBallHitCooldownMs(ms: number): void {
  audioConfig.set('carBallHitCooldownMs', ms);
}
export function setGoalpostHitCooldownMs(ms: number): void {
  audioConfig.set('goalpostHitCooldownMs', ms);
}
export function setCarBallHitImpulseThreshold(val: number): void {
  audioConfig.set('carBallHitImpulseThreshold', val);
}
export function setGoalpostHitThreshold(val: number): void {
  audioConfig.set('goalpostHitThreshold', val);
}

export function setEventLogFilterItem(hexCode: string, enabled: boolean): void {
  const key = String(hexCode).toLowerCase();
  const current = audioConfig.config.logEventFilter || createDefaultLogEventFilter();
  const updated: Record<string, boolean> = {
    ...current,
    [key]: Boolean(enabled),
  };
  audioConfig.set('logEventFilter', updated);
  const hasAnyChecked = Object.values(updated).some(Boolean);
  if (hasAnyChecked && !audioConfig.get('logAllEvents')) {
    audioConfig.set('logAllEvents', true);
  }
}

export function selectAllEventLogs(): void {
  const allTrue: Record<string, boolean> = {};
  for (const item of CONSOLE_LOG_EVENT_CATALOG) {
    allTrue[item.hex.toLowerCase()] = true;
  }
  audioConfig.set('logEventFilter', allTrue);
  audioConfig.set('logAllEvents', true);
}

export function deselectAllEventLogs(): void {
  const empty: Record<string, boolean> = {};
  for (const item of CONSOLE_LOG_EVENT_CATALOG) {
    empty[item.hex.toLowerCase()] = false;
  }
  audioConfig.set('logEventFilter', empty);
  audioConfig.set('logAllEvents', false);
}

export function isEventLogEnabled(eventType: number): boolean {
  const cfg = audioConfig.config;
  if (!cfg) return false;
  if (cfg.logCarBallHitEvents && eventType === 0x01) return true;
  if (!cfg.logAllEvents) return false;
  const hex = '0x' + eventType.toString(16).padStart(2, '0').toLowerCase();
  if (!cfg.logEventFilter) return false;
  return Boolean(cfg.logEventFilter[hex]);
}

export function exportAudioSettingsJson(): string {
  return audioConfig.exportJson();
}

export interface AudioDiagnosticsHandlers {
  collectReport?: (() => any) | null;
  dumpToConsole?: ((label?: string) => any) | null;
  playTestTone?: ((options?: Record<string, any>) => Promise<any>) | null;
  forceRecovery?: (() => Promise<any>) | null;
  previewBoostVariation?: ((variationId: string, phase?: string) => any) | null;
  previewAudioDetail?: ((detailKey: string) => any) | null;
  stopAudioDetailPreview?: (() => any) | null;
}

const audioDiagnosticsProvider: AudioDiagnosticsHandlers = {
  collectReport: null,
  dumpToConsole: null,
  playTestTone: null,
  forceRecovery: null,
  previewBoostVariation: null,
  previewAudioDetail: null,
  stopAudioDetailPreview: null,
};

export function registerAudioDiagnosticsProvider(handlers: AudioDiagnosticsHandlers = {}): void {
  Object.assign(audioDiagnosticsProvider, handlers);
}

export function collectAudioDiagnosticReport(): any {
  if (typeof audioDiagnosticsProvider.collectReport === 'function') {
    return audioDiagnosticsProvider.collectReport();
  }
  return {
    rootCauses: [],
    browser: {},
    context: { state: 'uninitialized', sampleRate: 0, currentTime: 0, clockAdvancing: false },
    master: { rms: 0, dbfs: -120 },
    pool: { activeVoices: 0, maxSlots: 0 },
    loops: {},
    emotor: {},
  };
}

export function dumpAudioDiagnosticsToConsole(label?: string): any {
  if (typeof audioDiagnosticsProvider.dumpToConsole === 'function') {
    return audioDiagnosticsProvider.dumpToConsole(label);
  }
  return collectAudioDiagnosticReport();
}

export async function playAudioDiagnosticTestTone(options: Record<string, any> = {}): Promise<any> {
  if (typeof audioDiagnosticsProvider.playTestTone === 'function') {
    return audioDiagnosticsProvider.playTestTone(options);
  }
  return { ok: false, reason: 'Audio diagnostics provider not initialized' };
}

export async function forceAudioRecovery(): Promise<any> {
  if (typeof audioDiagnosticsProvider.forceRecovery === 'function') {
    return audioDiagnosticsProvider.forceRecovery();
  }
  return { ok: false, stateAfter: 'uninitialized', clockAdvancing: false };
}

export function previewBoostAudioVariation(variationId: string, phase = 'start'): any {
  if (typeof audioDiagnosticsProvider.previewBoostVariation === 'function') {
    return audioDiagnosticsProvider.previewBoostVariation(variationId, phase);
  }
}

export function previewAudioDetailItem(detailKey: string): any {
  if (typeof audioDiagnosticsProvider.previewAudioDetail === 'function') {
    return audioDiagnosticsProvider.previewAudioDetail(detailKey);
  }
}

export function stopAudioDetailPreview(): any {
  if (typeof audioDiagnosticsProvider.stopAudioDetailPreview === 'function') {
    return audioDiagnosticsProvider.stopAudioDetailPreview();
  }
}
