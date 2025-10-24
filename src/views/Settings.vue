<template>
  <div class="max-w-4xl mx-auto">
    <div class="card">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">个人设置</h1>
      
      <!-- 朗读设置 -->
      <div class="space-y-6">
        <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <span class="text-2xl mr-2">🔊</span>
            朗读设置
          </h2>
          
          <!-- 自动朗读总开关 -->
          <div class="flex items-center justify-between py-3">
            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">自动朗读</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">开启后，查看单词时会自动朗读</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.autoSpeak"
                @change="updateSettings"
                type="checkbox"
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <!-- 朗读场景设置 -->
          <div v-if="settings.autoSpeak" class="ml-6 space-y-4 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
            <div class="flex items-center justify-between py-2">
              <div>
                <h4 class="text-base font-medium text-gray-900 dark:text-gray-100">单词详情页</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">进入单词详情时自动朗读</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.speakOnWordDetail"
                  @change="updateSettings"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <h4 class="text-base font-medium text-gray-900 dark:text-gray-100">学习模式</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">学习新单词时自动朗读</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.speakOnStudy"
                  @change="updateSettings"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <h4 class="text-base font-medium text-gray-900 dark:text-gray-100">搜索结果</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">搜索单词时自动朗读</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.speakOnSearch"
                  @change="updateSettings"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          <!-- 朗读参数设置 -->
          <div v-if="settings.autoSpeak" class="ml-6 mt-4 space-y-4 border-l-2 border-primary-200 dark:border-primary-800 pl-4">
            <div>
              <label class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                朗读语速: {{ settings.speakSpeed }}x
              </label>
              <input
                v-model="settings.speakSpeed"
                @input="updateSettings"
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              >
              <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>

            <div>
              <label class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                朗读语言
              </label>
              <select
                v-model="settings.speakLanguage"
                @change="updateSettings"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="en-US">英语 (美式)</option>
                <option value="en-GB">英语 (英式)</option>
                <option value="en-AU">英语 (澳式)</option>
                <option value="zh-CN">中文 (普通话)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 显示设置 -->
        <div class="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <span class="text-2xl mr-2">👁️</span>
            显示设置
          </h2>
          
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2">
              <div>
                <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">显示音标</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">在单词旁边显示音标</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.showPhonetic"
                  @change="updateSettings"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div class="flex items-center justify-between py-2">
              <div>
                <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">显示例句</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">显示单词的例句</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.showExamples"
                  @change="updateSettings"
                  type="checkbox"
                  class="sr-only peer"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-between items-center pt-6">
          <button
            @click="resetSettings"
            class="btn btn-outline"
          >
            重置设置
          </button>
          
          <div class="text-sm text-gray-500 dark:text-gray-400">
            设置已自动保存
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSettings, saveSettings, resetSettings as resetAllSettings } from '@/utils/settings'

const settings = ref({})

// 加载设置
function loadSettings() {
  settings.value = getSettings()
}

// 更新设置
function updateSettings() {
  saveSettings(settings.value)
}

// 重置设置
function resetSettings() {
  if (confirm('确定要重置所有设置吗？')) {
    settings.value = resetAllSettings()
  }
}

onMounted(() => {
  loadSettings()
})
</script>
