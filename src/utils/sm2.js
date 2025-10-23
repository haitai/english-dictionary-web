/**
 * SM-2 记忆算法实现
 * 基于 SuperMemo 2 算法计算下次复习时间
 */

/**
 * 计算下次复习时间
 * @param {number} easeFactor - 难易度因子（默认 2.5）
 * @param {number} interval - 当前复习间隔（天）
 * @param {number} repetitions - 复习次数
 * @param {number} quality - 用户反馈质量（0-5）
 *   0: 完全不记得
 *   1: 错误，但有点印象
 *   2: 错误，但想起来了
 *   3: 正确，但很困难
 *   4: 正确，有点犹豫
 *   5: 正确，非常轻松
 * @returns {Object} 包含新的 easeFactor, interval, repetitions 和 nextReviewDate
 */
export function calculateNextReview(easeFactor = 2.5, interval = 0, repetitions = 0, quality) {
  // 质量必须在 0-5 之间
  if (quality < 0 || quality > 5) {
    throw new Error('质量评分必须在 0-5 之间')
  }

  let newEaseFactor = easeFactor
  let newInterval = interval
  let newRepetitions = repetitions

  // 如果质量低于 3，重置学习进度
  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    // 更新难易度因子
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    
    // 确保难易度因子不低于 1.3
    if (newEaseFactor < 1.3) {
      newEaseFactor = 1.3
    }

    // 增加复习次数
    newRepetitions = repetitions + 1

    // 计算新的间隔
    if (newRepetitions === 1) {
      newInterval = 1 // 第一次复习：1 天后
    } else if (newRepetitions === 2) {
      newInterval = 6 // 第二次复习：6 天后
    } else {
      newInterval = Math.round(interval * newEaseFactor)
    }
  }

  // 计算下次复习日期
  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

  return {
    ease_factor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    next_review: nextReviewDate.toISOString()
  }
}

/**
 * 获取质量评分的文本描述
 * @param {number} quality - 质量评分
 * @returns {string} 文本描述
 */
export function getQualityLabel(quality) {
  const labels = {
    0: '完全不记得',
    1: '有点印象',
    2: '想起来了',
    3: '有点困难',
    4: '稍有犹豫',
    5: '非常轻松'
  }
  return labels[quality] || '未知'
}

/**
 * 获取简化的质量选项（三个按钮）
 */
export const simpleQualityOptions = [
  { value: 1, label: '不认识', color: 'red', description: '完全不记得这个单词', icon: '😵' },
  { value: 3, label: '有点难', color: 'yellow', description: '记得但不太确定', icon: '🤔' },
  { value: 5, label: '很简单', color: 'green', description: '立即想起来了', icon: '😊' }
]

/**
 * 格式化下次复习时间为友好的文本
 * @param {string|Date} nextReviewDate - 下次复习日期
 * @returns {string} 友好的时间文本
 */
export function formatNextReview(nextReviewDate) {
  const now = new Date()
  const reviewDate = new Date(nextReviewDate)
  const diffMs = reviewDate - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return '需要复习'
  } else if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays < 7) {
    return `${diffDays} 天后`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} 周后`
  } else {
    const months = Math.floor(diffDays / 30)
    return `${months} 个月后`
  }
}

