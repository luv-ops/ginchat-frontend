import { useNavigate, useParams, useSearchParams, createSearchParams } from 'react-router-dom'
import styles from './FriendDetail.module.css'

export default function FriendDetail() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const friendId = Number(params.id)
  const friend = {
    id: friendId,
    avatar: searchParams.get('avatar') || '👤',
    name: searchParams.get('name') || '加载中...',
  }

  const goBack = () => {
    navigate(-1)
  }

  const goToChat = () => {
    const search = createSearchParams({
      name: friend.name,
      avatar: friend.avatar,
      type: '0',
    }).toString()
    navigate(`/chat/${friendId}?${search}`)
  }

  return (
    <div className={styles.friendDetailPage}>
      <div className={styles.header}>
        <span className={styles.backBtn} onClick={goBack}>
          ←
        </span>
        <h1 className={styles.title}>好友详情</h1>
        <span className={styles.headerPlaceholder}></span>
      </div>

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <span className={styles.avatar}>{friend.avatar}</span>
          </div>
          <div className={styles.name}>{friend.name}</div>
          <div className={styles.userId}>ID: {friend.id}</div>
        </div>

        <div className={styles.actionSection}>
          <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={goToChat}>
            💬 发消息
          </button>
        </div>
      </div>
    </div>
  )
}
