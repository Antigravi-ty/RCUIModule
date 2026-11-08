import React, { useState } from 'react';
import {
  RotateCcw,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { useReferenceOverlayStore } from '../../../stores/referenceOverlayStore';
import {
  FENNEC_DESCRIPTOR,
  getAllVehicleDescriptors,
  type VehicleDescriptor,
} from '../../../config/vehicleTunerConfig';
import {
  INSIDIO_DESCRIPTOR,
  RYZA_DESCRIPTOR,
} from '../../../config/vehicleDescriptorsConfig';
import {
  DOMINUS_DESCRIPTOR,
  BREAKOUT_MINI_DESCRIPTOR,
  SENTINEL_DESCRIPTOR,
  MERC_DESCRIPTOR,
  OCTANE_DESCRIPTOR,
  TRIOCTANE_DESCRIPTOR,
  TRIOCTANE_THREEWHEEL_DESCRIPTOR,
} from '../../../config/vehicleExtendedDescriptorsConfig';

export type BuiltInVehicleId =
  | 'fennec'
  | 'octane'
  | 'insidio'
  | 'ryza'
  | 'dominus'
  | 'breakout-mini'
  | 'sentinel'
  | 'merc'
  | 'trioctane'
  | 'trioctane-threewheel';

export type CustomVehicleId = BuiltInVehicleId | (string & {});

export interface TunerVehicleOption {
  value: CustomVehicleId;
  label: string;
  isImported?: boolean;
  fileName?: string;
}

export const TUNER_VEHICLE_OPTIONS: ReadonlyArray<TunerVehicleOption> = [
  { value: 'fennec', label: 'Fennec' },
  { value: 'octane', label: 'Octane' },
  { value: 'insidio', label: 'Insidio' },
  { value: 'ryza', label: 'Ryza' },
  { value: 'dominus', label: 'Dominus' },
  { value: 'breakout-mini', label: 'Breakout' },
  { value: 'sentinel', label: 'Sentinel' },
  { value: 'merc', label: 'Merc' },
  { value: 'trioctane', label: 'TriOctane4' },
  { value: 'trioctane-threewheel', label: 'TriOctane3' },
];

const BUILT_IN_VEHICLE_ID_SET = new Set<string>(TUNER_VEHICLE_OPTIONS.map((o) => o.value));

export function isBuiltInTunerVehicleId(vehicleId: string): boolean {
  return BUILT_IN_VEHICLE_ID_SET.has(String(vehicleId || '').toLowerCase().trim());
}

const importedTunerVehicleOptions: TunerVehicleOption[] = [];

export function getTunerVehicleOptions(): ReadonlyArray<TunerVehicleOption> {
  return [...TUNER_VEHICLE_OPTIONS, ...importedTunerVehicleOptions];
}

const pickVehicleOffsets = (d: VehicleDescriptor) => ({
  hitboxPreset: d.hitboxPreset,
  threeWheels: Boolean(d.threeWheels),
  alignment: d.alignment,
  wheelAnchors: d.wheelAnchors,
  suspensionHeights: d.suspensionHeights,
  boostNozzleParams: d.boostNozzleParams,
  boostOutlets: d.boostOutlets,
});

export const INITIAL_VEHICLE_OFFSET_SNAPSHOT: Record<
  string,
  ReturnType<typeof pickVehicleOffsets>
> = JSON.parse(
  JSON.stringify({
    fennec: pickVehicleOffsets(FENNEC_DESCRIPTOR),
    octane: pickVehicleOffsets(OCTANE_DESCRIPTOR),
    insidio: pickVehicleOffsets(INSIDIO_DESCRIPTOR),
    ryza: pickVehicleOffsets(RYZA_DESCRIPTOR),
    dominus: pickVehicleOffsets(DOMINUS_DESCRIPTOR),
    'breakout-mini': pickVehicleOffsets(BREAKOUT_MINI_DESCRIPTOR),
    sentinel: pickVehicleOffsets(SENTINEL_DESCRIPTOR),
    merc: pickVehicleOffsets(MERC_DESCRIPTOR),
    trioctane: pickVehicleOffsets(TRIOCTANE_DESCRIPTOR),
    'trioctane-threewheel': pickVehicleOffsets(TRIOCTANE_THREEWHEEL_DESCRIPTOR),
  })
);

export function registerImportedTunerVehicleOption(
  descriptor: VehicleDescriptor,
  fileName?: string
): TunerVehicleOption {
  const id = descriptor.id;
  INITIAL_VEHICLE_OFFSET_SNAPSHOT[id] = JSON.parse(JSON.stringify(pickVehicleOffsets(descriptor)));
  const entry: TunerVehicleOption = {
    value: id,
    label: descriptor.name || id,
    isImported: true,
    fileName,
  };
  const existingIdx = importedTunerVehicleOptions.findIndex((o) => o.value === id);
  if (existingIdx >= 0) {
    importedTunerVehicleOptions[existingIdx] = entry;
  } else {
    importedTunerVehicleOptions.push(entry);
  }
  return entry;
}

export const buildVehicleOffsetsExportJson = () => {
  const vehicles: Record<string, ReturnType<typeof pickVehicleOffsets>> = {};
  for (const desc of getAllVehicleDescriptors()) {
    vehicles[desc.id] = pickVehicleOffsets(desc);
  }
  return {
    version: 'vehicle-model-offset-tuner-v1',
    exportedAt: new Date().toISOString(),
    referenceOverlayProfiles: useReferenceOverlayStore.getState().exportProfilesJson(),
    vehicles,
  };
};

export interface VehicleOffsetFooterActionsProps {
  selectedCar: CustomVehicleId;
  descriptorName: string;
  onResetVehicle: () => void;
  isLight?: boolean;
}

export const VehicleOffsetFooterActions: React.FC<VehicleOffsetFooterActionsProps> = ({
  selectedCar,
  descriptorName,
  onResetVehicle,
  isLight = false,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyJson = async () => {
    try {
      const jsonStr = JSON.stringify(buildVehicleOffsetsExportJson(), null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.warn('[VehicleModelOffsetTuner] Clipboard copy failed:', err);
    }
  };

  const handleDownloadJson = () => {
    try {
      const jsonStr = JSON.stringify(buildVehicleOffsetsExportJson(), null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vehicle-model-offsets-${selectedCar}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('[VehicleModelOffsetTuner] Download JSON failed:', err);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-500/20">
      <button
        type="button"
        onClick={onResetVehicle}
        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
          isLight
            ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700'
            : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
        }`}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset {descriptorName} Offsets</span>
      </button>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCopyJson}
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            copiedJson
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : isLight
              ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white'
              : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-neutral-950'
          }`}
        >
          {copiedJson ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedJson ? 'Copied JSON' : 'Copy JSON'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadJson}
          className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
            isLight
              ? 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-neutral-100'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>.JSON</span>
        </button>
      </div>
    </div>
  );
};
