'use client';

import { useState, useEffect } from 'react';
import { projectApi } from '@/lib/api';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        projectName: '',
        code: '',
        description: '',
        startDate: '',
        endDate: '',
        pmId: 1,
    });

    const fetchProjects = async (page = 1) => {
        setLoading(true);
        try {
            const response = await projectApi.getList({ page, pageSize: 10 });
            setProjects(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('获取项目列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await projectApi.create(formData);
            setShowModal(false);
            setFormData({ projectName: '', code: '', description: '', startDate: '', endDate: '', pmId: 1 });
            fetchProjects();
        } catch (error) {
            alert('创建项目失败: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定要删除该项目吗？')) return;
        try {
            await projectApi.delete(id);
            fetchProjects();
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    };

    const statusMap = {
        ACTIVE: { label: '进行中', class: 'success' },
        COMPLETED: { label: '已完成', class: 'info' },
        SUSPENDED: { label: '已暂停', class: 'warning' },
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">项目管理</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 新建项目
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : projects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-title">暂无项目数据</div>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>项目编码</th>
                                        <th>项目名称</th>
                                        <th>项目经理</th>
                                        <th>开始日期</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project) => (
                                        <tr key={project.id}>
                                            <td><code>{project.code}</code></td>
                                            <td>{project.projectName}</td>
                                            <td>{project.pm?.profile?.fullName || project.pm?.username || '-'}</td>
                                            <td>{new Date(project.startDate).toLocaleDateString('zh-CN')}</td>
                                            <td>
                                                <span className={`badge badge-${statusMap[project.status]?.class || 'info'}`}>
                                                    {statusMap[project.status]?.label || project.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }}>
                                                    编辑
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(project.id)}>
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === 1}
                                onClick={() => fetchProjects(pagination.page - 1)}
                            >
                                上一页
                            </button>
                            <span className="pagination-info">
                                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchProjects(pagination.page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 新建项目模态框 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">新建项目</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">项目编码</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="如：PRJ-2024-001"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">项目名称</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">项目描述</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">开始日期</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">结束日期</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    创建
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
