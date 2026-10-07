import { Suspense, useEffect } from 'react'
import { HashRouter, useLocation } from 'react-router-dom'
import TabBar from './components/TabBar'
import ws from './utils/websocket'
import { useChatStore } from './store'
import AppRoutes from './router'
import type { TokenInfo } from './types'
import styles from './App.module.css'

const TOKEN_TTL = 1000 * 60 * 60 * 24
/** 不显示底部 TabBar 的路由前缀 */
const HIDE_TAB_BAR_PREFIXES = ['/chat', '/login', '/group-detail', '/group-members']

function AppShell() {
  const location = useLocation()

  // 应用级 WS 生命周期：只在挂载时连接一次。
  // 这里不使用 useNavigate（其引用会随路由变化，放进依赖会导致切页面时断开重连），
  // token 过期跳转与 request 拦截器保持一致，直接改 hash。
  useEffect(() => {
    const { handleChatMessage, handleFriendRequest, handleGroupMessage } =
      useChatStore.getState()

    const raw = localStorage.getItem('token')
    if (raw) {
      const { token, createTime } = JSON.parse(raw) as Partial<TokenInfo>
      if (createTime && Date.now() - createTime > TOKEN_TTL) {
        localStorage.removeItem('token')
        window.location.hash = '#/login'
      } else if (token) {
        ws.connect(token)
        ws.on('chat', handleChatMessage)
        ws.on('friendRequest', handleFriendRequest)
        ws.on('groupMessage', handleGroupMessage)
      }
    }

    return () => {
      ws.off('chat', handleChatMessage)
      ws.off('friendRequest', handleFriendRequest)
      ws.off('groupMessage', handleGroupMessage)
      ws.disconnect()
    }
  }, [])

  const showTabBar = !HIDE_TAB_BAR_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  )

  return (
    <div className={styles.app}>
      <Suspense fallback={null}>
        <AppRoutes />
      </Suspense>
      {showTabBar && <TabBar />}
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
