import React, { useState } from 'react';
import {
  Gamepad2,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ClientRoomTopBars,
  DoubleConfirmServerButton,
  HostRoomSignalingBar,
  MatchConfigSummaryCard,
  type SignalingHealthState,
} from './OnlineRoomTopStatusBar';
import {
  MatchLobbyTeamRosterSection,
  type LobbyPlayerSlot,
  type LobbyTeamAssignment,
} from './MatchLobbyTeamRosterSection';
import type {
  HostMatchBotPolicy,
  HostMatchDurationPreset,
  HostMatchTeamFormat,
} from '../Layer3HostMatchRecipe';

export type { LobbyPlayerSlot, LobbyTeamAssignment };

export interface MatchLobbyRoomViewProps {
  role: 'host' | 'client';
  roomCode?: string;
  pairId?: string;
  signalingState?: SignalingHealthState;
  onRefreshSignaling?: () => void | Promise<void>;
  localTeam?: LobbyTeamAssignment;
  onSwitchTeam?: (team: LobbyTeamAssignment) => void;
  peers?: LobbyPlayerSlot[];
  onKickPeer?: (peerId: string) => void;
  defaultTeamFormat?: HostMatchTeamFormat;
  defaultBotPolicy?: HostMatchBotPolicy;
  defaultDurationPreset?: HostMatchDurationPreset;
  defaultCustomDurationSeconds?: number;
  zeroGProbes?: boolean;
  onToggleZeroGProbes?: () => void;
  testSfx?: boolean;
  onToggleTestSfx?: () => void;
  onResetBall?: () => void;
  onStartMatch?: () => void;
  onEnterMatch?: () => void;
  onOpenNetHud?: () => void;
  onNavigateAdvancedSettings?: () => void;
  onStopOrLeave?: () => void;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

const INITIAL_PEERS: LobbyPlayerSlot[] = [
  { id: 'peer-1', name: 'OctaneMain_99', pingMs: 22, team: 'orange' },
  { id: 'peer-2', name: 'Aerial_Vortex', pingMs: 36, team: 'neutral' },
];

const TEAM_SLOTS_PER_SIDE: Record<HostMatchTeamFormat, number> = {
  duel: 1,
  doubles: 2,
  standard: 3,
};

/**
 * Decoupled Match Lobby Content (`match-lobby-host` & `match-lobby-client`).
 */
export const MatchLobbyRoomView: React.FC<MatchLobbyRoomViewProps> = React.memo(({
  role,
  roomCode = 'RL-8924',
  pairId = '7F3A',
  signalingState: controlledSignaling,
  onRefreshSignaling,
  localTeam: controlledLocalTeam,
  onSwitchTeam,
  peers: controlledPeers,
  onKickPeer,
  defaultTeamFormat = 'doubles',
  defaultBotPolicy = 'auto-fill',
  defaultDurationPreset = '300',
  defaultCustomDurationSeconds = 180,
  zeroGProbes: controlledZeroGProbes,
  onToggleZeroGProbes,
  testSfx: controlledTestSfx,
  onToggleTestSfx,
  onResetBall,
  onStartMatch,
  onEnterMatch,
  onOpenNetHud,
  onNavigateAdvancedSettings,
  onStopOrLeave,
  onHoverDesc,
  isLight = false,
}) => {
  const isHost = role === 'host';
  const [internalSignaling, setInternalSignaling] = useState<SignalingHealthState>('green');
  const [internalLocalTeam, setInternalLocalTeam] = useState<LobbyTeamAssignment>('blue');
  const [internalPeers, setInternalPeers] = useState<LobbyPlayerSlot[]>(INITIAL_PEERS);
  const [rosterLayout, setRosterLayout] = useState<'stacked' | 'columns'>('stacked');

  const signalingState = controlledSignaling ?? internalSignaling;
  const setSignalingState = setInternalSignaling;
  const localTeam = controlledLocalTeam ?? internalLocalTeam;
  const setLocalTeam = (team: LobbyTeamAssignment) => {
    setInternalLocalTeam(team);
    onSwitchTeam?.(team);
  };
  const peers = controlledPeers ?? internalPeers;

  const [teamFormat, setTeamFormat] = useState<HostMatchTeamFormat>(defaultTeamFormat);
  const [botPolicy, setBotPolicy] = useState<HostMatchBotPolicy>(defaultBotPolicy);
  const [durationPreset, setDurationPreset] = useState<HostMatchDurationPreset>(
    defaultDurationPreset
  );
  const [customDurationSeconds, setCustomDurationSeconds] = useState<number>(
    defaultCustomDurationSeconds
  );
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [enteredArena, setEnteredArena] = useState<boolean>(false);

  const [internalZeroGProbes, setInternalZeroGProbes] = useState(false);
  const [internalTestSfx, setInternalTestSfx] = useState(false);
  const [ballResetFlash, setBallResetFlash] = useState(false);
  const zeroGProbes = controlledZeroGProbes ?? internalZeroGProbes;
  const testSfx = controlledTestSfx ?? internalTestSfx;

  const slotsPerSide = TEAM_SLOTS_PER_SIDE[teamFormat];
  const maxPlayers = slotsPerSide * 2;

  const selfEntry: LobbyPlayerSlot = {
    id: 'self',
    name: isHost ? 'Player_01 (You · Host)' : 'Player_01 (You)',
    pingMs: isHost ? 0 : 18,
    team: localTeam,
    isHost,
    isSelf: true,
  };

  const hostEntryForClient: LobbyPlayerSlot[] =
    isHost || controlledPeers !== undefined
      ? []
      : [{ id: 'host-peer', name: 'Striker_Host', pingMs: 18, team: 'blue', isHost: true }];

  const allHumans: LobbyPlayerSlot[] = [selfEntry, ...hostEntryForClient, ...peers];

  const humanBlue = allHumans.filter((p) => p.team === 'blue');
  const humanNeutral = allHumans.filter((p) => p.team === 'neutral');
  const humanOrange = allHumans.filter((p) => p.team === 'orange');

  const botFillingActive = botPolicy !== 'none';
  const blueBotsNeeded = botFillingActive ? Math.max(0, slotsPerSide - humanBlue.length) : 0;
  const orangeBotsNeeded = botFillingActive ? Math.max(0, slotsPerSide - humanOrange.length) : 0;

  const blueBotSlots: LobbyPlayerSlot[] = Array.from({ length: blueBotsNeeded }, (_, i) => ({
    id: `bot-blue-${i}`,
    name: `Nexto_Bot_${i + 1}`,
    pingMs: 0,
    team: 'blue',
    isBot: true,
    botLabel: botPolicy === 'vs-ai' ? 'AI · Pre-assigned' : 'Bot · Auto-Fill',
  }));

  const orangeBotSlots: LobbyPlayerSlot[] = Array.from({ length: orangeBotsNeeded }, (_, i) => ({
    id: `bot-orange-${i}`,
    name: `Necto_Bot_${i + 1}`,
    pingMs: 0,
    team: 'orange',
    isBot: true,
    botLabel: botPolicy === 'vs-ai' ? 'AI · Pre-assigned' : 'Bot · Auto-Fill',
  }));

  const blueRoster = [...humanBlue, ...blueBotSlots];
  const neutralRoster = humanNeutral;
  const orangeRoster = [...humanOrange, ...orangeBotSlots];

  const handleRemovePeer = (peerId: string) => {
    if (onKickPeer) {
      onKickPeer(peerId);
    } else {
      setInternalPeers((prev) => prev.filter((p) => p.id !== peerId));
    }
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

      {/* 2 & 3. Players in Room + 3-Way Team Switcher */}
      <MatchLobbyTeamRosterSection
        isLight={isLight}
        isHost={isHost}
        localTeam={localTeam}
        setLocalTeam={setLocalTeam}
        rosterLayout={rosterLayout}
        setRosterLayout={setRosterLayout}
        slotsPerSide={slotsPerSide}
        maxPlayers={maxPlayers}
        humanCount={allHumans.length}
        botCount={blueBotSlots.length + orangeBotSlots.length}
        blueRoster={blueRoster}
        neutralRoster={neutralRoster}
        orangeRoster={orangeRoster}
        onRemovePeer={handleRemovePeer}
        onHoverDesc={onHoverDesc}
      />

      {/* 4. Primary Action Row: Big Start Match / Start Playing (Enter Match) + Configure (Host only) */}
      <div className="flex items-center gap-2">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={onStartMatch}
              onMouseEnter={() =>
                onHoverDesc?.(
                  'Start Match: Transition the room from Lobby into Regulation Match for all connected peers.'
                )
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className="flex-1 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Match</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEnteredArena((prev) => !prev);
                onEnterMatch?.();
              }}
              onMouseEnter={() =>
                onHoverDesc?.('Start Playing (Enter Match): Manually spawn your car into the lobby arena.')
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                enteredArena
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>{enteredArena ? 'In Arena' : 'Start Playing'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingConfig((prev) => !prev)}
              onMouseEnter={() =>
                onHoverDesc?.(
                  'Configure (Edit): Adjust Team Format, Bot Fill Policy, and Match Duration directly from the lobby.'
                )
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isEditingConfig
                  ? 'bg-sky-500 text-white border-sky-400'
                  : isLight
                  ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
              <span>Configure</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEnteredArena((prev) => !prev);
              onEnterMatch?.();
            }}
            onMouseEnter={() =>
              onHoverDesc?.('Start Playing (Enter Match): Manually enter the lobby arena with your selected team.')
            }
            onMouseLeave={() => onHoverDesc?.(null)}
            className="w-full py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{enteredArena ? 'Entered Match Arena · Playing' : 'Start Playing (Enter Match)'}</span>
          </button>
        )}
      </div>

      {/* 5. Information Card */}
      <MatchConfigSummaryCard
        title="Current Configuration"
        teamFormat={teamFormat}
        onChangeTeamFormat={setTeamFormat}
        botPolicy={botPolicy}
        onChangeBotPolicy={setBotPolicy}
        durationPreset={durationPreset}
        onChangeDurationPreset={setDurationPreset}
        customDurationSeconds={customDurationSeconds}
        onChangeCustomDurationSeconds={setCustomDurationSeconds}
        editable={isHost}
        isEditing={isHost && isEditingConfig}
        onToggleEditing={isHost ? () => setIsEditingConfig((p) => !p) : undefined}
        onNavigateAdvancedSettings={isHost ? onNavigateAdvancedSettings : undefined}
        onHoverDesc={onHoverDesc}
        isLight={isLight}
      />

      {/* 6. Host 4-Button Utility Strip: Probes | SFX | Reset Ball | Net HUD */}
      {isHost && (
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setInternalZeroGProbes((v) => !v);
              onToggleZeroGProbes?.();
            }}
            onMouseEnter={() => onHoverDesc?.('Probes: Toggle 0G physics probes in the lobby arena.')}
            onMouseLeave={() => onHoverDesc?.(null)}
            className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              zeroGProbes
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            Probes: {zeroGProbes ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => {
              setInternalTestSfx((v) => !v);
              onToggleTestSfx?.();
            }}
            onMouseEnter={() => onHoverDesc?.('SFX: Broadcast synchronized audio test chime across peers.')}
            onMouseLeave={() => onHoverDesc?.(null)}
            className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              testSfx
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-600'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
            }`}
          >
            SFX: {testSfx ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => {
              onResetBall?.();
              setBallResetFlash(true);
              setTimeout(() => setBallResetFlash(false), 600);
            }}
            onMouseEnter={() => onHoverDesc?.('Reset Ball: Reset ball to center kickoff anchor.')}
            onMouseLeave={() => onHoverDesc?.(null)}
            className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              ballResetFlash
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
            }`}
          >
            {ballResetFlash ? 'Ball Reset!' : 'Reset Ball'}
          </button>

          <button
            type="button"
            onClick={onOpenNetHud}
            onMouseEnter={() => onHoverDesc?.('Net HUD: Open Network & P2P Diagnostics Floating HUD.')}
            onMouseLeave={() => onHoverDesc?.(null)}
            className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer"
          >
            Net HUD ↗
          </button>
        </div>
      )}

      {/* 7. Bottom Row: Stop Server (Host) / Leave Room (Client) */}
      <DoubleConfirmServerButton
        label={isHost ? 'Stop Server' : 'Leave Room'}
        requireDoubleConfirm={false}
        onConfirm={onStopOrLeave}
        onHoverDesc={onHoverDesc}
        isLight={isLight}
      />
    </div>
  );
});

MatchLobbyRoomView.displayName = 'MatchLobbyRoomView';
