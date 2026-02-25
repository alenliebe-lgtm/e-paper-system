<template>
    <div class="cockpit-view">
        <h2 class="page-title">管理者驾驶舱</h2>

        <!-- 加载状态 -->
        <AppLoading v-if="loading" />

        <template v-else>
            <!-- 预警概览卡片 -->
            <div class="alert-summary" v-if="data?.alertStats">
                <div class="alert-card">
                    <span class="alert-icon">🔔</span>
                    <div class="alert-info">
                        <span class="alert-count">{{ data.alertStats.unread }}</span>
                        <span class="alert-label">条未读预警</span>
                    </div>
                </div>
            </div>

            <!-- 图表区域 -->
            <div class="charts-grid">
                <!-- 项目状态分布（饼图） -->
                <div class="chart-card">
                    <h3 class="chart-title">项目状态分布</h3>
                    <div ref="projectPieRef" class="chart-container"></div>
                </div>

                <!-- 预算 vs 成本对比（柱状图） -->
                <div class="chart-card">
                    <h3 class="chart-title">预算 vs 成本对比</h3>
                    <div ref="budgetBarRef" class="chart-container"></div>
                </div>

                <!-- 工作流月度趋势（折线图） -->
                <div class="chart-card chart-card--full">
                    <h3 class="chart-title">工作流月度趋势</h3>
                    <div ref="workflowLineRef" class="chart-container"></div>
                </div>
            </div>

            <!-- 工作流概览 -->
            <div class="stats-grid" v-if="data?.workflowStats">
                <div class="stat-card">
                    <span class="stat-value">{{ data.workflowStats.total }}</span>
                    <span class="stat-label">总工作流</span>
                </div>
                <div class="stat-card stat-card--pending">
                    <span class="stat-value">{{ data.workflowStats.pending }}</span>
                    <span class="stat-label">待处理</span>
                </div>
                <div class="stat-card stat-card--approved">
                    <span class="stat-value">{{ data.workflowStats.approved }}</span>
                    <span class="stat-label">已通过</span>
                </div>
                <div class="stat-card stat-card--rejected">
                    <span class="stat-value">{{ data.workflowStats.rejected }}</span>
                    <span class="stat-label">已拒绝</span>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api/dashboard'
import AppLoading from '@/components/AppLoading.vue'

const loading = ref(true)
const data = ref(null)

// 图表 DOM 引用
const projectPieRef = ref(null)
const budgetBarRef = ref(null)
const workflowLineRef = ref(null)

// ECharts 实例
let projectPieChart = null
let budgetBarChart = null
let workflowLineChart = null

// 趋势数据
const trendData = ref([])

// 获取数据
async function fetchData() {
    try {
        loading.value = true
        const [cockpitRes, trendRes] = await Promise.all([
            dashboardApi.getCockpitData(),
            dashboardApi.getWorkflowTrend(),
        ])
        data.value = cockpitRes.data
        trendData.value = trendRes.data || []

        await nextTick()
        renderCharts()
    } catch (error) {
        console.error('获取驾驶舱数据失败:', error)
    } finally {
        loading.value = false
    }
}

// 渲染所有图表
function renderCharts() {
    renderProjectPie()
    renderBudgetBar()
    renderWorkflowLine()
}

// 项目状态饼图
function renderProjectPie() {
    if (!projectPieRef.value) return

    projectPieChart = echarts.init(projectPieRef.value)

    const distData = data.value?.projectDistribution || []
    const colorMap = {
        INIT: '#909399', REVIEW: '#E6A23C', EXECUTING: '#409EFF',
        CHANGE: '#F56C6C', ACCEPTANCE: '#67C23A', COMPLETED: '#0d9488', SUSPENDED: '#6c757d',
    }

    projectPieChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { color: '#a1a1aa' } },
        series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold' },
            },
            data: distData.map(d => ({
                value: d.count,
                name: d.label,
                itemStyle: { color: colorMap[d.status] || '#999' },
            })),
        }],
    })
}

// 预算 vs 成本柱状图
function renderBudgetBar() {
    if (!budgetBarRef.value) return

    budgetBarChart = echarts.init(budgetBarRef.value)

    const budgetData = data.value?.budgetVsCost || []

    budgetBarChart.setOption({
        tooltip: {
            trigger: 'axis',
            formatter: (params) => {
                const name = params[0].axisValue
                return params.map(p => `${p.seriesName}: ¥${p.value?.toLocaleString() || 0}`).join('<br/>')
            },
        },
        legend: { data: ['预算', '实际成本'], textStyle: { color: '#a1a1aa' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: budgetData.map(d => d.code),
            axisLabel: { rotate: 30, color: '#a1a1aa' },
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#a1a1aa',
                formatter: (v) => `¥${(v / 10000).toFixed(0)}万`,
            },
        },
        series: [
            {
                name: '预算',
                type: 'bar',
                data: budgetData.map(d => d.budget),
                itemStyle: { color: '#409EFF' },
            },
            {
                name: '实际成本',
                type: 'bar',
                data: budgetData.map(d => d.cost),
                itemStyle: { color: '#E6A23C' },
            },
        ],
    })
}

// 工作流趋势折线图
function renderWorkflowLine() {
    if (!workflowLineRef.value) return

    workflowLineChart = echarts.init(workflowLineRef.value)

    const trend = trendData.value

    workflowLineChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['总数', '已通过', '已拒绝', '待处理'], textStyle: { color: '#a1a1aa' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: trend.map(t => t.month),
            axisLabel: { color: '#a1a1aa' },
        },
        yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' } },
        series: [
            { name: '总数', type: 'line', data: trend.map(t => t.total), smooth: true, itemStyle: { color: '#409EFF' } },
            { name: '已通过', type: 'line', data: trend.map(t => t.approved), smooth: true, itemStyle: { color: '#67C23A' } },
            { name: '已拒绝', type: 'line', data: trend.map(t => t.rejected), smooth: true, itemStyle: { color: '#F56C6C' } },
            { name: '待处理', type: 'line', data: trend.map(t => t.pending), smooth: true, itemStyle: { color: '#E6A23C' } },
        ],
    })
}

// 窗口缩放自适应
function handleResize() {
    projectPieChart?.resize()
    budgetBarChart?.resize()
    workflowLineChart?.resize()
}

onMounted(() => {
    fetchData()
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    projectPieChart?.dispose()
    budgetBarChart?.dispose()
    workflowLineChart?.dispose()
})
</script>

<style scoped>
.cockpit-view {
    padding: 24px;
}

.page-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--text-primary);
}

.alert-summary {
    margin-bottom: 24px;
}

.alert-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(135deg, #fef3cd, #fce4a8);
    border-radius: 12px;
    border-left: 4px solid #E6A23C;
}

.alert-icon {
    font-size: 24px;
}

.alert-info {
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.alert-count {
    font-size: 28px;
    font-weight: 700;
    color: #d97706;
}

.alert-label {
    color: #92400e;
    font-size: 14px;
}

.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
}

.chart-card {
    background: var(--bg-card, #fff);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.chart-card--full {
    grid-column: 1 / -1;
}

.chart-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
}

.chart-container {
    width: 100%;
    height: 300px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: var(--bg-card, #fff);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
}

.stat-label {
    font-size: 13px;
    color: var(--text-secondary, #666);
    margin-top: 4px;
}

.stat-card--pending .stat-value { color: #E6A23C; }
.stat-card--approved .stat-value { color: #67C23A; }
.stat-card--rejected .stat-value { color: #F56C6C; }

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
