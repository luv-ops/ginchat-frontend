import { useLocation } from 'react-router-dom'
import { useChatStore } from '../store'
import styles from './TabBar.module.css'

const tabs = [
  { id: 0, name: '消息', icon: '💬', path: '/message' },
  { id: 1, name: '联系人', icon: '👥', path: '/contact' },
  { id: 2, name: '动态', icon: '📸', path: '/dynamic' },
  { id: 3, name: '我', icon: '👤', path: '/profile' },
] as const

export default function TabBar() {
  const location = useLocation()
  const friendRequestUnreadCount = useChatStore(
    (s) => s.friendRequestUnreadCount,
  )
  const index = tabs.findIndex((tab) => tab.path === location.pathname)
  const activeIndex = index !== -1 ? index : 0

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab, i) => (
        <a
          key={tab.id}
          href={`#${tab.path}`}
          className={`${styles.tabItem} ${activeIndex === i ? styles.active : ''}`}
        >
          <span className={styles.tabIconWrap}>
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.id === 1 && friendRequestUnreadCount > 0 && (
              <span className={styles.badge}>
                {friendRequestUnreadCount > 99
                  ? '99+'
                  : friendRequestUnreadCount}
              </span>
            )}
          </span>
          <span className={styles.tabName}>{tab.name}</span>
        </a>
      ))}
    </div>
  )
}
