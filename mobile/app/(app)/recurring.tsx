import {
  previewRecurrenceDates,
  recurrenceScheduleFields,
  RECURRENCE_FREQUENCY_LABELS,
  type RecurrenceFrequency,
  type RecurringTransaction,
  type UpcomingRecurringOccurrence,
} from "@wealth-stack/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { api } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { colors } from "../../src/theme/colors";
import { common } from "../../src/theme/styles";

const FREQUENCIES = Object.keys(
  RECURRENCE_FREQUENCY_LABELS,
) as RecurrenceFrequency[];

function startDateInputValue(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function RecurringScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.listAccounts(),
  });

  const rulesQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: () => api.listRecurringTransactions(),
  });

  const upcomingQuery = useQuery({
    queryKey: ["recurring-upcoming"],
    queryFn: () => api.upcomingRecurringTransactions({ limit: 20 }),
  });

  const accounts = accountsQuery.data ?? [];
  const rules = rulesQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  const schedulePreview = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return [];
    try {
      return previewRecurrenceDates({ startDate, frequency, count: 5 });
    } catch {
      return [];
    }
  }, [startDate, frequency]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const resolvedAccountId = accountId || accounts[0]?.id;
      if (!resolvedAccountId) throw new Error("Create an account on the dashboard first");
      if (!amount.trim()) throw new Error("Amount is required");
      const n = Number(amount.trim());
      if (Number.isNaN(n) || n <= 0) throw new Error("Enter a positive amount");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
        throw new Error("Start date must be YYYY-MM-DD");
      }

      const schedule = recurrenceScheduleFields(startDate, frequency);
      const payload = {
        account_id: resolvedAccountId,
        amount: amount.trim(),
        transaction_type: type,
        frequency,
        start_date: startDate,
        note: note.trim() || undefined,
        ...schedule,
      };

      if (editing) {
        return api.patchRecurringTransaction(editing.id, payload);
      }

      return api.createRecurringTransaction(payload);
    },
    onSuccess: async () => {
      setShowForm(false);
      setEditing(null);
      setAmount("");
      setNote("");
      setType("expense");
      setFrequency("monthly");
      setStartDate(todayIsoDate());
      await queryClient.invalidateQueries({ queryKey: ["recurring"] });
      await queryClient.invalidateQueries({ queryKey: ["recurring-upcoming"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (rule: RecurringTransaction) => {
      if (rule.paused) {
        return api.resumeRecurringTransaction(rule.id);
      }
      return api.pauseRecurringTransaction(rule.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recurring"] });
      await queryClient.invalidateQueries({ queryKey: ["recurring-upcoming"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRecurringTransaction(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recurring"] });
      await queryClient.invalidateQueries({ queryKey: ["recurring-upcoming"] });
    },
  });

  function openCreate() {
    setEditing(null);
    setAccountId(accounts[0]?.id ?? "");
    setAmount("");
    setType("expense");
    setFrequency("monthly");
    setStartDate(todayIsoDate());
    setNote("");
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(rule: RecurringTransaction) {
    setEditing(rule);
    setAccountId(rule.account_id);
    setAmount(rule.amount);
    setType(rule.transaction_type);
    setFrequency(rule.frequency);
    setStartDate(startDateInputValue(rule.start_date));
    setNote(rule.note ?? "");
    setFormError(null);
    setShowForm(true);
  }

  function confirmDelete(rule: RecurringTransaction) {
    Alert.alert(
      "Delete recurring rule?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteMutation.mutateAsync(rule.id),
        },
      ],
    );
  }

  async function handleSubmit() {
    setFormError(null);
    try {
      await saveMutation.mutateAsync();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <View style={common.screen}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarTitle}>Recurring</Text>
          <Text style={common.subtitle}>Scheduled income and expenses</Text>
        </View>
        <Button title="Add" onPress={openCreate} />
      </View>

      <ScrollView contentContainerStyle={common.screenPadding}>
        {(rulesQuery.isLoading || upcomingQuery.isLoading) && (
          <Text style={common.subtitle}>Loading…</Text>
        )}
        {(rulesQuery.error || upcomingQuery.error) && (
          <Text style={common.error}>Failed to load recurring data</Text>
        )}

        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length === 0 && !upcomingQuery.isLoading ? (
          <Text style={common.subtitle}>No upcoming occurrences.</Text>
        ) : null}
        {upcoming.map((item) => (
          <UpcomingRow key={`${item.recurring_transaction_id}-${item.scheduled_for}`} item={item} />
        ))}

        <Text style={[styles.sectionTitle, styles.rulesTitle]}>Rules</Text>
        {rules.length === 0 && !rulesQuery.isLoading ? (
          <Text style={common.subtitle}>No recurring rules yet.</Text>
        ) : null}
        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            accountName={accountNameById.get(rule.account_id)}
            onPauseResume={() => void statusMutation.mutate(rule)}
            onEdit={() => openEdit(rule)}
            onDelete={() => confirmDelete(rule)}
          />
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowForm(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editing ? "Edit recurring" : "Add recurring"}
              </Text>

              {accounts.length > 0 && (
                <>
                  <Text style={common.label}>Account</Text>
                  <View style={styles.accountRow}>
                    {accounts.map((a) => (
                      <Button
                        key={a.id}
                        title={a.name}
                        variant={accountId === a.id ? "primary" : "ghost"}
                        style={styles.accountChip}
                        onPress={() => setAccountId(a.id)}
                      />
                    ))}
                  </View>
                </>
              )}

              <Text style={common.label}>Amount</Text>
              <TextInput
                style={[common.input, styles.inputSpaced]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
              />

              <Text style={[common.label, styles.typeLabel]}>Type</Text>
              <View style={styles.typeRow}>
                <Button
                  title="Income"
                  variant={type === "income" ? "primary" : "ghost"}
                  style={styles.typeButton}
                  onPress={() => setType("income")}
                />
                <Button
                  title="Expense"
                  variant={type === "expense" ? "primary" : "ghost"}
                  style={styles.typeButton}
                  onPress={() => setType("expense")}
                />
              </View>

              <Text style={common.label}>Frequency</Text>
              <View style={styles.freqRow}>
                {FREQUENCIES.map((freq) => (
                  <Button
                    key={freq}
                    title={RECURRENCE_FREQUENCY_LABELS[freq]}
                    variant={frequency === freq ? "primary" : "ghost"}
                    style={styles.freqChip}
                    onPress={() => setFrequency(freq)}
                  />
                ))}
              </View>

              <Text style={common.label}>Start date (YYYY-MM-DD)</Text>
              <TextInput
                style={[common.input, styles.inputSpaced]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2026-06-01"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />

              <Text style={common.label}>Note (optional)</Text>
              <TextInput
                style={[common.input, styles.inputSpaced]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Rent"
                placeholderTextColor={colors.muted}
              />

              {schedulePreview.length > 0 && (
                <Card style={styles.previewCard}>
                  <Text style={styles.previewTitle}>Schedule preview</Text>
                  {schedulePreview.map((d) => (
                    <Text key={d} style={common.subtitle}>
                      {d}
                    </Text>
                  ))}
                </Card>
              )}

              {formError ? <Text style={common.error}>{formError}</Text> : null}

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  style={styles.typeButton}
                  onPress={() => setShowForm(false)}
                />
                <Button
                  title={saveMutation.isPending ? "Saving…" : "Save"}
                  style={styles.typeButton}
                  disabled={saveMutation.isPending}
                  onPress={() => void handleSubmit()}
                />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function UpcomingRow({ item }: { item: UpcomingRecurringOccurrence }) {
  const isIncome = item.transaction_type === "income";
  const title =
    item.label ?? (isIncome ? "Income" : "Expense");
  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowType}>{title}</Text>
        <Text style={{ color: isIncome ? colors.income : colors.expense }}>
          ${item.amount}
        </Text>
      </View>
      <Text style={common.subtitle}>{new Date(item.scheduled_for).toLocaleString()}</Text>
    </Card>
  );
}

function RuleRow({
  rule,
  accountName,
  onPauseResume,
  onEdit,
  onDelete,
}: {
  rule: RecurringTransaction;
  accountName?: string;
  onPauseResume: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = rule.transaction_type === "income";
  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowType}>
          {isIncome ? "Income" : "Expense"}
          {rule.paused ? " (Paused)" : ""}
        </Text>
        <Text style={{ color: isIncome ? colors.income : colors.expense }}>
          ${rule.amount}
        </Text>
      </View>
      <Text style={common.subtitle}>
        {accountName ?? "Account"} · {RECURRENCE_FREQUENCY_LABELS[rule.frequency]} ·
        starts {startDateInputValue(rule.start_date)}
      </Text>
      {rule.note ? <Text style={common.subtitle}>{rule.note}</Text> : null}
      <View style={styles.actionsRow}>
        <Button
          title={rule.paused ? "Resume" : "Pause"}
          variant="ghost"
          style={styles.actionBtn}
          onPress={onPauseResume}
        />
        <Button title="Edit" variant="ghost" style={styles.actionBtn} onPress={onEdit} />
        <Button title="Delete" variant="ghost" style={styles.actionBtn} onPress={onDelete} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toolbarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
  },
  rulesTitle: {
    marginTop: 20,
  },
  rowCard: {
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowType: {
    fontWeight: "500",
    color: colors.white,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: "30%",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: colors.surface,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 16,
  },
  inputSpaced: {
    marginBottom: 16,
  },
  typeLabel: {
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
  },
  freqRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  freqChip: {
    flexGrow: 1,
    minWidth: "45%",
  },
  accountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  accountChip: {
    flexGrow: 1,
  },
  previewCard: {
    marginBottom: 16,
  },
  previewTitle: {
    fontWeight: "600",
    color: colors.white,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
