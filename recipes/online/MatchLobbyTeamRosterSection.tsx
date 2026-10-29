import React from 'react';
import { Bot, Check, Columns3, Rows3, User, UserMinus } from 'lucide-react';

export type LobbyTeamAssignment = 'blue' | 'neutral' | 'orange';

export interface LobbyPlayerSlot {
  id: string;
  name: string;
  pingMs: number;
  team: LobbyTeamAssignment;
  isHost?: boolean;
  isSelf?: boolean;
  isBot?: boolean;
  botLabel?: string;
}

export interface MatchLobbyTeamRosterSectionProps {
  isLight: boolean;
  isHost: boolean;
  localTeam: LobbyTeamAssignment;
  setLocalTeam: (team: LobbyTeamAssignment) => void;
  rosterLayout: 'stacked' | 'columns';
  setRosterLayout: React.Dispatch<React.SetStateAction<'stacked' | 'columns'>>;
  slotsPerSide: number;
  maxPlayers: number;
  humanCount: number;
  botCount: number;
  blueRoster: LobbyPlayerSlot[];
  neutralRoster: LobbyPlayerSlot[];
  orangeRoster: LobbyPlayerSlot[];
  onRemovePeer: (peerId: string) => void;
  onHoverDesc?: (desc: string | null) => void;
}

export const MatchLobbyTeamRosterSection: React.FC<MatchLobbyTeamRosterSectionProps> = React.memo(
  ({
    isLight,
    isHost,
    localTeam,
    setLocalTeam,
    rosterLayout,
    setRosterLayout,
    slotsPerSide,
    maxPlayers,
    humanCount,
    botCount,
    blueRoster,
    neutralRoster,
    orangeRoster,
    onRemovePeer,
    onHoverDesc,
  }) => {
    const renderSlotRow = (slot: LobbyPlayerSlot, teamColor: LobbyTeamAssignment) => {
      const iconColorClass =
        teamColor === 'blue'
          ? 'text-sky-400'
          : teamColor === 'orange'
          ? 'text-orange-400'
          : 'text-neutral-400';

      return (
        <div
          key={slot.id}
          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
            slot.isBot
              ? isLight
                ? 'bg-neutral-100/70 border-dashed border-neutral-300 text-neutral-600'
                : 'bg-neutral-900/40 border-dashed border-neutral-800 text-neutral-400'
              : slot.isSelf
              ? teamColor === 'blue'
                ? 'bg-sky-500/10 border-sky-500/35'
                : teamColor === 'orange'
                ? 'bg-orange-500/10 border-orange-500/35'
                : isLight
                ? 'bg-neutral-200/70 border-neutral-300'
                : 'bg-neutral-800/70 border-neutral-700'
              : isLight
              ? 'bg-white border-neutral-200/90'
              : 'bg-neutral-950/60 border-neutral-800/90'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {slot.isBot ? (
              <Bot className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
            ) : (
              <User className={`h-3.5 w-3.5 shrink-0 ${iconColorClass}`} />
            )}
            <span
              className={`truncate ${
                slot.isSelf
                  ? isLight
                    ? 'font-bold text-neutral-900'
                    : 'font-bold text-white'
                  : isLight
                  ? 'text-neutral-800'
                  : 'text-neutral-200'
              }`}
            >
              {slot.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {slot.isBot ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 font-semibold">
                {slot.botLabel}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 tabular-nums">
                {slot.isHost ? '0ms · Host' : `${slot.pingMs}ms`}
              </span>
            )}

            {isHost && !slot.isSelf && !slot.isBot && (
              <button
                type="button"
                onClick={() => onRemovePeer(slot.id)}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-semibold cursor-pointer transition-colors"
                title="Kick / Remove player from lobby"
              >
                <UserMinus className="h-2.5 w-2.5" />
                <span>Kick</span>
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
        {/* 2. PLAYERS IN ROOM (Blue / Neutral / Orange + Pre-assigned Bots) */}
        <div
          data-ui-element="lobby-players-in-room"
          className="flex flex-col gap-1.5"
          onMouseEnter={() =>
            onHoverDesc?.(
              'Players in Room: Displays Blue Team, Neutral (Auto), and Orange Team rosters with team-colored icons and pre-assigned bots when Bot Filling is enabled.'
            )
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-neutral-400">
            <div className="flex items-center gap-2">
              <span>PLAYERS IN ROOM</span>
              <span className="text-amber-500">
                ({humanCount} Human{botCount > 0 ? ` + ${botCount} Bot` : ''} / {maxPlayers})
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setRosterLayout((prev) => (prev === 'stacked' ? 'columns' : 'stacked'))
              }
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] cursor-pointer transition-colors ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-600'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400'
              }`}
              title="Switch between Vertical Stacked (Blue / Neutral / Orange) and 3-Column layout"
            >
              {rosterLayout === 'stacked' ? (
                <>
                  <Rows3 className="h-3 w-3" />
                  <span>Stacked</span>
                </>
              ) : (
                <>
                  <Columns3 className="h-3 w-3" />
                  <span>3-Col</span>
                </>
              )}
            </button>
          </div>

          <div
            className={
              rosterLayout === 'columns'
                ? 'grid grid-cols-3 gap-2'
                : 'flex flex-col gap-2'
            }
          >
            {/* Blue Team Section */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${
                isLight
                  ? 'bg-sky-50/45 border-sky-200/90'
                  : 'bg-sky-950/20 border-sky-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-sky-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>BLUE TEAM</span>
                </span>
                <span>
                  {blueRoster.length} / {slotsPerSide}
                </span>
              </div>
              {blueRoster.length > 0 ? (
                blueRoster.map((slot) => renderSlotRow(slot, 'blue'))
              ) : (
                <div className="text-[11px] font-mono text-neutral-400 py-1 text-center">
                  No Blue players assigned
                </div>
              )}
            </div>

            {/* Neutral (Unselected / Auto) Section */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${
                isLight
                  ? 'bg-neutral-100/75 border-neutral-300/80'
                  : 'bg-neutral-900/55 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span>NEUTRAL (AUTO)</span>
                </span>
                <span>{neutralRoster.length}</span>
              </div>
              {neutralRoster.length > 0 ? (
                neutralRoster.map((slot) => renderSlotRow(slot, 'neutral'))
              ) : (
                <div className="text-[11px] font-mono text-neutral-500 py-1 text-center">
                  No unassigned players in Neutral
                </div>
              )}
            </div>

            {/* Orange Team Section */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col gap-1.5 ${
                isLight
                  ? 'bg-orange-50/45 border-orange-200/90'
                  : 'bg-orange-950/20 border-orange-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-orange-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>ORANGE TEAM</span>
                </span>
                <span>
                  {orangeRoster.length} / {slotsPerSide}
                </span>
              </div>
              {orangeRoster.length > 0 ? (
                orangeRoster.map((slot) => renderSlotRow(slot, 'orange'))
              ) : (
                <div className="text-[11px] font-mono text-neutral-400 py-1 text-center">
                  No Orange players assigned
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Three-Button Team Switcher: Switch to Blue | Auto (Neutral) | Switch to Orange */}
        <div
          data-ui-element="lobby-team-switcher-3way"
          className="grid grid-cols-3 gap-2"
          onMouseEnter={() =>
            onHoverDesc?.(
              'Team Selection: Choose Switch to Blue, Auto (Neutral gray), or Switch to Orange. Each button retains its semantic color when idle and illuminates when active.'
            )
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <button
            type="button"
            onClick={() => setLocalTeam('blue')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              localTeam === 'blue'
                ? 'bg-sky-500 text-white border-sky-400 shadow-sm ring-2 ring-sky-400/35'
                : isLight
                ? 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-400/45 text-sky-700'
                : 'bg-sky-500/12 hover:bg-sky-500/22 border-sky-500/35 text-sky-400'
            }`}
          >
            {localTeam === 'blue' && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>Switch to Blue</span>
          </button>

          <button
            type="button"
            onClick={() => setLocalTeam('neutral')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              localTeam === 'neutral'
                ? isLight
                  ? 'bg-neutral-700 text-white border-neutral-600 shadow-sm ring-2 ring-neutral-400/40'
                  : 'bg-neutral-600 text-white border-neutral-400 shadow-sm ring-2 ring-neutral-400/35'
                : isLight
                ? 'bg-neutral-200/75 hover:bg-neutral-300/80 border-neutral-400/50 text-neutral-700'
                : 'bg-neutral-800/75 hover:bg-neutral-700/80 border-neutral-600/50 text-neutral-300'
            }`}
          >
            {localTeam === 'neutral' && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>Auto</span>
          </button>

          <button
            type="button"
            onClick={() => setLocalTeam('orange')}
            className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              localTeam === 'orange'
                ? 'bg-orange-500 text-white border-orange-400 shadow-sm ring-2 ring-orange-400/35'
                : isLight
                ? 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-400/45 text-orange-700'
                : 'bg-orange-500/12 hover:bg-orange-500/22 border-orange-500/35 text-orange-400'
            }`}
          >
            {localTeam === 'orange' && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
            <span>Switch to Orange</span>
          </button>
        </div>
      </>
    );
  }
);
MatchLobbyTeamRosterSection.displayName = 'MatchLobbyTeamRosterSection';
