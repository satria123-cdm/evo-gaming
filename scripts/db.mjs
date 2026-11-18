#!/usr/bin/env node
/**
 * Portable PostgreSQL helper (no admin rights required).
 * Binaries + data live in %LOCALAPPDATA%\evo-gaming-tools.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const PORT = process.env.EVO_PG_PORT ?? "5433";
const toolsDir = path.join(
  process.env.LOCALAPPDATA ?? path.join(homedir(), "AppData", "Local"),
  "evo-gaming-tools",
);
const binDir = path.join(toolsDir, "pg", "bin");
const dataDir = path.join(toolsDir, "pgdata");
const logFile = path.join(dataDir, "server.log");

function isRunning() {
  const result = spawnSync(
    path.join(binDir, "psql.exe"),
    ["-h", "127.0.0.1", "-p", PORT, "-U", "postgres", "-d", "postgres", "-tAc", "select 1"],
    { encoding: "utf8" },
  );
  return result.status === 0 && result.stdout.trim() === "1";
}

function quotePowerShell(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Launches postgres without leaving a terminal window on screen.
 *
 * Windows Terminal is the default console host on this machine: `detached`
 * spawns give postgres its own visible window, and closing that window kills
 * the server. `Start-Process -WindowStyle Hidden` starts postgres with a
 * hidden console that is not tied to this script, so it survives the shell
 * that ran `npm run dev` exiting, while nothing appears on the desktop.
 */
function launchPostgres(exe, args) {
  if (process.platform === "win32") {
    const script = `Start-Process -FilePath ${quotePowerShell(exe)} -ArgumentList @(${args
      .map(quotePowerShell)
      .join(", ")}) -WindowStyle Hidden`;
    const result = spawnSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { encoding: "utf8", windowsHide: true },
    );
    if (result.status !== 0) {
      console.error(result.stderr?.trim() || "Gagal menjalankan Start-Process untuk PostgreSQL.");
      process.exit(1);
    }
    return;
  }

  const child = spawn(exe, args, { detached: true, stdio: "ignore" });
  child.unref();
}

function start() {
  if (!existsSync(path.join(binDir, "postgres.exe"))) {
    console.error(`PostgreSQL belum terpasang di ${binDir}.`);
    process.exit(1);
  }
  if (isRunning()) {
    console.log(`PostgreSQL sudah berjalan di port ${PORT}.`);
    return;
  }

  launchPostgres(path.join(binDir, "postgres.exe"), [
    "-D",
    dataDir,
    "-p",
    PORT,
    "-c",
    "listen_addresses=127.0.0.1",
  ]);

  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (isRunning()) {
      console.log(`PostgreSQL siap di 127.0.0.1:${PORT}.`);
      return;
    }
    spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 250)"]);
  }
  console.error(`PostgreSQL gagal start. Cek log: ${logFile}`);
  process.exit(1);
}

function stop() {
  if (!isRunning()) {
    console.log("PostgreSQL tidak berjalan.");
    return;
  }
  const result = spawnSync(
    path.join(binDir, "pg_ctl.exe"),
    ["-D", dataDir, "-m", "fast", "stop"],
    { encoding: "utf8" },
  );
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
}

const command = process.argv[2] ?? "ensure";
if (command === "start" || command === "ensure") start();
else if (command === "stop") stop();
else if (command === "status") console.log(isRunning() ? "running" : "stopped");
else {
  console.error("Usage: node scripts/db.mjs <start|stop|status|ensure>");
  process.exit(1);
}
