import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '../store'
import {
  acceptFriendRequest,
  getFriendRequests,
  getUserInfo,
  readFriendRequests,
  rejectFriendRequest,
} from '../api/user'
import { getErrorMessage } from '../utils/error'
import type { FriendRequestItem } from '../types'
import styles from './FriendRequests.module.css'

export default function FriendRequests() {
  const navigate = useNavigate()

  const friendRequests = useChatStore((s) => s.friendRequests)
  const setFriendRequests = useChatStore((s) => s.setFriendRequests)
  const removeFriendRequest = useChatStore((s) => s.removeFriendRequest)
  const friendRequestUnreadCount = useChatStore((s) => s.friendRequestUnreadCount)
  const setFriendRequestUnreadCount = useChatStore(
    (s) => s.setFriendRequestUnreadCount,
  )

  const [isLoading, setIsLoading] = useState(false)

  const isSelfInitiated = (request: FriendRequestItem) => {
    return request.fromId === Number(getUserInfo().id)
  }

  const handleAccept = async (fromId: number) => {
    try {
      const result = await acceptFriendRequest(fromId)
      if (result.code === 200) {
        alert('已添加好友')
        removeFriendRequest(fromId)
      }
    } catch (error) {
      alert(getErrorMessage(error, '操作失败'))
    }
  }

  const handleReject = async (fromId: number) => {
    try {
      const result = await rejectFriendRequest(fromId)
      if (result.code === 200) {
        alert('已拒绝好友请求')
        removeFriendRequest(fromId)
      }
    } catch (error) {
      alert(getErrorMessage(error, '操作失败'))
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  const loadFriendRequests = async () => {
    setIsLoading(true)
    try {
      const result = await getFriendRequests()
      if (result.code === 200) {
        setFriendRequests(result.data)
      }
    } catch (error) {
      console.error('获取好友请求失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const readRequests = async () => {
    try {
      const result = await readFriendRequests()
      if (result.code === 200 && friendRequestUnreadCount) {
        setFriendRequestUnreadCount(0)
      }
    } catch (error) {
      console.error('读取好友请求失败:', error)
    }
  }

  useEffect(() => {
    void loadFriendRequests()
    void readRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.friendRequestsPage}>
      <div className={styles.header}>
        <span className={styles.backBtn} onClick={goBack}>
          ←
        </span>
        <h1 className={styles.title}>好友请求</h1>
        <span className={styles.headerPlaceholder}></span>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <span>加载中...</span>
        </div>
      ) : friendRequests.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <p className={styles.emptyText}>暂无好友请求</p>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {friendRequests.map((request) => (
            <div key={request.id} className={styles.requestItem}>
              <span className={styles.avatar}>{request.avatar || '👤'}</span>
              <div className={styles.requestInfo}>
                <div className={styles.requestName}>{request.name}</div>
                {isSelfInitiated(request) ? (
                  <div className={styles.requestStatus}>⏳ 等待对方同意中</div>
                ) : (
                  <div
                    className={`${styles.requestStatus} ${styles.requestStatusReceived}`}
                  >
                    请求添加你为好友
                  </div>
                )}
              </div>
              {!isSelfInitiated(request) ? (
                <div className={styles.requestActions}>
                  <button
                    className={`${styles.actionBtn} ${styles.acceptBtn}`}
                    onClick={() => handleAccept(request.fromId)}
                  >
                    接受
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                    onClick={() => handleReject(request.fromId)}
                  >
                    拒绝
                  </button>
                </div>
              ) : (
                <span className={`${styles.statusTag} ${styles.statusPending}`}>
                  等待中
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
