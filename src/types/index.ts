/** 通用接口响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message?: string
  data: T
}

/** 本地存储的用户信息 */
export interface UserInfo {
  id: number | string
  name: string
  avatar: string
}

/** 本地存储的 token 结构 */
export interface TokenInfo {
  token: string
  createTime: number
}

/** 会话列表项 */
export interface Conversation {
  id: number
  peerId: number
  name: string
  avatar: string
  /** 0-单聊 1-群聊 */
  type: number | string
  lastMsg: string
  lastTime: number | string
  unreadCount: number
}

/** 聊天消息 */
export interface ChatMessage {
  id: number
  /** sent-自己发送 received-对方发送 */
  type: 'sent' | 'received'
  content: string
  time: number | string
  name?: string
  avatar?: string
  fromAvatar?: string
  fromId?: number | string
  /** 0-文字 1-图片 */
  msgType?: number
}

/** 联系人 */
export interface ContactItem {
  id: number
  name: string
  avatar: string
  isOnline?: number
}

/** 好友请求项 */
export interface FriendRequestItem {
  fromId: number
  targetId: number
  /** 列表接口为空串；WS 推送时为消息类型 'friendRequest' */
  type?: string
  name: string
  avatar?: string
  msg?: string
  /** 请求状态（如待处理/已同意/已拒绝） */
  status?: number
  create_at?: string
  remark?: string
}

/** 群成员 */
export interface GroupMember {
  id: number
  user_id: number
  name: string
  avatar: string
  /** 2-群主 */
  role: number
}

/** 群详情 */
export interface GroupDetail {
  group_id: number
  group_name: string
  avatar: string
  ownId: number | null
  totalCount: number
  members: GroupMember[]
}

/** WebSocket 推送的消息 */
export interface WsPushMessage {
  type: string
  id: number
  fromId: number
  content: string
  createAt: number
  msgType?: number
  /** 群消息字段 */
  targetId?: number
  name?: string
  avatar?: string
}
