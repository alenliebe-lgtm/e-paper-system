'use client';

import { useState, useEffect } from 'react';
import { workflowApi, templateApi } from '@/lib/api';

export default function WorkflowsPage() {
    const [workflows, setWorkflows] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        templateId: '',
        type: 'ONBOARD',
        remark: '',
    });

    const fetchWorkflows = async (page = 1) => {
        setLoading(true);
        try {
            const response = await workflowApi.getList({ page, pageSize: 10 });
            setWorkflows(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('获取工作流列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await templateApi.getActive();
            setTemplates(response.data || []);
        } catch (error) {
            console.error('获取模板列表失败:', error);
        }
    };

    useEffect(() => {
        fetchWorkflows();
        fetchTemplates();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await workflowApi.create({
                ...formData,
                templateId: parseInt(formData.templateId, 10),
            });
            setShowModal(false);
            setFormData({ templateId: '', type: 'ONBOARD', remark: '' });
            fetchWorkflows();
        } catch (error) {
            alert('创建工作流失败: ' + error.message);
        }
    };

    const handleApprove = async (id) => {
        const comment = prompt('请输入审批意见（可选）：');
        try {
            await workflowApi.approve(id, { comment });
            fetchWorkflows();
        } catch (error) {
            alert('审批失败: ' + error.message);
        }
    };

    const handleReject = async (id) => {
        const comment = prompt('请输入拒绝原因：');
        if (!comment) return;
        try {
            await workflowApi.reject(id, { comment });
            fetchWorkflows();
        } catch (error) {
            alert('操作失败: ' + error.message);
        }
    };

    const statusMap = {
        PENDING: { label: '待处理', class: 'warning' },
        APPROVED: { label: '已通过', class: 'success' },
        REJECTED: { label: '已拒绝', class: 'error' },
        CANCELLED: { label: '已取消', class: 'info' },
    };

    const typeMap = {
        ONBOARD: '入职',
        OFFBOARD: '离职',
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">审批流程</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 发起申请
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : workflows.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">暂无审批流程</div>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>流程类型</th>
                                        <th>模板</th>
                                        <th>申请人</th>
                                        <th>当前步骤</th>
                                        <th>状态</th>
                                        <th>创建时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workflows.map((wf) => (
                                        <tr key={wf.id}>
                                            <td>
                                                <span className={`badge badge-${wf.type === 'ONBOARD' ? 'success' : 'warning'}`}>
                                                    {typeMap[wf.type]}
                                                </span>
                                            </td>
                                            <td>{wf.template?.name}</td>
                                            <td>{wf.applicant?.profile?.fullName || wf.applicant?.username}</td>
                                            <td>第 {wf.currentStep} 步</td>
                                            <td>
                                                <span className={`badge badge-${statusMap[wf.status]?.class}`}>
                                                    {statusMap[wf.status]?.label}
                                                </span>
                                            </td>
                                            <td>{new Date(wf.createdAt).toLocaleDateString('zh-CN')}</td>
                                            <td>
                                                {wf.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            style={{ marginRight: '8px' }}
                                                            onClick={() => handleApprove(wf.id)}
                                                        >
                                                            通过
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleReject(wf.id)}
                                                        >
                                                            拒绝
                                                        </button>
                                                    </>
                                                )}
                                                {wf.status !== 'PENDING' && (
                                                    <span style={{ color: 'var(--text-tertiary)' }}>-</span>
                                                )}
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
                                onClick={() => fetchWorkflows(pagination.page - 1)}
                            >
                                上一页
                            </button>
                            <span className="pagination-info">
                                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchWorkflows(pagination.page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 发起申请模态框 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">发起审批申请</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">流程类型</label>
                                    <select
                                        className="form-input"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="ONBOARD">入职申请</option>
                                        <option value="OFFBOARD">离职申请</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">选择模板</label>
                                    <select
                                        className="form-input"
                                        value={formData.templateId}
                                        onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                                        required
                                    >
                                        <option value="">请选择模板</option>
                                        {templates.filter(t => t.type === formData.type).map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">备注说明</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={formData.remark}
                                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                        placeholder="请输入备注（可选）"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    提交
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
