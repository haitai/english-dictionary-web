/**
 * 文本转语音 (TTS) 工具
 * 使用 Google Text-to-Speech API
 */

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
    console.warn('TTS: 无效的文本输入')
    return false
  }

  try {
    // 检查浏览器是否支持 Web Speech API
    if ('speechSynthesis' in window) {
      return await speakWithWebSpeechAPI(text, lang, speed)
    } else {
      // 降级到 Google TTS
      return await speakWithGoogleTTS(text, lang)
    }
  } catch (error) {
    console.error('TTS 播放失败:', error)
    return false
  }
}

/**
 * 使用 Web Speech API 播放
 */
async function speakWithWebSpeechAPI(text, lang, speed) {
  return new Promise((resolve) => {
    // 停止当前播放
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = speed
    utterance.volume = 0.8

    utterance.onend = () => resolve(true)
    utterance.onerror = (error) => {
      console.error('Web Speech API 错误:', error)
      resolve(false)
    }

    speechSynthesis.speak(utterance)
  })
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
      audio.onloadeddata = () => {
        audio.play().then(() => {
          resolve(true)
        }).catch((error) => {
          console.error('音频播放失败:', error)
          resolve(false)
        })
      }
      
      audio.onerror = (error) => {
        console.error('Google TTS 错误:', error)
        resolve(false)
      }
      
      audio.src = url
    })
  } catch (error) {
    console.error('Google TTS 请求失败:', error)
    return false
  }
}

/**
 * 停止当前播放
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/**
 * 检查是否正在播放
 */
export function isSpeaking() {
  if ('speechSynthesis' in window) {
    return speechSynthesis.speaking
  }
  return false
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  if ('speechSynthesis' in window) {
    return speechSynthesis.getVoices().map(voice => ({
      lang: voice.lang,
      name: voice.name,
      localService: voice.localService
    }))
  }
  return []
}

/**
 * 预加载语音
 */
export function preloadVoices() {
  if ('speechSynthesis' in window) {
    // 触发语音列表加载
    speechSynthesis.getVoices()
    
    // 监听语音列表变化
    speechSynthesis.addEventListener('voiceschanged', () => {
      console.log('语音列表已加载:', getSupportedLanguages().length, '个语音')
    })
  }
}
