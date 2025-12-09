# Random Focus Session (Raycast)

Raycast extension for running timed focus sessions with randomized break prompts, a dedicated start form, and a history viewer.

## Inspiration

This extension is partly inspired by the [paper](https://pubmed.ncbi.nlm.nih.gov/32375031) “Replay of Learned Neural Firing Sequences during Rest in Human Motor Cortex” (Eichenlaub et al., 2020).
The study shows that after a period of focused activity, the brain replays task-related neural patterns during rest, a process believed to support consolidation and performance improvement.

Randomized micro-breaks in this extension draw from that idea: instead of fixed, predictable intervals (which the brain can quickly adapt to), unpredictable rest opportunities help interrupt anticipatory fatigue and create short off-task windows that may better support mental reset and retention.

## Commands

- `Random Focus Session` (menu bar): persistent status, start/stop control, random break prompts, and shortcut to history.
- `Start Focus Session`: form to start a session with a task description and per-session timing/break settings.
- `Focus History`: list past sessions with durations, break plans, and notes.

## How it works

1) Open `Start Focus Session`, enter what you will work on, adjust timings if needed, and submit.  
2) The menu bar item shows elapsed time and lets you stop early. Randomized breaks fire as HUD notifications with sound.  
3) Use `Focus History` (or the History entry in the menu bar) to review past sessions.

## Session defaults (override per session)

- Focus duration: 90 minutes
- No breaks at start: 20 minutes
- No breaks at end: 15 minutes
- Min break interval: 10 minutes
- Max break interval: 30 minutes

## Development

```bash
yarn install
ray dev
```

Key files: `src/random-focus-session.tsx` (menu bar), `src/start-focus-session.tsx` (start form), `src/focus-history.tsx` (history), `src/session-core.ts` (logic and storage).
