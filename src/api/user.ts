import request from '../utils/request'
import type { Conversation, FriendRequestItem, UserInfo } from '../types'

export interface LoginParams {
  name: string
  password: string
}

export interface LoginResult {
  id: number
  name: string
  avatar?: string
  token: string
}

export interface RegisterParams {
  name: string
  password: string
  confirmPassword: string
}

export interface AddFriendParams {
  targetId: number
  remark: string
}

export interface UpdateUserParams {
  name?: string
  signature?: string
  avatar?: string
}

export const getUserInfo = (): UserInfo => {
  const { id, name, avatar } = JSON.parse(localStorage.getItem('user') || '{}')
  return {
    id,
    name,
    avatar,
  }
}

export const login = (data: LoginParams) => {
  return request.post<LoginResult>('/user/login', data)
}

export const updateUserInfo = (data: UpdateUserParams) => {
  return request.post('/user/update', data)
}

export const register = (data: RegisterParams) => {
  return request.post('/user/register', data)
}

export const addFriend = (data: AddFriendParams) => {
  return request.post('/friend/add', data)
}

export const getFriendRequests = () => {
  return request.get<FriendRequestItem[]>('/friend/requests')
}

export const getFriendRequestsUnreadCount = () => {
  return request.get<{ unread: number }>('/friend/requests/unread')
}

export const readFriendRequests = () => {
  return request.post('/friend/requests/hasRead')
}

export const acceptFriendRequest = (id: number | string) => {
  return request.post(`/friend/accept/${id}`)
}

export const rejectFriendRequest = (id: number | string) => {
  return request.post(`/friend/reject/${id}`)
}

export const GetConversations = () => {
  return request.get<Conversation[]>('/conversation/list')
}
