import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate, createSearchParams } from 'react-router-dom'
import { formatTime } from '../utils/formatTime'
import { useChatStore } from '../store/chat'
import type { Conversation } from '../types'
import styles from './Message.module.css'

export default function Message() {
  const navigate = useNavigate()
  const conversations = useChatStore((s) => s.conversations)
  const fetchConversations = useChatStore((s) => s.fetchConversations)
  const [keyword, setKeyword] = useState('')

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value)
    console.log('搜索:', e.target.value)
  }

  const goToChat = (msg: Conversation) => {
    const search = createSearchParams({
      name: msg.name,
      avatar: msg.avatar,
      type: String(msg.type),
    }).toString()
    navigate(`/chat/${msg.peerId}?${search}`)
  }

  useEffect(() => {
    void fetchConversations()
  }, [fetchConversations])

  return (
    <div className={styles.messagePage}>
      <div className={styles.header}>
        <h1 className={styles.title}>消息</h1>
        <div className={styles.headerRight}>
          <span className={styles.headerIcon}>⚙️</span>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" placeholder="搜索" value={keyword} onChange={handleSearch} />
      </div>

      <div className={styles.messageList}>
        {conversations.map((msg) => (
          <div key={msg.id} className={styles.messageItem} onClick={() => goToChat(msg)}>
            <span className={styles.avatar}>{msg.avatar}</span>
            <div className={styles.messageContent}>
              <div className={styles.messageHeader}>
                <span className={styles.name}>{msg.name}</span>
                <span className={styles.time}>{formatTime(msg.lastTime)}</span>
              </div>
              <div className={styles.messageFooter}>
                <span className={styles.content}>{msg.lastMsg}</span>
                {msg.unreadCount > 0 && <span className={styles.unread}>{msg.unreadCount}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
