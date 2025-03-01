import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Messages = () => {
  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="mt-14 w-full px-8">
          <Text className="text-yellow-400 text-4xl font-pbold">Messages</Text>
          <Text className=" text-white items-center justify-center mt-72 ml-12 text-3xl">Feature, coming soon....</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Messages;
