/**
 * Service 层通用辅助函数
 * 消除「检查存在性 → 抛异常」等重复模式
 */
const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

/**
 * 按 ID 查找记录，不存在则抛出 404 异常
 * @param {string} modelName - Prisma 模型名称（如 'user'、'project'）
 * @param {number} id - 记录 ID
 * @param {Object} options - 可选配置
 * @param {string} options.errorMsg - 错误提示信息
 * @param {string} options.errorCode - 错误代码
 * @param {Object} options.include - 关联查询
 * @returns {Object} 查找到的记录
 * @throws {AppError} 404 错误
 */
async function findOrFail(modelName, id, options = {}) {
    const {
        errorMsg = '记录不存在',
        errorCode = 'NOT_FOUND',
        include,
    } = options;

    const queryArgs = { where: { id } };
    if (include) queryArgs.include = include;

    const record = await prisma[modelName].findUnique(queryArgs);

    if (!record) {
        throw new AppError(errorMsg, 404, errorCode);
    }

    return record;
}

/**
 * 解析日期字段
 * 将字符串日期字段转换为 Date 对象
 * @param {Object} data - 原始数据对象
 * @param {string[]} fields - 需要转换的日期字段名称数组
 * @returns {Object} 处理后的数据对象（浅拷贝）
 */
function parseDateFields(data, fields = []) {
    const result = { ...data };
    for (const field of fields) {
        if (result[field]) {
            result[field] = new Date(result[field]);
        }
    }
    return result;
}

/**
 * 解析整数 ID
 * @param {string|number} id - 原始 ID
 * @returns {number} 解析后的整数
 */
function parseId(id) {
    return parseInt(id, 10);
}

module.exports = {
    findOrFail,
    parseDateFields,
    parseId,
};
