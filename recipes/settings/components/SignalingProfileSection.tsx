import React, { useEffect, useRef, useState } from 'react';
import {
  KeyRound,
  ChevronDown,
  Upload,
  ShieldCheck,
  Trash2,
  Activity,
  CheckCircle2,
  AlertCircle,
  Lock,
  Server,
  RotateCcw,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import { useSignalingProfileStore } from '../../../stores/signalingProfileStore';
import { useAppStore } from '../../../stores/appStore';

export interface SignalingProfileSectionProps {
  bordered?: boolean;
  onHover: (desc: string) => void;
  onLeave: () => void;
  isLight?: boolean;
}

/**
 * [Layer 2 Settings -> Advanced Tab -> Signaling Credential Bundle (.rctbnspib)]
 * Enforces strict 3-tier UI state mutex:
 *   - `imported-bundle`: Locks out Public & Custom broker fields; hides all plaintext URLs/credentials;
 *     requires clicking [Delete Imported Bundle] before custom server parameters can be modified.
 *   - `custom`: User-configured self-hosted relay override (replaces default Public EMQX broker).
 *   - `public`: Default best-effort fallback (`wss://relay.carsoccer.dev/mqtt`, No SLA).
 */
export const SignalingProfileSection: React.FC<SignalingProfileSectionProps> = React.memo(
  ({ bordered = false, onHover, onLeave, isLight = false }) => {
    const source = useSignalingProfileStore((s) => s.source);
    const shortHash = useSignalingProfileStore((s) => s.shortHash);
    const relayCount = useSignalingProfileStore((s) => s.relayCount);
    const relayLabels = useSignalingProfileStore((s) => s.relayLabels);
    const turnServerCount = useSignalingProfileStore((s) => s.turnServerCount);
    const customUrl = useSignalingProfileStore((s) => s.customUrl);
    const customUsername = useSignalingProfileStore((s) => s.customUsername);
    const noKeySimulationActive = useSignalingProfileStore((s) => s.noKeySimulationActive);
    const isBusy = useSignalingProfileStore((s) => s.isBusy);
    const isProbing = useSignalingProfileStore((s) => s.isProbing);
    const statusMessage = useSignalingProfileStore((s) => s.statusMessage);
    const errorMessage = useSignalingProfileStore((s) => s.errorMessage);
    const probeResults = useSignalingProfileStore((s) => s.probeResults);
    const importBundle = useSignalingProfileStore((s) => s.importBundle);
    const clearProfile = useSignalingProfileStore((s) => s.clearProfile);
    const saveCustomRelay = useSignalingProfileStore((s) => s.saveCustomRelay);
    const verifyRelays = useSignalingProfileStore((s) => s.verifyRelays);
    const clearMessages = useSignalingProfileStore((s) => s.clearMessages);

    const highlightSetting = useAppStore((s) => s.highlightSetting);
    const clearHighlightSetting = useAppStore((s) => s.clearHighlightSetting);

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [rawBundleText, setRawBundleText] = useState<string>('');
    const [pinCode, setPinCode] = useState<string>('');
    const [draftCustomUrl, setDraftCustomUrl] = useState<string>(customUrl);
    const [draftCustomUser, setDraftCustomUser] = useState<string>(customUsername);
    const [draftCustomPass, setDraftCustomPass] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      setDraftCustomUrl(customUrl);
      setDraftCustomUser(customUsername);
    }, [customUrl, customUsername]);

    useEffect(() => {
      if (highlightSetting === 'signaling-credential-bundle') {
        setIsExpanded(true);
        const timer = setTimeout(() => {
          clearHighlightSetting();
        }, 2200);
        return () => clearTimeout(timer);
      }
    }, [highlightSetting, clearHighlightSetting]);

    const { borderRadius, rowGap } = useSettingActionRowStore();

    const isImportedLocked = source === 'imported-bundle';
    const isHighlighted = highlightSetting === 'signaling-credential-bundle';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      clearMessages();
      setSelectedFileName(file.name);
      const text = await file.text();
      setRawBundleText(text);
      setIsExpanded(true);
    };

    const handleUnlockImport = async () => {
      if (!rawBundleText.trim()) return;
      const ok = await importBundle(rawBundleText, pinCode);
      if (ok) {
        setPinCode('');
        setRawBundleText('');
        setSelectedFileName('');
      }
    };

    const handleSaveCustom = () => {
      clearMessages();
      saveCustomRelay({
        url: draftCustomUrl.trim(),
        username: draftCustomUser.trim(),
        password: draftCustomPass,
      });
      setDraftCustomPass('');
    };

    const handleResetToPublic = () => {
      clearMessages();
      setDraftCustomUrl('');
      setDraftCustomUser('');
      setDraftCustomPass('');
      saveCustomRelay(null);
    };

    const statusBadge =
      source === 'imported-bundle' ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-emerald-500/15 border-emerald-500/35 text-emerald-400">
          Imported Bundle · {relayCount} Relay{relayCount === 1 ? '' : 's'} [#{shortHash}]
        </span>
      ) : source === 'dev-private' ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-emerald-500/15 border-emerald-500/35 text-emerald-400">
          Dev Private · {relayCount} Relay{relayCount === 1 ? '' : 's'} [#{shortHash}]
        </span>
      ) : source === 'custom' ? (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-sky-500/15 border-sky-500/35 text-sky-400">
          Custom Self-Hosted [#{shortHash}]
        </span>
      ) : (
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
            isLight
              ? 'bg-amber-500/15 border-amber-500/35 text-amber-800'
              : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
          }`}
        >
          Public Broker (Best-Effort / No SLA)
        </span>
      );

    const rowDescription =
      source === 'imported-bundle'
        ? `Locked to imported encrypted bundle [Hash #${shortHash}] (${relayCount} relay slots, ${turnServerCount} TURN ICE). Public & Custom brokers disabled.`
        : source === 'dev-private'
        ? `Active dev-private profile [Hash #${shortHash}] (${relayLabels.join(', ')})`
        : source === 'custom'
        ? `Using custom self-hosted relay [Hash #${shortHash}] (${customUrl}). Public broker bypassed.`
        : `Default fallback: Public EMQX Broker (wss://relay.carsoccer.dev/mqtt, Best-Effort / No SLA).${
            noKeySimulationActive ? ' [?nokey=1 simulation active]' : ''
          }`;

    const disclosureTrigger = (
      <div className="flex items-center gap-2">
        {statusBadge}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className={`inline-flex items-center gap-0.5 text-xs font-medium cursor-pointer transition-colors select-none py-0.5 px-1.5 rounded ${
            isLight
              ? 'text-neutral-600 hover:text-neutral-900'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <span className="underline underline-offset-3 decoration-current/60">
            {isExpanded ? 'Hide' : isImportedLocked ? 'Manage' : 'Configure'}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    );

    return (
      <div
        data-ui-element="compound-signaling-profile-section"
        style={{
          borderRadius: `${Math.max(0, borderRadius)}px`,
          gap: `${rowGap}px`,
        }}
        className={`flex flex-col w-full transition-colors ${
          isHighlighted ? 'ring-2 ring-amber-400/80 rounded-xl' : ''
        } ${
          bordered
            ? isLight
              ? 'p-2 border bg-neutral-50/90 border-neutral-200 shadow-2xs'
              : 'p-2 border bg-neutral-850/80 border-neutral-700/80'
            : ''
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".rctbnspib,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        <SettingActionRow
          icon={KeyRound}
          iconName="key-round"
          title="Signaling Credential Bundle (.rctbnspib)"
          description={rowDescription}
          bordered={false}
          onAction={() => setIsExpanded((prev) => !prev)}
          hoverDescription="Signaling Credential Bundle (.rctbnspib): Manage Public Broker fallback, Custom Self-Hosted relay override, or locked .rctbnspib encrypted bundle."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
          rightSlot={disclosureTrigger}
        />

        {isExpanded && (
          <div
            style={{ borderRadius: `${Math.max(6, borderRadius)}px` }}
            className={`mt-1 p-3 border flex flex-col gap-3 w-full transition-all ${
              isLight
                ? 'bg-neutral-100/75 border-neutral-200/90 text-neutral-800'
                : 'bg-neutral-900/55 border-neutral-800/90 text-neutral-200'
            }`}
          >
            {/* 1. Import .rctbnspib Bundle Row */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-800'
                    : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{selectedFileName || 'Choose .rctbnspib File'}</span>
              </button>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-Digit PIN"
                value={pinCode}
                onChange={(e) => {
                  clearMessages();
                  setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                className={`w-28 px-2.5 py-1.5 rounded-lg text-xs font-mono tracking-widest text-center border outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-900 focus:border-amber-500'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-amber-400'
                }`}
              />

              <button
                type="button"
                disabled={isBusy || !rawBundleText.trim() || pinCode.length !== 6}
                onClick={handleUnlockImport}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-800'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isBusy ? 'Unlocking...' : 'Unlock & Import'}</span>
              </button>

              <button
                type="button"
                disabled={isProbing}
                onClick={() => void verifyRelays()}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700'
                    : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>{isProbing ? 'Probing...' : 'Verify Relays'}</span>
              </button>

              {isImportedLocked && (
                <button
                  type="button"
                  onClick={() => clearProfile()}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ml-auto ${
                    isLight
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-700'
                      : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Imported Bundle</span>
                </button>
              )}
            </div>

            {/* 2. Mutex Section: Locked Imported Bundle Notice vs Custom Self-Hosted Relay Form */}
            {isImportedLocked ? (
              <div
                data-ui-element="imported-bundle-mutex-lock-notice"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                  isLight
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>
                  An imported encrypted credential bundle (<strong>#{shortHash}</strong>) is
                  currently active. Public broker fallback and custom server parameters are
                  disabled. To configure a custom self-hosted server, click{' '}
                  <strong>Delete Imported Bundle</strong> first.
                </span>
              </div>
            ) : (
              <div
                data-ui-element="custom-self-hosted-relay-form"
                className={`flex flex-col gap-2 pt-2 border-t ${
                  isLight ? 'border-neutral-200/80' : 'border-neutral-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 font-semibold">
                    <Server className="h-3.5 w-3.5 text-sky-400" />
                    <span>Custom Self-Hosted Relay Override (Replaces Public EMQX)</span>
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400">
                    Active Hash: #{shortHash}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="wss://relay.carsoccer.dev/mqtt (Default Public)"
                    value={draftCustomUrl}
                    onChange={(e) => setDraftCustomUrl(e.target.value)}
                    className={`flex-1 min-w-[220px] px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-sky-400'
                    }`}
                  />

                  <input
                    type="text"
                    placeholder="Username (Optional)"
                    value={draftCustomUser}
                    onChange={(e) => setDraftCustomUser(e.target.value)}
                    className={`w-36 px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-sky-400'
                    }`}
                  />

                  <input
                    type="password"
                    placeholder="Password / Token"
                    value={draftCustomPass}
                    onChange={(e) => setDraftCustomPass(e.target.value)}
                    className={`w-36 px-2.5 py-1.5 rounded-lg text-xs font-mono border outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-neutral-300 text-neutral-900 focus:border-sky-500'
                        : 'bg-neutral-950 border-neutral-700 text-neutral-100 focus:border-sky-400'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-800'
                        : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    <span>Apply Custom</span>
                  </button>

                  {source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleResetToPublic}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-600'
                          : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Use Public</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {statusMessage && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {probeResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5 pt-1">
                {probeResults.map((probe) => (
                  <div
                    key={probe.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-[11px] font-mono ${
                      probe.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="truncate">{probe.label}</span>
                    <span className="shrink-0 ml-2 font-semibold">
                      {probe.ok ? `${probe.rttMs}ms` : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

SignalingProfileSection.displayName = 'SignalingProfileSection';
