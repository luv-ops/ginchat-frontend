export const formatTime = (time: number | string | Date): string => {
  return new Date(time).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // 24小时制
  })
}
