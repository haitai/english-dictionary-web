<template>
  <div class="max-w-md mx-auto">
    <div class="card">
      <h1 class="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
        {{ isLogin ? '登录' : '注册' }}
      </h1>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            邮箱
          </label>
          <input
            v-model="email"
            type="email"
            required
            class="input"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            密码
          </label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            class="input"
            placeholder="至少 6 位"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn btn-primary py-3"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">或</span>
          </div>
        </div>

        <button
          @click="handleGoogleSignIn"
          :disabled="loading"
          class="mt-4 w-full btn btn-outline py-3 flex items-center justify-center gap-2"
        >
          <span>🔐</span>
          <span>使用 Google 登录</span>
        </button>
      </div>

      <div class="mt-6 text-center">
        <button
          @click="isLogin = !isLogin"
          class="text-primary-600 dark:text-primary-400 hover:underline text-sm"
        >
          {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
        </button>
      </div>

      <div class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>登录即表示您同意我们的服务条款和隐私政策</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref(null)

async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    let result
    if (isLogin.value) {
      result = await userStore.signIn(email.value, password.value)
    } else {
      result = await userStore.signUp(email.value, password.value)
    }

    if (result.success) {
      // 登录成功，跳转
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } else {
      error.value = result.error || '操作失败，请重试'
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function handleGoogleSignIn() {
  error.value = null
  loading.value = true

  try {
    const result = await userStore.signInWithGoogle()
    if (!result.success) {
      error.value = result.error || 'Google 登录失败'
    }
    // Google OAuth 会重定向，无需手动跳转
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

