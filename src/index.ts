/**
 * The Variegated design language, and the primitives built from it.
 *
 * Two Preact frontends share this: `variegated-plantlet-ts/packages/shot-log` and the
 * comms firmware's own `frontend/`. It is a published package rather than a workspace
 * sibling because those live in different repositories, and because Vite does not
 * transpile TypeScript inside `node_modules` -- so this ships built JS with declarations
 * beside it.
 */
export {
  tokens,
  statusColors,
  statusColorsFor,
  themeFor,
  tokensFor,
  contrastRatio,
} from './tokens.js';
export type { StatusRole, StatusColor, ColorScheme, Theme } from './tokens.js';

export { Button } from './ui/Button.js';
export type { ButtonProps, ButtonSize, ButtonVariant } from './ui/Button.js';

export { Field, TextInput } from './ui/Field.js';
export type { ControlProps, FieldProps, TextInputProps } from './ui/Field.js';

export { Select } from './ui/Select.js';
export type { SelectOption, SelectProps } from './ui/Select.js';

export { Alert } from './ui/Alert.js';
export type { AlertProps } from './ui/Alert.js';

export { Badge } from './ui/Badge.js';
export type { BadgeProps } from './ui/Badge.js';

export { Tabs } from './ui/Tabs.js';
export type { TabDefinition, TabsProps } from './ui/Tabs.js';

export { Section } from './ui/Section.js';
export type { SectionProps } from './ui/Section.js';

/*
 * `Reading`, not `Readout` -- the shot page's `Readout` (the panel of every pen's current
 * value) already owns that name in the design system, and two different components sharing
 * one export name is a duplicate identifier in the flat bundle namespace.
 */
export { Reading, ReadingGroup } from './ui/Reading.js';
export type { ReadingProps } from './ui/Reading.js';

export { EmptyState } from './ui/EmptyState.js';
export type { EmptyStateProps } from './ui/EmptyState.js';

export { Dialog, DialogHost, useDialogs } from './ui/Dialog.js';
export type { ConfirmRequest, DialogProps } from './ui/Dialog.js';

export { useInteractive, focusRingStyle } from './ui/useInteractive.js';
export type { Interactive } from './ui/useInteractive.js';

/*
 * The primitives the web refinement added.
 *
 * `Figure` is the one the others are built on: every measured number on every screen goes
 * through it, which is what makes a column of them line up and a pending value look pending.
 * `Reading` delegates to it rather than restating the treatment.
 *
 * Two names sit close to existing ones and neither collides today, but both are worth
 * knowing about: `List` beside `CommandList`, and `Stepper` beside `StepEditor`/`StepTable`,
 * which are about routine *steps* rather than about stepping a value.
 */
export { Figure } from './ui/Figure.js';
export type { FigureProps } from './ui/Figure.js';

export { Meter } from './ui/Meter.js';
export type { MeterProps } from './ui/Meter.js';

export { Stepper } from './ui/Stepper.js';
export type { StepperProps } from './ui/Stepper.js';

export { PageHeader } from './ui/PageHeader.js';
export type { PageHeaderProps } from './ui/PageHeader.js';

export { List, ListRow } from './ui/List.js';
export type { ListProps, ListRowProps } from './ui/List.js';

export { FilterBar } from './ui/FilterBar.js';
export type { FilterBarProps, FilterOption, FilterSpec, ToggleSpec } from './ui/FilterBar.js';

export { EntityPicker } from './ui/EntityPicker.js';
export type { EntityPickerProps, PickerEntity } from './ui/EntityPicker.js';
