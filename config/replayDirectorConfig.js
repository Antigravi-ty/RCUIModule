/**
 * replayDirectorConfig.js
 * Pure configuration and active session subscription bridge for the Goal Replay Director Camera & Slow-Motion.
 */

export const DEFAULT_REPLAY_DIRECTOR_CONFIG = Object.freeze({
  lastTouchSlowMoPreSeconds: 0.50,
  lastTouchSlowMoPostSeconds: 0.25,
  lastTouchSlowMoScale: 0.50,
  goalLineSlowMoPreSeconds: 0.25,
  goalLineSlowMoPostSeconds: 0.25,
  goalLineSlowMoScale: 0.50,

  touchHoldAfterSeconds: 0.20,
  twoTouchLookaheadSeconds: 2.20,
  twoTouchAnticipationWeight: 0.36,

  corridorBackDistStart: 640.0,
  corridorBackDistEnd: 520.0,
  corridorSideDistBase: 460.0,
  goalBoxShowcaseDist: 920.0,
  carMidpointMaxWeight: 0.46,

  cameraBaseHeightUu: 195.0,
  cameraAerialHeightSlope: 0.36,
  interceptorLookaheadSeconds: 1.65,
  interceptorFramingWeight: 0.72,
  suffixTimeDecayRate: 1.40,
  trajectorySmoothPasses: 4,
  maxTotalYawBudgetDeg: 320.0,

  postGoalExplosionStretchDist: 780.0,
  postGoalExplosionStretchDuration: 0.36,
  postGoalScorerFollowTransitionSec: 0.28,
  eyeDampingRate: 5.2,
  gazeDampingRate: 8.5,
  strikerSwitchDampingRate: 4.2,
  muteSignalAudioInGoalReplay: true,
});

export const REPLAY_DIRECTOR_CONFIG = {
  ...DEFAULT_REPLAY_DIRECTOR_CONFIG,
};

const directorConfigListeners = new Set();

export function updateReplayDirectorConfig(patch = {}) {
  if (!patch || typeof patch !== 'object') return REPLAY_DIRECTOR_CONFIG;
  let changed = false;
  for (const [key, val] of Object.entries(patch)) {
    if (!(key in REPLAY_DIRECTOR_CONFIG)) continue;
    if (typeof DEFAULT_REPLAY_DIRECTOR_CONFIG[key] === 'boolean' && typeof val === 'boolean') {
      if (REPLAY_DIRECTOR_CONFIG[key] !== val) {
        REPLAY_DIRECTOR_CONFIG[key] = val;
        changed = true;
      }
    } else if (typeof val === 'number' && Number.isFinite(val)) {
      if (REPLAY_DIRECTOR_CONFIG[key] !== val) {
        REPLAY_DIRECTOR_CONFIG[key] = val;
        changed = true;
      }
    }
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
  for (const fn of directorConfigListeners) {
    try {
      fn({ ...REPLAY_DIRECTOR_CONFIG });
    } catch (err) {
      console.warn('[replayDirectorConfig] Config listener failed:', err);
    }
  }
  if (changed) {
    notifyActiveReplayTimelineController();
  }
  return REPLAY_DIRECTOR_CONFIG;
}

export function resetReplayDirectorConfig() {
  Object.assign(REPLAY_DIRECTOR_CONFIG, DEFAULT_REPLAY_DIRECTOR_CONFIG);
  if (_activeReplayController) {
    _activeReplayController._cachedSuffixCameraPlan = null;
    _activeReplayController._cachedSmoothnessSummary = null;
    _activeReplayController._cachedAnomalyPeaks = null;
    _activeReplayController.refreshCurrentFrameDirectorPose?.();
  }
  for (const fn of directorConfigListeners) {
    try {
      fn({ ...REPLAY_DIRECTOR_CONFIG });
    } catch (err) {
      console.warn('[replayDirectorConfig] Config reset listener failed:', err);
    }
  }
  notifyActiveReplayTimelineController();
  return REPLAY_DIRECTOR_CONFIG;
}

export function subscribeReplayDirectorConfig(listener) {
  if (typeof listener !== 'function') return () => {};
  directorConfigListeners.add(listener);
  return () => directorConfigListeners.delete(listener);
}

let _activeReplayController = null;
let _diagnosticExporter = null;
let _diagnosticParser = null;
let _windowDiagnosticBuilder = null;
let _referenceKeyframeExporter = null;
let _previewHandlers = {
  onImportPattern: null,
  onStartPreview: null,
  onExitPreview: null,
  onEnterReferenceFreeCam: null,
  onExitReferenceFreeCam: null,
  onGetLiveCameraState: null,
};
const _replaySessionListeners = new Set();

export function notifyActiveReplayTimelineController() {
  for (const fn of _replaySessionListeners) {
    try {
      fn(_activeReplayController);
    } catch (err) {
      console.warn('[replayDirectorConfig] Replay session listener failed:', err);
    }
  }
}

export function setActiveReplayTimelineController(ctrl) {
  _activeReplayController = ctrl;
  notifyActiveReplayTimelineController();
}

export function getActiveReplayTimelineController() {
  return _activeReplayController;
}

export function subscribeActiveReplayTimelineController(listener) {
  if (typeof listener !== 'function') return () => {};
  _replaySessionListeners.add(listener);
  return () => _replaySessionListeners.delete(listener);
}

export function registerReplayDirectorDiagnosticExporter(
  exporterFn,
  parserFn = null,
  windowBuilderFn = null,
  referenceKeyframeExporterFn = null
) {
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

export function registerReplayDirectorPreviewHandlers(handlers = {}) {
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

export function enterActiveReplayDirectorReferenceFreeCam(options = {}) {
  if (typeof _previewHandlers.onEnterReferenceFreeCam === 'function') {
    return _previewHandlers.onEnterReferenceFreeCam(options);
  }
  return false;
}

export function exitActiveReplayDirectorReferenceFreeCam() {
  if (typeof _previewHandlers.onExitReferenceFreeCam === 'function') {
    return _previewHandlers.onExitReferenceFreeCam();
  }
  return false;
}

export function getActiveReplayDirectorLiveCameraState() {
  if (typeof _previewHandlers.onGetLiveCameraState === 'function') {
    return _previewHandlers.onGetLiveCameraState();
  }
  return null;
}

export function exportActiveReplayDirectorReferenceKeyframe(options = {}) {
  const ctrl = options.controller || _activeReplayController;
  if (!ctrl) return null;
  const liveCameraState = options.liveCameraState || getActiveReplayDirectorLiveCameraState();
  if (typeof _referenceKeyframeExporter === 'function') {
    return _referenceKeyframeExporter(ctrl, { ...options, liveCameraState });
  }
  return null;
}

export function exportActiveReplayDirectorDiagnosticPattern(format = 'rcgr', options = {}) {
  const ctrl = options.controller || _activeReplayController;
  if (typeof _diagnosticExporter === 'function') {
    return _diagnosticExporter(ctrl, format, options);
  }
  return null;
}

export function buildActiveReplayDirectorWindowDiagnostic(windowRadius = 15, options = {}) {
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

export async function importActiveReplayDirectorDiagnosticPattern(fileOrInput, options = {}) {
  const fileName =
    options.fileName ||
    (fileOrInput && typeof fileOrInput === 'object' && fileOrInput.name) ||
    'imported.rcgr.gz';

  let parsed = null;
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
    for (const [key, val] of Object.entries(parsed.directorConfig)) {
      if (key in REPLAY_DIRECTOR_CONFIG && typeof val === 'number' && Number.isFinite(val)) {
        REPLAY_DIRECTOR_CONFIG[key] = val;
      }
    }
    for (const fn of directorConfigListeners) {
      try {
        fn({ ...REPLAY_DIRECTOR_CONFIG });
      } catch (err) {
        console.warn('[replayDirectorConfig] Config listener failed:', err);
      }
    }
  }

  const effectiveOptions = {
    useRecordedCsvCamera: Boolean(parsed.hasRecordedCsvRows),
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

export function startActiveReplayDirectorPreview(options = {}) {
  if (typeof _previewHandlers.onStartPreview === 'function') {
    return _previewHandlers.onStartPreview(options);
  }
  return false;
}

export function exitActiveReplayDirectorPreview() {
  if (typeof _previewHandlers.onExitPreview === 'function') {
    return _previewHandlers.onExitPreview();
  }
  if (_activeReplayController?.isActive) {
    _activeReplayController.endReplaySession?.();
    return true;
  }
  return false;
}

export function setActiveReplayDirectorCsvCameraMode(useRecordedCsv) {
  if (!_activeReplayController) return false;
  _activeReplayController.useRecordedCsvCamera = Boolean(useRecordedCsv);
  _activeReplayController._cachedSmoothnessSummary = null;
  _activeReplayController._cachedAnomalyPeaks = null;
  _activeReplayController.refreshCurrentFrameDirectorPose?.();
  notifyActiveReplayTimelineController();
  return _activeReplayController.useRecordedCsvCamera;
}
