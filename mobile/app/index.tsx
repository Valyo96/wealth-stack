import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const loggedIn = useAuthStore((s) => s.loggedIn);
  return <Redirect href={loggedIn ? "/(app)" : "/(auth)/login"} />;
}
