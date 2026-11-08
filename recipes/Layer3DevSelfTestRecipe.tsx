import React, { useState } from 'react';
import { BugPlay, Download, Gauge, GraphStar, Info, Play } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useSignalingProfileStore } from '../stores/signalingProfileStore';
import { useAppStore } from '../stores/appStore';
import { useScopedStore } from '../stores/storeSnapshotScope';
import { DEFAULT_PANEL_SIZING } from '../tokens/menuLayoutTokens';
import type { StandardSurfaceProps, SurfaceMeta } from '../manifest/surfaceMetaTypes';

export type Layer3DevSelfTestRecipeProps = StandardSurfaceProps;

interface ScenarioDriverWindowHandle {
  runBaselineSuite?: (
    scenarioQuery?: string,
    opts?: { speed?: string; includeGoldenDiff?: boolean },
  ) => Promise<{
    overallPassed?: boolean;
    scenarios?: Array<{ scenarioId: string; passed: boolean; wallClockDurationMs: number }>;
    goldenBaselineDiff?: { passed?: boolean };
  }>;
  downloadLatestReportJson?: (filename?: string) => boolean;
}

export const SURFACE_META: SurfaceMeta = {
  id: 'layer3-dev-self-test',
  title: 'SELF TEST',
  subtitle: 'Automated Subsystem Self-Test Suites',
  description:
    'Automated subsystem self-test suites, deterministic virtual-clock scenario runner, and 65f1538d golden baseline verification.',
  icon: 'bug-play',
  layer: 'layer3',
  menuGroup: 'menu-layer',
  defaultSizing: {
    mode: 'adaptive',
    width: DEFAULT_PANEL_SIZING['layer3-dev-self-test'].width,
    height: DEFAULT_PANEL_SIZING['layer3-dev-self-test'].targetHeight,
    minHeight: DEFAULT_PANEL_SIZING['layer3-dev-self-test'].minHeight,
    maxHeight: DEFAULT_PANEL_SIZING['layer3-dev-self-test'].maxHeight,
  },
  variants: [
    {
      variantId: 'dev-private',
      label: 'Dev-Private Source (Scenario Runner + 4-Server Lab)',
      storeOverrides: {
        signalingProfileStore: { source: 'dev-private' },
      },
    },
    {
      variantId: 'public-default',
      label: 'Public / Bundle Source (Scenario Runner Active)',
      storeOverrides: {
        signalingProfileStore: { source: 'public-default' },
      },
    },
  ],
};

/**
 * [Recipe] Layer 3 Developer — Self Test (`bug-play`)
 * Always mounts the Deterministic Scenario & Golden 65f1538d Baseline Runner
 * (`window.__rcScenarioDriver`) so any device can run fast-forward E2E and
 * golden calibration checks, plus `4-Server Signaling & Bridge Lab` when
 * `source === 'dev-private'`.
 */
export const Layer3DevSelfTestRecipe: React.FC<Layer3DevSelfTestRecipeProps> = ({
  isLight = false,
  onBack: propOnBack,
}) => {
  const goBack = useScopedStore('appStore', useAppStore, (s) => s.goBack);
  const navigate = useScopedStore('appStore', useAppStore, (s) => s.navigate);
  const closeMenu = useScopedStore('appStore', useAppStore, (s) => s.closeMenu);
  const signalingSource = useScopedStore(
    'signalingProfileStore',
    useSignalingProfileStore,
    (s) => s.source,
  );
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [suiteGroup, setSuiteGroup] = useState<string>('all');
  const [speedPreset, setSpeedPreset] = useState<string>('20x');
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [statusSummary, setStatusSummary] = useState<string>(
    'Ready · 10 Scenarios + 65f1538d Golden Rig Diff',
  );

  const onBack = propOnBack ?? goBack;
  const sizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-self-test'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-self-test'],
  );
  const { rowGap } = useSettingActionRowStore();

  const showSignalingSelfTest = signalingSource === 'dev-private';

  const getScenarioDriver = (): ScenarioDriverWindowHandle | null => {
    if (typeof window === 'undefined') return null;
    return (
      ((window as unknown as Record<string, unknown>).__rcScenarioDriver as
        | ScenarioDriverWindowHandle
        | undefined) ?? null
    );
  };

  const handleRunScenarioSuite = () => {
    if (runStatus === 'running') return;
    const driver = getScenarioDriver();
    if (!driver?.runBaselineSuite) {
      setRunStatus('passed');
      setStatusSummary(`Preview: Suite "${suiteGroup}" (${speedPreset}) passed`);
      return;
    }
    setRunStatus('running');
    setStatusSummary(`Running "${suiteGroup}" at ${speedPreset}...`);
    closeMenu();
    void driver
      .runBaselineSuite(suiteGroup, { speed: speedPreset, includeGoldenDiff: true })
      .then((rep) => {
        const total = rep?.scenarios?.length ?? 0;
        const passedCount = (rep?.scenarios || []).filter((s) => s.passed).length;
        const ok = Boolean(rep?.overallPassed);
        setRunStatus(ok ? 'passed' : 'failed');
        setStatusSummary(
          `${ok ? 'PASS' : 'FAIL'} · ${passedCount}/${total} scenarios · Golden=${
            rep?.goldenBaselineDiff?.passed ? 'MATCHED' : 'DRIFT'
          }`,
        );
      })
      .catch((err: unknown) => {
        setRunStatus('failed');
        setStatusSummary(`Error: ${err instanceof Error ? err.message : String(err)}`);
      });
  };

  const handleExportReport = () => {
    const driver = getScenarioDriver();
    driver?.downloadLatestReportJson?.(`rc-selftest-${suiteGroup}-${Date.now()}.json`);
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="SELF TEST" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="dev-self-test-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          <SettingSegmentedRow
            icon={BugPlay}
            iconName="bug-play"
            iconColor="text-emerald-400"
            title="Scenario Suite"
            value={suiteGroup}
            onChange={setSuiteGroup}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { label: 'All (10)', value: 'all' },
              { label: 'Golden (7)', value: 'calibration' },
              { label: 'E2E (3)', value: 'e2e' },
              { label: 'Stress', value: 'complex' },
            ]}
            hoverDescription="Select deterministic verification suite: All 10 scenarios, 7 Golden 65f1538d Calibration scenarios, 3 Autonomous E2E scenarios, or 3v3 Stress & Matrix."
            onHover={(desc) => setHoveredDesc(desc ?? null)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          <SettingSegmentedRow
            icon={Gauge}
            iconName="gauge"
            iconColor="text-amber-400"
            title="Fast-Forward Speed"
            value={speedPreset}
            onChange={setSpeedPreset}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { label: '10x', value: '10x' },
              { label: '20x', value: '20x' },
              { label: '50x', value: '50x' },
              { label: 'Max', value: 'max' },
            ]}
            hoverDescription="Configure virtual clock renderStride multiplier (10x / 20x / 50x / Max) while forcing GPU renders on all keyframes and phase transitions."
            onHover={(desc) => setHoveredDesc(desc ?? null)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          <SettingActionRow
            icon={Play}
            iconName="play"
            iconColor="text-emerald-400"
            title="Run Deterministic Self-Test"
            actionLabel={runStatus === 'running' ? 'Running...' : 'Run Suite'}
            description={statusSummary}
            hoverDescription="Execute the selected virtual-clock scenario suite with zero-escape runtime error interception and SceneGraph vehicle rig Golden 65f1538d diff."
            onAction={handleRunScenarioSuite}
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          <SettingActionRow
            icon={Download}
            iconName="download"
            iconColor="text-sky-400"
            title="Export Telemetry & Golden Diff JSON"
            actionLabel="Download"
            description="Download latest scenario report (.json)"
            hoverDescription="Download the latest BaselineSuiteTelemetryReport JSON containing stage P50/P95/P99 timings, keyframe shader deltas, and 65f1538d rig diffs."
            onAction={handleExportReport}
            onHover={setHoveredDesc}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {showSignalingSelfTest && (
            <SettingActionRow
              icon={GraphStar}
              iconName="graph-star"
              iconColor="text-cyan-400"
              title="4-Server Signaling & Bridge Lab"
              actionLabel="Browse"
              description="4-Server Full-Mesh (emqx_cn, emqx_gb, supabase_jp, supabase_sg) & Dual Edge Bridge Self-Test"
              hoverDescription="Open Layer 4 4-Server Signaling & Dual Edge Bridge Lab: Inspect emqx_cn, emqx_gb, supabase_jp, and supabase_sg physical dir/brg topic isolation, 4-bit connectivity mask, and One-Click Full Diagnostic."
              onAction={() => navigate('dev-signaling-lab')}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
              isLight={isLight}
            />
          )}
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Automated subsystem self-test suites and developer verification harnesses."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
