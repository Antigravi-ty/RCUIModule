import { useEffect, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useNetworkDiagnosticsData } from '../../stores/networkDiagnosticsStore';
import { globalPacingTelemetryRecorder } from '../../stores/pacingTelemetryRecorder';
import { downloadNetworkTelemetryZip } from '../../stores/pacingTelemetryExporter';

export type NetworkSessionMode = 'single-player' | 'online-host' | 'online-client';

export function useNetworkMonitorPanelBinding<TProps extends object>(
  rawProps: TProps
): TProps {
  const props = rawProps as Record<string, any>;
  const { metrics } = useNetworkDiagnosticsData();
  const onlineSession = useAppStore((s) => s.onlineSession);
  const bridge = useAppStore((s) => s.bridge);

  useEffect(() => {
    bridge?.onEnsureNetworkDiagnostics?.();
  }, [bridge]);

  const hasHostRuntime = Boolean(bridge?.onEnsureNetworkDiagnostics || metrics);

  const sessionMode: NetworkSessionMode = onlineSession?.roomId
    ? onlineSession.isHosting
      ? 'online-host'
      : 'online-client'
    : 'single-player';

  const storeSnapshot = useMemo(() => {
    if (!hasHostRuntime) return undefined;
    const raw = metrics as Record<string, any> | undefined;
    return {
      sessionMode,
      rttMs: metrics?.rttMs || 0,
      jitterMs: metrics?.jitterMs || 0,
      leadTicks: raw?.effectiveBuffer ?? metrics?.clientLeadTicks ?? 0,
      physicsRateHz: raw?.physicsRateHz || 120,
      rollbackCount: raw?.rollbackCount ?? metrics?.corrections ?? 0,
      targetBuffer: raw?.targetBuffer || 0,
      serverBuffer: raw?.serverBuffer || 0,
    };
  }, [hasHostRuntime, sessionMode, metrics]);

  if (!hasHostRuntime) {
    return rawProps;
  }

  return {
    ...rawProps,
    sessionMode: props.sessionMode ?? sessionMode,
    snapshot: props.snapshot ?? storeSnapshot,
    onExportLog:
      props.onExportLog ??
      (() => {
        try {
          downloadNetworkTelemetryZip();
        } catch (err: unknown) {
          console.error('[NetworkDiagnostics] Export failed:', err);
        }
      }),
    onClear:
      props.onClear ??
      (() => {
        globalPacingTelemetryRecorder.reset();
      }),
  } as TProps;
}

