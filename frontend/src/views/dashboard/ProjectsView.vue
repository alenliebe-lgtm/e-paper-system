<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">项目管理</h1>
      <button class="btn btn-primary" @click="modal.open()">
        + 新建项目
      </button>
    </div>

    <div class="card">
      <!-- 加载状态 -->
      <AppLoading v-if="loading" />

      <!-- 空状态 -->
      <AppEmpty v-else-if="list.length === 0" icon="📁" title="暂无项目数据" />

      <!-- 项目列表 -->
      <template v-else>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>项目编码</th>
                <th>项目名称</th>
                <th>项目经理</th>
                <th>开始日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in list" :key="project.id">
                <td>
                  <code>{{ project.code }}</code>
                </td>
                <td>{{ project.projectName }}</td>
                <td>{{
                  project.pm?.profile?.fullName ||
                  project.pm?.username ||
                  '-'
                }}</td>
                <td>{{ formatDate(project.startDate) }}</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      `badge-${getStatusClass(PROJECT_STATUS_MAP, project.status)}`,
                    ]"
                  >
                    {{ getStatusLabel(PROJECT_STATUS_MAP, project.status) }}
                  </span>
                </td>
                <td>
                  <button
                    class="btn btn-secondary btn-sm"
                    style="margin-right: 8px"
                  >
                    编辑
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="handleDelete(project.id, projectApi.delete, '确定要删除该项目吗？')"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <AppPagination
          :pagination="pagination"
          @page-change="fetchList"
        />
      </template>
    </div>

    <!-- 新建项目模态框 -->
    <AppModal
      :visible="modal.visible.value"
      title="新建项目"
      submit-text="创建"
      @close="modal.closeAndReset()"
      @submit="handleSubmit"
    >
      <div class="form-group">
        <label class="form-label">项目编码</label>
        <input
          type="text"
          class="form-input"
          placeholder="如：PRJ-2024-001"
          v-model="modal.formData.code"
          @input="modal.formData.code = modal.formData.code.toUpperCase()"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">项目名称</label>
        <input
          type="text"
          class="form-input"
          v-model="modal.formData.projectName"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">项目描述</label>
        <textarea
          class="form-input"
          rows="3"
          v-model="modal.formData.description"
        ></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">开始日期</label>
        <input
          type="date"
          class="form-input"
          v-model="modal.formData.startDate"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">结束日期</label>
        <input
          type="date"
          class="form-input"
          v-model="modal.formData.endDate"
        />
      </div>
    </AppModal>
  </div>
</template>

<script setup>
/**
 * 项目管理页面（重构后）
 * 使用通用组件和 composables 消除重复代码
 */
import { onMounted } from 'vue'
import { projectApi } from '@/api/project'
import { useListPage } from '@/composables/useListPage'
import { useModal } from '@/composables/useModal'
import { formatDate, PROJECT_STATUS_MAP, getStatusLabel, getStatusClass } from '@/utils/format'
import AppPagination from '@/components/AppPagination.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'
import AppModal from '@/components/AppModal.vue'

// 列表逻辑
const { list, loading, pagination, fetchList, handleDelete } = useListPage(
  (params) => projectApi.getList(params)
)

// 模态框逻辑
const modal = useModal({
  projectName: '',
  code: '',
  description: '',
  startDate: '',
  endDate: '',
  pmId: 1,
})

/**
 * 提交新项目
 */
async function handleSubmit() {
  try {
    await projectApi.create({ ...modal.formData })
    modal.closeAndReset()
    fetchList()
  } catch (error) {
    alert('创建项目失败: ' + error.message)
  }
}

onMounted(() => {
  fetchList()
})
</script>
