import React from 'react';
import {
  oklchToHex,
  type DriftwoodsGroundConfig,
} from '../../../config/driftwoodsConfig';
import {
  TunerRow,
  TunerToggleRow,
} from '../../../compounds/tuner/TunerControls';

export interface DriftwoodsOklchSyncSectionProps {
  ground: DriftwoodsGroundConfig;
  onChange: (patch: Partial<DriftwoodsGroundConfig>) => void;
  isLight?: boolean;
}

export const DriftwoodsOklchSyncSection: React.FC<DriftwoodsOklchSyncSectionProps> = ({
  ground,
  onChange,
  isLight = false,
}) => {
  const oklchSyncEnabled = ground.oklchSyncEnabled !== false;
  const markingsL = ground.oklchMarkingsLightness ?? 0.96;
  const teamL = ground.oklchTeamLightness ?? 0.7;
  const goalL = ground.oklchGoalLightness ?? 0.582;
  const goalGlowL = ground.oklchGoalPostsGlowLightness ?? 0.65;
  const rampsUpperOuterL = ground.oklchRampsUpperOuterLightness ?? 0.5;
  const hexL = ground.oklchHexLightness ?? 0.65;
  const teamC = ground.oklchTeamChroma ?? 0.19;
  const blueH = ground.oklchBlueHue ?? 250;
  const orangeH = ground.oklchOrangeHue ?? 45;

  const groundIndCH = Boolean(ground.oklchGroundIndependentCH);
  const groundC = groundIndCH ? (ground.oklchGroundChroma ?? teamC) : teamC;
  const groundBlueH = groundIndCH ? (ground.oklchGroundBlueHue ?? blueH) : blueH;
  const groundOrangeH = groundIndCH ? (ground.oklchGroundOrangeHue ?? orangeH) : orangeH;

  const goalIndCH = Boolean(ground.oklchGoalIndependentCH);
  const goalC = goalIndCH ? (ground.oklchGoalChroma ?? teamC) : teamC;
  const goalBlueH = goalIndCH ? (ground.oklchGoalBlueHue ?? blueH) : blueH;
  const goalOrangeH = goalIndCH ? (ground.oklchGoalOrangeHue ?? orangeH) : orangeH;

  const goalGlowIndCH = Boolean(ground.oklchGoalPostsGlowIndependentCH);
  const goalGlowC = goalGlowIndCH ? (ground.oklchGoalPostsGlowChroma ?? teamC) : teamC;
  const goalGlowBlueH = goalGlowIndCH ? (ground.oklchGoalPostsGlowBlueHue ?? blueH) : blueH;
  const goalGlowOrangeH = goalGlowIndCH
    ? (ground.oklchGoalPostsGlowOrangeHue ?? orangeH)
    : orangeH;

  const rampsUpperOuterIndCH = ground.oklchRampsUpperOuterIndependentCH !== false;
  const rampsUpperOuterC = rampsUpperOuterIndCH
    ? (ground.oklchRampsUpperOuterChroma ?? 0.1)
    : teamC;
  const rampsUpperOuterBlueH = rampsUpperOuterIndCH
    ? (ground.oklchRampsUpperOuterBlueHue ?? blueH)
    : blueH;
  const rampsUpperOuterOrangeH = rampsUpperOuterIndCH
    ? (ground.oklchRampsUpperOuterOrangeHue ?? orangeH)
    : orangeH;

  const hexIndCH = ground.oklchHexIndependentCH !== false;
  const hexC = hexIndCH ? (ground.oklchHexChroma ?? 0.32) : teamC;
  const hexBlueH = hexIndCH ? (ground.oklchHexBlueHue ?? blueH) : blueH;
  const hexOrangeH = hexIndCH ? (ground.oklchHexOrangeHue ?? orangeH) : orangeH;

  const computedBlueHex = oklchToHex(teamL, groundC, groundBlueH);
  const computedOrangeHex = oklchToHex(teamL, groundC, groundOrangeH);
  const computedGoalBlueHex = oklchToHex(goalL, goalC, goalBlueH);
  const computedGoalOrangeHex = oklchToHex(goalL, goalC, goalOrangeH);
  const computedGoalGlowBlueHex = oklchToHex(goalGlowL, goalGlowC, goalGlowBlueH);
  const computedGoalGlowOrangeHex = oklchToHex(goalGlowL, goalGlowC, goalGlowOrangeH);
  const computedRampsUpperOuterBlueHex = oklchToHex(
    rampsUpperOuterL,
    rampsUpperOuterC,
    rampsUpperOuterBlueH
  );
  const computedRampsUpperOuterOrangeHex = oklchToHex(
    rampsUpperOuterL,
    rampsUpperOuterC,
    rampsUpperOuterOrangeH
  );
  const computedHexBlueHex = oklchToHex(hexL, hexC, hexBlueH);
  const computedHexOrangeHex = oklchToHex(hexL, hexC, hexOrangeH);

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-1">
        OKLCH Unified Chroma &amp; Hue + Per-Location Lightness &amp; CH Unlink
      </span>

      <TunerToggleRow
        label="Enable OKLCH Perceptual Color Sync"
        description="Unifies Chroma (C) & Blue/Orange Hue (H) by default across Ground, Goal Posts/Frame, Goal Posts Glow, Ramps Upper & Net Outer, and Hexagon Grid with independent Lightness (L) and optional per-location CH override"
        checked={oklchSyncEnabled}
        onChange={(checked) => onChange({ oklchSyncEnabled: checked })}
        isLight={isLight}
      />

      {oklchSyncEnabled && (
        <div className="flex flex-col gap-1.5">
          {/* Shared Master C / H */}
          <div className="grid grid-cols-3 gap-1.5">
            <TunerRow
              label="Shared Chroma (C)"
              description="Default unified saturation across all team elements"
              value={teamC}
              sliderMin={0.02}
              sliderMax={0.32}
              sliderStep={0.005}
              onChange={(val) =>
                onChange({
                  oklchTeamChroma: val,
                  blueTeamLineColor: oklchToHex(
                    teamL,
                    groundIndCH ? groundC : val,
                    groundBlueH
                  ),
                  orangeTeamLineColor: oklchToHex(
                    teamL,
                    groundIndCH ? groundC : val,
                    groundOrangeH
                  ),
                })
              }
              isLight={isLight}
            />

            <TunerRow
              label="Shared Blue Hue (H)"
              description={`Default Blue Hue (${oklchToHex(teamL, teamC, blueH)})`}
              value={blueH}
              sliderMin={180}
              sliderMax={290}
              sliderStep={1}
              unit="deg"
              onChange={(val) =>
                onChange({
                  oklchBlueHue: val,
                  blueTeamLineColor: oklchToHex(
                    teamL,
                    groundC,
                    groundIndCH ? groundBlueH : val
                  ),
                })
              }
              isLight={isLight}
            />

            <TunerRow
              label="Shared Orange Hue (H)"
              description={`Default Orange Hue (${oklchToHex(teamL, teamC, orangeH)})`}
              value={orangeH}
              sliderMin={15}
              sliderMax={85}
              sliderStep={1}
              unit="deg"
              onChange={(val) =>
                onChange({
                  oklchOrangeHue: val,
                  orangeTeamLineColor: oklchToHex(
                    teamL,
                    groundC,
                    groundIndCH ? groundOrangeH : val
                  ),
                })
              }
              isLight={isLight}
            />
          </div>

          {/* 1. Ground Team Markings */}
          <div
            className={`p-1.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/50 border-neutral-200/80'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <TunerRow
                label="Ground Team Lightness (L)"
                description={`Ground L4/L6 (${computedBlueHex} | ${computedOrangeHex})`}
                value={teamL}
                sliderMin={0.25}
                sliderMax={0.98}
                sliderStep={0.005}
                onChange={(val) =>
                  onChange({
                    oklchTeamLightness: val,
                    blueTeamLineColor: oklchToHex(val, groundC, groundBlueH),
                    orangeTeamLineColor: oklchToHex(val, groundC, groundOrangeH),
                  })
                }
                isLight={isLight}
              />

              <TunerToggleRow
                label="Unlink Ground Chroma & Hue"
                description="Allow Ground L4/L6 to override shared C & H"
                checked={groundIndCH}
                onChange={(checked) =>
                  onChange({
                    oklchGroundIndependentCH: checked,
                    oklchGroundChroma: ground.oklchGroundChroma ?? teamC,
                    oklchGroundBlueHue: ground.oklchGroundBlueHue ?? blueH,
                    oklchGroundOrangeHue: ground.oklchGroundOrangeHue ?? orangeH,
                  })
                }
                isLight={isLight}
              />
            </div>

            {groundIndCH && (
              <div className="grid grid-cols-3 gap-1.5">
                <TunerRow
                  label="Ground Chroma (C)"
                  value={groundC}
                  sliderMin={0.02}
                  sliderMax={0.32}
                  sliderStep={0.005}
                  onChange={(val) =>
                    onChange({
                      oklchGroundChroma: val,
                      blueTeamLineColor: oklchToHex(teamL, val, groundBlueH),
                      orangeTeamLineColor: oklchToHex(teamL, val, groundOrangeH),
                    })
                  }
                  isLight={isLight}
                />
                <TunerRow
                  label="Ground Blue Hue (H)"
                  value={groundBlueH}
                  sliderMin={180}
                  sliderMax={290}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) =>
                    onChange({
                      oklchGroundBlueHue: val,
                      blueTeamLineColor: oklchToHex(teamL, groundC, val),
                    })
                  }
                  isLight={isLight}
                />
                <TunerRow
                  label="Ground Orange Hue (H)"
                  value={groundOrangeH}
                  sliderMin={15}
                  sliderMax={85}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) =>
                    onChange({
                      oklchGroundOrangeHue: val,
                      orangeTeamLineColor: oklchToHex(teamL, groundC, val),
                    })
                  }
                  isLight={isLight}
                />
              </div>
            )}
          </div>

          {/* 2. Goal Posts & Frame */}
          <div
            className={`p-1.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/50 border-neutral-200/80'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <TunerRow
                label="Goal Posts & Frame Lightness (L)"
                description={`Goal Posts & Frame (${computedGoalBlueHex} | ${computedGoalOrangeHex})`}
                value={goalL}
                sliderMin={0.2}
                sliderMax={0.98}
                sliderStep={0.005}
                onChange={(val) => onChange({ oklchGoalLightness: val })}
                isLight={isLight}
              />

              <TunerToggleRow
                label="Unlink Goal Posts Chroma & Hue"
                description="Allow Goal Posts & Frame to override shared C & H"
                checked={goalIndCH}
                onChange={(checked) =>
                  onChange({
                    oklchGoalIndependentCH: checked,
                    oklchGoalChroma: ground.oklchGoalChroma ?? teamC,
                    oklchGoalBlueHue: ground.oklchGoalBlueHue ?? blueH,
                    oklchGoalOrangeHue: ground.oklchGoalOrangeHue ?? orangeH,
                  })
                }
                isLight={isLight}
              />
            </div>

            {goalIndCH && (
              <div className="grid grid-cols-3 gap-1.5">
                <TunerRow
                  label="Goal Chroma (C)"
                  value={goalC}
                  sliderMin={0.02}
                  sliderMax={0.32}
                  sliderStep={0.005}
                  onChange={(val) => onChange({ oklchGoalChroma: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Goal Blue Hue (H)"
                  value={goalBlueH}
                  sliderMin={180}
                  sliderMax={290}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchGoalBlueHue: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Goal Orange Hue (H)"
                  value={goalOrangeH}
                  sliderMin={15}
                  sliderMax={85}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchGoalOrangeHue: val })}
                  isLight={isLight}
                />
              </div>
            )}
          </div>

          {/* 3. Goal Posts Glow */}
          <div
            className={`p-1.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/50 border-neutral-200/80'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <TunerRow
                label="Goal Posts Glow Lightness (L)"
                description={`Goal Posts Glow (${computedGoalGlowBlueHex} | ${computedGoalGlowOrangeHex})`}
                value={goalGlowL}
                sliderMin={0.2}
                sliderMax={1.0}
                sliderStep={0.005}
                onChange={(val) => onChange({ oklchGoalPostsGlowLightness: val })}
                isLight={isLight}
              />

              <TunerToggleRow
                label="Unlink Goal Glow Chroma & Hue"
                description="Allow Goal Posts Glow to override shared C & H"
                checked={goalGlowIndCH}
                onChange={(checked) =>
                  onChange({
                    oklchGoalPostsGlowIndependentCH: checked,
                    oklchGoalPostsGlowChroma: ground.oklchGoalPostsGlowChroma ?? teamC,
                    oklchGoalPostsGlowBlueHue: ground.oklchGoalPostsGlowBlueHue ?? blueH,
                    oklchGoalPostsGlowOrangeHue:
                      ground.oklchGoalPostsGlowOrangeHue ?? orangeH,
                  })
                }
                isLight={isLight}
              />
            </div>

            {goalGlowIndCH && (
              <div className="grid grid-cols-3 gap-1.5">
                <TunerRow
                  label="Goal Glow Chroma (C)"
                  value={goalGlowC}
                  sliderMin={0.02}
                  sliderMax={0.32}
                  sliderStep={0.005}
                  onChange={(val) => onChange({ oklchGoalPostsGlowChroma: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Goal Glow Blue Hue (H)"
                  value={goalGlowBlueH}
                  sliderMin={180}
                  sliderMax={290}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchGoalPostsGlowBlueHue: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Goal Glow Orange Hue (H)"
                  value={goalGlowOrangeH}
                  sliderMin={15}
                  sliderMax={85}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchGoalPostsGlowOrangeHue: val })}
                  isLight={isLight}
                />
              </div>
            )}
          </div>

          {/* 4. Ramps Upper & Goal Net Outer */}
          <div
            className={`p-1.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/50 border-neutral-200/80'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <TunerRow
                label="Ramps Upper & Net Outer Lightness (L)"
                description={`Shared Upper & Outer (${computedRampsUpperOuterBlueHex} | ${computedRampsUpperOuterOrangeHex})`}
                value={rampsUpperOuterL}
                sliderMin={0.2}
                sliderMax={0.98}
                sliderStep={0.005}
                onChange={(val) => onChange({ oklchRampsUpperOuterLightness: val })}
                isLight={isLight}
              />

              <TunerToggleRow
                label="Unlink Upper & Outer Chroma & Hue"
                description="Allow Ramps Upper & Net Outer to override shared C & H"
                checked={rampsUpperOuterIndCH}
                onChange={(checked) =>
                  onChange({
                    oklchRampsUpperOuterIndependentCH: checked,
                    oklchRampsUpperOuterChroma:
                      ground.oklchRampsUpperOuterChroma ?? teamC,
                    oklchRampsUpperOuterBlueHue:
                      ground.oklchRampsUpperOuterBlueHue ?? blueH,
                    oklchRampsUpperOuterOrangeHue:
                      ground.oklchRampsUpperOuterOrangeHue ?? orangeH,
                  })
                }
                isLight={isLight}
              />
            </div>

            {rampsUpperOuterIndCH && (
              <div className="grid grid-cols-3 gap-1.5">
                <TunerRow
                  label="Upper & Outer Chroma (C)"
                  value={rampsUpperOuterC}
                  sliderMin={0.02}
                  sliderMax={0.32}
                  sliderStep={0.005}
                  onChange={(val) => onChange({ oklchRampsUpperOuterChroma: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Upper & Outer Blue Hue (H)"
                  value={rampsUpperOuterBlueH}
                  sliderMin={180}
                  sliderMax={290}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchRampsUpperOuterBlueHue: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Upper & Outer Orange Hue (H)"
                  value={rampsUpperOuterOrangeH}
                  sliderMin={15}
                  sliderMax={85}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchRampsUpperOuterOrangeHue: val })}
                  isLight={isLight}
                />
              </div>
            )}
          </div>

          {/* 5. Hexagon Grid & Neutral Markings */}
          <div
            className={`p-1.5 rounded-xl border flex flex-col gap-1.5 ${
              isLight
                ? 'bg-neutral-100/50 border-neutral-200/80'
                : 'bg-neutral-900/40 border-neutral-800/80'
            }`}
          >
            <div className="grid grid-cols-2 gap-1.5">
              <TunerRow
                label="Hexagon Grid Lightness (L)"
                description={`Wall Hexes (${computedHexBlueHex} | ${computedHexOrangeHex})`}
                value={hexL}
                sliderMin={0.25}
                sliderMax={0.98}
                sliderStep={0.005}
                onChange={(val) => onChange({ oklchHexLightness: val })}
                isLight={isLight}
              />

              <TunerToggleRow
                label="Unlink Hex Grid Chroma & Hue"
                description="Allow Wall Hexes to override shared C & H"
                checked={hexIndCH}
                onChange={(checked) =>
                  onChange({
                    oklchHexIndependentCH: checked,
                    oklchHexChroma: ground.oklchHexChroma ?? teamC,
                    oklchHexBlueHue: ground.oklchHexBlueHue ?? blueH,
                    oklchHexOrangeHue: ground.oklchHexOrangeHue ?? orangeH,
                  })
                }
                isLight={isLight}
              />
            </div>

            {hexIndCH && (
              <div className="grid grid-cols-3 gap-1.5">
                <TunerRow
                  label="Hex Chroma (C)"
                  value={hexC}
                  sliderMin={0.02}
                  sliderMax={0.32}
                  sliderStep={0.005}
                  onChange={(val) => onChange({ oklchHexChroma: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Hex Blue Hue (H)"
                  value={hexBlueH}
                  sliderMin={180}
                  sliderMax={290}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchHexBlueHue: val })}
                  isLight={isLight}
                />
                <TunerRow
                  label="Hex Orange Hue (H)"
                  value={hexOrangeH}
                  sliderMin={15}
                  sliderMax={85}
                  sliderStep={1}
                  unit="deg"
                  onChange={(val) => onChange({ oklchHexOrangeHue: val })}
                  isLight={isLight}
                />
              </div>
            )}

            <TunerRow
              label="Neutral Markings Lightness (L)"
              description="Perceptual OKLCH lightness for neutral field markings (L1, L2, L3, L5)"
              value={markingsL}
              sliderMin={0.25}
              sliderMax={1.0}
              sliderStep={0.005}
              onChange={(val) => onChange({ oklchMarkingsLightness: val })}
              isLight={isLight}
            />
          </div>
        </div>
      )}
    </div>
  );
};
