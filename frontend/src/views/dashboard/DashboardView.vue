<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">欢迎回来，{{ authStore.user?.username }}</h1>
    </div>

    <!-- 加载状态 -->
    <AppLoading v-if="loading" />

    <template v-else>
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">📁</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.projects.total }}</div>
            <div class="stat-label">项目总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon success">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.projects.active }}</div>
            <div class="stat-label">进行中项目</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon warning">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.workflows.pending }}</div>
            <div class="stat-label">待审批流程</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon info">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.workflows.total }}</div>
            <div class="stat-label">流程总数</div>
          </div>
        </div>
      </div>

      <!-- 待办事项 -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">我的待办</h2>
        </div>

        <!-- 空状态 -->
        <AppEmpty
          v-if="stats.todos.length === 0"
          icon="✨"
          title="暂无待办事项"
        >
          当前没有需要您处理的审批流程
        </AppEmpty>

        <!-- 待办列表 -->
        <div v-else class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>流程类型</th>
                <th>模板</th>
                <th>申请人</th>
                <th>关联项目</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="todo in stats.todos" :key="todo.nodeId">
                <td>
                  <span
                    :class="[
                      'badge',
                      todo.type === 'ONBOARD'
                        ? 'badge-success'
                        : 'badge-warning',
                    ]"
                  >
                    {{ todo.type === 'ONBOARD' ? '入职' : '离职' }}
                  </span>
                </td>
                <td>{{ todo.template }}</td>
                <td>{{ todo.applicant }}</td>
                <td>{{ todo.project || '-' }}</td>
                <td>{{ formatDate(todo.createdAt) }}</td>
                <td>
                  <router-link
                    :to="`/dashboard/workflows/${todo.workflowId}`"
                    class="btn btn-primary btn-sm"
                  >
                    处理
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 仪表盘首页（重构后）
 * 使用通用组件和工具函数简化
 */
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { projectApi } from '@/api/project'
import { workflowApi } from '@/api/workflow'
import { formatDate } from '@/utils/format'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'

const authStore = useAuthStore()

const loading = ref(true)
const stats = reactive({
  projects: { total: 0, active: 0 },
  workflows: { total: 0, pending: 0 },
  todos: [],
})

/**
 * 获取统计数据
 */
onMounted(async () => {
  try {
    const [projectStats, workflowStats, todoList] = await Promise.all([
      projectApi.getStats(),
      workflowApi.getStats(),
      workflowApi.getTodoList(),
    ])

    stats.projects = projectStats.data
    stats.workflows = workflowStats.data
    stats.todos = todoList.data || []
  } catch (error) {
    console.error('获取统计数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>
