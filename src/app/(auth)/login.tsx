import {
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { COLORS } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn } = useAuthActions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Помилка", "Будь ласка, заповніть усі поля.");
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert("Помилка", "Будь ласка, вкажіть ваше ім'я.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      formData.append("email", email.trim());
      formData.append("password", password.trim());
      formData.append("flow", isSignUp ? "signUp" : "signIn");

      if (isSignUp) {
        formData.append("name", name.trim());
      }

      await signIn("password", formData);

      if (isSignUp) {
        Alert.alert("Успіх", "Акаунт створено!");
      }
    } catch (err) {
      console.error("Auth Error", err);

      Alert.alert(
        "Помилка",
        isSignUp
          ? "Не вдалося зареєструватися. Можливо, пошта вже зайнята."
          : "Неправильний email або пароль.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#0B0B0F]"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 70,
          paddingBottom: 35,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[#777780] text-xs font-medium uppercase tracking-[2px]">
              WELCOME TO
            </Text>

            <Text className="text-white text-2xl font-bold mt-1">
              Modern Chat
            </Text>
          </View>

          <View className="w-12 h-12 rounded-2xl bg-[#E8A1B8]/10 border border-[#E8A1B8]/20 items-center justify-center">
            <Ionicons
              name="chatbubble-ellipses"
              size={24}
              color="#E8A1B8"
            />
          </View>
        </View>

        {/* Intro */}
        <View className="mt-14">
          <Text className="text-white text-[32px] font-bold">
            {isSignUp ? "Створіть акаунт" : "З поверненням 👋"}
          </Text>

          <Text className="text-[#777780] text-[15px] mt-3 leading-6">
            {isSignUp
              ? "Зареєструйтесь, щоб почати спілкуватися з іншими."
              : "Увійдіть у свій акаунт та продовжуйте спілкування."}
          </Text>
        </View>

        {/* Form */}
        <View className="mt-10">
          {isSignUp && (
            <View className="mb-4">
              <Text className="text-[#B8B8C2] text-xs font-semibold mb-2 ml-1">
                ІМ'Я
              </Text>

              <View className="h-[58px] rounded-2xl bg-[#151519] border border-[#25252C] flex-row items-center px-4">
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#777780"
                />

                <TextInput
                  className="flex-1 ml-3 text-white text-[15px]"
                  placeholder="Ваше ім'я"
                  placeholderTextColor="#5F5F68"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-[#B8B8C2] text-xs font-semibold mb-2 ml-1">
              EMAIL
            </Text>

            <View className="h-[58px] rounded-2xl bg-[#151519] border border-[#25252C] flex-row items-center px-4">
              <Ionicons
                name="mail-outline"
                size={20}
                color="#777780"
              />

              <TextInput
                className="flex-1 ml-3 text-white text-[15px]"
                placeholder="you@example.com"
                placeholderTextColor="#5F5F68"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View>
            <Text className="text-[#B8B8C2] text-xs font-semibold mb-2 ml-1">
              ПАРОЛЬ
            </Text>

            <View className="h-[58px] rounded-2xl bg-[#151519] border border-[#25252C] flex-row items-center px-4">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#777780"
              />

              <TextInput
                className="flex-1 ml-3 text-white text-[15px]"
                placeholder="Ваш пароль"
                placeholderTextColor="#5F5F68"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={21}
                  color="#777780"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Main button */}
        <TouchableOpacity
          onPress={handleAuth}
          disabled={isLoading}
          activeOpacity={0.85}
          className={`h-[58px] rounded-2xl bg-[#E8A1B8] items-center justify-center mt-7 ${
            isLoading ? "opacity-60" : ""
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#0B0B0F" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-[#0B0B0F] text-[15px] font-bold">
                {isSignUp ? "Створити акаунт" : "Увійти в акаунт"}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#0B0B0F"
                style={{ marginLeft: 8 }}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mt-8">
          <View className="flex-1 h-[1px] bg-[#222229]" />

          <Text className="text-[#55555F] text-xs mx-4">
            або
          </Text>

          <View className="flex-1 h-[1px] bg-[#222229]" />
        </View>

        {/* Switch */}
        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          activeOpacity={0.7}
          className="mt-6"
        >
          <View className="h-[54px] rounded-2xl border border-[#25252C] items-center justify-center bg-[#111115]">
            <Text className="text-[#8F8F99] text-sm">
              {isSignUp ? "Вже маєте акаунт? " : "Ще немає акаунта? "}
              <Text className="text-[#E8A1B8] font-semibold">
                {isSignUp ? "Увійти" : "Зареєструватися"}
              </Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Bottom */}
        <View className="items-center mt-auto pt-10">
          <View className="flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-[#E8A1B8]" />

            <Text className="text-[#55555F] text-xs ml-2">
              Your private space for conversations
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
