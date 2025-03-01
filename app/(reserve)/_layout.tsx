import { Stack } from "expo-router";

export default function ReserveLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="reserve"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}