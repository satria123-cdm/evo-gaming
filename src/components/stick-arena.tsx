"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getBestScore,
  saveBestScore,
  subscribeBestScore,
} from "@/lib/arcade-best";
import { PAD_STICK_RADIUS, padSticks, subscribePad } from "@/lib/pad-input";

const ROUND_SECONDS = 40;
const MAX_LIVES = 3;
const PADDLE_HALF = 11;
const CATCH_Y = 86;

type ItemKind = "disc" | "bomb";
type Item = { id: number; x: number; y: number; kind: ItemKind; speed: number };
type Status = "idle" | "playing" | "over";

type World = {
  paddle: number;
  items: Item[];
  score: number;
  lives: number;
  timeLeft: number;
  spawnIn: number;
  nextId: number;
};

function freshWorld(): World {
  return {
    paddle: 50,
    items: [],
    score: 0,
    lives: MAX_LIVES,
    timeLeft: ROUND_SECONDS,
    spawnIn: 0.45,
    nextId: 1,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * EVO Catch: a small canvas-free arcade game driven by the analog stick above
 * it. The left stick (or the arrow keys) slides the paddle; catch glowing
 * discs, dodge bombs. Best score is kept in localStorage.
 */
export function StickArena() {
  const [status, setStatus] = useState<Status>("idle");
  const [world, setWorld] = useState<World>(freshWorld);
  const best = useSyncExternalStore(subscribeBestScore, getBestScore, () => 0);
  const [finalScore, setFinalScore] = useState(0);

  const statusRef = useRef<Status>("idle");
  const worldRef = useRef<World>(world);
  const keyboardRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const startGame = useCallback(() => {
    const next = freshWorld();
    worldRef.current = next;
    setWorld(next);
    setFinalScore(0);
    setStatus("playing");
  }, []);

  const finishGame = useCallback((score: number) => {
    setFinalScore(score);
    setStatus("over");
    saveBestScore(score);
  }, []);

  // Start or restart from the controller: ✕ or the PS button.
  useEffect(
    () =>
      subscribePad({
        onButton: (button, phase) => {
          if (
            phase === "down" &&
            (button === "cross" || button === "ps") &&
            statusRef.current !== "playing"
          ) {
            startGame();
          }
        },
      }),
    [startGame],
  );

  // Game loop: paddle tracking, spawning, collisions, and the round timer.
  useEffect(() => {
    if (status !== "playing") return;

    let raf = 0;
    let last = performance.now();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        keyboardRef.current = event.key === "ArrowLeft" ? -1 : 1;
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        keyboardRef.current = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const tick = (now: number) => {
      const delta = Math.min(0.06, (now - last) / 1000);
      last = now;
      const state = worldRef.current;

      // Analog stick plus arrow keys, smoothed so the paddle eases around.
      const steer = clamp(
        padSticks.left.x / PAD_STICK_RADIUS + keyboardRef.current,
        -1,
        1,
      );
      const target = 50 + steer * (50 - PADDLE_HALF);
      state.paddle += (target - state.paddle) * Math.min(1, delta * 18);
      state.paddle = clamp(state.paddle, PADDLE_HALF, 100 - PADDLE_HALF);

      const elapsed = ROUND_SECONDS - state.timeLeft;
      state.spawnIn -= delta;
      if (state.spawnIn <= 0) {
        const bombChance = Math.min(0.46, 0.16 + (elapsed / ROUND_SECONDS) * 0.3);
        state.items.push({
          id: state.nextId,
          x: 8 + Math.random() * 84,
          y: -6,
          kind: Math.random() < bombChance ? "bomb" : "disc",
          speed: 30 + Math.random() * 16 + elapsed * 0.8,
        });
        state.nextId += 1;
        state.spawnIn = Math.max(0.42, 0.92 - elapsed * 0.011);
      }

      const kept: Item[] = [];
      for (const item of state.items) {
        item.y += item.speed * delta;
        const inCatchBand = item.y >= CATCH_Y - 4 && item.y <= CATCH_Y + 7;
        if (inCatchBand && Math.abs(item.x - state.paddle) <= PADDLE_HALF + 1.5) {
          if (item.kind === "disc") {
            state.score += 10;
          } else {
            state.lives = Math.max(0, state.lives - 1);
            state.score = Math.max(0, state.score - 10);
          }
          continue;
        }
        if (item.y > 108) continue;
        kept.push(item);
      }
      state.items = kept;
      state.timeLeft = Math.max(0, state.timeLeft - delta);

      setWorld({ ...state, items: [...kept] });

      if (state.lives <= 0 || state.timeLeft <= 0) {
        finishGame(state.score);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      keyboardRef.current = 0;
    };
  }, [status, finishGame]);

  const playing = status === "playing";
  const seconds = Math.ceil(world.timeLeft);

  return (
    <div className="relative" role="group" aria-labelledby="evo-arcade-title">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-2">
            Mini game
          </p>
          <h2 id="evo-arcade-title" className="font-display text-base font-bold leading-tight">
            EVO Catch
          </h2>
        </div>
        <dl className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
          <div className="rounded-md border border-line/70 bg-night/60 px-2 py-1">
            <dt className="sr-only">Skor</dt>
            <dd className="text-accent">{world.score}</dd>
          </div>
          <div className="rounded-md border border-line/70 bg-night/60 px-2 py-1">
            <dt className="sr-only">Nyawa</dt>
            <dd className="text-rose-300">{world.lives > 0 ? "♥".repeat(world.lives) : "–"}</dd>
          </div>
          <div className="rounded-md border border-line/70 bg-night/60 px-2 py-1">
            <dt className="sr-only">Waktu</dt>
            <dd className="text-slate-200">{seconds}s</dd>
          </div>
          <div className="rounded-md border border-line/70 bg-night/60 px-2 py-1">
            <dt className="sr-only">Terbaik</dt>
            <dd className="text-slate-400">{best}</dd>
          </div>
        </dl>
      </div>

      <div
        className="relative mt-3 h-48 select-none overflow-hidden rounded-xl border border-line/70 bg-[#070d17] sm:h-52"
        role="group"
        aria-label="Lapangan mini game EVO Catch"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.12) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_60%_at_50%_0%,rgba(34,211,238,0.18),transparent_70%)]"
        />

        {world.items.map((item) => (
          <span
            key={item.id}
            aria-hidden="true"
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${
              item.kind === "disc"
                ? "h-6 w-6 border-cyan-100/70 shadow-[0_0_16px_rgba(34,211,238,0.75)]"
                : "h-5 w-5 border-rose-200/60 shadow-[0_0_16px_rgba(244,63,94,0.7)]"
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              background:
                item.kind === "disc"
                  ? "radial-gradient(circle at 34% 28%, #ecfeff, #22d3ee 48%, #0369a1 100%)"
                  : "radial-gradient(circle at 34% 28%, #ffe4e6, #f43f5e 48%, #881337 100%)",
            }}
          />
        ))}

        <span
          aria-hidden="true"
          className="absolute h-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${world.paddle}%`,
            top: "88%",
            width: `${PADDLE_HALF * 2}%`,
            background:
              "linear-gradient(90deg, rgba(34,211,238,0.25), #67e8f9 22%, #ffffff 50%, #c4b5fd 78%, rgba(167,139,250,0.25))",
            boxShadow: "0 0 22px rgba(34,211,238,0.75)",
          }}
        />

        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-night/85 px-4 text-center backdrop-blur-[2px]">
            <p className="font-display text-base font-bold text-white">
              {status === "over" ? "Selesai!" : "Tangkap disc, hindari bom"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-300">
              {status === "over"
                ? `Skor ${finalScore} • Terbaik ${best}`
                : `${ROUND_SECONDS} detik • ${MAX_LIVES} nyawa • stik kiri menggerakkan paddle`}
            </p>
            <button
              type="button"
              onClick={startGame}
              className="btn-primary mt-2 px-5 py-2 text-xs"
            >
              {status === "over" ? "Main lagi" : "Mulai main"}
            </button>
          </div>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "over"
          ? `Permainan selesai. Skor ${finalScore}. Rekor terbaik ${best}.`
          : status === "idle"
            ? "Mini game siap dimainkan. Pilih mulai main."
            : ""}
      </p>
    </div>
  );
}
