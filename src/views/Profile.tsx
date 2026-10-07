import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserInfo, updateUserInfo } from '../api/user'
import ws from '../utils/websocket'
import { getErrorMessage } from '../utils/error'
import styles from './Profile.module.css'

const avatarList = [
  '👤', '👦', '👧', '👨', '👩', '👴', '👵', '🧑',
  '😎', '🤓', '😊', '🥰', '😇', '🤩', '🥳', '😺',
  '🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐰', '🐮',
  '🌟', '⭐', '🔥', '💎', '🎯', '🚀', '💪', '🎉',
]

interface UserState {
  avatar: string
  nickname: string | undefined
  qq: number | string
  signature: string
  vip: boolean
}

export default function Profile() {
  const navigate = useNavigate()

  const [user, setUser] = useState<UserState>(() => {
    const info = getUserInfo()
    return {
      avatar: info.avatar || '👤',
      nickname: info.name,
      qq: info.id,
      signature: '这是我的个性签名',
      vip: true,
    }
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editNickname, setEditNickname] = useState('')
  const [editSignature, setEditSignature] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const openEditModal = () => {
    setEditNickname(user.nickname ?? '')
    setEditAvatar(user.avatar)
    setEditSignature('')
    setShowEditModal(true)
  }

  const handleUpdateProfile = async () => {
    if (!editNickname.trim()) {
      alert('昵称不能为空')
      return
    }
    const { name, avatar } = getUserInfo()
    const updateData: { name?: string; signature?: string; avatar?: string } = {}
    if (editNickname !== name) {
      updateData.name = editNickname
    }
    if (editSignature !== user.signature) {
      updateData.signature = editSignature
    }
    if (editAvatar !== avatar) {
      updateData.avatar = editAvatar
    }

    setIsUpdating(true)
    try {
      const result = await updateUserInfo(updateData)
      if (result.code === 200) {
        // 更新本地存储
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.name = editNickname
        storedUser.avatar = editAvatar
        localStorage.setItem('user', JSON.stringify(storedUser))

        // 更新页面显示
        setUser((prev) => ({
          ...prev,
          nickname: editNickname,
          signature: editSignature,
          avatar: editAvatar,
        }))

        setShowEditModal(false)
        alert('修改成功')
      } else {
        alert(result.message || '修改失败')
      }
    } catch (error) {
      console.error('修改资料失败:', error)
      alert(getErrorMessage(error, '修改失败，请稍后重试'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      // 断开WebSocket连接
      ws.disconnect()
      // 清除本地token
      localStorage.clear()
      // 跳转到登录页
      navigate('/login')
    }
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <div className={styles.profileBg}></div>
        <div className={styles.profileInfo}>
          <span className={styles.avatar}>{user.avatar}</span>
          <div className={styles.userDetail}>
            <div className={styles.nicknameRow}>
              <span className={styles.nickname}>{user.nickname}</span>
              {user.vip && <span className={styles.vipBadge}>VIP</span>}
            </div>
            <span className={styles.qq}>{user.qq}</span>
          </div>
          <span className={styles.editBtn} onClick={openEditModal}>
            编辑资料
          </span>
        </div>

        <div className={styles.profileStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>128</span>
            <span className={styles.statLabel}>好友</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>5</span>
            <span className={styles.statLabel}>动态</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>32</span>
            <span className={styles.statLabel}>赞</span>
          </div>
        </div>

        <div className={styles.signature}>{user.signature}</div>
      </div>

      <div className={styles.quickActions}>
        <div className={styles.actionBtn}>
          <span className={styles.actionIcon}>📱</span>
          <span className={styles.actionText}>扫码</span>
        </div>
        <div className={styles.actionBtn}>
          <span className={styles.actionIcon}>📡</span>
          <span className={styles.actionText}>面对面快传</span>
        </div>
        <div className={styles.actionBtn}>
          <span className={styles.actionIcon}>🔗</span>
          <span className={styles.actionText}>扫一扫</span>
        </div>
      </div>

      <div className={styles.logoutSection}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          退出登录
        </button>
      </div>

      {/* 编辑资料弹窗 */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>编辑资料</span>
              <span className={styles.modalClose} onClick={() => setShowEditModal(false)}>
                ×
              </span>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formItem}>
                <label className={styles.formLabel}>头像</label>
                <div className={styles.avatarPreview}>{editAvatar}</div>
                <div className={styles.avatarGrid}>
                  {avatarList.map((avatar) => (
                    <div
                      key={avatar}
                      className={`${styles.avatarOption} ${editAvatar === avatar ? styles.selected : ''}`}
                      onClick={() => setEditAvatar(avatar)}
                    >
                      {avatar}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.formItem}>
                <label className={styles.formLabel}>昵称</label>
                <input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  type="text"
                  className={styles.formInput}
                  placeholder="请输入昵称"
                  maxLength={20}
                />
              </div>

              <div className={styles.formItem}>
                <label className={styles.formLabel}>个性签名</label>
                <textarea
                  value={editSignature}
                  onChange={(e) => setEditSignature(e.target.value)}
                  className={styles.formTextarea}
                  placeholder="请输入个性签名"
                  maxLength={100}
                  rows={3}
                ></textarea>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowEditModal(false)}>
                取消
              </button>
              <button
                className={styles.btnConfirm}
                disabled={isUpdating}
                onClick={handleUpdateProfile}
              >
                {isUpdating ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
