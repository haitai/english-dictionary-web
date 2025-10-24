/**
 * 文本转语音 (TTS) 工具
 * 使用 Google Text-to-Speech API
 */

import { getSpeakSettings, shouldAutoSpeak } from '@/utils/settings'

// Google TTS API 配置
const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts'
const DEFAULT_LANG = 'en'
const DEFAULT_SPEED = 1.0

/**
 * 播放单词发音
 * @param {string} text - 要发音的文本
 * @param {string} lang - 语言代码 (默认: 'en')
 * @param {number} speed - 语速 (0.1-2.0, 默认: 1.0)
 * @returns {Promise<boolean>} 是否成功播放
 */
export async function speakText(text, lang = DEFAULT_LANG, speed = DEFAULT_SPEED) {
  if (!text || typeof text !== 'string') {
    return false
  }

  try {
    return await speakWithGoogleTTS(text, lang)
  } catch (error) {
    console.warn('TTS 播放失败:', error)
    return false
  }
}


/**
 * 使用 Google TTS 播放
 */
async function speakWithGoogleTTS(text, lang) {
  try {
    // 创建音频元素
    const audio = new Audio()
    
    // 构建 Google TTS URL
    const params = new URLSearchParams({
      ie: 'UTF-8',
      q: text,
      tl: lang,
      client: 'tw-ob'
    })
    
    const url = `${GOOGLE_TTS_URL}?${params.toString()}`
    
    return new Promise((resolve) => {
      let isResolved = false
      let timeoutId = null
      
      // 设置超时保护（3秒）
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          audio.pause()
          audio.src = ''
          isResolved = true
          resolve(false)
        }
      }, 3000)
      
      audio.onloadeddata = () => {
        if (!isResolved) {
          audio.play().then(() => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(true)
            }
          }).catch((error) => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(false)
            }
          })
        }
      }
      
      audio.onerror = (error) => {
        if (!isResolved) {
          clearTimeout(timeoutId)
          isResolved = true
          resolve(false)
        }
      }
      
      audio.onended = () => {
        if (!isResolved) {
          clearTimeout(timeoutId)
          isResolved = true
          resolve(true)
        }
      }
      
      // 设置音频属性
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
      audio.src = url
    })
  } catch (error) {
    console.warn('Google TTS 请求失败:', error)
    return false
  }
}

/**
 * 停止当前播放
 */
export function stopSpeaking() {
  // Google TTS 通过停止音频元素来停止播放
  const audioElements = document.querySelectorAll('audio')
  audioElements.forEach(audio => {
    audio.pause()
    audio.currentTime = 0
  })
}

/**
 * 检查是否正在播放
 */
export function isSpeaking() {
  const audioElements = document.querySelectorAll('audio')
  return Array.from(audioElements).some(audio => !audio.paused)
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  return [
    { lang: 'en-US', name: '英语 (美式)', localService: false },
    { lang: 'en-GB', name: '英语 (英式)', localService: false },
    { lang: 'en-AU', name: '英语 (澳式)', localService: false },
    { lang: 'zh-CN', name: '中文 (普通话)', localService: false }
  ]
}

/**
 * 预加载语音
 */
export function preloadVoices() {
  // Google TTS 不需要预加载
  console.log('使用 Google TTS 服务')
}

/**
 * 自动朗读功能
 * @param {string} text - 要朗读的文本
 * @param {string} context - 上下文 ('wordDetail', 'study', 'search')
 * @param {Object} options - 选项
 */
export async function autoSpeak(text, context, options = {}) {
  if (!text || !shouldAutoSpeak(context)) {
    return false
  }

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    await speakText(text, lang, speed)
    return true
  } catch (error) {
    console.warn('自动朗读失败:', error)
    return false
  }
}

/**
 * 朗读句子
 * @param {string} text - 要朗读的句子
 * @param {Object} options - 选项
 */
export async function speakSentence(text, options = {}) {
  if (!text) return false

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    await speakText(text, lang, speed)
    return true
  } catch (error) {
    console.warn('朗读句子失败:', error)
    return false
  }
}

/**
 * 停止所有朗读
 */
export function stopAllSpeaking() {
  // Google TTS 通过停止音频元素来停止播放
  const audioElements = document.querySelectorAll('audio')
  audioElements.forEach(audio => {
    audio.pause()
    audio.currentTime = 0
  })
}
