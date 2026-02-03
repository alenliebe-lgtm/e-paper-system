'use client';

import { useState, useEffect } from 'react';
import { templateApi } from '@/lib/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const fetchTemplates = async (page = 1) => {
        setLoading(true);
        try {
            const response = await templateApi.getList({ page, pageSize: 10 });
            setTemplates(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('获取模板列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const typeMap = {
        ONBOARD: '入职流程',
        OFFBOARD: '离职流程',
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">模板配置</h1>
                <button className="btn btn-primary">
                    + 新建模板
                </button>
            </div>

            <div className="card">
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : templates.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">⚙️</div>
                        <div className="empty-state-title">暂无模板</div>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>模板名称</th>
                                        <th>类型</th>
                                        <th>版本</th>
                                        <th>状态</th>
                                        <th>更新时间</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map((tpl) => (
                                        <tr key={tpl.id}>
                                            <td>{tpl.name}</td>
                                            <td>{typeMap[tpl.type]}</td>
                                            <td>v{tpl.version}</td>
                                            <td>
                                                <span className={`badge badge-${tpl.isActive ? 'success' : 'error'}`}>
                                                    {tpl.isActive ? '启用' : '停用'}
                                                </span>
                                            </td>
                                            <td>{new Date(tpl.updatedAt).toLocaleDateString('zh-CN')}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }}>
                                                    编辑
                                                </button>
                                                <button className="btn btn-secondary btn-sm">
                                                    查看
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
                                onClick={() => fetchTemplates(pagination.page - 1)}
                            >
                                上一页
                            </button>
                            <span className="pagination-info">
                                第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => fetchTemplates(pagination.page + 1)}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
