import { useEffect, useState, type MouseEvent } from 'react'
import { useNavigate, createSearchParams } from 'react-router-dom'
import AddFriendModal from '../components/AddFriendModal'
import { useChatStore } from '../store'
import request from '../utils/request'
import type { ContactItem } from '../types'
import styles from './Contact.module.css'

export default function Contact() {
  const navigate = useNavigate()

  const contacts = useChatStore((s) => s.contacts)
  const setContacts = useChatStore((s) => s.setContacts)
  const friendRequestUnreadCount = useChatStore((s) => s.friendRequestUnreadCount)
  const fetchFriendRequestUnreadCount = useChatStore(
    (s) => s.fetchFriendRequestUnreadCount,
  )

  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)

  const getContactList = async () => {
    try {
      const result = await request.get<ContactItem[]>('/friend/list')
      if (result.code === 200) {
        setContacts(result.data)
      }
    } catch (error) {
      console.error('获取联系人失败:', error)
    }
  }

  const goToFriendRequests = () => {
    navigate('/friend-requests')
  }

  const goToFriendDetail = (contact: ContactItem) => {
    const search = createSearchParams({
      name: contact.name,
      avatar: contact.avatar,
    }).toString()
    navigate(`/friend-detail/${contact.id}?${search}`)
  }

  const showAddOptions = () => {
    setShowActionSheet(true)
  }

  const closeActionSheet = () => {
    setShowActionSheet(false)
  }

  const goToAddFriend = () => {
    closeActionSheet()
    setShowAddFriendModal(true)
  }

  const goToCreateGroup = () => {
    closeActionSheet()
    navigate('/create-group')
  }

  const stopPropagation = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }

  useEffect(() => {
    void fetchFriendRequestUnreadCount()
    void getContactList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.contactPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>联系人</h1>
        <div className={styles.headerRight}>
          <span className={styles.headerIcon} onClick={showAddOptions}>
            ➕
          </span>
          <span className={styles.headerIcon}>🔍</span>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" placeholder="搜索" />
      </div>

      <div className={styles.friendRequestEntry} onClick={goToFriendRequests}>
        <div className={styles.entryContent}>
          <span className={styles.entryIcon}>📮</span>
          <span className={styles.entryText}>好友请求</span>
        </div>
        <div className={styles.entryRight}>
          {friendRequestUnreadCount > 0 && (
            <span className={styles.entryBadge}>{friendRequestUnreadCount}</span>
          )}
          <span className={styles.entryArrow}>›</span>
        </div>
      </div>

      <div className={styles.contactList}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className={styles.contactItem}
            onClick={() => goToFriendDetail(contact)}
          >
            <div className={styles.avatarWrapper}>
              <span className={styles.avatar}>{contact.avatar}</span>
              {contact.isOnline === 1 && <span className={styles.onlineIndicator}></span>}
            </div>
            <span className={styles.name}>{contact.name}</span>
          </div>
        ))}
      </div>

      <AddFriendModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

      {showActionSheet && (
        <div className={styles.actionSheetOverlay} onClick={closeActionSheet}>
          <div className={styles.actionSheet} onClick={stopPropagation}>
            <div className={styles.actionItem} onClick={goToAddFriend}>
              <span className={styles.actionIcon}>👤</span>
              <span className={styles.actionText}>添加好友</span>
            </div>
            <div className={styles.actionItem} onClick={goToCreateGroup}>
              <span className={styles.actionIcon}>👥</span>
              <span className={styles.actionText}>创建群聊</span>
            </div>
            <div className={styles.actionCancel} onClick={closeActionSheet}>
              取消
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
