import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ws from '../utils/websocket'
import { login } from '../api/user'
import { useChatStore } from '../store'
import { getErrorMessage } from '../utils/error'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e?: SubmitEvent) => {
    e?.preventDefault()
    if (!name || !password) {
      alert('请输入用户名和密码')
      return
    }

    setIsLoading(true)
    try {
      const result = await login({ name, password })
      if (result.code === 200) {
        const tokenInfo = {
          token: result.data.token,
          createTime: Date.now(),
        }
        const user = {
          id: result.data.id,
          name: result.data.name,
          avatar: result.data?.avatar || '',
        }
        localStorage.setItem('token', JSON.stringify(tokenInfo))
        localStorage.setItem('user', JSON.stringify(user))
        // 消息监听统一在 App 中注册，这里只需建立连接
        ws.connect(result.data.token)
        // 拉取好友请求未读数，使联系人 tab 徽标立即显示
        void useChatStore.getState().fetchFriendRequestUnreadCount()
        navigate('/message')
      }
    } catch (error) {
      alert(getErrorMessage(error, '登录失败'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBg}></div>

      <div className={styles.loginContainer}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>💬</div>
          <span className={styles.logoText}>QQ</span>
        </div>

        <form className={styles.formContainer} onSubmit={handleLogin}>
          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>👤</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="请输入用户名"
              maxLength={11}
              autoComplete="username"
            />
          </div>

          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>🔐</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
            <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <button className={styles.loginBtn} type="submit" disabled={isLoading}>
            {isLoading ? <span>登录中...</span> : <span>登 录</span>}
          </button>
          <div className={styles.links}>
            <a href="#/register">注册账号</a>
            <a href="#/forgot">忘记密码</a>
          </div>
        </form>
      </div>
    </div>
  )
}
