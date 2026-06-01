import type { Transaction } from "@wealth-stack/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
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

export default function TransactionsScreen() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [formError, setFormError] = useState<string | null>(null);

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.listTransactions(),
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.listAccounts(),
  });

  const createMutation = useMutation({
    mutationFn: async ({
      accountId,
      amount: amt,
      transactionType,
    }: {
      accountId: string;
      amount: string;
      transactionType: "income" | "expense";
    }) => api.createTransaction(accountId, amt, transactionType),
    onSuccess: async () => {
      setShowForm(false);
      setAmount("");
      setType("expense");
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const accounts = accountsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  async function handleSubmit() {
    const accountId = accounts[0]?.id;
    if (!accountId) {
      setFormError("Create an account on the dashboard first");
      return;
    }
    if (!amount.trim()) {
      setFormError("Amount is required");
      return;
    }
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        accountId,
        amount: amount.trim(),
        transactionType: type,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <View style={common.screen}>
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.toolbarTitle}>Transactions</Text>
          <Text style={common.subtitle}>Track income and expenses</Text>
        </View>
        <Button title="Add" onPress={() => setShowForm(true)} />
      </View>

      <ScrollView contentContainerStyle={common.screenPadding}>
        {transactionsQuery.isLoading && (
          <Text style={common.subtitle}>Loading…</Text>
        )}
        {transactionsQuery.error && (
          <Text style={common.error}>Failed to load transactions</Text>
        )}
        {transactions.length === 0 && !transactionsQuery.isLoading && (
          <Text style={common.subtitle}>No transactions yet.</Text>
        )}
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowForm(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Add transaction</Text>
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
            {accounts.length > 0 && (
              <Text style={[common.subtitle, styles.accountHint]}>
                Account: {accounts[0]?.name}
              </Text>
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
                title={createMutation.isPending ? "Saving…" : "Save"}
                style={styles.typeButton}
                disabled={createMutation.isPending}
                onPress={() => void handleSubmit()}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.transaction_type === "income";
  return (
    <Card style={styles.txCard}>
      <View style={styles.txRow}>
        <Text style={styles.txType}>{isIncome ? "Income" : "Expense"}</Text>
        <Text style={{ color: isIncome ? colors.income : colors.expense }}>
          ${tx.amount}
        </Text>
      </View>
      <Text style={common.subtitle}>
        {new Date(tx.occurred_at).toLocaleString()}
      </Text>
      {tx.note ? <Text style={common.subtitle}>{tx.note}</Text> : null}
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
  txCard: {
    marginBottom: 12,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  txType: {
    fontWeight: "500",
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
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
  accountHint: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
});
