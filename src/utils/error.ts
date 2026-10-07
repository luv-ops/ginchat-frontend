import { isAxiosError } from 'axios'

/** 统一提取接口/网络错误信息，等价于 Vue 版 err.response?.data?.message || err.message */
export const getErrorMessage = (err: unknown, fallback = '操作失败'): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback
  }
  if (err instanceof Error) {
    return err.message || fallback
  }
  return fallback
}
