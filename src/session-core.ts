import { Cache, showHUD } from "@raycast/api";
import { exec } from "child_process";

export const DEFAULT_CONFIG = {
  focusDurationMin: 90,
  noBreakAtStartMin: 20,
  noBreakAtEndMin: 15,
  minBreakIntervalMin: 10,
  maxBreakIntervalMin: 30,
} as const;

export type SessionConfigInput = Partial<
  Record<
    | "focusDurationMin"
    | "noBreakAtStartMin"
    | "noBreakAtEndMin"
    | "minBreakIntervalMin"
    | "maxBreakIntervalMin",
    number | string
  >
>;

function parseNumberInput(
  value: string | number | undefined,
  fallback: number,
  min: number
): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.floor(n));
}

function normalizeConfig(config?: SessionConfigInput) {
  const focusDurationMin = parseNumberInput(
    config?.focusDurationMin,
    DEFAULT_CONFIG.focusDurationMin,
    1
  );

  const minBreakIntervalMin = parseNumberInput(
    config?.minBreakIntervalMin,
    DEFAULT_CONFIG.minBreakIntervalMin,
    1
  );

  const maxBreakIntervalMin = Math.max(
    minBreakIntervalMin,
    parseNumberInput(
      config?.maxBreakIntervalMin,
      DEFAULT_CONFIG.maxBreakIntervalMin,
      1
    )
  );

  return {
    focusDurationMin,
    noBreakAtStartMin: parseNumberInput(
      config?.noBreakAtStartMin,
      DEFAULT_CONFIG.noBreakAtStartMin,
      0
    ),
    noBreakAtEndMin: parseNumberInput(
      config?.noBreakAtEndMin,
      DEFAULT_CONFIG.noBreakAtEndMin,
      0
    ),
    minBreakIntervalMin,
    maxBreakIntervalMin,
  };
}

const cache = new Cache();
const SESSION_KEY = "random-focus-session-state";
const HISTORY_KEY = "random-focus-session-history";

export type SessionState = {
  active: boolean;
  startedAt: number;
  focusDurationMinutes: number;
  breakScheduleMinutes: number[];
  triggeredBreakMinutes: number[];
  description: string;
  usedSounds?: string[];
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  breakScheduleMinutes: number[];
  description: string;
};

export function loadSession(): SessionState | null {
  const raw = cache.get(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    return {
      ...parsed,
      description: parsed.description ?? "",
      usedSounds: parsed.usedSounds ?? [],
    };
  } catch {
    return null;
  }
}

export function saveSession(state: SessionState | null) {
  if (!state) {
    cache.remove(SESSION_KEY);
  } else {
    cache.set(SESSION_KEY, JSON.stringify(state));
  }
}

export function loadHistory(): SessionRecord[] {
  const raw = cache.get(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SessionRecord[];
    return parsed.map((r) => ({
      ...r,
      description: r.description ?? "",
    }));
  } catch {
    return [];
  }
}

function saveHistory(history: SessionRecord[]) {
  cache.set(HISTORY_KEY, JSON.stringify(history));
}

function appendHistory(record: SessionRecord) {
  const history = loadHistory();
  history.push(record);
  saveHistory(history);
}

function logDev(message: string, payload?: unknown) {
  console.log(`[DEV] ${message}`, payload ?? "");
}

function randomInt(min: number, max: number): number {
  // inclusive
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBreakSchedule(
  focusDuration: number,
  noBreakAtStart: number,
  noBreakAtEnd: number,
  minInterval: number,
  maxInterval: number
): number[] {
  const start = noBreakAtStart;
  const end = focusDuration - noBreakAtEnd;

  if (start >= end) {
    return [];
  }

  const breaks: number[] = [];
  let current = start;

  while (current + minInterval <= end) {
    const maxDelta = Math.min(maxInterval, end - current);
    if (maxDelta < minInterval) break;

    const delta = randomInt(minInterval, maxDelta);
    current = current + delta;

    if (current <= end) {
      breaks.push(current);
    } else {
      break;
    }
  }

  return breaks;
}

export function nowMs() {
  return Date.now();
}

export function diffMinutes(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / 60000);
}

function mkId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getTodayStats(history: SessionRecord[]) {
  if (history.length === 0) {
    return { sessions: 0, minutes: 0 };
  }
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  let sessions = 0;
  let minutes = 0;

  for (const r of history) {
    const d = new Date(r.startedAt);
    const dStr = d.toISOString().slice(0, 10);
    if (dStr === todayStr) {
      sessions += 1;
      minutes += r.actualDurationMinutes;
    }
  }
  return { sessions, minutes };
}

const SOUND_FILES = [
  "/System/Library/Sounds/Ping.aiff",
  "/System/Library/Sounds/Pop.aiff",
  "/System/Library/Sounds/Submarine.aiff",
  "/System/Library/Sounds/Hero.aiff",
  "/System/Library/Sounds/Sosumi.aiff",
];
const END_SOUND = "/System/Library/Sounds/Glass.aiff";

function playSound(filePath: string) {
  exec(`afplay "${filePath}"`);
}

function pickRandomUniqueSound(allSounds: string[], used: string[]) {
  const available = allSounds.filter((s) => !used.includes(s));
  if (available.length === 0) {
    return null;
  }
  return available[Math.floor(Math.random() * available.length)];
}

export async function startNewSession(
  description: string,
  configInput?: SessionConfigInput
) {
  const config = normalizeConfig(configInput);

  const startedAt = nowMs();
  const breakSchedule = generateBreakSchedule(
    config.focusDurationMin,
    config.noBreakAtStartMin,
    config.noBreakAtEndMin,
    config.minBreakIntervalMin,
    config.maxBreakIntervalMin
  );

  const state: SessionState = {
    active: true,
    startedAt,
    focusDurationMinutes: config.focusDurationMin,
    breakScheduleMinutes: breakSchedule,
    triggeredBreakMinutes: [],
    description: description?.trim() ?? "",
    usedSounds: [],
  };

  logDev("Generated break schedule", {
    focusDuration: config.focusDurationMin,
    schedule: breakSchedule,
    description: state.description,
  });

  saveSession(state);
  await showHUD(`Focus session started (${config.focusDurationMin} min)`);
}

export async function stopSessionEarly(state: SessionState) {
  const endedAt = nowMs();
  const actualMinutes = diffMinutes(state.startedAt, endedAt);

  const record: SessionRecord = {
    id: mkId(),
    startedAt: state.startedAt,
    endedAt,
    plannedDurationMinutes: state.focusDurationMinutes,
    actualDurationMinutes: Math.max(actualMinutes, 0),
    breakScheduleMinutes: state.breakScheduleMinutes,
    description: state.description,
  };

  appendHistory(record);
  saveSession(null);
  playSound(END_SOUND);
  await showHUD("Focus session stopped");
}

export async function completeSession(state: SessionState, now: number) {
  const endedAt = now;
  const actualMinutes = diffMinutes(state.startedAt, endedAt);

  const record: SessionRecord = {
    id: mkId(),
    startedAt: state.startedAt,
    endedAt,
    plannedDurationMinutes: state.focusDurationMinutes,
    actualDurationMinutes: Math.max(actualMinutes, 0),
    breakScheduleMinutes: state.breakScheduleMinutes,
    description: state.description,
  };

  appendHistory(record);
  saveSession({ ...state, active: false });
  playSound(END_SOUND);
  await showHUD("Focus session complete! Take a real break");
}

/**
 * Check whether new breaks should fire and persist any updates.
 */
export async function maybeTriggerBreaks(
  state: SessionState,
  elapsedMinutes: number
): Promise<SessionState> {
  const { breakScheduleMinutes, triggeredBreakMinutes } = state;

  const triggeredSet = new Set(triggeredBreakMinutes);
  const newlyDue = breakScheduleMinutes.filter(
    (m) => m <= elapsedMinutes && !triggeredSet.has(m)
  );

  if (newlyDue.length === 0) {
    return state;
  }

  const usedSounds = state.usedSounds || [];
  const soundFile = pickRandomUniqueSound(SOUND_FILES, usedSounds);

  if (soundFile) {
    playSound(soundFile);
    usedSounds.push(soundFile);
  }

  await showHUD(`Break opportunity - you've focused ${elapsedMinutes} min`);

  const updated = {
    ...state,
    triggeredBreakMinutes: [...triggeredBreakMinutes, ...newlyDue],
    usedSounds,
  };

  saveSession(updated);
  return updated;
}
