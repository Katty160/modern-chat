import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter, Stack } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const COLORS = {
  background: "#0B0B0F",
  card: "#151519",
  border: "#25252C",
  primary: "#E8A1B8",
  white: "#FFFFFF",
  muted: "#777780",
};

export default function NewRoomScreen() {
  const router = useRouter();
  const createRoom = useMutation(api.rooms.createRoom);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert("Помилка", "Будь ласка, введіть назву кімнати.");
      return;
    }

    setIsLoading(true);

    try {
      const roomId = await createRoom({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      router.back();
      router.push(`/chat/${roomId}`);
    } catch (error) {
      console.error("Error creating room", error);
      Alert.alert("Помилка", "Не вдалося створити кімнату.");
    } finally {
      setIsLoading(false);
    }
  };

  const canCreate = title.trim().length > 0 && !isLoading;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      <Stack.Screen
        options={{
          title: "Нова кімната",

          headerStyle: {
            backgroundColor: COLORS.background,
          },

          headerTintColor: COLORS.white,

          headerShadowVisible: false,

          headerRight: () => (
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!canCreate}
              activeOpacity={0.8}
              style={{
                height: 38,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: canCreate
                  ? COLORS.primary
                  : COLORS.card,
                borderWidth: canCreate ? 0 : 1,
                borderColor: COLORS.border,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 4,
              }}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.background}
                />
              ) : (
                <Text
                  style={{
                    color: canCreate
                      ? COLORS.background
                      : COLORS.muted,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  Створити
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
      >
        {/* Заголовок */}
        <View
          style={{
            alignItems: "center",
            paddingTop: 10,
            paddingBottom: 24,
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
            <Text
              style={{
                fontSize: 32,
              }}
            >
              💬
            </Text>
          </View>

          <Text
            style={{
              color: COLORS.white,
              fontSize: 24,
              fontWeight: "700",
              marginTop: 14,
            }}
          >
            Нова кімната
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 13,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            Створіть місце для спілкування
          </Text>
        </View>

        {/* Форма */}
        <View
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 26,
            padding: 18,
          }}
        >
          {/* Назва */}
          <View>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 9,
              }}
            >
              Назва кімнати *
            </Text>

            <TextInput
              style={{
                backgroundColor: COLORS.background,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 16,
                paddingHorizontal: 15,
                paddingVertical: 13,
                color: COLORS.white,
                fontSize: 15,
              }}
              placeholder="Наприклад: React Native"
              placeholderTextColor={COLORS.muted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />

            <Text
              style={{
                color: COLORS.muted,
                fontSize: 10,
                textAlign: "right",
                marginTop: 6,
              }}
            >
              {title.length}/100
            </Text>
          </View>

          {/* Опис */}
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 9,
              }}
            >
              Опис
            </Text>

            <TextInput
              style={{
                backgroundColor: COLORS.background,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 16,
                paddingHorizontal: 15,
                paddingTop: 14,
                paddingBottom: 14,
                color: COLORS.white,
                fontSize: 15,
                minHeight: 120,
                textAlignVertical: "top",
              }}
              placeholder="Короткий опис теми спілкування..."
              placeholderTextColor={COLORS.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={300}
            />

            <Text
              style={{
                color: COLORS.muted,
                fontSize: 10,
                textAlign: "right",
                marginTop: 6,
              }}
            >
              {description.length}/300
            </Text>
          </View>
        </View>

        {/* Кнопка */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canCreate}
          activeOpacity={0.8}
          style={{
            height: 52,
            marginTop: 18,
            borderRadius: 18,
            backgroundColor: canCreate
              ? COLORS.primary
              : COLORS.card,
            borderWidth: canCreate ? 0 : 1,
            borderColor: COLORS.border,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={canCreate ? COLORS.background : COLORS.primary}
            />
          ) : (
            <>
              <Text
                style={{
                  color: canCreate
                    ? COLORS.background
                    : COLORS.muted,
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Створити кімнату
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text
          style={{
            color: "#55555F",
            fontSize: 11,
            textAlign: "center",
            marginTop: 14,
          }}
        >
          Після створення ви одразу потрапите в кімнату
        </Text>
      </ScrollView>
    </View>
  );
}