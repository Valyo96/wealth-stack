import { StyleSheet } from "react-native";
import { colors } from "./colors";

export const common = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  error: {
    color: colors.expense,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
});
