import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { api } from "../../src/api";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { useAuthStore } from "../../src/store/authStore";
import { formatMoney } from "../../src/theme/format";
import { colors } from "../../src/theme/colors";
import { common } from "../../src/theme/styles";

export default function DashboardScreen() {
  const logout = useAuthStore((s) => s.logout);

  const summaryQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const accounts = await api.listAccounts();
      if (accounts.length === 0) {
        await api.createAccount("Main Wallet");
      }
      return api.dashboardSummary();
    },
  });

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: () => api.listAccounts(),
  });

  const summary = summaryQuery.data;
  const refreshing = summaryQuery.isFetching || accountsQuery.isFetching;

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={common.screenPadding}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void summaryQuery.refetch();
            void accountsQuery.refetch();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={common.title}>Dashboard</Text>
          <Text style={common.subtitle}>
            {summary?.period_label ?? "Current period"}
          </Text>
        </View>
        <Button
          title="Logout"
          variant="ghost"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        />
      </View>

      {summaryQuery.isLoading && (
        <Text style={common.subtitle}>Loading…</Text>
      )}
      {summaryQuery.error && (
        <Text style={common.error}>
          {summaryQuery.error instanceof Error
            ? summaryQuery.error.message
            : "Failed to load dashboard"}
        </Text>
      )}

      {summary && (
        <View style={styles.summaryBlock}>
          <Card>
            <Text style={common.subtitle}>Net</Text>
            <Text style={styles.netValue}>{formatMoney(summary.net)}</Text>
          </Card>
          <View style={styles.row}>
            <Card style={styles.halfCard}>
              <Text style={[common.subtitle, { color: colors.income }]}>
                Income
              </Text>
              <Text style={styles.metric}>{formatMoney(summary.total_income)}</Text>
            </Card>
            <Card style={styles.halfCard}>
              <Text style={[common.subtitle, { color: colors.expense }]}>
                Expenses
              </Text>
              <Text style={styles.metric}>
                {formatMoney(summary.total_expenses)}
              </Text>
            </Card>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Accounts</Text>
      {(accountsQuery.data ?? []).length === 0 && !accountsQuery.isLoading ? (
        <Text style={common.subtitle}>No accounts yet.</Text>
      ) : null}
      {(accountsQuery.data ?? []).map((account) => (
        <Card key={account.id}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text style={common.subtitle}>
            {account.currency} · {account.account_type}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryBlock: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  netValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
  },
  metric: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
  },
  accountName: {
    fontWeight: "500",
    color: colors.white,
    fontSize: 16,
  },
});
