import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth, RedirectIfLoggedIn } from './guards'

// 路由级懒加载（对应 Vue 版的动态 import）
const Login = lazy(() => import('../views/Login'))
const Register = lazy(() => import('../views/Register'))
const Message = lazy(() => import('../views/Message'))
const Chat = lazy(() => import('../views/Chat'))
const Contact = lazy(() => import('../views/Contact'))
const FriendRequests = lazy(() => import('../views/FriendRequests'))
const FriendDetail = lazy(() => import('../views/FriendDetail'))
const Dynamic = lazy(() => import('../views/Dynamic'))
const Profile = lazy(() => import('../views/Profile'))
const CreateGroup = lazy(() => import('../views/CreateGroup'))
const GroupDetail = lazy(() => import('../views/GroupDetail'))
const GroupMembers = lazy(() => import('../views/GroupMembers'))

/** 路由表：集中配置，对应 Vue 版 src/router/index.js 的 routes 数组 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <RedirectIfLoggedIn>
            <Login />
          </RedirectIfLoggedIn>
        }
      />
      <Route path="/register" element={<Register />} />
      <Route
        path="/message"
        element={
          <RequireAuth>
            <Message />
          </RequireAuth>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />
      <Route
        path="/contact"
        element={
          <RequireAuth>
            <Contact />
          </RequireAuth>
        }
      />
      <Route
        path="/friend-requests"
        element={
          <RequireAuth>
            <FriendRequests />
          </RequireAuth>
        }
      />
      <Route
        path="/friend-detail/:id"
        element={
          <RequireAuth>
            <FriendDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/dynamic"
        element={
          <RequireAuth>
            <Dynamic />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/create-group"
        element={
          <RequireAuth>
            <CreateGroup />
          </RequireAuth>
        }
      />
      <Route
        path="/group-detail/:id"
        element={
          <RequireAuth>
            <GroupDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/group-members/:id"
        element={
          <RequireAuth>
            <GroupMembers />
          </RequireAuth>
        }
      />
    </Routes>
  )
}
