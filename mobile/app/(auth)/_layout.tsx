import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/store/authStore";

export default function AuthLayout() {
  const loggedIn = useAuthStore((s) => s.loggedIn);
  if (loggedIn) {
    return <Redirect href="/(app)" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
