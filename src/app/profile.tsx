import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  const handleSignOut = () => {
    Alert.alert(
      "Вийти з акаунта?",
      "Ви дійсно хочете вийти з Modern Chat?",
      [
        {
          text: "Скасувати",
          style: "cancel",
        },
        {
          text: "Вийти",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Sign out error:", error);
            }
          },
        },
      ],
    );
  };

  if (user === undefined) {
    return (
      <View className="flex-1 bg-[#0B0B0F] items-center justify-center">
        <ActivityIndicator
          size="large"
          color="#E8A1B8"
        />
      </View>
    );
  }

  const displayName = user?.name || "Користувач";
  const email = user?.email || "Email не вказано";

  return (
    <View className="flex-1 bg-[#0B0B0F]">
      <Stack.Screen
        options={{
          title: "Профіль",

          headerStyle: {
            backgroundColor: "#0B0B0F",
          },

          headerTintColor: "#FFFFFF",

          headerShadowVisible: false,

          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              className="ml-2 w-10 h-10 rounded-full bg-[#151519] border border-[#25252C] items-center justify-center"
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color="#E8A1B8"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
      >
        {/* Profile card */}
        <View className="bg-[#151519] border border-[#25252C] rounded-[26px] p-5">
          <View className="items-center">
            {/* Avatar */}
            <View className="w-[104px] h-[104px] rounded-[32px] bg-[#E8A1B8]/10 border border-[#E8A1B8]/20 items-center justify-center overflow-hidden">
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  className="w-full h-full"
                />
              ) : (
                <Ionicons
                  name="person"
                  size={48}
                  color="#E8A1B8"
                />
              )}
            </View>

            {/* Name */}
            <Text
              className="text-white text-[25px] font-bold mt-4 text-center"
              numberOfLines={1}
            >
              {displayName}
            </Text>

            {/* Email */}
            <View className="flex-row items-center mt-2">
              <Ionicons
                name="mail-outline"
                size={15}
                color="#777780"
              />

              <Text
                className="text-[#777780] text-sm ml-2"
                numberOfLines={1}
              >
                {email}
              </Text>
            </View>

            {/* Edit */}
            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-[#E8A1B8] h-[46px] px-6 rounded-2xl flex-row items-center justify-center mt-5"
            >
              <Ionicons
                name="create-outline"
                size={18}
                color="#0B0B0F"
              />

              <Text className="text-[#0B0B0F] font-bold ml-2">
                Редагувати профіль
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <Text className="text-[#777780] text-xs font-bold uppercase tracking-[1.5px] mt-8 mb-3">
          Акаунт
        </Text>

        <View className="bg-[#151519] border border-[#25252C] rounded-[22px] overflow-hidden">
          {/* Personal */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center">
              <Ionicons
                name="person-outline"
                size={20}
                color="#E8A1B8"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[15px] font-semibold">
                Особисті дані
              </Text>

              <Text className="text-[#777780] text-xs mt-1">
                Ім'я та інформація профілю
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#55555F"
            />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#25252C] ml-[72px]" />

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center">
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#E8A1B8"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[15px] font-semibold">
                Сповіщення
              </Text>

              <Text className="text-[#777780] text-xs mt-1">
                Повідомлення та звуки
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#55555F"
            />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#25252C] ml-[72px]" />

          {/* Privacy */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#E8A1B8"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[15px] font-semibold">
                Приватність
              </Text>

              <Text className="text-[#777780] text-xs mt-1">
                Безпека та конфіденційність
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#55555F"
            />
          </TouchableOpacity>
        </View>

        {/* Other */}
        <Text className="text-[#777780] text-xs font-bold uppercase tracking-[1.5px] mt-8 mb-3">
          Інше
        </Text>

        <View className="bg-[#151519] border border-[#25252C] rounded-[22px] overflow-hidden">
          {/* Theme */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center">
              <Ionicons
                name="moon-outline"
                size={20}
                color="#E8A1B8"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[15px] font-semibold">
                Тема
              </Text>

              <Text className="text-[#777780] text-xs mt-1">
                Темна
              </Text>
            </View>

            <View className="bg-[#E8A1B8]/10 px-3 py-1.5 rounded-full">
              <Text className="text-[#E8A1B8] text-[11px] font-bold">
                DARK
              </Text>
            </View>
          </TouchableOpacity>

          <View className="h-[1px] bg-[#25252C] ml-[72px]" />

          {/* About */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center p-4"
          >
            <View className="w-11 h-11 rounded-2xl bg-[#E8A1B8]/10 items-center justify-center">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#E8A1B8"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[15px] font-semibold">
                Про застосунок
              </Text>

              <Text className="text-[#777780] text-xs mt-1">
                Modern Chat · Версія 1.0.0
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#55555F"
            />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          className="h-[52px] rounded-2xl bg-[#151519] border border-[#3A252D] flex-row items-center justify-center mt-8"
        >
          <Ionicons
            name="log-out-outline"
            size={19}
            color="#E8A1B8"
          />

          <Text className="text-[#E8A1B8] text-[14px] font-bold ml-2">
            Вийти з акаунта
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center mt-7">
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-[#E8A1B8] mr-2" />

            <Text className="text-[#55555F] text-[11px]">
              Modern Chat
            </Text>
          </View>

          <Text className="text-[#3D3D45] text-[10px] mt-1">
            v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
