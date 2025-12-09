import { Action, ActionPanel, Detail, Icon, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { SessionRecord, getTodayStats, loadHistory } from "./session-core";

function formatDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(mins: number) {
  return `${mins} min`;
}

export default function Command() {
  const [history, setHistory] = useState<SessionRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory().sort((a, b) => b.startedAt - a.startedAt));
  }, []);

  const today = useMemo(() => getTodayStats(history), [history]);

  return (
    <List
      searchBarPlaceholder="Search focus sessions..."
      navigationTitle="Focus History"
    >
      <List.Section
        title="Today"
        subtitle={`${today.sessions} sessions - ${today.minutes} min`}
      />

      {history.map((session) => (
        <List.Item
          key={session.id}
          title={session.description || "Focus session"}
          subtitle={`${formatDuration(session.actualDurationMinutes)} - ${formatDate(
            session.startedAt
          )}`}
          icon={Icon.Clock}
          actions={
            <ActionPanel>
              <Action.Push
                title="View Details"
                icon={Icon.Eye}
                target={<SessionDetail record={session} />}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function SessionDetail({ record }: { record: SessionRecord }) {
  const markdown = `# ${record.description || "Focus session"}

- Started: ${formatDate(record.startedAt)}
- Ended: ${formatDate(record.endedAt)}
- Planned: ${formatDuration(record.plannedDurationMinutes)}
- Actual: ${formatDuration(record.actualDurationMinutes)}
- Break schedule: ${record.breakScheduleMinutes.join(", ") || "none"}
`;

  return <Detail markdown={markdown} />;
}
