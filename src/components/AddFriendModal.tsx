import { useState } from 'react'
import type { MouseEvent } from 'react'
import { addFriend } from '../api/user'
import { getErrorMessage } from '../utils/error'
import styles from './AddFriendModal.module.css'

interface AddFriendModalProps {
  visible: boolean
  onClose: () => void
}

export default function AddFriendModal({ visible, onClose }: AddFriendModalProps) {
  const [targetId, setTargetId] = useState('')
  const [remark, setRemark] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!targetId) {
      alert('请输入ID')
      return
    }

    setIsLoading(true)
    try {
      const result = await addFriend({
        targetId: parseInt(targetId),
        remark,
      })
      if (result.code === 200) {
        alert('好友请求已发送')
        setTargetId('')
        setRemark('')
        onClose()
      }
    } catch (error) {
      alert(getErrorMessage(error, '发送失败'))
    } finally {
      setIsLoading(false)
    }
  }

  // 仅点击遮罩本身时关闭
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!visible) return null

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>添加好友</span>
          <span className={styles.modalClose} onClick={onClose}>
            ✕
          </span>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>👤</span>
            <input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              type="text"
              placeholder="输入ID"
            />
          </div>
          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>📝</span>
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              type="text"
              placeholder="输入备注"
            />
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>
            取消
          </button>
          <button
            className={`${styles.btn} ${styles.btnConfirm}`}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '发送中...' : '发送请求'}
          </button>
        </div>
      </div>
    </div>
  )
}
