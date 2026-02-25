<template>
  <!-- 通用模态框组件 -->
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <form @submit.prevent="$emit('submit')">
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
          >
            {{ cancelText }}
          </button>
          <button type="submit" class="btn btn-primary">
            {{ submitText }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * 通用模态框组件
 * 替换视图中重复的模态框结构模板
 *
 * @prop {boolean} visible - 是否可见
 * @prop {string} title - 标题
 * @prop {string} submitText - 提交按钮文本
 * @prop {string} cancelText - 取消按钮文本
 * @emit close - 关闭事件
 * @emit submit - 表单提交事件
 * @slot default - 表单内容
 */
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '操作',
  },
  submitText: {
    type: String,
    default: '确定',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
})

defineEmits(['close', 'submit'])
</script>
