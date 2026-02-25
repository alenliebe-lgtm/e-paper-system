<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">员工管理</h1>
      <button class="btn btn-primary" @click="modal.open()">
        + 添加员工
      </button>
    </div>

    <div class="card">
      <!-- 加载状态 -->
      <AppLoading v-if="loading" />

      <!-- 空状态 -->
      <AppEmpty v-else-if="list.length === 0" icon="👥" title="暂无员工数据" />

      <!-- 员工列表 -->
      <template v-else>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>部门</th>
                <th>职位</th>
                <th>入职日期</th>
                <th>联系电话</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="emp in list" :key="emp.id">
                <td>{{ emp.fullName }}</td>
                <td>{{ emp.department }}</td>
                <td>{{ emp.position }}</td>
                <td>{{ formatDate(emp.entryDate) }}</td>
                <td>{{ emp.phone || '-' }}</td>
                <td>
                  <button
                    class="btn btn-secondary btn-sm"
                    style="margin-right: 8px"
                  >
                    编辑
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="handleDelete(emp.id, employeeApi.delete, '确定要删除该员工吗？')"
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

    <!-- 添加员工模态框 -->
    <AppModal
      :visible="modal.visible.value"
      title="添加员工"
      submit-text="确定"
      @close="modal.closeAndReset()"
      @submit="handleSubmit"
    >
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input
          type="text"
          class="form-input"
          v-model="modal.formData.fullName"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">部门</label>
        <input
          type="text"
          class="form-input"
          v-model="modal.formData.department"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">职位</label>
        <input
          type="text"
          class="form-input"
          v-model="modal.formData.position"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">入职日期</label>
        <input
          type="date"
          class="form-input"
          v-model="modal.formData.entryDate"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">联系电话</label>
        <input
          type="tel"
          class="form-input"
          v-model="modal.formData.phone"
        />
      </div>
    </AppModal>
  </div>
</template>

<script setup>
/**
 * 员工管理页面（重构后）
 * 使用通用组件和 composables 消除重复代码
 */
import { onMounted } from 'vue'
import { employeeApi } from '@/api/employee'
import { useListPage } from '@/composables/useListPage'
import { useModal } from '@/composables/useModal'
import { formatDate } from '@/utils/format'
import AppPagination from '@/components/AppPagination.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'
import AppModal from '@/components/AppModal.vue'

// 列表逻辑
const { list, loading, pagination, fetchList, handleDelete } = useListPage(
  (params) => employeeApi.getList(params)
)

// 模态框逻辑
const modal = useModal({
  fullName: '',
  department: '',
  position: '',
  entryDate: '',
  phone: '',
})

/**
 * 提交新员工
 */
async function handleSubmit() {
  try {
    await employeeApi.create({ ...modal.formData })
    modal.closeAndReset()
    fetchList()
  } catch (error) {
    alert('创建员工失败: ' + error.message)
  }
}

onMounted(() => {
  fetchList()
})
</script>
