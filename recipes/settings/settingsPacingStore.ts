import { create } from 'zustand';

export type ClockPacingMode = 'legacy' | 'sts' | 'csts' | 'custom';

export type ExperiencePriorityOption =
  | 'competitive'
  | 'balanced'
  | 'motion'
  | 'input_consistency'
  | 'custom';

export interface SettingsPacingState {
  clockPacingMode: ClockPacingMode;
  experiencePriority: ExperiencePriorityOption;
  inputBufferTarget: number;
  inputBufferThreshold: [number, number];
  /**
   * Updates Input Buffer mode in Settings -> Advanced.
   * Only when adjusted to 'custom' does it force Gameplay Experience Priority to 'custom'.
   */
  setClockPacingMode: (mode: ClockPacingMode) => void;
  /**
   * Updates Experience Priority in Settings -> Gameplay.
   * Can be adjusted independently (setting to 'custom' does not force Input Buffer to 'custom').
   * When pulled back to any of the 4 non-custom presets, Input Buffer defaults back to 'csts'.
   */
  setExperiencePriority: (priority: ExperiencePriorityOption) => void;
  setInputBufferTarget: (target: number) => void;
  setInputBufferThreshold: (threshold: [number, number]) => void;
  resetSettingsPacing: () => void;
}

export const useSettingsPacingStore = create<SettingsPacingState>((set) => ({
  clockPacingMode: 'csts',
  experiencePriority: 'balanced',
  inputBufferTarget: 3,
  inputBufferThreshold: [-1, 1],

  setClockPacingMode: (mode) =>
    set((state) => ({
      clockPacingMode: mode,
      experiencePriority: mode === 'custom' ? 'custom' : state.experiencePriority,
    })),

  setExperiencePriority: (priority) =>
    set((state) => ({
      experiencePriority: priority,
      clockPacingMode: priority !== 'custom' ? 'csts' : state.clockPacingMode,
    })),

  setInputBufferTarget: (nextAlpha) =>
    set((state) => ({
      inputBufferTarget: nextAlpha,
      inputBufferThreshold: [
        Math.max(-nextAlpha, state.inputBufferThreshold[0]),
        Math.min(nextAlpha, state.inputBufferThreshold[1]),
      ],
    })),

  setInputBufferThreshold: (threshold) =>
    set({
      inputBufferThreshold: threshold,
    }),

  resetSettingsPacing: () =>
    set({
      clockPacingMode: 'csts',
      experiencePriority: 'balanced',
      inputBufferTarget: 3,
      inputBufferThreshold: [-1, 1],
    }),
}));
