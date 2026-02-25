<template>
  <!-- 首页：根据登录状态自动重定向 -->
  <div
    :style="{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }"
  >
    <div style="text-align: center; color: white">
      <h1 style="font-size: 2.5rem; margin-bottom: 16px">E-Paper</h1>
      <p>员工与项目全生命周期管理系统</p>
      <div
        class="spinner"
        :style="{
          marginTop: '24px',
          borderColor: 'rgba(255,255,255,0.3)',
          borderTopColor: 'white',
        }"
      ></div>
    </div>
  </div>
</template>

<script setup>
/**
 * 首页视图
 * 替代 Next.js 的 app/page.js
 * 实际的路由重定向逻辑已在 router/index.js 的路由守卫中处理
 * 此页面仅作为加载过渡展示
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  // 路由守卫已处理认证跳转，这里作为兜底
  if (!authStore.loading) {
    if (authStore.isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }
})
</script>
