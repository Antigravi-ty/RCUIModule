import React, { useState } from 'react';
import {
  Bot,
  Eye,
  Pause,
  Play,
  Radio,
  User,
  UserMinus,
} from 'lucide-react';
import {
  ClientRoomTopBars,
  DoubleConfirmServerButton,
  HostRoomSignalingBar,
  MatchConfigSummaryCard,
  type HostMatchBotPolicy,
  type HostMatchDurationPreset,
  type HostMatchTeamFormat,
  type SignalingHealthState,
} from './OnlineRoomTopStatusBar';

export interface ActiveMatchPlayer {
  id: string;
  name: string;
  pingMs: number;
  team: 'blue' | 'orange';
  isHost?: boolean;
  isSelf?: boolean;
  isBot?: boolean;
}

export interface SpectatorRouteEntry {
  id: string;
  name: string;
  pingMs: number;
  pairId: string;
  /** Which player this spectator is connected through ('Host (Direct P2P)' or a client player name via Daisy Chain) */
  fromPlayer: string;
  isDirectHost?: boolean;
  isViaLocalClient?: boolean;
}

export interface DuringMatchRoomViewProps {
  role: 'host' | 'client';
  roomCode?: string;
  pairId?: string;
  signalingState?: SignalingHealthState;
  onRefreshSignaling?: () => void | Promise<void>;
  players?: ActiveMatchPlayer[];
  onKickPlayer?: (id: string) => void;
  isMatchPaused?: boolean;
  onTogglePause?: () => void;
  teamFormat?: HostMatchTeamFormat;
  botPolicy?: HostMatchBotPolicy;
  durationPreset?: HostMatchDurationPreset;
  customDurationSeconds?: number;
  onOpenNetHud?: () => void;
  onShutdownOrLeave?: () => void;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

const INITIAL_MATCH_PLAYERS: ActiveMatchPlayer[] = [
  { id: 'b-1', name: 'Player_01 (Host)', pingMs: 0, team: 'blue', isHost: true },
  { id: 'b-2', name: 'Aerial_Vortex', pingMs: 28, team: 'blue' },
  { id: 'b-3', name: 'Nexto_Bot_1', pingMs: 0, team: 'blue', isBot: true },
  { id: 'o-1', name: 'OctaneMain_99', pingMs: 22, team: 'orange' },
  { id: 'o-2', name: 'FlipReset_Pro', pingMs: 41, team: 'orange' },
  { id: 'o-3', name: 'Necto_Bot_2', pingMs: 0, team: 'orange', isBot: true },
];

const INITIAL_SPECTATORS: SpectatorRouteEntry[] = [
  {
    id: 'spec-1',
    name: 'Caster_Alpha',
    pingMs: 19,
    pairId: '9B2C',
    fromPlayer: 'OctaneMain_99',
    isDirectHost: false,
    isViaLocalClient: true,
  },
  {
    id: 'spec-2',
    name: 'Scout_Lens',
    pingMs: 34,
    pairId: '4D1E',
    fromPlayer: 'Host (Direct P2P)',
    isDirectHost: true,
    isViaLocalClient: false,
  },
  {
    id: 'spec-3',
    name: 'ReplayWatcher_07',
    pingMs: 27,
    pairId: '8A5F',
    fromPlayer: 'Aerial_Vortex',
    isDirectHost: false,
    isViaLocalClient: true,
  },
];

/**
 * Decoupled Active Match Admin / Room Info View (`online-match-host` & `online-match-client`):
 * - No `Start Playing` / `Start Match`, no `Configure` / `Custom`, no `Switch Team`.
 * - `PLAYERS IN MATCH`: 2 side-by-side columns (`Blue Team` left | `Orange Team` right). Host can Kick/Remove.
 * - `SPECTATING`:
 *   - Host: Sees total spectators + `from player` route (`from Host (Direct P2P)` vs `from <Player> (Daisy Chain)`) for uplink bandwidth diagnostics, with Kick/Remove.
 *   - Client: Only sees spectators relaying through this client (`SPECTATING VIA YOU`), and can actively Remove them.
 * - Pause control:
 *   - Host: `Request to Pause` / `Pause Match`
 *   - Client: `Ask to Pause` (non-authoritative request)
 * - Bottom:
 *   - Host: Double-confirm `Shutdown Server` (`door-stairwell`)
 *   - Client: `Leave Room` (`door-stairwell`)
 */
export const DuringMatchRoomView: React.FC<DuringMatchRoomViewProps> = React.memo(({
  role,
  roomCode = 'RL-8924',
  pairId = '7F3A',
  signalingState: controlledSignaling,
  onRefreshSignaling,
  players: controlledPlayers,
  onKickPlayer,
  isMatchPaused: controlledPaused,
  onTogglePause,
  teamFormat = 'standard',
  botPolicy = 'auto-fill',
  durationPreset = '300',
  customDurationSeconds = 300,
  onShutdownOrLeave,
  onHoverDesc,
  isLight = false,
}) => {
  const isHost = role === 'host';
  const [internalSignaling, setInternalSignaling] = useState<SignalingHealthState>('green');
  const [internalPlayers, setInternalPlayers] = useState<ActiveMatchPlayer[]>(INITIAL_MATCH_PLAYERS);
  const [spectators, setSpectators] = useState<SpectatorRouteEntry[]>(INITIAL_SPECTATORS);
  const [internalPauseRequested, setInternalPauseRequested] = useState<boolean>(false);

  const signalingState = controlledSignaling ?? internalSignaling;
  const setSignalingState = setInternalSignaling;
  const players = controlledPlayers ?? internalPlayers;
  const pauseRequested = controlledPaused ?? internalPauseRequested;

  const bluePlayers = players.filter((p) => p.team === 'blue');
  const orangePlayers = players.filter((p) => p.team === 'orange');

  // Client only sees spectators connected through them; Host sees all spectators
  const visibleSpectators = isHost
    ? spectators
    : spectators.filter((s) => s.isViaLocalClient);

  const handleRemovePlayer = (id: string) => {
    if (onKickPlayer) {
      onKickPlayer(id);
    } else {
      setInternalPlayers((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleRemoveSpectator = (id: string) => {
    setSpectators((prev) => prev.filter((s) => s.id !== id));
  };

  const renderTeamColumn = (
    team: 'blue' | 'orange',
    teamPlayers: ActiveMatchPlayer[]
  ) => {
    const isBlue = team === 'blue';
    const iconColor = isBlue ? 'text-sky-400' : 'text-orange-400';

    return (
      <div
        className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${
          isBlue
            ? isLight
              ? 'bg-sky-50/45 border-sky-200/90'
              : 'bg-sky-950/20 border-sky-500/30'
            : isLight
            ? 'bg-orange-50/45 border-orange-200/90'
            : 'bg-orange-950/20 border-orange-500/30'
        }`}
      >
        <div
          className={`flex items-center justify-between text-[11px] font-mono font-bold ${
            isBlue ? 'text-sky-400' : 'text-orange-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBlue ? 'bg-sky-400' : 'bg-orange-400'
              }`}
            />
            <span>{isBlue ? 'BLUE TEAM' : 'ORANGE TEAM'}</span>
          </span>
          <span>{teamPlayers.length}</span>
        </div>

        <div className="flex flex-col gap-1">
          {teamPlayers.map((p) => {
            const isSelfRow =
              (isHost && p.isHost) || (!isHost && p.id === 'o-1');
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight
                    ? 'bg-white border-neutral-200/90'
                    : 'bg-neutral-950/65 border-neutral-800/90'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {p.isBot ? (
                    <Bot className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                  ) : (
                    <User className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                  )}
                  <span
                    className={`truncate text-[11px] ${
                      isSelfRow
                        ? isLight
                          ? 'font-bold text-neutral-900'
                          : 'font-bold text-white'
                        : isLight
                        ? 'text-neutral-800'
                        : 'text-neutral-200'
                    }`}
                  >
                    {p.name}
                    {!isHost && p.id === 'o-1' ? ' (You)' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-emerald-500 tabular-nums">
                    {p.isBot ? 'Bot' : p.isHost ? 'Host' : `${p.pingMs}ms`}
                  </span>
                  {isHost && !p.isHost && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(p.id)}
                      className="p-0.5 px-1 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-semibold cursor-pointer transition-colors"
                      title="Kick / Remove from match"
                    >
                      Kick
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* 1. Top Status Bar (Host vs Client) */}
      {isHost ? (
        <HostRoomSignalingBar
          roomCode={roomCode}
          signalingState={signalingState}
          onChangeSignalingState={setSignalingState}
          onRefreshSignaling={onRefreshSignaling}
          onHoverDesc={onHoverDesc}
          isLight={isLight}
        />
      ) : (
        <ClientRoomTopBars
          roomCode={roomCode}
          pairId={pairId}
          daisyChainSignaling={signalingState}
          onChangeDaisyChainSignaling={setSignalingState}
          onHoverDesc={onHoverDesc}
          isLight={isLight}
        />
      )}

      {/* 2. PLAYERS IN MATCH (2 Columns: Blue Team | Orange Team, No Switch Team) */}
      <div
        data-ui-element="during-match-players"
        className="flex flex-col gap-1.5"
        onMouseEnter={() =>
          onHoverDesc?.(
            'Players in Match: Split into Blue Team (left) and Orange Team (right). Team switching is locked during active match.'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
      >
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-400">
          <span>PLAYERS IN MATCH</span>
          <span className="text-amber-500">
            {players.length} / 6 · Teams Locked
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {renderTeamColumn('blue', bluePlayers)}
          {renderTeamColumn('orange', orangePlayers)}
        </div>
      </div>

      {/* 3. SPECTATING Section (Host: All + from player route; Client: Only Spectating via You) */}
      <div
        data-ui-element="during-match-spectating"
        className="flex flex-col gap-1.5"
        onMouseEnter={() =>
          onHoverDesc?.(
            isHost
              ? 'Spectating (Host Diagnostics): Shows total spectators and which upstream route (from player via Daisy Chain vs Direct Host P2P) each spectator uses so you can diagnose upload bandwidth and Kick/Remove.'
              : 'Spectating via You: Shows spectators daisy-chained through your client uplink. You can actively Remove them at any time.'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
      >
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {isHost
                ? `SPECTATING (${visibleSpectators.length} Watching)`
                : `SPECTATING VIA YOU (${visibleSpectators.length} Watching)`}
            </span>
          </span>
          <span className="text-[10px]">
            {isHost ? 'Route Diagnostics (from player)' : 'Daisy-Chain Uplink'}
          </span>
        </div>

        <div
          className={`rounded-xl border p-2 flex flex-col gap-1.5 ${
            isLight
              ? 'bg-neutral-50 border-neutral-200/90'
              : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          {visibleSpectators.length > 0 ? (
            visibleSpectators.map((spec) => (
              <div
                key={spec.id}
                className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                  isLight
                    ? 'bg-white border-neutral-200/90'
                    : 'bg-neutral-950/65 border-neutral-800/90'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Radio
                    className={`h-3.5 w-3.5 shrink-0 ${
                      spec.isDirectHost ? 'text-amber-500' : 'text-emerald-400'
                    }`}
                  />
                  <span
                    className={`truncate font-semibold ${
                      isLight ? 'text-neutral-800' : 'text-neutral-200'
                    }`}
                  >
                    {spec.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    #{spec.pairId}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isHost ? (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        spec.isDirectHost
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-sky-500/15 border-sky-500/35 text-sky-400'
                      }`}
                      title={
                        spec.isDirectHost
                          ? 'Direct P2P connection to Host (consumes Host upload bandwidth)'
                          : `Daisy-chained via ${spec.fromPlayer} (zero Host upload overhead)`
                      }
                    >
                      from: {spec.fromPlayer}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      via You ({spec.pingMs}ms)
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveSpectator(spec.id)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold cursor-pointer transition-colors"
                  >
                    <UserMinus className="h-3 w-3" />
                    <span>{isHost ? 'Kick / Remove' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-2 text-center text-[11px] font-mono text-neutral-500">
              {isHost
                ? 'No active spectators watching this match.'
                : 'No spectators currently daisy-chained through your client.'}
            </div>
          )}
        </div>
      </div>

      {/* 4. Read-Only Match Information Card (No Configure / Custom during active match) */}
      <MatchConfigSummaryCard
        title="Match Information"
        teamFormat={teamFormat}
        botPolicy={botPolicy}
        durationPreset={durationPreset}
        customDurationSeconds={customDurationSeconds}
        editable={false}
        onHoverDesc={onHoverDesc}
        isLight={isLight}
      />

      {/* 5. Pause Row: Host = Request to Pause (Pause Match); Client = Ask to Pause */}
      <button
        type="button"
        onClick={() => {
          setInternalPauseRequested((prev) => !prev);
          onTogglePause?.();
        }}
        onMouseEnter={() =>
          onHoverDesc?.(
            isHost
              ? 'Request to Pause: Trigger or resume authoritative match pause.'
              : 'Ask to Pause: Send a non-authoritative pause request notification to the Host.'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
        className={`w-full py-2 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
          pauseRequested
            ? 'bg-amber-500/20 border-amber-500/45 text-amber-400'
            : isLight
            ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
            : 'bg-neutral-800/90 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
        }`}
      >
        {pauseRequested ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Pause className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span>
          {isHost
            ? pauseRequested
              ? 'Match Paused · Click to Resume'
              : 'Request to Pause'
            : pauseRequested
            ? 'Pause Requested (Waiting for Host...)'
            : 'Ask to Pause'}
        </span>
      </button>

      {/* 6. Bottom Row: Host = Double-Confirm Shutdown Server; Client = Leave Room */}
      <DoubleConfirmServerButton
        label={isHost ? 'Shutdown Server' : 'Leave Room'}
        requireDoubleConfirm={isHost}
        onConfirm={onShutdownOrLeave}
        onHoverDesc={onHoverDesc}
        isLight={isLight}
      />
    </div>
  );
});

DuringMatchRoomView.displayName = 'DuringMatchRoomView';
