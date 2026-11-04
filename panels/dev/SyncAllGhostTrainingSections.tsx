import React from 'react';
import {
  Ghost,
  Pin,
  Trash2,
  ShieldCheck,
  Hand,
  Link2,
  Unlink2,
  X,
} from 'lucide-react';
import type {
  StaticTrainingPackRuntimeHandlers,
  SyncAllTrainingTelemetryState,
  TrainingSyncAuthorityMode,
} from '../../stores/staticTrainingPackStore';
import { quickNotification } from '../../stores/quickNotificationStore';

export const AUTHORITY_MODES: Array<{
  id: TrainingSyncAuthorityMode;
  shortLabel: string;
  desc: string;
}> = [
  {
    id: 'driver-demo',
    shortLabel: '1. Coach Demo',
    desc: 'Active Driver streams 120Hz physics + inputs; Follower watches.',
  },
  {
    id: 'retain-ghost-practice',
    shortLabel: '2. Ghost + Practice',
    desc: 'Pinned Ghost Tape runs 1:1 alongside Student practice on launch.',
  },
  {
    id: 'free-practice',
    shortLabel: '3. Free Practice',
    desc: 'Independent practice with instant Rewind ([ / ]) & Intervene.',
  },
];

export interface SyncAllGhostTapeSectionProps {
  isLight: boolean;
  cardClass: string;
  btnBase: string;
  btnPrimary: string;
  btnSecondary: string;
  syncState: SyncAllTrainingTelemetryState | null;
  runtimeHandlers: StaticTrainingPackRuntimeHandlers;
  ensureInTrainingPlayMode: () => void;
}

export const SyncAllGhostTapeSection: React.FC<SyncAllGhostTapeSectionProps> = ({
  isLight,
  cardClass,
  btnBase,
  btnPrimary,
  btnSecondary,
  syncState,
  runtimeHandlers,
  ensureInTrainingPlayMode,
}) => {
  const ghost = syncState?.ghostTelemetry;
  const transfer = syncState?.transferProgress;
  const ghostEnabled = ghost?.ghostPlaybackEnabled ?? true;
  const ghostPlacement = ghost?.ghostPlacement || 'same';
  const ghostOpacityPct = Math.round((ghost?.ghostOpacity ?? 0.55) * 100);
  const pinnedTapes = ghost?.pinnedTapesMeta || [];

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <Ghost className="h-3.5 w-3.5 text-sky-400" />
          <span>Retained Ghost Tape (幽灵陪跑)</span>
        </div>
        <span className="font-mono text-[10px] opacity-75">
          {ghost?.isRecording
            ? `REC ${ghost.currentRecordingFrames}f`
            : ghost?.hasLastAttemptTape
              ? `Last: ${ghost.lastAttemptFrameCount}f`
              : 'Ready on Launch'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => {
            ensureInTrainingPlayMode();
            const pinned = runtimeHandlers.onRetainDisplayAsGhost?.({
              replaceExisting: true,
              switchToStudentPractice: false,
            });
            if (pinned) {
              quickNotification.info('Pinned attempt as Ghost Tape (Retain Display).');
            } else {
              quickNotification.warning(
                'Drive & launch a shot first to record an attempt.'
              );
            }
          }}
          className={btnPrimary}
        >
          <Pin className="h-3.5 w-3.5" />
          <span>Pin Ghost (Retain)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            ensureInTrainingPlayMode();
            const pinned = runtimeHandlers.onRetainDisplayAsGhost?.({
              replaceExisting: true,
              switchToStudentPractice: true,
            });
            if (pinned) {
              quickNotification.info(
                'Pinned Coach Ghost & switched to Mode 2 (Student Practice)!'
              );
            } else {
              quickNotification.warning(
                'Drive & launch a shot first to record a demo.'
              );
            }
          }}
          className={btnSecondary}
        >
          <Ghost className="h-3.5 w-3.5 text-sky-400" />
          <span>Pin & Handover</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => runtimeHandlers.onToggleGhostPlayback?.(!ghostEnabled)}
          className={
            ghostEnabled
              ? isLight
                ? `${btnBase} bg-sky-600 text-white border-sky-600`
                : `${btnBase} bg-sky-500/25 text-sky-200 border-sky-400/50`
              : btnSecondary
          }
        >
          <Ghost className="h-3.5 w-3.5" />
          <span>{ghostEnabled ? 'Ghost: ON' : 'Ghost: OFF'}</span>
        </button>

        <button
          type="button"
          onClick={() =>
            runtimeHandlers.onSetGhostPlacement?.(
              ghostPlacement === 'same' ? 'opposite' : 'same'
            )
          }
          className={btnSecondary}
        >
          <span>Side: {ghostPlacement === 'same' ? 'Same' : 'Mirror'}</span>
        </button>

        <button
          type="button"
          onClick={() => runtimeHandlers.onClearPinnedGhosts?.()}
          className={btnSecondary}
        >
          <Trash2 className="h-3.5 w-3.5 text-rose-400" />
          <span>Clear ({pinnedTapes.length})</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-[11px] opacity-75 w-24 shrink-0">Ghost Opacity</span>
        <input
          type="range"
          min={15}
          max={95}
          step={5}
          value={ghostOpacityPct}
          onChange={(e) =>
            runtimeHandlers.onSetGhostOpacity?.(Number(e.target.value) / 100)
          }
          className="flex-1 accent-sky-400 cursor-pointer"
        />
        <span className="font-mono text-[11px] w-9 text-right">
          {ghostOpacityPct}%
        </span>
      </div>

      {pinnedTapes.length > 0 && (
        <div className="flex flex-col gap-1 pt-1 border-t border-neutral-700/40">
          {pinnedTapes.map((t) => (
            <div
              key={t.tapeId}
              className="flex items-center justify-between text-[11px] px-2 py-1 rounded bg-sky-500/10 border border-sky-400/25"
            >
              <span className="truncate font-mono">
                {t.label} · {t.authorName} ({t.durationSec.toFixed(2)}s /{' '}
                {t.frameCount}f)
              </span>
              <button
                type="button"
                onClick={() => runtimeHandlers.onRemovePinnedGhost?.(t.tapeId)}
                className="text-rose-400 hover:text-rose-300 cursor-pointer ml-2"
                title="Remove Ghost Tape"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {transfer && !transfer.complete && (
        <div className="text-[10px] font-mono text-amber-300">
          Syncing Ghost Tape: {transfer.receivedChunks}/{transfer.totalChunks} chunks
        </div>
      )}
    </div>
  );
};

export interface SyncAllAuthoritySectionProps {
  isLight: boolean;
  cardClass: string;
  btnBase: string;
  btnSecondary: string;
  syncState: SyncAllTrainingTelemetryState | null;
  runtimeHandlers: StaticTrainingPackRuntimeHandlers;
}

export const SyncAllAuthoritySection: React.FC<SyncAllAuthoritySectionProps> = ({
  isLight,
  cardClass,
  btnBase,
  btnSecondary,
  syncState,
  runtimeHandlers,
}) => {
  const authority = syncState?.authority;
  const activeAuthorityMode: TrainingSyncAuthorityMode =
    authority?.authorityMode || 'driver-demo';
  const isLocalDriver = authority?.isLocalDriver ?? true;
  const isCameraLinked = authority?.isCameraLinked ?? true;
  const autoApprove = authority?.autoApproveControlRequest ?? true;

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>Buddy-Box Authority Mode</span>
        </div>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
          {isLocalDriver
            ? 'ACTIVE DRIVER: YOU'
            : `DRIVER: ${authority?.driverPeerId || 'REMOTE'}`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {AUTHORITY_MODES.map((m) => {
          const active = activeAuthorityMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              title={m.desc}
              onClick={() => runtimeHandlers.onSelectTrainingAuthorityMode?.(m.id)}
              className={
                active
                  ? isLight
                    ? `${btnBase} bg-amber-500 text-white border-amber-600`
                    : `${btnBase} bg-amber-500/25 text-amber-200 border-amber-400/60`
                  : btnSecondary
              }
            >
              <span className="truncate">{m.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => runtimeHandlers.onRequestTrainingControl?.(activeAuthorityMode)}
          className={btnSecondary}
          title="Request or claim Active Driver lease"
        >
          <Hand className="h-3.5 w-3.5 text-amber-400" />
          <span>Take Control</span>
        </button>

        <button
          type="button"
          onClick={() => runtimeHandlers.onTakeBackTrainingControl?.('driver-demo')}
          className={btnSecondary}
          title="Host Coach instant override"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Coach Override</span>
        </button>

        <button
          type="button"
          onClick={() => runtimeHandlers.onSetTrainingCameraLinked?.(!isCameraLinked)}
          className={btnSecondary}
          title="Link or unlink camera from Active Driver"
        >
          {isCameraLinked ? (
            <>
              <Link2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Cam Linked</span>
            </>
          ) : (
            <>
              <Unlink2 className="h-3.5 w-3.5 text-orange-400" />
              <span>Free Look</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between pt-0.5 text-[11px]">
        <span className="opacity-75">Auto-Approve Student Control Requests</span>
        <button
          type="button"
          onClick={() => runtimeHandlers.onSetAutoApproveControlRequest?.(!autoApprove)}
          className={`px-2 py-0.5 rounded font-mono text-[10px] border cursor-pointer ${
            autoApprove
              ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
              : 'bg-neutral-700/40 border-neutral-600 text-neutral-300'
          }`}
        >
          {autoApprove ? 'AUTO-APPROVE: ON' : 'MANUAL APPROVE'}
        </button>
      </div>
    </div>
  );
};
