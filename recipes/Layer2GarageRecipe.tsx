import React, { useState, useEffect } from 'react';
import { useLayer2GarageStoreBinding } from './hooks/useMainMenuAndPlayStoreBindings';
import {
  Car,
  Palette,
  Sparkles,
  Music,
  CloudSync,
} from 'lucide-react';
import { PanelContainer, PanelHeader, PanelContent, PanelFooter } from '../layout/Panel';
import { UnderlineTabs, TabItem } from '../primitives/UnderlineTabs';
import { UnderConstructionPlaceholder } from '../primitives/UnderConstructionPlaceholder';
import { useMenuLayoutStore } from '../stores/menuLayoutStore';
import { GarageCarTab } from './garage/GarageCarTab';
import { GarageColorTab, DEFAULT_BLUE_ORDER, DEFAULT_ORANGE_ORDER } from './garage/GarageColorTab';
import { GarageMaterialsTab, type VisualMaterialsConfig } from './garage/GarageMaterialsTab';
import { GarageAnthemTab } from './garage/GarageAnthemTab';

export * from './garage/garageConstants';
export * from './garage/GarageCarTab';
export * from './garage/GarageColorTab';
export * from './garage/GarageMaterialsTab';
export * from './garage/GarageAnthemTab';

export type GarageTabId =
  | 'car'
  | 'paint'
  | 'loadout'
  | 'anthem'
  | 'sync'
  | 'colour'
  | 'materials'
  | 'player-name';

export interface Layer2GarageRecipeProps {
  isLight?: boolean;
  onBack?: () => void;
  initialTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Car Tab controlled props
  selectedCar?: string;
  defaultSelectedCar?: string;
  onSelectCar?: (carId: string) => void;
  // Paint Tab controlled props
  primaryTeam?: 'blue' | 'orange';
  defaultPrimaryTeam?: 'blue' | 'orange';
  onPrimaryTeamChange?: (team: 'blue' | 'orange') => void;
  paintFinish?: 'matte' | 'metallic';
  defaultPaintFinish?: 'matte' | 'metallic';
  onPaintFinishChange?: (finish: 'matte' | 'metallic') => void;
  blueOrder?: number[];
  defaultBlueOrder?: number[];
  onBlueOrderChange?: (next: number[]) => void;
  orangeOrder?: number[];
  defaultOrangeOrder?: number[];
  onOrangeOrderChange?: (next: number[]) => void;
  // Loadout (Materials) Tab controlled props
  materials?: VisualMaterialsConfig;
  onUpdateMaterials?: (partial: Partial<VisualMaterialsConfig>) => void;
  // Anthem Tab controlled props
  selectedAnthem?: string;
  defaultSelectedAnthem?: string;
  onSelectAnthem?: (anthemId: string) => void;
  /** Whether Anthem audio assets are available (default false -> renders Under Development placeholder) */
  anthemAvailable?: boolean;
}

/**
 * [Recipe] Layer 2 Garage Loadout Menu (Width: 640px, Height: 520px)
 * Modular nested architecture maintaining low coupling:
 * 1. Car (`GarageCarTab`): 7 cards with name & hitbox badge (4x2 grid, no scroll)
 * 2. Paint (`GarageColorTab`): Blue & Orange team fallback preference order (2x3 = 6 presets)
 * 3. Loadout (`GarageMaterialsTab`): Ball style, demolition FX, boost trail, boost audio & luminance
 * 4. Anthem (`GarageAnthemTab`): Anthem selection or Under Development placeholder
 * 5. Sync (`cloud-sync`): Server-bound customization sync & profile synchronization
 */
export const Layer2GarageRecipe: React.FC<Layer2GarageRecipeProps> = (rawProps) => {
  const {
  isLight = false,
  onBack = () => {},
  initialTab = 'car',
  activeTab: controlledTab,
  onTabChange,
  selectedCar: controlledSelectedCar,
  defaultSelectedCar = 'fennec',
  onSelectCar,
  primaryTeam,
  defaultPrimaryTeam,
  onPrimaryTeamChange,
  paintFinish,
  defaultPaintFinish,
  onPaintFinishChange,
  blueOrder,
  defaultBlueOrder = DEFAULT_BLUE_ORDER,
  onBlueOrderChange,
  orangeOrder,
  defaultOrangeOrder = DEFAULT_ORANGE_ORDER,
  onOrangeOrderChange,
  materials,
  onUpdateMaterials,
  selectedAnthem: controlledSelectedAnthem,
  defaultSelectedAnthem = 'none',
  onSelectAnthem,
  anthemAvailable = true,
} = useLayer2GarageStoreBinding(rawProps);
  const { panels, panelBodyPaddingX } = useMenuLayoutStore();
  const sizing = panels['layer2-garage'];
  const normalizeTab = (t?: string) => {
    if (t === 'player-name') return 'sync';
    if (t === 'colour') return 'paint';
    if (t === 'materials') return 'loadout';
    return t || 'car';
  };
  const [internalTab, setInternalTab] = useState(() => normalizeTab(initialTab));
  const activeTab = normalizeTab(controlledTab ?? internalTab);

  useEffect(() => {
    if (initialTab && !controlledTab) {
      setInternalTab(normalizeTab(initialTab));
    }
  }, [initialTab, controlledTab]);

  const handleTabChange = (tab: string) => {
    const normalized = normalizeTab(tab);
    setInternalTab(normalized);
    onTabChange?.(normalized);
  };

  const [hoveredDesc, setHoveredDesc] = useState<string | null>(null);

  // Car State
  const [internalSelectedCar, setInternalSelectedCar] = useState(defaultSelectedCar);
  const selectedCar = controlledSelectedCar ?? internalSelectedCar;
  const handleSelectCar = (carId: string) => {
    if (controlledSelectedCar === undefined) {
      setInternalSelectedCar(carId);
    }
    onSelectCar?.(carId);
  };

  // Anthem State
  const [internalSelectedAnthem, setInternalSelectedAnthem] = useState(defaultSelectedAnthem);
  const selectedAnthem = controlledSelectedAnthem ?? internalSelectedAnthem;
  const handleSelectAnthem = (anthemId: string) => {
    if (controlledSelectedAnthem === undefined) {
      setInternalSelectedAnthem(anthemId);
    }
    onSelectAnthem?.(anthemId);
  };

  const tabs: TabItem[] = [
    { id: 'car', label: 'Car', icon: <Car className="h-3.5 w-3.5" /> },
    { id: 'paint', label: 'Paint', icon: <Palette className="h-3.5 w-3.5" /> },
    { id: 'loadout', label: 'Loadout', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'anthem', label: 'Anthem', icon: <Music className="h-3.5 w-3.5" /> },
    { id: 'sync', label: 'Sync', icon: <CloudSync className="h-3.5 w-3.5" /> },
  ];

  return (
    <PanelContainer isLight={isLight} sizing={sizing} className="w-full">
      <PanelHeader
        title="GARAGE LOADOUT"
        onBack={onBack}
        isLight={isLight}
      />

      {/* Underline Tabs */}
      <div
        style={{ paddingLeft: `${panelBodyPaddingX}px`, paddingRight: `${panelBodyPaddingX}px` }}
        className="pt-1 shrink-0"
        data-panel-section="tabs"
      >
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={handleTabChange}
          isLight={isLight}
          size="sm"
        />
      </div>

      <PanelContent scrollable>
        <div className="grid grid-cols-1 items-start w-full shrink-0">
          <div
            aria-hidden={activeTab !== 'car'}
            inert={activeTab !== 'car' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              activeTab === 'car'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <GarageCarTab
              selectedCar={selectedCar}
              onSelectCar={handleSelectCar}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>

          <div
            aria-hidden={activeTab !== 'paint'}
            inert={activeTab !== 'paint' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              activeTab === 'paint'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <GarageColorTab
              primaryTeam={primaryTeam}
              defaultPrimaryTeam={defaultPrimaryTeam}
              onPrimaryTeamChange={onPrimaryTeamChange}
              paintFinish={paintFinish}
              defaultPaintFinish={defaultPaintFinish}
              onPaintFinishChange={onPaintFinishChange}
              blueOrder={blueOrder}
              defaultBlueOrder={defaultBlueOrder}
              onBlueOrderChange={onBlueOrderChange}
              orangeOrder={orangeOrder}
              defaultOrangeOrder={defaultOrangeOrder}
              onOrangeOrderChange={onOrangeOrderChange}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>

          <div
            aria-hidden={activeTab !== 'loadout'}
            inert={activeTab !== 'loadout' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              activeTab === 'loadout'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <GarageMaterialsTab
              materials={materials}
              onUpdateMaterials={onUpdateMaterials}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>

          <div
            aria-hidden={activeTab !== 'anthem'}
            inert={activeTab !== 'anthem' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              activeTab === 'anthem'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <GarageAnthemTab
              selectedAnthem={selectedAnthem}
              onSelectAnthem={handleSelectAnthem}
              anthemAvailable={anthemAvailable}
              onHoverDesc={setHoveredDesc}
              isLight={isLight}
            />
          </div>

          <div
            aria-hidden={activeTab !== 'sync'}
            inert={activeTab !== 'sync' ? true : undefined}
            className={`col-start-1 row-start-1 w-full ${
              activeTab === 'sync'
                ? 'visible opacity-100 pointer-events-auto z-10'
                : 'invisible opacity-0 pointer-events-none select-none z-0'
            }`}
          >
            <UnderConstructionPlaceholder
              title="Cloud Sync Configuration Under Construction"
              description="Cloud profile synchronization, cross-device loadout backup and account binding modules are currently under construction."
              badge="IN DEVELOPMENT"
              isLight={isLight}
            />
          </div>
        </div>
      </PanelContent>

      <PanelFooter
        isLight={isLight}
        defaultDescription="Customization loadout, team paint preference, visual loadout effects & cloud sync."
        hoveredDescription={hoveredDesc}
      />
    </PanelContainer>
  );
};
