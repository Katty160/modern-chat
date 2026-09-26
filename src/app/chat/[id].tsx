import React, { useState, useRef } from "react";
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
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { COLORS } from "@/constants/theme";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { TypingDots } from "@/components/TypingDots";
import { SwipeableMessageItem, MessageItemData } from "@/components/SwipeableMessageItem";
import { ReplyPreviewBar, ReplyTarget } from "@/components/ReplyPreviewBar";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { ReactionPickerModal } from "@/components/ReactionPickerModal";
import { VideoNoteRecorder } from "@/components/VideoNoteRecorder";

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const chatRoomId = id as Id<"chatRooms">;
  const room = useQuery(api.rooms.getRoom, { roomId: chatRoomId });

  const MESSAGES_PAGE_SIZE = 25;

  const {
    results: messages,
    status: messagesStatus,
    loadMore,
    isLoading: messagesLoading,
  } = usePaginatedQuery(
    api.messages.getPaginatedMessages,
    { chatRoomId },
    { initialNumItems: MESSAGES_PAGE_SIZE }
  );

  const handleLoadMore = () => {
    if (messagesStatus === "CanLoadMore") {
      loadMore(MESSAGES_PAGE_SIZE);
    }
  };

  const currentUser = useQuery(api.users.currentUser);
  const typingUsers = useQuery(api.typing.getTypingUsers, { chatRoomId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendMediaMessage = useMutation(api.messages.sendMediaMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const sendVideoNote = useMutation(api.messages.sendVideoNoteMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const setTyping = useMutation(api.typing.setTyping);
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const [inputText, setInputText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<Id<"messages"> | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reactionMessageId, setReactionMessageId] =
    useState<Id<"messages"> | null>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const sendAudioMessage = useMutation(
    api.messages.sendAudioMessage
  );

  const flatListRef = useRef<FlatList>(null);
  const lastTypingCallRef = useRef<number>(0);

  // Тротлінг індикатора набору тексту
  const handleTextChange = (text: string) => {
    setInputText(text);

    const now = Date.now();
    if (now - lastTypingCallRef.current > 1500) {
      lastTypingCallRef.current = now;
      setTyping({ chatRoomId }).catch(console.error);
    }
  };

  // Вибір фото з галереї
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Дозвіл потрібен", "Надайте доступ до медіатеки для надсилання фотографій.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося вибрати зображення");
    }
  };

  // Початок відповіді на повідомлення
  const handleStartReply = (msg: MessageItemData) => {
    setReplyTarget({
      messageId: msg._id,
      senderName: msg.senderName,
      text: msg.content || (msg.imageUrl ? "📷 Фотографія" : ""),
    });
    // Скасовуємо режим редагування, якщо він був відкритий
    setEditingMessageId(null);
  };

  // Відправка повідомлення або збереження змін
  const handleSend = async () => {
    const text = inputText.trim();
    if ((!text && !selectedImageUri) || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (editingMessageId) {
        // Режим збереження редагування
        await editMessage({
          messageId: editingMessageId,
          content: text,
        });
        setEditingMessageId(null);
      } else if (selectedImageUri) {
        // Відправка фотографії у Convex Storage через expo-file-system та expo/fetch
        const uploadUrl = await generateUploadUrl();
        const file = new File(selectedImageUri);

        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: file,
        });

        if (!uploadResult.ok) throw new Error("Не вдалося завантажити зображення");

        const { storageId } = await uploadResult.json();

        await sendMediaMessage({
          chatRoomId,
          storageId,
          caption: text || undefined,
          replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
          replyToSender: replyTarget?.senderName,
          replyToText: replyTarget?.text,
        });

        setSelectedImageUri(null);
        setReplyTarget(null);
      } else {
        // Відправка звичайного тексту з відповіддю (якщо задано)
        await sendMessage({
          chatRoomId,
          content: text,
          replyToId: replyTarget ? (replyTarget.messageId as Id<"messages">) : undefined,
          replyToSender: replyTarget?.senderName,
          replyToText: replyTarget?.text,
        });

        setReplyTarget(null);
      }

      setInputText("");
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося надіслати повідомлення");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Контекстне меню дій з повідомленням

  const handleMessageLongPress = (item: MessageItemData) => {
    const isOwn = item.senderId === currentUser?._id;

    const options: any[] = [
      {
        text: "Відповісти",
        onPress: () => handleStartReply(item),
      },
      {
        text: "😊 Додати реакцію",
        onPress: () => {
          setReactionMessageId(item._id);
        },
      },
    ];

    if (isOwn) {
      if (item.content) {
        options.push({
          text: "Редагувати",
          onPress: () => {
            setEditingMessageId(item._id);
            setInputText(item.content || "");
            setReplyTarget(null);
          },
        });
      }

      options.push({
        text: "Видалити",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Видалити повідомлення?",
            "Ви впевнені, що хочете видалити повідомлення?",
            [
              {
                text: "Скасувати",
                style: "cancel",
              },
              {
                text: "Так, видалити",
                style: "destructive",
                onPress: () =>
                  deleteMessage({
                    messageId: item._id,
                  }),
              },
            ]
          );
        },
      });
    }

    options.push({
      text: "Скасувати",
      style: "cancel",
    });

    Alert.alert(
      "Дії з повідомленням",
      undefined,
      options
    );
  };


  const startRecording = async () => {
    const permission = await requestRecordingPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Дозвіл не надано",
        "Для запису голосових повідомлень потрібен доступ до мікрофона."
      );
      return;
    }

    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      console.error("Помилка початку запису:", error);
      Alert.alert("Помилка", "Не вдалося розпочати запис аудіо.");
    }
  };

  const cancelRecording = async () => {
    try {
      await audioRecorder.stop();
    } catch (error) {
      console.error("Помилка скасування запису:", error);
    }
  };

  const stopAndSendRecording = async () => {
    try {
      const durationSeconds = Math.round(
        (recorderState.durationMillis || 0) / 1000
      );

      await audioRecorder.stop();

      const uri = audioRecorder.uri;

      if (!uri || durationSeconds < 1) {
        Alert.alert(
          "Занадто коротке",
          "Голосове повідомлення занадто коротке."
        );
        return;
      }

      setIsSubmitting(true);

      // Отримуємо URL для Convex Storage
      const uploadUrl = await generateUploadUrl();

      // Створюємо файл із записаного аудіо
      const audioFile = new File(uri);

      // Завантажуємо файл у Convex Storage
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "audio/m4a",
        },
        body: audioFile,
      });

      // Показуємо справжню помилку сервера
      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();

        console.error("❌ AUDIO UPLOAD ERROR");
        console.error("Status:", uploadResult.status);
        console.error("Response:", errorText);

        throw new Error(
          `Не вдалося завантажити аудіо (${uploadResult.status})`
        );
      }

      const { storageId } = await uploadResult.json();

      // Створюємо повідомлення
      await sendAudioMessage({
        chatRoomId,
        audioStorageId: storageId,
        audioDuration: durationSeconds,
        replyToId: replyTarget?.messageId
          ? (replyTarget.messageId as Id<"messages">)
          : undefined,
        replyToSender: replyTarget?.senderName,
        replyToText: replyTarget?.text,
      });

      setReplyTarget(null);
    } catch (error) {
      console.error("Помилка завантаження аудіо:", error);

      Alert.alert(
        "Помилка",
        "Не вдалося надіслати голосове повідомлення."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const [isVideoRecorderVisible, setIsVideoRecorderVisible] =
    useState(false);
  const handleSendVideoNote = async (
    videoUri: string,
    duration: number
  ) => {
    try {
      setIsSubmitting(true);

      // Отримуємо URL для Convex Storage
      const uploadUrl = await generateUploadUrl();

      // Створюємо файл із відео
      const videoFile = new File(videoUri);

      // Завантажуємо відео
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "video/mp4",
        },
        body: videoFile,
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text();

        console.error("❌ VIDEO UPLOAD ERROR");
        console.error("Status:", uploadResult.status);
        console.error("Response:", errorText);

        throw new Error(
          `Не вдалося завантажити відео (${uploadResult.status})`
        );
      }

      const { storageId } = await uploadResult.json();

      // Створюємо відеоповідомлення
      await sendVideoNote({
        chatRoomId,
        videoStorageId: storageId,
        videoDuration: duration,
      });

      setIsVideoRecorderVisible(false);
    } catch (error) {
      console.error(
        "Помилка надсилання відеокружечка:",
        error
      );

      Alert.alert(
        "Помилка",
        "Не вдалося надіслати відеоповідомлення"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: room?.title ?? "Чат",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/settings/${chatRoomId}`)}
              className="p-1"
            >
              <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SwipeableMessageItem
            item={item as MessageItemData}
            isOwn={item.senderId === currentUser?._id}
            onLongPress={() =>
              handleMessageLongPress(item as MessageItemData)
            }
            onReply={handleStartReply}
            onImagePress={(url) => setFullscreenImage(url)}
            onAuthorPress={(authorId) =>
              router.push({
                pathname: "/user/[id]",
                params: { id: authorId },
              })
            }
          />
        )}
        ListFooterComponent={
          messagesStatus === "LoadingMore" ? (
            <View className="py-4 items-center">
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            </View>
          ) : null
        }
      />


      {/* Індикатор набору тексту іншими учасниками */}
      {typingUsers && typingUsers.length > 0 && <TypingDots typingUsers={typingUsers} />}

      {/* Панель активного цитування (Reply Bar) */}
      {replyTarget && (
        <ReplyPreviewBar
          replyTarget={replyTarget}
          onCancel={() => setReplyTarget(null)}
        />
      )}

      {/* Панель активного редагування власного повідомлення */}
      {editingMessageId && (
        <View className="flex-row items-center justify-between px-4 py-2 bg-surfaceLight border-t border-surface">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="pencil" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text className="text-white text-xs font-semibold">Редагування повідомлення</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setEditingMessageId(null);
              setInputText("");
            }}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Прев'ю обраної картинки перед відправкою */}
      {selectedImageUri && (
        <View className="flex-row items-center px-4 py-2 bg-surfaceLight border-t border-surface">
          <Image source={{ uri: selectedImageUri }} className="w-12 h-12 rounded-lg mr-3" />
          <Text className="text-white text-xs flex-1">Фото прикріплено</Text>
          <TouchableOpacity onPress={() => setSelectedImageUri(null)}>
            <Ionicons name="close-circle" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      )}

      {/* Панель введення тексту / голосового повідомлення */}
      <View className="flex-row items-center p-3 bg-surface border-t border-surfaceLight">
        {recorderState.isRecording ? (
          <>
            {/* Скасувати запис */}
            <TouchableOpacity
              onPress={cancelRecording}
              disabled={isSubmitting}
              className="w-11 h-11 rounded-full items-center justify-center bg-surfaceLight mr-2"
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color={COLORS.danger}
              />
            </TouchableOpacity>

            {/* Індикація запису */}
            <View className="flex-1 h-11 bg-background rounded-full border border-surfaceLight px-4 flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-danger mr-2" />

              <Text className="text-white text-base flex-1">
                Запис...
              </Text>

              <Text className="text-primary text-sm font-semibold">
                {Math.floor((recorderState.durationMillis || 0) / 1000)}с
              </Text>
            </View>

            {/* Відправити голосове */}
            <TouchableOpacity
              onPress={stopAndSendRecording}
              disabled={isSubmitting}
              className="w-11 h-11 rounded-full items-center justify-center bg-primary ml-2"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Фото */}
            <TouchableOpacity
              onPress={pickImage}
              disabled={isSubmitting}
              className="mr-2 p-2 rounded-full bg-surfaceLight"
            >
              <Ionicons
                name="image-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            {/* Відеокружечок */}
            <TouchableOpacity
              onPress={() => setIsVideoRecorderVisible(true)}
              disabled={isSubmitting}
              className="mr-2 p-2 rounded-full bg-surfaceLight"
            >
              <Ionicons
                name="videocam-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            {/* Поле тексту */}
            <TextInput
              className="flex-1 bg-background text-white px-4 py-2.5 rounded-full text-base border border-surfaceLight mr-2"
              placeholder={
                editingMessageId
                  ? "Змініть текст..."
                  : replyTarget
                    ? `Відповідь для ${replyTarget.senderName}...`
                    : selectedImageUri
                      ? "Додайте підпис до фото..."
                      : "Напишіть повідомлення..."
              }
              placeholderTextColor={COLORS.textMuted}
              value={inputText}
              onChangeText={handleTextChange}
              multiline
            />

            {/* Мікрофон / Надіслати */}
            {inputText.trim() || selectedImageUri ? (
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSubmitting}
                className={`w-11 h-11 rounded-full items-center justify-center bg-primary ${isSubmitting ? "opacity-50" : "active:opacity-80"
                  }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={editingMessageId ? "checkmark" : "send"}
                    size={20}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={startRecording}
                disabled={isSubmitting}
                className="w-11 h-11 rounded-full items-center justify-center bg-primary active:opacity-80"
              >
                <Ionicons
                  name="mic"
                  size={22}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Модальне вікно перегляду зображення */}
      <ImageViewerModal
        visible={!!fullscreenImage}
        imageUrl={fullscreenImage}
        onClose={() => setFullscreenImage(null)}
      />
      <ReactionPickerModal
        visible={reactionMessageId !== null}
        onClose={() => setReactionMessageId(null)}
        onSelectEmoji={async (emoji) => {
          if (!reactionMessageId) return;

          try {
            await toggleReaction({
              messageId: reactionMessageId,
              emoji,
            });
          } catch (error) {
            console.error("❌ Помилка реакції:", error);
          } finally {
            setReactionMessageId(null);
          }
        }}
      />
      <VideoNoteRecorder
        visible={isVideoRecorderVisible}
        onClose={() => setIsVideoRecorderVisible(false)}
        onSendVideo={handleSendVideoNote}
      />
    </KeyboardAvoidingView>
  );
}