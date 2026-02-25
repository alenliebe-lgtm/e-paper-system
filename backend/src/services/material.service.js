/**
 * 物料/设备追踪服务
 * 仓库库存管理、出入库记录
 */

const prisma = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');
const { paginate } = require('../utils/pagination.helper');
const { findOrFail } = require('../utils/service.helper');
const logger = require('../utils/logger');

/**
 * 获取物料列表（分页查询）
 */
async function getMaterials(query) {
    const { page = 1, pageSize = 10, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where = {};
    if (category) where.category = category;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
        ];
    }

    return paginate('material', {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        where,
        orderBy: { [sortBy]: sortOrder },
    });
}

/**
 * 获取物料详情（含最近出入库记录）
 */
async function getMaterialById(id) {
    const materialId = parseInt(id, 10);
    const material = await prisma.material.findUnique({
        where: { id: materialId },
        include: {
            records: {
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: {
                    operator: {
                        select: {
                            id: true,
                            username: true,
                            profile: { select: { fullName: true } },
                        },
                    },
                    project: {
                        select: { id: true, projectName: true, code: true },
                    },
                },
            },
        },
    });

    if (!material) {
        throw new AppError('物料不存在', 404, 'MATERIAL_NOT_FOUND');
    }

    return material;
}

/**
 * 新建物料
 */
async function createMaterial(data) {
    // 检查物料编码唯一性
    const existing = await prisma.material.findUnique({
        where: { code: data.code },
    });
    if (existing) {
        throw new AppError('物料编码已存在', 400, 'MATERIAL_CODE_EXISTS');
    }

    const material = await prisma.material.create({ data });
    logger.info('MaterialService', `创建物料: ${material.name} (${material.code})`);
    return material;
}

/**
 * 更新物料信息
 */
async function updateMaterial(id, data) {
    const materialId = parseInt(id, 10);
    await findOrFail('material', materialId, {
        errorMsg: '物料不存在',
        errorCode: 'MATERIAL_NOT_FOUND',
    });

    // 如果修改了编码，检查唯一性
    if (data.code) {
        const conflict = await prisma.material.findFirst({
            where: { code: data.code, NOT: { id: materialId } },
        });
        if (conflict) {
            throw new AppError('物料编码已存在', 400, 'MATERIAL_CODE_EXISTS');
        }
    }

    const material = await prisma.material.update({
        where: { id: materialId },
        data,
    });

    logger.info('MaterialService', `更新物料: ${material.name}`);
    return material;
}

/**
 * 删除物料
 */
async function deleteMaterial(id) {
    const materialId = parseInt(id, 10);
    await findOrFail('material', materialId, {
        errorMsg: '物料不存在',
        errorCode: 'MATERIAL_NOT_FOUND',
    });

    // 检查是否有出入库记录
    const recordCount = await prisma.materialRecord.count({
        where: { materialId },
    });

    if (recordCount > 0) {
        throw new AppError(
            `该物料关联了 ${recordCount} 条出入库记录，无法删除`,
            400,
            'MATERIAL_HAS_RECORDS'
        );
    }

    await prisma.material.delete({ where: { id: materialId } });
    logger.info('MaterialService', `删除物料 ID: ${materialId}`);
    return { message: '物料已删除' };
}

/**
 * 记录出入库操作（自动更新库存）
 * @param {Object} data - { materialId, type, quantity, projectId?, remark? }
 * @param {number} operatorId - 操作人 ID
 */
async function recordTransaction(data, operatorId) {
    const { materialId, type, quantity, projectId, remark } = data;

    if (quantity <= 0) {
        throw new AppError('数量必须大于 0', 400, 'INVALID_QUANTITY');
    }

    const material = await findOrFail('material', materialId, {
        errorMsg: '物料不存在',
        errorCode: 'MATERIAL_NOT_FOUND',
    });

    // 出库/领用时检查库存是否充足
    if (type === 'OUT' && material.stock < quantity) {
        throw new AppError(
            `库存不足，当前库存 ${material.stock}，请求数量 ${quantity}`,
            400,
            'INSUFFICIENT_STOCK'
        );
    }

    // 使用事务确保库存和记录的一致性
    const result = await prisma.$transaction(async (tx) => {
        // 计算库存变化
        let stockChange;
        switch (type) {
            case 'IN':
                stockChange = quantity;
                break;
            case 'OUT':
                stockChange = -quantity;
                break;
            case 'RETURN':
                stockChange = quantity;
                break;
            default:
                throw new AppError('无效的操作类型', 400, 'INVALID_ACTION_TYPE');
        }

        // 更新库存
        const updatedMaterial = await tx.material.update({
            where: { id: materialId },
            data: { stock: { increment: stockChange } },
        });

        // 创建出入库记录
        const record = await tx.materialRecord.create({
            data: {
                type,
                quantity,
                remark,
                materialId,
                projectId: projectId || null,
                operatorId,
            },
            include: {
                material: { select: { name: true, code: true } },
                operator: {
                    select: {
                        username: true,
                        profile: { select: { fullName: true } },
                    },
                },
                project: { select: { projectName: true } },
            },
        });

        return { record, currentStock: updatedMaterial.stock };
    });

    const actionLabel = { IN: '入库', OUT: '出库', RETURN: '归还' };
    logger.info('MaterialService', `物料${actionLabel[type]}: ${material.name} × ${quantity}，当前库存: ${result.currentStock}`);
    return result;
}

/**
 * 获取物料分类列表
 */
async function getCategories() {
    const categories = await prisma.material.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
    });
    return categories.map(c => c.category);
}

/**
 * 获取库存统计概览
 */
async function getStockStats() {
    const [total, lowStock, categories] = await Promise.all([
        prisma.material.count(),
        prisma.material.count({
            where: {
                stock: { lte: prisma.material.fields?.minStock },
            },
        }).catch(() => {
            // 回退查询：使用原生 SQL 处理字段对比
            return prisma.$queryRaw`
                SELECT COUNT(*)::int as count FROM materials WHERE stock <= min_stock AND min_stock > 0
            `.then(r => r[0]?.count || 0);
        }),
        prisma.material.groupBy({
            by: ['category'],
            _count: { id: true },
            _sum: { stock: true },
        }),
    ]);

    return {
        total,
        lowStock,
        categories: categories.map(c => ({
            category: c.category,
            count: c._count.id,
            totalStock: c._sum.stock || 0,
        })),
    };
}

module.exports = {
    getMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    recordTransaction,
    getCategories,
    getStockStats,
};
