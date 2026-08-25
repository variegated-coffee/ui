/**
 * The Variegated design language, and the primitives built from it.
 *
 * Two Preact frontends share this: `variegated-plantlet-ts/packages/shot-log` and the
 * comms firmware's own `frontend/`. It is a published package rather than a workspace
 * sibling because those live in different repositories, and because Vite does not
 * transpile TypeScript inside `node_modules` -- so this ships built JS with declarations
 * beside it.
 */
export { tokens, statusColors, contrastRatio } from './tokens';
export type { StatusRole } from './tokens';

export { Button } from './ui/Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './ui/Button';

export { Field, TextInput } from './ui/Field';
export type { ControlProps, FieldProps, TextInputProps } from './ui/Field';

export { Select } from './ui/Select';
export type { SelectOption, SelectProps } from './ui/Select';

export { Alert } from './ui/Alert';
export type { AlertProps } from './ui/Alert';

export { Badge } from './ui/Badge';
export type { BadgeProps } from './ui/Badge';

export { Tabs } from './ui/Tabs';
export type { TabDefinition, TabsProps } from './ui/Tabs';

export { Section } from './ui/Section';
export type { SectionProps } from './ui/Section';

/*
 * `Reading`, not `Readout` -- the shot page's `Readout` (the panel of every pen's current
 * value) already owns that name in the design system, and two different components sharing
 * one export name is a duplicate identifier in the flat bundle namespace.
 */
export { Reading, ReadingGroup } from './ui/Reading';
export type { ReadingProps } from './ui/Reading';

export { EmptyState } from './ui/EmptyState';
export type { EmptyStateProps } from './ui/EmptyState';

export { Dialog, DialogHost, useDialogs } from './ui/Dialog';
export type { ConfirmRequest, DialogProps } from './ui/Dialog';

export { useInteractive, focusRingStyle } from './ui/useInteractive';
export type { Interactive } from './ui/useInteractive';
