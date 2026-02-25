<template>
    <div class="alerts-view">
        <div class="page-header">
            <h2 class="page-title">
                预警中心
                <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
            </h2>
            <button class="btn btn-outline" @click="handleMarkAllRead" :disabled="unreadCount === 0">
                ✓ 全部已读
            </button>
        </div>

        <AppLoading v-if="loading" />
        <AppEmpty v-else-if="alerts.length === 0" message="暂无预警通知" />

        <div v-else class="alert-list">
            <div v-for="alert in alerts" :key="alert.id" class="alert-item"
                :class="{ 'alert-item--unread': !alert.isRead, [`alert-type--${alert.type}`]: true }"
                @click="handleMarkRead(alert)">
                <div class="alert-icon">
                    {{ typeIcons[alert.type] || '⚠️' }}
                </div>
                <div class="alert-content">
                    <div class="alert-header">
                        <span class="alert-title">{{ alert.title }}</span>
                        <span class="alert-time">{{ formatTime(alert.createdAt) }}</span>
                    </div>
                    <p class="alert-message">{{ alert.message }}</p>
                    <span class="alert-type-badge">{{ typeLabels[alert.type] || alert.type }}</span>
                </div>
                <div v-if="!alert.isRead" class="unread-dot"></div>
            </div>
        </div>

        <AppPagination
            v-if="pagination.total > 0"
            :page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            @update:page="handlePageChange"
        />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { alertApi } from '@/api/alert'
import AppLoading from '@/components/AppLoading.vue'
import AppEmpty from '@/components/AppEmpty.vue'
import AppPagination from '@/components/AppPagination.vue'

const loading = ref(true)
const alerts = ref([])
const unreadCount = ref(0)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const typeIcons = {
    MILESTONE_OVERDUE: '⏰',
    CONTRACT_EXPIRY: '📄',
    LOW_STOCK: '📦',
    APPROVAL_TIMEOUT: '⌛',
}

const typeLabels = {
    MILESTONE_OVERDUE: '里程碑逾期',
    CONTRACT_EXPIRY: '合同到期',
    LOW_STOCK: '库存不足',
    APPROVAL_TIMEOUT: '审批超时',
}

function formatTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString('zh-CN')
}

async function fetchAlerts() {
    try {
        loading.value = true
        const [listRes, countRes] = await Promise.all([
            alertApi.getList({ page: pagination.page, pageSize: pagination.pageSize }),
            alertApi.getUnreadCount(),
        ])
        alerts.value = listRes.data || []
        Object.assign(pagination, listRes.pagination || {})
        unreadCount.value = countRes.data?.count || 0
    } catch (error) {
        console.error('获取预警列表失败:', error)
    } finally {
        loading.value = false
    }
}

async function handleMarkRead(alert) {
    if (alert.isRead) return
    try {
        await alertApi.markAsRead(alert.id)
        alert.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
        console.error('标记已读失败:', error)
    }
}

async function handleMarkAllRead() {
    try {
        await alertApi.markAllAsRead()
        alerts.value.forEach(a => { a.isRead = true })
        unreadCount.value = 0
    } catch (error) {
        console.error('全部标记已读失败:', error)
    }
}

function handlePageChange(page) {
    pagination.page = page
    fetchAlerts()
}

onMounted(fetchAlerts)
</script>

<style scoped>
.alerts-view { padding: 24px; }

.page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
}

.page-title {
    font-size: 22px; font-weight: 700; color: var(--text-primary);
    display: flex; align-items: center; gap: 8px;
}

.unread-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 22px; height: 22px; padding: 0 6px;
    background: #F56C6C; color: #fff; border-radius: 12px;
    font-size: 12px; font-weight: 600;
}

.btn {
    padding: 8px 18px; border-radius: 8px; font-size: 14px; cursor: pointer; border: none;
}

.btn-outline {
    background: transparent; border: 1px solid #dcdfe6; color: var(--text-primary);
}

.btn-outline:hover { border-color: #409EFF; color: #409EFF; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

.alert-list { display: flex; flex-direction: column; gap: 10px; }

.alert-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 20px; background: var(--bg-card, #fff);
    border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    cursor: pointer; transition: all 0.2s; position: relative;
}

.alert-item:hover { box-shadow: 0 3px 10px rgba(0,0,0,0.1); }

.alert-item--unread { border-left: 3px solid #409EFF; background: #f0f7ff; }

.alert-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }

.alert-content { flex: 1; min-width: 0; }

.alert-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
}

.alert-title { font-weight: 600; font-size: 15px; color: var(--text-primary); }
.alert-time { font-size: 12px; color: var(--text-secondary, #999); }

.alert-message {
    font-size: 14px; color: var(--text-secondary, #666);
    line-height: 1.5; margin-bottom: 8px;
}

.alert-type-badge {
    display: inline-block; padding: 2px 10px; border-radius: 10px;
    font-size: 11px; font-weight: 500;
}

.alert-type--MILESTONE_OVERDUE .alert-type-badge { background: #fef0f0; color: #F56C6C; }
.alert-type--CONTRACT_EXPIRY .alert-type-badge { background: #fdf6ec; color: #E6A23C; }
.alert-type--LOW_STOCK .alert-type-badge { background: #ecf5ff; color: #409EFF; }
.alert-type--APPROVAL_TIMEOUT .alert-type-badge { background: #f4f4f5; color: #909399; }

.unread-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #409EFF;
    flex-shrink: 0; margin-top: 8px;
}
</style>
