import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { preloadVoices } from './utils/tts'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// 预加载语音
preloadVoices()

