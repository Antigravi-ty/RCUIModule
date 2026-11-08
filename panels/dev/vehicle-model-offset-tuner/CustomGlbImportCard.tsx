import React, { useRef, useState } from 'react';
import { Upload, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { VEHICLE_ALIGN_PRESET_OPTIONS } from '../../../config/vehicleExtendedDescriptorsConfig';
import type { VehicleDescriptor } from '../../../config/vehicleTunerConfig';

export interface ImportedGlbReportSummary {
  vehicleId: string;
  fileName: string;
  alignPreset: string;
  appliedGeometryScale: number;
  importRevision?: number;
  byteLength?: number;
  importedAtIso?: string;
  unscaledBounds?: {
    length: number;
    height: number;
    width: number;
  };
  scaledBounds?: {
    length: number;
    height: number;
    width: number;
  };
  bindings?: Array<{
    meshName: string;
    materialName: string;
    boundSlot: string;
    isFallback: boolean;
  }>;
  fallbackMaterials?: string[];
}

export interface CustomGlbImportCardProps {
  selectedCar: string;
  descriptor: VehicleDescriptor;
  onImportGlb: (
    vehicleId: string,
    arrayBuffer: ArrayBuffer,
    fileName: string,
    alignPreset: string
  ) => Promise<ImportedGlbReportSummary | null>;
  onApplyAlignPreset: (vehicleId: string, alignPreset: string) => void;
  isLight: boolean;
  cardClass: string;
}

export const CustomGlbImportCard: React.FC<CustomGlbImportCardProps> = ({
  selectedCar,
  descriptor,
  onImportGlb,
  onApplyAlignPreset,
  isLight,
  cardClass,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [presetByCar, setPresetByCar] = useState<Record<string, string>>({});
  const [reportsByCar, setReportsByCar] = useState<Record<string, ImportedGlbReportSummary>>({});
  const [uploadCountByCar, setUploadCountByCar] = useState<Record<string, number>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const alignPreset = presetByCar[selectedCar] || 'auto';
  const lastReport = reportsByCar[selectedCar] || null;

  const importGlbFile = async (file: File, inputEl?: HTMLInputElement | null) => {
    setIsImporting(true);
    setErrorMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const activePreset = presetByCar[selectedCar] || 'auto';
      const report = await onImportGlb(selectedCar, buffer, file.name, activePreset);
      if (report) {
        const targetId = report.vehicleId || selectedCar;
        const nextCount = (uploadCountByCar[targetId] ?? 0) + 1;
        const stamp = new Date().toISOString();
        setUploadCountByCar((prev) => ({ ...prev, [targetId]: nextCount }));
        setPresetByCar((prev) => ({
          ...prev,
          [targetId]: report.alignPreset || activePreset,
        }));
        setReportsByCar((prev) => ({
          ...prev,
          [targetId]: {
            ...report,
            importRevision: report.importRevision ?? nextCount,
            byteLength: report.byteLength ?? buffer.byteLength,
            importedAtIso: report.importedAtIso || stamp,
          },
        }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      console.warn('[CustomGlbImportCard] Failed to import custom GLB:', err);
    } finally {
      if (inputEl) {
        inputEl.value = '';
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFileInputKey((k) => k + 1);
      setIsImporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) {
      inputEl.value = '';
      return;
    }
    await importGlbFile(file, inputEl);
  };

  const handleTriggerFileDialog = () => {
    if (isImporting) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isImporting) return;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    await importGlbFile(file, null);
  };

  const handlePresetChange = (nextPreset: string) => {
    setPresetByCar((prev) => ({ ...prev, [selectedCar]: nextPreset }));
    onApplyAlignPreset(selectedCar, nextPreset);
    if (lastReport) {
      setReportsByCar((prev) => ({
        ...prev,
        [selectedCar]: {
          ...lastReport,
          alignPreset: nextPreset,
        },
      }));
    }
  };

  const activePresetMeta =
    VEHICLE_ALIGN_PRESET_OPTIONS.find((opt) => opt.id === alignPreset) ||
    VEHICLE_ALIGN_PRESET_OPTIONS[0];

  const fallbackCount = lastReport?.fallbackMaterials?.length ?? 0;
  const uploadRevision = lastReport?.importRevision ?? uploadCountByCar[selectedCar] ?? 0;
  const timeStampLabel = lastReport?.importedAtIso
    ? lastReport.importedAtIso.slice(11, 19)
    : null;

  return (
    <div
      className={`${cardClass} transition-colors ${
        isDragOver ? 'ring-2 ring-sky-400/80 border-sky-400' : ''
      }`}
      data-ui-element="custom-glb-import-card"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-[11px] uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Experimental GLB Import & Align Presets
        </span>
        <span className="text-[10px] font-mono opacity-75">
          Target: <strong>{descriptor.name}</strong>
          {uploadRevision > 0 ? ` (#${uploadRevision})` : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
        <div>
          <input
            key={fileInputKey}
            ref={fileInputRef}
            type="file"
            accept=".glb,model/gltf-binary"
            onClick={(e) => {
              e.currentTarget.value = '';
            }}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={isImporting}
            onClick={handleTriggerFileDialog}
            title="Select or re-upload a .glb file (supports repeated uploads of modified files or drag-and-drop)"
            className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              isLight
                ? 'bg-sky-600 hover:bg-sky-500 border-sky-700 text-white'
                : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/50 text-sky-200'
            }`}
          >
            {uploadRevision > 0 ? (
              <RefreshCw className={`h-3.5 w-3.5 ${isImporting ? 'animate-spin' : ''}`} />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>
              {isImporting
                ? 'Importing GLB...'
                : uploadRevision > 0
                ? 'Re-Upload / Replace .GLB'
                : 'Import / Replace .GLB'}
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold opacity-75">
            Align Preset (Persists Across Re-Uploads)
          </label>
          <select
            value={alignPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            aria-label="Align Preset"
            className={`w-full px-2 py-1 rounded-lg border text-[11px] font-medium outline-none ${
              isLight
                ? 'bg-white border-neutral-300 text-neutral-900'
                : 'bg-neutral-900 border-neutral-700 text-neutral-100'
            }`}
          >
            {VEHICLE_ALIGN_PRESET_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[10px] opacity-75 leading-snug">
        {activePresetMeta.description}. Standard 7 material slots (<code>body</code>,{' '}
        <code>window</code>, <code>border</code>, <code>bottom</code>, <code>metal</code>,{' '}
        <code>front</code>, <code>back</code>) auto-bind by substring; unrecognized names fall back
        to <code>body</code> and warn in console.
      </div>

      {errorMessage && (
        <div className="p-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-[10px] font-mono">
          Import Error: {errorMessage}
        </div>
      )}

      {lastReport && lastReport.vehicleId === selectedCar && (
        <div
          className={`p-2 rounded-lg border font-mono text-[10px] flex flex-col gap-1 ${
            isLight ? 'bg-white border-neutral-200' : 'bg-neutral-950/60 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sky-400 truncate max-w-[240px]">
              File: {lastReport.fileName}
            </span>
            <span>
              Upload #{uploadRevision}
              {timeStampLabel ? ` · ${timeStampLabel}` : ''} · Preset:{' '}
              <strong>{lastReport.alignPreset}</strong> ({lastReport.appliedGeometryScale}x)
            </span>
          </div>

          {lastReport.unscaledBounds && lastReport.scaledBounds && (
            <div className="opacity-80">
              Raw L/H/W: [{lastReport.unscaledBounds.length}, {lastReport.unscaledBounds.height},{' '}
              {lastReport.unscaledBounds.width}] → UU: [{lastReport.scaledBounds.length.toFixed(1)},{' '}
              {lastReport.scaledBounds.height.toFixed(1)}, {lastReport.scaledBounds.width.toFixed(1)}
              ]
            </div>
          )}

          {fallbackCount > 0 ? (
            <div className="flex items-start gap-1.5 text-amber-400 pt-0.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Fallback to <strong>body</strong> ({fallbackCount} unrecognized material
                {fallbackCount > 1 ? 's' : ''}, logged to console):{' '}
                {lastReport.fallbackMaterials?.join(', ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 pt-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>All mesh materials matched standard 7 slots.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

