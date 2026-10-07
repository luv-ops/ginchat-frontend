import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { debounce } from 'lodash'
import request from '../utils/request'
import type { GroupMember } from '../types'
import styles from './GroupMembers.module.css'

const PAGE_SIZE = 20

interface MembersResponse {
  members?: GroupMember[]
  totalCount?: number
}

export default function GroupMembers() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()

  const groupId = Number(params.id)
  const groupName = searchParams.get('name') || '群聊'

  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(
    Number(searchParams.get('totalCount')) || 0,
  )

  const loadMembers = async (page = 1, isLoadMore = false) => {
    if (isLoadMore && isLoadingMore) return

    if (page === 1) {
      setLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const result = await request.get<MembersResponse>(`/group/members/${groupId}`, {
        params: {
          page,
          pageSize: PAGE_SIZE,
        },
      })

      if (result.code === 200) {
        const newMembers = result.data.members ?? []
        setTotalCount(result.data.totalCount ?? newMembers.length)

        if (isLoadMore) {
          setMembers((prev) => [...prev, ...newMembers])
        } else {
          setMembers(newMembers)
        }

        setHasMore(newMembers.length >= PAGE_SIZE)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('获取群成员失败:', error)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
    }
  }

  const listRef = useRef<HTMLDivElement>(null)

  // 始终保持最新的加载函数与状态，供稳定的防抖回调调用
  const loadMembersRef = useRef(loadMembers)
  const stateRef = useRef({ isLoadingMore, hasMore, currentPage })
  useEffect(() => {
    loadMembersRef.current = loadMembers
    stateRef.current = { isLoadingMore, hasMore, currentPage }
  })

  const goBack = () => {
    navigate(-1)
  }

  useEffect(() => {
    void loadMembersRef.current(1)
  }, [])

  // 滚动到底部加载更多（对应 Vue 版 onMounted 中 addEventListener）
  useEffect(() => {
    const container = listRef.current
    if (!container) return
    const handleScroll = debounce(() => {
      const { isLoadingMore: loadingMore, hasMore: more, currentPage: page } =
        stateRef.current
      if (loadingMore || !more) return

      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 50
      ) {
        void loadMembersRef.current(page + 1, true)
      }
    }, 300)

    container.addEventListener('scroll', handleScroll)
    return () => {
      handleScroll.cancel()
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className={styles.membersPage}>
      <div className={styles.header}>
        <span className={styles.backBtn} onClick={goBack}>
          ‹
        </span>
        <h1 className={styles.title}>{groupName}</h1>
        <span className={styles.placeholder}></span>
      </div>

      <div className={styles.subtitle}>群成员 ({totalCount})</div>

      <div ref={listRef} className={styles.memberList}>
        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className={styles.memberItem}>
              <span className={styles.memberAvatar}>{member.avatar || '👤'}</span>
              <div className={styles.memberInfo}>
                <div className={styles.memberName}>
                  {member.name}
                  {Number(member.role) === 2 && <span className={styles.ownerTag}>群主</span>}
                </div>
                <div className={styles.memberId}>ID: {member.user_id}</div>
              </div>
            </div>
          ))
        )}

        {isLoadingMore && <div className={styles.loadingMore}>加载中...</div>}
        {!hasMore && members.length > 0 && <div className={styles.noMore}>没有更多了</div>}
      </div>
    </div>
  )
}
