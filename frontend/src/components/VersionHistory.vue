<template>
    <div class="version-history">
        <div class="version-header" @click="expanded = !expanded">
            <h4 class="version-title">📋 版本历史</h4>
            <span class="toggle-icon">{{ expanded ? '▲' : '▼' }}</span>
        </div>

        <div v-if="expanded" class="version-body">
            <AppLoading v-if="loading" />
            <div v-else-if="versions.length === 0" class="version-empty">暂无版本记录</div>
            <div v-else class="version-timeline">
                <div v-for="v in versions" :key="v.id" class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="version-label">v{{ v.version }}</span>
                            <span class="version-time">{{ formatTime(v.createdAt) }}</span>
                        </div>
                        <p class="version-desc">{{ v.title }}</p>
                        <span class="version-operator">
                            {{ v.operator?.profile?.fullName || v.operator?.username || '未知' }}
                        </span>
                        <div v-if="v.diff" class="version-diff" @click="toggleDiff(v.id)">
                            <span class="diff-toggle">{{ expandedDiffs[v.id] ? '收起差异' : '查看差异' }}</span>
                            <div v-if="expandedDiffs[v.id]" class="diff-content">
                                <div v-if="Object.keys(v.diff.changed || {}).length" class="diff-section">
                                    <span class="diff-label diff-label--changed">修改</span>
                                    <div v-for="(val, key) in v.diff.changed" :key="key" class="diff-item">
                                        <code>{{ key }}</code>:
                                        <span class="diff-from">{{ formatVal(val.from) }}</span> →
                                        <span class="diff-to">{{ formatVal(val.to) }}</span>
                                    </div>
                                </div>
                                <div v-if="Object.keys(v.diff.added || {}).length" class="diff-section">
                                    <span class="diff-label diff-label--added">新增</span>
                                    <div v-for="(val, key) in v.diff.added" :key="key" class="diff-item">
                                        <code>{{ key }}</code>: <span class="diff-to">{{ formatVal(val) }}</span>
                                    </div>
                                </div>
                                <div v-if="Object.keys(v.diff.removed || {}).length" class="diff-section">
                                    <span class="diff-label diff-label--removed">删除</span>
                                    <div v-for="(val, key) in v.diff.removed" :key="key" class="diff-item">
                                        <code>{{ key }}</code>: <span class="diff-from">{{ formatVal(val) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { versionApi } from '@/api/version'
import AppLoading from '@/components/AppLoading.vue'

const props = defineProps({
    entityType: { type: String, required: true },
    entityId: { type: [Number, String], required: true },
})

const loading = ref(false)
const expanded = ref(false)
const versions = ref([])
const expandedDiffs = reactive({})

async function fetchVersions() {
    try {
        loading.value = true
        const res = await versionApi.getVersions(props.entityType, props.entityId)
        versions.value = res.data || []
    } catch (error) {
        console.error('获取版本历史失败:', error)
    } finally {
        loading.value = false
    }
}

function toggleDiff(id) {
    expandedDiffs[id] = !expandedDiffs[id]
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN')
}

function formatVal(val) {
    if (val === null || val === undefined) return '空'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
}

onMounted(() => {
    // 首次展开时加载
    const stopWatch = ref(null)
    import('vue').then(({ watch }) => {
        stopWatch.value = watch(expanded, (val) => {
            if (val && versions.value.length === 0) {
                fetchVersions()
            }
        })
    })
})
</script>

<style scoped>
.version-history {
    border: 1px solid #ebeef5;
    border-radius: 10px;
    overflow: hidden;
    margin-top: 16px;
}

.version-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 16px; background: #f5f7fa; cursor: pointer;
    user-select: none;
}

.version-title { font-size: 14px; font-weight: 600; margin: 0; }
.toggle-icon { color: #909399; font-size: 12px; }

.version-body { padding: 16px; }
.version-empty { text-align: center; color: #909399; font-size: 14px; padding: 20px 0; }

.version-timeline { position: relative; padding-left: 24px; }

.timeline-item {
    position: relative; padding-bottom: 20px;
    border-left: 2px solid #dcdfe6;
    padding-left: 20px;
}

.timeline-item:last-child { border-left-color: transparent; }

.timeline-dot {
    position: absolute; left: -7px; top: 4px;
    width: 12px; height: 12px; border-radius: 50%;
    background: #409EFF; border: 2px solid #fff;
    box-shadow: 0 0 0 2px #409EFF;
}

.timeline-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }

.version-label {
    font-size: 12px; font-weight: 600; padding: 1px 8px;
    background: #ecf5ff; color: #409EFF; border-radius: 10px;
}

.version-time { font-size: 12px; color: #909399; }
.version-desc { font-size: 14px; margin: 4px 0; color: var(--text-primary); }
.version-operator { font-size: 12px; color: #909399; }

.version-diff { margin-top: 8px; }
.diff-toggle {
    color: #409EFF; font-size: 12px; cursor: pointer;
}
.diff-toggle:hover { text-decoration: underline; }

.diff-content {
    margin-top: 8px; padding: 10px;
    background: #fafafa; border-radius: 6px; font-size: 13px;
}

.diff-section { margin-bottom: 8px; }
.diff-label {
    display: inline-block; font-size: 11px; padding: 1px 6px;
    border-radius: 4px; margin-bottom: 4px; font-weight: 600;
}
.diff-label--changed { background: #fdf6ec; color: #E6A23C; }
.diff-label--added { background: #f0f9eb; color: #67C23A; }
.diff-label--removed { background: #fef0f0; color: #F56C6C; }

.diff-item { padding: 2px 0; }
.diff-item code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
.diff-from { color: #F56C6C; text-decoration: line-through; }
.diff-to { color: #67C23A; }
</style>
