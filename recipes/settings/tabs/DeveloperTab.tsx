import React, { useState } from 'react';
import {
  Sliders,
  ArrowRight,
  PackageOpen,
  BookCheck,
  BugPlay,
  CircleDot,
  AlertTriangle,
  Scan,
  Bot,
  Radio,
  UserCog,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { SettingSegmentedRow } from '../../../compounds/SettingSegmentedRow';
import { SettingToggleRow } from '../../../compounds/SettingToggleRow';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import { useAppStore } from '../../../stores/appStore';
import {
  useSignalingProfileStore,
  type SignalingRelayMatchPolicyMode,
} from '../../../stores/signalingProfileStore';
import { useViewportStore, viewportStore } from '../../../stores/viewportStore';
import {
  getBallVisualConfig,
  updateBallVisualConfig,
} from '../../../stores/ballVisualStore';
import { BOTS_LOADOUT_PRESET } from '../../../stores/devFloatingPresets';
import { FloatingWindowCard } from '../components/FloatingWindowCard';
import { DeveloperProfileExportSection } from '../components/DeveloperProfileExportSection';
import type { BallOpacityMode } from './GameplayTab';

export interface DeveloperTabProps {
  isLight?: boolean;
  onNavigateRoute?: (route: string) => void;
  onHover?: (desc: string) => void;
  onLeave?: () => void;
}

/**
 * [Layer 2] Developer Settings Tab
 * Streamlined single-line rows matching the RCUIModule visual rhythm:
 * 1. `Sandboxes` (`package-open` icon, `Browse →`) — directly opens the isolated subsystem selection list (01–07 including Experimental Multiple Bots)
 * 2. `Active Tuners` (`sliders` icon, `Browse →`) — active calibration tools, floating tuners, Advanced Audio & Event & Trigger Rules
 * 3. `Calibrated Presets` (`book-check` icon, `Browse →`) — tuners whose baseline parameters have been calibrated and solidified
 * 4. `Self Test` (`bug-play` icon, `Browse →`) — developer self-test suites (4-Server Signaling & Bridge Lab when loaded in dev mode)
 * 5. `Remote Profile Management` (`user-cog` icon, `Browse →`) — Set Others Profile (`SETTINGS # <alias>`) & Manage Accounts
 * 6. `Bots Loadout` (`bot` icon, `Spawn`) — floating window for multi-select bot loadout pools (Car GLB models, Paint, Boost Trail, Boost Audio, Anthem)
 * 7. `Ball Opacity` (`circle-dot` icon) — single-line 70% / 100% / Custom segmented switch
 * 8. `Observe Safe Area Boundary` (`scan` icon) — single-line toggle switch
 * 9. `Under Development` (`alert-triangle` icon, `Browse →`, placed at the very bottom in red/rose with extra top spacing `underDevelopmentTopMargin`)
 */
export const DeveloperTab: React.FC<DeveloperTabProps> = ({
  isLight = false,
  onNavigateRoute,
  onHover,
  onLeave,
}) => {
  const navigate = useAppStore((s) => s.navigate);
  const { showSafeAreaHud } = useViewportStore();
  const setShowSafeAreaHud = viewportStore.setShowSafeAreaHud;
  const relayMatchPolicy = useSignalingProfileStore((s) => s.relayMatchPolicy);
  const setRelayMatchPolicy = useSignalingProfileStore((s) => s.setRelayMatchPolicy);

  const navigateRoute = (route: string) => {
    if (onNavigateRoute) {
      onNavigateRoute(route);
    } else {
      navigate(route as Parameters<typeof navigate>[0]);
    }
  };

  const [ballOpacityMode, setBallOpacityMode] = useState<BallOpacityMode>(() => {
    const op = getBallVisualConfig()?.opacity ?? 1.0;
    const pct = Math.round(op * 100);
    return pct === 100 ? '100' : pct === 70 ? '70' : 'custom';
  });

  const handleBallOpacityChange = (next: BallOpacityMode) => {
    setBallOpacityMode(next);
    if (next === '100' || next === 'solid') {
      updateBallVisualConfig({ opacity: 1.0 });
    } else if (next === '70' || next === 'ghost') {
      updateBallVisualConfig({ opacity: 0.7 });
    } else if (next === 'hidden') {
      updateBallVisualConfig({ opacity: 0.05 });
    }
  };

  const handleObserveSafeAreaChange = (checked: boolean) => {
    setShowSafeAreaHud(checked);
  };

  const {
    rowGap,
    buttonFontSize,
    buttonPaddingX,
    buttonPaddingY,
    buttonRadius,
    showButtonArrow,
    underDevelopmentTopMargin,
  } = useSettingActionRowStore();

  return (
    <div
      data-layout="developer-settings-list"
      className="flex flex-col w-full"
      style={{ gap: `${rowGap}px` }}
    >
      {/* 1. Sandboxes (Directly opens Subsystem Isolation & Multi-Bots Selection) */}
      <SettingActionRow
        icon={PackageOpen}
        iconName="package-open"
        iconColor="text-amber-400"
        title="Sandboxes"
        actionLabel="Browse"
        description="Subsystem Isolation & MVP Lab (01–07) and Experimental Multiple Bots Mode"
        hoverDescription="Sandboxes: Choose which isolated subsystem or sandbox scene (Probes, Multi-World Ghost, State Replay, 90s Match, Goal Replay, Kickoff Duel, Demolish Respawn, or Experimental Multiple Bots) you want to test."
        onAction={() => navigateRoute('dev-sandboxes')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 2. Active Tuners */}
      <SettingActionRow
        icon={Sliders}
        iconName="sliders"
        iconColor="text-sky-400"
        title="Active Tuners"
        actionLabel="Browse"
        description="Vehicle Offsets, Goal Volume, Reachability, Kickoff PPO, Audio & Event & Trigger Rules"
        hoverDescription="Active Tuners: Frequently accessed live calibration tools, floating window spawners, vehicle offsets, reachability, kickoff PPO, advanced audio, and event & trigger rules."
        onAction={() => navigateRoute('dev-active-tuners')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3. Calibrated Presets */}
      <SettingActionRow
        icon={BookCheck}
        iconName="book-check"
        iconColor="text-emerald-400"
        title="Calibrated Presets"
        actionLabel="Browse"
        description="Atmosphere & FX, Vehicle Global Surfaces, Driftwoods, Boost Pad & Name Tag"
        hoverDescription="Calibrated Presets: Archive of completed tuners whose parameters have already been calibrated and solidified (Atmosphere & FX, Vehicle Global Surfaces, Driftwoods, Boost Pad & Name Tag)."
        onAction={() => navigateRoute('dev-calibrated-presets')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3a. Self Test */}
      <SettingActionRow
        icon={BugPlay}
        iconName="bug-play"
        iconColor="text-cyan-400"
        title="Self Test"
        actionLabel="Browse"
        description="Automated subsystem self-test suites and verification harnesses"
        hoverDescription="Self Test: Browse automated diagnostic and self-test suites available for the active environment."
        onAction={() => navigateRoute('dev-self-test')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3b. Remote Profile Management (Set Others Profile & Manage Accounts) */}
      <SettingActionRow
        icon={UserCog}
        iconName="user-cog"
        iconColor="text-violet-400"
        title="Remote Profile Management"
        actionLabel="Browse"
        description="Set Others Profile (SETTINGS # alias) & Manage Cloud Accounts (username / password / alias)"
        hoverDescription="Remote Profile Management: Remotely tune another user's settings & active floating windows in real time, or manage plaintext cloud user accounts."
        onAction={() => navigateRoute('dev-remote-profile')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 3c. Bots Loadout Floating Window */}
      <FloatingWindowCard
        preset={BOTS_LOADOUT_PRESET}
        icon={Bot}
        iconColor="text-amber-400"
        badge="3 GLB Default · Multi-Select"
        badgeClass="bg-amber-500/15 border-amber-500/30 text-amber-400"
        description="Configure multi-select Bot Loadout randomizer pools (Car GLB models, Metallic paint, Cartoon boost, Standard boost audio, Random TrainStation anthem)"
        hoverTooltip="Bots Loadout: Spawn floating window to configure multi-select randomizable bot loadout pools for Exhibition and Auto-Fill."
        onHover={(desc) => onHover?.(desc)}
        onLeave={() => onLeave?.()}
        isLight={isLight}
      />

      {/* 4. Ball Opacity (70% / 100% / Custom) */}
      <SettingSegmentedRow
        icon={CircleDot}
        iconName="circle-dot"
        title="Ball Opacity"
        description="70% translucent · 100% opaque (default) · Custom (via Active Tuners)"
        value={ballOpacityMode}
        onChange={(v) => handleBallOpacityChange(v as BallOpacityMode)}
        options={[
          { value: '70', label: '70%' },
          { value: '100', label: '100%' },
          { value: 'custom', label: 'Custom' },
        ]}
        hoverDescription="Ball Opacity: Quickly toggle ball opacity between 70% translucent, 100% opaque (default), or Custom (custom values are calibrated inside Active Tuners)."
        onHover={(desc) => desc && onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 5. Observe Safe Area Boundary */}
      <SettingToggleRow
        icon={Scan}
        iconName="scan"
        title="Observe Safe Area Boundary"
        description="Display green safe area outline, 18:9 canonical zone, and floating telemetry calibration pill"
        checked={showSafeAreaHud}
        onChange={handleObserveSafeAreaChange}
        hoverDescription="Observe Safe Area Boundary: Displays boundary guides and bottom telemetry pill to observe and calibrate UI scaling and bezel margins in real-time."
        onHover={(desc) => desc && onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 5a. Signaling Match Relay Policy */}
      <SettingSegmentedRow
        icon={Radio}
        iconName="radio"
        title="Signaling Match Relay Policy"
        description="Smart Prune keeps active player relays + probed EMQX · Keep All keeps all probed relays open"
        value={relayMatchPolicy}
        onChange={(v) => setRelayMatchPolicy(v as SignalingRelayMatchPolicyMode)}
        options={[
          { value: 'smart-prune', label: 'Smart Prune' },
          { value: 'keep-all-probed', label: 'Keep All' },
        ]}
        hoverDescription="Signaling Match Relay Policy: Controls whether Host pauses unused non-EMQX relays during an active Match (Smart Prune, default) or keeps all probed relays open."
        onHover={(desc) => desc && onHover?.(desc)}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 5b. Export Time-Bound .rctbnspib Credential Bundle */}
      <DeveloperProfileExportSection
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
      />

      {/* 6. Under Development (Moved to the very bottom, styled in red/rose with configurable top spacing) */}
      <SettingActionRow
        icon={AlertTriangle}
        iconColor={isLight ? 'text-rose-600' : 'text-rose-400'}
        title={
          <span className={isLight ? 'text-rose-700' : 'text-rose-400'}>
            Under Development
          </span>
        }
        description="Unstable staging workspace: Three-Wheeler (Tricycle / Psyclops), Throwback Stadium & Per-Car Boost"
        hoverDescription="Under Development: Unstable staging workspace for early experimental prototypes (Three-Wheeler Tricycle physics, Throwback Stadium 36 CMF & GLB, and Per-Car Boost mechanics)."
        onAction={() => navigateRoute('dev-under-development')}
        onHover={onHover}
        onLeave={onLeave}
        isLight={isLight}
        style={{
          marginTop: `${Math.max(0, underDevelopmentTopMargin)}px`,
        }}
        className={
          isLight
            ? '!bg-rose-500/[0.06] hover:!bg-rose-500/[0.12] !border-rose-500/25'
            : '!bg-rose-500/[0.08] hover:!bg-rose-500/[0.14] !border-rose-500/25'
        }
        rightSlot={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateRoute('dev-under-development');
            }}
            style={{
              fontSize: `${buttonFontSize}px`,
              paddingLeft: `${buttonPaddingX}px`,
              paddingRight: `${buttonPaddingX}px`,
              paddingTop: `${buttonPaddingY}px`,
              paddingBottom: `${buttonPaddingY}px`,
              borderRadius: `${Math.max(0, buttonRadius)}px`,
            }}
            className={`shrink-0 font-semibold border transition-all duration-150 cursor-pointer inline-flex items-center gap-1.5 leading-tight active:scale-95 whitespace-nowrap ${
              isLight
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-700'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300'
            }`}
          >
            <span>Browse</span>
            {showButtonArrow && (
              <ArrowRight
                style={{
                  width: `${Math.max(12, buttonFontSize + 1)}px`,
                  height: `${Math.max(12, buttonFontSize + 1)}px`,
                }}
                className="opacity-80 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            )}
          </button>
        }
      />
    </div>
  );
};
