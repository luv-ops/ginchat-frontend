import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { debounce } from 'lodash'
import { useChatStore } from '../store/chat'
import EmojiPicker from '../components/EmojiPicker'
import request from '../utils/request'
import { getMessageList } from '../api/message'
import { getUserInfo } from '../api/user'
import { formatTime } from '../utils/formatTime'
import { getErrorMessage } from '../utils/error'
import type { ChatMessage } from '../types'
import styles from './Chat.module.css'

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
]

export default function Chat() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const peerId = Number(params.id)
  const chatName = searchParams.get('name') || '未知用户'
  const chatAvatar = searchParams.get('avatar') || '👤'
  const isGroup = searchParams.get('type') === '1'

  // 仅临时存储本地文件，不上传
  const localImgFileRef = useRef<File | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(true)

  const [inputText, setInputText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const messages =
    useChatStore((s) => s.messages[peerId]) ?? []
  const setMessages = useChatStore((s) => s.setMessages)
  const prependMessages = useChatStore((s) => s.prependMessages)
  const sendMessageToStore = useChatStore((s) => s.sendMessage)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  async function sendChatRequest(content: string, msgType = 0) {
    const type = isGroup ? 'groupMessage' : 'chat'
    await request.post('/chat/send', {
      targetId: peerId,
      type,
      content,
      msgType, // 传给后端区分消息类型
    })
  }

  const handleSendMessage = async () => {
    if (localImgFileRef.current) {
      const file = localImgFileRef.current
      localImgFileRef.current = null
      try {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await request.post<string>('/upload/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        // 确保正确获取图片URL（处理不同的响应结构）
        const imgUrl = uploadRes.data
        await sendChatRequest(imgUrl, 1)
        // 将消息添加到消息列表
        sendMessageToStore(peerId, imgUrl, 1)
      } catch (err) {
        console.error('发送图片失败:', err)
        alert(getErrorMessage(err, '发送失败'))
      } finally {
        scrollToBottom()
      }
      return
    }

    if (!inputText.trim()) return
    const content = inputText.trim()
    try {
      await sendChatRequest(content, 0)
      // 将消息添加到消息列表
      sendMessageToStore(peerId, content, 0)
    } catch (err) {
      console.log(err)
      alert(getErrorMessage(err, '发送失败'))
    } finally {
      setInputText('')
      scrollToBottom()
    }
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      alert('请选择文件')
      return
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('只能选择图片或MP3文件')
      event.target.value = ''
      return
    }
    localImgFileRef.current = file
    await handleSendMessage()
    event.target.value = ''
  }

  const handleKeydown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendMessage()
    }
  }

  const formatName = (name: string) => {
    if (name.length > 4) {
      return name.slice(0, 4) + '...'
    }
    return name
  }

  const goBack = () => {
    navigate(-1)
  }

  const goToGroupDetail = () => {
    if (isGroup) {
      const query = new URLSearchParams({
        name: chatName,
        avatar: chatAvatar,
      }).toString()
      navigate(`/group-detail/${peerId}?${query}`)
    }
  }

  async function clearUnreadCount() {
    try {
      const res = await request.post(`/conversation/unreadClear/${peerId}`)
      if (res.code === 200) {
        useChatStore.getState().clearConversationUnread(peerId)
      }
    } catch (error) {
      console.error('清除未读数量失败:', error)
    }
  }

  const loadHistoryMessages = async (page = 1, isLoadMore = false) => {
    if (isLoading || (!hasMore && isLoadMore)) return

    setIsLoading(true)
    // 只有在加载更多历史消息（向上滚动）时才禁用自动滚动，首次加载不禁用
    shouldScrollRef.current = !isLoadMore

    const scrollEl = messagesContainerRef.current
    let oldScrollHeight = 0
    if (scrollEl) {
      oldScrollHeight = scrollEl.scrollHeight // 1. 记录旧高度
    }

    try {
      const result = await getMessageList({
        peerId,
        type: isGroup ? 'groupMessage' : 'chat',
        page,
        size: 20,
      })
      if (result.code === 200) {
        const me = getUserInfo()
        const historyMessages: ChatMessage[] = result.data.map((msg) => ({
          id: msg.id,
          type: String(msg.fromId) === String(me.id) ? 'sent' : 'received',
          content: msg.content,
          time: msg.createAt,
          name: msg.name || '',
          avatar: msg.avatar || '',
          msgType: msg.msgType || 0,
        }))

        const ordered = [...historyMessages].reverse()
        if (isLoadMore) {
          prependMessages(peerId, ordered)
        } else {
          setMessages(peerId, ordered)
        }

        setHasMore(historyMessages.length > 0)
        setCurrentPage(page)
        // 3. DOM 更新后，补偿滚动位置
        requestAnimationFrame(() => {
          if (scrollEl && isLoadMore) {
            const newScrollHeight = scrollEl.scrollHeight
            // 关键：让滚动条往下“补”新增的高度
            scrollEl.scrollTop = newScrollHeight - oldScrollHeight
          }
        })
      }
    } catch (error) {
      console.error('获取历史消息失败:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        shouldScrollRef.current = true
        // 如果是首次加载消息（非加载更多），确保滚动到底部
        if (!isLoadMore) {
          setTimeout(() => {
            const el = messagesContainerRef.current
            if (el) el.scrollTop = el.scrollHeight
          }, 50)
        }
      }, 100)
    }
  }

  // 始终保持最新的加载函数与页码，供稳定的防抖回调调用
  const loadHistoryRef = useRef(loadHistoryMessages)
  const pageRef = useRef(currentPage)
  useEffect(() => {
    loadHistoryRef.current = loadHistoryMessages
    pageRef.current = currentPage
  })

  const handleScroll = useMemo(
    () =>
      debounce(() => {
        const container = messagesContainerRef.current
        if (!container) return
        if (container.scrollTop <= 20) {
          void loadHistoryRef.current(pageRef.current + 1, true)
        }
      }, 300),
    [],
  )

  useEffect(() => {
    void loadHistoryRef.current(1)
  }, [])

  useEffect(() => {
    return () => {
      handleScroll.cancel()
      void clearUnreadCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleScroll])

  // 新消息到达时滚动到底部
  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const me = getUserInfo()

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatHeader}>
        <div className={styles.backBtn} onClick={goBack}>
          <span>←</span>
        </div>
        <div className={styles.contactInfo}>
          <span className={styles.contactAvatar}>{chatAvatar}</span>
          <span className={styles.contactName}>{formatName(chatName)}</span>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.actionIcon} onClick={goToGroupDetail}>
            ⚙️
          </span>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.messageItem} ${msg.type === 'sent' ? styles.sent : styles.received}`}
          >
            {msg.type === 'sent' ? (
              <>
                <div className={styles.messageContentWrapper}>
                  <div className={styles.messageBubble}>
                    {/* msgType为1表示图片，为0表示文字 */}
                    {Number(msg.msgType) === 1 ? (
                      <img src={msg.content} className={styles.messageImage} />
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                  <span className={styles.messageTime}>{formatTime(msg.time)}</span>
                </div>
                <div className={styles.messageAvatarWrapper}>
                  <span className={styles.messageAvatar}>
                    {msg.fromAvatar || me.avatar || '👤'}
                  </span>
                  {isGroup && (
                    <span className={styles.messageSender}>
                      {formatName(me.name || '未知用户')}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.messageAvatarWrapper}>
                  <span className={styles.messageAvatar}>{msg.avatar || chatAvatar}</span>
                  {isGroup && (
                    <span className={styles.messageSender}>
                      {formatName(msg.name || '未知用户')}
                    </span>
                  )}
                </div>
                <div className={styles.messageContentWrapper}>
                  <div className={styles.messageBubble}>
                    {/* msgType为1表示图片，为0表示文字 */}
                    {Number(msg.msgType) === 1 ? (
                      <img src={msg.content} className={styles.messageImage} />
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                  <span className={styles.messageTime}>{formatTime(msg.time)}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputActions}>
          <EmojiPicker onSelect={(emoji) => setInputText((t) => t + emoji)} />
          <span className={styles.inputIcon}>📷</span>
          <label className={`${styles.inputIcon} ${styles.fileLabel}`}>
            📁
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/mp3"
              onChange={(e) => void handleFileSelect(e)}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className={styles.inputWrapper}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="输入消息..."
            rows={1}
            onKeyDown={handleKeydown}
          ></textarea>
        </div>
        <button
          className={styles.sendBtn}
          disabled={!inputText.trim()}
          onClick={() => void handleSendMessage()}
        >
          发送
        </button>
      </div>
    </div>
  )
}
