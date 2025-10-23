<template>
  <div class="max-w-4xl mx-auto">
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
            <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {{ wordData.word }}
            </h1>
            <p v-if="wordData.pronunciation" class="text-xl text-gray-600 dark:text-gray-400 mb-4">
              [{{ wordData.pronunciation }}]
            </p>
            <div class="inline-block px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p class="text-gray-800 dark:text-gray-200">
                {{ wordData.concise_definition }}
              </p>
            </div>
          </div>

          <div class="flex gap-2">
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
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">例句：</div>
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

      <!-- 返回按钮 -->
      <div class="text-center">
        <button @click="$router.back()" class="btn btn-secondary">
          ← 返回
        </button>
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

const route = useRoute()
const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const wordData = ref(null)
const loading = ref(false)
const error = ref(null)

const isCollected = computed(() => {
  if (!wordData.value) return false
  return learningStore.isCollected(wordData.value.word)
})

async function loadWord() {
  const word = route.params.word
  if (!word) return

  loading.value = true
  error.value = null

  try {
    wordData.value = await dictionaryStore.getWordDetail(word)
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

watch(() => route.params.word, () => {
  loadWord()
})

onMounted(() => {
  loadWord()
})
</script>

