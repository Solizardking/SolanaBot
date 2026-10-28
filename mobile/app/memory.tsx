import { useCallback, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import {
  api,
  type Memory,
  memoryText,
  type Workspace,
} from "../src/api";
import { card, colors, input, muted, Problem, Screen, Section, useAction } from "../src/ui";
import { useLoad } from "../src/use-load";

export default function Memories() {
  const load = useCallback(
    async () => ({
      state: await api<{ memories: Memory[] }>("/api/state"),
      workspace: await api<Workspace>("/api/workspace").catch(() => null),
    }),
    [],
  );
  const { data, error, pending, refresh } = useLoad(load);
  const [draft, setDraft] = useState("");
  const action = useAction();
  const dots = data?.workspace?.dots ?? [];
  return (
    <Screen refreshing={pending} onRefresh={() => void refresh()}>
      <Problem message={error ?? action.error} />
      <Section title="Saved memories">
        <TextInput
          style={input}
          placeholder="Something your Dots should remember"
          placeholderTextColor={colors.muted}
          value={draft}
          onChangeText={setDraft}
          maxLength={2000}
        />
        <Button
          color={colors.link}
          disabled={!draft.trim() || Boolean(action.busy)}
          title="Save memory"
          onPress={() =>
            void action.run("save", async () => {
              await api("/api/memories", { method: "POST", body: { text: draft.trim() } });
              setDraft("");
              await refresh();
            })
          }
        />
        {(data?.state.memories ?? []).map((memory) => (
          <View key={memory.id} style={card}>
            <Text style={{ color: colors.foreground }}>{memory.text}</Text>
            <Button
              color={colors.error}
              disabled={Boolean(action.busy)}
              title="Forget"
              onPress={() =>
                void action.run(memory.id, async () => {
                  await api(`/api/memories/${encodeURIComponent(memory.id)}`, { method: "DELETE" });
                  await refresh();
                })
              }
            />
          </View>
        ))}
        {data && !data.state.memories.length ? <Text style={muted}>No saved memories yet.</Text> : null}
      </Section>
      {dots.map((dot) => {
        const status = data?.workspace?.dotMemory.find((m) => m.dotId === dot.id);
        return (
          <Section key={dot.id} title={`${dot.name} memory`}>
            <Text style={muted}>
              {status?.configured
                ? `${status.provider ?? "Memory"} connected${status.enabled ? "" : " (off for this Dot)"}`
                : "Dot memory is not connected on the server."}
            </Text>
            {(status?.memories ?? []).map((entry, index) => {
              const text = memoryText(entry);
              return text ? (
                <Text key={`${dot.id}-${index}`} style={[card, { color: colors.foreground }]}>
                  {text}
                </Text>
              ) : null;
            })}
          </Section>
        );
      })}
    </Screen>
  );
}
