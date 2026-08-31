import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'preact/hooks';
import { Alert } from '../src/ui/Alert.js';
import { Badge } from '../src/ui/Badge.js';
import { Button } from '../src/ui/Button.js';
import { DialogHost, useDialogs } from '../src/ui/Dialog.js';
import { EmptyState } from '../src/ui/EmptyState.js';
import { Field, TextInput } from '../src/ui/Field.js';
import { Figure } from '../src/ui/Figure.js';
import { List, ListRow } from '../src/ui/List.js';
import { Meter } from '../src/ui/Meter.js';
import { Reading } from '../src/ui/Reading.js';
import { Stepper } from '../src/ui/Stepper.js';
import { Section } from '../src/ui/Section.js';
import { Select } from '../src/ui/Select.js';
import { Tabs } from '../src/ui/Tabs.js';
import { tokens } from '../src/tokens.js';

/*
 * These assert the audit's findings rather than the components' appearance.
 *
 * A snapshot of the rendered style would lock in today's padding and tell us nothing about
 * whether a label reaches its input. What is worth holding is the small set of properties
 * that were absent across all 62 components and that a future edit could quietly drop
 * again: the label association, the accessible name, the announcement role, the focus
 * trap, and the deliberate quietness of the destructive button.
 */

/**
 * jsdom normalises every colour it is given into `rgb(r, g, b)`, so comparing a rendered
 * style against a `#rrggbb` token always finds no match. A negative assertion written that
 * way passes whatever the component does -- which is worse than no assertion, so the
 * conversion is explicit here.
 */
function rgb(hex: string): string {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

describe('Field', () => {
  it('points its label at the control it wraps', () => {
    // The one finding that was a count rather than a judgement: `htmlFor` appeared once
    // in the whole design system.
    render(
      <Field label="Beans">
        {(control) => <TextInput {...control} value="" onInput={() => {}} />}
      </Field>
    );

    // getByLabelText resolves through the label association. If the `for`/`id` pair were
    // missing this throws, which is the entire point of asserting it this way rather than
    // reading the attribute.
    expect(screen.getByLabelText('Beans')).toBeTruthy();
  });

  it('keeps the accessible name when the label is hidden', () => {
    render(
      <Field label="Routine name" hideLabel>
        {(control) => <TextInput {...control} value="" onInput={() => {}} />}
      </Field>
    );
    expect(screen.getByLabelText('Routine name')).toBeTruthy();
  });

  it('describes the control with its help text', () => {
    render(
      <Field label="Upper limit" help="Empty means no limit">
        {(control) => <TextInput {...control} value="" onInput={() => {}} />}
      </Field>
    );

    const input = screen.getByLabelText('Upper limit');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    // The help lives in its own node below the control, not inside the label -- which is
    // what "Upper Limit (empty = no limit)" was doing, splitting the label from its input
    // across two lines.
    expect(document.getElementById(describedBy!)?.textContent).toBe('Empty means no limit');
    expect(screen.getByText('Upper limit').textContent).toBe('Upper limit');
  });

  it('announces an error and marks the control invalid', () => {
    render(
      <Field label="Kp" error="Must be a number">
        {(control) => <TextInput {...control} value="abc" onInput={() => {}} />}
      </Field>
    );

    expect(screen.getByLabelText('Kp').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toBe('Must be a number');
  });

  it('gives two fields on one screen different ids', () => {
    // Twelve near-identical PID fields per boiler share a component. A hard-coded id would
    // make eleven of them point at the first.
    render(
      <>
        <Field label="Positive scale">
          {(control) => <TextInput {...control} value="" onInput={() => {}} />}
        </Field>
        <Field label="Negative scale">
          {(control) => <TextInput {...control} value="" onInput={() => {}} />}
        </Field>
      </>
    );

    const a = screen.getByLabelText('Positive scale').id;
    const b = screen.getByLabelText('Negative scale').id;
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});

describe('TextInput', () => {
  it('never renders a number input', () => {
    // `type="number"` is what rendered PID gains as `1,4` beside limits reading `100`:
    // the browser formats and parses that control in its own locale, so the same firmware
    // value displays two ways on two machines. The prop that would reintroduce it does
    // not exist, and this is what says so.
    render(
      <Field label="Kp">
        {(control) => <TextInput {...control} numeric value="1.4" onInput={() => {}} />}
      </Field>
    );

    const input = screen.getByLabelText('Kp') as HTMLInputElement;
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('decimal');
    // The value reaches the DOM exactly as it was given -- no separator substitution.
    expect(input.value).toBe('1.4');
  });

  it('reports what was typed without reformatting it', () => {
    const onInput = vi.fn();
    render(
      <Field label="Kp">
        {(control) => <TextInput {...control} numeric value="" onInput={onInput} />}
      </Field>
    );

    fireEvent.input(screen.getByLabelText('Kp'), { target: { value: '0.05' } });
    expect(onInput).toHaveBeenCalledWith('0.05');
  });
});

describe('Select', () => {
  it('is labelled through Field like any other control', () => {
    render(
      <Field label="Command type">
        {(control) => (
          <Select
            {...control}
            value="RunRoutine"
            onChange={() => {}}
            options={[
              { value: 'RunRoutine', label: 'Run routine', group: 'Routine' },
              { value: 'CancelRoutine', label: 'Cancel routine', group: 'Routine' },
              { value: 'SetMachineMode', label: 'Set machine mode', group: 'Machine' },
            ]}
          />
        )}
      </Field>
    );

    const select = screen.getByLabelText('Command type') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect(select.value).toBe('RunRoutine');
  });

  it('groups options in the order they are given', () => {
    const { container } = render(
      <Field label="Command type">
        {(control) => (
          <Select
            {...control}
            value="a"
            onChange={() => {}}
            options={[
              { value: 'a', label: 'A', group: 'First' },
              { value: 'b', label: 'B', group: 'First' },
              { value: 'c', label: 'C', group: 'Second' },
            ]}
          />
        )}
      </Field>
    );

    const labels = Array.from(container.querySelectorAll('optgroup')).map((g) =>
      g.getAttribute('label')
    );
    expect(labels).toEqual(['First', 'Second']);
  });

  it('reports the chosen value', () => {
    const onChange = vi.fn();
    render(
      <Field label="Mode">
        {(control) => (
          <Select
            {...control}
            value="On"
            onChange={onChange}
            options={[
              { value: 'On', label: 'On' },
              { value: 'Off', label: 'Off' },
            ]}
          />
        )}
      </Field>
    );

    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'Off' } });
    expect(onChange).toHaveBeenCalledWith('Off');
  });
});

describe('Button', () => {
  it('does not give a destructive action the loudest treatment', () => {
    // The finding: every ScheduleBuilder row ended in a filled red Delete, so a list of
    // two schedules drew the eye twice to its most irreversible action. At rest this must
    // not be a red fill.
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const style = (container.querySelector('button') as HTMLButtonElement).style;

    expect(style.background).not.toContain(rgb(tokens.color.danger));
    expect(style.background).not.toContain(rgb(tokens.color.dangerSurface));
    expect(style.color).not.toContain(rgb(tokens.color.danger));
    // Positively: it is ink, the same as any other control on the row.
    expect(style.color).toBe(rgb(tokens.color.ink));
  });

  it('turns red once it is pointed at', () => {
    // Quiet at rest is only right if the warning still arrives -- at the moment it is
    // useful, which is when the pointer is on it.
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const button = container.querySelector('button') as HTMLButtonElement;

    fireEvent.mouseEnter(button);
    expect(button.style.background).toContain(rgb(tokens.color.dangerSurface));
    expect(button.style.color).toBe(rgb(tokens.color.dangerInk));
  });

  it('takes an accessible name when the label is a glyph', () => {
    // 58 `title` tooltips were doing work visible labels should do, and they do not exist
    // on touch -- which is what a machine-side tablet is.
    render(
      <Button ariaLabel="Disable schedule">
        <span aria-hidden="true">⏸</span>
      </Button>
    );
    expect(screen.getByRole('button', { name: 'Disable schedule' })).toBeTruthy();
  });

  it('renders a real link when given an href', () => {
    // ShotLogPanel's Download is a link: same origin, the firmware sets
    // Content-Disposition. Styling a button to look like one would mean reimplementing a
    // download.
    render(
      <Button href="/shots/1" download>
        Download
      </Button>
    );
    const link = screen.getByRole('link', { name: 'Download' });
    expect(link.getAttribute('href')).toBe('/shots/1');
  });

  it('is genuinely disabled, not just dimmed', () => {
    // Finding 05 is a machine that says "Not connected" while Save and both dose buttons
    // stay fully enabled. What has to be true is the attribute -- that is what makes a
    // browser suppress the click and skip the control when tabbing. Asserting it via a
    // synthetic click would not work: `fireEvent` dispatches straight to the listener,
    // bypassing the activation behaviour that does the suppressing.
    render(
      <Button disabled onClick={() => {}}>
        Save
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    // Still readable. A user needs to know *what* is unavailable, not only that something
    // is, so this must not fade to the point of being unreadable.
    expect(Number(button.style.opacity)).toBeGreaterThan(0.5);
  });
});

describe('Alert', () => {
  it('interrupts for a failure and stays polite for a success', () => {
    const { unmount } = render(<Alert role="danger">Could not load shots</Alert>);
    expect(screen.getByRole('alert').textContent).toContain('Could not load shots');
    unmount();

    render(<Alert role="ok">Storage optimized</Alert>);
    expect(screen.getByRole('status').textContent).toContain('Storage optimized');
  });

  it('can offer the way out that the banner it replaces did not', () => {
    // "Not connected to the machine" stated a problem and handed back nothing.
    const onClick = vi.fn();
    render(
      <Alert role="danger" action={{ label: 'Retry', onClick }}>
        Not connected to the machine
      </Alert>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('names its dismiss control', () => {
    render(
      <Alert onDismiss={() => {}}>
        Something happened
      </Alert>
    );
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });
});

describe('Badge', () => {
  it('pairs its colour with a word', () => {
    // Nothing in this system identifies state by colour alone -- the rule the pen palette
    // records, and the reason the ENABLED pill keeps its text.
    render(<Badge role="ok">Enabled</Badge>);
    expect(screen.getByText('Enabled')).toBeTruthy();
  });
});

function TabsHarness() {
  const [active, setActive] = useState('parameters');
  return (
    <Tabs
      label="Routine sections"
      active={active}
      onChange={setActive}
      tabs={[
        { id: 'parameters', label: 'Parameters', badge: '1/8' },
        { id: 'steps', label: 'Steps', badge: 3 },
        { id: 'context', label: 'Context' },
      ]}
    >
      <p>panel: {active}</p>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('is a tablist, not a row of buttons', () => {
    // Finding 03: the routine editor's tab strip could not be driven from a keyboard,
    // because four <button>s with click handlers is not a tab strip.
    render(<TabsHarness />);

    expect(screen.getByRole('tablist', { name: 'Routine sections' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tabpanel')).toBeTruthy();
  });

  it('is one tab stop, with a roving tabindex', () => {
    // The strip should cost one Tab keystroke to skip, not three.
    render(<TabsHarness />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('moves between tabs with the arrow keys, and wraps', async () => {
    render(<TabsHarness />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getByText('panel: steps')).toBeTruthy());
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');

    // Wrapping backwards from the first lands on the last.
    fireEvent.keyDown(tabs[1]!, { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getByText('panel: parameters')).toBeTruthy());
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getByText('panel: context')).toBeTruthy());
  });

  it('jumps to the ends with Home and End', async () => {
    render(<TabsHarness />);
    const tabs = screen.getAllByRole('tab');

    fireEvent.keyDown(tabs[0]!, { key: 'End' });
    await waitFor(() => expect(screen.getByText('panel: context')).toBeTruthy());

    fireEvent.keyDown(tabs[2]!, { key: 'Home' });
    await waitFor(() => expect(screen.getByText('panel: parameters')).toBeTruthy());
  });

  it('points each tab at the panel it governs', () => {
    render(<TabsHarness />);

    const selected = screen.getByRole('tab', { selected: true });
    const panel = screen.getByRole('tabpanel');
    expect(selected.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(selected.id);
  });
});

describe('Section', () => {
  it('is one control, in one place, in both states', async () => {
    // Finding 08: ConfigurationPanel offered a `▶` glyph collapsed and a bordered
    // "Collapse" button in the opposite corner when expanded. One control, so there is
    // exactly one button either way.
    render(
      <Section title="Boilers" defaultOpen={false}>
        <p>body</p>
      </Section>
    );

    const header = screen.getByRole('button', { name: /Boilers/ });
    expect(screen.getAllByRole('button')).toHaveLength(1);

    fireEvent.click(header);
    expect(await screen.findByText('body')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('announces whether it is open, rather than only drawing an arrow', () => {
    render(
      <Section title="Boilers" defaultOpen={false}>
        <p>body</p>
      </Section>
    );

    const header = screen.getByRole('button', { name: /Boilers/ });
    expect(header.getAttribute('aria-expanded')).toBe('false');
    // And it says what it governs.
    const controls = header.getAttribute('aria-controls');
    expect(controls).toBeTruthy();

    fireEvent.click(header);
    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(controls!)?.textContent).toBe('body');
  });

  it('unmounts the body when collapsed', () => {
    // These panels hold readouts fed by a 5 Hz status push. Hiding rather than unmounting
    // keeps re-rendering cards nobody is looking at.
    render(
      <Section title="Boilers" defaultOpen={false}>
        <p>body</p>
      </Section>
    );
    expect(screen.queryByText('body')).toBeNull();
  });
});

describe('Reading', () => {
  it('renders changing figures in the mono face with tabular numerals', () => {
    // The system's own rule, which the machine screens did not follow: a value that
    // updates at 1 Hz through 99.9 -> 100.0 changes width in a proportional face and drags
    // the row with it.
    const { container } = render(<Reading label="Temperature" value="93.3" unit="°C" />);

    // Found by what it is rather than by where it sits. `Reading` delegates its number to
    // `Figure`, so a positional `querySelectorAll('span')[1]` asserted the old nesting as
    // much as the font -- and would have to be renumbered every time either component grew
    // a wrapper.
    const tabular = Array.from(container.querySelectorAll('span')).filter(
      (node) => node.style.fontVariantNumeric === 'tabular-nums'
    );

    // Exactly one, which is the delegation working: two would mean `Reading` had kept its
    // own copy of the treatment alongside `Figure`'s.
    expect(tabular).toHaveLength(1);

    // Quote-normalised: jsdom re-serialises the stack's `'SF Mono'` as `"SF Mono"`, so a
    // string equality here compares CSS serialisation rather than the font that was set.
    const normalise = (s: string) => s.replace(/["']/g, '');
    expect(normalise((tabular[0] as HTMLSpanElement).style.fontFamily)).toBe(
      normalise(tokens.font.mono)
    );
    expect(tabular[0]!.textContent).toBe('93.3');
  });

  it('does not put a colon in the label', () => {
    // 74 labels ended in one. Two columns already say which side is which.
    const { container } = render(<Reading label="Output" value="35.0" unit="%" />);
    expect(container.textContent).not.toContain(':');
  });
});

describe('Figure', () => {
  it('keeps the unit out of the number', () => {
    // `48.9 s` as one string right-aligns on the `s`, which puts the decimal points of a
    // column in different places and defeats the whole reason for tabular figures.
    const { container } = render(<Figure value="48.9" unit="s" />);
    const tabular = Array.from(container.querySelectorAll('span')).filter(
      (node) => node.style.fontVariantNumeric === 'tabular-nums'
    );
    expect(tabular).toHaveLength(1);
    expect(tabular[0]!.textContent).toBe('48.9');
  });

  it('greys an unconfirmed value and says something is outstanding', () => {
    // "Sent" is what a resolved request means; "set" is what the next status message means.
    const { container } = render(<Figure value="93.0" unit="°C" pending />);
    const tabular = container.querySelector('span[style*="tabular-nums"]') as HTMLSpanElement;
    expect(tabular.style.color).toBe(rgb(tokens.color.idle));
    expect(screen.getByRole('img', { name: /waiting for the machine/i })).toBeTruthy();
  });

  it('tells queued apart from pending', () => {
    // Nothing is in flight to wait for on an unreachable machine, so a spinner would be
    // saying something untrue. The word is the whole difference.
    render(<Figure value="1.20" unit="bar" queued />);
    expect(screen.getByText('queued')).toBeTruthy();
    expect(screen.queryByRole('img', { name: /waiting for the machine/i })).toBeNull();
  });

  it('is settled by default', () => {
    const { container } = render(<Figure value="20.0" unit="g" />);
    const tabular = container.querySelector('span[style*="tabular-nums"]') as HTMLSpanElement;
    expect(tabular.style.color).toBe(rgb(tokens.color.ink));
  });
});

describe('Stepper', () => {
  const setup = (props: Partial<Parameters<typeof Stepper>[0]> = {}) => {
    const onCommit = vi.fn();
    render(
      <Stepper label="Target temperature" value={93} step={0.5} decimals={1} onCommit={onCommit} {...props} />
    );
    return { onCommit, input: screen.getByLabelText('Target temperature') as HTMLInputElement };
  };

  it('does not send a command per keystroke', () => {
    // The bug this primitive exists to prevent: a field that sent on input would send four
    // commands on the way from 9 to 93, one of which sets the boiler to 9 degrees.
    const { onCommit, input } = setup();
    for (const value of ['9', '9.', '9.4', '94']) {
      fireEvent.input(input, { target: { value } });
    }
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.blur(input, { target: { value: '94' } });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(94);
  });

  it('commits on Enter, by way of blurring', () => {
    const { onCommit, input } = setup();
    fireEvent.input(input, { target: { value: '95' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input, { target: { value: '95' } });
    expect(onCommit).toHaveBeenCalledWith(95);
  });

  it('says nothing when the value has not changed', () => {
    // A boiler does not need to be told what it is already doing.
    const { onCommit, input } = setup();
    fireEvent.blur(input, { target: { value: '93.0' } });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('keeps the last good value rather than substituting zero', () => {
    // `parseFloat(x) || 0` on a setpoint turns a typo into a command that switches a boiler
    // off, with the field showing `0` as though that had been the intent.
    const { onCommit, input } = setup();
    fireEvent.blur(input, { target: { value: 'ninety' } });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('refuses an out-of-range entry rather than clamping it', () => {
    // A clamp shows a number you did not ask for as though you had.
    const { onCommit, input } = setup({ max: 125 });
    fireEvent.blur(input, { target: { value: '130' } });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('is never a number input', () => {
    // `type="number"` is rendered and parsed in the *browser's* locale, so `1.4` shows as
    // `1,4` beside a limit reading `100` and the same firmware value looks different on two
    // machines in the same kitchen.
    const { input } = setup();
    expect(input.getAttribute('type')).not.toBe('number');
    expect(input.inputMode).toBe('decimal');
  });

  it('steps by the step, without floating-point drift', () => {
    // 1.20 + 0.05 is 1.2500000000000002 in binary floating point, and a setpoint that gains
    // a digit per press is one nobody trusts.
    const onCommit = vi.fn();
    render(
      <Stepper label="Target pressure" value={1.2} step={0.05} decimals={2} onCommit={onCommit} />
    );
    fireEvent.click(screen.getByLabelText('Increase Target pressure'));
    expect(onCommit).toHaveBeenCalledWith(1.25);
  });

  it('answers the arrow keys, so it is usable without the buttons', () => {
    const { onCommit, input } = setup();
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onCommit).toHaveBeenCalledWith(93.5);
  });

  it('stops its buttons at the ends', () => {
    // The buttons clamp where a typed entry is refused: a button that walks past a limit and
    // then refuses itself is just a broken button.
    const onCommit = vi.fn();
    render(
      <Stepper label="Target" value={125} step={0.5} max={125} decimals={1} onCommit={onCommit} />
    );
    expect((screen.getByLabelText('Increase Target') as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows an unsettled value rather than a box to type in', () => {
    // A spinner inside an input reads as a stuck field, and there is nothing useful to type
    // until the machine has answered.
    render(
      <Stepper label="Target" value={93} step={0.5} decimals={1} onCommit={vi.fn()} pending />
    );
    expect(screen.queryByLabelText('Target')).toBeNull();
    expect(screen.getByRole('img', { name: /waiting for the machine/i })).toBeTruthy();
  });
});

describe('ListRow', () => {
  const row = (menu?: preact.ComponentChildren) =>
    render(
      <List columns="1fr auto" label="Shots">
        <ListRow title="Lever-like" subtitle="Hayb Chillwave" href="/s/abc" menu={menu} />
      </List>
    );

  it('makes the whole row a link', () => {
    const { container } = row();
    const link = container.querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/s/abc');
    expect(link.getAttribute('aria-label')).toBe('Lever-like');
  });

  it('does not nest the row actions inside the row link', () => {
    // A `<button>` inside an `<a>` is invalid HTML: browsers reparent it, and what a screen
    // reader announces stops matching what is on screen. This is the whole reason the link
    // is an overlay rather than a wrapper.
    const { container } = row(<button type="button">Delete</button>);
    const link = container.querySelector('a') as HTMLAnchorElement;
    expect(link.querySelector('button')).toBeNull();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeTruthy();
  });

  it('lifts the actions above the link so they can still be clicked', () => {
    // Without this the overlay swallows the click and the menu never opens.
    row(<button type="button">Delete</button>);
    const holder = screen.getByRole('button', { name: 'Delete' }).parentElement!;
    expect(holder.style.zIndex).toBe('1');
  });

  it('is a list to a screen reader', () => {
    row();
    expect(screen.getByRole('list', { name: 'Shots' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

describe('Meter', () => {
  it('reports its proportion rather than only drawing it', () => {
    render(<Meter value={0.18} label="Element duty" valueText="18 %" />);
    const meter = screen.getByRole('meter', { name: 'Element duty' });
    expect(meter.getAttribute('aria-valuenow')).toBe('18');
    expect(meter.getAttribute('aria-valuetext')).toBe('18 %');
  });

  it('does not draw past its ends', () => {
    // A duty cycle arriving as 1.02 is a rounding artefact, not a bar that overflows a card.
    render(<Meter value={1.02} label="Duty" />);
    expect(screen.getByRole('meter', { name: 'Duty' }).getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('EmptyState', () => {
  it('carries a next step when there is one', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No schedules configured"
        action={{ label: 'Add schedule', onClick }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add schedule' }));
    expect(onClick).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */

function ConfirmHarness({ onResult }: { onResult: (ok: boolean) => void }) {
  const { confirm } = useDialogs();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm({
          title: 'Delete the 06:30 schedule?',
          body: 'This cannot be undone.',
          confirmLabel: 'Delete',
          destructive: true,
        }).then(onResult);
      }}
    >
      Delete
    </button>
  );
}

describe('Dialog', () => {
  it('is announced as a dialog, named by its title', async () => {
    render(
      <DialogHost>
        <ConfirmHarness onResult={() => {}} />
      </DialogHost>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    // Named by the object, not by "Are you sure?".
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(
      document.getElementById(dialog.getAttribute('aria-labelledby')!)?.textContent
    ).toBe('Delete the 06:30 schedule?');
  });

  it('resolves true when confirmed and false when cancelled', async () => {
    const onResult = vi.fn();
    render(
      <DialogHost>
        <ConfirmHarness onResult={onResult} />
      </DialogHost>
    );

    // Both the opener and the dialog's confirm are labelled "Delete" -- deliberately, as
    // that is the whole point of naming the action rather than saying "OK". So the second
    // click is scoped to the dialog rather than to the document.
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));

    // And cancelling resolves false rather than leaving the promise hanging.
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const again = await screen.findByRole('dialog');
    fireEvent.click(within(again).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('cancels on Escape', async () => {
    const onResult = vi.fn();
    render(
      <DialogHost>
        <ConfirmHarness onResult={onResult} />
      </DialogHost>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('moves focus into the dialog when it opens', async () => {
    render(
      <DialogHost>
        <ConfirmHarness onResult={() => {}} />
      </DialogHost>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');

    // Whatever it landed on, it is inside the trap. Asserting the specific element would
    // lock in the footer's button order.
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('wraps Tab at the end of the dialog', async () => {
    render(
      <DialogHost>
        <ConfirmHarness onResult={() => {}} />
      </DialogHost>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');

    const stops = Array.from(dialog.querySelectorAll<HTMLElement>('button'));
    const last = stops[stops.length - 1]!;
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });

    await waitFor(() => expect(document.activeElement).toBe(stops[0]));
  });

  it('refuses to work without a host', () => {
    // A silent fallback to window.confirm would bring the native dialogs back wherever
    // someone forgets the provider -- in exactly the situation nobody tests.
    const Bare = () => {
      useDialogs();
      return null;
    };
    // Preact logs the thrown error; the assertion is that it throws at all.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(/DialogHost/);
    spy.mockRestore();
  });

  it('offers no cancel for a notification', async () => {
    // The 19 `alert()` sites: one way out, not two.
    const NotifyHarness = () => {
      const { notify } = useDialogs();
      const [done, setDone] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => void notify({ title: 'Routine name is required' }).then(() => setDone(true))}
          >
            Save
          </button>
          {done && <span>dismissed</span>}
        </>
      );
    };

    render(
      <DialogHost>
        <NotifyHarness />
      </DialogHost>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByRole('dialog');

    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(await screen.findByText('dismissed')).toBeTruthy();
  });
});
