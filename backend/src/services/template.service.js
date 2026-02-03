/**
 * 模板服务
 * 处理审批模板相关的业务逻辑
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 获取模板列表（分页）
 * @param {Object} options - 查询选项
 * @returns {Object} 分页结果
 */
async function getTemplates(options = {}) {
    const {
        page = 1,
        pageSize = 10,
        type,
        isActive,
        keyword,
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = options;

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where = {};

    if (type) {
        where.type = type;
    }

    if (isActive !== undefined) {
        where.isActive = isActive === 'true' || isActive === true;
    }

    if (keyword) {
        where.name = { contains: keyword, mode: 'insensitive' };
    }

    // 查询数据
    const [templates, total] = await Promise.all([
        prisma.template.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { [sortBy]: sortOrder },
        }),
        prisma.template.count({ where }),
    ]);

    return {
        data: templates,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

/**
 * 获取模板详情
 * @param {number} id - 模板 ID
 * @returns {Object} 模板信息
 */
async function getTemplateById(id) {
    const template = await prisma.template.findUnique({
        where: { id },
    });

    if (!template) {
        throw new AppError('模板不存在', 404, 'TEMPLATE_NOT_FOUND');
    }

    return template;
}

/**
 * 创建模板
 * @param {Object} data - 模板数据
 * @returns {Object} 创建的模板
 */
async function createTemplate(data) {
    const template = await prisma.template.create({
        data: {
            name: data.name,
            type: data.type,
            content: data.content,
            departmentId: data.departmentId,
            version: 1,
            isActive: true,
        },
    });

    return template;
}

/**
 * 更新模板
 * 采用版本控制，每次更新创建新版本
 * @param {number} id - 模板 ID
 * @param {Object} data - 更新数据
 * @returns {Object} 更新后的模板
 */
async function updateTemplate(id, data) {
    // 获取当前模板
    const existing = await prisma.template.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('模板不存在', 404, 'TEMPLATE_NOT_FOUND');
    }

    // 如果模板内容有变化，增加版本号
    let newVersion = existing.version;
    if (data.content && JSON.stringify(data.content) !== JSON.stringify(existing.content)) {
        newVersion = existing.version + 1;
    }

    const template = await prisma.template.update({
        where: { id },
        data: {
            ...data,
            version: newVersion,
        },
    });

    return template;
}

/**
 * 停用模板
 * @param {number} id - 模板 ID
 * @returns {Object} 更新后的模板
 */
async function deactivateTemplate(id) {
    const existing = await prisma.template.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('模板不存在', 404, 'TEMPLATE_NOT_FOUND');
    }

    return prisma.template.update({
        where: { id },
        data: { isActive: false },
    });
}

/**
 * 启用模板
 * @param {number} id - 模板 ID
 * @returns {Object} 更新后的模板
 */
async function activateTemplate(id) {
    const existing = await prisma.template.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new AppError('模板不存在', 404, 'TEMPLATE_NOT_FOUND');
    }

    return prisma.template.update({
        where: { id },
        data: { isActive: true },
    });
}

/**
 * 获取活跃的模板列表（用于下拉选择）
 * @param {string} type - 模板类型
 * @returns {Array} 模板列表
 */
async function getActiveTemplates(type) {
    const where = { isActive: true };

    if (type) {
        where.type = type;
    }

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
