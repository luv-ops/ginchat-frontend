import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse, TokenInfo } from '../types'

const service = axios.create({
  baseURL: 'http://127.0.0.1:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

service.interceptors.request.use(
  (config) => {
    const { token, createTime } = JSON.parse(
      localStorage.getItem('token') || '{}',
    ) as Partial<TokenInfo>
    if (createTime && Date.now() - createTime > 1000 * 60 * 60 * 24) {
      localStorage.removeItem('token')
      // HashRouter 下直接跳转登录页
      window.location.hash = '#/login'
      return Promise.reject(new Error('登录过期，请重新登录'))
    }
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    if (res.code !== 200) {
      console.error('Response error:', res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    // 运行时直接返回响应体，类型上保持与 axios 拦截器签名兼容
    return res as unknown as AxiosResponse
  },
  (error) => {
    console.error('Network error:', error.message)
    return Promise.reject(error)
  },
)

/**
 * 对 axios 实例的薄封装：拦截器已把响应体解包，
 * 这里把返回类型修正为 ApiResponse<T>，调用方与 Vue 版用法一致。
 */
const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return service.get(url, config) as unknown as Promise<ApiResponse<T>>
  },
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    return service.post(url, data, config) as unknown as Promise<ApiResponse<T>>
  },
}

export default request
