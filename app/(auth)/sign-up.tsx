import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { supabase } from "../supabaseAccess";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [age, setAge] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !age) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (!/^\d+$/.test(age) || parseInt(age) <= 0) {
      Alert.alert("Error", "Please enter a valid age.");
      return;
    }

    setLoading(true);

    try {
      console.log("Checking if email is already registered...");
      const { data: existingUser, error: fetchError } = await supabase
        .from("user")
        .select("email_id")
        .eq("email_id", email)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking email:", fetchError);
        Alert.alert("Error", "Failed to check email availability.");
        setLoading(false);
        return;
      }

      if (existingUser) {
        console.log("Email is already registered:", email);
        Alert.alert("Error", "Email is already registered. Try logging in.");
        setLoading(false);
        return;
      }

      // First register the user in Supabase Auth
      console.log("Signing up user with Supabase Auth...");
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signupError) {
        console.error("Error signing up:", signupError);
        Alert.alert("Error", signupError.message);
        setLoading(false);
        return;
      }

      // Then save additional user details in the custom user table
      console.log("User signed up successfully. Saving user details...");
      const { error: insertError } = await supabase.from("user").insert([
        {
          email_id: email,
          pwd: password, // In production, never store plain-text passwords
          age: parseInt(age),
          // Initialize wallet fields as null
          hedera_account_id: null,
          hedera_private_key: null,
          hedera_public_key: null, 
          hedera_evm_addr: null
        },
      ]);

      if (insertError) {
        console.error("Error saving user details:", insertError);
        Alert.alert("Error", insertError.message);
        setLoading(false);
        return;
      }

      // Wait a moment to ensure the session is established
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Sign in immediately after signup to make sure session is active
      console.log("Signing in after signup...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Error signing in after signup:", signInError);
        Alert.alert("Error", "Account created but unable to sign in automatically. Please try logging in.");
        router.replace("/sign-in");
        setLoading(false);
        return;
      }

      // Wait another moment to ensure the session is properly established
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log("User details saved successfully. Navigating to explore page...");
      Alert.alert(
        "Success", 
        "Account created successfully!",
        [{ text: "OK", onPress: () => router.replace("/explore") }]
      );
    } catch (error) {
      console.error("Unexpected error during signup:", error);
      Alert.alert("Error", "An error occurred during signup.");
    } finally {
      setLoading(false);
    }
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
            Create Account
          </Text>
          <Text className="text-gray-400 mt-3 font-psemibold text-lg">
            Join the ChargeHive community
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

            <View className="mb-6 relative">
              <Text className="text-xl text-gray-300 block mb-2 font-psemibold">
                Password
              </Text>
              <View className="relative">
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

            <View className="mb-6 relative">
              <Text className="text-xl text-gray-300 block mb-2 font-psemibold">
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  className="w-full bg-gray-800 border-2 border-gray-700 font-psemibold rounded-lg p-4 text-gray-100 pr-12"
                  placeholder="••••••••"
                  secureTextEntry={!confirmPasswordVisible}
                  placeholderTextColor="#6b7280"
                />
                <TouchableOpacity
                  className="absolute right-4 top-5"
                  onPress={() =>
                    setConfirmPasswordVisible(!confirmPasswordVisible)
                  }
                >
                  <Feather
                    name={confirmPasswordVisible ? "eye-off" : "eye"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              {password !== confirmPassword && confirmPassword.length > 0 && (
                <Text className="text-red-500 mt-2 text-sm font-semibold">
                  Passwords do not match
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-xl text-gray-300 block mb-2 font-psemibold">
                Age
              </Text>
              <TextInput
                value={age}
                onChangeText={(text) => {
                  if (/^\d*$/.test(text)) {
                    setAge(text);
                  }
                }}
                className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg p-4 font-psemibold text-white"
                placeholder="Enter your age"
                keyboardType="numeric"
                placeholderTextColor="#6b7280"
              />
            </View>

            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              className="w-full bg-yellow-400 text-gray-900 py-4 rounded-lg font-semibold flex-row justify-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <Text className="text-center text-xl text-gray-900 font-pbold">
                  Sign Up
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
              <TouchableOpacity className="flex-row basis-1/3 items-center justify-center gap-2 bg-gray-800 py-5  rounded-lg">
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;