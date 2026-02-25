/**
 * Vue 应用入口
 * 注册全局插件：Pinia 状态管理、Vue Router 路由
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 导入全局样式
import '@/assets/styles/globals.css'

const app = createApp(App)

// 注册 Pinia（替代 React Context Provider）
app.use(createPinia())

// 注册 Vue Router
app.use(router)

// 挂载应用
app.mount('#app')
