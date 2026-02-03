'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { projectApi, workflowApi } from '@/lib/api';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        projects: { total: 0, active: 0 },
        workflows: { total: 0, pending: 0 },
        todos: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [projectStats, workflowStats, todoList] = await Promise.all([
                    projectApi.getStats(),
                    workflowApi.getStats(),
                    workflowApi.getTodoList(),
                ]);

                setStats({
                    projects: projectStats.data,
                    workflows: workflowStats.data,
                    todos: todoList.data || [],
                });
            } catch (error) {
                console.error('获取统计数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">欢迎回来，{user?.username}</h1>
            </div>

            {/* 统计卡片 */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">📁</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.projects.total}</div>
                        <div className="stat-label">项目总数</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon success">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.projects.active}</div>
                        <div className="stat-label">进行中项目</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning">📋</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.workflows.pending}</div>
                        <div className="stat-label">待审批流程</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon info">📊</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.workflows.total}</div>
                        <div className="stat-label">流程总数</div>
                    </div>
                </div>
            </div>

            {/* 待办事项 */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">我的待办</h2>
                </div>

                {stats.todos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✨</div>
                        <div className="empty-state-title">暂无待办事项</div>
                        <p>当前没有需要您处理的审批流程</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>流程类型</th>
                                    <th>模板</th>
                                    <th>申请人</th>
                                    <th>关联项目</th>
                                    <th>创建时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.todos.map((todo) => (
                                    <tr key={todo.nodeId}>
                                        <td>
                                            <span className={`badge badge-${todo.type === 'ONBOARD' ? 'success' : 'warning'}`}>
                                                {todo.type === 'ONBOARD' ? '入职' : '离职'}
                                            </span>
                                        </td>
                                        <td>{todo.template}</td>
                                        <td>{todo.applicant}</td>
                                        <td>{todo.project || '-'}</td>
                                        <td>{new Date(todo.createdAt).toLocaleDateString('zh-CN')}</td>
                                        <td>
                                            <a href={`/dashboard/workflows/${todo.workflowId}`} className="btn btn-primary btn-sm">
                                                处理
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
