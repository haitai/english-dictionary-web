<template>
  <transition name="fade">
    <div 
      v-if="showOffline" 
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
    >
      <span class="text-2xl">📡</span>
      <div class="flex-1">
        <div class="font-semibold">离线模式</div>
        <div class="text-sm opacity-90">数据将在恢复连接后自动同步</div>
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div 
      v-if="showSyncing" 
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
    >
      <span class="text-2xl animate-spin">🔄</span>
      <div class="flex-1">
        <div class="font-semibold">正在同步...</div>
        <div class="text-sm opacity-90">正在保存您的学习进度</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useLearningStore } from '@/stores/learning'

const learningStore = useLearningStore()

const isOnline = ref(navigator.onLine)
const showOffline = ref(false)
const showSyncing = ref(false)

let offlineTimer = null
let syncingTimer = null

// 更新在线状态
function updateOnlineStatus() {
  isOnline.value = navigator.onLine
  
  if (!isOnline.value) {
    showOffline.value = true
  } else {
    showOffline.value = false
    // 恢复在线时立即同步
    if (learningStore && !learningStore.isSyncing) {
      learningStore.syncWithServer()
    }
  }
}

// 监听同步状态
watch(() => learningStore.isSyncing, (syncing) => {
  if (syncing) {
    showSyncing.value = true
  } else {
    // 延迟隐藏，让用户看到同步完成
    syncingTimer = setTimeout(() => {
      showSyncing.value = false
    }, 1500)
  }
})

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  if (offlineTimer) clearTimeout(offlineTimer)
  if (syncingTimer) clearTimeout(syncingTimer)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

