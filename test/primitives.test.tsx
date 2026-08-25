import { fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'preact/hooks';
import { Alert } from '../src/ui/Alert';
import { Badge } from '../src/ui/Badge';
import { Button } from '../src/ui/Button';
import { DialogHost, useDialogs } from '../src/ui/Dialog';
import { EmptyState } from '../src/ui/EmptyState';
import { Field, TextInput } from '../src/ui/Field';
import { tokens } from '../src/tokens';

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
