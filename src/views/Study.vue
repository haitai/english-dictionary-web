<template>
  <div class="study-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        学习模式
      </h1>
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        选择单词开始学习，标记您的掌握程度
      </p>
    </div>

    <!-- 主要内容区域 -->
    <div v-if="currentWord" class="main-content">
      <!-- 左侧：单词信息区域 -->
      <div class="word-section">
        <!-- 单词显示 -->
        <div class="word-display">
          <div class="word-title">{{ currentWord.word }}</div>
          <div v-if="currentPhonetic" class="word-phonetic">{{ currentPhonetic }}</div>
          <div v-else-if="phoneticLoading" class="phonetic-loading">
            <div class="loading-spinner"></div>
            <span>加载音标中...</span>
          </div>
        </div>

        <!-- 发音和收藏按钮 -->
        <div class="action-buttons">
          <SpeakerButton 
            :word="currentWord.word" 
            :text="currentWord.word"
            :lang="'en'"
            :speed="1.0"
            class="speaker-btn"
          />
          <button
            v-if="userStore.isAuthenticated"
            @click="toggleCollection"
            :class="[
              'collection-btn',
              isCollected ? 'collected' : 'not-collected'
            ]"
          >
            {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
          </button>
          <p v-else class="login-hint">登录后可收藏单词</p>
        </div>

        <!-- 掌握程度选择（桌面端） -->
        <div class="quality-selection-desktop">
          <h3 class="quality-title">您对这个单词的掌握程度是？</h3>
          
          <div class="quality-buttons">
            <button
              v-for="(option, index) in qualityOptions"
              :key="option.value"
              @click="markWord(option.value)"
              :class="[
                'quality-btn',
                `quality-${option.color}`,
                submitting && 'disabled'
              ]"
              :disabled="submitting"
            >
              <div class="quality-icon">{{ option.icon }}</div>
              <div class="quality-label">{{ option.label }}</div>
              <div class="quality-desc">{{ option.description }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：释义区域 -->
      <div class="definition-section">
        <div v-if="!showDefinition" class="definition-placeholder">
          <button @click="showDefinition = true" class="show-definition-btn">
            📖 查看释义
          </button>
        </div>
        <div v-else class="definition-content">
          <div class="definition-header">
            <h3 class="definition-title">{{ currentWord.word }} 的释义</h3>
            <button @click="showDefinition = false" class="hide-definition-btn">
              隐藏释义
            </button>
          </div>
          <div class="definition-body">
            <div v-for="(def, index) in currentWord.definitions" :key="index" class="definition-item">
              <div class="part-of-speech">{{ def.pos }}</div>
              <div class="definition-section-item">
                <div class="definition-label">英文解释：</div>
                <div class="definition-text-en">{{ def.explanation_en }}</div>
              </div>
              <div class="definition-section-item">
                <div class="definition-label">中文解释：</div>
                <div class="definition-text-cn">{{ def.explanation_cn }}</div>
              </div>
              <div v-if="def.example_en" class="example">
                <div class="example-en">{{ def.example_en }}</div>
                <div class="example-cn">{{ def.example_cn }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端固定底部掌握程度选择 -->
    <div v-if="currentWord" class="quality-selection-mobile">
      <div class="mobile-quality-header">
        <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
          掌握程度
        </h3>
      </div>
      <div class="mobile-quality-buttons">
        <button
          v-for="(option, index) in qualityOptions"
          :key="option.value"
          @click="markWord(option.value)"
          :class="[
            'mobile-quality-btn',
            option.color === 'red' && 'mobile-quality-red',
            option.color === 'yellow' && 'mobile-quality-yellow',
            option.color === 'green' && 'mobile-quality-green',
            submitting && 'opacity-50 cursor-not-allowed'
          ]"
          :disabled="submitting"
        >
          <div class="mobile-quality-icon">{{ option.icon }}</div>
          <div class="mobile-quality-label">{{ option.label }}</div>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-state">
      <div class="text-4xl mb-4">❌</div>
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <button @click="loadRandomWord" class="btn btn-primary">
        重试
      </button>
    </div>

    <!-- 学习进度 -->
    <div v-if="learnedCount > 0" class="progress-section">
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        本次已学习 <span class="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">{{ learnedCount }}</span> 个单词
      </p>
      <button @click="loadRandomWord" class="btn btn-primary mt-3 md:mt-4 text-sm md:text-base">
        继续学习
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import SpeakerButton from '@/components/SpeakerButton.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import { simpleQualityOptions } from '@/utils/sm2'
import { getPhonetic } from '@/utils/phonetic'

const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const currentWord = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const learnedCount = ref(0)
const showDefinition = ref(false)
const currentPhonetic = ref('')
const phoneticLoading = ref(false)

const qualityOptions = simpleQualityOptions

const isCollected = computed(() => {
  if (!currentWord.value) return false
  return learningStore.isCollected(currentWord.value.word)
})

// 获取音标
async function fetchPhonetic() {
  if (!currentWord.value) return
  
  phoneticLoading.value = true
  try {
    const phonetic = await getPhonetic(currentWord.value.word, currentWord.value.phonetic)
    currentPhonetic.value = phonetic
  } catch (error) {
    console.error('获取音标失败:', error)
    currentPhonetic.value = currentWord.value.phonetic || ''
  } finally {
    phoneticLoading.value = false
  }
}

// 加载随机单词
async function loadRandomWord() {
  loading.value = true
  error.value = null
  showDefinition.value = false
  
  try {
    const words = await dictionaryStore.loadRandomWords(1)
    if (words && words.length > 0) {
      const wordData = await dictionaryStore.getWordDetail(words[0].word)
      currentWord.value = wordData
      // 获取音标
      await fetchPhonetic()
    } else {
      error.value = '无法加载单词'
    }
  } catch (err) {
    error.value = '加载单词失败: ' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 标记单词
async function markWord(quality) {
  if (!currentWord.value || submitting.value) return

  submitting.value = true

  // 如果已登录，保存学习进度
  if (userStore.isAuthenticated) {
    const result = await learningStore.updateWordProgress(currentWord.value.word, quality)
    if (!result.success) {
      console.error('保存学习进度失败')
    }
  }

  learnedCount.value++
  submitting.value = false

  // 加载下一个单词
  setTimeout(() => {
    loadRandomWord()
  }, 300)
}

// 切换收藏状态
async function toggleCollection() {
  if (!currentWord.value || !userStore.isAuthenticated) return

  if (isCollected.value) {
    await learningStore.removeCollection(currentWord.value.word)
  } else {
    await learningStore.addCollection(currentWord.value.word)
  }
}

// 键盘快捷键处理
function handleKeyPress(e) {
  if (submitting.value) return
  
  // 数字键 1-3 对应掌握程度
  if (e.key >= '1' && e.key <= '3') {
    e.preventDefault()
    const qualityIndex = parseInt(e.key) - 1
    if (qualityIndex < qualityOptions.length) {
      markWord(qualityOptions[qualityIndex].value)
    }
  }
}

onMounted(() => {
  loadRandomWord()
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
/* 主容器 */
.study-container {
  min-height: 100vh;
  padding-bottom: 120px; /* 为移动端固定底部留出空间 */
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 2rem);
  padding: 0 clamp(0.5rem, 2vw, 1rem);
}

/* 主要内容区域 - 响应式左右布局 */
.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(1rem, 4vw, 3rem);
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 clamp(0.5rem, 2vw, 1rem);
}

@media (min-width: 768px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
  }
}

/* 左侧单词区域 */
.word-section {
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 2rem);
  justify-content: center;
  min-height: 60vh;
}

/* 单词显示 */
.word-display {
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 2rem);
}

.word-title {
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: bold;
  color: #1f2937;
  margin-bottom: clamp(0.5rem, 2vw, 1rem);
  line-height: 1.2;
}

.dark .word-title {
  color: #f9fafb;
}

.word-phonetic {
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #6b7280;
  font-family: 'Courier New', monospace;
  margin-bottom: clamp(0.5rem, 2vw, 1rem);
}

.dark .word-phonetic {
  color: #9ca3af;
}

.phonetic-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  color: #6b7280;
}

.dark .phonetic-loading {
  color: #9ca3af;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1rem);
  margin-bottom: clamp(1rem, 3vw, 2rem);
}

.speaker-btn {
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  font-size: clamp(0.875rem, 2.5vw, 1rem);
}

.collection-btn {
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 3vw, 1.5rem);
  border-radius: 8px;
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 500;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.collection-btn.collected {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.collection-btn.not-collected {
  background: transparent;
  color: #6b7280;
  border-color: #d1d5db;
}

.dark .collection-btn.not-collected {
  color: #9ca3af;
  border-color: #4b5563;
}

.collection-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.login-hint {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  text-align: center;
}

.dark .login-hint {
  color: #9ca3af;
}

/* 桌面端掌握程度选择 */
.quality-selection-desktop {
  display: none;
}

@media (min-width: 768px) {
  .quality-selection-desktop {
    display: block;
  }
}

.quality-title {
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
}

.dark .quality-title {
  color: #f9fafb;
}

.quality-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(0.75rem, 2vw, 1rem);
}

@media (min-width: 640px) {
  .quality-buttons {
    grid-template-columns: repeat(3, 1fr);
  }
}

.quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(1rem, 3vw, 1.5rem);
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.quality-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.quality-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quality-btn.quality-red {
  background: #fef2f2;
  border-color: #fecaca;
}

.quality-btn.quality-yellow {
  background: #fffbeb;
  border-color: #fed7aa;
}

.quality-btn.quality-green {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.dark .quality-btn.quality-red {
  background: rgba(220, 38, 38, 0.1);
  border-color: rgba(220, 38, 38, 0.3);
}

.dark .quality-btn.quality-yellow {
  background: rgba(217, 119, 6, 0.1);
  border-color: rgba(217, 119, 6, 0.3);
}

.dark .quality-btn.quality-green {
  background: rgba(22, 163, 74, 0.1);
  border-color: rgba(22, 163, 74, 0.3);
}

.quality-icon {
  font-size: clamp(1.5rem, 4vw, 2rem);
  margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
}

.quality-label {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.quality-btn.quality-red .quality-label {
  color: #dc2626;
}

.quality-btn.quality-yellow .quality-label {
  color: #d97706;
}

.quality-btn.quality-green .quality-label {
  color: #16a34a;
}

.dark .quality-btn.quality-red .quality-label {
  color: #fca5a5;
}

.dark .quality-btn.quality-yellow .quality-label {
  color: #fbbf24;
}

.dark .quality-btn.quality-green .quality-label {
  color: #4ade80;
}

.quality-desc {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  text-align: center;
  line-height: 1.4;
}

.quality-btn.quality-red .quality-desc {
  color: #dc2626;
}

.quality-btn.quality-yellow .quality-desc {
  color: #d97706;
}

.quality-btn.quality-green .quality-desc {
  color: #16a34a;
}

.dark .quality-btn.quality-red .quality-desc {
  color: #fca5a5;
}

.dark .quality-btn.quality-yellow .quality-desc {
  color: #fbbf24;
}

.dark .quality-btn.quality-green .quality-desc {
  color: #4ade80;
}

/* 右侧释义区域 */
.definition-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-height: 60vh;
}

.dark .definition-section {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.definition-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: clamp(1rem, 3vw, 2rem);
}

.show-definition-btn {
  padding: clamp(0.75rem, 2.5vw, 1rem) clamp(1.5rem, 4vw, 2rem);
  font-size: clamp(1rem, 3vw, 1.25rem);
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.show-definition-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.definition-content {
  padding: clamp(1rem, 3vw, 1.5rem);
}

.definition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  padding-bottom: clamp(0.5rem, 2vw, 1rem);
  border-bottom: 1px solid #e5e7eb;
}

.dark .definition-header {
  border-bottom-color: #374151;
}

.definition-title {
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 600;
  color: #1f2937;
}

.dark .definition-title {
  color: #f9fafb;
}

.hide-definition-btn {
  padding: clamp(0.25rem, 1vw, 0.5rem) clamp(0.75rem, 2vw, 1rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .hide-definition-btn {
  color: #9ca3af;
  border-color: #4b5563;
}

.hide-definition-btn:hover {
  background: #f3f4f6;
}

.dark .hide-definition-btn:hover {
  background: #374151;
}

.definition-body {
  max-height: 50vh;
  overflow-y: auto;
}

.definition-item {
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  padding-bottom: clamp(0.75rem, 2vw, 1rem);
  border-bottom: 1px solid #f3f4f6;
}

.dark .definition-item {
  border-bottom-color: #374151;
}

.definition-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.part-of-speech {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: clamp(0.125rem, 1vw, 0.25rem) clamp(0.5rem, 2vw, 0.75rem);
  border-radius: 9999px;
  font-size: clamp(0.625rem, 2vw, 0.75rem);
  font-weight: 600;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.definition-section-item {
  margin-bottom: clamp(0.75rem, 2vw, 1rem);
}

.definition-label {
  font-size: clamp(0.75rem, 2vw, 0.875rem);
  color: #6b7280;
  margin-bottom: clamp(0.25rem, 1vw, 0.5rem);
}

.dark .definition-label {
  color: #9ca3af;
}

.definition-text-en {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  color: #6b7280;
  margin-bottom: clamp(0.5rem, 2vw, 0.75rem);
}

.dark .definition-text-en {
  color: #9ca3af;
}

.definition-text-cn {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  line-height: 1.6;
  color: #374151;
  font-weight: 500;
}

.dark .definition-text-cn {
  color: #d1d5db;
}

.example {
  background: #f9fafb;
  padding: clamp(0.5rem, 2vw, 0.75rem);
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.dark .example {
  background: #374151;
}

.example-en {
  font-style: italic;
  color: #6b7280;
  margin-bottom: clamp(0.125rem, 1vw, 0.25rem);
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.dark .example-en {
  color: #9ca3af;
}

.example-cn {
  color: #374151;
  font-weight: 500;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.dark .example-cn {
  color: #d1d5db;
}

/* 移动端固定底部掌握程度选择 */
.quality-selection-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: clamp(0.75rem, 2vw, 1rem);
  z-index: 50;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .quality-selection-mobile {
  background: #1f2937;
  border-top-color: #374151;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.3);
}

@media (min-width: 768px) {
  .quality-selection-mobile {
    display: none;
  }
}

.mobile-quality-header {
  text-align: center;
  margin-bottom: clamp(0.5rem, 1.5vw, 0.75rem);
}

.mobile-quality-header h3 {
  font-size: clamp(0.875rem, 2.5vw, 1rem);
  font-weight: 600;
  color: #1f2937;
}

.dark .mobile-quality-header h3 {
  color: #f9fafb;
}

.mobile-quality-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(0.25rem, 1vw, 0.5rem);
}

.mobile-quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: clamp(0.5rem, 2vw, 0.75rem) clamp(0.25rem, 1vw, 0.5rem);
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
  font-size: clamp(0.75rem, 2vw, 0.875rem);
}

.mobile-quality-red {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.mobile-quality-yellow {
  background: #fffbeb;
  border-color: #fed7aa;
  color: #d97706;
}

.mobile-quality-green {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #16a34a;
}

.mobile-quality-icon {
  font-size: clamp(1rem, 3vw, 1.25rem);
  margin-bottom: clamp(0.125rem, 1vw, 0.25rem);
}

.mobile-quality-label {
  font-weight: 600;
  font-size: clamp(0.625rem, 2vw, 0.75rem);
}

/* 状态区域 */
.loading-state,
.error-state {
  text-align: center;
  padding: clamp(3rem, 8vw, 5rem) clamp(0.5rem, 2vw, 1rem);
}

.progress-section {
  text-align: center;
  padding: clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem);
  background: white;
  border-radius: 12px;
  margin: clamp(1rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .progress-section {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

/* 滚动条样式 */
.definition-body::-webkit-scrollbar {
  width: 6px;
}

.definition-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dark .definition-body::-webkit-scrollbar-track {
  background: #374151;
}

.definition-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dark .definition-body::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.definition-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .definition-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

