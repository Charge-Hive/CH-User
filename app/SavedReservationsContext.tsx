import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Define the context type
type SavedReservationsContextType = {
  savedReservations: Reservation[];
  addSavedReservation: (reservation: Reservation) => Promise<void>;
  removeSavedReservation: (reservationId: string) => Promise<void>;
  isSaved: (reservationId: string) => boolean;
};

// Create the context
const SavedReservationsContext = createContext<SavedReservationsContextType | undefined>(undefined);

// Context Provider Component
export const SavedReservationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedReservations, setSavedReservations] = useState<Reservation[]>([]);

  // Load saved reservations on mount
  useEffect(() => {
    loadSavedReservations();
  }, []);

  // Load saved reservations from AsyncStorage
  const loadSavedReservations = async () => {
    try {
      const savedData = await AsyncStorage.getItem('savedReservations');
      if (savedData) {
        setSavedReservations(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading saved reservations:', error);
    }
  };

  // Add a reservation to saved
  const addSavedReservation = async (reservation: Reservation) => {
    try {
      // Check if already saved to prevent duplicates
      const isAlreadySaved = savedReservations.some(
        saved => saved.parking_transaction_id === reservation.parking_transaction_id
      );

      if (!isAlreadySaved) {
        const updatedSavedReservations = [...savedReservations, reservation];
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(
          'savedReservations', 
          JSON.stringify(updatedSavedReservations)
        );

        // Update state
        setSavedReservations(updatedSavedReservations);
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
    }
  };

  // Remove a reservation from saved
  const removeSavedReservation = async (reservationId: string) => {
    try {
      const updatedSavedReservations = savedReservations.filter(
        res => res.parking_transaction_id !== reservationId
      );

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        'savedReservations', 
        JSON.stringify(updatedSavedReservations)
      );

      // Update state
      setSavedReservations(updatedSavedReservations);
    } catch (error) {
      console.error('Error removing saved reservation:', error);
    }
  };

  // Check if a reservation is saved
  const isSaved = (reservationId: string) => {
    return savedReservations.some(
      saved => saved.parking_transaction_id === reservationId
    );
  };

  return (
    <SavedReservationsContext.Provider 
      value={{ 
        savedReservations, 
        addSavedReservation, 
        removeSavedReservation,
        isSaved 
      }}
    >
      {children}
    </SavedReservationsContext.Provider>
  );
};

// Custom hook to use the SavedReservations context
export const useSavedReservations = () => {
  const context = useContext(SavedReservationsContext);
  if (context === undefined) {
    throw new Error('useSavedReservations must be used within a SavedReservationsProvider');
  }
  return context;
};