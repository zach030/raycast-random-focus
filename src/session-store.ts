// src/session-store.ts
import { Cache } from "@raycast/api";

const cache = new Cache();

export const SESSION_KEY = "random-focus-session-state";
export const HISTORY_KEY = "random-focus-session-history";

export type SessionState = {
  active: boolean;
  startedAt: number;
  focusDurationMinutes: number;
  breakScheduleMinutes: number[];
  triggeredBreakMinutes: number[];
  usedSounds?: string[];
  description?: string;
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  breakScheduleMinutes: number[];
  description?: string;
};

export function loadSession(): SessionState | null {
  const raw = cache.get(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
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
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export function saveHistory(history: SessionRecord[]) {
  cache.set(HISTORY_KEY, JSON.stringify(history));
}

export function appendHistory(record: SessionRecord) {
  const history = loadHistory();
  history.push(record);
  saveHistory(history);
}

export function nowMs() {
  return Date.now();
}

export function diffMinutes(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / 60000);
}

export function mkId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getTodayStats(history: SessionRecord[]) {
  if (history.length === 0) return { sessions: 0, minutes: 0 };
  const todayStr = new Date().toISOString().slice(0, 10);

  let sessions = 0;
  let minutes = 0;
  for (const r of history) {
    const dStr = new Date(r.startedAt).toISOString().slice(0, 10);
    if (dStr === todayStr) {
      sessions++;
      minutes += r.actualDurationMinutes;
    }
  }
  return { sessions, minutes };
}
