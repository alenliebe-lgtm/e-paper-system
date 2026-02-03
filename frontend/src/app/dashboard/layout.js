'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const navItems = [
        { path: '/dashboard', label: '仪表盘', icon: '📊' },
        { path: '/dashboard/employees', label: '员工管理', icon: '👥' },
        { path: '/dashboard/projects', label: '项目管理', icon: '📁' },
        { path: '/dashboard/workflows', label: '审批流程', icon: '📋' },
        { path: '/dashboard/templates', label: '模板配置', icon: '⚙️' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* 侧边栏 */}
            <aside className="sidebar">
                <div className="sidebar-logo">E-Paper</div>

                <nav>
                    <ul className="sidebar-nav">
                        {navItems.map((item) => (
                            <li key={item.path} className="sidebar-nav-item">
                                <Link
                                    href={item.path}
                                    className={`sidebar-nav-link ${pathname === item.path ? 'active' : ''}`}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* 用户信息 */}
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '24px',
                    right: '24px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-300)' }}>当前用户</div>
                    <div style={{ fontWeight: '500', marginBottom: '8px' }}>{user?.username || '未登录'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginBottom: '12px' }}>
                        角色：{user?.role || '-'}
                    </div>
                    <button
                        onClick={logout}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%' }}
                    >
                        退出登录
                    </button>
                </div>
            </aside>

            {/* 主内容区 */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
