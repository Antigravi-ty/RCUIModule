import { useSyncExternalStore } from 'react';
import { syncBridge as crossClientSync } from './syncBridge';
import { createExternalStore } from './createExternalStore';

export interface LivePreviewState {
  /** Active live preview ID (e.g. 'ball-trajectory-predictor') or null if none active */
  activePreviewId: string | null;
  /** Whether the preview is currently collapsed to the right-middle dock pill */
  isCollapsed: boolean;
  /** Custom label for the collapsed dock badge */
  dockLabel?: string;
}

const core = createExternalStore<LivePreviewState>(
  crossClientSync.get<LivePreviewState>('store:livePreview', {
    activePreviewId: null,
    isCollapsed: false,
    dockLabel: 'Ball Trajectory Predictor',
  }),
  {
    onNotify: (state) => {
      if (!crossClientSync.isApplyingRemote()) {
        crossClientSync.set('store:livePreview', state);
      }
    },
  }
);

crossClientSync.subscribeKey<LivePreviewState>('store:livePreview', (remote) => {
  if (!remote || typeof remote !== 'object') return;
  core.setState(remote);
});

crossClientSync.onReset((scopePrefix) => {
  if (scopePrefix && !'store:livePreview'.startsWith(scopePrefix)) return;
  core.setState({
    activePreviewId: null,
    isCollapsed: false,
    dockLabel: 'Ball Trajectory Predictor',
  });
});

export const livePreviewStore = {
  getSnapshot: core.getSnapshot,
  subscribe: core.subscribe,
  /** Register or enter a Live Preview session */
  enterPreview: (previewId: string, dockLabel = 'Ball Trajectory Predictor') => {
    core.setState({
      activePreviewId: previewId,
      isCollapsed: false,
      dockLabel,
    });
  },
  /** Toggle collapse/expand state via Tab key or click */
  toggleCollapse: () => {
    const state = core.getSnapshot();
    if (!state.activePreviewId) return;
    core.setState({
      ...state,
      isCollapsed: !state.isCollapsed,
    });
  },
  /** Set explicit collapse state */
  setCollapsed: (collapsed: boolean) => {
    const state = core.getSnapshot();
    if (!state.activePreviewId) return;
    core.setState({
      ...state,
      isCollapsed: collapsed,
    });
  },
  /** Exit Live Preview session completely */
  exitPreview: () => {
    core.setState({
      activePreviewId: null,
      isCollapsed: false,
      dockLabel: undefined,
    });
  },
};

export const useLivePreviewStore = () => {
  const snapshot = useSyncExternalStore(livePreviewStore.subscribe, livePreviewStore.getSnapshot);
  return {
    activePreviewId: snapshot.activePreviewId,
    isCollapsed: snapshot.isCollapsed,
    dockLabel: snapshot.dockLabel,
    enterPreview: livePreviewStore.enterPreview,
    toggleCollapse: livePreviewStore.toggleCollapse,
    setCollapsed: livePreviewStore.setCollapsed,
    exitPreview: livePreviewStore.exitPreview,
  };
};
