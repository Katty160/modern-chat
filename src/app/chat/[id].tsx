import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  background: "#0B0B0F",
  card: "#151519",
  border: "#25252C",
  primary: "#E8A1B8",
  white: "#FFFFFF",
  muted: "#777780",
  darkMuted: "#55555F",
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const roomId = id as Id<"chatRooms">;

  const room = useQuery(api.rooms.getRoom, { roomId });
  const messages = useQuery(api.messages.listMessages, {
    chatRoomId: roomId,
  });
  const currentUser = useQuery(api.users.currentUser);

  const sendMessage = useMutation(api.messages.sendMessage);

  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();

    setInputText("");
    setIsSending(true);

    try {
      await sendMessage({
        chatRoomId: roomId,
        content: text,
      });
    } catch (error) {
      console.error("Error sending message", error);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!room) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <Stack.Screen
        options={{
          title: room.title,

          headerStyle: {
            backgroundColor: COLORS.background,
          },

          headerTintColor: COLORS.white,

          headerShadowVisible: false,

          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/settings/${roomId}`)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: COLORS.card,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 4,
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {messages === undefined ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            gap: 12,
            flexGrow: messages.length === 0 ? 1 : undefined,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 80,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: "#E8A1B814",
                  borderWidth: 1,
                  borderColor: "#E8A1B826",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={32}
                  color={COLORS.primary}
                />
              </View>

              <Text
                style={{
                  color: COLORS.white,
                  fontSize: 16,
                  fontWeight: "700",
                  marginTop: 16,
                }}
              >
                Тут поки тихо
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 13,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Напишіть першим і почніть розмову
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe =
              currentUser && item.senderId === currentUser._id;

            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  justifyContent: isMe
                    ? "flex-end"
                    : "flex-start",
                  gap: 8,
                }}
              >
                {!isMe && (
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: COLORS.card,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 2,
                      overflow: "hidden",
                    }}
                  >
                    {item.senderPhoto ? (
                      <Image
                        source={{ uri: item.senderPhoto }}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    ) : (
                      <Text
                        style={{
                          color: COLORS.primary,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {item.senderName[0]?.toUpperCase() ?? "U"}
                      </Text>
                    )}
                  </View>
                )}

                <View
                  style={{
                    maxWidth: "78%",
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    borderRadius: 18,
                    backgroundColor: isMe
                      ? COLORS.primary
                      : COLORS.card,
                    borderWidth: isMe ? 0 : 1,
                    borderColor: COLORS.border,
                    borderBottomRightRadius: isMe ? 4 : 18,
                    borderBottomLeftRadius: isMe ? 18 : 4,
                  }}
                >
                  {!isMe && (
                    <Text
                      style={{
                        color: COLORS.primary,
                        fontSize: 12,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      {item.senderName}
                    </Text>
                  )}

                  <Text
                    style={{
                      color: isMe
                        ? COLORS.background
                        : COLORS.white,
                      fontSize: 15,
                      lineHeight: 21,
                    }}
                  >
                    {item.content}
                  </Text>

                  <Text
                    style={{
                      color: isMe
                        ? "#0B0B0F99"
                        : COLORS.muted,
                      fontSize: 10,
                      textAlign: "right",
                      marginTop: 5,
                    }}
                  >
                    {formatTime(item._creationTime)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Поле введення */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 11,
            color: COLORS.white,
            fontSize: 15,
            minHeight: 44,
            maxHeight: 110,
          }}
          placeholder="Напишіть повідомлення..."
          placeholderTextColor={COLORS.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          style={{
            width: 44,
            height: 44,
            borderRadius: 17,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              inputText.trim() && !isSending
                ? COLORS.primary
                : COLORS.card,
            borderWidth:
              inputText.trim() && !isSending ? 0 : 1,
            borderColor: COLORS.border,
          }}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={
                inputText.trim()
                  ? COLORS.background
                  : COLORS.muted
              }
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}