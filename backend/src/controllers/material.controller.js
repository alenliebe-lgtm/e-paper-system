/**
 * 物料管理控制器
 */

const materialService = require('../services/material.service');

// 获取物料列表
const getMaterials = async (req, res, next) => {
    try {
        const result = await materialService.getMaterials(req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// 获取物料详情
const getMaterialById = async (req, res, next) => {
    try {
        const material = await materialService.getMaterialById(req.params.id);
        res.json({ success: true, data: material });
    } catch (error) {
        next(error);
    }
};

// 新建物料
const createMaterial = async (req, res, next) => {
    try {
        const material = await materialService.createMaterial(req.body);
        res.status(201).json({ success: true, data: material });
    } catch (error) {
        next(error);
    }
};

// 更新物料
const updateMaterial = async (req, res, next) => {
    try {
        const material = await materialService.updateMaterial(req.params.id, req.body);
        res.json({ success: true, data: material });
    } catch (error) {
        next(error);
    }
};

// 删除物料
const deleteMaterial = async (req, res, next) => {
    try {
        const result = await materialService.deleteMaterial(req.params.id);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// 记录出入库
const recordTransaction = async (req, res, next) => {
    try {
        const result = await materialService.recordTransaction(req.body, req.user.id);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// 获取物料分类
const getCategories = async (req, res, next) => {
    try {
        const categories = await materialService.getCategories();
        res.json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// 获取库存统计
const getStockStats = async (req, res, next) => {
    try {
        const stats = await materialService.getStockStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

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
