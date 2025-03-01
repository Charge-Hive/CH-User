import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { supabase } from "../supabaseAccess";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSavedReservations } from "../SavedReservationsContext";

// Define the structure of a reservation
type Reservation = {
  id?: string; // Primary key from either Parking_Transactions or Charging_Transaction
  parking_transaction_id?: string; 
  charging_transaction_id?: string;
  title: string;
  date: string;
  from_time: string;
  to_time: string;
  price: string;
  status: "Active" | "Completed";
  parking_id?: string;
  charger_id?: string;
  type: "parking" | "charging"; // Field to distinguish type
  isSaved?: boolean;
};

const Trips = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedTab, setSelectedTab] = useState<"Active" | "Completed">("Active");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { addSavedReservation, removeSavedReservation, isSaved } = useSavedReservations();

  const router = useRouter();

  const toggleReservation = async (trip: Reservation) => {
    try {
      // Use the appropriate ID field based on reservation type
      let reservationId = trip.id || trip.parking_transaction_id || trip.charging_transaction_id;
      
      // If we still don't have an ID, generate one from the combination of properties
      if (!reservationId) {
        console.log("No standard ID found, creating synthetic ID for:", trip);
        // Create a synthetic ID from date + times + type
        reservationId = `${trip.type}-${trip.date}-${trip.from_time}-${trip.to_time}`;
        console.log("Created synthetic ID:", reservationId);
      }
      
      if (isSaved(reservationId)) {
        await removeSavedReservation(reservationId);
      } else {
        // Create a copy of the trip without optional properties
        const savedTrip = {
          id: trip.id || '',
          parking_transaction_id: trip.parking_transaction_id || '',
          charging_transaction_id: trip.charging_transaction_id || '',
          title: trip.title,
          date: trip.date,
          from_time: trip.from_time,
          to_time: trip.to_time,
          price: trip.price,
          status: trip.status,
          type: trip.type,
          parking_id: trip.parking_id || '',
          charger_id: trip.charger_id || ''
        };
        await addSavedReservation(savedTrip);
      }
    } catch (error) {
      console.error('Error toggling reservation:', error);
    }
  };

  useEffect(() => {
    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchReservations();
    }
  }, [userEmail, selectedTab]);

  const fetchUserEmail = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        Alert.alert("Error", "Please login to view your trips");
        router.replace("/sign-in");
      }
    } catch (error) {
      console.error("Error in fetchUserEmail:", error);
    }
  };

  // Function to check if a reservation is completed based on date and time
  const isReservationCompleted = (dateStr: string, timeStr: string): boolean => {
    try {
      const now = new Date();
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num));
      const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
      
      const reservationEndTime = new Date(year, month - 1, day, hours, minutes);
      
      return now > reservationEndTime;
    } catch (error) {
      console.error("Error in isReservationCompleted:", error);
      return false;
    }
  };

  // Helper function to calculate total fee
  const calculateTotalFee = (startTime: string, endTime: string): string => {
    // Calculate hours difference for pricing
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    const hoursDiff = Math.abs(
      (end.getHours() - start.getHours()) % 24
    );
    
    const hourlyRate = 2; // $2 per hour
    const baseFee = (hoursDiff * hourlyRate).toFixed(2);
    const serviceFee = "0.25";
    const totalFee = (
      parseFloat(baseFee) + parseFloat(serviceFee)
    ).toFixed(2);
    
    return totalFee;
  };

  // Helper function to fetch location details (common for both types)
// Helper function to fetch location details (common for both types)
// Helper function to fetch location details (common for both types)
const fetchLocationTitle = async (locationType: "parking" | "charging", locationId: string): Promise<string> => {
  try {
    console.log(`Fetching ${locationType} details for ID:`, locationId);
    
    if (!locationId) {
      console.error(`${locationType} ID is null or undefined`);
      return locationType === "parking" ? "Unknown Location" : "Unknown Charging Station";
    }
    
    const locationTable = locationType === "parking" ? "Parking" : "Chargers";
    const idColumn = locationType === "parking" ? "parking_id" : "charger_id";
    
    // Get all columns to debug what's available
    const { data, error } = await supabase
      .from(locationTable)
      .select("*")
      .eq(idColumn, locationId)
      .single();

    console.log(`Query for ${locationTable} where ${idColumn} = ${locationId}`);
    
    if (error) {
      console.error(`Error fetching ${locationType} details:`, error.message);
      console.error(`Error code:`, error.code);
      
      // Try an alternative approach - query without the single() method to see all matches
      console.log(`Trying alternate query without single() for ${locationTable}`);
      const { data: alternativeData, error: alternativeError } = await supabase
        .from(locationTable)
        .select("*")
        .eq(idColumn, locationId);
      
      if (alternativeError) {
        console.error(`Alternative query also failed:`, alternativeError);
      } else {
        console.log(`Alternative query found ${alternativeData?.length || 0} items`);
        if (alternativeData && alternativeData.length > 0) {
          console.log(`First match:`, JSON.stringify(alternativeData[0]));
        }
      }
      
      return locationType === "parking" ? "Unknown Location" : "Unknown Charging Station";
    }
    
    if (!data) {
      console.error(`No data found for ${locationType} with ID ${locationId}`);
      return locationType === "parking" ? "Unknown Location" : "Unknown Charging Station";
    }
    
    console.log(`Data found for ${locationType}:`, JSON.stringify(data));
    
    // Log all keys in the data object to see what's available
    console.log(`Available fields for ${locationType}:`, Object.keys(data));
    
    // For charging stations, check all possible field names for address
    if (locationType === "charging") {
      // Check all potential field names that might contain the address
      if (data.address) {
        console.log("Found charging station address:", data.address);
        return data.address;
      } else if (data.title) {
        console.log("Found charging station title:", data.title);
        return data.title;
      } else if (data.location) {
        console.log("Found charging station location:", data.location);
        return data.location;
      } else {
        // Loop through all fields to find potential address/location fields
        for (const [key, value] of Object.entries(data)) {
          if (typeof value === 'string' && 
              (key.includes('addr') || key.includes('location') || key.includes('place'))) {
            console.log(`Found potential address in field '${key}':`, value);
            return value;
          }
        }
        console.log("No address-like field found in data:", data);
      }
    }
    
    // For parking, use the address field
    if (locationType === "parking") {
      if (data.address) {
        console.log("Found parking location address:", data.address);
        return data.address;
      } else {
        console.log("No address found in data:", data);
      }
    }
    
    // Fallback
    return locationType === "parking" ? "Unknown Location" : "Unknown Charging Station";
  } catch (error) {
    console.error(`Error in fetchLocationTitle for ${locationType}:`, error);
    return locationType === "parking" ? "Unknown Location" : "Unknown Charging Station";
  }
};

const fetchReservations = async () => {
  if (!userEmail) return;
  
  setLoading(true);
  try {
    // Array to store all reservations (both parking and charging)
    const allReservations: Reservation[] = [];

    // 1. Fetch Parking Reservations
    const { data: parkingData, error: parkingError } = await supabase
      .from("Parking_Transactions")
      .select("*")
      .eq("useremail_id", userEmail);

    if (parkingError) {
      console.error("Error fetching parking transactions:", parkingError);
    }

    // Process parking reservations if any exist
    if (parkingData && parkingData.length > 0) {
      console.log("Found parking transactions:", parkingData.length);
      for (const transaction of parkingData) {
        try {
          // Determine status based on date and time
          const status = isReservationCompleted(transaction.date, transaction.to_time) 
            ? "Completed" : "Active";
            
          // Calculate total fee
          const totalFee = calculateTotalFee(transaction.from_time, transaction.to_time);
          
          // Get location title
          let title = "Unknown Location";
          if (transaction.parking_id) {
            title = await fetchLocationTitle("parking", transaction.parking_id);
          }

          allReservations.push({
            id: transaction.id,
            parking_transaction_id: transaction.id || transaction.parking_transaction_id,
            title: title,
            date: transaction.date,
            from_time: transaction.from_time,
            to_time: transaction.to_time,
            price: `$${totalFee}`,
            status: status,
            type: "parking",
            parking_id: transaction.parking_id
          });
        } catch (err) {
          console.error("Error processing parking transaction:", err);
        }
      }
    }

    // 2. Fetch Charging Reservations
    const { data: chargingData, error: chargingError } = await supabase
      .from("Charging_Transaction")
      .select("*")
      .eq("useremail_id", userEmail);
      
    console.log("Charging data found:", chargingData ? chargingData.length : 0, "records");
    if (chargingData && chargingData.length > 0) {
      console.log("First charging record:", JSON.stringify(chargingData[0]));
      
      // Log all fields to check for charger_id
      console.log("Available fields in charging record:", Object.keys(chargingData[0]));
    }

    if (chargingError) {
      console.error("Error fetching charging transactions:", chargingError);
    }

    // Process charging reservations if any exist
    if (chargingData && chargingData.length > 0) {
      console.log("Processing charging transactions:", chargingData.length);
      for (const transaction of chargingData) {
        try {
          console.log("Processing charging transaction:", JSON.stringify(transaction));
          
          // Determine status based on date and time
          const status = isReservationCompleted(transaction.date, transaction.to_time) 
            ? "Completed" : "Active";
            
          // Calculate total fee
          const totalFee = calculateTotalFee(transaction.from_time, transaction.to_time);
          
          // Get location title for charging station
          let title = "Unknown Charging Station";
          
          // Try different properties that might hold the charger ID
          const chargerId = transaction.charger_id || transaction.charging_transaction_id;
          
          console.log("Trying to use charger_id:", chargerId);
          
          if (chargerId) {
            console.log("Fetching title for charger ID:", chargerId);
            title = await fetchLocationTitle("charging", chargerId);
            console.log("Fetched charging station title:", title);
          } else {
            console.log("No charger_id found in transaction:", JSON.stringify(transaction));
            
            // As a fallback, try to convert transaction.id to a string if it exists
            if (transaction.id) {
              console.log("Trying with transaction.id as fallback:", transaction.id);
              const fallbackId = String(transaction.id);
              title = await fetchLocationTitle("charging", fallbackId);
              console.log("Fetched charging station title with fallback ID:", title);
            }
          }

          // Create a reservation object with ALL available IDs to ensure we have something to reference
          allReservations.push({
            id: transaction.id,
            charging_transaction_id: transaction.id,
            title: title,
            date: transaction.date,
            from_time: transaction.from_time,
            to_time: transaction.to_time,
            price: `$${totalFee}`,
            status: status,
            type: "charging",
            charger_id: chargerId // Use the same charger_id we found above
          });
        } catch (err) {
          console.error("Error processing charging transaction:", err);
        }
      }
    }

    console.log("Total reservations found:", allReservations.length);
    setReservations(allReservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
  } finally {
    setLoading(false);
  }
};
  // Filter reservations based on selected tab
  const filteredReservations = reservations.filter((trip) => trip.status === selectedTab);

  // Handle deletion of a reservation
  const handleDelete = (trip: Reservation) => {
    const reservationId = trip.id;
    const reservationType = trip.type;
    const tableName = reservationType === "parking" ? "Parking_Transactions" : "Charging_Transaction";
    
    if (!reservationId) {
      Alert.alert("Error", "Reservation ID not found");
      return;
    }
    
    Alert.alert("Delete Reservation", "Are you sure you want to delete this reservation?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from(tableName)
              .delete()
              .eq("id", reservationId);  

            if (error) {
              console.error(`Error deleting from ${tableName}:`, error);
              Alert.alert("Error", "Failed to delete reservation");
              return;
            }

            // Update the local state after successful deletion
            const updatedReservations = reservations.filter(
              (reservation) => reservation.id !== reservationId
            );
            setReservations(updatedReservations);
          } catch (error) {
            console.error("Error deleting reservation:", error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="bg-primary h-full justify-center items-center">
        <ActivityIndicator size="large" color="#FBBF24" />
      </View>
    );
  }

  return (
    <View className="bg-primary h-full p-6">
      <Text className="text-3xl font-bold text-yellow-400 mb-4 mt-16">My Trips</Text>

      {/* Toggle Tabs */}
      <View className="flex flex-row justify-center mb-4">
        {["Active", "Completed"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab as "Active" | "Completed")}
            className="px-4 py-2 mx-2"
          >
            <Text
              className={`text-lg font-bold ${
                selectedTab === tab ? "text-yellow-400" : "text-gray-400"
              }`}
            >
              {tab}
            </Text>
            {selectedTab === tab && <View className="h-1 bg-yellow-400 mt-1 rounded-full"></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        onPress={fetchReservations} 
        className="absolute top-16 right-6"
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>

      {/* Reservations List */}
      <ScrollView>
        {filteredReservations.length === 0 ? (
          <Text className="text-gray-400 text-center">
            No {selectedTab.toLowerCase()} trips yet.
          </Text>
        ) : (
          filteredReservations.map((trip, index) => {
            // Determine the ID to use for key and operations
            const tripId = trip.id || trip.parking_transaction_id || trip.charging_transaction_id || `trip-${index}`;
            
            return (
              <View 
                key={tripId} 
                className="bg-gray-800 p-4 rounded-lg mb-4 shadow-md"
              >
                {/* Header with Type and Bookmark */}
                <View className="flex-row justify-between items-start mb-3">
                  {/* Reservation Type Indicator */}
                  <View className="flex-row items-center flex-1">
                    {trip.type === "parking" ? (
                      <View className="bg-blue-500 rounded-full w-7 h-7 justify-center items-center mr-3">
                        <Text className="text-white font-bold text-xs">P</Text>
                      </View>
                    ) : (
                      <View className="bg-yellow-500 rounded-full w-7 h-7 justify-center items-center mr-3">
                        <MaterialIcons name="bolt" size={16} color="white" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold" numberOfLines={2}>
                        {trip.title}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {trip.type === "parking" 
                          ? "Reserved for Parking" 
                          : "Reserved for EV Charging"}
                      </Text>
                    </View>
                  </View>

                  {/* Status and Bookmark */}
                  <View className="flex-row items-center">
                    <View className="mr-2">
                      <Text className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                        {trip.status}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleReservation(trip)}>
                      <FontAwesome 
                        name={isSaved(tripId) ? "bookmark" : "bookmark-o"} 
                        size={20} 
                        color="white" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reservation Details */}
                <View className="bg-gray-700 rounded-lg p-3 mt-2">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar" size={16} color="#FBBF24" />
                    <Text className="text-gray-200 ml-2">
                      {trip.date}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time" size={16} color="#FBBF24" />
                    <Text className="text-gray-200 ml-2">
                      {trip.from_time} - {trip.to_time}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="cash" size={16} color="#FBBF24" />
                    <Text className="text-white ml-2 font-bold">
                      {trip.price}
                    </Text>
                  </View>
                </View>

                {/* View Details Button - Only show for Active trips */}
                {trip.status === "Active" && (
                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: "/(tripDetails)/tripDetails",
                        params: { 
                          tripId: tripId, 
                          totalFee: trip.price,
                          type: trip.type
                        },
                      });
                    }}
                    className="mt-3 self-start"
                  >
                    <Text className="text-yellow-400 text-sm font-semibold">
                      View Details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default Trips;