<template>
  <div id="app" :class="{ 'dark': isDark }">
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <!-- 顶部导航栏 -->
      <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <!-- Logo -->
            <router-link to="/" class="flex items-center space-x-2">
              <span class="text-2xl">📚</span>
              <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
                英汉词典
              </span>
            </router-link>

            <!-- 导航链接 -->
            <div class="hidden md:flex items-center space-x-6">
              <router-link 
                to="/" 
                class="nav-link"
                :class="{ 'active': $route.name === 'Home' }"
              >
                首页
              </router-link>
              <router-link 
                to="/study" 
                class="nav-link"
                :class="{ 'active': $route.name === 'Study' }"
              >
                学习
              </router-link>
              <router-link 
                v-if="userStore.isAuthenticated"
                to="/review" 
                class="nav-link"
                :class="{ 'active': $route.name === 'Review' }"
              >
                复习
                <span v-if="learningStore.dueWords.length > 0" 
                      class="ml-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {{ learningStore.dueWords.length }}
                </span>
              </router-link>
              <router-link 
                v-if="userStore.isAuthenticated"
                to="/collection" 
                class="nav-link"
                :class="{ 'active': $route.name === 'Collection' }"
              >
                收藏
              </router-link>
            </div>

            <!-- 右侧按钮 -->
            <div class="flex items-center space-x-4">
              <!-- 主题切换 -->
              <button 
                @click="toggleTheme"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="切换主题"
              >
                <span v-if="isDark" class="text-2xl">🌞</span>
                <span v-else class="text-2xl">🌙</span>
              </button>

              <!-- 用户菜单 -->
              <div v-if="userStore.isAuthenticated" class="flex items-center space-x-2">
                <router-link 
                  to="/settings"
                  class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="设置"
                >
                  <span class="text-2xl">⚙️</span>
                </router-link>
                <router-link 
                  to="/profile"
                  class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="个人中心"
                >
                  <span class="text-2xl">👤</span>
                </router-link>
              </div>
              <div v-else>
                <router-link 
                  to="/auth"
                  class="btn btn-primary"
                >
                  登录
                </router-link>
              </div>

              <!-- 移动端菜单按钮 -->
              <button 
                @click="mobileMenuOpen = !mobileMenuOpen"
                class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span class="text-2xl">☰</span>
              </button>
            </div>
          </div>

          <!-- 移动端菜单 -->
          <div v-show="mobileMenuOpen" class="md:hidden py-4 space-y-2">
            <router-link 
              to="/" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              首页
            </router-link>
            <router-link 
              to="/study" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              学习
            </router-link>
            <router-link 
              v-if="userStore.isAuthenticated"
              to="/review" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              复习
            </router-link>
            <router-link 
              v-if="userStore.isAuthenticated"
              to="/collection" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              收藏
            </router-link>
            <router-link 
              v-if="userStore.isAuthenticated"
              to="/settings" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              设置
            </router-link>
            <router-link 
              v-if="userStore.isAuthenticated"
              to="/profile" 
              class="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              @click="mobileMenuOpen = false"
            >
              个人中心
            </router-link>
          </div>
        </div>
      </nav>

      <!-- 主内容区 -->
      <main class="container mx-auto px-4 py-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- 页脚 -->
      <footer class="mt-16 py-8 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div class="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>基于 <a href="https://github.com/ahpxex/open-english-dictionary" 
                    target="_blank" 
                    class="text-primary-600 hover:underline">
            Open English Dictionary
          </a> 数据构建</p>
          <p class="mt-2 text-sm">开源项目 · 自由部署</p>
        </div>
      </footer>
    </div>

    <!-- 网络状态提示 -->
    <NetworkStatus />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useLearningStore } from '@/stores/learning'
import { useDictionaryStore } from '@/stores/dictionary'
import NetworkStatus from '@/components/NetworkStatus.vue'
import { auth } from '@/utils/supabase'

const userStore = useUserStore()
const learningStore = useLearningStore()
const dictionaryStore = useDictionaryStore()

const isDark = ref(false)
const mobileMenuOpen = ref(false)

// 切换主题
function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// 初始化
onMounted(async () => {
  // 恢复主题设置
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // 跟随系统主题
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 初始化用户状态
  await userStore.initUser()

  // 初始化词典索引
  await dictionaryStore.initIndex()

  // 如果已登录，加载用户数据
  if (userStore.isAuthenticated) {
    learningStore.loadCollections()
    learningStore.loadProgress()
    learningStore.loadStats()
  }

  // 监听认证状态变化
  auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      userStore.user = session?.user || null
      // 从缓存加载数据，然后后台同步
      learningStore.loadCollections()
      learningStore.loadProgress()
      learningStore.loadStats()
    } else if (event === 'SIGNED_OUT') {
      userStore.user = null
      // 清除用户数据但保留缓存（下次登录可用）
      learningStore.clearUserData()
    }
  })

  // 定期同步数据（每5分钟）
  let syncInterval = null
  if (userStore.isAuthenticated) {
    syncInterval = setInterval(() => {
      if (userStore.isAuthenticated && !learningStore.isSyncing) {
        learningStore.syncWithServer()
      }
    }, 5 * 60 * 1000) // 5分钟
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (syncInterval) {
      clearInterval(syncInterval)
    }
  })

  // 页面可见性变化时同步（用户切换回标签页时同步）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && userStore.isAuthenticated && !learningStore.isSyncing) {
      learningStore.syncWithServer()
    }
  })
})
</script>

<style scoped>
.nav-link {
  @apply text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 
         font-medium transition-colors flex items-center;
}

.nav-link.active {
  @apply text-primary-600 dark:text-primary-400;
}
</style>

