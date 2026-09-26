import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    name?: string;
    username?: string;
    bio?: string;
    image?: string;
  } | null | undefined;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
}) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const generateAvatarUploadUrl = useMutation(
    api.users.generateAvatarUploadUrl
  );

  useEffect(() => {
    if (visible && currentUser) {
      setName(currentUser.name ?? "");
      setUsername(currentUser.username ?? "");
      setBio(currentUser.bio ?? "");
      setAvatarUri(currentUser.image ?? null);
    }
  }, [visible, currentUser]);

  const pickAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Потрібен доступ",
          "Дозвольте додатку доступ до галереї для вибору фото."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("PICK AVATAR ERROR:", error);
      Alert.alert("Помилка", "Не вдалося вибрати аватар");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Помилка", "Ім'я не може бути порожнім");
      return;
    }

    try {
      setIsSubmitting(true);

      let newStorageId: any = undefined;

      // Завантажуємо фото тільки якщо воно було змінене
      if (avatarUri && avatarUri !== currentUser?.image) {
        const uploadUrl = await generateAvatarUploadUrl();

        const file = new File(avatarUri);

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": "image/jpeg",
          },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error("Не вдалося завантажити фото");
        }

        const result = await uploadResult.json();
        newStorageId = result.storageId;
      }

      const data: {
        name: string;
        username?: string;
        bio?: string;
        avatarStorageId?: any;
      } = {
        name: name.trim(),
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      if (newStorageId) {
        data.avatarStorageId = newStorageId;
      }

      console.log("UPDATE PROFILE:", data);

      await updateUserProfile(data);

      Alert.alert("Успіх", "Профіль успішно оновлено!");

      onClose();
    } catch (error: any) {
      console.error("UPDATE PROFILE ERROR:", error);

      Alert.alert(
        "Помилка",
        error?.message || "Не вдалося оновити профіль"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/70"
      >
        <View className="bg-surface rounded-t-3xl border-t border-surfaceLight max-h-[90%] p-6">
          {/* Заголовок */}
          <View className="flex-row items-center justify-between pb-4 border-b border-surfaceLight">
            <Text className="text-white text-lg font-bold">
              Редагувати профіль
            </Text>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={24}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="mt-4"
            keyboardShouldPersistTaps="handled"
          >
            {/* Аватар */}
            <View className="items-center my-4">
              <TouchableOpacity
                onPress={pickAvatar}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <View className="w-24 h-24 rounded-full bg-secondary border-2 border-primary/50 overflow-hidden items-center justify-center">
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name="person"
                      size={44}
                      color={COLORS.primary}
                    />
                  )}
                </View>

                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-surface">
                  <Ionicons
                    name="camera"
                    size={16}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              <Text className="text-primary text-xs font-semibold mt-2">
                Змінити фотографію
              </Text>
            </View>

            {/* Ім'я */}
            <View className="mb-4">
              <Text className="text-textMuted text-xs font-semibold uppercase mb-1.5">
                Ім'я користувача *
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ваше повне ім'я"
                placeholderTextColor={COLORS.textMuted}
                className="bg-secondary border border-surfaceLight rounded-xl px-4 py-3 text-white text-base"
              />
            </View>

            {/* Username */}
            <View className="mb-4">
              <Text className="text-textMuted text-xs font-semibold uppercase mb-1.5">
                Нікнейм (@username)
              </Text>

              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="alex_dev"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                className="bg-secondary border border-surfaceLight rounded-xl px-4 py-3 text-white text-base"
              />
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text className="text-textMuted text-xs font-semibold uppercase mb-1.5">
                Про себе
              </Text>

              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Розкажіть трохи про себе..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-secondary border border-surfaceLight rounded-xl px-4 py-3 text-white text-base min-h-[80px]"
              />
            </View>

            {/* Зберегти */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
              className="bg-primary rounded-xl py-3.5 items-center justify-center mb-6"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">
                  Зберегти зміни
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};