/**
 * 通用分页查询辅助函数
 * 消除 Service 层中重复的分页查询模式
 */
const prisma = require('../config/database');

/**
 * 通用分页查询
 * @param {string} modelName - Prisma 模型名称（如 'employeeProfile'）
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码（默认 1）
 * @param {number} options.pageSize - 每页条数（默认 10）
 * @param {Object} options.where - 查询条件
 * @param {Object} options.orderBy - 排序条件
 * @param {Object} options.include - 关联查询
 * @param {Object} options.select - 字段选择
 * @returns {Object} { data, pagination: { page, pageSize, total, totalPages } }
 */
async function paginate(modelName, options = {}) {
    const {
        page = 1,
        pageSize = 10,
        where = {},
        orderBy = { createdAt: 'desc' },
        include,
        select,
    } = options;

    const skip = (page - 1) * pageSize;

    // 构建查询参数
    const queryArgs = {
        where,
        orderBy,
        skip,
        take: pageSize,
    };

    // 可选参数
    if (include) queryArgs.include = include;
    if (select) queryArgs.select = select;

    // 并行执行查询和计数
    const [data, total] = await Promise.all([
        prisma[modelName].findMany(queryArgs),
        prisma[modelName].count({ where }),
    ]);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

module.exports = {
    paginate,
};
