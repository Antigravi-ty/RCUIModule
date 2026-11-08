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
  TRIOCTANE_DESCRIPTOR,
  TRIOCTANE_THREEWHEEL_DESCRIPTOR,
} from '../../../config/vehicleExtendedDescriptorsConfig';

export type CustomVehicleId =
  | 'fennec'
  | 'insidio'
  | 'ryza'
  | 'dominus'
  | 'breakout-mini'
  | 'sentinel'
  | 'merc'
  | 'trioctane'
  | 'trioctane-threewheel';

export const TUNER_VEHICLE_OPTIONS: ReadonlyArray<{ value: CustomVehicleId; label: string }> = [
  { value: 'fennec', label: 'Fennec (Fennec.glb)' },
  { value: 'insidio', label: 'Insidio (Insidio.glb)' },
  { value: 'ryza', label: 'Ryza (Ryza.glb)' },
  { value: 'dominus', label: 'Dominus (Dominus.glb)' },
  { value: 'breakout-mini', label: 'Breakout Mini (BreakoutMini.glb)' },
  { value: 'sentinel', label: 'Sentinel (Sentinel.glb)' },
  { value: 'merc', label: 'Merc (Merc.glb)' },
  { value: 'trioctane', label: 'TriOctane (Octane)' },
  { value: 'trioctane-threewheel', label: 'TriOctane (Three-Wheeler)' },
];

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
  CustomVehicleId,
  ReturnType<typeof pickVehicleOffsets>
> = JSON.parse(
  JSON.stringify({
    fennec: pickVehicleOffsets(FENNEC_DESCRIPTOR),
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

export const buildVehicleOffsetsExportJson = () => ({
  version: 'vehicle-model-offset-tuner-v1',
  exportedAt: new Date().toISOString(),
  referenceOverlayProfiles: useReferenceOverlayStore.getState().exportProfilesJson(),
  vehicles: {
    fennec: pickVehicleOffsets(FENNEC_DESCRIPTOR),
    insidio: pickVehicleOffsets(INSIDIO_DESCRIPTOR),
    ryza: pickVehicleOffsets(RYZA_DESCRIPTOR),
    dominus: pickVehicleOffsets(DOMINUS_DESCRIPTOR),
    'breakout-mini': pickVehicleOffsets(BREAKOUT_MINI_DESCRIPTOR),
    sentinel: pickVehicleOffsets(SENTINEL_DESCRIPTOR),
    merc: pickVehicleOffsets(MERC_DESCRIPTOR),
    trioctane: pickVehicleOffsets(TRIOCTANE_DESCRIPTOR),
    'trioctane-threewheel': pickVehicleOffsets(TRIOCTANE_THREEWHEEL_DESCRIPTOR),
  },
});

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
