/**
 * 列表页面通用组合式函数
 * 封装分页列表的加载、分页、删除等通用逻辑
 * 消除 EmployeesView / ProjectsView / WorkflowsView / TemplatesView 中的重复代码
 */
import { ref, reactive } from 'vue'

/**
 * @param {Function} apiFn - API 请求函数，接收 params 对象，返回 { data, pagination }
 * @param {Object} options - 可选配置
 * @param {number} options.pageSize - 每页条数，默认 10
 * @returns {Object} 列表页面状态和方法
 */
export function useListPage(apiFn, options = {}) {
    const { pageSize = 10 } = options

    /** 列表数据 */
    const list = ref([])

    /** 加载状态 */
    const loading = ref(true)

    /** 分页信息 */
    const pagination = reactive({
        page: 1,
        pageSize,
        totalPages: 1,
        total: 0,
    })

    /**
     * 加载列表数据
     * @param {number} page - 页码
     * @param {Object} extraParams - 额外查询参数
     */
    async function fetchList(page = 1, extraParams = {}) {
        loading.value = true
        try {
            const response = await apiFn({ page, pageSize, ...extraParams })
            list.value = response.data
            Object.assign(pagination, response.pagination)
        } catch (error) {
            console.error('获取列表数据失败:', error)
        } finally {
            loading.value = false
        }
    }

    /**
     * 通用删除操作
     * @param {number} id - 记录 ID
     * @param {Function} deleteApiFn - 删除 API 函数
     * @param {string} confirmMsg - 确认提示文本
     */
    async function handleDelete(id, deleteApiFn, confirmMsg = '确定要删除吗？') {
        if (!confirm(confirmMsg)) return
        try {
            await deleteApiFn(id)
            // 删除后刷新当前页
            fetchList(pagination.page)
        } catch (error) {
            alert('删除失败: ' + error.message)
        }
    }

    return {
        list,
        loading,
        pagination,
        fetchList,
        handleDelete,
    }
}
