import { Stack } from "expo-router";

export default function WalletDetailsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="walletDetails"
        options={{
          headerShown: false, }}
      />
    </Stack>
  );
}