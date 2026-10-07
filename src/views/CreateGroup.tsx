import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import request from '../utils/request'
import { getErrorMessage } from '../utils/error'
import styles from './CreateGroup.module.css'

export default function CreateGroup() {
  const navigate = useNavigate()
  const [groupName, setGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert('请输入群聊名称')
      return
    }

    setIsCreating(true)
    try {
      const result = await request.post('/group/create', {
        group_name: groupName.trim(),
      })
      if (result.code === 200) {
        alert('创建成功')
        navigate(-1)
      } else {
        alert(result.message || '创建失败')
      }
    } catch (error) {
      console.error('创建群聊失败:', error)
      alert(getErrorMessage(error, '创建失败，请稍后重试'))
    } finally {
      setIsCreating(false)
    }
  }

  const goBack = () => {
    navigate(-1)
  }

  return (
    <div className={styles.createGroupPage}>
      <div className={styles.header}>
        <span className={styles.backBtn} onClick={goBack}>
          ‹
        </span>
        <h1 className={styles.title}>创建群聊</h1>
        <span
          className={`${styles.saveBtn} ${isCreating ? styles.disabled : ''}`}
          onClick={createGroup}
        >
          {isCreating ? '创建中...' : '完成'}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>群聊名称</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            type="text"
            placeholder="请输入群聊名称"
            maxLength={20}
            className={styles.inputField}
          />
        </div>
      </div>
    </div>
  )
}
