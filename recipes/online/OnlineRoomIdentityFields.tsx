import React from 'react';
import { Lock, Shuffle } from 'lucide-react';
import { useSettingActionRowStore } from '../../stores/settingRowStore';

export interface OnlineRoomIdentityFieldsProps {
  playerName: string;
  onPlayerNameChange: (value: string) => void;
  roomCode: string;
  onRoomCodeChange: (value: string) => void;
  roomKey: string;
  onRoomKeyChange: (value: string) => void;
  showRandomize?: boolean;
  onRandomizeRoomCode?: () => void;
  onNotYouClick?: () => void;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
  className?: string;
}

const sanitizeAscii = (raw: string): string => raw.replace(/[^\x20-\x7E]/g, '');

/**
 * Decoupled 2-row identity & room access header shared across Host Match, Join Room, and Host Training:
 * - Row 1: `Player Name:` (matched typography) + `Not you?` underlined link (navigates to Garage Sync) + full-width input
 * - Row 2: 50/50 split (`grid-cols-2`):
 *   - Left: `Room Code` (left-aligned) + optional `Randomize` action on the right, left-aligned ASCII input
 *   - Right: Lock icon + `Key` (left-aligned), left-aligned ASCII input with gray `None` placeholder when empty
 */
export const OnlineRoomIdentityFields: React.FC<OnlineRoomIdentityFieldsProps> = React.memo(({
  playerName,
  onPlayerNameChange,
  roomCode,
  onRoomCodeChange,
  roomKey,
  onRoomKeyChange,
  showRandomize = false,
  onRandomizeRoomCode,
  onNotYouClick,
  onHoverDesc,
  isLight = true,
  className = '',
}) => {
  const { titleFontSize, paddingX } = useSettingActionRowStore();
  const labelStyle: React.CSSProperties = {
    fontSize: `${Math.max(13, titleFontSize)}px`,
  };

  const labelColorClass = isLight ? 'text-neutral-800' : 'text-neutral-200';
  const inputSurfaceClass = isLight
    ? 'bg-neutral-100/90 hover:bg-neutral-100 focus:bg-white border-neutral-300/90 text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500'
    : 'bg-neutral-900/90 hover:bg-neutral-900 focus:bg-neutral-950 border-neutral-700/90 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500';

  return (
    <div
      style={{
        paddingLeft: `${Math.max(0, paddingX)}px`,
        paddingRight: `${Math.max(0, paddingX)}px`,
      }}
      className={`flex flex-col gap-3 shrink-0 ${className}`}
    >
      {/* Row 1: Player Name + Not you? */}
      <div
        className="flex flex-col gap-1.5"
        onMouseEnter={() =>
          onHoverDesc?.(
            'Player Name: Display name broadcast to connected peers. Click "Not you?" to open Garage Sync.'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
      >
        <div className="flex items-center justify-between gap-2">
          <label
            style={labelStyle}
            className={`font-semibold tracking-tight select-none ${labelColorClass}`}
          >
            Player Name:
          </label>
          <button
            type="button"
            onClick={onNotYouClick}
            onMouseEnter={() =>
              onHoverDesc?.('Not you? Jump to Garage -> Sync to switch or bind your online profile.')
            }
            className={`text-xs font-medium underline underline-offset-3 cursor-pointer transition-colors select-none ${
              isLight
                ? 'text-neutral-500 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            Not you?
          </button>
        </div>

        <input
          type="text"
          value={playerName}
          onChange={(e) => onPlayerNameChange(sanitizeAscii(e.target.value))}
          maxLength={24}
          placeholder="Player Name"
          className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-medium text-left outline-none transition-colors ${inputSurfaceClass}`}
        />
      </div>

      {/* Row 2: 50/50 Split — Room Code (left) & Lock + Key (right) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left Half: Room Code */}
        <div
          className="flex flex-col gap-1.5 min-w-0"
          onMouseEnter={() =>
            onHoverDesc?.('Room Code: Any ASCII characters allowed for peer-to-peer room discovery.')
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <div className="flex items-center justify-between gap-2">
            <label
              style={labelStyle}
              className={`font-semibold tracking-tight select-none truncate ${labelColorClass}`}
            >
              Room Code
            </label>
            {showRandomize && (
              <button
                type="button"
                onClick={onRandomizeRoomCode}
                className={`inline-flex items-center gap-1 text-xs font-mono font-medium cursor-pointer transition-colors shrink-0 ${
                  isLight
                    ? 'text-amber-600 hover:text-amber-700'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
                title="Randomize room code"
              >
                <Shuffle className="h-3 w-3" />
                <span>Randomize</span>
              </button>
            )}
          </div>

          <input
            type="text"
            value={roomCode}
            onChange={(e) => onRoomCodeChange(sanitizeAscii(e.target.value))}
            maxLength={24}
            placeholder="Room Code"
            className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-semibold text-left outline-none transition-colors ${inputSurfaceClass}`}
          />
        </div>

        {/* Right Half: Lock + Key */}
        <div
          className="flex flex-col gap-1.5 min-w-0"
          onMouseEnter={() =>
            onHoverDesc?.('Key: Optional room password (any ASCII characters). Leave blank for None.')
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <div className="flex items-center justify-between gap-2">
            <label
              style={labelStyle}
              className={`inline-flex items-center gap-1.5 font-semibold tracking-tight select-none truncate ${labelColorClass}`}
            >
              <Lock
                className={`h-3.5 w-3.5 shrink-0 ${
                  isLight ? 'text-amber-600' : 'text-amber-400'
                }`}
              />
              <span>Key</span>
            </label>
          </div>

          <input
            type="text"
            value={roomKey}
            onChange={(e) => onRoomKeyChange(sanitizeAscii(e.target.value))}
            maxLength={24}
            placeholder="None"
            className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-medium text-left outline-none transition-colors ${inputSurfaceClass}`}
          />
        </div>
      </div>
    </div>
  );
});

OnlineRoomIdentityFields.displayName = 'OnlineRoomIdentityFields';
