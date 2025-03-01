import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { supabase } from "../supabaseAccess";
import { Feather } from "@expo/vector-icons";
const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Function to handle sign in
  const handleSignIn = async () => {
    // Input validation
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Check if the email exists in the user table
      const { data: userData, error: fetchError } = await supabase
        .from("user")
        .select("email_id, pwd")
        .eq("email_id", email)
        .single();

      if (fetchError || !userData) {
        Alert.alert("Error", "Email not found. Please sign up.");
        setLoading(false);
        return;
      }

      // Verify the password
      if (userData.pwd !== password) {
        Alert.alert("Error", "Incorrect password.");
        setLoading(false);
        return;
      }

      // Sign in the user with Supabase Auth
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        Alert.alert("Error", signInError.message);
        setLoading(false);
        return;
      }

      // Successfully signed in, navigate to the home/explore screen
      router.replace("/explore");
    } catch (error) {
      console.error("Error during sign in:", error);
      Alert.alert("Error", "An error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Implement forgot password functionality or navigation
    Alert.alert("Forgot Password", "Feature coming soon!");
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className="w-full justify-center h-full px-7 my-6">
          <View className="mb-10">
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome name="arrow-left" size={24} color="#d1d5db" />
            </TouchableOpacity>
          </View>
          <Text className="text-4xl font-psemibold text-yellow-400">
            Welcome Back
          </Text>
          <Text className="text-gray-400 mt-3 font-psemibold text-lg">
            Sign in to your account
          </Text>

          <View className="mt-10">
            <View className="mb-6">
              <Text className="text-xl text-gray-300 block mb-2 font-psemibold">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-4 font-psemibold text-white"
                placeholder="your@email.com"
                keyboardType="email-address"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
              />
            </View>

            <View className="mb-8">
              <Text className="text-xl text-gray-300 block mb-2 font-psemibold">
                Password
              </Text>
              <View className=" relative">
              <TextInput
                value={password}
                onChangeText={setPassword}
                className="w-full bg-gray-800 border-2 border-gray-700 font-psemibold rounded-lg p-4 text-gray-100 pr-12"
                placeholder="••••••••"
                secureTextEntry={!passwordVisible}
                placeholderTextColor="#6b7280"
              /> 
              <TouchableOpacity
                  className="absolute right-4 top-5"
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Feather
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text className="text-right text-yellow-400 text-lg font-psemibold mb-8">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignIn}
              className="w-full bg-yellow-400 text-gray-900 py-4 rounded-lg font-semibold flex-row justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <Text className="text-center text-xl text-gray-900 font-pbold">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <View className="flex flex-row items-center gap-4 mb-6">
              <View className="flex-1 border-t border-gray-500" />
              <Text className="text-gray-400 font-pregular">
                or continue with
              </Text>
              <View className="flex-1 border-t border-gray-500" />
            </View>

            <View className="flex-row w-11/12 mx-auto justify-evenly">
              <TouchableOpacity className="flex-row basis-1/3 items-center justify-center gap-2 bg-gray-800 py-5 rounded-lg">
                <FontAwesome5 name="google" size={24} color="white" />
                <Text className="text-white font-psemibold text-lg">
                  Google
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-row basis-1/3 items-center justify-center gap-2 bg-gray-800 py-5 rounded-lg">
                <FontAwesome5 name="apple" size={27} color="white" />
                <Text className="text-white font-psemibold text-lg">Apple</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mt-8 flex-row justify-center">
            <Text className="text-gray-400 text-lg font-psemibold">
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/sign-up")}>
              <Text className="text-yellow-400 text-lg font-pbold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;