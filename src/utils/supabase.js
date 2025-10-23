import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 用户认证相关
export const auth = {
  // 邮箱注册
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // 邮箱登录
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Google OAuth 登录
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    return { data, error }
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 监听认证状态变化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 收藏相关
export const collections = {
  // 获取用户收藏列表
  async getCollections(userId) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // 添加收藏
  async addCollection(userId, word) {
    const { data, error } = await supabase
      .from('user_collections')
      .insert([{ user_id: userId, word }])
      .select()
    return { data, error }
  },

  // 移除收藏
  async removeCollection(userId, word) {
    const { error } = await supabase
      .from('user_collections')
      .delete()
      .eq('user_id', userId)
      .eq('word', word)
    return { error }
  },

  // 检查是否已收藏
  async isCollected(userId, word) {
    const { data, error } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('word', word)
      .single()
    return { exists: !!data, error }
  }
}

// 学习进度相关
export const progress = {
  // 获取用户学习进度
  async getProgress(userId) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
    return { data, error }
  },

  // 获取单个单词的学习进度
  async getWordProgress(userId, word) {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word', word)
      .single()
    return { data, error }
  },

  // 更新学习进度
  async updateProgress(userId, word, progressData) {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        word,
        ...progressData,
        last_reviewed: new Date().toISOString()
      })
      .select()
    return { data, error }
  },

  // 获取待复习的单词
  async getDueWords(userId) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', now)
      .order('next_review', { ascending: true })
    return { data, error }
  },

  // 获取学习统计
  async getStats(userId) {
    const { data: allProgress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) return { data: null, error }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const stats = {
      totalWords: allProgress.length,
      learnedToday: allProgress.filter(p => {
        const lastReviewed = new Date(p.last_reviewed)
        return lastReviewed >= today
      }).length,
      dueWords: allProgress.filter(p => new Date(p.next_review) <= now).length,
      masteredWords: allProgress.filter(p => p.repetitions >= 5).length
    }

    return { data: stats, error: null }
  }
}

