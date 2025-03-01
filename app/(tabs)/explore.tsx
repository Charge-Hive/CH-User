import React, { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View, Text, ScrollView, TextInput, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { supabase } from "../supabaseAccess"; // Import your Supabase client

const Explore = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chargingStations, setChargingStations] = useState<any[]>([]);
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [parkingLoading, setParkingLoading] = useState(true);
  const [chargingLoading, setChargingLoading] = useState(true);
  const router = useRouter();

  // get your current location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          Alert.alert("Permission Denied", "Please enable location access to use this feature.");
          setLocationLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setLocationLoading(false);
      } catch (error) {
        console.error("Error getting location:", error);
        setErrorMsg("Failed to get location");
        setLocationLoading(false);
      }
    })();
  }, []);

  // Fetch parking spots from Supabase
  useEffect(() => {
    const fetchParkingSpots = async () => {
      try {
        const { data, error } = await supabase.from('Parking').select('*');
        if (error) {
          console.log('Error fetching parking locations', error);
          setParkingLoading(false);
          return;
        }
        
        console.log(`Fetched ${data?.length || 0} parking spots`);
        
        const formattedData = data.map((spot) => ({
          id: spot.parking_id,
          latitude: parseFloat(spot.latitude),
          longitude: parseFloat(spot.longitude),
          title: spot.address,
          price: "$2/hr",
          type: "parking", // Adding a type to differentiate between parking and charging
          distance: "unknown",
        }));
        setParkingSpots(formattedData);
      } catch (error) {
        console.error("Error in fetchParkingSpots:", error);
      } finally {
        setParkingLoading(false);
      }
    };
    
    fetchParkingSpots();
  }, []);

  // Fetch charging stations from Supabase
  useEffect(() => {
    const fetchChargingStations = async () => {
      try {
        const { data, error } = await supabase.from('Chargers').select('*');
        if (error) {
          console.log('Error fetching charging locations', error);
          setChargingLoading(false);
          return;
        }
        
        console.log(`Fetched ${data?.length || 0} charging stations`);
        
        // Check if we got any data
        if (data && data.length > 0) {
          const formattedData = data.map((charger) => ({
            id: charger.charger_id,
            latitude: parseFloat(charger.latitude),
            longitude: parseFloat(charger.longitude),
            title: charger.address,
            price: "$2/hr",
            type: "charging",
            distance: "unknown",
            watts: charger.average_watts || "7.2kW", // Default value if not provided
          }));
          setChargingStations(formattedData);
        }
      } catch (error) {
        console.error("Error in fetchChargingStations:", error);
      } finally {
        setChargingLoading(false);
      }
    };
    
    fetchChargingStations();
  }, []);
  
  const handleReservePress = (station: any) => {
    router.push({
      pathname: "/reserve",
      params: { station: JSON.stringify(station) },
    });
  };
  
  // Render marker for parking spots (P icon)
  const renderParkingMarker = (spot: any) => {
    return (
      <Marker
        key={spot.id}
        coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
        title={spot.title}
        description="Tap to reserve a spot"
        onPress={() => handleReservePress(spot)}
      >
        <View className="bg-blue-500 p-1 rounded-full border border-white w-8 h-8 justify-center items-center">
          <Text className="text-white font-bold">P</Text>
        </View>
      </Marker>
    );
  };
  
  // Render marker for charging stations (lightning bolt icon)
  const renderChargingMarker = (charger: any) => {
    return (
      <Marker
        key={charger.id}
        coordinate={{ latitude: charger.latitude, longitude: charger.longitude }}
        title={charger.title}
        description="Tap to reserve a charging station"
        onPress={() => handleReservePress(charger)}
      >
        <View className="items-center justify-center">
          {/* Background circle */}
          <View className="bg-yellow-500 rounded-full border border-white w-8 h-8 justify-center items-center absolute">
            {/* This creates the yellow background circle */}
          </View>
          
          {/* Oversized bolt that extends beyond the circle */}
          <MaterialIcons name="bolt" size={30} color="white" />
        </View>
      </Marker>
    );
  };

  // Determine if everything is still loading
  const isLoading = locationLoading || (chargingLoading && parkingLoading);

  if (errorMsg) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <Text className="text-white text-lg">{errorMsg}</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !location) {
    return (
      <SafeAreaView className="bg-primary flex-1 justify-center items-center">
        <Text className="text-white text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Combine both parkingSpots and chargingStations for the card list
  const allLocations = [...parkingSpots, ...chargingStations];

  return (
    <View className="bg-primary h-full">
      <View className="flex flex-row justify-between items-center mt-16 px-4">
        <View className="flex flex-row items-center mt-6">
          <MaterialIcons name="electric-bolt" size={30} color="#facc15" />
          <Text className="text-3xl ml-3 font-bold text-white">ChargeHive</Text>
        </View>
        <MaterialIcons name="notifications-none" size={30} color="white" />
      </View>

      {/* Search Bar */}
      <View className="border-2 gap-4 mt-4 border-black-200 mx-3 h-14 px-4 rounded-2xl items-center flex flex-row">
        <Ionicons name="search" size={16} color="white" />
        <TextInput className="text-base text-white flex-1" placeholder="Search Locations..." placeholderTextColor="#A0A0A0" />
      </View>

      {/* Map Section */}
      <View className="flex-1 mt-2">
        <MapView
          style={{ flex: 1, width: "100%", height: "100%" }}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* User's Current Location Marker */}
          <Marker 
            coordinate={{ 
              latitude: location.coords.latitude, 
              longitude: location.coords.longitude 
            }} 
            pinColor="yellow" 
          />

          {/* Parking Spot Markers with custom 'P' icon */}
          {parkingSpots.map(spot => renderParkingMarker(spot))}
          
          {/* Charging Station Markers with lightning bolt icon */}
          {chargingStations.map(charger => renderChargingMarker(charger))}
        </MapView>

        {/* Location Listings */}
        <View className="absolute bottom-4 left-0 right-0">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {allLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                onPress={() => handleReservePress(location)}
                className="bg-gray-800 p-4 rounded-lg mr-4 w-80 h-48 shadow-lg"
              >
                <View className="flex flex-col justify-between h-full">
                  {/* Header with title and price */}
                  <View className="mb-1">
                    <View className="flex flex-row justify-between items-start">
                      <View className="flex-1 mr-2">
                        <Text 
                          className="text-white text-lg font-bold" 
                          numberOfLines={2} 
                          ellipsizeMode="tail"
                        >
                          {location.title}
                        </Text>
                      </View>
                      <View>
                        <Text className="bg-yellow-500 text-black px-2 py-1 rounded text-sm font-bold">
                          {location.price}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 mt-1">{location.distance} away</Text>
                  </View>
                  
                  {/* Divider */}
                  <View className="border-t border-gray-700 my-2" />
                  
                  {/* Footer with type indicator */}
                  <View className="mt-auto">
                    {location.type === "parking" ? (
                      <View className="flex-row items-center">
                        <View className="bg-blue-500 rounded-full w-6 h-6 justify-center items-center mr-2">
                          <Text className="text-white font-bold text-xs">P</Text>
                        </View>
                        <Text className="text-blue-400 font-semibold">Parking Available</Text>
                      </View>
                    ) : (
                      <View>
                        <View className="flex-row items-center">
                          <View className="bg-yellow-500 rounded-full w-6 h-6 justify-center items-center mr-2">
                            <MaterialIcons name="bolt" size={14} color="white" />
                          </View>
                          <Text className="text-yellow-400 font-semibold">Charging Available</Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-8 mt-1">{location.watts} Average Power</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default Explore;