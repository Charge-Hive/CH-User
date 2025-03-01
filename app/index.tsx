import {
  ScrollView,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

const App = () => {
  return (
    <ImageBackground
      source={require("../assets/onboarding/bg.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView className="h-full ">
        <ScrollView contentContainerStyle={{ height: "100%" }}>
          <View className="relative h-full flex-1 flex-col justify-between px-6 py-4">
            <View className="pt-16">
              <Text className="text-5xl font-bold text-yellow-400 font-pbold">
                ChargeHive
              </Text>
              <Text className="text-xl mt-2 text-gray-300 font-psemibold">
                Find & Share EV Charging Spots
              </Text>
            </View>
            <View className="space-y-6 mb-1">
              <View className="flex flex-row items-center mb-5">
                <MaterialIcons name="electric-bolt" size={30} color="#facc15" />
                <Text className="text-white font-psemibold ml-2 text-lg">
                  Access thousands of charging spots
                </Text>
              </View>
              <View className="flex-row items-center space-x-3 mb-6">
                <FontAwesome name="car" size={24} color="#facc15" />
                <Text className="text-white font-psemibold ml-3 text-lg">
                  Reserve parking spaces instantly
                </Text>
              </View>
              <View className="flex flex-row items-center space-x-2 mb-9">
                <FontAwesome6 name="users" size={24} color="#facc15" />
                <Text className="text-white font-psemibold ml-3 text-lg">
                  Join the community
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/sign-up')} className="w-full bg-yellow-400 text-gray-900 py-4 rounded-lg font-semibold">
                <Text className="text-center text-xl text-gray-900 font-pbold">
                  Get Started
                </Text>
              </TouchableOpacity>
              <Text className="text-center text-base mt-6 text-white font-pmedium">
                Already have an account?{" "}
                <Link href='/sign-in'> <Text className="text-yellow-400 text-lg font-psemibold underline"> 
                  
                  Sign in</Text></Link>
              </Text>
            </View>
          </View>
        </ScrollView>
        <StatusBar backgroundColor="#161622" style="light"/>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default App;
