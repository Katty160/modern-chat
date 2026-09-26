import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
/**
 * Отримання списку повідомлень у вказаній кімнаті в хронологічному порядку
 */
export const listMessages = query({
  args: { chatRoomId: v.id("chatRooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chat_room", (q) => q.eq("chatRoomId", args.chatRoomId))
      .order("asc")
      .collect();
  },
});

export const getPaginatedMessages = query({
  args: {
    chatRoomId: v.id("chatRooms"),
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const paginated = await ctx.db
      .query("messages")
      .withIndex("by_chat_room", (q) =>
        q.eq("chatRoomId", args.chatRoomId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const messagesWithSender = await Promise.all(
      paginated.page.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        return {
          ...message,

          senderName:
            sender?.name ??
            sender?.email ??
            "Користувач",

          senderPhoto: sender?.image,
        };
      })
    );

    return {
      ...paginated,
      page: messagesWithSender,
    };
  },
});


/**
 * Відправка нового повідомлення
 */
export const sendMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    content: v.string(),
    replyToId: v.optional(v.id("messages")),
    replyToSender: v.optional(v.string()),
    replyToText: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized: Потрібна авторизація");
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error("User not found: Користувача не знайдено");
    }

    const trimmedContent = args.content.trim();

    if (!trimmedContent) {
      throw new Error("Message content cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image,
      content: trimmedContent,

      replyToId: args.replyToId,
      replyToSender: args.replyToSender,
      replyToText: args.replyToText,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: trimmedContent,
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});
/**
 * Редагування тексту власного повідомлення
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Потрібна авторизація");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found: Повідомлення не знайдено");
    }

    // Редагувати дозволено лише власні повідомлення
    if (message.senderId !== userId) {
      throw new Error("Forbidden: Ви можете редагувати лише власні повідомлення");
    }

    const trimmedContent = args.content.trim();
    if (!trimmedContent) {
      throw new Error("Повідомлення не може бути порожнім");
    }

    // Оновлюємо текст повідомлення
    await ctx.db.patch(args.messageId, {
      content: trimmedContent,
      isEdited: true,
    });

    // Якщо це останнє повідомлення в кімнаті — оновлюємо прев'ю кімнати
    const room = await ctx.db.get(message.chatRoomId);
    if (room && room.lastMessageAt === message._creationTime) {
      await ctx.db.patch(message.chatRoomId, {
        lastMessage: `${message.senderName}: ${trimmedContent}`,
      });
    }
  },
});

/**
 * Видалення власного повідомлення
 */
/**
 * Видалення власного повідомлення
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Unauthorized: Потрібна авторизація");
    }

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message not found: Повідомлення не знайдено");
    }

    // Видаляти можна тільки власні повідомлення
    if (message.senderId !== userId) {
      throw new Error(
        "Forbidden: Ви можете видаляти лише власні повідомлення"
      );
    }

    // Якщо повідомлення містить фото —
    // видаляємо фото також із Convex Storage
    if (message.storageId) {
      await ctx.storage.delete(message.storageId);
    }

    // Видаляємо повідомлення
    await ctx.db.delete(args.messageId);

    // Знаходимо останнє повідомлення, яке залишилося в чаті
    const lastRemainingMessage = await ctx.db
      .query("messages")
      .withIndex("by_chat_room", (q) =>
        q.eq("chatRoomId", message.chatRoomId)
      )
      .order("desc")
      .first();

    // Оновлюємо прев'ю чату
    await ctx.db.patch(message.chatRoomId, {
      lastMessage: lastRemainingMessage
        ? `${lastRemainingMessage.senderName}: ${lastRemainingMessage.content ||
        (lastRemainingMessage.imageUrl ? "📷 Фото" : "")
        }`
        : "Повідомлень немає",

      lastMessageAt:
        lastRemainingMessage?._creationTime ?? Date.now(),
    });
  },
});

/**
 * Генерація тимчасового посилання для завантаження файлу в сховище
 */
export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Необхідно авторизуватися");
  }
  return await ctx.storage.generateUploadUrl();
});

/**
 * Відправка повідомлення з медіафайлом (зображенням)
 */
export const sendMediaMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
    replyToSender: v.optional(v.string()),
    replyToText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized: Потрібна авторизація");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Користувача не знайдено");
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) {
      throw new Error("Не вдалося отримати посилання на збережений файл");
    }

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image,
      content: args.caption?.trim() || undefined,
      imageUrl,
      storageId: args.storageId,
      replyToId: args.replyToId,
      replyToSender: args.replyToSender,
      replyToText: args.replyToText,
    });

    await ctx.db.patch(args.chatRoomId, {
      lastMessage: `${user.name ?? "Користувач"}: 📷 Фотографія`,
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Мутація для відправки голосового повідомлення
 */
export const sendAudioMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    audioStorageId: v.id("_storage"),
    audioDuration: v.number(),
    replyToId: v.optional(v.id("messages")),
    replyToSender: v.optional(v.string()),
    replyToText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Необхідно авторизуватися");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Користувача не знайдено");
    }

    // Отримуємо публічне посилання на аудіофайл зі сховища
    const audioUrl = await ctx.storage.getUrl(args.audioStorageId);
    if (!audioUrl) {
      throw new Error("Не вдалося отримати URL аудіофайлу");
    }

    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email?.split("@")[0] ?? "Користувач",
      senderPhoto: user.image ?? undefined,
      audioUrl,
      audioStorageId: args.audioStorageId,
      audioDuration: args.audioDuration,
      replyToId: args.replyToId,
      replyToSender: args.replyToSender,
      replyToText: args.replyToText,
    });

    // Оновлюємо останнє повідомлення у кімнаті
    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "🎤 Голосове повідомлення",
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

export const sendVideoNoteMessage = mutation({
  args: {
    chatRoomId: v.id("chatRooms"),
    videoStorageId: v.id("_storage"),
    videoDuration: v.number(),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("Необхідно авторизуватися");
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error("Користувача не знайдено");
    }

    // Отримуємо публічний URL відео з Convex Storage
    const videoUrl = await ctx.storage.getUrl(args.videoStorageId);

    if (!videoUrl) {
      throw new Error("Не вдалося отримати URL відеофайлу");
    }

    // Зберігаємо відеоповідомлення
    const messageId = await ctx.db.insert("messages", {
      chatRoomId: args.chatRoomId,
      senderId: userId,
      senderName: user.name ?? user.email ?? "Користувач",
      senderPhoto: user.image ?? undefined,

      videoUrl,
      videoStorageId: args.videoStorageId,
      videoDuration: args.videoDuration,
      isVideoNote: true,
    });

    // Оновлюємо останню активність кімнати
    await ctx.db.patch(args.chatRoomId, {
      lastMessage: "🎥 Відеоповідомлення",
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});


