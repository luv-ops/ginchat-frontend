import { useState } from 'react'
import styles from './EmojiPicker.module.css'

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onVisibleChange?: (visible: boolean) => void
}

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂',
  '🙂', '😊', '😇', '🥰', '😍', '😗',
  '😚', '😋', '😛', '😝', '🤑', '🤫',
  '🤔', '🤐', '😐', '😑', '😶', '😏', '😒',
  '🤥', '😌', '😔', '😪', '😴',
  '😷', '🤒', '🤕', '🤮', '🥵',
  '🥴', '🤯', '🥳', '😎', '🤓',
  '🧐', '😕', '🙁', '😮‍💨', '😌', '😕',
]

export default function EmojiPicker({ onSelect, onVisibleChange }: EmojiPickerProps) {
  const [visible, setVisible] = useState(false)

  const selectEmoji = (emoji: string) => {
    onSelect(emoji)
  }

  const toggle = () => {
    const next = !visible
    setVisible(next)
    onVisibleChange?.(next)
  }

  return (
    <div className={styles.emojiPickerWrapper}>
      {visible && (
        <div className={`${styles.emojiPanel} ${styles.emojiActive}`}>
          <div className={styles.emojiGrid}>
            {emojis.map((emoji, index) => (
              <span
                key={index}
                className={styles.emojiItem}
                onClick={() => selectEmoji(emoji)}
              >
                {emoji}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={styles.emojiTrigger} onClick={toggle}>
        😊
      </div>
    </div>
  )
}
