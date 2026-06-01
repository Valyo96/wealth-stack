import { useQuery } from "@tanstack/react-query";
import { RefreshControl, ScrollView, Text, View, StyleSheet } from "react-native";
import { api } from "../../src/api";
import { Card } from "../../src/components/Card";
import { formatMoney } from "../../src/theme/format";
import { colors } from "../../src/theme/colors";
import { common } from "../../src/theme/styles";

export default function BudgetOverviewScreen() {
  const query = useQuery({
    queryKey: ["dashboard", "budget"],
    queryFn: () => api.dashboardSummary(),
  });

  const summary = query.data;

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={common.screenPadding}
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text style={common.title}>Budget overview</Text>
      <Text style={common.subtitle}>
        Period summary from your dashboard (full budgets coming later).
      </Text>

      {query.isLoading && <Text style={common.subtitle}>Loading…</Text>}
      {query.error && (
        <Text style={common.error}>
          {query.error instanceof Error ? query.error.message : "Failed to load"}
        </Text>
      )}

      {summary && (
        <View style={styles.block}>
          <Card>
            <Text style={common.subtitle}>{summary.period_label}</Text>
            <Text style={styles.periodRange}>
              {summary.period_start} — {summary.period_end}
            </Text>
          </Card>
          <Card>
            <Text style={common.subtitle}>Planned net (income − expenses)</Text>
            <Text
              style={[
                styles.netLarge,
                {
                  color:
                    parseFloat(summary.net) >= 0 ? colors.income : colors.expense,
                },
              ]}
            >
              {formatMoney(summary.net)}
            </Text>
          </Card>
          <Card>
            <Text style={[common.subtitle, { color: colors.income }]}>Income</Text>
            <Text style={styles.value}>{formatMoney(summary.total_income)}</Text>
          </Card>
          <Card>
            <Text style={[common.subtitle, { color: colors.expense }]}>
              Expenses
            </Text>
            <Text style={styles.value}>{formatMoney(summary.total_expenses)}</Text>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
    marginTop: 8,
  },
  periodRange: {
    marginTop: 8,
    fontSize: 14,
    color: colors.muted,
  },
  netLarge: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  value: {
    fontSize: 20,
    color: colors.white,
    marginTop: 4,
  },
});
