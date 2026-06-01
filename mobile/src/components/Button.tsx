import {
  Pressable,
  Text,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors } from "../theme/colors";

type Variant = "primary" | "ghost" | "link";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = "primary",
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      style={[
        styles.base,
        variant === "primary" && styles.primary,
        variant === "ghost" && styles.ghost,
        variant === "link" && styles.link,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      <Text
        style={[
          styles.text,
          variant === "primary" && styles.textPrimary,
          variant === "link" && styles.textLink,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  link: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    color: colors.white,
  },
  textPrimary: {
    fontWeight: "600",
  },
  textLink: {
    color: colors.primary,
  },
});
