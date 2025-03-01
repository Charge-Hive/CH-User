import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from "expo-router";
import { useSavedReservations } from "../SavedReservationsContext";

// Define the structure of a reservation
type Reservation = {
  parking_transaction_id: string;
  title: string;
  date: string;
  from_time: string;
  to_time: string;
  price: string;
  status: "Active" | "Completed";
  parking_id: string;
};

const Saved = () => {
  const { savedReservations, removeSavedReservation } = useSavedReservations();
  const router = useRouter();

  // Function to remove reservation from saved
  const removeReservation = async (reservationId: string) => {
    try {
      await removeSavedReservation(reservationId);
    } catch (error) {
      console.error('Error removing saved reservation:', error);
      Alert.alert('Error', 'Could not remove saved reservation');
    }
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        <View className=" w-full mt-14 px-6">
          <Text className="text-yellow-400 text-3xl font-bold mb-4">
            Saved Spots
          </Text>

          {savedReservations.length === 0 ? (
            <Text className="text-gray-400 text-center">
              No saved spots yet.
            </Text>
          ) : (
            savedReservations.map((trip, index) => (
              <View 
                key={trip.parking_transaction_id || `trip-${index}`} 
                className="bg-gray-800 p-4 rounded-lg mb-4"
              >
                {/* Title and Status */}
                <View className="flex flex-row justify-between items-center">
                  <Text className="text-white text-lg text-wrap flex-1 font-bold">{trip.title}</Text>
                  <View className="flex-row items-center">
                    <Text className="bg-yellow-400 text-black px-2 py-1 mr-2 rounded text-sm font-bold">
                      {trip.status}
                    </Text>
                    <TouchableOpacity onPress={() => removeReservation(trip.parking_transaction_id)}>
                      <FontAwesome name="bookmark" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* View Details Button - Only show for Active trips */}
                {trip.status === "Active" && (
                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: "/(tripDetails)/tripDetails",
                        params: { 
                          tripId: trip.parking_transaction_id, 
                          totalFee: trip.price 
                        },
                      });
                    }}
                    className="mt-2"
                  >
                    <Text className="text-yellow-400 text-sm font-semibold">View Details</Text>
                  </TouchableOpacity>
                )}

                {/* Date and Time */}
                <Text className="text-gray-400 mt-1">📅 {trip.date}</Text>
                <Text className="text-gray-400 mt-2">⏰ {trip.from_time} - {trip.to_time}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Saved;