import request from '../utils/request'
import type { ChatMessage } from '../types'

export interface MessageListParams {
  peerId: number
  /** chat-单聊 groupMessage-群聊 */
  type: 'chat' | 'groupMessage'
  page: number
  size: number
}

/** 后端历史消息原始结构 */
export interface HistoryMessageRaw {
  id: number
  fromId: number
  content: string
  createAt: number
  name?: string
  avatar?: string
  msgType?: number
}

export const getMessageList = (params: MessageListParams) => {
  return request.get<HistoryMessageRaw[]>('/message/list', { params })
}

export type { ChatMessage }
