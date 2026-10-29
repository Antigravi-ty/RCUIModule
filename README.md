# RCUIModule

Decoupled UI system submodule shared between [RocketCompanion](https://github.com/Antigravi-ty/RocketCompanion) (`src/ui-system`) and [RCUITuner](https://github.com/Antigravi-ty/RCUITuner) (`src/ui-core`).

## Unidirectional Layer Hierarchy

```text
config <- stores <- tokens <- primitives <- layout <- compounds <- navigation <- (hud | charts | viewport | loading) <- (panels | recipes)
```

- `config/`: Domain schemas, presets, math utilities, input binding definitions, and training pack storage contracts.
- `stores/`: Zustand state stores and 120Hz transient telemetry channels (`hudTransientChannel`).
- `tokens/`: Design tokens, colors, typography, spacing, easing curves, adaptive layout measurement (`menuPanelAdaptive`), and style tuner stores.
- `primitives/`: Atomic stateless UI controls (`Button`, `Checkbox`, `SliderControl`, `DualGrabberSlider`, `SegmentedSwitch`, `ToggleSwitch`, `DropdownMenu`, `InlineErrorNotice`, `KeycapBadge`, `PlayCard`, `Card`, `SectionErrorBoundary`, and SVG icon definitions).
- `layout/`: Spatial containers (`Panel`, `MenuContainer`, `HStack`, `VStack`, `GridStack`, `HudAnchorStage`).
- `compounds/`: Multi-primitive controls (`UnderlineTabs`, `SettingActionRow`, `SettingSliderRow`, `SettingSegmentedRow`, `SettingToggleRow`, `SettingDeveloperStatusRow`, `Dialogue`, `QuickNotification`).
- `navigation/`: Container transitions (`MorphContainer`), stage shells (`MorphingStageShell`, `MorphingShell`), floating window management (`FloatingWindowManager`, `FloatingStackIcon`, `FloatingThreeStageWindow`), and live preview dock (`LivePreviewDock`).
- `hud/`: Match HUD instruments (`InGameHUD`, `CircularBoostGauge`, `StepperScoreboardHUD`, `BallCameraIndicator`, `DemolishHourglassTimerHUD`, `CenterUpperInfoHUD`, `EdgePlayerHudStrip`, `StaticTrainingPackHUD`, `StatsEventFeedHUD`, `PitchMiniMapHUD`, `ReplayControlBannerHUD`).
- `charts/`: Telemetry and curve editors (`CubicBezierCurveEditor`, `EventImpulseScatterChart`, `ParametricTrajectoryChart`, `TelemetrySparkline`, `VelocityProgressBar`).
- `viewport/`: Safe-area viewport scaling and arena backdrop (`GameViewport`, `SafeAreaHud`, `ArenaBackdrop`).
- `loading/`: Dual-stage progress bar and loading screen (`DualProgressBar`, `LoadingScreen`).
- `panels/`: 18 production developer floating window tuners (`floatingWindowRegistry.tsx` and domain sub-modules).
- `recipes/`: Layer 1, Layer 2, Layer 3, and Layer 4 menu recipes connected to stores with optional controlled/override props for flat state-matrix auditing.
