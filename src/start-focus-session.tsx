import {
  Action,
  ActionPanel,
  Form,
  Toast,
  showToast,
} from "@raycast/api";
import {
  DEFAULT_CONFIG,
  startNewSession,
  loadSession,
} from "./session-core";

type FormValues = {
  description: string;
  focusDurationMin: string;
  noBreakAtStartMin: string;
  noBreakAtEndMin: string;
  minBreakIntervalMin: string;
  maxBreakIntervalMin: string;
};

export default function Command() {
  const onSubmit = async (values: FormValues) => {
    const current = loadSession();
    if (current?.active) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Session already running",
        message: "Stop the current session first from the menu bar.",
      });
      return;
    }

    await startNewSession(values.description || "", {
      focusDurationMin: values.focusDurationMin,
      noBreakAtStartMin: values.noBreakAtStartMin,
      noBreakAtEndMin: values.noBreakAtEndMin,
      minBreakIntervalMin: values.minBreakIntervalMin,
      maxBreakIntervalMin: values.maxBreakIntervalMin,
    });
    await showToast({
      style: Toast.Style.Success,
      title: "Focus session started",
      message: values.description || undefined,
    });
  };

  return (
    <Form
      navigationTitle="Start Focus Session"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Start Session" onSubmit={onSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="description"
        title="What will you focus on?"
        placeholder="Write the task or goal for this session"
        autoFocus
      />
      <Form.TextField
        id="focusDurationMin"
        title="Focus Duration (minutes)"
        defaultValue={String(DEFAULT_CONFIG.focusDurationMin)}
      />
      <Form.TextField
        id="noBreakAtStartMin"
        title="No Break At Start (minutes)"
        defaultValue={String(DEFAULT_CONFIG.noBreakAtStartMin)}
      />
      <Form.TextField
        id="noBreakAtEndMin"
        title="No Break At End (minutes)"
        defaultValue={String(DEFAULT_CONFIG.noBreakAtEndMin)}
      />
      <Form.TextField
        id="minBreakIntervalMin"
        title="Min Break Interval (minutes)"
        defaultValue={String(DEFAULT_CONFIG.minBreakIntervalMin)}
      />
      <Form.TextField
        id="maxBreakIntervalMin"
        title="Max Break Interval (minutes)"
        defaultValue={String(DEFAULT_CONFIG.maxBreakIntervalMin)}
      />
    </Form>
  );
}
