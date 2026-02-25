<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">模板配置</h1>
      <button class="btn btn-primary">+ 新建模板</button>
    </div>

    <div class="card">
      <!-- 加载状态 -->
      <AppLoading v-if="loading" />

      <!-- 空状态 -->
      <AppEmpty v-else-if="list.length === 0" icon="⚙️" title="暂无模板" />

      <!-- 模板列表 -->
      <template v-else>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>模板名称</th>
                <th>类型</th>
                <th>版本</th>
                <th>状态</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tpl in list" :key="tpl.id">
                <td>{{ tpl.name }}</td>
                <td>{{ TEMPLATE_TYPE_MAP[tpl.type] }}</td>
                <td>v{{ tpl.version }}</td>
                <td>
                  <span
                    :class="[
                      'badge',
                      tpl.isActive ? 'badge-success' : 'badge-error',
                    ]"
                  >
                    {{ tpl.isActive ? '启用' : '停用' }}
                  </span>
                </td>
                <td>{{ formatDate(tpl.updatedAt) }}</td>
                <td>
                  <button
                    class="btn btn-secondary btn-sm"
                    style="margin-right: 8px"
                  >
                    编辑
                  </button>
                  <button class="btn btn-secondary btn-sm">查看</button>
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
  </div>
</template>

<script setup>
/**
 * 模板配置页面（重构后）
 * 使用通用组件和 composables 消除重复代码
 */
import { onMounted } from 'vue'
import { templateApi } from '@/api/template'
import { useListPage } from '@/composables/useListPage'
import { formatDate, TEMPLATE_TYPE_MAP } from '@/utils/format'
import AppPagination from '@/components/AppPagination.vue'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'

// 列表逻辑
const { list, loading, pagination, fetchList } = useListPage(
  (params) => templateApi.getList(params)
)

onMounted(() => {
  fetchList()
})
</script>
