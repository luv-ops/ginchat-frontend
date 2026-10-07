import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/** 需要登录的路由守卫（对应 router.beforeEach 中 requiresAuth 判断） */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

/** 已登录时访问登录页则直接进入消息页 */
export function RedirectIfLoggedIn({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token')
  if (token) {
    return <Navigate to="/message" replace />
  }
  return children
}
