import React, { useState, useEffect } from 'react';
import {
  Compass,
  Gauge,
  CircleDot,
  Camera,
  RotateCw,
  Save,
} from 'lucide-react';
import { ToggleSwitch } from '../../primitives/ToggleSwitch';
import { CompactNumberSlider } from './CompactNumberSlider';
import { StaticTrainingAdvancedParamsSection } from './StaticTrainingAdvancedParamsSection';
import type { EditSubMode, StaticTrainingShotItem } from './staticTrainingTypes';

export interface StaticTrainingShotInspectorViewProps {
  isLight: boolean;
  currentShot: StaticTrainingShotItem;
  editSubMode: EditSubMode;
  isDirty?: boolean;
  onChangeSubMode: (mode: EditSubMode) => void;
  onMutateShot: (updater: (draft: StaticTrainingShotItem) => void) => void;
  onSaveShot?: () => void;
  onHoverDesc: (desc: string | null) => void;
}

const SUB_MODE_OPTIONS: {
  id: EditSubMode;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  hint: string;
}[] = [
  {
    id: 'car-heading',
    label: 'Car Heading',
    shortLabel: 'Heading',
    icon: <Compass className="h-3.5 w-3.5 shrink-0" />,
    hint: 'Car Heading Mode: WASD/Space/V Move Car • Drag Mouse = Car Heading & Pitch • Q/E = Air Roll • O/P = Boost',
  },
  {
    id: 'car-speed',
    label: 'Car Speed',
    shortLabel: 'Car Spd',
    icon: <Gauge className="h-3.5 w-3.5 shrink-0" />,
    hint: 'Car Speed Mode: WASD/Space/V Move Car • Drag Mouse = Car Velocity Yaw & Pitch • [ / ] = Car Speed',
  },
  {
    id: 'ball-speed',
    label: 'Ball Speed',
    shortLabel: 'Ball Spd',
    icon: <CircleDot className="h-3.5 w-3.5 shrink-0" />,
    hint: 'Ball Speed Mode: WASD/Space/V Move Ball • Drag Mouse = Ball Velocity Yaw & Pitch • [ / ] = Ball Speed',
  },
  {
    id: 'free-cam',
    label: 'Free Cam',
    shortLabel: 'Free Cam',
    icon: <Camera className="h-3.5 w-3.5 shrink-0" />,
    hint: 'Free Camera Mode: WASD/Space/V + Drag Look • [T] Toggle Trajectory Preview • [G] Test Single Shot',
  },
];

/**
 * StaticTrainingShotInspectorView
 * Ultra-compact single-line row inspector:
 * 1. Shot Name input + Save button on row 1.
 * 2. 3 or 4 cycling Sub-Mode buttons + Reset Level action squeezed into a single unified toolbar row (no redundant 'Sub-Mode: 9 / 0' label).
 * 3. Every toggle/slider row is single-line with zero inline sub-descriptions; hovering any row sends its detailed description to the PanelFooter.
 */
export const StaticTrainingShotInspectorView: React.FC<
  StaticTrainingShotInspectorViewProps
> = ({
  isLight,
  currentShot,
  editSubMode,
  isDirty = false,
  onChangeSubMode,
  onMutateShot,
  onSaveShot,
  onHoverDesc,
}) => {
  // Show Advanced is transient UI state: always defaults to false and resets whenever selecting a shot
  const [showAdvanced, setShowAdvanced] = useState(false);
  useEffect(() => {
    setShowAdvanced(false);
  }, [currentShot.id, currentShot.index]);

  const limitBoostAmount = !currentShot.car.unlimitedBoost;
  const hasFlip = currentShot.car.hasFlip !== false;
  const speedFollowsHeading = currentShot.car.speedFollowsHeading !== false;
  const visibleSubModeOptions = speedFollowsHeading
    ? SUB_MODE_OPTIONS.filter((opt) => opt.id !== 'car-speed')
    : SUB_MODE_OPTIONS;

  const sectionBg = isLight
    ? 'bg-white border-neutral-200/90 text-neutral-900'
    : 'bg-neutral-900/60 border-neutral-800 text-neutral-100';

  const rowHoverClass =
    'flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-neutral-500/10 transition-colors select-none';

  return (
    <div className="flex flex-col gap-2">
      {/* 1. Top Row: Shot Name Input + Save Button */}
      <div
        className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${sectionBg}`}
      >
        <input
          type="text"
          value={currentShot.name}
          onChange={(e) =>
            onMutateShot((d) => {
              d.name = e.target.value;
            })
          }
          onMouseEnter={() =>
            onHoverDesc(
              `Rename Shot #${String(currentShot.index + 1).padStart(2, '0')} (${currentShot.name}).`
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-bold grow min-w-0 outline-none transition-colors ${
            isLight
              ? 'bg-neutral-50 focus:bg-white border-neutral-300 text-neutral-900'
              : 'bg-neutral-850 focus:bg-neutral-800 border-neutral-700 text-neutral-100'
          }`}
          placeholder="Shot Name"
        />

        <button
          type="button"
          disabled={!isDirty}
          onClick={() => {
            onSaveShot?.();
            onHoverDesc(
              `Saved #${String(currentShot.index + 1).padStart(2, '0')} (${currentShot.name}) to edit workspace.`
            );
          }}
          onMouseEnter={() =>
            onHoverDesc(
              isDirty
                ? 'Save changes for this shot into the Edit Mode workspace.'
                : 'No unsaved changes on this shot.'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0 transition-all ${
            isDirty
              ? isLight
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-900 text-white cursor-pointer active:scale-95'
                : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-neutral-950 cursor-pointer active:scale-95'
              : isLight
              ? 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-50 cursor-not-allowed'
              : 'bg-neutral-850 border-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed'
          }`}
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>
      </div>

      {/* 2. Single-Row Sub-Mode Cycling Bar (3 or 4 modes) + Reset Level Button (No 'Sub-Mode: 9/0' header) */}
      <div
        className={`p-1.5 rounded-xl border flex items-center gap-1.5 ${sectionBg}`}
      >
        {/*Segmented 3 or 4 Cycling Sub-Mode Buttons */}
        <div
          className={`grid flex-1 min-w-0 gap-1 ${
            visibleSubModeOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
          }`}
        >
          {visibleSubModeOptions.map((opt) => {
            const active = editSubMode === opt.id;
            const hintText =
              opt.id === 'car-heading' && speedFollowsHeading
                ? 'Car Heading Mode [9/0 to Cycle]: WASD/Space/V Move Car • Drag Mouse = Car Heading & Pitch • [ / ] = Car Speed • Q/E = Air Roll • O/P = Boost'
                : `${opt.hint} (Press [9] / [0] or Right-Click to cycle sub-modes)`;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeSubMode(opt.id)}
                onMouseEnter={() => onHoverDesc(hintText)}
                onMouseLeave={() => onHoverDesc(null)}
                className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer min-w-0 ${
                  active
                    ? isLight
                      ? 'bg-neutral-900 border-neutral-900 text-white shadow-2xs'
                      : 'bg-white border-white text-neutral-900 shadow-2xs'
                    : isLight
                    ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/90 text-neutral-700'
                    : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700/80 text-neutral-300'
                }`}
              >
                {opt.icon}
                <span className="truncate">
                  {visibleSubModeOptions.length === 4 ? opt.shortLabel : opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Vertical Separator */}
        <div
          className={`h-5 w-px shrink-0 ${
            isLight ? 'bg-neutral-200' : 'bg-neutral-800'
          }`}
        />

        {/* Reset Level (Air Roll & Pitch = 0) */}
        <button
          type="button"
          onClick={() =>
            onMutateShot((d) => {
              d.car.airRoll = 0;
              d.car.headingPitch = 0;
              if (d.car.speedFollowsHeading !== false) {
                d.car.speedPitch = 0;
              }
            })
          }
          onMouseEnter={() =>
            onHoverDesc(
              'Air Roll Reset Level: Reset Car Air Roll and Pitch to horizontal level (0 deg).'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
          className={`flex items-center gap-1 py-1.5 px-2 rounded-lg border text-[10px] font-bold shrink-0 cursor-pointer transition-all active:scale-95 ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
              : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
          }`}
        >
          <RotateCw className="h-3 w-3 shrink-0" />
          <span>Reset Level</span>
        </button>
      </div>

      {/* 3. Ultra-Compact Core Shot Controls (Zero inline descriptions; hover routes to Footer) */}
      <div className={`p-2 rounded-xl border flex flex-col gap-1 ${sectionBg}`}>
        {/* (a) Limit Boost Amount */}
        <div
          className={rowHoverClass}
          onMouseEnter={() =>
            onHoverDesc(
              limitBoostAmount
                ? `Limit Boost Amount: ON (${Math.round(currentShot.car.initialBoost)}% initial boost reserve; adjust with [O]/[P]).`
                : 'Limit Boost Amount: OFF — Car spawns with Unlimited Boost (INF).'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Limit Boost Amount</span>
          <ToggleSwitch
            checked={limitBoostAmount}
            onCheckedChange={(checked) =>
              onMutateShot((d) => {
                d.car.unlimitedBoost = !checked;
              })
            }
            isLight={isLight}
            variant="neutral"
          />
        </div>

        {limitBoostAmount && (
          <CompactNumberSlider
            label="Boost Amount [O/P]"
            value={Math.round(currentShot.car.initialBoost)}
            min={0}
            max={100}
            step={1}
            unit="%"
            description="Initial Boost Reserve (0% – 100%). Press [O] / [P] in 3D editor to adjust."
            onHoverDesc={onHoverDesc}
            onChange={(b) =>
              onMutateShot((d) => {
                d.car.initialBoost = b;
              })
            }
            isLight={isLight}
          />
        )}

        {/* (b) Time Limit */}
        <CompactNumberSlider
          label="Time Limit"
          value={currentShot.timeoutSeconds}
          min={1}
          max={60}
          step={1}
          unit="s"
          description="Shot Time Limit (1s – 60s, default 10s) before shot expires."
          onHoverDesc={onHoverDesc}
          onChange={(val) =>
            onMutateShot((d) => {
              d.timeoutSeconds = Math.max(1, Math.min(60, val));
            })
          }
          isLight={isLight}
        />

        {/* (c) Align Speed with Car Nose */}
        <div
          className={rowHoverClass}
          onMouseEnter={() =>
            onHoverDesc(
              speedFollowsHeading
                ? 'Align Speed with Car Nose: ON — Car velocity direction stays aligned with car nose ([ / ] adjusts speed directly in Car Heading mode).'
                : 'Align Speed with Car Nose: OFF — Independent car velocity yaw & pitch (enables 4th Car Speed sub-mode).'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Align Speed with Car Nose</span>
          <ToggleSwitch
            checked={speedFollowsHeading}
            onCheckedChange={(checked) => {
              onMutateShot((d) => {
                d.car.speedFollowsHeading = checked;
                if (checked) {
                  d.car.speedYaw = d.car.headingYaw;
                  d.car.speedPitch = d.car.snapToGround ? 0 : d.car.headingPitch;
                }
              });
              if (checked && editSubMode === 'car-speed') {
                onChangeSubMode('car-heading');
              }
            }}
            isLight={isLight}
            variant="neutral"
          />
        </div>

        {/* (d) Snap to Ground */}
        <div
          className={rowHoverClass}
          onMouseEnter={() =>
            onHoverDesc(
              'Snap to Ground [V]: When ON, car spawns at ground level (Z=17.05) with 60-frame wheel suspension settle.'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Snap to Ground</span>
          <ToggleSwitch
            checked={currentShot.car.snapToGround}
            onCheckedChange={(checked) =>
              onMutateShot((d) => {
                d.car.snapToGround = checked;
                if (checked) {
                  d.car.location[2] = 17.05;
                  d.car.headingPitch = 0;
                  d.car.airRoll = 0;
                  d.car.hasFlip = true;
                  if (d.car.speedFollowsHeading !== false) {
                    d.car.speedPitch = 0;
                  }
                } else if (d.car.location[2] < 45) {
                  d.car.location[2] = 120;
                }
              })
            }
            isLight={isLight}
            variant="neutral"
          />
        </div>

        {/* (e) Has Flip */}
        <div
          className={rowHoverClass}
          onMouseEnter={() =>
            onHoverDesc(
              currentShot.car.snapToGround
                ? 'Has Flip: On Ground (Flip is always available when grounded).'
                : hasFlip
                ? 'Has Flip: ON — Airborne car spawns with an available dodge/flip.'
                : 'Has Flip: OFF — Airborne car spawns without a flip (NO FLIP).'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Has Flip</span>
          <ToggleSwitch
            checked={currentShot.car.snapToGround ? true : hasFlip}
            onCheckedChange={(checked) =>
              onMutateShot((d) => {
                d.car.hasFlip = checked;
                if (!checked && d.car.snapToGround) {
                  d.car.snapToGround = false;
                  if (d.car.location[2] < 45) {
                    d.car.location[2] = 120;
                  }
                }
              })
            }
            isLight={isLight}
            variant="neutral"
          />
        </div>

        {/* (f) Random Angular Velocity */}
        <div
          className={rowHoverClass}
          onMouseEnter={() =>
            onHoverDesc(
              currentShot.ball.randomAngularVelocity
                ? 'Random Angular Velocity: ON — Ball spin is automatically generated from launch speed.'
                : 'Random Angular Velocity: OFF — Manual 3-axis ball angular velocity (Pitch, Roll, Yaw rad/s).'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Random Angular Velocity</span>
          <ToggleSwitch
            checked={currentShot.ball.randomAngularVelocity}
            onCheckedChange={(checked) =>
              onMutateShot((d) => {
                d.ball.randomAngularVelocity = checked;
              })
            }
            isLight={isLight}
            variant="neutral"
          />
        </div>

        {/* Manual Angular Velocity Sliders (when Random Angular Velocity is OFF) */}
        {!currentShot.ball.randomAngularVelocity && (
          <div className="flex flex-col gap-1 pt-1 border-t border-neutral-500/15">
            <CompactNumberSlider
              label="AngVel X (Pitch)"
              value={currentShot.ball.angularVelocity[0]}
              min={-6}
              max={6}
              step={0.1}
              unit=" r/s"
              description="Ball Angular Velocity X-axis (Pitch spin in rad/s, -6 to +6)."
              onHoverDesc={onHoverDesc}
              onChange={(v) =>
                onMutateShot((d) => {
                  d.ball.angularVelocity[0] = Number(v.toFixed(2));
                })
              }
              isLight={isLight}
            />
            <CompactNumberSlider
              label="AngVel Y (Roll)"
              value={currentShot.ball.angularVelocity[1]}
              min={-6}
              max={6}
              step={0.1}
              unit=" r/s"
              description="Ball Angular Velocity Y-axis (Roll spin in rad/s, -6 to +6)."
              onHoverDesc={onHoverDesc}
              onChange={(v) =>
                onMutateShot((d) => {
                  d.ball.angularVelocity[1] = Number(v.toFixed(2));
                })
              }
              isLight={isLight}
            />
            <CompactNumberSlider
              label="AngVel Z (Yaw)"
              value={currentShot.ball.angularVelocity[2]}
              min={-6}
              max={6}
              step={0.1}
              unit=" r/s"
              description="Ball Angular Velocity Z-axis (Yaw side-spin in rad/s, -6 to +6)."
              onHoverDesc={onHoverDesc}
              onChange={(v) =>
                onMutateShot((d) => {
                  d.ball.angularVelocity[2] = Number(v.toFixed(2));
                })
              }
              isLight={isLight}
            />
          </div>
        )}

        {/* (g) Show Advanced */}
        <div
          className={`${rowHoverClass} border-t border-neutral-500/15 pt-1.5 mt-0.5`}
          onMouseEnter={() =>
            onHoverDesc(
              'Show Advanced: Reveal exact 3D coordinates (X/Y/Z), orientation angles, launch speeds, and Kickoff Freeze state.'
            )
          }
          onMouseLeave={() => onHoverDesc(null)}
        >
          <span className="text-[11px] font-semibold">Show Advanced</span>
          <ToggleSwitch
            checked={showAdvanced}
            onCheckedChange={(checked) => setShowAdvanced(checked)}
            isLight={isLight}
            variant="neutral"
          />
        </div>
      </div>

      {/* 4. Advanced Detailed Parameters (Compact single-line rows) */}
      {showAdvanced && (
        <StaticTrainingAdvancedParamsSection
          isLight={isLight}
          currentShot={currentShot}
          speedFollowsHeading={speedFollowsHeading}
          sectionBg={sectionBg}
          rowHoverClass={rowHoverClass}
          onMutateShot={onMutateShot}
          onHoverDesc={onHoverDesc}
        />
      )}
    </div>
  );
};
