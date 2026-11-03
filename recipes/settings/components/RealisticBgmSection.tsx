import React, { useState, useMemo } from 'react';
import {
  MirrorRectangular,
  ChevronDown,
  Check,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { Checkbox } from '../../../primitives/Checkbox';
import { ToggleSwitch } from '../../../primitives/ToggleSwitch';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import {
  useSpatialAudioStore,
  getFilteredBgmTracks,
} from '../../../stores/spatialAudioStore';

export interface RealisticBgmSectionProps {
  bordered?: boolean;
  onHover: (desc: string) => void;
  onLeave: () => void;
  isLight?: boolean;
}

/**
 * [Layer 2 Settings -> Advanced Tab -> Realistic Background Music]
 * Displayed when a Background Music folder has been uploaded in the current session.
 * - Icon: `mirror-rectangular` (`MirrorRectangular`)
 * - ToggleSwitch on the far right (default: `true` — stadium spatial audio while driving, normal audio in ESC menu)
 * - `More` + down arrow (`ChevronDown`) to the left of the ToggleSwitch (matching `Show Telemetry Summary` underlined disclosure style) to expand Volume / Uncategorized / File Name filters.
 * - Filter state is persisted to localStorage while audio file blobs remain session-only.
 */
export const RealisticBgmSection: React.FC<RealisticBgmSectionProps> = React.memo(
  ({ bordered = false, onHover, onLeave, isLight = false }) => {
    const bgmTracks = useSpatialAudioStore((s) => s.bgmTracks);
    const bgmVolumes = useSpatialAudioStore((s) => s.bgmVolumes);
    const realisticBgmEnabled = useSpatialAudioStore((s) => s.realisticBgmEnabled);
    const setRealisticBgmEnabled = useSpatialAudioStore((s) => s.setRealisticBgmEnabled);
    const bgmCategorizedMode = useSpatialAudioStore((s) => s.bgmCategorizedMode);
    const setBgmCategorizedMode = useSpatialAudioStore((s) => s.setBgmCategorizedMode);
    const bgmDeselectedVolumes = useSpatialAudioStore((s) => s.bgmDeselectedVolumes);
    const toggleBgmVolume = useSpatialAudioStore((s) => s.toggleBgmVolume);
    const setAllBgmVolumes = useSpatialAudioStore((s) => s.setAllBgmVolumes);
    const bgmDeselectedTrackNames = useSpatialAudioStore((s) => s.bgmDeselectedTrackNames);
    const toggleBgmTrack = useSpatialAudioStore((s) => s.toggleBgmTrack);
    const setAllBgmTracks = useSpatialAudioStore((s) => s.setAllBgmTracks);
    const bgmCurrentTrackId = useSpatialAudioStore((s) => s.bgmCurrentTrackId);
    const bgmIsPlaying = useSpatialAudioStore((s) => s.bgmIsPlaying);
    const playSpecificBgmTrack = useSpatialAudioStore((s) => s.playSpecificBgmTrack);
    const nextBgmTrack = useSpatialAudioStore((s) => s.nextBgmTrack);
    const prevBgmTrack = useSpatialAudioStore((s) => s.prevBgmTrack);
    const toggleBgmPlayPause = useSpatialAudioStore((s) => s.toggleBgmPlayPause);

    const [isExpanded, setIsExpanded] = useState(false);
    const { borderRadius, rowGap } = useSettingActionRowStore();

    // Tracks visible in the track list based on volume filter when in Categorized mode
    const visibleTracks = useMemo(() => {
      if (!bgmCategorizedMode) return bgmTracks;
      const deselectedVolSet = new Set(bgmDeselectedVolumes);
      return bgmTracks.filter((track) => {
        const volKey = track.volume ?? 'uncategorized';
        return !deselectedVolSet.has(volKey);
      });
    }, [bgmTracks, bgmCategorizedMode, bgmDeselectedVolumes]);

    const activePlaylist = useMemo(
      () =>
        getFilteredBgmTracks({
          bgmTracks,
          bgmCategorizedMode,
          bgmDeselectedVolumes,
          bgmDeselectedTrackNames,
        }),
      [bgmTracks, bgmCategorizedMode, bgmDeselectedVolumes, bgmDeselectedTrackNames]
    );

    // Only render when Background Music folder has been uploaded
    if (bgmTracks.length === 0) {
      return null;
    }

    const deselectedVolSet = new Set(bgmDeselectedVolumes);
    const deselectedTrackSet = new Set(bgmDeselectedTrackNames);

    const moreTriggerButton = (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className={`inline-flex items-center gap-0.5 text-xs font-medium cursor-pointer transition-colors select-none py-0.5 px-1 rounded ${
          isLight
            ? 'text-neutral-500 hover:text-neutral-900'
            : 'text-neutral-400 hover:text-neutral-100'
        }`}
        title={
          isExpanded
            ? 'Collapse Volume & Track filter'
            : 'Expand Volume, Uncategorized & Track filter'
        }
      >
        <span className="underline underline-offset-3 decoration-current/60">
          More
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
    );

    return (
      <div
        data-ui-element="compound-realistic-bgm-section"
        style={{
          borderRadius: `${Math.max(0, borderRadius)}px`,
          gap: `${rowGap}px`,
        }}
        className={`flex flex-col w-full transition-colors ${
          bordered
            ? isLight
              ? 'p-2 border bg-neutral-50/90 border-neutral-200 shadow-2xs'
              : 'p-2 border bg-neutral-850/80 border-neutral-700/80'
            : ''
        }`}
      >
        <SettingActionRow
          icon={MirrorRectangular}
          iconName="mirror-rectangular"
          title="Realistic Background Music"
          description={`Spatial stadium reverb during driving, normal clear playback in menus (${activePlaylist.length}/${bgmTracks.length} active)`}
          bordered={false}
          onAction={() => setRealisticBgmEnabled(!realisticBgmEnabled)}
          hoverDescription="Realistic Background Music: Apply stadium spatial acoustics to Background Music while driving, and transition to clear studio playback when the ESC menu is opened. Click More to filter by Volume, Uncategorized, or individual file names."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
          rightSlot={
            <div className="flex items-center gap-2.5">
              {moreTriggerButton}
              <ToggleSwitch
                checked={realisticBgmEnabled}
                onCheckedChange={setRealisticBgmEnabled}
                isLight={isLight}
                variant="neutral"
              />
            </div>
          }
        />

        {isExpanded && (
          <div
            style={{
              borderRadius: `${Math.max(6, borderRadius)}px`,
            }}
            className={`mt-1 p-3 border flex flex-col gap-3 w-full transition-all ${
              isLight
                ? 'bg-neutral-100/75 border-neutral-200/90 text-neutral-800'
                : 'bg-neutral-900/55 border-neutral-800/90 text-neutral-200'
            }`}
          >
            {/* Top row: Mode Switcher (Categorized vs Uncategorized) + Transport Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isLight ? 'text-neutral-500' : 'text-neutral-400'
                  }`}
                >
                  Filter Mode:
                </span>
                <div
                  className={`inline-flex rounded-lg p-0.5 border ${
                    isLight
                      ? 'bg-neutral-200/70 border-neutral-300'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBgmCategorizedMode(true)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      bgmCategorizedMode
                        ? isLight
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'bg-white/[0.14] text-white'
                        : isLight
                        ? 'text-neutral-600 hover:text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    By Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgmCategorizedMode(false)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      !bgmCategorizedMode
                        ? isLight
                          ? 'bg-white text-neutral-900 shadow-2xs'
                          : 'bg-white/[0.14] text-white'
                        : isLight
                        ? 'text-neutral-600 hover:text-neutral-900'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Uncategorized (All Files)
                  </button>
                </div>
              </div>

              {/* Quick Mini Transport Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevBgmTrack}
                  title="Previous Track"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={toggleBgmPlayPause}
                  title={bgmIsPlaying ? 'Pause' : 'Play'}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    bgmIsPlaying
                      ? isLight
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-neutral-100 text-neutral-950 border-neutral-100'
                      : isLight
                      ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  {bgmIsPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={nextBgmTrack}
                  title="Next Track"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Volume Filter Section (shown when Categorized Mode is active) */}
            {bgmCategorizedMode && bgmVolumes.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      isLight ? 'text-neutral-600' : 'text-neutral-400'
                    }`}
                  >
                    Volumes ({bgmVolumes.length - bgmDeselectedVolumes.length}/{bgmVolumes.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAllBgmVolumes(true)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-neutral-200/80 border-neutral-300 text-neutral-800 hover:bg-neutral-300/80'
                          : 'bg-white/[0.08] border-white/[0.12] text-neutral-200 hover:bg-white/[0.14]'
                      }`}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllBgmVolumes(false)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                        isLight
                          ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {bgmVolumes.map((vol) => {
                    const isVolSelected = !deselectedVolSet.has(vol);
                    const label = vol === 'uncategorized' ? 'Uncategorized' : `Vol ${vol}`;
                    return (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => toggleBgmVolume(vol)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer select-none ${
                          isVolSelected
                            ? isLight
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                              : 'bg-white/[0.14] text-white border-white/[0.24]'
                            : isLight
                            ? 'bg-white text-neutral-400 border-neutral-200 hover:text-neutral-700'
                            : 'bg-neutral-950/60 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                        }`}
                      >
                        {isVolSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Track List Filter Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    isLight ? 'text-neutral-600' : 'text-neutral-400'
                  }`}
                >
                  Audio Files ({activePlaylist.length}/{visibleTracks.length} Active)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setAllBgmTracks(
                        true,
                        visibleTracks.map((t) => t.rawName)
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-neutral-200/80 border-neutral-300 text-neutral-800 hover:bg-neutral-300/80'
                        : 'bg-white/[0.08] border-white/[0.12] text-neutral-200 hover:bg-white/[0.14]'
                    }`}
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAllBgmTracks(
                        false,
                        visibleTracks.map((t) => t.rawName)
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div
                className={`max-h-48 overflow-y-auto rounded-lg border divide-y ${
                  isLight
                    ? 'bg-white border-neutral-200 divide-neutral-100'
                    : 'bg-neutral-950/80 border-neutral-800 divide-neutral-800/60'
                }`}
              >
                {visibleTracks.length === 0 ? (
                  <div className="p-3 text-center text-xs text-neutral-500">
                    No tracks match the selected volume filter.
                  </div>
                ) : (
                  visibleTracks.map((track) => {
                    const isTrackEnabled = !deselectedTrackSet.has(track.rawName);
                    const isCurrentPlaying = bgmCurrentTrackId === track.id;

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 text-xs transition-colors ${
                          isCurrentPlaying
                            ? isLight
                              ? 'bg-neutral-100 text-neutral-900'
                              : 'bg-white/[0.08] text-white'
                            : isLight
                            ? 'hover:bg-neutral-50'
                            : 'hover:bg-neutral-900'
                        } ${!isTrackEnabled ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Checkbox
                            checked={isTrackEnabled}
                            onCheckedChange={() => toggleBgmTrack(track.rawName)}
                            variant="neutral"
                            size="sm"
                            isLight={isLight}
                            title={
                              isTrackEnabled
                                ? `Exclude ${track.rawName} from playlist`
                                : `Include ${track.rawName} in playlist`
                            }
                          />
                          <button
                            type="button"
                            onClick={() => playSpecificBgmTrack(track.id)}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer truncate"
                            title={`Play ${track.rawName}`}
                          >
                            {isCurrentPlaying && (
                              <Volume2 className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                            )}
                            <span className="font-medium truncate">{track.title}</span>
                            <span
                              className={`text-[10px] font-mono truncate ${
                                isLight ? 'text-neutral-400' : 'text-neutral-500'
                              }`}
                            >
                              ({track.rawName})
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-mono ${
                              isLight ? 'text-neutral-400' : 'text-neutral-500'
                            }`}
                          >
                            {track.volume ? `Vol ${track.volume}` : 'Uncat'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

RealisticBgmSection.displayName = 'RealisticBgmSection';
