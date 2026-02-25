<template>
  <div style="display: flex; min-height: 100vh">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">E-Paper</div>

      <nav>
        <ul class="sidebar-nav">
          <li
            v-for="item in navItems"
            :key="item.path"
            class="sidebar-nav-item"
          >
            <router-link
              :to="item.path"
              :class="['sidebar-nav-link', { active: isActive(item.path) }]"
            >
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- 用户信息 -->
      <div class="sidebar-user-panel">
        <div class="sidebar-user-label">当前用户</div>
        <div class="sidebar-user-name">
          {{ authStore.user?.username || '未登录' }}
        </div>
        <div class="sidebar-user-role">
          角色：{{ authStore.user?.role || '-' }}
        </div>
        <button
          class="btn btn-secondary btn-sm"
          style="width: 100%"
          @click="handleLogout"
        >
          退出登录
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
/**
 * 仪表盘布局组件（重构后）
 * 将内联样式提取到 scoped CSS
 */
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 导航菜单项
const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/dashboard/cockpit', label: '驾驶舱', icon: '🎯' },
  { path: '/dashboard/employees', label: '员工管理', icon: '👥' },
  { path: '/dashboard/projects', label: '项目管理', icon: '📁' },
  { path: '/dashboard/workflows', label: '审批流程', icon: '📋' },
  { path: '/dashboard/materials', label: '物料管理', icon: '📦' },
  { path: '/dashboard/alerts', label: '预警中心', icon: '🔔' },
  { path: '/dashboard/templates', label: '模板配置', icon: '⚙️' },
]

/**
 * 判断导航项是否为当前激活状态
 */
function isActive(path) {
  return route.path === path
}

/**
 * 处理登出
 */
async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* 侧边栏底部用户信息面板 —— 从内联样式提取 */
.sidebar-user-panel {
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.sidebar-user-label {
  font-size: 0.875rem;
  color: var(--gray-300);
}

.sidebar-user-name {
  font-weight: 500;
  margin-bottom: 8px;
}

.sidebar-user-role {
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-bottom: 12px;
}
</style>
