import React, { useState } from 'react';
import {
  Activity,
  Compass,
  Gauge,
  Maximize2,
  Radio,
  Sliders,
  Speaker,
  Volume2,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { InlineErrorNotice } from '../primitives/InlineErrorNotice';
import { SettingSegmentedRow } from '../compounds/SettingSegmentedRow';
import { SettingSliderRow } from '../compounds/SettingSliderRow';
import { SettingToggleRow } from '../compounds/SettingToggleRow';
import { useMenuLayoutStore } from '../tokens/menuLayoutStore';
import { useSettingActionRowStore } from '../tokens/settingRowStore';

export interface Layer3AudioEqRecipeProps {
  isLight?: boolean;
  developerMode?: boolean;
  onBack?: () => void;
  hasError?: boolean;
  onCheckNotification?: () => void;
}

/**
 * [Recipe] Layer 3 Acoustics & Equalizer (Developer Tier)
 * Streamlined single-column vertical layout sharing unified Settings row typography & spacing,
 * with direct numeric input + Enter key confirmation enabled in Developer Mode.
 */
export const Layer3AudioEqRecipe: React.FC<Layer3AudioEqRecipeProps> = ({
  isLight = false,
  developerMode = true,
  onBack = () => {},
  hasError: propHasError,
  onCheckNotification,
}) => {
  const { panels, simulateLayer3Error } = useMenuLayoutStore();
  const sizing = panels['layer3-audio-eq'];
  const showError = propHasError ?? simulateLayer3Error;
  const { rowGap } = useSettingActionRowStore();

  const [spatialAudio, setSpatialAudio] = useState(true);
  const [panningModel, setPanningModel] = useState<'equalpower' | 'HRTF'>('HRTF');
  const [rolloffCurve, setRolloffCurve] = useState<'inverse' | 'linear' | 'exponential'>('inverse');
  const [audibilityFloor, setAudibilityFloor] = useState(18);
  const [acousticScale, setAcousticScale] = useState(1.0);
  const [compressionMode, setCompressionMode] = useState('dynamic');
  const [lows, setLows] = useState(65);
  const [mids, setMids] = useState(50);
  const [highs, setHighs] = useState(58);

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full select-none">
      <PanelHeader
        title="ACOUSTICS & EQUALIZER"
        onBack={onBack}
        isLight={isLight}
      />

      <PanelContent scrollable={true}>
        <div
          data-layout="audio-detail-list"
          className="flex flex-col w-full"
          style={{ gap: `${rowGap}px` }}
        >
          <InlineErrorNotice
            visible={showError}
            isLight={isLight}
            onCheckNotification={onCheckNotification}
          />

          {/* 1. Dynamic Range Profile */}
          <SettingSegmentedRow
            icon={Volume2}
            iconColor="text-amber-500"
            title="Dynamic Range Profile"
            value={compressionMode}
            onChange={setCompressionMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'compressed', label: 'Night' },
              { value: 'dynamic', label: 'Dynamic' },
              { value: 'monitor', label: 'Studio' },
            ]}
            hoverDescription="Dynamic range compression profile for headphone and speaker acoustics."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 2. HRTF 3D Spatial Audio */}
          <SettingToggleRow
            icon={Radio}
            iconColor="text-sky-400"
            title="HRTF 3D Spatial Audio"
            checked={spatialAudio}
            onChange={setSpatialAudio}
            bordered={false}
            showDescription={false}
            hoverDescription="Enable 3D spatial audio positioning for ball, boost, and opponent vehicle emitters."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 3. 3D Spatial Panning Model */}
          <SettingSegmentedRow
            icon={Compass}
            iconColor="text-sky-400"
            title="3D Spatial Panning Model"
            value={panningModel}
            onChange={(v) => setPanningModel(v as 'equalpower' | 'HRTF')}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'equalpower', label: 'Equal Power' },
              { value: 'HRTF', label: 'HRTF Binaural' },
            ]}
            hoverDescription="Select WebAudio PannerNode spatialization algorithm (Equal Power vs HRTF Binaural)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 4. Distance Rolloff Curve */}
          <SettingSegmentedRow
            icon={Activity}
            iconColor="text-emerald-400"
            title="Distance Rolloff Curve"
            value={rolloffCurve}
            onChange={(v) => setRolloffCurve(v as 'inverse' | 'linear' | 'exponential')}
            layout="inline"
            bordered={false}
            showDescription={false}
            options={[
              { value: 'inverse', label: 'Inverse' },
              { value: 'linear', label: 'Linear' },
              { value: 'exponential', label: 'Exponential' },
            ]}
            hoverDescription="Distance attenuation curve applied to 3D ball and opponent car emitters."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 5. Distant Audibility Floor */}
          <SettingSliderRow
            icon={Gauge}
            iconColor="text-amber-400"
            label="Distant Audibility Floor"
            title="Distant Audibility Floor"
            value={audibilityFloor}
            min={0}
            max={50}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={setAudibilityFloor}
            hoverDescription="Minimum volume floor for far-field 3D audio sources (0% to 50%)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 6. Arena Acoustic Scale */}
          <SettingSliderRow
            icon={Maximize2}
            iconColor="text-emerald-400"
            label="Arena Acoustic Scale"
            title="Arena Acoustic Scale"
            value={acousticScale}
            min={0.5}
            max={2.0}
            step={0.05}
            unit="x"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={setAcousticScale}
            hoverDescription="Spatial distance scale multiplier for arena reverberation and rolloff (0.50x to 2.00x)."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 7. Bass (100Hz) */}
          <SettingSliderRow
            icon={Speaker}
            iconColor="text-amber-500"
            label="Bass (100Hz)"
            title="Bass (100Hz)"
            value={lows}
            min={0}
            max={100}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={setLows}
            hoverDescription="Low-frequency bass shelf (100Hz) for engine roar and stadium sub-bass."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 8. Midrange (1kHz) */}
          <SettingSliderRow
            icon={Sliders}
            iconColor="text-amber-500"
            label="Midrange (1kHz)"
            title="Midrange (1kHz)"
            value={mids}
            min={0}
            max={100}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={setMids}
            hoverDescription="Midrange band (1kHz) for ball impact snap and announcer clarity."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />

          {/* 9. Treble (10kHz) */}
          <SettingSliderRow
            icon={Sliders}
            iconColor="text-amber-500"
            label="Treble (10kHz)"
            title="Treble (10kHz)"
            value={highs}
            min={0}
            max={100}
            step={1}
            unit="%"
            developerMode={developerMode}
            layout="inline"
            bordered={false}
            showDescription={false}
            onChange={setHighs}
            hoverDescription="High-frequency presence (10kHz) for tire skids and boost hiss."
            onHover={(desc) => desc && setHoveredDesc(desc)}
            onLeave={() => setHoveredDesc(null)}
            isLight={isLight}
          />
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Configure 3-band parametric equalizer, 3D spatial panning, rolloff curves, and dynamic range profile."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
};
