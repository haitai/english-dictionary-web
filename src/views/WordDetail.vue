<template>
  <div class="max-w-4xl mx-auto">
    <!-- Toast 提示 -->
    <transition name="toast">
      <div
        v-if="showMessage"
        class="fixed top-4 right-4 z-50 px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-2"
      >
        <span class="text-xl">✓</span>
        <span>{{ messageText }}</span>
      </div>
    </transition>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-20">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <!-- 单词详情 -->
    <div v-else-if="wordData" class="space-y-6">
      <!-- 标题和操作 -->
      <div class="card">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-4 mb-2">
              <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {{ wordData.word }}
              </h1>
              <SpeakerButton 
                :text="wordData.word"
                :lang="'en'"
                :speed="0.8"
              />
            </div>
            <div v-if="currentPhonetic || phoneticLoading" class="mb-4">
              <div v-if="phoneticLoading" class="text-gray-500 dark:text-gray-400">
                <div class="inline-flex items-center gap-2">
                  <div class="w-4 h-4 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  获取音标中...
                </div>
              </div>
              <p v-else-if="currentPhonetic" class="text-xl text-gray-600 dark:text-gray-400">
                [{{ currentPhonetic }}]
              </p>
            </div>
            <div class="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p class="text-gray-800 dark:text-gray-200">
                {{ wordData.concise_definition }}
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              v-if="userStore.isAuthenticated"
              @click="addToLearning"
              class="btn btn-primary"
              title="加入学习"
            >
              📚 加入学习
            </button>
            <button
              v-if="userStore.isAuthenticated"
              @click="toggleCollection"
              :class="[
                'btn',
                isCollected ? 'btn-primary' : 'btn-outline'
              ]"
            >
              {{ isCollected ? '⭐' : '☆' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 词形变化 -->
      <div v-if="wordData.forms && Object.keys(wordData.forms).length > 0" class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          词形变化
        </h2>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="(value, key) in wordData.forms"
            :key="key"
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ key }}</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-gray-100">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- 详细释义 -->
      <div v-if="wordData.definitions" class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          详细释义
        </h2>
        <div class="space-y-6">
          <div
            v-for="(def, index) in wordData.definitions"
            :key="index"
            class="border-l-4 border-primary-500 pl-4"
          >
            <div class="flex items-center gap-2 mb-3">
              <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                {{ def.pos }}
              </span>
            </div>
            
            <div class="space-y-3">
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">英文解释：</div>
                <p class="text-gray-700 dark:text-gray-300">{{ def.explanation_en }}</p>
              </div>
              
              <div>
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">中文解释：</div>
                <p class="text-gray-900 dark:text-gray-100 font-medium">{{ def.explanation_cn }}</p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm text-gray-500 dark:text-gray-400">例句：</div>
                  <SentenceSpeaker 
                    :text="def.example_en"
                    :lang="'en'"
                    :speed="0.8"
                  />
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-2">{{ def.example_en }}</p>
                <p class="text-gray-900 dark:text-gray-100">{{ def.example_cn }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 近义词对比 -->
      <div v-if="wordData.comparison && wordData.comparison.length > 0" class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          相似词辨析
        </h2>
        <div class="space-y-4">
          <div
            v-for="(comp, index) in wordData.comparison"
            :key="index"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {{ wordData.word }}
              </h3>
              <span class="text-gray-400">vs</span>
              <router-link
                :to="{ name: 'WordDetail', params: { word: comp.word_to_compare } }"
                class="font-semibold text-lg text-primary-600 dark:text-primary-400 hover:underline"
              >
                {{ comp.word_to_compare }}
              </router-link>
            </div>
            <p class="text-gray-700 dark:text-gray-300">
              {{ comp.analysis }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-else class="text-center py-20">
      <div class="text-4xl mb-4">❌</div>
      <p class="text-red-600 dark:text-red-400 mb-4">
        {{ error || '未找到该单词' }}
      </p>
      <button @click="$router.back()" class="btn btn-primary">
        返回
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import SpeakerButton from '@/components/SpeakerButton.vue'
import SentenceSpeaker from '@/components/SentenceSpeaker.vue'
import { getPhonetic } from '@/utils/phonetic'
import { autoSpeak } from '@/utils/tts'

const route = useRoute()
const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const wordData = ref(null)
const loading = ref(false)
const error = ref(null)
const currentPhonetic = ref('')
const phoneticLoading = ref(false)
const showMessage = ref(false)
const messageText = ref('')

const isCollected = computed(() => {
  if (!wordData.value) return false
  return learningStore.isCollected(wordData.value.word)
})

// 获取音标
async function fetchPhonetic() {
  if (!wordData.value?.word) return
  
  phoneticLoading.value = true
  
  try {
    const phonetic = await getPhonetic(wordData.value.word, wordData.value.pronunciation)
    currentPhonetic.value = phonetic || ''
  } catch (error) {
    console.warn('获取音标失败:', error)
    currentPhonetic.value = wordData.value.pronunciation || ''
  } finally {
    phoneticLoading.value = false
  }
}

async function loadWord() {
  const word = route.params.word
  if (!word) return

  loading.value = true
  error.value = null

  try {
    wordData.value = await dictionaryStore.getWordDetail(word)
    // 加载单词后获取音标和自动朗读
    if (wordData.value) {
      await fetchPhonetic()
      // 延迟自动朗读，避免阻塞页面加载
      setTimeout(async () => {
        await autoSpeak(wordData.value.word, 'wordDetail')
      }, 200)
    }
  } catch (err) {
    error.value = '加载单词详情失败: ' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function toggleCollection() {
  if (!wordData.value || !userStore.isAuthenticated) return

  if (isCollected.value) {
    await learningStore.removeCollection(wordData.value.word)
  } else {
    await learningStore.addCollection(wordData.value.word)
  }
}

// 显示提示消息
function showMessageFunc(text) {
  messageText.value = text
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

async function addToLearning() {
  if (!wordData.value || !userStore.isAuthenticated) return

  try {
    // 将单词标记为"不认识"（质量评分 1），加入学习
    const result = await learningStore.updateProgress(wordData.value.word, 1)
    
    if (result.success) {
      // 提示用户
      showMessageFunc('已加入学习！这个单词将被标记为"不认识"，系统会定期提醒你复习。')
    } else {
      showMessageFunc('加入学习失败，请稍后重试。')
    }
  } catch (error) {
    console.error('加入学习失败:', error)
    showMessageFunc('加入学习失败，请稍后重试。')
  }
}

watch(() => route.params.word, () => {
  loadWord()
})

onMounted(() => {
  loadWord()
})
</script>

<style scoped>
/* Toast 过渡效果 */
.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

