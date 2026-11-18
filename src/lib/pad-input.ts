/**
 * Tiny pub/sub bridge between the interactive controller art and anything that
 * wants to react to it (the homepage mini game). The controller writes stick
 * offsets and button presses here; consumers subscribe or read the latest
 * stick state straight from `padSticks` inside a requestAnimationFrame loop.
 */

export type StickSide = "left" | "right";
export type PadStickOffset = { x: number; y: number };
export type PadButton =
  | "triangle"
  | "circle"
  | "cross"
  | "square"
  | "up"
  | "down"
  | "left"
  | "right"
  | "ps"
  | "touchpad";

export const PAD_STICK_RADIUS = 9;

type StickListener = (
  side: StickSide,
  offset: PadStickOffset,
  active: boolean,
) => void;
type ButtonListener = (button: PadButton, phase: "down" | "up") => void;

const stickListeners = new Set<StickListener>();
const buttonListeners = new Set<ButtonListener>();

/** Latest stick offsets, safe to read every animation frame. */
export const padSticks: Record<StickSide, PadStickOffset> = {
  left: { x: 0, y: 0 },
  right: { x: 0, y: 0 },
};

export function emitStick(
  side: StickSide,
  offset: PadStickOffset,
  active: boolean,
) {
  padSticks[side] = offset;
  for (const listener of stickListeners) listener(side, offset, active);
}

export function emitButton(button: PadButton, phase: "down" | "up") {
  for (const listener of buttonListeners) listener(button, phase);
}

/** Subscribe to controller input. Returns the unsubscribe function. */
export function subscribePad({
  onStick,
  onButton,
}: {
  onStick?: StickListener;
  onButton?: ButtonListener;
}) {
  if (onStick) stickListeners.add(onStick);
  if (onButton) buttonListeners.add(onButton);

  return () => {
    if (onStick) stickListeners.delete(onStick);
    if (onButton) buttonListeners.delete(onButton);
  };
}
