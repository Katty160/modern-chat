import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatRoomId = id as Id<"chatRooms">;
  const router = useRouter();

  const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });
  const messages = useQuery(api.messages.listMessages, { chatRoomId });
  const currentUser = useQuery(api.users.currentUser);
  const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);

  const [inputText, setInputText] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] =
    useState<Id<"messages"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const lastTypingSentRef = useRef(0);

  const handleTextChange = (text: string) => {
    setInputText(text);

    const now = Date.now();

    if (now - lastTypingSentRef.current > 1500) {
      lastTypingSentRef.current = now;
      setTyping({ chatRoomId }).catch(() => { });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();

    if (!text && !selectedImageUri) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Редагування повідомлення
      if (editingMessageId) {
        if (!text) {
          Alert.alert("Помилка", "Повідомлення не може бути порожнім");
          return;
        }

        await editMessage({
          messageId: editingMessageId,
          content: text,
        });

        setEditingMessageId(null);
        setInputText("");
        return;
      }

      // Відправка фото
      if (selectedImageUri) {
        console.log("IMAGE URI:", selectedImageUri);

        // Отримуємо URL для завантаження в Convex Storage
        const uploadUrl = await generateUploadUrl();

        console.log("UPLOAD URL:", uploadUrl);

        if (!uploadUrl) {
          throw new Error("Не вдалося отримати URL для завантаження");
        }

        // Створюємо файл з локального URI
        const file = new File(selectedImageUri);

        console.log("FILE EXISTS:", file.exists);

        if (!file.exists) {
          throw new Error("Файл зображення не знайдено");
        }

        // Завантажуємо файл у Convex
        const uploadResponse = await expoFetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": "image/jpeg",
          },
          body: file,
        });

        console.log("UPLOAD STATUS:", uploadResponse.status);

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.log("UPLOAD ERROR:", errorText);

          throw new Error("Не вдалося завантажити зображення");
        }

        const uploadResult = await uploadResponse.json();

        console.log("UPLOAD RESULT:", uploadResult);

        const storageId = uploadResult?.storageId;

        if (!storageId) {
          throw new Error("Convex не повернув storageId");
        }

        // Створюємо повідомлення з фото
        await sendMediaMessage({
          chatRoomId,
          storageId,
          caption: text || undefined,
        });

        setSelectedImageUri(null);
        setInputText("");

        return;
      }

      // Звичайне текстове повідомлення
      await sendMessage({
        chatRoomId,
        content: text,
      });

      setInputText("");
    } catch (error) {
      console.error("SEND MESSAGE ERROR:", error);

      Alert.alert(
        "Помилка",
        error instanceof Error
          ? error.message
          : "Не вдалося відправити повідомлення"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageLongPress = (item: {
    _id: Id<"messages">;
    senderId: Id<"users">;
    content?: string;
  }) => {
    if (item.senderId !== currentUser?._id) return;

    const options: any[] = [];

    if (item.content) {
      options.push({
        text: "Редагувати",
        onPress: () => {
          setEditingMessageId(item._id);
          setInputText(item.content || "");
        },
      });
    }

    options.push({
      text: "Видалити",
      style: "destructive",
      onPress: () => {
        Alert.alert(
          "Видалити повідомлення",
          "Ви впевнені, що хочете видалити повідомлення?",
          [
            {
              text: "Скасувати",
              style: "cancel",
            },
            {
              text: "Видалити",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteMessage({
                    messageId: item._id,
                  });
                } catch (error) {
                  Alert.alert(
                    "Помилка",
                    "Не вдалося видалити повідомлення"
                  );
                }
              },
            },
          ]
        );
      },
    });

    options.push({
      text: "Скасувати",
      style: "cancel",
    });

    Alert.alert(
      "Дії з повідомленням",
      "Оберіть дію",
      options
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0B0B0F]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: room?.title ?? "Чат",
          headerStyle: {
            backgroundColor: "#0B0B0F",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            color: "#FFFFFF",
            fontWeight: "600",
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                router.push(`/settings/${chatRoomId}`)
              }
              className="w-9 h-9 rounded-full bg-[#151519] items-center justify-center"
            >
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#E8A1B8"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
        }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({
            animated: false,
          })
        }
        renderItem={({ item }) => {
          const isOwn = item.senderId === currentUser?._id;

          return (
            <View
              className={`mb-3 flex-row ${isOwn ? "justify-end" : "justify-start"
                }`}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => handleMessageLongPress(item)}
                delayLongPress={400}
                className={`max-w-[82%]`}
              >
                <View
                  className={`px-4 py-3 rounded-2xl ${isOwn
                    ? "bg-[#E8A1B8] rounded-br-md"
                    : "bg-[#151519] rounded-bl-md border border-[#25252C]"
                    }`}
                >
                  {!isOwn && (
                    <Text className="text-[#E8A1B8] text-xs font-semibold mb-1.5">
                      {item.senderName}
                    </Text>
                  )}

                  {item.imageUrl && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        setFullscreenImage(item.imageUrl!)
                      }
                    >
                      <Image
                        source={{
                          uri: item.imageUrl,
                        }}
                        className="w-60 h-60 rounded-xl mb-2"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}

                  {item.content ? (
                    <Text
                      className={`text-[15px] leading-5 ${isOwn
                        ? "text-[#0B0B0F]"
                        : "text-white"
                        }`}
                    >
                      {item.content}
                    </Text>
                  ) : null}

                  <View className="flex-row items-center justify-end mt-1.5 gap-1">
                    {item.isEdited && (
                      <Text
                        className={`text-[9px] italic ${isOwn
                          ? "text-[#0B0B0F]/50"
                          : "text-white/40"
                          }`}
                      >
                        ред.
                      </Text>
                    )}

                    <Text
                      className={`text-[9px] ${isOwn
                        ? "text-[#0B0B0F]/50"
                        : "text-white/40"
                        }`}
                    >
                      {new Date(
                        item._creationTime
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {typingUsers && typingUsers.length > 0 && (
        <View className="px-1">
          <TypingDots typingUsers={typingUsers} />
        </View>
      )}

      {editingMessageId && (
        <View className="flex-row items-center px-4 py-2.5 bg-[#151519] border-t border-[#25252C]">
          <View className="w-8 h-8 rounded-full bg-[#E8A1B8]/10 items-center justify-center mr-2">
            <Ionicons
              name="pencil"
              size={15}
              color="#E8A1B8"
            />
          </View>

          <View className="flex-1">
            <Text className="text-[#E8A1B8] text-xs font-semibold">
              Редагування
            </Text>
            <Text
              className="text-[#777780] text-[10px] mt-0.5"
              numberOfLines={1}
            >
              Змініть текст повідомлення
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setEditingMessageId(null);
              setInputText("");
            }}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons
              name="close"
              size={20}
              color="#777780"
            />
          </TouchableOpacity>
        </View>
      )}

      {selectedImageUri && (
        <View className="flex-row items-center px-4 py-2.5 bg-[#151519] border-t border-[#25252C]">
          <Image
            source={{
              uri: selectedImageUri,
            }}
            className="w-12 h-12 rounded-xl"
          />

          <View className="flex-1 ml-3">
            <Text className="text-white text-xs font-medium">
              Фото прикріплено
            </Text>
            <Text className="text-[#777780] text-[10px] mt-0.5">
              Додайте підпис або відправте фото
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setSelectedImageUri(null)}
            className="w-8 h-8 rounded-full bg-[#25252C] items-center justify-center"
          >
            <Ionicons
              name="close"
              size={17}
              color="#777780"
            />
          </TouchableOpacity>
        </View>
      )}

      <View className="px-3 pt-2 pb-3 bg-[#0B0B0F] border-t border-[#25252C]">
        <View className="flex-row items-end">
          <TouchableOpacity
            onPress={pickImage}
            disabled={isSubmitting}
            className="w-11 h-11 rounded-full bg-[#151519] border border-[#25252C] items-center justify-center mr-2"
          >
            <Ionicons
              name="image-outline"
              size={21}
              color="#E8A1B8"
            />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-end bg-[#151519] border border-[#25252C] rounded-2xl min-h-[44px]">
            <TextInput
              className="flex-1 text-white px-4 py-2.5 text-[15px] max-h-28"
              placeholder={
                editingMessageId
                  ? "Змініть текст..."
                  : selectedImageUri
                    ? "Додайте підпис..."
                    : "Напишіть повідомлення..."
              }
              placeholderTextColor="#777780"
              value={inputText}
              onChangeText={handleTextChange}
              multiline
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={
                (!inputText.trim() && !selectedImageUri) ||
                isSubmitting
              }
              className={`w-10 h-10 rounded-xl items-center justify-center mr-1 mb-1 ${(!inputText.trim() && !selectedImageUri) ||
                isSubmitting
                ? "bg-[#25252C]"
                : "bg-[#E8A1B8]"
                }`}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color="#E8A1B8"
                />
              ) : (
                <Ionicons
                  name={
                    editingMessageId
                      ? "checkmark"
                      : "arrow-up"
                  }
                  size={20}
                  color={
                    (!inputText.trim() &&
                      !selectedImageUri) ||
                      isSubmitting
                      ? "#777780"
                      : "#0B0B0F"
                  }
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ImageViewerModal
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
    </KeyboardAvoidingView>
  );
}