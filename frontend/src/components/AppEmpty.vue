<template>
  <!-- 通用空状态组件 -->
  <div class="empty-state">
    <div class="empty-state-icon">{{ icon }}</div>
    <div class="empty-state-title">{{ title }}</div>
    <p v-if="$slots.default"><slot /></p>
  </div>
</template>

<script setup>
/**
 * 通用空状态组件
 * 替换视图中重复的空数据展示模板
 *
 * @prop {string} icon - 图标 emoji
 * @prop {string} title - 标题文本
 * @slot default - 可选描述内容
 */
defineProps({
  icon: {
    type: String,
    default: '📭',
  },
  title: {
    type: String,
    default: '暂无数据',
  },
})
</script>
