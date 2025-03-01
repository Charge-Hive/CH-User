import { View, Text, Image } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const TabIcon = ({
  icon,
  icolor,
  namee,
  focused,
}: {
  icon: any;
  icolor: any;
  namee: String;
  focused: Boolean;
}) => {
  return (
    <View className="w-16 items-center justify-center">
      <Ionicons name={icon} size={24} color={icolor} />
      <Text
        className={`${focused ? "font-psemibold" : "font-plight"} text-[10px]`}
        style={{ color: icolor }}
      >
        {namee}
      </Text>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#FFA001",
            tabBarInactiveTintColor:"#CDCDE0",
          tabBarStyle: {
            backgroundColor:'#161622',
            paddingTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="search"
                icolor={color}
                namee="Explore"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="saved"
          options={{
            title: "Saved",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="heart-outline"
                icolor={color}
                namee="Saved"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="trips"
          options={{
            title: "Trips",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="car-sport-outline"
                icolor={color}
                namee="Trips"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="chatbox-ellipses-outline"
                icolor={color}
                namee="Messages"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="person-outline"
                icolor={color}
                namee="Profile"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
