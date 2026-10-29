import React, { useState } from 'react';
import { Server, Users, Shuffle, Play } from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { SegmentedSwitch } from '../primitives/SegmentedSwitch';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { Card } from '../layout/Card';
import { useMenuLayoutStore } from '../tokens/menuLayoutStore';
import {
  pushQuickNotification,
  useQuickNotificationStore,
  expandQuickNotificationCenter,
} from '../tokens/quickNotificationStore';
import { dialogue } from '../compounds/Dialogue';

export interface Layer3OnlineWarmupRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  hasError?: boolean;
  onCheckNotification?: () => void;
}

export function dispatchOnlineRoomErrorNotification(
  summary = 'Could not bind or connect to signaling room within 10s.',
  details = 'WebSocket Signaling Handshake Failed (ERR_CONNECTION_TIMED_OUT).\nEndpoint: wss://relay.carsoccer.dev/signaling\nAttempted Room: #4829 (120Hz Sub-Tick WebRTC)'
) {
  const store = useQuickNotificationStore.getState();
  const existing =
    store.activeNotification?.id === 'online-room-error' ||
    store.unreadStack.some((item) => item.id === 'online-room-error') ||
    store.preemptedPersistentStack.some((item) => item.id === 'online-room-error');

  if (!existing) {
    pushQuickNotification({
      id: 'online-room-error',
      type: 'persistent',
      tone: 'error',
      icon: 'octagon-alert',
      duration: 0,
      content: summary,
      buttons: [
        {
          label: 'Details',
          color: 'amber',
          onClick: () => {
            dialogue.show({
              title: 'CONNECTION DIAGNOSTIC LOG',
              tone: 'error',
              icon: 'octagon-alert',
              content: (
                <div className="flex flex-col gap-2 font-mono text-xs w-full text-left">
                  <p className="font-bold text-rose-600 dark:text-rose-400">{summary}</p>
                  <div className="p-3 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-neutral-950/70 dark:border-neutral-800 dark:text-neutral-200 text-[11px] leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                    {details}
                  </div>
                </div>
              ),
              buttons: [{ label: 'Close', variant: 'primary' }],
            });
          },
        },
      ],
    });
  }
}

export const Layer3OnlineWarmupRecipe: React.FC<Layer3OnlineWarmupRecipeProps> = ({
  isLight = false,
  onBack = () => {},
  hasError: propHasError,
  onCheckNotification,
}) => {
  const { panels, simulateLayer3Error, setToken } = useMenuLayoutStore();
  const sizing = panels['layer3-online-warmup'];
  const [localError, setLocalError] = useState(false);
  const showError = propHasError ?? (simulateLayer3Error || localError);

  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [roomType, setRoomType] = useState<'warmup' | 'match'>('match');
  const [gameMode, setGameMode] = useState<'1v1' | '2v2' | '3v3'>('2v2');
  const [playerName, setPlayerName] = useState(() => `Player${Math.floor(1000 + Math.random() * 9000)}`);
  const [roomCode, setRoomCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  const handleTriggerErrorAction = () => {
    dispatchOnlineRoomErrorNotification();
    const st = useQuickNotificationStore.getState();
    if (st.activeNotification) {
      st.collapseActive();
    }
    setLocalError(true);
    setToken('simulateLayer3Error', true);
  };

  const handleCheckNotificationClick = () => {
    const st = useQuickNotificationStore.getState();
    const totalCount =
      (st.activeNotification ? 1 : 0) +
      st.unreadStack.length +
      st.preemptedPersistentStack.length;
    if (totalCount === 0) {
      dispatchOnlineRoomErrorNotification();
    } else {
      expandQuickNotificationCenter();
    }
    onCheckNotification?.();
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader
        isLight={isLight}
        title={roomType === 'match' ? 'MULTIPLAYER MATCH' : 'ONLINE WARMUP'}
        onBack={onBack}
      />

      <PanelContent
        scrollable={true}
        className={`flex flex-col transition-all duration-150 ${
          showError ? 'gap-2.5' : 'gap-3'
        }`}
      >
        <InlineErrorNotice
          visible={showError}
          isLight={isLight}
          onCheckNotification={handleCheckNotificationClick}
        />

        {/* Host / Join Mode Switcher */}
        <div
          className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border shrink-0 ${
            isLight
              ? 'bg-neutral-100 border-neutral-200/90'
              : 'bg-neutral-900/60 border-neutral-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('host')}
            onMouseEnter={() => setHoveredDesc('Host a new authoritative P2P room.')}
            onMouseLeave={() => setHoveredDesc(null)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'host'
                ? 'bg-amber-500 text-white shadow-2xs'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Host a Room</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            onMouseEnter={() => setHoveredDesc('Join an existing P2P room using a room code.')}
            onMouseLeave={() => setHoveredDesc(null)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'join'
                ? 'bg-amber-500 text-white shadow-2xs'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Join a Room</span>
          </button>
        </div>

        {/* Player Name Input */}
        <div
          className="flex flex-col gap-1 text-xs shrink-0"
          onMouseEnter={() => setHoveredDesc('Your player display name shown in the online lobby.')}
          onMouseLeave={() => setHoveredDesc(null)}
        >
          <label
            className={`font-semibold font-mono text-[11px] ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            YOUR PLAYER NAME:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={18}
            className={`w-full px-3 py-1.5 rounded-xl border font-mono text-xs outline-none transition-all ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-500'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100 focus:border-amber-500'
            }`}
          />
        </div>

        {/* Room Configuration Card */}
        <Card
          isLight={isLight}
          variant="outlined"
          className={`flex flex-col shrink-0 transition-all duration-150 ${
            showError ? 'p-3 gap-2.5' : 'p-3.5 gap-2.5'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-mono text-[11px] font-semibold ${
                isLight ? 'text-neutral-600' : 'text-neutral-400'
              }`}
            >
              {activeTab === 'host' ? 'ROOM ACCESS CODE:' : 'TARGET ROOM CODE:'}
            </span>
            <button
              type="button"
              onClick={() => setRoomCode(String(Math.floor(1000 + Math.random() * 9000)))}
              className={`inline-flex items-center gap-1 text-[11px] font-mono cursor-pointer transition-colors ${
                isLight ? 'text-amber-600 hover:text-amber-700' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Shuffle className="h-3 w-3" />
              <span>Randomize</span>
            </button>
          </div>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            maxLength={12}
            className={`w-full px-3 py-1.5 rounded-xl border font-mono text-sm font-bold tracking-widest text-center outline-none ${
              isLight
                ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                : 'bg-neutral-950 border-neutral-800 text-amber-400'
            }`}
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Ruleset</span>
              <SegmentedSwitch
                fullWidth
                options={[
                  { value: 'warmup', label: 'Warmup' },
                  { value: 'match', label: 'Match' },
                ]}
                value={roomType}
                onValueChange={(v) => setRoomType(v as 'warmup' | 'match')}
                isLight={isLight}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase">Team Size</span>
              <SegmentedSwitch
                fullWidth
                options={[
                  { value: '1v1', label: '1v1' },
                  { value: '2v2', label: '2v2' },
                  { value: '3v3', label: '3v3' },
                ]}
                value={gameMode}
                onValueChange={(v) => setGameMode(v as '1v1' | '2v2' | '3v3')}
                isLight={isLight}
              />
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleTriggerErrorAction}
          onMouseEnter={() =>
            setHoveredDesc('Initiate WebRTC signaling handshake for the configured room.')
          }
          onMouseLeave={() => setHoveredDesc(null)}
          className="mt-auto w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-white shadow-sm transition-all active:scale-[0.985] cursor-pointer shrink-0"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{activeTab === 'host' ? 'Create & Host Room' : 'Connect & Join Room'}</span>
        </button>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure P2P 120Hz WebRTC lobby parameters to host or join an online session."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
};
