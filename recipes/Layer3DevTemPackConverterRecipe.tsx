import React, { useRef, useState } from 'react';
import {
  FileArchive,
  Upload,
  Download,
  FolderPlus,
  Play,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent } from '../layout/Panel';
import { PanelFooter } from '../layout/PanelFooter';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { DEFAULT_PANEL_SIZING, type PanelSizingConfig } from '../tokens/menuLayoutTokens';
import { useAppStore } from '../stores/appStore';
import { useStaticTrainingPackStore } from '../stores/staticTrainingPackStore';
import {
  convertTemFileToRCSPackBundle,
  exportStaticTrainingPackRCSPack,
  type TemToRCSPackConversionResult,
} from '../config/staticTrainingPackCodec';

export interface Layer3DevTemPackConverterRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  onStartPlaySession?: (uuid: string) => void | Promise<void>;
  onStartEditSession?: (uuid: string) => void | Promise<void>;
  sizing?: PanelSizingConfig;
}

function radToDegLabel(rad: number): string {
  return `${((rad * 180) / Math.PI).toFixed(1)} deg`;
}

export const Layer3DevTemPackConverterRecipe: React.FC<
  Layer3DevTemPackConverterRecipeProps
> = ({
  isLight = false,
  onBack,
  onStartPlaySession,
  onStartEditSession,
  sizing: propSizing,
}) => {
  const goBack = useAppStore((s) => s.goBack);
  const storeSizing = useMenuLayoutStore(
    (s) =>
      s.panels?.['layer3-dev-tem-pack-converter'] ??
      DEFAULT_PANEL_SIZING['layer3-dev-tem-pack-converter']
  );
  const sizing = propSizing ?? storeSizing;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [conversion, setConversion] = useState<TemToRCSPackConversionResult | null>(null);
  const [selectedShotIdx, setSelectedShotIdx] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);
  const [savedToVfs, setSavedToVfs] = useState<boolean>(false);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setSavedToVfs(false);

    try {
      const result = await convertTemFileToRCSPackBundle(file);
      setConversion(result);
      setSelectedShotIdx(0);
      setStatusMsg(
        `Parsed "${result.metadata.title}" (${result.items.length} shots, ${result.parsedTem.temVariant} format).`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse .Tem file';
      setErrorMsg(msg);
      setConversion(null);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveToLibrary = async (): Promise<string | null> => {
    if (!conversion) return null;
    try {
      const meta = await useStaticTrainingPackStore
        .getState()
        .importConvertedTemBundle(conversion.metadata, conversion.items);
      setSavedToVfs(true);
      setStatusMsg(`Saved "${meta.title}" (${meta.itemCount} shots) to Static Training Packs VFS.`);
      return meta.uuid;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save to VFS';
      setErrorMsg(msg);
      return null;
    }
  };

  const handleExportRCSPack = async () => {
    if (!conversion) return;
    try {
      const filename = await exportStaticTrainingPackRCSPack(
        conversion.metadata,
        conversion.items
      );
      setStatusMsg(`Exported ${filename}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export .RCSPack';
      setErrorMsg(msg);
    }
  };

  const handleLaunchPlay = async () => {
    const uuid = await handleSaveToLibrary();
    if (!uuid) return;
    await onStartPlaySession?.(uuid);
  };

  const handleLaunchEdit = async () => {
    const uuid = await handleSaveToLibrary();
    if (!uuid) return;
    await onStartEditSession?.(uuid);
  };

  const activeShot =
    conversion?.items[
      Math.max(0, Math.min((conversion?.items.length || 1) - 1, selectedShotIdx))
    ] ?? null;

  const surfaceCls = isLight
    ? 'bg-neutral-100/90 border-neutral-300 text-neutral-900'
    : 'bg-white/[0.04] border-white/[0.10] text-neutral-100';

  const subtleTextCls = isLight ? 'text-neutral-600' : 'text-neutral-400';

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title="TEM TO RCSPACK SANDBOX"
        onBack={onBack ?? goBack}
        isLight={isLight}
      />

      <PanelContent scrollable className="flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".Tem,.tem,.bin"
          onChange={(e) => void handleFileSelected(e)}
          className="hidden"
        />

        {/* Top Upload & Quick Actions Bar */}
        <div className={`p-3 rounded-xl border flex flex-col gap-2.5 ${surfaceCls}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <FileArchive className="h-4 w-4 text-cyan-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold tracking-tight truncate">
                  Rocket League .Tem Training Pack Importer & Converter
                </span>
                <span className={`text-[11px] truncate ${subtleTextCls}`}>
                  Supports encrypted .Tem (v34 Local & v32 Online bUnowned) and .decrypted.bin payloads
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() =>
                setHoveredDesc(
                  'Select a .Tem or .decrypted.bin training pack file to decrypt, parse UE3 properties, and convert to .RCSPack.'
                )
              }
              onMouseLeave={() => setHoveredDesc(null)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isLight
                  ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/40 text-cyan-200'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Select .Tem File</span>
            </button>
          </div>

          {errorMsg && (
            <div className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{errorMsg}</span>
            </div>
          )}

          {statusMsg && !errorMsg && (
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{statusMsg}</span>
            </div>
          )}

          {conversion && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleSaveToLibrary()}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Import converted pack directly into RocketCompanion Static Training Packs IndexedDB VFS.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  savedToVfs
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                    : isLight
                    ? 'bg-white hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-white/[0.07] hover:bg-white/[0.13] border-white/[0.14] text-neutral-100'
                }`}
              >
                <FolderPlus className="h-3.5 w-3.5" />
                <span>{savedToVfs ? 'Saved in Library' : 'Save to Library'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleExportRCSPack()}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Download converted pack as a GZIP-compressed .RCSPack archive file.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                  isLight
                    ? 'bg-white hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                    : 'bg-white/[0.07] hover:bg-white/[0.13] border-white/[0.14] text-neutral-100'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export .RCSPack</span>
              </button>

              <button
                type="button"
                onClick={() => void handleLaunchPlay()}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Save to VFS and immediately launch Play Mode in the 3D Arena with this converted .Tem pack.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-200"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play in Arena</span>
              </button>

              <button
                type="button"
                onClick={() => void handleLaunchEdit()}
                onMouseEnter={() =>
                  setHoveredDesc(
                    'Save to VFS and open Interactive Shot Editor (Edit Mode) in the 3D Arena.'
                  )
                }
                onMouseLeave={() => setHoveredDesc(null)}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/40 text-amber-200"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit in Arena</span>
              </button>
            </div>
          )}
        </div>

        {/* Parsed Pack Overview & Shot Inspector */}
        {conversion ? (
          <div className="grid grid-cols-12 gap-3">
            {/* Left Column: Metadata & Shot List */}
            <div className="col-span-5 flex flex-col gap-2.5">
              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${surfaceCls}`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                    Pack Header & Envelope
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono">
                    {conversion.parsedTem.temVariant === 'online-published'
                      ? 'v32 Online'
                      : 'v34 Local'}
                  </span>
                </div>
                <div className="text-xs font-bold truncate" title={conversion.metadata.title}>
                  {conversion.metadata.title}
                </div>
                <div className={`text-[11px] font-mono truncate ${subtleTextCls}`}>
                  UUID: {conversion.metadata.uuid}
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                  <div>
                    <span className={subtleTextCls}>Shots: </span>
                    <span className="font-semibold">{conversion.items.length}</span>
                  </div>
                  <div>
                    <span className={subtleTextCls}>Code: </span>
                    <span className="font-mono">
                      {String(conversion.parsedTem.properties.Code || 'Local')}
                    </span>
                  </div>
                  <div>
                    <span className={subtleTextCls}>Map: </span>
                    <span className="font-mono">
                      {String(conversion.parsedTem.properties.MapName || 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className={subtleTextCls}>CRC32: </span>
                    <span className="font-mono">
                      {conversion.parsedTem.header.crcValid === null
                        ? 'Raw Bin'
                        : conversion.parsedTem.header.crcValid
                        ? 'Verified'
                        : 'Mismatch'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rounds Selector */}
              <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${surfaceCls}`}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                  Converted Shots ({conversion.items.length})
                </div>
                <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                  {conversion.items.map((shot, idx) => {
                    const isSelected = idx === selectedShotIdx;
                    return (
                      <button
                        key={shot.id}
                        type="button"
                        onClick={() => setSelectedShotIdx(idx)}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-semibold'
                            : isLight
                            ? 'hover:bg-neutral-200/70 text-neutral-700'
                            : 'hover:bg-white/[0.06] text-neutral-300'
                        }`}
                      >
                        <span className="truncate">{shot.name}</span>
                        <span className="text-[10px] font-mono opacity-75 shrink-0">
                          {shot.ball.speed.toFixed(0)} UU/s · {shot.timeoutSeconds}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Active Shot Mapping & Description JSON Dump */}
            <div className="col-span-7 flex flex-col gap-2.5">
              {activeShot && (
                <div className={`p-3 rounded-xl border flex flex-col gap-2 ${surfaceCls}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      {activeShot.name} — Mapped RCSPack Physics
                    </span>
                    <span className="text-[10px] font-mono opacity-75">
                      Timeout: {activeShot.timeoutSeconds}s
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-black/20 border border-white/[0.06] flex flex-col gap-1">
                      <span className="font-bold text-amber-300">
                        Car (DynamicSpawnPointMesh)
                      </span>
                      <div className="font-mono text-[10px]">
                        Pos: [
                        {activeShot.car.location.map((n) => n.toFixed(1)).join(', ')}]
                      </div>
                      <div className="font-mono text-[10px]">
                        Yaw: {radToDegLabel(activeShot.car.headingYaw)} | Pitch:{' '}
                        {radToDegLabel(activeShot.car.headingPitch)}
                      </div>
                      <div className="font-mono text-[10px]">
                        SnapToGround: {String(activeShot.car.snapToGround)}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-black/20 border border-white/[0.06] flex flex-col gap-1">
                      <span className="font-bold text-sky-300">
                        Ball (Ball_GameEditor)
                      </span>
                      <div className="font-mono text-[10px]">
                        Pos: [
                        {activeShot.ball.location.map((n) => n.toFixed(1)).join(', ')}]
                      </div>
                      <div className="font-mono text-[10px]">
                        Speed: {activeShot.ball.speed.toFixed(1)} UU/s
                      </div>
                      <div className="font-mono text-[10px]">
                        Vel Dir: {radToDegLabel(activeShot.ball.speedYaw)} /{' '}
                        {radToDegLabel(activeShot.ball.speedPitch)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={`p-3 rounded-xl border flex flex-col gap-1.5 ${surfaceCls}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                    Description JSON Dump (Unmapped .Tem Properties)
                  </span>
                  <span className={`text-[10px] font-mono ${subtleTextCls}`}>
                    metadata.description ({conversion.metadata.description.length} chars)
                  </span>
                </div>
                <textarea
                  readOnly
                  value={conversion.metadata.description}
                  rows={8}
                  className={`w-full p-2 rounded-lg border font-mono text-[10px] leading-relaxed outline-none resize-none ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-800'
                      : 'bg-black/35 border-white/[0.08] text-neutral-300'
                  }`}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-center gap-2 ${surfaceCls}`}
          >
            <Sparkles className="h-6 w-6 text-cyan-400 opacity-80" />
            <div className="text-xs font-semibold">
              No .Tem Training Pack Loaded Yet
            </div>
            <div className={`text-[11px] max-w-md ${subtleTextCls}`}>
              Click &quot;Select .Tem File&quot; above to decrypt and parse any Rocket League
              Custom Training file (.Tem). Both Local Authoring (LicenseeVersion 34) and
              Online Published (LicenseeVersion 32, bUnowned) formats are supported, with
              all extra attributes preserved as JSON inside the pack description.
            </div>
          </div>
        )}
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Developer Sandbox: Decrypts Rocket League .Tem training packs into .RCSPack format with full JSON attribute preservation."
        hoveredDescription={hoveredDesc}
        icon={<Info className="h-3.5 w-3.5 text-neutral-400 shrink-0" />}
      />
    </PanelContainer>
  );
};
