"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  emitButton,
  emitStick,
  PAD_STICK_RADIUS,
  type PadButton,
  type StickSide,
} from "@/lib/pad-input";

type StickOffset = { x: number; y: number };

const STICK_CENTERS: Record<StickSide, { x: number; y: number }> = {
  left: { x: 146, y: 174 },
  right: { x: 254, y: 174 },
};

const STICK_RADIUS = PAD_STICK_RADIUS;

const BODY_PATH =
  "M96 40 H304 C330 40 342 58 348 82 L372 168 C379 194 366 216 344 216 C326 216 314 200 304 184 L288 158 H112 L96 184 C86 200 74 216 56 216 C34 216 21 194 28 168 L52 82 C58 58 70 40 96 40 Z";

const FACE_BUTTONS = [
  { id: "triangle", cx: 290, cy: 112, color: "#34d399" },
  { id: "circle", cx: 310, cy: 132, color: "#fb7185" },
  { id: "cross", cx: 270, cy: 132, color: "#60a5fa" },
  { id: "square", cx: 290, cy: 152, color: "#f472b6" },
] as const;

const DPAD = [
  { id: "up", x: 100, y: 112, width: 14, height: 20, dx: 0, dy: -1.5 },
  { id: "down", x: 100, y: 137, width: 14, height: 15, dx: 0, dy: 1.5 },
  { id: "left", x: 87, y: 125, width: 20, height: 14, dx: -1.5, dy: 0 },
  { id: "right", x: 107, y: 125, width: 20, height: 14, dx: 1.5, dy: 0 },
] as const;

/**
 * Interactive black DualShock-style controller. Dragging an analog stick
 * moves its cap and snaps it back on release; face buttons, the D-pad, and
 * the PS button react while pressed. Stick and button input is mirrored to
 * `@/lib/pad-input` so the homepage mini game can use the pad.
 */
export function GamepadArt({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [sticks, setSticks] = useState<Record<StickSide, StickOffset>>({
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  });
  const [activeStick, setActiveStick] = useState<Record<StickSide, boolean>>({
    left: false,
    right: false,
  });
  const [pressed, setPressed] = useState<Record<string, boolean>>({});
  const [touchpadPressed, setTouchpadPressed] = useState(false);

  function pointInSvg(event: ReactPointerEvent<SVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function moveStick(side: StickSide, event: ReactPointerEvent<SVGGElement>) {
    const point = pointInSvg(event);
    if (!point) return;
    const center = STICK_CENTERS[side];
    let dx = point.x - center.x;
    let dy = point.y - center.y;
    const distance = Math.hypot(dx, dy);
    if (distance > STICK_RADIUS) {
      dx = (dx / distance) * STICK_RADIUS;
      dy = (dy / distance) * STICK_RADIUS;
    }
    setSticks((current) => ({ ...current, [side]: { x: dx, y: dy } }));
    emitStick(side, { x: dx, y: dy }, true);
  }

  function startStick(side: StickSide, event: ReactPointerEvent<SVGGElement>) {
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture is best-effort; dragging still works without it.
    }
    setActiveStick((current) => ({ ...current, [side]: true }));
    moveStick(side, event);
  }

  function endStick(side: StickSide, event: ReactPointerEvent<SVGGElement>) {
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Nothing captured; nothing to release.
    }
    setActiveStick((current) => ({ ...current, [side]: false }));
    setSticks((current) => ({ ...current, [side]: { x: 0, y: 0 } }));
    emitStick(side, { x: 0, y: 0 }, false);
  }

  function press(id: string) {
    setPressed((current) => ({ ...current, [id]: true }));
    emitButton(id as PadButton, "down");
  }

  function release(id: string) {
    setPressed((current) => ({ ...current, [id]: false }));
    emitButton(id as PadButton, "up");
  }

  function buttonProps(id: string) {
    return {
      role: "button" as const,
      "aria-label": `Tombol ${id}`,
      tabIndex: 0,
      onPointerDown: (event: ReactPointerEvent<SVGElement | SVGGElement>) => {
        event.preventDefault();
        press(id);
      },
      onPointerUp: () => release(id),
      onPointerLeave: () => release(id),
      onPointerCancel: () => release(id),
      onKeyDown: (event: React.KeyboardEvent<SVGElement | SVGGElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          press(id);
        }
      },
      onKeyUp: () => release(id),
      onBlur: () => release(id),
      style: { cursor: "pointer", touchAction: "none" as const },
    };
  }

  const anyPressed = Object.values(pressed).some(Boolean) || touchpadPressed;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 260"
      role="group"
      aria-label="Stik PS4 interaktif: geser stik analog dan tekan tombol"
      className={className}
    >
      <defs>
        <linearGradient id="evo-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="55%" stopColor="#101827" />
          <stop offset="100%" stopColor="#05070c" />
        </linearGradient>
        <linearGradient id="evo-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="55%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="evo-stick" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a3a5c" />
          <stop offset="100%" stopColor="#0a1120" />
        </linearGradient>
        <filter id="evo-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="evo-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* Ambient glow behind the pad */}
      <ellipse
        cx="200"
        cy="130"
        rx="170"
        ry="95"
        fill="url(#evo-rim)"
        opacity={anyPressed ? 0.28 : 0.16}
        filter="url(#evo-soft)"
        style={{ transition: "opacity 180ms ease" }}
      />

      {/* Cable */}
      <path
        d="M200 34 C200 18 186 12 176 20"
        fill="none"
        stroke="url(#evo-rim)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* Controller body */}
      <path
        d={BODY_PATH}
        fill="url(#evo-body)"
        stroke="url(#evo-rim)"
        strokeWidth="3"
      />

      {/* Touchpad */}
      <g
        role="button"
        aria-label="Touchpad"
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault();
          setTouchpadPressed(true);
          emitButton("touchpad", "down");
        }}
        onPointerUp={() => {
          setTouchpadPressed(false);
          emitButton("touchpad", "up");
        }}
        onPointerLeave={() => {
          setTouchpadPressed(false);
          emitButton("touchpad", "up");
        }}
        onPointerCancel={() => {
          setTouchpadPressed(false);
          emitButton("touchpad", "up");
        }}
        onBlur={() => {
          setTouchpadPressed(false);
          emitButton("touchpad", "up");
        }}
        style={{ cursor: "pointer", touchAction: "none" }}
      >
        <rect
          x="158"
          y="56"
          width="84"
          height="42"
          rx="9"
          fill={touchpadPressed ? "#10263a" : "#0a1424"}
          stroke="#22d3ee"
          strokeOpacity={touchpadPressed ? 0.9 : 0.45}
          strokeWidth="1.5"
          style={{ transition: "fill 140ms ease, stroke-opacity 140ms ease" }}
        />
        <line
          x1="170"
          y1="66"
          x2="230"
          y2="66"
          stroke="#22d3ee"
          strokeOpacity={touchpadPressed ? 0.8 : 0.25}
        />
      </g>

      {/* D-pad */}
      <g fill="#1a2942" stroke="#22d3ee" strokeOpacity="0.35">
        {DPAD.map((direction) => {
          const isDown = Boolean(pressed[direction.id]);
          return (
            <rect
              key={direction.id}
              x={direction.x}
              y={direction.y}
              width={direction.width}
              height={direction.height}
              rx="4"
              {...buttonProps(direction.id)}
              style={{
                cursor: "pointer",
                touchAction: "none",
                fill: isDown ? "#22d3ee" : "#1a2942",
                strokeOpacity: isDown ? 0.95 : 0.35,
                filter: isDown ? "url(#evo-glow)" : undefined,
                transform: `translate(${isDown ? direction.dx : 0}px, ${isDown ? direction.dy : 0}px)`,
                transition: "fill 100ms ease, transform 100ms ease",
              }}
            />
          );
        })}
      </g>

      {/* Face buttons */}
      <g strokeWidth="1.5" strokeOpacity="0.7">
        {FACE_BUTTONS.map((button) => {
          const isDown = Boolean(pressed[button.id]);
          return (
            <circle
              key={button.id}
              cx={button.cx}
              cy={button.cy}
              r={isDown ? 6.2 : 8}
              fill={button.color}
              stroke={isDown ? "#ffffff" : button.color}
              strokeOpacity={isDown ? 0.95 : 0.7}
              {...buttonProps(button.id)}
              style={{
                cursor: "pointer",
                touchAction: "none",
                filter: isDown ? "url(#evo-glow)" : undefined,
                transition: "r 110ms ease, filter 110ms ease",
              }}
            />
          );
        })}
      </g>

      {/* Analog sticks */}
      {(["left", "right"] as StickSide[]).map((side) => {
        const center = STICK_CENTERS[side];
        const offset = sticks[side];
        const active = activeStick[side];
        const accent = side === "left" ? "#22d3ee" : "#a78bfa";
        const highlight = side === "left" ? "#67e8f9" : "#c4b5fd";
        return (
          <g
            key={side}
            role="slider"
            aria-label={`Stik analog ${side === "left" ? "kiri" : "kanan"}`}
            aria-valuemin={0}
            aria-valuemax={STICK_RADIUS}
            aria-valuenow={Math.round(Math.hypot(offset.x, offset.y))}
            tabIndex={0}
            onPointerDown={(event) => startStick(side, event)}
            onPointerMove={(event) => {
              if (activeStick[side]) moveStick(side, event);
            }}
            onPointerUp={(event) => endStick(side, event)}
            onPointerCancel={(event) => endStick(side, event)}
            onLostPointerCapture={(event) => endStick(side, event)}
            style={{
              cursor: active ? "grabbing" : "grab",
              touchAction: "none",
            }}
          >
            <circle
              cx={center.x}
              cy={center.y}
              r="22"
              fill="url(#evo-stick)"
              stroke={accent}
              strokeOpacity={active ? 0.9 : 0.4}
              style={{ transition: "stroke-opacity 140ms ease" }}
            />
            <g
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                transition: active
                  ? "none"
                  : "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              <circle
                cx={center.x}
                cy={center.y}
                r="13"
                fill="#0b1424"
                stroke={accent}
                strokeOpacity="0.55"
              />
              <circle
                cx={center.x - 4}
                cy={center.y - 5}
                r="3.5"
                fill={highlight}
                opacity="0.6"
              />
            </g>
          </g>
        );
      })}

      {/* PS button */}
      <g filter="url(#evo-glow)" {...buttonProps("ps")}>
        <circle
          cx="200"
          cy="128"
          r={pressed.ps ? 7 : 9}
          fill={pressed.ps ? "#123047" : "#0b1424"}
          stroke="url(#evo-rim)"
          strokeWidth="1.5"
          style={{ transition: "r 110ms ease, fill 110ms ease" }}
        />
        <path
          d="M197 123 v10 h5 a3 3 0 0 0 0 -6 h-3"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>

      {/* Small option buttons */}
      <rect x="170" y="112" width="9" height="5" rx="2.5" fill="#334155" />
      <rect x="221" y="112" width="9" height="5" rx="2.5" fill="#334155" />

      {/* Light bar accent */}
      <path
        d="M150 44 H250"
        stroke="url(#evo-rim)"
        strokeWidth={anyPressed ? 7 : 5}
        strokeLinecap="round"
        filter="url(#evo-glow)"
        opacity={anyPressed ? 1 : 0.9}
        style={{ transition: "stroke-width 140ms ease, opacity 140ms ease" }}
      />
    </svg>
  );
}
