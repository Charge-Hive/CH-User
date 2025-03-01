import { Stack } from "expo-router";

export default function TripsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="tripDetails"
        options={{
          headerShown: false,        }}
      />
    </Stack>
  );
}