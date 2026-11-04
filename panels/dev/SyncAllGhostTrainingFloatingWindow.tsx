import React, { useState } from 'react';
import {
  Radio,
  Users,
  Ghost,
  Pin,
  Trash2,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Link2,
  Unlink2,
  ShieldCheck,
  Hand,
  LogOut,
  Check,
  X,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import {
  useStaticTrainingPackStore,
  type TrainingSyncAuthorityMode,
} from '../../stores/staticTrainingPackStore';
import { quickNotification } from '../../stores/quickNotificationStore';

export interface SyncAllGhostTrainingFloatingWindowProps {
  isLight?: boolean;
}

const AUTHORITY_MODES: Array<{
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

export const SyncAllGhostTrainingFloatingWindow: React.FC<
  SyncAllGhostTrainingFloatingWindowProps
> = React.memo(({ isLight = false }) => {
  const matchMode = useAppStore((s) => s.matchMode);
  const onlineSession = useAppStore((s) => s.onlineSession);
  const bridge = useAppStore((s) => s.bridge);
  const closeMenu = useAppStore((s) => s.closeMenu);

  const activePack = useStaticTrainingPackStore((s) => s.activePack);
  const currentShotIndex = useStaticTrainingPackStore((s) => s.currentShotIndex);
  const sessionMode = useStaticTrainingPackStore((s) => s.sessionMode);
  const syncState = useStaticTrainingPackStore((s) => s.syncAllTrainingState);
  const prevShot = useStaticTrainingPackStore((s) => s.prevShot);
  const nextShot = useStaticTrainingPackStore((s) => s.nextShot);
  const resetCurrentShot = useStaticTrainingPackStore((s) => s.resetCurrentShot);
  const setSessionMode = useStaticTrainingPackStore((s) => s.setSessionMode);
  const runtimeHandlers = useStaticTrainingPackStore((s) => s.runtimeHandlers);

  const [roomId, setRoomId] = useState<string>(
    () => onlineSession?.roomId || 'train-dev-01'
  );
  const [password, setPassword] = useState<string>(
    () => onlineSession?.password || ''
  );
  const [playerName, setPlayerName] = useState<string>(
    () => onlineSession?.playerName || 'DevCoach'
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const authority = syncState?.authority;
  const ghost = syncState?.ghostTelemetry;
  const transfer = syncState?.transferProgress;

  const isInTrainingMode = matchMode === 'static-training-pack';
  const totalShots = activePack?.items?.length || 1;
  const activeAuthorityMode: TrainingSyncAuthorityMode =
    authority?.authorityMode || 'driver-demo';
  const isLocalDriver = authority?.isLocalDriver ?? true;
  const isCameraLinked = authority?.isCameraLinked ?? true;
  const autoApprove = authority?.autoApproveControlRequest ?? true;
  const ghostEnabled = ghost?.ghostPlaybackEnabled ?? true;
  const ghostPlacement = ghost?.ghostPlacement || 'same';
  const ghostOpacityPct = Math.round((ghost?.ghostOpacity ?? 0.55) * 100);
  const pinnedTapes = ghost?.pinnedTapesMeta || [];

  const ensureInTrainingPlayMode = () => {
    if (sessionMode !== 'play') {
      setSessionMode('play');
    }
    if (matchMode !== 'static-training-pack') {
      bridge.onStartStaticTrainingPack?.('play');
    }
    closeMenu();
  };

  const handleHostRoom = async () => {
    const trimmedRoom = roomId.trim() || 'train-dev-01';
    setIsConnecting(true);
    try {
      const ok = await bridge.onHostOnlineWarmup?.({
        roomId: trimmedRoom,
        password: password.trim() || undefined,
        playerName: playerName.trim() || 'CoachHost',
        roomType: 'warmup',
        lobbyMode: true,
      });
      if (ok !== false) {
        ensureInTrainingPlayMode();
        quickNotification.info(`Hosting Online Training Room: ${trimmedRoom}`);
      } else {
        quickNotification.warning('Failed to host room.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClientJoinRoom = async () => {
    const trimmedRoom = roomId.trim() || 'train-dev-01';
    setIsConnecting(true);
    try {
      const ok = await bridge.onJoinOnlineWarmup?.({
        roomId: trimmedRoom,
        password: password.trim() || undefined,
        playerName: playerName.trim() || 'StudentClient',
      });
      if (ok !== false) {
        ensureInTrainingPlayMode();
        quickNotification.info(`Joined Online Training Room: ${trimmedRoom}`);
      } else {
        quickNotification.warning('Failed to join room.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveRoom = async () => {
    await bridge.onLeaveOnlineServer?.();
    ensureInTrainingPlayMode();
    quickNotification.info('Disconnected from online room.');
  };

  const cardClass = `rounded-xl border p-2.5 flex flex-col gap-2 ${
    isLight
      ? 'bg-neutral-100/80 border-neutral-300 text-neutral-900'
      : 'bg-neutral-900/75 border-neutral-800 text-neutral-100'
  }`;

  const btnBase =
    'px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95';
  const btnSecondary = isLight
    ? `${btnBase} bg-white hover:bg-neutral-200 border-neutral-300 text-neutral-800`
    : `${btnBase} bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-100`;
  const btnPrimary = isLight
    ? `${btnBase} bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white`
    : `${btnBase} bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/50 text-cyan-200`;

  return (
    <div className="p-3 flex flex-col gap-2.5 text-xs select-none">
      {/* 1. Training Arena & Shot Bar */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Play className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold truncate">
              {activePack?.title || 'Static Training Pack'}
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold">
              #{String(currentShotIndex + 1).padStart(2, '0')}/{totalShots}
            </span>
          </div>
          {!isInTrainingMode && (
            <button
              type="button"
              onClick={ensureInTrainingPlayMode}
              className={btnPrimary}
            >
              <Play className="h-3 w-3" />
              <span>Enter Arena</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => {
              ensureInTrainingPlayMode();
              prevShot();
            }}
            className={btnSecondary}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev Shot</span>
          </button>
          <button
            type="button"
            onClick={() => {
              ensureInTrainingPlayMode();
              resetCurrentShot();
            }}
            className={btnSecondary}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset [R]</span>
          </button>
          <button
            type="button"
            onClick={() => {
              ensureInTrainingPlayMode();
              nextShot();
            }}
            className={btnSecondary}
          >
            <span>Next Shot</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Online P2P Room (Host / Client Join) */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            <span>Experimental P2P Training Room</span>
          </div>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              onlineSession?.signalingConnected
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                : 'bg-neutral-500/10 border-neutral-500/30 opacity-70'
            }`}
          >
            {onlineSession?.signalingConnected
              ? onlineSession.isHosting
                ? `HOST (${onlineSession.connectedPeers?.length || 0} peers)`
                : 'CLIENT CONNECTED'
              : 'OFFLINE / LOCAL'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
            className={`px-2 py-1 rounded border text-[11px] font-mono ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-950 border-neutral-700 text-neutral-100'
            }`}
          />
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Key (opt)"
            className={`px-2 py-1 rounded border text-[11px] font-mono ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-950 border-neutral-700 text-neutral-100'
            }`}
          />
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Name"
            className={`px-2 py-1 rounded border text-[11px] ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-950 border-neutral-700 text-neutral-100'
            }`}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            disabled={isConnecting}
            onClick={handleHostRoom}
            className={btnPrimary}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Host Room</span>
          </button>
          <button
            type="button"
            disabled={isConnecting}
            onClick={handleClientJoinRoom}
            className={btnPrimary}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Client Join</span>
          </button>
          <button
            type="button"
            onClick={handleLeaveRoom}
            className={btnSecondary}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Pending Pairing Approvals for Host */}
        {Array.isArray(onlineSession?.pendingPairingRequests) &&
          onlineSession.pendingPairingRequests.length > 0 && (
            <div className="flex flex-col gap-1 pt-1 border-t border-neutral-700/50">
              {onlineSession.pendingPairingRequests.map((req) => (
                <div
                  key={req.peerId}
                  className="flex items-center justify-between gap-2 text-[11px] bg-amber-500/10 border border-amber-400/30 rounded px-2 py-1"
                >
                  <span className="truncate font-semibold">
                    Join Req: {req.peerName} ({req.pairingCode})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => bridge.onApprovePendingPeer?.(req.peerId)}
                      className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                      title="Approve Peer"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => bridge.onDeclinePendingPeer?.(req.peerId)}
                      className="p-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                      title="Decline Peer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* 3. Retained Ghost Tape (幽灵陪跑 — Retain Display) */}
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

        {/* Opacity Slider */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[11px] opacity-75 w-24 shrink-0">
            Ghost Opacity
          </span>
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

        {/* Active Pinned Tapes List */}
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
            Syncing Ghost Tape: {transfer.receivedChunks}/{transfer.totalChunks}{' '}
            chunks
          </div>
        )}
      </div>

      {/* 4. Buddy-Box Authority & Lease Switcher */}
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Buddy-Box Authority Mode</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
            {isLocalDriver ? 'ACTIVE DRIVER: YOU' : `DRIVER: ${authority?.driverPeerId || 'REMOTE'}`}
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
    </div>
  );
});

SyncAllGhostTrainingFloatingWindow.displayName =
  'SyncAllGhostTrainingFloatingWindow';
