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

export default function ProfileScreen() {
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
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#E7A1B5" />
      </View>
    );
  }

  const displayName = user?.name || "Користувач";
  const email = user?.email || "Email не вказано";

  return (
    <ScrollView
      className="flex-1 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 58,
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-10">
        <View>
          <Text className="text-[#A0A0A8] text-[11px] font-semibold uppercase tracking-[1.8px]">
            ACCOUNT
          </Text>

          <Text className="text-[#17171C] text-[30px] font-bold mt-1">
            Профіль
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-[#F7F7F8] items-center justify-center"
        >
          <Ionicons
            name="settings-outline"
            size={21}
            color="#303038"
          />
        </TouchableOpacity>
      </View>

      {/* Profile */}
      <View className="items-center">
        <View className="w-[116px] h-[116px] rounded-full bg-[#F8EEF1] items-center justify-center overflow-hidden">
          {user?.image ? (
            <Image
              source={{ uri: user.image }}
              className="w-full h-full"
            />
          ) : (
            <Ionicons
              name="person"
              size={52}
              color="#E7A1B5"
            />
          )}
        </View>

        <Text
          className="text-[#17171C] text-[25px] font-bold mt-5"
          numberOfLines={1}
        >
          {displayName}
        </Text>

        <View className="flex-row items-center mt-2">
          <Ionicons
            name="mail-outline"
            size={15}
            color="#A0A0A8"
          />

          <Text
            className="text-[#888890] text-[14px] ml-2"
            numberOfLines={1}
          >
            {email}
          </Text>
        </View>
      </View>

      {/* Edit */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="self-center px-7 h-[44px] rounded-full bg-[#F8EEF1] flex-row items-center justify-center mt-6"
      >
        <Ionicons
          name="create-outline"
          size={17}
          color="#D98FA5"
        />

        <Text className="text-[#D4879D] text-[14px] font-semibold ml-2">
          Редагувати профіль
        </Text>
      </TouchableOpacity>

      {/* Account */}
      <View className="mt-11">
        <Text className="text-[#A0A0A8] text-[11px] font-semibold uppercase tracking-[1.5px] mb-3">
          Акаунт
        </Text>

        <View className="rounded-[22px] bg-[#F8F8F9] px-4">
          {/* Personal */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-[13px] bg-white items-center justify-center">
              <Ionicons
                name="person-outline"
                size={19}
                color="#55555E"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-[#222229] text-[15px] font-semibold">
                Особисті дані
              </Text>

              <Text className="text-[#9999A1] text-[12px] mt-1">
                Ім'я та інформація профілю
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#B5B5BC"
            />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#EAEAED] ml-[56px]" />

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-[13px] bg-white items-center justify-center">
              <Ionicons
                name="notifications-outline"
                size={19}
                color="#55555E"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-[#222229] text-[15px] font-semibold">
                Сповіщення
              </Text>

              <Text className="text-[#9999A1] text-[12px] mt-1">
                Повідомлення та звуки
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#B5B5BC"
            />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#EAEAED] ml-[56px]" />

          {/* Privacy */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-[13px] bg-white items-center justify-center">
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color="#55555E"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-[#222229] text-[15px] font-semibold">
                Приватність
              </Text>

              <Text className="text-[#9999A1] text-[12px] mt-1">
                Безпека та конфіденційність
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#B5B5BC"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Other */}
      <View className="mt-8">
        <Text className="text-[#A0A0A8] text-[11px] font-semibold uppercase tracking-[1.5px] mb-3">
          Інше
        </Text>

        <View className="rounded-[22px] bg-[#F8F8F9] px-4">
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-[13px] bg-white items-center justify-center">
              <Ionicons
                name="moon-outline"
                size={19}
                color="#55555E"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-[#222229] text-[15px] font-semibold">
                Тема
              </Text>

              <Text className="text-[#9999A1] text-[12px] mt-1">
                Світла
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#B5B5BC"
            />
          </TouchableOpacity>

          <View className="h-[1px] bg-[#EAEAED] ml-[56px]" />

          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center py-4"
          >
            <View className="w-10 h-10 rounded-[13px] bg-white items-center justify-center">
              <Ionicons
                name="information-circle-outline"
                size={19}
                color="#55555E"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-[#222229] text-[15px] font-semibold">
                Про застосунок
              </Text>

              <Text className="text-[#9999A1] text-[12px] mt-1">
                Modern Chat · Версія 1.0.0
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#B5B5BC"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleSignOut}
        activeOpacity={0.7}
        className="flex-row items-center justify-center mt-8 h-[50px]"
      >
        <Ionicons
          name="log-out-outline"
          size={19}
          color="#D4879D"
        />

        <Text className="text-[#D4879D] text-[15px] font-semibold ml-2">
          Вийти з акаунта
        </Text>
      </TouchableOpacity>

      <Text className="text-[#C5C5CA] text-[10px] text-center mt-5">
        Modern Chat
      </Text>
    </ScrollView>
  );
}

