/**
 * 用户设置管理工具
 * 使用 localStorage 存储用户偏好设置
 */

const SETTINGS_KEY = 'english-dictionary-settings'

// 默认设置
const defaultSettings = {
  autoSpeak: true,           // 自动朗读开关
  speakSpeed: 0.8,          // 朗读语速
  speakLanguage: 'en-US',    // 朗读语言
  speakOnWordDetail: true,   // 单词详情页自动朗读
  speakOnStudy: false,       // 学习模式自动朗读
  speakOnSearch: false,      // 搜索时自动朗读
  darkMode: false,           // 深色模式
  showPhonetic: true,        // 显示音标
  showExamples: true,        // 显示例句
  showSynonyms: true,        // 显示近义词
  cacheEnabled: true,        // 缓存开关
  syncEnabled: true          // 同步开关
}

/**
 * 获取所有设置
 * @returns {Object} 用户设置对象
 */
export function getSettings() {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // 合并默认设置和存储的设置
      return { ...defaultSettings, ...parsed }
    }
  } catch (error) {
    console.warn('读取设置失败:', error)
  }
  return { ...defaultSettings }
}

/**
 * 保存设置
 * @param {Object} settings - 要保存的设置对象
 */
export function saveSettings(settings) {
  try {
    const currentSettings = getSettings()
    const newSettings = { ...currentSettings, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    return newSettings
  } catch (error) {
    console.error('保存设置失败:', error)
    return getSettings()
  }
}

/**
 * 获取单个设置
 * @param {string} key - 设置键名
 * @returns {any} 设置值
 */
export function getSetting(key) {
  const settings = getSettings()
  return settings[key]
}

/**
 * 设置单个设置
 * @param {string} key - 设置键名
 * @param {any} value - 设置值
 */
export function setSetting(key, value) {
  const settings = getSettings()
  settings[key] = value
  saveSettings(settings)
}

/**
 * 重置所有设置为默认值
 */
export function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY)
    return { ...defaultSettings }
  } catch (error) {
    console.error('重置设置失败:', error)
    return getSettings()
  }
}

/**
 * 获取朗读相关设置
 * @returns {Object} 朗读设置
 */
export function getSpeakSettings() {
  const settings = getSettings()
  return {
    autoSpeak: settings.autoSpeak,
    speed: settings.speakSpeed,
    language: settings.speakLanguage,
    onWordDetail: settings.speakOnWordDetail,
    onStudy: settings.speakOnStudy,
    onSearch: settings.speakOnSearch
  }
}

/**
 * 检查是否应该自动朗读
 * @param {string} context - 上下文 ('wordDetail', 'study', 'search')
 * @returns {boolean} 是否应该自动朗读
 */
export function shouldAutoSpeak(context) {
  const settings = getSpeakSettings()
  
  if (!settings.autoSpeak) return false
  
  switch (context) {
    case 'wordDetail':
      return settings.onWordDetail
    case 'study':
      return settings.onStudy
    case 'search':
      return settings.onSearch
    default:
      return false
  }
}

/**
 * 获取设置统计信息
 * @returns {Object} 设置统计
 */
export function getSettingsStats() {
  const settings = getSettings()
  return {
    totalSettings: Object.keys(settings).length,
    enabledFeatures: Object.values(settings).filter(Boolean).length,
    lastModified: new Date().toISOString()
  }
}
