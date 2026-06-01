import { ApiClientError } from "@wealth-stack/shared";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Button } from "../../src/components/Button";
import { useAuthStore } from "../../src/store/authStore";
import { common } from "../../src/theme/styles";

export default function LoginScreen() {
  const { login, register } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      router.replace("/(app)");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={common.screen}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={common.title}>Wealth Stack</Text>
          <Text style={common.subtitle}>
            {isRegister ? "Create your account" : "Sign in to continue"}
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={common.label}>Email</Text>
            <TextInput
              style={common.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          <View>
            <Text style={common.label}>Password</Text>
            <TextInput
              style={common.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isRegister ? "new-password" : "password"}
            />
          </View>
          {error ? <Text style={common.error}>{error}</Text> : null}
          <Button
            title={loading ? "Please wait…" : isRegister ? "Register" : "Login"}
            disabled={loading}
            onPress={() => void handleSubmit()}
          />
          <Button
            title={
              isRegister
                ? "Already have an account? Sign in"
                : "New here? Create account"
            }
            variant="link"
            onPress={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  header: {
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
});
