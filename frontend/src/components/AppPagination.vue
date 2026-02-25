<template>
  <!-- 通用分页组件 -->
  <div class="pagination">
    <button
      class="pagination-btn"
      :disabled="pagination.page === 1"
      @click="$emit('page-change', pagination.page - 1)"
    >
      上一页
    </button>
    <span class="pagination-info">
      第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共
      {{ pagination.total }} 条
    </span>
    <button
      class="pagination-btn"
      :disabled="pagination.page >= pagination.totalPages"
      @click="$emit('page-change', pagination.page + 1)"
    >
      下一页
    </button>
  </div>
</template>

<script setup>
/**
 * 通用分页组件
 * 替换 4 个视图中重复的分页模板
 *
 * @prop {Object} pagination - 分页信息 { page, totalPages, total }
 * @emit page-change - 页码变更事件
 */
defineProps({
  pagination: {
    type: Object,
    required: true,
    default: () => ({ page: 1, totalPages: 1, total: 0 }),
  },
})

defineEmits(['page-change'])
</script>
