/**
 * Vue Router 路由配置
 * 替代 Next.js App Router 的文件系统路由
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由表配置
const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { guest: true }, // 仅游客可访问
    },
    {
        path: '/dashboard',
        component: () => import('@/layouts/DashboardLayout.vue'),
        meta: { requiresAuth: true }, // 需要登录
        children: [
            {
                path: '',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/DashboardView.vue'),
            },
            {
                path: 'employees',
                name: 'Employees',
                component: () => import('@/views/dashboard/EmployeesView.vue'),
            },
            {
                path: 'projects',
                name: 'Projects',
                component: () => import('@/views/dashboard/ProjectsView.vue'),
            },
            {
                path: 'workflows',
                name: 'Workflows',
                component: () => import('@/views/dashboard/WorkflowsView.vue'),
            },
            {
                path: 'templates',
                name: 'Templates',
                component: () => import('@/views/dashboard/TemplatesView.vue'),
            },
            {
                path: 'cockpit',
                name: 'Cockpit',
                component: () => import('@/views/dashboard/CockpitView.vue'),
                meta: { permission: 'dashboard:read' },
            },
            {
                path: 'materials',
                name: 'Materials',
                component: () => import('@/views/dashboard/MaterialsView.vue'),
                meta: { permission: 'material:read' },
            },
            {
                path: 'alerts',
                name: 'Alerts',
                component: () => import('@/views/dashboard/AlertsView.vue'),
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 首次加载时初始化认证状态
    if (authStore.loading) {
        await authStore.initAuth()
    }

    // 需要登录的页面
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        return next('/login')
    }

    // 已登录用户访问登录页，跳转仪表盘
    if (to.meta.guest && authStore.isAuthenticated) {
        return next('/dashboard')
    }

    next()
})

export default router
