import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function HomeScreen() {
  const router = useRouter();

  const rooms = useQuery(api.rooms.listRooms);
  const currentUser = useQuery(api.users.currentUser);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  return (
    <View className="flex-1 bg-[#0B0B0F]">
      <Stack.Screen
        options={{
          title: "Чат-кімнати",

          headerStyle: {
            backgroundColor: "#0B0B0F",
          },

          headerTintColor: "#FFFFFF",

          headerShadowVisible: false,

          // Аватарка користувача
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="ml-2 w-10 h-10 rounded-full bg-[#151519] border border-[#E8A1B8]/40 items-center justify-center overflow-hidden"
              activeOpacity={0.8}
            >
              {currentUser?.image ? (
                <Image
                  source={{ uri: currentUser.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={19}
                  color="#E8A1B8"
                />
              )}
            </TouchableOpacity>
          ),

          // Кнопка створення кімнати
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/new-room")}
              className="mr-2 w-10 h-10 rounded-full bg-[#E8A1B8] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons
                name="add"
                size={24}
                color="#0B0B0F"
              />
            </TouchableOpacity>
          ),
        }}
      />

      {rooms === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color="#E8A1B8"
          />

          <Text className="text-[#777780] text-sm mt-4">
            Завантаження...
          </Text>
        </View>
      ) : rooms.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-[28px] bg-[#151519] border border-[#25252C] items-center justify-center mb-5">
            <Ionicons
              name="chatbubbles-outline"
              size={38}
              color="#E8A1B8"
            />
          </View>

          <Text className="text-white text-xl font-bold text-center">
            Немає чат-кімнат
          </Text>

          <Text className="text-[#777780] text-sm text-center mt-2 leading-5">
            Створіть першу кімнату за допомогою кнопки +
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/new-room")}
            className="bg-[#E8A1B8] px-6 py-4 rounded-2xl mt-6"
            activeOpacity={0.8}
          >
            <Text className="text-[#0B0B0F] font-bold">
              Створити кімнату
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E8A1B8"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/chat/${item._id}`)}
              className="bg-[#151519] border border-[#25252C] rounded-[22px] p-5 flex-row items-center"
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center mr-4">
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color="#E8A1B8"
                />
              </View>

              <View className="flex-1">
                <Text
                  className="text-white text-base font-bold"
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                {item.description ? (
                  <Text
                    className="text-[#777780] text-sm mt-1"
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                ) : null}

                {item.lastMessage ? (
                  <Text
                    className="text-[#E8A1B8] text-xs mt-2"
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                ) : null}
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#55555F"
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

