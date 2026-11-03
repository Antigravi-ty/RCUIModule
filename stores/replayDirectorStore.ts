/**
 * replayDirectorStore.ts
 * Zustand store, active session subscription, and diagnostic service locator
 * for the Goal Replay Director Camera & Slow-Motion.
 */
import { create } from 'zustand';
import {
  DEFAULT_REPLAY_DIRECTOR_CONFIG,
  DEFAULT_REPLAY_DIRECTOR_FOV_DEG,
  type ReplayDirectorConfigState,
  sanitizeReplayDirectorConfigPatch,
} from '../config/replayDirectorConfig';

export {
  DEFAULT_REPLAY_DIRECTOR_CONFIG,
  DEFAULT_REPLAY_DIRECTOR_FOV_DEG,
  type ReplayDirectorConfigState,
};

type ReplayDirectorConfigListener = (config: ReplayDirectorConfigState) => void;
const directorConfigListeners = new Set<ReplayDirectorConfigListener>();

let _activeReplayController: any = null;
let _latestRetainedReplayController: any = null;
let _retainedReplaySequence = 0;
let _diagnosticExporter: ((ctrl: any, format: string, options: any) => any) | null = null;
let _diagnosticParser: ((fileOrInput: any, fileName: string) => Promise<any>) | null = null;
let _windowDiagnosticBuilder: ((ctrl: any, windowRadius: number) => any) | null = null;
let _referenceKeyframeExporter: ((ctrl: any, options: any) => any) | null = null;

export interface ReplayDirectorStoreState {
  config: ReplayDirectorConfigState;
  updateConfig: (patch?: Partial<ReplayDirectorConfigState>) => ReplayDirectorConfigState;
  resetConfig: () => ReplayDirectorConfigState;
}

export const useReplayDirectorStore = create<ReplayDirectorStoreState>(() => ({
  config: { ...DEFAULT_REPLAY_DIRECTOR_CONFIG },
  updateConfig: (patch = {}) => updateReplayDirectorConfig(patch),
  resetConfig: () => resetReplayDirectorConfig(),
}));

export function getReplayDirectorConfig(): ReplayDirectorConfigState {
  return useReplayDirectorStore.getState().config;
}

export function updateReplayDirectorConfig(
  patch: Partial<ReplayDirectorConfigState> = {}
): ReplayDirectorConfigState {
  const current = useReplayDirectorStore.getState().config;
  const { nextConfig, changed } = sanitizeReplayDirectorConfigPatch(current, patch);
  if (changed) {
    useReplayDirectorStore.setState({ config: nextConfig });
  }
  if (changed && _activeReplayController) {
    if (_activeReplayController.isImportedPreview && _activeReplayController.useRecordedCsvCamera) {
      _activeReplayController.useRecordedCsvCamera = false;
    }
    _activeReplayController._cachedSuffixCameraPlan = null;
    _activeReplayController._cachedSmoothnessSummary = null;
    _activeReplayController._cachedAnomalyPeaks = null;
    _activeReplayController.refreshCurrentFrameDirectorPose?.();
  }
  const snapshot = { ...nextConfig };
  for (const fn of directorConfigListeners) {
    try {
      fn(snapshot);
    } catch (err) {
      console.warn('[replayDirectorStore] Config listener failed:', err);
    }
  }
  if (changed) {
    notifyActiveReplayTimelineController();
  }
  return nextConfig;
}

export function resetReplayDirectorConfig(): ReplayDirectorConfigState {
  const nextConfig: ReplayDirectorConfigState = { ...DEFAULT_REPLAY_DIRECTOR_CONFIG };
  useReplayDirectorStore.setState({ config: nextConfig });
  if (_activeReplayController) {
    _activeReplayController._cachedSuffixCameraPlan = null;
    _activeReplayController._cachedSmoothnessSummary = null;
    _activeReplayController._cachedAnomalyPeaks = null;
    _activeReplayController.refreshCurrentFrameDirectorPose?.();
  }
  const snapshot = { ...nextConfig };
  for (const fn of directorConfigListeners) {
    try {
      fn(snapshot);
    } catch (err) {
      console.warn('[replayDirectorStore] Config reset listener failed:', err);
    }
  }
  notifyActiveReplayTimelineController();
  return nextConfig;
}

export function subscribeReplayDirectorConfig(listener: ReplayDirectorConfigListener): () => boolean {
  if (typeof listener !== 'function') return () => false;
  directorConfigListeners.add(listener);
  return () => directorConfigListeners.delete(listener);
}

export interface ReplayDirectorPreviewHandlers {
  onImportPattern?: ((parsed: any, options: any) => any) | null;
  onStartPreview?: ((options: any) => boolean) | null;
  onExitPreview?: (() => boolean) | null;
  onEnterReferenceFreeCam?: ((options: any) => boolean) | null;
  onExitReferenceFreeCam?: (() => boolean) | null;
  onGetLiveCameraState?: (() => any) | null;
}

const _previewHandlers: ReplayDirectorPreviewHandlers = {
  onImportPattern: null,
  onStartPreview: null,
  onExitPreview: null,
  onEnterReferenceFreeCam: null,
  onExitReferenceFreeCam: null,
  onGetLiveCameraState: null,
};

type ReplaySessionListener = (controller: any) => void;
const _replaySessionListeners = new Set<ReplaySessionListener>();

export function markReplayTimelineControllerRetained(ctrl: any): number {
  if (!ctrl || !Array.isArray(ctrl.activeFrames) || ctrl.activeFrames.length === 0) {
    return 0;
  }
  _retainedReplaySequence += 1;
  ctrl.retainedReplaySeq = _retainedReplaySequence;
  _latestRetainedReplayController = ctrl;
  return _retainedReplaySequence;
}

export function getLatestRetainedReplayTimelineController(): any {
  return _latestRetainedReplayController;
}

export function notifyActiveReplayTimelineController(): void {
  for (const fn of _replaySessionListeners) {
    try {
      fn(_activeReplayController);
    } catch (err) {
      console.warn('[replayDirectorStore] Replay session listener failed:', err);
    }
  }
}

export function setActiveReplayTimelineController(ctrl: any): void {
  if (
    ctrl &&
    !ctrl.isActive &&
    _latestRetainedReplayController &&
    _latestRetainedReplayController !== ctrl &&
    Array.isArray(_latestRetainedReplayController.activeFrames) &&
    _latestRetainedReplayController.activeFrames.length > 0 &&
    (_latestRetainedReplayController.retainedReplaySeq || 0) > (ctrl.retainedReplaySeq || 0) &&
    typeof ctrl.copyRetainedReplayFrom === 'function'
  ) {
    ctrl.copyRetainedReplayFrom(_latestRetainedReplayController);
  }
  _activeReplayController = ctrl;
  notifyActiveReplayTimelineController();
}

export function getActiveReplayTimelineController(): any {
  return _activeReplayController;
}

export function subscribeActiveReplayTimelineController(listener: ReplaySessionListener): () => boolean {
  if (typeof listener !== 'function') return () => false;
  _replaySessionListeners.add(listener);
  return () => _replaySessionListeners.delete(listener);
}

export function registerReplayDirectorDiagnosticExporter(
  exporterFn: (ctrl: any, format: string, options: any) => any,
  parserFn: ((fileOrInput: any, fileName: string) => Promise<any>) | null = null,
  windowBuilderFn: ((ctrl: any, windowRadius: number) => any) | null = null,
  referenceKeyframeExporterFn: ((ctrl: any, options: any) => any) | null = null
): void {
  _diagnosticExporter = exporterFn;
  if (typeof parserFn === 'function') {
    _diagnosticParser = parserFn;
  }
  if (typeof windowBuilderFn === 'function') {
    _windowDiagnosticBuilder = windowBuilderFn;
  }
  if (typeof referenceKeyframeExporterFn === 'function') {
    _referenceKeyframeExporter = referenceKeyframeExporterFn;
  }
}

export function registerReplayDirectorPreviewHandlers(handlers: ReplayDirectorPreviewHandlers = {}): void {
  if (!handlers || typeof handlers !== 'object') return;
  if (typeof handlers.onImportPattern === 'function') {
    _previewHandlers.onImportPattern = handlers.onImportPattern;
  }
  if (typeof handlers.onStartPreview === 'function') {
    _previewHandlers.onStartPreview = handlers.onStartPreview;
  }
  if (typeof handlers.onExitPreview === 'function') {
    _previewHandlers.onExitPreview = handlers.onExitPreview;
  }
  if (typeof handlers.onEnterReferenceFreeCam === 'function') {
    _previewHandlers.onEnterReferenceFreeCam = handlers.onEnterReferenceFreeCam;
  }
  if (typeof handlers.onExitReferenceFreeCam === 'function') {
    _previewHandlers.onExitReferenceFreeCam = handlers.onExitReferenceFreeCam;
  }
  if (typeof handlers.onGetLiveCameraState === 'function') {
    _previewHandlers.onGetLiveCameraState = handlers.onGetLiveCameraState;
  }
}

export function enterActiveReplayDirectorReferenceFreeCam(options: Record<string, any> = {}): boolean {
  if (typeof _previewHandlers.onEnterReferenceFreeCam === 'function') {
    return _previewHandlers.onEnterReferenceFreeCam(options);
  }
  return false;
}

export function exitActiveReplayDirectorReferenceFreeCam(): boolean {
  if (typeof _previewHandlers.onExitReferenceFreeCam === 'function') {
    return _previewHandlers.onExitReferenceFreeCam();
  }
  return false;
}

export function getActiveReplayDirectorLiveCameraState(): any {
  if (typeof _previewHandlers.onGetLiveCameraState === 'function') {
    return _previewHandlers.onGetLiveCameraState();
  }
  return null;
}

export function exportActiveReplayDirectorReferenceKeyframe(options: Record<string, any> = {}): any {
  const ctrl = options.controller || _activeReplayController;
  if (!ctrl) return null;
  const liveCameraState = options.liveCameraState || getActiveReplayDirectorLiveCameraState();
  if (typeof _referenceKeyframeExporter === 'function') {
    return _referenceKeyframeExporter(ctrl, { ...options, liveCameraState });
  }
  return null;
}

export function exportActiveReplayDirectorDiagnosticPattern(
  format = 'rcgr',
  options: Record<string, any> = {}
): any {
  const ctrl = options.controller || _activeReplayController;
  if (typeof _diagnosticExporter === 'function') {
    return _diagnosticExporter(ctrl, format, options);
  }
  return null;
}

export function buildActiveReplayDirectorWindowDiagnostic(
  windowRadius = 15,
  options: Record<string, any> = {}
): any {
  const ctrl = options.controller || _activeReplayController;
  if (!ctrl) return null;
  if (typeof ctrl.buildDirectorFrameWindowDiagnostic === 'function') {
    return ctrl.buildDirectorFrameWindowDiagnostic(windowRadius);
  }
  if (typeof _windowDiagnosticBuilder === 'function') {
    return _windowDiagnosticBuilder(ctrl, windowRadius);
  }
  return null;
}

export async function importActiveReplayDirectorDiagnosticPattern(
  fileOrInput: any,
  options: Record<string, any> = {}
): Promise<any> {
  const fileName =
    options.fileName ||
    (fileOrInput && typeof fileOrInput === 'object' && fileOrInput.name) ||
    'imported.rcgr.gz';

  let parsed: any = null;
  if (
    fileOrInput &&
    typeof fileOrInput === 'object' &&
    Array.isArray(fileOrInput.activeFrames)
  ) {
    parsed = fileOrInput;
  } else if (typeof _diagnosticParser === 'function') {
    parsed = await _diagnosticParser(fileOrInput, fileName);
  }

  if (!parsed || !Array.isArray(parsed.activeFrames) || parsed.activeFrames.length === 0) {
    return null;
  }

  if (parsed.directorConfig && options.applyImportedConfig === true) {
    const patch: Record<string, number> = {};
    for (const [key, val] of Object.entries(parsed.directorConfig)) {
      if (key in DEFAULT_REPLAY_DIRECTOR_CONFIG && typeof val === 'number' && Number.isFinite(val)) {
        patch[key] = val;
      }
    }
    updateReplayDirectorConfig(patch);
  }

  const effectiveOptions = {
    useRecordedCsvCamera: false,
    ...options,
    fileName,
  };

  if (typeof _previewHandlers.onImportPattern === 'function') {
    return _previewHandlers.onImportPattern(parsed, effectiveOptions);
  }

  if (_activeReplayController?.loadImportedDiagnosticPattern) {
    _activeReplayController.loadImportedDiagnosticPattern(parsed, effectiveOptions);
    notifyActiveReplayTimelineController();
  }
  return parsed;
}

export function startActiveReplayDirectorPreview(options: Record<string, any> = {}): boolean {
  if (typeof _previewHandlers.onStartPreview === 'function') {
    return _previewHandlers.onStartPreview(options);
  }
  return false;
}

export function exitActiveReplayDirectorPreview(): boolean {
  if (typeof _previewHandlers.onExitPreview === 'function') {
    return _previewHandlers.onExitPreview();
  }
  if (_activeReplayController?.isActive) {
    _activeReplayController.endReplaySession?.();
    return true;
  }
  return false;
}

export function setActiveReplayDirectorCsvCameraMode(useRecordedCsv: boolean): boolean {
  if (!_activeReplayController) return false;
  _activeReplayController.useRecordedCsvCamera = Boolean(useRecordedCsv);
  _activeReplayController._cachedSmoothnessSummary = null;
  _activeReplayController._cachedAnomalyPeaks = null;
  _activeReplayController.refreshCurrentFrameDirectorPose?.();
  notifyActiveReplayTimelineController();
  return _activeReplayController.useRecordedCsvCamera;
}
