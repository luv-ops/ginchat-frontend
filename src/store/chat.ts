import { create } from 'zustand'
import { GetConversations, getUserInfo } from '../api/user'
import type {
  ChatMessage,
  ContactItem,
  Conversation,
  FriendRequestItem,
  WsPushMessage,
} from '../types'

interface ChatState {
  // 好友请求未读数量
  friendRequestUnreadCount: number
  conversations: Conversation[]
  contacts: ContactItem[]
  messages: Record<number, ChatMessage[]>
  friendRequests: FriendRequestItem[]

  fetchConversations: () => Promise<void>
  setConversations: (list: Conversation[]) => void
  setContacts: (list: ContactItem[]) => void
  setFriendRequests: (list: FriendRequestItem[]) => void
  removeFriendRequest: (fromId: number) => void
  setFriendRequestUnreadCount: (count: number) => void

  setMessages: (peerId: number, msgs: ChatMessage[]) => void
  prependMessages: (peerId: number, older: ChatMessage[]) => void
  clearConversationUnread: (peerId: number) => void
  // 将消息添加到消息列表
  sendMessage: (to: number, content: string, msgType?: number) => ChatMessage

  // 处理收到聊天消息
  handleChatMessage: (data: WsPushMessage) => void
  // 处理收到好友请求
  handleFriendRequest: (data: FriendRequestItem) => void
  // 处理收到群消息
  handleGroupMessage: (data: WsPushMessage) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  friendRequestUnreadCount: 0,
  conversations: [],
  contacts: [],
  messages: {},
  friendRequests: [],

  fetchConversations: async () => {
    try {
      const result = await GetConversations()
      if (result.code === 200) {
        set({ conversations: result.data })
      }
    } catch (error) {
      console.error('获取对话失败:', error)
    }
  },

  setConversations: (list) => set({ conversations: list }),

  setContacts: (list) => set({ contacts: list }),

  setFriendRequests: (list) => set({ friendRequests: list }),

  removeFriendRequest: (fromId) =>
    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.fromId !== fromId),
    })),

  setFriendRequestUnreadCount: (count) =>
    set({ friendRequestUnreadCount: count }),

  setMessages: (peerId, msgs) =>
    set((state) => ({
      messages: { ...state.messages, [peerId]: msgs },
    })),

  prependMessages: (peerId, older) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [peerId]: [...older, ...(state.messages[peerId] ?? [])],
      },
    })),

  clearConversationUnread: (peerId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        Number(c.peerId) === peerId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  sendMessage: (to, content, msgType = 0) => {
    const message: ChatMessage = {
      id: Date.now(),
      type: 'sent',
      content,
      time: Date.now(),
      msgType,
    }
    set((state) => ({
      messages: {
        ...state.messages,
        [to]: [...(state.messages[to] ?? []), message],
      },
    }))
    return message
  },

  handleChatMessage: (data) => {
    console.log('收到', data)

    const conversationId = data.fromId
    const message: ChatMessage = {
      id: data.id,
      type: 'received',
      content: data.content,
      time: data.createAt,
      msgType: data.msgType || 0,
    }
    set((state) => {
      const exists = state.conversations.some(
        (c) => Number(c.peerId) === Number(conversationId),
      )
      return {
        messages: {
          ...state.messages,
          [conversationId]: [
            ...(state.messages[conversationId] ?? []),
            message,
          ],
        },
        conversations: exists
          ? state.conversations.map((c) =>
              Number(c.peerId) === Number(conversationId)
                ? {
                    ...c,
                    lastMsg: data.content,
                    lastTime: data.createAt,
                    unreadCount: c.unreadCount + 1,
                  }
                : c,
            )
          : state.conversations,
      }
    })

    // 不存在会话，获取所有会话
    const exists = get().conversations.some(
      (c) => Number(c.peerId) === Number(conversationId),
    )
    if (!exists) {
      void get().fetchConversations()
    }
  },

  handleFriendRequest: (data) => {
    console.log('收到好友请求', data)
    set((state) => ({
      friendRequests: [...state.friendRequests, data],
      friendRequestUnreadCount: state.friendRequestUnreadCount + 1,
    }))
  },

  handleGroupMessage: (data) => {
    console.log('收到群消息', data)
    const groupId = data.targetId as number
    const message: ChatMessage = {
      id: data.id,
      type: String(data.fromId) === String(getUserInfo().id) ? 'sent' : 'received',
      content: data.content,
      time: data.createAt,
      fromId: data.fromId,
      name: data.name || '',
      avatar: data.avatar || '',
      msgType: data.msgType || 0,
    }
    set((state) => {
      const exists = state.conversations.some(
        (c) => Number(c.peerId) === Number(groupId),
      )
      return {
        messages: {
          ...state.messages,
          [groupId]: [...(state.messages[groupId] ?? []), message],
        },
        conversations: exists
          ? state.conversations.map((c) =>
              Number(c.peerId) === Number(groupId)
                ? {
                    ...c,
                    lastMsg: data.content,
                    lastTime: data.createAt,
                    unreadCount: c.unreadCount + 1,
                  }
                : c,
            )
          : state.conversations,
      }
    })

    // 不存在会话，获取所有会话
    const exists = get().conversations.some(
      (c) => Number(c.peerId) === Number(groupId),
    )
    if (!exists) {
      void get().fetchConversations()
    }
  },
}))

/** 是否已登录（对应 Vue store 中的 isLoggedIn 计算属性） */
export const selectIsLoggedIn = (): boolean => !!localStorage.getItem('token')

/** 所有会话未读总数 */
export const selectTotalUnread = (state: ChatState): number =>
  state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
