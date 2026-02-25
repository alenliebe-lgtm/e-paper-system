/**
 * 报表导出服务
 * 使用 exceljs 生成 Excel 报告
 */

const ExcelJS = require('exceljs');
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

/**
 * 导出项目全生命周期 Excel 报告
 * @param {number} projectId - 项目 ID
 * @returns {Buffer} Excel 文件 Buffer
 */
async function exportProjectReport(projectId) {
    const id = parseInt(projectId, 10);

    // 获取项目完整信息
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            pm: {
                select: {
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
            workflows: {
                include: {
                    template: { select: { name: true } },
                    applicant: {
                        select: {
                            username: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    approvalNodes: {
                        orderBy: { stepOrder: 'asc' },
                        include: {
                            approver: {
                                select: {
                                    username: true,
                                    profile: { select: { fullName: true } },
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            milestones: {
                orderBy: { dueDate: 'asc' },
            },
            materialRecords: {
                include: {
                    material: { select: { name: true, code: true, unit: true } },
                    operator: {
                        select: {
                            username: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
        },
    });

    if (!project) {
        throw new AppError('项目不存在', 404, 'PROJECT_NOT_FOUND');
    }

    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Paper 管理系统';
    workbook.created = new Date();

    // 状态标签映射
    const statusLabels = {
        INIT: '立项', REVIEW: '审核中', EXECUTING: '执行中',
        CHANGE: '变更中', ACCEPTANCE: '验收中', COMPLETED: '已完成', SUSPENDED: '已暂停',
    };
    const workflowStatusLabels = {
        PENDING: '待处理', APPROVED: '已通过', REJECTED: '已拒绝', CANCELLED: '已取消',
    };
    const materialActionLabels = { IN: '入库', OUT: '出库', RETURN: '归还' };

    // ========== Sheet 1: 项目概况 ==========
    const infoSheet = workbook.addWorksheet('项目概况');
    infoSheet.columns = [
        { header: '项目信息', key: 'label', width: 20 },
        { header: '详情', key: 'value', width: 40 },
    ];

    // 标题样式
    infoSheet.getRow(1).font = { bold: true, size: 12 };
    infoSheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
    };
    infoSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const pmName = project.pm.profile?.fullName || project.pm.username;
    infoSheet.addRows([
        { label: '项目编码', value: project.code },
        { label: '项目名称', value: project.projectName },
        { label: '项目描述', value: project.description || '-' },
        { label: '项目经理', value: pmName },
        { label: '开始日期', value: project.startDate.toLocaleDateString('zh-CN') },
        { label: '结束日期', value: project.endDate ? project.endDate.toLocaleDateString('zh-CN') : '未设定' },
        { label: '当前状态', value: statusLabels[project.status] || project.status },
        { label: '项目预算', value: project.budget ? `¥${Number(project.budget).toLocaleString()}` : '未设定' },
        { label: '已发生成本', value: project.cost ? `¥${Number(project.cost).toLocaleString()}` : '¥0' },
        { label: '创建时间', value: project.createdAt.toLocaleString('zh-CN') },
    ]);

    // ========== Sheet 2: 审批流程记录 ==========
    const workflowSheet = workbook.addWorksheet('审批流程');
    workflowSheet.columns = [
        { header: 'ID', key: 'id', width: 8 },
        { header: '流程类型', key: 'type', width: 15 },
        { header: '模板', key: 'template', width: 20 },
        { header: '申请人', key: 'applicant', width: 15 },
        { header: '状态', key: 'status', width: 12 },
        { header: '创建时间', key: 'createdAt', width: 20 },
        { header: '审批记录', key: 'approvals', width: 40 },
    ];

    workflowSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    workflowSheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
    };

    const typeLabels = {
        ONBOARD: '入职', OFFBOARD: '离职',
        PROJECT_APPROVAL: '项目审批', CHANGE_REQUEST: '变更', ACCEPTANCE: '验收',
    };

    for (const wf of project.workflows) {
        const approvalSummary = wf.approvalNodes
            .map(n => `${n.approver.profile?.fullName || n.approver.username}: ${workflowStatusLabels[n.status] || n.status}`)
            .join(' → ');

        workflowSheet.addRow({
            id: wf.id,
            type: typeLabels[wf.type] || wf.type,
            template: wf.template.name,
            applicant: wf.applicant.profile?.fullName || wf.applicant.username,
            status: workflowStatusLabels[wf.status] || wf.status,
            createdAt: wf.createdAt.toLocaleString('zh-CN'),
            approvals: approvalSummary,
        });
    }

    // ========== Sheet 3: 里程碑 ==========
    if (project.milestones.length > 0) {
        const milestoneSheet = workbook.addWorksheet('里程碑');
        milestoneSheet.columns = [
            { header: '里程碑名称', key: 'name', width: 25 },
            { header: '截止日期', key: 'dueDate', width: 15 },
            { header: '状态', key: 'status', width: 12 },
            { header: '完成时间', key: 'completedAt', width: 20 },
        ];

        milestoneSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        milestoneSheet.getRow(1).fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
        };

        for (const ms of project.milestones) {
            const isOverdue = !ms.completed && new Date() > ms.dueDate;
            const row = milestoneSheet.addRow({
                name: ms.name,
                dueDate: ms.dueDate.toLocaleDateString('zh-CN'),
                status: ms.completed ? '已完成' : (isOverdue ? '已逾期' : '进行中'),
                completedAt: ms.completedAt ? ms.completedAt.toLocaleString('zh-CN') : '-',
            });

            // 逾期用红色标记
            if (isOverdue) {
                row.getCell('status').font = { color: { argb: 'FFFF0000' }, bold: true };
            }
        }
    }

    // ========== Sheet 4: 物料领用记录 ==========
    if (project.materialRecords.length > 0) {
        const materialSheet = workbook.addWorksheet('物料领用');
        materialSheet.columns = [
            { header: '物料名称', key: 'materialName', width: 20 },
            { header: '物料编码', key: 'materialCode', width: 15 },
            { header: '操作类型', key: 'type', width: 12 },
            { header: '数量', key: 'quantity', width: 10 },
            { header: '单位', key: 'unit', width: 8 },
            { header: '操作人', key: 'operator', width: 15 },
            { header: '备注', key: 'remark', width: 20 },
            { header: '操作时间', key: 'createdAt', width: 20 },
        ];

        materialSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        materialSheet.getRow(1).fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
        };

        for (const rec of project.materialRecords) {
            materialSheet.addRow({
                materialName: rec.material.name,
                materialCode: rec.material.code,
                type: materialActionLabels[rec.type] || rec.type,
                quantity: rec.quantity,
                unit: rec.material.unit,
                operator: rec.operator.profile?.fullName || rec.operator.username,
                remark: rec.remark || '-',
                createdAt: rec.createdAt.toLocaleString('zh-CN'),
            });
        }
    }

    // 生成 Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    logger.info('ExportService', `导出项目报告: ${project.projectName} (${project.code})`);
    return { buffer, filename: `项目报告_${project.code}_${new Date().toISOString().slice(0, 10)}.xlsx` };
}

/**
 * 导出物料出入库报表
 * @param {Object} query - 查询条件
 * @returns {Buffer} Excel 文件 Buffer
 */
async function exportMaterialReport(query = {}) {
    const { category, startDate, endDate } = query;

    // 查询条件
    const where = {};
    if (category) where.material = { category };
    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const records = await prisma.materialRecord.findMany({
        where,
        include: {
            material: true,
            operator: {
                select: {
                    username: true,
                    profile: { select: { fullName: true } },
                },
            },
            project: { select: { projectName: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Paper 管理系统';

    const sheet = workbook.addWorksheet('物料出入库报表');
    sheet.columns = [
        { header: '物料名称', key: 'name', width: 20 },
        { header: '物料编码', key: 'code', width: 15 },
        { header: '分类', key: 'category', width: 12 },
        { header: '操作', key: 'type', width: 10 },
        { header: '数量', key: 'quantity', width: 10 },
        { header: '单位', key: 'unit', width: 8 },
        { header: '关联项目', key: 'project', width: 20 },
        { header: '操作人', key: 'operator', width: 15 },
        { header: '备注', key: 'remark', width: 20 },
        { header: '操作时间', key: 'createdAt', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' },
    };

    const actionLabels = { IN: '入库', OUT: '出库', RETURN: '归还' };

    for (const rec of records) {
        sheet.addRow({
            name: rec.material.name,
            code: rec.material.code,
            category: rec.material.category,
            type: actionLabels[rec.type] || rec.type,
            quantity: rec.quantity,
            unit: rec.material.unit,
            project: rec.project ? `${rec.project.projectName} (${rec.project.code})` : '-',
            operator: rec.operator.profile?.fullName || rec.operator.username,
            remark: rec.remark || '-',
            createdAt: rec.createdAt.toLocaleString('zh-CN'),
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    logger.info('ExportService', `导出物料报表，共 ${records.length} 条记录`);
    return { buffer, filename: `物料报表_${new Date().toISOString().slice(0, 10)}.xlsx` };
}

module.exports = {
    exportProjectReport,
    exportMaterialReport,
};
