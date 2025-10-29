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
      <!-- 左侧：单词显示区域 -->
      <div class="word-section">
        <!-- 单词卡片 -->
        <div class="word-card-container">
          <WordCard :word="currentWord.word" :word-data="currentWord" />
        </div>

        <!-- 掌握程度选择（桌面端在底部，移动端固定在屏幕底部） -->
        <div class="quality-selection-desktop">
          <h3 class="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
            您对这个单词的掌握程度是？
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              v-for="(option, index) in qualityOptions"
              :key="option.value"
              @click="markWord(option.value)"
              :class="[
                'group relative p-4 md:p-6 rounded-lg border-2 transition-all duration-200',
                'hover:scale-105 hover:shadow-lg active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                option.color === 'red' && 'border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 focus:ring-red-500',
                option.color === 'yellow' && 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 focus:ring-yellow-500',
                option.color === 'green' && 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 focus:ring-green-500',
                submitting && 'opacity-50 cursor-not-allowed'
              ]"
              :disabled="submitting"
            >
              <div class="text-center">
                <div :class="[
                  'text-xl md:text-2xl mb-2',
                  option.color === 'red' && 'text-red-600 dark:text-red-400',
                  option.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                  option.color === 'green' && 'text-green-600 dark:text-green-400'
                ]">
                  {{ option.icon }}
                </div>
                <div :class="[
                  'font-semibold text-sm md:text-lg mb-1',
                  option.color === 'red' && 'text-red-800 dark:text-red-200',
                  option.color === 'yellow' && 'text-yellow-800 dark:text-yellow-200',
                  option.color === 'green' && 'text-green-800 dark:text-green-200'
                ]">
                  {{ option.label }}
                </div>
                <p :class="[
                  'text-xs md:text-sm leading-tight',
                  option.color === 'red' && 'text-red-600 dark:text-red-400',
                  option.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                  option.color === 'green' && 'text-green-600 dark:text-green-400'
                ]">
                  {{ option.description }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <!-- 收藏按钮 -->
        <div class="collection-section">
          <button
            v-if="userStore.isAuthenticated"
            @click="toggleCollection"
            :class="[
              'btn px-4 md:px-6 py-2 md:py-3 text-sm md:text-base',
              isCollected ? 'btn-primary' : 'btn-outline'
            ]"
          >
            {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
          </button>
          <p v-else class="text-xs md:text-sm text-gray-500 dark:text-gray-400">
            登录后可收藏单词
          </p>
        </div>
      </div>

      <!-- 右侧：释义区域 -->
      <div class="definition-section">
        <div v-if="!showDefinition" class="definition-placeholder">
          <button @click="showDefinition = true" class="btn btn-primary text-lg px-8 py-4">
            📖 查看释义
          </button>
        </div>
        <div v-else class="definition-content">
          <div class="definition-header">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ currentWord.word }} 的释义
            </h3>
            <button @click="showDefinition = false" class="btn btn-outline text-sm">
              隐藏释义
            </button>
          </div>
          <div class="definition-body">
            <div v-for="(def, index) in currentWord.definitions" :key="index" class="definition-item">
              <div class="part-of-speech">{{ def.part_of_speech }}</div>
              <div class="definition-text">{{ def.definition_cn }}</div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import WordCard from '@/components/WordCard.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import { simpleQualityOptions } from '@/utils/sm2'

const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const currentWord = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const learnedCount = ref(0)
const showDefinition = ref(false)

const qualityOptions = simpleQualityOptions

const isCollected = computed(() => {
  if (!currentWord.value) return false
  return learningStore.isCollected(currentWord.value.word)
})

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
  margin-bottom: 2rem;
  padding: 0 1rem;
}

/* 主要内容区域 - 左右布局 */
.main-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
}

/* 左侧单词区域 */
.word-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.word-card-container {
  flex: 1;
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

/* 收藏按钮区域 */
.collection-section {
  text-align: center;
  margin-top: 1rem;
}

/* 右侧释义区域 */
.definition-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dark .definition-section {
  background: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.definition-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.definition-content {
  padding: 1.5rem;
}

.definition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.dark .definition-header {
  border-bottom-color: #374151;
}

.definition-body {
  max-height: 500px;
  overflow-y: auto;
}

.definition-item {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
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
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.definition-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 0.75rem;
}

.dark .definition-text {
  color: #d1d5db;
}

.example {
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.dark .example {
  background: #374151;
}

.example-en {
  font-style: italic;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.dark .example-en {
  color: #9ca3af;
}

.example-cn {
  color: #374151;
  font-weight: 500;
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
  padding: 1rem;
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
  margin-bottom: 0.75rem;
}

.mobile-quality-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.mobile-quality-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
  font-size: 0.875rem;
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
  font-size: 1.25rem;
  margin-bottom: 0.25rem;
}

.mobile-quality-label {
  font-weight: 600;
  font-size: 0.75rem;
}

/* 状态区域 */
.loading-state,
.error-state {
  text-align: center;
  padding: 5rem 1rem;
}

.progress-section {
  text-align: center;
  padding: 2rem 1rem;
  background: white;
  border-radius: 12px;
  margin: 2rem 1rem;
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

