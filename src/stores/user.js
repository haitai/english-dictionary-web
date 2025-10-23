import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/utils/supabase'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value)

  // 初始化用户状态
  async function initUser() {
    loading.value = true
    try {
      const currentUser = await auth.getCurrentUser()
      user.value = currentUser
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function signUp(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data, error: signUpError } = await auth.signUp(email, password)
      if (signUpError) throw signUpError
      user.value = data.user
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 登录
  async function signIn(email, password) {
    loading.value = true
    error.value = null
    try {
      const { data, error: signInError } = await auth.signIn(email, password)
      if (signInError) throw signInError
      user.value = data.user
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Google 登录
  async function signInWithGoogle() {
    loading.value = true
    error.value = null
    try {
      const { error: signInError } = await auth.signInWithGoogle()
      if (signInError) throw signInError
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function signOut() {
    loading.value = true
    error.value = null
    try {
      const { error: signOutError } = await auth.signOut()
      if (signOutError) throw signOutError
      user.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initUser,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    clearError
  }
})

