import { useEffect, useRef, useState } from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
  createSearchParams,
} from 'react-router-dom'
import request from '../utils/request'
import { getErrorMessage } from '../utils/error'
import type { ContactItem, GroupDetail as GroupDetailData, GroupMember } from '../types'
import styles from './GroupDetail.module.css'

interface GroupInfo {
  id: number
  name: string
  avatar: string
  ownId: number | null
  members: GroupMember[]
  totalCount: number
}

export default function GroupDetail() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const groupId = Number(params.id)

  const [group, setGroup] = useState<GroupInfo>({
    id: groupId,
    name: searchParams.get('name') || '加载中...',
    avatar: searchParams.get('avatar') || '👥',
    ownId: null,
    members: [],
    totalCount: 0,
  })

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<ContactItem[]>([])
  const [availableFriends, setAvailableFriends] = useState<ContactItem[]>([])

  const groupRef = useRef(group)
  groupRef.current = group

  const loadGroupDetail = async (): Promise<GroupDetailData | null> => {
    try {
      const result = await request.get<GroupDetailData>(`/group/detail/${groupId}`)
      if (result.code === 200) {
        const detail = result.data
        setGroup({
          id: detail.group_id,
          name: detail.group_name || searchParams.get('name') || '未知群',
          avatar: detail.avatar || searchParams.get('avatar') || '👥',
          ownId: detail.ownId,
          totalCount: detail.totalCount,
          members: detail.members || [],
        })
        return detail
      }
    } catch (error) {
      console.error('获取群详情失败:', error)
    }
    return null
  }

  const loadAvailableFriends = async () => {
    try {
      // 先确保群成员数据已加载
      let members = groupRef.current.members
      if (members.length === 0) {
        const detail = await loadGroupDetail()
        if (detail) members = detail.members
      }

      const result = await request.get<ContactItem[]>('/friend/list')
      if (result.code === 200) {
        // 获取当前群成员的user_id列表
        const memberIds = new Set(members.map((m) => String(m.user_id)))
        // 过滤掉已经在群里的好友（好友的ID字段是id）
        setAvailableFriends(
          result.data.filter((friend) => !memberIds.has(String(friend.id))),
        )
      }
    } catch (error) {
      console.error('获取好友列表失败:', error)
    }
  }

  const toggleFriendSelect = (friend: ContactItem) => {
    setSelectedFriends((prev) => {
      const index = prev.findIndex((f) => f.id === friend.id)
      if (index > -1) {
        return prev.filter((_, i) => i !== index)
      }
      return [...prev, friend]
    })
  }

  const inviteFriends = async () => {
    if (selectedFriends.length === 0) {
      alert('请选择要邀请的好友')
      return
    }

    try {
      const result = await request.post('/group/invite', {
        group_id: groupId,
        invited_id: selectedFriends.map((f) => f.id),
      })
      if (result.code === 200) {
        alert('邀请成功')
        setShowInviteModal(false)
        setSelectedFriends([])
        void loadGroupDetail()
      } else {
        alert(result.message || '邀请失败')
      }
    } catch (error) {
      console.error('邀请好友失败:', error)
      alert(getErrorMessage(error, '邀请失败，请稍后重试'))
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  const goToMembers = () => {
    const search = createSearchParams({
      name: group.name,
      totalCount: String(group.totalCount),
    }).toString()
    navigate(`/group-members/${groupId}?${search}`)
  }

  const openInviteModal = () => {
    setShowInviteModal(true)
    void loadAvailableFriends()
  }

  useEffect(() => {
    void loadGroupDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  return (
    <div className={styles.groupDetailPage}>
      <div className={styles.header}>
        <span className={styles.backBtn} onClick={goBack}>
          ‹
        </span>
        <h1 className={styles.title}>群聊设置</h1>
        <span className={styles.placeholder}></span>
      </div>

      <div className={styles.groupInfo}>
        <div className={styles.groupAvatar}>{group.avatar || '👥'}</div>
        <div className={styles.groupName}>{group.name}</div>
        <div className={styles.groupId}>群ID: {groupId}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>群成员</span>
          <div className={styles.memberCount} onClick={goToMembers}>
            <span>{group.totalCount}人</span>
            <span className={styles.arrow}>{'>'}</span>
          </div>
        </div>
        <div className={styles.memberGrid}>
          {group.members.slice(0, 8).map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <span className={styles.memberAvatar}>{member.avatar}</span>
              <div className={styles.memberName}>
                {member.name}
                {Number(member.role) === 2 && <span className={styles.ownerTag}>群主</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.actionItem} onClick={openInviteModal}>
          <span className={styles.actionIcon}>👥</span>
          <span className={styles.actionText}>邀请好友</span>
          <span className={styles.actionArrow}>{'>'}</span>
        </div>
      </div>

      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>选择要邀请的好友</span>
              <span className={styles.modalClose} onClick={() => setShowInviteModal(false)}>
                ×
              </span>
            </div>

            <div className={styles.modalBody}>
              {availableFriends.length === 0 ? (
                <div className={styles.emptyState}>没有可邀请的好友</div>
              ) : (
                availableFriends.map((friend) => {
                  const selected = selectedFriends.some((f) => f.id === friend.id)
                  return (
                    <div
                      key={friend.id}
                      className={`${styles.selectItem} ${selected ? styles.selected : ''}`}
                      onClick={() => toggleFriendSelect(friend)}
                    >
                      <span className={styles.selectAvatar}>{friend.avatar}</span>
                      <span className={styles.selectName}>{friend.name}</span>
                      {selected && <span className={styles.selectCheck}>✓</span>}
                    </div>
                  )
                })
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={() => setShowInviteModal(false)}>
                取消
              </button>
              <button className={styles.btnConfirm} onClick={inviteFriends}>
                邀请 ({selectedFriends.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
