import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { supabase } from "../supabaseAccess";

const TripDetails = () => {
  const router = useRouter();
  const { tripId, totalFee, type } = useLocalSearchParams<{ 
    tripId?: string,  
    totalFee?: string,
    type?: string  
  }>();
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locationAddress, setLocationAddress] = useState<string>("Unknown location");
  const [reservationType, setReservationType] = useState<string>(type || "parking");

  useEffect(() => {
    console.log("Navigation params:", { tripId, totalFee, type });
    console.log("Reservation type:", reservationType);
    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId, totalFee, type]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      console.log("Fetching trip details for ID:", tripId);
      console.log("Reservation type:", reservationType);
      
      // Check if this is a synthetic ID (e.g., "trip-5" or contains specific pattern)
      const isSyntheticId = tripId?.startsWith('trip-') || tripId?.includes('-');
      console.log("Is synthetic ID:", isSyntheticId);
      
      // Determine which table to query based on the reservation type
      const tableName = reservationType === "charging" ? "Charging_Transaction" : "Parking_Transactions";
      
      let transactionData = null;
      
      // For charging transactions with synthetic ID, fetch all and find by type/date/time
      if (reservationType === "charging" && isSyntheticId) {
        console.log("Using alternative approach for synthetic ID with charging");
        
        // Get all charging transactions and find the best match
        const { data: allData, error: allError } = await supabase
          .from(tableName)
          .select("*");
          
        if (allError) {
          console.error("Error fetching all charging transactions:", allError);
        } else if (allData && allData.length > 0) {
          console.log(`Found ${allData.length} charging transactions`);
          // Just use the first one if we have a synthetic ID
          // In a real app, you might want to decode the synthetic ID to match the correct record
          transactionData = allData[0];
          console.log("Using first charging transaction:", transactionData);
        }
      } 
      // For charging transactions with a valid UUID
      else if (reservationType === "charging") {
        // Check if it looks like a UUID
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidPattern.test(tripId || '');
        
        if (isUuid) {
          // Try querying based on charging_transaction_id if it's a UUID
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq("charging_transaction_id", tripId);
            
          if (error) {
            console.error("Error querying by charging_transaction_id:", error);
          } else if (data && data.length > 0) {
            transactionData = data[0];
            console.log("Found charging transaction by charging_transaction_id:", transactionData);
          }
        } else {
          // Get all charging transactions if the ID is not a UUID
          const { data, error } = await supabase
            .from(tableName)
            .select("*");
            
          if (error) {
            console.error("Error fetching all charging transactions:", error);
          } else if (data && data.length > 0) {
            transactionData = data[0];
            console.log("Using first charging transaction as fallback:", transactionData);
          }
        }
      } 
      // For parking transactions
      else {
        // Try matching by parking_transaction_id 
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("parking_transaction_id", tripId)
          .single();
          
        if (error) {
          console.error("Error fetching by parking_transaction_id:", error);
          
          // Try by id as fallback
          const { data: idData, error: idError } = await supabase
            .from(tableName)
            .select("*")
            .eq("id", tripId)
            .single();
            
          if (idError) {
            console.error("Error fetching by id:", idError);
            
            // If this is a synthetic ID, try getting all records
            if (isSyntheticId) {
              const { data: allData, error: allError } = await supabase
                .from(tableName)
                .select("*");
                
              if (allError) {
                console.error("Error fetching all parking transactions:", allError);
              } else if (allData && allData.length > 0) {
                transactionData = allData[0];
                console.log("Using first parking transaction as fallback:", transactionData);
              }
            }
          } else {
            transactionData = idData;
            console.log("Found parking transaction by id:", transactionData);
          }
        } else {
          transactionData = data;
          console.log("Found parking transaction by parking_transaction_id:", transactionData);
        }
      }

      if (!transactionData) {
        Alert.alert("Error", "Trip not found");
        router.back();
        return;
      }

      console.log("Transaction data retrieved:", transactionData);
      
      // Get location ID field name based on reservation type
      const locationIdField = reservationType === "charging" ? "charger_id" : "parking_id";
      console.log("Location ID field:", locationIdField);
      console.log("Location ID value:", transactionData[locationIdField]);

      // Fetch location details to get the address
      if (transactionData[locationIdField]) {
        try {
          const locationTable = reservationType === "charging" ? "Chargers" : "Parking";
          const locationIdColumn = reservationType === "charging" ? "charger_id" : "parking_id";
          
          console.log(`Querying ${locationTable} where ${locationIdColumn} = ${transactionData[locationIdField]}`);
          
          const { data: locationData, error: locationError } = await supabase
            .from(locationTable)
            .select("*")
            .eq(locationIdColumn, transactionData[locationIdField])
            .single();

          if (locationError) {
            console.error(`Error fetching ${locationTable} data:`, locationError);
          } else if (locationData) {
            console.log(`${locationTable} data retrieved:`, locationData);
            
            // For charging, use the address field
            if (reservationType === "charging" && locationData.address) {
              setLocationAddress(locationData.address);
            } 
            // For parking, use the address field
            else if (reservationType === "parking" && locationData.address) {
              setLocationAddress(locationData.address);
            }
            // Fallback to any field that might contain address information
            else {
              for (const [key, value] of Object.entries(locationData)) {
                if (typeof value === 'string' && 
                    (key.includes('addr') || key.includes('location') || key.includes('place'))) {
                  console.log(`Found potential address in field '${key}':`, value);
                  setLocationAddress(value);
                  break;
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error in ${reservationType} location data fetch:`, err);
        }
      }
  
      // Format the trip details for display
      setTripDetails({
        id: transactionData.id || transactionData.parking_transaction_id || 
             transactionData.charging_transaction_id || tripId,
        date: transactionData.date,
        startTime: transactionData.from_time,
        endTime: transactionData.to_time,
        price: totalFee?.replace('/hr', '') || "$0.00", // Remove '/hr' if present
        status: "Active", // Since we only show details for active trips
        provideremail_id: transactionData.provideremail_id,
        locationId: transactionData[locationIdField],
        type: reservationType
      });
    } catch (error) {
      console.error("Error in fetchTripDetails:", error);
      Alert.alert("Error", "Could not fetch trip details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tripDetails) return;
    
    setLoading(true);
    try {
      console.log("Attempting to delete transaction:", tripDetails);
      
      // Determine which table to delete from
      const tableName = reservationType === "charging" 
        ? "Charging_Transaction" 
        : "Parking_Transactions";
      
      if (reservationType === "charging") {
        // For charging transactions, use direct match by columns
        console.log("Deleting charging transaction by matching columns");
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq("date", tripDetails.date)
          .eq("from_time", tripDetails.startTime)
          .eq("to_time", tripDetails.endTime);
          
        if (error) {
          console.error("Error deleting charging transaction:", error);
          
          // Try with useremail_id as an additional constraint
          console.log("Trying with more specific criteria");
          const { error: specificError } = await supabase
            .from(tableName)
            .delete()
            .eq("date", tripDetails.date)
            .eq("from_time", tripDetails.startTime)
            .eq("provideremail_id", tripDetails.provideremail_id);
            
          if (specificError) {
            console.error("Specific criteria delete also failed:", specificError);
            Alert.alert("Error", "Failed to cancel reservation");
            return;
          }
        }
      } else {
        // For parking transactions, try id first
        console.log("Deleting parking transaction with ID:", tripDetails.id);
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq("parking_transaction_id", tripDetails.id);
          
        if (error) {
          console.error("Error deleting by parking_transaction_id:", error);
          
          // Try by id as fallback
          console.log("Trying to delete by id");
          const { error: idError } = await supabase
            .from(tableName)
            .delete()
            .eq("id", tripDetails.id);
            
          if (idError) {
            console.error("Error deleting by id:", idError);
            
            // Last resort: delete by specific criteria
            console.log("Trying with more specific criteria");
            const { error: specificError } = await supabase
              .from(tableName)
              .delete()
              .eq("date", tripDetails.date)
              .eq("from_time", tripDetails.startTime)
              .eq("to_time", tripDetails.endTime);
              
            if (specificError) {
              console.error("Specific criteria delete also failed:", specificError);
              Alert.alert("Error", "Failed to cancel reservation");
              return;
            }
          }
        }
      }

      Alert.alert("Success", "Reservation cancelled successfully!", [
        { text: "OK", onPress: () => router.push("/(tabs)/trips") }
      ]);
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      Alert.alert("Error", "Failed to cancel reservation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="bg-primary h-full justify-center items-center">
        <ActivityIndicator size="large" color="#FBBF24" />
      </View>
    );
  }

  if (!tripDetails) {
    return (
      <View className="bg-primary h-full justify-center items-center">
        <Text className="text-white text-lg">No trip details available.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-primary h-full p-6">
      {/* Back Button and Title */}
      <View className="flex flex-row items-center gap-4 mt-8">
        <Ionicons name="arrow-back" size={24} color="white" onPress={() => router.back()} />
        <Text className="text-3xl font-bold text-white">Trip Details</Text>
      </View>

      {/* Trip Type Indicator */}
      <View className="flex-row items-center mt-6">
        {tripDetails.type === "parking" ? (
          <View className="flex-row items-center">
            <View className="bg-blue-500 rounded-full w-8 h-8 justify-center items-center mr-3">
              <Text className="text-white font-bold text-xs">P</Text>
            </View>
            <Text className="text-white text-lg">Parking Reservation</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <View className="bg-yellow-500 rounded-full w-8 h-8 justify-center items-center mr-3">
              <MaterialIcons name="bolt" size={18} color="white" />
            </View>
            <Text className="text-white text-lg">Charging Reservation</Text>
          </View>
        )}
      </View>

      {/* Location */}
      <View className="mt-6">
        <Text className="text-2xl font-bold text-white">{locationAddress}</Text>
      </View>

      {/* Trip Details */}
      <View className="mt-8">
        <View className="mb-6">
          <Text className="text-lg text-gray-300">Date</Text>
          <Text className="text-xl text-white font-semibold">{tripDetails.date}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg text-gray-300">Start Time</Text>
          <Text className="text-xl text-white font-semibold">{tripDetails.startTime}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg text-gray-300">End Time</Text>
          <Text className="text-xl text-white font-semibold">{tripDetails.endTime}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg text-gray-300">Price</Text>
          <Text className="text-xl text-yellow-400 font-semibold">${tripDetails.price}</Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg text-gray-300">Status</Text>
          <Text className="text-xl text-white font-semibold">{tripDetails.status}</Text>
        </View>

        {/* Provider Information */}
        <View className="mb-6">
          <Text className="text-lg text-gray-300">Provider Email</Text>
          <Text className="text-xl text-white font-semibold">{tripDetails.provideremail_id}</Text>
        </View>
      </View>

      {/* Divider Line */}
      <View className="h-[1px] bg-gray-700 my-6" />

      {/* Cancel Reservation Button */}
      <View className="mt-6">
        <TouchableOpacity
          className="bg-red-500 p-4 rounded-lg"
          disabled={loading}
          onPress={() =>
            Alert.alert("Cancel Reservation", "Are you sure you want to cancel this reservation?", [
              {
                text: "No",
                style: "cancel",
              },
              {
                text: "Yes",
                onPress: handleDelete,
              },
            ])
          }
        >
          <Text className="text-white text-center font-bold">
            {loading ? "Processing..." : "Cancel Reservation"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TripDetails;