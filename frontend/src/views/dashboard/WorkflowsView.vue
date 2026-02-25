<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">审批流程</h1>
      <button class="btn btn-primary" @click="modal.open()">
        + 发起申请
      </button>
    </div>

    <div class="card">
      <!-- 加载状态 -->
      <AppLoading v-if="loading" />

      <!-- 空状态 -->
      <AppEmpty v-else-if="list.length === 0" icon="📋" title="暂无审批流程" />

      <!-- 工作流列表 -->
      <template v-else>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>流程类型</th>
                <th>模板</th>
                <th>申请人</th>
                <th>当前步骤</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="wf in list" :key="wf.id">
                <td>
                  <span
                    :class="[
                      'badge',
                      wf.type === 'ONBOARD'
                        ? 'badge-success'
                        : 'badge-warning',
                    ]"
                  >
                    {{ WORKFLOW_TYPE_MAP[wf.type] }}
                  </span>
                </td>
                <td>{{ wf.template?.name }}</td>
                <td>{{
                  wf.applicant?.profile?.fullName || wf.applicant?.username
                }}</td>
                <td>第 {{ wf.currentStep }} 步</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      `badge-${getStatusClass(WORKFLOW_STATUS_MAP, wf.status)}`,
                    ]"
                  >
                    {{ getStatusLabel(WORKFLOW_STATUS_MAP, wf.status) }}
                  </span>
                </td>
                <td>{{ formatDate(wf.createdAt) }}</td>
                <td>
                  <!-- 待处理时显示审批按钮 -->
                  <template v-if="wf.status === 'PENDING'">
                    <button
                      class="btn btn-success btn-sm"
                      style="margin-right: 8px"
                      @click="handleApprove(wf.id)"
                    >
                      通过
                    </button>
                    <button
                      class="btn btn-danger btn-sm"
                      @click="handleReject(wf.id)"
                    >
                      拒绝
                    </button>
                  </template>
                  <!-- 其他状态显示占位符 -->
                  <span v-else style="color: var(--text-tertiary)">-</span>
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

    <!-- 发起申请模态框 -->
    <AppModal
      :visible="modal.visible.value"
      title="发起审批申请"
      submit-text="提交"
      @close="modal.closeAndReset()"
      @submit="handleSubmit"
    >
      <div class="form-group">
        <label class="form-label">流程类型</label>
        <select class="form-input" v-model="modal.formData.type">
          <option value="ONBOARD">入职申请</option>
          <option value="OFFBOARD">离职申请</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">选择模板</label>
        <select
          class="form-input"
          v-model="modal.formData.templateId"
          required
        >
          <option value="">请选择模板</option>
          <option
            v-for="t in filteredTemplates"
            :key="t.id"
            :value="t.id"
          >
            {{ t.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">备注说明</label>
        <textarea
          class="form-input"
          rows="3"
          v-model="modal.formData.remark"
          placeholder="请输入备注（可选）"
        ></textarea>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
/**
 * 审批流程页面（重构后）
 * 使用通用组件和 composables 消除重复代码
 */
import { ref, computed, onMounted } from 'vue'
import { workflowApi } from '@/api/workflow'
import { templateApi } from '@/api/template'
import { useListPage } from '@/composables/useListPage'
import { useModal } from '@/composables/useModal'
import {
  formatDate,
  WORKFLOW_STATUS_MAP,
  WORKFLOW_TYPE_MAP,
  getStatusLabel,
  getStatusClass,
} from '@/utils/format'
import AppPagination from '@/components/AppPagination.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'
import AppModal from '@/components/AppModal.vue'

// 列表逻辑
const { list, loading, pagination, fetchList } = useListPage(
  (params) => workflowApi.getList(params)
)

// 模板列表（用于下拉选择）
const templates = ref([])

// 模态框逻辑
const modal = useModal({
  templateId: '',
  type: 'ONBOARD',
  remark: '',
})

/**
 * 根据当前选择的类型过滤模板
 */
const filteredTemplates = computed(() => {
  return templates.value.filter((t) => t.type === modal.formData.type)
})

/**
 * 获取模板列表
 */
async function fetchTemplates() {
  try {
    const response = await templateApi.getActive()
    templates.value = response.data || []
  } catch (error) {
    console.error('获取模板列表失败:', error)
  }
}

/**
 * 提交新的工作流
 */
async function handleSubmit() {
  try {
    await workflowApi.create({
      ...modal.formData,
      templateId: parseInt(modal.formData.templateId, 10),
    })
    modal.closeAndReset()
    fetchList()
  } catch (error) {
    alert('创建工作流失败: ' + error.message)
  }
}

/**
 * 审批通过
 */
async function handleApprove(id) {
  const comment = prompt('请输入审批意见（可选）：')
  try {
    await workflowApi.approve(id, { comment })
    fetchList()
  } catch (error) {
    alert('审批失败: ' + error.message)
  }
}

/**
 * 审批拒绝
 */
async function handleReject(id) {
  const comment = prompt('请输入拒绝原因：')
  if (!comment) return
  try {
    await workflowApi.reject(id, { comment })
    fetchList()
  } catch (error) {
    alert('操作失败: ' + error.message)
  }
}

onMounted(() => {
  fetchList()
  fetchTemplates()
})
</script>
