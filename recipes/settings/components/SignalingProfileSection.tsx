import React, { useRef, useState } from 'react';
import {
  KeyRound,
  ChevronDown,
  Upload,
  ShieldCheck,
  Trash2,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SettingActionRow } from '../../../compounds/SettingActionRow';
import { useSettingActionRowStore } from '../../../stores/settingRowStore';
import { useSignalingProfileStore } from '../../../stores/signalingProfileStore';

export interface SignalingProfileSectionProps {
  bordered?: boolean;
  onHover: (desc: string) => void;
  onLeave: () => void;
  isLight?: boolean;
}

/**
 * [Layer 2 Settings -> Advanced Tab -> Signaling Credential Bundle (.rctbnspib)]
 * Decoupled UI section for importing time-bound 6-digit PIN encrypted `.rctbnspib` bundles,
 * inspecting active relay count & canonical profile hash, verifying connectivity, or clearing local storage.
 */
export const SignalingProfileSection: React.FC<SignalingProfileSectionProps> = React.memo(
  ({ bordered = false, onHover, onLeave, isLight = false }) => {
    const loaded = useSignalingProfileStore((s) => s.loaded);
    const source = useSignalingProfileStore((s) => s.source);
    const profileHash = useSignalingProfileStore((s) => s.profileHash);
    const relayCount = useSignalingProfileStore((s) => s.relayCount);
    const relayLabels = useSignalingProfileStore((s) => s.relayLabels);
    const turnServerCount = useSignalingProfileStore((s) => s.turnServerCount);
    const isBusy = useSignalingProfileStore((s) => s.isBusy);
    const isProbing = useSignalingProfileStore((s) => s.isProbing);
    const statusMessage = useSignalingProfileStore((s) => s.statusMessage);
    const errorMessage = useSignalingProfileStore((s) => s.errorMessage);
    const probeResults = useSignalingProfileStore((s) => s.probeResults);
    const importBundle = useSignalingProfileStore((s) => s.importBundle);
    const clearProfile = useSignalingProfileStore((s) => s.clearProfile);
    const verifyRelays = useSignalingProfileStore((s) => s.verifyRelays);
    const clearMessages = useSignalingProfileStore((s) => s.clearMessages);

    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string>('');
    const [rawBundleText, setRawBundleText] = useState<string>('');
    const [pinCode, setPinCode] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { borderRadius, rowGap } = useSettingActionRowStore();

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

    const statusBadge = loaded ? (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold bg-emerald-500/15 border-emerald-500/35 text-emerald-400">
        {source === 'dev-private' ? 'Dev Private' : 'Active'} · {relayCount} Relay
        {relayCount === 1 ? '' : 's'}
        {profileHash ? ` [#${profileHash.slice(0, 8)}]` : ''}
      </span>
    ) : (
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
          isLight
            ? 'bg-neutral-200/80 border-neutral-300 text-neutral-600'
            : 'bg-neutral-800 border-neutral-700 text-neutral-400'
        }`}
      >
        No Profile
      </span>
    );

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
            {isExpanded ? 'Hide' : loaded ? 'Manage' : 'Import'}
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
          description={
            loaded
              ? `Loaded ${relayCount} signaling relay(s) (${relayLabels.join(', ')}) and ${turnServerCount} TURN ICE server(s)`
              : 'Zero hardcoded public relays. Import a time-bound .rctbnspib bundle with a 6-digit PIN to unlock online rooms.'
          }
          bordered={false}
          onAction={() => setIsExpanded((prev) => !prev)}
          hoverDescription="Signaling Credential Bundle (.rctbnspib): Import a time-bound AES-256-GCM encrypted signaling profile shared by a trusted peer using its 6-digit unlock code."
          onHover={(desc) => desc && onHover(desc)}
          onLeave={onLeave}
          isLight={isLight}
          rightSlot={disclosureTrigger}
        />

        {isExpanded && (
          <div
            style={{ borderRadius: `${Math.max(6, borderRadius)}px` }}
            className={`mt-1 p-3 border flex flex-col gap-2.5 w-full transition-all ${
              isLight
                ? 'bg-neutral-100/75 border-neutral-200/90 text-neutral-800'
                : 'bg-neutral-900/55 border-neutral-800/90 text-neutral-200'
            }`}
          >
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

              {loaded && (
                <>
                  <button
                    type="button"
                    disabled={isProbing}
                    onClick={() => verifyRelays()}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                      isLight
                        ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700'
                        : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{isProbing ? 'Probing...' : 'Verify Relays'}</span>
                  </button>

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
                    <span>Clear</span>
                  </button>
                </>
              )}
            </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
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
