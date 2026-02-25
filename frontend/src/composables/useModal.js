/**
 * 模态框控制组合式函数
 * 封装模态框的显示隐藏和表单数据重置逻辑
 */
import { ref, reactive } from 'vue'

/**
 * @param {Object} initialFormData - 表单初始数据（用于创建 reactive 和重置）
 * @returns {Object} 模态框状态和方法
 */
export function useModal(initialFormData = {}) {
    /** 模态框可见状态 */
    const visible = ref(false)

    /** 表单数据 */
    const formData = reactive({ ...initialFormData })

    /** 打开模态框 */
    function open() {
        visible.value = true
    }

    /** 关闭模态框 */
    function close() {
        visible.value = false
    }

    /** 重置表单数据为初始值 */
    function resetForm() {
        Object.assign(formData, { ...initialFormData })
    }

    /** 关闭并重置 */
    function closeAndReset() {
        close()
        resetForm()
    }

    return {
        visible,
        formData,
        open,
        close,
        resetForm,
        closeAndReset,
    }
}
