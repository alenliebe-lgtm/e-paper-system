/**
 * 物料管理路由
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const materialController = require('../controllers/material.controller');

// 所有物料接口需要认证
router.use(authenticate);

// 获取物料分类（放在 /:id 前面避免路由冲突）
router.get('/categories', materialController.getCategories);

// 获取库存统计
router.get('/stats', authorize('material:read'), materialController.getStockStats);

// 获取物料列表
router.get('/', authorize('material:read'), materialController.getMaterials);

// 获取物料详情
router.get('/:id', authorize('material:read'), materialController.getMaterialById);

// 新建物料
router.post('/', authorize('material:write'), materialController.createMaterial);

// 更新物料
router.put('/:id', authorize('material:write'), materialController.updateMaterial);

// 删除物料
router.delete('/:id', authorize('material:delete'), materialController.deleteMaterial);

// 出入库记录
router.post('/transaction', authorize('material:write'), materialController.recordTransaction);

module.exports = router;
