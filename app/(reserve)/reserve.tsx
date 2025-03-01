import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Dropdown } from 'react-native-element-dropdown';
import CalendarPicker from 'react-native-calendar-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Entypo from '@expo/vector-icons/Entypo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseAccess";

// Define type for station details
type StationDetails = {
  id: string;
  title: string;
  price: string;
  distance: string;
  latitude: number;
  longitude: number;
  type: string; // Differentiates between parking and charging
  email_id?: string; // Provider's email ID
  watts?: string; // Average power for charging stations
};

type ParkingTransactionData = {
  useremail_id: string;
  provideremail_id: string;
  date: string;
  from_time: string;
  to_time: string;
  provider_earned_rewards: string;
  user_earned_rewards: string;
  transaction_link: string;
  nft_id: string;
  provider_account_addr: string;
  provider_evm_addr: string;
  user_account_addr: string;
  user_evm_addr: string;
  parking_id?: string;  // Optional property
  charger_id?: string;  // Optional property
};

type ChargingTransactionData = {
  provideremail_id: string;
  useremail_id: string;
  date: string;
  from_time: string;
  to_time: string;
  provider_earned_rewards?: string;
  user_earned_rewards?: string;
  nft_id?: string;
  provider_account_addr: string;
  provider_evm_addr: string;
  user_account_addr: string;
  user_evm_addr: string;
  did?: string;
  session_id?: string;
  status?: string;
  charger_id: string; // Important: charger_id is required
};

const vehicleOptions = [
  { label: "Tesla Model 3", value: "Tesla Model 3" },
  { label: "Tesla Model Y", value: "Tesla Model Y" },
  { label: "Nissan Leaf", value: "Nissan Leaf" },
];

const Reserve = () => {
  const router = useRouter();
  const { station } = useLocalSearchParams<{ station: string }>();
  const [selectedVehicle, setSelectedVehicle] = useState("Tesla Model 3");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isStartTimePickerVisible, setIsStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setIsEndTimePickerVisible] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerEmail, setProviderEmail] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [parkingFee, setParkingFee] = useState<string>("--");
  const [serviceFee, setServiceFee] = useState<string>("0.25");
  const [totalFee, setTotalFee] = useState<string>("--");
  const [locationImages, setLocationImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [averagePower, setAveragePower] = useState<string | null>(null);

  // Parse the station object passed from explore.tsx
  const parsedStation: StationDetails = station ? JSON.parse(station) : null;

  // Fetch user details on component mount
  useEffect(() => {
    fetchUserProfile();
    if (parsedStation && parsedStation.id) {
      setLocationId(parsedStation.id);
      if (parsedStation.type === "parking") {
        fetchProviderEmailFromParking(parsedStation.id);
        fetchParkingImages(parsedStation.id);
      } else if (parsedStation.type === "charging") {
        fetchProviderEmailFromCharging(parsedStation.id);
        fetchChargingImages(parsedStation.id);
        if (parsedStation.watts) {
          setAveragePower(parsedStation.watts);
        }
      }
    }
  }, []);

  // Fetch the current user's profile from Supabase
  const fetchUserProfile = async () => {
    try {
      console.log("Fetching user profile...");
      
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting auth user:", userError);
        return;
      }
      
      if (user) {
        console.log("Found authenticated user:", user.email);
        setUserEmail(user.email || "");
        
        // Fetch additional user details from the user table
        const { data, error } = await supabase
          .from("user")
          .select("email_id")
          .eq("email_id", user.email)
          .single();
          
        if (error) {
          console.error("Error fetching user data:", error);
        } else if (data) {
          console.log("User data retrieved:", data);
          
          // Set email as a fallback in case the auth user email is empty
          if (!user.email && data.email_id) {
            setUserEmail(data.email_id);
          }
        } else {
          console.log("No user data found in database");
        }
      } else {
        console.log("No authenticated user found");
        Alert.alert("Error", "Please login to make reservations");
        router.replace("/sign-in");
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  // Fetch provider email from Parking table
  const fetchProviderEmailFromParking = async (parkingId: string) => {
    try {
      const { data, error } = await supabase
        .from("Parking")
        .select("email_id")
        .eq("parking_id", parkingId)
        .single();

      if (error) {
        console.error("Error fetching provider email from Parking:", error);
      } else if (data && data.email_id) {
        console.log("Provider email retrieved from Parking:", data.email_id);
        setProviderEmail(data.email_id);
      }
    } catch (error) {
      console.error("Error in fetchProviderEmailFromParking:", error);
    }
  };

  // Fetch provider email from Chargers table
  const fetchProviderEmailFromCharging = async (chargerId: string) => {
    try {
      const { data, error } = await supabase
        .from("Chargers")
        .select("email_id")
        .eq("charger_id", chargerId)
        .single();

      if (error) {
        console.error("Error fetching provider email from Chargers:", error);
      } else if (data && data.email_id) {
        console.log("Provider email retrieved from Chargers:", data.email_id);
        setProviderEmail(data.email_id);
      }
    } catch (error) {
      console.error("Error in fetchProviderEmailFromCharging:", error);
    }
  };

  // Fetch parking images
  const fetchParkingImages = async (parkingId: string) => {
    try {
      const { data, error } = await supabase
        .from("Parking")
        .select("parkingspot_image1_url, parkingspot_image2_url")
        .eq("parking_id", parkingId)
        .single();

      if (error) {
        console.error("Error fetching parking images:", error);
        return;
      }

      const images = [];
      if (data.parkingspot_image1_url) images.push(data.parkingspot_image1_url);
      if (data.parkingspot_image2_url) images.push(data.parkingspot_image2_url);
      
      setLocationImages(images);
    } catch (error) {
      console.error("Error in fetchParkingImages:", error);
    }
  };

  // Fetch charging station images
  const fetchChargingImages = async (chargerId: string) => {
    try {
      const { data, error } = await supabase
        .from("Chargers")
        .select("chargingspot_image1_url, chargingspot_image2_url")
        .eq("charger_id", chargerId)
        .single();

      if (error) {
        console.error("Error fetching charging station images:", error);
        return;
      }

      const images = [];
      if (data.chargingspot_image1_url) images.push(data.chargingspot_image1_url);
      if (data.chargingspot_image2_url) images.push(data.chargingspot_image2_url);
      
      setLocationImages(images);
    } catch (error) {
      console.error("Error in fetchChargingImages:", error);
    }
  };

  if (!parsedStation) {
    return (
      <View className="bg-primary h-full justify-center items-center">
        <Text className="text-white text-lg">No station data available.</Text>
      </View>
    );
  }

  // Handle date selection from the calendar
  const handleDateSelect = (date: Date) => {
    // Format the date as YYYY-MM-DD for consistency with varchar in database
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setSelectedDate(formattedDate);
    setIsCalendarVisible(false); // Hide the calendar after selection
  };

  // Handle time selection (start and end time)
  const handleStartTimeConfirm = (time: Date) => {
    // Round to nearest hour
    const roundedTime = new Date(time);
    roundedTime.setMinutes(0);
    roundedTime.setSeconds(0);
    
    // Format time as HH:MM for database consistency
    const hours = String(roundedTime.getHours()).padStart(2, '0');
    const formattedTime = `${hours}:00`;
    
    setStartTime(formattedTime);
    setIsStartTimePickerVisible(false);
  };
  
  const handleEndTimeConfirm = (time: Date) => {
    // Round to nearest hour
    const roundedTime = new Date(time);
    roundedTime.setMinutes(0);
    roundedTime.setSeconds(0);
    
    // Format time as HH:MM for database consistency
    const hours = String(roundedTime.getHours()).padStart(2, '0');
    const formattedTime = `${hours}:00`;
    
    setEndTime(formattedTime);
    setIsEndTimePickerVisible(false);
  };

  const handleConfirmReservation = async () => {
    // Input validation
    if (!selectedDate || !startTime || !endTime) {
      Alert.alert("Error", "Please select date, start time, and end time.");
      return;
    }

    if (!userEmail) {
      Alert.alert("Error", "User email not found. Please log in again.");
      return;
    }

    if (!providerEmail) {
      Alert.alert("Error", "Provider information not found.");
      return;
    }

    if (!locationId) {
      Alert.alert("Error", "Location ID not found.");
      return;
    }

    // Validate time slots
    if (startTime >= endTime) {
      Alert.alert("Error", "End time must be later than start time.");
      return;
    }

    setLoading(true);

    try {
      // Process based on station type (parking or charging)
      if (parsedStation.type === "parking") {
        // Handle parking reservation
        await handleParkingReservation();
      } else {
        // Handle charging reservation
        await handleChargingReservation();
      }

      // Save to AsyncStorage for local access (common for both parking and charging)
      const reservation = {
        title: parsedStation.title,
        date: selectedDate,
        startTime,
        endTime,
        price: totalFee,
        status: "Active",
        type: parsedStation.type
      };

      // Get existing reservations from AsyncStorage
      const existingReservations = await AsyncStorage.getItem("reservations");
      const reservations = existingReservations ? JSON.parse(existingReservations) : [];

      // Add the new reservation
      reservations.push(reservation);

      // Save back to storage
      await AsyncStorage.setItem("reservations", JSON.stringify(reservations));

      // Show success message
      Alert.alert("Success", "Reservation confirmed successfully!", [
        { 
          text: "OK", 
          onPress: () => router.push({
            pathname: "/(tabs)/trips",
            params: { totalFee: totalFee.toString() } 
          }) 
        }
      ]);
    } catch (error) {
      console.error("Error saving reservation:", error);
      Alert.alert("Error", "Failed to save reservation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle parking reservation specifically
  const handleParkingReservation = async () => {
    // Input validation
    if (!userEmail || !providerEmail || !locationId || !selectedDate || !startTime || !endTime) {
      throw new Error("Missing required data for reservation");
    }
    
    // Check for existing reservations with conflicting time slots
    const { data: conflictingReservations, error: conflictError } = await supabase
      .from("Parking_Transactions")
      .select("*")
      .eq("parking_id", locationId)
      .eq("date", selectedDate)
      .or(
        `from_time.lte.${endTime},to_time.gte.${startTime}`
      );

    if (conflictError) {
      console.error("Error checking reservation conflicts:", conflictError);
      throw new Error("Failed to check reservation availability.");
    }

    // If there are any conflicting reservations, show an alert
    if (conflictingReservations && conflictingReservations.length > 0) {
      Alert.alert(
        "Reservation Conflict", 
        "This time slot is already booked. Please choose a different time."
      );
      throw new Error("Time slot conflict");
    }

    // Fetch provider account addresses
    const { data: providerData, error: providerError } = await supabase
      .from("Parking")
      .select("provider_account_addr, provider_evm_addr")
      .eq("parking_id", locationId)
      .single();

    if (providerError) {
      console.error("Error fetching provider addresses from Parking:", providerError);
      throw new Error("Failed to fetch provider details.");
    }

    // Fetch user's Hedera account details
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("hedera_account_id, hedera_evm_addr")
      .eq("email_id", userEmail)
      .single();

    if (userError) {
      console.error("Error fetching user wallet details:", userError);
      throw new Error("Failed to fetch user wallet details.");
    }

    // Create transaction data object
    const transactionData: ParkingTransactionData = {
      useremail_id: userEmail,
      provideremail_id: providerEmail,
      date: selectedDate,
      from_time: startTime,
      to_time: endTime,
      provider_earned_rewards: "0",
      user_earned_rewards: "0",
      transaction_link: "",
      nft_id: "",
      provider_account_addr: providerData?.provider_account_addr || "",
      provider_evm_addr: providerData?.provider_evm_addr || "",
      user_account_addr: userData?.hedera_account_id || "",
      user_evm_addr: userData?.hedera_evm_addr || "",
      parking_id: locationId
    };

    // Insert the transaction
    const { data, error } = await supabase
      .from("Parking_Transactions")
      .insert([transactionData])
      .select();

    if (error) {
      console.error("Error saving parking transaction to Supabase:", error);
      throw new Error("Failed to save reservation.");
    }

    console.log("Parking transaction saved successfully to Supabase:", data);
    return data;
  };

  // Handle charging reservation specifically 
  // Handle charging reservation specifically
// Handle charging reservation specifically
const handleChargingReservation = async () => {
  // Input validation
  if (!userEmail || !providerEmail || !locationId || !selectedDate || !startTime || !endTime) {
    throw new Error("Missing required data for reservation");
  }
  
  console.log("Starting charging reservation with locationId:", locationId);
  
  // Check for existing charging reservations with conflicting time slots
  const { data: conflictingReservations, error: conflictError } = await supabase
    .from("Charging_Transaction")
    .select("*")
    .eq("charger_id", locationId) // Add charger_id to the conflict check
    .eq("date", selectedDate)
    .or(
      `from_time.lte.${endTime},to_time.gte.${startTime}`
    );

  if (conflictError) {
    console.error("Error checking charging reservation conflicts:", conflictError);
    throw new Error("Failed to check reservation availability.");
  }

  // If there are any conflicting reservations, show an alert
  if (conflictingReservations && conflictingReservations.length > 0) {
    Alert.alert(
      "Reservation Conflict", 
      "This time slot is already booked. Please choose a different time."
    );
    throw new Error("Time slot conflict");
  }

  // Double-check that we have a valid locationId
  if (!locationId) {
    console.error("LocationId is null or undefined");
    throw new Error("Missing charger ID for reservation");
  }

  console.log("About to fetch provider data for charger ID:", locationId);

  // Fetch provider account addresses from Chargers
  const { data: providerData, error: providerError } = await supabase
    .from("Chargers")
    .select("provider_account_addr, provider_evm_addr, address")
    .eq("charger_id", locationId)
    .single();

  if (providerError) {
    console.error("Error fetching provider addresses from Chargers:", providerError);
    throw new Error("Failed to fetch provider details.");
  }

  console.log("Provider data fetched successfully:", providerData);

  // Fetch user's Hedera account details
  const { data: userData, error: userError } = await supabase
    .from("user")
    .select("hedera_account_id, hedera_evm_addr")
    .eq("email_id", userEmail)
    .single();

  if (userError) {
    console.error("Error fetching user wallet details:", userError);
    throw new Error("Failed to fetch user wallet details.");
  }

  // Create charging transaction data object
  const chargingTransactionData = {
    provideremail_id: providerEmail,
    useremail_id: userEmail,
    date: selectedDate,
    from_time: startTime,
    to_time: endTime,
    provider_earned_rewards: "0",
    user_earned_rewards: "0",
    nft_id: "",
    provider_account_addr: providerData?.provider_account_addr || "",
    provider_evm_addr: providerData?.provider_evm_addr || "",
    user_account_addr: userData?.hedera_account_id || "",
    user_evm_addr: userData?.hedera_evm_addr || "",
    status: "Active",
    charger_id: locationId // Explicitly include the charger_id
  };

  console.log("Saving charging transaction with data:", chargingTransactionData);
  console.log("Charger ID being saved:", locationId);

  // Insert the charging transaction
  const { data, error } = await supabase
    .from("Charging_Transaction")
    .insert([chargingTransactionData])
    .select();

  if (error) {
    console.error("Error saving charging transaction to Supabase:", error);
    throw new Error("Failed to save charging reservation.");
  }

  console.log("Charging transaction saved successfully to Supabase:", data);
  console.log("Saved transaction ID:", data?.[0]?.id);
  console.log("Saved charger_id:", data?.[0]?.charger_id);
  
  return data;
};

  // Create a function to calculate pricing
  const calculatePricing = () => {
    if (startTime && endTime) {
      // Calculate hours difference
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      // Calculate hours, ensuring positive value
      const hoursDiff = Math.abs(
        (end.getHours() - start.getHours()) % 24
      );
      
      // Calculate fees
      const hourlyRate = 2; // $2 per hour
      const calculatedParkingFee = (hoursDiff * hourlyRate).toFixed(2);
      const calculatedServiceFee = "0.25";
      const calculatedTotal = (
        parseFloat(calculatedParkingFee) + parseFloat(calculatedServiceFee)
      ).toFixed(2);
      
      setParkingFee(calculatedParkingFee);
      setTotalFee(calculatedTotal);
    } else {
      // Reset to default
      setParkingFee("--");
      setTotalFee("--");
    }
  };

  // Call calculatePricing when start or end time changes
  useEffect(() => {
    calculatePricing();
  }, [startTime, endTime]);

  return (
    <ScrollView className="bg-primary h-full">
      <View className="gap-4 p-6">
        {/* Back Button and Title */}
        <View className="flex flex-row items-center gap-4 mt-2">
          <Ionicons name="arrow-back" size={24} color="white" onPress={() => router.back()} />
          <Text className="text-3xl font-bold text-white">Reserve {parsedStation.type === "parking" ? "ParkingSpot" : "Charger"}</Text>
        </View>

        {/* Station Details */}
        <View className="bg-gray-800 p-4 rounded-lg mt-2">
          <View className="flex flex-row items-center mt-2">
            <Text className="text-white text-lg flex-1 text-wrap font-bold">{parsedStation.title}</Text>
            <Text className="bg-yellow-500 ml-8 text-black px-2 py-1 rounded text-sm font-bold">
              {parsedStation.price.replace("/hr", "")}/hr
            </Text>
          </View>
          <Text className="text-gray-400 font-semibold mt-1">{parsedStation.distance} away</Text>
          
          {/* Show different indicator based on the type (parking or charging) */}
          {parsedStation.type === "parking" ? (
            <View className="flex-row items-center mt-2">
              <View className="bg-blue-500 rounded-full w-6 h-6 justify-center items-center mr-2">
                <Text className="text-white font-bold text-xs">P</Text>
              </View>
              <Text className="text-blue-400 font-semibold">Parking Available</Text>
            </View>
          ) : (
            <View className="flex-row items-center mt-2">
              <View className="bg-yellow-500 rounded-full w-6 h-6 justify-center items-center mr-2">
                <MaterialIcons name="bolt" size={14} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-yellow-400 font-semibold">Charging Available</Text>
                {averagePower && <Text className="text-gray-400 text-xs">{averagePower} Average Power</Text>}
              </View>
            </View>
          )}
        </View>

        {/* Date Picker */}
        <Text className="text-white font-bold mt-2">Date</Text>
        <View className="flex flex-row items-center bg-gray-800 rounded mt-2">
          <TextInput
            className="flex-1 text-white p-3"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="white"
            value={selectedDate || ""}
            editable={false} // Disable manual input
          />
          <TouchableOpacity
            className="p-3"
            onPress={() => setIsCalendarVisible(true)}
          >
            <AntDesign name="calendar" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Calendar Picker Modal */}
        <Modal
          visible={isCalendarVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCalendarVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-gray-800 p-4 rounded-lg w-full">
              <CalendarPicker
                onDateChange={handleDateSelect}
                selectedDayColor="#facc15"
                selectedDayTextColor="#000"
                todayBackgroundColor="#444"
                textStyle={{ color: 'white' }}
                previousTitleStyle={{ color: 'white' }}
                nextTitleStyle={{ color: 'white' }}
                minDate={new Date()} // Only future dates
              />
              <TouchableOpacity
                className="mt-4 p-2 bg-yellow-500 rounded-full"
                onPress={() => setIsCalendarVisible(false)}
              >
                <Text className="text-black text-center font-bold">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Images Section */}
        {locationImages.length > 0 && (
          <View>
            <Text className="text-white font-bold mt-2">Images</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mt-2"
            >
              {locationImages.map((imageUrl, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => setSelectedImage(imageUrl)}
                  className="mr-2"
                >
                  <Image 
                    source={{ uri: imageUrl }} 
                    className="w-40 h-40 rounded-lg" 
                    resizeMode="cover" 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Full Screen Image Modal */}
        {selectedImage && (
          <Modal 
            visible={!!selectedImage}
            transparent={true}
            animationType="fade"
          >
            <View className="flex-1 bg-black/90 justify-center items-center">
              <TouchableOpacity 
                onPress={() => setSelectedImage(null)}
                className="absolute top-12 m-4 mt-10 right-6 z-50"
              >
                <Ionicons name="close" size={36} color="white" />
              </TouchableOpacity>
              <Image 
                source={{ uri: selectedImage }} 
                className="w-[90%] h-[70%]" 
                resizeMode="contain" 
              />
            </View>
          </Modal>
        )}

        {/* Time Picker */}
        <View className="flex flex-row justify-between mt-2">
          <View className="w-[48%]">
            <Text className="text-white font-bold">Start Time</Text> 
            <TouchableOpacity
              className="bg-gray-800 text-white p-3 rounded mt-2"
              onPress={() => setIsStartTimePickerVisible(true)}
            >
            <View className="flex flex-row items-center justify-between">
                <Text className="text-white">{startTime || "--:--"}</Text>
                <Entypo name="select-arrows" size={24} color="white" />
              </View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isStartTimePickerVisible}
              mode="time"
              onConfirm={handleStartTimeConfirm}
              onCancel={() => setIsStartTimePickerVisible(false)}
              is24Hour={true}
            />
          </View>
          <View className="w-[48%]">
            <Text className="text-white font-bold">End Time</Text>
            <TouchableOpacity
              className="bg-gray-800 text-white p-3 rounded mt-2"
              onPress={() => setIsEndTimePickerVisible(true)}
            >
              <View className="flex flex-row items-center justify-between">
                <Text className="text-white">{endTime || "--:--"}</Text>
                <Entypo name="select-arrows" size={24} color="white" />
              </View>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isEndTimePickerVisible}
              mode="time"
              onConfirm={handleEndTimeConfirm}
              onCancel={() => setIsEndTimePickerVisible(false)}
              minuteInterval={30} // Set time intervals to 30 minutes
            />
          </View>
        </View>

        {/* Vehicle Selection */}
        <Text className="text-white font-bold mt-2">Select Vehicle</Text>
        <View className="bg-gray-800 rounded mt-2 p-3">
          <Dropdown
            data={vehicleOptions}
            labelField="label"
            valueField="value"
            value={selectedVehicle}
            onChange={(item) => setSelectedVehicle(item.value)}
            placeholder="Select a vehicle"
            placeholderStyle={{ color: "gray" }}
            selectedTextStyle={{ color: "white" }}
            containerStyle={{ backgroundColor: "gray" }}
          />
        </View>

        {/* Pricing Details */}
        <View className="bg-gray-900 p-4 rounded-lg mt-2">
          <View className="flex flex-row justify-between">
            <Text className="text-gray-400 font-bold">
              {parsedStation.type === "parking" ? "Parking Fee" : "Charging Fee"}
            </Text>
            <Text className="text-white">${parkingFee}</Text>
          </View>
          <View className="flex flex-row justify-between mt-2">
            <Text className="text-gray-400 font-bold">Service Fee</Text>
            <Text className="text-white">${serviceFee}</Text>
          </View>
          <View className="flex flex-row justify-between mt-4 border-t border-gray-700 pt-2">
            <Text className="text-white font-bold">Total</Text>
            <Text className="text-yellow-400 font-bold">${totalFee}</Text>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          onPress={handleConfirmReservation} 
          className={`${loading ? 'bg-yellow-700' : 'bg-yellow-500'} p-4 rounded-full mt-6 mb-4`}
          disabled={loading}
        >
          <Text className="text-black text-center text-xl font-bold">
            {loading ? "Processing..." : "Confirm Reservation"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Reserve;