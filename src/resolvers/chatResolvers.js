const Chat    = require('../models/Chat');
const Message = require('../models/Message');
const User    = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Free users: max 5 NEW chats per day
const FREE_DAILY_CHAT_LIMIT = 5;

const chatResolvers = {
  Query: {
    // ── Chat list ──────────────────────────────────────────────────
    chatList: async (_, { limit = 20 }, context) => {
      const authUser = requireAuth(context);
      return Chat.find({ participants: authUser._id })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .populate('participants')
        .populate('lastMessage');
    },

    // ── Messages ───────────────────────────────────────────────────
    messages: async (_, { chatId, limit = 30 }, context) => {
      const authUser = requireAuth(context);

      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error('Chat not found.');

      const isMember = chat.participants.some(
        p => String(p) === String(authUser._id),
      );
      if (!isMember) throw new Error('Access denied.');

      return Message.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('sender');
    },
  },

  Mutation: {
    // ── Create chat ────────────────────────────────────────────────
    createChat: async (_, { userId }, context) => {
      const authUser    = requireAuth(context);
      const Subscription = require('../models/Subscription');

      if (String(userId) === String(authUser._id)) {
        throw new Error('Cannot start a chat with yourself.');
      }

      // Check existing chat
      const existing = await Chat.findOne({
        participants: { $all: [authUser._id, userId] },
      });
      if (existing) return existing.populate('participants');

      // Enforce daily chat limit for free users
      const sub = await Subscription.findOne({ user: authUser._id });
      if (!sub || sub.plan === 'free') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayCount = await Chat.countDocuments({
          participants: authUser._id,
          createdAt: { $gte: startOfDay },
        });

        if (todayCount >= FREE_DAILY_CHAT_LIMIT) {
          throw new Error(
            `Free users can start at most ${FREE_DAILY_CHAT_LIMIT} new chats per day. Upgrade to continue.`,
          );
        }
      }

      const chat = await Chat.create({
        participants: [authUser._id, userId],
      });
      return chat.populate('participants');
    },

    // ── Send message ───────────────────────────────────────────────
    sendMessage: async (_, { chatId, text }, context) => {
      const authUser = requireAuth(context);

      if (!text?.trim()) throw new Error('Message text cannot be empty.');

      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error('Chat not found.');

      const isMember = chat.participants.some(
        p => String(p) === String(authUser._id),
      );
      if (!isMember) throw new Error('Access denied.');

      const message = await Message.create({
        chat:   chatId,
        sender: authUser._id,
        text:   text.trim(),
        readBy: [authUser._id],
      });

      // Update chat's lastMessage and updatedAt
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        updatedAt:   new Date(),
      });

      return message.populate('sender');
    },
  },

  Chat: {
    participants: (parent) => {
      if (parent.participants?.[0]?.username) return parent.participants;
      return User.find({ _id: { $in: parent.participants } });
    },
    lastMessage: (parent) => {
      if (!parent.lastMessage) return null;
      if (parent.lastMessage?.text) return parent.lastMessage;
      return Message.findById(parent.lastMessage);
    },
  },

  Message: {
    chat:   (parent) => Chat.findById(parent.chat),
    sender: (parent) => {
      if (parent.sender?.username) return parent.sender;
      return User.findById(parent.sender);
    },
    readBy: (parent) => User.find({ _id: { $in: parent.readBy } }),
  },
};

module.exports = chatResolvers;
