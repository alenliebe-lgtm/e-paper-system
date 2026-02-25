/**
 * 模板服务层（重构后）
 * 使用通用分页和辅助函数消除重复代码
 */
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { paginate } = require('../utils/pagination.helper');
const { findOrFail } = require('../utils/service.helper');
const logger = require('../utils/logger');

/**
 * 获取模板列表（分页查询）
 */
async function getTemplates(query) {
    const { page = 1, pageSize = 10, type, isActive, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // 构建查询条件
    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
        where.name = { contains: search, mode: 'insensitive' };
    }

    return paginate('template', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
            creator: { select: { id: true, username: true } },
        },
    });
}

/**
 * 获取模板详情
 */
async function getTemplateById(id) {
    return findOrFail('template', parseInt(id, 10), {
        errorMsg: '模板不存在',
        errorCode: 'TEMPLATE_NOT_FOUND',
        include: {
            creator: { select: { id: true, username: true } },
        },
    });
}

/**
 * 创建模板
 */
async function createTemplate(data, userId) {
    const template = await prisma.template.create({
        data: {
            ...data,
            creatorId: userId,
            content: data.content || {},
        },
        include: {
            creator: { select: { id: true, username: true } },
        },
    });

    logger.info('TemplateService', `创建模板: ${template.name}`);
    return template;
}

/**
 * 更新模板
 */
async function updateTemplate(id, data) {
    const templateId = parseInt(id, 10);

    const existingTemplate = await findOrFail('template', templateId, {
        errorMsg: '模板不存在',
        errorCode: 'TEMPLATE_NOT_FOUND',
    });

    // 如果修改了模板内容，自动升级版本号
    const updateData = { ...data };
    if (data.content && JSON.stringify(data.content) !== JSON.stringify(existingTemplate.content)) {
        updateData.version = existingTemplate.version + 1;
    }

    const template = await prisma.template.update({
        where: { id: templateId },
        data: updateData,
        include: {
            creator: { select: { id: true, username: true } },
        },
    });

    logger.info('TemplateService', `更新模板: ${template.name} v${template.version}`);
    return template;
}

/**
 * 停用模板
 */
async function deactivateTemplate(id) {
    const templateId = parseInt(id, 10);

    await findOrFail('template', templateId, {
        errorMsg: '模板不存在',
        errorCode: 'TEMPLATE_NOT_FOUND',
    });

    const template = await prisma.template.update({
        where: { id: templateId },
        data: { isActive: false },
    });

    logger.info('TemplateService', `停用模板: ${template.name}`);
    return template;
}

/**
 * 启用模板
 */
async function activateTemplate(id) {
    const templateId = parseInt(id, 10);

    await findOrFail('template', templateId, {
        errorMsg: '模板不存在',
        errorCode: 'TEMPLATE_NOT_FOUND',
    });

    const template = await prisma.template.update({
        where: { id: templateId },
        data: { isActive: true },
    });

    logger.info('TemplateService', `启用模板: ${template.name}`);
    return template;
}

/**
 * 获取激活的模板列表（用于下拉选择）
 */
async function getActiveTemplates(type) {
    const where = { isActive: true };
    if (type) where.type = type;

    return prisma.template.findMany({
        where,
        select: {
            id: true,
            name: true,
            type: true,
            version: true,
        },
        orderBy: { name: 'asc' },
    });
}

module.exports = {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deactivateTemplate,
    activateTemplate,
    getActiveTemplates,
};
