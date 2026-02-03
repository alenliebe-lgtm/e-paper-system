'use client';

import { useState, useEffect } from 'react';
import { employeeApi } from '@/lib/api';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        department: '',
        position: '',
        entryDate: '',
        phone: '',
    });

    const fetchEmployees = async (page = 1) => {
        setLoading(true);
        try {
            const response = await employeeApi.getList({ page, pageSize: 10 });
            setEmployees(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('获取员工列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await employeeApi.create(formData);
            setShowModal(false);
            setFormData({ fullName: '', department: '', position: '', entryDate: '', phone: '' });
            fetchEmployees();
        } catch (error) {
            alert('创建员工失败: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('确定要删除该员工吗？')) return;
        try {
            await employeeApi.delete(id);
            fetchEmployees();
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">员工管理</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + 添加员工
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : employees.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <div className="empty-state-title">暂无员工数据</div>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>姓名</th>
                                        <th>部门</th>
                                        <th>职位</th>
                                        <th>入职日期</th>
                                        <th>联系电话</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td>{emp.fullName}</td>
                                            <td>{emp.department}</td>
                                            <td>{emp.position}</td>
                                            <td>{new Date(emp.entryDate).toLocaleDateString('zh-CN')}</td>
                                            <td>{emp.phone || '-'}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }}>
                                                    编辑
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(emp.id)}>
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
                                onClick={() => fetchEmployees(pagination.page - 1)}
                            >
                                上一页
                            </button>
                            <span className="pagination-info">
                                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchEmployees(pagination.page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 添加员工模态框 */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">添加员工</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">姓名</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">部门</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">职位</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">入职日期</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.entryDate}
                                        onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">联系电话</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    取消
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    确定
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
