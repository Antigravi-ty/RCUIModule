import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Info,
  KeyRound,
  Plus,
  RefreshCw,
  Sliders,
  Tag,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  Pencil,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { UnderlineTabs, type TabItem } from '../primitives/UnderlineTabs';
import { UnderConstructionPlaceholder } from '../primitives/UnderConstructionPlaceholder';
import { useAppStore } from '../stores/appStore';
import { useCloudProfileSyncStore } from '../stores/cloudProfileSyncStore';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';

export type DevRemoteProfileTabId = 'set-profile' | 'manage-accounts';

export interface Layer3DevRemoteProfileRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  initialTab?: DevRemoteProfileTabId;
  sizing?: PanelSizingConfig;
}

export const Layer3DevRemoteProfileRecipe: React.FC<
  Layer3DevRemoteProfileRecipeProps
> = ({ isLight = false, onBack: propOnBack, initialTab = 'set-profile', sizing: propSizing }) => {
  const storeGoBack = useAppStore((s) => s.goBack);
  const onBack = propOnBack ?? storeGoBack;

  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-remote-profile'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-remote-profile']
  );
  const panelBodyPaddingX = useMenuLayoutStore((s) => s.panelBodyPaddingX ?? 18);
  const sizing = propSizing ?? storeSizing;

  const available = useCloudProfileSyncStore((s) => s.available);
  const canManageAccounts = useCloudProfileSyncStore((s) => s.canManageAccounts);
  const accounts = useCloudProfileSyncStore((s) => s.accounts);
  const isLoadingAccounts = useCloudProfileSyncStore((s) => s.isLoadingAccounts);
  const syncStatus = useCloudProfileSyncStore((s) => s.syncStatus);
  const statusMessage = useCloudProfileSyncStore((s) => s.statusMessage);
  const errorMessage = useCloudProfileSyncStore((s) => s.errorMessage);
  const refreshAccounts = useCloudProfileSyncStore((s) => s.refreshAccounts);
  const upsertAccount = useCloudProfileSyncStore((s) => s.upsertAccount);
  const deleteAccount = useCloudProfileSyncStore((s) => s.deleteAccount);
  const startRemoteTuningSession = useCloudProfileSyncStore(
    (s) => s.startRemoteTuningSession
  );

  const [activeTab, setActiveTab] = useState<DevRemoteProfileTabId>(initialTab);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  // Manage Accounts form state (plaintext visible)
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  useEffect(() => {
    if (available) {
      void refreshAccounts();
    }
  }, [available, refreshAccounts]);

  const tabs: TabItem[] = [
    {
      id: 'set-profile',
      label: 'Set Others Profile',
      icon: <UserCog className="h-3.5 w-3.5" />,
    },
    {
      id: 'manage-accounts',
      label: 'Manage Accounts',
      icon: <Users className="h-3.5 w-3.5" />,
    },
  ];

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;
    setIsSavingAccount(true);
    try {
      const ok = await upsertAccount(usernameInput, passwordInput, aliasInput);
      if (ok) {
        setUsernameInput('');
        setPasswordInput('');
        setAliasInput('');
      }
    } finally {
      setIsSavingAccount(false);
    }
  };

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader
        title="REMOTE PROFILE MANAGEMENT"
        onBack={onBack}
        isLight={isLight}
      />

      <div
        style={{
          paddingLeft: `${panelBodyPaddingX}px`,
          paddingRight: `${panelBodyPaddingX}px`,
        }}
        className="pt-2 w-full shrink-0"
        data-panel-section="tabs"
      >
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as DevRemoteProfileTabId)}
          isLight={isLight}
          size="sm"
          fullWidth={true}
        />
      </div>

      <PanelContent scrollable>
        {!available || !canManageAccounts ? (
          <UnderConstructionPlaceholder
            title="Developer Cloud Profile Credentials Required"
            description="Remote Profile Management requires the developer private profile (CNRCConfigDevV1) to inspect and push user dev slots."
            badge="DEV CREDENTIALS REQUIRED"
            isLight={isLight}
          />
        ) : activeTab === 'set-profile' ? (
          <div className="flex flex-col gap-2.5 w-full">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div
                className={`text-xs ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Select an account below to enter{' '}
                <span
                  className={`font-mono font-bold ${
                    isLight ? 'text-neutral-900' : 'text-white'
                  }`}
                >
                  SETTINGS # &lt;alias&gt;
                </span>{' '}
                remote tuning mode.
              </div>
              <button
                type="button"
                onClick={() => void refreshAccounts()}
                disabled={isLoadingAccounts}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0 ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                }`}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoadingAccounts ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>

            {/* Accounts Selection List */}
            {accounts.length === 0 ? (
              <div
                className={`rounded-xl border p-6 text-center flex flex-col items-center gap-2 ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    : 'bg-neutral-900/50 border-neutral-800 text-neutral-400'
                }`}
              >
                <Users className="h-6 w-6 opacity-60" />
                <div className="text-xs font-semibold">
                  {isLoadingAccounts
                    ? 'Scanning cloud account directory...'
                    : 'No cloud accounts found yet.'}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('manage-accounts')}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs cursor-pointer transition"
                >
                  Create Account in Manage Accounts
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {accounts.map((acc) => (
                  <div
                    key={acc.userId}
                    onMouseEnter={() =>
                      setHoveredDesc(
                        `Enter Remote Profile Tuning for #${acc.alias || acc.userId} (${acc.userId}). Local developer settings are automatically stashed and restored on exit.`
                      )
                    }
                    onMouseLeave={() => setHoveredDesc(null)}
                    className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 transition-all ${
                      isLight
                        ? 'bg-white/90 hover:bg-neutral-50 border-neutral-200/90 text-neutral-900'
                        : 'bg-neutral-900/70 hover:bg-neutral-800/75 border-neutral-800/90 text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                        #{(acc.alias || acc.userId).slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm tracking-tight">
                            # {acc.alias || acc.userId}
                          </span>
                          <span
                            className={`font-mono text-xs px-1.5 py-0.5 rounded border ${
                              isLight
                                ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                                : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
                            }`}
                          >
                            {acc.userId}
                          </span>
                          {acc.password && (
                            <span
                              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                                isLight
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                                  : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                              }`}
                            >
                              pw: {acc.password}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] font-mono mt-0.5 flex items-center gap-2 ${
                            isLight ? 'text-neutral-500' : 'text-neutral-400'
                          }`}
                        >
                          <span>user rev #{acc.userRev}</span>
                          <span>·</span>
                          <span>dev rev #{acc.devRev}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={syncStatus === 'syncing'}
                      onClick={() => void startRemoteTuningSession(acc)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shrink-0"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>Tune Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(errorMessage || statusMessage) && (
              <div
                className={`px-3 py-1.5 rounded-lg border text-xs ${
                  errorMessage
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                    : isLight
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800'
                      : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                }`}
              >
                {errorMessage || statusMessage}
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Manage Accounts (Plaintext Username / Password / Alias CRUD) */
          <div className="flex flex-col gap-2.5 w-full">
            <form
              onSubmit={handleSaveAccount}
              className={`rounded-xl border p-3 flex flex-col gap-2 ${
                isLight
                  ? 'bg-white/90 border-neutral-200/90'
                  : 'bg-neutral-900/70 border-neutral-800/90'
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Add or Update Cloud Account (Plaintext Directory)</span>
              </div>

              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 relative flex items-center">
                  <UserCheck
                    className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Username (adamzhang)"
                    className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div className="col-span-3 relative flex items-center">
                  <KeyRound
                    className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Password (12341234)"
                    className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div className="col-span-3 relative flex items-center">
                  <Tag
                    className={`h-3.5 w-3.5 absolute left-2.5 pointer-events-none ${
                      isLight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  />
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="Alias (zjq)"
                    className={`w-full pl-8 pr-2 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                      isLight
                        ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 focus:border-sky-500'
                    }`}
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingAccount}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-neutral-950 font-bold text-xs cursor-pointer transition active:scale-95"
                  >
                    {isSavingAccount ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </form>

            {/* Plaintext Account Table */}
            <div className="flex flex-col gap-1.5">
              {accounts.map((acc) => (
                <div
                  key={acc.userId}
                  className={`rounded-xl border px-3 py-2 grid grid-cols-12 items-center gap-2 text-xs font-mono ${
                    isLight
                      ? 'bg-white/90 border-neutral-200 text-neutral-900'
                      : 'bg-neutral-900/70 border-neutral-800 text-neutral-100'
                  }`}
                >
                  <div className="col-span-3 truncate font-bold text-sky-400">
                    #{acc.alias || acc.userId}
                  </div>
                  <div className="col-span-3 truncate">{acc.userId}</div>
                  <div className="col-span-3 truncate text-amber-400">
                    {acc.password || '(hash-only)'}
                  </div>
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput(acc.userId);
                        setPasswordInput(acc.password || '');
                        setAliasInput(acc.alias || acc.userId);
                      }}
                      title="Load into editor"
                      className={`p-1.5 rounded-lg border cursor-pointer transition ${
                        isLight
                          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-700'
                          : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
                      }`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void startRemoteTuningSession(acc)}
                      title={`Tune #${acc.alias || acc.userId}`}
                      className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-sans font-bold text-[11px] cursor-pointer transition"
                    >
                      Tune
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAccount(acc.userId)}
                      title={`Delete ${acc.userId}`}
                      className="p-1.5 rounded-lg border bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-400 cursor-pointer transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Manage cloud user accounts (username, password, #alias) and remotely tune user profiles in real time."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
