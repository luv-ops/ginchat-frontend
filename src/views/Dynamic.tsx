import { useState } from 'react'
import styles from './Dynamic.module.css'

interface DynamicItem {
  id: number
  avatar: string
  name: string
  time: string
  content: string
  images: string[]
  likes: number
  comments: number
}

const dynamics: DynamicItem[] = [
  {
    id: 1,
    avatar: '👦',
    name: '张三',
    time: '2小时前',
    content: '今天天气真好，出去走走！🌞',
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300',
    ],
    likes: 12,
    comments: 3,
  },
  {
    id: 2,
    avatar: '👩',
    name: '小红',
    time: '5小时前',
    content: '周末和朋友去爬山了，风景很美！⛰️',
    images: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300'],
    likes: 25,
    comments: 8,
  },
  {
    id: 3,
    avatar: '👨',
    name: '李老师',
    time: '昨天',
    content: '同学们的作业都完成得很好，继续加油！💪',
    images: [],
    likes: 45,
    comments: 12,
  },
  {
    id: 4,
    avatar: '👧',
    name: '小美',
    time: '昨天',
    content: '新买的衣服，好看吗？👗',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300',
    ],
    likes: 38,
    comments: 15,
  },
]

const tabs = [
  { id: 0, name: '好友动态' },
  { id: 1, name: '我的动态' },
]

export default function Dynamic() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className={styles.dynamicPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>动态</h1>
        <div className={styles.headerRight}>
          <span className={styles.headerIcon}>📝</span>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`${styles.tabItem} ${activeTab === index ? styles.active : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {tab.name}
          </div>
        ))}
      </div>

      <div className={styles.dynamicList}>
        {dynamics.map((dynamic) => (
          <div key={dynamic.id} className={styles.dynamicItem}>
            <div className={styles.dynamicHeader}>
              <span className={styles.avatar}>{dynamic.avatar}</span>
              <div className={styles.userInfo}>
                <span className={styles.name}>{dynamic.name}</span>
                <span className={styles.time}>{dynamic.time}</span>
              </div>
              <span className={styles.more}>⋯</span>
            </div>

            <div className={styles.dynamicContent}>{dynamic.content}</div>

            {dynamic.images.length > 0 && (
              <div className={styles.dynamicImages}>
                {dynamic.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt=""
                    className={
                      dynamic.images.length === 1
                        ? styles.single
                        : dynamic.images.length === 2
                          ? styles.double
                          : styles.triple
                    }
                  />
                ))}
              </div>
            )}

            <div className={styles.dynamicFooter}>
              <div className={styles.actionItem}>
                <span className={styles.actionIcon}>👍</span>
                <span className={styles.actionText}>{dynamic.likes}</span>
              </div>
              <div className={styles.actionItem}>
                <span className={styles.actionIcon}>💬</span>
                <span className={styles.actionText}>{dynamic.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
