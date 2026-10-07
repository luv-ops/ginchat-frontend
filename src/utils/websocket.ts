// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageType = string
// 不同 type 的推送载荷结构不同（聊天/群消息/好友请求），这里按 any 分发，由 store 各自收窄
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (data: any) => void

class WebSocketClient {
  ws: WebSocket | null = null
  listeners: Record<MessageType, Listener[]> = {}
  token = ''
  // 心跳配置，采用 setTimeout 递归发送 ping，而不是 setInterval
  heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  pingDelay = 45000 // 每45s发送业务ping
  pongTimeout = 10000 // 10s内没有收到pong，认为连接断开
  pongTimer: ReturnType<typeof setTimeout> | null = null
  // 重连配置
  IsManualClose = false // 是否手动关闭
  reconnectCount = 0 // 目前重试次数
  maxReconnectAttempts = 10 // 最大重试次数
  reconnectTimer: ReturnType<typeof setTimeout> | null = null
  // 事件监听回调配置
  visibleChangeCallback: (() => void) | null = null
  onlineCallback: (() => void) | null = null
  offlineCallback: (() => void) | null = null

  // 连接
  connect(token: string) {
    this.token = token
    // 重新连接时重置手动关闭标记（退出登录后再次登录仍可自动重连）
    this.IsManualClose = false
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return
    }
    this.ws = new WebSocket(`ws://127.0.0.1:8080/ws/${token}`)

    // 收到消息 → 自动分发
    this.ws.onmessage = (event) => {
      const data: string = event.data
      if (data === 'pong') {
        if (this.pongTimer) clearTimeout(this.pongTimer)
        this.pongTimer = null
        // 重新开始递归发送ping
        this.schedulerPing()
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = JSON.parse(data) as any
      // 业务消息根据type分发
      this.emit(msg.type, msg)
    }
    this.ws.onerror = (e) => {
      console.warn('[WS] error', e)
    }
    this.ws.onclose = () => {
      console.log('[WS] closed')
      this.stopHeartbeat()
      // 手动关闭，不再重连
      if (this.IsManualClose) return
      this.reconnect()
    }
    this.ws.onopen = () => {
      this.reconnectCount = 0
      this.startHeartbeat()
    }
    this.bindOnline()
    this.bindVisibility()
  }

  // 发送消息
  send(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }

  // 组件订阅消息
  on(msgType: MessageType, callback: Listener) {
    if (!this.listeners[msgType]) this.listeners[msgType] = []
    this.listeners[msgType].push(callback)
  }

  // 分发消息
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(msgType: MessageType, data: any) {
    this.listeners[msgType]?.forEach((cb) => cb(data))
  }

  // 取消订阅
  off(msgType: MessageType, callback?: Listener) {
    if (!this.listeners[msgType]) return
    if (!callback) {
      this.listeners[msgType] = []
    } else {
      this.listeners[msgType] = this.listeners[msgType].filter((cb) => cb !== callback)
    }
  }

  // 重连，指数退避
  reconnect() {
    this.cancelReconnect()
    if (this.reconnectCount >= this.maxReconnectAttempts) {
      console.warn('[WS] 达到最大重连次数，停止重连')
      return
    }
    // 指数退避，退避不会超过30s
    const base = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000)
    const jitter = Math.random() * 1000 // 随机抖动
    const delay = base + jitter
    this.reconnectCount++
    console.log(`[WS] ${delay.toFixed(0)}ms 后第 ${this.reconnectCount} 次重连`)
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.token)
    }, delay)
  }

  cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.schedulerPing()
  }

  // 心跳检测
  schedulerPing() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.heartbeatTimer = setTimeout(() => {
      console.log('[WS] ping')
      // 发送业务ping
      this.send('ping')
      // 设置10s超时，10s内没有收到pong，认为连接断开
      this.pongTimer = setTimeout(() => {
        console.warn('[WS] pong timeout, closing')
        this.ws?.close()
      }, this.pongTimeout)
    }, this.pingDelay)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer)
      this.pongTimer = null
    }
  }

  // 网络恢复
  bindOnline() {
    console.log('[WS] network online')
    if (this.onlineCallback) return
    this.onlineCallback = () => {
      if (this.IsManualClose) return
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('网络恢复,且websocket连接恢复')
        this.startHeartbeat()
        // 主动ping一次
        this.send('ping')
        return
      }
      // 说明虽然网络恢复，但是连接还是异常断开
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.reconnectCount = 0
      this.connect(this.token)
    }
    this.offlineCallback = () => {
      console.log('[WS] network offline')
      // 断网了，停掉重连定时器，避免无意义重试
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.stopHeartbeat()
    }
    window.addEventListener('online', this.onlineCallback)
    window.addEventListener('offline', this.offlineCallback)
  }

  unBindOnline() {
    if (this.onlineCallback) {
      window.removeEventListener('online', this.onlineCallback)
      this.onlineCallback = null
    }
    if (this.offlineCallback) {
      window.removeEventListener('offline', this.offlineCallback)
      this.offlineCallback = null
    }
  }

  // visibleChange，用户切换浏览器标签触发，这是页面切回程序触发
  bindVisibility() {
    if (this.visibleChangeCallback) {
      return
    }
    this.visibleChangeCallback = () => {
      if (document.visibilityState === 'visible') {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.send('ping')
        } else if (!this.IsManualClose) {
          this.stopHeartbeat()
          this.reconnect()
        }
      }
    }
    document.addEventListener('visibilitychange', this.visibleChangeCallback)
  }

  unBindVisibility() {
    if (this.visibleChangeCallback) {
      document.removeEventListener('visibilitychange', this.visibleChangeCallback)
      this.visibleChangeCallback = null
    }
  }

  // 手动断开连接
  disconnect() {
    this.IsManualClose = true
    this.stopHeartbeat()
    this.cancelReconnect()
    this.unBindOnline()
    this.unBindVisibility()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    // listener由组件销毁时off
  }
}

export default new WebSocketClient()
