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
import { Listy, type ListyRef } from 'antd'
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

// 虚拟列表的行高估算值由 antd 主题内部提供，实际高度由 ResizeObserver 动态测量

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

  // Listy 命令式滚动控制；scrollEl 为其内部滚动容器（由 onScroll 捕获）
  const listyRef = useRef<ListyRef>(null)
  const scrollElRef = useRef<HTMLElement | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  // 加载更早消息前，当前首条消息的 key，用于加载后锚点定位、保持视觉位置
  const anchorKeyRef = useRef<number | null>(null)
  const shouldScrollRef = useRef(true)

  const [inputText, setInputText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  // 虚拟列表视口高度（Listy 的 height 必须是数值）
  const [listHeight, setListHeight] = useState(0)

  const messages =
    useChatStore((s) => s.messages[peerId]) ?? []
  const setMessages = useChatStore((s) => s.setMessages)
  const prependMessages = useChatStore((s) => s.prependMessages)
  const sendMessageToStore = useChatStore((s) => s.sendMessage)

  const me = getUserInfo()

  // 测量消息视口高度
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => setListHeight(el.clientHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollToBottom = (id?: number) => {
    const doScroll = () => {
      const list = useChatStore.getState().messages[peerId] ?? []
      const targetId = id ?? list[list.length - 1]?.id
      if (targetId != null) {
        listyRef.current?.scrollTo({ key: targetId, align: 'bottom' })
      }
    }
    requestAnimationFrame(doScroll)
    // 图片等异步内容加载后高度变化，再补一次确保贴底
    setTimeout(doScroll, 150)
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
        const msg = sendMessageToStore(peerId, imgUrl, 1)
        scrollToBottom(msg.id)
      } catch (err) {
        console.error('发送图片失败:', err)
        alert(getErrorMessage(err, '发送失败'))
      }
      return
    }

    if (!inputText.trim()) return
    const content = inputText.trim()
    try {
      await sendChatRequest(content, 0)
      // 将消息添加到消息列表
      const msg = sendMessageToStore(peerId, content, 0)
      scrollToBottom(msg.id)
    } catch (err) {
      console.log(err)
      alert(getErrorMessage(err, '发送失败'))
    } finally {
      setInputText('')
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

    // 记录加载前的首条消息 key，加载后锚点定位保持视觉位置
    if (isLoadMore) {
      anchorKeyRef.current = messages[0]?.id ?? null
    }

    try {
      const result = await getMessageList({
        peerId,
        type: isGroup ? 'groupMessage' : 'chat',
        page,
        size: 20,
      })
      if (result.code === 200) {
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

        if (isLoadMore) {
          // 虚拟列表通过 key 锚点恢复位置，无需手动计算高度差
          const anchorKey = anchorKeyRef.current
          requestAnimationFrame(() => {
            if (anchorKey != null) {
              listyRef.current?.scrollTo({ key: anchorKey, align: 'top' })
            }
          })
        }
      }
    } catch (error) {
      console.error('获取历史消息失败:', error)
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        shouldScrollRef.current = true
        // 首次加载消息（非加载更多），滚动到最新一条
        if (!isLoadMore) {
          const list = useChatStore.getState().messages[peerId] ?? []
          const lastId = list[list.length - 1]?.id
          if (lastId != null) {
            listyRef.current?.scrollTo({ key: lastId, align: 'bottom' })
          }
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
        const container = scrollElRef.current
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
    if (shouldScrollRef.current && messages.length > 0) {
      const lastId = messages[messages.length - 1].id
      listyRef.current?.scrollTo({ key: lastId, align: 'bottom' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  const renderMessage = (msg: ChatMessage, index: number) => {
    const extraClass =
      `${index === 0 ? styles.firstMessage : ''} ${
        index === messages.length - 1 ? styles.lastMessage : ''
      }`.trim()
    return (
    <div
      className={`${styles.messageItem} ${extraClass} ${msg.type === 'sent' ? styles.sent : styles.received}`}
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
    )
  }

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

      <div ref={viewportRef} className={styles.messagesViewport}>
        {listHeight > 0 && (
          <Listy
            ref={listyRef}
            items={messages}
            rowKey="id"
            virtual
            height={listHeight}
            itemRender={renderMessage}
            onScroll={(e) => {
              scrollElRef.current = e.currentTarget
              handleScroll()
            }}
            classNames={{
              root: styles.messagesContainer,
              item: styles.messageRow,
            }}
          />
        )}
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
