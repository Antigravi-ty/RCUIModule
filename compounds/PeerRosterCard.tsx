import React from 'react';
import { Server, Users, UserMinus } from 'lucide-react';

export interface RoomPeerEntry {
  id: string;
  name: string;
  pingMs: number;
  carIndex?: number;
}

export interface PeerRosterCardProps {
  isHosting?: boolean;
  localPlayerName?: string;
  maxPlayers?: number;
  peers?: RoomPeerEntry[];
  onRemovePeer?: (carIndex: number, peerId: string) => void;
  isLight?: boolean;
  className?: string;
}

/**
 * [L3 Compound] PeerRosterCard (`L3.10`)
 * Pure props-driven Online Room Peer Roster Card (Host & Client views, live ping badges, kick action).
 */
export const PeerRosterCard: React.FC<PeerRosterCardProps> = React.memo(
  ({
    isHosting = true,
    localPlayerName = 'Striker-4829',
    maxPlayers = 4,
    peers = [{ id: 'peer-1', name: 'Apex-Client', pingMs: 18, carIndex: 1 }],
    onRemovePeer,
    isLight = true,
    className = '',
  }) => {
    const activeCount = isHosting ? 1 + peers.length : 2;

    return (
      <div
        data-ui-element="compound-peer-roster-card"
        className={`flex flex-col gap-1.5 select-none ${className}`}
      >
        <div
          className={`flex items-center justify-between text-xs font-mono font-semibold ${
            isLight ? 'text-neutral-500' : 'text-neutral-400'
          }`}
        >
          <span>PLAYERS IN ROOM</span>
          <span>
            {activeCount} / {maxPlayers}
          </span>
        </div>

        <div
          className={`rounded-xl border p-2 flex flex-col gap-1.5 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          {isHosting ? (
            <>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-amber-500" />
                  <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>
                    {localPlayerName} (You)
                  </span>
                </div>
                <span className={`text-[10px] ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  0ms • Host
                </span>
              </div>

              {peers.length > 0 ? (
                peers.map((peer, idx) => (
                  <div
                    key={peer.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                      isLight ? 'bg-white border border-neutral-200' : 'bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-emerald-500" />
                      <span className={isLight ? 'text-neutral-800' : 'text-neutral-200'}>
                        {peer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-500 tabular-nums">
                        {peer.pingMs}ms
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemovePeer?.(peer.carIndex ?? idx + 1, peer.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-semibold cursor-pointer transition-all ${
                          isLight ? 'text-rose-600' : 'text-rose-400'
                        }`}
                      >
                        <UserMinus className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-2.5 py-2 text-center text-xs text-neutral-500 font-mono">
                  Waiting for remote peer to connect...
                </div>
              )}
            </>
          ) : (
            <>
              <div
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono ${
                  isLight ? 'bg-white border border-neutral-200' : 'bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-amber-500" />
                  <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>
                    Room Host
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">Host</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-bold text-emerald-500">{localPlayerName} (You)</span>
                </div>
                <span className="text-[10px] text-emerald-500 tabular-nums">
                  {peers[0]?.pingMs ?? 15}ms • Client
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

PeerRosterCard.displayName = 'PeerRosterCard';
