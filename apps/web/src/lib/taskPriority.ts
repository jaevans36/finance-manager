/**
 * Shared priority → colour mapping.
 *
 * A single 4-step ramp (destructive/warning/info/muted) used everywhere a task's
 * priority needs a visual signal, so "Critical" reads the same colour on the
 * Dashboard, Tasks list, and Eisenhower Matrix instead of drifting per screen.
 */
export interface PriorityStyle {
  /** Solid background — for stripes/dots */
  stripe: string;
  /** Text colour — for the uppercase priority label */
  text: string;
}

export const priorityStyles: Record<string, PriorityStyle> = {
  Critical: { stripe: 'bg-destructive', text: 'text-destructive' },
  High: { stripe: 'bg-warning', text: 'text-warning' },
  Medium: { stripe: 'bg-info', text: 'text-info' },
  Low: { stripe: 'bg-border', text: 'text-muted-foreground' },
};

export const getPriorityStyle = (priority: string): PriorityStyle =>
  priorityStyles[priority] ?? priorityStyles.Low;
