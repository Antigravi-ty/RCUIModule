import React from 'react';
import { Zap, Play } from 'lucide-react';
import { Button } from '../primitives/Button';

export interface KickoffDuelSlotCell {
  slotIndex: number;
  slotCode: 'DR' | 'DL' | 'BR' | 'BL' | 'CT';
  winner: 'BLUE' | 'ORANGE' | 'TIE';
  touchTick: number;
}

export interface KickoffDuelMatrixRow {
  pairId: string;
  blue: string;
  orange: string;
  label: string;
  slots: KickoffDuelSlotCell[];
  blueWins: number;
  orangeWins: number;
  ties: number;
}

export const DEFAULT_KICKOFF_DUEL_MATRIX_ROWS: KickoffDuelMatrixRow[] = [
  {
    pairId: 'nexto-vs-necto',
    blue: 'nexto',
    orange: 'necto',
    label: 'Nexto vs Necto',
    slots: [
      { slotIndex: 0, slotCode: 'DR', winner: 'BLUE', touchTick: 201 },
      { slotIndex: 1, slotCode: 'DL', winner: 'BLUE', touchTick: 202 },
      { slotIndex: 2, slotCode: 'BR', winner: 'TIE', touchTick: 214 },
      { slotIndex: 3, slotCode: 'BL', winner: 'BLUE', touchTick: 213 },
      { slotIndex: 4, slotCode: 'CT', winner: 'ORANGE', touchTick: 226 },
    ],
    blueWins: 3,
    orangeWins: 1,
    ties: 1,
  },
  {
    pairId: 'nexto-vs-heuristic',
    blue: 'nexto',
    orange: 'heuristic',
    label: 'Nexto vs Heuristic',
    slots: [
      { slotIndex: 0, slotCode: 'DR', winner: 'BLUE', touchTick: 201 },
      { slotIndex: 1, slotCode: 'DL', winner: 'BLUE', touchTick: 201 },
      { slotIndex: 2, slotCode: 'BR', winner: 'BLUE', touchTick: 214 },
      { slotIndex: 3, slotCode: 'BL', winner: 'BLUE', touchTick: 214 },
      { slotIndex: 4, slotCode: 'CT', winner: 'BLUE', touchTick: 225 },
    ],
    blueWins: 5,
    orangeWins: 0,
    ties: 0,
  },
  {
    pairId: 'necto-vs-heuristic',
    blue: 'necto',
    orange: 'heuristic',
    label: 'Necto vs Heuristic',
    slots: [
      { slotIndex: 0, slotCode: 'DR', winner: 'BLUE', touchTick: 205 },
      { slotIndex: 1, slotCode: 'DL', winner: 'BLUE', touchTick: 205 },
      { slotIndex: 2, slotCode: 'BR', winner: 'ORANGE', touchTick: 219 },
      { slotIndex: 3, slotCode: 'BL', winner: 'BLUE', touchTick: 217 },
      { slotIndex: 4, slotCode: 'CT', winner: 'TIE', touchTick: 229 },
    ],
    blueWins: 3,
    orangeWins: 1,
    ties: 1,
  },
];

export interface KickoffDuelMatrixCardProps {
  rows?: KickoffDuelMatrixRow[];
  selectedBlueModel?: string;
  selectedOrangeModel?: string;
  selectedSlotIndex?: number;
  isRunningBenchmark?: boolean;
  onSelectCell?: (blueModel: string, orangeModel: string, slotIndex: number) => void;
  onInspectCell?: (pairId: string, slotCode: string) => void;
  onRunBenchmark?: () => void;
  onRunMatrix?: () => void;
  isLight?: boolean;
  className?: string;
}

/**
 * [L3 Compound] KickoffDuelMatrixCard
 * Pure props-driven N-Pairing × 5-Slot (`DR / DL / BR / BL / CT`) Kickoff First-Touch Benchmark Matrix Table.
 */
export const KickoffDuelMatrixCard: React.FC<KickoffDuelMatrixCardProps> = React.memo(
  ({
    rows = DEFAULT_KICKOFF_DUEL_MATRIX_ROWS,
    selectedBlueModel = 'nexto',
    selectedOrangeModel = 'necto',
    selectedSlotIndex = 0,
    isRunningBenchmark = false,
    onSelectCell,
    onRunBenchmark,
    isLight = true,
    className = '',
  }) => {
  return (
    <div
      data-ui-element="compound-kickoff-duel-matrix-card"
      className={`p-3 rounded-xl border flex flex-col gap-2.5 select-none ${
        isLight
          ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
          : 'bg-neutral-900/70 border-neutral-800 text-neutral-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-bold text-xs">
            Kickoff AI Pairing × 5-Spawn Benchmark Matrix
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          disabled={isRunningBenchmark}
          onClick={onRunBenchmark}
          isLight={isLight}
          className="gap-1 px-2.5 py-1 text-[10px]"
        >
          <Play className="h-3 w-3 fill-current" />
          <span>{isRunningBenchmark ? 'Simulating Duels...' : 'Re-Run Duels'}</span>
        </Button>
      </div>

      <div
        className={`rounded-lg border overflow-x-auto ${
          isLight ? 'bg-white border-neutral-200' : 'bg-neutral-950/70 border-neutral-800'
        }`}
      >
        <table className="w-full text-[10px] font-mono border-collapse">
          <thead>
            <tr
              className={`border-b ${
                isLight ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <th className="py-1.5 px-2 text-left">Matchup (Blue vs Orange)</th>
              <th className="py-1.5 px-1.5 text-center">DR</th>
              <th className="py-1.5 px-1.5 text-center">DL</th>
              <th className="py-1.5 px-1.5 text-center">BR</th>
              <th className="py-1.5 px-1.5 text-center">BL</th>
              <th className="py-1.5 px-1.5 text-center">CT</th>
              <th className="py-1.5 px-2 text-right">W-L-T</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrentPair =
                row.blue === selectedBlueModel && row.orange === selectedOrangeModel;
              return (
                <tr
                  key={row.pairId}
                  className={`border-b last:border-b-0 ${
                    isLight ? 'border-neutral-200/70' : 'border-neutral-800/70'
                  } ${isCurrentPair ? 'bg-amber-500/10' : ''}`}
                >
                  <td
                    className="py-1.5 px-2 font-semibold cursor-pointer hover:underline whitespace-nowrap"
                    onClick={() => onSelectCell?.(row.blue, row.orange, selectedSlotIndex)}
                  >
                    {row.label}
                  </td>
                  {row.slots.map((s) => {
                    const isCellActive = isCurrentPair && selectedSlotIndex === s.slotIndex;
                    const winColor =
                      s.winner === 'BLUE'
                        ? 'text-sky-500'
                        : s.winner === 'ORANGE'
                        ? 'text-amber-500'
                        : 'text-emerald-500';
                    const winChar =
                      s.winner === 'BLUE' ? 'B' : s.winner === 'ORANGE' ? 'O' : 'T';
                    return (
                      <td
                        key={s.slotIndex}
                        onClick={() => onSelectCell?.(row.blue, row.orange, s.slotIndex)}
                        className={`py-1.5 px-1.5 text-center cursor-pointer transition-colors hover:bg-amber-500/15 ${
                          isCellActive ? 'ring-1 ring-inset ring-amber-500 font-bold' : ''
                        } ${winColor}`}
                      >
                        {winChar}:{s.touchTick}f
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-2 text-right font-bold whitespace-nowrap">
                    <span className="text-sky-500">{row.blueWins}</span>-
                    <span className="text-amber-500">{row.orangeWins}</span>-
                    <span className="text-emerald-500">{row.ties}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

KickoffDuelMatrixCard.displayName = 'KickoffDuelMatrixCard';
