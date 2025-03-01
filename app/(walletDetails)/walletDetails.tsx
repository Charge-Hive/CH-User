import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";

import { supabase } from "../supabaseAccess";

import { FontAwesome } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

// Define types for the balance response
interface BalanceResponse {
  success: boolean;
  accountId: string;
  balances: {
    hbar: {
      tinybars: string;
      hbar: string;
    };
    chargeHive: {
      tokenId: string;
      balance: string;
    };
  };
  accountDetails?: {
    key: string;
    balance: string;
    receiverSignatureRequired: boolean;
    expirationTime?: string;
  };
  error?: string;
}

const WalletPage = () => {
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  const [hederaPrivateKey, setHederaPrivateKey] = useState<string | null>(null);
  const [hederaPublicKey, setHederaPublicKey] = useState<string | null>(null);
  const [hederaEvmAddr, setHederaEvmAddr] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceResponse | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  // Fetch the user's Hedera wallet details from Supabase
  const fetchHederaWalletDetails = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      const { data, error: fetchError } = await supabase
        .from("user")
        .select(
          "hedera_account_id, hedera_private_key, hedera_public_key, hedera_evm_addr"
        )
        .eq("email_id", user.email)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // If wallet details exist, set them in state
      if (data) {
        setHederaAccountId(data.hedera_account_id);
        setHederaPrivateKey(data.hedera_private_key);
        setHederaPublicKey(data.hedera_public_key);
        setHederaEvmAddr(data.hedera_evm_addr);
      }
    } catch (error) {
      console.error("Error fetching Hedera wallet details:", error);
      setError("Failed to fetch wallet details.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to fetch wallet details.",
      });
    } finally {
      setLoading(false);
    }
  };

    // Fetch account balance from API
    const fetchAccountBalance = async (accountId: string, privateKey: string) => {
      try {
        setLoadingBalance(true);
        const response = await fetch(
          "https://hederaprovider-e5c7e6e44385.herokuapp.com/account-balance",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountId,
              privateKey,
              tokenId: "0.0.5630530",
            }),
          }
        );
  
        const data = await response.json();
        if (data.success) {
          setBalanceData(data);
        } else {
          console.error("Failed to fetch balance:", data.error);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: data.error || "Failed to fetch balance",
          });
        }
      } catch (error) {
        console.error("Error fetching account balance:", error);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to connect to balance API",
        });
      } finally {
        setLoadingBalance(false);
      }
    };
  
    // Manually refresh balance
    const refreshBalance = () => {
      if (hederaAccountId && hederaPrivateKey) {
        fetchAccountBalance(hederaAccountId, hederaPrivateKey);
      }
    };

  // Create a new Hedera wallet and update Supabase
  const createHederaWallet = async () => {
    try {
      setLoading(true);

      // Call the Hedera provider API to create a new account
      const response = await fetch(
        "https://hederaprovider-e5c7e6e44385.herokuapp.com/create-account"
      );

      if (!response.ok) {
        throw new Error("Failed to create Hedera wallet");
      }

      // Parse the response
      const { accountId, privateKey, publicKey, evmAddr } =
        await response.json();

      // Get the current user's email
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      // Update the user's record in Supabase with the new Hedera account details
      const { error: updateError } = await supabase
        .from("user")
        .update({
          hedera_account_id: accountId,
          hedera_private_key: privateKey,
          hedera_public_key: publicKey,
          hedera_evm_addr: evmAddr,
        })
        .eq("email_id", user.email);

      if (updateError) {
        throw updateError;
      }

      // Update the local state with the new Hedera wallet details
      setHederaAccountId(accountId);
      setHederaPrivateKey(privateKey);
      setHederaPublicKey(publicKey);
      setHederaEvmAddr(evmAddr);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Wallet created successfully!",
      });
    } catch (error) {
      console.error("Error creating Hedera wallet:", error);
      setError("Failed to create wallet.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to create wallet.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: "Text copied to clipboard.",
    });
  };

  // Fetch Hedera wallet details on component mount
  useEffect(() => {
    fetchHederaWalletDetails();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#FBBF24" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary h-full mt-4 p-6">
      <Text className="text-5xl font-bold text-yellow-400 font-pbold">
        Wallet
      </Text>
      <Text className="text-xl mt-2 text-gray-300 font-psemibold">
        Manage your Hedera wallet.
      </Text>

      {hederaAccountId ? (
        <View className="mt-8 space-y-6 gap-y-6">
                      {/* Balance Information */}
                      <View className="bg-gray-800 p-4 rounded-lg">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-lg font-psemibold">
                  Account Balance
                </Text>
                <TouchableOpacity
                  onPress={refreshBalance}
                  disabled={loadingBalance}
                  className="bg-yellow-400 px-3 py-1 rounded-md"
                >
                  <Text className="text-gray-900 font-psemibold">
                    {loadingBalance ? "Loading..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingBalance ? (
                <ActivityIndicator size="small" color="#FBBF24" />
              ) : balanceData ? (
                <View className="space-y-4">
                  <View className="bg-gray-700 p-3 rounded-md">
                    <Text className="text-gray-400 text-sm">HBAR Balance</Text>
                    <Text className="text-white text-xl font-pbold">
                      {balanceData.balances.hbar.hbar} HBAR
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {balanceData.balances.hbar.tinybars} tinybars
                    </Text>
                  </View>

                  <View className="bg-gray-700 p-3 mt-4 rounded-md">
                    <Text className="text-gray-400 text-sm">
                      ChargeHive Token
                    </Text>
                    <Text className="text-white text-xl font-pbold">
                      {balanceData.balances.chargeHive.balance}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      Token ID: {balanceData.balances.chargeHive.tokenId}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="text-white text-center">
                  Tap refresh to load your balance
                </Text>
              )}
            </View>
          {/* Hedera Account ID */}
          <KeyDisplayBox
            label="Hedera Account ID"
            value={hederaAccountId}
            onCopy={() => copyToClipboard(hederaAccountId)}
          />

          {/* Hedera Private Key */}
          <KeyDisplayBox
            label="Hedera Private Key"
            value={showPrivateKey ? hederaPrivateKey ?? "" : "••••••••••••"}
            secureTextEntry={!showPrivateKey}
            onToggleVisibility={() => setShowPrivateKey(!showPrivateKey)}
            onCopy={() => copyToClipboard(hederaPrivateKey!)}
          />

          {/* Hedera Public Key */}
          <KeyDisplayBox
            label="Hedera Public Key"
            value={hederaPublicKey ?? ""}
            onCopy={() => copyToClipboard(hederaPublicKey!)}
          />

          {/* Hedera EVM Address */}
          <KeyDisplayBox
            label="Hedera EVM Address"
            value={hederaEvmAddr ?? ""}
            onCopy={() => copyToClipboard(hederaEvmAddr!)}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={createHederaWallet}
          className="mt-8 flex-row items-center justify-center bg-blue-500 py-4 rounded-lg"
        >
          <FontAwesome name="plus-square" size={24} color="white" />
          <Text className="text-white text-xl ml-2 font-pbold">
            Create Wallet
          </Text>
        </TouchableOpacity>
      )}
      <Toast />
    </View>
  );
};

// Reusable component for displaying keys
const KeyDisplayBox = ({
  label,
  value,
  secureTextEntry = false,
  onCopy,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  secureTextEntry?: boolean;
  onCopy: () => void;
  onToggleVisibility?: () => void;
}) => (
  <View className="bg-gray-800 p-4 rounded-lg">
    <Text className="text-gray-400 text-sm">{label}</Text>
    <View className="flex-row justify-between items-center">
      <TextInput
        className="text-white text-lg flex-1"
        value={value}
        secureTextEntry={secureTextEntry}
        editable={false}
      />
      {onToggleVisibility && (
        <TouchableOpacity onPress={onToggleVisibility}>
          <FontAwesome
            name={secureTextEntry ? "eye" : "eye-slash"}
            size={20}
            color="#FBBF24"
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onCopy} className="ml-4">
        <FontAwesome name="copy" size={20} color="#FBBF24" />
      </TouchableOpacity>
    </View>
  </View>
);

export default WalletPage;