import React, { useState } from 'react';
import { BugPlay, GraphStar, Info } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { SettingActionRow } from '../compounds/SettingActionRow';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { useSettingActionRowStore } from '../stores/settingRowStore';
import { useSignalingProfileStore } from '../stores/signalingProfileStore';
import { useAppStore } from '../stores/appStore';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';

export interface Layer3DevSelfTestRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onNavigateSignalingLab?: () => void;
  sizing?: PanelSizingConfig;
}

/**
 * [Recipe] Layer 3 Developer — Self Test (`bug-play`)
 * Displays automated self-test suites when the corresponding developer data source is active.
 * - `4-Server Signaling & Bridge Lab` is shown ONLY when `source === 'dev-private'`.
 * - When using an imported bundle (`imported-bundle`) or public/custom service, signaling lab
 *   data is hidden and this view renders a clean empty state.
 */
export const Layer3DevSelfTestRecipe: React.FC<Layer3DevSelfTestRecipeProps> = ({
  isLight = false,
  onBack: propOnBack,
  onNavigateSignalingLab: propOnNavigateSignalingLab,
  sizing: propSizing,
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const signalingSource = useSignalingProfileStore((s) => s.source);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const onBack = propOnBack ?? goBack;
  const onNavigateSignalingLab =
    propOnNavigateSignalingLab ?? (() => navigate('dev-signaling-lab'));

  const storeSizing = useMenuLayoutStore(
    (s) => s.panels?.['layer3-dev-self-test'] ?? DEFAULT_PANEL_SIZING['layer3-dev-self-test']
  );
  const sizing = propSizing ?? storeSizing;
  const { rowGap } = useSettingActionRowStore();

  const showSignalingSelfTest = signalingSource === 'dev-private';

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader title="SELF TEST" onBack={onBack} isLight={isLight} />

      <PanelContent scrollable>
        <div
          data-layout="dev-self-test-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          {showSignalingSelfTest ? (
            <SettingActionRow
              icon={GraphStar}
              iconName="graph-star"
              iconColor="text-cyan-400"
              title="4-Server Signaling & Bridge Lab"
              actionLabel="Browse"
              description="4-Server Full-Mesh (emqx_cn, emqx_gb, supabase_jp, supabase_sg) & Dual Edge Bridge Self-Test"
              hoverDescription="Open Layer 4 4-Server Signaling & Dual Edge Bridge Lab: Inspect emqx_cn, emqx_gb, supabase_jp, and supabase_sg physical dir/brg topic isolation, 4-bit connectivity mask, and One-Click Full Diagnostic."
              onAction={onNavigateSignalingLab}
              onHover={setHoveredDesc}
              onLeave={() => setHoveredDesc(null)}
              isLight={isLight}
            />
          ) : (
            <div
              className={`flex flex-col items-center justify-center py-12 px-4 rounded-xl border text-center select-none ${
                isLight
                  ? 'bg-neutral-100/60 border-neutral-200/80 text-neutral-500'
                  : 'bg-white/[0.03] border-white/[0.07] text-neutral-400'
              }`}
            >
              <BugPlay className="h-7 w-7 mb-2 opacity-40" />
              <span className="text-xs font-semibold">No Self-Test Suites Available</span>
            </div>
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
