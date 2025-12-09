import { Icon, MenuBarExtra, LaunchType, launchCommand } from "@raycast/api";
import {
  DEFAULT_CONFIG,
  completeSession,
  diffMinutes,
  getTodayStats,
  loadHistory,
  loadSession,
  maybeTriggerBreaks,
  nowMs,
  stopSessionEarly,
} from "./session-core";

export default function Command() {
  let state = loadSession();
  const history = loadHistory();

  const now = nowMs();

  if (state?.active) {
    const elapsed = diffMinutes(state.startedAt, now);

    if (elapsed >= state.focusDurationMinutes) {
      completeSession(state, now);
      state = { ...state, active: false };
    } else {
      maybeTriggerBreaks(state, elapsed).then((updated) => {
        state = updated;
      });
    }
  }

  const isActive = !!state?.active;
  const elapsedMinutes = state?.active
    ? Math.min(diffMinutes(state.startedAt, now), state.focusDurationMinutes)
    : 0;

  const { sessions: todaySessions, minutes: todayMinutes } =
    getTodayStats(history);

  const menubarTitle = isActive ? `* ${elapsedMinutes}m` : "Idle";

  const tooltip = isActive
    ? `Random focus session - ${elapsedMinutes}/${state?.focusDurationMinutes} min`
    : "Random focus session (not running)";

  return (
    <MenuBarExtra icon={Icon.Bolt} title={menubarTitle} tooltip={tooltip}>
      <MenuBarExtra.Section title="Session">
        {isActive ? (
          <MenuBarExtra.Item
            title="Stop Session"
            icon={Icon.Stop}
            onAction={async () => {
              const current = loadSession();
              if (current?.active) {
                await stopSessionEarly(current);
              }
            }}
          />
        ) : (
          <MenuBarExtra.Item
            title={`Start ${DEFAULT_CONFIG.focusDurationMin}-minute Session`}
            icon={Icon.Play}
            onAction={async () => {
              await launchCommand({
                name: "start-focus-session",
                type: LaunchType.UserInitiated,
              });
            }}
          />
        )}

        {isActive && (
          <>
            <MenuBarExtra.Item
              title={`Focused: ${elapsedMinutes}/${state?.focusDurationMinutes} min`}
              icon={Icon.Clock}
            />
            {state?.description && (
              <MenuBarExtra.Item
                title={`Task: ${state.description}`}
                icon={Icon.Bubble}
              />
            )}
          </>
        )}
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="Today">
        <MenuBarExtra.Item title={`Sessions: ${todaySessions}`} icon={Icon.Dot} />
        <MenuBarExtra.Item
          title={`Total focus: ${todayMinutes} min`}
          icon={Icon.BarChart}
        />
      </MenuBarExtra.Section>

      <MenuBarExtra.Section title="History">
        <MenuBarExtra.Item
          title="Open Focus History"
          icon={Icon.List}
          onAction={async () => {
            await launchCommand({
              name: "focus-history",
              type: LaunchType.UserInitiated,
            });
          }}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
