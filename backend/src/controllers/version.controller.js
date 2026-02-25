/**
 * 版本管理控制器
 */

const versionService = require('../services/version.service');

// 获取版本历史
const getVersions = async (req, res, next) => {
    try {
        const { entityType, entityId } = req.params;
        const versions = await versionService.getVersions(entityType, parseInt(entityId, 10));
        res.json({ success: true, data: versions });
    } catch (error) {
        next(error);
    }
};

// 获取版本详情
const getVersionById = async (req, res, next) => {
    try {
        const version = await versionService.getVersionById(req.params.id);
        res.json({ success: true, data: version });
    } catch (error) {
        next(error);
    }
};

// 对比两个版本
const compareVersions = async (req, res, next) => {
    try {
        const { id1, id2 } = req.params;
        const result = await versionService.compareVersions(parseInt(id1, 10), parseInt(id2, 10));
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVersions,
    getVersionById,
    compareVersions,
};
