import { useAppStore } from '../../stores/appStore';

export function useLayer3TrainingStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const storeGameplay = useAppStore((s) => s.gameplay);
  const storeUpdateGameplay = useAppStore((s) => s.updateGameplay);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    gameplay: props.gameplay ?? storeGameplay,
    onUpdateGameplay:
      props.onUpdateGameplay ??
      ((patch: Record<string, any>) =>
        storeUpdateGameplay({
          ...(patch as any),
          ...(patch.showCarHitbox !== undefined
            ? { showCarHitbox: Boolean(patch.showCarHitbox) }
            : {}),
        })),
  } as TProps;
}

export function useLayer3CameraStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const storeCamera = useAppStore((s) => s.camera);
  const storeUpdateCamera = useAppStore((s) => s.updateCamera);
  const storeResetCamera = useAppStore((s) => s.resetCamera);
  const setLivePreviewCollapsed = useAppStore((s) => s.setLivePreviewCollapsed);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    config: props.config ?? props.settings ?? (props.defaultConfig ? undefined : storeCamera),
    onConfigChange:
      props.onConfigChange ?? ((_next: any, patch: any) => storeUpdateCamera(patch)),
    onReset: props.onReset ?? (() => storeResetCamera()),
    onCollapsePreview:
      props.onCollapsePreview ?? (() => setLivePreviewCollapsed(true)),
  } as TProps;
}

export function useLayer3BallTrajectoryStoreBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const goBack = useAppStore((s) => s.goBack);
  const developerMode = useAppStore((s) => s.developerMode);
  const storeTrajectory = useAppStore((s) => s.trajectory);
  const storeUpdateTrajectory = useAppStore((s) => s.updateTrajectory);
  const setLivePreviewCollapsed = useAppStore((s) => s.setLivePreviewCollapsed);

  return {
    ...rawProps,
    onBack: props.onBack ?? goBack,
    developerMode: props.developerMode ?? developerMode,
    config:
      props.config ??
      props.settings ??
      (props.defaultConfig ? undefined : storeTrajectory),
    onChange: props.onChange ?? ((_next: any, patch: any) => storeUpdateTrajectory(patch)),
    onCollapsePreview:
      props.onCollapsePreview ?? (() => setLivePreviewCollapsed(true)),
  } as TProps;
}
