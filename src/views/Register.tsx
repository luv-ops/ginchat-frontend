import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/user'
import { getErrorMessage } from '../utils/error'
import styles from './Register.module.css'

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async (e?: SubmitEvent) => {
    e?.preventDefault()
    if (!name) {
      alert('请输入用户名')
      return
    }
    if (!password) {
      alert('请输入密码')
      return
    }
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    try {
      const result = await register({ name, password, confirmPassword })
      if (result.code === 200) {
        alert('注册成功，请登录')
        navigate('/login')
      }
    } catch (error) {
      alert(getErrorMessage(error, '注册失败'))
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

        <form className={styles.formContainer} onSubmit={handleRegister}>
          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>👤</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="请输入用户名"
              maxLength={20}
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
              autoComplete="new-password"
            />
            <span className={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <div className={styles.inputItem}>
            <span className={styles.inputIcon}>🔐</span>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="请确认密码"
              autoComplete="new-password"
            />
          </div>

          <button className={styles.loginBtn} type="submit" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </button>

          <div className={styles.formFooter}>
            <span className={styles.linkBtn} onClick={() => navigate('/login')}>
              已有账号？去登录
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
