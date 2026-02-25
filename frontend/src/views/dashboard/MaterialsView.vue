<template>
    <div class="materials-view">
        <div class="page-header">
            <h2 class="page-title">物料管理</h2>
            <div class="header-actions">
                <button class="btn btn-outline" @click="showTransactionModal = true">📦 出入库</button>
                <button class="btn btn-primary" @click="showCreateModal = true">+ 新增物料</button>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
            <input v-model="searchQuery" type="text" placeholder="搜索物料名称或编码..." class="search-input"
                @input="debouncedSearch" />
            <select v-model="selectedCategory" class="filter-select" @change="fetchMaterials">
                <option value="">全部分类</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
        </div>

        <!-- 库存统计 -->
        <div class="stats-bar" v-if="stats">
            <div class="stat-item">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">物料总数</span>
            </div>
            <div class="stat-item stat-item--warn">
                <span class="stat-value">{{ stats.lowStock }}</span>
                <span class="stat-label">低库存预警</span>
            </div>
        </div>

        <!-- 列表 -->
        <AppLoading v-if="loading" />
        <AppEmpty v-else-if="materials.length === 0" message="暂无物料数据" />
        <div v-else class="material-table-wrapper">
            <table class="material-table">
                <thead>
                    <tr>
                        <th>编码</th>
                        <th>名称</th>
                        <th>分类</th>
                        <th>库存</th>
                        <th>最低库存</th>
                        <th>单位</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in materials" :key="item.id"
                        :class="{ 'low-stock': item.stock <= item.minStock && item.minStock > 0 }">
                        <td class="code-cell">{{ item.code }}</td>
                        <td>{{ item.name }}</td>
                        <td><span class="category-tag">{{ item.category }}</span></td>
                        <td class="stock-cell">
                            <span :class="{ 'stock-warn': item.stock <= item.minStock && item.minStock > 0 }">
                                {{ item.stock }}
                            </span>
                        </td>
                        <td>{{ item.minStock }}</td>
                        <td>{{ item.unit }}</td>
                        <td>
                            <button class="btn-link" @click="editMaterial(item)">编辑</button>
                            <button class="btn-link btn-link--danger" @click="handleDelete(item)">删除</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <AppPagination v-if="pagination.total > 0" :page="pagination.page" :page-size="pagination.pageSize"
            :total="pagination.total" @update:page="handlePageChange" />

        <!-- 新增/编辑物料弹窗 -->
        <AppModal :visible="showCreateModal || !!editingMaterial" :title="editingMaterial ? '编辑物料' : '新增物料'"
            @close="closeFormModal" @confirm="handleSubmit">
            <form class="material-form" @submit.prevent>
                <div class="form-group">
                    <label>物料编码 <span class="required">*</span></label>
                    <input v-model="formData.code" type="text" placeholder="如 MAT-XXX-001" required />
                </div>
                <div class="form-group">
                    <label>物料名称 <span class="required">*</span></label>
                    <input v-model="formData.name" type="text" placeholder="输入物料名称" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>分类</label>
                        <input v-model="formData.category" type="text" placeholder="如 电子纸屏" />
                    </div>
                    <div class="form-group">
                        <label>单位</label>
                        <input v-model="formData.unit" type="text" placeholder="如 片、块" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>初始库存</label>
                        <input v-model.number="formData.stock" type="number" min="0" />
                    </div>
                    <div class="form-group">
                        <label>最低库存线</label>
                        <input v-model.number="formData.minStock" type="number" min="0" />
                    </div>
                </div>
                <div class="form-group">
                    <label>描述</label>
                    <textarea v-model="formData.description" rows="3" placeholder="物料描述..."></textarea>
                </div>
            </form>
        </AppModal>

        <!-- 出入库弹窗 -->
        <AppModal :visible="showTransactionModal" title="出入库操作" @close="showTransactionModal = false"
            @confirm="handleTransaction">
            <form class="material-form" @submit.prevent>
                <div class="form-group">
                    <label>物料 <span class="required">*</span></label>
                    <select v-model="transactionData.materialId" required>
                        <option value="">请选择物料</option>
                        <option v-for="item in allMaterials" :key="item.id" :value="item.id">
                            {{ item.name }} ({{ item.code }}) - 库存: {{ item.stock }}
                        </option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>操作类型 <span class="required">*</span></label>
                        <select v-model="transactionData.type" required>
                            <option value="IN">入库</option>
                            <option value="OUT">出库</option>
                            <option value="RETURN">归还</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>数量 <span class="required">*</span></label>
                        <input v-model.number="transactionData.quantity" type="number" min="1" required />
                    </div>
                </div>
                <div class="form-group">
                    <label>备注</label>
                    <input v-model="transactionData.remark" type="text" placeholder="操作原因说明" />
                </div>
            </form>
        </AppModal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { materialApi } from '@/api/material'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppModal from '@/components/AppModal.vue'

const loading = ref(true)
const materials = ref([])
const allMaterials = ref([])
const categories = ref([])
const stats = ref(null)
const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

const searchQuery = ref('')
const selectedCategory = ref('')

const showCreateModal = ref(false)
const showTransactionModal = ref(false)
const editingMaterial = ref(null)

const formData = reactive({
    code: '', name: '', category: '', unit: '', stock: 0, minStock: 0, description: '',
})

const transactionData = reactive({
    materialId: '', type: 'OUT', quantity: 1, remark: '',
})

// 获取物料列表
async function fetchMaterials() {
    try {
        loading.value = true
        const res = await materialApi.getList({
            page: pagination.page,
            pageSize: pagination.pageSize,
            search: searchQuery.value || undefined,
            category: selectedCategory.value || undefined,
        })
        materials.value = res.data || []
        Object.assign(pagination, res.pagination || {})
    } catch (error) {
        console.error('获取物料列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 获取辅助数据
async function fetchMetadata() {
    try {
        const [catRes, statsRes, allRes] = await Promise.all([
            materialApi.getCategories(),
            materialApi.getStockStats(),
            materialApi.getList({ pageSize: 999 }),
        ])
        categories.value = catRes.data || []
        stats.value = statsRes.data || null
        allMaterials.value = allRes.data || []
    } catch (err) {
        console.error('获取辅助数据失败:', err)
    }
}

// 防抖搜索
let searchTimer = null
function debouncedSearch() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        pagination.page = 1
        fetchMaterials()
    }, 300)
}

function handlePageChange(page) {
    pagination.page = page
    fetchMaterials()
}

// 新增/编辑提交
async function handleSubmit() {
    try {
        if (editingMaterial.value) {
            await materialApi.update(editingMaterial.value.id, { ...formData })
        } else {
            await materialApi.create({ ...formData })
        }
        closeFormModal()
        fetchMaterials()
        fetchMetadata()
    } catch (error) {
        alert(error.response?.data?.message || '操作失败')
    }
}

function editMaterial(item) {
    editingMaterial.value = item
    Object.assign(formData, {
        code: item.code, name: item.name, category: item.category,
        unit: item.unit, stock: item.stock, minStock: item.minStock,
        description: item.description || '',
    })
}

function closeFormModal() {
    showCreateModal.value = false
    editingMaterial.value = null
    Object.assign(formData, { code: '', name: '', category: '', unit: '', stock: 0, minStock: 0, description: '' })
}

// 删除
async function handleDelete(item) {
    if (!confirm(`确定删除物料「${item.name}」？`)) return
    try {
        await materialApi.delete(item.id)
        fetchMaterials()
        fetchMetadata()
    } catch (error) {
        alert(error.response?.data?.message || '删除失败')
    }
}

// 出入库
async function handleTransaction() {
    try {
        await materialApi.recordTransaction({ ...transactionData, materialId: parseInt(transactionData.materialId) })
        showTransactionModal.value = false
        Object.assign(transactionData, { materialId: '', type: 'OUT', quantity: 1, remark: '' })
        fetchMaterials()
        fetchMetadata()
    } catch (error) {
        alert(error.response?.data?.message || '操作失败')
    }
}

onMounted(() => {
    fetchMaterials()
    fetchMetadata()
})
</script>

<style scoped>
.materials-view { padding: 24px; }

.page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}

.page-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }

.header-actions { display: flex; gap: 10px; }

.btn {
    padding: 8px 18px; border-radius: 8px; font-size: 14px; cursor: pointer;
    border: none; transition: all 0.2s;
}

.btn-primary { background: #409EFF; color: #fff; }
.btn-primary:hover { background: #3a8ee6; }
.btn-outline { background: transparent; border: 1px solid #dcdfe6; color: var(--text-primary); }
.btn-outline:hover { border-color: #409EFF; color: #409EFF; }

.filter-bar { display: flex; gap: 12px; margin-bottom: 16px; }

.search-input, .filter-select {
    padding: 8px 14px; border: 1px solid #dcdfe6; border-radius: 8px;
    font-size: 14px; outline: none; transition: border-color 0.2s;
}

.search-input { flex: 1; }
.search-input:focus, .filter-select:focus { border-color: #409EFF; }

.stats-bar {
    display: flex; gap: 20px; margin-bottom: 20px;
    padding: 16px 24px; background: var(--bg-card, #fff);
    border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 12px; color: var(--text-secondary, #888); margin-top: 2px; }
.stat-item--warn .stat-value { color: #F56C6C; }

.material-table-wrapper { overflow-x: auto; }

.material-table {
    width: 100%; border-collapse: collapse;
    background: var(--bg-card, #fff); border-radius: 12px; overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.material-table th {
    text-align: left; padding: 12px 16px; background: #f5f7fa;
    font-size: 13px; color: #606266; font-weight: 600;
}

.material-table td { padding: 12px 16px; font-size: 14px; border-top: 1px solid #ebeef5; }

.material-table tr.low-stock { background: #fef0f0; }

.code-cell { font-family: monospace; color: #409EFF; font-size: 13px; }

.category-tag {
    display: inline-block; padding: 2px 10px; border-radius: 10px;
    background: #ecf5ff; color: #409EFF; font-size: 12px;
}

.stock-warn { color: #F56C6C; font-weight: 700; }

.btn-link {
    background: none; border: none; color: #409EFF; cursor: pointer;
    font-size: 13px; padding: 2px 6px;
}

.btn-link--danger { color: #F56C6C; }
.btn-link:hover { text-decoration: underline; }

.material-form { display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 13px; font-weight: 500; color: var(--text-primary); }

.form-group input, .form-group select, .form-group textarea {
    padding: 8px 12px; border: 1px solid #dcdfe6; border-radius: 6px;
    font-size: 14px; outline: none;
}

.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    border-color: #409EFF;
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.required { color: #F56C6C; }
</style>
