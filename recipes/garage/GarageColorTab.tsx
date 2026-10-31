import React, { useState } from 'react';
import { Shield, Paintbrush } from 'lucide-react';
import { SettingSegmentedRow } from '../../compounds/SettingSegmentedRow';
import {
  PriorityQueueList,
  PriorityQueueItem,
} from '../../compounds/tuner/PriorityQueueList';
import { BLUE_TEAM_COLOURS, ORANGE_TEAM_COLOURS } from './garageConstants';

export interface GarageColorTabProps {
  blueOrder?: number[];
  defaultBlueOrder?: number[];
  onBlueOrderChange?: (next: number[]) => void;
  orangeOrder?: number[];
  defaultOrangeOrder?: number[];
  onOrangeOrderChange?: (next: number[]) => void;
  primaryTeam?: 'blue' | 'orange';
  defaultPrimaryTeam?: 'blue' | 'orange';
  onPrimaryTeamChange?: (team: 'blue' | 'orange') => void;
  paintFinish?: 'matte' | 'metallic';
  defaultPaintFinish?: 'matte' | 'metallic';
  onPaintFinishChange?: (finish: 'matte' | 'metallic') => void;
  onHoverDesc?: (desc: string | null) => void;
  isLight?: boolean;
}

export const DEFAULT_BLUE_ORDER: number[] = [1, 5, 3];
export const DEFAULT_ORANGE_ORDER: number[] = [2, 4, 0];

export const GarageColorTab: React.FC<GarageColorTabProps> = ({
  blueOrder: controlledBlueOrder,
  defaultBlueOrder = DEFAULT_BLUE_ORDER,
  onBlueOrderChange,
  orangeOrder: controlledOrangeOrder,
  defaultOrangeOrder = DEFAULT_ORANGE_ORDER,
  onOrangeOrderChange,
  primaryTeam: controlledPrimaryTeam,
  defaultPrimaryTeam = 'blue',
  onPrimaryTeamChange,
  paintFinish: controlledPaintFinish,
  defaultPaintFinish = 'metallic',
  onPaintFinishChange,
  onHoverDesc,
  isLight = false,
}) => {
  const [internalPrimaryTeam, setInternalPrimaryTeam] = useState<'blue' | 'orange'>(
    defaultPrimaryTeam
  );
  const [internalPaintFinish, setInternalPaintFinish] = useState<'matte' | 'metallic'>(
    defaultPaintFinish
  );
  const [internalBlueList, setInternalBlueList] = useState<number[]>(
    controlledBlueOrder ?? defaultBlueOrder
  );
  const [internalOrangeList, setInternalOrangeList] = useState<number[]>(
    controlledOrangeOrder ?? defaultOrangeOrder
  );

  const primaryTeam = controlledPrimaryTeam ?? internalPrimaryTeam;
  const paintFinish = controlledPaintFinish ?? internalPaintFinish;
  const blueList = controlledBlueOrder ?? internalBlueList;
  const orangeList = controlledOrangeOrder ?? internalOrangeList;

  const handlePrimaryTeamChange = (next: 'blue' | 'orange') => {
    if (controlledPrimaryTeam === undefined) {
      setInternalPrimaryTeam(next);
    }
    onPrimaryTeamChange?.(next);
  };

  const handlePaintFinishChange = (next: 'matte' | 'metallic') => {
    if (controlledPaintFinish === undefined) {
      setInternalPaintFinish(next);
    }
    onPaintFinishChange?.(next);
  };

  const reorderItem = (
    list: number[],
    setList: React.Dispatch<React.SetStateAction<number[]>>,
    isControlled: boolean,
    onChangeCallback: ((next: number[]) => void) | undefined,
    index: number,
    direction: 'up' | 'down'
  ) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const next = [...list];
    const [removed] = next.splice(index, 1);
    next.splice(targetIdx, 0, removed);
    if (!isControlled) {
      setList(next);
    }
    onChangeCallback?.(next);
  };

  const blueQueueItems: PriorityQueueItem[] = blueList
    .slice(0, BLUE_TEAM_COLOURS.length)
    .map((cId) => {
      const c = BLUE_TEAM_COLOURS.find((item) => item.id === cId) || BLUE_TEAM_COLOURS[0];
      return { id: String(c.id), name: c.name, hex: c.hex };
    });

  const orangeQueueItems: PriorityQueueItem[] = orangeList
    .slice(0, ORANGE_TEAM_COLOURS.length)
    .map((cId) => {
      const c = ORANGE_TEAM_COLOURS.find((item) => item.id === cId) || ORANGE_TEAM_COLOURS[0];
      return { id: String(c.id), name: c.name, hex: c.hex };
    });

  return (
    <div className="flex flex-col gap-2" data-ui-element="garage-tab-colour">
      {/* Primary Team Priority Switch */}
      <SettingSegmentedRow
        icon={Shield}
        iconColor="text-sky-400"
        title="Primary Team Priority"
        value={primaryTeam}
        onValueChange={(v) => handlePrimaryTeamChange(v as 'blue' | 'orange')}
        options={[
          {
            value: 'blue',
            label: 'Blue Team',
            icon: <span className="h-2.5 w-2.5 rounded-full bg-blue-500 inline-block mr-1" />,
          },
          {
            value: 'orange',
            label: 'Orange Team',
            icon: <span className="h-2.5 w-2.5 rounded-full bg-orange-500 inline-block mr-1" />,
          },
        ]}
        isLight={isLight}
        onMouseEnter={() =>
          onHoverDesc?.(
            'Primary Team Priority: Freeplay training utilizes Top 1 priority of selected primary team.'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
      />

      {/* Vehicle Paint Finishes */}
      <SettingSegmentedRow
        icon={Paintbrush}
        iconColor="text-amber-400"
        title="Vehicle Paint Finishes"
        value={paintFinish}
        onValueChange={(v) => handlePaintFinishChange(v as 'matte' | 'metallic')}
        options={[
          { value: 'matte', label: 'Matte' },
          { value: 'metallic', label: 'Metallic' },
        ]}
        isLight={isLight}
        onMouseEnter={() =>
          onHoverDesc?.(
            'Switches vehicle body finish between Matte (Metallic 0.50, Roughness 0.85) and Metallic (Metallic 0.70, Roughness 0.45).'
          )
        }
        onMouseLeave={() => onHoverDesc?.(null)}
      />

      <div className="grid grid-cols-2 gap-3.5 pt-1">
        <div
          onMouseEnter={() =>
            onHoverDesc?.('Reorder Blue Team fallback palette priority (#1 Primary -> Fallback 1 -> Fallback 2).')
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <PriorityQueueList
            title="Blue Team Order"
            subtitle={primaryTeam === 'blue' ? 'Primary Choice' : 'Secondary Team'}
            items={blueQueueItems}
            onReorder={(idx, dir) =>
              reorderItem(
                blueList,
                setInternalBlueList,
                controlledBlueOrder !== undefined,
                onBlueOrderChange,
                idx,
                dir
              )
            }
            accentDotColor="#3b82f6"
            isLight={isLight}
          />
        </div>

        <div
          onMouseEnter={() =>
            onHoverDesc?.('Reorder Orange Team fallback palette priority (#1 Primary -> Fallback 1 -> Fallback 2).')
          }
          onMouseLeave={() => onHoverDesc?.(null)}
        >
          <PriorityQueueList
            title="Orange Team Order"
            subtitle={primaryTeam === 'orange' ? 'Primary Choice' : 'Secondary Team'}
            items={orangeQueueItems}
            onReorder={(idx, dir) =>
              reorderItem(
                orangeList,
                setInternalOrangeList,
                controlledOrangeOrder !== undefined,
                onOrangeOrderChange,
                idx,
                dir
              )
            }
            accentDotColor="#f97316"
            isLight={isLight}
          />
        </div>
      </div>
    </div>
  );
};
