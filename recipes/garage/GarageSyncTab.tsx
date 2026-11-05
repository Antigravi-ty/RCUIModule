import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudDownload,
  CloudUpload,
  GitMerge,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { UnderConstructionPlaceholder } from '../../primitives/UnderConstructionPlaceholder';
import { formatSyncValuePreview } from '../../config/cloudProfileSyncTypes';
import { useCloudProfileSyncStore } from '../../stores/cloudProfileSyncStore';

export interface GarageSyncTabProps {
  isLight?: boolean;
  onHoverDesc?: (desc: string | null) => void;
}

export const GarageSyncTab: React.FC<GarageSyncTabProps> = ({
  isLight = false,
  onHoverDesc,
}) => {
  const available = useCloudProfileSyncStore((s) => s.available);
  const loggedInUser = useCloudProfileSyncStore((s) => s.loggedInUser);
  const syncStatus = useCloudProfileSyncStore((s) => s.syncStatus);
  const statusMessage = useCloudProfileSyncStore((s) => s.statusMessage);
  const errorMessage = useCloudProfileSyncStore((s) => s.errorMessage);
  const userRev = useCloudProfileSyncStore((s) => s.userRev);
  const devRev = useCloudProfileSyncStore((s) => s.devRev);
  const autoSyncEnabled = useCloudProfileSyncStore((s) => s.autoSyncEnabled);
  const conflicts = useCloudProfileSyncStore((s) => s.conflicts);

  const loginAndSyncUser = useCloudProfileSyncStore((s) => s.loginAndSyncUser);
  const logoutUser = useCloudProfileSyncStore((s) => s.logoutUser);
  const pullUserCloudProfile = useCloudProfileSyncStore((s) => s.pullUserCloudProfile);
  const pushUserCloudProfile = useCloudProfileSyncStore((s) => s.pushUserCloudProfile);
  const setAutoSyncEnabled = useCloudProfileSyncStore((s) => s.setAutoSyncEnabled);
  const selectConflictSource = useCloudProfileSyncStore((s) => s.selectConflictSource);
  const resolveConflicts = useCloudProfileSyncStore((s) => s.resolveConflicts);

  const [usernameInput, setUsernameInput] = useState(loggedInUser?.userId ?? '');
  const [passwordInput, setPasswordInput] = useState(loggedInUser?.password ?? '');

  useEffect(() => {
    if (loggedInUser) {
      setUsernameInput(loggedInUser.userId);
      setPasswordInput(loggedInUser.password);
    }
  }, [loggedInUser]);

  if (!available) {
    return (
      <UnderConstructionPlaceholder
        title="Cloud Sync Configuration Under Construction"
        description="Import a trusted .rctbnspib signaling & profile bundle in Online -> Custom Signaling before binding a cloud profile."
        badge="BUNDLE REQUIRED"
        isLight={isLight}
      />
    );
  }

  const isSyncing = syncStatus === 'syncing';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginAndSyncUser(usernameInput, passwordInput);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full h-full overflow-y-auto pr-0.5">
      {/* Top Card: Account Binding & Sync Controls */}
      <div
        className={`rounded-xl border p-3 flex flex-col gap-2.5 transition-colors ${
          isLight
            ? 'bg-white/90 border-neutral-200/90 text-neutral-900'
            : 'bg-neutral-900/70 border-neutral-800/90 text-neutral-100'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                loggedInUser
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
              }`}
            >
              {loggedInUser ? (
                <CloudCheck className="h-4 w-4" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <span>Cloud Profile Sync</span>
                {loggedInUser && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                      isLight
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    #{loggedInUser.alias}
                  </span>
                )}
              </div>
              <div
                className={`text-[11px] truncate ${
                  isLight ? 'text-neutral-500' : 'text-neutral-400'
                }`}
              >
                {loggedInUser
                  ? `Bound to "${loggedInUser.userId}" · Overrides local PLAYER_NAME & syncs live developer presets`
                  : 'Sign in with your assigned username & passphrase to sync Garage, Settings & Floating Windows'}
              </div>
            </div>
          </div>

          {loggedInUser && (
            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
                }`}
              >
                user v{userRev}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-700'
                    : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                }`}
              >
                dev v{devRev}
              </span>
            </div>
          )}
        </div>

        {/* Login / Account Inputs */}
        <form onSubmit={handleLoginSubmit} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-5 relative flex items-center">
            <UserCheck
              className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                isLight ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            />
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Username (e.g. adamzhang)"
              onMouseEnter={() =>
                onHoverDesc?.(
                  'Cloud Username: Syncs your configuration slot and sets your local Player Name.'
                )
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none transition ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-sky-500'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 focus:border-sky-500'
              }`}
            />
          </div>

          <div className="col-span-4 relative flex items-center">
            <KeyRound
              className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                isLight ? 'text-neutral-400' : 'text-neutral-500'
              }`}
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Passphrase"
              onMouseEnter={() =>
                onHoverDesc?.(
                  'Passphrase: Prevents accidental slot overwrites and verifies ownership.'
                )
              }
              onMouseLeave={() => onHoverDesc?.(null)}
              className={`w-full pl-8 pr-2.5 py-1.5 rounded-lg border text-xs font-mono outline-none transition ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-sky-500'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 focus:border-sky-500'
              }`}
            />
          </div>

          <div className="col-span-3 flex items-center gap-1.5 justify-end">
            <button
              type="submit"
              disabled={isSyncing}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{loggedInUser ? 'Sync' : 'Sign In'}</span>
            </button>

            {loggedInUser && (
              <button
                type="button"
                onClick={logoutUser}
                title="Sign out of cloud profile"
                className="p-1.5 rounded-lg border bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-400 cursor-pointer transition active:scale-95"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* Action Row when signed in */}
        {loggedInUser && (
          <div
            className={`flex items-center justify-between gap-2 pt-2 border-t ${
              isLight ? 'border-neutral-200/80' : 'border-neutral-800/80'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => void pullUserCloudProfile()}
                onMouseEnter={() =>
                  onHoverDesc?.(
                    'Pull & 3-Way Merge: Pulls latest cloud user & developer slots and runs field-level Git 3-Way Merge.'
                  )
                }
                onMouseLeave={() => onHoverDesc?.(null)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-95 ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-neutral-200'
                }`}
              >
                <CloudDownload className="h-3.5 w-3.5 text-sky-400" />
                <span>Pull & Merge</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={() => void pushUserCloudProfile()}
                onMouseEnter={() =>
                  onHoverDesc?.(
                    'Push Now: Uploads your current unified flat settings snapshot to your cloud user slot.'
                  )
                }
                onMouseLeave={() => onHoverDesc?.(null)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-95 ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-neutral-200'
                }`}
              >
                <CloudUpload className="h-3.5 w-3.5 text-emerald-400" />
                <span>Push Local</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="rounded accent-sky-500 cursor-pointer"
              />
              <span className={isLight ? 'text-neutral-600' : 'text-neutral-300'}>
                Auto-Push Changes
              </span>
            </label>
          </div>
        )}

        {/* Status or Error Banner */}
        {(errorMessage || statusMessage) && (
          <div
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center gap-2 ${
              errorMessage
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                : syncStatus === 'conflict'
                  ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                  : isLight
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
            }`}
          >
            {errorMessage ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            ) : syncStatus === 'conflict' ? (
              <GitMerge className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">{errorMessage || statusMessage}</span>
          </div>
        )}
      </div>

      {/* Git 3-Way Merge Conflict Resolver Card */}
      {conflicts.length > 0 && (
        <div
          className={`rounded-xl border p-3 flex flex-col gap-2 ${
            isLight
              ? 'bg-amber-500/10 border-amber-500/35 text-neutral-900'
              : 'bg-amber-500/10 border-amber-500/30 text-neutral-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <GitMerge className="h-4 w-4" />
              <span>Solve 3-Way Merge Conflicts ({conflicts.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void resolveConflicts('all-local')}
                className="px-2 py-1 rounded border text-[10px] font-bold uppercase bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border-neutral-600 cursor-pointer"
              >
                Keep All Mine
              </button>
              <button
                type="button"
                onClick={() => void resolveConflicts('all-dev')}
                className="px-2 py-1 rounded border text-[10px] font-bold uppercase bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40 cursor-pointer"
              >
                Use All Developer
              </button>
              <button
                type="button"
                onClick={() => void resolveConflicts('selected')}
                className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer"
              >
                Apply Selected
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {conflicts.map((item) => (
              <div
                key={item.key}
                className={`p-2 rounded-lg border grid grid-cols-12 items-center gap-2 text-xs ${
                  isLight
                    ? 'bg-white/90 border-neutral-200'
                    : 'bg-neutral-950/75 border-neutral-800'
                }`}
              >
                <div className="col-span-4 min-w-0">
                  <div className="font-semibold truncate">{item.label}</div>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">
                    Base: {formatSyncValuePreview(item.baseValue)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => selectConflictSource(item.key, 'local')}
                  className={`col-span-4 px-2 py-1 rounded border text-left font-mono text-[11px] truncate cursor-pointer transition ${
                    item.selectedSource === 'local'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-900/40 border-neutral-700/60 text-neutral-400'
                  }`}
                >
                  Mine: {formatSyncValuePreview(item.localValue)}
                </button>
                <button
                  type="button"
                  onClick={() => selectConflictSource(item.key, 'dev')}
                  className={`col-span-4 px-2 py-1 rounded border text-left font-mono text-[11px] truncate cursor-pointer transition ${
                    item.selectedSource === 'dev'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                      : 'bg-neutral-900/40 border-neutral-700/60 text-neutral-400'
                  }`}
                >
                  Dev: {formatSyncValuePreview(item.devValue)}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
